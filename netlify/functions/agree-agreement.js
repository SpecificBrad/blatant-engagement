const SUPABASE_URL = 'https://tnytkvmfswpupxtlnaad.supabase.co';
const STRIPE_SECRET = process.env.STRIPE_SECRET_KEY;
const SITE_URL = 'https://blatantengagement.com';

const CORS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, x-portal-token',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function json(status, body) {
  return { statusCode: status, headers: CORS, body: JSON.stringify(body) };
}

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

export async function handler(event) {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: CORS, body: '' };
  if (event.httpMethod !== 'POST') return json(405, { error: 'Method Not Allowed' });

  const portalToken = event.headers['x-portal-token'];
  if (!portalToken) return json(401, { error: 'Missing portal token' });

  // Verify portal token → get client
  const clientRes = await supa(`/rest/v1/clients?portal_token=eq.${portalToken}&select=id,email,business_name,price,agreement_status`);
  const clients = await clientRes.json();
  if (!clients.length) return json(404, { error: 'Client not found' });
  const client = clients[0];

  if (client.agreement_status !== 'pending') return json(409, { error: 'Agreement already actioned' });

  // Get agreement id
  const agRes = await supa(`/rest/v1/agreements?client_id=eq.${client.id}&status=eq.pending&select=id`);
  const agreements = await agRes.json();
  if (!agreements.length) return json(404, { error: 'Agreement not found' });
  const agreementId = agreements[0].id;

  // Mark agreement agreed
  await supa(`/rest/v1/agreements?id=eq.${agreementId}`, {
    method: 'PATCH',
    body: JSON.stringify({ status: 'agreed', signed_at: new Date().toISOString() }),
  });

  // Update client agreement_status
  await supa(`/rest/v1/clients?id=eq.${client.id}`, {
    method: 'PATCH',
    body: JSON.stringify({ agreement_status: 'agreed' }),
  });

  // Log
  await supa('/rest/v1/activity_log', {
    method: 'POST',
    body: JSON.stringify({
      client_id:   client.id,
      event_type:  'agreement_agreed',
      description: 'Client agreed to the project agreement.',
      performed_by: 'client',
    }),
  }).catch(() => {});

  // Create Stripe Checkout session
  const depositAmount = Math.round(parseFloat(client.price) * 0.5 * 100); // 50% deposit in cents

  const stripeRes = await fetch('https://api.stripe.com/v1/checkout/sessions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${STRIPE_SECRET}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      'payment_method_types[]': 'card',
      'mode': 'payment',
      'line_items[0][price_data][currency]': 'cad',
      'line_items[0][price_data][unit_amount]': depositAmount,
      'line_items[0][price_data][product_data][name]': `Website Deposit — ${client.business_name || 'Blatant Engagement'}`,
      'line_items[0][quantity]': '1',
      'success_url': `${SITE_URL}/client/${portalToken}?step=collateral`,
      'cancel_url':  `${SITE_URL}/client/${portalToken}?step=agreement`,
      'metadata[portal_token]': portalToken,
      'metadata[client_id]':    client.id,
    }),
  });

  if (!stripeRes.ok) {
    console.error('Stripe error:', await stripeRes.text());
    return json(500, { error: 'Failed to create payment session' });
  }

  const session = await stripeRes.json();
  return json(200, { checkout_url: session.url });
}
