const SUPABASE_URL  = 'https://tnytkvmfswpupxtlnaad.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRueXRrdm1mc3dwdXB4dGxuYWFkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM1MTEzMjIsImV4cCI6MjA4OTA4NzMyMn0.P6PLx5bpu5ep75snwermVglH1Y459fL6bLEj6o2tAYY';
const SITE_URL      = 'https://blatantengagement.com';

const CORS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
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
      apikey: key,
      Authorization: `Bearer ${key}`,
      Prefer: 'return=representation',
      ...(opts.headers || {}),
    },
  });
}

export async function handler(event) {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: CORS, body: '' };
  if (event.httpMethod !== 'POST') return json(405, { error: 'Method Not Allowed' });

  // Verify admin JWT
  const token = (event.headers['authorization'] || '').replace('Bearer ', '');
  if (!token) return json(401, { error: 'Unauthorized' });
  const userRes = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: { apikey: SUPABASE_ANON, Authorization: `Bearer ${token}` },
  });
  if (!userRes.ok) return json(401, { error: 'Invalid token' });
  const { email: adminEmail } = await userRes.json();
  const expectedAdmin = process.env.ADMIN_EMAIL || 'hello@blatantengagement.com';
  if (adminEmail !== expectedAdmin) return json(403, { error: 'Forbidden' });

  let payload;
  try { payload = JSON.parse(event.body); } catch { return json(400, { error: 'Invalid JSON' }); }
  const { client_id, amount, type, description } = payload;
  if (!client_id || !amount || !description) return json(400, { error: 'client_id, amount, description required' });

  // Fetch client
  const clientRes = await supa(
    `/rest/v1/clients?id=eq.${client_id}&select=id,name,business_name,email,portal_token,stripe_customer_id`
  );
  const clients = await clientRes.json();
  if (!clients.length) return json(404, { error: 'Client not found' });
  const client = clients[0];

  const stripe = process.env.STRIPE_SECRET_KEY;
  if (!stripe) return json(500, { error: 'Stripe not configured' });

  // Create Stripe Checkout Session
  const params = new URLSearchParams({
    'payment_method_types[]':           'card',
    'line_items[0][price_data][currency]':            'cad',
    'line_items[0][price_data][product_data][name]':  description,
    'line_items[0][price_data][unit_amount]':         String(Math.round(amount * 100)),
    'line_items[0][quantity]':                        '1',
    mode:           'payment',
    success_url:    `${SITE_URL}/client/${client.portal_token}?payment=success`,
    cancel_url:     `${SITE_URL}/client/${client.portal_token}`,
    customer_email: client.email,
    'metadata[client_id]':   client_id,
    'metadata[invoice_type]': type || 'other',
  });

  const stripeRes = await fetch('https://api.stripe.com/v1/checkout/sessions', {
    method: 'POST',
    headers: {
      Authorization:  `Bearer ${stripe}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });

  if (!stripeRes.ok) {
    const err = await stripeRes.json();
    console.error('Stripe error:', err);
    return json(500, { error: 'Failed to create payment session' });
  }

  const session = await stripeRes.json();

  // Create invoice record
  const invRes = await supa('/rest/v1/invoices', {
    method: 'POST',
    body: JSON.stringify({
      client_id,
      amount,
      type:        type || 'other',
      description,
      status:      'pending',
      stripe_checkout_session_id: session.id,
    }),
  });
  const invoices = await invRes.json();
  const invoice  = invoices[0];

  // Log activity
  await supa('/rest/v1/activity_log', {
    method: 'POST',
    body: JSON.stringify({
      client_id,
      event_type:   'invoice_sent',
      description:  `Invoice sent: ${description} — $${amount} CAD`,
      performed_by: adminEmail,
    }),
  }).catch(() => {});

  // Email client via Resend
  const resendKey = process.env.RESEND_API_KEY;
  if (resendKey) {
    const bizName = client.business_name || client.name;
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from:    'Brad at Blatant Engagement <hello@blatantengagement.com>',
        to:      client.email,
        subject: `Invoice from Blatant Engagement — $${amount} CAD`,
        text:    `Hi ${client.name},\n\nAn invoice of $${amount} CAD has been issued for: ${description}.\n\nPay securely here:\n${session.url}\n\nBrad\nBlatant Engagement`,
      }),
    }).catch(e => console.error('Resend error:', e));
  }

  return json(200, { success: true, invoice_id: invoice?.id, checkout_url: session.url });
}
