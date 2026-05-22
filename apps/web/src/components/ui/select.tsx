import * as React from 'react';
import { cn } from '../../lib/utils';

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: string;
  label?: string;
  options: SelectOption[];
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, error, label, options, ...props }, ref) => {
    return (
      <div className="w-full flex flex-col gap-1.5">
        {label && (
          <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider font-outfit">
            {label}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            className={cn(
              'flex h-11 w-full rounded-lg border border-zinc-800 bg-[#121212] px-4 py-2 text-sm text-zinc-100 placeholder-zinc-500 transition-all duration-300 appearance-none focus:border-[#E8441A] focus:outline-none focus:ring-1 focus:ring-[#E8441A]/50 disabled:cursor-not-allowed disabled:opacity-50 font-outfit cursor-pointer',
              error && 'border-red-500 focus:border-red-500 focus:ring-red-500/50',
              className
            )}
            {...props}
          >
            {options.map((opt) => (
              <option key={opt.value} value={opt.value} className="bg-[#121212] text-zinc-100">
                {opt.label}
              </option>
            ))}
          </select>
          {/* Custom Chevron Indicator Icon */}
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3.5 text-zinc-400">
            <svg
              className="h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
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

Select.displayName = 'Select';

