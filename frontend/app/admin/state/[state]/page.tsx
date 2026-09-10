'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Card, MetricCard } from '../../../../components/ui/Cards';
import { RiskBadge } from '../../../../components/ui/RiskBadge';
import { FolderKanban, AlertTriangle, TrendingUp, Clock, ArrowLeft, Search, Filter } from 'lucide-react';
import { getProjectsByState, getStateStatistics, normalizeStateName } from '../../../../data/mockData';
import { apiClient } from '../../../../services/api';
import { Project, StateStats } from '../../../../types';

export default function StateViewPage() {
  const params = useParams();
  // Decode URL parameter e.g., 'andhra-pradesh' -> 'Andhra Pradesh'
  const rawStateParam = typeof params.state === 'string' ? params.state : '';
  const stateName = normalizeStateName(
    rawStateParam
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  );

  const [searchTerm, setSearchTerm] = useState('');
  const [filterSector, setFilterSector] = useState('All');
  const [filterRisk, setFilterRisk] = useState('All');

  const [stats, setStats] = useState<StateStats>(() => getStateStatistics(stateName));
  const [allProjects, setAllProjects] = useState<Project[]>(() => getProjectsByState(stateName));

  useEffect(() => {
    let isMounted = true;
    async function fetchStateData() {
      try {
        const [stateDetails, projectsRes] = await Promise.allSettled([
          apiClient.getStateDetails(stateName),
          apiClient.getProjects({ state: stateName, pageSize: 200 }),
        ]);

        if (isMounted && stateDetails.status === 'fulfilled' && stateDetails.value) {
          setStats(stateDetails.value);
        }

        if (isMounted && projectsRes.status === 'fulfilled' && projectsRes.value.projects.length > 0) {
          setAllProjects(projectsRes.value.projects);
        }
      } catch (err) {
        console.warn('Live state fetch error, using preloaded data:', err);
      }
    }

    fetchStateData();
    return () => { isMounted = false; };
  }, [stateName]);

  // Derive filter options dynamically
  const sectors = ['All', ...Array.from(new Set(allProjects.map(p => p.sector)))];
  const riskLevels = ['All', 'Low', 'Medium', 'High', 'Critical'];

  const filteredProjects = allProjects.filter(p => {
    const matchesSearch = p.projectName.toLowerCase().includes(searchTerm.toLowerCase()) || p.projectId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSector = filterSector === 'All' || p.sector === filterSector;
    const matchesRisk = filterRisk === 'All' || p.riskLevel === filterRisk;
    return matchesSearch && matchesSector && matchesRisk;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div>
        <Link href="/admin/dashboard" className="inline-flex items-center text-sm font-medium text-mospi-600 hover:text-mospi-700 mb-4 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to Dashboard
        </Link>
        <h1 className="text-3xl font-bold text-text-primary uppercase tracking-wide">{stateName}</h1>
        <p className="text-sm text-text-secondary mt-1">Infrastructure Project Monitoring Overview</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MetricCard title="Total Projects" value={stats.totalProjects} icon={FolderKanban} />
        <MetricCard title="High-Risk Projects" value={stats.highRiskProjects} icon={AlertTriangle} trend={stats.highRiskProjects > 0 ? "down" : "neutral"} />
        <MetricCard title="Cost-Risk Projects" value={stats.costRiskProjects} icon={TrendingUp} trend={stats.costRiskProjects > 0 ? "down" : "neutral"} />
        <MetricCard title="Time-Risk Projects" value={stats.timeRiskProjects} icon={Clock} trend={stats.timeRiskProjects > 0 ? "down" : "neutral"} />
      </div>

      {/* Analytics Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="p-6 col-span-1">
          <h2 className="text-lg font-bold text-text-primary mb-4">Overall State Risk Indicator</h2>
          <div className="flex flex-col items-center justify-center py-6">
            <div className={`text-6xl font-black mb-2 ${
              stats.averageRisk > 60 ? 'text-red-600' : stats.averageRisk > 40 ? 'text-orange-500' : 'text-emerald-500'
            }`}>
              {stats.averageRisk}
            </div>
            <div className="text-sm font-medium text-text-secondary uppercase tracking-widest">Avg Risk Score</div>
            
            <div className="mt-8 w-full">
               <h3 className="text-sm font-bold text-text-primary mb-3 border-b pb-1">Risk Distribution</h3>
               <div className="space-y-3">
                 {['Critical', 'High', 'Medium', 'Low'].map(level => {
                   const count = allProjects.filter(p => p.riskLevel === level).length;
                   const pct = allProjects.length > 0 ? Math.round((count / allProjects.length) * 100) : 0;
                   return (
                     <div key={level} className="flex items-center text-sm">
                       <span className="w-16 font-medium text-text-secondary">{level}</span>
                       <div className="flex-1 h-2 bg-slate-100 rounded-full mx-3 overflow-hidden">
                         <div className={`h-full ${
                           level === 'Critical' ? 'bg-red-600' : 
                           level === 'High' ? 'bg-orange-500' : 
                           level === 'Medium' ? 'bg-amber-400' : 'bg-emerald-500'
                         }`} style={{ width: `${pct}%` }}></div>
                       </div>
                       <span className="w-8 text-right font-medium">{count}</span>
                     </div>
                   )
                 })}
               </div>
            </div>
          </div>
        </Card>

        <Card className="p-6 col-span-1 lg:col-span-2">
          <h2 className="text-lg font-bold text-text-primary mb-4">Sector Distribution</h2>
          <div className="h-64 flex flex-col justify-center">
             <div className="space-y-4 max-y-auto overflow-y-auto pr-2">
               {stats.sectorDistribution.sort((a,b) => b.value - a.value).map(sector => {
                 const pct = Math.round((sector.value / stats.totalProjects) * 100);
                 return (
                   <div key={sector.name}>
                     <div className="flex justify-between text-sm mb-1">
                       <span className="font-medium text-text-primary">{sector.name}</span>
                       <span className="text-text-secondary">{sector.value} projects ({pct}%)</span>
                     </div>
                     <div className="w-full bg-slate-100 rounded-full h-2">
                       <div className="bg-mospi-500 h-2 rounded-full" style={{ width: `${pct}%` }}></div>
                     </div>
                   </div>
                 )
               })}
             </div>
          </div>
        </Card>
      </div>

      {/* Project List */}
      <Card className="p-0 overflow-hidden">
        <div className="p-6 border-b border-border bg-slate-50/50">
          <h2 className="text-lg font-bold text-text-primary mb-4 uppercase tracking-wide">Projects in {stateName}</h2>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted w-4 h-4" />
              <input 
                type="text" 
                placeholder="Search by project code or name..." 
                className="w-full pl-9 pr-4 py-2 text-sm border border-border rounded-md focus:outline-none focus:border-mospi-500 focus:ring-1 focus:ring-mospi-500 bg-white"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="flex gap-4">
              <div className="flex items-center gap-2 bg-white border border-border rounded-md px-3 py-2">
                <Filter className="w-4 h-4 text-text-muted" />
                <select 
                  className="text-sm bg-transparent border-none focus:outline-none text-text-primary font-medium"
                  value={filterSector}
                  onChange={e => setFilterSector(e.target.value)}
                >
                  {sectors.map(s => <option key={s} value={s}>{s === 'All' ? 'All Sectors' : s}</option>)}
                </select>
              </div>
              <div className="flex items-center gap-2 bg-white border border-border rounded-md px-3 py-2">
                <Filter className="w-4 h-4 text-text-muted" />
                <select 
                  className="text-sm bg-transparent border-none focus:outline-none text-text-primary font-medium"
                  value={filterRisk}
                  onChange={e => setFilterRisk(e.target.value)}
                >
                  {riskLevels.map(r => <option key={r} value={r}>{r === 'All' ? 'All Risks' : r}</option>)}
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-text-secondary uppercase bg-slate-50 border-y border-border">
              <tr>
                <th className="px-6 py-4 font-medium">Project</th>
                <th className="px-6 py-4 font-medium">Sector & Ministry</th>
                <th className="px-6 py-4 font-medium text-right">Cost (₹ Cr)</th>
                <th className="px-6 py-4 font-medium text-center">Progress</th>
                <th className="px-6 py-4 font-medium text-center">Risk Level</th>
                <th className="px-6 py-4 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredProjects.map((project) => (
                <tr key={project.projectId} className="hover:bg-mospi-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <Link href={`/admin/project/${project.projectId}`} className="block">
                      <div className="font-bold text-mospi-600 group-hover:underline">{project.projectId}</div>
                      <div className="text-text-primary font-medium mt-1 line-clamp-2 max-w-xs">{project.projectName}</div>
                    </Link>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-text-primary">{project.sector}</div>
                    <div className="text-xs text-text-secondary mt-1 max-w-xs">{project.ministry}</div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="font-bold text-text-primary">₹{project.revisedCost.toLocaleString()}</div>
                    <div className="text-xs text-text-muted mt-1">Orig: ₹{project.originalCost.toLocaleString()}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col items-center">
                      <div className="text-lg font-bold text-text-primary">{project.physicalProgress}%</div>
                      <div className="w-24 h-1.5 bg-slate-200 rounded-full mt-2 overflow-hidden">
                        <div className="bg-mospi-500 h-full rounded-full" style={{ width: `${project.physicalProgress}%` }}></div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex flex-col items-center gap-1">
                      <RiskBadge level={project.riskLevel} />
                      <span className="text-xs font-bold text-text-muted mt-1">Score: {project.riskScore}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 text-xs font-bold rounded-full ${
                      project.status === 'Critical' ? 'bg-red-100 text-red-700' : 
                      project.status === 'Delayed' ? 'bg-orange-100 text-orange-700' :
                      project.status === 'Watch' ? 'bg-amber-100 text-amber-700' :
                      'bg-emerald-100 text-emerald-700'
                    }`}>
                      {project.status}
                    </span>
                  </td>
                </tr>
              ))}
              {filteredProjects.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-text-muted">
                    <div className="flex flex-col items-center justify-center">
                      <FolderKanban className="w-12 h-12 mb-3 text-slate-300" />
                      <p className="font-medium">No projects found matching the criteria</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
