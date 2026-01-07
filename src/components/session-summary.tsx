'use client';

import type { SessionSummary } from '@/types';
import { emptyStateMessages } from '@/lib/copy-templates';
import {
  TrendingUp,
  FileText,
  AlertTriangle,
  Target,
  Clock,
  BarChart3,
  Activity
} from 'lucide-react';

interface SessionSummaryPanelProps {
  summary: SessionSummary | null;
}

export function SessionSummaryPanel({ summary }: SessionSummaryPanelProps) {
  if (!summary) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-slate-200 rounded w-3/4" />
          <div className="h-4 bg-slate-200 rounded w-1/2" />
          <div className="h-4 bg-slate-200 rounded w-2/3" />
        </div>
      </div>
    );
  }

  const hasFriction = summary.friction.some(([type]) => type !== 'NONE');

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="pb-4 border-b border-slate-200">
        <div className="flex items-center gap-2 mb-2">
          <Clock className="w-4 h-4 text-slate-500" />
          <h2 className="text-sm font-semibold text-slate-900 tracking-tight">
            Last {summary.windowMinutes} minutes
          </h2>
        </div>
        <p className="text-sm text-slate-600">
          <span className="font-semibold text-slate-900">{summary.activeVisitors}</span>{' '}
          active {summary.activeVisitors === 1 ? 'session' : 'sessions'}
        </p>
      </div>

      {/* Summary bullets */}
      {summary.summaryText.length > 0 ? (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-slate-500" />
            <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
              What&apos;s happening
            </h3>
          </div>
          <ul className="space-y-2.5">
            {summary.summaryText.map((text, i) => (
              <li
                key={i}
                className="text-sm text-slate-700 flex items-start gap-2.5 leading-relaxed"
              >
                <span className="w-1 h-1 rounded-full bg-orange-500 mt-2 flex-shrink-0" />
                <span>{text}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="py-8 text-center">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
            <Activity className="w-6 h-6 text-slate-400" />
          </div>
          <p className="text-sm text-slate-600">
            {emptyStateMessages.noRecentActivity.description}
          </p>
        </div>
      )}

      {/* Top pages */}
      {summary.topPages.length > 0 && (
        <div className="space-y-3 pt-4 border-t border-slate-200">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-slate-500" />
            <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Top pages
            </h3>
          </div>
          <ul className="space-y-2">
            {summary.topPages.slice(0, 5).map(([path, count]) => (
              <li
                key={path}
                className="flex items-center justify-between group"
              >
                <span className="font-mono text-xs text-slate-700 truncate max-w-[220px] group-hover:text-slate-900">
                  {path}
                </span>
                <span className="inline-flex items-center justify-center min-w-[24px] h-5 px-1.5 rounded-full bg-slate-100 text-slate-600 text-xs font-medium">
                  {count}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Friction alerts */}
      {hasFriction && (
        <div className="space-y-3 pt-4 border-t border-slate-200">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <h3 className="text-xs font-semibold text-amber-700 uppercase tracking-wider">
              Possible friction
            </h3>
          </div>
          <ul className="space-y-2">
            {summary.friction
              .filter(([type]) => type !== 'NONE')
              .map(([type, count]) => (
                <li
                  key={type}
                  className="flex items-center justify-between p-2.5 rounded-lg bg-amber-50 border border-amber-100"
                >
                  <span className="text-sm text-amber-900 font-medium">
                    {formatFrictionType(type)}
                  </span>
                  <span className="inline-flex items-center justify-center min-w-[24px] h-5 px-1.5 rounded-full bg-amber-100 text-amber-700 text-xs font-medium">
                    {count}
                  </span>
                </li>
              ))}
          </ul>
        </div>
      )}

      {/* Intent distribution */}
      {summary.intents.length > 0 && (
        <div className="space-y-3 pt-4 border-t border-slate-200">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-slate-500" />
            <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Intent distribution
            </h3>
          </div>
          <div className="space-y-2.5">
            {summary.intents.map(([intent, count]) => {
              const percentage = Math.round((count / summary.activeVisitors) * 100);
              return (
                <div key={intent} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-700 font-medium">
                      {formatIntentLabel(intent)}
                    </span>
                    <span className="text-slate-500">
                      {count} ({percentage}%)
                    </span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${getIntentColor(intent)}`}
                      style={{
                        width: `${percentage}%`,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function formatFrictionType(type: string): string {
  const labels: Record<string, string> = {
    PRICING_LOOP: 'Pricing revisits',
    NAV_LOOP: 'Navigation loops',
    FORM_STALL: 'Form pauses',
    CTA_DROP: 'CTA exits',
  };
  return labels[type] || type;
}

function formatIntentLabel(intent: string): string {
  const labels: Record<string, string> = {
    HIGH_INTENT: 'High intent',
    SIGNUP_ATTEMPT: 'Signing up',
    EVALUATING_PRICING: 'Viewing pricing',
    EVALUATING_PRODUCT: 'Exploring product',
    DISCOVERY_CONTENT: 'Reading content',
    BOUNCE_RISK: 'Brief visit',
    UNCLEAR: 'Unclear',
  };
  return labels[intent] || intent;
}

function getIntentColor(intent: string): string {
  const colors: Record<string, string> = {
    HIGH_INTENT: 'bg-emerald-500',
    SIGNUP_ATTEMPT: 'bg-blue-500',
    EVALUATING_PRICING: 'bg-orange-500',
    EVALUATING_PRODUCT: 'bg-purple-500',
    DISCOVERY_CONTENT: 'bg-slate-400',
    BOUNCE_RISK: 'bg-red-500',
    UNCLEAR: 'bg-slate-300',
  };
  return colors[intent] || 'bg-slate-400';
}
