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
  Copy
} from 'lucide-react';
import { CreatorProfile } from '@/lib/types';
import { submitPassportApplication } from '@/lib/data';
import PassportCard from '@/components/PassportCard';

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
      return () => {
        window.removeEventListener('creatorhq_profile_updated', refreshCreators);
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
      c.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.bio.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.category.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      selectedCategory === 'All Categories' ||
      c.category.toLowerCase().includes(selectedCategory.toLowerCase()) ||
      c.skills.some((s) => s.toLowerCase().includes(selectedCategory.toLowerCase()));

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
    <div className="w-full bg-[#0b0d11] text-slate-100 font-sans">
      
      {/* =========================================================================
          SECTION 1: "EVERYTHING YOU NEED TO MAKE IT AS A CREATOR"
          ========================================================================= */}
      <section id="services" className="relative py-24 md:py-32 bg-[#0b0d11]">
        <div className="container px-4 md:px-6 mx-auto max-w-7xl">
          
          {/* Section Header */}
          <div className="flex flex-col items-center text-center space-y-3 mb-16">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-[#11141a] px-4 py-1.5 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-sky-400" />
              <span className="text-xs sm:text-sm font-semibold text-slate-200">
                Our Services
              </span>
            </div>

            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-white leading-tight font-sans">
              Everything You Need to Make It as a Creator
            </h2>

            <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto leading-relaxed">
              Whether you're just starting out or already crushing it, we've got the services and verification tools to take you to the next level.
            </p>
          </div>

          {/* Service Bento Grid (Solid Clean Cards - No Multi-Color Gradients) */}
          {/* Service Bento Grid (Solid Clean Cards - No Multi-Color Gradients) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* LEFT BIG CARD: SPONSORSHIP DEALS */}
            <TiltCard maxTilt={6} className="md:row-span-2 rounded-2xl border border-white/15 bg-[#12151c] p-8 sm:p-9 flex flex-col justify-between hover:border-sky-400/60 shadow-lg transition-all group">
              <div className="space-y-6">
                <div className="w-14 h-14 rounded-xl bg-sky-500/15 text-sky-400 flex items-center justify-center border border-sky-500/30">
                  <Handshake className="w-7 h-7" />
                </div>
                
                <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-sans">
                  Sponsorship Deals
                </h3>
                
                <p className="text-base sm:text-lg text-slate-200 leading-relaxed font-sans font-normal">
                  We'll connect you with brands that actually fit your vibe. Then we'll negotiate to get you the best deals possible—because you deserve it.
                </p>

                <div className="pt-2 flex flex-wrap gap-2 text-xs font-sans text-slate-300">
                  <span className="px-3 py-1.5 rounded-lg bg-[#161922] border border-white/10 font-medium">✓ Verified Brand Access</span>
                  <span className="px-3 py-1.5 rounded-lg bg-[#161922] border border-white/10 font-medium">✓ Escrow Protection</span>
                </div>
              </div>

              <div className="pt-8">
                <a
                  href="#faq"
                  className="inline-flex items-center gap-2 text-sm font-semibold btn-chq-secondary px-6 py-3 rounded-lg"
                >
                  <span>View Our Services FAQ</span>
                  <ArrowRight className="w-4 h-4 text-sky-400 group-hover:translate-x-1 transition-transform" />
                </a>
              </div>
            </TiltCard>

            {/* 4 CARDS ON RIGHT (2x2) */}
            
            {/* Card 1: Creator Management */}
            <TiltCard maxTilt={8} className="rounded-2xl border border-white/15 bg-[#12151c] p-7 hover:border-sky-400/60 shadow-md transition-all group">
              <div className="w-11 h-11 rounded-xl bg-sky-500/15 text-sky-400 flex items-center justify-center mb-4 border border-sky-500/30">
                <UserCheck className="w-5 h-5" />
              </div>
              <h4 className="text-xl font-bold text-white mb-2.5 font-sans">
                Creator Management
              </h4>
              <p className="text-base text-slate-200 leading-relaxed font-sans font-normal">
                Let us handle proof verification and identity tracking while you focus on creating.
              </p>
            </TiltCard>

            {/* Card 2: Media Management */}
            <TiltCard maxTilt={8} className="rounded-2xl border border-white/15 bg-[#12151c] p-7 hover:border-sky-400/60 shadow-md transition-all group">
              <div className="w-11 h-11 rounded-xl bg-sky-500/15 text-sky-400 flex items-center justify-center mb-4 border border-sky-500/30">
                <FileText className="w-5 h-5" />
              </div>
              <h4 className="text-xl font-bold text-white mb-2.5 font-sans">
                Media Management
              </h4>
              <p className="text-base text-slate-200 leading-relaxed font-sans font-normal">
                Keep your content assets and authenticated metrics organized in one verified Creator ID.
              </p>
            </TiltCard>

            {/* Card 3: Video Production */}
            <TiltCard maxTilt={8} className="rounded-2xl border border-white/15 bg-[#12151c] p-7 hover:border-sky-400/60 shadow-md transition-all group">
              <div className="w-11 h-11 rounded-xl bg-sky-500/15 text-sky-400 flex items-center justify-center mb-4 border border-sky-500/30">
                <Video className="w-5 h-5" />
              </div>
              <h4 className="text-xl font-bold text-white mb-2.5 font-sans">
                Video Production
              </h4>
              <p className="text-base text-slate-200 leading-relaxed font-sans font-normal">
                From concept to final cut, authenticate your channel metrics and make your videos shine.
              </p>
            </TiltCard>

            {/* Card 4: GFX Design */}
            <TiltCard maxTilt={8} className="rounded-2xl border border-white/15 bg-[#12151c] p-7 hover:border-sky-400/60 shadow-md transition-all group">
              <div className="w-11 h-11 rounded-xl bg-sky-500/15 text-sky-400 flex items-center justify-center mb-4 border border-sky-500/30">
                <Pin className="w-5 h-5" />
              </div>
              <h4 className="text-xl font-bold text-white mb-2.5 font-sans">
                GFX Design
              </h4>
              <p className="text-base text-slate-200 leading-relaxed font-sans font-normal">
                Thumbnails and brand cards with official CreatorHQ verification seals.
              </p>
            </TiltCard>

            {/* BOTTOM ROW (2 CARDS) */}
            
            {/* Card 5: Development */}
            <TiltCard maxTilt={8} className="rounded-2xl border border-white/15 bg-[#12151c] p-7 hover:border-sky-400/60 shadow-md transition-all group">
              <div className="w-11 h-11 rounded-xl bg-sky-500/15 text-sky-400 flex items-center justify-center mb-4 border border-sky-500/30">
                <Code2 className="w-5 h-5" />
              </div>
              <h4 className="text-xl font-bold text-white mb-2.5 font-sans">
                Development
              </h4>
              <p className="text-base text-slate-200 leading-relaxed font-sans font-normal">
                Custom discord verification bots, API webhooks, and portfolio tools built for creators.
              </p>
            </TiltCard>

            {/* Card 6: Event Management */}
            <TiltCard maxTilt={6} className="md:col-span-2 rounded-2xl border border-white/15 bg-[#12151c] p-7 hover:border-sky-400/60 shadow-md transition-all group">
              <div className="w-11 h-11 rounded-xl bg-sky-500/15 text-sky-400 flex items-center justify-center mb-4 border border-sky-500/30">
                <Calendar className="w-5 h-5" />
              </div>
              <h4 className="text-xl font-bold text-white mb-2.5 font-sans">
                Event Management
              </h4>
              <p className="text-base text-slate-200 leading-relaxed font-sans font-normal">
                Private creator masterminds, tournament co-streams, and brand matchmaking sessions.
              </p>
            </TiltCard>

          </div>

        </div>
      </section>

      {/* Section Divider */}
      <div className="w-full h-px bg-white/10" />

      {/* =========================================================================
          SECTION 2: VERTICAL TIMELINE / STEP PROCESS
          ========================================================================= */}
      <section id="timeline" className="relative py-24 md:py-32 bg-[#0b0d11]">
        <div className="container px-4 md:px-6 mx-auto max-w-6xl">
          
          <div className="text-center space-y-3 mb-20">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-[#11141a] px-4 py-1.5 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-sky-400" />
              <span className="text-xs sm:text-sm font-semibold text-slate-200">
                How It Works
              </span>
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-white leading-tight font-sans">
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
                  <TiltCard maxTilt={6} className="rounded-2xl border border-white/15 bg-[#12151c] p-8 sm:p-9 shadow-lg hover:border-sky-400/60 transition-all">
                    <div className="flex items-center justify-between mb-5">
                      <span className="text-4xl sm:text-5xl font-extrabold text-[#3ea6ff] font-sans">
                        01
                      </span>
                      <div className="w-12 h-12 rounded-xl bg-sky-500/15 text-sky-400 flex items-center justify-center border border-sky-500/30">
                        <Mail className="w-6 h-6" />
                      </div>
                    </div>
                    
                    <h3 className="text-2xl sm:text-[26px] font-extrabold text-white mb-3.5 font-sans tracking-tight">
                      Submit Details & Proof
                    </h3>
                    
                    <p className="text-base sm:text-lg text-slate-200 leading-relaxed font-sans font-normal">
                      Apply with your channel details and upload a screenshot proof of your YouTube Studio overview or Discord Server Insights. No passwords required.
                    </p>
                  </TiltCard>
                </div>

                <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 w-14 h-14 rounded-full bg-[#12151c] border-2 border-sky-400 items-center justify-center z-20 text-sky-400 shadow-md">
                  <Mail className="w-6 h-6" />
                </div>

                <div className="hidden md:block w-[45%]" />
              </div>

              {/* STEP 02 */}
              <div className="relative flex flex-col md:flex-row items-center justify-between gap-8">
                <div className="hidden md:block w-[45%]" />

                <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 w-14 h-14 rounded-full bg-[#12151c] border-2 border-sky-400 items-center justify-center z-20 text-sky-400 shadow-md">
                  <Link2 className="w-6 h-6" />
                </div>

                <div className="w-full md:w-[45%]">
                  <TiltCard maxTilt={6} className="rounded-2xl border border-white/15 bg-[#12151c] p-8 sm:p-9 shadow-lg hover:border-sky-400/60 transition-all">
                    <div className="flex items-center justify-between mb-5">
                      <div className="w-12 h-12 rounded-xl bg-sky-500/15 text-sky-400 flex items-center justify-center border border-sky-500/30">
                        <Link2 className="w-6 h-6" />
                      </div>
                      <span className="text-4xl sm:text-5xl font-extrabold text-[#3ea6ff] font-sans">
                        02
                      </span>
                    </div>
                    
                    <h3 className="text-2xl sm:text-[26px] font-extrabold text-white mb-3.5 font-sans tracking-tight">
                      Staff Proof Inspection
                    </h3>
                    
                    <p className="text-base sm:text-lg text-slate-200 leading-relaxed font-sans font-normal">
                      CreatorHQ staff manually audits the dashboard screenshot in our operations console, checking UI validity, channel owner match, and subscriber reach to prevent fraud.
                    </p>
                  </TiltCard>
                </div>
              </div>

              {/* STEP 03 */}
              <div className="relative flex flex-col md:flex-row items-center justify-between gap-8">
                <div className="w-full md:w-[45%]">
                  <TiltCard maxTilt={6} className="rounded-2xl border border-white/15 bg-[#12151c] p-8 sm:p-9 shadow-lg hover:border-sky-400/60 transition-all">
                    <div className="flex items-center justify-between mb-5">
                      <span className="text-4xl sm:text-5xl font-extrabold text-[#3ea6ff] font-sans">
                        03
                      </span>
                      <div className="w-12 h-12 rounded-xl bg-sky-500/15 text-sky-400 flex items-center justify-center border border-sky-500/30">
                        <CheckCircle2 className="w-6 h-6" />
                      </div>
                    </div>
                    
                    <h3 className="text-2xl sm:text-[26px] font-extrabold text-white mb-3.5 font-sans tracking-tight">
                      Creator ID Minting & Verification
                    </h3>
                    
                    <p className="text-base sm:text-lg text-slate-200 leading-relaxed font-sans font-normal">
                      Once staff approves, your official Creator ID (such as CHQ-000184) is minted. Your 3D card activates, Discord roles sync, and your profile is opened to vetted brand deals on creatorhq.fun.
                    </p>
                  </TiltCard>
                </div>

                <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 w-14 h-14 rounded-full bg-[#12151c] border-2 border-sky-400 items-center justify-center z-20 text-sky-400 shadow-md">
                  <CheckCircle2 className="w-6 h-6" />
                </div>

                <div className="hidden md:block w-[45%]" />
              </div>

            </div>

          </div>

        </div>
      </section>

      {/* Section Divider */}
      <div className="w-full h-px bg-white/10" />

      {/* =========================================================================
          SECTION 3: "MEET OUR TALENTED CREATORS" (INSPECTION OF YOUTUBER CARDS)
          ========================================================================= */}
      <section id="talents" className="relative py-24 md:py-32 bg-[#0b0d11]">
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
                  href="/dashboard"
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg btn-chq-primary text-xs font-semibold text-white shadow-sm"
                >
                  <span>Launch Creator Studio</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
              {filteredCreators.slice(0, 6).map((creator) => (
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
                        src={creator.avatarUrl}
                        alt={creator.displayName}
                        className="w-full h-full rounded-full object-cover"
                      />
                    </div>
                  </div>

                  {/* Handle */}
                  <h3 className="text-xl font-bold text-white mb-2 font-sans">
                    @{creator.displayName || creator.username}
                  </h3>

                  {/* Bio */}
                  <p className="text-xs sm:text-sm text-slate-400 leading-relaxed mb-4 min-h-[40px]">
                    {creator.bio}
                  </p>

                  {/* Category Pills */}
                  <div className="flex flex-wrap items-center justify-center gap-2 mb-6">
                    <span className="px-3 py-1 rounded-md bg-[#161922] border border-white/10 text-slate-300 text-xs font-medium">
                      {creator.category || 'Gaming'}
                    </span>
                    {creator.skills?.[0] && (
                      <span className="px-3 py-1 rounded-md bg-[#161922] border border-white/10 text-slate-300 text-xs font-medium">
                        {creator.skills[0]}
                      </span>
                    )}
                  </div>

                  {/* Social Handles: Strictly YouTube and Discord only */}
                  <div className="flex items-center justify-center gap-2.5 mb-6">
                    <div className="w-9 h-9 rounded-lg bg-red-950/40 border border-red-900/40 flex items-center justify-center text-red-400" title="YouTube Verified">
                      <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                      </svg>
                    </div>

                    <div className="w-9 h-9 rounded-lg bg-[#5865F2]/20 border border-[#5865F2]/30 flex items-center justify-center text-[#5865F2]" title="Discord Verified">
                      <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                        <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.893.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
                      </svg>
                    </div>
                  </div>

                </div>

                {/* Bottom Metric & View Creator ID Button */}
                <div className="pt-4 border-t border-white/10 w-full space-y-3">
                  <div className="flex items-center justify-center gap-2 text-sky-400 font-semibold text-sm">
                    <TrendingUp className="w-4 h-4 text-sky-400" />
                    <span>
                      {creator.connections.youtube?.metricValue || '1.8M'} subscribers
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

          {/* "Want to Collaborate?" Banner */}
          <div className="rounded-2xl border border-white/15 bg-[#12151c] p-8 sm:p-12 text-center space-y-5 shadow-lg">
            <h3 className="text-3xl sm:text-4xl font-extrabold text-white font-sans tracking-tight">
              Want to Collaborate?
            </h3>
            
            <p className="text-base sm:text-lg text-slate-200 max-w-2xl mx-auto leading-relaxed font-normal">
              I'm always open to brand partnerships, sponsorships, and creative projects. Let's chat and see if we can create something awesome together!
            </p>

            <div className="pt-3 flex justify-center">
              <button
                onClick={() => setIsContactOpen(true)}
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-lg btn-chq-primary text-sm font-semibold shadow-sm"
              >
                <span>Get in Touch</span>
                <ExternalLink className="w-4 h-4" />
              </button>
            </div>
          </div>

        </div>
      </section>

      {/* Section Divider */}
      <div className="w-full h-px bg-white/10" />

      {/* =========================================================================
          SECTION 5: "FREQUENTLY ASKED QUESTIONS"
          ========================================================================= */}
      <section id="faq" className="relative py-24 md:py-32 bg-[#0b0d11]">
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
                  {inspectingCreator.category} • Verified Reach: <strong className="text-white font-semibold">{inspectingCreator.connections.youtube?.metricValue || '1.8M'} subscribers</strong>
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
