'use client';

import { useAuthStore } from '../../../store/authStore';
import { mockProjects, mockAlerts } from '../../../data/mockData';
import { Card, MetricCard } from '../../../components/ui/Cards';
import { RiskBadge } from '../../../components/ui/RiskBadge';
import { FolderKanban, AlertTriangle, Clock } from 'lucide-react';
import Link from 'next/link';

export default function MinistryDashboard() {
  const { user } = useAuthStore();
  
  // Filter projects for this ministry only
  const myProjects = mockProjects.filter(p => user?.assignedProjectIds?.includes(p.projectId));
  
  const highRiskProjects = myProjects.filter(p => p.riskLevel === 'High' || p.riskLevel === 'Critical');

  const myAlerts = mockAlerts.filter(a => user?.assignedProjectIds?.includes(a.projectId) && a.status !== 'Resolved');

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Ministry Dashboard</h1>
        <p className="text-sm text-text-secondary mt-1">Overview of your authorized projects.</p>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard title="My Projects" value={myProjects.length} icon={FolderKanban} />
        <MetricCard title="High & Critical Risk" value={highRiskProjects.length} trend="up" icon={AlertTriangle} />
        <MetricCard title="Active Alerts" value={myAlerts.length} trend="neutral" icon={Clock} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content Area */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-text-primary">My Assigned Projects</h2>
              <Link href="/projects" className="text-sm text-mospi-600 font-medium hover:underline">View All</Link>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-text-secondary uppercase bg-slate-50 border-y border-border">
                  <tr>
                    <th className="px-4 py-3 font-medium">Project ID</th>
                    <th className="px-4 py-3 font-medium">Name</th>
                    <th className="px-4 py-3 font-medium">State</th>
                    <th className="px-4 py-3 font-medium">Risk</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {myProjects.map((project) => (
                    <tr key={project.projectId} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 font-medium text-mospi-600 hover:underline cursor-pointer">
                        <Link href={`/projects/${project.projectId}`}>{project.projectId}</Link>
                      </td>
                      <td className="px-4 py-3 font-medium text-text-primary max-w-[200px] truncate" title={project.projectName}>
                        {project.projectName}
                      </td>
                      <td className="px-4 py-3 text-text-secondary">{project.state}</td>
                      <td className="px-4 py-3">
                        <RiskBadge level={project.riskLevel} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {myProjects.length === 0 && (
                <div className="py-8 text-center text-text-muted text-sm">No projects assigned.</div>
              )}
            </div>
          </Card>
        </div>

        {/* Sidebar Analytics */}
        <div className="space-y-6">
          <Card className="p-6 border-amber-200 bg-amber-50">
            <h2 className="text-lg font-bold text-amber-900 mb-4 flex items-center gap-2">
              <AlertTriangle size={18} /> Require Attention
            </h2>
            <div className="space-y-3">
              {highRiskProjects.length > 0 ? (
                highRiskProjects.map(p => (
                  <div key={p.projectId} className="bg-white p-3 border border-amber-200 rounded text-sm">
                    <p className="font-semibold text-text-primary truncate">{p.projectName}</p>
                    <p className="text-xs text-text-muted mt-1">Risk: {p.riskLevel} ({p.riskScore}/100)</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-text-muted">No high-risk projects.</p>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
