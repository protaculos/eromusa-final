import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';
import crypto from 'crypto';

const WEBHOOK_SECRET = process.env.VEXUTOPIA_WEBHOOK_SECRET!;

/**
 * Verify HMAC-SHA256 signature from Vexutopia webhook.
 * The signature is sent in the x-vexutopia-signature header as a hex string.
 */
function verifySignature(payload: string, signature: string): boolean {
  if (!WEBHOOK_SECRET || !signature) return false;
  const expected = crypto
    .createHmac('sha256', WEBHOOK_SECRET)
    .update(payload)
    .digest('hex');
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}

export async function POST(request: NextRequest) {
  try {
    // 1. Read raw body for signature verification
    const rawBody = await request.text();
    const signature = request.headers.get('x-vexutopia-signature') || '';

    // 2. Verify HMAC signature
    if (!verifySignature(rawBody, signature)) {
      console.error('Invalid webhook signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    // 3. Parse event
    const event = JSON.parse(rawBody);
    const eventType = event.type || event.event;

    console.log(`Vexutopia webhook received: ${eventType}`);

    // 4. Handle payment events
    switch (eventType) {
      case 'payment.completed': {
        const payment = event.data || event.payment;
        const vexutopiaTxId = payment.id;
        const metadata = payment.metadata || {};
        const userId = metadata.user_id;
        const credits = parseInt(metadata.credits || '0', 10);

        if (!vexutopiaTxId || !userId || !credits) {
          console.error('Missing payment data in webhook:', { vexutopiaTxId, userId, credits });
          return NextResponse.json({ error: 'Invalid payment data' }, { status: 400 });
        }

        // Update payment status to completed
        const { error: updatePaymentError } = await supabaseAdmin
          .from('payments')
          .update({ status: 'completed', updated_at: new Date().toISOString() })
          .eq('vexutopia_tx_id', vexutopiaTxId);

        if (updatePaymentError) {
          console.error('Failed to update payment status:', updatePaymentError);
        }

        // Add credits to user's profile
        const { data: profile } = await supabaseAdmin
          .from('profiles')
          .select('credits')
          .eq('id', userId)
          .single();

        const currentCredits = profile?.credits ?? 0;
        const newCredits = currentCredits + credits;

        const { error: updateCreditsError } = await supabaseAdmin
          .from('profiles')
          .update({ credits: newCredits, updated_at: new Date().toISOString() })
          .eq('id', userId);

        if (updateCreditsError) {
          console.error('Failed to update user credits:', updateCreditsError);
          return NextResponse.json({ error: 'Failed to update credits' }, { status: 500 });
        }

        console.log(`Credits added: user=${userId}, +${credits}, total=${newCredits}`);
        break;
      }

      case 'payment.failed': {
        const failedPayment = event.data || event.payment;
        const failedTxId = failedPayment.id;

        if (failedTxId) {
          await supabaseAdmin
            .from('payments')
            .update({ status: 'failed', updated_at: new Date().toISOString() })
            .eq('vexutopia_tx_id', failedTxId);
        }
        break;
      }

      default:
        console.log(`Unhandled webhook event type: ${eventType}`);
    }

    // 5. Always return 200 to acknowledge receipt
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
