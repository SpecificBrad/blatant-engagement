const SUPABASE_URL = 'https://tnytkvmfswpupxtlnaad.supabase.co';
const SITE_URL     = 'https://blatantengagement.com';

const CORS_HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function json(statusCode, body) {
  return { statusCode, headers: CORS_HEADERS, body: JSON.stringify(body) };
}

async function supabase(path, method, body) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
      'Prefer': 'return=representation',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { ok: res.ok, status: res.status, data: await res.json() };
}

export async function handler(event) {
  // CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: CORS_HEADERS, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return json(405, { error: 'Method Not Allowed' });
  }

  // ── Auth: verify Supabase JWT ──────────────────────────────────────────────
  const authHeader = event.headers['authorization'] || event.headers['Authorization'] || '';
  if (!authHeader.startsWith('Bearer ')) {
    return json(401, { error: 'Missing authorization header' });
  }

  const jwt = authHeader.slice(7);
  const userRes = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: {
      'Authorization': `Bearer ${jwt}`,
      'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
    },
  });

  if (!userRes.ok) {
    return json(401, { error: 'Invalid or expired token' });
  }

  const user = await userRes.json();
  const adminEmail = process.env.ADMIN_EMAIL || 'hello@blatantengagement.com';

  if (user.email !== adminEmail) {
    return json(403, { error: 'Forbidden — not an admin account' });
  }

  // ── Parse body ─────────────────────────────────────────────────────────────
  let payload;
  try {
    payload = JSON.parse(event.body);
  } catch {
    return json(400, { error: 'Invalid JSON' });
  }

  const { name, email, phone, business_name, package: pkg } = payload;

  if (!name || !email) {
    return json(400, { error: 'name and email are required' });
  }

  // ── Insert client ──────────────────────────────────────────────────────────
  const portal_token = crypto.randomUUID();

  const insert = await supabase('/clients', 'POST', {
    name:          name.trim(),
    email:         email.trim().toLowerCase(),
    phone:         phone?.trim() || null,
    business_name: business_name?.trim() || null,
    package:       pkg || null,
    portal_token,
    status:        'new',
  });

  if (!insert.ok) {
    console.error('Client insert failed:', insert.data);
    return json(500, { error: 'Failed to create client', detail: insert.data });
  }

  const client = insert.data[0];

  // ── Log to activity_log ───────────────────────────────────────────────────
  await supabase('/activity_log', 'POST', {
    client_id:   client.id,
    event_type:  'client_created',
    description: `Client created by admin: ${name} / ${business_name || 'no business'} — package: ${pkg || 'not set'}`,
  }).catch(err => console.error('activity_log error:', err));

  const portal_url = `${SITE_URL}/client/${portal_token}`;

  return json(200, {
    success:      true,
    client_id:    client.id,
    portal_token,
    portal_url,
  });
}
