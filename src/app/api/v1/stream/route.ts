import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getActiveSessions, getSessionSummary } from '@/lib/session-manager';

// SSE stream for real-time visitor updates
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const projectId = searchParams.get('projectId');

  if (!projectId) {
    return new Response('Missing projectId', { status: 400 });
  }

  // Verify user has access to this project
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return new Response('Unauthorized', { status: 401 });
  }

  const { data: project } = await supabase
    .from('projects')
    .select('id')
    .eq('id', projectId)
    .eq('user_id', user.id)
    .single();

  if (!project) {
    return new Response('Project not found', { status: 404 });
  }

  // Create SSE stream
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      // Send initial data
      try {
        const sessions = await getActiveSessions(projectId);
        const summary = await getSessionSummary(projectId, 10);

        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: 'init', sessions, summary })}\n\n`)
        );
      } catch (error) {
        console.error('SSE init error:', error);
      }

      // Poll for updates every 5 seconds
      const interval = setInterval(async () => {
        try {
          const sessions = await getActiveSessions(projectId);
          const summary = await getSessionSummary(projectId, 10);

          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: 'update', sessions, summary })}\n\n`)
          );
        } catch (error) {
          console.error('SSE update error:', error);
        }
      }, 5000);

      // Handle client disconnect
      request.signal.addEventListener('abort', () => {
        clearInterval(interval);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
