import type { ReferrerCategory } from '@/types';

// Known search engines
const searchEngines = [
  'google.com',
  'google.',  // Regional Google domains
  'bing.com',
  'yahoo.com',
  'duckduckgo.com',
  'baidu.com',
  'yandex.',
  'ecosia.org',
  'qwant.com',
];

// Known social platforms
const socialPlatforms = [
  'twitter.com',
  'x.com',
  'facebook.com',
  'linkedin.com',
  'reddit.com',
  'instagram.com',
  'tiktok.com',
  'youtube.com',
  'pinterest.com',
  'threads.net',
  'mastodon.',
  'bsky.app',
  'hacker-news.firebaseio.com',
  'news.ycombinator.com',
];

// Known paid traffic indicators
const paidIndicators = [
  'gclid',  // Google Ads
  'fbclid', // Facebook Ads
  'msclkid', // Microsoft Ads
  'utm_medium=cpc',
  'utm_medium=ppc',
  'utm_medium=paid',
];

export function categorizeReferrer(
  referrer: string | null | undefined,
  urlPath?: string
): ReferrerCategory {
  // No referrer = direct
  if (!referrer || referrer.trim() === '') {
    return 'DIRECT';
  }

  const referrerLower = referrer.toLowerCase();

  // Check for paid traffic indicators in URL or referrer
  const fullUrl = urlPath ? `${referrer}${urlPath}` : referrer;
  if (paidIndicators.some(indicator => fullUrl.toLowerCase().includes(indicator))) {
    return 'PAID';
  }

  // Check for search engines
  if (searchEngines.some(engine => referrerLower.includes(engine))) {
    return 'SEARCH';
  }

  // Check for social platforms
  if (socialPlatforms.some(platform => referrerLower.includes(platform))) {
    return 'SOCIAL';
  }

  // If there's a referrer but it's not categorized, it's a referral
  return 'REFERRAL';
}

// Get a short display name for the referrer
export function getReferrerDisplayName(referrer: string | null | undefined): string | null {
  if (!referrer) return null;

  try {
    const url = new URL(referrer);
    // Remove www. prefix for cleaner display
    return url.hostname.replace(/^www\./, '');
  } catch {
    // If parsing fails, return the raw referrer truncated
    return referrer.length > 30 ? referrer.substring(0, 30) + '...' : referrer;
  }
}
