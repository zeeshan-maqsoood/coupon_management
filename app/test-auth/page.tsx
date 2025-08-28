'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';

export default function TestAuthPage() {
  const { isAuthenticated, user, loading, logout } = useAuth();
  const [authStatus, setAuthStatus] = useState('Checking...');
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (isAuthenticated) {
        setAuthStatus(`Authenticated as ${user?.email} (${user?.role})`);
      } else {
        setAuthStatus('Not authenticated');
      }
    }
  }, [isAuthenticated, loading, user]);

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-center">Auth Test Page</h1>
        
        <div className="mb-6 p-4 bg-gray-50 rounded-md">
          <h2 className="text-lg font-semibold mb-2">Authentication Status:</h2>
          <p className="text-gray-700">{authStatus}</p>
        </div>

        {isAuthenticated && user && (
          <div className="mb-6 p-4 bg-blue-50 rounded-md">
            <h2 className="text-lg font-semibold mb-2">User Info:</h2>
            <pre className="text-sm bg-gray-800 text-green-100 p-3 rounded overflow-x-auto">
              {JSON.stringify(user, null, 2)}
            </pre>
          </div>
        )}

        <div className="flex flex-col space-y-3">
          {isAuthenticated ? (
            <>
              <button
                onClick={() => router.push('/admin')}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Go to Admin Dashboard
              </button>
              <button
                onClick={handleLogout}
                className="w-full bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
              >
                Logout
              </button>
            </>
          ) : (
            <button
              onClick={() => router.push('/login')}
              className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
            >
              Go to Login
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
