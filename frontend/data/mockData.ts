import { Project, User, MonthlyMonitoring, RiskAnalysis, Alert, ActionTicket, BenchmarkData, StateStats } from '../types';
import realProjectsRaw from './realProjects.json';

export const mockUsers: User[] = [
  {
    id: 'u1',
    name: 'Admin User',
    email: 'admin01', // As requested for demo
    role: 'ADMIN',
  },
  {
    id: 'u2',
    name: 'Ministry Official',
    email: 'ministry01', // As requested for demo
    role: 'MINISTRY_PROJECT_HEAD',
    organizationId: 'MIN-INFRA',
    assignedProjectIds: ['060100093', '180100210', '080200004'],
  },
  {
    id: 'u3',
    name: 'Contractor Rep',
    email: 'agency01', // As requested for demo
    role: 'AGENCY_CONTRACTOR',
    organizationId: 'AGN-CENTRAL',
    assignedProjectIds: ['060100093', '080200004'],
  },
];

export const mockProjects: Project[] = realProjectsRaw as unknown as Project[];

export const mockRiskAnalysis: RiskAnalysis[] = [
  {
    projectId: 'PRJ-001',
    costRisk: 65,
    timeRisk: 82,
    overallRisk: 78,
    riskLevel: 'High',
    predictedDelay: 6,
    riskTrend: [45, 50, 55, 62, 70, 78],
    drivers: [
      { factor: 'Expenditure growth rate exceeds physical progress', impact: 45 },
      { factor: 'Schedule slippage in land acquisition phase', impact: 30 },
      { factor: 'Delayed milestone: Bridge Construction', impact: 25 },
    ],
    recommendations: [
      'Review delayed bridge construction milestone to identify execution bottlenecks.',
      'Audit contractor resource allocation for the Nellore segment.',
      'Escalate land acquisition delays to the state revenue department.',
    ],
  },
  {
    projectId: 'PRJ-002',
    costRisk: 88,
    timeRisk: 95,
    overallRisk: 85,
    riskLevel: 'Critical',
    predictedDelay: 18,
    riskTrend: [60, 65, 72, 78, 82, 85],
    drivers: [
      { factor: 'Stagnant physical progress', impact: 50 },
      { factor: 'Significant milestone delays in tunneling', impact: 35 },
      { factor: 'Escalating material costs', impact: 15 },
    ],
    recommendations: [
      'Immediate high-level review of tunneling operations required.',
      'Re-assess cost baseline due to material cost inflation.',
    ],
  },
  {
    projectId: 'PRJ-005',
    costRisk: 95,
    timeRisk: 90,
    overallRisk: 92,
    riskLevel: 'Critical',
    predictedDelay: 24,
    riskTrend: [80, 82, 85, 88, 90, 92],
    drivers: [
      { factor: 'Cost overrun significantly exceeds revised estimates', impact: 60 },
      { factor: 'Project age (8+ years delayed)', impact: 25 },
      { factor: 'Rehabilitation and resettlement delays', impact: 15 },
    ],
    recommendations: [
      'Expedite pending R&R packages with state authorities.',
      'Freeze further design changes to prevent scope creep.',
    ],
  }
];

export const mockAlerts: Alert[] = [
  {
    alertId: 'ALT-101',
    projectId: 'PRJ-001',
    severity: 'High',
    type: 'Time Overrun Warning',
    message: 'Time-overrun risk crossed the predefined threshold of 80%.',
    responsibleAuthority: 'Project Director, NHAI AP',
    status: 'New',
    createdAt: '2026-09-08T10:00:00Z',
  },
  {
    alertId: 'ALT-102',
    projectId: 'PRJ-002',
    severity: 'Critical',
    type: 'Cost Overrun Alert',
    message: 'Projected cost overrun indicates an impending budget shortfall.',
    responsibleAuthority: 'Managing Director, NHSRCL',
    status: 'Escalated',
    createdAt: '2026-09-05T14:30:00Z',
  },
  {
    alertId: 'ALT-103',
    projectId: 'PRJ-005',
    severity: 'Critical',
    type: 'Stagnant Progress',
    message: 'Physical progress has remained stagnant at 72% for 3 consecutive months.',
    responsibleAuthority: 'CEO, Polavaram Project Authority',
    status: 'Assigned',
    createdAt: '2026-09-01T09:15:00Z',
  }
];

export const mockActionTickets: ActionTicket[] = [
  {
    ticketId: 'TCK-201',
    alertId: 'ALT-103',
    projectId: 'PRJ-005',
    assignedTo: 'Chief Engineer',
    dueDate: '2026-09-15T00:00:00Z',
    action: 'Investigate reasons for stalled work at the main dam site and submit a recovery plan.',
    status: 'In Progress',
  }
];

export const getMockHistoricalData = (projectId: string): MonthlyMonitoring[] => {
  // Generate 12 months of historical data based on project ID to keep it deterministic
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  let currentPlanned = 10;
  let currentActual = 5;
  let currentExp = 1000;
  
  return months.map((month, index) => {
    // Fake trend generation
    currentPlanned += Math.random() * 8 + 2; // 2 to 10%
    currentActual += Math.random() * 6 + 1;  // 1 to 7%
    currentExp += Math.random() * 500 + 100;
    
    if (currentPlanned > 100) currentPlanned = 100;
    if (currentActual > 100) currentActual = 100;

    return {
      projectId,
      month: `${month} 2025`,
      plannedProgress: Math.round(currentPlanned),
      actualProgress: Math.round(currentActual),
      monthlyExpenditure: Math.round(Math.random() * 300 + 50),
      cumulativeExpenditure: Math.round(currentExp),
      milestoneStatus: index % 4 === 0 ? 'Delayed' : 'On Track',
    };
  });
};

