const TELEGRAM_CHAT_ID = '6193238817';
const SUPABASE_URL     = 'https://tnytkvmfswpupxtlnaad.supabase.co';

export async function handler(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  let record;
  try {
    const body = JSON.parse(event.body);
    // Supabase webhook wraps the row in `record`
    record = body.record;
    if (!record) throw new Error('No record in payload');
  } catch (err) {
    console.error('Bad payload:', err);
    return { statusCode: 400, body: 'Bad Request' };
  }

  const { name, business_name, email, phone } = record;

  // ── 1. Telegram notification ──────────────────────────────────────────────
  try {
    const msg = `New BE Lead\n👤 ${name}\n🏢 ${business_name}\n📧 ${email}\n📞 ${phone || 'not provided'}`;
    await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text: msg }),
    });
  } catch (err) {
    console.error('Telegram error:', err);
    // Non-fatal — continue to email
  }

  // ── 2. Generate reply with Claude ─────────────────────────────────────────
  let replyText;
  try {
    const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 300,
        system: 'You are Brad, a web developer at Blatant Engagement. Write a short, warm reply acknowledging their inquiry. Use their name and business name. Tell them you\'ll follow up personally within a few hours. Ask if they have a logo and photos of their business. Sign off as Brad. Keep it under 5 sentences. Do not use emoji.',
        messages: [
          {
            role: 'user',
            content: `Write a reply to this lead: Name: ${name}, Business: ${business_name}, Message: ${record.message || ''}`,
          },
        ],
      }),
    });
    const claudeData = await claudeRes.json();
    replyText = claudeData.content?.[0]?.text;
    if (!replyText) throw new Error('Empty Claude response');
  } catch (err) {
    console.error('Claude error:', err);
    // Fallback reply
    replyText = `Hi ${name},\n\nThanks for reaching out about ${business_name}! I'll follow up with you personally within a few hours. In the meantime, do you have a logo and any photos of your business?\n\nBrad`;
  }

  // ── 3. Send reply via Resend ───────────────────────────────────────────────
  try {
    const resendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Brad at Blatant Engagement <hello@blatantengagement.com>',
        to: email,
        subject: `Hey ${name} — got your message`,
        text: replyText,
      }),
    });
    const resendData = await resendRes.json();
    if (!resendRes.ok) throw new Error(JSON.stringify(resendData));
  } catch (err) {
    console.error('Resend error:', err);
    return { statusCode: 500, body: 'Email send failed' };
  }

  // ── 4. Create client record so lead appears in pipeline ───────────────────
  try {
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (key) {
      const portal_token = crypto.randomUUID();
      const clientRes = await fetch(`${SUPABASE_URL}/rest/v1/clients`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: key,
          Authorization: `Bearer ${key}`,
          Prefer: 'return=representation',
        },
        body: JSON.stringify({
          name:          name,
          email:         email,
          phone:         phone || null,
          business_name: business_name || null,
          portal_token,
          status:        'lead',
          lead_id:       record.id,
          stage_updated_at: new Date().toISOString(),
        }),
      });
      if (clientRes.ok) {
        const [client] = await clientRes.json();
        // Link client_id back to leads row
        await fetch(`${SUPABASE_URL}/rest/v1/leads?id=eq.${record.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            apikey: key,
            Authorization: `Bearer ${key}`,
          },
          body: JSON.stringify({ client_id: client.id }),
        });
      }
    }
  } catch (err) {
    console.error('Client record creation failed:', err);
    // Non-fatal — lead still captured in leads table
  }

  return { statusCode: 200, body: 'OK' };
}
