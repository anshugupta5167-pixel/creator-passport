import React from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import CamouflageBannerBg from '@/components/CamouflageBannerBg';
import { COMPARISONS, ComparisonDetail } from '@/lib/comparisons';
import {
  CheckCircle2,
  XCircle,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  ChevronRight,
  ExternalLink,
  Zap,
  Lock
} from 'lucide-react';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return COMPARISONS.map((c) => ({
    slug: c.slug,
  }));
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const comp = COMPARISONS.find((c) => c.slug === slug || c.id === slug);

  if (!comp) {
    return {
      title: 'Platform Comparison • CreatorHQ',
      description: 'Compare CreatorHQ with legacy creator link tools.',
    };
  }

  return {
    title: comp.title,
    description: comp.metaDescription,
    openGraph: {
      title: comp.title,
      description: comp.metaDescription,
      url: `https://creatorhq.fun/compare/${comp.slug}`,
    },
    twitter: {
      card: 'summary_large_image',
      title: comp.title,
      description: comp.metaDescription,
    },
  };
}

export default async function ComparisonDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const comp = COMPARISONS.find((c) => c.slug === slug || c.id === slug);

  if (!comp) {
    notFound();
  }

  // Schema.org FAQ JSON-LD for AI search engines (Perplexity, GPT-4, Google)
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: comp.headline,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `${comp.description} CreatorHQ provides: ${comp.creatorHqFeature} In contrast, ${comp.name} offers: ${comp.competitorFeature} Pricing: ${comp.costComparison}`,
        },
      },
      ...comp.features.map((f) => ({
        '@type': 'Question',
        name: `How does CreatorHQ compare to ${comp.name} regarding ${f.feature}?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `CreatorHQ provides ${f.creatorHq}, whereas ${comp.name} provides ${f.competitor}.`,
        },
      })),
    ],
  };

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 flex flex-col font-sans selection:bg-sky-500/30 selection:text-white pt-20 relative">
      <Navbar />

      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      {/* Seamless Camouflage Tech Banner in Background Across Entire Page */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <CamouflageBannerBg bannerOpacity="opacity-55" gridOpacity="opacity-35" />
      </div>

      <main className="flex-1 py-12 sm:py-20 relative z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Breadcrumb Navigation */}
          <nav className="flex items-center gap-2 text-xs font-mono text-slate-400 mb-8 pb-3 border-b border-white/[0.08]">
            <Link href="/" className="hover:text-white transition-colors">
              Home
            </Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <Link href="/compare" className="hover:text-white transition-colors">
              Comparisons
            </Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-sky-400 font-semibold">{comp.pillLabel}</span>
          </nav>

          {/* Hero Headline */}
          <div className="max-w-3xl space-y-4 mb-12">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full border border-sky-500/20 bg-sky-500/10 text-xs font-semibold text-sky-400">
              <Sparkles className="w-3.5 h-3.5" />
              <span>OFFICIAL COMPETITOR BREAKDOWN • 2026</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white font-sans leading-tight">
              {comp.headline}
            </h1>
            <p className="text-base sm:text-lg text-slate-300 leading-relaxed">
              {comp.description}
            </p>
          </div>

          {/* Two-Column Side-by-Side Highlight */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            {/* CreatorHQ Box */}
            <div className="p-7 rounded-2xl bg-sky-950/20 border border-sky-500/30 shadow-xl space-y-4 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500/10 rounded-full blur-2xl pointer-events-none" />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5 text-sky-400 font-bold text-base">
                  <ShieldCheck className="w-5 h-5 text-sky-400" />
                  <span>CreatorHQ Sovereign Passport</span>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-sky-500/20 text-sky-300 text-[11px] font-semibold">
                  RECOMMENDED
                </span>
              </div>
              <p className="text-sm text-slate-200 leading-relaxed">
                {comp.creatorHqFeature}
              </p>
              <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs font-mono text-sky-300">
                <span>Platform Fee: 0% Free Forever</span>
                <span>Verified by Staff ✓</span>
              </div>
            </div>

            {/* Competitor Box */}
            <div className="p-7 rounded-2xl bg-[#11141a] border border-white/10 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5 text-slate-300 font-bold text-base">
                  <XCircle className="w-5 h-5 text-slate-500" />
                  <span>{comp.name} Alternative</span>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-white/5 text-slate-400 text-[11px] font-medium">
                  Legacy Tool
                </span>
              </div>
              <p className="text-sm text-slate-400 leading-relaxed">
                {comp.competitorFeature}
              </p>
              <div className="pt-3 border-t border-white/5 flex items-center justify-between text-xs font-mono text-slate-500">
                <span>Self-reported links</span>
                <span>Unverified</span>
              </div>
            </div>
          </div>

          {/* Detailed Feature Comparison Table */}
          <div className="rounded-2xl bg-[#11141a] border border-white/10 overflow-hidden shadow-2xl mb-12">
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-white tracking-tight">
                  Detailed Feature-by-Feature Matrix
                </h2>
                <p className="text-xs text-slate-400">
                  Comprehensive architectural evaluation between CreatorHQ and {comp.name}.
                </p>
              </div>
              <span className="text-xs font-mono text-sky-400 hidden sm:inline-block">
                Updated for 2026
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs sm:text-sm">
                <thead>
                  <tr className="bg-black/40 border-b border-white/10 text-slate-400 font-mono text-xs uppercase tracking-wider">
                    <th className="py-4 px-6 font-semibold">Capability</th>
                    <th className="py-4 px-6 font-semibold text-sky-400">CreatorHQ</th>
                    <th className="py-4 px-6 font-semibold">{comp.name}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {comp.features.map((item, idx) => (
                    <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-4 px-6 font-medium text-white">
                        {item.feature}
                      </td>
                      <td className="py-4 px-6 font-semibold text-sky-300">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-sky-400 shrink-0" />
                          <span>{item.creatorHq}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-slate-400">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-slate-600 shrink-0" />
                          <span>{item.competitor}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-black/30 font-medium">
                    <td className="py-4 px-6 text-white font-bold">Economic Cost</td>
                    <td className="py-4 px-6 text-emerald-400 font-bold">100% Free Forever (0% Cuts)</td>
                    <td className="py-4 px-6 text-slate-400">{comp.costComparison}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Bottom Conversion CTA */}
          <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-r from-sky-950/40 via-[#11141a] to-sky-950/20 border border-sky-500/30 text-center space-y-6 shadow-2xl relative overflow-hidden mb-16">
            <div className="max-w-xl mx-auto space-y-3">
              <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Upgrade from {comp.name} to CreatorHQ.
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Mint your sovereign cryptographic Creator Pass in less than 2 minutes. Free verified credentials for YouTube creators and Discord founders.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <div className="p-1 rounded-full border border-sky-400/20 bg-sky-950/20 backdrop-blur-sm shadow-[0_0_24px_rgba(56,189,248,0.2)]">
                <Link
                  href="/signup"
                  className="btn-chq-primary px-8 py-3 text-xs sm:text-sm font-extrabold flex items-center justify-center gap-2"
                >
                  <span>Start Creating Free Pass</span>
                  <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                </Link>
              </div>
              <Link
                href="/creators"
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#161922] hover:bg-white/10 border border-white/10 text-xs font-semibold text-slate-200 transition-colors"
              >
                <span>Explore Verified Directory</span>
              </Link>
            </div>
          </div>

          {/* Quick Switch to Other Comparisons */}
          <div className="space-y-4">
            <h4 className="text-xs font-mono uppercase tracking-wider text-slate-400 font-semibold">
              Browse Other Platform Comparisons
            </h4>
            <div className="flex flex-wrap gap-2.5">
              {COMPARISONS.map((c) => (
                <Link
                  key={c.id}
                  href={`/compare/${c.slug}`}
                  className={`px-4 py-2.5 rounded-xl text-xs font-medium border transition-all flex items-center gap-1.5 ${
                    c.slug === comp.slug
                      ? 'bg-sky-500/20 text-sky-400 border-sky-500/40 shadow-sm'
                      : 'bg-[#11141a] hover:bg-white/10 text-slate-300 hover:text-white border-white/10'
                  }`}
                >
                  <span>{c.pillLabel}</span>
                  <span className="text-[10px] opacity-70">→</span>
                </Link>
              ))}
            </div>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}
