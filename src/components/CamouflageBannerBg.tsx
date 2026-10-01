'use client';

import React from 'react';

interface CamouflageBannerBgProps {
  className?: string;
  gridOpacity?: string;
  bannerOpacity?: string;
}

export default function CamouflageBannerBg({
  className = '',
  gridOpacity = 'opacity-35',
  bannerOpacity = 'opacity-85',
}: CamouflageBannerBgProps) {
  return (
    <div className={`absolute inset-0 pointer-events-none overflow-hidden select-none z-0 ${className}`}>
      {/* Camouflaged Luxury Dark Geometric Tech Banner */}
      <img
        src="/chq-hero-banner.jpg"
        alt=""
        className={`w-full h-full object-cover object-center ${bannerOpacity}`}
      />

      {/* Subtle Dark Scrim: gives text high contrast readability without washing out the banner */}
      <div className="absolute inset-0 bg-[#0b0d11]/45" />

      {/* Soft Vignette at very top and bottom edges so it dissolves smoothly into page sections */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0b0d11]/80 via-transparent to-[#0b0d11]" />

      {/* Technical Precision Grid on top of the banner */}
      <div className={`absolute inset-0 bg-grid-chq ${gridOpacity}`} />
    </div>
  );
}
