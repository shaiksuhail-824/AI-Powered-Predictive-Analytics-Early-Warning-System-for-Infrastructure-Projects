'use client';

import React, { useState } from 'react';

import { GlassCard } from '../ui/GlassCard';
import { Badge, RiskBadge } from '../ui/Badge';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from 'recharts';
import { AlertTriangle, Info, ShieldCheck, Activity, MapPin, Calendar, Building, Zap } from 'lucide-react';
import { useAppStore } from '../../store/appStore';
import { LegacyProject } from '../../types';

export const ProjectDeepDive: React.FC<{ project: LegacyProject }> = ({ project }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'history' | 'milestones' | 'diagnostics'>('overview');
  const theme = useAppStore(state => state.theme);

  const colors = {
    planned: theme === 'dark' ? '#94A3B8' : '#64748B',
    actual: theme === 'dark' ? '#22D3EE' : '#1D4ED8',
    progress: theme === 'dark' ? '#34D399' : '#059669',
    text: theme === 'dark' ? '#F1F5F9' : '#0F172A',
    grid: theme === 'dark' ? '#1E293B' : '#E2E8F0',
  };

  return (
    <div className="flex flex-col h-full bg-bg-base/50 p-2 md:p-6 text-left">
      <div className="flex flex-wrap gap-2 mb-6 border-b border-border-glass pb-4">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 rounded-card text-sm font-medium transition-colors ${activeTab === 'overview' ? 'bg-accent-cyan text-gray-900' : 'text-secondary hover:bg-panel'}`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`px-4 py-2 rounded-card text-sm font-medium transition-colors ${activeTab === 'history' ? 'bg-accent-cyan text-gray-900' : 'text-secondary hover:bg-panel'}`}
        >
          History & Financials
        </button>
        <button
          onClick={() => setActiveTab('milestones')}
          className={`px-4 py-2 rounded-card text-sm font-medium transition-colors ${activeTab === 'milestones' ? 'bg-accent-cyan text-gray-900' : 'text-secondary hover:bg-panel'}`}
        >
          Milestones
        </button>
        <button
          onClick={() => setActiveTab('diagnostics')}
          className={`px-4 py-2 rounded-card text-sm font-medium transition-colors flex items-center gap-2 ${activeTab === 'diagnostics' ? 'bg-accent-cyan text-gray-900' : 'text-secondary hover:bg-panel'}`}
        >
          <Zap className="w-4 h-4" /> AI Diagnostics
        </button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <GlassCard className="flex flex-col gap-4">
               <h3 className="text-lg font-display font-bold border-b border-border-glass pb-2">any Identity</h3>
               <div className="grid grid-cols-2 gap-4 text-sm">
                 <div>
                   <div className="text-secondary mb-1 flex items-center gap-1"><Building className="w-4 h-4"/> Ministry</div>
                   <div className="font-medium">{project.ministry}</div>
                 </div>
                 <div>
                   <div className="text-secondary mb-1 flex items-center gap-1"><MapPin className="w-4 h-4"/> Location</div>
                   <div className="font-medium">{project.state}</div>
                 </div>
                 <div>
                   <div className="text-secondary mb-1">Executing Agency</div>
                   <div className="font-medium">{project.executingAgency}</div>
                 </div>
                 <div>
                   <div className="text-secondary mb-1 flex items-center gap-1"><Calendar className="w-4 h-4"/> Approval Date</div>
                   <div className="font-medium">{project.approvalDate ? new Date(project.approvalDate).toLocaleDateString() : 'N/A'}</div>
                 </div>
               </div>
            </GlassCard>

            <GlassCard className="flex flex-col gap-4">
               <h3 className="text-lg font-display font-bold border-b border-border-glass pb-2">Financial & Status</h3>
               <div className="grid grid-cols-2 gap-4 text-sm">
                 <div>
                   <div className="text-secondary mb-1">Baseline Cost</div>
                   <div className="font-medium text-lg">₹{project.baselineCostCr} Cr</div>
                 </div>
                 <div>
                   <div className="text-secondary mb-1">Revised Cost</div>
                   <div className={`font-medium text-lg ${project.revisedCostCr > project.baselineCostCr ? 'text-risk-high' : ''}`}>
                     ₹{project.revisedCostCr} Cr
                   </div>
                 </div>
                 <div className="col-span-2 mt-2">
                   <div className="flex justify-between text-secondary mb-1">
                     <span>Physical Progress</span>
                     <span>{project.physicalProgressPct}%</span>
                   </div>
                   <div className="w-full h-2 bg-panel rounded-full overflow-hidden">
                     <div className="h-full bg-accent-cyan" style={{ width: `${project.physicalProgressPct}%` }} />
                   </div>
                 </div>
                 <div className="col-span-2 mt-2 flex justify-between items-center">
                    <div className="flex gap-2 items-center">
                      <span className="text-secondary">Data Source:</span>
                      <Badge variant={project.dataSource === 'api-synced' ? 'outline' : 'default'} className="text-[10px]">
                        {project.dataSource ? project.dataSource.replace('-', ' ').toUpperCase() : 'N/A'}
                      </Badge>
                    </div>
                    <RiskBadge level={project.riskLevel!} />
                 </div>
               </div>
            </GlassCard>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="flex flex-col gap-6">
            <GlassCard className="h-[300px]">
              <h3 className="text-sm font-medium text-secondary mb-4">Planned vs Actual Spend (₹ Cr) & Physical Progress</h3>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={project.history} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} vertical={false} />
                  <XAxis dataKey="month" stroke={colors.text} fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis yAxisId="left" stroke={colors.text} fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `₹${val}`} />
                  <YAxis yAxisId="right" orientation="right" stroke={colors.text} fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `${val}%`} />
                  <RechartsTooltip 
                    contentStyle={{ backgroundColor: 'var(--bg-panel)', borderColor: 'var(--border-glass)', borderRadius: '8px' }}
                    itemStyle={{ color: 'var(--text-primary)' }}
                  />
                  <Legend />
                  <Line yAxisId="left" type="monotone" dataKey="plannedSpendCr" name="Planned Spend" stroke={colors.planned} strokeDasharray="5 5" strokeWidth={2} dot={false} />
                  <Line yAxisId="left" type="monotone" dataKey="actualSpendCr" name="Actual Spend" stroke={colors.actual} strokeWidth={2} />
                  <Line yAxisId="right" type="monotone" dataKey="physicalProgressPct" name="Physical Progress" stroke={colors.progress} strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </GlassCard>
          </div>
        )}

        {activeTab === 'milestones' && (
          <div className="flex flex-col gap-4">
             {project.milestones?.map((m, idx: number) => (
                <GlassCard key={idx} className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 
                      ${m.status === 'completed' ? 'border-risk-low text-risk-low bg-risk-low/10' : 
                        m.status === 'at-risk' ? 'border-risk-high text-risk-high bg-risk-high/10' : 
                        'border-secondary text-secondary bg-panel'}
                    `}>
                      {m.status === 'completed' && <ShieldCheck className="w-5 h-5" />}
                      {m.status === 'at-risk' && <AlertTriangle className="w-5 h-5" />}
                      {m.status === 'pending' && <Activity className="w-5 h-5" />}
                    </div>
                    <div>
                      <h4 className="font-medium">{m.label}</h4>
                      <p className="text-xs text-secondary">Target: {new Date(m.dueDate).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <Badge variant={
                    m.status === 'completed' ? 'risk-low' : 
                    m.status === 'at-risk' ? 'risk-high' : 'outline'
                  }>
                    {m.status.toUpperCase()}
                  </Badge>
                </GlassCard>
             ))}
          </div>
        )}

        {activeTab === 'diagnostics' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             <div className="md:col-span-1 flex flex-col gap-4">
                <GlassCard className="text-center p-6 flex flex-col items-center justify-center">
                   <div className="w-24 h-24 rounded-full border-4 border-panel flex items-center justify-center mb-4 relative">
                      <div className={`absolute inset-0 rounded-full opacity-20 ${
                        project.aiDiagnostics.confidence === 'High' ? 'bg-risk-low' : 
                        project.aiDiagnostics.confidence === 'Medium' ? 'bg-risk-medium' : 'bg-risk-high'
                      }`} />
                      <span className="text-3xl font-display font-bold">
                         {project.costOverrunRiskPct}%
                      </span>
                   </div>
                   <h3 className="font-medium">Cost Overrun Probability</h3>
                   <div className="mt-4 flex gap-2 justify-center">
                     <Badge variant="outline" className="text-accent-cyan border-accent-cyan/50">
                        Confidence: {project.aiDiagnostics.confidence}
                     </Badge>
                   </div>
                </GlassCard>
             </div>
             
             <div className="md:col-span-2 flex flex-col gap-4">
                <GlassCard>
                  <h3 className="text-lg font-display font-bold flex items-center gap-2 mb-3">
                    <Info className="w-5 h-5 text-accent-cyan" /> Bottleneck Analysis
                  </h3>
                  <p className="text-sm leading-relaxed text-secondary border-l-2 border-accent-cyan pl-4">
                    {project.aiDiagnostics.bottleneckSummary}
                  </p>
                </GlassCard>
                
                <GlassCard>
                  <h3 className="text-lg font-display font-bold mb-3">Recommended Actions</h3>
                  <ul className="space-y-3">
                    {project.aiDiagnostics?.recommendedActions?.map((action: string, i: number) => (
                      <li key={i} className="flex gap-3 text-sm">
                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-accent-cyan/20 text-accent-cyan flex items-center justify-center text-xs font-bold">
                          {i + 1}
                        </span>
                        <span className="text-secondary leading-relaxed pt-0.5">{action}</span>
                      </li>
                    ))}
                  </ul>
                </GlassCard>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};
