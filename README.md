# POS Laundry - Sistem Point of Sale untuk Usaha Laundry

Sistem POS (Point of Sale) lengkap untuk mengelola usaha laundry kecil hingga menengah. Dibangun dengan Django REST Framework untuk backend dan Next.js untuk frontend.

## 🚀 Fitur Utama

### Authentication & Authorization
- ✅ Login multi-role (Admin, Kasir, Owner)
- ✅ Token-based authentication
- ✅ Role-based access control

### Dashboard
- ✅ Ringkasan statistik (total transaksi, omzet harian/bulanan)
- ✅ Jumlah order aktif
- ✅ Card statistik dengan visualisasi

### Manajemen Pelanggan
- ✅ CRUD pelanggan (Create, Read, Update, Delete)
- ✅ Pencarian pelanggan
- ✅ Riwayat transaksi per pelanggan
- ✅ Informasi lengkap (nama, HP, email, alamat)

### Input Transaksi Laundry
- ✅ Input transaksi dengan multiple items
- ✅ Jenis layanan (Cuci Kiloan, Cuci Satuan, Express)
- ✅ Perhitungan harga otomatis
- ✅ Estimasi waktu selesai
- ✅ Status tracking (Diterima → Dicuci → Disetrika → Selesai → Diambil)
- ✅ Diskon dan pembayaran

### Cetak & Download Struk
- ✅ Generate PDF struk transaksi
- ✅ Download struk dalam format PDF
- ✅ Informasi lengkap transaksi

### Laporan Transaksi
- ✅ Laporan harian, mingguan, bulanan
- ✅ Filter berdasarkan tanggal dan status
- ✅ Total transaksi dan omzet

### Manajemen Harga Layanan
- ✅ CRUD layanan/jenis service
- ✅ Harga per unit (kg/pcs)
- ✅ Aktif/nonaktif layanan

### Pencarian & Filter
- ✅ Pencarian transaksi
- ✅ Filter berdasarkan status
- ✅ Filter berdasarkan tanggal

## 🛠️ Teknologi

### Backend
- Django 6.0.1
- Django REST Framework 3.16.1
- SQLite Database
- ReportLab (untuk PDF)
- Token Authentication

### Frontend
- Next.js 14.2.0
- React 18.3.0
- TypeScript
- Tailwind CSS
- Axios
- React Icons

## 📁 Struktur Project

```
WEB APP POS/
├── app/                    # Django app
│   ├── models.py          # Database models
│   ├── views.py           # API views
│   ├── serializers.py     # DRF serializers
│   ├── urls.py            # URL routing
│   ├── admin.py           # Django admin
│   ├── pdf_utils.py       # PDF generator
│   └── management/        # Management commands
│       └── commands/
│           └── create_dummy_data.py
├── core/                  # Django project settings
│   ├── settings.py
│   └── urls.py
├── frontend/              # Next.js frontend
│   ├── app/              # Next.js app directory
│   │   ├── page.tsx      # Login page
│   │   ├── dashboard/    # Dashboard
│   │   ├── customers/    # Pelanggan
│   │   ├── transactions/ # Transaksi
│   │   ├── services/     # Layanan
│   │   └── reports/      # Laporan
│   ├── components/       # React components
│   ├── lib/             # Utilities & API
│   └── package.json
├── requirements.txt      # Python dependencies
└── README.md
```

## 🗄️ Skema Database

### User (Custom)
- username, email, password
- role (admin, kasir, owner)
- phone, first_name, last_name

### Customer
- name, phone, email, address
- created_at, updated_at

### Service
- name, service_type (kiloan, satuan, express)
- price_per_unit, unit (kg/pcs)
- description, is_active

### Transaction
- invoice_number (auto-generated)
- customer (FK), cashier (FK)
- total_amount, discount, final_amount, paid_amount
- status (diterima, dicuci, disetrika, selesai, diambil)
- received_at, estimated_completion, completed_at, taken_at
- notes

