// Intent labels (locked MVP list)
export type IntentLabel =
  | 'DISCOVERY_CONTENT'
  | 'EVALUATING_PRODUCT'
  | 'EVALUATING_PRICING'
  | 'SIGNUP_ATTEMPT'
  | 'HIGH_INTENT'
  | 'BOUNCE_RISK'
  | 'UNCLEAR';

// Friction types (locked MVP list)
export type FrictionType =
  | 'PRICING_LOOP'
  | 'NAV_LOOP'
  | 'FORM_STALL'
  | 'CTA_DROP'
  | 'NONE';

// Referrer categories
export type ReferrerCategory =
  | 'DIRECT'
  | 'SEARCH'
  | 'SOCIAL'
  | 'PAID'
  | 'REFERRAL'
  | 'UNKNOWN';

// Device types
export type DeviceType = 'mobile' | 'desktop' | 'tablet';

// Session status
export type SessionStatus = 'active' | 'idle' | 'ended';

// Event types from tracker
export interface PageviewEvent {
  type: 'pageview';
  ts: number;
  project_key: string;
  visitor_id: string;
  session_id: string;
  url_path: string;
  url_query_keys?: string[];
  referrer?: string;
  title?: string;
  viewport?: { w: number; h: number };
  device: DeviceType;
  tz_offset_min: number;
  lang: string;
  dnt: boolean;
  mask_applied?: boolean;
}

export interface EngagementEvent {
  type: 'engagement';
  ts: number;
  project_key: string;
  visitor_id: string;
  session_id: string;
  url_path: string;
  visible: boolean;
  idle_ms: number;
}

export type TrackerEvent = PageviewEvent | EngagementEvent;

// Batch payload from tracker
export interface EventBatch {
  v: number;
  project_key: string;
  sent_at: number;
  events: TrackerEvent[];
}

// Visitor card data (for UI)
export interface VisitorCard {
  sessionId: string;
  visitorId: string;
  isReturning: boolean;
  country: string;
  city: string;
  currentPage: string;
  timeOnPage: number;
  sessionDuration: number;
  referrer: string | null;
  referrerCategory: ReferrerCategory;
  device: DeviceType;
  pageCount: number;
  status: SessionStatus;
  intent: {
    label: IntentLabel;
    confidence: number;
    reason: string;
  };
  friction: {
    flag: boolean;
    type: FrictionType;
    reason: string;
  } | null;
  lastActivity: Date;
}

// Session summary (for UI)
export interface SessionSummary {
  windowMinutes: number;
  activeVisitors: number;
  topPages: [string, number][];
  intents: [IntentLabel, number][];
  friction: [FrictionType, number][];
  summaryText: string[];
}

// "Since you last checked" data
export interface SinceLastVisit {
  lastCheckedAt: Date;
  highIntentSessions: number;
  frictionDetected: number;
  totalSessions: number;
}

// Alert types
export type AlertType =
  | 'HIGH_INTENT'
  | 'FRICTION_DETECTED'
  | 'TRAFFIC_SPIKE'
  | 'RETURNING_VIP';

export type AlertDeliveryMode = 'instant' | 'batched';

export interface AlertConfig {
  type: AlertType;
  enabled: boolean;
  deliveryMode: AlertDeliveryMode;
  threshold?: number;
}

// Project
export interface Project {
  id: string;
  name: string;
  domain: string;
  publicKey: string;
  userId: string;
  createdAt: Date;
  alertConfigs: AlertConfig[];
}

// Confidence calibration levels (for copy generation)
export type ConfidenceLevel = 1 | 2 | 3 | 4;

// AI classification input
export interface ClassificationInput {
  rulesIntent: IntentLabel;
  rulesConfidence: number;
  rulesFriction: { flag: boolean; type: FrictionType };
  referrerCategory: ReferrerCategory;
  events: { path: string; t: number }[];
  timeOnCurrentPageSec: number;
  isReturning: boolean;
  device: DeviceType;
}

// AI classification output
export interface ClassificationOutput {
  intentLabel: IntentLabel;
  intentConfidence: number;
  intentReason: string;
  frictionFlag: boolean;
  frictionType: FrictionType;
  frictionReason: string;
}

// Digest frequency options
export type DigestFrequency = 'daily' | 'weekly';

// Digest preferences
export interface DigestPreferences {
  id: string;
  userId: string;
  projectId: string;
  enabled: boolean;
  frequency: DigestFrequency;
  sendTime: string; // HH:MM format
  timezone: string;
  email: string | null;
  lastSentAt: Date | null;
}

// Digest data for email content
export interface DigestData {
  projectName: string;
  projectDomain: string;
  period: {
    start: Date;
    end: Date;
    label: string; // "Last 24 hours" or "Last 7 days"
  };
  stats: {
    totalSessions: number;
    uniqueVisitors: number;
    avgSessionDuration: number; // seconds
  };
  intents: {
    highIntent: number;
    signupAttempts: number;
    pricingEvaluations: number;
    bounceRisk: number;
  };
  friction: {
    total: number;
    byType: { type: FrictionType; count: number; }[];
  };
  topPages: { path: string; views: number; }[];
  insights: string[]; // Plain-English observations
}
