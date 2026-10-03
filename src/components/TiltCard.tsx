'use client';

import React from 'react';

interface TiltCardProps {
  children: React.ReactNode;
  className?: string;
  maxTilt?: number;
  scale?: number;
  perspective?: number;
  glare?: boolean;
}

export default function TiltCard({
  children,
  className = '',
}: TiltCardProps) {
  return (
    <div
      className={`transition-all duration-300 ease-out hover:-translate-y-1.5 hover:shadow-2xl will-change-transform ${className}`}
    >
      {children}
    </div>
  );
}
