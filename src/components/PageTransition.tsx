'use client';

import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

const routeTitles: Record<string, string> = {
  '/': 'Sovereign Creator ID Platform',
  '/about': 'About',
  '/services': 'Services',
  '/talents': 'Verified Talents',
  '/creators': 'Verified Talents',
  '/dashboard': 'Creator Studio',
  '/faq': 'FAQ',
  '/contact': 'Contact',
  '/brands': 'Brands',
};

export default function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isNavigating, setIsNavigating] = useState(false);

  useEffect(() => {
    // 1. Dynamic Document Title: CreatorHQ - Page name
    const pageTitle = routeTitles[pathname] || (pathname.startsWith('/creator/') ? 'Verified Creator Pass' : '');
    if (pageTitle) {
      document.title = `CreatorHQ - ${pageTitle}`;
    } else {
      document.title = 'CreatorHQ - Sovereign Creator ID Platform';
    }

    // 2. Trigger sleek top laser pulse & entrance animation
    setIsNavigating(true);
    const timer = setTimeout(() => {
      setIsNavigating(false);
    }, 450);

    return () => clearTimeout(timer);
  }, [pathname]);

  return (
    <>
      {/* Top Laser Progress Bar Animation during page transition */}
      <div
        className={`fixed top-0 left-0 right-0 h-[2.5px] bg-gradient-to-r from-sky-500 via-sky-400 to-cyan-300 z-[9999] pointer-events-none transition-all duration-500 ${
          isNavigating ? 'opacity-100 scale-x-100' : 'opacity-0 scale-x-0'
        } origin-left`}
      />

      {/* Page Content with smooth fade and subtle lift entrance animation */}
      <div key={pathname} className="animate-page-enter flex-1 flex flex-col w-full">
        {children}
      </div>
    </>
  );
}
