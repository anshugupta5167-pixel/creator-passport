import React from 'react';
import { Metadata } from 'next';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import AuthCard from '@/components/AuthCard';
import CamouflageBannerBg from '@/components/CamouflageBannerBg';

export const metadata: Metadata = {
  title: 'Create Account – CreatorHQ Sovereign Creator Network',
  description: 'Join the private creator network. Mint your sovereign digital passport and connect with verified brands for authenticated sponsorships.',
};

export default function SignUpPage() {
  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 flex flex-col font-sans selection:bg-sky-500/30 selection:text-white relative">
      <Navbar />

      {/* Seamless Luxury Tech Banner Background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <CamouflageBannerBg bannerOpacity="opacity-50" gridOpacity="opacity-25" />
      </div>

      {/* Dedicated Centered Auth View with Generous Breathing Room */}
      <main className="flex-1 flex items-center justify-center px-4 py-28 sm:py-32 relative z-10">
        <div className="w-full max-w-md">
          <AuthCard initialMode="signup" />
        </div>
      </main>

      <Footer />
    </div>
  );
}
