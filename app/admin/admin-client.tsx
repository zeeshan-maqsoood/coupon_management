"use client"

import { ReactNode, useEffect, useState } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';

export default function AdminClient({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user, loading, isAuthenticated } = useAuth();
  const [isChecking, setIsChecking] = useState(true);
  const [initialCheckDone, setInitialCheckDone] = useState(false);

  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') {
      setIsChecking(false);
      return;
    }

    // Check for token in localStorage
    const token = localStorage.getItem('token');
    console.log('AdminClient - Token check:', { 
      hasToken: !!token,
      loading,
      hasUser: !!user,
      userRole: user?.role
    });

    // If we have a token but still loading, wait
    if (loading) {
      console.log('AdminClient - Auth context still loading...');
      return;
    }

    // If we have an admin user, allow access
    if (user?.role === 'admin') {
      console.log('AdminClient - Admin access granted');
      setIsChecking(false);
      return;
    }

    // If we have a token but no user yet, wait a bit for auth context to update
    if (token && !user) {
      console.log('AdminClient - Token exists but no user yet, waiting...');
      const timer = setTimeout(() => {
        console.log('AdminClient - Auth check completed');
        if (!user) {
          console.log('AdminClient - Still no user, redirecting to login');
          router.replace('/login');
        }
      }, 1000);
      return () => clearTimeout(timer);
    }

    // No token and no user, redirect to login
    if (!token) {
      console.log('AdminClient - No token, redirecting to login');
      router.replace('/login');
    }
    
    setIsChecking(false);
  }, [user, loading, router]);

  // Show loading state while checking auth
  if (isChecking || loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // If we have a user but not an admin, show access denied
  if (user?.role !== 'admin') {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Access Denied</h1>
          <p className="text-muted-foreground mt-2">
            You don't have permission to access this page.
          </p>
        </div>
      </div>
    );
  }

  // If we get here, user is authenticated and is an admin
  return <>{children}</>;
}
