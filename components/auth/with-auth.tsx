'use client';

import { ReactNode } from 'react';
import ProtectedRoute from './protected-route';

interface WithAuthProps {
  children: ReactNode;
  requiredRole?: string;
  requiredPermission?: string;
}

export function withAuth({
  children,
  requiredRole,
  requiredPermission,
}: WithAuthProps) {
  return (
    <ProtectedRoute requiredRole={requiredRole} requiredPermission={requiredPermission}>
      {children}
    </ProtectedRoute>
  );
}

// For backward compatibility
export function AuthProvider({ children }: { children: ReactNode }) {
  return <ProtectedRoute>{children}</ProtectedRoute>;
}
