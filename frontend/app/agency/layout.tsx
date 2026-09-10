'use client';

import { useAuthStore } from '../../store/authStore';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Navbar from '../../components/layout/Navbar';
import Sidebar from '../../components/layout/Sidebar';

export default function AgencyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isAuthenticated, isLoading } = useAuthStore();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push('/login');
      } else if (user?.role !== 'AGENCY_CONTRACTOR' && user?.role !== 'ADMIN') {
        router.push('/forbidden');
      }
    }
  }, [isAuthenticated, user, isLoading, router]);

  if (!mounted || isLoading || !isAuthenticated || (user?.role !== 'AGENCY_CONTRACTOR' && user?.role !== 'ADMIN')) {
    return <div className="min-h-screen flex items-center justify-center bg-background">Loading...</div>;
  }


  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
