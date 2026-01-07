/**
 * Alert Service
 * Handles sending alerts to Slack and managing alert batching
 */

import { createServiceClient } from '@/lib/supabase/server';
import { alertTemplates, frictionReasonTemplates } from '@/lib/copy-templates';
import { formatLocation } from '@/lib/geoip';
import type { AlertType, FrictionType, VisitorCard } from '@/types';

// Alert message structure for Slack
interface SlackMessage {
  text: string;
  blocks?: SlackBlock[];
}

interface SlackBlock {
  type: string;
  text?: { type: string; text: string; emoji?: boolean };
  elements?: { type: string; text: string }[];
}

// Batched alerts store (in-memory, would use Redis in production)
const alertBatches = new Map<string, {
  alerts: { type: AlertType; data: any }[];
  timer: NodeJS.Timeout;
}>();

const BATCH_INTERVAL = 5 * 60 * 1000; // 5 minutes

// Send alert to Slack webhook
async function sendToSlack(webhookUrl: string, message: SlackMessage): Promise<boolean> {
  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(message),
    });
    return response.ok;
  } catch (error) {
    console.error('Slack webhook error:', error);
    return false;
  }
}

// Build Slack message for high intent alert
function buildHighIntentMessage(visitor: VisitorCard, appUrl: string): SlackMessage {
  const location = formatLocation(visitor.country, visitor.city);
  const template = alertTemplates.highIntent(
    visitor.currentPage,
    location,
    visitor.isReturning
  );

  return {
    text: `[NowWhy] ${template.title}`,
    blocks: [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: `📍 ${template.title}`,
          emoji: true,
        },
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Page:* \`${visitor.currentPage}\`\n*Location:* ${location}\n*Session:* ${formatDuration(visitor.sessionDuration)} | ${visitor.pageCount} pages${visitor.isReturning ? ' | Returning visitor' : ''}\n\n_${visitor.intent.reason}_`,
        },
      },
      {
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
            text: `<${appUrl}/live|View live dashboard>`,
          },
        ],
      },
    ],
  };
}

// Build Slack message for friction alert
function buildFrictionMessage(visitor: VisitorCard, appUrl: string): SlackMessage {
  const frictionType = visitor.friction?.type || 'NONE';
  const template = alertTemplates.frictionDetected(
    visitor.currentPage,
    frictionType as FrictionType
  );

  return {
    text: `[NowWhy] ${template.title}`,
    blocks: [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: `⚠️ ${template.title}`,
          emoji: true,
        },
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Page:* \`${visitor.currentPage}\`\n*Issue:* ${visitor.friction?.reason || frictionReasonTemplates[frictionType as FrictionType]}\n*Session:* ${formatDuration(visitor.sessionDuration)}`,
        },
      },
      {
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
            text: `<${appUrl}/live|View live dashboard>`,
          },
        ],
      },
    ],
  };
}

// Build batched summary message
function buildBatchMessage(
  alerts: { type: AlertType; data: any }[],
  appUrl: string
): SlackMessage {
  const highIntentCount = alerts.filter(a => a.type === 'HIGH_INTENT').length;
  const frictionCount = alerts.filter(a => a.type === 'FRICTION_DETECTED').length;

  const parts: string[] = [];
  if (highIntentCount > 0) {
    parts.push(`${highIntentCount} high-intent ${highIntentCount === 1 ? 'session' : 'sessions'}`);
  }
  if (frictionCount > 0) {
    parts.push(`${frictionCount} friction ${frictionCount === 1 ? 'event' : 'events'}`);
  }

  return {
    text: `[NowWhy] Last 5 minutes: ${parts.join(', ')}`,
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Last 5 minutes*\n${parts.map(p => `• ${p}`).join('\n')}`,
        },
      },
      {
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
            text: `<${appUrl}/live|View live dashboard>`,
          },
        ],
      },
    ],
  };
}

function formatDuration(ms: number): string {
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  if (minutes === 0) return `${seconds}s`;
  return `${minutes}m ${seconds}s`;
}

// Main function to trigger an alert
export async function triggerAlert(
  projectId: string,
  alertType: AlertType,
  visitor: VisitorCard
): Promise<void> {
  const supabase = createServiceClient();

  // Get alert config for this project and type
  const { data: config } = await supabase
    .from('alert_configs')
    .select('*')
    .eq('project_id', projectId)
    .eq('alert_type', alertType)
    .single();

  // No config or disabled
  if (!config || !config.enabled || !config.slack_webhook_url) {
    return;
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://app.nowwhy.com';

  // Handle based on delivery mode
  if (config.delivery_mode === 'instant') {
    // Send immediately
    let message: SlackMessage;

    if (alertType === 'HIGH_INTENT') {
      message = buildHighIntentMessage(visitor, appUrl);
    } else if (alertType === 'FRICTION_DETECTED') {
      message = buildFrictionMessage(visitor, appUrl);
    } else {
      return;
    }

    await sendToSlack(config.slack_webhook_url, message);
  } else {
    // Batch mode - add to batch and send after interval
    const batchKey = `${projectId}_${alertType}`;
    let batch = alertBatches.get(batchKey);

    if (!batch) {
      batch = {
        alerts: [],
        timer: setTimeout(async () => {
          const currentBatch = alertBatches.get(batchKey);
          if (currentBatch && currentBatch.alerts.length > 0) {
            const message = buildBatchMessage(currentBatch.alerts, appUrl);
            await sendToSlack(config.slack_webhook_url!, message);
          }
          alertBatches.delete(batchKey);
        }, BATCH_INTERVAL),
      };
      alertBatches.set(batchKey, batch);
    }

    batch.alerts.push({ type: alertType, data: visitor });
  }
}

// Check if an alert should be triggered based on visitor state
export function shouldTriggerAlert(
  visitor: VisitorCard,
  alertType: AlertType
): boolean {
  switch (alertType) {
    case 'HIGH_INTENT':
      return visitor.intent.label === 'HIGH_INTENT' && visitor.intent.confidence >= 0.75;
    case 'FRICTION_DETECTED':
      return visitor.friction?.flag === true;
    case 'TRAFFIC_SPIKE':
      // Would need additional logic to track baseline
      return false;
    case 'RETURNING_VIP':
      // Would need VIP tracking logic
      return false;
    default:
      return false;
  }
}

// Process alerts for a session
export async function processSessionAlerts(
  projectId: string,
  visitor: VisitorCard
): Promise<void> {
  const alertTypes: AlertType[] = ['HIGH_INTENT', 'FRICTION_DETECTED'];

  for (const alertType of alertTypes) {
    if (shouldTriggerAlert(visitor, alertType)) {
      await triggerAlert(projectId, alertType, visitor);
    }
  }
}
