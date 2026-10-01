'use client';

import React, { useState } from 'react';
import ScreenshotVerificationModal from '@/components/ScreenshotVerificationModal';
import {
  FileImage,
  UploadCloud,
  CheckCircle2,
  ShieldCheck,
  Zap,
  ArrowRight,
  Sparkles,
  Camera,
  Layers,
  Crown
} from 'lucide-react';
import confetti from 'canvas-confetti';

export default function ScreenshotProofShowcase() {
  const [modalType, setModalType] = useState<'YOUTUBE' | 'DISCORD' | null>(null);
  const [verifiedList, setVerifiedList] = useState<{
    youtube?: { metric: string; account: string };
    discord?: { metric: string; account: string };
  }>({
    youtube: { metric: '184,210 Subscribers', account: 'Creator Studio Verified' },
    discord: { metric: '12,400 Members', account: 'Official Guild (Owner Crown)' },
  });

  const handleVerifiedSuccess = (data: {
    platform: string;
    metric: string;
    account: string;
    proofUrl: string;
  }) => {
    if (data.platform === 'YOUTUBE') {
      setVerifiedList((prev) => ({
        ...prev,
        youtube: { metric: data.metric, account: data.account },
      }));
    } else {
      setVerifiedList((prev) => ({
        ...prev,
        discord: { metric: data.metric, account: data.account },
      }));
    }
  };

  return (
    <section className="py-20 md:py-28 bg-[#0b0d11] relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/10 bg-[#11141a] shadow-sm">
            <Camera className="w-4 h-4 text-sky-400" />
            <span className="text-xs sm:text-sm font-semibold text-slate-200">
              STUDIO & DASHBOARD PROOFS
            </span>
          </div>

          <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-white leading-tight font-sans">
            Verify With Studio &<br />
            <span className="text-sky-400">
              Dashboard Screenshots
            </span>
          </h2>

          <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Can’t grant API tokens or using a talent manager? Simply upload official screenshots of your <strong>YouTube Studio Dashboard</strong> or <strong>Discord Server Insights</strong>. Our staff audits ownership instantly.
          </p>
        </div>

        {/* 2 Showcase Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          
          {/* Card 1: YouTube Studio Proof */}
          <div className="group relative rounded-2xl border border-white/10 bg-[#11141a] p-8 sm:p-9 shadow-md hover:border-sky-500/50 transition-all duration-300 flex flex-col justify-between">
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div className="w-14 h-14 rounded-xl bg-red-600 flex items-center justify-center text-white shadow-md">
                  <svg className="w-7 h-7 fill-white" viewBox="0 0 24 24">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                  </svg>
                </div>

                <span className="px-3.5 py-1.5 rounded-full bg-[#161922] border border-white/10 text-sky-400 text-xs font-mono font-semibold shadow-sm">
                  OFFICIAL METRICS
                </span>
              </div>

              <div>
                <h3 className="text-2xl font-bold text-white font-sans">
                  YouTube Channel Verification
                </h3>
                <p className="text-sm text-slate-400 mt-2 leading-relaxed">
                  Verify your YouTube creator channel and audience reach. Showcase your subscriber milestones and verified video stats directly on your Creator Pass.
                </p>
              </div>

              {/* Status preview */}
              <div className="p-4 rounded-xl bg-[#161922] border border-white/5 space-y-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-400">Validated Channel:</span>
                  <span className="text-white font-bold">{verifiedList.youtube?.account}</span>
                </div>
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-400">Audience Metric:</span>
                  <span className="text-sky-400 font-bold">{verifiedList.youtube?.metric}</span>
                </div>
              </div>
            </div>

            <div className="pt-6 mt-6 border-t border-white/10">
              <button
                onClick={() => setModalType('YOUTUBE')}
                className="w-full h-11 rounded-lg btn-chq-primary text-xs font-semibold flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Verify YouTube Channel</span>
              </button>
            </div>
          </div>

          {/* Card 2: Discord Insights Proof */}
          <div className="group relative rounded-2xl border border-white/10 bg-[#11141a] p-8 sm:p-9 shadow-md hover:border-sky-500/50 transition-all duration-300 flex flex-col justify-between">
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div className="w-14 h-14 rounded-xl bg-[#5865F2] flex items-center justify-center text-white shadow-md">
                  <svg className="w-7 h-7 fill-white" viewBox="0 0 24 24">
                    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.893.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
                  </svg>
                </div>

                <span className="px-3.5 py-1.5 rounded-full bg-[#161922] border border-white/10 text-sky-400 text-xs font-mono font-semibold shadow-sm">
                  SERVER AUDIT
                </span>
              </div>

              <div>
                <h3 className="text-2xl font-bold text-white font-sans">
                  Discord Server Verification
                </h3>
                <p className="text-sm text-slate-400 mt-2 leading-relaxed">
                  Authenticate your official Discord server or community guild. Confirm your active membership count and owner badge for partners.
                </p>
              </div>

              {/* Status preview */}
              <div className="p-4 rounded-xl bg-[#161922] border border-white/5 space-y-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-400">Validated Guild:</span>
                  <span className="text-white font-bold">{verifiedList.discord?.account}</span>
                </div>
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-400">Member Reach:</span>
                  <span className="text-sky-400 font-bold">{verifiedList.discord?.metric}</span>
                </div>
              </div>
            </div>

            <div className="pt-6 mt-6 border-t border-white/10">
              <button
                onClick={() => setModalType('DISCORD')}
                className="w-full h-11 rounded-lg btn-chq-primary text-xs font-semibold flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Verify Discord Community</span>
              </button>
            </div>
          </div>

        </div>

      </div>

      {/* Screenshot Verification Modal */}
      {modalType && (
        <ScreenshotVerificationModal
          platform={modalType}
          isOpen={true}
          onClose={() => setModalType(null)}
          onSuccess={handleVerifiedSuccess}
        />
      )}
    </section>
  );
}
