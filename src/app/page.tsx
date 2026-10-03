import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import HomeCamouflageBanner from '@/components/HomeCamouflageBanner';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 flex flex-col font-sans selection:bg-sky-500/30 selection:text-white">
      <Navbar />

      <main className="flex-1 flex items-center relative z-10">
        <section className="w-full pt-20 pb-8 sm:pt-24 sm:pb-12">
          <HomeCamouflageBanner />
        </section>
      </main>

      <Footer />
    </div>
  );
}
