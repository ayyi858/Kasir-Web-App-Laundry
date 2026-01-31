from rest_framework import viewsets, status, filters
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.authtoken.models import Token
from django.contrib.auth import authenticate
from django.db.models import Sum, Count, Q
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt
from datetime import datetime, timedelta
from decimal import Decimal

from .models import User, Customer, Service, Transaction, TransactionItem
from .serializers import (
    UserSerializer, UserRegistrationSerializer, LoginSerializer,
    CustomerSerializer, ServiceSerializer, TransactionSerializer,
    TransactionCreateSerializer, DashboardStatsSerializer
)
from .pdf_utils import generate_invoice_pdf


# Authentication Views
@csrf_exempt
@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    serializer = UserRegistrationSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        token, created = Token.objects.get_or_create(user=user)
        return Response({
            'token': token.key,
            'user': UserSerializer(user).data
        }, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@csrf_exempt
@api_view(['POST'])
@permission_classes([AllowAny])
def login(request):
    try:
        # Debug logging
        print(f"Login request - Content-Type: {request.content_type}")
        print(f"Login request - Data: {request.data}")
        print(f"Login request - Method: {request.method}")
        
        serializer = LoginSerializer(data=request.data)
        
        if serializer.is_valid():
            user = serializer.validated_data['user']
            token, created = Token.objects.get_or_create(user=user)
            return Response({
                'token': token.key,
                'user': UserSerializer(user).data
            })
        
        # Format error response
        print(f"Serializer errors: {serializer.errors}")
        error_details = {}
        error_messages = []
        
        for field, errors in serializer.errors.items():
            if isinstance(errors, list):
                error_details[field] = errors
                error_messages.extend([f"{field}: {err}" for err in errors])
            else:
                error_details[field] = str(errors)
                error_messages.append(f"{field}: {errors}")
        
        # Prioritaskan non_field_errors jika ada
        if 'non_field_errors' in serializer.errors:
            error_msg = serializer.errors['non_field_errors'][0] if isinstance(serializer.errors['non_field_errors'], list) else str(serializer.errors['non_field_errors'])
            return Response({
                'error': 'Login gagal',
                'non_field_errors': [error_msg],
                'message': error_msg
            }, status=status.HTTP_400_BAD_REQUEST)
        
        return Response({
            'error': 'Login gagal',
            'details': error_details,
            'message': error_messages[0] if error_messages else 'Terjadi kesalahan saat login'
        }, status=status.HTTP_400_BAD_REQUEST)
        
    except Exception as e:
        print(f"Login exception: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response({
            'error': 'Terjadi kesalahan server',
            'message': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout(request):
    try:
        request.user.auth_token.delete()
    except:
        pass
    return Response({'message': 'Logout berhasil'}, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def current_user(request):
    serializer = UserSerializer(request.user)
    return Response(serializer.data)


# Customer ViewSet
class CustomerViewSet(viewsets.ModelViewSet):
    queryset = Customer.objects.all()
    serializer_class = CustomerSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'phone', 'email']
    ordering_fields = ['created_at', 'name']
    ordering = ['-created_at']
    
    @action(detail=True, methods=['get'])
    def transactions(self, request, pk=None):
        customer = self.get_object()
        transactions = customer.transactions.all().order_by('-created_at')
        serializer = TransactionSerializer(transactions, many=True)
        return Response(serializer.data)


# Service ViewSet
class ServiceViewSet(viewsets.ModelViewSet):
    queryset = Service.objects.all()
    serializer_class = ServiceSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'service_type']
    ordering_fields = ['name', 'price_per_unit', 'created_at']
    ordering = ['service_type', 'name']
    
    def get_queryset(self):
        queryset = Service.objects.all()
        is_active = self.request.query_params.get('is_active', None)
        service_type = self.request.query_params.get('service_type', None)
        
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() == 'true')
        if service_type:
            queryset = queryset.filter(service_type=service_type)
        
        return queryset


