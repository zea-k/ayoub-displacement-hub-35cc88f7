'use client';

import React, { useMemo, ReactNode } from 'react';
import { motion } from 'framer-motion';

interface SquonkProps {
  children: ReactNode;
  size?: number;
  elasticity?: number;
  cycleDuration?: number;
  easing?: string;
  squashAmount?: number;
  stretchAmount?: number;
  bounceHeight?: number;
  radius?: number;
}

interface SquonkContentProps {
  children: ReactNode;
  index: number;
  className?: string;
}

export const Squonk: React.FC<SquonkProps> = ({
  children,
  size = 96,
  elasticity = 1.2,
  cycleDuration = 4000,
  easing = 'linear',
  squashAmount = 40,
  stretchAmount = 25,
  bounceHeight = 12,
  radius = 22,
}) => {
  const childArray = React.Children.toArray(children);
  const numChildren = childArray.length;
  
  const itemDuration = useMemo(() => {
    return numChildren > 0 ? cycleDuration / numChildren : cycleDuration;
  }, [numChildren, cycleDuration]);

  return (
    <div
      className="relative inline-flex items-center justify-center"
      style={{
        width: `${size + 40}px`,
        height: `${size + 40}px`,
      }}
    >
      {childArray.map((child, index) => {
        if (numChildren === 0) return null;
        
        const angle = (index / numChildren) * Math.PI * 2;
        const radiusVal = (size + 40) / 2 - 20;
        const x = Math.cos(angle) * radiusVal;
        const y = Math.sin(angle) * radiusVal;

        const delayInSeconds = (index * itemDuration) / 1000;
        const durationInSeconds = itemDuration / 1000;

        return (
          <motion.div
            key={index}
            className="absolute"
            style={{
              width: size,
              height: size,
              borderRadius: radius,
            }}
            animate={{
              x: [x, 0, x],
              y: [y, 0, y],
              scale: [0.7, 1, 0.7],
              opacity: [0.3, 1, 0.3],
            }}
            transition={{
              times: [0, 0.5, 1],
              duration: durationInSeconds,
              delay: delayInSeconds,
              repeat: Infinity,
              ease: easing as any,
            }}
          >
            <div className="w-full h-full rounded-lg overflow-hidden">
              {child}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};

export const SquonkContent: React.FC<SquonkContentProps> = ({
  children,
  index,
  className = '',
}) => {
  return (
    <div className={`w-full h-full ${className}`}>
      {children}
    </div>
  );
};
