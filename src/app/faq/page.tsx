'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import CamouflageBannerBg from '@/components/CamouflageBannerBg';
import {
  HelpCircle,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  CheckCircle2,
  Lock,
  ArrowRight
} from 'lucide-react';

interface FaqItem {
  question: string;
  answer: string;
  category: string;
}

const faqs: FaqItem[] = [
  {
    category: 'Verification',
    question: 'How does CreatorHQ verify YouTube channels and Discord servers?',
    answer: 'CreatorHQ uses proof-based auditing. Creators upload a screenshot proof of their YouTube Studio overview or Discord Server Insights. Our staff audits these metrics against public channel signals to confirm real audience ownership without requiring passwords or sensitive account credentials.',
  },
  {
    category: 'Verification',
    question: 'Why does my Creator Pass show "Pending Review" when first created?',
    answer: 'To protect the integrity of the network and stop impersonators from minting passes under famous creators, all newly generated passes are marked as "Pending Staff Review". Once CreatorHQ staff audits your uploaded channel proof, your pass status becomes "Active" and the official blue verification checkmark is unlocked.',
  },
  {
    category: 'Card Features',
    question: 'What happens when I freeze my Creator Pass?',
    answer: 'Tapping "Freeze Card" immediately pauses your public passkey. The card turns frosty blue, your verification indicator shows "Frozen", and public sponsor inquiries are paused. You can unfreeze it at any time with a single tap in your dashboard or card view.',
  },
  {
    category: 'Sponsors & Brands',
    question: 'How do brand partners verify my credentials?',
    answer: 'Every pass features your unique @handle and a dynamic QR code. When scanned or clicked, it routes to your canonical profile on creatorhq.fun (e.g. creatorhq.fun/itsuniqueplayz), where sponsors inspect authenticated subscriber metrics, Discord server member counts, verified milestones, and rate card details.',
  },
  {
    category: 'Compliance',
    question: 'Is CreatorHQ an official government ID card?',
    answer: 'No. CreatorHQ is an authorized digital creator identity platform for media kit verification, sponsorship matchmaking, and community authentication. It is strictly not a government-issued identification document.',
  },
  {
    category: 'Security',
    question: 'Do I ever need to share my YouTube or Discord passwords?',
    answer: 'Never. CreatorHQ will never ask for your account passwords, 2FA codes, or administrative server transfers. Verification is performed entirely via verifiable analytics proofs and public platform cross-referencing.',
  },
];

export default function FaqPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="min-h-screen bg-[#0b0d11] text-slate-100 flex flex-col font-sans selection:bg-sky-500/30 selection:text-white pt-20">
      <Navbar />

      <main className="flex-1">
        {/* Header */}
        <section className="relative py-24 sm:py-32 bg-[#0b0d11] overflow-hidden border-b border-white/5">
          {/* Camouflaged Luxury Tech Banner Background & Grid */}
          <CamouflageBannerBg />

          <div className="container relative z-10 mx-auto px-4 md:px-6 max-w-4xl text-center space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-[#11141a] px-4 py-1.5 shadow-sm">
              <HelpCircle className="w-4 h-4 text-sky-400" />
              <span className="text-xs sm:text-sm font-semibold text-slate-200">
                HELP CENTER & FAQ
              </span>
            </div>

            <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-tight font-sans">
              Frequently Asked Questions
            </h1>

            <p className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
              Everything you need to know about CreatorHQ passes, staff audit guidelines, and sponsor authentication.
            </p>
          </div>
        </section>

        {/* FAQ Accordion List */}
        <section className="py-24 bg-[#0e1117]">
          <div className="container mx-auto px-4 md:px-6 max-w-3xl space-y-4">
            {faqs.map((faq, idx) => {
              const isOpen = openIndex === idx;
              return (
                <div
                  key={faq.question}
                  className="rounded-2xl border border-white/15 bg-[#12151c] overflow-hidden transition-all shadow-md"
                >
                  <button
                    onClick={() => setOpenIndex(isOpen ? null : idx)}
                    className="w-full p-6 text-left flex items-center justify-between gap-4 hover:bg-white/[0.02] transition-colors"
                  >
                    <div className="space-y-1.5">
                      <span className="text-xs font-mono uppercase tracking-wider text-sky-400 font-semibold">
                        {faq.category}
                      </span>
                      <h3 className="text-lg sm:text-xl font-bold text-white font-sans">
                        {faq.question}
                      </h3>
                    </div>
                    <div className="shrink-0 w-9 h-9 rounded-full bg-white/5 flex items-center justify-center text-slate-300">
                      {isOpen ? <ChevronUp className="w-5 h-5 text-sky-400" /> : <ChevronDown className="w-5 h-5" />}
                    </div>
                  </button>

                  {isOpen && (
                    <div className="px-6 pb-6 pt-3 text-base sm:text-lg text-slate-200 leading-relaxed border-t border-white/10 animate-fadeIn font-normal font-sans">
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 bg-[#0b0d11] text-center border-t border-white/5">
          <div className="container mx-auto px-4 md:px-6 max-w-2xl space-y-4">
            <h3 className="text-2xl font-bold text-white font-sans">
              Have more questions?
            </h3>
            <p className="text-sm text-slate-400">
              Our creator support and verification team is available 24/7.
            </p>
            <div className="pt-2 flex justify-center gap-4">
              <Link
                href="/dashboard"
                className="px-6 py-3 rounded-lg btn-chq-primary text-xs font-semibold text-white shadow-sm flex items-center gap-2"
              >
                <span>Launch Creator Studio</span>
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
