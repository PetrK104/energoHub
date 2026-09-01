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
    const { thread_id, text } = JSON.parse(event.body);
    if (!thread_id || !text || !text.trim()) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Chybí thread_id nebo text' }) };
    }

    const supabase = adminClient();

    const { error } = await supabase.from('messages').insert({
      thread_id,
      text: text.trim(),
      sender_type: 'human',
      user_id: user.id
    });

    if (error) {
      return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
    }

    return { statusCode: 200, body: JSON.stringify({ ok: true }) };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ error: e.message }) };
  }
};
