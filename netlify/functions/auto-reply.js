const { schedule } = require('@netlify/functions');
const { adminClient, botReply, BOT_REPLY_LIMIT } = require('./_shared');

const STALE_REPLY_DAYS = 3;
const MAX_THREADS_PER_RUN = 3;

const handler = async () => {
  const supabase = adminClient();

  const { data: threads } = await supabase
    .from('threads').select('*').eq('bot_mode', 'active');
  if (!threads || threads.length === 0) {
    console.log('[auto-reply] Žádná aktivní vlákna.');
    return { statusCode: 200 };
  }

  const replyCutoff = new Date(Date.now() - STALE_REPLY_DAYS * 24 * 60 * 60 * 1000).toISOString();

  // Rozdělíme vlákna na dvě skupiny:
  // noReply — vlákna bez jediné bot odpovědi (nejvyšší priorita)
  // stale   — vlákna s odpověďmi, ale bez aktivity ≥ 3 dny
  const noReplyThreads = [];
  const staleThreads = [];

  for (const thread of threads) {
    const { count: botCount } = await supabase
      .from('messages').select('*', { count: 'exact', head: true })
      .eq('thread_id', thread.id).eq('sender_type', 'bot');

    if ((botCount || 0) >= BOT_REPLY_LIMIT) {
      // Limit dosažen — deaktivovat aby se příště vynechalo
      await supabase.from('threads').update({ bot_mode: 'disabled' }).eq('id', thread.id);
      continue;
    }

    if ((botCount || 0) === 0) {
      noReplyThreads.push(thread);
      continue;
    }

    const { data: lastMsg } = await supabase
      .from('messages').select('created_at').eq('thread_id', thread.id)
      .order('created_at', { ascending: false }).limit(1).maybeSingle();
    const lastActivity = lastMsg ? lastMsg.created_at : thread.created_at;
    if (lastActivity < replyCutoff) {
      staleThreads.push(thread);
    }
  }

  // Seřadit obě skupiny od nejnovějšího
  noReplyThreads.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  staleThreads.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  // Vybrat: nejprve bez odpovědi, pak stale — dohromady max MAX_THREADS_PER_RUN
  const toProcess = [];
  for (const t of [...noReplyThreads, ...staleThreads]) {
    if (toProcess.length >= MAX_THREADS_PER_RUN) break;
    toProcess.push(t);
  }

  console.log('[auto-reply] Bez odpovědi:', noReplyThreads.length,
              '| Stale:', staleThreads.length,
              '| Zpracovávám:', toProcess.length);

  for (const thread of toProcess) {
    try {
      const result = await botReply(supabase, thread.id);
      console.log('[auto-reply] Vlákno', thread.id, '→', result.ok ? 'ok (' + result.bot + ')' : 'přeskočeno (' + result.reason + ')');
    } catch (err) {
      console.error('[auto-reply] Chyba ve vlákně', thread.id, err.message);
    }
  }

  return { statusCode: 200 };
};

exports.handler = schedule('0 10 */2 * *', handler);
