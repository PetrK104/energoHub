const { adminClient, getUserFromEvent } = require('./_shared');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  const user = await getUserFromEvent(event);
  if (!user) {
    return { statusCode: 401, body: JSON.stringify({ error: 'Musíš být přihlášený' }) };
  }

  try {
    const { thread_id, bot_mode } = JSON.parse(event.body);
    if (!thread_id || !['active', 'disabled'].includes(bot_mode)) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Neplatný požadavek' }) };
    }

    const supabase = adminClient();

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    if (!profile || profile.role !== 'admin') {
      return { statusCode: 403, body: JSON.stringify({ error: 'Jen pro adminy' }) };
    }

    const update = { bot_mode };
    if (bot_mode === 'disabled') {
      update.bot_disabled_at = new Date().toISOString();
      update.bot_disabled_by = user.id;
    }

    const { error: updateErr } = await supabase.from('threads').update(update).eq('id', thread_id);
    if (updateErr) {
      return { statusCode: 500, body: JSON.stringify({ error: updateErr.message }) };
    }

    return { statusCode: 200, body: JSON.stringify({ ok: true }) };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ error: e.message }) };
  }
};
