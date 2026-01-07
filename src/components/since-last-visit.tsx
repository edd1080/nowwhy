'use client';

import { useEffect, useState } from 'react';
import { sinceLastCheckTemplates } from '@/lib/copy-templates';

interface SinceLastVisitProps {
  projectId: string;
}

interface SinceLastVisitData {
  highIntentSessions: number;
  frictionDetected: number;
  totalSessions: number;
  lastCheckedAt: Date | null;
}

export function SinceLastVisit({ projectId }: SinceLastVisitProps) {
  const [data, setData] = useState<SinceLastVisitData | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Get last checked timestamp from localStorage
    const key = `nowwhy_last_checked_${projectId}`;
    const lastChecked = localStorage.getItem(key);
    const lastCheckedAt = lastChecked ? new Date(lastChecked) : null;

    // Update last checked to now
    localStorage.setItem(key, new Date().toISOString());

    // If never checked before or checked very recently, don't show
    if (!lastCheckedAt || Date.now() - lastCheckedAt.getTime() < 60000) {
      return;
    }

    // Fetch data since last check
    fetch(`/api/v1/since-last-check?projectId=${projectId}&since=${lastCheckedAt.toISOString()}`)
      .then(res => res.json())
      .then(result => {
        if (result.totalSessions > 0) {
          setData({
            ...result,
            lastCheckedAt,
          });
        }
      })
      .catch(() => {
        // Silently fail
      });
  }, [projectId]);

  if (!data || dismissed) {
    return null;
  }

  const summaryText = sinceLastCheckTemplates.summary(
    data.highIntentSessions,
    data.frictionDetected,
    data.totalSessions
  );

  return (
    <div className="flex-shrink-0 px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-600 dark:text-slate-300">
          {summaryText}
        </p>
        <button
          onClick={() => setDismissed(true)}
          className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
          aria-label="Dismiss"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
