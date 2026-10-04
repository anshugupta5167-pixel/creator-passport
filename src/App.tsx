import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import LandingPage from '@/pages/LandingPage';
import AboutPage from '@/app/about/page';
import FoundersPage from '@/app/founders/page';
import ServicesPage from '@/app/services/page';
import FaqPage from '@/app/faq/page';
import ContactPage from '@/app/contact/page';
import BrandAssetsPage from '@/app/brand-assets/page';
import ComparePage from '@/app/compare/page';
import CompareDetailPage from '@/pages/CompareDetailPage';
import ApiDocsPage from '@/app/api-docs/page';
import CreatorsDirectoryPage from '@/app/creators/page';
import DashboardPage from '@/app/dashboard/page';
import AdminPage from '@/app/admin/page';
import SignInPage from '@/app/signin/page';
import SignUpPage from '@/app/signup/page';
import CreatorHandlePage from '@/pages/CreatorHandlePage';
import SmoothScroll from '@/components/SmoothScroll';
import PageTransition from '@/components/PageTransition';

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <PageTransition>
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/founders" element={<FoundersPage />} />
        <Route path="/services" element={<ServicesPage />} />
        <Route path="/faq" element={<FaqPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/brand-assets" element={<BrandAssetsPage />} />
        <Route path="/compare" element={<ComparePage />} />
        <Route path="/compare/:slug" element={<CompareDetailPage />} />
        <Route path="/api-docs" element={<ApiDocsPage />} />
        <Route path="/creators" element={<CreatorsDirectoryPage />} />
        <Route path="/talents" element={<CreatorsDirectoryPage />} />
        <Route path="/brands" element={<Navigate to="/talents" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/signin" element={<SignInPage />} />
        <Route path="/signup" element={<SignUpPage />} />
        
        {/* Creator profile routes */}
        <Route path="/creator/:id" element={<CreatorHandlePage />} />
        <Route path="/:handle" element={<CreatorHandlePage />} />
        <Route path="/:handle/:id" element={<CreatorHandlePage />} />
      </Routes>
    </PageTransition>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <SmoothScroll />
      <AnimatedRoutes />
    </BrowserRouter>
  );
}
