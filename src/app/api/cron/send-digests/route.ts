import { NextRequest, NextResponse } from 'next/server';
import {
  getDigestsToSend,
  generateDigestData,
  markDigestSent,
} from '@/lib/digest-service';
import { sendDigestEmail } from '@/lib/email-service';

// This route is designed to be called by a cron job (e.g., Vercel Cron, Railway, or external)
// It should be called every 30 minutes to check for digests that need to be sent

export async function GET(request: NextRequest) {
  // Verify cron secret to prevent unauthorized access
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const digestsToSend = await getDigestsToSend();

    if (digestsToSend.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No digests to send',
        sent: 0,
      });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const results: { email: string; success: boolean; error?: string }[] = [];

    for (const pref of digestsToSend) {
      // Get the recipient email (prefer custom email, fallback to auth email)
      const recipientEmail =
        pref.email || (pref.users as { email: string })?.email;

      if (!recipientEmail) {
        results.push({
          email: 'unknown',
          success: false,
          error: 'No email address found',
        });
        continue;
      }

      // Generate digest data
      const digestData = await generateDigestData(
        pref.project_id,
        (pref.projects as { name: string }).name,
        (pref.projects as { domain: string }).domain,
        pref.frequency
      );

      // Send the email
      const dashboardUrl = `${appUrl}/live?project=${pref.project_id}`;
      const result = await sendDigestEmail({
        to: recipientEmail,
        data: digestData,
        dashboardUrl,
      });

      if (result.success) {
        // Mark as sent
        await markDigestSent(pref.id);
      }

      results.push({
        email: recipientEmail,
        success: result.success,
        error: result.error,
      });
    }

    const successCount = results.filter((r) => r.success).length;

    return NextResponse.json({
      success: true,
      message: `Sent ${successCount} of ${results.length} digests`,
      sent: successCount,
      total: results.length,
      results,
    });
  } catch (error) {
    console.error('Error in digest cron job:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// Also support POST for manual triggers
export async function POST(request: NextRequest) {
  return GET(request);
}
