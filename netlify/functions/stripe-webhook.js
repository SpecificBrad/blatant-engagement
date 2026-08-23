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

function verifyStripeSignature(payload, header, secret) {
  if (!secret) {
    console.error('STRIPE_WEBHOOK_SECRET not set — rejecting webhook');
    return false;
  }
  if (!header) return false;

  // Stripe's header looks like: t=<timestamp>,v1=<signature>[,v0=<old_signature>]
  const parts = Object.fromEntries(
    header.split(',').map((p) => {
      const idx = p.indexOf('=');
      return [p.slice(0, idx), p.slice(idx + 1)];
    })
  );

  const timestamp = parts['t'];
  const v1 = parts['v1'];
  if (!timestamp || !v1) {
    console.error('Malformed Stripe-Signature header');
    return false;
  }

  // Reject events with a timestamp too far from now (replay-attack protection)
  const ageSeconds = Math.abs(Math.floor(Date.now() / 1000) - Number(timestamp));
  if (!Number.isFinite(ageSeconds) || ageSeconds > 300) {
    console.error('Stripe webhook timestamp outside tolerance');
    return false;
  }

  const signedPayload = `${timestamp}.${payload}`;
  const expected = crypto
    .createHmac('sha256', secret)
    .update(signedPayload, 'utf8')
    .digest('hex');

  try {
    return crypto.timingSafeEqual(Buffer.from(v1, 'hex'), Buffer.from(expected, 'hex'));
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
