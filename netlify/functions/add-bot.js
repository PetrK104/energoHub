const { adminClient, getUserFromEvent } = require('./_shared');

const GLOBAL_INSTRUCTIONS = "Odpovídej vždy v češtině. Veď přirozený konverzační příspěvek do diskuzního vlákna, reaguj konkrétně na to, co bylo řečeno naposled. Buď stručný: 2 až 5 vět. Nepředstavuj se jménem, jen piš svůj příspěvek přímo. Zůstaň důsledně ve své roli.";
const BOT_COLORS = ['#b7f13d', '#3db4f1', '#f59e0b', '#a78bfa', '#f87171'];

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  const user = await getUserFromEvent(event);
  if (!user) {
    return { statusCode: 401, body: JSON.stringify({ error: 'Musíš být přihlášený' }) };
  }

  try {
    const { thread_id, name, persona, write_comment } = JSON.parse(event.body);
    if (!thread_id || !name || !persona) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Chybí povinné pole' }) };
    }

    const supabase = adminClient();

    const { data: profile } = await supabase
      .from('profiles').select('role').eq('id', user.id).single();
    if (!profile || profile.role !== 'admin') {
      return { statusCode: 403, body: JSON.stringify({ error: 'Pouze admin může přidat bota' }) };
    }

    const { data: thread, error: threadErr } = await supabase
      .from('threads').select('*').eq('id', thread_id).single();
    if (threadErr || !thread) {
      return { statusCode: 404, body: JSON.stringify({ error: 'Vlákno nenalezeno' }) };
    }

    const { data: existingBots } = await supabase
      .from('bots').select('turn_order').eq('thread_id', thread_id).order('turn_order', { ascending: false }).limit(1);
    const nextTurnOrder = existingBots && existingBots.length > 0 ? existingBots[0].turn_order + 1 : 0;
    const color = BOT_COLORS[nextTurnOrder % BOT_COLORS.length];

    const { data: bot, error: botErr } = await supabase
      .from('bots').insert({ thread_id, name, persona, color, turn_order: nextTurnOrder }).select().single();
    if (botErr) {
      return { statusCode: 500, body: JSON.stringify({ error: botErr.message }) };
    }

    if (write_comment) {
      const { data: messages } = await supabase
        .from('messages').select('*, bots(name)').eq('thread_id', thread_id).order('created_at', { ascending: true });

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

      if (aiResponse.ok) {
        const aiData = await aiResponse.json();
        const text = (aiData.content || []).filter(b => b.type === 'text').map(b => b.text).join('\n').trim();
        if (text) {
          await supabase.from('messages').insert({ thread_id, sender_type: 'bot', bot_id: bot.id, text });
        }
      }
    }

    return { statusCode: 200, body: JSON.stringify({ ok: true, bot_id: bot.id }) };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ error: e.message }) };
  }
};
