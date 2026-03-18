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

  // Verify admin JWT
  const token = (event.headers['authorization'] || '').replace('Bearer ', '');
  if (!token) return json(401, { error: 'Unauthorized' });

  const userRes = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: { 'apikey': SUPABASE_ANON, 'Authorization': `Bearer ${token}` },
  });
  if (!userRes.ok) return json(401, { error: 'Invalid token' });
  const { email } = await userRes.json();
  const adminEmail = process.env.ADMIN_EMAIL || 'hello@blatantengagement.com';
  if (email !== adminEmail) return json(403, { error: 'Forbidden' });

  let payload;
  try { payload = JSON.parse(event.body); } catch { return json(400, { error: 'Invalid JSON' }); }

  const { lead_id, name, business_name, email: clientEmail, phone, package: pkg, price, deliverables } = payload;

  if (!clientEmail || !name || !price) return json(400, { error: 'name, email, and price are required' });

  const portal_token = crypto.randomUUID();

  // Create client record
  const clientRes = await supa('/rest/v1/clients', {
    method: 'POST',
    body: JSON.stringify({
      name,
      email: clientEmail.toLowerCase().trim(),
      phone:          phone || null,
      business_name:  business_name || null,
      package:        pkg || null,
      price,
      lead_id:        lead_id || null,
      portal_token,
      status:         'agreement_sent',
      stage_updated_at: new Date().toISOString(),
      agreement_status: 'pending',
    }),
  });

  if (!clientRes.ok) {
    const err = await clientRes.json();
    console.error('Client insert failed:', err);
    return json(500, { error: 'Failed to create client' });
  }

  const client = (await clientRes.json())[0];

  // Create agreement record
  const agreementRes = await supa('/rest/v1/agreements', {
    method: 'POST',
    body: JSON.stringify({
      client_id: client.id,
      title: `Website Agreement — ${business_name || name}`,
      status: 'pending',
      job_specifics: {
        package:     pkg || null,
        price,
        deliverables: deliverables || 'Single-page website as discussed.',
        business_name: business_name || null,
      },
    }),
  });

  if (!agreementRes.ok) {
    console.error('Agreement insert failed:', await agreementRes.json());
    return json(500, { error: 'Failed to create agreement' });
  }

  // If lead_id provided, mark lead as promoted
  if (lead_id) {
    await supa(`/rest/v1/leads?id=eq.${lead_id}`, {
      method: 'PATCH',
      body: JSON.stringify({ client_id: client.id, status: 'approved' }),
    }).catch(e => console.error('Lead update failed:', e));
  }

  // Log activity
  await supa('/rest/v1/activity_log', {
    method: 'POST',
    body: JSON.stringify({
      client_id:   client.id,
      event_type:  'lead_approved',
      description: `Lead approved by admin. Agreement sent to ${clientEmail}.`,
      performed_by: adminEmail,
    }),
  }).catch(e => console.error('Activity log failed:', e));

  // Send magic link via Supabase Auth
  const magicRes = await fetch(`${SUPABASE_URL}/auth/v1/magiclink`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_ANON,
    },
    body: JSON.stringify({
      email: clientEmail.toLowerCase().trim(),
      options: {
        redirectTo: `${SITE_URL}/client/${portal_token}`,
      },
    }),
  });

  if (!magicRes.ok) {
    console.error('Magic link failed:', await magicRes.text());
    // Non-fatal — client record exists, Brad can resend manually
  }

  return json(200, {
    success:    true,
    client_id:  client.id,
    portal_url: `${SITE_URL}/client/${portal_token}`,
  });
}
