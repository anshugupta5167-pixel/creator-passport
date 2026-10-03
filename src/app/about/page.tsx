'use client';

import React from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import TiltCard from '@/components/TiltCard';
import CamouflageBannerBg from '@/components/CamouflageBannerBg';
import TechShowcaseBanner from '@/components/TechShowcaseBanner';
import {
  AuditedPrecisionSvg,
  CryptoPassSvg,
  PrivacyShieldSvg,
  GlobalTalentSvg,
  BrandDealsSvg
} from '@/components/RichSvgIcons';
import {
  ShieldCheck,
  CheckCircle2,
  Lock,
  ArrowRight,
  TrendingUp,
  Award,
  Globe2,
  Building2,
  FileCheck2,
  Sparkles,
  Users2,
  Layers,
} from 'lucide-react';

const corePillars = [
  {
    icon: ShieldCheck,
    title: 'Sovereign Identity',
    desc: 'Your audience reach belongs to you, not an agency. Your Creator Pass is a standalone verifiable asset with cryptographic passkeys that you own and control.',
  },
  {
    icon: Lock,
    title: 'Instant Card Freeze',
    desc: 'Pause your public credential at any moment. When renegotiating sponsorships or taking a hiatus, freeze your pass with one tap to halt inbound brand queries.',
  },
  {
    icon: FileCheck2,
    title: 'Manual Staff Audits',
    desc: 'No AI hallucinations or fake numbers. Every YouTube channel and Discord server is audited by CreatorHQ Trust & Safety staff before verified status is granted.',
  },
  {
    icon: Users2,
    title: 'Direct Brand Connections',
    desc: 'Eliminate middlemen taking 30% to 50% cuts. Brands scan your QR code or visit your canonical URL on creatorhq.fun to inspect verified metrics directly.',
  },
];

