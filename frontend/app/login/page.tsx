'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../store/authStore';
import Navbar from '../../components/layout/Navbar';
import Image from 'next/image';
import { Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const { login } = useAuthStore();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    
    const success = login(email);
    
    if (success) {
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
        {/* Make navbar transparent on this page if possible, or just keep it as is. 
            Since we imported the normal Navbar, it has bg-white. 
            The reference image has a white navbar at the top, so we keep it. */}
        <Navbar />
        <div className="flex-1 flex flex-col-reverse lg:flex-row items-center justify-between px-6 md:px-12 lg:pl-16 lg:pr-32 gap-12 py-10">
          
          {/* Login Card on the left with larger size */}
          <div className="w-full max-w-[520px]">
            <div className="bg-white/95 backdrop-blur-md p-10 shadow-2xl rounded-2xl rounded-tr-[80px] border border-white/50 relative">
              
              <form onSubmit={handleLogin} className="space-y-6">
                <div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <input 
                      type="text" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-11 pr-4 py-3.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-mospi-500 focus:border-transparent text-sm bg-white"
                      placeholder="Username / Email ID"
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                    <input 
                      type={showPassword ? "text" : "password"} 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-11 pr-11 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-mospi-500 focus:border-transparent text-sm bg-white"
                      placeholder="Password"
                    />
                    <button 
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs md:text-sm">
                  <div className="flex items-center">
                    <input type="checkbox" id="remember" className="w-4 h-4 text-mospi-600 rounded border-gray-300 focus:ring-mospi-500" />
                    <label htmlFor="remember" className="ml-2 text-slate-600">Remember Me</label>
                  </div>
                  <Link href="#" className="text-mospi-600 hover:underline font-medium">Forgot Password?</Link>
                </div>

                {error && (
                  <div className="text-red-500 text-sm text-center font-medium">
                    {error}
                  </div>
                )}

                <button 
                  type="submit" 
                  className="w-full bg-mospi-500 hover:bg-mospi-600 text-white py-3 rounded-lg font-bold transition-colors shadow-md"
                >
                  Login
                </button>
                
                <div className="text-center pt-2">
                  <Link href="#" className="text-xs text-slate-500 hover:text-mospi-600 font-medium">
                    New User? Contact Admin
                  </Link>
                </div>
              </form>

              <div className="mt-8 pt-4 border-t border-gray-100 text-center">
                <p className="text-[10px] text-gray-400 mb-1">Demo Credentials for Hackathon:</p>
                <div className="flex justify-center gap-3 text-[10px] font-mono text-gray-400">
                  <span>admin01</span>
                  <span>ministry01</span>
                  <span>agency01</span>
                </div>
              </div>
            </div>
          </div>

          {/* Typography matching reference image 5 (or right aligned) */}
          <div className="w-full lg:w-1/2 text-white text-left lg:text-right pt-8 lg:pt-0">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-4">
              Better Data<br/>Stronger Decisions<br/>A Developed India
            </h2>
            <p className="text-white/90 text-lg mt-6 font-medium">
              Welcome to the MoSPI Portal<br/>Please login to continue
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
