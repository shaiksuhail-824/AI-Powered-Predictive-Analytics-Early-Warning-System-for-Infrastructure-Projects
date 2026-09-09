'use client';

import React from 'react';
import { LegacyProject } from '../../types';
import { GlassCard } from '../ui/GlassCard';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import { useAppStore } from '../../store/appStore';


const dummySparkline = [
  { value: 10 }, { value: 15 }, { value: 12 }, { value: 20 }, { value: 25 }, { value: 22 }, { value: 30 }
];

interface KPIProps {
  title: string;
  value: string;
  subvalue?: string;
  color?: string;
  sparklineData?: { value: number }[];
}

const KPICard: React.FC<KPIProps> = ({ title, value, subvalue, color = '#22D3EE', sparklineData = dummySparkline }) => {
  const theme = useAppStore(state => state.theme);
  const chartColor = theme === 'dark' ? color : (color === '#22D3EE' ? '#1D4ED8' : color);

  return (
    <GlassCard className="flex flex-col justify-between h-32 relative overflow-hidden group">
      <div className="z-10">
        <h3 className="text-xs text-secondary font-medium uppercase tracking-wider">{title}</h3>
        <div className="mt-2 text-2xl font-display font-bold">{value}</div>
        {subvalue && <div className="text-xs text-secondary mt-1">{subvalue}</div>}
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-16 opacity-30 group-hover:opacity-60 transition-opacity">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={sparklineData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
            <Area type="monotone" dataKey="value" stroke={chartColor} fill={chartColor} strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </GlassCard>
  );
};

export const KPIStrip: React.FC<{ projects: LegacyProject[] }> = ({ projects }) => {
  const totalCost = projects.reduce((acc, p) => acc + p.revisedCostCr, 0);
  const highRisk = projects.filter(p => p.riskLevel === 'High').length;
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <KPICard title="Total Active Projects" value={projects.length.toString()} subvalue="Last 30 days trend" />
      <KPICard title="High-Risk Items" value={highRisk.toString()} color="#F87171" subvalue={`${Math.round((highRisk/projects.length)*100)}% of portfolio`} />
      <KPICard title="Cumulative Exp." value={`₹ ${(totalCost / 100000).toFixed(2)} LC`} color="#34D399" subvalue="Lakh Crore" />
      <KPICard title="Avg. Time Overrun" value={`${Math.round(projects.reduce((a, p) => a + p.timeOverrunMonths, 0) / projects.length)} mo`} color="#FBBF24" />
    </div>
  );
};
