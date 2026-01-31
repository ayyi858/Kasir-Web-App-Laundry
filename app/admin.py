from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, Customer, Service, Transaction, TransactionItem


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ['username', 'email', 'first_name', 'last_name', 'role', 'is_active', 'date_joined']
    list_filter = ['role', 'is_active', 'is_staff']
    fieldsets = BaseUserAdmin.fieldsets + (
        ('Informasi Tambahan', {'fields': ('role', 'phone')}),
    )
    add_fieldsets = BaseUserAdmin.add_fieldsets + (
        ('Informasi Tambahan', {'fields': ('role', 'phone')}),
    )


@admin.register(Customer)
class CustomerAdmin(admin.ModelAdmin):
    list_display = ['name', 'phone', 'email', 'transaction_count', 'created_at']
    list_filter = ['created_at']
    search_fields = ['name', 'phone', 'email']
    readonly_fields = ['created_at', 'updated_at']
    
    def transaction_count(self, obj):
        return obj.transactions.count()
    transaction_count.short_description = 'Jumlah Transaksi'


class TransactionItemInline(admin.TabularInline):
    model = TransactionItem
    extra = 1
    fields = ['service', 'quantity', 'unit_price', 'subtotal', 'notes']
    readonly_fields = ['subtotal']


@admin.register(Transaction)
class TransactionAdmin(admin.ModelAdmin):
    list_display = ['invoice_number', 'customer', 'cashier', 'total_amount', 'final_amount', 'status', 'received_at']
    list_filter = ['status', 'received_at', 'cashier']
    search_fields = ['invoice_number', 'customer__name', 'customer__phone']
    readonly_fields = ['invoice_number', 'total_amount', 'final_amount', 'created_at', 'updated_at']
    inlines = [TransactionItemInline]
    fieldsets = (
        ('Informasi Transaksi', {
            'fields': ('invoice_number', 'customer', 'cashier', 'status')
        }),
        ('Pembayaran', {
            'fields': ('total_amount', 'discount', 'final_amount', 'paid_amount')
        }),
        ('Waktu', {
            'fields': ('received_at', 'estimated_completion', 'completed_at', 'taken_at')
        }),
        ('Catatan', {
            'fields': ('notes',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(Service)
class ServiceAdmin(admin.ModelAdmin):
    list_display = ['name', 'service_type', 'price_per_unit', 'unit', 'is_active', 'created_at']
    list_filter = ['service_type', 'is_active', 'created_at']
    search_fields = ['name']
    readonly_fields = ['created_at', 'updated_at']
