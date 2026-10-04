import React, { useState, useEffect } from 'react';
import { Link } from '@/compat/next';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import HeroPassShowcase from '@/components/HeroPassShowcase';
import ServiceMediaBento from '@/components/ServiceMediaBento';
import ServiceMediaSections from '@/components/ServiceMediaSections';
import CreatorComparisons from '@/components/CreatorComparisons';
import CamouflageBannerBg from '@/components/CamouflageBannerBg';
import ScrollReveal from '@/components/ScrollReveal';
import HeroAnimatedHeading from '@/components/HeroAnimatedHeading';
import { ApiStore } from '@/lib/apiStore';
import { CreatorProfile } from '@/lib/types';
import { ArrowRight } from 'lucide-react';

export default function LandingPage() {
  const [creators, setCreators] = useState<CreatorProfile[]>([]);

  useEffect(() => {
    setCreators(ApiStore.getCreators());
  }, []);

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 flex flex-col font-sans selection:bg-sky-500/30 selection:text-white relative">
      {/* Full-Page Ambient Tech Geometric Banner Across Entire Website */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <CamouflageBannerBg bannerOpacity="opacity-55" gridOpacity="opacity-35" />
      </div>

      <Navbar />

      <main className="flex-1 relative z-10">
        {/* ================= HERO SECTION (CREATORHQ MATTE GRAPHITE AESTHETIC) ================= */}
        <section id="about" className="relative overflow-hidden min-h-[90vh] md:min-h-screen flex items-center justify-center pt-28 pb-16">
          <div className="container relative px-4 md:px-6 z-10 mx-auto">
            <div className="flex flex-col gap-8 max-w-5xl mx-auto text-center">
              {/* Main Heading with Animated Text Rotation */}
              <ScrollReveal direction="up" distance={40} duration={800}>
                <div className="text-center space-y-6">
                  <HeroAnimatedHeading />
                  
                  {/* Subtitle */}
                  <p className="hero-summary text-base sm:text-lg md:text-xl text-slate-400 max-w-3xl mx-auto leading-relaxed font-normal">
                    CreatorHQ is the private creator network and talent management platform that connects content creators with brands for real, authenticated sponsorships. No fluff, just authentic collabs that make sense for you and your audience.
                  </p>
                </div>
              </ScrollReveal>

              {/* CTAs (Cool Capsule Pill Buttons - Routes to /signup for onboarding) */}
              <ScrollReveal direction="up" delay={200} distance={30} duration={700}>
                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-2">
                  <div className="p-1 rounded-full border border-sky-400/20 bg-sky-950/20 backdrop-blur-sm shadow-[0_0_24px_rgba(56,189,248,0.2)]">
                    <Link
                      href="/signup"
                      className="btn-chq-primary px-8 py-3 text-sm font-bold"
                    >
                      <span>Start Creating</span>
                      <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                    </Link>
                  </div>

                  <a
                    href="#faq"
                    className="btn-chq-secondary px-7 py-3 text-sm"
                  >
                    View Frequently Asked Questions
                  </a>
                </div>
              </ScrollReveal>

              {/* THE CREATOR PASSPORT HERO DISPLAY */}
              <ScrollReveal direction="up" delay={400} distance={50} duration={900}>
                <HeroPassShowcase initialCreators={creators} />
              </ScrollReveal>
            </div>
          </div>
        </section>

        {/* ================= MARQUEE TICKER & IMPACT STATS ================= */}
        <ScrollReveal direction="up" distance={40} duration={800}>
          <ServiceMediaBento />
        </ScrollReveal>

        {/* ================= ALL CREATORHQ SECTIONS (SERVICES, TIMELINE, TALENTS, QUICK INFO, FAQ) ================= */}
        <ScrollReveal direction="up" distance={30} duration={800}>
          <ServiceMediaSections creators={creators} />
        </ScrollReveal>

        {/* ================= PLATFORM COMPARISONS & FAQ DISCOVERY (SEO & AI INDEXED) ================= */}
        <ScrollReveal direction="up" distance={30} duration={800}>
          <CreatorComparisons />
        </ScrollReveal>

        {/* ================= FINAL CTA ================= */}
        <ScrollReveal direction="up" distance={40} duration={800}>
          <section className="py-24 sm:py-32 text-center bg-transparent relative overflow-hidden">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 relative z-10">
              <h2 className="text-4xl sm:text-5xl font-bold text-white tracking-tight leading-tight font-sans">
                Claim Your Verified<br />
                <span className="text-sky-400">
                  Creator Pass
                </span>
              </h2>
              <p className="text-sm sm:text-base text-slate-400 max-w-xl mx-auto leading-relaxed">
                Join top gaming, tech, and lifestyle creators on CreatorHQ. Customize your pass, authenticate your metrics, and showcase your profile to brands.
              </p>
              <div className="pt-3 flex justify-center">
                <div className="p-1 rounded-full border border-sky-400/20 bg-sky-950/20 backdrop-blur-sm shadow-[0_0_24px_rgba(56,189,248,0.2)]">
                  <Link
                    href="/signup"
                    className="btn-chq-primary px-9 py-3.5 text-sm font-bold"
                  >
                    <span>Create Your Creator Pass</span>
                    <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                  </Link>
                </div>
              </div>
            </div>
          </section>
        </ScrollReveal>
      </main>

      <Footer />
    </div>
  );
}
