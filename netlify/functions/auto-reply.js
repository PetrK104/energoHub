const { schedule } = require('@netlify/functions');
const { adminClient } = require('./_shared');

const GLOBAL_INSTRUCTIONS = "Odpovídej vždy v češtině. Veď přirozený konverzační příspěvek do diskuzního vlákna, reaguj konkrétně na to, co bylo řečeno naposled. Buď stručný: 2 až 5 vět. Nepředstavuj se jménem, jen piš svůj příspěvek přímo. Zůstaň důsledně ve své roli.";
const STALE_REPLY_DAYS = 3;
const MAX_THREADS_PER_RUN = 3;

async function botReply(supabase, thread, bots, messages) {
  const lastBotMsg = [...(messages || [])].reverse().find(m => m.sender_type === 'bot');
  let nextIndex = 0;
  if (lastBotMsg) {
    const lastIdx = bots.findIndex(b => b.id === lastBotMsg.bot_id);
    nextIndex = lastIdx === -1 ? 0 : (lastIdx + 1) % bots.length;
  }
  const bot = bots[nextIndex];

  const items = [{ role: 'user', content: `[Téma diskuze]: ${thread.topic}${thread.body ? '\n\n[Text otázky]: ' + thread.body : ''}` }];
  for (const m of (messages || [])) {
    if (m.sender_type === 'bot' && m.bot_id === bot.id) {
      items.push({ role: 'assistant', content: m.text });
    } else {
      const speaker = m.sender_type === 'bot' ? (m.bots?.name || 'Bot') : 'Uživatel';
      items.push({ role: 'user', content: `[${speaker}]: ${m.text}` });
    }
  }
  const merged = [];
  for (const item of items) {
    if (merged.length && merged[merged.length - 1].role === item.role) {
      merged[merged.length - 1].content += '\n\n' + item.content;
    } else {
      merged.push({ ...item });
    }
  }

  const text = await claudeCall(bot.persona + '\n\n' + GLOBAL_INSTRUCTIONS, merged);
  if (text) {
    await supabase.from('messages').insert({ thread_id: thread.id, sender_type: 'bot', bot_id: bot.id, text });
    console.log('[auto-reply] Bot', bot.name, 'napsal do vlákna', thread.id);
  }
}

const handler = async () => {
  const supabase = adminClient();

  const { data: threads } = await supabase.from('threads').select('*').eq('bot_mode', 'active');
  if (!threads || threads.length === 0) {
    console.log('[auto-reply] Žádná aktivní vlákna.');
    return { statusCode: 200 };
  }

  const replyCutoff = new Date(Date.now() - STALE_REPLY_DAYS * 24 * 60 * 60 * 1000).toISOString();
  const staleThreads = [];
  for (const thread of threads) {
    const { data: lastMsg } = await supabase
      .from('messages').select('created_at').eq('thread_id', thread.id)
      .order('created_at', { ascending: false }).limit(1).maybeSingle();
    const lastActivity = lastMsg ? lastMsg.created_at : thread.created_at;
    if (lastActivity < replyCutoff) staleThreads.push(thread);
  }

  const toProcess = staleThreads.slice(0, MAX_THREADS_PER_RUN);
  console.log('[auto-reply] Stale vláken:', staleThreads.length, '— zpracovávám:', toProcess.length);

  for (const thread of toProcess) {
    try {
      const { data: bots } = await supabase.from('bots').select('*').eq('thread_id', thread.id).order('turn_order', { ascending: true });
      if (!bots || bots.length === 0) continue;
      const { data: messages } = await supabase.from('messages').select('*, bots(name)').eq('thread_id', thread.id).order('created_at', { ascending: true });
      await botReply(supabase, thread, bots, messages || []);
    } catch (err) {
      console.error('[auto-reply] Chyba ve vlákně', thread.id, err.message);
    }
  }

  return { statusCode: 200 };
};

exports.handler = schedule('0 10 * * *', handler);