const leadershipTeam = [
  {
    name: 'Anshu Gupta',
    role: 'Founder & CEO',
    monogram: 'AG',
    badge: 'Founder',
    accentColor: 'from-sky-500/20 via-sky-600/30 to-[#0c1017]',
    borderColor: 'border-sky-400/40 group-hover:border-sky-400',
    textColor: 'text-sky-300',
    bio: 'Visionary behind CreatorHQ. Founded the platform in September 2026 to pioneer verifiable creator identity, fraud-proof media analytics, and direct brand sponsorship networks.',
  },
  {
    name: 'Pranav Sharma',
    role: 'Co-Founder & COO',
    monogram: 'PS',
    badge: 'Co-Founder',
    accentColor: 'from-indigo-500/20 via-purple-600/30 to-[#0c1017]',
    borderColor: 'border-indigo-400/40 group-hover:border-indigo-400',
    textColor: 'text-indigo-300',
    bio: 'Creator ecosystem architect. Spearheads creator partnerships, trust & verification protocol operations, and scaling high-conviction brand sponsor deals.',
  },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 flex flex-col font-sans selection:bg-sky-500/30 selection:text-white pt-20">
      <Navbar />

      <main className="flex-1 relative">
        {/* Full-Page Ambient Tech Geometric Banner */}
        <div className="fixed inset-0 pointer-events-none z-0">
          <CamouflageBannerBg bannerOpacity="opacity-55" gridOpacity="opacity-35" />
        </div>
        
        {/* ================= ABOUT HERO ================= */}
        <section className="relative pt-24 sm:pt-32 pb-16 z-10">
          <div className="container relative z-10 mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl text-center space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-sky-500/25 bg-sky-500/10 px-4 py-1.5 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-sky-400 shadow-[0_0_8px_#38bdf8]" />
              <span className="text-xs sm:text-sm font-bold text-sky-400 font-mono tracking-wider">
                ABOUT CREATORHQ
              </span>
            </div>

            <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-white leading-tight font-sans">
              The Architecture of<br />
              <span className="bg-gradient-to-r from-sky-400 via-cyan-300 to-sky-500 bg-clip-text text-transparent">
                Creator Credibility
              </span>
            </h1>

            <p className="text-base sm:text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed">
              CreatorHQ was founded with a singular conviction: independent online creators should own verified, fraud-proof credentials that establish instant trust with global sponsors.
            </p>

            <div className="flex flex-wrap justify-center items-center gap-4 pt-4">
              <div className="p-1 rounded-full border border-sky-400/20 bg-sky-950/20 backdrop-blur-sm shadow-[0_0_24px_rgba(56,189,248,0.2)]">
                <Link
                  href="/signup"
                  className="btn-chq-primary px-8 py-3.5 text-sm font-extrabold flex items-center gap-2"
                >
                  <span>Start Creating</span>
                  <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                </Link>
              </div>

              <Link
                href="/talents"
                className="btn-chq-secondary px-7 py-3.5 text-sm font-semibold"
              >
                Explore Verified Talent Roster
              </Link>
            </div>
          </div>
        </section>

        {/* ================= ORIGIN STORY: THE PROBLEM & OUR SOLUTION ================= */}
        <section className="py-20 bg-transparent">
          <div className="container mx-auto px-4 md:px-6 max-w-6xl">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              
              <div className="lg:col-span-6 space-y-6">
                <span className="text-xs font-mono uppercase tracking-widest text-sky-400 font-semibold block">
                  ORIGIN STORY
                </span>
                <h2 className="text-3xl sm:text-4xl font-bold text-white font-sans tracking-tight">
                  Why We Built CreatorHQ
                </h2>
                <div className="space-y-4 text-sm sm:text-base text-slate-300 leading-relaxed">
                  <p>
                    For over a decade, creator sponsorship negotiations have been trapped in chaotic email chains, out-of-date PDF media kits, and inflated follower counts. Real creators with deeply engaged audiences struggled to separate themselves from bad actors buying views.
                  </p>
                  <p>
                    At the same time, legacy talent agencies positioned themselves as gatekeepers, charging 30% to 50% commissions simply to verify that a channel was genuine.
                  </p>
                  <p>
                    We built CreatorHQ to replace this fragmented mess with a sovereign digital credential: an interactive 3D Creator Pass minted through manual staff audits of real YouTube Studio and Discord Server analytics.
                  </p>
                </div>
              </div>

              {/* Technical Architecture Bento */}
              <div className="lg:col-span-6 space-y-4">
                <TiltCard maxTilt={6} className="p-7 rounded-2xl bg-[#090d16]/90 backdrop-blur-md border border-white/15 hover:border-sky-400/60 transition-colors space-y-3 shadow-md">
                  <div className="flex items-center gap-3">
                    <AuditedPrecisionSvg className="w-8 h-8" size={32} />
                    <span className="text-sky-400 font-semibold text-xs uppercase tracking-wider font-mono">Audited Data Proof</span>
                  </div>
                  <h3 className="text-xl font-bold text-white font-sans">No Passwords or Tokens</h3>
                  <p className="text-base text-slate-300 leading-relaxed font-sans font-normal">
                    Creators never share sensitive credentials or OAuth tokens. Verification relies on staff review of official studio dashboards and public network validation.
                  </p>
                </TiltCard>

                <TiltCard maxTilt={6} className="p-7 rounded-2xl bg-[#090d16]/90 backdrop-blur-md border border-white/15 hover:border-sky-400/60 transition-colors space-y-3 shadow-md">
                  <div className="flex items-center gap-3">
                    <CryptoPassSvg className="w-8 h-8" size={32} />
                    <span className="text-sky-400 font-semibold text-xs uppercase tracking-wider font-mono">Canonical Creator Domain</span>
                  </div>
                  <h3 className="text-xl font-bold text-white font-sans">Universal creatorhq.fun Passkey</h3>
                  <p className="text-base text-slate-300 leading-relaxed font-sans font-normal">
                    Every creator receives a permanent, public verification link and high-resolution QR passkey for sponsor decks, video descriptions, and rate cards.
                  </p>
                </TiltCard>

                <TiltCard maxTilt={6} className="p-7 rounded-2xl bg-[#090d16]/90 backdrop-blur-md border border-white/15 hover:border-sky-400/60 transition-colors space-y-3 shadow-md">
                  <div className="flex items-center gap-3">
                    <PrivacyShieldSvg className="w-8 h-8" size={32} />
                    <span className="text-sky-400 font-semibold text-xs uppercase tracking-wider font-mono">Cryptographic Pass Freeze</span>
                  </div>
                  <h3 className="text-xl font-bold text-white font-sans">Full Creator Sovereignty</h3>
                  <p className="text-base text-slate-300 leading-relaxed font-sans font-normal">
                    Instantly freeze your credentials with zero downtime. Maintain total privacy whenever taking breaks or reviewing exclusive contractual windows.
                  </p>
                </TiltCard>
              </div>

            </div>
          </div>
        </section>

        {/* ================= 4 CORE PILLARS ================= */}
        <section className="py-24 bg-[#0b0d11] border-b border-white/5">
          <div className="container mx-auto px-4 md:px-6 max-w-7xl">
            <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
              <span className="text-xs font-mono uppercase tracking-widest text-sky-400 font-semibold block">
                OUR OPERATING PHILOSOPHY
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold text-white font-sans">
                The Four Pillars of Creator Sovereignty
              </h2>
              <p className="text-base sm:text-lg text-slate-400 leading-relaxed">
                The core architectural standards guiding how CreatorHQ designs credentials and handles network verification.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {corePillars.map((pillar) => {
                const Icon = pillar.icon;
                return (
                  <TiltCard
                    key={pillar.title}
                    maxTilt={9}
                    scale={1.02}
                    className="p-7 rounded-2xl bg-[#12151c] border border-white/15 hover:border-sky-400/60 transition-colors space-y-4 shadow-lg flex flex-col justify-between group cursor-default"
                  >
                    <div className="space-y-4" style={{ transform: 'translateZ(18px)' }}>
                      <div className="w-12 h-12 rounded-xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-400 group-hover:scale-110 group-hover:border-sky-400/50 group-hover:bg-sky-500/20 transition-all duration-300">
                        <Icon className="w-6 h-6" />
                      </div>
                      <h3 className="text-xl font-bold text-white font-sans group-hover:text-sky-300 transition-colors">
                        {pillar.title}
                      </h3>
                      <p className="text-sm sm:text-base text-slate-200 leading-relaxed font-sans font-normal">
                        {pillar.desc}
                      </p>
                    </div>
                  </TiltCard>
                );
              })}
            </div>
          </div>
        </section>

        {/* ================= NETWORK SCALE & METRICS ================= */}
        <section className="py-20 bg-[#0e1117] border-b border-white/5">
          <div className="container mx-auto px-4 md:px-6 max-w-6xl">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              <div className="space-y-1">
                <span className="text-3xl sm:text-5xl font-extrabold text-white font-mono">100+</span>
                <span className="text-xs text-slate-400 block font-sans">Audited Creators</span>
              </div>
              <div className="space-y-1">
                <span className="text-3xl sm:text-5xl font-extrabold text-sky-400 font-mono">$4.2M+</span>
                <span className="text-xs text-slate-400 block font-sans">Verified Sponsorships</span>
              </div>
              <div className="space-y-1">
                <span className="text-3xl sm:text-5xl font-extrabold text-white font-mono">18.5M+</span>
                <span className="text-xs text-slate-400 block font-sans">Combined Reach</span>
              </div>
              <div className="space-y-1">
                <span className="text-3xl sm:text-5xl font-extrabold text-emerald-400 font-mono">0%</span>
                <span className="text-xs text-slate-400 block font-sans">Agency Commission</span>
              </div>
            </div>
          </div>
        </section>

        {/* ================= LEADERSHIP & TRUST TEAM ================= */}
        <section className="py-24 bg-[#0b0d11]">
          <div className="container mx-auto px-4 md:px-6 max-w-6xl">
            <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
              <span className="text-xs font-mono uppercase tracking-widest text-sky-400 font-semibold block">
                TEAM & LEADERSHIP
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold text-white font-sans">
                Built by Creators for Creators
              </h2>
              <p className="text-sm sm:text-base text-slate-400 leading-relaxed">
                Our leadership team brings deep background across gaming production, identity systems, and high-stakes brand negotiation.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {leadershipTeam.map((member) => (
                <TiltCard
                  key={member.name}
                  maxTilt={8}
                  scale={1.02}
                  className="p-7 rounded-2xl bg-[#12151c] border border-white/15 hover:border-sky-400/60 transition-colors space-y-4 text-center flex flex-col items-center shadow-lg cursor-default group"
                >
                  <div className="flex flex-col items-center space-y-4" style={{ transform: 'translateZ(16px)' }}>
                    <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${member.accentColor} border-2 ${member.borderColor} flex flex-col items-center justify-center transition-all shadow-xl backdrop-blur-md`}>
                      <span className={`text-2xl font-black font-mono tracking-wider ${member.textColor}`}>
                        {member.monogram}
                      </span>
                      <span className="text-[9px] font-mono uppercase tracking-widest text-slate-400 font-semibold">
                        {member.badge}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white font-sans group-hover:text-sky-300 transition-colors">{member.name}</h3>
                      <span className="text-xs text-sky-400 font-semibold">{member.role}</span>
                    </div>
                    <p className="text-sm sm:text-base text-slate-200 leading-relaxed font-sans font-normal">
                      {member.bio}
                    </p>
                  </div>
                </TiltCard>
              ))}
            </div>

            <div className="mt-12 text-center">
              <Link
                href="/founders"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-sky-400 hover:text-white border border-white/10 text-sm font-semibold transition-all hover:scale-105"
              >
                <span>Read Full Story & Meet Founders Anshu Gupta & Pranav Sharma</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>

        {/* ================= HIGH-IMPACT SHOWCASE BANNER ================= */}
        <section className="py-8 bg-transparent">
          <div className="container mx-auto px-4 md:px-6 max-w-6xl">
            <TechShowcaseBanner
              badge="INDEPENDENT CREATOR SOVEREIGNTY"
              title="Own Your Reach. Keep 100% of Your Earnings."
              subtitle="Stop giving away 30-50% to outdated management agencies. Mint your official Creator Pass and partner directly with world-class sponsors."
              ctaText="Start Creating"
              ctaHref="/signup"
              secondaryCtaText="Meet The Founders"
              secondaryCtaHref="/founders"
            />
          </div>
        </section>

        {/* ================= FINAL ABOUT CTA ================= */}
        <section className="py-20 bg-transparent text-center">
          <div className="container mx-auto px-4 md:px-6 max-w-3xl space-y-6">
            <h2 className="text-3xl sm:text-4xl font-bold text-white font-sans">
              Experience the Future of Creator Identity
            </h2>
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
              Mint your official pass today or explore our directory of top YouTube and Discord talents.
            </p>
            <div className="pt-2 flex flex-wrap justify-center gap-4">
              <div className="p-1 rounded-full border border-sky-400/20 bg-sky-950/20 backdrop-blur-sm shadow-[0_0_24px_rgba(56,189,248,0.2)]">
                <Link
                  href="/signup"
                  className="btn-chq-primary px-8 py-3.5 text-sm font-extrabold flex items-center gap-2"
                >
                  <span>Start Creating</span>
                  <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                </Link>
              </div>
              <Link
                href="/contact"
                className="btn-chq-secondary px-8 py-3.5 text-sm font-semibold"
              >
                Contact Partnership Desk
              </Link>
            </div>
          </div>
        </section>

      </main>

      <Footer />
    </div>
  );
}
