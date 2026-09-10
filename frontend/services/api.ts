/**
 * frontend/services/api.ts - Production API Client for FastAPI Backend.
 * Connects Next.js frontend to /api/v1/ endpoints, translating existing repository dataset
 * and ML predictions into frontend typed interfaces.
 */

import {
  Project,
  StateStats,
  MonthlyMonitoring,
  RiskAnalysis,
  Alert,
  BenchmarkData,
  RiskLevel,
  ProjectStatus,
  AlertSeverity,
  AlertStatus,
  User,
  Role,
} from '../types';

// In browser, use relative path (proxied by Next.js rewrites); in SSR, use direct backend URL
const getBaseUrl = (): string => {
  if (typeof window !== 'undefined') {
    return '/api/v1';
  }
  return process.env.INTERNAL_API_URL || 'http://127.0.0.1:8000/api/v1';
};

const TOKEN_KEY = 'paimana_access_token';
let memoryToken: string | null = null;

export const authStorage = {
  getToken(): string | null {
    if (typeof window !== 'undefined') {
      try {
        return localStorage.getItem(TOKEN_KEY) || memoryToken;
      } catch {
        return memoryToken;
      }
    }
    return memoryToken;
  },
  setToken(token: string | null): void {
    memoryToken = token;
    if (typeof window !== 'undefined') {
      try {
        if (token) {
          localStorage.setItem(TOKEN_KEY, token);
        } else {
          localStorage.removeItem(TOKEN_KEY);
        }
      } catch {
        // ignore storage errors
      }
    }
  },
  clearToken(): void {
    this.setToken(null);
  },
};

/** Authenticated fetch wrapper that injects Bearer token if present */
async function fetchWithAuth(url: string, init: RequestInit = {}): Promise<Response> {
  const token = authStorage.getToken();
  const headers = new Headers(init.headers || {});
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  return fetch(url, {
    ...init,
    headers,
  });
}


/** Convert backend ProjectDetail / ProjectSummary to frontend Project interface */
export function mapBackendToProject(item: any): Project {
  const riskScore = Math.round(item.overall_risk_score ?? 0);
  let riskLevel: RiskLevel = 'Low';
  const rU = String(item.risk_level || '').toUpperCase();
  if (rU === 'CRITICAL') riskLevel = 'Critical';
  else if (rU === 'HIGH') riskLevel = 'High';
  else if (rU === 'MEDIUM') riskLevel = 'Medium';

  let status: ProjectStatus = 'On Track';
  const st = String(item.status || '');
  if (st === 'Critical') status = 'Critical';
  else if (st === 'Delayed') status = 'Delayed';
  else if (st === 'Watch') status = 'Watch';

  return {
    projectId: item.project_code,
    projectName: item.project_name || `Project ${item.project_code}`,
    ministry: item.ministry || 'Ministry of Infrastructure',
    agency: item.agency || 'Central CPSE',
    state: item.state || 'Multi-State',
    sector: item.sector || (item.agency ? `${item.agency} Sector` : 'Infrastructure'),
    originalCost: item.original_cost_cr ?? 0,
    revisedCost: item.revised_cost_cr ?? item.original_cost_cr ?? 0,
    startDate: item.start_date || undefined,
    originalCompletionDate: item.original_completion_date || '2026-12-31',
    revisedCompletionDate: item.revised_completion_date || '2027-03-31',
    physicalProgress: item.physical_progress_pct ?? 0,
    plannedProgress: item.elapsed_duration_pct ?? undefined,
    expenditure: item.cumulative_expenditure_cr ?? 0,
    status,
    riskScore,
    riskLevel,
    costOverrunRisk: item.cost_overrun_probability != null ? Math.round(item.cost_overrun_probability * 100) : undefined,
    timeOverrunRisk: item.schedule_delay_probability != null ? Math.round(item.schedule_delay_probability * 100) : undefined,
    costOverrunProbability: item.cost_overrun_probability != null ? item.cost_overrun_probability : undefined,
    scheduleDelayProbability: item.schedule_delay_probability != null ? item.schedule_delay_probability : undefined,
    currentExpenditure: item.cumulative_expenditure_cr ?? 0,
    totalBudget: item.revised_cost_cr ?? item.original_cost_cr ?? 0,
    anomalyStatus: item.anomaly_status || undefined,
    interventionPriority: item.intervention_priority || undefined,
    timeOverrunDays: item.time_overrun_days != null ? Math.round(item.time_overrun_days) : undefined,
    dataStatus: item.data_status || 'SYNTHETIC / DEMONSTRATION',
  };
}

