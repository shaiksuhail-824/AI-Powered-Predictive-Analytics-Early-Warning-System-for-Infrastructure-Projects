import React from 'react';
import { RiskLevel } from '../../types';

export function RiskBadge({ level, className = '' }: { level: RiskLevel, className?: string }) {
  let colorClass = '';
  
  switch (level) {
    case 'Low':
      colorClass = 'bg-emerald-100 text-emerald-800 border-emerald-200';
      break;
    case 'Medium':
      colorClass = 'bg-amber-100 text-amber-800 border-amber-200';
      break;
    case 'High':
      colorClass = 'bg-red-100 text-red-800 border-red-200';
      break;
    case 'Critical':
      colorClass = 'bg-red-200 text-red-900 border-red-300 font-bold';
      break;
    default:
      colorClass = 'bg-gray-100 text-gray-800 border-gray-200';
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${colorClass} ${className}`}>
      {level}
    </span>
  );
}
