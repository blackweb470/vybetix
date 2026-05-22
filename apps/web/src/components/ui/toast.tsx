import * as React from 'react';
import { cn } from '../../lib/utils';
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  title: string;
  description?: string;
}

const ToastContext = React.createContext<{
  toasts: ToastMessage[];
  showToast: (type: 'success' | 'error' | 'info', title: string, description?: string) => void;
  removeToast: (id: string) => void;
} | null>(null);

/**
 * Premium custom Toast provider displaying active banner queues in-browser.
 */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastMessage[]>([]);

  const showToast = React.useCallback((type: 'success' | 'error' | 'info', title: string, description?: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, title, description }]);
    setTimeout(() => removeToast(id), 4500);
  }, []);

  const removeToast = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, showToast, removeToast }}>
      {children}
      
      {/* Dynamic Keyframes Injector */}
      <style>{`
        @keyframes toast-slide-in {
          from {
            transform: translateX(120%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        @keyframes toast-progress {
          from {
            width: 100%;
          }
          to {
            width: 0%;
          }
        }
        .animate-toast-in {
          animation: toast-slide-in 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .animate-toast-progress {
          animation: toast-progress 4.5s linear forwards;
        }
      `}</style>

      {/* Visual notification overlays stack */}
      <div className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-3.5 max-w-sm w-full px-4 sm:px-0">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role="alert"
            className={cn(
              "relative flex items-start gap-3.5 p-4 rounded-xl border shadow-2xl overflow-hidden font-outfit select-none animate-toast-in transition-all duration-300 hover:scale-[1.02]",
              {
                "bg-[#09150E]/95 border-emerald-500/20 text-emerald-100 shadow-[0_8px_32px_rgba(16,185,129,0.12)]": toast.type === 'success',
                "bg-[#1A060A]/95 border-rose-500/20 text-rose-100 shadow-[0_8px_32px_rgba(244,63,94,0.12)]": toast.type === 'error',
                "bg-[#0E0E15]/95 border-zinc-800 text-zinc-100 shadow-[0_8px_32px_rgba(0,0,0,0.5)]": toast.type === 'info'
              }
            )}
          >
            {/* Left Accent indicator stripe */}
            <div
              className={cn("absolute left-0 top-0 bottom-0 w-[5px]", {
                "bg-emerald-500": toast.type === 'success',
                "bg-rose-500": toast.type === 'error',
                "bg-[#E8441A]": toast.type === 'info'
              })}
            />

            {/* Icon */}
            <div className="shrink-0 mt-0.5 ml-1">
              {toast.type === 'success' && <CheckCircle2 className="h-5 w-5 text-emerald-400" />}
              {toast.type === 'error' && <AlertTriangle className="h-5 w-5 text-rose-400" />}
              {toast.type === 'info' && <Info className="h-5 w-5 text-[#E8441A]" />}
            </div>

            {/* Content */}
            <div className="flex-1 pr-6">
              <h4 className="text-xs font-black uppercase tracking-wider leading-tight text-white">
                {toast.title}
              </h4>
              {toast.description && (
                <p className="text-[11px] mt-1 text-zinc-400 font-medium leading-relaxed">
                  {toast.description}
                </p>
              )}
            </div>

            {/* Close Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                removeToast(toast.id);
              }}
              className="absolute top-3.5 right-3.5 p-1 rounded-md text-zinc-500 hover:text-white hover:bg-zinc-800/50 transition-all"
            >
              <X className="h-3.5 w-3.5" />
            </button>

            {/* Time progress bar */}
            <div
              className={cn("absolute bottom-0 left-0 h-[2.5px] animate-toast-progress", {
                "bg-emerald-500/60": toast.type === 'success',
                "bg-rose-500/60": toast.type === 'error',
                "bg-[#E8441A]/60": toast.type === 'info'
              })}
            />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

/**
 * Standard visual notification hook replicating expected shadcn signatures.
 */
export function useToast() {
  const context = React.useContext(ToastContext);
  if (!context) throw new Error('useToast must be used inside ToastProvider');
  
  return {
    toast: (options: { title: string; description?: string; variant?: 'default' | 'destructive' | 'success' | 'info' }) => {
      const type = options.variant === 'destructive' ? 'error' : options.variant === 'success' ? 'success' : 'info';
      context.showToast(type, options.title, options.description);
    }
  };
}
