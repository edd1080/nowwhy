import { Resend } from 'resend';
import DigestEmail from '@/emails/digest-email';
import type { DigestData } from '@/types';

// Lazy initialize Resend client to avoid build-time errors
let resendClient: Resend | null = null;

function getResend(): Resend {
  if (!resendClient) {
    resendClient = new Resend(process.env.RESEND_API_KEY);
  }
  return resendClient;
}

interface SendDigestEmailParams {
  to: string;
  data: DigestData;
  dashboardUrl: string;
}

export async function sendDigestEmail({
  to,
  data,
  dashboardUrl,
}: SendDigestEmailParams): Promise<{ success: boolean; error?: string }> {
  try {
    const periodLabel = data.period.label.toLowerCase();
    const subject =
      data.stats.totalSessions > 0
        ? `${data.projectName}: ${data.stats.totalSessions} sessions ${periodLabel}`
        : `Your ${data.projectName} digest - ${periodLabel}`;

    const { error } = await getResend().emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'NowWhy <digest@nowwhy.com>',
      to: [to],
      subject,
      react: DigestEmail({ data, dashboardUrl }),
    });

    if (error) {
      console.error('Error sending digest email:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    console.error('Exception sending digest email:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}
