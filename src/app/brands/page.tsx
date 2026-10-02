'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { getAllCreators } from '@/lib/data';
import {
  Search,
  Filter,
  ShieldCheck,
  Briefcase,
  CheckCircle2,
  Lock,
  ArrowRight,
  Sparkles,
  Send,
  X,
  Building,
  Check
} from 'lucide-react';

export default function BrandsPage() {
  const creators = getAllCreators();
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedAudience, setSelectedAudience] = useState('ALL');
  const [selectedPlatform, setSelectedPlatform] = useState('ALL');
  const [inquiryModalOpen, setInquiryModalOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [companyName, setCompanyName] = useState('');
  const [workEmail, setWorkEmail] = useState('');
  const [budgetRange, setBudgetRange] = useState('$10k - $50k');
  const [campaignScope, setCampaignScope] = useState('');

  const handleInquirySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => {
      setInquiryModalOpen(false);
      setSubmitted(false);
      setCompanyName('');
      setWorkEmail('');
      setCampaignScope('');
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-[#0b0d11] text-slate-100 flex flex-col relative overflow-hidden pt-20">
      <Navbar />

      <main className="flex-1 py-12 sm:py-20 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Header Banner */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-10 mb-12 border-b border-white/10">
            <div className="max-w-2xl space-y-4">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/10 bg-[#11141a] shadow-sm">
                <Briefcase className="w-4 h-4 text-sky-400" />
                <span className="text-xs sm:text-sm font-semibold text-slate-200">
                  FOR BRANDS & AGENCIES
                </span>
                <span className="text-slate-500">•</span>
                <span className="text-amber-400 font-bold text-xs">ENTERPRISE BETA</span>
              </div>
              <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-white leading-tight font-sans">
                Authentic Creator Discovery.<br />
                <span className="text-sky-400">
                  Zero Tampered Proofs.
                </span>
              </h1>
              <p className="text-base sm:text-lg text-slate-200 leading-relaxed font-sans font-normal">
                Connect directly with vetted creators with cryptographically proven YouTube and Discord metrics. No inflated follower counts, no screenshot tampering.
              </p>
            </div>

            <button
              onClick={() => setInquiryModalOpen(true)}
              className="inline-flex items-center gap-2 px-6 h-11 rounded-lg btn-chq-primary text-sm font-semibold shadow-sm shrink-0"
            >
              <Building className="w-4 h-4" />
              <span>Apply for Brand Portal Access</span>
            </button>
          </div>

          {/* Search Filter Controls Matrix */}
          <div className="rounded-2xl border border-white/10 bg-[#11141a] p-6 sm:p-7 shadow-md space-y-5 mb-12">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <span className="text-xs font-mono uppercase tracking-wider text-slate-300 font-semibold">
                Filter Candidates by Verified Parameters
              </span>
              <span className="text-[11px] font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                Early Access Preview
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
              {/* Category */}
              <div>
                <label className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block mb-1.5">
                  Category
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg bg-black/60 border border-white/10 text-slate-200 focus:outline-none focus:border-sky-500"
                >
                  <option value="ALL">All Creator Categories</option>
                  <option value="Gaming Creator">Gaming Creator</option>
                  <option value="Tech & AI Creator">Tech & AI Creator</option>
                  <option value="Music & Audio">Music & Audio</option>
                  <option value="3D Motion & VFX">3D Motion & VFX</option>
                  <option value="Software & Systems">Software & Systems</option>
                </select>
              </div>

              {/* Platform */}
              <div>
                <label className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block mb-1.5">
                  Primary Platform
                </label>
                <select
                  value={selectedPlatform}
                  onChange={(e) => setSelectedPlatform(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg bg-black/60 border border-white/10 text-slate-200 focus:outline-none focus:border-sky-500"
                >
                  <option value="ALL">All Platforms</option>
                  <option value="YOUTUBE">YouTube Verified</option>
                  <option value="DISCORD">Discord Community Owner</option>
                </select>
              </div>

              {/* Audience Range */}
              <div>
                <label className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block mb-1.5">
                  Audience Range
                </label>
                <select
                  value={selectedAudience}
                  onChange={(e) => setSelectedAudience(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg bg-black/60 border border-white/10 text-slate-200 focus:outline-none focus:border-sky-500"
                >
                  <option value="ALL">Any Audience Size</option>
                  <option value="50k-200k">50,000 - 200,000</option>
                  <option value="200k-500k">200,000 - 500,000</option>
                  <option value="500k+">500,000+</option>
                </select>
              </div>

              {/* Verification Tier */}
              <div>
                <label className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block mb-1.5">
                  Verification Tier
                </label>
                <select
                  disabled
                  className="w-full px-3 py-2.5 rounded-lg bg-black/40 border border-white/5 text-slate-400 cursor-not-allowed"
                >
                  <option>Verified & Founding Only</option>
                </select>
              </div>
            </div>
          </div>

          {/* Sample Creator Matches */}
          <div className="space-y-4 mb-12">
            <div className="flex items-center justify-between pb-3 border-b border-cyan-500/20">
              <h3 className="text-sm font-extrabold text-white uppercase tracking-wider font-mono text-cyan-300">
                Verified Creator Roster Preview
              </h3>
              <span className="text-xs text-slate-300 font-mono">
                {creators.length} verified creators available for inquiry
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {creators.map((c) => (
                <div
                  key={c.id}
                  className="relative p-[1px] rounded-2xl bg-gradient-to-b from-cyan-400/40 via-sky-500/15 to-transparent hover:from-cyan-400 hover:to-indigo-500 transition-all duration-300 group shadow-lg hover:shadow-[0_0_30px_-5px_rgba(6,182,212,0.3)]"
                >
                  <div className="p-5 rounded-[15px] bg-gradient-to-b from-slate-900/95 via-[#080e1e]/98 to-[#04060d] flex items-center justify-between gap-4 h-full">
                    <div className="flex items-center gap-3.5">
                      <img
                        src={c.avatarUrl}
                        alt={c.displayName}
                        className="w-12 h-12 rounded-xl object-cover border border-cyan-400/30"
                      />
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-extrabold text-white text-base font-display">{c.displayName}</span>
                          <span className="text-cyan-300 font-mono text-xs font-bold">({c.passportId})</span>
                        </div>
                        <span className="text-sm font-semibold text-slate-200 block">{c.category}</span>
                        <div className="flex items-center gap-3 text-xs font-mono text-slate-200 mt-1 font-semibold">
                          <span>YT: {c.connections.youtube?.metricValue || 'N/A'}</span>
                          <span className="text-slate-500">•</span>
                          <span>DC: {c.connections.discord?.metricValue || 'N/A'}</span>
                        </div>
                      </div>
                    </div>

                    <Link
                      href={`/${(c.slug || c.username || c.passportId || '').replace(/^@/, '')}`}
                      className="px-4 py-2 rounded-lg btn-chq-primary text-sm font-semibold shrink-0"
                    >
                      View Creator ID
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Brand Enterprise Banner */}
          <div className="p-8 sm:p-10 rounded-2xl bg-[#12151c] border border-white/15 flex flex-col md:flex-row items-center justify-between gap-6 shadow-lg">
            <div className="space-y-2">
              <h3 className="text-xl sm:text-2xl font-bold text-white font-sans">
                Need Automated Roster Inquiries or Enterprise API Access?
              </h3>
              <p className="text-base text-slate-200 max-w-xl leading-relaxed font-sans font-normal">
                Our brand portal provides bulk campaign management, direct verification checks, and escrowed partnership flows.
              </p>
            </div>
            <button
              onClick={() => setInquiryModalOpen(true)}
              className="px-6 py-3 rounded-lg btn-chq-primary text-white font-semibold text-sm transition-colors shrink-0"
            >
              Request Enterprise Access
            </button>
          </div>

        </div>
      </main>

      {/* ================= BRAND ACCESS MODAL ================= */}
      {inquiryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="relative w-full max-w-md rounded-2xl bg-[#11141a] border border-white/10 p-6 sm:p-8 shadow-2xl space-y-5">
            <button
              onClick={() => setInquiryModalOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <span className="text-xs font-mono text-sky-400 uppercase tracking-widest font-semibold">
                BRAND DISCOVERY SUITE
              </span>
              <h3 className="text-xl font-bold text-white mt-1 font-sans">
                Enterprise Beta Access
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Submit your brand credentials for early platform vetting and API keys.
              </p>
            </div>

            {submitted ? (
              <div className="p-6 rounded-xl bg-sky-500/10 border border-sky-500/30 text-center space-y-2">
                <Check className="w-8 h-8 text-sky-400 mx-auto" />
                <h4 className="text-base font-bold text-white">Application Received</h4>
                <p className="text-xs text-slate-300">
                  Our creator partnerships team will review your brand within 24 hours.
                </p>
              </div>
            ) : (
              <form onSubmit={handleInquirySubmit} className="space-y-4">
                <div>
                  <label className="text-xs font-mono text-slate-400 block mb-1">COMPANY / BRAND NAME</label>
                  <input
                    type="text"
                    required
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="e.g. Acme Tech Labs"
                    className="w-full px-3.5 py-2.5 rounded-lg bg-black/50 border border-white/10 text-sm text-white focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-mono text-slate-400 block mb-1">WORK EMAIL</label>
                  <input
                    type="email"
                    required
                    value={workEmail}
                    onChange={(e) => setWorkEmail(e.target.value)}
                    placeholder="partnerships@brand.com"
                    className="w-full px-3.5 py-2.5 rounded-lg bg-black/50 border border-white/10 text-sm text-white focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-mono text-slate-400 block mb-1">BUDGET TIER</label>
                  <select
                    value={budgetRange}
                    onChange={(e) => setBudgetRange(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg bg-black/50 border border-white/10 text-sm text-white focus:outline-none focus:border-sky-500"
                  >
                    <option>$10k - $50k</option>
                    <option>$50k - $200k</option>
                    <option>$200k+</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-mono text-slate-400 block mb-1">CAMPAIGN OBJECTIVE</label>
                  <textarea
                    rows={3}
                    value={campaignScope}
                    onChange={(e) => setCampaignScope(e.target.value)}
                    placeholder="e.g. Tech hardware sponsorships for gaming creators..."
                    className="w-full px-3.5 py-2.5 rounded-lg bg-black/50 border border-white/10 text-sm text-white focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setInquiryModalOpen(false)}
                    className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-medium text-slate-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-sky-500 hover:bg-sky-400 text-xs font-bold text-white shadow-[0_0_15px_rgba(14,165,233,0.4)]"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Submit Application</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
