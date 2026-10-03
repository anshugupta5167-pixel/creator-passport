// Creator Passport System Types

export type VerificationStatus = 'UNVERIFIED' | 'PENDING' | 'UNDER_REVIEW' | 'VERIFIED' | 'REJECTED' | string;
export type UserRole = 'CREATOR' | 'ADMIN';

export interface User {
  id: string;
  email: string;
  username: string;
  displayName: string;
  role: UserRole;
  passwordHash: string;
  passwordSalt: string;
  emailVerified: boolean;
  verificationToken?: string | null;
  verificationExpires?: string | null;
  resetToken?: string | null;
  resetExpires?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Session {
  id: string;
  userId: string;
  token: string;
  createdAt: string;
  expiresAt: string;
}

export interface AuditLog {
  id: string;
  userId?: string | null;
  action: string;
  actor: string;
  details?: any;
  timestamp: string;
}

export interface ProofDocument {
  id: string;
  url: string; // Secure admin-only URL (never exposed in public UI)
  filename: string;
  mimeType?: string;
  fileSizeBytes?: number;
  uploadedAt: string;
  platform?: string;
  notes?: string;
}

export interface PlatformConnection {
  platform: 'YOUTUBE' | 'DISCORD' | 'INSTAGRAM' | 'TWITCH' | 'GITHUB' | 'TIKTOK';
  connected: boolean;
  username: string;
  metricLabel: string; // e.g. "subscribers", "members", "followers"
  metricValue: string; // e.g. "125,430 Subscribers", "24,582 Members", "184K"
  verified: boolean;
  profileUrl?: string;
  lastSynced?: string;
  lastSyncedTimestamp?: number;
  // Official YouTube tracking
  channelId?: string;
  rawCount?: number;
  avatarUrl?: string;
  proofScreenshot?: string;
  // Official Discord sync
  guildId?: string;
  guildName?: string;
  guildIcon?: string;
  inviteCode?: string;
  approximatePresenceCount?: number;
  syncStatus?: 'VERIFIED' | 'SYNCING' | 'FALLBACK' | 'ERROR';
  syncError?: string;
}

export interface ChannelItem {
  id: string;
  name: string;
  handle: string;
  url: string;
  subscribers: string;
  numericSubscribers?: number;
  verified: boolean;
  lastSynced?: string;
  avatarUrl?: string;
}

export interface QuickInfo {
  category: string;
  statusText: string;
  partnership: string;
  connectLinks?: {
    youtube?: string;
    instagram?: string;
    discord?: string;
  };
}

export interface AchievementItem {
  id: string;
  slug: string;
  name: string;
  description: string;
  badgeIcon: string;
  unlockedAt: string;
}

export interface CollabItem {
  id: string;
  partnerHandle?: string;
  partnerName: string;
  partnerAvatar?: string;
  title: string;
  category: string;
  date: string;
  verified: boolean;
}

export interface PortfolioItem {
  id: string;
  title: string;
  type: 'video' | 'stream' | 'project' | 'article';
  views?: string;
  thumbnailUrl?: string;
  url: string;
}

export interface CreatorProfile {
  id: string; // creator_xxx
  userId?: string; // references User.id
  slug: string; // e.g. "itsuniqueplayz" — the primary public identifier
  handle: string; // e.g. "@itsuniqueplayz"
  username: string; // e.g. "itsuniqueplayz"
  displayName: string; // "ItsUniquePlayz"
  avatarUrl: string;
  bannerUrl?: string;
  category: string; // "Gaming Creator"
  niche?: string; // alias for category
  country: string;
  location?: string;
  bio: string;
  isVerified: boolean;
  verification_status?: VerificationStatus;
  rejectionReason?: string;
  proofDocuments?: ProofDocument[];
  isFounding?: boolean;
  tierName?: string; // "Founding Member Tier I"
  profileCompletion: number; // e.g. 85
  contactEmail: string;
  issuedAt: string;
  lastVerifiedAt: string;
  digitalSignature: string; // SHA-256 hash
  isSuspended: boolean;
  suspensionReason?: string;
  
  cardTheme?: string;
  cardColor?: string;

  connections: {
    youtube?: PlatformConnection;
    discord?: PlatformConnection;
    instagram?: PlatformConnection;
    twitch?: PlatformConnection;
    github?: PlatformConnection;
  };
  
  // Custom creator sections
  quickInfo?: QuickInfo;
  moreChannels?: ChannelItem[];

  skills: string[];
  achievements: AchievementItem[];
  collaborations: CollabItem[];
  portfolio: PortfolioItem[];

  // Internal backwards-compat field
  passportId?: string;
  creatorSecret?: string;
  registeredIp?: string;
  clientIp?: string;
}

export interface VerificationSubmission {
  id: string;
  creatorId?: string;
  userId?: string;
  creatorSlug: string;
  creatorName: string;
  creatorHandle: string;
  creatorAvatar?: string;
  category: string;
  platforms: string[];
  connectedPlatforms: {
    youtube?: { connected: boolean; metricValue?: string; username?: string; proofScreenshot?: string };
    discord?: { connected: boolean; metricValue?: string; username?: string; proofScreenshot?: string };
    instagram?: { connected: boolean; username?: string };
  };
  proofDocuments: ProofDocument[];
  status: VerificationStatus;
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  rejectionReason?: string;
}

export interface BrandFilterOptions {
  category?: string;
  platform?: string;
  minAudience?: number;
  country?: string;
  verifiedOnly?: boolean;
}
