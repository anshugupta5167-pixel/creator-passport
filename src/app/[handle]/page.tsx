import React from 'react';
import { notFound } from 'next/navigation';
import CreatorProfileView from '@/components/CreatorProfileView';
import { getCreatorByUsername, getCreatorByPassportId } from '@/lib/data';
import { getAllCreatorsDB, getCreatorByIdDB, getCreatorByUsernameDB } from '@/lib/db';
import { CreatorProfile } from '@/lib/types';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface PageProps {
  params: Promise<{ handle: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { handle } = await params;
  const cleanHandle = decodeURIComponent(handle).replace(/^@/, '');
  const all = getAllCreatorsDB();
  const creator =
    getCreatorByIdDB(cleanHandle) ||
    getCreatorByUsernameDB(cleanHandle) ||
    all.find(
      (c: CreatorProfile) =>
        (c.slug && c.slug.toLowerCase() === cleanHandle.toLowerCase()) ||
        (c.passportId && c.passportId.toLowerCase() === cleanHandle.toLowerCase()) ||
        (c.username && c.username.toLowerCase() === cleanHandle.toLowerCase()) ||
        (c.handle && c.handle.toLowerCase().replace(/^@/, '') === cleanHandle.toLowerCase()) ||
        (c.id && c.id.toLowerCase() === cleanHandle.toLowerCase())
    ) ||
    getCreatorByUsername(cleanHandle) ||
    getCreatorByPassportId(cleanHandle) ||
    all[0];

  if (!creator) {
    return {
      title: 'Creator Pass - CreatorHQ',
    };
  }

  return {
    title: `${creator.displayName} (@${creator.slug || creator.username}) - CreatorHQ`,
    description: `Verified Creator Pass profile for ${creator.displayName}. ${creator.category || 'Creator'}.`,
  };
}

export default async function HandlePage({ params }: PageProps) {
  const { handle } = await params;
  const decoded = decodeURIComponent(handle);

  // Reserved paths shouldn't be handled here
  const reserved = [
    'creators',
    'brands',
    'dashboard',
    'admin',
    'api-docs',
    'api',
    'contact',
    'terms',
    'privacy',
    'verification',
    'favicon.ico',
    'robots.txt',
    'sitemap.xml',
  ];
  if (reserved.includes(decoded.toLowerCase())) {
    notFound();
  }

  const cleanHandle = decoded.replace(/^@/, '');
  const all = getAllCreatorsDB();
  const creator =
    getCreatorByIdDB(cleanHandle) ||
    getCreatorByUsernameDB(cleanHandle) ||
    all.find(
      (c: CreatorProfile) =>
        (c.slug && c.slug.toLowerCase() === cleanHandle.toLowerCase()) ||
        (c.passportId && c.passportId.toLowerCase() === cleanHandle.toLowerCase()) ||
        (c.username && c.username.toLowerCase() === cleanHandle.toLowerCase()) ||
        (c.handle && c.handle.toLowerCase().replace(/^@/, '') === cleanHandle.toLowerCase()) ||
        (c.id && c.id.toLowerCase() === cleanHandle.toLowerCase())
    ) ||
    getCreatorByUsername(cleanHandle) ||
    getCreatorByPassportId(cleanHandle) ||
    all[0];

  if (!creator) {
    notFound();
  }

  return <CreatorProfileView creator={creator} targetId={cleanHandle} />;
}
