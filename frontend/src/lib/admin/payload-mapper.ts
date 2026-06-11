/**
 * Payload Mapper — isolates frontend↔backend field mapping.
 *
 * The frontend uses enhanced types (ArticleStatus, PromotionStatus, CampaignType, SEO fields…)
 * that the legacy backend API may not support directly.
 *
 * This file maps enhanced frontend fields to the legacy API contract.
 * When the backend is updated, only this file needs to change.
 */

import type { Article, ArticleStatus, Promotion, PromotionStatus } from "./types";
import type { CampaignType } from "./types";

// ─── Article ─────────────────────────────────────────────────────────────────

interface ArticleFormInput {
  title: string;
  category: string;
  readMins: number;
  slug?: string;
  excerpt: string;
  content: string;
  status: ArticleStatus;
  scheduledAt?: string;
  coverImage?: string;
  tags?: string;
  author?: string;
  featured?: boolean;
  seoTitle?: string;
  seoDescription?: string;
  ogImage?: string;
  canonicalUrl?: string;
  focusKeyword?: string;
}

/** Map frontend Article form values → API-compatible payload */
export function mapArticlePayload(input: ArticleFormInput): Partial<Article> & Record<string, unknown> {
  const payload: Partial<Article> & Record<string, unknown> = {
    title: input.title,
    category: input.category,
    readMins: input.readMins,
    excerpt: input.excerpt,
    content: input.content,
    // Legacy contract: backend expects `published: boolean`
    published: input.status === "published",
    publishedAt: input.status === "published" && !input.scheduledAt
      ? new Date().toISOString()
      : input.scheduledAt || undefined,
  };

  if (input.slug) payload.slug = input.slug;

  // Send enhanced fields — backend will ignore unknown fields.
  // When backend supports them, they will be accepted as-is.
  if (input.status) payload.status = input.status;
  if (input.scheduledAt) payload.scheduledAt = input.scheduledAt;
  if (input.coverImage) payload.coverImage = input.coverImage;
  if (input.tags) payload.tags = input.tags.split(",").map((t) => t.trim()).filter(Boolean);
  if (input.author) payload.author = input.author;
  if (input.featured) payload.featured = input.featured;
  if (input.seoTitle) payload.seoTitle = input.seoTitle;
  if (input.seoDescription) payload.seoDescription = input.seoDescription;
  if (input.ogImage) payload.ogImage = input.ogImage;
  if (input.canonicalUrl) payload.canonicalUrl = input.canonicalUrl;
  if (input.focusKeyword) payload.focusKeyword = input.focusKeyword;

  return payload;
}

// ─── Promotion ───────────────────────────────────────────────────────────────

interface PromotionFormInput {
  title: string;
  tag?: string;
  price?: string;
  oldPrice?: string;
  desc: string;
  slug?: string;
  status: PromotionStatus;
  campaignType?: string;
  startDate?: string;
  endDate?: string;
  coverImage?: string;
  terms?: string;
  featured?: boolean;
  displayOrder?: number;
  maxClaims?: number;
  accentColor?: string;
  currency?: string;
  priceNote?: string;
  fullDescription?: string;
  targetAudience?: string;
}

/** Map frontend Promotion form values → API-compatible payload */
export function mapPromotionPayload(input: PromotionFormInput): Partial<Promotion> & Record<string, unknown> {
  const payload: Partial<Promotion> & Record<string, unknown> = {
    title: input.title,
    desc: input.desc,
    // Legacy contract: backend expects `active: boolean`
    active: input.status === "active",
  };

  if (input.tag) payload.tag = input.tag;
  if (input.price) payload.price = input.price;
  if (input.oldPrice) payload.oldPrice = input.oldPrice;
  if (input.slug) payload.slug = input.slug;

  // Enhanced fields — sent as-is for future backend compatibility
  if (input.status) payload.status = input.status;
  if (input.campaignType) payload.campaignType = input.campaignType as CampaignType;
  if (input.startDate) payload.startDate = input.startDate;
  if (input.endDate) payload.endDate = input.endDate;
  if (input.coverImage) payload.coverImage = input.coverImage;
  if (input.terms) payload.terms = input.terms;
  if (input.featured) payload.featured = input.featured;
  if (input.displayOrder !== undefined) payload.displayOrder = input.displayOrder;
  if (input.maxClaims !== undefined) payload.maxClaims = input.maxClaims;
  if (input.accentColor) payload.accentColor = input.accentColor;
  if (input.currency) payload.currency = input.currency;
  if (input.priceNote) payload.priceNote = input.priceNote;
  if (input.fullDescription) payload.fullDescription = input.fullDescription;
  if (input.targetAudience) payload.targetAudience = input.targetAudience;

  return payload;
}
