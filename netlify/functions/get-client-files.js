const SUPABASE_URL  = 'https://tnytkvmfswpupxtlnaad.supabase.co';
const SUPABASE_ANON = process.env.SUPABASE_ANON_KEY;

const CORS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
};

function json(status, body) {
  return { statusCode: status, headers: CORS, body: JSON.stringify(body) };
}

export async function handler(event) {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: CORS, body: '' };
  if (event.httpMethod !== 'GET') return json(405, { error: 'Method Not Allowed' });

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

  const client_id = event.queryStringParameters?.client_id;
  if (!client_id) return json(400, { error: 'client_id required' });

  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  // Fetch file records
  const filesRes = await fetch(
    `${SUPABASE_URL}/rest/v1/client_files?client_id=eq.${client_id}&select=file_name,storage_path,file_type,size_bytes,created_at&order=created_at.desc`,
    { headers: { apikey: key, Authorization: `Bearer ${key}` } }
  );
  const files = await filesRes.json();
  if (!files.length) return json(200, { files: [] });

  // Generate a signed URL for each file (1 hour expiry)
  const withUrls = await Promise.all(files.map(async f => {
    if (!f.storage_path) return { ...f, signed_url: null };
    const signRes = await fetch(
      `${SUPABASE_URL}/storage/v1/object/sign/client-assets/${f.storage_path}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', apikey: key, Authorization: `Bearer ${key}` },
        body: JSON.stringify({ expiresIn: 3600 }),
      }
    );
    const { signedURL } = signRes.ok ? await signRes.json() : {};
    return { ...f, signed_url: signedURL ? `${SUPABASE_URL}/storage/v1${signedURL}` : null };
  }));

  return json(200, { files: withUrls });
}
