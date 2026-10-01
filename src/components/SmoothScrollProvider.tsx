'use client';

import { useEffect, useRef } from 'react';
import Lenis from 'lenis';

/**
 * Global buttery-smooth inertial scroll provider using Lenis.
 * Renders nothing visible — just installs the scroll engine on mount
 * and tears it down on unmount.
 *
 * Also intercepts anchor-link clicks (href="#id") so they glide
 * smoothly instead of jumping, matching the inertial feel.
 */
export default function SmoothScrollProvider() {
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.4,                 // slightly slowed, premium glide
      easing: (t: number) =>         // ease-in-out-quart for natural momentum
        t < 0.5
          ? 8 * t * t * t * t
          : 1 - Math.pow(-2 * t + 2, 4) / 2,
      smoothWheel: true,             // intercept mouse-wheel events
      touchMultiplier: 1.5,          // mobile touch sensitivity
      infinite: false,
    });

    lenisRef.current = lenis;

    // --- RAF loop: Lenis must be ticked every frame ---
    let rafId: number;
    function raf(time: number) {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    }
    rafId = requestAnimationFrame(raf);

    // --- Intercept anchor clicks for smooth scroll-to ---
    function handleAnchorClick(e: MouseEvent) {
      const target = (e.target as HTMLElement).closest('a[href^="#"]');
      if (!target) return;

      const href = target.getAttribute('href');
      if (!href || href === '#') return;

      const el = document.querySelector(href);
      if (el) {
        e.preventDefault();
        lenis.scrollTo(el as HTMLElement, {
          offset: -80,  // account for fixed navbar
          duration: 1.6,
        });
      }
    }

    document.addEventListener('click', handleAnchorClick);

    return () => {
      cancelAnimationFrame(rafId);
      document.removeEventListener('click', handleAnchorClick);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, []);

  return null; // invisible behaviour-only component
}
