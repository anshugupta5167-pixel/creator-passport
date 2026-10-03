import React from 'react';
import CreatorProfileView from '@/components/CreatorProfileView';
import { getCreatorByIdDB, getCreatorByUsernameDB, getAllCreatorsDB } from '@/lib/db';
import { CreatorProfile } from '@/lib/types';

export const dynamic = 'force-dynamic';
export const dynamicParams = true;

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  const decoded = decodeURIComponent(id || '').trim();
  const cleanId = decoded.replace(/^@/, '');
  const all = getAllCreatorsDB();
  const creator =
    getCreatorByIdDB(cleanId) ||
    getCreatorByIdDB(decoded) ||
    getCreatorByUsernameDB(cleanId) ||
    all.find(
      (c: CreatorProfile) =>
        (c.slug && c.slug.toLowerCase() === cleanId.toLowerCase()) ||
        (c.passportId && c.passportId.toLowerCase() === cleanId.toLowerCase()) ||
        (c.username && c.username.toLowerCase() === cleanId.toLowerCase()) ||
        (c.handle && c.handle.toLowerCase().replace(/^@/, '') === cleanId.toLowerCase()) ||
        (c.id && c.id.toLowerCase() === cleanId.toLowerCase())
    );

  if (!creator) {
    return {
      title: `Creator Pass • CreatorHQ`,
      description: 'Verified creator digital identity pass and public media kit on CreatorHQ.',
    };
  }

  const ytChannel = creator.connections?.youtube?.username || creator.displayName;
  const ytMetric = creator.connections?.youtube?.metricValue ? ` (${creator.connections?.youtube?.metricValue} Subscribers)` : '';

  return {
    title: `${creator.displayName} | YouTube: ${ytChannel}${ytMetric} • CreatorHQ`,
    description: `Official verified Creator Pass for ${creator.displayName} (@${creator.username}). Authenticated YouTube channel: ${ytChannel}${ytMetric}. Verified on CreatorHQ Sovereign Talent Network.`,
    openGraph: {
      title: `${creator.displayName} | YouTube: ${ytChannel}${ytMetric}`,
      description: `Official verified Creator Pass for ${creator.displayName}. YouTube: ${ytChannel}${ytMetric}.`,
      images: [creator.avatarUrl],
    },
  };
}

export default async function CreatorPage({ params }: PageProps) {
  const { id } = await params;
  const decoded = decodeURIComponent(id || '').trim();
  const cleanId = decoded.replace(/^@/, '');
  const all = getAllCreatorsDB();
  const creator =
    getCreatorByIdDB(cleanId) ||
    getCreatorByIdDB(decoded) ||
    getCreatorByUsernameDB(cleanId) ||
    all.find(
      (c: CreatorProfile) =>
        (c.slug && c.slug.toLowerCase() === cleanId.toLowerCase()) ||
        (c.passportId && c.passportId.toLowerCase() === cleanId.toLowerCase()) ||
        (c.username && c.username.toLowerCase() === cleanId.toLowerCase()) ||
        (c.handle && c.handle.toLowerCase().replace(/^@/, '') === cleanId.toLowerCase()) ||
        (c.id && c.id.toLowerCase() === cleanId.toLowerCase())
    );

  return <CreatorProfileView creator={creator || null} targetId={cleanId} />;
}
