import React from 'react';

export function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white rounded-lg border border-border shadow-sm ${className}`}>
      {children}
    </div>
  );
}

export function MetricCard({ title, value, subtitle, icon: Icon, trend }: { title: string, value: string | number, subtitle?: string, icon?: React.ElementType, trend?: 'up' | 'down' | 'neutral' }) {
  return (
    <Card className="p-5 flex flex-col gap-2">
      <div className="flex justify-between items-start">
        <h3 className="text-sm font-medium text-text-secondary">{title}</h3>
        {Icon && <Icon size={18} className="text-mospi-500" />}
      </div>
      <div className="text-3xl font-bold text-text-primary">{value}</div>
      {subtitle && (
        <p className="text-xs text-text-muted flex items-center gap-1">
          {trend === 'up' && <span className="text-risk-high">↑</span>}
          {trend === 'down' && <span className="text-risk-low">↓</span>}
          {subtitle}
        </p>
      )}
    </Card>
  );
}
