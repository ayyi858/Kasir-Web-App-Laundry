'use client';

import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { serviceAPI } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { FiPlus, FiEdit2, FiTrash2 } from 'react-icons/fi';

export default function ServicesPage() {
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingService, setEditingService] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    service_type: 'kiloan',
    price_per_unit: '',
    unit: 'kg',
    description: '',
    is_active: true,
  });

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      const response = await serviceAPI.list();
      setServices(response.data.results || response.data);
    } catch (error) {
      console.error('Error fetching services:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = {
        ...formData,
        price_per_unit: parseFloat(formData.price_per_unit),
      };
      if (editingService) {
        await serviceAPI.update(editingService.id, data);
      } else {
        await serviceAPI.create(data);
      }
      setShowModal(false);
      setEditingService(null);
      setFormData({
        name: '',
        service_type: 'kiloan',
        price_per_unit: '',
        unit: 'kg',
        description: '',
        is_active: true,
      });
      fetchServices();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Terjadi kesalahan');
    }
  };

  const handleEdit = (service: any) => {
    setEditingService(service);
    setFormData({
      name: service.name,
      service_type: service.service_type,
      price_per_unit: service.price_per_unit.toString(),
      unit: service.unit,
      description: service.description || '',
      is_active: service.is_active,
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Yakin ingin menghapus layanan ini?')) return;
    try {
      await serviceAPI.delete(id);
      fetchServices();
    } catch (error) {
      alert('Gagal menghapus layanan');
    }
  };

  const serviceTypeLabels: any = {
    kiloan: 'Per Kilo',
    satuan: 'Per Item',
    express: 'Express',
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-light text-gray-900">Services</h1>
            <p className="text-sm text-gray-500 mt-1">Manage services and pricing</p>
          </div>
          <button
            onClick={() => {
              setEditingService(null);
              setFormData({
                name: '',
                service_type: 'kiloan',
                price_per_unit: '',
                unit: 'kg',
                description: '',
                is_active: true,
              });
              setShowModal(true);
            }}
            className="bg-gray-900 text-white px-4 py-2 rounded text-sm font-medium hover:bg-gray-800 transition"
          >
            Add Service
          </button>
        </div>

        {/* Table */}
        <div className="bg-white border border-gray-200 rounded overflow-hidden">
          <table className="min-w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Service</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Price</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Unit</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-sm text-gray-400">
                    Loading...
                  </td>
                </tr>
              ) : services.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-sm text-gray-400">
                    No services found
                  </td>
                </tr>
              ) : (
                services.map((service) => (
                  <tr key={service.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{service.name}</div>
                      {service.description && (
                        <div className="text-xs text-gray-500 mt-1">{service.description}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{serviceTypeLabels[service.service_type] || service.service_type}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{formatCurrency(service.price_per_unit)}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{service.unit}</td>
                    <td className="px-6 py-4">
                      <span className={`text-xs uppercase tracking-wide ${service.is_active ? 'text-gray-600' : 'text-gray-400'}`}>
                        {service.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(service)}
                          className="text-gray-600 hover:text-gray-900"
                        >
                          <FiEdit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(service.id)}
                          className="text-gray-600 hover:text-gray-900"
                        >
                          <FiTrash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-20 flex items-center justify-center z-50">
            <div className="bg-white rounded border border-gray-200 p-6 w-full max-w-md">
              <h2 className="text-lg font-light text-gray-900 mb-4">
                {editingService ? 'Edit Service' : 'Add Service'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-2 uppercase tracking-wide">
                    Service Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-2 uppercase tracking-wide">
                    Service Type *
                  </label>
                  <select
                    required
                    value={formData.service_type}
                    onChange={(e) => {
                      const type = e.target.value;
                      setFormData({
                        ...formData,
                        service_type: type,
                        unit: type === 'kiloan' ? 'kg' : 'pcs',
                      });
                    }}
                    className="w-full px-4 py-2 border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400 text-sm"
                  >
                    <option value="kiloan">Per Kilo</option>
                    <option value="satuan">Per Item</option>
                    <option value="express">Express</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-2 uppercase tracking-wide">
                    Price per Unit *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="100"
                    value={formData.price_per_unit}
                    onChange={(e) => setFormData({ ...formData, price_per_unit: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-2 uppercase tracking-wide">Unit *</label>
                  <input
                    type="text"
                    required
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-2 uppercase tracking-wide">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400 text-sm"
                    rows={3}
                  />
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="mr-2"
                  />
                  <label htmlFor="is_active" className="text-sm text-gray-700">
                    Active
                  </label>
                </div>
                <div className="flex gap-2 pt-2">
                  <button
                    type="submit"
                    className="flex-1 bg-gray-900 text-white py-2 rounded text-sm font-medium hover:bg-gray-800 transition"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setEditingService(null);
                    }}
                    className="flex-1 bg-gray-100 text-gray-700 py-2 rounded text-sm font-medium hover:bg-gray-200 transition"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
