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

function supa(path, opts = {}) {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return fetch(`${SUPABASE_URL}${path}`, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      apikey: key,
      Authorization: `Bearer ${key}`,
      Prefer: 'return=minimal',
      ...(opts.headers || {}),
    },
  });
}

export async function handler(event) {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: CORS, body: '' };
  if (event.httpMethod !== 'POST') return json(405, { error: 'Method Not Allowed' });

  const portalToken = event.headers['x-portal-token'];
  if (!portalToken) return json(401, { error: 'Missing portal token' });

  // Verify token → get client
  const clientRes = await supa(`/rest/v1/clients?portal_token=eq.${portalToken}&select=id,agreement_status,deposit_paid_at`);
  const clients = await clientRes.json();
  if (!clients.length) return json(404, { error: 'Client not found' });
  const client = clients[0];

  if (!client.deposit_paid_at) return json(403, { error: 'Deposit not confirmed' });

  let payload;
  try { payload = JSON.parse(event.body); } catch { return json(400, { error: 'Invalid JSON' }); }

  const { brand_colors, brand_fonts, brand_notes, file_records } = payload;

  // Insert discovery responses
  const discoveries = [
    ['brand_colors', brand_colors],
    ['brand_fonts',  brand_fonts],
    ['brand_notes',  brand_notes],
  ].filter(([, v]) => v && v.trim());

  for (const [key, answer] of discoveries) {
    await supa('/rest/v1/discovery_responses', {
      method: 'POST',
      body: JSON.stringify({ client_id: client.id, question_key: key, answer: answer.trim() }),
    }).catch(e => console.error('discovery insert failed:', e));
  }

  // Insert file records (storage path logged after direct upload)
  if (Array.isArray(file_records) && file_records.length) {
    for (const f of file_records) {
      await supa('/rest/v1/client_files', {
        method: 'POST',
        body: JSON.stringify({
          client_id:    client.id,
          file_name:    f.file_name,
          storage_path: f.storage_path,
          file_type:    f.file_type,
          size_bytes:   f.size_bytes,
        }),
      }).catch(e => console.error('file record insert failed:', e));
    }
  }

  // Move client to in_progress
  const now = new Date().toISOString();
  await supa(`/rest/v1/clients?id=eq.${client.id}`, {
    method: 'PATCH',
    body: JSON.stringify({
      collateral_submitted_at: now,
      dev_start_at:            now,
      status:                  'in_progress',
      stage_updated_at:        now,
    }),
  });

  // Log activity
  await supa('/rest/v1/activity_log', {
    method: 'POST',
    body: JSON.stringify({
      client_id:    client.id,
      event_type:   'collateral_submitted',
      description:  'Client submitted brand assets and discovery responses.',
      performed_by: 'client',
    }),
  }).catch(() => {});

  return json(200, { success: true });
}
