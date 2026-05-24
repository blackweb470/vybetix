import * as React from 'react';
import { cn } from '../../lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  label?: string;
  prefixElement?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, label, type = 'text', prefixElement, ...props }, ref) => {
    return (
      <div className="w-full flex flex-col gap-1.5">
        {label && (
          <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider font-outfit">
            {label}
          </label>
        )}
        <div className={cn(
          "relative flex items-center rounded-lg border border-zinc-800 bg-[#121212] overflow-hidden focus-within:border-[#E8441A] focus-within:ring-1 focus-within:ring-[#E8441A]/50 transition-all duration-300",
          error && 'border-red-500 focus-within:border-red-500 focus-within:ring-red-500/50'
        )}>
          {prefixElement && (
            <div className="flex items-center justify-center px-3 h-11 bg-zinc-900 border-r border-zinc-800 text-zinc-400 text-sm font-bold">
              {prefixElement}
            </div>
          )}
          <input
            type={type}
            ref={ref}
            className={cn(
              'flex h-11 w-full bg-transparent px-4 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 font-outfit',
              className
            )}
            {...props}
          />
        </div>
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

