'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useAuthStore } from '../../../store/authStore';
import { apiClient } from '../../../services/api';
import { Project } from '../../../types';
import { Card, MetricCard } from '../../../components/ui/Cards';
import { RiskBadge } from '../../../components/ui/RiskBadge';
import { 
  FolderKanban, 
  AlertTriangle, 
  Clock, 
  RefreshCw, 
  AlertCircle, 
  Building2, 
  ExternalLink,
  ShieldAlert,
  Percent,
  IndianRupee,
  Search,
  SlidersHorizontal
} from 'lucide-react';

const KNOWN_AGENCIES = [
  { id: 'NHAI', name: 'National Highways Authority of India (NHAI)' },
  { id: 'MoRTH', name: 'Ministry of Road Transport and Highways (MoRTH)' },
  { id: 'NHIDCL', name: 'NH & Infrastructure Development Corp (NHIDCL)' },
  { id: 'PGCIL', name: 'Power Grid Corporation of India (PGCIL)' },
  { id: 'AAI', name: 'Airports Authority of India (AAI)' },
  { id: 'WCL', name: 'Western Coalfields Limited (WCL)' },
  { id: 'ALL', name: 'All Central Agencies (Overview)' },
];

export default function AgencyDashboard() {
  const { user } = useAuthStore();
  const [selectedAgency, setSelectedAgency] = useState('NHAI');
  const [searchTerm, setSearchTerm] = useState('');
  const [projects, setProjects] = useState<Project[]>([]);
  const [totalProjectsCount, setTotalProjectsCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);

  // Fetch real projects from FastAPI backend
  const fetchAgencyProjects = useCallback(async () => {
    setIsLoading(true);
    setApiError(null);
    try {
      // Query projects using the backend search query parameter (which filters by agency, project_code, and project_name)
      const searchQuery = selectedAgency === 'ALL' 
        ? (searchTerm.trim() || undefined)
        : searchTerm.trim() ? `${selectedAgency} ${searchTerm.trim()}` : selectedAgency;

      const res = await apiClient.getProjects({
        page: 1,
        pageSize: 25,
        search: searchQuery,
      });

      setProjects(res.projects);
      setTotalProjectsCount(res.total);
    } catch (err: unknown) {
      console.error('Failed to fetch agency projects from FastAPI:', err);
      const msg = err instanceof Error ? err.message : 'Unable to connect to FastAPI backend at http://127.0.0.1:8000';
      setApiError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [selectedAgency, searchTerm]);

  useEffect(() => {
    fetchAgencyProjects();
  }, [fetchAgencyProjects]);

  // Derived KPIs from actual API response items
  const kpis = useMemo(() => {
    if (projects.length === 0) {
      return {
        total: totalProjectsCount || 0,
        atRisk: 0,
        delayed: 0,
        avgRisk: 0,
        totalExpenditureCr: 0,
        avgProgress: 0,
      };
    }

    const total = totalProjectsCount || projects.length;
    const atRisk = projects.filter(p => p.riskLevel === 'High' || p.riskLevel === 'Critical' || p.riskScore >= 50).length;
    const delayed = projects.filter(p => (p.scheduleDelayProbability !== undefined && p.scheduleDelayProbability >= 0.5) || (p.timeOverrunDays && p.timeOverrunDays > 0)).length;
    const sumRisk = projects.reduce((acc, p) => acc + (p.riskScore || 0), 0);
    const avgRisk = Math.round(sumRisk / projects.length);
    const sumExpenditure = projects.reduce((acc, p) => acc + (p.currentExpenditure || 0), 0);
    const sumProgress = projects.reduce((acc, p) => acc + (p.physicalProgress || 0), 0);
    const avgProgress = Math.round(sumProgress / projects.length);

    return {
      total,
      atRisk,
      delayed,
      avgRisk,
      totalExpenditureCr: Math.round(sumExpenditure),
      avgProgress,
    };
  }, [projects, totalProjectsCount]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Executing Agency Portfolio Dashboard
            </h1>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300">
              Agency View
            </span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">
            Live project surveillance, risk indicators, and milestone tracking for implementing CPSEs
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => fetchAgencyProjects()}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors shadow-sm disabled:opacity-50"
            title="Refresh Data from API"
          >
            <RefreshCw size={13} className={isLoading ? 'animate-spin text-mospi-600' : ''} />
            <span>Refresh</span>
          </button>
          <div className="text-xs text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm font-medium">
            Status: <span className={apiError ? 'text-red-500 font-bold' : 'text-emerald-600 dark:text-emerald-400 font-bold'}>{apiError ? 'Offline' : 'Live API'}</span>
          </div>
        </div>
      </div>

      {/* Required Authentication Limitation Notice */}
      <div className="bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 p-3.5 rounded-xl text-xs text-amber-800 dark:text-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-sm">
        <div className="flex items-center gap-2">
          <Building2 size={16} className="text-amber-600 dark:text-amber-400 shrink-0" />
          <span>
            <strong>Access Clearance:</strong> Authenticated via backend JWT RBAC. Surveillance filtered to your authorized agency jurisdiction.
          </span>
        </div>
        <span className="font-mono text-[11px] bg-amber-100 dark:bg-amber-900/60 px-2 py-0.5 rounded text-amber-900 dark:text-amber-100 shrink-0 font-medium">

          Logged in: {user?.email || 'agency01'}
        </span>
      </div>

      {/* Backend Offline Banner */}
      {apiError && (
        <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 p-4 rounded-xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3" role="alert">
          <div className="flex items-start sm:items-center gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5 sm:mt-0" />
            <div>
              <p className="text-sm font-bold text-red-800 dark:text-red-200">
                FastAPI Connection Error
              </p>
              <p className="text-xs text-red-600 dark:text-red-300 mt-0.5">
                {apiError}. Verify the backend service is running on port 8000.
              </p>
            </div>
          </div>
          <button
            onClick={() => fetchAgencyProjects()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-100 hover:bg-red-200 dark:bg-red-900/50 dark:hover:bg-red-900 text-red-800 dark:text-red-200 text-xs font-semibold rounded-lg transition-colors shrink-0"
          >
            <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} />
            Retry Connection
          </button>
        </div>
      )}

      {/* Agency Selector & Search Controls */}
      <Card className="p-4 sm:p-5">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex-1 w-full flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="flex items-center gap-2 shrink-0">
              <SlidersHorizontal size={16} className="text-slate-500 dark:text-slate-400" />
              <label htmlFor="agency-select" className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                Executing Agency:
              </label>
            </div>
            <select
              id="agency-select"
              value={selectedAgency}
              onChange={(e) => setSelectedAgency(e.target.value)}
              className="w-full sm:w-80 px-3 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:border-mospi-500 focus:ring-1 focus:ring-mospi-500 font-semibold text-slate-800 dark:text-slate-100"
            >
              {KNOWN_AGENCIES.map((agency) => (
                <option key={agency.id} value={agency.id}>
                  {agency.name}
                </option>
              ))}
            </select>
          </div>

          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search project code or title..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:border-mospi-500 focus:ring-1 focus:ring-mospi-500 transition-colors"
            />
          </div>
        </div>
      </Card>

      {/* Agency KPIs (Dynamically Derived from FastAPI Response) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        <MetricCard 
          title="Total Projects" 
          value={kpis.total.toLocaleString()} 
          subtitle="Portfolio assets"
          icon={FolderKanban} 
        />
        <MetricCard 
          title="Projects at Risk" 
          value={kpis.atRisk.toLocaleString()} 
          subtitle="High / Critical tier" 
          trend={kpis.atRisk > 0 ? "up" : "neutral"}
          icon={ShieldAlert} 
        />
        <MetricCard 
          title="Delayed Projects" 
          value={kpis.delayed.toLocaleString()} 
          subtitle="Schedule delay >= 50%" 
          trend={kpis.delayed > 0 ? "up" : "neutral"}
          icon={Clock} 
        />
        <MetricCard 
          title="Average Risk" 
          value={`${kpis.avgRisk} / 100`} 
          subtitle="Agency mean score" 
          trend="neutral" 
          icon={AlertTriangle} 
        />
        <MetricCard 
          title="Avg Progress" 
          value={`${kpis.avgProgress}%`} 
          subtitle="Physical progress" 
          trend="neutral" 
          icon={Percent} 
        />
        <MetricCard 
          title="Expenditure" 
          value={`₹${kpis.totalExpenditureCr.toLocaleString()} Cr`} 
          subtitle="Cumulative spent" 
          trend="neutral" 
          icon={IndianRupee} 
        />
      </div>

      {/* Agency Projects Directory Table */}
      <Card className="p-0 overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-850 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Assigned Agency Projects ({projects.length} displayed of {totalProjectsCount.toLocaleString()})
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Live multi-hazard ML risk profiles, schedule slip probability, and anomaly alerts from FastAPI
            </p>
          </div>
          <span className="text-xs font-mono bg-white dark:bg-slate-800 px-2.5 py-1 rounded border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 self-start sm:self-auto">
            Agency Filter: {selectedAgency}
          </span>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 dark:text-slate-400 uppercase bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-4 py-3 font-semibold">Project Code</th>
                <th className="px-4 py-3 font-semibold">Name & State</th>
                <th className="px-4 py-3 font-semibold">Physical Progress</th>
                <th className="px-4 py-3 font-semibold">Expenditure / Budget</th>
                <th className="px-4 py-3 font-semibold">Overall Risk</th>
                <th className="px-4 py-3 font-semibold">Schedule Delay</th>
                <th className="px-4 py-3 font-semibold">Cost Overrun</th>
                <th className="px-4 py-3 font-semibold">Priority</th>
                <th className="px-4 py-3 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
              {projects.map((project) => (
                <tr key={project.projectId} className="hover:bg-slate-50 dark:hover:bg-slate-850/60 transition-colors group">
                  <td className="px-4 py-3.5 font-mono font-bold text-xs text-mospi-600 dark:text-mospi-400">
                    <Link href={`/admin/project/${project.projectId}`} className="hover:underline flex items-center gap-1">
                      <span>{project.projectId}</span>
                      <ExternalLink size={11} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                    </Link>
                  </td>
                  <td className="px-4 py-3.5 max-w-[220px]">
                    <p className="font-semibold text-slate-900 dark:text-white truncate text-xs sm:text-sm" title={project.projectName}>
                      {project.projectName}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                      {project.state} • {project.agency || selectedAgency}
                    </p>
                  </td>
                  <td className="px-4 py-3.5 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <div className="w-16 bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                        <div 
                          className="bg-mospi-500 h-2 rounded-full transition-all duration-300" 
                          style={{ width: `${Math.min(100, Math.max(0, project.physicalProgress || 0))}%` }} 
                        />
                      </div>
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        {project.physicalProgress}%
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 whitespace-nowrap text-xs">
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      ₹{project.currentExpenditure?.toLocaleString() || 0} Cr
                    </span>
                    <span className="text-slate-400 dark:text-slate-500 text-[11px]">
                      {' '}/ ₹{project.totalBudget?.toLocaleString() || '—'} Cr
                    </span>
                  </td>
                  <td className="px-4 py-3.5 whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <span className="font-extrabold text-xs text-slate-900 dark:text-white">
                        {project.riskScore}
                      </span>
                      <RiskBadge level={project.riskLevel} />
                    </div>
                  </td>
                  <td className="px-4 py-3.5 whitespace-nowrap text-xs">
                    <span className={`font-semibold ${
                      (project.scheduleDelayProbability || 0) >= 0.7 
                        ? 'text-red-600 dark:text-red-400' 
                        : (project.scheduleDelayProbability || 0) >= 0.4 
                        ? 'text-amber-600 dark:text-amber-400' 
                        : 'text-emerald-600 dark:text-emerald-400'
                    }`}>
                      {project.scheduleDelayProbability !== undefined 
                        ? `${Math.round(project.scheduleDelayProbability * 100)}%` 
                        : '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 whitespace-nowrap text-xs">
                    <span className={`font-semibold ${
                      (project.costOverrunProbability || 0) >= 0.7 
                        ? 'text-red-600 dark:text-red-400' 
                        : (project.costOverrunProbability || 0) >= 0.4 
                        ? 'text-amber-600 dark:text-amber-400' 
                        : 'text-emerald-600 dark:text-emerald-400'
                    }`}>
                      {project.costOverrunProbability !== undefined 
                        ? `${Math.round(project.costOverrunProbability * 100)}%` 
                        : '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 whitespace-nowrap text-xs">
                    <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      {project.interventionPriority || 'P3-MONITOR'}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-right whitespace-nowrap">
                    <Link 
                      href={`/admin/project/${project.projectId}`} 
                      className="inline-flex items-center gap-1 bg-white dark:bg-slate-800 border border-mospi-300 dark:border-mospi-700 text-mospi-600 dark:text-mospi-400 hover:bg-mospi-50 dark:hover:bg-slate-750 px-2.5 py-1 rounded-lg text-xs font-bold transition-colors shadow-sm"
                    >
                      <span>Inspect</span>
                      <ExternalLink size={11} />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {projects.length === 0 && !isLoading && (
            <div className="py-12 text-center text-slate-400 dark:text-slate-500 text-sm">
              {apiError ? 'Unable to load projects from backend API.' : `No projects found for agency "${selectedAgency}".`}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
