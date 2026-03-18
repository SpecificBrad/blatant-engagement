const SUPABASE_URL = 'https://tnytkvmfswpupxtlnaad.supabase.co';
import crypto from 'crypto';

function supa(path, opts = {}) {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return fetch(`${SUPABASE_URL}${path}`, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      'apikey': key,
      'Authorization': `Bearer ${key}`,
      'Prefer': 'return=representation',
      ...(opts.headers || {}),
    },
  });
}

function verifyStripeSignature(body, signature, secret) {
  if (!secret) {
    console.warn('STRIPE_WEBHOOK_SECRET not set — skipping verification (NOT FOR PRODUCTION)');
    return true; // Fallback for development, but log warning
  }

  try {
    const computed = crypto
      .createHmac('sha256', secret)
      .update(body)
      .digest('hex');
    
    return crypto.timingSafeEqual(
      Buffer.from(signature.split('=')[1] || '', 'hex'),
      Buffer.from(computed, 'hex')
    );
  } catch (err) {
    console.error('Signature verification failed:', err);
    return false;
  }
}

export async function handler(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  // Verify Stripe webhook signature
  const signature = event.headers['stripe-signature'];
  const secret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !verifyStripeSignature(event.body, signature, secret)) {
    console.error('Invalid Stripe webhook signature');
    return { statusCode: 401, body: 'Unauthorized' };
  }

  // Parse event
  let stripeEvent;
  try {
    stripeEvent = JSON.parse(event.body);
  } catch {
    return { statusCode: 400, body: 'Invalid JSON' };
  }

  if (stripeEvent.type !== 'checkout.session.completed') {
    return { statusCode: 200, body: 'Ignored' };
  }

  const session  = stripeEvent.data.object;
  const clientId = session.metadata?.client_id;
  const portalToken = session.metadata?.portal_token;
  const amountPaid  = session.amount_total; // cents

  if (!clientId) {
    console.error('No client_id in Stripe metadata');
    return { statusCode: 400, body: 'Missing client_id' };
  }

  const now = new Date().toISOString();

  // Update client: deposit paid, move to Deposit Paid stage
  await supa(`/rest/v1/clients?id=eq.${clientId}`, {
    method: 'PATCH',
    body: JSON.stringify({
      deposit_paid_at:  now,
      status:           'deposit_paid',
      stage_updated_at: now,
      stripe_customer_id: session.customer || null,
    }),
  });

  // Record transaction
  await supa('/rest/v1/transactions', {
    method: 'POST',
    body: JSON.stringify({
      client_id:   clientId,
      amount:      amountPaid / 100,
      type:        'deposit',
      description: `Stripe deposit — session ${session.id}`,
    }),
  }).catch(e => console.error('Transaction insert failed:', e));

  // Log activity
  await supa('/rest/v1/activity_log', {
    method: 'POST',
    body: JSON.stringify({
      client_id:    clientId,
      event_type:   'deposit_paid',
      description:  `Deposit of $${(amountPaid / 100).toFixed(2)} received via Stripe.`,
      performed_by: 'stripe',
    }),
  }).catch(e => console.error('Activity log failed:', e));

  return { statusCode: 200, body: 'OK' };
}
