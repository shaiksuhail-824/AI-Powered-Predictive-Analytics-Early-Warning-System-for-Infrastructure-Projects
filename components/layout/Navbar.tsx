'use client';

import Link from 'next/link';
import { useAuthStore } from '../../store/authStore';
import { useRouter } from 'next/navigation';
import { LogOut, User as UserIcon } from 'lucide-react';

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuthStore();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  return (
    <nav className="bg-white border-b border-border h-16 flex items-center justify-between px-6 sticky top-0 z-50">
      <div className="flex items-center gap-4">
        {/* Placeholder for MoSPI / Govt Logo */}
        <div className="w-8 h-10 bg-mospi-100 border border-mospi-300 rounded flex items-center justify-center">
          <span className="text-mospi-700 font-bold text-xs">GOI</span>
        </div>
        <div>
          <h1 className="text-lg font-bold text-text-primary leading-tight">AI Project Monitoring</h1>
          <p className="text-xs text-text-muted">Ministry of Statistics and Programme Implementation</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {!isAuthenticated ? (
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
