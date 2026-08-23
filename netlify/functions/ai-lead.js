const TELEGRAM_CHAT_ID = '6193238817';

const ALLOWED_ORIGINS = [
  'https://blatantengagement.com',
  'https://ai.blatantengagement.com',
];

function corsHeaders(origin) {
  return {
    'Access-Control-Allow-Origin': ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0],
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

export async function handler(event) {
  const CORS = corsHeaders(event.headers.origin || event.headers.Origin);

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: CORS, body: '' };
  }
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: CORS, body: 'Method Not Allowed' };
  }

  let fields;
  try {
    const params = new URLSearchParams(event.body);
    fields = Object.fromEntries(params.entries());
  } catch (err) {
    return { statusCode: 400, headers: CORS, body: 'Bad Request' };
  }

  const { name, business, email, phone, contact_pref, package: pkg, challenge, website, ts } = fields;

  // Honeypot + timing check — reject silently (200 OK, no Telegram ping) so
  // a bot can't tell it was caught.
  const elapsedMs = Date.now() - Number(ts || 0);
  if (website || !ts || elapsedMs < 3000) {
    return { statusCode: 200, headers: CORS, body: 'OK' };
  }

  const lines = [
    '🤖 New AI Consulting Lead',
    `👤 ${name || '—'}`,
    `🏢 ${business || '—'}`,
    `📧 ${email || '—'}`,
    `📞 ${phone || '—'}`,
    `📬 Prefers: ${contact_pref || '—'}`,
    `📦 Interested in: ${pkg || '—'}`,
    challenge ? `💬 Challenge: ${challenge}` : null,
  ].filter(Boolean).join('\n');

  try {
    const res = await fetch(
      `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text: lines }),
      }
    );
    if (!res.ok) {
      const err = await res.text();
      console.error('Telegram error:', err);
      return { statusCode: 500, headers: CORS, body: 'Telegram failed' };
    }
  } catch (err) {
    console.error('Telegram fetch error:', err);
    return { statusCode: 500, headers: CORS, body: 'Telegram failed' };
  }

  return { statusCode: 200, headers: CORS, body: 'OK' };
}
