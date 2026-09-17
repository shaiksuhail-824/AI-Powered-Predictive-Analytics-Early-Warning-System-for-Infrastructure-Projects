'use client';

import { useAuthStore } from '../../store/authStore';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Navbar from '../../components/layout/Navbar';
import Sidebar from '../../components/layout/Sidebar';

export default function SharedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated } = useAuthStore();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (!isAuthenticated) {
      if (typeof window !== 'undefined') {
        window.location.replace('/login');
      } else {
        router.push('/login');
      }
    }
  }, [isAuthenticated, router]);

  if (!mounted || !isAuthenticated) {
    return <div className="min-h-screen flex items-center justify-center bg-background">Loading...</div>;
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <Sidebar />
      <main className="flex-1 w-full max-w-full p-4 sm:p-6 lg:p-8">
        {children}
      </main>
    </div>
  );
}
