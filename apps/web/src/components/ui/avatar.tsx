import * as React from 'react';
import { cn } from '../../lib/utils';
import { User } from 'lucide-react';

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string;
  alt?: string;
  fallback?: string;
}

/**
 * Premium custom avatar image tag with fallback human icon.
 */
export function Avatar({ className, src, alt, fallback, ...props }: AvatarProps) {
  const [error, setError] = React.useState(false);

  return (
    <div
      className={cn(
        'relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full border border-zinc-800 bg-zinc-900 select-none items-center justify-center text-zinc-400',
        className
      )}
      {...props}
    >
      {src && !error ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={alt || 'Avatar'}
          onError={() => setError(true)}
          className="h-full w-full object-cover"
        />
      ) : (
        <User className="h-1/2 w-1/2" />
      )}
    </div>
  );
}


