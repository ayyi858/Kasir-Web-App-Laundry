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
          <h1 className="text-2xl font-light text-gray-900">New Transaction</h1>
          <p className="text-sm text-gray-500 mt-1">Create new transaction</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Form Section */}
            <div className="lg:col-span-2 space-y-6">
              {/* Customer Selection */}
              <div className="bg-white border border-gray-200 rounded p-6">
                <h2 className="text-sm font-medium text-gray-900 mb-4 uppercase tracking-wide">Customer Information</h2>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-2 uppercase tracking-wide">
                    Select Customer *
                  </label>
                  <select
                    required
                    value={formData.customer}
                    onChange={(e) => setFormData({ ...formData, customer: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400 text-sm"
                  >
                    <option value="">-- Select Customer --</option>
                    {customers.map((customer) => (
                      <option key={customer.id} value={customer.id}>
                        {customer.name} - {customer.phone}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Items Section */}
              <div className="bg-white border border-gray-200 rounded p-6">
                <h2 className="text-sm font-medium text-gray-900 mb-4 uppercase tracking-wide">Services</h2>
                <div className="flex gap-2 mb-4">
                  <select
                    value={selectedService?.id || ''}
                    onChange={(e) => {
                      const service = services.find((s) => s.id === parseInt(e.target.value));
                      setSelectedService(service || null);
                    }}
                    className="flex-1 px-4 py-2 border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400 text-sm"
                  >
                    <option value="">-- Select Service --</option>
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
                    placeholder="Qty"
                    className="w-24 px-4 py-2 border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400 text-sm"
                  />
                  <button
                    type="button"
                    onClick={addItem}
                    className="bg-gray-900 text-white px-4 py-2 rounded text-sm font-medium hover:bg-gray-800 transition"
                  >
                    Add
                  </button>
                </div>

                {/* Items List */}
                {items.length > 0 && (
                  <div className="border border-gray-200 rounded overflow-hidden">
                    <table className="min-w-full">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Service</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Qty</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Price</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Subtotal</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wide"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {items.map((item, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-4 py-2 text-sm text-gray-900">{item.service_name}</td>
                            <td className="px-4 py-2 text-sm text-gray-600">{item.quantity}</td>
                            <td className="px-4 py-2 text-sm text-gray-600">{formatCurrency(item.unit_price)}</td>
                            <td className="px-4 py-2 text-sm text-gray-900 font-medium">
                              {formatCurrency(item.subtotal)}
                            </td>
                            <td className="px-4 py-2">
                              <button
                                type="button"
                                onClick={() => removeItem(index)}
                                className="text-gray-600 hover:text-gray-900"
                              >
                                <FiTrash2 size={16} />
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
              <div className="bg-white border border-gray-200 rounded p-6">
                <h2 className="text-sm font-medium text-gray-900 mb-4 uppercase tracking-wide">Notes</h2>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400 text-sm"
                  rows={3}
                  placeholder="Additional notes..."
                />
              </div>
            </div>

            {/* Summary Section */}
            <div className="space-y-6">
              <div className="bg-white border border-gray-200 rounded p-6 sticky top-4">
                <h2 className="text-sm font-medium text-gray-900 mb-4 uppercase tracking-wide">Summary</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-2 uppercase tracking-wide">
                      Estimated Completion
                    </label>
                    <input
                      type="datetime-local"
                      value={formData.estimated_completion}
                      onChange={(e) =>
                        setFormData({ ...formData, estimated_completion: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400 text-sm"
                    />
                  </div>

                  <div className="border-t border-gray-200 pt-4 space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Subtotal:</span>
                      <span className="text-gray-900 font-medium">{formatCurrency(totals.subtotal)}</span>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-2 uppercase tracking-wide">
                        Discount
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={formData.discount}
                        onChange={(e) => setFormData({ ...formData, discount: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400 text-sm"
                      />
                    </div>
                    <div className="flex justify-between text-base font-light border-t border-gray-200 pt-3">
                      <span className="text-gray-900">Total:</span>
                      <span className="text-gray-900">{formatCurrency(totals.total)}</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-2 uppercase tracking-wide">
                      Amount Paid *
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={formData.paid_amount}
                      onChange={(e) => setFormData({ ...formData, paid_amount: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400 text-sm"
                    />
                    {parseFloat(formData.paid_amount) >= totals.total && (
                      <div className="mt-2 text-xs text-gray-600">
                        Change: {formatCurrency(parseFloat(formData.paid_amount) - totals.total)}
                      </div>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={loading || items.length === 0}
                    className="w-full bg-gray-900 text-white py-3 rounded text-sm font-medium hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    {loading ? 'Saving...' : 'Save Transaction'}
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