# Transaction ViewSet
class TransactionViewSet(viewsets.ModelViewSet):
    queryset = Transaction.objects.all()
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['invoice_number', 'customer__name', 'customer__phone']
    ordering_fields = ['created_at', 'total_amount', 'status']
    ordering = ['-created_at']
    
    def get_serializer_class(self):
        if self.action == 'create':
            return TransactionCreateSerializer
        return TransactionSerializer
    
    def get_queryset(self):
        queryset = Transaction.objects.all()
        
        # Filter berdasarkan role
        if self.request.user.role == 'kasir':
            queryset = queryset.filter(cashier=self.request.user)
        
        # Filter berdasarkan status
        status_filter = self.request.query_params.get('status', None)
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        # Filter berdasarkan tanggal
        date_from = self.request.query_params.get('date_from', None)
        date_to = self.request.query_params.get('date_to', None)
        if date_from:
            queryset = queryset.filter(created_at__gte=date_from)
        if date_to:
            queryset = queryset.filter(created_at__lte=date_to)
        
        # Filter berdasarkan customer
        customer_id = self.request.query_params.get('customer', None)
        if customer_id:
            queryset = queryset.filter(customer_id=customer_id)
        
        return queryset
    
    def perform_create(self, serializer):
        serializer.save(cashier=self.request.user)
    
    @action(detail=True, methods=['patch'])
    def update_status(self, request, pk=None):
        transaction = self.get_object()
        new_status = request.data.get('status')
        
        if new_status not in dict(Transaction.STATUS_CHOICES):
            return Response({'error': 'Status tidak valid'}, status=status.HTTP_400_BAD_REQUEST)
        
        transaction.status = new_status
        
        # Update waktu sesuai status
        now = timezone.now()
        if new_status == 'selesai' and not transaction.completed_at:
            transaction.completed_at = now
        elif new_status == 'diambil' and not transaction.taken_at:
            transaction.taken_at = now
        
        transaction.save()
        serializer = TransactionSerializer(transaction)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def download_invoice(self, request, pk=None):
        """Download PDF struk transaksi"""
        transaction = self.get_object()
        pdf_response = generate_invoice_pdf(transaction.id)
        if pdf_response:
            return pdf_response
        return Response({'error': 'Gagal membuat PDF'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['get'])
    def reports(self, request):
        """Laporan transaksi harian, mingguan, bulanan"""
        period = request.query_params.get('period', 'daily')  # daily, weekly, monthly
        date_from = request.query_params.get('date_from', None)
        date_to = request.query_params.get('date_to', None)
        
        queryset = self.get_queryset()
        
        if date_from and date_to:
            queryset = queryset.filter(created_at__range=[date_from, date_to])
        else:
            now = timezone.now()
            if period == 'daily':
                queryset = queryset.filter(created_at__date=now.date())
            elif period == 'weekly':
                week_start = now - timedelta(days=now.weekday())
                queryset = queryset.filter(created_at__gte=week_start)
            elif period == 'monthly':
                queryset = queryset.filter(created_at__year=now.year, created_at__month=now.month)
        
        total_transactions = queryset.count()
        total_revenue = queryset.aggregate(Sum('final_amount'))['final_amount__sum'] or Decimal('0.00')
        total_paid = queryset.aggregate(Sum('paid_amount'))['paid_amount__sum'] or Decimal('0.00')
        
        transactions = queryset[:100]  # Limit untuk response
        serializer = TransactionSerializer(transactions, many=True)
        
        return Response({
            'period': period,
            'total_transactions': total_transactions,
            'total_revenue': total_revenue,
            'total_paid': total_paid,
            'transactions': serializer.data
        })


# Dashboard View
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard_stats(request):
    """Statistik dashboard"""
    now = timezone.now()
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    
    # Base queryset
    base_queryset = Transaction.objects.all()
    
    # Filter berdasarkan role
    if request.user.role == 'kasir':
        base_queryset = base_queryset.filter(cashier=request.user)
    
    # Total semua waktu
    total_transactions = base_queryset.count()
    total_revenue = base_queryset.aggregate(Sum('final_amount'))['final_amount__sum'] or Decimal('0.00')
    
    # Hari ini
    today_transactions = base_queryset.filter(created_at__gte=today_start).count()
    today_revenue = base_queryset.filter(created_at__gte=today_start).aggregate(
        Sum('final_amount')
    )['final_amount__sum'] or Decimal('0.00')
    
    # Bulan ini
    monthly_transactions = base_queryset.filter(created_at__gte=month_start).count()
    monthly_revenue = base_queryset.filter(created_at__gte=month_start).aggregate(
        Sum('final_amount')
    )['final_amount__sum'] or Decimal('0.00')
    
    # Order aktif (belum diambil)
    active_orders = base_queryset.exclude(status='diambil').count()
    pending_orders = base_queryset.filter(status__in=['diterima', 'dicuci', 'disetrika']).count()
    
    data = {
        'total_transactions': total_transactions,
        'total_revenue': total_revenue,
        'today_transactions': today_transactions,
        'today_revenue': today_revenue,
        'monthly_transactions': monthly_transactions,
        'monthly_revenue': monthly_revenue,
        'active_orders': active_orders,
        'pending_orders': pending_orders,
    }
    
    serializer = DashboardStatsSerializer(data)
    return Response(serializer.data)
