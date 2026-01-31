'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '@/components/Layout';
import { transactionAPI, customerAPI, serviceAPI } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { FiPlus, FiTrash2, FiSave } from 'react-icons/fi';

export default function NewTransactionPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    customer: '',
    discount: '0',
    paid_amount: '0',
    estimated_completion: '',
    notes: '',
  });
  const [items, setItems] = useState<any[]>([]);
  const [selectedService, setSelectedService] = useState<any>(null);
  const [itemQuantity, setItemQuantity] = useState('1');

  useEffect(() => {
    fetchCustomers();
    fetchServices();
  }, []);

  const fetchCustomers = async () => {
    try {
      const response = await customerAPI.list();
      setCustomers(response.data.results || response.data);
    } catch (error) {
      console.error('Error fetching customers:', error);
    }
  };

  const fetchServices = async () => {
    try {
      const response = await serviceAPI.list({ is_active: true });
      setServices(response.data.results || response.data);
    } catch (error) {
      console.error('Error fetching services:', error);
    }
  };

  const addItem = () => {
    if (!selectedService || !itemQuantity || parseFloat(itemQuantity) <= 0) {
      alert('Pilih layanan dan masukkan jumlah');
      return;
    }

    const newItem = {
      service: selectedService.id,
      service_name: selectedService.name,
      quantity: parseFloat(itemQuantity),
      unit_price: selectedService.price_per_unit,
      subtotal: parseFloat(itemQuantity) * parseFloat(selectedService.price_per_unit),
    };

    setItems([...items, newItem]);
    setSelectedService(null);
    setItemQuantity('1');
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const calculateTotal = () => {
    const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
    const discount = parseFloat(formData.discount) || 0;
    return {
      subtotal,
      discount,
      total: subtotal - discount,
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.customer || items.length === 0) {
      alert('Pilih pelanggan dan tambahkan minimal 1 item');
      return;
    }

    setLoading(true);
    try {
      const transactionData = {
        customer: parseInt(formData.customer),
        discount: parseFloat(formData.discount) || 0,
        paid_amount: parseFloat(formData.paid_amount) || 0,
        status: 'diterima',
        estimated_completion: formData.estimated_completion || null,
        notes: formData.notes,
        items: items.map((item) => ({
          service: item.service,
          quantity: item.quantity,
          unit_price: item.unit_price,
        })),
      };

      await transactionAPI.create(transactionData);
      router.push('/transactions');
    } catch (error: any) {
      alert(error.response?.data?.error || 'Gagal membuat transaksi');
    } finally {
      setLoading(false);
    }
  };

  const totals = calculateTotal();

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Transaksi Baru</h1>
          <p className="text-gray-600 mt-1">Buat transaksi laundry baru</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Form Section */}
            <div className="lg:col-span-2 space-y-6">
              {/* Customer Selection */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-lg font-semibold mb-4">Informasi Pelanggan</h2>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Pilih Pelanggan *
                  </label>
                  <select
                    required
                    value={formData.customer}
                    onChange={(e) => setFormData({ ...formData, customer: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">-- Pilih Pelanggan --</option>
                    {customers.map((customer) => (
                      <option key={customer.id} value={customer.id}>
                        {customer.name} - {customer.phone}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Items Section */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-lg font-semibold mb-4">Layanan</h2>
                <div className="flex space-x-2 mb-4">
                  <select
                    value={selectedService?.id || ''}
                    onChange={(e) => {
                      const service = services.find((s) => s.id === parseInt(e.target.value));
                      setSelectedService(service || null);
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">-- Pilih Layanan --</option>
                    {services.map((service) => (
                      <option key={service.id} value={service.id}>
                        {service.name} - {formatCurrency(service.price_per_unit)}/{service.unit}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    min="0.1"
                    step="0.1"
                    value={itemQuantity}
                    onChange={(e) => setItemQuantity(e.target.value)}
                    placeholder="Jumlah"
                    className="w-32 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={addItem}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
                  >
                    <FiPlus />
                    <span>Tambah</span>
                  </button>
                </div>

                {/* Items List */}
                {items.length > 0 && (
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <table className="min-w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                            Layanan
                          </th>
                          <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                            Jumlah
                          </th>
                          <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                            Harga
                          </th>
                          <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                            Subtotal
                          </th>
                          <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                            Aksi
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {items.map((item, index) => (
                          <tr key={index}>
                            <td className="px-4 py-2">{item.service_name}</td>
                            <td className="px-4 py-2">{item.quantity}</td>
                            <td className="px-4 py-2">{formatCurrency(item.unit_price)}</td>
                            <td className="px-4 py-2 font-medium">
                              {formatCurrency(item.subtotal)}
                            </td>
                            <td className="px-4 py-2">
                              <button
                                type="button"
                                onClick={() => removeItem(index)}
                                className="text-red-600 hover:text-red-800"
                              >
                                <FiTrash2 />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Notes */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-lg font-semibold mb-4">Catatan</h2>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Catatan tambahan..."
                />
              </div>
            </div>

            {/* Summary Section */}
            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow-md p-6 sticky top-4">
                <h2 className="text-lg font-semibold mb-4">Ringkasan</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Estimasi Selesai
                    </label>
                    <input
                      type="datetime-local"
                      value={formData.estimated_completion}
                      onChange={(e) =>
                        setFormData({ ...formData, estimated_completion: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="border-t pt-4 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Subtotal:</span>
                      <span className="font-medium">{formatCurrency(totals.subtotal)}</span>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Diskon:
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={formData.discount}
                        onChange={(e) => setFormData({ ...formData, discount: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div className="flex justify-between text-lg font-bold border-t pt-2">
                      <span>Total:</span>
                      <span className="text-blue-600">{formatCurrency(totals.total)}</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Jumlah Bayar *
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={formData.paid_amount}
                      onChange={(e) => setFormData({ ...formData, paid_amount: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                    {parseFloat(formData.paid_amount) >= totals.total && (
                      <div className="mt-2 text-sm text-green-600">
                        Kembalian:{' '}
                        {formatCurrency(
                          parseFloat(formData.paid_amount) - totals.total
                        )}
                      </div>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={loading || items.length === 0}
                    className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <FiSave />
                    <span>{loading ? 'Menyimpan...' : 'Simpan Transaksi'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </Layout>
  );
}
