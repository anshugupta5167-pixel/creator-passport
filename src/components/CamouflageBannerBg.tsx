'use client';

import React from 'react';

interface CamouflageBannerBgProps {
  className?: string;
  gridOpacity?: string;
  bannerOpacity?: string;
}

export default function CamouflageBannerBg({
  className = '',
  gridOpacity = 'opacity-30',
  bannerOpacity = 'opacity-60',
}: CamouflageBannerBgProps) {
  return (
    <div className={`absolute inset-0 pointer-events-none overflow-hidden select-none z-0 ${className}`}>
      {/* Camouflaged Luxury Dark Geometric Tech Banner */}
      <img
        src="/chq-hero-banner.jpg"
        alt=""
        className={`w-full h-full object-cover object-center ${bannerOpacity}`}
      />

      {/* Toadster Ambient Radial Glow Atmosphere (Deep Obsidian & Indigo) */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,_rgba(56,189,248,0.12)_0%,_transparent_60%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_100%,_rgba(30,27,75,0.4)_0%,_transparent_70%)]" />

      {/* Seamless Dark Scrim */}
      <div className="absolute inset-0 bg-[#060911]/60" />

      {/* Soft Vignette dissolving smoothly at edges with no hard line cutoffs */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#060911]/90 via-transparent to-[#060911]" />

      {/* Technical Precision Grid */}
      <div className={`absolute inset-0 bg-grid-chq ${gridOpacity}`} />
    </div>
  );
}
