'use client';

import { useAuthStore } from '../../../store/authStore';
import { mockProjects } from '../../../data/mockData';
import { Card, MetricCard } from '../../../components/ui/Cards';

import { FolderKanban, CheckCircle } from 'lucide-react';
import Link from 'next/link';

export default function AgencyDashboard() {
  const { user } = useAuthStore();
  
  const myProjects = mockProjects.filter(p => user?.assignedProjectIds?.includes(p.projectId));
  const onTrackProjects = myProjects.filter(p => p.status === 'On Track');

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Contractor Dashboard</h1>
        <p className="text-sm text-text-secondary mt-1">Manage and report on your assigned projects.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <MetricCard title="Assigned Projects" value={myProjects.length} icon={FolderKanban} />
        <MetricCard title="Projects On Track" value={onTrackProjects.length} icon={CheckCircle} />
      </div>

      <Card className="p-0 overflow-hidden">
        <div className="p-4 border-b border-border bg-slate-50">
          <h2 className="text-lg font-bold text-text-primary">Action Required: Monthly Updates</h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-text-secondary uppercase bg-white border-b border-border">
              <tr>
                <th className="px-6 py-4 font-medium">Project ID</th>
                <th className="px-6 py-4 font-medium">Name</th>
                <th className="px-6 py-4 font-medium">Current Progress</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-white">
              {myProjects.map((project) => (
                <tr key={project.projectId} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-mospi-600 hover:underline cursor-pointer">
                    <Link href={`/projects/${project.projectId}`}>{project.projectId}</Link>
                  </td>
                  <td className="px-6 py-4 font-medium text-text-primary max-w-sm">
                    {project.projectName}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-full max-w-[100px] bg-slate-200 rounded-full h-2">
                        <div className="bg-mospi-500 h-2 rounded-full" style={{ width: `${project.physicalProgress}%` }}></div>
                      </div>
                      <span className="text-xs font-medium">{project.physicalProgress}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link href={`/projects/${project.projectId}/monthly-update`} className="bg-white border border-mospi-300 text-mospi-600 hover:bg-mospi-50 px-3 py-1.5 rounded text-xs font-medium transition-colors">
                      Submit Update
                    </Link>
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
  );
}
