'use client';

import React from 'react';
import AnimatedTextRotator from '@/components/AnimatedTextRotator';

const ROTATING_WORDS = [
  'Their Perfect Sponsors',
  'Real Brand Deals',
  'Massive Growth',
  'Global Reach',
  'Verified Identity',
];

export default function HeroAnimatedHeading() {
  return (
    <h1 className="hero-heading text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight leading-tight text-white font-sans">
      Where Creators Find<br />
      <span className="text-sky-400">
        <AnimatedTextRotator
          words={ROTATING_WORDS}
          interval={2800}
          className="text-sky-400"
        />
      </span>
    </h1>
  );
}
