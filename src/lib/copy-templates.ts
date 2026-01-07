/**
 * UX Copy Templates
 * Following the UX Copy Constitution for NowWhy
 *
 * Voice Pillars:
 * 1. Observational - describe what appears to be happening
 * 2. Calm under ambiguity - embrace uncertainty
 * 3. Founder-to-founder - quiet, experienced tone
 * 4. Minimal but meaningful - every word earns its place
 *
 * Confidence Levels:
 * 1. Observed - facts only
 * 2. Pattern noticed - repeated behavior
 * 3. Likely intent - restrained interpretation
 * 4. Actionable signal - still not predictive
 */

import type { IntentLabel, FrictionType } from '@/types';

// Intent reason templates (fallback when AI unavailable)
export const intentReasonTemplates: Record<IntentLabel, string[]> = {
  DISCOVERY_CONTENT: [
    'Browsing educational pages.',
    'Reading content.',
    'Exploring documentation.',
  ],
  EVALUATING_PRODUCT: [
    'Viewing product features.',
    'Exploring what the product offers.',
    'Looking at solutions.',
  ],
  EVALUATING_PRICING: [
    'Spending time on pricing.',
    'Viewing plan options.',
    'Comparing pricing tiers.',
  ],
  SIGNUP_ATTEMPT: [
    'Viewing signup or onboarding.',
    'In the registration flow.',
    'Starting account creation.',
  ],
  HIGH_INTENT: [
    'Moved from pricing toward signup.',
    'Progressing through conversion path.',
    'Shows strong engagement with conversion pages.',
  ],
  BOUNCE_RISK: [
    'Brief visit with single page view.',
    'Short session, may have left.',
    'Quick visit without deep engagement.',
  ],
  UNCLEAR: [
    'Observing behavior...',
    'Gathering more context...',
    'Not enough data yet.',
  ],
};

// Friction reason templates
export const frictionReasonTemplates: Record<FrictionType, string | null> = {
  PRICING_LOOP: 'Repeated visits to pricing may suggest unanswered questions.',
  NAV_LOOP: 'Moving between pages may suggest uncertainty.',
  FORM_STALL: 'Long pause on signup may suggest form friction.',
  CTA_DROP: 'Session ended on pricing without progressing.',
  NONE: null,
};

// Get a random template for variety
export function getIntentReason(label: IntentLabel): string {
  const templates = intentReasonTemplates[label];
  return templates[Math.floor(Math.random() * templates.length)];
}

// Session summary templates
export const summaryTemplates = {
  highIntentSingle: (count: number) =>
    count === 1
      ? 'One visitor showing strong engagement with pricing and signup.'
      : `${count} visitors showing strong engagement with pricing and signup.`,

  evaluatingPricing: (count: number) =>
    count === 1
      ? 'One visitor spending time on pricing.'
      : `${count} visitors spending time on pricing.`,

  discoveryContent: (count: number) =>
    count === 1
      ? 'One visitor browsing content pages.'
      : `${count} visitors browsing content pages.`,

  signupAttempt: (count: number) =>
    count === 1
      ? 'One visitor in the signup flow.'
      : `${count} visitors in the signup flow.`,

  frictionDetected: (type: FrictionType, count: number) => {
    const typeNames: Record<FrictionType, string> = {
      PRICING_LOOP: 'pricing revisits',
      NAV_LOOP: 'navigation loops',
      FORM_STALL: 'form pauses',
      CTA_DROP: 'exits from conversion pages',
      NONE: '',
    };
    if (type === 'NONE') return '';
    return count === 1
      ? `One session with ${typeNames[type]}.`
      : `${count} sessions with ${typeNames[type]}.`;
  },

  trafficSource: (category: string, count: number) => {
    const categoryNames: Record<string, string> = {
      SEARCH: 'search',
      SOCIAL: 'social',
      REFERRAL: 'referral links',
      PAID: 'paid ads',
      DIRECT: 'direct visits',
    };
    const name = categoryNames[category] || 'unknown sources';
    return `${count} from ${name}.`;
  },
};

// Empty state messages (calm, reassuring)
export const emptyStateMessages = {
  noVisitors: {
    title: 'Waiting for activity',
    description: 'When someone visits your site, their session will appear here.',
  },
  noRecentActivity: {
    title: 'Quiet moment',
    description: 'No active sessions in the last few minutes.',
  },
  noFriction: {
    title: 'No friction detected',
    description: 'Sessions are flowing smoothly.',
  },
};

// "Since you last checked" templates
export const sinceLastCheckTemplates = {
  summary: (highIntent: number, friction: number, total: number) => {
    const parts: string[] = [];

    if (highIntent > 0) {
      parts.push(
        highIntent === 1
          ? '1 high-intent session'
          : `${highIntent} high-intent sessions`
      );
    }

    if (friction > 0) {
      parts.push(
        friction === 1
          ? '1 friction detected'
          : `${friction} friction events`
      );
    }

    if (parts.length === 0 && total > 0) {
      return total === 1
        ? '1 session since your last visit.'
        : `${total} sessions since your last visit.`;
    }

    if (parts.length === 0) {
      return 'No new activity since your last visit.';
    }

    return `Since your last visit: ${parts.join(', ')}.`;
  },
};

// Alert message templates (informational, not urgent)
export const alertTemplates = {
  highIntent: (page: string, location: string, isReturning: boolean) => ({
    title: 'Visitor on conversion path',
    body: `A ${isReturning ? 'returning ' : ''}visitor is spending time on ${page}.\nLocation: ${location}\nThis pattern often appears before signups.`,
  }),

  frictionDetected: (page: string, frictionType: FrictionType) => ({
    title: 'Possible friction detected',
    body: `A visitor may be experiencing friction on ${page}.\n${frictionReasonTemplates[frictionType] || 'Worth checking.'}`,
  }),

  trafficSpike: (count: number, source: string) => ({
    title: 'Traffic increase',
    body: `${count} visitors from ${source} in the last few minutes.\nMay be worth watching.`,
  }),
};

// Expectation limiting copy (for onboarding/UI)
export const expectationCopy = {
  whatThisIs: "This shows what's happening right now. It's awareness, not analytics.",
  whatThisIsNot: 'This is not a replacement for GA or historical analytics.',
  intentDisclaimer: 'Intent labels are based on observed behavior, not user identity.',
  privacyNote: 'No personal information is collected or stored.',
};
