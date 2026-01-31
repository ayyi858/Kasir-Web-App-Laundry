from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils import timezone
from decimal import Decimal


# Custom User Model dengan multi-role
class User(AbstractUser):
    ROLE_CHOICES = [
        ('admin', 'Admin'),
        ('kasir', 'Kasir'),
        ('owner', 'Owner'),
    ]
    
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='kasir')
    phone = models.CharField(max_length=20, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'User'
        verbose_name_plural = 'Users'
    
    def __str__(self):
        return f"{self.username} ({self.get_role_display()})"


# Model Pelanggan
class Customer(models.Model):
    name = models.CharField(max_length=200, verbose_name='Nama')
    phone = models.CharField(max_length=20, verbose_name='Nomor HP', unique=True)
    address = models.TextField(blank=True, null=True, verbose_name='Alamat')
    email = models.EmailField(blank=True, null=True, verbose_name='Email')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Pelanggan'
        verbose_name_plural = 'Pelanggan'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.name} - {self.phone}"


# Model Layanan/Jenis Service
class Service(models.Model):
    SERVICE_TYPES = [
        ('kiloan', 'Cuci Kiloan'),
        ('satuan', 'Cuci Satuan'),
        ('express', 'Express'),
    ]
    
    name = models.CharField(max_length=100, verbose_name='Nama Layanan')
    service_type = models.CharField(max_length=20, choices=SERVICE_TYPES, verbose_name='Jenis Layanan')
    price_per_unit = models.DecimalField(max_digits=10, decimal_places=2, verbose_name='Harga per Unit')
    unit = models.CharField(max_length=20, default='kg', verbose_name='Satuan')  # kg untuk kiloan, pcs untuk satuan
    description = models.TextField(blank=True, null=True, verbose_name='Deskripsi')
    is_active = models.BooleanField(default=True, verbose_name='Aktif')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Layanan'
        verbose_name_plural = 'Layanan'
        ordering = ['service_type', 'name']
    
    def __str__(self):
        return f"{self.name} - Rp {self.price_per_unit}/{self.unit}"


# Model Transaksi
class Transaction(models.Model):
    STATUS_CHOICES = [
        ('diterima', 'Diterima'),
        ('dicuci', 'Dicuci'),
        ('disetrika', 'Disetrika'),
        ('selesai', 'Selesai'),
        ('diambil', 'Diambil'),
    ]
    
    invoice_number = models.CharField(max_length=50, unique=True, verbose_name='Nomor Invoice')
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name='transactions', verbose_name='Pelanggan')
    cashier = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='transactions', verbose_name='Kasir')
    
    # Informasi transaksi
    total_amount = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'), verbose_name='Total Harga')
    discount = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'), verbose_name='Diskon')
    final_amount = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'), verbose_name='Total Bayar')
    paid_amount = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'), verbose_name='Jumlah Bayar')
    
    # Status dan waktu
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='diterima', verbose_name='Status')
    received_at = models.DateTimeField(auto_now_add=True, verbose_name='Waktu Diterima')
    estimated_completion = models.DateTimeField(blank=True, null=True, verbose_name='Estimasi Selesai')
    completed_at = models.DateTimeField(blank=True, null=True, verbose_name='Waktu Selesai')
    taken_at = models.DateTimeField(blank=True, null=True, verbose_name='Waktu Diambil')
    
    # Catatan
    notes = models.TextField(blank=True, null=True, verbose_name='Catatan')
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Transaksi'
        verbose_name_plural = 'Transaksi'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.invoice_number} - {self.customer.name}"
    
    def save(self, *args, **kwargs):
        # Generate invoice number jika belum ada
        if not self.invoice_number:
            date_str = timezone.now().strftime('%Y%m%d')
            last_transaction = Transaction.objects.filter(
                invoice_number__startswith=f'INV-{date_str}'
            ).order_by('-invoice_number').first()
            
            if last_transaction:
                try:
                    last_num = int(last_transaction.invoice_number.split('-')[-1])
                    new_num = last_num + 1
                except:
                    new_num = 1
            else:
                new_num = 1
            
            self.invoice_number = f'INV-{date_str}-{new_num:04d}'
        
        # Hitung final amount
        self.final_amount = self.total_amount - self.discount
        
        super().save(*args, **kwargs)


# Model Item Transaksi (Detail layanan dalam satu transaksi)
class TransactionItem(models.Model):
    transaction = models.ForeignKey(Transaction, on_delete=models.CASCADE, related_name='items', verbose_name='Transaksi')
    service = models.ForeignKey(Service, on_delete=models.CASCADE, verbose_name='Layanan')
    quantity = models.DecimalField(max_digits=10, decimal_places=2, verbose_name='Jumlah')
    unit_price = models.DecimalField(max_digits=10, decimal_places=2, verbose_name='Harga Satuan')
    subtotal = models.DecimalField(max_digits=10, decimal_places=2, verbose_name='Subtotal')
    notes = models.CharField(max_length=255, blank=True, null=True, verbose_name='Catatan')
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = 'Item Transaksi'
        verbose_name_plural = 'Item Transaksi'
    
    def __str__(self):
        return f"{self.transaction.invoice_number} - {self.service.name}"
    
    def save(self, *args, **kwargs):
        # Hitung subtotal
        self.subtotal = self.quantity * self.unit_price
        super().save(*args, **kwargs)
        
        # Update total transaksi
        self.transaction.total_amount = sum(item.subtotal for item in self.transaction.items.all())
        self.transaction.save()
