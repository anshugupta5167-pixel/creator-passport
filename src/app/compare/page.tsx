import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import CamouflageBannerBg from '@/components/CamouflageBannerBg';
import CreatorComparisons from '@/components/CreatorComparisons';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Compare CreatorHQ vs Linktree, Beacons & Alternatives',
  description:
    'Detailed comparison between CreatorHQ sovereign creator passports and alternatives like Linktree, Beacons, Bento, Stan Store, and Discord Roles. Free verified credentials for YouTube and Discord creators.',
};

export default function ComparePage() {
  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 flex flex-col font-sans pt-20 relative">
      <Navbar />

      <div className="fixed inset-0 pointer-events-none z-0">
        <CamouflageBannerBg bannerOpacity="opacity-55" gridOpacity="opacity-35" />
      </div>

      <main className="flex-1 relative z-10">
        <CreatorComparisons />
      </main>

      <Footer />
    </div>
  );
}
