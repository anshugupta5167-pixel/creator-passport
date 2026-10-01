'use client';

import React, { useState, useEffect, useCallback } from 'react';

interface AnimatedTextRotatorProps {
  words: string[];
  interval?: number;
  className?: string;
}

export default function AnimatedTextRotator({
  words,
  interval = 2800,
  className = '',
}: AnimatedTextRotatorProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [animState, setAnimState] = useState<'visible' | 'exiting' | 'entering'>('visible');

  const cycleWord = useCallback(() => {
    setAnimState('exiting');

    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % words.length);
      setAnimState('entering');

      setTimeout(() => {
        setAnimState('visible');
      }, 400);
    }, 400);
  }, [words.length]);

  useEffect(() => {
    const timer = setInterval(cycleWord, interval);
    return () => clearInterval(timer);
  }, [cycleWord, interval]);

  const getTransformStyle = (): React.CSSProperties => {
    switch (animState) {
      case 'exiting':
        return {
          transform: 'translateY(-100%)',
          opacity: 0,
          transition: 'all 0.4s cubic-bezier(0.76, 0, 0.24, 1)',
        };
      case 'entering':
        return {
          transform: 'translateY(0)',
          opacity: 1,
          transition: 'all 0.4s cubic-bezier(0.22, 1, 0.36, 1)',
        };
      case 'visible':
      default:
        return {
          transform: 'translateY(0)',
          opacity: 1,
          transition: 'all 0.4s cubic-bezier(0.22, 1, 0.36, 1)',
        };
    }
  };

  const getInitialStyle = (): React.CSSProperties => {
    if (animState === 'entering') {
      return {
        transform: 'translateY(100%)',
        opacity: 0,
      };
    }
    return {};
  };

  return (
    <span
      className={`inline-block overflow-hidden align-bottom ${className}`}
      style={{ height: '1.15em', verticalAlign: 'bottom', position: 'relative' }}
    >
      <span
        key={currentIndex}
        className="inline-block"
        style={{
          display: 'inline-block',
          ...getInitialStyle(),
          ...getTransformStyle(),
          willChange: 'transform, opacity',
        }}
      >
        {words[currentIndex]}
      </span>
    </span>
  );
}
