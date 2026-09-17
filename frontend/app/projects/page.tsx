'use client';

import { useAuthStore } from '../../store/authStore';
import { mockProjects } from '../../data/mockData';
import { Card } from '../../components/ui/Cards';
import { RiskBadge } from '../../components/ui/RiskBadge';
import { FolderKanban, Search, Filter } from 'lucide-react';
import Link from 'next/link';
import Navbar from '../../components/layout/Navbar';
import Sidebar from '../../components/layout/Sidebar';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ProjectsPage() {
  const { user, isAuthenticated } = useAuthStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (!isAuthenticated) {
      if (typeof window !== 'undefined') {
        window.location.replace('/login');
      } else {
        router.push('/login');
      }
    }
  }, [isAuthenticated, router]);

  if (!mounted || !isAuthenticated) {
    return <div className="min-h-screen flex items-center justify-center bg-background">Loading...</div>;
  }

  // Filter projects based on role
  let projectsToDisplay = mockProjects;
  if (user?.role === 'MINISTRY_PROJECT_HEAD' || user?.role === 'AGENCY_CONTRACTOR') {
    projectsToDisplay = mockProjects.filter(p => user.assignedProjectIds?.includes(p.projectId));
  }

  const filteredProjects = projectsToDisplay.filter(p => 
    p.projectName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.projectId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.state.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredProjects.length / pageSize) || 1;
  const paginatedProjects = filteredProjects.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <Sidebar />
      <main className="flex-1 w-full max-w-full p-4 sm:p-6 lg:p-8">
        <div className="space-y-6 max-w-7xl mx-auto">
            <div>
              <h1 className="text-2xl font-bold text-text-primary flex items-center gap-3">
                <FolderKanban className="text-mospi-500" size={28} />
                {user?.role === 'ADMIN' ? 'All Projects' : 'My Projects'}
              </h1>
              <p className="text-text-secondary mt-1">View and manage your infrastructure projects.</p>
            </div>

            <Card className="p-0 overflow-hidden">
              <div className="p-4 border-b border-border bg-slate-50 flex justify-between items-center flex-wrap gap-4">
                <div className="flex gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted w-4 h-4" />
                    <input 
                      type="text" 
                      placeholder="Search projects..." 
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                      className="pl-9 pr-4 py-1.5 text-sm border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-mospi-500" 
                    />
                  </div>
                  <button className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium border border-border rounded-md bg-white hover:bg-slate-50 text-text-secondary transition-colors">
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
                      <th className="px-6 py-4 font-medium">Risk Score</th>
                      <th className="px-6 py-4 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border bg-white">
                    {paginatedProjects.map((project) => (
                      <tr key={project.projectId} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 font-medium text-mospi-600 hover:underline whitespace-nowrap">
                          <Link href={`/projects/${project.projectId}`}>{project.projectId}</Link>
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-semibold text-text-primary max-w-sm">{project.projectName}</p>
                          <p className="text-xs text-text-muted mt-1">{project.state} | {project.sector}</p>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className="w-full bg-slate-200 rounded-full h-2 min-w-[60px] max-w-[100px]">
                              <div className="bg-mospi-500 h-2 rounded-full" style={{ width: `${project.physicalProgress}%` }}></div>
                            </div>
                            <span className="text-xs font-medium">{project.physicalProgress}%</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <RiskBadge level={project.riskLevel} />
                        </td>
                        <td className="px-6 py-4 font-medium text-text-secondary">
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

              {/* Pagination footer */}
              <div className="p-4 border-t border-border bg-slate-50 flex justify-between items-center text-sm">
                <span className="text-text-muted">
                  Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, filteredProjects.length)} of {filteredProjects.length} projects
                </span>
                <div className="flex gap-2">
                  <button
                    disabled={currentPage <= 1}
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    className="px-3 py-1.5 border border-border rounded bg-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50"
                  >
                    Previous
                  </button>
                  <span className="px-3 py-1.5 font-medium text-text-primary">
                    {currentPage} / {totalPages}
                  </span>
                  <button
                    disabled={currentPage >= totalPages}
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    className="px-3 py-1.5 border border-border rounded bg-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            </Card>
          </div>
        </main>
    </div>
  );
}
