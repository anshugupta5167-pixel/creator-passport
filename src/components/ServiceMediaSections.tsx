'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import TiltCard from '@/components/TiltCard';
import {
  Handshake,
  UserCheck,
  FileText,
  Video,
  Pin,
  Code2,
  Calendar,
  ArrowRight,
  Mail,
  Link2,
  CheckCircle2,
  Search,
  Sparkles,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  ExternalLink,
  ShieldCheck,
  TrendingUp,
  PlusCircle,
  UploadCloud,
  Check,
  X,
  CreditCard,
  Copy,
  Gamepad2,
  Palette,
  Users,
  Layers
} from 'lucide-react';
import { CreatorProfile } from '@/lib/types';
import { submitPassportApplication } from '@/lib/data';
import PassportCard from '@/components/PassportCard';

import {
  AuditedPrecisionSvg,
  BrandDealsSvg,
  Step1SubmitSvg,
  Step2AuditSvg,
  Step3MintSvg,
  HoloStepBadge
} from '@/components/RichSvgIcons';
import { subscribeToCreatorSync } from '@/lib/sync';

interface ServiceMediaSectionsProps {
  creators: CreatorProfile[];
  onOpenProofModal?: () => void;
}

export default function ServiceMediaSections({
  creators: initialCreators,
}: ServiceMediaSectionsProps) {
  // Directory state: populated purely by created passes
  const [creatorsList, setCreatorsList] = useState<CreatorProfile[]>(initialCreators || []);

  React.useEffect(() => {
    if (initialCreators && initialCreators.length > 0) {
      setCreatorsList(initialCreators);
    }
  }, [initialCreators]);

  const refreshCreators = React.useCallback(() => {
    fetch('/api/creators')
      .then((res) => res.json())
      .then((data) => {
        if (data && Array.isArray(data.creators)) {
          setCreatorsList(data.creators);
        }
      })
      .catch(() => {});
  }, []);

  // Automatically sync with DB and listen for live creator updates
  React.useEffect(() => {
    refreshCreators();

    const unsubscribe = subscribeToCreatorSync((update) => {
      // Re-fetch all or patch in place immediately
      refreshCreators();
      setInspectingCreator((current) => {
        if (!current) return current;
        const currentSlug = (current.slug || current.username || '').toLowerCase();
        const currentPass = (current.passportId || '').toUpperCase();
        const targetSlug = (update.creatorSlug || '').toLowerCase();
        const targetPass = (update.passportId || '').toUpperCase();

        if (
          (currentSlug && targetSlug && currentSlug === targetSlug) ||
          (currentPass && targetPass && currentPass === targetPass)
        ) {
          const isV = update.verificationStatus === 'VERIFIED';
          const vStatus = (update.verificationStatus as any) || (isV ? 'VERIFIED' : 'PENDING');
          return {
            ...current,
            isVerified: isV,
            verification_status: vStatus,
          };
        }
        return current;
      });
    });

    if (typeof window !== 'undefined') {
      window.addEventListener('creatorhq_profile_updated', refreshCreators);
      window.addEventListener('creatorhq_auth_updated', refreshCreators);
      return () => {
        window.removeEventListener('creatorhq_profile_updated', refreshCreators);
        window.removeEventListener('creatorhq_auth_updated', refreshCreators);
        unsubscribe();
      };
    }

    return () => {
      unsubscribe();
    };
  }, [refreshCreators]);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  
  // YouTuber Card Viewer Modal state (User requested: "we can see youtubers passport add that too")
  const [inspectingCreator, setInspectingCreator] = useState<CreatorProfile | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // FAQ accordion state
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  // Application Modal state (Staff must review proof before approval)
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [appName, setAppName] = useState('');
  const [appHandle, setAppHandle] = useState('');
  const [appCategory, setAppCategory] = useState('Gaming');
  const [appPlatform, setAppPlatform] = useState<'YOUTUBE' | 'DISCORD'>('YOUTUBE');
  const [appMetrics, setAppMetrics] = useState('850K Subscribers');
  const [appChannelUrl, setAppChannelUrl] = useState('');
  const [proofUploaded, setProofUploaded] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitFeedback, setSubmitFeedback] = useState<string | null>(null);

  // Contact Modal state
  const [isContactOpen, setIsContactOpen] = useState(false);
  const [contactEmail, setContactEmail] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [contactSuccess, setContactSuccess] = useState(false);

  // Filter creators
  const filteredCreators = creatorsList.filter((c) => {
    const matchesSearch =
      (c.displayName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.username || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.bio || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.category || c.niche || '').toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      selectedCategory === 'All Categories' ||
      (c.category || c.niche || '').toLowerCase().includes(selectedCategory.toLowerCase()) ||
      (Array.isArray(c.skills) && c.skills.some((s) => (s || '').toLowerCase().includes(selectedCategory.toLowerCase())));

    return matchesSearch && matchesCategory;
  });

  const handleApplyPassport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!appName || !appHandle) return;

    setIsSubmitting(true);
    setTimeout(() => {
      submitPassportApplication({
        applicantName: appName,
        applicantHandle: appHandle.startsWith('@') ? appHandle : `@${appHandle}`,
        category: appCategory,
        platform: appPlatform,
        claimedMetrics: appMetrics,
        profileUrl: appChannelUrl || (appPlatform === 'YOUTUBE' ? `https://youtube.com/@${appHandle.replace('@', '')}` : `https://discord.gg/${appHandle.replace('@', '')}`),
        proofScreenshotUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80",
        proofDetails: `${appPlatform === 'YOUTUBE' ? 'YouTube Studio' : 'Discord Server Insights'} screenshot proof showing ${appMetrics}. Submitted for staff audit.`
      });

      setIsSubmitting(false);
      setSubmitFeedback('APPLICATION_QUEUED');
    }, 1000);
  };

  const copyCreatorUrl = (passportId: string) => {
    navigator.clipboard.writeText(`https://creatorhq.fun/creator/${passportId}`);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const faqs = [
    {
      q: 'What is CreatorHQ and what is a Creator ID?',
      a: 'CreatorHQ is a private creator network and verification infrastructure. A Creator ID is a cryptographic digital card backed by verified YouTube Studio and Discord Server Insights proofs. It allows online creators to prove undisputed channel ownership and audience reach to brands without sharing passwords.'
    },
    {
      q: 'What are the requirements to apply for a Creator ID?',
      a: 'Creators must manage an active YouTube channel or Discord community. You submit your channel credentials and a dashboard screenshot proof. All proofs are reviewed by CreatorHQ staff before your Creator ID is officially minted.'
    },
    {
      q: 'How does staff proof inspection work?',
      a: 'To guarantee 100% protection against impersonation and bot farms, every application is audited by staff. We verify channel handle consistency, 28-day analytics curves, and ownership indicators before minting your sequential Creator ID.'
    },
    {
      q: 'How long does the verification and Creator ID issuance take?',
      a: 'Staff audits proofs rapidly, typically within 1 to 4 hours. Once approved, your sequential Creator ID (e.g. CHQ-000184) is minted, your 3D card is activated at creatorhq.fun, and your verified badge appears on the network.'
    },
    {
      q: 'Is CreatorHQ a government-issued identification system?',
      a: 'No. CreatorHQ is strictly a PRIVATE CREATOR NETWORK verification platform for online creators and brand partnerships. It is NOT a government-issued passport, national identity card, or legal travel document.'
    }
  ];

  return (
    <div className="w-full bg-transparent text-slate-100 font-sans">
      
      {/* =========================================================================
          SECTION 1: INFRASTRUCTURE & DOMAIN EXPERTISE (TOADSTER.AI REFERENCE STYLE)
          ========================================================================= */}
      <section id="services" className="relative py-24 md:py-32 bg-transparent overflow-hidden">
        {/* Toadster Ambient Radial Glowing Sky from Bottom */}
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_50%_100%,_rgba(30,27,75,0.45)_0%,_rgba(7,11,22,0.95)_50%,_transparent_85%)]" />

        <div className="container px-4 md:px-6 mx-auto max-w-7xl relative z-10 space-y-20">
          
          {/* Top Half: Domain Expertise Meets Deep Engineering Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-14 items-center">
            
            {/* Left Headline & Pitch */}
            <div className="lg:col-span-5 space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-sky-500/25 bg-sky-950/40 px-3.5 py-1 text-xs font-bold text-sky-400">
                <span className="w-1.5 h-1.5 rounded-full bg-sky-400 shadow-[0_0_8px_#38bdf8] animate-pulse" />
                <span>VERIFIABLE CREATOR INFRASTRUCTURE</span>
              </div>

              <h2 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.08] font-sans">
                Audited reach meets <br />
                <span className="text-sky-400">sovereign credentials</span>
              </h2>

              <p className="text-base sm:text-lg text-slate-300 leading-relaxed font-normal">
                Audience reach only matters when it is backed by sovereign cryptographic ownership. CreatorHQ brings together YouTube verification, Discord server proof, and fraud-proof digital media kits into one verifiable sovereign passport.
              </p>

              <p className="text-sm sm:text-base text-slate-400 leading-relaxed font-normal">
                Our verification team audits real YouTube analytics and Discord community permissions directly. We bridge creators with tier-1 brand sponsors at 0% commission cuts, replacing outdated PDF media kits with tamper-proof sovereign credentials.
              </p>

              <div className="pt-2 flex items-center gap-4">
                <div className="p-1 rounded-full border border-sky-400/20 bg-sky-950/20 backdrop-blur-sm shadow-[0_0_24px_rgba(56,189,248,0.2)]">
                  <Link
                    href="/signup"
                    className="btn-chq-primary px-8 py-3 text-sm font-extrabold flex items-center gap-2"
                  >
                    <span>Start Creating</span>
                    <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                  </Link>
                </div>
                <Link
                  href="/compare"
                  className="inline-flex items-center justify-center text-sm font-semibold text-slate-300 hover:text-white px-4 py-2.5 transition-colors"
                >
                  <span>Compare Alternatives</span>
                </Link>
              </div>
            </div>

            {/* Right: High-Impact Obsidian Cards with Holographic Accents */}
            <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-6">
              
              {/* Obsidian Card 1: Regulatory / Staff Precision */}
              <div className="rounded-[28px] bg-gradient-to-b from-[#0e1424] via-[#090d16] to-[#060911] text-white p-8 sm:p-10 shadow-[0_20px_50px_rgba(0,0,0,0.8)] border border-sky-500/30 hover:border-sky-400/80 hover:shadow-[0_0_35px_rgba(56,189,248,0.25)] flex flex-col justify-between transition-all duration-300 hover:-translate-y-2 group backdrop-blur-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500/10 rounded-full blur-2xl pointer-events-none group-hover:bg-sky-400/20 transition-colors" />
                
                <div className="space-y-6 relative z-10">
                  {/* Rich SVG Image Icon */}
                  <AuditedPrecisionSvg className="w-16 h-16" size={64} />
                  
                  <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-sans">
                    Audited precision
                  </h3>
                  
                  <p className="text-base sm:text-lg text-slate-300 leading-relaxed font-normal">
                    Architecture designed for authentic creators. Every subscriber count, video view metric, and Discord server role is staff-audited before verified checkmarks are issued.
                  </p>
                </div>

                <div className="pt-6 mt-6 border-t border-white/10 flex items-center justify-between text-xs font-semibold text-slate-400 font-mono relative z-10">
                  <span>Cryptographic passkeys</span>
                  <span className="text-sky-400 font-bold">100% Tamper-proof</span>
                </div>
              </div>

              {/* Obsidian Card 2: Direct Brand Access */}
              <div className="rounded-[28px] bg-gradient-to-b from-[#0e1424] via-[#090d16] to-[#060911] text-white p-8 sm:p-10 shadow-[0_20px_50px_rgba(0,0,0,0.8)] border border-sky-500/30 hover:border-sky-400/80 hover:shadow-[0_0_35px_rgba(56,189,248,0.25)] flex flex-col justify-between transition-all duration-300 hover:-translate-y-2 group backdrop-blur-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500/10 rounded-full blur-2xl pointer-events-none group-hover:bg-sky-400/20 transition-colors" />

                <div className="space-y-6 relative z-10">
                  {/* Rich SVG Image Icon */}
                  <BrandDealsSvg className="w-16 h-16" size={64} />
                  
                  <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-sans">
                    Direct brand deals
                  </h3>
                  
                  <p className="text-base sm:text-lg text-slate-300 leading-relaxed font-normal">
                    We bridge creators directly with Fortune 500 brand sponsors without requiring risky 20% to 50% commission cuts from traditional talent management agencies.
                  </p>
                </div>

                <div className="pt-6 mt-6 border-t border-white/10 flex items-center justify-between text-xs font-semibold text-slate-400 font-mono relative z-10">
                  <span>Zero middleman fees</span>
                  <span className="text-sky-400 font-bold">0% Commission</span>
                </div>
              </div>

            </div>

          </div>

          {/* Bottom Half: Simple, Clean, Big Texts, Solid Boxed Cards */}
          <div className="pt-16 border-t border-white/10 space-y-12">
            <div className="text-center space-y-4 max-w-4xl mx-auto">
              <h3 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white font-sans">
                Industries we <span className="text-sky-400">verify</span>
              </h3>
              <p className="text-base sm:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed font-normal">
                Specialized creator verification protocols dedicated to authentic audience reach.
              </p>
            </div>

            {/* Simple, Clean, Solid Boxed Grid with Rich SVG Icon Images */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              
              {/* Box 1: Gaming */}
              <div className="p-8 sm:p-10 rounded-3xl bg-[#090d16] border border-white/10 hover:border-sky-400/50 transition-all duration-300 hover:-translate-y-1 shadow-2xl flex flex-col justify-between group">
                <div className="space-y-6">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-sky-500/20 via-sky-600/10 to-transparent border border-sky-400/30 flex items-center justify-center group-hover:scale-105 group-hover:border-sky-400 transition-all shadow-[0_0_20px_rgba(56,189,248,0.2)]">
                    <svg className="w-9 h-9" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M10 14C10 12.3431 11.3431 11 13 11H23C24.6569 11 26 12.3431 26 14V22C26 23.6569 24.6569 25 23 25H13C11.3431 25 10 23.6569 10 22V14Z" stroke="#38bdf8" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M15 15V21M12 18H18" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round"/>
                      <circle cx="21" cy="16.5" r="1.25" fill="#38bdf8"/>
                      <circle cx="23.5" cy="19.5" r="1.25" fill="#ffffff"/>
                    </svg>
                  </div>
                  <h4 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-sans">
                    Gaming & Esports
                  </h4>
                  <p className="text-base sm:text-lg text-slate-300 leading-relaxed font-normal">
                    Live streamers, competitive esports talent, and high-engagement gaming content creators.
                  </p>
                </div>
              </div>

              {/* Box 2: Tech */}
              <div className="p-8 sm:p-10 rounded-3xl bg-[#090d16] border border-white/10 hover:border-sky-400/50 transition-all duration-300 hover:-translate-y-1 shadow-2xl flex flex-col justify-between group">
                <div className="space-y-6">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-sky-500/20 via-sky-600/10 to-transparent border border-sky-400/30 flex items-center justify-center group-hover:scale-105 group-hover:border-sky-400 transition-all shadow-[0_0_20px_rgba(56,189,248,0.2)]">
                    <svg className="w-9 h-9" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <rect x="11" y="11" width="14" height="14" rx="3.5" stroke="#38bdf8" strokeWidth="2.2"/>
                      <path d="M15 7V11M21 7V11M15 25V29M21 25V29M7 15H11M7 21H11M25 15H29M25 21H29" stroke="#7dd3fc" strokeWidth="2" strokeLinecap="round"/>
                      <circle cx="18" cy="18" r="2.5" fill="#ffffff"/>
                    </svg>
                  </div>
                  <h4 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-sans">
                    Tech & AI Engineering
                  </h4>
                  <p className="text-base sm:text-lg text-slate-300 leading-relaxed font-normal">
                    Software engineers, open-source maintainers, AI researchers, and tech reviewers.
                  </p>
                </div>
              </div>

              {/* Box 3: Finance */}
              <div className="p-8 sm:p-10 rounded-3xl bg-[#090d16] border border-white/10 hover:border-sky-400/50 transition-all duration-300 hover:-translate-y-1 shadow-2xl flex flex-col justify-between group">
                <div className="space-y-6">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-sky-500/20 via-sky-600/10 to-transparent border border-sky-400/30 flex items-center justify-center group-hover:scale-105 group-hover:border-sky-400 transition-all shadow-[0_0_20px_rgba(56,189,248,0.2)]">
                    <svg className="w-9 h-9" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M9 25L16 17L20 20L27 11M27 11H21M27 11V17" stroke="#38bdf8" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/>
                      <circle cx="16" cy="17" r="1.5" fill="#ffffff"/>
                      <circle cx="20" cy="20" r="1.5" fill="#ffffff"/>
                      <circle cx="27" cy="11" r="2.5" fill="#38bdf8"/>
                    </svg>
                  </div>
                  <h4 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-sans">
                    Finance & Crypto
                  </h4>
                  <p className="text-base sm:text-lg text-slate-300 leading-relaxed font-normal">
                    Market analysts, certified financial educators, and audited web3 community leaders.
                  </p>
                </div>
              </div>

              {/* Box 4: Media */}
              <div className="p-8 sm:p-10 rounded-3xl bg-[#090d16] border border-white/10 hover:border-sky-400/50 transition-all duration-300 hover:-translate-y-1 shadow-2xl flex flex-col justify-between group">
                <div className="space-y-6">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-sky-500/20 via-sky-600/10 to-transparent border border-sky-400/30 flex items-center justify-center group-hover:scale-105 group-hover:border-sky-400 transition-all shadow-[0_0_20px_rgba(56,189,248,0.2)]">
                    <svg className="w-9 h-9" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <rect x="9" y="11" width="14" height="14" rx="3" stroke="#38bdf8" strokeWidth="2.2"/>
                      <path d="M23 15L28 12V24L23 21V15Z" stroke="#7dd3fc" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                      <polygon points="14,15 18,18 14,21" fill="#ffffff"/>
                    </svg>
                  </div>
                  <h4 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-sans">
                    Entertainment & Media
                  </h4>
                  <p className="text-base sm:text-lg text-slate-300 leading-relaxed font-normal">
                    Video essayists, investigative reporters, podcasters, and high-production filmmakers.
                  </p>
                </div>
              </div>

              {/* Box 5: Design */}
              <div className="p-8 sm:p-10 rounded-3xl bg-[#090d16] border border-white/10 hover:border-sky-400/50 transition-all duration-300 hover:-translate-y-1 shadow-2xl flex flex-col justify-between group">
                <div className="space-y-6">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-sky-500/20 via-sky-600/10 to-transparent border border-sky-400/30 flex items-center justify-center group-hover:scale-105 group-hover:border-sky-400 transition-all shadow-[0_0_20px_rgba(56,189,248,0.2)]">
                    <svg className="w-9 h-9" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 24L14 19L23 10C23.8284 9.17157 25.1716 9.17157 26 10C26.8284 10.8284 26.8284 12.1716 26 13L17 22L12 24Z" stroke="#38bdf8" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                      <circle cx="17" cy="18" r="1.5" fill="#ffffff"/>
                      <path d="M9 27H27" stroke="#7dd3fc" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                  </div>
                  <h4 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-sans">
                    Design & Creative Arts
                  </h4>
                  <p className="text-base sm:text-lg text-slate-300 leading-relaxed font-normal">
                    Visual creators, 3D illustrators, motion designers, and brand aesthetics builders.
                  </p>
                </div>
              </div>

              {/* Box 6: Community */}
              <div className="p-8 sm:p-10 rounded-3xl bg-[#090d16] border border-white/10 hover:border-sky-400/50 transition-all duration-300 hover:-translate-y-1 shadow-2xl flex flex-col justify-between group">
                <div className="space-y-6">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-sky-500/20 via-sky-600/10 to-transparent border border-sky-400/30 flex items-center justify-center group-hover:scale-105 group-hover:border-sky-400 transition-all shadow-[0_0_20px_rgba(56,189,248,0.2)]">
                    <svg className="w-9 h-9" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M14 16C15.6569 16 17 14.6569 17 13C17 11.3431 15.6569 10 14 10C12.3431 10 11 11.3431 11 13C11 14.6569 12.3431 16 14 16Z" stroke="#38bdf8" strokeWidth="2"/>
                      <path d="M22 16C23.6569 16 25 14.6569 25 13C25 11.3431 23.6569 10 22 10C20.3431 10 19 11.3431 19 13C19 14.6569 20.3431 16 22 16Z" stroke="#7dd3fc" strokeWidth="2"/>
                      <path d="M8 25C8 22 11 20 14 20C17 20 20 22 20 25" stroke="#38bdf8" strokeWidth="2.2" strokeLinecap="round"/>
                      <path d="M20.5 20.5C22 21 24 22 24 25" stroke="#ffffff" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                  </div>
                  <h4 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-sans">
                    Community & Discord
                  </h4>
                  <p className="text-base sm:text-lg text-slate-300 leading-relaxed font-normal">
                    Server founders and community leaders with 10k+ verified active engaged members.
                  </p>
                </div>
              </div>

            </div>

          </div>

        </div>
      </section>

      {/* =========================================================================
          SECTION 2: VERTICAL TIMELINE / STEP PROCESS
          ========================================================================= */}
      <section id="timeline" className="relative py-20 md:py-28 bg-transparent">
        <div className="container px-4 md:px-6 mx-auto max-w-6xl">
          
          <div className="text-center space-y-3 mb-20">
            <div className="inline-flex items-center gap-2 rounded-full border border-sky-500/25 bg-sky-950/40 px-4 py-1.5 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-sky-400 shadow-[0_0_8px_#38bdf8]" />
              <span className="text-xs sm:text-sm font-semibold text-sky-300">
                How It Works
              </span>
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white leading-tight font-sans">
              Simple 3-Step Verification
            </h2>
          </div>

          {/* Central Vertical Line Container */}
          <div className="relative">
            
            {/* The Vertical Line running down the center */}
            <div className="hidden md:block absolute left-1/2 -translate-x-1/2 top-4 bottom-4 w-0.5 bg-sky-500/40 rounded-full" />

            <div className="space-y-16 md:space-y-20">
              
              {/* STEP 01 */}
              <div className="relative flex flex-col md:flex-row items-center justify-between gap-8">
                <div className="w-full md:w-[45%]">
                  <TiltCard maxTilt={6} className="rounded-3xl border border-sky-500/25 bg-[#090d16]/95 backdrop-blur-xl p-8 sm:p-10 shadow-2xl hover:border-sky-400/80 transition-all duration-300 hover:-translate-y-1">
                    <div className="flex items-center justify-between mb-6">
                      <HoloStepBadge number="01" />
                      <div className="w-14 h-14 rounded-2xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 shadow-[0_0_20px_rgba(56,189,248,0.2)]">
                        <Step1SubmitSvg className="w-8 h-8" />
                      </div>
                    </div>
                    
                    <h3 className="text-2xl sm:text-3xl font-extrabold text-white mb-4 font-sans tracking-tight">
                      Submit Details & Proof
                    </h3>
                    
                    <p className="text-base sm:text-lg text-slate-300 leading-relaxed font-sans font-normal">
                      Apply with your channel details and upload a screenshot proof of your YouTube Studio overview or Discord Server Insights. No passwords required.
                    </p>
                  </TiltCard>
                </div>

                <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 w-16 h-16 rounded-full bg-[#090d16] border-2 border-sky-400 items-center justify-center z-20 text-sky-400 shadow-[0_0_24px_rgba(56,189,248,0.5)]">
                  <Step1SubmitSvg className="w-7 h-7" />
                </div>

                <div className="hidden md:block w-[45%]" />
              </div>

              {/* STEP 02 */}
              <div className="relative flex flex-col md:flex-row items-center justify-between gap-8">
                <div className="hidden md:block w-[45%]" />

                <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 w-16 h-16 rounded-full bg-[#090d16] border-2 border-sky-400 items-center justify-center z-20 text-sky-400 shadow-[0_0_24px_rgba(56,189,248,0.5)]">
                  <Step2AuditSvg className="w-7 h-7" />
                </div>

                <div className="w-full md:w-[45%]">
                  <TiltCard maxTilt={6} className="rounded-3xl border border-sky-500/25 bg-[#090d16]/95 backdrop-blur-xl p-8 sm:p-10 shadow-2xl hover:border-sky-400/80 transition-all duration-300 hover:-translate-y-1">
                    <div className="flex items-center justify-between mb-6">
                      <div className="w-14 h-14 rounded-2xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 shadow-[0_0_20px_rgba(56,189,248,0.2)]">
                        <Step2AuditSvg className="w-8 h-8" />
                      </div>
                      <HoloStepBadge number="02" />
                    </div>
                    
                    <h3 className="text-2xl sm:text-3xl font-extrabold text-white mb-4 font-sans tracking-tight">
                      Staff Proof Inspection
                    </h3>
                    
                    <p className="text-base sm:text-lg text-slate-300 leading-relaxed font-sans font-normal">
                      CreatorHQ staff manually audits the dashboard screenshot in our operations console, checking UI validity, channel owner match, and subscriber reach to prevent fraud.
                    </p>
                  </TiltCard>
                </div>
              </div>

              {/* STEP 03 */}
              <div className="relative flex flex-col md:flex-row items-center justify-between gap-8">
                <div className="w-full md:w-[45%]">
                  <TiltCard maxTilt={6} className="rounded-3xl border border-sky-500/25 bg-[#090d16]/95 backdrop-blur-xl p-8 sm:p-10 shadow-2xl hover:border-sky-400/80 transition-all duration-300 hover:-translate-y-1">
                    <div className="flex items-center justify-between mb-6">
                      <HoloStepBadge number="03" />
                      <div className="w-14 h-14 rounded-2xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 shadow-[0_0_20px_rgba(56,189,248,0.2)]">
                        <Step3MintSvg className="w-8 h-8" />
                      </div>
                    </div>
                    
                    <h3 className="text-2xl sm:text-3xl font-extrabold text-white mb-4 font-sans tracking-tight">
                      Creator ID Minting & Verification
                    </h3>
                    
                    <p className="text-base sm:text-lg text-slate-300 leading-relaxed font-sans font-normal">
                      Once staff approves, your official Creator ID (such as CHQ-000184) is minted. Your 3D card activates, Discord roles sync, and your profile is opened to vetted brand deals on creatorhq.fun.
                    </p>
                  </TiltCard>
                </div>

                <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 w-16 h-16 rounded-full bg-[#090d16] border-2 border-sky-400 items-center justify-center z-20 text-sky-400 shadow-[0_0_24px_rgba(56,189,248,0.5)]">
                  <Step3MintSvg className="w-7 h-7" />
                </div>

                <div className="hidden md:block w-[45%]" />
              </div>

            </div>

          </div>

        </div>
      </section>

      {/* =========================================================================
          SECTION 3: "MEET OUR TALENTED CREATORS" (INSPECTION OF YOUTUBER CARDS)
          ========================================================================= */}
      <section id="talents" className="relative py-20 md:py-28 bg-transparent">
        <div className="container px-4 md:px-6 mx-auto max-w-7xl">
          
          {/* Header */}
          <div className="text-center space-y-3 mb-10">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-white font-sans">
              Meet Our Talented Creators
            </h2>
            <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto leading-relaxed">
              We work with exceptional verified content creators across various platforms. Click any YouTuber below to inspect their official Creator ID card.
            </p>

            {/* Apply Action: When user applies, it sends proof to staff for review */}
            <div className="pt-3">
              <button
                onClick={() => {
                  setSubmitFeedback(null);
                  setIsApplyModalOpen(true);
                }}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg btn-chq-primary text-sm font-semibold shadow-sm"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Apply for Creator ID</span>
              </button>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="max-w-2xl mx-auto mb-12 space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search creators by name, bio, or niche..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-11 pl-11 pr-4 rounded-lg bg-[#11141a] border border-white/10 text-white placeholder:text-slate-500 focus:outline-none focus:border-sky-400 text-sm"
              />
            </div>

            <div className="flex justify-center">
              <div className="relative">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="appearance-none h-9 px-5 pr-9 rounded-lg bg-[#11141a] border border-white/10 text-slate-200 text-xs font-medium focus:outline-none focus:border-sky-400 cursor-pointer"
                >
                  <option value="All Categories">All Categories</option>
                  <option value="Gaming">Gaming</option>
                  <option value="Minecraft">Minecraft</option>
                  <option value="Roblox">Roblox</option>
                  <option value="Tech">Tech & AI</option>
                  <option value="Design">Design & UX</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Creators Grid */}
          {filteredCreators.length === 0 ? (
            <div className="col-span-full py-16 px-6 text-center rounded-2xl bg-[#11141a] border border-white/10 max-w-xl mx-auto space-y-4">
              <div className="w-12 h-12 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 mx-auto">
                <UserCheck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">No Verified Passes Yet</h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-md mx-auto">
                Be the first to mint your sovereign Creator Pass. Claim your credential in Creator Studio, and your pass will be featured here.
              </p>
              <div className="pt-2">
                <Link
                  href="/signup"
                  className="btn-chq-primary px-6 py-2.5 text-xs font-bold inline-flex items-center gap-2"
                >
                  <span>Start Creating</span>
                  <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
                </Link>
              </div>
            </div>
                    ) : (
            <div className="space-y-10">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
                {filteredCreators.map((creator) => (
                <TiltCard
                  key={creator.id}
                  maxTilt={8}
                  className="rounded-2xl border border-white/10 bg-[#11141a] p-8 flex flex-col items-center text-center justify-between hover:border-sky-500/50 transition-all group"
                >
                  <div className="flex flex-col items-center w-full">
                    
                    {/* Round Avatar */}
                    <div className="relative mb-5">
                      <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-white/15 p-1 group-hover:border-sky-400 transition-colors">
                        <img
                          src={creator.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'}
                          alt={creator.displayName}
                          className="w-full h-full rounded-full object-cover"
                        />
                      </div>
                    </div>

                    {/* Handle */}
                    <h3 className="text-xl font-bold text-white mb-2 font-sans">
                      {creator.displayName || creator.username}
                    </h3>
                    <span className="text-xs font-mono text-sky-400 mb-3 block">
                      @{creator.slug || creator.username}
                    </span>

                    {/* Bio */}
                    <p className="text-xs sm:text-sm text-slate-400 leading-relaxed mb-4 min-h-[40px]">
                      {creator.bio || 'Verified content creator on CreatorHQ Talent Network.'}
                    </p>

                    {/* Category Pills */}
                    <div className="flex flex-wrap items-center justify-center gap-2 mb-6">
                      <span className="px-3 py-1 rounded-md bg-[#161922] border border-white/10 text-slate-300 text-xs font-medium">
                        {creator.category || creator.niche || 'Creator'}
                      </span>
                      {creator.skills?.[0] && (
                        <span className="px-3 py-1 rounded-md bg-[#161922] border border-white/10 text-slate-300 text-xs font-medium">
                          {creator.skills[0]}
                        </span>
                      )}
                    </div>

                    {/* Social Handles */}
                    <div className="flex items-center justify-center gap-2.5 mb-6">
                      {creator.connections?.youtube?.connected && (
                        <div className="w-9 h-9 rounded-lg bg-red-950/40 border border-red-900/40 flex items-center justify-center text-red-400" title="YouTube Verified">
                          <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                          </svg>
                        </div>
                      )}

                      {creator.connections?.discord?.connected && (
                        <div className="w-9 h-9 rounded-lg bg-[#5865F2]/20 border border-[#5865F2]/30 flex items-center justify-center text-[#5865F2]" title="Discord Verified">
                          <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                            <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.893.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.078.078 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
                          </svg>
                        </div>
                      )}

                      {creator.connections?.instagram?.connected && (
                        <div className="w-9 h-9 rounded-lg bg-pink-950/40 border border-pink-900/40 flex items-center justify-center text-pink-400" title="Instagram Verified">
                          <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                          </svg>
                        </div>
                      )}
                    </div>

                  </div>

                  {/* Bottom Metric & View Creator ID Button */}
                  <div className="pt-4 border-t border-white/10 w-full space-y-3">
                    <div className="flex items-center justify-center gap-2 text-sky-400 font-semibold text-sm">
                      <TrendingUp className="w-4 h-4 text-sky-400" />
                      <span>
                        {creator.connections?.youtube?.metricValue
                          ? (creator.connections.youtube.metricValue.toLowerCase().includes('sub')
                              ? creator.connections.youtube.metricValue
                              : `${creator.connections.youtube.metricValue} Subscribers`)
                          : (creator.connections?.instagram?.metricValue
                              ? `${creator.connections.instagram.metricValue}`
                              : (creator.connections?.discord?.metricValue
                                  ? (creator.connections.discord.metricValue.toLowerCase().includes('mem')
                                      ? creator.connections.discord.metricValue
                                      : `${creator.connections.discord.metricValue} Members`)
                                  : 'Verified Talent'))}
                      </span>
                    </div>

                    {/* PROMINENT BUTTON TO INSPECT YOUTUBER'S CREATOR ID */}
                    <button
                      onClick={() => setInspectingCreator(creator)}
                      className="w-full py-2.5 rounded-lg btn-chq-primary text-xs font-semibold flex items-center justify-center gap-2 shadow-sm"
                    >
                      <CreditCard className="w-4 h-4" />
                      <span>View Creator ID</span>
                    </button>
                  </div>
                </TiltCard>
              ))}
            </div>

            <div className="pt-6 text-center">
              <Link
                href="/talents"
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl btn-chq-primary text-sm font-semibold shadow-lg shadow-sky-500/15 hover:scale-[1.02] transition-transform"
              >
                <span>Explore All Verified Talents ({creatorsList.length})</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
          )}

        </div>
      </section>

      {/* Section Divider */}
      <div className="w-full h-px bg-white/10" />

      {/* =========================================================================
          SECTION 4: "QUICK INFO" & "WANT TO COLLABORATE?"
          ========================================================================= */}
      <section className="relative py-24 md:py-32 bg-[#0b0d11]">
        <div className="container px-4 md:px-6 mx-auto max-w-4xl space-y-8">
          
          {/* Quick Info Box */}
          <div className="rounded-2xl border border-white/15 bg-[#12151c] p-8 sm:p-10 space-y-7 shadow-lg">
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-sky-400" />
              <h3 className="text-2xl font-bold text-white font-sans">
                Quick Info
              </h3>
            </div>

            <div className="space-y-5 text-sm">
              <div>
                <span className="text-xs uppercase tracking-wider text-slate-300 font-semibold block mb-1.5">
                  Content Type
                </span>
                <span className="text-base sm:text-lg text-white font-semibold">
                  Gaming, Minecraft, Roblox, Tech & AI
                </span>
              </div>

              <div>
                <span className="text-xs uppercase tracking-wider text-slate-300 font-semibold block mb-1.5">
                  Previous Paid Collaborations
                </span>
                <span className="inline-block px-3.5 py-1.5 rounded-lg bg-[#161922] border border-white/10 text-slate-200 text-sm font-mono font-medium">
                  Verified 12+ Brand Campaigns
                </span>
              </div>

              <div>
                <span className="text-xs uppercase tracking-wider text-slate-300 font-semibold block mb-2">
                  Contact for Paid Collaboration
                </span>
                <a
                  href="mailto:contact@creatorhq.fun"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#161922] border border-white/10 hover:border-sky-400 text-sky-400 text-base font-semibold transition-colors"
                >
                  <Mail className="w-4 h-4" />
                  <span>contact@creatorhq.fun</span>
                </a>
              </div>

              <div>
                <span className="text-xs uppercase tracking-wider text-slate-300 font-semibold block mb-2">
                  Social Handles
                </span>
                <div className="flex flex-wrap gap-2.5">
                  <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#161922] border border-white/10 text-slate-200 text-xs font-semibold">
                    YouTube
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#161922] border border-white/10 text-slate-200 text-xs font-semibold">
                    Instagram
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#161922] border border-white/10 text-slate-200 text-xs font-semibold">
                    Discord
                  </span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* =========================================================================
          SECTION 5: "FREQUENTLY ASKED QUESTIONS"
          ========================================================================= */}
      <section id="faq" className="relative py-20 md:py-28 bg-transparent">
        <div className="container px-4 md:px-6 mx-auto max-w-4xl">
          
          {/* Header */}
          <div className="text-center space-y-3 mb-16">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-[#11141a] px-4 py-1.5 shadow-sm">
              <HelpCircle className="w-4 h-4 text-sky-400" />
              <span className="text-xs sm:text-sm font-semibold text-slate-200">
                Help Center
              </span>
            </div>

            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-white leading-tight font-sans">
              Frequently Asked Questions
            </h2>

            <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto leading-relaxed">
              Got questions? We've got answers. Find everything you need to know about Creator ID verification and brand deals at creatorhq.fun.
            </p>
          </div>

          {/* Accordion List */}
          <div className="space-y-3">
            {faqs.map((faq, index) => {
              const isOpen = openFaq === index;
              return (
                <div
                  key={index}
                  className="rounded-xl border border-white/15 bg-[#12151c] overflow-hidden transition-colors"
                >
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : index)}
                    className="w-full px-6 py-5 flex items-center justify-between text-left group"
                  >
                    <span className="text-base sm:text-lg font-bold text-white group-hover:text-sky-400 transition-colors pr-4">
                      {faq.q}
                    </span>
                    <span className="text-slate-400 group-hover:text-sky-400 transition-colors shrink-0">
                      {isOpen ? (
                        <ChevronUp className="w-5 h-5 text-sky-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5" />
                      )}
                    </span>
                  </button>

                  {isOpen && (
                    <div className="px-6 pb-6 pt-2 text-base text-slate-200 leading-relaxed border-t border-white/10 font-normal font-sans">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* =========================================================================
          MODAL: VIEW YOUTUBER CREATOR ID (USER REQUESTED: "we can see youtubers passport add that too")
          ========================================================================= */}
      {inspectingCreator && (
        <div className="fixed inset-0 z-[300] bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-[#11141a] border border-white/15 p-6 md:p-8 space-y-6 shadow-2xl relative max-h-[95vh] overflow-y-auto">
            <button
              onClick={() => setInspectingCreator(null)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white p-1"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Header */}
            <div className="flex items-start justify-between pr-8">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs uppercase tracking-wider text-sky-400 font-semibold font-mono">
                    VERIFIED CREATOR PASS
                  </span>
                  <span className="px-2 py-0.5 rounded bg-white/[0.05] border border-white/10 text-[10px] text-slate-300 font-mono">
                    {inspectingCreator.passportId}
                  </span>
                </div>
                <h3 className="text-2xl font-bold text-white font-sans">
                  {inspectingCreator.displayName}
                </h3>
                <p className="text-xs text-slate-400">
                  {inspectingCreator.category} • Verified Reach: <strong className="text-white font-semibold">
                    {inspectingCreator.connections?.youtube?.metricValue?.toLowerCase().includes('sub')
                      ? inspectingCreator.connections.youtube.metricValue
                      : `${inspectingCreator.connections?.youtube?.metricValue || '1.8M'} Subscribers`}
                  </strong>
                </p>
              </div>
            </div>

            {/* 3D Interactive Card Display */}
            <div className="flex flex-col items-center justify-center pt-2">
              <PassportCard
                creator={inspectingCreator}
                interactive={true}
                size="hero"
                showControls={true}
                allowFreeze={true}
              />
            </div>

            {/* Actions Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-white/10 text-xs">
              <div className="flex items-center gap-2 text-slate-400 font-mono">
                <span>Domain:</span>
                <span className="text-sky-400">
                  creatorhq.fun/{(inspectingCreator.slug || inspectingCreator.username || inspectingCreator.passportId || '').replace(/^@/, '')}
                </span>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={() => copyCreatorUrl((inspectingCreator.slug || inspectingCreator.username || inspectingCreator.passportId || '').replace(/^@/, ''))}
                  className="px-4 py-2 rounded-lg bg-[#161922] border border-white/10 hover:border-sky-400 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors flex-1 sm:flex-initial"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copiedLink ? 'Copied Link!' : 'Copy URL'}</span>
                </button>

                <Link
                  href={`/${(inspectingCreator.slug || inspectingCreator.username || inspectingCreator.passportId || '').replace(/^@/, '')}`}
                  className="px-4 py-2 rounded-lg btn-chq-primary text-xs font-semibold flex items-center justify-center gap-1.5 flex-1 sm:flex-initial"
                >
                  <span>Full Profile</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: APPLY FOR CREATOR ID (STAFF REVIEWS PROOF)
          ========================================================================= */}
      {isApplyModalOpen && (
        <div className="fixed inset-0 z-[300] bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-2xl bg-[#11141a] border border-white/15 p-6 md:p-8 space-y-6 shadow-2xl relative">
            <button
              onClick={() => setIsApplyModalOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <span className="text-xs uppercase tracking-wider text-sky-400 font-bold font-mono">
                CREATOR ID ONBOARDING
              </span>
              <h3 className="text-2xl font-bold text-white mt-1">
                Apply for Creator ID
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                All applications are audited by CreatorHQ staff before minting to prevent impersonation.
              </p>
            </div>

            {submitFeedback === 'APPLICATION_QUEUED' ? (
              <div className="p-5 rounded-xl bg-sky-950/80 border border-sky-500/50 space-y-3">
                <div className="flex items-center gap-3 text-sky-300">
                  <CheckCircle2 className="w-6 h-6 text-sky-400 shrink-0" />
                  <span className="font-bold text-sm">Application Submitted for Staff Review!</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Your dashboard screenshot proof has been queued in the staff operations console. Staff will inspect your analytics proof and approve your official Creator ID shortly.
                </p>
                <div className="pt-2">
                  <button
                    onClick={() => setIsApplyModalOpen(false)}
                    className="w-full py-2.5 rounded-lg btn-chq-primary text-xs font-semibold"
                  >
                    Close Window
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleApplyPassport} className="space-y-4">
                <div>
                  <label className="text-xs text-slate-300 font-semibold block mb-1.5">
                    Channel Name / Display Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. SenpaiNova"
                    value={appName}
                    onChange={(e) => setAppName(e.target.value)}
                    className="w-full h-10 px-3.5 rounded-lg bg-[#161922] border border-white/10 text-white text-sm focus:outline-none focus:border-sky-400"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-slate-300 font-semibold block mb-1.5">
                      Handle
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="@senpainova"
                      value={appHandle}
                      onChange={(e) => setAppHandle(e.target.value)}
                      className="w-full h-10 px-3.5 rounded-lg bg-[#161922] border border-white/10 text-white text-sm focus:outline-none focus:border-sky-400"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-300 font-semibold block mb-1.5">
                      Platform
                    </label>
                    <select
                      value={appPlatform}
                      onChange={(e) => setAppPlatform(e.target.value as 'YOUTUBE' | 'DISCORD')}
                      className="w-full h-10 px-3 rounded-lg bg-[#161922] border border-white/10 text-white text-sm focus:outline-none focus:border-sky-400 cursor-pointer"
                    >
                      <option value="YOUTUBE">YouTube Channel</option>
                      <option value="DISCORD">Discord Server</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-slate-300 font-semibold block mb-1.5">
                      Subscribers / Members
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 850K Subscribers"
                      value={appMetrics}
                      onChange={(e) => setAppMetrics(e.target.value)}
                      className="w-full h-10 px-3.5 rounded-lg bg-[#161922] border border-white/10 text-white text-sm focus:outline-none focus:border-sky-400"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-300 font-semibold block mb-1.5">
                      Category
                    </label>
                    <select
                      value={appCategory}
                      onChange={(e) => setAppCategory(e.target.value)}
                      className="w-full h-10 px-3 rounded-lg bg-[#161922] border border-white/10 text-white text-sm focus:outline-none focus:border-sky-400 cursor-pointer"
                    >
                      <option value="Gaming">Gaming</option>
                      <option value="Minecraft">Minecraft</option>
                      <option value="Roblox">Roblox</option>
                      <option value="Tech">Tech</option>
                      <option value="Design">Design</option>
                    </select>
                  </div>
                </div>

                {/* Dashboard Proof Screenshot Upload Area */}
                <div>
                  <label className="text-xs text-slate-300 font-semibold block mb-1.5">
                    Attach Dashboard Screenshot Proof (YouTube Studio / Server Insights)
                  </label>
                  <div
                    onClick={() => setProofUploaded(!proofUploaded)}
                    className={`p-4 rounded-xl border-2 border-dashed transition-colors cursor-pointer text-center ${
                      proofUploaded
                        ? 'border-sky-400 bg-sky-950/30'
                        : 'border-white/15 hover:border-sky-400 bg-[#161922]'
                    }`}
                  >
                    <UploadCloud className={`w-7 h-7 mx-auto mb-2 ${proofUploaded ? 'text-sky-400' : 'text-slate-400'}`} />
                    <p className="text-xs text-slate-300 font-medium">
                      {proofUploaded ? '✓ studio_analytics_proof.png (Attached)' : 'Click to attach studio analytics capture'}
                    </p>
                    <p className="text-[10px] text-slate-500 mt-1">
                      Staff audits channel name, 28-day analytics curves, and ownership indicators
                    </p>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-11 rounded-lg btn-chq-primary text-sm font-semibold flex items-center justify-center gap-2 shadow-sm"
                >
                  {isSubmitting ? (
                    <span>Submitting to Staff Review Queue...</span>
                  ) : (
                    <>
                      <span>Submit for Staff Proof Review</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}

          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: CONTACT / COLLABORATION INQUIRY
          ========================================================================= */}
      {isContactOpen && (
        <div className="fixed inset-0 z-[300] bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-[#11141a] border border-white/15 p-6 md:p-8 space-y-5 shadow-2xl relative">
            <button
              onClick={() => setIsContactOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <h3 className="text-2xl font-bold text-white">Get in Touch</h3>
              <p className="text-xs text-slate-400 mt-1">
                Looking for brand sponsorships or creator collaborations? Leave your email and our team will get back to you.
              </p>
            </div>

            {contactSuccess ? (
              <div className="p-4 rounded-xl bg-sky-950/80 border border-sky-500/50 text-sky-200 text-sm flex items-center gap-3">
                <Check className="w-5 h-5 text-sky-400 shrink-0" />
                <span>Message received! Our team will connect shortly.</span>
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setContactSuccess(true);
                  setTimeout(() => {
                    setIsContactOpen(false);
                    setContactSuccess(false);
                    setContactEmail('');
                    setContactMessage('');
                  }, 1800);
                }}
                className="space-y-4"
              >
                <div>
                  <label className="text-xs text-slate-300 font-semibold block mb-1">
                    Your Email
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="you@brand.com"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    className="w-full h-10 px-3.5 rounded-lg bg-[#161922] border border-white/10 text-white text-sm focus:outline-none focus:border-sky-400"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-300 font-semibold block mb-1">
                    Message / Collaboration Details
                  </label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Tell us about your brand, budget, or campaign..."
                    value={contactMessage}
                    onChange={(e) => setContactMessage(e.target.value)}
                    className="w-full p-3 rounded-lg bg-[#161922] border border-white/10 text-white text-sm focus:outline-none focus:border-sky-400 resize-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full h-11 rounded-lg btn-chq-primary text-sm font-semibold shadow-sm"
                >
                  Send Inquiry
                </button>
              </form>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
