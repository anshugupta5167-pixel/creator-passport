'use client';

import React, { useRef, useState, useCallback } from 'react';

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
  maxTilt = 7,
  scale = 1.015,
  perspective = 1000,
  glare = true,
}: TiltCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState<string>('');
  const [boxShadow, setBoxShadow] = useState<string>('');
  const [mousePos, setMousePos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState<boolean>(false);
  const rafId = useRef<number | null>(null);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const card = cardRef.current;
    if (!card) return;

    if (rafId.current) cancelAnimationFrame(rafId.current);

    rafId.current = requestAnimationFrame(() => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      const rotX = -((y - centerY) / centerY) * maxTilt;
      const rotY = ((x - centerX) / centerX) * maxTilt;

      // Realistic dynamic shadow that shifts in the opposite direction of tilt
      const shadowX = (-rotY * 1.8).toFixed(1);
      const shadowY = (rotX * 1.8 + 12).toFixed(1);

      setTransform(
        `perspective(${perspective}px) rotateX(${rotX.toFixed(2)}deg) rotateY(${rotY.toFixed(2)}deg) translateY(-4px) scale3d(${scale}, ${scale}, ${scale})`
      );
      setBoxShadow(
        `${shadowX}px ${shadowY}px 28px -4px rgba(0, 0, 0, 0.6), 0 0 1px 1px rgba(56, 189, 248, 0.15)`
      );
      setMousePos({ x, y });
    });
  }, [maxTilt, scale, perspective]);

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    if (rafId.current) cancelAnimationFrame(rafId.current);
    setIsHovered(false);
    setTransform(
      `perspective(${perspective}px) rotateX(0deg) rotateY(0deg) translateY(0px) scale3d(1, 1, 1)`
    );
    setBoxShadow('');
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`relative will-change-transform ${className}`}
      style={{
        transform: transform || undefined,
        boxShadow: boxShadow || undefined,
        transformStyle: 'preserve-3d',
        transition: isHovered
          ? 'transform 0.1s ease-out, box-shadow 0.15s ease-out, border-color 0.2s ease'
          : 'transform 0.5s cubic-bezier(0.2, 0.8, 0.2, 1), box-shadow 0.5s cubic-bezier(0.2, 0.8, 0.2, 1), border-color 0.3s ease',
      }}
    >
      {children}

      {/* Subtle interactive cursor light tracking */}
      {glare && (
        <div
          className="pointer-events-none absolute inset-0 rounded-[inherit] transition-opacity duration-300 z-30 overflow-hidden"
          style={{
            opacity: isHovered ? 1 : 0,
            background: `radial-gradient(350px circle at ${mousePos.x}px ${mousePos.y}px, rgba(56, 189, 248, 0.07), transparent 75%)`,
          }}
        />
      )}
    </div>
  );
}
