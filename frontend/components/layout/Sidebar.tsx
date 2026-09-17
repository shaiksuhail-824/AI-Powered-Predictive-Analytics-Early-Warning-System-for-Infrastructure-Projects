'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '../../store/authStore';
import { 
  LayoutDashboard, 
  FolderKanban, 
  Map, 
  BellRing, 
  BarChart3, 
  Bot,
  Users
} from 'lucide-react';

export default function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuthStore();

  if (!user) return null;

  const adminLinks = [
    { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Projects', href: '/projects', icon: FolderKanban },
    { name: 'States', href: '/admin/state/maharashtra', icon: Map }, // Default placeholder link
    { name: 'Alerts', href: '/alerts', icon: BellRing },
    { name: 'Benchmarking', href: '/benchmarking', icon: BarChart3 },
    { name: 'AI Assistant', href: '/ai-assistant', icon: Bot },
    { name: 'Users', href: '/admin/users', icon: Users },
  ];

  const ministryLinks = [
    { name: 'Dashboard', href: '/ministry/dashboard', icon: LayoutDashboard },
    { name: 'My Projects', href: '/projects', icon: FolderKanban },
    { name: 'Alerts', href: '/alerts', icon: BellRing },
    { name: 'Benchmarking', href: '/benchmarking', icon: BarChart3 },
    { name: 'AI Assistant', href: '/ai-assistant', icon: Bot },
  ];

  const agencyLinks = [
    { name: 'Dashboard', href: '/agency/dashboard', icon: LayoutDashboard },
    { name: 'My Projects', href: '/projects', icon: FolderKanban },
    { name: 'Alerts', href: '/alerts', icon: BellRing },
  ];

  let links: { name: string, href: string, icon: React.ElementType }[] = [];
  if (user.role === 'ADMIN') links = adminLinks;
  else if (user.role === 'MINISTRY_PROJECT_HEAD') links = ministryLinks;
  else if (user.role === 'AGENCY_CONTRACTOR') links = agencyLinks;

  return (
    <nav aria-label="Portal Navigation" className="w-full bg-white border-b border-border sticky top-16 z-40 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto py-2.5">
          {links.map((link) => {
            const isActive = pathname.startsWith(link.href);
            const Icon = link.icon;
            return (
              <Link 
                key={link.name} 
                href={link.href}
                className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap transition-colors shrink-0 ${
                  isActive 
                    ? 'bg-mospi-50 text-mospi-700 font-semibold border border-mospi-200' 
                    : 'text-text-secondary hover:bg-slate-100 hover:text-text-primary'
                }`}
              >
                <Icon size={16} className={isActive ? 'text-mospi-600' : 'text-text-muted'} />
                <span>{link.name}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
