import { createClient as createAdminClient } from '@supabase/supabase-js';
import type { DigestData, DigestFrequency, FrictionType, IntentLabel } from '@/types';

// Create admin client for server-side operations
function getAdminClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

interface DigestPreference {
  id: string;
  user_id: string;
  project_id: string;
  enabled: boolean;
  frequency: DigestFrequency;
  send_time: string;
  timezone: string;
  email: string | null;
  last_sent_at: string | null;
  projects: {
    id: string;
    name: string;
    domain: string;
  };
  users: {
    email: string;
  };
}

/**
 * Get all digest preferences that should be sent now
 */
export async function getDigestsToSend(): Promise<DigestPreference[]> {
  const supabase = getAdminClient();
  const now = new Date();

  // Get all enabled digest preferences
  const { data: prefs, error } = await supabase
    .from('digest_preferences')
    .select(`
      *,
      projects!inner(id, name, domain),
      users:user_id(email)
    `)
    .eq('enabled', true);

  if (error || !prefs) {
    console.error('Error fetching digest preferences:', error);
    return [];
  }

  // Filter based on send time and frequency
  return prefs.filter((pref: DigestPreference) => {
    return shouldSendDigest(pref, now);
  });
}

/**
 * Determine if a digest should be sent based on preferences and current time
 */
function shouldSendDigest(pref: DigestPreference, now: Date): boolean {
  const [sendHour, sendMinute] = pref.send_time.split(':').map(Number);

  // Get current time in user's timezone
  const userTime = new Date(now.toLocaleString('en-US', { timeZone: pref.timezone }));
  const currentHour = userTime.getHours();
  const currentMinute = userTime.getMinutes();

  // Check if we're within the send window (within 30 minutes of send time)
  const isWithinSendWindow =
    currentHour === sendHour &&
    currentMinute >= sendMinute &&
    currentMinute < sendMinute + 30;

  if (!isWithinSendWindow) return false;

  // Check if already sent today/this week
  if (pref.last_sent_at) {
    const lastSent = new Date(pref.last_sent_at);
    const hoursSinceLastSent = (now.getTime() - lastSent.getTime()) / (1000 * 60 * 60);

    if (pref.frequency === 'daily' && hoursSinceLastSent < 20) {
      return false; // Already sent within last 20 hours
    }

    if (pref.frequency === 'weekly' && hoursSinceLastSent < 144) {
      return false; // Already sent within last 6 days
    }
  }

  // For weekly digests, only send on Monday
  if (pref.frequency === 'weekly') {
    const dayOfWeek = userTime.getDay();
    if (dayOfWeek !== 1) return false; // 1 = Monday
  }

  return true;
}

/**
 * Generate digest data for a project
 */
export async function generateDigestData(
  projectId: string,
  projectName: string,
  projectDomain: string,
  frequency: DigestFrequency
): Promise<DigestData> {
  const supabase = getAdminClient();

  const now = new Date();
  const periodStart = new Date(now);

  if (frequency === 'daily') {
    periodStart.setHours(periodStart.getHours() - 24);
  } else {
    periodStart.setDate(periodStart.getDate() - 7);
  }

  // Fetch sessions in period
  const { data: sessions } = await supabase
    .from('sessions')
    .select('*')
    .eq('project_id', projectId)
    .gte('started_at', periodStart.toISOString())
    .lte('started_at', now.toISOString());

  // Fetch insights for these sessions
  const sessionIds = sessions?.map(s => s.id) || [];
  const { data: insights } = await supabase
    .from('insights')
    .select('*')
    .eq('project_id', projectId)
    .in('session_id', sessionIds);

  // Fetch events for top pages
  const { data: events } = await supabase
    .from('events')
    .select('path')
    .eq('project_id', projectId)
    .eq('type', 'pageview')
    .gte('timestamp', periodStart.toISOString())
    .lte('timestamp', now.toISOString());

  // Count unique visitors
  const uniqueVisitors = new Set(sessions?.map(s => s.visitor_id) || []).size;

  // Calculate average session duration
  const sessionDurations = sessions?.map(s => {
    const started = new Date(s.started_at).getTime();
    const ended = new Date(s.last_activity_at).getTime();
    return (ended - started) / 1000; // seconds
  }) || [];

  const avgSessionDuration = sessionDurations.length > 0
    ? sessionDurations.reduce((a, b) => a + b, 0) / sessionDurations.length
    : 0;

  // Count intents
  const intentCounts: Record<IntentLabel, number> = {
    HIGH_INTENT: 0,
    SIGNUP_ATTEMPT: 0,
    EVALUATING_PRICING: 0,
    EVALUATING_PRODUCT: 0,
    DISCOVERY_CONTENT: 0,
    BOUNCE_RISK: 0,
    UNCLEAR: 0,
  };

  insights?.forEach(i => {
    intentCounts[i.intent_label as IntentLabel]++;
  });

  // Count friction
  const frictionByType: Record<FrictionType, number> = {
    PRICING_LOOP: 0,
    NAV_LOOP: 0,
    FORM_STALL: 0,
    CTA_DROP: 0,
    NONE: 0,
  };

  insights?.filter(i => i.friction_flag).forEach(i => {
    frictionByType[i.friction_type as FrictionType]++;
  });

  const totalFriction = Object.entries(frictionByType)
    .filter(([type]) => type !== 'NONE')
    .reduce((sum, [, count]) => sum + count, 0);

  // Calculate top pages
  const pageCounts: Record<string, number> = {};
  events?.forEach(e => {
    pageCounts[e.path] = (pageCounts[e.path] || 0) + 1;
  });

  const topPages = Object.entries(pageCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([path, views]) => ({ path, views }));

  // Generate plain-English insights
  const insightsList = generateInsights({
    totalSessions: sessions?.length || 0,
    uniqueVisitors,
    intentCounts,
    totalFriction,
    frictionByType,
    topPages,
    frequency,
  });

  return {
    projectName,
    projectDomain,
    period: {
      start: periodStart,
      end: now,
      label: frequency === 'daily' ? 'Last 24 hours' : 'Last 7 days',
    },
    stats: {
      totalSessions: sessions?.length || 0,
      uniqueVisitors,
      avgSessionDuration: Math.round(avgSessionDuration),
    },
    intents: {
      highIntent: intentCounts.HIGH_INTENT,
      signupAttempts: intentCounts.SIGNUP_ATTEMPT,
      pricingEvaluations: intentCounts.EVALUATING_PRICING,
      bounceRisk: intentCounts.BOUNCE_RISK,
    },
    friction: {
      total: totalFriction,
      byType: Object.entries(frictionByType)
        .filter(([type]) => type !== 'NONE')
        .filter(([, count]) => count > 0)
        .map(([type, count]) => ({ type: type as FrictionType, count })),
    },
    topPages,
    insights: insightsList,
  };
}

