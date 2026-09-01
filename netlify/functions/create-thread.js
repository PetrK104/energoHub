const { adminClient, getUserFromEvent } = require('./_shared');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  const user = await getUserFromEvent(event);
  if (!user) {
    return { statusCode: 401, body: JSON.stringify({ error: 'Musíš být přihlášený' }) };
  }

  // Kontrola env proměnných
  if (!process.env.SUPABASE_URL) {
    return { statusCode: 500, body: JSON.stringify({ error: '[env] SUPABASE_URL není nastavena' }) };
  }
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return { statusCode: 500, body: JSON.stringify({ error: '[env] SUPABASE_SERVICE_ROLE_KEY není nastavena' }) };
  }

  try {
    const { topic, body, bots } = JSON.parse(event.body);
    if (!topic || !body) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Chybí nadpis nebo text otázky' }) };
    }
    const botList = Array.isArray(bots) ? bots : [];

    const supabase = adminClient();

    const { data: thread, error: threadErr } = await supabase
      .from('threads').insert({ topic, body, created_by: user.id, bot_mode: botList.length > 0 ? 'active' : 'disabled' }).select().single();
    if (threadErr) {
      return { statusCode: 500, body: JSON.stringify({ error: '[threads insert] ' + threadErr.message, detail: threadErr.details, hint: threadErr.hint }) };
    }

    if (botList.length > 0) {
      const botRows = botList.map((b, i) => ({
        thread_id: thread.id, name: b.name, persona: b.persona, color: b.color || '#6C8EF5', turn_order: i
      }));
      const { error: botsErr } = await supabase.from('bots').insert(botRows);
      if (botsErr) {
        return { statusCode: 500, body: JSON.stringify({ error: '[bots insert] ' + botsErr.message, detail: botsErr.details, hint: botsErr.hint }) };
      }
    }

    return { statusCode: 200, body: JSON.stringify({ ok: true, thread_id: thread.id }) };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ error: '[exception] ' + e.message }) };
  }
};
