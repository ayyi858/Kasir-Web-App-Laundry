'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import Cookies from 'js-cookie';
import { authAPI } from '@/lib/api';
import {
  FiHome,
  FiUsers,
  FiShoppingCart,
  FiFileText,
  FiSettings,
  FiLogOut,
  FiMenu,
  FiX,
} from 'react-icons/fi';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const userData = Cookies.get('user');
    if (userData) {
      setUser(JSON.parse(userData));
    } else {
      router.push('/');
    }
  }, [router]);

  const handleLogout = async () => {
    try {
      await authAPI.logout();
    } catch (err) {
      console.error('Logout error:', err);
    }
    Cookies.remove('token');
    Cookies.remove('user');
    router.push('/');
  };

  const menuItems = [
    { href: '/dashboard', label: 'Dashboard', icon: FiHome },
    { href: '/customers', label: 'Pelanggan', icon: FiUsers },
    { href: '/transactions', label: 'Transaksi', icon: FiShoppingCart },
    { href: '/services', label: 'Layanan', icon: FiSettings },
    { href: '/reports', label: 'Laporan', icon: FiFileText },
  ];

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar toggle */}
      <div className="lg:hidden fixed top-0 left-0 right-0 bg-white shadow-sm z-40 p-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-blue-600">LAUNDRY EXPRESS</h1>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 rounded-lg hover:bg-gray-100"
        >
          {sidebarOpen ? <FiX size={24} /> : <FiMenu size={24} />}
        </button>
      </div>

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full bg-white shadow-lg z-30 w-64 transform transition-transform duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0`}
      >
        <div className="p-6 border-b">
          <h1 className="text-2xl font-bold text-blue-600">LAUNDRY EXPRESS</h1>
          <p className="text-sm text-gray-600 mt-1">POS System</p>
        </div>

        <nav className="p-4">
          <div className="mb-4 pb-4 border-b">
            <p className="text-sm font-medium text-gray-700">{user.first_name || user.username}</p>
            <p className="text-xs text-gray-500 capitalize">{user.role}</p>
          </div>

          <ul className="space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition ${
                      isActive
                        ? 'bg-blue-50 text-blue-600 font-medium'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Icon size={20} />
                    <span>{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>

          <button
            onClick={handleLogout}
            className="mt-4 w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition"
          >
            <FiLogOut size={20} />
            <span>Keluar</span>
          </button>
        </nav>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <main className="lg:ml-64 pt-16 lg:pt-0">
        <div className="p-4 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
