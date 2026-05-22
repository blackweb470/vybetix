import * as React from 'react';
import { cn } from '../../lib/utils';

interface TabsProps {
  defaultValue: string;
  children: React.ReactNode;
  className?: string;
}

interface TabsListProps {
  children: React.ReactNode;
  className?: string;
}

interface TabsTriggerProps {
  value: string;
  children: React.ReactNode;
  className?: string;
}

interface TabsContentProps {
  value: string;
  children: React.ReactNode;
  className?: string;
}

const TabsContext = React.createContext<{
  value: string;
  setValue: (v: string) => void;
} | null>(null);

/**
 * Premium custom Tabs layout manager utilizing a local React state provider.
 */
export function Tabs({ defaultValue, children, className }: TabsProps) {
  const [value, setValue] = React.useState(defaultValue);
  return (
    <TabsContext.Provider value={{ value, setValue }}>
      <div className={cn('w-full', className)}>{children}</div>
    </TabsContext.Provider>
  );
}

export function TabsList({ children, className }: TabsListProps) {
  return (
    <div
      className={cn(
        'inline-flex items-center justify-start rounded-xl bg-zinc-900/80 p-1 border border-zinc-800',
        className
      )}
    >
      {children}
    </div>
  );
}

export function TabsTrigger({ value, children, className }: TabsTriggerProps) {
  const context = React.useContext(TabsContext);
  if (!context) throw new Error('TabsTrigger must be used inside Tabs');
  const isActive = context.value === value;

  return (
    <button
      type="button"
      onClick={() => context.setValue(value)}
      className={cn(
        'inline-flex items-center justify-center whitespace-nowrap rounded-lg px-4 py-2.5 text-xs font-bold uppercase tracking-wider transition-all duration-300 font-outfit text-zinc-400 hover:text-zinc-200 focus:outline-none',
        isActive && 'bg-[#E8441A] text-white shadow-lg shadow-[#E8441A]/15',
        className
      )}
    >
      {children}
    </button>
  );
}

export function TabsContent({ value, children, className }: TabsContentProps) {
  const context = React.useContext(TabsContext);
  if (!context) throw new Error('TabsContent must be used inside Tabs');
  if (context.value !== value) return null;

  return (
    <div
      className={cn(
        'mt-4 transition-all duration-300 font-outfit',
        className
      )}
    >
      {children}
    </div>
  );
}