### TransactionItem
- transaction (FK), service (FK)
- quantity, unit_price, subtotal
- notes

## 🚀 Instalasi & Setup

### 1. Backend Setup

```bash
# Install dependencies
pip install -r requirements.txt

# Buat migrations
python manage.py makemigrations

# Jalankan migrations
python manage.py migrate

# Buat superuser (opsional)
python manage.py createsuperuser

# Buat data dummy untuk testing
python manage.py create_dummy_data

# Jalankan server
python manage.py runserver
```

Backend akan berjalan di `http://localhost:8000`

### 2. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Jalankan development server
npm run dev
```

Frontend akan berjalan di `http://localhost:3000`

### 3. Konfigurasi

Pastikan `frontend/.env.local` atau `next.config.js` memiliki:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

## 👤 Default Users

Setelah menjalankan `create_dummy_data`:

- **Admin**: username: `admin`, password: `admin123`
- **Kasir**: username: `kasir1`, password: `kasir123`

## 📝 API Endpoints

### Authentication
- `POST /api/auth/register/` - Register user baru
- `POST /api/auth/login/` - Login
- `POST /api/auth/logout/` - Logout
- `GET /api/auth/me/` - Get current user

### Dashboard
- `GET /api/dashboard/stats/` - Get dashboard statistics

### Customers
- `GET /api/customers/` - List customers
- `POST /api/customers/` - Create customer
- `GET /api/customers/{id}/` - Get customer detail
- `PUT /api/customers/{id}/` - Update customer
- `DELETE /api/customers/{id}/` - Delete customer
- `GET /api/customers/{id}/transactions/` - Get customer transactions

### Services
- `GET /api/services/` - List services
- `POST /api/services/` - Create service
- `GET /api/services/{id}/` - Get service detail
- `PUT /api/services/{id}/` - Update service
- `DELETE /api/services/{id}/` - Delete service

### Transactions
- `GET /api/transactions/` - List transactions
- `POST /api/transactions/` - Create transaction
- `GET /api/transactions/{id}/` - Get transaction detail
- `PUT /api/transactions/{id}/` - Update transaction
- `PATCH /api/transactions/{id}/update_status/` - Update status
- `GET /api/transactions/{id}/download_invoice/` - Download PDF
- `GET /api/transactions/reports/` - Get reports

## 🎨 Desain UI/UX

- **Tema**: Biru profesional (#2563eb)
- **Responsif**: Mobile-friendly dengan sidebar yang bisa di-toggle
- **Modern**: Menggunakan Tailwind CSS dengan design system yang konsisten
- **User-friendly**: Interface yang intuitif dan mudah digunakan

## 📊 Contoh Data Dummy

Script `create_dummy_data.py` akan membuat:
- 2 users (admin, kasir)
- 10 services (berbagai jenis layanan)
- 8 customers
- 30 transactions dengan berbagai status

## 🔒 Security

- Token-based authentication
- Role-based access control
- CORS configuration
- Password validation
- CSRF protection

## 📱 Mobile Support

Frontend fully responsive dengan:
- Mobile sidebar menu
- Touch-friendly buttons
- Optimized table views
- Mobile-first design

## 🚧 Fitur Opsional (Bisa Ditambahkan)

- [ ] Notifikasi WhatsApp untuk update status
- [ ] Export laporan ke Excel
- [ ] Grafik dan chart untuk analisis
- [ ] Multi-branch support
- [ ] Inventory management
- [ ] Laporan keuangan lengkap

## 📄 License

Project ini dibuat untuk keperluan edukasi dan komersial.

## 👨‍💻 Development

Untuk development:
1. Backend: `python manage.py runserver`
2. Frontend: `npm run dev` (di folder frontend)

## 📞 Support

Untuk pertanyaan atau issue, silakan buat issue di repository ini.

---


