const { schedule } = require('@netlify/functions');
const { adminClient } = require('./_shared');

const GLOBAL_INSTRUCTIONS = "Odpovídej vždy v češtině. Veď přirozený konverzační příspěvek do diskuzního vlákna, reaguj konkrétně na to, co bylo řečeno naposled. Buď stručný: 2 až 5 vět. Nepředstavuj se jménem, jen piš svůj příspěvek přímo. Zůstaň důsledně ve své roli.";
const STALE_REPLY_DAYS = 2;
const MAX_THREADS_PER_RUN = 2;

const claudeCall = async (system, messages) => {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({ model: 'claude-sonnet-4-6', max_tokens: 1000, system, messages })
  });
  if (!res.ok) {
    const err = await res.text();
    console.error('[auto-reply] Claude API error', res.status, err);
    return null;
  }
  const data = await res.json();
  return (data.content || []).filter(b => b.type === 'text').map(b => b.text).join('\n').trim() || null;
};

const botReply = async (supabase, thread, bots, messages) => {
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
  if (!text) { console.log('[auto-reply] Claude vrátil prázdný text pro vlákno', thread.id); return; }
  const { error: insertErr } = await supabase.from('messages').insert({ thread_id: thread.id, sender_type: 'bot', bot_id: bot.id, text });
  if (insertErr) {
    console.error('[auto-reply] Supabase insert error ve vlákně', thread.id, insertErr.message);
  } else {
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

  // Pro každé vlákno načti boty + poslední zprávu, vyřaď vlákna kde příští bot = autor poslední zprávy
  const eligible = [];
  for (const thread of threads) {
    const { data: bots } = await supabase.from('bots').select('*').eq('thread_id', thread.id).order('turn_order', { ascending: true });
    if (!bots || bots.length === 0) continue;

    const { data: lastMsg } = await supabase
      .from('messages').select('created_at, sender_type, bot_id').eq('thread_id', thread.id)
      .order('created_at', { ascending: false }).limit(1).maybeSingle();

    const lastActivity = lastMsg ? lastMsg.created_at : thread.created_at;
    if (lastActivity >= replyCutoff) continue; // příliš čerstvé

    // Urči příštího bota na řadě
    const lastBotMsg = lastMsg && lastMsg.sender_type === 'bot' ? lastMsg : null;
    let nextIndex = 0;
    if (lastBotMsg) {
      const lastIdx = bots.findIndex(b => b.id === lastBotMsg.bot_id);
      nextIndex = lastIdx === -1 ? 0 : (lastIdx + 1) % bots.length;
    }
    const nextBot = bots[nextIndex];

    // Přeskoč pokud by příští bot psal sám sobě (poslední zpráva je od něj)
    if (lastMsg && lastMsg.sender_type === 'bot' && lastMsg.bot_id === nextBot.id) continue;

    eligible.push({ thread, bots, lastActivity });
  }

  // Seřaď podle poslední aktivity — novější vlákna mají přednost
  eligible.sort((a, b) => new Date(b.lastActivity) - new Date(a.lastActivity));

  // Náhodně vyber z prvních 4 (nebo méně) aby se střídala vlákna
  const pool = eligible.slice(0, 4);
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  const toProcess = pool.slice(0, MAX_THREADS_PER_RUN);

  console.log('[auto-reply] Vhodných vláken:', eligible.length, '— zpracovávám:', toProcess.length);

  for (const { thread, bots } of toProcess) {
    try {
      const { data: messages } = await supabase.from('messages').select('*, bots(name)').eq('thread_id', thread.id).order('created_at', { ascending: true });
      await botReply(supabase, thread, bots, messages || []);
    } catch (err) {
      console.error('[auto-reply] Chyba ve vlákně', thread.id, err.message);
    }
  }

  return { statusCode: 200 };
};

exports.handler = schedule('0 10 * * *', handler);
