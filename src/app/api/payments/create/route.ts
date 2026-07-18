import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';

const VEXUTOPIA_API_URL = 'https://api.vexutopia.com/v1/payments';
const VEXUTOPIA_API_KEY = process.env.VEXUTOPIA_API_KEY!;
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

export async function POST(request: NextRequest) {
  try {
    // 1. Parse request body
    const body = await request.json();
    const { plan, credits, amount } = body as {
      plan: string;
      credits: number;
      amount: number;
    };

    if (!plan || !credits || !amount) {
      return NextResponse.json(
        { error: 'Missing required fields: plan, credits, amount' },
        { status: 400 }
      );
    }

    // 2. Get authenticated user from the session cookie
    const authHeader = request.headers.get('authorization')?.replace('Bearer ', '');
    let userId: string | null = null;
    let userEmail: string | null = null;

    if (authHeader) {
      const { data: { user }, error } = await supabaseAdmin.auth.getUser(authHeader);
      if (!error && user) {
        userId = user.id;
        userEmail = user.email ?? null;
      }
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // 3. Handle free plan (Basic $0) — add credits directly
    if (amount === 0) {
      // Get current credits
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('credits')
        .eq('id', userId)
        .single();

      const currentCredits = profile?.credits ?? 0;
      const newCredits = currentCredits + credits;

      const { error: updateError } = await supabaseAdmin
        .from('profiles')
        .update({ credits: newCredits, updated_at: new Date().toISOString() })
        .eq('id', userId);

      if (updateError) {
        return NextResponse.json(
          { error: 'Failed to add credits' },
          { status: 500 }
        );
      }

      return NextResponse.json({ direct: true, credits: newCredits });
    }

    // 4. Handle "instant" (test) method — add credits directly
    if (body.payment_method === 'instant') {
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('credits')
        .eq('id', userId)
        .single();

      const currentCredits = profile?.credits ?? 0;
      const newCredits = currentCredits + credits;

      const { error: updateError } = await supabaseAdmin
        .from('profiles')
        .update({ credits: newCredits, updated_at: new Date().toISOString() })
        .eq('id', userId);

      if (updateError) {
        return NextResponse.json(
          { error: 'Failed to add credits' },
          { status: 500 }
        );
      }

      return NextResponse.json({ direct: true, credits: newCredits });
    }

    // 5. Create Vexutopia payment session for paid plans
    const vexutopiaResponse = await fetch(VEXUTOPIA_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${VEXUTOPIA_API_KEY}`,
      },
      body: JSON.stringify({
        amount, // in cents (e.g., 1900 for $19)
        currency: 'usd',
        return_url: `${SITE_URL}/success`,
        cancel_url: `${SITE_URL}/cancel`,
        metadata: {
          user_id: userId,
          plan,
          credits: credits.toString(),
        },
        customer_email: userEmail,
        customer_id: userId,
      }),
    });

    if (!vexutopiaResponse.ok) {
      const errorText = await vexutopiaResponse.text();
      console.error('Vexutopia API error:', vexutopiaResponse.status, errorText);
      return NextResponse.json(
        { error: 'Failed to create payment session' },
        { status: 502 }
      );
    }

    const vexutopiaData = await vexutopiaResponse.json();

    // 6. Store payment record in database
    const { error: insertError } = await supabaseAdmin
      .from('payments')
      .insert({
        user_id: userId,
        vexutopia_tx_id: vexutopiaData.id,
        amount,
        credits,
        status: 'pending',
      });

    if (insertError) {
      console.error('Failed to store payment record:', insertError);
      // Payment was created on Vexutopia but we couldn't store it — still return checkout_url
      // The webhook will handle reconciliation
    }

    // 7. Return checkout URL to frontend
    return NextResponse.json({
      checkout_url: vexutopiaData.checkout_url || vexutopiaData.url,
    });
  } catch (error) {
    console.error('Payment creation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
