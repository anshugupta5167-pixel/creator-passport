import React from 'react';
import { useLocation } from 'react-router-dom';

export default function PageTransition({ children }: { children: React.ReactNode }) {
  const location = useLocation();

  return (
    <div key={location.pathname} className="page-transition-wrapper flex-1 flex flex-col min-h-screen">
      {children}
    </div>
  );
}
