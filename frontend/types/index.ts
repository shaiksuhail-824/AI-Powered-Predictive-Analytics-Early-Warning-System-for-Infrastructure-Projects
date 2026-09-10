export type Role = 'ADMIN' | 'MINISTRY_PROJECT_HEAD' | 'AGENCY_CONTRACTOR';

export type ProjectStatus = 'On Track' | 'Watch' | 'Delayed' | 'Critical';

export type RiskLevel = 'Low' | 'Medium' | 'High' | 'Critical';

export type AlertSeverity = 'Medium' | 'High' | 'Critical';

export type AlertStatus = 'New' | 'Assigned' | 'In Progress' | 'Resolved' | 'Escalated';

export type TicketStatus = 'Open' | 'Assigned' | 'In Progress' | 'Resolved' | 'Escalated';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  organizationId?: string;
  assignedProjectIds?: string[];
  scopedAgency?: string;
}


export interface Project {
  projectId: string;
  projectName: string;
  ministry: string;
  agency: string;
  state: string;
  sector: string;
  originalCost: number;
  revisedCost: number;
  startDate?: string;
  originalCompletionDate: string;
  revisedCompletionDate: string;
  physicalProgress: number;
  plannedProgress?: number;
  expenditure: number;
  status: ProjectStatus;
  riskScore: number;
  riskLevel: RiskLevel;
  costOverrunRisk?: number;
  timeOverrunRisk?: number;
  costOverrunProbability?: number;
  scheduleDelayProbability?: number;
  currentExpenditure?: number;
  totalBudget?: number;
  anomalyStatus?: string;
  interventionPriority?: string;
  timeOverrunDays?: number;
  dataStatus?: string;
}

export interface LegacyProject extends Project {
  executingAgency: string;
  baselineCostCr: number;
  revisedCostCr: number;
  approvalDate: string;
  physicalProgressPct: number;
  dataSource: string;
  history: { month: string; plannedSpendCr: number; actualSpendCr: number; physicalProgressPct: number }[];
  milestones: { label: string; dueDate: string; status: string }[];
  aiDiagnostics: { confidence: string; bottleneckSummary: string; recommendedActions: string[] };
  costOverrunRiskPct: number;
  timeOverrunMonths: number;
  id: string;
  name: string;
  escalated: boolean;
}

export interface MonthlyMonitoring {
  projectId: string;
  month: string;
  plannedProgress: number;
  actualProgress: number;
  monthlyExpenditure: number;
  cumulativeExpenditure: number;
  milestoneStatus: 'On Track' | 'Delayed' | 'Completed' | 'Upcoming';
}

export interface RiskAnalysis {
  projectId: string;
  costRisk: number; // Probability percentage
  timeRisk: number; // Probability percentage
  overallRisk: number; // Score out of 100
  riskLevel: RiskLevel;
  predictedDelay: number; // in months
  riskTrend: number[]; // History of risk scores
  drivers: { factor: string; impact: number }[];
  recommendations: string[];
}

export interface Alert {
  alertId: string;
  projectId: string;
  severity: AlertSeverity;
  type: string;
  message: string;
  responsibleAuthority: string;
  status: AlertStatus;
  createdAt: string;
}

export interface ActionTicket {
  ticketId: string;
  alertId: string;
  projectId: string;
  assignedTo: string;
  dueDate: string;
  action: string;
  status: TicketStatus;
}

export interface BenchmarkData {
  projectId: string;
  stateAverageRisk: number;
  sectorAverageRisk: number;
  ministryAverageRisk: number;
  stateAverageProgress: number;
  sectorAverageProgress: number;
  ministryAverageProgress: number;
}

export interface StateStats {
  stateName: string;
  totalProjects: number;
  highRiskProjects: number;
  criticalRiskProjects: number;
  costRiskProjects: number;
  timeRiskProjects: number;
  sectorDistribution: { name: string; value: number }[];
  averageRisk: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

