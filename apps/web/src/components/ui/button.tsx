import * as React from 'react';
import { cn } from '../../lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'md', isLoading, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          'inline-flex items-center justify-center font-semibold rounded-lg transition-all duration-300 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-[#E8441A]/50 disabled:opacity-50 disabled:pointer-events-none disabled:active:scale-100 font-outfit',
          {
            // Default styling features premium orange coral coloring
            'bg-[#E8441A] text-white hover:bg-[#ff5a2f] shadow-lg shadow-[#E8441A]/20': variant === 'default',
            // Outline styles feature transparent backdrops with borders
            'border border-[#E8441A] text-[#E8441A] hover:bg-[#E8441A]/10 bg-transparent': variant === 'outline',
            // Secondary styled blocks match elegant slate layouts
            'bg-zinc-800 text-zinc-100 hover:bg-zinc-700': variant === 'secondary',
            'bg-transparent hover:bg-zinc-800 text-zinc-300 hover:text-white': variant === 'ghost',
            'bg-red-600 hover:bg-red-700 text-white': variant === 'danger'
          },
          {
            'px-3 py-1.5 text-xs': size === 'sm',
            'px-5 py-2.5 text-sm': size === 'md',
            'px-7 py-3 text-base': size === 'lg'
          },
          className
        )}
        {...props}
      >
        {isLoading && (
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4 text-current"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
