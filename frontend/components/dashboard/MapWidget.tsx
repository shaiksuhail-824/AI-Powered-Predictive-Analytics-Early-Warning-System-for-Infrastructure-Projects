'use client';

import React, { useState } from 'react';
import { LegacyProject } from '../../types';
import { GlassCard } from '../ui/GlassCard';
import { useAppStore } from '../../store/appStore';

import { Button } from '../ui/Button';
import { Map as MapIcon, BarChart2 } from 'lucide-react';

const STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat', 'Haryana',
  'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
  'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana',
  'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Delhi', 'Jammu & Kashmir'
];

export const MapWidget: React.FC<{ projects: LegacyProject[] }> = ({ projects }) => {
  const { filters, setFilter } = useAppStore();
  const [layer, setLayer] = useState<'risk' | 'density'>('risk');

  const stateStats = STATES.map(state => {
    const stateProjects = projects.filter(p => p.state === state);
    const count = stateProjects.length;
    const highRiskCount = stateProjects.filter(p => p.riskLevel === 'High').length;
    const riskRatio = count > 0 ? highRiskCount / count : 0;
    return { state, count, riskRatio };
  });

  const maxCount = Math.max(...stateStats.map(s => s.count), 1);

  const getColor = (stat: { count: number, riskRatio: number }) => {
    if (stat.count === 0) return 'bg-panel/20 border-transparent';
    if (layer === 'density') {
      return `bg-accent-cyan border-accent-cyan/50`;
    } else {
      if (stat.riskRatio > 0.5) return 'bg-risk-high border-risk-high/50';
      if (stat.riskRatio > 0.2) return 'bg-risk-medium border-risk-medium/50';
      return 'bg-risk-low border-risk-low/50';
    }
  };

  const getOpacity = (stat: { count: number }) => {
    if (stat.count === 0) return 1;
    if (layer === 'density') {
      return Math.max(0.3, stat.count / maxCount);
    }
    return 0.8;
  };

  return (
    <GlassCard className="h-[400px] flex flex-col relative overflow-hidden">
      <div className="flex justify-between items-center mb-4 z-10">
        <h3 className="font-display font-bold text-lg">Geographic Intelligence</h3>
        <div className="flex gap-2">
          <Button 
            variant={layer === 'risk' ? 'primary' : 'ghost'} 
            size="sm" 
            onClick={() => setLayer('risk')}
            className="h-8"
          >
            <MapIcon className="w-4 h-4 mr-2" /> Risk Heatmap
          </Button>
          <Button 
            variant={layer === 'density' ? 'primary' : 'ghost'} 
            size="sm" 
            onClick={() => setLayer('density')}
            className="h-8"
          >
            <BarChart2 className="w-4 h-4 mr-2" /> Density
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar z-10">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
          {stateStats.map((stat) => {
            const isActive = filters.state === stat.state;
            return (
              <button
                key={stat.state}
                onClick={() => setFilter('state', isActive ? 'All' : stat.state)}
                className={`
                  relative p-3 rounded-card text-left transition-all border
                  hover:scale-105 active:scale-95
                  ${getColor(stat)}
                  ${isActive ? 'ring-2 ring-white shadow-glow-cyan z-10' : ''}
                `}
                style={{ opacity: isActive ? 1 : getOpacity(stat) }}
                title={`${stat.state}: ${stat.count} projects`}
              >
                <div className="text-xs font-medium truncate mix-blend-difference text-white">
                  {stat.state}
                </div>
                <div className="text-xs mix-blend-difference text-white/80 mt-1">
                  {stat.count} {stat.count === 1 ? 'proj' : 'projs'}
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </GlassCard>
  );
};
