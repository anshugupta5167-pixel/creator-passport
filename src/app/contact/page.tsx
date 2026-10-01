'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import CamouflageBannerBg from '@/components/CamouflageBannerBg';
import {
  Mail,
  Send,
  CheckCircle2,
  Building2,
  MessageSquare,
  ShieldCheck,
  ArrowRight
} from 'lucide-react';
import confetti from 'canvas-confetti';

export default function ContactPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [inquiryType, setInquiryType] = useState('Brand Partnership');
  const [message, setMessage] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitted(true);
    try {
      confetti({ particleCount: 50, spread: 60 });
    } catch (e) {}
  };

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
              <Mail className="w-4 h-4 text-sky-400" />
              <span className="text-xs sm:text-sm font-semibold text-slate-200">
                GET IN TOUCH
              </span>
            </div>

            <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-tight font-sans">
              Contact CreatorHQ
            </h1>

            <p className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
              Whether you are a brand exploring sponsor campaigns or a creator requesting verification assistance, our team is here to help.
            </p>
          </div>
        </section>

        {/* Contact Form & Info Grid */}
        <section className="py-24 bg-[#0e1117]">
          <div className="container mx-auto px-4 md:px-6 max-w-5xl">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
              
              {/* Left Info: 5 Columns */}
              <div className="lg:col-span-5 space-y-6">
                <div>
                  <h3 className="text-2xl font-bold text-white font-sans">
                    Corporate Partnerships
                  </h3>
                  <p className="text-base sm:text-lg text-slate-200 mt-2.5 leading-relaxed font-normal font-sans">
                    Direct access to vetted gaming, tech, and entertainment creators across YouTube and Discord.
                  </p>
                </div>

                <div className="space-y-4 font-sans">
                  <div className="p-5 rounded-2xl bg-[#12151c] border border-white/15 space-y-1.5 shadow-sm">
                    <span className="text-xs font-mono uppercase tracking-wider text-slate-300 block font-bold">
                      DIRECT INQUIRIES
                    </span>
                    <a href="mailto:contact@creatorhq.fun" className="text-sky-400 text-base font-semibold hover:underline">
                      contact@creatorhq.fun
                    </a>
                  </div>

                  <div className="p-5 rounded-2xl bg-[#12151c] border border-white/15 space-y-1.5 shadow-sm">
                    <span className="text-xs font-mono uppercase tracking-wider text-slate-300 block font-bold">
                      STAFF VERIFICATION DESK
                    </span>
                    <a href="mailto:audit@creatorhq.fun" className="text-sky-400 text-base font-semibold hover:underline">
                      audit@creatorhq.fun
                    </a>
                  </div>

                  <div className="p-5 rounded-2xl bg-[#12151c] border border-white/15 space-y-1.5 shadow-sm">
                    <span className="text-xs font-mono uppercase tracking-wider text-slate-300 block font-bold">
                      HEADQUARTERS
                    </span>
                    <p className="text-slate-200 text-base font-normal">
                      CreatorHQ Technologies, Inc. • Silicon Beach, California
                    </p>
                  </div>
                </div>
              </div>

              {/* Right Form: 7 Columns */}
              <div className="lg:col-span-7">
                <div className="p-8 sm:p-9 rounded-2xl bg-[#12151c] border border-white/15 shadow-xl">
                  {isSubmitted ? (
                    <div className="py-12 text-center space-y-4 animate-fadeIn">
                      <div className="w-14 h-14 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto">
                        <CheckCircle2 className="w-7 h-7" />
                      </div>
                      <h3 className="text-2xl font-bold text-white font-sans">
                        Message Received
                      </h3>
                      <p className="text-sm text-slate-400 max-w-sm mx-auto leading-relaxed">
                        Thank you for reaching out. A CreatorHQ partnership specialist will review your inquiry and follow up within 24 business hours.
                      </p>
                      <div className="pt-4">
                        <button
                          onClick={() => {
                            setIsSubmitted(false);
                            setName('');
                            setEmail('');
                            setMessage('');
                          }}
                          className="px-6 py-2.5 rounded-lg btn-chq-primary text-xs font-semibold text-white shadow-sm"
                        >
                          Send Another Note
                        </button>
                      </div>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmit} className="space-y-5">
                      <div>
                        <label className="text-xs font-mono text-slate-300 uppercase tracking-wider block mb-1.5 font-bold">
                          YOUR FULL NAME *
                        </label>
                        <input
                          type="text"
                          required
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="e.g. Sarah Mitchell"
                          className="w-full px-3.5 py-2.5 rounded-lg bg-[#161922] border border-white/10 text-sm text-white focus:outline-none focus:border-sky-400 transition-colors"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs font-mono text-slate-300 uppercase tracking-wider block mb-1.5 font-bold">
                            WORK EMAIL *
                          </label>
                          <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="sarah@company.com"
                            className="w-full px-3.5 py-2.5 rounded-lg bg-[#161922] border border-white/10 text-sm text-white focus:outline-none focus:border-sky-400 transition-colors"
                          />
                        </div>

                        <div>
                          <label className="text-xs font-mono text-slate-300 uppercase tracking-wider block mb-1.5 font-bold">
                            ORGANIZATION / CHANNEL
                          </label>
                          <input
                            type="text"
                            value={company}
                            onChange={(e) => setCompany(e.target.value)}
                            placeholder="Brand or Channel Name"
                            className="w-full px-3.5 py-2.5 rounded-lg bg-[#161922] border border-white/10 text-sm text-white focus:outline-none focus:border-sky-400 transition-colors"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-xs font-mono text-slate-300 uppercase tracking-wider block mb-1.5 font-bold">
                          INQUIRY TOPIC
                        </label>
                        <select
                          value={inquiryType}
                          onChange={(e) => setInquiryType(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-lg bg-[#161922] border border-white/10 text-sm text-white focus:outline-none focus:border-sky-400 transition-colors cursor-pointer"
                        >
                          <option value="Brand Partnership">Brand Partnership / Sponsorship Campaign</option>
                          <option value="Staff Verification">Creator Pass Verification Audit</option>
                          <option value="Talent Roster">Talent Management & Agency Inquiries</option>
                          <option value="Technical Support">Technical & Account Support</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-xs font-mono text-slate-300 uppercase tracking-wider block mb-1.5 font-bold">
                          MESSAGE DETAILS *
                        </label>
                        <textarea
                          required
                          rows={4}
                          value={message}
                          onChange={(e) => setMessage(e.target.value)}
                          placeholder="Tell us about your brand campaign, creator profile, or questions..."
                          className="w-full px-3.5 py-2.5 rounded-lg bg-[#161922] border border-white/10 text-sm text-white focus:outline-none focus:border-sky-400 transition-colors"
                        />
                      </div>

                      <div className="pt-2">
                        <button
                          type="submit"
                          className="w-full py-3 rounded-lg btn-chq-primary text-xs font-semibold flex items-center justify-center gap-2 text-white shadow-sm"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>Submit Official Inquiry</span>
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              </div>

            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