export interface DashboardOverviewResponse {
  totalProjects: number;
  highRiskProjects: number;
  criticalRiskProjects: number;
  delayedProjects: number;
  averageRiskScore: number;
  riskDistribution: {
    LOW: number;
    MEDIUM: number;
    HIGH: number;
    CRITICAL: number;
  };
  stateSummaries: Array<{
    stateName: string;
    totalProjects: number;
    highRiskProjects: number;
    criticalRiskProjects: number;
    delayedProjects: number;
    averageRiskScore: number;
    dominantRiskLevel: string;
  }>;
  recentAlerts: Alert[];
  riskTrend: Array<{
    month: string;
    averageRiskScore: number;
    delayedPercentage: number;
    totalActiveProjects: number;
  }>;
  dataStatus: string;
}

export const apiClient = {
  /** Authenticate user and store JWT token */
  async login(credentials: { username: string; password: string }): Promise<{
    access_token: string;
    token_type: string;
    user: {
      username: string;
      role: Role;
      name: string;
      email: string;
      organization?: string;
      scoped_agency?: string;
    };
  }> {
    const res = await fetch(`${getBaseUrl()}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Authentication failed' }));
      throw new Error(err.detail || 'Authentication failed');
    }
    const data = await res.json();
    authStorage.setToken(data.access_token);
    return data;
  },

  /** Rehydrate current user profile from token */
  async getMe(): Promise<User | null> {
    const token = authStorage.getToken();
    if (!token) return null;
    try {
      const res = await fetchWithAuth(`${getBaseUrl()}/auth/me`, { cache: 'no-store' });
      if (!res.ok) {
        if (res.status === 401) {
          authStorage.clearToken();
        }
        return null;
      }
      const u = await res.json();
      return {
        id: u.username,
        name: u.name,
        email: u.email,
        role: u.role as Role,
        organizationId: u.organization,
        scopedAgency: u.scoped_agency,
      };
    } catch {
      return null;
    }
  },

  /** Health check */
  async getHealth(): Promise<{ status: string; total_projects: number; data_loaded: boolean }> {
    const res = await fetchWithAuth(`${getBaseUrl()}/health`, { cache: 'no-store' });
    if (!res.ok) throw new Error(`Health check failed: ${res.statusText}`);
    return res.json();
  },

  /** National Dashboard Overview */
  async getDashboardOverview(): Promise<DashboardOverviewResponse> {
    const res = await fetchWithAuth(`${getBaseUrl()}/dashboard/overview`, { cache: 'no-store' });
    if (!res.ok) throw new Error(`Dashboard fetch failed: ${res.statusText}`);
    const data = await res.json();

    return {
      totalProjects: data.total_projects,
      highRiskProjects: data.high_risk_projects,
      criticalRiskProjects: data.critical_risk_projects,
      delayedProjects: data.delayed_projects,
      averageRiskScore: data.average_risk_score,
      riskDistribution: data.risk_distribution,
      stateSummaries: data.state_summaries.map((s: any) => ({
        stateName: s.state_name,
        totalProjects: s.total_projects,
        highRiskProjects: s.high_risk_projects,
        criticalRiskProjects: s.critical_risk_projects,
        delayedProjects: s.delayed_projects,
        averageRiskScore: s.average_risk_score,
        dominantRiskLevel: s.dominant_risk_level,
      })),
      recentAlerts: (data.recent_alerts || []).map((a: any) => ({
        alertId: a.alert_id,
        projectId: a.project_code,
        severity: a.severity as AlertSeverity,
        type: a.alert_type,
        message: a.message,
        responsibleAuthority: a.agency || 'Implementing Authority',
        status: (a.status as AlertStatus) || 'New',
        createdAt: a.created_at,
      })),
      riskTrend: (data.risk_trend || []).map((t: any) => ({
        month: t.month,
        averageRiskScore: t.average_risk_score,
        delayedPercentage: t.delayed_percentage,
        totalActiveProjects: t.total_active_projects,
      })),
      dataStatus: data.data_status,
    };
  },

  /** Paginated Projects List with filters */
  async getProjects(params?: {
    page?: number;
    pageSize?: number;
    state?: string;
    riskLevel?: string;
    delayedOnly?: boolean;
    search?: string;
  }): Promise<{ projects: Project[]; total: number; page: number; totalPages: number }> {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', String(params.page));
    if (params?.pageSize) query.set('page_size', String(params.pageSize));
    if (params?.state && params.state !== 'All') query.set('state', params.state);
    if (params?.riskLevel && params.riskLevel !== 'All') query.set('risk_level', params.riskLevel);
    if (params?.delayedOnly) query.set('delayed_only', 'true');
    if (params?.search) query.set('search', params.search);

    const res = await fetchWithAuth(`${getBaseUrl()}/projects?${query.toString()}`, { cache: 'no-store' });
    if (!res.ok) throw new Error(`Projects fetch failed: ${res.statusText}`);
    const data = await res.json();

    return {
      projects: (data.items || []).map(mapBackendToProject),
      total: data.pagination.total_items,
      page: data.pagination.page,
      totalPages: data.pagination.total_pages,
    };
  },

  /** Single Project Detail */
  async getProjectDetail(projectCode: string): Promise<Project | null> {
    try {
      const res = await fetchWithAuth(`${getBaseUrl()}/projects/${encodeURIComponent(projectCode)}`, { cache: 'no-store' });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error(`Project detail fetch failed: ${res.statusText}`);
      const data = await res.json();
      return mapBackendToProject(data);
    } catch {
      return null;
    }
  },

  /** Project Longitudinal Observation History */
  async getProjectHistory(projectCode: string): Promise<MonthlyMonitoring[]> {
    try {
      const res = await fetchWithAuth(`${getBaseUrl()}/projects/${encodeURIComponent(projectCode)}/history`, { cache: 'no-store' });
      if (!res.ok) return [];
      const history = await res.json();
      return history.map((h: any) => ({
        projectId: projectCode,
        month: h.report_date,
        plannedProgress: Math.round(h.elapsed_duration_pct || 0),
        actualProgress: Math.round(h.physical_progress_pct || 0),
        monthlyExpenditure: Math.round(h.cumulative_expenditure_cr / (h.report_month_num || 1)),
        cumulativeExpenditure: Math.round(h.cumulative_expenditure_cr || 0),
        milestoneStatus: h.time_overrun_flag === 1 ? 'Delayed' : 'On Track',
      }));
    } catch {
      return [];
    }
  },

  /** State Details for Map and State page */
  async getStateDetails(stateName: string): Promise<StateStats | null> {
    try {
      const res = await fetchWithAuth(`${getBaseUrl()}/states/${encodeURIComponent(stateName)}`, { cache: 'no-store' });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error(`State details fetch failed: ${res.statusText}`);
      const data = await res.json();

      return {
        stateName: data.state_name,
        totalProjects: data.total_projects,
        highRiskProjects: data.high_risk_projects,
        criticalRiskProjects: data.critical_risk_projects,
        costRiskProjects: data.cost_risk_projects,
        timeRiskProjects: data.time_risk_projects,
        averageRisk: Math.round(data.average_risk),
        riskLevel: data.risk_level,
        sectorDistribution: (data.agency_distribution || []).map((a: any) => ({
          name: a.agency,
          value: a.count,
        })),
      };
    } catch {
      return null;
    }
  },

  /** All States and UTs Summary List */
  async getStates(): Promise<Array<{
    stateName: string;
    totalProjects: number;
    highRiskProjects: number;
    criticalRiskProjects: number;
    delayedProjects: number;
    averageRiskScore: number;
    dominantRiskLevel: string;
  }>> {
    const res = await fetchWithAuth(`${getBaseUrl()}/states`, { cache: 'no-store' });
    if (!res.ok) throw new Error(`States fetch failed: ${res.statusText}`);
    const list = await res.json();
    return list.map((s: any) => ({
      stateName: s.state_name,
      totalProjects: s.total_projects,
      highRiskProjects: s.high_risk_projects,
      criticalRiskProjects: s.critical_risk_projects,
      delayedProjects: s.delayed_projects,
      averageRiskScore: s.average_risk_score,
      dominantRiskLevel: s.dominant_risk_level,
    }));
  },

  /** Early Warning Alerts */
  async getAlerts(params?: { severity?: string; limit?: number }): Promise<Alert[]> {
    try {
      const query = new URLSearchParams();
      if (params?.severity && params.severity !== 'All') query.set('severity', params.severity);
      if (params?.limit) query.set('limit', String(params.limit));

      const res = await fetchWithAuth(`${getBaseUrl()}/alerts?${query.toString()}`, { cache: 'no-store' });
      if (!res.ok) return [];
      const data = await res.json();

      return (data.alerts || []).map((a: any) => ({
        alertId: a.alert_id,
        projectId: a.project_code,
        severity: a.severity as AlertSeverity,
        type: a.alert_type,
        message: a.message,
        responsibleAuthority: a.agency || 'Implementing Authority',
        status: (a.status as AlertStatus) || 'New',
        createdAt: a.created_at,
      }));
    } catch {
      return [];
    }
  },

  /** Project Risk Analysis & SHAP Drivers */
  async getProjectRisk(projectCode: string): Promise<RiskAnalysis | null> {
    try {
      const res = await fetchWithAuth(`${getBaseUrl()}/projects/${encodeURIComponent(projectCode)}/risk`, { cache: 'no-store' });
      if (!res.ok) return null;
      const data = await res.json();

      let riskLevel: RiskLevel = 'Low';
      const rU = String(data.risk_level || '').toUpperCase();
      if (rU === 'CRITICAL') riskLevel = 'Critical';
      else if (rU === 'HIGH') riskLevel = 'High';
      else if (rU === 'MEDIUM') riskLevel = 'Medium';

      return {
        projectId: projectCode,
        costRisk: Math.round((data.cost_overrun_probability ?? 0) * 100),
        timeRisk: Math.round((data.schedule_delay_probability ?? 0) * 100),
        overallRisk: Math.round(data.overall_risk_score ?? 0),
        riskLevel,
        predictedDelay: Math.round((data.overall_risk_score ?? 0) / 10),
        riskTrend: [
          Math.max(0, Math.round(data.overall_risk_score - 10)),
          Math.max(0, Math.round(data.overall_risk_score - 5)),
          Math.round(data.overall_risk_score),
        ],
        drivers: (data.top_risk_drivers || []).map((d: any) => ({
          factor: d.feature.replace(/_/g, ' ').toUpperCase(),
          impact: Math.round(Math.abs(d.impact) * 10),
        })),
        recommendations: [
          'Conduct immediate executive milestone review with PMC engineers',
          'Audit contractor monthly utilization against certified physical milestones',
        ],
      };
    } catch {
      return null;
    }
  },

  /** Project Benchmarking Comparison */
  async getBenchmarking(projectCode: string): Promise<BenchmarkData | null> {
    try {
      const res = await fetchWithAuth(`${getBaseUrl()}/benchmarking?project_code=${encodeURIComponent(projectCode)}`, { cache: 'no-store' });
      if (!res.ok) return null;
      const data = await res.json();

      return {
        projectId: projectCode,
        stateAverageRisk: Math.round(data.state_average_risk),
        sectorAverageRisk: Math.round(data.agency_average_risk ?? data.portfolio_average_risk),
        ministryAverageRisk: Math.round(data.portfolio_average_risk),
        stateAverageProgress: Math.round(data.state_average_progress),
        sectorAverageProgress: Math.round(data.agency_average_progress ?? data.portfolio_average_progress),
        ministryAverageProgress: Math.round(data.portfolio_average_progress),
      };
    } catch {
      return null;
    }
  },
};

