import * as React from 'react';
import { cn } from '../../lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'outline' | 'secondary' | 'success' | 'warning' | 'danger';
}

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider transition-colors font-outfit select-none',
        {
          'bg-[#E8441A] text-white': variant === 'default',
          'border border-[#E8441A] text-[#E8441A]': variant === 'outline',
          'bg-zinc-800 text-zinc-300': variant === 'secondary',
          'bg-green-500/10 text-green-400 border border-green-500/25': variant === 'success',
          'bg-amber-500/10 text-amber-400 border border-amber-500/25': variant === 'warning',
          'bg-red-500/10 text-red-400 border border-red-500/25': variant === 'danger'
        },
        className
      )}
      {...props}
    />
  );
}

