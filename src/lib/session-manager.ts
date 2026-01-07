/**
 * Session Manager
 * Handles real-time session state, classification, and updates
 */

import { createServiceClient } from '@/lib/supabase/server';
import { classifySession, type ClassificationResult } from '@/lib/rules-engine';
import { classifyWithAI } from '@/lib/ai-classifier';
import { getIntentReason, frictionReasonTemplates } from '@/lib/copy-templates';
import { processSessionAlerts } from '@/lib/alert-service';
import type { VisitorCard, SessionSummary, IntentLabel, FrictionType } from '@/types';

// Get active sessions for a project
export async function getActiveSessions(projectId: string): Promise<VisitorCard[]> {
  const supabase = createServiceClient();

  // Get sessions active in last 10 minutes
  const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();

  // Fetch sessions with visitor data
  const { data: sessions, error } = await supabase
    .from('sessions')
    .select(`
      *,
      visitors!inner (country, city, device)
    `)
    .eq('project_id', projectId)
    .gte('last_activity_at', tenMinutesAgo)
    .order('last_activity_at', { ascending: false })
    .limit(100);

  if (error || !sessions) {
    console.error('Error fetching sessions:', error);
    return [];
  }

  if (sessions.length === 0) {
    return [];
  }

  // Group by visitor and keep only the most recent session per visitor
  const sessionsByVisitor = new Map<string, typeof sessions[0]>();
  for (const session of sessions) {
    if (!sessionsByVisitor.has(session.visitor_id)) {
      sessionsByVisitor.set(session.visitor_id, session);
    }
  }

  // Use deduplicated sessions
  const uniqueSessions = Array.from(sessionsByVisitor.values()).slice(0, 50);

  // Get session IDs for fetching related data
  const sessionIds = uniqueSessions.map(s => s.id);

  // Fetch events for all sessions
  const { data: allEvents } = await supabase
    .from('events')
    .select('session_id, path, timestamp, time_on_page')
    .eq('project_id', projectId)
    .in('session_id', sessionIds)
    .order('timestamp', { ascending: false });

  // Fetch insights for all sessions
  const { data: allInsights } = await supabase
    .from('insights')
    .select('session_id, intent_label, intent_confidence, intent_reason, friction_flag, friction_type, friction_reason, generated_at')
    .eq('project_id', projectId)
    .in('session_id', sessionIds)
    .order('generated_at', { ascending: false });

  // Group events and insights by session
  const eventsBySession = new Map<string, any[]>();
  const insightsBySession = new Map<string, any[]>();

  (allEvents || []).forEach(e => {
    const list = eventsBySession.get(e.session_id) || [];
    list.push(e);
    eventsBySession.set(e.session_id, list);
  });

  (allInsights || []).forEach(i => {
    const list = insightsBySession.get(i.session_id) || [];
    list.push(i);
    insightsBySession.set(i.session_id, list);
  });

  // Filter and map sessions
  const cards = uniqueSessions.map(session => {
    const events = eventsBySession.get(session.id) || [];
    const insights = insightsBySession.get(session.id) || [];
    const latestInsight = insights[0]; // Already sorted desc
    const visitor = session.visitors as any;

    // Calculate time on current page
    const sortedEvents = [...events].sort((a, b) =>
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    const latestEvent = sortedEvents[0];
    const timeOnPage = latestEvent
      ? Date.now() - new Date(latestEvent.timestamp).getTime()
      : 0;

    // Calculate session duration
    const sessionDuration = Date.now() - new Date(session.started_at).getTime();

    // Determine session status
    const lastActivity = new Date(session.last_activity_at).getTime();
    const now = Date.now();
    let status: 'active' | 'idle' | 'ended' = 'active';
    if (now - lastActivity > 5 * 60 * 1000) {
      status = 'ended';
    } else if (now - lastActivity > 60 * 1000) {
      status = 'idle';
    }

    return {
      sessionId: session.id,
      visitorId: session.visitor_id,
      isReturning: session.is_returning,
      country: visitor?.country || null,
      city: visitor?.city || null,
      currentPage: latestEvent?.path || '/',
      timeOnPage,
      sessionDuration,
      referrer: session.referrer,
      referrerCategory: session.referrer_category,
      device: visitor?.device || 'desktop',
      pageCount: session.page_count,
      status,
      intent: latestInsight
        ? {
            label: latestInsight.intent_label,
            confidence: latestInsight.intent_confidence,
            reason: latestInsight.intent_reason,
          }
        : {
            label: 'UNCLEAR' as IntentLabel,
            confidence: 0.5,
            reason: 'Observing behavior...',
          },
      friction: latestInsight?.friction_flag
        ? {
            flag: true,
            type: latestInsight.friction_type,
            reason: latestInsight.friction_reason,
          }
        : null,
      lastActivity: new Date(session.last_activity_at),
    } as VisitorCard;
  });

  // Filter out ended sessions (keep only active and idle)
  return cards.filter(card => card.status !== 'ended');
}

// Process a session and generate/update insights
export async function processSession(
  projectId: string,
  sessionId: string
): Promise<ClassificationResult | null> {
  const supabase = createServiceClient();

  // Get session with visitor
  const { data: session, error } = await supabase
    .from('sessions')
    .select(`
      *,
      visitors!inner (device, country, city)
    `)
    .eq('id', sessionId)
    .eq('project_id', projectId)
    .single();

  if (error || !session) {
    console.error('Failed to fetch session for classification:', error);
    return null;
  }

  // Fetch events separately (no FK relationship)
  const { data: eventData } = await supabase
    .from('events')
    .select('path, timestamp, time_on_page')
    .eq('session_id', sessionId)
    .eq('project_id', projectId)
    .order('timestamp', { ascending: true });

  const events = (eventData || []).map(e => ({
    path: e.path,
    timestamp: new Date(e.timestamp),
    timeOnPage: e.time_on_page,
  }));

  // Run rules engine
  const rulesResult = classifySession({
    events,
    referrerCategory: session.referrer_category,
    isReturning: session.is_returning,
    device: (session.visitors as any)?.device || 'desktop',
    sessionDurationMs: Date.now() - new Date(session.started_at).getTime(),
  });

  let finalResult = rulesResult;

  // Call AI if needed
  if (rulesResult.needsAI && events.length >= 3) {
    const startTime = new Date(session.started_at).getTime();
    const aiInput = {
      rulesIntent: rulesResult.intentLabel,
      rulesConfidence: rulesResult.intentConfidence,
      rulesFriction: { flag: rulesResult.frictionFlag, type: rulesResult.frictionType },
      referrerCategory: session.referrer_category,
      events: events.map(e => ({
        path: e.path,
        t: Math.round((e.timestamp.getTime() - startTime) / 1000),
      })),
      timeOnCurrentPageSec: events.length > 0
        ? Math.round((Date.now() - events[events.length - 1].timestamp.getTime()) / 1000)
        : 0,
      isReturning: session.is_returning,
      device: (session.visitors as any)?.device || 'desktop',
    };

    const aiResult = await classifyWithAI(sessionId, aiInput);
    if (aiResult) {
      finalResult = {
        ...aiResult,
        needsAI: false,
      };
    }
  }

  // Save insight to database
  await supabase.from('insights').insert({
    session_id: sessionId,
    project_id: projectId,
    intent_label: finalResult.intentLabel,
    intent_confidence: finalResult.intentConfidence,
    intent_reason: finalResult.intentReason,
    friction_flag: finalResult.frictionFlag,
    friction_type: finalResult.frictionType,
    friction_reason: finalResult.frictionReason,
    ai_used: rulesResult.needsAI,
  });

  // Check if alerts should be sent (only for HIGH_INTENT or friction)
  if (finalResult.intentLabel === 'HIGH_INTENT' || finalResult.frictionFlag) {
    const latestEvent = events[events.length - 1];
    const visitor = (session.visitors as any);

    // Build minimal VisitorCard for alert
    const visitorCard: VisitorCard = {
      sessionId,
      visitorId: session.visitor_id,
      isReturning: session.is_returning,
      country: visitor?.country || null,
      city: visitor?.city || null,
      currentPage: latestEvent?.path || '/',
      timeOnPage: latestEvent ? Date.now() - latestEvent.timestamp.getTime() : 0,
      sessionDuration: Date.now() - new Date(session.started_at).getTime(),
      referrer: session.referrer,
      referrerCategory: session.referrer_category,
      device: visitor?.device || 'desktop',
      pageCount: session.page_count || events.length,
      status: 'active',
      intent: {
        label: finalResult.intentLabel,
        confidence: finalResult.intentConfidence,
        reason: finalResult.intentReason,
      },
      friction: finalResult.frictionFlag
        ? {
            flag: true,
            type: finalResult.frictionType,
            reason: finalResult.frictionReason,
          }
        : null,
      lastActivity: new Date(),
    };

    // Process alerts asynchronously
    processSessionAlerts(projectId, visitorCard).catch(err => {
      console.error('Alert processing error:', err);
    });
  }

  return finalResult;
}

// Get session summary for last N minutes
export async function getSessionSummary(
  projectId: string,
  windowMinutes: number = 10
): Promise<SessionSummary> {
  const supabase = createServiceClient();
  const windowStart = new Date(Date.now() - windowMinutes * 60 * 1000).toISOString();

  // Get sessions in window
  const { data: sessions } = await supabase
    .from('sessions')
    .select('id')
    .eq('project_id', projectId)
    .gte('last_activity_at', windowStart);

  if (!sessions || sessions.length === 0) {
    return {
      windowMinutes,
      activeVisitors: 0,
      topPages: [],
      intents: [],
      friction: [],
      summaryText: [],
    };
  }

  const sessionIds = sessions.map(s => s.id);

  // Fetch events for all sessions
  const { data: allEvents } = await supabase
    .from('events')
    .select('session_id, path')
    .eq('project_id', projectId)
    .in('session_id', sessionIds);

  // Fetch insights for all sessions
  const { data: allInsights } = await supabase
    .from('insights')
    .select('session_id, intent_label, friction_flag, friction_type, generated_at')
    .eq('project_id', projectId)
    .in('session_id', sessionIds)
    .order('generated_at', { ascending: false });

  // Calculate top pages
  const pageCounts = new Map<string, number>();
  (allEvents || []).forEach(e => {
    pageCounts.set(e.path, (pageCounts.get(e.path) || 0) + 1);
  });
  const topPages = Array.from(pageCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5) as [string, number][];

  // Group insights by session to get latest per session
  const latestInsightBySession = new Map<string, any>();
  (allInsights || []).forEach(i => {
    if (!latestInsightBySession.has(i.session_id)) {
      latestInsightBySession.set(i.session_id, i);
    }
  });

  // Calculate intent distribution
  const intentCounts = new Map<IntentLabel, number>();
  latestInsightBySession.forEach(insight => {
    const label = insight.intent_label as IntentLabel;
    intentCounts.set(label, (intentCounts.get(label) || 0) + 1);
  });
  const intents = Array.from(intentCounts.entries()) as [IntentLabel, number][];

  // Calculate friction distribution
  const frictionCounts = new Map<FrictionType, number>();
  (allInsights || []).forEach(i => {
    if (i.friction_flag) {
      frictionCounts.set(i.friction_type, (frictionCounts.get(i.friction_type) || 0) + 1);
    }
  });
  const friction = Array.from(frictionCounts.entries()) as [FrictionType, number][];

  // Generate summary text
  const summaryText: string[] = [];

  const highIntent = intentCounts.get('HIGH_INTENT') || 0;
  const evaluatingPricing = intentCounts.get('EVALUATING_PRICING') || 0;
  const signupAttempt = intentCounts.get('SIGNUP_ATTEMPT') || 0;

  if (highIntent > 0) {
    summaryText.push(
      highIntent === 1
        ? 'One visitor showing strong engagement with conversion pages.'
        : `${highIntent} visitors showing strong engagement with conversion pages.`
    );
  }

  if (evaluatingPricing > 0) {
    summaryText.push(
      evaluatingPricing === 1
        ? 'One visitor spending time on pricing.'
        : `${evaluatingPricing} visitors spending time on pricing.`
    );
  }

  if (signupAttempt > 0) {
    summaryText.push(
      signupAttempt === 1
        ? 'One visitor in the signup flow.'
        : `${signupAttempt} visitors in the signup flow.`
    );
  }

  const totalFriction = Array.from(frictionCounts.values()).reduce((a, b) => a + b, 0);
  if (totalFriction > 0) {
    summaryText.push(
      totalFriction === 1
        ? 'One session showing possible friction.'
        : `${totalFriction} sessions showing possible friction.`
    );
  }

  if (summaryText.length === 0 && sessions.length > 0) {
    summaryText.push(`${sessions.length} active sessions in the last ${windowMinutes} minutes.`);
  }

  return {
    windowMinutes,
    activeVisitors: sessions.length,
    topPages,
    intents,
    friction,
    summaryText,
  };
}
