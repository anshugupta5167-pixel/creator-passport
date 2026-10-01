import React from 'react';
import { getCreatorByIdDB, getCreatorByUsernameDB } from '@/lib/db';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';
export const dynamicParams = true;

interface PageProps {
  params: Promise<{ handle: string; id: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { handle, id } = await params;
  const decodedHandle = decodeURIComponent(handle).replace(/^@/, '');
  const decodedId = decodeURIComponent(id);

  const creator =
    getCreatorByIdDB(decodedId) ||
    getCreatorByUsernameDB(decodedHandle) ||
    getCreatorByIdDB(decodedHandle) ||
    getCreatorByUsernameDB(decodedId);

  if (!creator) {
    return {
      title: `Creator Profile • CreatorHQ`,
      description: 'Verified creator digital identity pass and public media kit on CreatorHQ.',
    };
  }

  const ytMetric = creator.connections.youtube?.metricValue
    ? ` • YouTube: ${creator.connections.youtube.metricValue}`
    : '';

  return {
    title: `${creator.displayName} (@${creator.slug || creator.username})${ytMetric} • CreatorHQ`,
    description: `Official verified Creator Pass for ${creator.displayName} (@${creator.slug || creator.username}). Category: ${creator.category}. Verified on CreatorHQ.`,
    openGraph: {
      title: `${creator.displayName} (@${creator.slug || creator.username})`,
      description: `Official verified Creator Pass for ${creator.displayName}. ${creator.category}.`,
      images: [creator.avatarUrl],
    },
  };
}

export default async function HandleWithIdPage({ params }: PageProps) {
  const { handle, id } = await params;
  const decodedHandle = decodeURIComponent(handle).replace(/^@/, '');
  const decodedId = decodeURIComponent(id);

  const creator =
    getCreatorByIdDB(decodedId) ||
    getCreatorByUsernameDB(decodedHandle) ||
    getCreatorByIdDB(decodedHandle) ||
    getCreatorByUsernameDB(decodedId);

  const targetSlug = creator ? (creator.slug || creator.username) : decodedHandle;
  redirect(`/${targetSlug}`);
}
