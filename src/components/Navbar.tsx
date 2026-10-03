'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, ArrowRight, User as UserIcon, ShieldCheck, LogOut } from 'lucide-react';
import CHQLogo from '@/components/CHQLogo';
import { subscribeToCreatorSync } from '@/lib/sync';

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<any | null>(null);
  const [creator, setCreator] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();

  useEffect(() => {
    let isMounted = true;

    const checkAuth = async () => {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          if (isMounted) {
            if (data.authenticated && data.user) {
              setUser(data.user);
              setCreator(data.creator || null);
            } else {
              setUser(null);
              setCreator(null);
            }
          }
        }
      } catch (e) {
        if (isMounted) {
          setUser(null);
          setCreator(null);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    checkAuth();

    const unsubscribeSync = subscribeToCreatorSync((update) => {
      setCreator((current: any) => {
        if (!current) return current;
        const currentSlug = (current.slug || current.username || '').toLowerCase();
        const targetSlug = (update.creatorSlug || '').toLowerCase();

        if (currentSlug && targetSlug && currentSlug === targetSlug) {
          const isV = update.verificationStatus === 'VERIFIED';
          return {
            ...current,
            isVerified: isV,
            verification_status: update.verificationStatus,
          };
        }
        return current;
      });
    });

    return () => {
      isMounted = false;
      unsubscribeSync();
    };
  }, []);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/signout', { method: 'POST' });
    } catch (e) {}
    setUser(null);
    setCreator(null);
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('creatorhq_user_card');
        localStorage.removeItem('creatorhq_last_username');
      } catch (e) {}
      window.location.href = '/';
    }
  };

  const navLinks = [
    { name: 'Talents', href: '/talents' },
    { name: 'Brands', href: '/brands' },
    { name: 'Compare', href: '/compare' },
    { name: 'About', href: '/#about' },
    { name: 'FAQ', href: '/#faq' },
  ];

  const displayName = creator?.displayName || user?.displayName || user?.username || 'Creator';
  const handle = creator?.slug || creator?.username || user?.username || 'creator';
  const avatarUrl = creator?.avatarUrl || user?.avatarUrl;

  return (
    <header className="fixed top-0 inset-x-0 z-50 bg-[#0b0d11]/85 backdrop-blur-md border-b border-white/10 transition-colors">
      <div className="container mx-auto px-4 md:px-6 h-16 sm:h-20 flex items-center justify-between gap-4">
        
        {/* LOGO & BRAND */}
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2 group transition-transform active:scale-95">
            <CHQLogo className="w-8 h-8 sm:w-9 sm:h-9" />
            <span className="font-extrabold text-xl sm:text-2xl tracking-tighter text-white font-sans flex items-center">
              CREATOR<span className="text-sky-400">HQ</span>
            </span>
          </Link>

          {/* DESKTOP NAV */}
          <nav className="hidden lg:flex items-center gap-6">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  className={`text-sm font-medium transition-colors hover:text-white ${
                    isActive ? 'text-white font-semibold' : 'text-slate-300'
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* RIGHT CONTROLS / AUTH */}
        <div className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Creator Identity Button */}
              <Link
                href="/dashboard"
                className="group flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-[#121622] via-[#161b2a] to-[#141824] border border-white/15 hover:border-sky-400/60 transition-all shadow-[0_2px_14px_rgba(0,0,0,0.5)] hover:shadow-sky-500/20"
                title={`Signed in as ${displayName} (@${handle})`}
              >
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={displayName}
                    className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover border border-sky-400/40 shrink-0 ring-2 ring-black/80 shadow-md"
                  />
                ) : (
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-sky-400 via-sky-500 to-blue-600 text-white font-black flex items-center justify-center text-xs shrink-0 shadow-md ring-1 ring-sky-300/50">
                    {displayName.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="flex flex-col text-left leading-tight min-w-0 pr-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-white group-hover:text-sky-300 transition-colors tracking-tight truncate max-w-[120px] font-sans">
                      {displayName}
                    </span>
                    {creator?.isVerified && (
                      <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0 shadow-[0_0_8px_#10b981]" />
                    )}
                  </div>
                  <span className="text-[10px] font-semibold text-sky-400 font-sans tracking-tight">
                    @{handle}
                  </span>
                </div>
              </Link>

              {/* Verified Badge if verified */}
              {creator?.isVerified && (
                <div
                  className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-950/60 border border-emerald-500/40 text-emerald-400 text-xs font-semibold select-none backdrop-blur-md"
                  title="Official CreatorHQ Verified Profile"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-[10px] uppercase font-bold tracking-wide">Verified</span>
                </div>
              )}

              {/* Logout Option */}
              <button
                onClick={handleLogout}
                className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-[#161922] hover:bg-red-950/40 border border-white/10 hover:border-red-500/40 text-slate-300 hover:text-red-400 text-xs font-semibold transition-all shadow-sm"
                title="Sign out of your account"
              >
                <LogOut className="w-3.5 h-3.5 text-slate-400 group-hover:text-red-400" />
                <span className="hidden sm:inline font-sans">Sign Out</span>
              </button>
            </div>
          ) : (
            <>
              <Link
                href="/dashboard"
                className="text-sm font-semibold text-slate-300 hover:text-white transition-colors px-3 py-2 hidden sm:flex items-center gap-1.5"
              >
                <UserIcon className="w-4 h-4 text-sky-400" />
                <span>Sign In</span>
              </Link>

              <Link
                href="/dashboard"
                className="items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold h-10 px-5 hidden md:flex btn-chq-primary shadow-sm text-white"
              >
                <span>Start Creating</span>
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
            {user ? (
              <div className="space-y-2">
                <Link
                  href="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3.5 p-3 rounded-2xl bg-gradient-to-r from-[#121622] to-[#171d2b] border border-white/15 text-white shadow-lg"
                >
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt={displayName}
                      className="w-10 h-10 rounded-full object-cover border border-sky-400/40 shrink-0 ring-2 ring-black/80 shadow-md"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-sky-400 to-blue-600 text-white font-black flex items-center justify-center text-sm shrink-0 shadow-md ring-1 ring-sky-300/40">
                      {displayName.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold truncate flex items-center gap-2 font-sans tracking-tight">
                      <span>{displayName}</span>
                      {creator?.isVerified && (
                        <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0 shadow-[0_0_8px_#10b981]" />
                      )}
                    </div>
                    <div className="text-xs text-sky-400 font-semibold font-mono">
                      @{handle}
                    </div>
                  </div>
                </Link>

                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleLogout();
                  }}
                  className="w-full py-2.5 rounded-lg bg-red-950/40 hover:bg-red-900/60 border border-red-500/30 text-red-300 text-xs font-semibold flex items-center justify-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            ) : (
              <Link
                href="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-center gap-2 w-full h-11 rounded-lg btn-chq-primary text-sm font-semibold"
              >
                <span>Start Creating</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
