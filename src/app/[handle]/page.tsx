import React from 'react';
import { notFound } from 'next/navigation';
import CreatorProfileView from '@/components/CreatorProfileView';
import { getAllCreatorsDBAsync, getCreatorByIdDBAsync } from '@/lib/db';
import { CreatorProfile } from '@/lib/types';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface PageProps {
  params: Promise<{ handle: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { handle } = await params;
  const cleanHandle = decodeURIComponent(handle).replace(/^@/, '');
  let creator = await getCreatorByIdDBAsync(cleanHandle);
  if (!creator) {
    const all = await getAllCreatorsDBAsync();
    creator = all.find(
      (c: CreatorProfile) =>
        (c.slug && c.slug.toLowerCase() === cleanHandle.toLowerCase()) ||
        (c.passportId && c.passportId.toLowerCase() === cleanHandle.toLowerCase()) ||
        (c.username && c.username.toLowerCase() === cleanHandle.toLowerCase()) ||
        (c.handle && c.handle.toLowerCase().replace(/^@/, '') === cleanHandle.toLowerCase()) ||
        (c.id && c.id.toLowerCase() === cleanHandle.toLowerCase())
    ) || null;
  }

  if (!creator) {
    return {
      title: `${cleanHandle} - Creator Pass | CreatorHQ`,
      description: `Verified Creator Pass profile for @${cleanHandle} on the CreatorHQ Talent Network.`,
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
    'founders',
    'services',
    'talents',
    'faq',
    'brand-assets',
    'compare',
    'favicon.ico',
    'robots.txt',
    'sitemap.xml',
  ];
  if (reserved.includes(decoded.toLowerCase())) {
    notFound();
  }

  const cleanHandle = decoded.replace(/^@/, '');
  let creator = await getCreatorByIdDBAsync(cleanHandle);
  if (!creator) {
    const all = await getAllCreatorsDBAsync();
    creator = all.find(
      (c: CreatorProfile) =>
        (c.slug && c.slug.toLowerCase() === cleanHandle.toLowerCase()) ||
        (c.passportId && c.passportId.toLowerCase() === cleanHandle.toLowerCase()) ||
        (c.username && c.username.toLowerCase() === cleanHandle.toLowerCase()) ||
        (c.handle && c.handle.toLowerCase().replace(/^@/, '') === cleanHandle.toLowerCase()) ||
        (c.id && c.id.toLowerCase() === cleanHandle.toLowerCase())
    ) || null;
  }

  if (!creator) {
    notFound();
  }

  // Sanitize public creator profile to prevent exposing private system IDs or sensitive data
  const publicCreator: CreatorProfile = {
    ...creator,
    userId: undefined,
  };

  return <CreatorProfileView creator={publicCreator} targetId={cleanHandle} />;
}
