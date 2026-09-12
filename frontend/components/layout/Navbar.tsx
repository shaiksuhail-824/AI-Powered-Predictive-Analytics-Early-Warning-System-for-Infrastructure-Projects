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
    <nav className="bg-white border-b border-border h-16 flex items-center justify-between px-6 sticky top-0 z-50">
      <div className="flex items-center gap-4">
        {/* Crisp Government Logo and Text */}
        <div className="flex items-center gap-3">
          <img 
            src="https://upload.wikimedia.org/wikipedia/commons/5/55/Emblem_of_India.svg" 
            alt="State Emblem of India" 
            className="h-12 w-auto object-contain grayscale"
          />
          <div className="flex flex-col border-r border-slate-300 pr-4">
            <span className="text-[15px] font-bold text-slate-800 leading-[1.2]">Ministry of Statistics and</span>
            <span className="text-[15px] font-bold text-slate-800 leading-[1.2]">Programme Implementation</span>
            <span className="text-xs text-slate-500 mt-0.5">Government of India</span>
          </div>
        </div>
        <div className="hidden md:flex items-center justify-center pr-2">
          {/* Custom SVG perfectly recreating the Data For Development logo */}
          <svg width="120" height="70" viewBox="0 0 120 80" xmlns="http://www.w3.org/2000/svg" className="h-14 w-auto">
            {/* Leaves */}
            <path d="M 10 60 C 30 75, 50 75, 60 70 C 70 75, 90 75, 110 60 C 90 45, 70 45, 60 60 C 50 45, 30 45, 10 60 Z" fill="#008000" />
            
            {/* Outer Circle */}
            <circle cx="60" cy="35" r="28" fill="white" stroke="#000080" strokeWidth="1.5" />
            
            {/* Math Symbols */}
            <text x="44" y="16" fill="#000080" fontSize="11" fontFamily="serif" fontWeight="bold">∫</text>
            <text x="68" y="19" fill="#000080" fontSize="11" fontFamily="serif" fontWeight="bold">Σ</text>
            <text x="32" y="28" fill="#000080" fontSize="12" fontFamily="serif" fontWeight="bold">=</text>
            <text x="85" y="32" fill="#000080" fontSize="10" fontFamily="serif" fontWeight="bold">O</text>
            <text x="32" y="45" fill="#000080" fontSize="12" fontFamily="serif" fontWeight="bold">९</text>
            
            {/* Chakra (simplified) */}
            <circle cx="60" cy="32" r="13" fill="none" stroke="#000080" strokeWidth="1" />
            <path d="M 60 19 L 60 45 M 47 32 L 73 32 M 51 23 L 69 41 M 51 41 L 69 23 M 55 20 L 65 44 M 55 44 L 65 20 M 48 27 L 72 37 M 48 37 L 72 27" stroke="#000080" strokeWidth="0.5" />
            
            {/* Center Rupee */}
            <circle cx="60" cy="32" r="6.5" fill="#000080" />
            <text x="60" y="35.5" fill="white" fontSize="9" fontWeight="bold" textAnchor="middle">₹</text>

            {/* Orange Chart (layered over circle) */}
            <path d="M 37 57 L 37 47 L 44 44 L 44 59 Z" fill="#FF8C00" stroke="white" strokeWidth="0.5"/>
            <path d="M 45 60 L 45 42 L 52 38 L 52 61 Z" fill="#FF8C00" stroke="white" strokeWidth="0.5"/>
            <path d="M 53 62 L 53 36 L 60 30 L 60 62 Z" fill="#FF8C00" stroke="white" strokeWidth="0.5"/>
            <path d="M 61 62 L 61 28 L 68 22 L 68 60 Z" fill="#FF8C00" stroke="white" strokeWidth="0.5"/>
            <path d="M 69 58 L 69 21 L 76 15 L 76 54 Z" fill="#FF8C00" stroke="white" strokeWidth="0.5"/>
            
            {/* Trend Line */}
            <path d="M 35 50 L 78 12" stroke="#FF4500" strokeWidth="1.5" />
            <polygon points="77,10 82,10 77,15" fill="#FF4500" />

            {/* Text */}
            <text x="60" y="76" fill="#000080" fontSize="9" fontWeight="900" fontFamily="sans-serif" textAnchor="middle" letterSpacing="0.5">DATA FOR DEVELOPMENT</text>
          </svg>
        </div>
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
