'use client';

import React from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import CamouflageBannerBg from '@/components/CamouflageBannerBg';
import TechShowcaseBanner from '@/components/TechShowcaseBanner';
import {
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import {
  BrandDealsSvg,
  GlobalTalentSvg,
  AuditedPrecisionSvg,
  MultiPlatformSvg,
  CryptoPassSvg,
  PrivacyShieldSvg
} from '@/components/RichSvgIcons';

const services = [
  {
    iconSvg: BrandDealsSvg,
    title: 'Sponsorship Matchmaking',
    desc: 'Connecting authentic creators directly with Tier-1 brand sponsors at 0% commission cuts.',
  },
  {
    iconSvg: GlobalTalentSvg,
    title: 'Talent Management & Growth',
    desc: 'Dedicated career advisory, schedule coordination, and brand positioning for ambitious channels.',
  },
  {
    iconSvg: AuditedPrecisionSvg,
    title: 'Contract Negotiation',
    desc: 'Reviewing every agreement to protect creator IP and guarantee escrow payments on milestones.',
  },
  {
    iconSvg: MultiPlatformSvg,
    title: 'Multi-Platform Verification',
    desc: 'High-retention analytics audits, YouTube Studio verification, and Discord community metrics.',
  },
  {
    iconSvg: CryptoPassSvg,
    title: 'Sovereign Brand Identity',
    desc: 'Tamper-proof digital media kits, verified badges, and passkey watermarks that command brand trust.',
  },
  {
    iconSvg: PrivacyShieldSvg,
    title: 'Privacy & Freeze Controls',
    desc: 'Instant pause controls for creators on hiatus, automated role verification bots, and moderation security.',
  },
];

export default function ServicesPage() {
  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 flex flex-col font-sans selection:bg-sky-500/30 selection:text-white pt-20">
      <Navbar />

      <main className="flex-1 relative">
        {/* Full-Page Ambient Tech Geometric Banner */}
        <div className="fixed inset-0 pointer-events-none z-0">
          <CamouflageBannerBg bannerOpacity="opacity-45" gridOpacity="opacity-30" />
        </div>

        {/* Hero Header */}
        <section className="relative pt-24 sm:pt-32 pb-16 z-10">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl text-center space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-sky-500/25 bg-sky-500/10 px-4 py-1.5 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-sky-400 shadow-[0_0_8px_#38bdf8]" />
              <span className="text-xs sm:text-sm font-bold text-sky-400 font-mono tracking-wider">
                CREATOR SERVICES
              </span>
            </div>

            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white leading-tight font-sans">
              Infrastructure & Services<br />
              <span className="bg-gradient-to-r from-sky-400 via-cyan-300 to-sky-500 bg-clip-text text-transparent">
                Built For Serious Creators
              </span>
            </h1>

            <p className="text-base sm:text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed font-normal">
              From cryptographic pass verification to comprehensive contract negotiation and sponsorship matchmaking, CreatorHQ powers top YouTube channels and Discord communities.
            </p>

            <div className="pt-4 flex justify-center">
              <div className="p-1 rounded-full border border-sky-400/20 bg-sky-950/20 backdrop-blur-sm shadow-[0_0_24px_rgba(56,189,248,0.2)]">
                <Link
                  href="/signup"
                  className="btn-chq-primary px-8 py-3.5 text-sm font-extrabold flex items-center gap-2"
                >
                  <span>Start Creating</span>
                  <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Clean, Big Text, Solid Boxed Services Grid */}
        <section className="relative py-16 sm:py-24 z-10">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {services.map((service) => {
                const IconSvg = service.iconSvg;
                return (
                  <div
                    key={service.title}
                    className="p-8 sm:p-10 rounded-3xl bg-[#090d16]/90 border border-white/10 hover:border-sky-400/50 transition-all duration-300 hover:-translate-y-1 shadow-2xl flex flex-col justify-between group backdrop-blur-md"
                  >
                    <div className="space-y-6">
                      <IconSvg className="w-14 h-14" size={56} />
                      <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-sans">
                        {service.title}
                      </h3>
                      <p className="text-base sm:text-lg text-slate-300 leading-relaxed font-normal">
                        {service.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* High-Impact Tech Showcase Banner */}
            <div className="mt-16">
              <TechShowcaseBanner
                badge="SCALE YOUR CHANNEL"
                title="Monetize Directly With Vetted Brand Deals"
                subtitle="Join our network of verified content creators. Secure brand contracts with 100% payout transparency and zero agency commission cuts."
                ctaText="Start Creating"
                ctaHref="/signup"
                secondaryCtaText="Explore Talents"
                secondaryCtaHref="/talents"
              />
            </div>
          </div>
        </section>

        {/* Final Clean CTA Section */}
        <section className="relative py-20 sm:py-28 text-center z-10">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-3xl space-y-6">
            <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight font-sans">
              Ready to elevate your creator business?
            </h2>
            <p className="text-base sm:text-lg text-slate-300 leading-relaxed">
              Mint your official Creator ID pass and access our verified partner network today.
            </p>
            <div className="pt-2 flex justify-center">
              <div className="p-1 rounded-full border border-sky-400/20 bg-sky-950/20 backdrop-blur-sm shadow-[0_0_24px_rgba(56,189,248,0.2)]">
                <Link
                  href="/signup"
                  className="btn-chq-primary px-8 py-3.5 text-sm font-extrabold flex items-center gap-2"
                >
                  <span>Start Creating</span>
                  <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
