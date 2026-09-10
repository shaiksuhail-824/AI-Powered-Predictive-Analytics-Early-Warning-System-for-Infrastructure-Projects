'use client';

import { mockProjects, mockAlerts } from '../../../data/mockData';
import { Card, MetricCard } from '../../../components/ui/Cards';
import { RiskBadge } from '../../../components/ui/RiskBadge';
import { RiskTrendChart } from '../../../components/charts/RiskTrendChart';
import { IndiaMapInteractive } from '../../../components/dashboard/IndiaMapInteractive';
import { FolderKanban, AlertTriangle, Clock, TrendingUp, Search } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { useAppStore } from '../../../store/appStore';

export default function AdminDashboard() {
  const [searchTerm, setSearchTerm] = useState('');
  const { filters } = useAppStore();
  
  const totalProjects = mockProjects.length;
  const highRiskProjects = mockProjects.filter(p => p.riskLevel === 'High' || p.riskLevel === 'Critical');
  const delayedProjects = mockProjects.filter(p => p.status === 'Delayed' || p.status === 'Critical');
  const activeAlerts = mockAlerts.filter(a => a.status !== 'Resolved');

  const filteredProjects = mockProjects.filter(p => {
    const searchMatch = p.projectName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                        p.projectId.toLowerCase().includes(searchTerm.toLowerCase());
    const stateMatch = filters.state === 'All' || p.state === filters.state;
    return searchMatch && stateMatch;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">National Overview</h1>
          <p className="text-sm text-text-secondary mt-1">Central dashboard for all infrastructure projects</p>
        </div>
        <div className="text-sm text-text-muted bg-white px-3 py-1.5 rounded-md border border-border">
          Last updated: Today, 09:00 AM
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MetricCard title="Total Projects" value={totalProjects} icon={FolderKanban} />
        <MetricCard title="High & Critical Risk" value={highRiskProjects.length} subtitle="+2 this month" trend="up" icon={AlertTriangle} />
        <MetricCard title="Delayed Projects" value={delayedProjects.length} subtitle="Schedule slippage detected" trend="neutral" icon={Clock} />
        <MetricCard title="Active Alerts" value={activeAlerts.length} subtitle="Requires attention" trend="neutral" icon={TrendingUp} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content Area */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-text-primary">India Project Risk Map (Mock)</h2>
              {filters.state !== 'All' && (
                <Link href={`/admin/state/${filters.state.toLowerCase().replace(/\s+/g, '-')}`} className="text-sm text-mospi-600 font-medium hover:underline">
                  View Detailed {filters.state} Report →
                </Link>
              )}
            </div>
            <div className="h-[500px] w-full bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-center overflow-hidden relative">
               <IndiaMapInteractive />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-text-primary">
                {filters.state === 'All' ? 'National Project Overview' : `Projects in ${filters.state}`}
              </h2>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted w-4 h-4" />
                <input 
                  type="text" 
                  placeholder="Search projects..." 
                  className="w-full pl-9 pr-4 py-2 text-sm border border-border rounded-md focus:outline-none focus:border-mospi-500 focus:ring-1 focus:ring-mospi-500"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-text-secondary uppercase bg-slate-50 border-y border-border">
                  <tr>
                    <th className="px-4 py-3 font-medium">Project ID</th>
                    <th className="px-4 py-3 font-medium">Name</th>
                    <th className="px-4 py-3 font-medium">State</th>
                    <th className="px-4 py-3 font-medium">Risk Score</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredProjects.slice(0, 5).map((project) => (
                    <tr key={project.projectId} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 font-medium text-mospi-600 hover:underline cursor-pointer">
                        <Link href={`/admin/project/${project.projectId}`}>{project.projectId}</Link>
                      </td>
                      <td className="px-4 py-3 font-medium text-text-primary max-w-[200px] truncate" title={project.projectName}>
                        {project.projectName}
                      </td>
                      <td className="px-4 py-3 text-text-secondary">{project.state}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-text-primary">{project.riskScore}</span>
                          <RiskBadge level={project.riskLevel} />
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-medium ${project.status === 'Critical' ? 'text-red-600' : 'text-amber-600'}`}>
                          {project.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredProjects.length === 0 && (
                <div className="py-8 text-center text-text-muted text-sm">No projects found.</div>
              )}
            </div>
          </Card>
        </div>

        {/* Sidebar Analytics */}
        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="text-lg font-bold text-text-primary mb-4">Overall Risk Trend</h2>
            <RiskTrendChart data={[42, 45, 43, 48, 55, 62, 58, 65, 72, 75]} />
            <p className="text-xs text-text-muted mt-4 text-center">National average risk score over last 10 months</p>
          </Card>

          <Card className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-text-primary">Recent Alerts</h2>
              <Link href="/alerts" className="text-xs text-mospi-600 hover:underline font-medium">View All</Link>
            </div>
            <div className="space-y-4">
              {activeAlerts.slice(0, 4).map(alert => (
                <div key={alert.alertId} className="flex gap-3 pb-4 border-b border-border last:border-0 last:pb-0">
                  <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${alert.severity === 'Critical' ? 'bg-red-600' : 'bg-amber-500'}`}></div>
                  <div>
                    <p className="text-sm font-medium text-text-primary leading-snug">{alert.message}</p>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs text-text-muted">{alert.projectId}</span>
                      <span className="text-xs text-mospi-600 font-medium cursor-pointer hover:underline">Take Action</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
