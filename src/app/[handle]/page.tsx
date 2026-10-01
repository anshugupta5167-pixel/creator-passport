import React from 'react';
import { notFound } from 'next/navigation';
import CreatorProfileView from '@/components/CreatorProfileView';
import { getCreatorByUsername, getCreatorByPassportId } from '@/lib/data';
import { getCreatorByIdDB, getCreatorByUsernameDB } from '@/lib/db';

interface PageProps {
  params: Promise<{ handle: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { handle } = await params;
  const cleanHandle = decodeURIComponent(handle).replace(/^@/, '');
  const creator =
    getCreatorByIdDB(cleanHandle) ||
    getCreatorByUsernameDB(cleanHandle) ||
    getCreatorByUsername(cleanHandle) ||
    getCreatorByPassportId(cleanHandle);

  if (!creator) {
    return {
      title: 'Creator Not Found - CreatorHQ',
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
  const reserved = ['creators', 'brands', 'dashboard', 'admin', 'api-docs', 'api'];
  if (reserved.includes(decoded.toLowerCase())) {
    notFound();
  }

  const cleanHandle = decoded.replace(/^@/, '');
  const creator =
    getCreatorByIdDB(cleanHandle) ||
    getCreatorByUsernameDB(cleanHandle) ||
    getCreatorByUsername(cleanHandle) ||
    getCreatorByPassportId(cleanHandle);

  if (!creator) {
    notFound();
  }

  return <CreatorProfileView creator={creator} targetId={cleanHandle} />;
}
