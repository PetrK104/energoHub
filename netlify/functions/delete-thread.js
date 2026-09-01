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
    const { thread_id } = JSON.parse(event.body);
    if (!thread_id) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Chybí thread_id' }) };
    }

    const supabase = adminClient();

    const { data: thread } = await supabase
      .from('threads').select('created_by').eq('id', thread_id).single();

    if (!thread) {
      return { statusCode: 404, body: JSON.stringify({ error: 'Vlákno nenalezeno' }) };
    }

    const { data: profile } = await supabase
      .from('profiles').select('role').eq('id', user.id).single();

    const isAdmin = profile && profile.role === 'admin';
    const isOwner = thread.created_by === user.id;

    if (!isOwner && !isAdmin) {
      return { statusCode: 403, body: JSON.stringify({ error: 'Nemáš oprávnění smazat toto vlákno' }) };
    }

    // Smazat v pořadí kvůli FK závislostem
    await supabase.from('messages').delete().eq('thread_id', thread_id);
    await supabase.from('bots').delete().eq('thread_id', thread_id);

    const { error: deleteErr } = await supabase.from('threads').delete().eq('id', thread_id);
    if (deleteErr) {
      return { statusCode: 500, body: JSON.stringify({ error: deleteErr.message }) };
    }

    return { statusCode: 200, body: JSON.stringify({ ok: true }) };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ error: e.message }) };
  }
};
