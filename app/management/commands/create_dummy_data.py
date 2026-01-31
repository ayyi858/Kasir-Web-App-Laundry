from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta
from decimal import Decimal
import random

from app.models import Customer, Service, Transaction, TransactionItem

User = get_user_model()


class Command(BaseCommand):
    help = 'Membuat data dummy untuk testing'

    def handle(self, *args, **options):
        self.stdout.write('Membuat data dummy...')

        # Create Users
        if not User.objects.filter(username='admin').exists():
            admin = User.objects.create_user(
                username='admin',
                email='admin@laundry.com',
                password='admin123',
                role='admin',
                first_name='Admin',
                last_name='System',
                phone='081234567890'
            )
            self.stdout.write(self.style.SUCCESS('User admin dibuat'))
        else:
            admin = User.objects.get(username='admin')

        if not User.objects.filter(username='kasir1').exists():
            kasir = User.objects.create_user(
                username='kasir1',
                email='kasir@laundry.com',
                password='kasir123',
                role='kasir',
                first_name='Kasir',
                last_name='Satu',
                phone='081234567891'
            )
            self.stdout.write(self.style.SUCCESS('User kasir dibuat'))
        else:
            kasir = User.objects.get(username='kasir1')

        # Create Services
        services_data = [
            {'name': 'Cuci Kiloan Reguler', 'service_type': 'kiloan', 'price_per_unit': 5000, 'unit': 'kg'},
            {'name': 'Cuci Kiloan Express', 'service_type': 'kiloan', 'price_per_unit': 8000, 'unit': 'kg'},
            {'name': 'Setrika Kiloan', 'service_type': 'kiloan', 'price_per_unit': 3000, 'unit': 'kg'},
            {'name': 'Cuci Setrika Kiloan', 'service_type': 'kiloan', 'price_per_unit': 7000, 'unit': 'kg'},
            {'name': 'Kemeja', 'service_type': 'satuan', 'price_per_unit': 8000, 'unit': 'pcs'},
            {'name': 'Celana', 'service_type': 'satuan', 'price_per_unit': 7000, 'unit': 'pcs'},
            {'name': 'Jaket', 'service_type': 'satuan', 'price_per_unit': 15000, 'unit': 'pcs'},
            {'name': 'Bed Cover', 'service_type': 'satuan', 'price_per_unit': 25000, 'unit': 'pcs'},
            {'name': 'Selimut', 'service_type': 'satuan', 'price_per_unit': 20000, 'unit': 'pcs'},
            {'name': 'Express 3 Jam', 'service_type': 'express', 'price_per_unit': 15000, 'unit': 'kg'},
        ]

        services = []
        for service_data in services_data:
            service, created = Service.objects.get_or_create(
                name=service_data['name'],
                defaults=service_data
            )
            if created:
                services.append(service)
                self.stdout.write(self.style.SUCCESS(f'Service {service.name} dibuat'))
            else:
                services.append(service)

        # Create Customers
        customers_data = [
            {'name': 'Budi Santoso', 'phone': '081234567890'},
            {'name': 'Siti Nurhaliza', 'phone': '081234567891'},
            {'name': 'Ahmad Fauzi', 'phone': '081234567892'},
            {'name': 'Dewi Sartika', 'phone': '081234567893'},
            {'name': 'Rudi Hartono', 'phone': '081234567894'},
            {'name': 'Maya Sari', 'phone': '081234567895'},
            {'name': 'Indra Gunawan', 'phone': '081234567896'},
            {'name': 'Ratna Dewi', 'phone': '081234567897'},
        ]

        customers = []
        for customer_data in customers_data:
            customer, created = Customer.objects.get_or_create(
                phone=customer_data['phone'],
                defaults=customer_data
            )
            if created:
                customers.append(customer)
                self.stdout.write(self.style.SUCCESS(f'Customer {customer.name} dibuat'))
            else:
                customers.append(customer)

        # Create Transactions
        statuses = ['diterima', 'dicuci', 'disetrika', 'selesai', 'diambil']
        
        for i in range(30):
            customer = random.choice(customers)
            cashier = random.choice([admin, kasir])
            status = random.choice(statuses)
            
            # Random date dalam 30 hari terakhir
            days_ago = random.randint(0, 30)
            created_at = timezone.now() - timedelta(days=days_ago)
            
            transaction = Transaction.objects.create(
                customer=customer,
                cashier=cashier,
                status=status,
                discount=Decimal(random.randint(0, 10000)),
                paid_amount=Decimal('0'),
                received_at=created_at,
                created_at=created_at,
            )

            # Add items
            num_items = random.randint(1, 4)
            selected_services = random.sample(services, min(num_items, len(services)))
            
            for service in selected_services:
                if service.service_type == 'kiloan':
                    quantity = Decimal(str(random.uniform(1, 10))).quantize(Decimal('0.1'))
                else:
                    quantity = Decimal(random.randint(1, 5))
                
                TransactionItem.objects.create(
                    transaction=transaction,
                    service=service,
                    quantity=quantity,
                    unit_price=service.price_per_unit,
                )

            # Update paid amount
            transaction.paid_amount = transaction.final_amount
            transaction.save()

            if status == 'selesai':
                transaction.completed_at = created_at + timedelta(hours=random.randint(1, 48))
                transaction.save()
            elif status == 'diambil':
                transaction.completed_at = created_at + timedelta(hours=random.randint(1, 48))
                transaction.taken_at = created_at + timedelta(hours=random.randint(24, 72))
                transaction.save()

        self.stdout.write(self.style.SUCCESS('30 transaksi dibuat'))
        self.stdout.write(self.style.SUCCESS('\nData dummy berhasil dibuat!'))
        self.stdout.write(self.style.SUCCESS('\nLogin dengan:'))
        self.stdout.write(self.style.SUCCESS('  Username: admin, Password: admin123'))
        self.stdout.write(self.style.SUCCESS('  Username: kasir1, Password: kasir123'))
