'use client';

import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { transactionAPI } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';

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
    daily: 'Daily',
    weekly: 'Weekly',
    monthly: 'Monthly',
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-light text-gray-900">Reports</h1>
          <p className="text-sm text-gray-500 mt-1">Transaction reports</p>
        </div>

        {/* Filter */}
        <div className="bg-white border border-gray-200 rounded p-6">
          <form onSubmit={handleFilter} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-2 uppercase tracking-wide">Period</label>
                <select
                  value={period}
                  onChange={(e) => setPeriod(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400 text-sm"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-2 uppercase tracking-wide">From Date</label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-2 uppercase tracking-wide">To Date</label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400 text-sm"
                />
              </div>
              <div className="flex items-end">
                <button
                  type="submit"
                  className="w-full bg-gray-900 text-white px-4 py-2 rounded text-sm font-medium hover:bg-gray-800 transition"
                >
                  Filter
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Summary Cards */}
        {reports && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white border border-gray-200 rounded p-6">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">Total Transactions</p>
              <p className="text-3xl font-light text-gray-900">{reports.total_transactions || 0}</p>
              <p className="text-xs text-gray-500 mt-2">Period: {periodLabels[period]}</p>
            </div>
            <div className="bg-white border border-gray-200 rounded p-6">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">Total Revenue</p>
              <p className="text-3xl font-light text-gray-900">{formatCurrency(reports.total_revenue || 0)}</p>
              <p className="text-xs text-gray-500 mt-2">Period: {periodLabels[period]}</p>
            </div>
            <div className="bg-white border border-gray-200 rounded p-6">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">Total Paid</p>
              <p className="text-3xl font-light text-gray-900">{formatCurrency(reports.total_paid || 0)}</p>
              <p className="text-xs text-gray-500 mt-2">Period: {periodLabels[period]}</p>
            </div>
          </div>
        )}

        {/* Transactions Table */}
        <div className="bg-white border border-gray-200 rounded overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-sm font-medium text-gray-900 uppercase tracking-wide">Transaction Details</h2>
          </div>
          {loading ? (
            <div className="p-8 text-center text-sm text-gray-400">Loading...</div>
          ) : !reports || !reports.transactions || reports.transactions.length === 0 ? (
            <div className="p-8 text-center text-sm text-gray-400">No transaction data</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Invoice</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Customer</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Total</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {reports.transactions.map((transaction: any) => (
                    <tr key={transaction.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-900 font-medium">{transaction.invoice_number}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{transaction.customer_name}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{formatCurrency(transaction.final_amount)}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{transaction.status_display}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{formatDate(transaction.received_at)}</td>
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
