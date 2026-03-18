const SUPABASE_URL = 'https://tnytkvmfswpupxtlnaad.supabase.co';
const SUPABASE_ANON = process.env.SUPABASE_ANON_KEY;
const SITE_URL    = 'https://blatantengagement.com';

const CORS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function json(status, body) {
  return { statusCode: status, headers: CORS, body: JSON.stringify(body) };
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
  const { email } = await userRes.json();
  const adminEmail = process.env.ADMIN_EMAIL || 'hello@blatantengagement.com';
  if (email !== adminEmail) return json(403, { error: 'Forbidden' });

  let payload;
  try { payload = JSON.parse(event.body); } catch { return json(400, { error: 'Invalid JSON' }); }
  const { client_id } = payload;
  if (!client_id) return json(400, { error: 'client_id required' });

  // Fetch client
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const clientRes = await fetch(
    `${SUPABASE_URL}/rest/v1/clients?id=eq.${client_id}&select=email,portal_token,name`,
    { headers: { apikey: key, Authorization: `Bearer ${key}` } }
  );
  const clients = await clientRes.json();
  if (!clients.length) return json(404, { error: 'Client not found' });
  const client = clients[0];

  // Send magic link
  const magicRes = await fetch(`${SUPABASE_URL}/auth/v1/magiclink`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', apikey: SUPABASE_ANON },
    body: JSON.stringify({
      email: client.email,
      options: { redirectTo: `${SITE_URL}/client/${client.portal_token}` },
    }),
  });

  if (!magicRes.ok) {
    const err = await magicRes.text();
    console.error('Magic link failed:', err);
    return json(500, { error: 'Failed to send magic link' });
  }

  // Log activity
  await fetch(`${SUPABASE_URL}/rest/v1/activity_log`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', apikey: key, Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      client_id,
      event_type:   'portal_link_sent',
      description:  `Portal link resent to ${client.email}`,
      performed_by: adminEmail,
    }),
  }).catch(() => {});

  return json(200, { success: true });
}
