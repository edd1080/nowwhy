'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { AlertType, AlertDeliveryMode, DigestFrequency } from '@/types';
import { Bell, Zap, AlertTriangle, TrendingUp, Loader2, CheckCircle2, AlertCircle, ExternalLink, Mail, Send, Clock, Calendar } from 'lucide-react';

interface AlertConfig {
  id: string;
  alert_type: AlertType;
  enabled: boolean;
  delivery_mode: AlertDeliveryMode;
  slack_webhook_url: string | null;
}

interface DigestConfig {
  id: string | null;
  enabled: boolean;
  frequency: DigestFrequency;
  send_time: string;
  timezone: string;
  email: string;
}

const TIMEZONES = [
  { value: 'America/New_York', label: 'Eastern Time (ET)' },
  { value: 'America/Chicago', label: 'Central Time (CT)' },
  { value: 'America/Denver', label: 'Mountain Time (MT)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
  { value: 'Europe/London', label: 'London (GMT/BST)' },
  { value: 'Europe/Paris', label: 'Paris (CET)' },
  { value: 'Europe/Berlin', label: 'Berlin (CET)' },
  { value: 'Asia/Tokyo', label: 'Tokyo (JST)' },
  { value: 'Asia/Singapore', label: 'Singapore (SGT)' },
  { value: 'Australia/Sydney', label: 'Sydney (AEST)' },
];

export default function SettingsPage() {
  const [projectId, setProjectId] = useState<string | null>(null);
  const [configs, setConfigs] = useState<AlertConfig[]>([]);
  const [webhookUrl, setWebhookUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Digest settings
  const [digestConfig, setDigestConfig] = useState<DigestConfig>({
    id: null,
    enabled: false,
    frequency: 'daily',
    send_time: '09:00',
    timezone: 'America/New_York',
    email: '',
  });
  const [sendingTestDigest, setSendingTestDigest] = useState(false);

  const alertTypes: { type: AlertType; label: string; description: string; icon: React.ReactNode }[] = [
    {
      type: 'HIGH_INTENT',
      label: 'High intent visitors',
      description: 'Get notified when a visitor shows strong purchase signals',
      icon: <Zap className="w-5 h-5" />,
    },
    {
      type: 'FRICTION_DETECTED',
      label: 'Friction detected',
      description: 'Get notified when a visitor appears stuck or confused',
      icon: <AlertTriangle className="w-5 h-5" />,
    },
    {
      type: 'TRAFFIC_SPIKE',
      label: 'Traffic spike',
      description: 'Get notified when traffic is unusually high (coming soon)',
      icon: <TrendingUp className="w-5 h-5" />,
    },
  ];

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    const supabase = createClient();

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();

    const { data: projects } = await supabase
      .from('projects')
      .select('id')
      .limit(1);

    if (!projects || projects.length === 0) {
      setLoading(false);
      return;
    }

    const pid = projects[0].id;
    setProjectId(pid);

    const { data: alertConfigs } = await supabase
      .from('alert_configs')
      .select('*')
      .eq('project_id', pid);

    if (alertConfigs) {
      setConfigs(alertConfigs);
      const firstWithWebhook = alertConfigs.find(c => c.slack_webhook_url);
      if (firstWithWebhook) {
        setWebhookUrl(firstWithWebhook.slack_webhook_url || '');
      }
    }

    // Load digest preferences
    const { data: digestPref } = await supabase
      .from('digest_preferences')
      .select('*')
      .eq('project_id', pid)
      .single();

    if (digestPref) {
      setDigestConfig({
        id: digestPref.id,
        enabled: digestPref.enabled,
        frequency: digestPref.frequency,
        send_time: digestPref.send_time,
        timezone: digestPref.timezone,
        email: digestPref.email || user?.email || '',
      });
    } else if (user?.email) {
      setDigestConfig(prev => ({ ...prev, email: user.email || '' }));
    }

    setLoading(false);
  }

  async function saveSettings() {
    if (!projectId) return;

    setSaving(true);
    setMessage(null);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      setMessage({ type: 'error', text: 'Not authenticated' });
      setSaving(false);
      return;
    }

    try {
      // Save alert configs
      for (const alertType of alertTypes) {
        const existingConfig = configs.find(c => c.alert_type === alertType.type);
        const configData = {
          project_id: projectId,
          alert_type: alertType.type,
          enabled: existingConfig?.enabled ?? true,
          delivery_mode: existingConfig?.delivery_mode ?? 'instant',
          slack_webhook_url: webhookUrl || null,
        };

        if (existingConfig) {
          await supabase
            .from('alert_configs')
            .update(configData)
            .eq('id', existingConfig.id);
        } else {
          await supabase.from('alert_configs').insert(configData);
        }
      }

      // Save digest preferences
      const digestData = {
        user_id: user.id,
        project_id: projectId,
        enabled: digestConfig.enabled,
        frequency: digestConfig.frequency,
        send_time: digestConfig.send_time,
        timezone: digestConfig.timezone,
        email: digestConfig.email || null,
      };

      if (digestConfig.id) {
        await supabase
          .from('digest_preferences')
          .update(digestData)
          .eq('id', digestConfig.id);
      } else {
        await supabase.from('digest_preferences').insert(digestData);
      }

      setMessage({ type: 'success', text: 'Settings saved successfully' });
      await loadSettings();
    } catch {
      setMessage({ type: 'error', text: 'Failed to save settings' });
    }

    setSaving(false);
  }

  async function sendTestDigest() {
    if (!projectId) return;

    setSendingTestDigest(true);
    setMessage(null);

    try {
      const response = await fetch('/api/digest/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          frequency: digestConfig.frequency,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: 'Test digest sent! Check your email.' });
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to send test digest' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Failed to send test digest' });
    }

    setSendingTestDigest(false);
  }

  function updateConfig(alertType: AlertType, field: 'enabled' | 'delivery_mode', value: boolean | string) {
    setConfigs(prev => {
      const existing = prev.find(c => c.alert_type === alertType);
      if (existing) {
        return prev.map(c =>
          c.alert_type === alertType ? { ...c, [field]: value } : c
        );
      }
      return [
        ...prev,
        {
          id: '',
          alert_type: alertType,
          enabled: field === 'enabled' ? value as boolean : true,
          delivery_mode: field === 'delivery_mode' ? value as AlertDeliveryMode : 'instant',
          slack_webhook_url: null,
        },
      ];
    });
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto p-8">
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-brand-500" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          Settings
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Configure alerts and notifications for your project
        </p>
      </div>

      <div className="space-y-8">
        {/* Slack Integration */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-[#4A154B] rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zM18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zM15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zM15.165 17.688a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z"/>
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Slack Integration
              </h2>
              <p className="text-sm text-slate-500">
                Receive alerts directly in Slack
              </p>
            </div>
          </div>

          <div>
            <label
              htmlFor="webhook"
              className="block text-sm font-medium text-slate-700 mb-2"
            >
              Webhook URL
            </label>
            <input
              id="webhook"
              type="url"
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              placeholder="https://hooks.slack.com/services/..."
              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
            />
            <p className="mt-2 text-xs text-slate-500 flex items-center gap-1">
              <a
                href="https://api.slack.com/messaging/webhooks"
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand-500 hover:text-brand-600 inline-flex items-center gap-1"
              >
                Create an incoming webhook
                <ExternalLink className="w-3 h-3" />
              </a>
              <span>in your Slack workspace</span>
            </p>
          </div>
        </div>

        {/* Alert Types */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-brand-500 rounded-xl flex items-center justify-center">
              <Bell className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Alert Types
              </h2>
              <p className="text-sm text-slate-500">
                Choose what triggers notifications
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {alertTypes.map((alertType) => {
              const config = configs.find(c => c.alert_type === alertType.type);
              const isEnabled = config?.enabled ?? true;
              const deliveryMode = config?.delivery_mode ?? 'instant';
              const isDisabled = alertType.type === 'TRAFFIC_SPIKE';

              return (
                <div
                  key={alertType.type}
                  className={`p-4 rounded-xl border transition-all ${
                    isDisabled
                      ? 'border-slate-100 bg-slate-50 opacity-60'
                      : isEnabled
                      ? 'border-brand-200 bg-brand-50/30'
                      : 'border-slate-200 bg-white'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                        isDisabled ? 'bg-slate-100 text-slate-400' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {alertType.icon}
                      </div>
                      <div>
                        <h3 className="font-medium text-slate-900">
                          {alertType.label}
                        </h3>
                        <p className="text-sm text-slate-500 mt-0.5">
                          {alertType.description}
                        </p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer shrink-0">
                      <input
                        type="checkbox"
                        checked={isEnabled}
                        disabled={isDisabled}
                        onChange={(e) =>
                          updateConfig(alertType.type, 'enabled', e.target.checked)
                        }
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-brand-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-500"></div>
                    </label>
                  </div>

                  {isEnabled && !isDisabled && (
                    <div className="mt-4 pt-4 border-t border-slate-100 flex gap-6">
                      <label className="flex items-center gap-2 text-sm cursor-pointer">
                        <input
                          type="radio"
                          name={`delivery_${alertType.type}`}
                          checked={deliveryMode === 'instant'}
                          onChange={() =>
                            updateConfig(alertType.type, 'delivery_mode', 'instant')
                          }
                          className="w-4 h-4 text-brand-500 border-slate-300 focus:ring-brand-500"
                        />
                        <span className="text-slate-700">Instant</span>
                      </label>
                      <label className="flex items-center gap-2 text-sm cursor-pointer">
                        <input
                          type="radio"
                          name={`delivery_${alertType.type}`}
                          checked={deliveryMode === 'batched'}
                          onChange={() =>
                            updateConfig(alertType.type, 'delivery_mode', 'batched')
                          }
                          className="w-4 h-4 text-brand-500 border-slate-300 focus:ring-brand-500"
                        />
                        <span className="text-slate-700">Batched (every 5 min)</span>
                      </label>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Email Digest */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center">
              <Mail className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Email Digest
              </h2>
              <p className="text-sm text-slate-500">
                Get a plain-English summary delivered to your inbox
              </p>
            </div>
          </div>

          {/* Enable toggle */}
          <div className={`p-4 rounded-xl border transition-all mb-4 ${
            digestConfig.enabled
              ? 'border-emerald-200 bg-emerald-50/30'
              : 'border-slate-200 bg-white'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-slate-900">
                  Enable email digest
                </h3>
                <p className="text-sm text-slate-500 mt-0.5">
                  Receive activity summaries via email
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={digestConfig.enabled}
                  onChange={(e) =>
                    setDigestConfig(prev => ({ ...prev, enabled: e.target.checked }))
                  }
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
              </label>
            </div>
          </div>

          {digestConfig.enabled && (
            <div className="space-y-4">
              {/* Frequency */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    Frequency
                  </div>
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="radio"
                      name="digest_frequency"
                      checked={digestConfig.frequency === 'daily'}
                      onChange={() =>
                        setDigestConfig(prev => ({ ...prev, frequency: 'daily' }))
                      }
                      className="w-4 h-4 text-emerald-500 border-slate-300 focus:ring-emerald-500"
                    />
                    <span className="text-slate-700">Daily</span>
                  </label>
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="radio"
                      name="digest_frequency"
                      checked={digestConfig.frequency === 'weekly'}
                      onChange={() =>
                        setDigestConfig(prev => ({ ...prev, frequency: 'weekly' }))
                      }
                      className="w-4 h-4 text-emerald-500 border-slate-300 focus:ring-emerald-500"
                    />
                    <span className="text-slate-700">Weekly (Mondays)</span>
                  </label>
                </div>
              </div>

              {/* Send time */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-slate-400" />
                    Send time
                  </div>
                </label>
                <div className="flex gap-4">
                  <select
                    value={digestConfig.send_time}
                    onChange={(e) =>
                      setDigestConfig(prev => ({ ...prev, send_time: e.target.value }))
                    }
                    className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                  >
                    <option value="07:00">7:00 AM</option>
                    <option value="08:00">8:00 AM</option>
                    <option value="09:00">9:00 AM</option>
                    <option value="10:00">10:00 AM</option>
                    <option value="12:00">12:00 PM</option>
                    <option value="17:00">5:00 PM</option>
                    <option value="18:00">6:00 PM</option>
                  </select>
                  <select
                    value={digestConfig.timezone}
                    onChange={(e) =>
                      setDigestConfig(prev => ({ ...prev, timezone: e.target.value }))
                    }
                    className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                  >
                    {TIMEZONES.map(tz => (
                      <option key={tz.value} value={tz.value}>
                        {tz.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Email address */}
              <div>
                <label
                  htmlFor="digest-email"
                  className="block text-sm font-medium text-slate-700 mb-2"
                >
                  Email address
                </label>
                <input
                  id="digest-email"
                  type="email"
                  value={digestConfig.email}
                  onChange={(e) =>
                    setDigestConfig(prev => ({ ...prev, email: e.target.value }))
                  }
                  placeholder="you@example.com"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                />
              </div>

              {/* Test digest button */}
              <div className="pt-2">
                <button
                  onClick={sendTestDigest}
                  disabled={sendingTestDigest || !digestConfig.email}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-medium hover:border-emerald-300 hover:text-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
                >
                  {sendingTestDigest ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Send test digest
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Save Button */}
        <div className="flex items-center justify-between">
          {message && (
            <div
              className={`flex items-center gap-2 text-sm ${
                message.type === 'success' ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {message.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4" />
              ) : (
                <AlertCircle className="w-4 h-4" />
              )}
              {message.text}
            </div>
          )}
          <button
            onClick={saveSettings}
            disabled={saving}
            className="ml-auto px-6 py-3 rounded-xl bg-slate-900 text-white font-semibold hover:bg-brand-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2 shadow-lg shadow-slate-900/10 hover:shadow-orange-500/20"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Settings'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
