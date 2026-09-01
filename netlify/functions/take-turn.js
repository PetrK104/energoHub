const { adminClient } = require('./_shared');

const GLOBAL_INSTRUCTIONS = "Odpovídej vždy v češtině. Veď přirozený konverzační příspěvek do diskuzního vlákna, reaguj konkrétně na to, co bylo řečeno naposled. Buď stručný: 2 až 5 vět. Nepředstavuj se jménem, jen piš svůj příspěvek přímo. Zůstaň důsledně ve své roli.";

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  try {
    const { thread_id } = JSON.parse(event.body);
    if (!thread_id) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Chybí thread_id' }) };
    }

    const supabase = adminClient();

    const { data: thread, error: threadErr } = await supabase
      .from('threads').select('*').eq('id', thread_id).single();
    if (threadErr || !thread) {
      return { statusCode: 404, body: JSON.stringify({ error: 'Vlákno nenalezeno' }) };
    }
    if (thread.bot_mode !== 'active') {
      return { statusCode: 200, body: JSON.stringify({ skipped: true, reason: 'bot_mode je disabled' }) };
    }

    const { data: bots, error: botsErr } = await supabase
      .from('bots').select('*').eq('thread_id', thread_id).order('turn_order', { ascending: true });
    if (botsErr || !bots || bots.length === 0) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Vlákno nemá žádné boty' }) };
    }

    const { data: messages, error: msgErr } = await supabase
      .from('messages').select('*, bots(name)').eq('thread_id', thread_id).order('created_at', { ascending: true });
    if (msgErr) {
      return { statusCode: 500, body: JSON.stringify({ error: msgErr.message }) };
    }

    const lastBotMsg = [...messages].reverse().find(m => m.sender_type === 'bot');
    let nextIndex = 0;
    if (lastBotMsg) {
      const lastIdx = bots.findIndex(b => b.id === lastBotMsg.bot_id);
      nextIndex = lastIdx === -1 ? 0 : (lastIdx + 1) % bots.length;
    }
    const bot = bots[nextIndex];

    const items = [{ role: 'user', content: `[Téma diskuze]: ${thread.topic}${thread.body ? '\n\n[Text otázky]: ' + thread.body : ''}` }];
    for (const m of messages) {
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

    const aiResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1000,
        system: bot.persona + '\n\n' + GLOBAL_INSTRUCTIONS,
        messages: merged
      })
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error('[take-turn] Claude API error', aiResponse.status, errText);
      return { statusCode: 502, body: JSON.stringify({ error: `Claude API ${aiResponse.status}: ${errText}` }) };
    }

    const aiData = await aiResponse.json();
    const text = (aiData.content || []).filter(b => b.type === 'text').map(b => b.text).join('\n').trim();

    const { error: insertErr } = await supabase.from('messages').insert({
      thread_id, sender_type: 'bot', bot_id: bot.id, text: text || '(prázdná odpověď)'
    });
    if (insertErr) {
      return { statusCode: 500, body: JSON.stringify({ error: insertErr.message }) };
    }

    return { statusCode: 200, body: JSON.stringify({ ok: true, bot: bot.name }) };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ error: e.message }) };
  }
};
