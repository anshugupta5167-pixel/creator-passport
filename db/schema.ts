import { pgTable, text, jsonb, timestamp } from "drizzle-orm/pg-core";

// Creator cards. The full profile is stored as JSON; `slug` is the canonical key.
export const creators = pgTable("creators", {
  slug: text().primaryKey(),
  data: jsonb().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Verification submissions, one per creator slug.
export const verifications = pgTable("verifications", {
  id: text().primaryKey(),
  creatorSlug: text("creator_slug").notNull().unique(),
  data: jsonb().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Small key/value table for one-off flags (e.g. legacy data import).
export const appMeta = pgTable("app_meta", {
  key: text().primaryKey(),
  value: text().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
