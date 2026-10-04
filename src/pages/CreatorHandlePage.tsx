import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import CreatorProfileView from '@/components/CreatorProfileView';
import { ApiStore } from '@/lib/apiStore';
import { CreatorProfile } from '@/lib/types';
import { notFound } from '@/compat/next';

export default function CreatorHandlePage() {
  const params = useParams<{ handle?: string; id?: string }>();
  const rawTarget = params.handle || params.id || '';
  const cleanTarget = decodeURIComponent(rawTarget).replace(/^@/, '').toLowerCase().trim();

  const [creator, setCreator] = useState<CreatorProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const creators = ApiStore.getCreators();
    const found = creators.find(
      (c: CreatorProfile) =>
        (c.slug && c.slug.toLowerCase() === cleanTarget) ||
        (c.passportId && c.passportId.toLowerCase() === cleanTarget) ||
        (c.username && c.username.toLowerCase() === cleanTarget) ||
        (c.handle && c.handle.toLowerCase().replace(/^@/, '') === cleanTarget) ||
        (c.id && c.id.toLowerCase() === cleanTarget)
    );

    setCreator(found || null);
    setLoading(false);
  }, [cleanTarget]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#07090e] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-sky-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!creator) {
    return notFound();
  }

  const publicCreator: CreatorProfile = {
    ...creator,
    userId: undefined,
  };

  return <CreatorProfileView creator={publicCreator} targetId={cleanTarget} />;
}
