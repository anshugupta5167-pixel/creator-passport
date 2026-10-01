'use client';

import React from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import TiltCard from '@/components/TiltCard';
import CamouflageBannerBg from '@/components/CamouflageBannerBg';
import {
  Handshake,
  UserCheck,
  FileText,
  Video,
  Pin,
  Code2,
  Calendar,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Sparkles
} from 'lucide-react';

const services = [
  {
    icon: Handshake,
    title: 'Sponsorship Management',
    desc: 'Connecting you with verified brand partnerships that align with your audience. We negotiate fair compensation and ensure deliverable protection.',
    tags: ['Brand Deals', 'Escrow Security'],
  },
  {
    icon: UserCheck,
    title: 'Talent Management',
    desc: 'Dedicated career guidance, schedule coordination, and long-term brand strategy for ambitious YouTube and Discord founders.',
    tags: ['Career Advisory', 'Growth Strategy'],
  },
  {
    icon: FileText,
    title: 'Contract Negotiation',
    desc: 'Reviewing every agreement to protect your intellectual property, ensure fair terms, and guarantee prompt payment upon milestone delivery.',
    tags: ['Legal Standard', 'Milestone Protection'],
  },
  {
    icon: Video,
    title: 'Video & Media Production',
    desc: 'High-retention editing, thumbnail optimization, and production support to maximize your views, engagement, and sponsor value.',
    tags: ['Retention Audits', 'Creative Support'],
  },
  {
    icon: Pin,
    title: 'Verified GFX & Brand Identity',
    desc: 'Professional channel art, media kits, and verified badge watermarks that give your content executive polish for Fortune 500 sponsors.',
    tags: ['Media Kit Design', 'Watermark Badges'],
  },
  {
    icon: Code2,
    title: 'Custom Bot & Discord Engineering',
    desc: 'Custom discord verification bots, automated member role sync, and server moderation tools built specifically for creator communities.',
    tags: ['Discord Bots', 'Role Synchronization'],
  },
];

export default function ServicesPage() {
  return (
    <div className="min-h-screen bg-[#0b0d11] text-slate-100 flex flex-col font-sans selection:bg-sky-500/30 selection:text-white pt-20">
      <Navbar />

      <main className="flex-1">
        {/* Header */}
        <section className="relative py-24 sm:py-32 bg-[#0b0d11] overflow-hidden border-b border-white/5">
          {/* Camouflaged Luxury Tech Banner Background & Grid */}
          <CamouflageBannerBg />

          <div className="container relative z-10 mx-auto px-4 md:px-6 max-w-5xl text-center space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-[#11141a] px-4 py-1.5 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-sky-400" />
              <span className="text-xs sm:text-sm font-semibold text-slate-200">
                CREATOR SERVICES
              </span>
            </div>

            <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-tight font-sans">
              Infrastructure & Services<br />
              <span className="text-sky-400">
                Built For Serious Creators
              </span>
            </h1>

            <p className="text-base sm:text-lg text-slate-400 max-w-3xl mx-auto leading-relaxed">
              From cryptographic pass verification to comprehensive contract negotiation and sponsorship matchmaking, CreatorHQ powers top YouTube channels and Discord communities.
            </p>

            <div className="pt-4 flex justify-center">
              <Link
                href="/dashboard"
                className="px-6 py-3 rounded-lg btn-chq-primary text-xs font-semibold flex items-center gap-2 text-white shadow-sm"
              >
                <span>Apply for Creator ID</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>

        {/* Services Bento Grid */}
        <section className="py-24 bg-[#0e1117]">
          <div className="container mx-auto px-4 md:px-6 max-w-7xl">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {services.map((service) => {
                const Icon = service.icon;
                return (
                  <TiltCard
                    key={service.title}
                    maxTilt={8}
                    className="p-8 sm:p-9 rounded-2xl bg-[#12151c] border border-white/15 hover:border-sky-400/60 transition-all shadow-lg flex flex-col justify-between"
                  >
                    <div className="space-y-4">
                      <div className="w-14 h-14 rounded-xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-400">
                        <Icon className="w-7 h-7" />
                      </div>
                      <h3 className="text-2xl font-extrabold text-white font-sans tracking-tight">
                        {service.title}
                      </h3>
                      <p className="text-base sm:text-lg text-slate-200 leading-relaxed font-sans font-normal">
                        {service.desc}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2 pt-6 mt-4 border-t border-white/10">
                      {service.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-3 py-1.5 rounded-lg bg-[#161922] border border-white/10 text-xs font-mono text-slate-200"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </TiltCard>
                );
              })}
            </div>
          </div>
        </section>

        {/* Call To Action */}
        <section className="py-24 bg-[#0b0d11] text-center border-t border-white/5">
          <div className="container mx-auto px-4 md:px-6 max-w-3xl space-y-6">
            <h2 className="text-3xl sm:text-4xl font-bold text-white font-sans">
              Ready to elevate your creator business?
            </h2>
            <p className="text-sm sm:text-base text-slate-400 leading-relaxed">
              Mint your official Creator ID pass and access our verified partner network today.
            </p>
            <div className="pt-2">
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-lg btn-chq-primary text-sm font-semibold text-white shadow-sm"
              >
                <span>Get Started in Studio</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
