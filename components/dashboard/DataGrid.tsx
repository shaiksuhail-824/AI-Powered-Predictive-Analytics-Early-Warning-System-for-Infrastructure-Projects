'use client';

import React, { useState } from 'react';
import { GlassCard } from '../ui/GlassCard';
import { LegacyProject } from '../../types';
import { RiskBadge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { ArrowUpDown, ChevronRight } from 'lucide-react';


export const DataGrid: React.FC<{ projects: LegacyProject[], onRowClick: (p: LegacyProject) => void }> = ({ projects, onRowClick }) => {
  const [sortConfig, setSortConfig] = useState<{ key: keyof LegacyProject, direction: 'asc' | 'desc' } | null>(null);

  const sortedProjects = React.useMemo(() => {
    const sortableItems = [...projects];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        const aVal = a[sortConfig.key];
        const bVal = b[sortConfig.key];
        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return sortableItems;
  }, [projects, sortConfig]);

  const requestSort = (key: keyof LegacyProject) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const SortableHeader = ({ label, sortKey }: { label: string, sortKey: keyof LegacyProject }) => (
    <th 
      className="px-4 py-3 text-left text-xs font-medium text-secondary uppercase tracking-wider cursor-pointer hover:text-primary transition-colors"
      onClick={() => requestSort(sortKey)}
    >
      <div className="flex items-center gap-1">
        {label}
        <ArrowUpDown className="w-3 h-3" />
      </div>
    </th>
  );

  return (
    <GlassCard className="overflow-hidden flex flex-col h-full !p-0">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-panel/50 sticky top-0 z-10 backdrop-blur-md">
            <tr>
              <SortableHeader label="Project ID" sortKey="id" />
              <SortableHeader label="Sector" sortKey="sector" />
              <SortableHeader label="State" sortKey="state" />
              <SortableHeader label="Physical Progress" sortKey="physicalProgressPct" />
              <SortableHeader label="Risk" sortKey="riskLevel" />
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {sortedProjects.map((project) => (
              <tr 
                key={project.id} 
                className={`border-b border-border-glass hover:bg-panel/30 transition-colors cursor-pointer ${project.escalated ? 'bg-risk-high/5' : ''}`}
                onClick={() => onRowClick(project)}
              >
                <td className="px-4 py-3 font-medium flex items-center gap-2">
                  {project.escalated && <span className="w-2 h-2 rounded-full bg-risk-high animate-pulse" />}
                  {project.id}
                </td>
                <td className="px-4 py-3 text-secondary">{project.sector}</td>
                <td className="px-4 py-3 text-secondary">{project.state}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="w-8 text-right">{project.physicalProgressPct}%</span>
                    <div className="flex-1 h-1.5 bg-panel rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-accent-cyan" 
                        style={{ width: `${project.physicalProgressPct}%` }}
                      />
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <RiskBadge level={project.riskLevel} />
                </td>
                <td className="px-4 py-3 text-right">
                  <Button variant="ghost" size="sm" className="w-8 h-8 p-0 rounded-full">
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </GlassCard>
  );
};
