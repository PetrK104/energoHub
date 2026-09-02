// Jednorázový script: přepíše všechny existující bot zprávy lidštějším stylem.
// Použití: node scripts/rewrite-bot-messages.js
// Vyžaduje ANTHROPIC_API_KEY v .env

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL             = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ANTHROPIC_API_KEY        = process.env.ANTHROPIC_API_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Chybí SUPABASE_URL nebo SUPABASE_SERVICE_ROLE_KEY v .env');
  process.exit(1);
}
if (!ANTHROPIC_API_KEY) {
  console.error('Chybí ANTHROPIC_API_KEY v .env');
  process.exit(1);
}

const GLOBAL_INSTRUCTIONS = `Piš vždy jako běžný člověk, který právě něco napsal do chatu nebo na fórum, ne jako AI asistent. Nikdy nepůsobíš vyváženě, vyčerpávajícím způsobem ani stylisticky uhlazeně tak, jak to typicky dělá jazykový model — to je první věc, podle které lidi AI text poznají. Délka odpovědi se má pokaždé výrazně lišit: někdy stačí jedna krátká věta nebo reakce o pár slovech, jindy je na místě delší odstavec s vlastním názorem nebo zkušeností, ale nikdy nepiš odpovědi stále podobně dlouhé nebo stejně strukturované, protože jednotná délka a stejný rytmus napříč odpověďmi je druhý nejsnazší způsob, jak poznat, že texty psal model. Vyhýbej se pomlčkám uprostřed vět (–, —) všude tam, kde by je běžný člověk v rychlé neformální zprávě nepoužil, a vyhýbej se typickým "AI" spojkám a frázím jako "nicméně", "nadto", "je třeba zmínit", "v neposlední řadě", "co je důležité", "abych to shrnul", "doufám, že to pomohlo", ani neotvírej odpověď frázemi typu "skvělá otázka", "to je zajímavé téma", "rozumím, že...". Nepoužívej odrážky, číslované seznamy, tučné písmo ani žádné jiné formátování uvnitř odpovědi — piš plynulý text tak, jak by ho napsal člověk v běžné zprávě, klidně i s nedokonalou strukturou, nedokončenou myšlenkou nebo odbočkou stranou, která se nikam nevrátí. Věty ať mají různou délku a nepravidelný rytmus, ne uměle vyváženou stavbu, a klidně nech text obsahovat drobné jazykové nepřesnosti, hovorové výrazy nebo neformální zkratky, pokud to odpovídá tomu, jak by daná osoba přirozeně psala. Neopakuj otázku zpátky v odpovědi, nezačínej všechny odpovědi stejným typem věty a nekonči odpověď obecným povzbuzením ani shrnutím toho, co jsi právě napsal. Cílem je, aby text nešel od skutečné lidské zprávy rozeznat: přirozeně nedokonalý, s vlastním rytmem, nikdy ne uhlazený a strukturovaný jako výstup AI modelu.`;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function callClaude(systemPrompt, messages) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 1000,
      system: systemPrompt,
      messages
    })
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Claude API ${res.status}: ${err}`);
  }

  const data = await res.json();
  return (data.content || []).filter(b => b.type === 'text').map(b => b.text).join('\n').trim();
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  // Načíst všechna vlákna
  const { data: threads, error: threadErr } = await supabase
    .from('threads').select('id, topic, body').order('created_at', { ascending: true });
  if (threadErr) { console.error('Chyba načítání vláken:', threadErr.message); process.exit(1); }

  console.log(`Načteno ${threads.length} vláken.`);

  for (const thread of threads) {
    // Načíst všechny zprávy vlákna v pořadí
    const { data: messages, error: msgErr } = await supabase
      .from('messages')
      .select('id, text, sender_type, bot_id, created_at, bots(id, name, persona)')
      .eq('thread_id', thread.id)
      .order('created_at', { ascending: true });

    if (msgErr) { console.error(`Chyba zpráv vlákna ${thread.id}:`, msgErr.message); continue; }

    const botMessages = messages.filter(m => m.sender_type === 'bot');
    if (!botMessages.length) continue;

    console.log(`\nVlákno: "${thread.topic}" — ${botMessages.length} bot zpráv`);

    for (const botMsg of botMessages) {
      const bot = botMsg.bots;
      if (!bot) { console.log(`  [přeskočeno — bot nenalezen pro zprávu ${botMsg.id}]`); continue; }

      // Sestavit kontext: vše PŘED touto zprávou
      const prior = messages.filter(m => m.created_at < botMsg.created_at);

      const contextMessages = [
        { role: 'user', content: `[Téma diskuze]: ${thread.topic}${thread.body ? '\n\n[Text otázky]: ' + thread.body : ''}` }
      ];

      for (const m of prior) {
        if (m.sender_type === 'bot' && m.bot_id === bot.id) {
          contextMessages.push({ role: 'assistant', content: m.text });
        } else {
          const speaker = m.sender_type === 'bot' ? (m.bots?.name || 'Bot') : 'Uživatel';
          contextMessages.push({ role: 'user', content: `[${speaker}]: ${m.text}` });
        }
      }

      // Sloučit po sobě jdoucí stejné role (API požadavek)
      const merged = [];
      for (const item of contextMessages) {
        if (merged.length && merged[merged.length - 1].role === item.role) {
          merged[merged.length - 1].content += '\n\n' + item.content;
        } else {
          merged.push({ ...item });
        }
      }

      const systemPrompt = bot.persona + '\n\n' + GLOBAL_INSTRUCTIONS;

      try {
        const newText = await callClaude(systemPrompt, merged);
        console.log(`  [${bot.name}] "${botMsg.text.slice(0, 60)}…"`);
        console.log(`           → "${newText.slice(0, 60)}…"`);

        const { error: updateErr } = await supabase
          .from('messages').update({ text: newText }).eq('id', botMsg.id);
        if (updateErr) console.error(`  Chyba update:`, updateErr.message);

        await sleep(600); // pauza mezi voláními API
      } catch (e) {
        console.error(`  Chyba Claude API:`, e.message);
        await sleep(2000);
      }
    }
  }

  console.log('\nHotovo.');
}

main();
