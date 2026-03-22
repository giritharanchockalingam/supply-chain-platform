'use client';

import { usePathname } from 'next/navigation';
import { AuthProvider, useAuth } from '@/lib/auth';
import { ThemeProvider } from '@/lib/theme';
import { RootLayoutClient } from './_client';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const isLoginPage = pathname === '/login';

  useEffect(() => {
    if (!loading && !user && !isLoginPage) {
      router.push('/login');
    }
    if (!loading && user && isLoginPage) {
      router.push('/yard/dashboard');
    }
  }, [user, loading, isLoginPage, router]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen dark:bg-gray-950">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-3" />
          <p className="text-sm text-gray-500 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (isLoginPage) {
    return <div className="flex-1">{children}</div>;
  }

  if (!user) {
    return null;
  }

  return <RootLayoutClient>{children}</RootLayoutClient>;
}

export function AuthLayoutWrapper({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AuthGate>{children}</AuthGate>
      </AuthProvider>
    </ThemeProvider>
  );
}
