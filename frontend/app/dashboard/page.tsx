'use client';

import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { dashboardAPI } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import {
  FiDollarSign,
  FiShoppingBag,
  FiTrendingUp,
  FiClock,
} from 'react-icons/fi';

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
          <div className="text-gray-500">Memuat data...</div>
        </div>
      </Layout>
    );
  }

  const statCards = [
    {
      title: 'Total Transaksi',
      value: stats?.total_transactions || 0,
      icon: FiShoppingBag,
      color: 'bg-blue-500',
    },
    {
      title: 'Total Omzet',
      value: formatCurrency(stats?.total_revenue || 0),
      icon: FiDollarSign,
      color: 'bg-green-500',
    },
    {
      title: 'Omzet Hari Ini',
      value: formatCurrency(stats?.today_revenue || 0),
      icon: FiTrendingUp,
      color: 'bg-yellow-500',
    },
    {
      title: 'Order Aktif',
      value: stats?.active_orders || 0,
      icon: FiClock,
      color: 'bg-purple-500',
    },
  ];

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
          <p className="text-gray-600 mt-1">Ringkasan aktivitas laundry</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((card, index) => {
            const Icon = card.icon;
            return (
              <div
                key={index}
                className="bg-white rounded-lg shadow-md p-6 border border-gray-200"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">{card.title}</p>
                    <p className="text-2xl font-bold text-gray-800">{card.value}</p>
                  </div>
                  <div className={`${card.color} p-3 rounded-lg`}>
                    <Icon className="text-white" size={24} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Additional Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Transaksi Hari Ini</h3>
            <p className="text-3xl font-bold text-blue-600">{stats?.today_transactions || 0}</p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Transaksi Bulan Ini</h3>
            <p className="text-3xl font-bold text-green-600">{stats?.monthly_transactions || 0}</p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Omzet Bulan Ini</h3>
            <p className="text-3xl font-bold text-purple-600">
              {formatCurrency(stats?.monthly_revenue || 0)}
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
}
