import * as React from 'react';
import { cn } from '../../lib/utils';

export interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
}

/**
 * Premium custom dialog modal wrapping overlay animations and backdrop blurring filters.
 */
export function Dialog({ isOpen, onClose, title, children, className }: DialogProps) {
  // Prevent background scrolling when dialog triggers
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Visual Backdrop Overlay with blur effect */}
      <div
        className="absolute inset-0 bg-black/75 backdrop-blur-md transition-opacity duration-300"
        onClick={onClose}
      />
      
      {/* Modal core window container */}
      <div
        className={cn(
          'relative z-10 w-full max-w-lg scale-100 rounded-2xl border border-zinc-800 bg-[#0F0F0F] p-6 shadow-2xl transition-all duration-300 font-outfit',
          className
        )}
      >
        {/* Dialog Header Block */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4 mb-4">
          {title && (
            <h2 className="text-lg font-bold uppercase tracking-wide font-syne text-[#E8441A]">
              {title}
            </h2>
          )}
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-850 hover:text-white transition-colors duration-200 focus:outline-none"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Dialog body content */}
        <div className="max-h-[75vh] overflow-y-auto pr-1">{children}</div>
      </div>
    </div>
  );
}

