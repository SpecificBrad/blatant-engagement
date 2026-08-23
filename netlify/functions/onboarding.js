const SUPABASE_URL = 'https://tnytkvmfswpupxtlnaad.supabase.co';
const SITE_URL     = 'https://blatantengagement.com';

const CORS_HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function json(statusCode, body) {
  return { statusCode, headers: CORS_HEADERS, body: JSON.stringify(body) };
}

export async function handler(event) {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: CORS_HEADERS, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return json(405, { error: 'Method Not Allowed' });
  }

  let payload;
  try {
    payload = JSON.parse(event.body);
  } catch {
    return json(400, { error: 'Invalid JSON' });
  }

  const { name, email, phone, business_name, package: pkg, website, ts } = payload;

  // Honeypot + timing check — return a fake success so junk never reaches
  // Supabase and a bot can't tell it was caught.
  const elapsedMs = Date.now() - Number(ts || 0);
  if (website || !ts || elapsedMs < 3000) {
    return json(200, { success: true });
  }

  if (!name || !email || !phone) {
    return json(400, { error: 'name, email, and phone are required' });
  }

  const portal_token = crypto.randomUUID();

  const res = await fetch(`${SUPABASE_URL}/rest/v1/clients`, {
    method: 'POST',
    headers: {
      'Content-Type':  'application/json',
      'apikey':        process.env.SUPABASE_SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
      'Prefer':        'return=representation',
    },
    body: JSON.stringify({
      name:          name.trim(),
      email:         email.trim().toLowerCase(),
      phone:         phone.trim(),
      business_name: business_name?.trim() || null,
      package:       pkg || null,
      portal_token,
      status:        'lead',
    }),
  });

  const data = await res.json();

  if (!res.ok) {
    console.error('Onboarding insert failed:', data);
    return json(500, { error: 'Failed to submit. Please try again.' });
  }

  const client = data[0];

  // Log to activity_log
  await fetch(`${SUPABASE_URL}/rest/v1/activity_log`, {
    method: 'POST',
    headers: {
      'Content-Type':  'application/json',
      'apikey':        process.env.SUPABASE_SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
    },
    body: JSON.stringify({
      client_id:   client.id,
      event_type:  'onboarding_submitted',
      description: `New client onboarding: ${name} / ${business_name || 'no business'} — package interest: ${pkg || 'not set'}`,
    }),
  }).catch(err => console.error('activity_log error:', err));

  return json(200, {
    success: true,
    portal_url: `${SITE_URL}/client/${portal_token}`,
  });
}
