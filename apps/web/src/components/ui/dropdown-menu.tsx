import * as React from 'react';
import { cn } from '../../lib/utils';

interface DropdownMenuProps {
  trigger: React.ReactNode | ((isOpen: boolean) => React.ReactNode);
  children: React.ReactNode;
  align?: 'left' | 'right';
  className?: string;
}

/**
 * Premium custom dropdown menu overlay tracking clicks outside to close automatically.
 */
export function DropdownMenu({ trigger, children, align = 'right', className }: DropdownMenuProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative inline-block text-left" ref={containerRef}>
      {/* Dynamic Keyframes Injector */}
      <style>{`
        @keyframes dropdown-slide-down {
          from {
            opacity: 0;
            transform: scale(0.96) translateY(-8px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        .animate-dropdown-in {
          animation: dropdown-slide-down 0.22s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>

      <div onClick={() => setIsOpen(!isOpen)} className="cursor-pointer">
        {typeof trigger === 'function' ? trigger(isOpen) : trigger}
      </div>

      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className={cn(
            'absolute mt-2.5 w-60 rounded-2xl border border-zinc-800 bg-[#0A0A0E]/95 backdrop-blur-xl shadow-[0_20px_50px_rgba(0,0,0,0.65)] focus:outline-none z-50 font-outfit overflow-hidden animate-dropdown-in',
            align === 'right' ? 'right-0 origin-top-right' : 'left-0 origin-top-left',
            className
          )}
        >
          {children}
        </div>
      )}
    </div>
  );
}

interface DropdownMenuItemProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

export function DropdownMenuItem({ children, onClick, className, ...props }: DropdownMenuItemProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex w-full items-center rounded-lg px-3.5 py-2.5 text-xs font-black uppercase tracking-wider text-zinc-400 hover:bg-zinc-900/60 hover:text-white hover:translate-x-0.5 transition-all duration-200 text-left font-outfit focus:outline-none',
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
