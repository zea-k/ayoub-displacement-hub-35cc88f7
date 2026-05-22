'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface MovingLinesBackgroundProps {
  children?: React.ReactNode;
  className?: string;
}

export function MovingLinesBackground({
  children,
  className,
}: MovingLinesBackgroundProps) {
  return (
    <div className={cn('relative w-full', className)}>
      {/* Fixed background that doesn't scroll */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <svg
          className="absolute inset-0 w-full h-full"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="none"
        >
          <defs>
            <pattern
              id="moving-lines"
              x="0"
              y="0"
              width="60"
              height="60"
              patternUnits="userSpaceOnUse"
            >
              <line x1="0" y1="0" x2="60" y2="60" stroke="url(#gradient1)" strokeWidth="2.5" opacity="0.7" />
              <line x1="60" y1="0" x2="0" y2="60" stroke="url(#gradient2)" strokeWidth="2.5" opacity="0.6" />
              <line x1="30" y1="0" x2="30" y2="60" stroke="url(#gradient3)" strokeWidth="1.5" opacity="0.5" />
              <line x1="0" y1="30" x2="60" y2="30" stroke="url(#gradient3)" strokeWidth="1.5" opacity="0.5" />
            </pattern>
            <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="rgb(139, 92, 246)" stopOpacity="0.8" />
              <stop offset="50%" stopColor="rgb(168, 85, 247)" stopOpacity="0.6" />
              <stop offset="100%" stopColor="rgb(99, 102, 241)" stopOpacity="0.4" />
            </linearGradient>
            <linearGradient id="gradient2" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="rgb(168, 85, 247)" stopOpacity="0.7" />
              <stop offset="50%" stopColor="rgb(139, 92, 246)" stopOpacity="0.5" />
              <stop offset="100%" stopColor="rgb(139, 92, 246)" stopOpacity="0.3" />
            </linearGradient>
            <linearGradient id="gradient3" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="rgb(168, 85, 247)" stopOpacity="0.6" />
              <stop offset="100%" stopColor="rgb(99, 102, 241)" stopOpacity="0.3" />
            </linearGradient>
          </defs>
          <rect width="100%" height="100%" fill="url(#moving-lines)" />
        </svg>

        <style>{`
          @keyframes moveLines {
            0% { transform: translate(0, 0); }
            100% { transform: translate(60px, 60px); }
          }
          #moving-lines {
            animation: moveLines 8s linear infinite;
            filter: drop-shadow(0 0 8px rgba(139, 92, 246, 0.3));
          }
        `}</style>
      </div>

      <div className="relative z-10">{children}</div>
    </div>
  );
}
