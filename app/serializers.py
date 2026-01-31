from rest_framework import serializers
from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from .models import User, Customer, Service, Transaction, TransactionItem
from rest_framework.authtoken.models import Token


# User Serializers
class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'role', 'phone', 'is_active']
        read_only_fields = ['id']


class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True, required=True, label='Konfirmasi Password')
    
    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'password2', 'first_name', 'last_name', 'role', 'phone']
    
    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({"password": "Password tidak sama"})
        return attrs
    
    def create(self, validated_data):
        validated_data.pop('password2')
        user = User.objects.create_user(**validated_data)
        Token.objects.create(user=user)
        return user


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField(required=True, allow_blank=False)
    password = serializers.CharField(write_only=True, required=True, allow_blank=False)
    
    def validate(self, attrs):
        username = attrs.get('username', '').strip()
        password = attrs.get('password', '').strip()
        
        if not username:
            raise serializers.ValidationError({'username': 'Username harus diisi'})
        if not password:
            raise serializers.ValidationError({'password': 'Password harus diisi'})
        
        user = authenticate(username=username, password=password)
        if not user:
            raise serializers.ValidationError({'non_field_errors': ['Username atau password salah']})
        if not user.is_active:
            raise serializers.ValidationError({'non_field_errors': ['Akun tidak aktif']})
        
        attrs['user'] = user
        return attrs


# Customer Serializers
class CustomerSerializer(serializers.ModelSerializer):
    transaction_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Customer
        fields = ['id', 'name', 'phone', 'address', 'email', 'transaction_count', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_transaction_count(self, obj):
        return obj.transactions.count()


# Service Serializers
class ServiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Service
        fields = ['id', 'name', 'service_type', 'price_per_unit', 'unit', 'description', 'is_active', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


# Transaction Item Serializers
class TransactionItemSerializer(serializers.ModelSerializer):
    service_name = serializers.CharField(source='service.name', read_only=True)
    service_type = serializers.CharField(source='service.service_type', read_only=True)
    
    class Meta:
        model = TransactionItem
        fields = ['id', 'service', 'service_name', 'service_type', 'quantity', 'unit_price', 'subtotal', 'notes']
        read_only_fields = ['id', 'subtotal']


# Transaction Serializers
class TransactionSerializer(serializers.ModelSerializer):
    items = TransactionItemSerializer(many=True, read_only=True)
    customer_name = serializers.CharField(source='customer.name', read_only=True)
    customer_phone = serializers.CharField(source='customer.phone', read_only=True)
    cashier_name = serializers.CharField(source='cashier.username', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = Transaction
        fields = [
            'id', 'invoice_number', 'customer', 'customer_name', 'customer_phone',
            'cashier', 'cashier_name', 'items', 'total_amount', 'discount',
            'final_amount', 'paid_amount', 'status', 'status_display',
            'received_at', 'estimated_completion', 'completed_at', 'taken_at',
            'notes', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'invoice_number', 'total_amount', 'final_amount', 'created_at', 'updated_at']


class TransactionCreateSerializer(serializers.ModelSerializer):
    items = TransactionItemSerializer(many=True)
    
    class Meta:
        model = Transaction
        fields = [
            'customer', 'discount', 'paid_amount', 'status',
            'estimated_completion', 'notes', 'items'
        ]
    
    def create(self, validated_data):
        items_data = validated_data.pop('items')
        transaction = Transaction.objects.create(**validated_data)
        
        for item_data in items_data:
            TransactionItem.objects.create(transaction=transaction, **item_data)
        
        return transaction


# Dashboard Statistics Serializer
class DashboardStatsSerializer(serializers.Serializer):
    total_transactions = serializers.IntegerField()
    total_revenue = serializers.DecimalField(max_digits=12, decimal_places=2)
    today_transactions = serializers.IntegerField()
    today_revenue = serializers.DecimalField(max_digits=12, decimal_places=2)
    monthly_transactions = serializers.IntegerField()
    monthly_revenue = serializers.DecimalField(max_digits=12, decimal_places=2)
    active_orders = serializers.IntegerField()
    pending_orders = serializers.IntegerField()
