'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authAPI } from '@/lib/api';
import Cookies from 'js-cookie';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await authAPI.login(username, password);
      Cookies.set('token', response.data.token);
      Cookies.set('user', JSON.stringify(response.data.user));
      router.push('/dashboard');
    } catch (err: any) {
      console.error('Login error:', err.response?.data);
      let errorMsg = 'Login gagal. Periksa username dan password.';
      
      if (err.response?.data) {
        const data = err.response.data;
        // Handle non_field_errors
        if (data.non_field_errors && Array.isArray(data.non_field_errors)) {
          errorMsg = data.non_field_errors[0];
        } else if (data.message) {
          errorMsg = data.message;
        } else if (data.error) {
          errorMsg = data.error;
        } else if (data.details) {
          // Handle details object
          if (typeof data.details === 'string') {
            errorMsg = data.details;
          } else if (data.details.non_field_errors) {
            errorMsg = Array.isArray(data.details.non_field_errors) 
              ? data.details.non_field_errors[0] 
              : data.details.non_field_errors;
          } else if (typeof data.details === 'object') {
            // Get first error from details
            const firstError = Object.values(data.details)[0];
            errorMsg = Array.isArray(firstError) ? firstError[0] : String(firstError);
          }
        }
      }
      
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100">
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-blue-600 mb-2">LAUNDRY EXPRESS</h1>
          <p className="text-gray-600">Sistem Point of Sale</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
              Username
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Masukkan username"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Masukkan password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {loading ? 'Masuk...' : 'Masuk'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-600">
          {/* <p>Default: admin / admin123</p> */}
        </div>
      </div>
    </div>
  );
}
