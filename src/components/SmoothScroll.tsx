import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Lenis from 'lenis';

export default function SmoothScroll() {
  const location = useLocation();

  useEffect(() => {
    // Initialize Lenis smooth scroll
    const lenis = new Lenis({
      duration: 1.1,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 1.5,
    });

    (window as any).__lenis = lenis;

    let animationFrameId: number;

    function raf(time: number) {
      lenis.raf(time);
      animationFrameId = requestAnimationFrame(raf);
    }

    animationFrameId = requestAnimationFrame(raf);

    // Global listener for smooth anchor navigation (#faq, #about, #services, etc.)
    const handleAnchorClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      const anchor = target?.closest('a');
      if (anchor && anchor.getAttribute('href')?.startsWith('#')) {
        const hash = anchor.getAttribute('href');
        if (hash && hash !== '#') {
          const el = document.querySelector(hash);
          if (el) {
            e.preventDefault();
            lenis.scrollTo(el as HTMLElement, { offset: -70, duration: 1.2 });
          }
        }
      }
    };

    document.addEventListener('click', handleAnchorClick);

    return () => {
      document.removeEventListener('click', handleAnchorClick);
      cancelAnimationFrame(animationFrameId);
      lenis.destroy();
      delete (window as any).__lenis;
    };
  }, []);

  // Smooth scroll to top on page route changes
  useEffect(() => {
    if ((window as any).__lenis) {
      (window as any).__lenis.scrollTo(0, { immediate: false, duration: 0.5 });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [location.pathname]);

  return null;
}
