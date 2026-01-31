'use client';

import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { transactionAPI } from '@/lib/api';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { FiPlus, FiDownload } from 'react-icons/fi';
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
      a.download = `Invoice_${id}.pdf`;
      a.click();
    } catch (error) {
      alert('Failed to download invoice');
    }
  };

  const statusLabels: any = {
    diterima: 'Received',
    dicuci: 'Washing',
    disetrika: 'Ironing',
    selesai: 'Completed',
    diambil: 'Taken',
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-light text-gray-900">Transactions</h1>
            <p className="text-sm text-gray-500 mt-1">Manage transactions</p>
          </div>
          <Link
            href="/transactions/new"
            className="bg-gray-900 text-white px-4 py-2 rounded text-sm font-medium hover:bg-gray-800 transition"
          >
            New Transaction
          </Link>
        </div>

        {/* Filter */}
        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400 text-sm"
          >
            <option value="">All Status</option>
            <option value="diterima">Received</option>
            <option value="dicuci">Washing</option>
            <option value="disetrika">Ironing</option>
            <option value="selesai">Completed</option>
            <option value="diambil">Taken</option>
          </select>
        </div>

        {/* Table */}
        <div className="bg-white border border-gray-200 rounded overflow-hidden">
          <table className="min-w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Invoice</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Total</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Date</th>
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
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-sm text-gray-400">
                    No transactions found
                  </td>
                </tr>
              ) : (
                transactions.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900 font-medium">{transaction.invoice_number}</td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{transaction.customer_name}</div>
                      <div className="text-xs text-gray-500">{transaction.customer_phone}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">{formatCurrency(transaction.final_amount)}</td>
                    <td className="px-6 py-4">
                      <span className="text-xs text-gray-600 uppercase tracking-wide">
                        {statusLabels[transaction.status] || transaction.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{formatDateTime(transaction.received_at)}</td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleDownloadInvoice(transaction.id)}
                        className="text-gray-600 hover:text-gray-900"
                        title="Download Invoice"
                      >
                        <FiDownload size={16} />
                      </button>
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
