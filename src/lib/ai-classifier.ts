/**
 * AI Classifier using Claude API
 * Only called when rules engine needs refinement
 *
 * Rate limits:
 * - Max 1 AI call per session every 60s
 * - Max 3 AI calls per session total
 */

import Anthropic from '@anthropic-ai/sdk';
import type {
  IntentLabel,
  FrictionType,
  ReferrerCategory,
  DeviceType,
} from '@/types';
import { getIntentReason, frictionReasonTemplates } from './copy-templates';

// AI classification input
export interface AIClassificationInput {
  rulesIntent: IntentLabel;
  rulesConfidence: number;
  rulesFriction: { flag: boolean; type: FrictionType };
  referrerCategory: ReferrerCategory;
  events: { path: string; t: number }[]; // path and relative timestamp in seconds
  timeOnCurrentPageSec: number;
  isReturning: boolean;
  device: DeviceType;
}

// AI classification output
export interface AIClassificationOutput {
  intentLabel: IntentLabel;
  intentConfidence: number;
  intentReason: string;
  frictionFlag: boolean;
  frictionType: FrictionType;
  frictionReason: string;
}

// Valid intent labels for validation
const VALID_INTENTS: IntentLabel[] = [
  'DISCOVERY_CONTENT',
  'EVALUATING_PRODUCT',
  'EVALUATING_PRICING',
  'SIGNUP_ATTEMPT',
  'HIGH_INTENT',
  'BOUNCE_RISK',
  'UNCLEAR',
];

// Valid friction types for validation
const VALID_FRICTION: FrictionType[] = [
  'PRICING_LOOP',
  'NAV_LOOP',
  'FORM_STALL',
  'CTA_DROP',
  'NONE',
];

// Rate limit tracking (in-memory, would use Redis in production)
const rateLimitMap = new Map<string, { count: number; lastCall: number }>();

function checkRateLimit(sessionId: string): boolean {
  const now = Date.now();
  const limit = rateLimitMap.get(sessionId);

  if (!limit) {
    rateLimitMap.set(sessionId, { count: 1, lastCall: now });
    return true;
  }

  // Max 3 calls per session
  if (limit.count >= 3) {
    return false;
  }

  // Min 60s between calls
  if (now - limit.lastCall < 60000) {
    return false;
  }

  limit.count++;
  limit.lastCall = now;
  return true;
}

// Clean up old rate limit entries periodically
setInterval(() => {
  const oneHourAgo = Date.now() - 3600000;
  for (const [key, value] of rateLimitMap.entries()) {
    if (value.lastCall < oneHourAgo) {
      rateLimitMap.delete(key);
    }
  }
}, 300000); // Every 5 minutes

export async function classifyWithAI(
  sessionId: string,
  input: AIClassificationInput
): Promise<AIClassificationOutput | null> {
  // Check rate limit
  if (!checkRateLimit(sessionId)) {
    return null;
  }

  // Check for API key
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.warn('[AI Classifier] ANTHROPIC_API_KEY not set');
    return null;
  }

  try {
    const client = new Anthropic({ apiKey });

    const systemPrompt = `You are an assistant that classifies website visitor intent based on navigation patterns.

Rules:
- Only infer intent from navigation patterns, not identity
- Use observational language ("appears to", "may indicate", "suggests")
- Never use psychological terms ("confused", "frustrated", "wants")
- Keep reasons under 120 characters
- Return valid JSON only

Valid intent_label values: ${VALID_INTENTS.join(', ')}
Valid friction_type values: ${VALID_FRICTION.join(', ')}`;

    const userMessage = `Classify this session and refine the initial classification if needed.

Initial classification from rules:
- intent: ${input.rulesIntent}
- confidence: ${input.rulesConfidence}
- friction: ${input.rulesFriction.flag ? input.rulesFriction.type : 'none'}

Session data:
- referrer_category: ${input.referrerCategory}
- is_returning: ${input.isReturning}
- device: ${input.device}
- time_on_current_page_sec: ${input.timeOnCurrentPageSec}
- events (path, seconds from start):
${input.events.map(e => `  ${e.path} @ ${e.t}s`).join('\n')}

Return JSON with these exact fields:
{
  "intent_label": "one of the valid labels",
  "intent_confidence": 0.0-1.0,
  "intent_reason": "under 120 chars, observational tone",
  "friction_flag": true/false,
  "friction_type": "one of the valid types",
  "friction_reason": "under 140 chars if flag is true, empty if false"
}`;

    const response = await client.messages.create({
      model: 'claude-3-5-haiku-20241022',
      max_tokens: 256,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
    });

    // Extract text from response
    const textContent = response.content.find(c => c.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      return null;
    }

    // Parse JSON response
    const jsonMatch = textContent.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return null;
    }

    const parsed = JSON.parse(jsonMatch[0]);

    // Validate and sanitize response
    const intentLabel = VALID_INTENTS.includes(parsed.intent_label)
      ? parsed.intent_label
      : input.rulesIntent;

    const frictionType = VALID_FRICTION.includes(parsed.friction_type)
      ? parsed.friction_type
      : input.rulesFriction.type;

    return {
      intentLabel,
      intentConfidence: Math.min(1, Math.max(0, Number(parsed.intent_confidence) || input.rulesConfidence)),
      intentReason: String(parsed.intent_reason || '').substring(0, 120) || getIntentReason(intentLabel),
      frictionFlag: Boolean(parsed.friction_flag),
      frictionType,
      frictionReason: String(parsed.friction_reason || '').substring(0, 140) ||
        frictionReasonTemplates[frictionType] || '',
    };
  } catch (error) {
    console.error('[AI Classifier] Error:', error);
    return null;
  }
}

// Generate session summary using AI
export async function generateSessionSummary(
  projectId: string,
  data: {
    windowMinutes: number;
    activeVisitors: number;
    topPages: [string, number][];
    intents: [IntentLabel, number][];
    friction: [FrictionType, number][];
  }
): Promise<string[] | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return null;
  }

  try {
    const client = new Anthropic({ apiKey });

    const systemPrompt = `You summarize website visitor activity for founders.

Rules:
- Write 2-5 bullet points max
- Use plain language, not percentages
- Focus on what matters, not totals
- Be concise and observational
- No emojis, no urgency language`;

    const userMessage = `Summarize this ${data.windowMinutes}-minute window:

Active visitors: ${data.activeVisitors}
Top pages: ${data.topPages.map(([p, c]) => `${p} (${c})`).join(', ')}
Intent distribution: ${data.intents.map(([i, c]) => `${i}: ${c}`).join(', ')}
Friction detected: ${data.friction.filter(([t]) => t !== 'NONE').map(([t, c]) => `${t}: ${c}`).join(', ') || 'none'}

Return a JSON array of 2-5 bullet point strings. Example:
["Several visitors spending time on pricing.", "One session moved toward signup."]`;

    const response = await client.messages.create({
      model: 'claude-3-5-haiku-20241022',
      max_tokens: 256,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
    });

    const textContent = response.content.find(c => c.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      return null;
    }

    // Parse JSON array
    const jsonMatch = textContent.text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      return null;
    }

    const parsed = JSON.parse(jsonMatch[0]);
    if (!Array.isArray(parsed)) {
      return null;
    }

    return parsed.map(s => String(s)).slice(0, 5);
  } catch (error) {
    console.error('[AI Summary] Error:', error);
    return null;
  }
}
