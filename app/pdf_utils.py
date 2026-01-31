from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.pdfgen import canvas
from reportlab.lib import colors
from reportlab.platypus import Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from django.http import HttpResponse
from .models import Transaction
from datetime import datetime


def generate_invoice_pdf(transaction_id):
    """Generate PDF struk untuk transaksi"""
    try:
        transaction = Transaction.objects.select_related('customer', 'cashier').prefetch_related('items__service').get(id=transaction_id)
    except Transaction.DoesNotExist:
        return None
    
    # Create HttpResponse dengan PDF header
    response = HttpResponse(content_type='application/pdf')
    response['Content-Disposition'] = f'attachment; filename="Struk_{transaction.invoice_number}.pdf"'
    
    # Create PDF
    p = canvas.Canvas(response, pagesize=A4)
    width, height = A4
    
    # Styles
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=20,
        textColor=colors.HexColor('#2563eb'),
        alignment=TA_CENTER,
        spaceAfter=30,
    )
    
    header_style = ParagraphStyle(
        'Header',
        parent=styles['Normal'],
        fontSize=12,
        textColor=colors.HexColor('#1e293b'),
        alignment=TA_LEFT,
    )
    
    # Header
    y_position = height - 50
    
    # Judul
    p.setFont("Helvetica-Bold", 20)
    p.setFillColor(colors.HexColor('#2563eb'))
    p.drawCentredString(width / 2, y_position, "LAUNDRY EXPRESS")
    y_position -= 30
    
    p.setFont("Helvetica", 10)
    p.setFillColor(colors.HexColor('#64748b'))
    p.drawCentredString(width / 2, y_position, "Jl. Contoh No. 123, Jakarta")
    y_position -= 15
    p.drawCentredString(width / 2, y_position, "Telp: 021-12345678 | Email: info@laundry.com")
    y_position -= 40
    
    # Garis pemisah
    p.setStrokeColor(colors.HexColor('#e2e8f0'))
    p.line(50, y_position, width - 50, y_position)
    y_position -= 30
    
    # Informasi Invoice
    p.setFont("Helvetica-Bold", 12)
    p.setFillColor(colors.HexColor('#1e293b'))
    p.drawString(50, y_position, f"INVOICE: {transaction.invoice_number}")
    y_position -= 20
    
    p.setFont("Helvetica", 10)
    p.setFillColor(colors.HexColor('#475569'))
    p.drawString(50, y_position, f"Tanggal: {transaction.received_at.strftime('%d/%m/%Y %H:%M')}")
    y_position -= 20
    p.drawString(50, y_position, f"Kasir: {transaction.cashier.username if transaction.cashier else '-'}")
    y_position -= 30
    
    # Informasi Pelanggan
    p.setFont("Helvetica-Bold", 11)
    p.setFillColor(colors.HexColor('#1e293b'))
    p.drawString(50, y_position, "PELANGGAN:")
    y_position -= 20
    
    p.setFont("Helvetica", 10)
    p.setFillColor(colors.HexColor('#475569'))
    p.drawString(50, y_position, f"Nama: {transaction.customer.name}")
    y_position -= 15
    p.drawString(50, y_position, f"Telp: {transaction.customer.phone}")
    y_position -= 30
    
    # Tabel Items
    p.setFont("Helvetica-Bold", 11)
    p.setFillColor(colors.HexColor('#1e293b'))
    p.drawString(50, y_position, "DETAIL LAYANAN:")
    y_position -= 25
    
    # Header tabel
    table_data = [['Layanan', 'Jumlah', 'Harga', 'Subtotal']]
    
    # Data items
    for item in transaction.items.all():
        table_data.append([
            f"{item.service.name}",
            f"{item.quantity} {item.service.unit}",
            f"Rp {item.unit_price:,.0f}",
            f"Rp {item.subtotal:,.0f}"
        ])
    
    # Buat tabel
    table = Table(table_data, colWidths=[150*mm, 50*mm, 60*mm, 60*mm])
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#f1f5f9')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.HexColor('#1e293b')),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('ALIGN', (1, 0), (-1, -1), 'CENTER'),
        ('ALIGN', (2, 0), (-1, -1), 'RIGHT'),
        ('ALIGN', (3, 0), (-1, -1), 'RIGHT'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 10),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('TOPPADDING', (0, 0), (-1, 0), 12),
        ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 1), (-1, -1), 9),
        ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#e2e8f0')),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f8fafc')]),
    ]))
    
    # Render tabel
    table_width, table_height = table.wrap(width - 100, height)
    table.drawOn(p, 50, y_position - table_height)
    y_position -= table_height + 30
    
    # Total
    p.setFont("Helvetica", 10)
    p.setFillColor(colors.HexColor('#475569'))
    p.drawRightString(width - 50, y_position, f"Subtotal: Rp {transaction.total_amount:,.0f}")
    y_position -= 20
    
    if transaction.discount > 0:
        p.drawRightString(width - 50, y_position, f"Diskon: Rp {transaction.discount:,.0f}")
        y_position -= 20
    
    p.setFont("Helvetica-Bold", 12)
    p.setFillColor(colors.HexColor('#1e293b'))
    p.drawRightString(width - 50, y_position, f"TOTAL: Rp {transaction.final_amount:,.0f}")
    y_position -= 20
    
    p.setFont("Helvetica", 10)
    p.setFillColor(colors.HexColor('#475569'))
    p.drawRightString(width - 50, y_position, f"Bayar: Rp {transaction.paid_amount:,.0f}")
    y_position -= 20
    
    kembalian = transaction.paid_amount - transaction.final_amount
    if kembalian > 0:
        p.drawRightString(width - 50, y_position, f"Kembalian: Rp {kembalian:,.0f}")
        y_position -= 30
    
    # Status
    y_position -= 20
    p.setFont("Helvetica-Bold", 10)
    p.setFillColor(colors.HexColor('#1e293b'))
    p.drawString(50, y_position, f"Status: {transaction.get_status_display()}")
    
    if transaction.estimated_completion:
        y_position -= 20
        p.setFont("Helvetica", 9)
        p.setFillColor(colors.HexColor('#64748b'))
        p.drawString(50, y_position, f"Estimasi Selesai: {transaction.estimated_completion.strftime('%d/%m/%Y %H:%M')}")
    
    # Catatan
    if transaction.notes:
        y_position -= 30
        p.setFont("Helvetica", 9)
        p.setFillColor(colors.HexColor('#64748b'))
        p.drawString(50, y_position, f"Catatan: {transaction.notes}")
    
    # Footer
    y_position = 80
    p.setStrokeColor(colors.HexColor('#e2e8f0'))
    p.line(50, y_position, width - 50, y_position)
    y_position -= 20
    
    p.setFont("Helvetica", 8)
    p.setFillColor(colors.HexColor('#94a3b8'))
    p.drawCentredString(width / 2, y_position, "Terima kasih atas kunjungan Anda!")
    y_position -= 15
    p.drawCentredString(width / 2, y_position, "Struk ini adalah bukti pembayaran yang sah")
    
    # Save PDF
    p.showPage()
    p.save()
    
    return response
