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
    <div className="min-h-screen bg-[#0b0d11] text-slate-100 flex flex-col font-sans pt-20 relative overflow-hidden">
      <Navbar />

      <div className="absolute top-0 inset-x-0 h-[600px] pointer-events-none overflow-hidden">
        <CamouflageBannerBg />
      </div>

      <main className="flex-1 relative z-10">
        <CreatorComparisons />
      </main>

      <Footer />
    </div>
  );
}
