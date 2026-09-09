import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  glow?: boolean;
}

export const GlassCard: React.FC<GlassCardProps> = ({ children, className, glow = false, ...props }) => {
  return (
    <div
      className={cn(
        'glass-panel p-4 md:p-6 transition-all duration-300',
        glow && 'hover:shadow-glow-cyan',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};
