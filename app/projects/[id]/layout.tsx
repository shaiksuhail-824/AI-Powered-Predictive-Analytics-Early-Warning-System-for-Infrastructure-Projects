'use client';

import { useAuthStore } from '../../../store/authStore';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import Navbar from '../../../components/layout/Navbar';
import Sidebar from '../../../components/layout/Sidebar';
import { mockProjects } from '../../../data/mockData';
import Link from 'next/link';

export default function ProjectLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { id: string };
}) {
  const { user, isAuthenticated } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  const project = mockProjects.find(p => p.projectId === params.id);

  if (!mounted || !isAuthenticated) {
    return <div className="min-h-screen flex items-center justify-center bg-background">Loading...</div>;
  }

  if (!project) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <div className="flex flex-1 overflow-hidden">
          <Sidebar />
          <main className="flex-1 overflow-y-auto p-6 flex items-center justify-center">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-text-primary">Project Not Found</h2>
              <p className="text-text-secondary mt-2">The requested project ID does not exist or you don&apos;t have access.</p>
              <button onClick={() => router.back()} className="mt-4 text-mospi-600 hover:underline">Go Back</button>
            </div>
          </main>
        </div>
      </div>
    );
  }

  const tabs = [
    { name: 'Overview', href: `/projects/${params.id}` },
    { name: 'Historical Data', href: `/projects/${params.id}/historical` },
    { name: 'AI Risk Analysis', href: `/projects/${params.id}/ai-analysis` },
  ];

  if (user?.role !== 'ADMIN') {
    tabs.push({ name: 'Monthly Update', href: `/projects/${params.id}/monthly-update` });
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            
            {/* Project Header */}
            <div>
              <div className="flex items-center gap-2 text-sm text-text-muted mb-2">
                <Link href={user?.role === 'ADMIN' ? '/admin/dashboard' : `/${user?.role.toLowerCase().split('_')[0]}/dashboard`} className="hover:text-mospi-600 transition-colors">Dashboard</Link>
                <span>/</span>
                <span className="text-text-primary font-medium">{project.projectId}</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-text-primary leading-tight">{project.projectName}</h1>
              <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-text-secondary">
                <span className="font-medium bg-slate-100 px-2 py-1 rounded">{project.projectId}</span>
                <span>{project.ministry}</span>
                <span className="hidden md:inline">•</span>
                <span>{project.agency}</span>
                <span className="hidden md:inline">•</span>
                <span>{project.state}</span>
                <span className="hidden md:inline">•</span>
                <span className="font-medium text-mospi-700">{project.sector}</span>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="border-b border-border">
              <nav className="-mb-px flex space-x-8 overflow-x-auto">
                {tabs.map((tab) => {
                  const isActive = pathname === tab.href;
                  return (
                    <Link
                      key={tab.name}
                      href={tab.href}
                      className={`
                        whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors
                        ${isActive 
                          ? 'border-mospi-500 text-mospi-600' 
                          : 'border-transparent text-text-muted hover:text-text-primary hover:border-border'}
                      `}
                    >
                      {tab.name}
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* Tab Content */}
            <div className="pt-2">
              {children}
            </div>

          </div>
        </main>
      </div>
    </div>
  );
}
