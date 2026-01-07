'use client';

import { Wifi, WifiOff, Loader2 } from 'lucide-react';

interface ConnectionStatusProps {
  status: 'connecting' | 'connected' | 'disconnected';
}

export function ConnectionStatus({ status }: ConnectionStatusProps) {
  const styles = {
    connecting: {
      bg: 'bg-amber-50',
      text: 'text-amber-700',
      border: 'border-amber-200',
      dot: 'bg-amber-500',
      icon: Loader2,
      label: 'Connecting',
      animate: 'animate-spin',
    },
    connected: {
      bg: 'bg-emerald-50',
      text: 'text-emerald-700',
      border: 'border-emerald-200',
      dot: 'bg-emerald-500',
      icon: Wifi,
      label: 'Live',
      animate: '',
    },
    disconnected: {
      bg: 'bg-red-50',
      text: 'text-red-700',
      border: 'border-red-200',
      dot: 'bg-red-500',
      icon: WifiOff,
      label: 'Reconnecting',
      animate: 'animate-pulse',
    },
  };

  const style = styles[status];
  const Icon = style.icon;

  return (
    <div
      className={`
        inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border
        ${style.bg} ${style.text} ${style.border}
      `}
    >
      <Icon className={`w-3.5 h-3.5 ${style.animate}`} />
      {style.label}
      {status === 'connected' && (
        <span className="relative flex h-2 w-2">
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${style.dot} opacity-75`} />
          <span className={`relative inline-flex rounded-full h-2 w-2 ${style.dot}`} />
        </span>
      )}
    </div>
  );
}
