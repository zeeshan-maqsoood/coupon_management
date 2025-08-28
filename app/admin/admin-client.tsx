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

  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') {
      setIsChecking(false);
      return;
    }

    // Skip if still loading auth context
    if (loading) return;

    // If we have a user with admin role, we're good to go
    if (user?.role === 'admin') {
      setIsChecking(false);
      return;
    }
    
    // If no user but we have a token, wait for auth context to update
    const token = localStorage.getItem('auth-token');
    if (token) {
      const timer = setTimeout(() => {
        // If we still don't have a user after waiting, redirect to login
        if (!isAuthenticated) {
          const from = pathname === '/login' ? searchParams?.get('from') || '/admin' : pathname;
          router.replace(`/login?from=${encodeURIComponent(from || '/admin')}`);
        }
        setIsChecking(false);
      }, 1000);
      
      return () => clearTimeout(timer);
    }
    
    // No user and no token, redirect to login
    const from = pathname === '/login' ? searchParams?.get('from') || '/admin' : pathname;
    router.replace(`/login?from=${encodeURIComponent(from || '/admin')}`);
    setIsChecking(false);
    
  }, [user, loading, isAuthenticated, router, pathname, searchParams]);

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
