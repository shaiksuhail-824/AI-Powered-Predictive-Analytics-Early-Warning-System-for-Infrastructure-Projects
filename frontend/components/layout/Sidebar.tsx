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
    <aside className="w-64 bg-white border-r border-border h-[calc(100vh-4rem)] sticky top-16 overflow-y-auto hidden md:block flex-shrink-0">
      <div className="p-4 flex flex-col gap-2">
        <div className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2 px-3">
          Navigation
        </div>
        {links.map((link) => {
          const isActive = pathname.startsWith(link.href);
          const Icon = link.icon;
          return (
            <Link 
              key={link.name} 
              href={link.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                isActive 
                  ? 'bg-mospi-50 text-mospi-700 font-medium' 
                  : 'text-text-secondary hover:bg-panel-hover hover:text-text-primary'
              }`}
            >
              <Icon size={18} className={isActive ? 'text-mospi-600' : 'text-text-muted'} />
              {link.name}
            </Link>
          );
        })}
      </div>
    </aside>
  );
}
