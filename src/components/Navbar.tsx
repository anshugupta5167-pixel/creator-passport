'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, ArrowRight, User, ShieldCheck, Lock, LogOut } from 'lucide-react';
import CHQLogo from '@/components/CHQLogo';
import { subscribeToCreatorSync } from '@/lib/sync';

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [savedCreator, setSavedCreator] = useState<any | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    const syncProfile = () => {
      try {
        const saved = localStorage.getItem('creatorhq_user_card');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed && (parsed.displayName || parsed.username)) {
            setSavedCreator(parsed);

            // Sync latest record for THIS creator from authoritative database
            const q = parsed.passportId || parsed.slug || parsed.username;
            fetch(`/api/creators?q=${encodeURIComponent(q)}`)
              .then((r) => r.json())
              .then((data) => {
                if (data.creators && Array.isArray(data.creators) && data.creators.length > 0) {
                  const matched = data.creators.find(
                    (c: any) =>
                      (c.passportId && parsed.passportId && c.passportId.toUpperCase() === parsed.passportId.toUpperCase()) ||
                      (c.username && parsed.username && c.username.toLowerCase() === parsed.username.toLowerCase()) ||
                      (c.slug && parsed.slug && c.slug.toLowerCase() === parsed.slug.toLowerCase())
                  );
                  if (matched) {
                    setSavedCreator(matched);
                    try {
                      localStorage.setItem('creatorhq_user_card', JSON.stringify(matched));
                    } catch (e) {}
                  }
                }
              })
              .catch(() => {});
            return;
          }
        }

        // If not in localStorage, check /api/ip to see if this IP has an existing registered card
        fetch('/api/ip')
          .then((r) => r.json())
          .then((data) => {
            if (data.hasExistingCard && data.existingCreator) {
              setSavedCreator(data.existingCreator);
              try {
                localStorage.setItem('creatorhq_user_card', JSON.stringify(data.existingCreator));
              } catch (e) {}
            } else {
              setSavedCreator(null);
            }
          })
          .catch(() => {
            setSavedCreator(null);
          });
      } catch (e) {
        setSavedCreator(null);
      }
    };

    syncProfile();

    const unsubscribeSync = subscribeToCreatorSync((update) => {
      // If our current creator changed, re-sync immediately
      setSavedCreator((current: any) => {
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
          const isR = update.verificationStatus === 'REJECTED';
          const updated = {
            ...current,
            isVerified: isV,
            verification_status: update.verificationStatus,
            verificationStatus: update.verificationStatus,
            tierName: isV
              ? (current.tierName && current.tierName !== 'Candidate Member' ? current.tierName : 'Founding Member Tier I')
              : isR
              ? 'Verification Rejected'
              : 'Candidate Member'
          };
          try {
            localStorage.setItem('creatorhq_user_card', JSON.stringify(updated));
          } catch (e) {}
          return updated;
        }
        return current;
      });
    });

    if (typeof window !== 'undefined') {
      window.addEventListener('storage', syncProfile);
      window.addEventListener('creatorhq_profile_updated', syncProfile);
      return () => {
        window.removeEventListener('storage', syncProfile);
        window.removeEventListener('creatorhq_profile_updated', syncProfile);
        unsubscribeSync();
      };
    }

    return () => {
      unsubscribeSync();
    };
  }, [pathname]);

  // Dedicated professional pages per corporate architecture (Founders in last slot)
  const navLinks = [
    { name: 'About', href: '/about' },
    { name: 'Services', href: '/services' },
    { name: 'Our Talents', href: '/talents' },
    { name: 'For Creators', href: '/dashboard' },
    { name: 'FAQ', href: '/faq' },
    { name: 'Contact', href: '/contact' },
    { name: 'Founders', href: '/founders' },
  ];

  const routePageNames: Record<string, string> = {
    '/about': 'About',
    '/founders': 'Founders',
    '/services': 'Services',
    '/talents': 'Talents',
    '/creators': 'Talents',
    '/dashboard': 'Studio',
    '/faq': 'FAQ',
    '/contact': 'Contact',
    '/brands': 'Brands',
  };

  const currentPage = routePageNames[pathname] || (pathname.startsWith('/creator/') ? 'Pass' : null);

  const handleLogout = () => {
    try {
      localStorage.removeItem('creatorhq_user_card');
      setSavedCreator(null);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('creatorhq_profile_updated'));
        window.location.href = '/dashboard?reset=1';
      }
    } catch (e) {
      setSavedCreator(null);
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-[200] w-full border-b border-white/10 bg-[#0b0d11]/95 backdrop-blur-md">
      <div className="container mx-auto flex h-20 items-center justify-between px-4 md:px-6 max-w-7xl">
        
        {/* LOGO: CreatorHQ with uploaded CHQ logo + dynamic Page Name on subpages */}
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center gap-3.5 group">
            <CHQLogo size="md" showText={true} />
          </Link>
          {currentPage && (
            <div className="flex items-center gap-2 pl-1 animate-fadeIn">
              <span className="text-slate-500 font-light text-base select-none">-</span>
              <span className="text-xs sm:text-sm font-semibold tracking-wide text-sky-400 bg-sky-500/10 px-2.5 py-0.5 rounded-lg border border-sky-500/20">
                {currentPage}
              </span>
            </div>
          )}
        </div>

        {/* DESKTOP NAV LINKS */}
        <nav className="hidden lg:flex items-center gap-7">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.name}
                href={link.href}
                className={`text-sm font-medium transition-colors ${
                  isActive
                    ? 'text-sky-400 font-semibold'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                {link.name}
              </Link>
            );
          })}
        </nav>

        {/* RIGHT ACTIONS: Shows Creator Name, ID, and IP Lock when profile exists */}
        <div className="flex items-center gap-3">
          {savedCreator ? (
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Creator Identity in place of Sign In */}
              <Link
                href="/dashboard"
                className="group flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-[#121622] via-[#161b2a] to-[#141824] border border-white/15 hover:border-sky-400/60 transition-all shadow-[0_2px_14px_rgba(0,0,0,0.5)] hover:shadow-sky-500/20"
                title={`Authenticated as ${savedCreator.displayName} (@${savedCreator.slug || savedCreator.username}) • Verified Device Session`}
              >
                {savedCreator.avatarUrl ? (
                  <img
                    src={savedCreator.avatarUrl}
                    alt={savedCreator.displayName}
                    className="w-8 h-8 rounded-full object-cover border border-sky-400/40 shrink-0 ring-2 ring-black/80 shadow-md"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-sky-400 via-sky-500 to-blue-600 text-white font-black flex items-center justify-center text-xs shrink-0 shadow-md ring-1 ring-sky-300/50">
                    {savedCreator.displayName?.substring(0, 1)?.toUpperCase() || 'C'}
                  </div>
                )}
                <div className="flex flex-col text-left leading-tight min-w-0 pr-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-black text-white group-hover:text-sky-300 transition-colors tracking-tight truncate max-w-[130px] font-sans">
                      {savedCreator.displayName}
                    </span>
                    <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0 shadow-[0_0_8px_#10b981]" />
                  </div>
                  <span className="text-[10px] font-bold text-sky-400 font-sans tracking-tight">
                    @{savedCreator.slug || savedCreator.username || 'creator'}
                  </span>
                </div>
              </Link>

              {/* IP Lock & Security Badge */}
              <div
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-950/50 border border-emerald-500/40 text-emerald-400 shadow-[0_0_14px_rgba(16,185,129,0.2)] select-none backdrop-blur-md"
                title="Your device IP is verified and locked to this Creator Pass. Other users cannot sign into your ID."
              >
                <ShieldCheck className="w-4 h-4 text-emerald-400 drop-shadow-[0_0_6px_rgba(16,185,129,0.7)] shrink-0" />
                <span className="text-[11px] font-extrabold tracking-wide font-sans uppercase">
                  IP Locked
                </span>
              </div>

              {/* Logout Option */}
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#161922] hover:bg-red-950/40 border border-white/10 hover:border-red-500/40 text-slate-300 hover:text-red-400 text-xs font-bold transition-all shadow-sm"
                title="Sign out of Creator Session"
              >
                <LogOut className="w-3.5 h-3.5 text-slate-400 group-hover:text-red-400" />
                <span className="hidden sm:inline font-sans">Logout</span>
              </button>
            </div>
          ) : (
            <>
              <Link
                href="/dashboard"
                className="text-sm font-medium text-slate-300 hover:text-white transition-colors px-3 py-2 hidden sm:flex items-center gap-1.5"
              >
                <User className="w-4 h-4 text-sky-400" />
                <span>Sign In</span>
              </Link>

              <Link
                href="/dashboard"
                className="items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold h-10 px-5 hidden md:flex btn-chq-primary shadow-sm text-white"
              >
                <span>Create Pass</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </>
          )}

          {/* MOBILE MENU TOGGLE */}
          <div className="lg:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="inline-flex items-center justify-center rounded-lg text-sm font-medium h-10 w-10 border border-white/10 bg-[#161922] text-slate-200 hover:text-white"
              aria-label="Open navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

      </div>

      {/* MOBILE MENU DRAWER */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-b border-white/10 bg-[#0b0d11] px-4 pt-2 pb-6 space-y-3">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-base font-medium text-slate-300 hover:text-sky-400 transition-colors"
            >
              {link.name}
            </Link>
          ))}
          <div className="pt-4 border-t border-white/10 flex flex-col gap-2">
            {savedCreator ? (
              <Link
                href="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3.5 p-3 rounded-2xl bg-gradient-to-r from-[#121622] to-[#171d2b] border border-white/15 text-white shadow-lg"
              >
                {savedCreator.avatarUrl ? (
                  <img
                    src={savedCreator.avatarUrl}
                    alt={savedCreator.displayName}
                    className="w-10 h-10 rounded-full object-cover border border-sky-400/40 shrink-0 ring-2 ring-black/80 shadow-md"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-sky-400 to-blue-600 text-white font-black flex items-center justify-center text-sm shrink-0 shadow-md ring-1 ring-sky-300/40">
                    {savedCreator.displayName?.substring(0, 1)?.toUpperCase() || 'C'}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-black truncate flex items-center gap-2 font-sans tracking-tight">
                    <span>{savedCreator.displayName}</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0 shadow-[0_0_8px_#10b981]" />
                  </div>
                  <div className="text-[11px] text-sky-400 font-extrabold tracking-wider font-sans uppercase">
                    {savedCreator.passportId} • <span className="text-emerald-400">IP Locked</span>
                  </div>
                </div>
              </Link>
            ) : (
              <Link
                href="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-center gap-2 w-full h-11 rounded-lg btn-chq-primary text-sm font-semibold"
              >
                <span>Create Pass</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