interface InsightGeneratorInput {
  totalSessions: number;
  uniqueVisitors: number;
  intentCounts: Record<IntentLabel, number>;
  totalFriction: number;
  frictionByType: Record<FrictionType, number>;
  topPages: { path: string; views: number }[];
  frequency: DigestFrequency;
}

/**
 * Generate plain-English insights from the data
 * Following the UX Copy Constitution - observational, calm, founder-to-founder
 */
function generateInsights(data: InsightGeneratorInput): string[] {
  const insights: string[] = [];
  const period = data.frequency === 'daily' ? 'today' : 'this week';

  // Session overview
  if (data.totalSessions === 0) {
    insights.push(`No visitor activity ${period}.`);
    return insights;
  }

  // High intent visitors
  if (data.intentCounts.HIGH_INTENT > 0) {
    const count = data.intentCounts.HIGH_INTENT;
    insights.push(
      count === 1
        ? `One visitor showed strong intent signals ${period}.`
        : `${count} visitors showed strong intent signals ${period}.`
    );
  }

  // Signup attempts
  if (data.intentCounts.SIGNUP_ATTEMPT > 0) {
    const count = data.intentCounts.SIGNUP_ATTEMPT;
    insights.push(
      count === 1
        ? `One visitor appeared to be signing up.`
        : `${count} visitors appeared to be going through signup.`
    );
  }

  // Pricing evaluations
  if (data.intentCounts.EVALUATING_PRICING > 0) {
    const count = data.intentCounts.EVALUATING_PRICING;
    insights.push(
      count === 1
        ? `One visitor spent time on pricing.`
        : `${count} visitors spent time evaluating pricing.`
    );
  }

  // Friction detected
  if (data.totalFriction > 0) {
    const frictionTypes: string[] = [];

    if (data.frictionByType.PRICING_LOOP > 0) {
      frictionTypes.push('pricing revisits');
    }
    if (data.frictionByType.FORM_STALL > 0) {
      frictionTypes.push('form pauses');
    }
    if (data.frictionByType.NAV_LOOP > 0) {
      frictionTypes.push('navigation loops');
    }
    if (data.frictionByType.CTA_DROP > 0) {
      frictionTypes.push('CTA exits');
    }

    if (frictionTypes.length > 0) {
      insights.push(
        `Some friction detected: ${frictionTypes.join(', ')}.`
      );
    }
  }

  // Top page insight
  if (data.topPages.length > 0 && data.topPages[0].views > 1) {
    const topPage = data.topPages[0];
    insights.push(
      `Most visited page: ${topPage.path} (${topPage.views} views).`
    );
  }

  // Bounce risk
  if (data.intentCounts.BOUNCE_RISK > data.totalSessions * 0.3) {
    insights.push(
      `A notable portion of visits were brief. May be worth reviewing landing pages.`
    );
  }

  return insights;
}

/**
 * Mark a digest as sent
 */
export async function markDigestSent(digestPrefId: string): Promise<void> {
  const supabase = getAdminClient();

  await supabase
    .from('digest_preferences')
    .update({ last_sent_at: new Date().toISOString() })
    .eq('id', digestPrefId);
}
