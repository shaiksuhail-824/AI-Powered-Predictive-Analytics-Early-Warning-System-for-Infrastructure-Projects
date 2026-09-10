'use client';

import { useAuthStore } from '../../store/authStore';
import { useRouter } from 'next/navigation';
import Navbar from '../../components/layout/Navbar';
import { ShieldAlert, ArrowLeft, LogOut } from 'lucide-react';

export default function ForbiddenPage() {
  const { user, logout } = useAuthStore();
  const router = useRouter();

  const handleReturnDashboard = () => {
    if (!user) {
      router.push('/login');
      return;
    }
    if (user.role === 'ADMIN') router.push('/admin/dashboard');
    else if (user.role === 'MINISTRY_PROJECT_HEAD') router.push('/ministry/dashboard');
    else if (user.role === 'AGENCY_CONTRACTOR') router.push('/agency/dashboard');
    else router.push('/');
  };

  const handleSwitchAccount = () => {
    logout();
    router.push('/login');
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-200 p-8 text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-red-100 flex items-center justify-center text-red-600 mb-6">
            <ShieldAlert size={36} />
          </div>

          <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-red-50 text-red-700 border border-red-200 mb-3">
            HTTP 403 Forbidden
          </span>

          <h1 className="text-2xl font-bold text-slate-900 mb-2">
            Access Restricted
          </h1>

          <p className="text-slate-600 text-sm mb-6 leading-relaxed">
            Your current account role (
            <span className="font-semibold text-slate-800">{user?.role || 'Unassigned'}</span>
            ) does not possess authorized clearance to access this system module.
          </p>

          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs text-left mb-6 text-slate-700 space-y-1">
            <div><span className="text-slate-400">Authenticated User:</span> <span className="font-mono font-medium">{user?.name || user?.id || 'Anonymous'}</span></div>
            <div><span className="text-slate-400">Assigned Role:</span> <span className="font-mono font-medium">{user?.role || 'None'}</span></div>
            {user?.scopedAgency && (
              <div><span className="text-slate-400">Agency Scope:</span> <span className="font-mono font-medium">{user.scopedAgency}</span></div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleReturnDashboard}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-mospi-500 hover:bg-mospi-600 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors"
            >
              <ArrowLeft size={16} />
              Return to Dashboard
            </button>
            <button
              onClick={handleSwitchAccount}
              className="flex items-center justify-center gap-2 px-4 py-2.5 border border-slate-300 hover:bg-slate-100 text-slate-700 text-sm font-semibold rounded-lg transition-colors"
            >
              <LogOut size={16} />
              Switch Account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
