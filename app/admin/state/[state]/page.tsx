'use client';

import { mockProjects } from '../../../../data/mockData';
import { Card, MetricCard } from '../../../../components/ui/Cards';
import { RiskBadge } from '../../../../components/ui/RiskBadge';
import { FolderKanban, AlertTriangle, Search, Filter, MapPin } from 'lucide-react';
import Link from 'next/link';

export default function StateViewPage({ params }: { params: { state: string } }) {
  const stateName = params.state.charAt(0).toUpperCase() + params.state.slice(1);
  const stateProjects = mockProjects.filter(p => p.state.toLowerCase() === stateName.toLowerCase());
  
  // If we don't have enough mock data for this state, fallback to all for demo purposes
  const projectsToDisplay = stateProjects.length > 0 ? stateProjects : mockProjects;
  const displayStateName = stateProjects.length > 0 ? stateName : 'All States (Demo Fallback)';

  const highRiskCount = projectsToDisplay.filter(p => p.riskLevel === 'High' || p.riskLevel === 'Critical').length;
  const avgRisk = Math.round(projectsToDisplay.reduce((acc, p) => acc + p.riskScore, 0) / (projectsToDisplay.length || 1));

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center gap-2 text-sm text-text-muted mb-2">
        <Link href="/admin/dashboard" className="hover:text-mospi-600 transition-colors">National Overview</Link>
        <span>/</span>
        <span className="text-text-primary font-medium">{displayStateName}</span>
      </div>

      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-text-primary flex items-center gap-3">
            <MapPin className="text-mospi-500" size={28} />
            {displayStateName}
          </h1>
          <p className="text-text-secondary mt-2">State-level infrastructure project monitoring</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MetricCard title="Total Projects" value={projectsToDisplay.length} icon={FolderKanban} />
        <MetricCard title="High & Critical Risk" value={highRiskCount} icon={AlertTriangle} />
        <MetricCard title="Average Risk Score" value={`${avgRisk}/100`} />
        <MetricCard title="Total Investment" value="₹1.2L Cr" subtitle="Estimated" />
      </div>

      <Card className="p-0 overflow-hidden">
        <div className="p-4 border-b border-border bg-slate-50 flex justify-between items-center flex-wrap gap-4">
          <h2 className="text-lg font-bold text-text-primary">Projects in {displayStateName}</h2>
          <div className="flex gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted w-4 h-4" />
              <input type="text" placeholder="Search..." className="pl-9 pr-4 py-1.5 text-sm border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-mospi-500" />
            </div>
            <button className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium border border-border rounded-md bg-white hover:bg-slate-50 text-text-secondary">
              <Filter size={16} /> Filters
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-text-secondary uppercase bg-white border-b border-border">
              <tr>
                <th className="px-6 py-4 font-medium">Project ID</th>
                <th className="px-6 py-4 font-medium">Project Details</th>
                <th className="px-6 py-4 font-medium">Progress</th>
                <th className="px-6 py-4 font-medium">Expenditure (₹ Cr)</th>
                <th className="px-6 py-4 font-medium">Risk Score</th>
                <th className="px-6 py-4 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-white">
              {projectsToDisplay.map((project) => (
                <tr key={project.projectId} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-mospi-600 hover:underline whitespace-nowrap">
                    <Link href={`/projects/${project.projectId}`}>{project.projectId}</Link>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-semibold text-text-primary">{project.projectName}</p>
                    <p className="text-xs text-text-muted mt-1">{project.sector} | {project.agency}</p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-full bg-slate-200 rounded-full h-2 min-w-[60px] max-w-[100px]">
                        <div className="bg-mospi-500 h-2 rounded-full" style={{ width: `${project.physicalProgress}%` }}></div>
                      </div>
                      <span className="text-xs font-medium">{project.physicalProgress}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-text-secondary whitespace-nowrap">
                    {project.expenditure} / {project.revisedCost}
                  </td>
                  <td className="px-6 py-4">
                    <RiskBadge level={project.riskLevel} />
                  </td>
                  <td className="px-6 py-4 font-medium text-text-secondary">
                    {project.status}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
