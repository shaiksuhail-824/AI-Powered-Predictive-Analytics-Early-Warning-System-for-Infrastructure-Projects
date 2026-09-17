'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuthStore } from '../../store/authStore';
import { useRouter } from 'next/navigation';
import { LogOut, User as UserIcon } from 'lucide-react';

export default function Navbar() {
  const { user, isAuthenticated, logout, loadSession } = useAuthStore();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    loadSession();
  }, [loadSession]);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };


  return (
    <nav className="bg-white border-b border-border h-16 flex items-center justify-between px-3 sm:px-6 sticky top-0 z-50">
      <div className="flex items-center gap-2 sm:gap-3 md:gap-4 overflow-hidden">
        {/* Crisp Government / DIC Logo */}
        <a
          href="https://www.dic.gov.in/"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Department for Promotion of Industry and Internal Trade"
          title="Visit the official DIC website"
          className="flex items-center shrink-0 transition-opacity hover:opacity-85 focus:outline-none focus:ring-2 focus:ring-mospi-500 rounded"
        >
          <img 
            src="/emblem-of-india.svg" 
            alt="State Emblem of India" 
            className="h-10 sm:h-11 md:h-12 w-auto max-w-full object-contain object-center"
          />
        </a>

        {/* Ministry of Statistics and Programme Implementation Title & Identity */}
        <a
          href="https://www.mospi.gov.in/"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Visit the official Ministry of Statistics and Programme Implementation website"
          title="Visit the official Ministry of Statistics and Programme Implementation website"
          className="flex flex-col border-r border-slate-300 pr-2 sm:pr-3 md:pr-4 shrink-0 transition-opacity hover:opacity-85 focus:outline-none focus:ring-2 focus:ring-mospi-500 rounded"
        >
          <span className="text-[11px] sm:text-[13px] md:text-[15px] font-bold text-slate-800 leading-[1.15] sm:leading-[1.2]">Ministry of Statistics and</span>
          <span className="text-[11px] sm:text-[13px] md:text-[15px] font-bold text-slate-800 leading-[1.15] sm:leading-[1.2]">Programme Implementation</span>
          <span className="text-[9px] sm:text-[10px] md:text-xs text-slate-500 mt-0.5">Government of India</span>
        </a>

        {/* MoSPI Data for Development Logo */}
        <a
          href="https://www.mospi.gov.in/"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Visit the official Ministry of Statistics and Programme Implementation website"
          title="Ministry of Statistics and Programme Implementation - Data for Development"
          className="flex items-center justify-center shrink-0 pr-1 sm:pr-2 transition-opacity hover:opacity-85 focus:outline-none focus:ring-2 focus:ring-mospi-500 rounded"
        >
          <img 
            src="/logo-data-for-development.png" 
            alt="Ministry of Statistics and Programme Implementation - Data for Development" 
            className="h-10 sm:h-11 md:h-12 w-auto max-w-full object-contain object-center"
          />
        </a>
      </div>

      <div className="flex items-center gap-4">
        {!mounted || !isAuthenticated ? (
          <Link href="/login" className="bg-mospi-500 hover:bg-mospi-600 text-white px-4 py-2 rounded-md font-medium text-sm transition-colors">
            Login
          </Link>
        ) : (
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-text-secondary">
              <UserIcon size={16} />
              <div className="flex flex-col">
                <span className="font-semibold text-text-primary">{user?.name}</span>
                <span className="text-xs">{user?.role.replace(/_/g, ' ')}</span>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="text-text-muted hover:text-mospi-600 transition-colors"
              title="Logout"
            >
              <LogOut size={20} />
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
