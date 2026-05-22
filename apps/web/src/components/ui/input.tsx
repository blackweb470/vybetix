import * as React from 'react';
import { cn } from '../../lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  label?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, label, type = 'text', ...props }, ref) => {
    return (
      <div className="w-full flex flex-col gap-1.5">
        {label && (
          <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider font-outfit">
            {label}
          </label>
        )}
        <input
          type={type}
          ref={ref}
          className={cn(
            'flex h-11 w-full rounded-lg border border-zinc-800 bg-[#121212] px-4 py-2 text-sm text-zinc-100 placeholder-zinc-500 transition-all duration-300 focus:border-[#E8441A] focus:outline-none focus:ring-1 focus:ring-[#E8441A]/50 disabled:cursor-not-allowed disabled:opacity-50 font-outfit',
            error && 'border-red-500 focus:border-red-500 focus:ring-red-500/50',
            className
          )}
          {...props}
        />
        {error && (
          <span className="text-xs text-red-500 font-medium font-outfit mt-0.5">
            {error}
          </span>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

