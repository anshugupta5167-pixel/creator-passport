'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, ArrowRight, LogOut } from 'lucide-react';
import CHQLogo from '@/components/CHQLogo';
import { subscribeToCreatorSync } from '@/lib/sync';
import { cacheAuthHint, clearCachedAuthHint, readCachedAuthHint } from '@/lib/clientAuth';

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<any | null>(null);
  const [creator, setCreator] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();

  useEffect(() => {
    let isMounted = true;

    const checkAuth = async () => {
      const cached = readCachedAuthHint();
      if (isMounted && cached) {
        setUser(cached.user);
        setCreator(cached.creator);
        setLoading(false);
      }
      try {
        const res = await fetch('/api/auth/me', { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          if (isMounted) {
            if (data.authenticated && data.user) {
              setUser(data.user);
              setCreator(data.creator || null);
              cacheAuthHint(data.user, data.creator);
            } else {
              setUser(null);
              setCreator(null);
              clearCachedAuthHint();
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
  }, [pathname]);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/signout', { method: 'POST' });
    } catch (e) {}
    clearCachedAuthHint();
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

  // Dedicated routes
  const navLinks = [
    { name: 'About', href: '/about' },
    { name: 'Services', href: '/services' },
    { name: 'Talents', href: '/talents' },
    { name: 'Compare', href: '/compare' },
    { name: 'FAQ', href: '/faq' },
    { name: 'Contact', href: '/contact' },
    { name: 'Founders', href: '/founders' },
  ];

  const displayName = creator?.displayName || user?.displayName || user?.username || 'Creator';
  const handle = creator?.slug || creator?.username || user?.username || 'creator';
  const avatarUrl = creator?.avatarUrl || user?.avatarUrl;

  return (
    <header className="fixed top-4 sm:top-5 inset-x-0 z-50 flex justify-center px-3 sm:px-6 pointer-events-none">
      <nav className="pointer-events-auto w-full max-w-6xl flex items-center justify-between px-5 sm:px-7 py-2.5 sm:py-3 rounded-full bg-[#080c16]/90 border border-white/10 backdrop-blur-2xl shadow-[0_12px_40px_rgba(0,0,0,0.6)]">
          
          {/* LEFT: BRAND LOGO */}
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2.5 group transition-transform active:scale-95">
              <CHQLogo size="sm" showText={false} />
              <span className="font-extrabold text-xl sm:text-2xl tracking-tight text-white font-sans flex items-center">
                Creator<span className="text-sky-400">HQ</span>
                <span className="ml-1.5 w-1.5 h-1.5 rounded-full bg-sky-400 shadow-[0_0_8px_#38bdf8]" />
              </span>
            </Link>
          </div>

          {/* CENTER: DESKTOP NAV LINKS (Toadster rounded pills) */}
          <div className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  className={`text-xs xl:text-sm font-medium px-3 py-1.5 rounded-full transition-all ${
                    isActive
                      ? 'text-white bg-white/10 font-semibold shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}
          </div>

          {/* RIGHT: AUTH / DASHBOARD CTAS */}
          <div className="flex items-center gap-2 sm:gap-3">
            {loading ? (
              <div className="w-28 h-9 rounded-full bg-white/5 border border-white/10 animate-pulse" aria-label="Checking sign-in status" />
            ) : user ? (
              <div className="flex items-center gap-2">
                {/* Creator Studio Profile Pill */}
                <Link
                  href="/dashboard"
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/10 hover:border-sky-400/50 hover:bg-white/[0.08] transition-all shadow-sm"
                  title={`Signed in as ${displayName} (@${handle})`}
                >
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt={displayName}
                      className="w-6 h-6 rounded-full object-cover border border-sky-400/40 ring-1 ring-black"
                    />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-sky-400 to-blue-600 text-white font-black flex items-center justify-center text-[10px]">
                      {displayName.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className="text-xs font-bold text-white tracking-tight truncate max-w-[100px] sm:max-w-[130px]">
                    {displayName}
                  </span>
                  {creator?.isVerified && (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#10b981]" />
                  )}
                </Link>

                {/* Studio CTA */}
                <Link
                  href="/dashboard"
                  className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-sky-500/10 border border-sky-500/30 text-sky-300 hover:bg-sky-500/20 transition-colors"
                >
                  <span>Studio</span>
                </Link>

                {/* Logout Button */}
                <button
                  onClick={handleLogout}
                  className="p-1.5 rounded-full text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/signin"
                  className="text-xs sm:text-sm font-semibold text-slate-300 hover:text-white transition-colors px-3 py-1.5 rounded-full hover:bg-white/5"
                >
                  Sign In
                </Link>

                <Link
                  href="/signup"
                  className="inline-flex items-center justify-center gap-1.5 text-xs sm:text-sm font-extrabold h-9 sm:h-10 px-5 rounded-full bg-gradient-to-r from-sky-400 via-sky-300 to-blue-500 hover:from-sky-300 hover:to-blue-400 text-slate-950 shadow-[0_0_24px_rgba(56,189,248,0.35)] active:scale-95 transition-all"
                >
                  <span>Start Creating</span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-950 stroke-[2.5]" />
                </Link>
              </div>
            )}

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

        </nav>

      {/* MOBILE DRAWER */}
      {mobileMenuOpen && (
        <div className="pointer-events-auto lg:hidden w-full max-w-7xl px-3 sm:px-6 pt-2">
          <div className="p-4 rounded-2xl bg-[#0b0e14]/95 border border-white/10 backdrop-blur-2xl shadow-2xl space-y-2">
            <div className="grid grid-cols-2 gap-1.5">
              {navLinks.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.name}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`text-sm font-medium px-3 py-2 rounded-xl transition-all ${
                      isActive
                        ? 'text-white bg-white/10 font-semibold'
                        : 'text-slate-300 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {link.name}
                  </Link>
                );
              })}
            </div>

            <div className="pt-3 border-t border-white/10 flex flex-col gap-2">
              {user ? (
                <>
                  <Link
                    href="/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-between p-3 rounded-xl bg-white/[0.04] border border-white/10 text-white font-semibold text-sm"
                  >
                    <div className="flex items-center gap-2.5">
                      {avatarUrl ? (
                        <img src={avatarUrl} alt="" className="w-7 h-7 rounded-full object-cover" />
                      ) : (
                        <div className="w-7 h-7 rounded-full bg-sky-500 text-slate-950 font-bold flex items-center justify-center text-xs">
                          {displayName.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <span>Creator Studio</span>
                    </div>
                    <ArrowRight className="w-4 h-4 text-sky-400" />
                  </Link>
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      handleLogout();
                    }}
                    className="w-full text-center text-xs text-red-400 py-2 hover:bg-red-500/10 rounded-lg transition-colors font-medium"
                  >
                    Log Out
                  </button>
                </>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <Link
                    href="/signin"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-center h-10 rounded-xl bg-white/[0.05] border border-white/10 text-sm font-semibold text-white hover:bg-white/10 transition-colors"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/signup"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-center h-10 rounded-xl bg-gradient-to-r from-sky-400 to-blue-600 text-slate-950 text-sm font-bold shadow-md"
                  >
                    Start Creating
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
