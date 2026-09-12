'use client';

import React from 'react';
import { GlassCard } from '../ui/GlassCard';
import { useAppStore } from '../../store/appStore';
import { mockIndicators } from '../../data/mockIndicators';
import { RadialBarChart, RadialBar, PolarAngleAxis, ResponsiveContainer, AreaChart, Area } from 'recharts';

export const PerformanceDashboard: React.FC = () => {
  const { filters } = useAppStore();

  
  const indicators = mockIndicators.filter(i => filters.sector === 'All' || i.sector === filters.sector);
  
  // Aggregate scores by dimension
  const dimensions = ['Access', 'Quality', 'Utilisation', 'Affordability', 'Fiscal'] as const;
  
  const getAggregatedScore = (dimension: string) => {
    const relevant = indicators.filter(i => i.dimension === dimension);
    if (relevant.length === 0) return 0;
    const sum = relevant.reduce((acc, i) => acc + i.score, 0);
    return Math.round(sum / relevant.length);
  };

  const getAggregatedTrend = (dimension: string) => {
    const relevant = indicators.filter(i => i.dimension === dimension);
    if (relevant.length === 0) return [];
    
    // Average the trends
    const len = relevant[0].trend.length;
    const avgTrend = Array.from({ length: len }).map((_, idx) => {
      const sum = relevant.reduce((acc, i) => acc + i.trend[idx], 0);
      return { period: idx, value: sum / relevant.length };
    });
    
    return avgTrend;
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-center bg-panel/50 p-4 rounded-card border border-border-glass">
        <div>
          <h2 className="text-xl font-display font-bold">Strategic Performance (Module 3B)</h2>
          <p className="text-sm text-secondary">
            {filters.sector === 'All' ? 'Overall Infrastructure Performance' : `${filters.sector} Sector Performance`}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {dimensions.map((dim, idx) => {
          const score = getAggregatedScore(dim);
          const trend = getAggregatedTrend(dim);
          const isRadial = idx % 2 === 0; // Alternate between radial and area charts
          
          const color = score > 75 ? '#34D399' : score > 50 ? '#FBBF24' : '#F87171';
          
          return (
            <GlassCard key={dim} className="h-64 flex flex-col relative overflow-hidden">
              <div className="z-10 mb-4">
                <h3 className="text-lg font-display font-bold">{dim}</h3>
                <div className="text-3xl font-display font-bold mt-1" style={{ color }}>
                  {score}<span className="text-sm text-secondary">/100</span>
                </div>
              </div>
              
              <div className="absolute inset-0 top-16 opacity-80 pointer-events-none">
                <ResponsiveContainer width="100%" height="100%">
                  {isRadial ? (
                    <RadialBarChart 
                      cx="50%" cy="50%" innerRadius="60%" outerRadius="80%" barSize={10} 
                      data={[{ name: dim, value: score, fill: color }]} startAngle={180} endAngle={0}
                    >
                      <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                      <RadialBar dataKey="value" cornerRadius={10} background={{ fill: 'var(--bg-panel)' }} />
                    </RadialBarChart>
                  ) : (
                    <AreaChart data={trend} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                      <Area type="monotone" dataKey="value" stroke={color} fill={color} fillOpacity={0.2} strokeWidth={2} />
                    </AreaChart>
                  )}
                </ResponsiveContainer>
              </div>
            </GlassCard>
          );
        })}
      </div>
    </div>
  );
};
