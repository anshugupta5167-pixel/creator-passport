export interface ComparisonDetail {
  id: string;
  slug: string;
  name: string;
  pillLabel: string;
  title: string;
  metaDescription: string;
  headline: string;
  description: string;
  creatorHqFeature: string;
  competitorFeature: string;
  costComparison: string;
  features: {
    feature: string;
    creatorHq: string;
    competitor: string;
  }[];
}

export const COMPARISONS: ComparisonDetail[] = [
  {
    id: 'linktree',
    slug: 'linktree',
    name: 'Linktree',
    pillLabel: 'CreatorHQ vs Linktree',
    title: 'CreatorHQ vs Linktree (2026 Comparison) • Verified Creator Passport',
    metaDescription:
      'Compare CreatorHQ with Linktree. See why verified YouTube & Discord creators switch from basic link lists to sovereign cryptographic Creator Passports.',
    headline: 'Which is better, CreatorHQ or Linktree?',
    description:
      'Linktree is a simple bio-link aggregator with unverified links. CreatorHQ is a verified identity infrastructure and digital media kit with staff-audited YouTube reach and Discord server ownership proofs.',
    creatorHqFeature: 'Cryptographic digital passport with staff-verified channel reach & 0% fee brand connections.',
    competitorFeature: 'Generic link buttons, self-reported bio text, and monthly paywalls ($10–$24/mo) for custom domains.',
    costComparison: 'CreatorHQ is 100% free with sovereign verified credentials; Linktree charges for pro features.',
    features: [
      { feature: 'Identity Verification', creatorHq: 'Staff Audited & Cryptographic Proof', competitor: 'Unverified / Anyone can type links' },
      { feature: 'Channel Reach Proof', creatorHq: 'Direct YouTube & Discord Metrics', competitor: 'Self-reported text' },
      { feature: 'Custom Domain & Media Kit', creatorHq: 'Free Canonical URL (creatorhq.fun)', competitor: 'Paid Add-on ($10 - $24/mo)' },
      { feature: 'Brand Sponsorship Routing', creatorHq: 'Direct Sponsor Proposals (0% cut)', competitor: 'Basic contact button' },
      { feature: 'Virtual 3D Interactive Card', creatorHq: 'Physics 3D Card with Tilt & Flip', competitor: 'Flat list of buttons' },
    ],
  },
  {
    id: 'beacons',
    slug: 'beacons',
    name: 'Beacons.ai',
    pillLabel: 'CreatorHQ vs Beacons',
    title: 'CreatorHQ vs Beacons.ai (2026 Comparison) • Verified Media Kit',
    metaDescription:
      'Compare CreatorHQ vs Beacons.ai for YouTube creators. Transparent comparison of proof auditing, sponsor trust, and zero transaction fees.',
    headline: 'How does CreatorHQ compare to Beacons.ai?',
    description:
      'Beacons offers all-in-one creator link trees with built-in storefronts. CreatorHQ specializes exclusively in sovereign verified credentials, proof auditing, and fraud-proof metrics that premium brand sponsors demand.',
    creatorHqFeature: 'Manual staff audit and tamper-proof verification badges that brands trust for $10k+ sponsorships.',
    competitorFeature: 'Automated widgets that anyone can fabricate or modify without verification audits.',
    costComparison: 'CreatorHQ is 100% free for verified creators with zero revenue cuts; Beacons takes up to 9% transaction cuts.',
    features: [
      { feature: 'Proof Verification', creatorHq: 'Manual Staff Audit & Proof Screenshot Review', competitor: 'Automated / Unaudited' },
      { feature: 'Sponsor Trust', creatorHq: 'Built for High-Ticket Brand Deals', competitor: 'General audience store' },
      { feature: 'Commission Fee', creatorHq: '0% Platform Fee', competitor: 'Up to 9% on transactions' },
      { feature: 'Discord Integration', creatorHq: 'Server Membership & Bot Verification', competitor: 'Basic social link' },
    ],
  },
  {
    id: 'bento',
    slug: 'bento',
    name: 'Bento.me',
    pillLabel: 'CreatorHQ vs Bento',
    title: 'CreatorHQ vs Bento.me (2026 Comparison) • Creator Identity Network',
    metaDescription:
      'Discover differences between CreatorHQ and Bento.me. Why video creators and community leaders use sovereign digital passports.',
    headline: 'Which is superior for creators, CreatorHQ or Bento?',
    description:
      'Bento provides visual portfolio grids for design freelancers. CreatorHQ provides official credentials specifically designed for YouTube creators and Discord server founders seeking brand partnerships.',
    creatorHqFeature: 'Dynamic virtual card engine, card freeze mode, and verified platform metrics.',
    competitorFeature: 'Static portfolio cards without verification checkmarks or sponsor inquiry routing.',
    costComparison: 'Both offer free tiers; CreatorHQ includes enterprise-grade verified trust badges.',
    features: [
      { feature: 'Primary Focus', creatorHq: 'YouTube Creators & Discord Founders', competitor: 'Designers & Tech Freelancers' },
      { feature: 'Audience Metrics', creatorHq: 'Verified Subscriber & Community Counts', competitor: 'Unverified embeds' },
      { feature: 'Security Controls', creatorHq: 'Instant Freeze / Status Controls', competitor: 'None' },
      { feature: 'Sponsor Inquiries', creatorHq: 'Direct In-App Proposal Routing', competitor: 'None' },
    ],
  },
  {
    id: 'discord-roles',
    slug: 'discord-roles',
    name: 'Discord Roles',
    pillLabel: 'CreatorHQ vs Discord Roles',
    title: 'CreatorHQ vs Discord Roles • Bridging Community Ownership to Web',
    metaDescription:
      'Compare CreatorHQ vs native Discord Roles. Learn how CreatorHQ turns internal server ownership into a global verified web credential.',
    headline: 'Can Discord roles replace a CreatorHQ Passport?',
    description:
      'Discord roles only exist inside a single guild and cannot be shown to external sponsors. CreatorHQ bridges your Discord community ownership into a public, verified credential accessible worldwide.',
    creatorHqFeature: 'Global canonical URL (creatorhq.fun/creator/your-id) verifiable anywhere on the web.',
    competitorFeature: 'Confined to individual servers with no external brand proof or verifiable media kit.',
    costComparison: 'CreatorHQ is free and public; Discord Server Subscriptions take a 10% platform fee.',
    features: [
      { feature: 'Web Visibility', creatorHq: 'Public Globally Verifiable Profile', competitor: 'Only visible inside that Discord server' },
      { feature: 'Sponsor Reach', creatorHq: 'Accessible by Brands without Discord Account', competitor: 'Requires joining guild & role inspection' },
      { feature: 'Multi-Platform', creatorHq: 'Pairs Discord with YouTube Channel', competitor: 'Discord only' },
      { feature: 'Platform Cut', creatorHq: '0% Fee', competitor: '10% on server subs' },
    ],
  },
  {
    id: 'stan-store',
    slug: 'stan-store',
    name: 'Stan Store',
    pillLabel: 'CreatorHQ vs Stan Store',
    title: 'CreatorHQ vs Stan Store (2026 Comparison) • Pricing & Credentials',
    metaDescription:
      'Compare CreatorHQ vs Stan Store. CreatorHQ is 100% free for verified creator credentials compared to Stan Store monthly fees ($29–$99/mo).',
    headline: 'Is CreatorHQ cheaper than Stan Store?',
    description:
      'Stan Store charges $29 to $99 per month to sell digital downloads. CreatorHQ focuses on verifiable identity and brand sponsorships without costly monthly subscriptions.',
    creatorHqFeature: 'No monthly subscription fees, verifiable proof auditing, and direct sponsor inquiries.',
    competitorFeature: 'High monthly fee ($29–$99/month) primarily tailored for course creators.',
    costComparison: 'CreatorHQ is 100% free for verified digital credentials; Stan Store costs $348 to $1,188 per year.',
    features: [
      { feature: 'Monthly Cost', creatorHq: '$0 / month (100% Free)', competitor: '$29 to $99 / month' },
      { feature: 'Brand Sponsorships', creatorHq: 'Verified Proof & Proposal Inquiries', competitor: 'Geared towards selling eBooks/Courses' },
      { feature: 'Audience Verification', creatorHq: 'Staff-audited YouTube & Discord reach', competitor: 'Self-proclaimed' },
      { feature: 'Annual Savings', creatorHq: 'Save up to $1,188/year', competitor: 'Recurring annual cost' },
    ],
  },
  {
    id: 'agencies',
    slug: 'agencies',
    name: 'Traditional Agencies',
    pillLabel: 'CreatorHQ vs Talent Agencies',
    title: 'CreatorHQ vs Traditional Talent Agencies • Sovereign Creator Ownership',
    metaDescription:
      'Keep 100% of brand deal revenues with CreatorHQ vs 20-50% commission cuts from traditional talent agencies and management contracts.',
    headline: 'Why use CreatorHQ instead of a traditional talent agency?',
    description:
      'Traditional talent management agencies take 20% to 50% cuts of every brand deal and lock creators into exclusive contracts. CreatorHQ gives creators sovereign ownership of their media kit with direct sponsor access.',
    creatorHqFeature: '100% deal retention (keep 100% of brand payments), instant card control, and sovereign ownership.',
    competitorFeature: '20% to 50% commission cuts, multi-year binding contracts, and agency gatekeeping.',
    costComparison: 'CreatorHQ takes 0% commission on your sponsorships. Agencies take 20–50%.',
    features: [
      { feature: 'Revenue Retention', creatorHq: 'Keep 100% of brand payments', competitor: 'Agency takes 20% to 50% cut' },
      { feature: 'Contract Freedom', creatorHq: 'Sovereign, non-exclusive ownership', competitor: 'Binding multi-year exclusive lock-in' },
      { feature: 'Direct Brand Access', creatorHq: 'Brands contact you directly via your pass', competitor: 'Agency gatekeepers decide deals' },
      { feature: 'Setup Time', creatorHq: 'Instant 2-minute minting in Studio', competitor: 'Months of negotiations & audits' },
    ],
  },
];
