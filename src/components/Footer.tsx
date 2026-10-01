import React from 'react';
import Link from 'next/link';
import CHQLogo from '@/components/CHQLogo';
import CamouflageBannerBg from '@/components/CamouflageBannerBg';

export default function Footer() {
  return (
    <footer className="w-full bg-[#0b0d11] border-t border-white/10 text-slate-400 text-sm relative overflow-hidden">
      {/* Camouflaged Luxury Tech Banner Background & Grid */}
      <CamouflageBannerBg bannerOpacity="opacity-25" gridOpacity="opacity-20" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-16 relative z-10">
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 lg:gap-12 mb-12">
          
          {/* Brand Info */}
          <div className="md:col-span-2 space-y-4">
            <Link href="/" className="inline-block">
              <CHQLogo size="md" showText={true} />
            </Link>
            <p className="text-xs sm:text-sm text-slate-400 max-w-sm leading-relaxed">
              CreatorHQ is the private creator network and verification infrastructure for online creators. Connecting authenticated YouTube channels, Discord servers, and creator credentials into one verifiable passport.
            </p>
          </div>

          {/* Navigation Links */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-white mb-4">
              Platform
            </h4>
            <ul className="space-y-2.5 text-xs">
              <li>
                <Link href="/about" className="hover:text-white transition-colors">
                  About CreatorHQ
                </Link>
              </li>
              <li>
                <Link href="/services" className="hover:text-white transition-colors">
                  Creator Services
                </Link>
              </li>
              <li>
                <Link href="/talents" className="hover:text-white transition-colors">
                  Verified Talents
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="hover:text-white transition-colors">
                  Creator Studio
                </Link>
              </li>
            </ul>
          </div>

          {/* Ecosystem Links */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-white mb-4">
              Resources & Inquiries
            </h4>
            <ul className="space-y-2.5 text-xs">
              <li>
                <Link href="/faq" className="hover:text-white transition-colors">
                  Help Center & FAQ
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-white transition-colors">
                  Contact & Partnerships
                </Link>
              </li>
              <li>
                <Link href="/compare" className="hover:text-white transition-colors">
                  Compare Alternatives
                </Link>
              </li>
              <li>
                <Link href="/admin" className="hover:text-white transition-colors">
                  Staff Console
                </Link>
              </li>
            </ul>
          </div>

        </div>

        {/* Legal & Non-Government Disclaimer */}
        <div className="pt-8 border-t border-white/10 flex flex-col items-center justify-center gap-2.5 text-xs text-slate-500 text-center">
          <p className="text-slate-400">
            © 2026 <span className="text-sky-400 font-bold">CreatorHQ</span>. All rights reserved.
          </p>
          <p className="text-[12px] text-slate-300 font-medium">
            Founded September 2026 by Anshu Gupta • Empowering creators and brands worldwide
          </p>
          <p className="font-mono text-[10px] text-slate-500">
            PRIVATE CREATOR PLATFORM • NOT A GOVERNMENT ISSUED ID
          </p>
        </div>

      </div>
    </footer>
  );
}