// ==========================================
// FRONTEND SERVICE LAYER (MOCK API)
// ==========================================

export const getProjects = (): Project[] => {
  return mockProjects;
};

export function normalizeStateName(state: string): string {
  if (!state) return '';
  const s = state.trim().toLowerCase();
  
  if (s === 'jammu & kashmir' || s === 'jammu and kashmir') return 'Jammu and Kashmir';
  if (s.includes('dadra') || s.includes('daman') || s.includes('diu')) {
    return 'Dadra and Nagar Haveli and Daman and Diu';
  }
  if (s === 'andaman & nicobar islands' || s === 'andaman and nicobar islands' || s.includes('andaman')) {
    return 'Andaman and Nicobar Islands';
  }
  if (s === 'delhi' || s === 'nct of delhi' || s === 'national capital territory of delhi') {
    return 'Delhi';
  }
  if (s === 'odisha' || s === 'orissa') return 'Odisha';
  if (s === 'uttarakhand' || s === 'uttaranchal') return 'Uttarakhand';
  if (s === 'puducherry' || s === 'pondicherry') return 'Puducherry';
  if (s === 'telengana' || s === 'telangana') return 'Telangana';
  if (s === 'ladakh') return 'Ladakh';
  if (s === 'chandigarh') return 'Chandigarh';
  if (s === 'lakshadweep') return 'Lakshadweep';

  return state
    .trim()
    .split(/\s+/)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

export function getRiskLevel(score: number): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
  if (score >= 75) return 'CRITICAL';
  if (score >= 50) return 'HIGH';
  if (score >= 25) return 'MEDIUM';
  return 'LOW';
}

export const getProjectsByState = (state: string): Project[] => {
  const target = normalizeStateName(state).toLowerCase();
  return mockProjects.filter(p => normalizeStateName(p.state).toLowerCase() === target);
};

export const getProjectByCode = (projectCode: string): Project | undefined => {
  return mockProjects.find(p => p.projectId === projectCode);
};

export const getProjectHistory = (projectCode: string): MonthlyMonitoring[] => {
  return getMockHistoricalData(projectCode);
};

export const getProjectRisk = (projectCode: string): RiskAnalysis | undefined => {
  // If specific risk doesn't exist in mock, generate a deterministic one based on the project
  const existing = mockRiskAnalysis.find(r => r.projectId === projectCode);
  if (existing) return existing;
  
  const p = getProjectByCode(projectCode);
  if (!p) return undefined;
  
  return {
    projectId: projectCode,
    costRisk: p.costOverrunRisk || p.riskScore + 5,
    timeRisk: p.timeOverrunRisk || p.riskScore + 10,
    overallRisk: p.riskScore,
    riskLevel: p.riskLevel,
    predictedDelay: p.riskScore > 60 ? Math.round(p.riskScore / 10) : 0,
    riskTrend: [p.riskScore - 15, p.riskScore - 10, p.riskScore - 5, p.riskScore, p.riskScore + 2, p.riskScore],
    drivers: [
      { factor: 'Schedule slippage against planned milestones', impact: Math.round(p.riskScore * 0.8) },
      { factor: 'Expenditure rate vs physical progress gap', impact: Math.round(p.riskScore * 0.6) },
      { factor: 'Recent month-over-month stagnation', impact: Math.round(p.riskScore * 0.4) },
    ],
    recommendations: ['Conduct immediate project review', 'Audit contractor timeline'],
  };
};

export const getProjectAlerts = (projectCode: string): Alert[] => {
  return mockAlerts.filter(a => a.projectId === projectCode);
};

export const getBenchmarkData = (projectCode: string): BenchmarkData => {
  const p = getProjectByCode(projectCode);
  return {
    projectId: projectCode,
    stateAverageRisk: 45,
    sectorAverageRisk: 52,
    ministryAverageRisk: 48,
    stateAverageProgress: 60,
    sectorAverageProgress: 55,
    ministryAverageProgress: 58,
  };
};

export const getStateStatistics = (state: string) => {
  const canonical = normalizeStateName(state);
  const stateProjects = getProjectsByState(canonical);
  const totalProjects = stateProjects.length;
  const highRiskProjects = stateProjects.filter(p => p.riskScore >= 50 && p.riskScore < 75).length;
  const criticalRiskProjects = stateProjects.filter(p => p.riskScore >= 75).length;
  const costRiskProjects = stateProjects.filter(p => (p.costOverrunRisk || p.riskScore) >= 50).length;
  const timeRiskProjects = stateProjects.filter(p => (p.timeOverrunRisk || p.riskScore) >= 50).length;
  
  // Aggregate sector distribution
  const sectors: Record<string, number> = {};
  stateProjects.forEach(p => {
    sectors[p.sector] = (sectors[p.sector] || 0) + 1;
  });
  
  const averageRisk = totalProjects > 0 
    ? Math.round(stateProjects.reduce((acc, p) => acc + p.riskScore, 0) / totalProjects) 
    : 0;

  return {
    stateName: canonical,
    totalProjects,
    highRiskProjects,
    criticalRiskProjects,
    costRiskProjects,
    timeRiskProjects,
    sectorDistribution: Object.entries(sectors).map(([name, value]) => ({ name, value })),
    averageRisk,
    riskLevel: getRiskLevel(averageRisk)
  };
};
