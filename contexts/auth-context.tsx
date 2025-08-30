'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  user: any;
  loading: boolean;
  login: (credentials: { email: string; password: string }) => Promise<boolean>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Function to get token from cookie
  const getTokenFromCookie = () => {
    if (typeof document === 'undefined') return null;
    const match = document.cookie.match(/auth-token=([^;]+)/);
    return match ? match[1] : null;
  };

  // Function to ensure token is in both localStorage and cookie
  const ensureTokenConsistency = () => {
    if (typeof window === 'undefined') return null;
    
    const localStorageToken = localStorage.getItem('token');
    const cookieToken = getTokenFromCookie();
    
    console.log('Token consistency check:', { localStorage: !!localStorageToken, cookie: !!cookieToken });
    
    // If we have a token in either location, ensure it's in both
    const validToken = localStorageToken || cookieToken;
    if (validToken) {
      if (!localStorageToken) {
        console.log('Adding token to localStorage from cookie');
        localStorage.setItem('token', validToken);
      }
      if (!cookieToken) {
        console.log('Adding token to cookie from localStorage');
        document.cookie = `auth-token=${validToken}; path=/; max-age=604800; samesite=lax${process.env.NODE_ENV === 'production' ? '; secure' : ''}`;
      }
      return validToken;
    }
    
    return null;
  };

  useEffect(() => {
    // Check for existing session on initial load
    const checkAuth = async () => {
      try {
        // First, verify we're on client side
        if (typeof window === 'undefined') {
          console.log('Running on server side, skipping auth check');
          setLoading(false);
          return;
        }

        // Ensure token consistency between localStorage and cookie
        const token = ensureTokenConsistency();
        console.log('Initial auth check - token:', token ? 'exists' : 'not found');
        
        if (!token) {
          console.log('No valid token found, user not authenticated');
          setLoading(false);
          return;
        }
        
        try {
          console.log('Verifying token with /api/auth/me');
          const response = await fetch('/api/auth/me', {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            credentials: 'include',
            cache: 'no-store'
          });
          
          const data = await response.json();
          console.log('Auth check response:', { 
            status: response.status,
            ok: response.ok,
            hasUser: !!data?.data?.user 
          });
          
          if (response.ok && data.success && data.data?.user) {
            console.log('User authenticated:', data.data.user.email);
            // Ensure token is in localStorage (should already be there from ensureTokenConsistency)
            localStorage.setItem('token', token);
            setUser(data.data.user);
          } else {
            console.log('Invalid auth response, cleaning up tokens');
            // Clean up both storage methods
            localStorage.removeItem('token');
            document.cookie = 'auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
          }
        } catch (error) {
          console.error('Error during auth check:', error);
          // Don't remove token on network errors
          if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
            console.log('Network error, keeping token');
          } else {
            localStorage.removeItem('token');
          }
        }
      } catch (error) {
        console.error('Unexpected error in auth check:', error);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (credentials: { email: string; password: string }) => {
    try {
      console.log('Login attempt with credentials:', { email: credentials.email });
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
        credentials: 'include' // Important for cookies to be set
      });

      const data = await response.json();
      console.log('Login response in auth context:', {
        success: data.success,
        hasToken: !!data.data?.token,
        hasUser: !!data.data?.user
      });

      if (response.ok && data.success) {
        // Store token in both localStorage and sync with cookie
        const token = data.data.token;
        console.log('Storing token in localStorage and syncing with cookie');
        
        // Store in localStorage
        localStorage.setItem('token', token);
        
        // Ensure it's also set as a cookie (should be done by the server, but just in case)
        document.cookie = `auth-token=${token}; path=/; max-age=604800; samesite=lax${process.env.NODE_ENV === 'production' ? '; secure' : ''}`;
        
        console.log('Token storage complete', { 
          localStorage: !!localStorage.getItem('token'),
          cookie: !!getTokenFromCookie() 
        });
        
        setUser(data.data.user);
        return true;
      }
      console.log('Login failed:', { status: response.status, data });
      return false;
    } catch (error) {
      console.error('Login failed:', error);
      return false;
    }
  };

  const logout = async () => {
    console.log('Initiating logout process');
    
    // First, clear client-side state
    setUser(null);
    
    try {
      // Call the server-side logout endpoint
      console.log('Calling logout API endpoint');
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include' // Important for cookie-based auth
      });
      
      if (!response.ok) {
        console.error('Logout API returned non-200 status:', response.status);
      }
    } catch (error) {
      console.error('Logout API call failed, continuing with client-side cleanup:', error);
    } finally {
      // Clear all auth data on the client side
      console.log('Performing client-side cleanup');
      
      // Clear all possible storage locations
      localStorage.removeItem('token');
      sessionStorage.removeItem('token');
      
      // Clear all possible auth cookies
      document.cookie.split(';').forEach(cookie => {
        const [name] = cookie.trim().split('=');
        if (name === 'auth-token' || name === 'refresh-token' || name === 'token') {
          document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
        }
      });
      
      console.log('Client-side cleanup complete, redirecting to login');
      
      // Force a full page reload to ensure all state is cleared
      window.location.href = '/login';
    }
  };

  const value = {
    user,
    loading,
    login,
    logout,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
