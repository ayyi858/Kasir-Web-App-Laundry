'use client';

import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { transactionAPI } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import { FiDownload, FiFilter } from 'react-icons/fi';

export default function ReportsPage() {
  const [reports, setReports] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [period, setPeriod] = useState('daily');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const params: any = { period };
      if (dateFrom) params.date_from = dateFrom;
      if (dateTo) params.date_to = dateTo;
      const response = await transactionAPI.getReports(params);
      setReports(response.data);
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilter = (e: React.FormEvent) => {
    e.preventDefault();
    fetchReports();
  };

  const periodLabels: any = {
    daily: 'Harian',
    weekly: 'Mingguan',
    monthly: 'Bulanan',
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Laporan Transaksi</h1>
          <p className="text-gray-600 mt-1">Laporan transaksi harian, mingguan, dan bulanan</p>
        </div>

        {/* Filter */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <form onSubmit={handleFilter} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Periode</label>
                <select
                  value={period}
                  onChange={(e) => setPeriod(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="daily">Harian</option>
                  <option value="weekly">Mingguan</option>
                  <option value="monthly">Bulanan</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Dari Tanggal</label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sampai Tanggal</label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex items-end">
                <button
                  type="submit"
                  className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center justify-center space-x-2"
                >
                  <FiFilter />
                  <span>Filter</span>
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Summary Cards */}
        {reports && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Total Transaksi</h3>
              <p className="text-3xl font-bold text-blue-600">{reports.total_transactions || 0}</p>
              <p className="text-sm text-gray-500 mt-1">Periode: {periodLabels[period]}</p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Total Omzet</h3>
              <p className="text-3xl font-bold text-green-600">
                {formatCurrency(reports.total_revenue || 0)}
              </p>
              <p className="text-sm text-gray-500 mt-1">Periode: {periodLabels[period]}</p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Total Dibayar</h3>
              <p className="text-3xl font-bold text-purple-600">
                {formatCurrency(reports.total_paid || 0)}
              </p>
              <p className="text-sm text-gray-500 mt-1">Periode: {periodLabels[period]}</p>
            </div>
          </div>
        )}

        {/* Transactions Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800">Detail Transaksi</h2>
          </div>
          {loading ? (
            <div className="p-6 text-center text-gray-500">Memuat data...</div>
          ) : !reports || !reports.transactions || reports.transactions.length === 0 ? (
            <div className="p-6 text-center text-gray-500">Tidak ada data transaksi</div>
          ) : (
            <div className="overflow-x-auto">
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
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {reports.transactions.map((transaction: any) => (
                    <tr key={transaction.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {transaction.invoice_number}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{transaction.customer_name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {formatCurrency(transaction.final_amount)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                          {transaction.status_display}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {formatDate(transaction.received_at)}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
