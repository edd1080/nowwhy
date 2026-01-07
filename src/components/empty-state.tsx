'use client';

import { emptyStateMessages } from '@/lib/copy-templates';
import { Eye, Activity, AlertTriangle } from 'lucide-react';

interface EmptyStateProps {
  type: 'noVisitors' | 'noRecentActivity' | 'noFriction';
}

const iconMap = {
  noVisitors: Eye,
  noRecentActivity: Activity,
  noFriction: AlertTriangle,
};

export function EmptyState({ type }: EmptyStateProps) {
  const content = emptyStateMessages[type];
  const Icon = iconMap[type];

  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
      {/* Icon */}
      <div className="relative mb-6">
        <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center">
          <Icon className="w-8 h-8 text-slate-400" />
        </div>
        {/* Pulse animation for noVisitors */}
        {type === 'noVisitors' && (
          <div className="absolute inset-0 w-16 h-16 rounded-2xl bg-orange-500/20 animate-ping" />
        )}
      </div>

      {/* Content */}
      <h3 className="text-base font-semibold text-slate-900 mb-2 tracking-tight">
        {content.title}
      </h3>
      <p className="text-sm text-slate-600 max-w-sm leading-relaxed">
        {content.description}
      </p>

      {/* Additional help text for noVisitors */}
      {type === 'noVisitors' && (
        <div className="mt-6 p-4 rounded-xl bg-slate-50 border border-slate-200 max-w-md">
          <p className="text-xs text-slate-600 leading-relaxed">
            Make sure the NowWhy tracking script is installed on your website and you have active visitors browsing your site.
          </p>
        </div>
      )}
    </div>
  );
}
