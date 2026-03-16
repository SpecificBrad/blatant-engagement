const SUPABASE_URL = 'https://tnytkvmfswpupxtlnaad.supabase.co';

const CORS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, x-portal-token',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
};

function json(status, body) {
  return { statusCode: status, headers: CORS, body: JSON.stringify(body) };
}

export async function handler(event) {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: CORS, body: '' };
  if (event.httpMethod !== 'GET') return json(405, { error: 'Method Not Allowed' });

  const portalToken = event.headers['x-portal-token'];
  if (!portalToken) return json(401, { error: 'Missing portal token' });

  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  // Verify portal token → get client
  const clientRes = await fetch(
    `${SUPABASE_URL}/rest/v1/clients?portal_token=eq.${portalToken}&select=id,status,preview_url,live_url`,
    { headers: { apikey: key, Authorization: `Bearer ${key}` } }
  );
  const clients = await clientRes.json();
  if (!clients.length) return json(404, { error: 'Client not found' });
  const client = clients[0];

  // Fetch files and invoices in parallel
  const [filesRes, invoicesRes] = await Promise.all([
    fetch(
      `${SUPABASE_URL}/rest/v1/client_files?client_id=eq.${client.id}&select=file_name,file_type,size_bytes,created_at&order=created_at.desc`,
      { headers: { apikey: key, Authorization: `Bearer ${key}` } }
    ),
    fetch(
      `${SUPABASE_URL}/rest/v1/invoices?client_id=eq.${client.id}&select=description,amount,type,status,paid_at,created_at&order=created_at.asc`,
      { headers: { apikey: key, Authorization: `Bearer ${key}` } }
    ),
  ]);

  const files    = filesRes.ok    ? await filesRes.json()    : [];
  const invoices = invoicesRes.ok ? await invoicesRes.json() : [];

  return json(200, {
    status:      client.status,
    preview_url: client.preview_url,
    live_url:    client.live_url,
    files,
    invoices,
  });
}
