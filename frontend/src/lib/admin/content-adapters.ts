import type { Article, Promotion } from "./types";

export function normalizeSlug(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function estimateReadMins(content: string): number {
  const words = content.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

export function parsePrice(value?: string): number {
  if (!value) return 0;
  return Number(value.replace(/[^0-9]/g, "")) || 0;
}

export function calculateDiscountPercent(price?: string, oldPrice?: string): number {
  const promoPrice = parsePrice(price);
  const normalPrice = parsePrice(oldPrice);
  if (normalPrice > 0 && promoPrice > 0 && normalPrice > promoPrice) {
    return Math.round((1 - promoPrice / normalPrice) * 100);
  }
  return 0;
}

export type ArticleFormPayload = {
  title: string;
  slug: string;
  category: string;
  content: string;
  excerpt: string;
  readMins: number;
  status: NonNullable<Article["status"]>;
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
};

export type ArticleApiPayload = Pick<Article, "title" | "slug" | "category" | "content" | "excerpt" | "readMins" | "published"> & {
  publishedAt?: string | null;
  metadata?: {
    status: NonNullable<Article["status"]>;
    scheduledAt?: string;
    coverImage?: string;
    tags?: string[];
    author?: string;
    featured?: boolean;
    seoTitle?: string;
    seoDescription?: string;
    ogImage?: string;
    canonicalUrl?: string;
    focusKeyword?: string;
  };
};

export function buildArticlePayload(values: ArticleFormPayload, status: NonNullable<Article["status"]>): ArticleApiPayload {
  const slug = normalizeSlug(values.slug || values.title);
  const tags = values.tags?.split(",").map((tag) => tag.trim()).filter(Boolean);

  return {
    title: values.title,
    slug,
    category: values.category,
    content: values.content,
    excerpt: values.excerpt,
    readMins: values.readMins,
    published: status === "published",
    publishedAt: status === "published" ? new Date().toISOString() : null,
    // Enhanced CMS fields are isolated here until the backend contract supports them natively.
    metadata: {
      status,
      scheduledAt: status === "scheduled" ? values.scheduledAt || undefined : undefined,
      coverImage: values.coverImage || undefined,
      tags: tags?.length ? tags : undefined,
      author: values.author || undefined,
      featured: values.featured,
      seoTitle: values.seoTitle || undefined,
      seoDescription: values.seoDescription || undefined,
      ogImage: values.ogImage || undefined,
      canonicalUrl: values.canonicalUrl || undefined,
      focusKeyword: values.focusKeyword || undefined,
    },
  };
}

export type PromotionFormPayload = Omit<Partial<Promotion>, "id" | "createdAt" | "updatedAt">;

export type PromotionApiPayload = Pick<Promotion, "title" | "slug" | "tag" | "price" | "oldPrice" | "desc" | "active"> & {
  metadata?: {
    status?: Promotion["status"];
    campaignType?: Promotion["campaignType"];
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
    discountPercentage?: number;
  };
};

export function buildPromotionPayload(values: PromotionFormPayload, status: NonNullable<Promotion["status"]>): PromotionApiPayload {
  return {
    title: values.title ?? "",
    slug: normalizeSlug(values.slug || values.title || ""),
    tag: values.tag ?? "",
    price: values.price ?? "",
    oldPrice: values.oldPrice ?? "",
    desc: values.desc ?? "",
    active: status === "active",
    // Campaign-only fields stay in metadata so legacy CRUD endpoints are not polluted with unknown top-level keys.
    metadata: {
      status,
      campaignType: values.campaignType,
      startDate: values.startDate || undefined,
      endDate: values.endDate || undefined,
      coverImage: values.coverImage || undefined,
      terms: values.terms || undefined,
      featured: values.featured,
      displayOrder: values.displayOrder,
      maxClaims: values.maxClaims,
      accentColor: values.accentColor,
      currency: values.currency,
      priceNote: values.priceNote || undefined,
      fullDescription: values.fullDescription || undefined,
      targetAudience: values.targetAudience,
      discountPercentage: calculateDiscountPercent(values.price, values.oldPrice),
    },
  };
}
