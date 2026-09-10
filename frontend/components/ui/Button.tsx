import React from 'react';
import { cn } from './GlassCard';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
    const variants = {
      primary: 'bg-accent-cyan text-gray-900 hover:bg-accent-cyan/90 shadow-glow-cyan',
      secondary: 'bg-panel text-primary hover:bg-panel/80',
      outline: 'border border-accent-cyan text-accent-cyan hover:bg-accent-cyan/10',
      ghost: 'text-secondary hover:text-primary hover:bg-panel/50',
    };

    const sizes = {
      sm: 'h-8 px-3 text-xs',
      md: 'h-10 px-4 py-2',
      lg: 'h-12 px-8 text-lg',
    };

    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center rounded-card font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-cyan disabled:pointer-events-none disabled:opacity-50',
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';
