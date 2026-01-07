import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { getGeoFromHeaders } from '@/lib/geoip';
import { categorizeReferrer } from '@/lib/referrer';
import { checkRateLimit, eventIngestionRateLimit } from '@/lib/rate-limit';
import { processSession } from '@/lib/session-manager';
import type { EventBatch, TrackerEvent, PageviewEvent } from '@/types';

// CORS headers for tracker script
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

// Handle preflight requests
export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function POST(request: Request) {
  try {
    // Parse the request body
    const body: EventBatch = await request.json();

    // Validate required fields
    if (!body.project_key || !body.events || !Array.isArray(body.events)) {
      return NextResponse.json(
        { ok: false, error: 'Invalid request body' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Rate limit check
    const rateLimitResult = checkRateLimit(body.project_key, eventIngestionRateLimit);
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { ok: false, error: 'Rate limit exceeded' },
        {
          status: 429,
          headers: {
            ...corsHeaders,
            'Retry-After': Math.ceil((rateLimitResult.resetAt - Date.now()) / 1000).toString(),
          },
        }
      );
    }

    // Get Supabase client (service role to bypass RLS for ingestion)
    const supabase = createServiceClient();

    // Validate project key exists
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id, domain')
      .eq('public_key', body.project_key)
      .single();

    if (projectError || !project) {
      return NextResponse.json(
        { ok: false, error: 'Invalid project key' },
        { status: 401, headers: corsHeaders }
      );
    }

    // Get geo data from headers (resolved at ingestion time)
    const geo = getGeoFromHeaders(request.headers);

    // Track unique session IDs for classification
    const sessionIds = new Set<string>();

    // Process events
    for (const event of body.events) {
      await processEvent(supabase, project.id, event, geo);
      if (event.session_id) {
        sessionIds.add(event.session_id);
      }
    }

    // Run classification for each session (async, don't block response)
    for (const sessionId of sessionIds) {
      processSession(project.id, sessionId).catch(err => {
        console.error('Session classification error:', err);
      });
    }

    return NextResponse.json({ ok: true }, { headers: corsHeaders });
  } catch (error) {
    console.error('Event ingestion error:', error);
    return NextResponse.json(
      { ok: false, error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    );
  }
}

async function processEvent(
  supabase: ReturnType<typeof createServiceClient>,
  projectId: string,
  event: TrackerEvent,
  geo: { country: string | null; city: string | null }
) {
  const now = new Date().toISOString();

  if (event.type === 'pageview') {
    await processPageview(supabase, projectId, event as PageviewEvent, geo, now);
  } else if (event.type === 'engagement') {
    await processEngagement(supabase, projectId, event, now);
  }
}

async function processPageview(
  supabase: ReturnType<typeof createServiceClient>,
  projectId: string,
  event: PageviewEvent,
  geo: { country: string | null; city: string | null },
  now: string
) {
  // Upsert visitor
  const { error: visitorError } = await supabase
    .from('visitors')
    .upsert(
      {
        id: event.visitor_id,
        project_id: projectId,
        first_seen: now,
        last_seen: now,
        country: geo.country,
        city: geo.city,
        device: event.device,
      },
      {
        onConflict: 'id,project_id',
        ignoreDuplicates: false,
      }
    );

  if (visitorError) {
    console.error('Visitor upsert error:', visitorError);
  }

  // Update last_seen for existing visitors
  await supabase
    .from('visitors')
    .update({ last_seen: now })
    .eq('id', event.visitor_id)
    .eq('project_id', projectId);

  // Check if this session already exists
  const { data: existingSession } = await supabase
    .from('sessions')
    .select('id, is_returning')
    .eq('id', event.session_id)
    .eq('project_id', projectId)
    .single();

  // Categorize referrer
  const referrerCategory = categorizeReferrer(event.referrer);

  if (existingSession) {
    // Update existing session
    const { error: sessionError } = await supabase
      .from('sessions')
      .update({
        last_activity_at: now,
        status: 'active',
      })
      .eq('id', event.session_id)
      .eq('project_id', projectId);

    if (sessionError) {
      console.error('Session update error:', sessionError);
    }
  } else {
    // Check if visitor is returning (has previous sessions)
    const { count: previousSessions } = await supabase
      .from('sessions')
      .select('*', { count: 'exact', head: true })
      .eq('visitor_id', event.visitor_id)
      .eq('project_id', projectId);

    const isReturning = (previousSessions || 0) > 0;

    // Insert new session
    const { error: sessionError } = await supabase
      .from('sessions')
      .insert({
        id: event.session_id,
        visitor_id: event.visitor_id,
        project_id: projectId,
        started_at: now,
        last_activity_at: now,
        referrer: event.referrer || null,
        referrer_category: referrerCategory,
        is_returning: isReturning,
        page_count: 1,
        status: 'active',
      });

    if (sessionError) {
      console.error('Session insert error:', sessionError);
    }
  }

  // Increment page count for existing sessions
  if (existingSession) {
    try {
      await supabase.rpc('increment_page_count', {
        p_session_id: event.session_id,
        p_project_id: projectId,
      });
    } catch {
      // If RPC doesn't exist, increment manually
      const { data: session } = await supabase
        .from('sessions')
        .select('page_count')
        .eq('id', event.session_id)
        .eq('project_id', projectId)
        .single();

      if (session) {
        await supabase
          .from('sessions')
          .update({ page_count: (session.page_count || 0) + 1 })
          .eq('id', event.session_id)
          .eq('project_id', projectId);
      }
    }
  }

  // Insert event
  const { error: eventError } = await supabase.from('events').insert({
    session_id: event.session_id,
    project_id: projectId,
    type: 'pageview',
    path: event.url_path,
    timestamp: new Date(event.ts).toISOString(),
    title: event.title || null,
    viewport_width: event.viewport?.w || null,
    viewport_height: event.viewport?.h || null,
  });

  if (eventError) {
    console.error('Event insert error:', eventError);
  }
}

async function processEngagement(
  supabase: ReturnType<typeof createServiceClient>,
  projectId: string,
  event: TrackerEvent & { type: 'engagement' },
  now: string
) {
  // Update session activity
  await supabase
    .from('sessions')
    .update({
      last_activity_at: now,
      status: 'active',
    })
    .eq('id', event.session_id)
    .eq('project_id', projectId);

  // Insert engagement event
  await supabase.from('events').insert({
    session_id: event.session_id,
    project_id: projectId,
    type: 'engagement',
    path: event.url_path,
    timestamp: new Date(event.ts).toISOString(),
  });
}
