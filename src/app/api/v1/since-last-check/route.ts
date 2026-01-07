import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const projectId = searchParams.get('projectId');
  const since = searchParams.get('since');

  if (!projectId || !since) {
    return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
  }

  // Verify user has access to this project
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: project } = await supabase
    .from('projects')
    .select('id')
    .eq('id', projectId)
    .eq('user_id', user.id)
    .single();

  if (!project) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  }

  try {
    // Get sessions since last check
    const { data: sessions } = await supabase
      .from('sessions')
      .select(`
        id,
        insights (intent_label, friction_flag)
      `)
      .eq('project_id', projectId)
      .gte('started_at', since);

    if (!sessions) {
      return NextResponse.json({
        highIntentSessions: 0,
        frictionDetected: 0,
        totalSessions: 0,
      });
    }

    let highIntentSessions = 0;
    let frictionDetected = 0;

    sessions.forEach(session => {
      const insights = (session.insights as any[]) || [];
      const hasHighIntent = insights.some(i => i.intent_label === 'HIGH_INTENT');
      const hasFriction = insights.some(i => i.friction_flag);

      if (hasHighIntent) highIntentSessions++;
      if (hasFriction) frictionDetected++;
    });

    return NextResponse.json({
      highIntentSessions,
      frictionDetected,
      totalSessions: sessions.length,
    });
  } catch (error) {
    console.error('Since last check error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
