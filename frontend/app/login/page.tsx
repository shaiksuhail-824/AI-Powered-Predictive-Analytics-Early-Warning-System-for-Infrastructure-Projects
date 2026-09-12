'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../store/authStore';
import Navbar from '../../components/layout/Navbar';
import Image from 'next/image';
import { Eye, EyeOff, AlertCircle, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();
  const { login, isAuthenticated, user } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.role === 'ADMIN') {
        router.push('/admin/dashboard');
      } else if (user.role === 'MINISTRY_PROJECT_HEAD') {
        router.push('/ministry/dashboard');
      } else if (user.role === 'AGENCY_CONTRACTOR') {
        router.push('/agency/dashboard');
      } else {
        router.push('/');
      }
    }
  }, [isAuthenticated, user, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const success = await login(username.trim(), password);

      if (success) {
        const currentUser = useAuthStore.getState().user;
        if (currentUser?.role === 'ADMIN') {
          router.push('/admin/dashboard');
        } else if (currentUser?.role === 'MINISTRY_PROJECT_HEAD') {
          router.push('/ministry/dashboard');
        } else if (currentUser?.role === 'AGENCY_CONTRACTOR') {
          router.push('/agency/dashboard');
        } else {
          router.push('/');
        }
      } else {
        const storeError = useAuthStore.getState().error;
        setError(storeError || 'Invalid username or password. Please check your credentials.');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Authentication server unreachable. Please verify backend service.';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };


  const fillCredentials = (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
    setError('');
  };

  return (
    <div className="min-h-screen flex flex-col relative overflow-y-auto overflow-x-hidden">
      {/* Background Image - Full Screen Delhi India Gate */}
      <div className="absolute inset-0 z-0">
        <Image 
          src="/delhi-bg.png" 
          alt="India Gate Delhi Background" 
          fill 
          className="object-cover"
          priority
        />
        {/* Gradient overlay to ensure text readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-black/20 to-transparent"></div>
      </div>

      <div className="relative z-10 flex flex-col min-h-screen">
        <Navbar />
        <div className="flex-1 flex flex-col-reverse lg:flex-row items-center justify-between px-6 md:px-12 lg:pl-16 lg:pr-32 gap-12 py-10">
          
          {/* Login Card on the left */}
          <div className="w-full max-w-[520px]">
            <div className="bg-white/95 backdrop-blur-md p-10 shadow-2xl rounded-2xl rounded-tr-[80px] border border-white/50 relative">
              
              <div className="mb-6">
                <span className="text-xs font-semibold uppercase tracking-wider text-mospi-600 bg-mospi-50 px-2.5 py-1 rounded">
                  Secure Access
                </span>
                <h1 className="text-2xl font-bold text-slate-900 mt-2">
                  Official Portal Login
                </h1>
                <p className="text-xs text-slate-500 mt-1">
                  Authenticate using your National Project Monitoring credentials
                </p>
              </div>

              {error && (
                <div className="mb-5 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-start gap-2.5 animate-in fade-in duration-200">
                  <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-xs text-red-800">Authentication Failed</p>
                    <p className="text-xs text-red-600 mt-0.5">{error}</p>
                  </div>
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Username / ID
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <input 
                      type="text" 
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-mospi-500 focus:border-transparent text-sm bg-white"
                      placeholder="e.g. admin01 or ministry01"
                      required
                      autoComplete="username"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Security Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                    <input 
                      type={showPassword ? "text" : "password"} 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-10 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-mospi-500 focus:border-transparent text-sm bg-white"
                      placeholder="Enter cryptographic passphrase"
                      required
                      autoComplete="current-password"
                    />
                    <button 
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center">
                    <input type="checkbox" id="remember" className="w-3.5 h-3.5 text-mospi-600 rounded border-gray-300 focus:ring-mospi-500" />
                    <label htmlFor="remember" className="ml-1.5 text-slate-600">Remember Session</label>
                  </div>
                  <span className="text-mospi-600 text-xs hover:underline cursor-pointer">Security Policy</span>
                </div>

                <button 
                  type="submit" 
                  disabled={submitting}
                  className="w-full bg-mospi-500 hover:bg-mospi-600 disabled:bg-mospi-300 text-white py-3 rounded-lg font-bold transition-all shadow-md flex items-center justify-center gap-2"
                >
                  {submitting && <Loader2 size={16} className="animate-spin" />}
                  {submitting ? 'Authenticating...' : 'Sign In'}
                </button>
              </form>

              {/* Demo Quick-Fill Selectors */}
              <div className="mt-6 pt-4 border-t border-gray-100">
                <p className="text-[11px] font-medium text-slate-500 mb-2 text-center">
                  Quick Select Evaluation Credentials:
                </p>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => fillCredentials('admin01', 'Admin@2026#Secure')}
                    className="px-2 py-1.5 bg-slate-50 hover:bg-mospi-50 hover:text-mospi-700 hover:border-mospi-300 border border-slate-200 rounded text-[11px] font-medium text-slate-700 transition-colors text-center"
                  >
                    <div className="font-semibold">Admin</div>
                    <div className="text-[9px] text-slate-400 font-mono">admin01</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => fillCredentials('ministry01', 'Ministry@2026#Secure')}
                    className="px-2 py-1.5 bg-slate-50 hover:bg-mospi-50 hover:text-mospi-700 hover:border-mospi-300 border border-slate-200 rounded text-[11px] font-medium text-slate-700 transition-colors text-center"
                  >
                    <div className="font-semibold">Ministry</div>
                    <div className="text-[9px] text-slate-400 font-mono">ministry01</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => fillCredentials('agency01', 'Agency@2026#Secure')}
                    className="px-2 py-1.5 bg-slate-50 hover:bg-mospi-50 hover:text-mospi-700 hover:border-mospi-300 border border-slate-200 rounded text-[11px] font-medium text-slate-700 transition-colors text-center"
                  >
                    <div className="font-semibold">Contractor</div>
                    <div className="text-[9px] text-slate-400 font-mono">agency01</div>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Typography matching reference */}
          <div className="w-full lg:w-1/2 text-white text-left lg:text-right pt-8 lg:pt-0">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-4">
              Better Data<br/>Stronger Decisions<br/>A Developed India
            </h2>
            <p className="text-white/90 text-lg mt-6 font-medium">
              Welcome to the MoSPI Early Warning Portal<br/>Role-Based Access Control Protected
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
