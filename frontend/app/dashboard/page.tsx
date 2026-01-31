'use client';

import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { dashboardAPI } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';

export default function DashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await dashboardAPI.getStats();
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-sm text-gray-400">Loading...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-light text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Overview</p>
        </div>

        {/* Main Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-gray-200 rounded p-6">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">Total Transaksi</p>
            <p className="text-3xl font-light text-gray-900">{stats?.total_transactions || 0}</p>
          </div>

          <div className="bg-white border border-gray-200 rounded p-6">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">Total Omzet</p>
            <p className="text-3xl font-light text-gray-900">{formatCurrency(stats?.total_revenue || 0)}</p>
          </div>

          <div className="bg-white border border-gray-200 rounded p-6">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">Omzet Hari Ini</p>
            <p className="text-3xl font-light text-gray-900">{formatCurrency(stats?.today_revenue || 0)}</p>
          </div>

          <div className="bg-white border border-gray-200 rounded p-6">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">Order Aktif</p>
            <p className="text-3xl font-light text-gray-900">{stats?.active_orders || 0}</p>
          </div>
        </div>

        {/* Additional Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white border border-gray-200 rounded p-6">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">Transaksi Hari Ini</p>
            <p className="text-2xl font-light text-gray-900">{stats?.today_transactions || 0}</p>
          </div>

          <div className="bg-white border border-gray-200 rounded p-6">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">Transaksi Bulan Ini</p>
            <p className="text-2xl font-light text-gray-900">{stats?.monthly_transactions || 0}</p>
          </div>

          <div className="bg-white border border-gray-200 rounded p-6">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">Omzet Bulan Ini</p>
            <p className="text-2xl font-light text-gray-900">{formatCurrency(stats?.monthly_revenue || 0)}</p>
          </div>
        </div>
      </div>
    </Layout>
  );
}
