'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Card, MetricCard } from '../../../components/ui/Cards';
import { RiskBadge } from '../../../components/ui/RiskBadge';
import { RiskTrendChart } from '../../../components/charts/RiskTrendChart';
import { IndiaMapInteractive } from '../../../components/dashboard/IndiaMapInteractive';
import { 
  FolderKanban, 
  AlertTriangle, 
  Clock, 
  TrendingUp, 
  Search, 
  ShieldAlert, 
  RefreshCw, 
  AlertCircle,
  ExternalLink,
  Activity,
  Layers,
  ChevronRight
} from 'lucide-react';
import { useAppStore } from '../../../store/appStore';
import { apiClient, DashboardOverviewResponse } from '../../../services/api';
import { Project, Alert } from '../../../types';

export default function AdminDashboard() {
  const { filters } = useAppStore();
  const [searchTerm, setSearchTerm] = useState('');
  
  const [overview, setOverview] = useState<DashboardOverviewResponse | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [totalProjectsCount, setTotalProjectsCount] = useState<number>(0);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [trendData, setTrendData] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // Load Primary Dashboard API Data
  const loadDashboardData = useCallback(async () => {
    setIsLoading(true);
    setApiError(null);
    try {
      const [overviewData, alertsData] = await Promise.all([
        apiClient.getDashboardOverview(),
        apiClient.getAlerts({ limit: 6 }),
      ]);

      setOverview(overviewData);
      setAlerts(alertsData.length > 0 ? alertsData : overviewData.recentAlerts || []);

      if (overviewData.riskTrend && overviewData.riskTrend.length > 0) {
        setTrendData(overviewData.riskTrend.map(t => Math.round(t.averageRiskScore)));
      } else {
        setTrendData([]);
      }
    } catch (err: unknown) {
      console.error('Failed to load FastAPI dashboard overview:', err);
      const msg = err instanceof Error ? err.message : 'Unable to connect to FastAPI backend at http://127.0.0.1:8000';
      setApiError(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial Data Fetch
  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Debounced API Project Search & Filtering
  useEffect(() => {
    let active = true;
    setIsSearching(true);
    const timeout = setTimeout(async () => {
      try {
        const res = await apiClient.getProjects({
          page: 1,
          pageSize: 10,
          search: searchTerm.trim() || undefined,
          state: filters.state !== 'All' ? filters.state : undefined,
        });
        if (active) {
          setProjects(res.projects);
          setTotalProjectsCount(res.total);
        }
      } catch (err: unknown) {
        if (active) {
          console.warn('Projects search API query failed:', err);
          const msg = err instanceof Error ? err.message : 'Failed to query projects from API';
          setApiError(prev => prev || msg);
        }
      } finally {
        if (active) setIsSearching(false);
      }
    }, 250);

    return () => {
      active = false;
      clearTimeout(timeout);
    };
  }, [searchTerm, filters.state]);

  // Compute Risk Distribution breakdown from API response
  const dist = overview?.riskDistribution;
  const distTotal = dist ? (dist.LOW + dist.MEDIUM + dist.HIGH + dist.CRITICAL) : 0;
  const lowPct = distTotal > 0 && dist ? Math.round((dist.LOW / distTotal) * 100) : 0;
  const medPct = distTotal > 0 && dist ? Math.round((dist.MEDIUM / distTotal) * 100) : 0;
  const highPct = distTotal > 0 && dist ? Math.round((dist.HIGH / distTotal) * 100) : 0;
  const critPct = distTotal > 0 && dist ? Math.round((dist.CRITICAL / distTotal) * 100) : 0;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              National Infrastructure Overview
            </h1>
            {overview?.dataStatus && (
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                {overview.dataStatus}
              </span>
            )}
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">
            Central ML-powered predictive analytics & early warning system
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => loadDashboardData()}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors shadow-sm disabled:opacity-50"
            title="Refresh API Data"
          >
            <RefreshCw size={13} className={isLoading ? 'animate-spin text-mospi-600' : ''} />
            <span>Refresh</span>
          </button>
          <div className="text-xs text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm font-medium">
            Status: <span className={apiError ? 'text-red-500 font-bold' : 'text-emerald-600 dark:text-emerald-400 font-bold'}>{apiError ? 'Offline' : 'Connected to FastAPI'}</span>
          </div>
        </div>
      </div>

      {/* Backend Connection Error Banner */}
      {apiError && (
        <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 p-4 rounded-xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3" role="alert">
          <div className="flex items-start sm:items-center gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5 sm:mt-0" />
            <div>
              <p className="text-sm font-bold text-red-800 dark:text-red-200">
                FastAPI Backend Connection Error
              </p>
              <p className="text-xs text-red-600 dark:text-red-300 mt-0.5">
                {apiError}. Verify the uvicorn daemon is running on port 8000.
              </p>
            </div>
          </div>
          <button
            onClick={() => loadDashboardData()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-100 hover:bg-red-200 dark:bg-red-900/50 dark:hover:bg-red-900 text-red-800 dark:text-red-200 text-xs font-semibold rounded-lg transition-colors shrink-0"
          >
            <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} />
            Retry Connection
          </button>
        </div>
      )}

      {/* Dynamic API Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        <MetricCard 
          title="Total Projects" 
          value={overview ? overview.totalProjects.toLocaleString() : '—'} 
          subtitle="Monitored central assets"
          icon={FolderKanban} 
        />
        <MetricCard 
          title="Critical Risk" 
          value={overview ? overview.criticalRiskProjects.toLocaleString() : '—'} 
          subtitle="Score >= 75" 
          trend="up" 
          icon={ShieldAlert} 
        />
        <MetricCard 
          title="High Risk" 
          value={overview ? overview.highRiskProjects.toLocaleString() : '—'} 
          subtitle="Score 50-74" 
          trend="neutral" 
          icon={AlertTriangle} 
        />
        <MetricCard 
          title="Delayed Projects" 
          value={overview ? overview.delayedProjects.toLocaleString() : '—'} 
          subtitle="Time overrun flagged" 
          trend="neutral" 
          icon={Clock} 
        />
        <MetricCard 
          title="Average Risk" 
          value={overview ? `${Math.round(overview.averageRiskScore)} / 100` : '—'} 
          subtitle="National mean score" 
          trend="neutral" 
          icon={Activity} 
        />
        <MetricCard 
          title="Active Alerts" 
          value={alerts.length > 0 ? alerts.length : (overview?.recentAlerts?.length ?? '—')} 
          subtitle="Unresolved early warnings" 
          trend="neutral" 
          icon={TrendingUp} 
        />
      </div>

      {/* Risk Distribution Breakdown Bar (FastAPI API Backed) */}
      <Card className="p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-mospi-600" />
            <h2 className="text-sm sm:text-base font-bold text-slate-800 dark:text-white">
              National Portfolio Risk Distribution
            </h2>
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            FastAPI Distribution Source: {distTotal.toLocaleString()} Indexed Projects
          </span>
        </div>

        {/* Multi-segment distribution progress bar */}
        <div className="w-full h-3.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex shadow-inner">
          <div 
            className="bg-emerald-500 h-full transition-all duration-500" 
            style={{ width: `${lowPct}%` }} 
            title={`Low Risk: ${dist?.LOW || 0} (${lowPct}%)`}
          />
          <div 
            className="bg-amber-500 h-full transition-all duration-500" 
            style={{ width: `${medPct}%` }} 
            title={`Medium Risk: ${dist?.MEDIUM || 0} (${medPct}%)`}
          />
          <div 
            className="bg-orange-500 h-full transition-all duration-500" 
            style={{ width: `${highPct}%` }} 
            title={`High Risk: ${dist?.HIGH || 0} (${highPct}%)`}
          />
          <div 
            className="bg-red-600 h-full transition-all duration-500" 
            style={{ width: `${critPct}%` }} 
            title={`Critical Risk: ${dist?.CRITICAL || 0} (${critPct}%)`}
          />
        </div>

        {/* Legend / Metrics breakdown */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
          <div className="flex items-center gap-2.5 p-2.5 rounded-lg bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40">
            <span className="w-3 h-3 rounded-full bg-emerald-500 shrink-0"></span>
            <div>
              <p className="text-[11px] font-semibold text-emerald-800 dark:text-emerald-300 uppercase tracking-wide">
                Low (0–24)
              </p>
              <p className="text-sm font-extrabold text-slate-900 dark:text-white">
                {dist ? dist.LOW.toLocaleString() : '—'}{' '}
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">({lowPct}%)</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 p-2.5 rounded-lg bg-amber-50/60 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/40">
            <span className="w-3 h-3 rounded-full bg-amber-500 shrink-0"></span>
            <div>
              <p className="text-[11px] font-semibold text-amber-800 dark:text-amber-300 uppercase tracking-wide">
                Medium (25–49)
              </p>
              <p className="text-sm font-extrabold text-slate-900 dark:text-white">
                {dist ? dist.MEDIUM.toLocaleString() : '—'}{' '}
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">({medPct}%)</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 p-2.5 rounded-lg bg-orange-50/60 dark:bg-orange-950/20 border border-orange-100 dark:border-orange-900/40">
            <span className="w-3 h-3 rounded-full bg-orange-500 shrink-0"></span>
            <div>
              <p className="text-[11px] font-semibold text-orange-800 dark:text-orange-300 uppercase tracking-wide">
                High (50–74)
              </p>
              <p className="text-sm font-extrabold text-slate-900 dark:text-white">
                {dist ? dist.HIGH.toLocaleString() : '—'}{' '}
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">({highPct}%)</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 p-2.5 rounded-lg bg-red-50/60 dark:bg-red-950/20 border border-red-100 dark:border-red-900/40">
            <span className="w-3 h-3 rounded-full bg-red-600 shrink-0"></span>
            <div>
              <p className="text-[11px] font-semibold text-red-800 dark:text-red-300 uppercase tracking-wide">
                Critical (75–100)
              </p>
              <p className="text-sm font-extrabold text-slate-900 dark:text-white">
                {dist ? dist.CRITICAL.toLocaleString() : '—'}{' '}
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">({critPct}%)</span>
              </p>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content Area: Interactive Map & Live Projects Table */}
        <div className="lg:col-span-2 space-y-6">
          {/* India Map connected dynamically to API State Summaries */}
          <IndiaMapInteractive stateSummaries={overview?.stateSummaries} />

          {/* Live Projects Table with Backend Search */}
          <Card className="p-5 sm:p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  {filters.state === 'All' ? 'National Projects Directory' : `Projects in ${filters.state}`}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Showing {projects.length} of {totalProjectsCount.toLocaleString()} matching central projects from FastAPI
                </p>
              </div>

              {/* Live Search Input connected to API */}
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input 
                  type="text" 
                  placeholder="Search project code, name, agency..." 
                  className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:border-mospi-500 focus:ring-1 focus:ring-mospi-500 transition-colors"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
                {isSearching && (
                  <RefreshCw className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 w-3.5 h-3.5 animate-spin" />
                )}
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-slate-500 dark:text-slate-400 uppercase bg-slate-50/80 dark:bg-slate-800/80 border-y border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Project Code</th>
                    <th className="px-4 py-3 font-semibold">Name & Agency</th>
                    <th className="px-4 py-3 font-semibold">State</th>
                    <th className="px-4 py-3 font-semibold">Risk Score</th>
                    <th className="px-4 py-3 font-semibold">Delay Probability</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {projects.map((project) => (
                    <tr key={project.projectId} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                      <td className="px-4 py-3 font-mono font-medium text-mospi-600 dark:text-mospi-400 group-hover:underline">
                        <Link href={`/admin/project/${project.projectId}`} className="flex items-center gap-1">
                          <span>{project.projectId}</span>
                          <ExternalLink size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                        </Link>
                      </td>
                      <td className="px-4 py-3 max-w-[240px]">
                        <p className="font-semibold text-slate-900 dark:text-white truncate" title={project.projectName}>
                          {project.projectName}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                          {project.agency || 'Central Implementing Agency'}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300 whitespace-nowrap text-xs">
                        {project.state}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 dark:text-white">{project.riskScore}</span>
                          <RiskBadge level={project.riskLevel} />
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`text-xs font-semibold ${
                          (project.scheduleDelayProbability || 0) >= 0.7 
                            ? 'text-red-600 dark:text-red-400' 
                            : (project.scheduleDelayProbability || 0) >= 0.4 
                            ? 'text-amber-600 dark:text-amber-400' 
                            : 'text-emerald-600 dark:text-emerald-400'
                        }`}>
                          {project.scheduleDelayProbability !== undefined 
                            ? `${Math.round(project.scheduleDelayProbability * 100)}%`
                            : 'N/A'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {projects.length === 0 && !isSearching && (
                <div className="py-10 text-center text-slate-400 dark:text-slate-500 text-sm">
                  {apiError ? 'Unable to load projects from backend.' : 'No projects match your filter criteria.'}
                </div>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Live Central Repository Database Query
              </span>
              <Link 
                href="/projects" 
                className="text-xs text-mospi-600 dark:text-mospi-400 hover:text-mospi-700 font-bold flex items-center gap-1"
              >
                <span>View Full Projects Directory</span>
                <ChevronRight size={14} />
              </Link>
            </div>
          </Card>
        </div>

        {/* Sidebar Analytics: Longitudinal Risk Trend & Recent Alerts */}
        <div className="space-y-6">
          {/* Longitudinal Risk Trend Chart */}
          <Card className="p-5 sm:p-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                National Risk Trend
              </h2>
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                15 Months
              </span>
            </div>
            {trendData.length > 0 ? (
              <>
                <RiskTrendChart data={trendData} />
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-3 text-center">
                  Longitudinal national average risk trend from FastAPI historical aggregation
                </p>
              </>
            ) : (
              <div className="h-48 flex items-center justify-center text-xs text-slate-400 dark:text-slate-500">
                {apiError ? 'Trend data unavailable (Backend offline)' : 'No historical trend records found'}
              </div>
            )}
          </Card>

          {/* Recent Alerts from FastAPI GET /api/v1/alerts */}
          <Card className="p-5 sm:p-6">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Active Alerts
                </h2>
              </div>
              <Link href="/alerts" className="text-xs text-mospi-600 dark:text-mospi-400 hover:underline font-bold">
                View All
              </Link>
            </div>

            <div className="space-y-3">
              {alerts.slice(0, 4).map((alert) => (
                <div 
                  key={alert.alertId} 
                  className="p-3 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-100 dark:border-slate-800 flex flex-col gap-1.5 transition-all hover:shadow-sm"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs font-bold text-mospi-600 dark:text-mospi-400">
                      <Link href={`/admin/project/${alert.projectId}`} className="hover:underline">
                        {alert.projectId}
                      </Link>
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                      alert.severity === 'Critical' 
                        ? 'bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300' 
                        : alert.severity === 'High'
                        ? 'bg-orange-100 text-orange-700 dark:bg-orange-950/60 dark:text-orange-300'
                        : 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                    }`}>
                      {alert.severity}
                    </span>
                  </div>

                  <p className="text-xs text-slate-800 dark:text-slate-200 font-medium leading-relaxed">
                    {alert.message}
                  </p>

                  <div className="flex items-center justify-between pt-1 text-[11px] text-slate-500 dark:text-slate-400">
                    <span className="truncate max-w-[150px]">{alert.responsibleAuthority}</span>
                    <Link 
                      href={`/admin/project/${alert.projectId}`}
                      className="text-mospi-600 dark:text-mospi-400 hover:underline font-bold flex items-center gap-0.5"
                    >
                      <span>Inspect</span>
                      <ExternalLink size={10} />
                    </Link>
                  </div>
                </div>
              ))}

              {alerts.length === 0 && (
                <div className="py-6 text-center text-xs text-slate-400 dark:text-slate-500">
                  {apiError ? 'Alerts service unavailable.' : 'No active alerts detected.'}
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
