import type { Metadata } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';

const fontSans = Plus_Jakarta_Sans({
  variable: '--font-sans',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://creatorhq.fun'),
  title: {
    default: 'CreatorHQ — Sovereign Digital Passports & Verified Creator Identities',
    template: 'CreatorHQ - %s',
  },
  description:
    'CreatorHQ connects authentic YouTube creators and Discord server founders with verified digital credentials, proof auditing, and direct brand partnerships. No middlemen, no fake metrics.',
  keywords: [
    'CreatorHQ',
    'Creator Passport',
    'Verified Creator ID',
    'YouTube Creator Verification',
    'Discord Server Owner Proof',
    'Creator Media Kit',
    'Sovereign Creator Identity',
    'Brand Sponsorships Directory',
    'Creator Network',
  ],
  authors: [{ name: 'CreatorHQ Network', url: 'https://creatorhq.fun' }],
  creator: 'CreatorHQ',
  publisher: 'CreatorHQ',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  icons: {
    icon: [{ url: '/icon.svg', type: 'image/svg+xml' }],
    shortcut: '/icon.svg',
    apple: '/icon.svg',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://creatorhq.fun',
    siteName: 'CreatorHQ',
    title: 'CreatorHQ — Sovereign Digital Passports & Verified Creator Identities',
    description:
      'The verifiable digital passport for YouTube creators and Discord community founders. Audited metrics, fraud-proof credentials, and direct brand connections.',
    images: [
      {
        url: '/og-banner.png',
        width: 1200,
        height: 630,
        alt: 'CreatorHQ — Sovereign Digital Passports & Verified Creator Identities',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CreatorHQ — Sovereign Digital Passports & Verified Creator Identities',
    description:
      'The verifiable digital passport for YouTube creators and Discord community founders.',
    images: ['/og-banner.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: 'https://creatorhq.fun',
  },
  verification: {
    google: 'googleb0101f307ca8d45d',
  },
};

const jsonLdData = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebSite',
      '@id': 'https://creatorhq.fun/#website',
      url: 'https://creatorhq.fun',
      name: 'CreatorHQ',
      description: 'Sovereign Digital Passports & Verified Creator Identities for YouTube Creators & Discord Founders.',
      potentialAction: {
        '@type': 'SearchAction',
        target: 'https://creatorhq.fun/creators?q={search_term_string}',
        'query-input': 'required name=search_term_string',
      },
    },
    {
      '@type': 'Organization',
      '@id': 'https://creatorhq.fun/#organization',
      name: 'CreatorHQ',
      url: 'https://creatorhq.fun',
      logo: 'https://creatorhq.fun/icon.svg',
      sameAs: [
        'https://youtube.com',
        'https://discord.gg',
      ],
      description:
        'CreatorHQ is the sovereign identity infrastructure and private talent network connecting verified YouTube and Discord creators with direct brand sponsorships.',
    },
    {
      '@type': 'FAQPage',
      '@id': 'https://creatorhq.fun/#faq',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'What is CreatorHQ?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'CreatorHQ is the sovereign creator passport and private talent network. It provides independent YouTube creators and Discord server founders with tamper-proof, staff-audited digital credentials and media kits.',
          },
        },
        {
          '@type': 'Question',
          name: 'How is CreatorHQ different from Linktree or Beacons?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Unlike simple link aggregators, CreatorHQ is a verified identity infrastructure. Every credential is cryptographic, backed by OAuth2 and human staff audits, and includes verifiable audience metrics for premium brand sponsorships.',
          },
        },
        {
          '@type': 'Question',
          name: 'Which platforms does CreatorHQ verify?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'CreatorHQ specializes exclusively in YouTube channel metrics (subscribers, video reach) and Discord server ownership (member count, active roles).',
          },
        },
        {
          '@type': 'Question',
          name: 'Is CreatorHQ free for creators?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Yes, creating and claiming your sovereign Creator Pass on CreatorHQ is 100% free for independent creators. There are no monthly fees or middleman cuts on your brand sponsorships.',
          },
        },
      ],
    },
  ],
};

import PageTransition from '@/components/PageTransition';
import SmoothScrollProvider from '@/components/SmoothScrollProvider';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${fontSans.variable} dark`}
    >
      <head>
        <meta name="referrer" content="no-referrer" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdData) }}
        />
      </head>
      <body className="min-h-screen bg-[#0b0d11] text-[#f1f5f9] flex flex-col font-sans overflow-x-hidden selection:bg-sky-500/30 selection:text-white">
        <SmoothScrollProvider />
        <PageTransition>{children}</PageTransition>
      </body>
    </html>
  );
}
