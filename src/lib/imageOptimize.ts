/**
 * Cloudflare Image Resizing utility
 *
 * Wraps external image URLs (e.g. Steam CDN) with Cloudflare's
 * `/cdn-cgi/image/...` endpoint so images are automatically
 * resized, compressed, and served in modern formats (WebP/AVIF).
 *
 * On Cloudflare Pages the proxy path is:
 *   /cdn-cgi/image/{options}/{origin-url}
 *
 * Docs: https://developers.cloudflare.com/images/transform-images/transform-via-url/
 */

export interface ImageOptimizeOptions {
  /** Target display width in CSS pixels. */
  width?: number;
  /** Target display height in CSS pixels. */
  height?: number;
  /** Compression quality 1-100 (default 80). */
  quality?: number;
  /** Resize fit mode (default "scale-down" — never upscale). */
  fit?: 'scale-down' | 'contain' | 'cover' | 'crop' | 'pad';
  /** Output format (default "auto" — picks WebP/AVIF based on Accept header). */
  format?: 'auto' | 'webp' | 'avif' | 'json';
}

/**
 * Returns an optimized image URL for the given source.
 *
 * Cloudflare Image Resizing (/cdn-cgi/image/) requires a Pro+ plan.
 * Until that is enabled, this function normalises the URL (fixes
 * deprecated Steam CDN domains) and returns it directly.
 *
 * To re-enable CF image resizing later, set ENABLE_CF_IMAGES = true.
 */
const ENABLE_CF_IMAGES = false;

export function optimizeImage(
  url: string | null | undefined,
  opts: ImageOptimizeOptions = {},
): string {
  // Pass through empty / relative / data-uri values unchanged
  if (!url || !url.startsWith('http')) return url ?? '';

  // Fix deprecated Steam CDN domain (301-redirects, breaks CF proxy)
  let normalised = url.replace(
    'community.cloudflare.steamstatic.com',
    'community.steamstatic.com',
  );

  if (!ENABLE_CF_IMAGES) return normalised;

  const {
    width,
    height,
    quality = 80,
    fit = 'scale-down',
    format = 'auto',
  } = opts;

  const parts: string[] = [];
  if (width) parts.push(`width=${width}`);
  if (height) parts.push(`height=${height}`);
  parts.push(`quality=${quality}`);
  parts.push(`fit=${fit}`);
  parts.push(`format=${format}`);

  return `/cdn-cgi/image/${parts.join(',')}/${normalised}`;
}

/**
 * Preset helpers for common use cases across the site.
 * Each returns a fully-formed CF image URL.
 */

/** Skin card thumbnail used in grid listings (skins.astro, category pages). */
export function skinCardImage(url: string | null | undefined): string {
  return optimizeImage(url, { width: 400, quality: 75 });
}

/** Larger image shown on individual skin detail pages (skin/[slug].astro). */
export function skinDetailImage(url: string | null | undefined): string {
  return optimizeImage(url, { width: 800, quality: 82 });
}

/** Small related-skin thumbnail shown in related sections. */
export function skinRelatedImage(url: string | null | undefined): string {
  return optimizeImage(url, { width: 280, quality: 72 });
}

/** Homepage featured hero image. */
export function skinHeroImage(url: string | null | undefined): string {
  return optimizeImage(url, { width: 600, quality: 82 });
}

/** Smaller homepage featured side images. */
export function skinHeroSideImage(url: string | null | undefined): string {
  return optimizeImage(url, { width: 400, quality: 78 });
}

/** Homepage weapon category card images. */
export function categoryCardImage(url: string | null | undefined): string {
  return optimizeImage(url, { width: 360, quality: 75 });
}

/** Skin card in the homepage "top skins" grid. */
export function homeSkinCardImage(url: string | null | undefined): string {
  return optimizeImage(url, { width: 360, quality: 75 });
}
