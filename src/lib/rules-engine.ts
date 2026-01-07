/**
 * Rules Engine for Intent Classification and Friction Detection
 * Deterministic rules that run before AI (to minimize API calls)
 */

import type {
  IntentLabel,
  FrictionType,
  ReferrerCategory,
  DeviceType,
} from '@/types';

// Input for classification
export interface ClassificationInput {
  events: { path: string; timestamp: Date; timeOnPage?: number }[];
  referrerCategory: ReferrerCategory;
  isReturning: boolean;
  device: DeviceType;
  sessionDurationMs: number;
}

// Output from classification
export interface ClassificationResult {
  intentLabel: IntentLabel;
  intentConfidence: number;
  intentReason: string;
  frictionFlag: boolean;
  frictionType: FrictionType;
  frictionReason: string | null;
  needsAI: boolean; // Whether AI refinement is recommended
}

// Path pattern matchers
const PRICING_PATTERNS = ['/pricing', '/plans', '/subscribe', '/upgrade'];
const SIGNUP_PATTERNS = ['/signup', '/register', '/onboarding', '/join', '/create-account'];
const CONTENT_PATTERNS = ['/blog', '/docs', '/guides', '/learn', '/help', '/articles'];
const FEATURES_PATTERNS = ['/features', '/product', '/solutions', '/use-cases'];

function matchesPatterns(path: string, patterns: string[]): boolean {
  const normalizedPath = path.toLowerCase();
  return patterns.some(p => normalizedPath.includes(p));
}

// Calculate time on specific page type
function getTimeOnPageType(
  events: ClassificationInput['events'],
  patterns: string[]
): number {
  return events
    .filter(e => matchesPatterns(e.path, patterns))
    .reduce((total, e) => total + (e.timeOnPage || 0), 0);
}

// Count visits to page type
function countVisitsToPageType(
  events: ClassificationInput['events'],
  patterns: string[]
): number {
  return events.filter(e => matchesPatterns(e.path, patterns)).length;
}

// Get last N page paths
function getLastPaths(events: ClassificationInput['events'], n: number): string[] {
  return events.slice(-n).map(e => e.path);
}

// Detect back-and-forth pattern (A → B → A)
function hasNavLoop(events: ClassificationInput['events']): boolean {
  if (events.length < 3) return false;

  const paths = events.map(e => e.path);
  for (let i = 0; i < paths.length - 2; i++) {
    if (paths[i] === paths[i + 2] && paths[i] !== paths[i + 1]) {
      return true;
    }
  }
  return false;
}

// Check if session ended on a specific page type
function endedOnPageType(
  events: ClassificationInput['events'],
  patterns: string[]
): boolean {
  if (events.length === 0) return false;
  return matchesPatterns(events[events.length - 1].path, patterns);
}

