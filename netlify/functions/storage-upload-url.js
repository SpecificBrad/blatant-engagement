const SUPABASE_URL = 'https://tnytkvmfswpupxtlnaad.supabase.co';

const CORS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, x-portal-token',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function json(status, body) {
  return { statusCode: status, headers: CORS, body: JSON.stringify(body) };
}

export async function handler(event) {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: CORS, body: '' };
  if (event.httpMethod !== 'POST') return json(405, { error: 'Method Not Allowed' });

  const portalToken = event.headers['x-portal-token'];
  if (!portalToken) return json(401, { error: 'Missing portal token' });

  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  // Verify portal token
  const clientRes = await fetch(
    `${SUPABASE_URL}/rest/v1/clients?portal_token=eq.${portalToken}&select=id,deposit_paid_at`,
    { headers: { apikey: key, Authorization: `Bearer ${key}` } }
  );
  const clients = await clientRes.json();
  if (!clients.length) return json(404, { error: 'Client not found' });
  const client = clients[0];
  if (!client.deposit_paid_at) return json(403, { error: 'Deposit not confirmed' });

  let payload;
  try { payload = JSON.parse(event.body); } catch { return json(400, { error: 'Invalid JSON' }); }

  const { file_name } = payload;
  if (!file_name) return json(400, { error: 'file_name required' });

  const storagePath = `${client.id}/${Date.now()}_${file_name}`;

  // Generate signed upload URL (60 second expiry)
  const signRes = await fetch(
    `${SUPABASE_URL}/storage/v1/object/upload/sign/client-assets/${storagePath}`,
    {
      method: 'POST',
      headers: {
        'Content-Type':  'application/json',
        apikey:          key,
        Authorization:   `Bearer ${key}`,
      },
      body: JSON.stringify({ expiresIn: 60 }),
    }
  );

  if (!signRes.ok) {
    const err = await signRes.text();
    console.error('Sign URL failed:', err);
    return json(500, { error: 'Failed to generate upload URL' });
  }

  const { signedURL } = await signRes.json();
  return json(200, { signed_url: signedURL, storage_path: storagePath });
}
