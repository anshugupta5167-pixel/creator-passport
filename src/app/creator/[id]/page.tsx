import React from 'react';
import CreatorProfileView from '@/components/CreatorProfileView';
import { getCreatorByIdDB, getCreatorByUsernameDB, getAllCreatorsDB } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const dynamicParams = true;

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  const creator = getCreatorByIdDB(id) || getCreatorByUsernameDB(id);

  if (!creator) {
    return {
      title: `Creator Pass (${id}) • CreatorHQ`,
      description: 'Verified creator digital identity pass and public media kit on CreatorHQ.',
    };
  }

  const ytChannel = creator.connections.youtube?.username || creator.displayName;
  const ytMetric = creator.connections.youtube?.metricValue ? ` (${creator.connections.youtube.metricValue} Subscribers)` : '';

  return {
    title: `${creator.displayName} | YouTube: ${ytChannel}${ytMetric} • CreatorHQ`,
    description: `Official verified Creator Pass for ${creator.displayName} (@${creator.username}). Authenticated YouTube channel: ${ytChannel}${ytMetric}. Verified on CreatorHQ Sovereign Talent Network.`,
    openGraph: {
      title: `${creator.displayName} | YouTube: ${ytChannel}${ytMetric}`,
      description: `Official verified Creator Pass for ${creator.displayName}. YouTube: ${ytChannel}${ytMetric}.`,
      images: [creator.avatarUrl],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${creator.displayName} | YouTube: ${ytChannel}${ytMetric}`,
      description: `Official verified Creator Pass for ${creator.displayName}. YouTube: ${ytChannel}${ytMetric}.`,
      images: [creator.avatarUrl],
    }
  };
}

export default async function CreatorPage({ params }: PageProps) {
  const { id } = await params;
  const creator = getCreatorByIdDB(id) || getCreatorByUsernameDB(id);

  return <CreatorProfileView creator={creator} targetId={id} />;
}
