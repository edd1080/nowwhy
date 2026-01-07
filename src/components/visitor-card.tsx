'use client';

import type { VisitorCard as VisitorCardType, IntentLabel, SessionStatus } from '@/types';
import { formatLocation } from '@/lib/geoip';
import {
  Monitor,
  Smartphone,
  Tablet,
  Clock,
  Eye,
  AlertTriangle,
  FileText,
  TrendingUp,
  Activity
} from 'lucide-react';

interface VisitorCardProps {
  visitor: VisitorCardType;
}

// Intent label colors and styles
const intentStyles: Record<IntentLabel, { bg: string; text: string; dot: string; border: string }> = {
  HIGH_INTENT: {
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-700 dark:text-emerald-400',
    dot: 'bg-emerald-500',
    border: 'border-emerald-500/20'
  },
  SIGNUP_ATTEMPT: {
    bg: 'bg-blue-500/10',
    text: 'text-blue-700 dark:text-blue-400',
    dot: 'bg-blue-500',
    border: 'border-blue-500/20'
  },
  EVALUATING_PRICING: {
    bg: 'bg-orange-500/10',
    text: 'text-orange-700 dark:text-orange-400',
    dot: 'bg-orange-500',
    border: 'border-orange-500/20'
  },
  EVALUATING_PRODUCT: {
    bg: 'bg-purple-500/10',
    text: 'text-purple-700 dark:text-purple-400',
    dot: 'bg-purple-500',
    border: 'border-purple-500/20'
  },
  DISCOVERY_CONTENT: {
    bg: 'bg-slate-500/10',
    text: 'text-slate-600 dark:text-slate-400',
    dot: 'bg-slate-400',
    border: 'border-slate-500/20'
  },
  BOUNCE_RISK: {
    bg: 'bg-red-500/10',
    text: 'text-red-600 dark:text-red-400',
    dot: 'bg-red-500',
    border: 'border-red-500/20'
  },
  UNCLEAR: {
    bg: 'bg-slate-500/10',
    text: 'text-slate-500 dark:text-slate-400',
    dot: 'bg-slate-300',
    border: 'border-slate-500/20'
  },
};

// Human-readable intent labels
const intentLabels: Record<IntentLabel, string> = {
  HIGH_INTENT: 'High intent',
  SIGNUP_ATTEMPT: 'Signing up',
  EVALUATING_PRICING: 'Viewing pricing',
  EVALUATING_PRODUCT: 'Exploring product',
  DISCOVERY_CONTENT: 'Reading content',
  BOUNCE_RISK: 'Brief visit',
  UNCLEAR: 'Observing...',
};

// Device icons
function DeviceIcon({ device }: { device: string }) {
  const iconClass = "w-3.5 h-3.5 text-slate-500";

  switch (device) {
    case 'mobile':
      return <Smartphone className={iconClass} />;
    case 'tablet':
      return <Tablet className={iconClass} />;
    default:
      return <Monitor className={iconClass} />;
  }
}

// Format time duration
function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ${minutes % 60}m`;
}

// Calculate engagement percentage (0-100)
function calculateEngagement(visitor: VisitorCardType): number {
  const avgTimePerPage = visitor.sessionDuration / Math.max(visitor.pageCount, 1);
  const engagementScore = Math.min(
    (visitor.pageCount * 10) + (avgTimePerPage / 1000 / 30 * 20),
    100
  );
  return Math.round(engagementScore);
}

export function VisitorCard({ visitor }: VisitorCardProps) {
  const intentStyle = intentStyles[visitor.intent.label];
  const engagement = calculateEngagement(visitor);

  return (
    <div
      className={`
        relative p-4 rounded-2xl border bg-[#1e1e1e] border-slate-800
        ${visitor.status === 'ended' ? 'opacity-50' : ''}
        transition-all duration-300 hover:border-slate-700
        shadow-sm
      `}
    >
      {/* Status indicator - top right */}
      <div className="absolute top-4 right-4">
        <div className="relative">
          <div
            className={`
              w-2 h-2 rounded-full
              ${visitor.status === 'active' ? 'bg-emerald-400' : visitor.status === 'idle' ? 'bg-amber-400' : 'bg-slate-500'}
              ${visitor.status === 'active' ? 'animate-pulse' : ''}
            `}
          />
          {visitor.status === 'active' && (
            <div className="absolute inset-0 w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          )}
        </div>
      </div>

      {/* Header: Location and device */}
      <div className="flex items-center gap-2 mb-3">
        <span className="text-sm font-medium text-white tracking-tight">
          {formatLocation(visitor.country, visitor.city)}
        </span>
        <DeviceIcon device={visitor.device} />
        {visitor.isReturning && (
          <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/20">
            <Activity className="w-3 h-3" />
            Returning
          </span>
        )}
      </div>

      {/* Current page */}
      <div className="mb-3">
        <div className="flex items-start gap-2">
          <Eye className="w-3.5 h-3.5 text-slate-500 mt-0.5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <span className="text-sm font-mono text-slate-300 break-all">
              {visitor.currentPage}
            </span>
            <div className="flex items-center gap-1.5 mt-1">
              <Clock className="w-3 h-3 text-slate-500" />
              <span className="text-xs text-slate-500">
                {formatDuration(visitor.timeOnPage)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Intent badge */}
      <div className="mb-2">
        <span
          className={`
            inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full
            ${intentStyle.bg} ${intentStyle.text} border ${intentStyle.border}
          `}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${intentStyle.dot}`} />
          {intentLabels[visitor.intent.label]}
        </span>
      </div>

      {/* Intent reason */}
      <p className="text-xs text-slate-400 mb-3 leading-relaxed">
        {visitor.intent.reason}
      </p>

      {/* Friction indicator */}
      {visitor.friction && visitor.friction.flag && (
        <div className="mb-3 p-2.5 rounded-lg bg-amber-500/5 border border-amber-500/20">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-amber-400 leading-relaxed">
              {visitor.friction.reason}
            </p>
          </div>
        </div>
      )}

      {/* Engagement progress bar */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs text-slate-500">Engagement</span>
          <span className="text-xs font-medium text-slate-400">{engagement}%</span>
        </div>
        <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              engagement > 70 ? 'bg-emerald-500' :
              engagement > 40 ? 'bg-orange-500' :
              'bg-slate-600'
            }`}
            style={{ width: `${engagement}%` }}
          />
        </div>
      </div>

      {/* Session stats */}
      <div className="flex items-center gap-4 text-xs text-slate-500">
        <div className="flex items-center gap-1.5">
          <FileText className="w-3.5 h-3.5" />
          <span>{visitor.pageCount} {visitor.pageCount === 1 ? 'page' : 'pages'}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5" />
          <span>{formatDuration(visitor.sessionDuration)}</span>
        </div>
        {visitor.referrer && (
          <div className="flex items-center gap-1.5 flex-1 min-w-0">
            <TrendingUp className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="truncate" title={visitor.referrer}>
              {new URL(visitor.referrer).hostname.replace('www.', '')}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
