'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface FancyTextProps {
  children: string;
  className?: string;
  fillClassName?: string;
  stagger?: number;
  duration?: number;
  delay?: number;
}

export const FancyText: React.FC<FancyTextProps> = ({
  children,
  className = '',
  fillClassName = '',
  stagger = 0.06,
  duration = 1.2,
  delay = 0.2,
}) => {
  const letters = children.split('');

  return (
    <div className={className}>
      {letters.map((letter, index) => (
        <motion.span
          key={index}
          className={`inline-block ${fillClassName}`}
          initial={{
            opacity: 0,
            y: 10,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            duration: duration,
            delay: delay + index * stagger,
            ease: 'easeOut',
          }}
        >
          {letter === ' ' ? '\u00A0' : letter}
        </motion.span>
      ))}
    </div>
  );
};
