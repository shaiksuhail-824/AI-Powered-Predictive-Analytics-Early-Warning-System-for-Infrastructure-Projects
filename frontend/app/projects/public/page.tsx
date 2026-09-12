'use client';

import { mockProjects } from '../../../data/mockData';
import { Card } from '../../../components/ui/Cards';
import { Search, Filter, Globe } from 'lucide-react';
import Navbar from '../../../components/layout/Navbar';
import { useState } from 'react';

export default function PublicProjectsPage() {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredProjects = mockProjects.filter(p => 
    p.projectName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.state.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 overflow-y-auto p-6">
        <div className="space-y-6 max-w-7xl mx-auto">
          <div className="bg-mospi-50 p-8 rounded-lg border border-mospi-100 flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h1 className="text-2xl font-bold text-text-primary flex items-center gap-3">
                <Globe className="text-mospi-500" size={28} />
                Public Project View
              </h1>
              <p className="text-text-secondary mt-2 max-w-2xl">
                Explore basic information regarding national infrastructure projects. 
                Detailed predictive AI analytics, financial data, and preventive action recommendations are restricted to authorized government personnel.
              </p>
            </div>
          </div>

          <Card className="p-0 overflow-hidden shadow-sm">
            <div className="p-4 border-b border-border bg-slate-50 flex justify-between items-center flex-wrap gap-4">
              <div className="flex gap-2 w-full md:w-auto">
                <div className="relative flex-1 md:w-80">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted w-4 h-4" />
                  <input 
                    type="text" 
                    placeholder="Search by project name or state..." 
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 text-sm border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-mospi-500" 
                  />
                </div>
                <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium border border-border rounded-md bg-white hover:bg-slate-50 text-text-secondary transition-colors whitespace-nowrap">
                  <Filter size={16} /> Filters
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-text-secondary uppercase bg-white border-b border-border">
                  <tr>
                    <th className="px-6 py-4 font-medium">Project Name</th>
                    <th className="px-6 py-4 font-medium">State</th>
                    <th className="px-6 py-4 font-medium">Sector</th>
                    <th className="px-6 py-4 font-medium">Ministry</th>
                    <th className="px-6 py-4 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border bg-white">
                  {filteredProjects.map((project) => (
                    <tr key={project.projectId} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-semibold text-text-primary max-w-md">{project.projectName}</p>
                      </td>
                      <td className="px-6 py-4 text-text-secondary">
                        {project.state}
                      </td>
                      <td className="px-6 py-4 text-text-secondary">
                        {project.sector}
                      </td>
                      <td className="px-6 py-4 text-text-secondary">
                        {project.ministry}
                      </td>
                      <td className="px-6 py-4 font-medium text-text-secondary">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          project.status === 'Critical' ? 'bg-red-100 text-red-800' : 
                          project.status === 'Delayed' ? 'bg-amber-100 text-amber-800' :
                          project.status === 'Watch' ? 'bg-blue-100 text-blue-800' :
                          'bg-emerald-100 text-emerald-800'
                        }`}>
                          {project.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredProjects.length === 0 && (
                <div className="py-12 text-center text-text-muted text-sm">No projects found matching your search.</div>
              )}
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}
