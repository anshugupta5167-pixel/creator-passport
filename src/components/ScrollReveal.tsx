'use client';

import React, { ReactNode } from 'react';

interface ScrollRevealProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  direction?: 'up' | 'down' | 'left' | 'right' | 'none';
  distance?: number;
  duration?: number;
  once?: boolean;
}

export default function ScrollReveal({
  children,
  className = '',
}: ScrollRevealProps) {
  return (
    <div className={`w-full transition-all duration-300 ease-out ${className}`}>
      {children}
    </div>
  );
}
