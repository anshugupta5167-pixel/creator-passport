import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import CamouflageBannerBg from '@/components/CamouflageBannerBg';
import TiltCard from '@/components/TiltCard';
import {
  ShieldCheck,
  CheckCircle2,
  Award,
  Sparkles,
  ArrowRight,
  Globe,
  Quote,
  Zap,
  Target,
  Users2,
  Lock,
  Layers,
  ExternalLink
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Founders & Leadership | CreatorHQ – Founded by Anshu Gupta & Pranav Sharma',
  description:
    'Meet Founder Anshu Gupta and Co-Founder Pranav Sharma, the architects behind CreatorHQ – the sovereign creator verification network and digital passport infrastructure.',
  keywords: [
    'Anshu Gupta',
    'Pranav Sharma',
    'CreatorHQ Founder',
    'CreatorHQ Co-Founder',
    'Creator Passport Founders',
    'Creator Identity',
    'Creator Verification Network'
  ],
  openGraph: {
    title: 'Founders & Leadership | CreatorHQ',
    description:
      'Meet Founder Anshu Gupta and Co-Founder Pranav Sharma, architects of the CreatorHQ verification infrastructure.',
    type: 'website',
  },
};

export default function FoundersPage() {
  const founders = [
    {
      name: 'Anshu Gupta',
      role: 'Founder & Chief Executive Officer',
      badge: 'Founder',
      monogram: 'AG',
      accentColor: 'from-sky-500/20 via-sky-600/30 to-[#0c1017]',
      borderColor: 'border-sky-400/40 group-hover:border-sky-400',
      textColor: 'text-sky-300',
      quote:
        '“In an internet flooded with artificial metrics and bought followers, genuine creators deserve an unforgeable sovereign passport that brands respect on sight.”',
      bio: [
        'Anshu Gupta founded CreatorHQ in September 2026 with a bold ambition: to build the world’s most trusted cryptographic credential and monetization infrastructure for online creators.',
        'Recognizing that traditional agencies take 30% to 50% cuts while providing zero technical transparency, Anshu architected the concept of the 3D verifiable Creator Pass – bringing audit-grade verification to YouTube channels and Discord servers.',
        'As CEO, Anshu steers executive strategy, protocol security, global ecosystem partnerships, and institutional brand relationships across gaming, tech, and digital entertainment sectors.'
      ],
      focus: ['Executive Strategy', 'Cryptographic Infrastructure', 'Brand Alliances', 'Core Governance'],
      stats: [
        { label: 'Founded', value: 'Sept 2026' },
        { label: 'Ecosystem', value: 'Global' },
        { label: 'Philosophy', value: 'Zero Fake Metrics' }
      ]
    },
    {
      name: 'Pranav Sharma',
      role: 'Co-Founder & Chief Operating Officer',
      badge: 'Co-Founder',
      monogram: 'PS',
      accentColor: 'from-indigo-500/20 via-purple-600/30 to-[#0c1017]',
      borderColor: 'border-indigo-400/40 group-hover:border-indigo-400',
      textColor: 'text-indigo-300',
      quote:
        '“We treat creator careers like elite athletics. High-growth creators need real-time data synchronization, audit trails, and instant access to blue-chip sponsor capital.”',
      bio: [
        'Pranav Sharma serves as Co-Founder and Chief Operating Officer of CreatorHQ, orchestrating the platform’s day-to-day operations, creator onboarding pipelines, and operational scalability.',
        'With extensive expertise in creator talent dynamics, community infrastructure, and digital distribution, Pranav designed the human-in-the-loop Trust & Verification auditing protocol that ensures zero fraudulent passes exist on the network.',
        'Pranav works directly with top gaming creators, streaming collectives, and brand marketers to turn verified digital passports into multi-year sponsorship contracts.'
      ],
      focus: ['Creator Onboarding', 'Trust & Verification Operations', 'Talent Scaling', 'Community Growth'],
      stats: [
        { label: 'Protocol', value: 'Human-in-the-Loop' },
        { label: 'Network', value: 'Creator-First' },
        { label: 'Standard', value: 'Verified Tier I' }
      ]
    }
  ];

  const milestones = [
    {
      year: 'September 2026',
      title: 'Genesis of CreatorHQ',
      desc: 'Founded by Anshu Gupta with Co-Founder Pranav Sharma to solve metric manipulation, fraudulent creator media kits, and parasitic agency commissions.'
    },
    {
      year: 'Q4 2026',
      title: '3D Pass Engine & Dual Verification',
      desc: 'Engineered real-time YouTube Studio & Discord server OAuth verification with cryptographic passkeys, IP fraud prevention, and human staff audits.'
    },
    {
      year: '2027 Vision',
      title: 'Global Brand Settlement & Sovereign Talent Network',
      desc: 'Direct brand-to-creator escrow contracts, verified talent syndication, and sovereign digital identity for creators worldwide.'
    }
  ];

  const corePillars = [
    {
      icon: ShieldCheck,
      title: 'Zero Compromise on Verification',
      desc: 'No bot-driven checkmarks. Every creator pass is validated through verified platform APIs and manual staff auditing.'
    },
    {
      icon: Zap,
      title: 'Real-Time Synchronized Identity',
      desc: 'When verification status or metrics update, our real-time streaming engine synchronizes public cards, directory listings, and profiles instantly.'
    },
    {
      icon: Target,
      title: 'Direct Creator Empowerment',
      desc: 'Creators own their credentials forever. Share your canonical link or QR code directly with brands and keep 100% of your sponsor revenue.'
    },
    {
      icon: Lock,
      title: 'Privacy & Security Guardrails',
      desc: 'IP locking prevents unauthorized duplicate registrations. Creators maintain one authoritative passport backed by state-of-the-art security.'
    }
  ];

  return (
    <div className="min-h-screen bg-[#0b0d11] text-slate-100 flex flex-col font-sans selection:bg-sky-500/30 selection:text-white pt-20">
      <Navbar />

      <main className="flex-1">
        {/* ================= HERO SECTION ================= */}
        <section className="relative py-20 sm:py-28 bg-[#0b0d11] overflow-hidden border-b border-white/5">
          <CamouflageBannerBg bannerOpacity="opacity-25" gridOpacity="opacity-20" />

          <div className="container relative z-10 mx-auto px-4 md:px-6 max-w-5xl text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 text-xs font-semibold tracking-wide uppercase font-mono">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Founders & Leadership</span>
            </div>

            <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-white leading-tight font-sans">
              The Vision Behind<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-teal-300 to-sky-200">
                CreatorHQ
              </span>
            </h1>

            <p className="text-base sm:text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed font-sans">
              Founded in September 2026 by <span className="text-white font-semibold">Anshu Gupta</span> alongside Co-Founder <span className="text-white font-semibold">Pranav Sharma</span>, CreatorHQ was built to eliminate fake metrics and establish a sovereign, verifiable identity standard for online creators worldwide.
            </p>

            <div className="flex flex-wrap justify-center gap-4 pt-4">
              <Link
                href="/dashboard"
                className="px-7 py-3.5 rounded-xl btn-chq-primary text-xs font-semibold flex items-center gap-2 text-white shadow-lg shadow-sky-500/10 hover:shadow-sky-500/25 transition-all"
              >
                <span>Launch Creator Studio</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/talents"
                className="px-7 py-3.5 rounded-xl btn-chq-secondary text-xs font-semibold text-slate-200 hover:text-white"
              >
                Explore Verified Roster
              </Link>
            </div>
          </div>
        </section>

        {/* ================= DETAILED FOUNDERS SHOWCASE ================= */}
        <section className="py-20 sm:py-28 bg-[#0e1117] border-b border-white/5 relative">
          <div className="container mx-auto px-4 md:px-6 max-w-6xl space-y-20">
            
            <div className="text-center max-w-2xl mx-auto space-y-3">
              <span className="text-xs font-mono uppercase tracking-widest text-sky-400 font-semibold block">
                EXECUTIVE LEADERSHIP
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
                Architects of the Sovereign Creator Pass
              </h2>
              <p className="text-sm sm:text-base text-slate-400 leading-relaxed">
                Meet the founders leading the charge to redefine authenticity, verification, and brand monetization for modern digital talent.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
              {founders.map((founder) => (
                <TiltCard
                  key={founder.name}
                  maxTilt={6}
                  scale={1.01}
                  className="rounded-3xl bg-[#12151c]/90 border border-white/10 hover:border-sky-400/50 p-8 sm:p-10 transition-all shadow-2xl flex flex-col justify-between group relative overflow-hidden"
                >
                  {/* Subtle ambient glow inside card */}
                  <div className="absolute top-0 right-0 w-64 h-64 bg-sky-500/5 rounded-full blur-3xl pointer-events-none group-hover:bg-sky-500/10 transition-all duration-700" />

                  <div className="relative z-10 space-y-6">
                    {/* Header: Executive Monogram Crest, Badge, Name, Role (No images per requirement) */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
                      <div className="relative shrink-0">
                        <div className={`w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-gradient-to-br ${founder.accentColor} border-2 ${founder.borderColor} flex flex-col items-center justify-center transition-all shadow-xl backdrop-blur-md`}>
                          <span className={`text-3xl sm:text-4xl font-black font-mono tracking-wider ${founder.textColor}`}>
                            {founder.monogram}
                          </span>
                          <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400 font-semibold mt-0.5">
                            {founder.badge}
                          </span>
                        </div>
                        <div className="absolute -bottom-2 -right-2 bg-sky-500 text-black p-1 rounded-full shadow-lg">
                          <CheckCircle2 className="w-4 h-4 fill-sky-400 text-[#0b0d11]" />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/30 text-sky-400 text-[11px] font-mono font-bold uppercase tracking-wider">
                          <Award className="w-3.5 h-3.5" />
                          <span>{founder.badge}</span>
                        </div>
                        <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight group-hover:text-sky-300 transition-colors">
                          {founder.name}
                        </h3>
                        <p className="text-xs sm:text-sm font-semibold text-slate-300 font-mono">
                          {founder.role}
                        </p>
                      </div>
                    </div>

                    {/* Founder Quote */}
                    <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5 relative">
                      <Quote className="w-6 h-6 text-sky-400/30 absolute top-3 right-3" />
                      <p className="text-xs sm:text-sm text-sky-200/90 italic leading-relaxed pr-6 font-serif">
                        {founder.quote}
                      </p>
                    </div>

                    {/* Bio paragraphs */}
                    <div className="space-y-3 text-xs sm:text-sm text-slate-300 leading-relaxed font-sans">
                      {founder.bio.map((p, idx) => (
                        <p key={idx}>{p}</p>
                      ))}
                    </div>

                    {/* Strategic Focus Tags */}
                    <div className="space-y-2 pt-2">
                      <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 block font-semibold">
                        Strategic Focus & Expertise
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {founder.focus.map((item) => (
                          <span
                            key={item}
                            className="px-3 py-1 rounded-lg bg-white/5 border border-white/10 text-xs text-slate-200 font-medium"
                          >
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Bottom Stats Footer */}
                  <div className="relative z-10 pt-6 mt-6 border-t border-white/10 grid grid-cols-3 gap-2 text-center">
                    {founder.stats.map((stat, i) => (
                      <div key={i} className="p-2.5 rounded-xl bg-black/30 border border-white/5">
                        <div className="text-[10px] font-mono uppercase text-slate-400 tracking-wider">
                          {stat.label}
                        </div>
                        <div className="text-xs sm:text-sm font-bold text-white mt-0.5 truncate">
                          {stat.value}
                        </div>
                      </div>
                    ))}
                  </div>
                </TiltCard>
              ))}
            </div>

          </div>
        </section>

        {/* ================= CORE PILLARS & FOUNDER PHILOSOPHY ================= */}
        <section className="py-24 bg-[#0b0d11] border-b border-white/5">
          <div className="container mx-auto px-4 md:px-6 max-w-6xl space-y-16">
            <div className="text-center max-w-2xl mx-auto space-y-3">
              <span className="text-xs font-mono uppercase tracking-widest text-sky-400 font-semibold block">
                CORE PHILOSOPHY
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
                What We Stand For
              </h2>
              <p className="text-sm sm:text-base text-slate-400 leading-relaxed">
                The founding principles established by Anshu Gupta and Pranav Sharma guide every algorithm, verification audit, and feature built on CreatorHQ.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {corePillars.map((pillar) => {
                const Icon = pillar.icon;
                return (
                  <div
                    key={pillar.title}
                    className="p-6 rounded-2xl bg-[#12151c] border border-white/10 hover:border-sky-400/40 transition-all space-y-3 group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 group-hover:scale-110 group-hover:bg-sky-500/20 transition-all">
                      <Icon className="w-5 h-5" />
                    </div>
                    <h3 className="text-base font-bold text-white group-hover:text-sky-300 transition-colors">
                      {pillar.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                      {pillar.desc}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ================= FOUNDING JOURNEY & MILESTONES ================= */}
        <section className="py-24 bg-[#0e1117] border-b border-white/5">
          <div className="container mx-auto px-4 md:px-6 max-w-4xl space-y-12">
            <div className="text-center space-y-3">
              <span className="text-xs font-mono uppercase tracking-widest text-sky-400 font-semibold block">
                ROADMAP & MOMENTUM
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
                The Founding Journey
              </h2>
            </div>

            <div className="relative border-l-2 border-white/10 ml-4 sm:ml-8 pl-6 sm:pl-10 space-y-10">
              {milestones.map((m, idx) => (
                <div key={idx} className="relative group">
                  {/* Dot */}
                  <div className="absolute -left-[31px] sm:-left-[47px] top-1.5 w-4 h-4 rounded-full bg-[#0e1117] border-2 border-sky-400 group-hover:bg-sky-400 transition-all shadow-md" />

                  <span className="text-xs font-mono text-sky-400 font-semibold uppercase tracking-wider block">
                    {m.year}
                  </span>
                  <h3 className="text-xl font-bold text-white mt-1 group-hover:text-sky-300 transition-colors">
                    {m.title}
                  </h3>
                  <p className="text-sm text-slate-400 mt-2 leading-relaxed">
                    {m.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ================= FINAL CALL TO ACTION ================= */}
        <section className="py-24 bg-[#0b0d11] text-center relative overflow-hidden">
          <CamouflageBannerBg bannerOpacity="opacity-20" gridOpacity="opacity-15" />

          <div className="container relative z-10 mx-auto px-4 md:px-6 max-w-3xl space-y-6">
            <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
              Ready to Join the CreatorHQ Network?
            </h2>
            <p className="text-sm sm:text-base text-slate-400 leading-relaxed">
              Mint your official 3D Creator Pass today, submit your verified credentials, and become part of our elite, audit-verified roster.
            </p>
            <div className="pt-2 flex flex-wrap justify-center gap-4">
              <Link
                href="/dashboard"
                className="px-8 py-3.5 rounded-xl btn-chq-primary text-sm font-semibold text-white shadow-lg shadow-sky-500/20 flex items-center gap-2 hover:scale-105 transition-all"
              >
                <span>Launch Creator Studio</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/contact"
                className="px-8 py-3.5 rounded-xl btn-chq-secondary text-sm font-semibold text-slate-200 hover:text-white"
              >
                Contact Founders & Executive Office
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
