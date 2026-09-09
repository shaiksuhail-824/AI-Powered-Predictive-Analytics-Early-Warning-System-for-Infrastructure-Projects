'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../store/authStore';
import { Card } from '../../components/ui/Cards';
import Navbar from '../../components/layout/Navbar';
import { ShieldCheck } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState(''); // Just for visual in demo
  const [error, setError] = useState('');
  const router = useRouter();
  const { login } = useAuthStore();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    
    // In a real app, this would be an API call verifying email and password
    const success = login(email);
    
    if (success) {
      // Small delay to ensure state updates, then redirect based on role
      setTimeout(() => {
        const currentUser = useAuthStore.getState().user;
        if (currentUser?.role === 'ADMIN') router.push('/admin/dashboard');
        else if (currentUser?.role === 'MINISTRY_PROJECT_HEAD') router.push('/ministry/dashboard');
        else if (currentUser?.role === 'AGENCY_CONTRACTOR') router.push('/agency/dashboard');
        else router.push('/');
      }, 100);
    } else {
      setError('Invalid official username or email.');
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <div className="flex-1 flex items-center justify-center p-6">
        <Card className="w-full max-w-md p-8 shadow-card">
          <div className="text-center mb-8">
            <div className="w-12 h-12 bg-mospi-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-mospi-100">
              <ShieldCheck className="text-mospi-600" size={24} />
            </div>
            <h2 className="text-2xl font-bold text-text-primary">Login</h2>
            <p className="text-sm text-text-muted mt-1">Authorized users only</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Official Username / Email</label>
              <input 
                type="text" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-border rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-mospi-500 focus:border-transparent text-sm"
                placeholder="e.g. admin01"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Password</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-border rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-mospi-500 focus:border-transparent text-sm"
                placeholder="Enter password"
              />
            </div>

            {/* Placeholder for CAPTCHA */}
            <div className="border border-border bg-slate-50 rounded p-4 flex items-center justify-center gap-3">
              <input type="checkbox" id="captcha" required className="w-4 h-4 text-mospi-600 rounded border-gray-300 focus:ring-mospi-500" />
              <label htmlFor="captcha" className="text-sm font-medium text-text-secondary">I am not a robot</label>
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 text-sm p-3 rounded-md border border-red-100">
                {error}
              </div>
            )}

            <button 
              type="submit" 
              className="w-full bg-mospi-500 hover:bg-mospi-600 text-white py-2.5 rounded-md font-medium transition-colors"
            >
              Login
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-border text-center">
            <p className="text-xs text-text-muted mb-2">Demo Credentials for Hackathon:</p>
            <div className="flex justify-center gap-4 text-xs font-mono text-slate-500">
              <span>admin01</span>
              <span>ministry01</span>
              <span>agency01</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
