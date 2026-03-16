const SUPABASE_URL = 'https://tnytkvmfswpupxtlnaad.supabase.co';
const TELEGRAM_BOT  = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT = '6193238817';

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
  const clientRes = await supa(`/rest/v1/clients?portal_token=eq.${portalToken}&select=id,name,business_name,email,agreement_status`);
  const clients = await clientRes.json();
  if (!clients.length) return json(404, { error: 'Client not found' });
  const client = clients[0];

  if (client.agreement_status !== 'pending') return json(409, { error: 'Agreement already actioned' });

  // Get agreement id
  const agRes = await supa(`/rest/v1/agreements?client_id=eq.${client.id}&status=eq.pending&select=id`);
  const agreements = await agRes.json();
  if (!agreements.length) return json(404, { error: 'Agreement not found' });
  const agreementId = agreements[0].id;

  // Mark agreement declined
  await supa(`/rest/v1/agreements?id=eq.${agreementId}`, {
    method: 'PATCH',
    body: JSON.stringify({ status: 'declined', declined_at: new Date().toISOString() }),
  });

  // Update client: flag for follow-up
  await supa(`/rest/v1/clients?id=eq.${client.id}`, {
    method: 'PATCH',
    body: JSON.stringify({
      agreement_status: 'declined',
      status: 'quoted',
      stage_updated_at: new Date().toISOString(),
    }),
  });

  // Log
  await supa('/rest/v1/activity_log', {
    method: 'POST',
    body: JSON.stringify({
      client_id:    client.id,
      event_type:   'agreement_declined',
      description:  'Client declined the project agreement.',
      performed_by: 'client',
    }),
  }).catch(() => {});

  // Telegram notification to Brad
  const msg = `⚠️ Agreement Declined\n\n${client.business_name || client.name} (${client.email}) has declined the project agreement.\n\nFollow up needed — card returned to Quoted.`;
  await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: TELEGRAM_CHAT, text: msg }),
  }).catch(() => {});

  return json(200, { success: true });
}
