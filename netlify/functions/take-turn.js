const { adminClient, botReply } = require('./_shared');

async function decideShouldReply(supabase, thread_id, thread, userText) {
  const streak = thread.bot_skipped_streak || 0;
  if (streak >= 2) return true;

  const { count: humanCount } = await supabase
    .from('messages').select('*', { count: 'exact', head: true })
    .eq('thread_id', thread_id).eq('sender_type', 'human');
  if ((humanCount || 0) <= 1) return true;

  const text = (userText || '').trim();
  let prob;
  if (text.length <= 15)       prob = 0.20;
  else if (text.includes('?')) prob = 0.90;
  else                         prob = 0.65;

  return Math.random() < prob;
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const { thread_id, user_text } = JSON.parse(event.body);
    if (!thread_id) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Chybí thread_id' }) };
    }

    const supabase = adminClient();

    const { data: thread } = await supabase
      .from('threads').select('bot_mode, bot_skipped_streak').eq('id', thread_id).single();
    if (!thread || thread.bot_mode !== 'active') {
      return { statusCode: 200, body: JSON.stringify({ skipped: true, reason: 'bot_mode není active' }) };
    }

    if (user_text !== undefined && user_text !== null) {
      const should = await decideShouldReply(supabase, thread_id, thread, user_text);
      if (!should) {
        await supabase.from('threads')
          .update({ bot_skipped_streak: (thread.bot_skipped_streak || 0) + 1 })
          .eq('id', thread_id);
        return { statusCode: 200, body: JSON.stringify({ skipped: true, reason: 'probability' }) };
      }
      await supabase.from('threads')
        .update({ bot_skipped_streak: 0 }).eq('id', thread_id);
    }

    const result = await botReply(supabase, thread_id);
    return { statusCode: 200, body: JSON.stringify(result) };
  } catch (e) {
    console.error('[take-turn] chyba:', e.message);
    return { statusCode: 500, body: JSON.stringify({ error: e.message }) };
  }
};
