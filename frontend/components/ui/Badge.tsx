import React from 'react';
import { cn } from './GlassCard';
import { RiskLevel } from '../../types';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'risk-low' | 'risk-medium' | 'risk-high' | 'outline';
  children: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({ variant = 'default', className, children, ...props }) => {
  const variants = {
    default: 'bg-panel text-primary border border-border-glass',
    'risk-low': 'bg-risk-low/20 text-risk-low border border-risk-low/50',
    'risk-medium': 'bg-risk-medium/20 text-risk-medium border border-risk-medium/50',
    'risk-high': 'bg-risk-high/20 text-risk-high border border-risk-high/50',
    outline: 'border border-border-glass text-secondary',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-pill text-xs font-medium',
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
};

export const RiskBadge: React.FC<{ level: RiskLevel; className?: string }> = ({ level, className }) => {
  const variantMap: Record<RiskLevel, BadgeProps['variant']> = {
    Low: 'risk-low',
    Medium: 'risk-medium',
    High: 'risk-high',
    Critical: 'risk-high',
  };
  return <Badge variant={variantMap[level]} className={className}>{level.toUpperCase()} RISK</Badge>;
};
