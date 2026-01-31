'use client';

import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { transactionAPI, customerAPI, serviceAPI } from '@/lib/api';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { FiPlus, FiDownload, FiEdit } from 'react-icons/fi';
import Link from 'next/link';

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    fetchTransactions();
  }, [statusFilter]);

  const fetchTransactions = async () => {
    try {
      const params: any = {};
      if (statusFilter) params.status = statusFilter;
      const response = await transactionAPI.list(params);
      setTransactions(response.data.results || response.data);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadInvoice = async (id: number) => {
    try {
      const response = await transactionAPI.downloadInvoice(id);
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Struk_${id}.pdf`;
      a.click();
    } catch (error) {
      alert('Gagal mengunduh struk');
    }
  };

  const statusColors: any = {
    diterima: 'bg-yellow-100 text-yellow-800',
    dicuci: 'bg-blue-100 text-blue-800',
    disetrika: 'bg-purple-100 text-purple-800',
    selesai: 'bg-green-100 text-green-800',
    diambil: 'bg-gray-100 text-gray-800',
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Transaksi</h1>
            <p className="text-gray-600 mt-1">Kelola transaksi laundry</p>
          </div>
          <Link
            href="/transactions/new"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
          >
            <FiPlus />
            <span>Transaksi Baru</span>
          </Link>
        </div>

        {/* Filter */}
        <div className="flex space-x-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Semua Status</option>
            <option value="diterima">Diterima</option>
            <option value="dicuci">Dicuci</option>
            <option value="disetrika">Disetrika</option>
            <option value="selesai">Selesai</option>
            <option value="diambil">Diambil</option>
          </select>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Invoice
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Pelanggan
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Tanggal
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                    Memuat data...
                  </td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                    Tidak ada transaksi
                  </td>
                </tr>
              ) : (
                transactions.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {transaction.invoice_number}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{transaction.customer_name}</div>
                      <div className="text-sm text-gray-500">{transaction.customer_phone}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {formatCurrency(transaction.final_amount)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          statusColors[transaction.status] || 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {transaction.status_display}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {formatDateTime(transaction.received_at)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleDownloadInvoice(transaction.id)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Download Struk"
                        >
                          <FiDownload />
                        </button>
                        <Link
                          href={`/transactions/${transaction.id}`}
                          className="text-green-600 hover:text-green-900"
                        >
                          <FiEdit />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
}
