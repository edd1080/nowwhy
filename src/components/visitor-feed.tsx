'use client';

import { useEffect, useState, useRef } from 'react';
import type { VisitorCard as VisitorCardType, SessionSummary } from '@/types';
import { VisitorCard } from './visitor-card';
import { EmptyState } from './empty-state';
import { ConnectionStatus } from './connection-status';
import { SessionSummaryPanel } from './session-summary';
import { SinceLastVisit } from './since-last-visit';
import { Activity } from 'lucide-react';

interface VisitorFeedProps {
  projectId: string;
  projectName: string;
}

interface StreamData {
  type: 'init' | 'update';
  sessions: VisitorCardType[];
  summary: SessionSummary;
}

export function VisitorFeed({ projectId, projectName }: VisitorFeedProps) {
  const [visitors, setVisitors] = useState<VisitorCardType[]>([]);
  const [summary, setSummary] = useState<SessionSummary | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  const [error, setError] = useState<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    function connect() {
      setConnectionStatus('connecting');
      setError(null);

      const eventSource = new EventSource(`/api/v1/stream?projectId=${projectId}`);
      eventSourceRef.current = eventSource;

      eventSource.onopen = () => {
        setConnectionStatus('connected');
      };

      eventSource.onmessage = (event) => {
        try {
          const data: StreamData = JSON.parse(event.data);
          setVisitors(data.sessions);
          setSummary(data.summary);
        } catch (e) {
          console.error('Failed to parse stream data:', e);
        }
      };

      eventSource.onerror = () => {
        setConnectionStatus('disconnected');
        eventSource.close();

        // Reconnect after 5 seconds
        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, 5000);
      };
    }

    connect();

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [projectId]);

  // Separate active, idle, and ended sessions
  const activeSessions = visitors.filter(v => v.status === 'active');
  const idleSessions = visitors.filter(v => v.status === 'idle');
  const endedSessions = visitors.filter(v => v.status === 'ended');

  return (
    <div className="h-full flex flex-col bg-slate-50">
      {/* Header */}
      <div className="flex-shrink-0 p-6 bg-white border-b border-slate-200">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div>
            <h1 className="text-xl font-semibold text-slate-900 tracking-tight">
              {projectName}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <Activity className="w-4 h-4 text-slate-500" />
              <p className="text-sm text-slate-600">
                Live visitor activity
              </p>
            </div>
          </div>
          <ConnectionStatus status={connectionStatus} />
        </div>
      </div>

      {/* Since last visit banner */}
      <SinceLastVisit projectId={projectId} />

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Visitor cards (left panel) */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="max-w-3xl mx-auto">
            {visitors.length === 0 ? (
              <EmptyState type="noVisitors" />
            ) : (
              <>
                {/* Active sessions */}
                {activeSessions.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 px-1">
                      <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Active now
                      </h2>
                      <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-medium">
                        {activeSessions.length}
                      </span>
                    </div>
                    {activeSessions.map((visitor) => (
                      <VisitorCard key={visitor.sessionId} visitor={visitor} />
                    ))}
                  </div>
                )}

                {/* Idle sessions */}
                {idleSessions.length > 0 && (
                  <div className="space-y-3 mt-8">
                    <div className="flex items-center gap-2 px-1">
                      <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Idle
                      </h2>
                      <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-slate-100 text-slate-600 text-xs font-medium">
                        {idleSessions.length}
                      </span>
                    </div>
                    {idleSessions.map((visitor) => (
                      <VisitorCard key={visitor.sessionId} visitor={visitor} />
                    ))}
                  </div>
                )}

                {/* Ended sessions (collapsed by default) */}
                {endedSessions.length > 0 && (
                  <details className="mt-8 group">
                    <summary className="flex items-center gap-2 px-1 cursor-pointer list-none">
                      <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider group-open:text-slate-600">
                        Recently ended
                      </h2>
                      <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-slate-100 text-slate-600 text-xs font-medium">
                        {endedSessions.length}
                      </span>
                    </summary>
                    <div className="space-y-3 mt-3">
                      {endedSessions.map((visitor) => (
                        <VisitorCard key={visitor.sessionId} visitor={visitor} />
                      ))}
                    </div>
                  </details>
                )}
              </>
            )}
          </div>
        </div>

        {/* Summary panel (right panel) */}
        <div className="w-96 flex-shrink-0 border-l border-slate-200 bg-white overflow-y-auto">
          <SessionSummaryPanel summary={summary} />
        </div>
      </div>

      {/* Footer - expectation setting */}
      <div className="flex-shrink-0 p-4 border-t border-slate-200 bg-white">
        <p className="text-xs text-slate-500 text-center tracking-tight">
          This shows what&apos;s happening right now. It&apos;s awareness, not analytics.
        </p>
      </div>
    </div>
  );
}