export function classifySession(input: ClassificationInput): ClassificationResult {
  const { events, referrerCategory, isReturning, sessionDurationMs } = input;

  // Default result
  let result: ClassificationResult = {
    intentLabel: 'UNCLEAR',
    intentConfidence: 0.5,
    intentReason: 'Observing behavior...',
    frictionFlag: false,
    frictionType: 'NONE',
    frictionReason: null,
    needsAI: false,
  };

  // Not enough data
  if (events.length === 0) {
    return result;
  }

  // Calculate metrics
  const pricingVisits = countVisitsToPageType(events, PRICING_PATTERNS);
  const signupVisits = countVisitsToPageType(events, SIGNUP_PATTERNS);
  const contentVisits = countVisitsToPageType(events, CONTENT_PATTERNS);
  const featuresVisits = countVisitsToPageType(events, FEATURES_PATTERNS);
  const timeOnPricing = getTimeOnPageType(events, PRICING_PATTERNS);
  const timeOnSignup = getTimeOnPageType(events, SIGNUP_PATTERNS);
  const hasLoop = hasNavLoop(events);

  // ============================================
  // INTENT CLASSIFICATION (in priority order)
  // ============================================

  // HIGH_INTENT: Visited pricing AND signup within session
  if (pricingVisits >= 1 && signupVisits >= 1) {
    result.intentLabel = 'HIGH_INTENT';
    result.intentConfidence = 0.85;
    result.intentReason = 'Moved from pricing toward signup.';
  }
  // SIGNUP_ATTEMPT: On signup pages
  else if (signupVisits >= 1) {
    result.intentLabel = 'SIGNUP_ATTEMPT';
    result.intentConfidence = 0.75;
    result.intentReason = 'Viewing signup or onboarding.';
  }
  // EVALUATING_PRICING: Significant time on pricing
  else if (pricingVisits >= 1 && timeOnPricing >= 20000) {
    result.intentLabel = 'EVALUATING_PRICING';
    result.intentConfidence = 0.7;
    result.intentReason = 'Spending time on pricing.';
  }
  // EVALUATING_PRODUCT: Viewing features
  else if (featuresVisits >= 2 || (featuresVisits >= 1 && pricingVisits >= 1)) {
    result.intentLabel = 'EVALUATING_PRODUCT';
    result.intentConfidence = 0.65;
    result.intentReason = 'Exploring product features.';
  }
  // DISCOVERY_CONTENT: Multiple content pages
  else if (contentVisits >= 2) {
    result.intentLabel = 'DISCOVERY_CONTENT';
    result.intentConfidence = 0.6;
    result.intentReason = 'Reading educational content.';
  }
  // BOUNCE_RISK: Single page, short session, idle
  else if (events.length === 1 && sessionDurationMs < 15000) {
    result.intentLabel = 'BOUNCE_RISK';
    result.intentConfidence = 0.6;
    result.intentReason = 'Brief visit with single page view.';
  }
  // UNCLEAR: Need AI to help
  else {
    result.intentLabel = 'UNCLEAR';
    result.intentConfidence = 0.4;
    result.intentReason = 'Observing behavior...';
    result.needsAI = events.length >= 3 || sessionDurationMs > 30000;
  }

  // ============================================
  // FRICTION DETECTION
  // ============================================

  // PRICING_LOOP: Multiple pricing visits
  if (pricingVisits >= 2) {
    result.frictionFlag = true;
    result.frictionType = 'PRICING_LOOP';
    result.frictionReason = 'Repeated visits to pricing may suggest unanswered questions.';
  }
  // NAV_LOOP: Back-and-forth navigation
  else if (hasLoop) {
    result.frictionFlag = true;
    result.frictionType = 'NAV_LOOP';
    result.frictionReason = 'Moving between pages may suggest uncertainty.';
  }
  // FORM_STALL: Long time on signup
  else if (signupVisits >= 1 && timeOnSignup >= 60000) {
    result.frictionFlag = true;
    result.frictionType = 'FORM_STALL';
    result.frictionReason = 'Long pause on signup may suggest form friction.';
  }
  // CTA_DROP: Ended on pricing/features without progressing
  else if (
    endedOnPageType(events, PRICING_PATTERNS) &&
    signupVisits === 0 &&
    sessionDurationMs > 60000
  ) {
    result.frictionFlag = true;
    result.frictionType = 'CTA_DROP';
    result.frictionReason = 'Session ended on pricing without progressing.';
  }

  // Adjust confidence based on friction
  if (result.frictionFlag && result.intentConfidence > 0.6) {
    result.intentConfidence -= 0.05;
  }

  // Mark as needing AI if friction detected but intent unclear
  if (result.frictionFlag && result.intentLabel === 'UNCLEAR') {
    result.needsAI = true;
  }

  return result;
}

// Confidence level for copy generation (1-4)
export function getConfidenceLevel(confidence: number): 1 | 2 | 3 | 4 {
  if (confidence >= 0.8) return 4;
  if (confidence >= 0.65) return 3;
  if (confidence >= 0.5) return 2;
  return 1;
}
