const { createClient } = require('@supabase/supabase-js');

const BOT_REPLY_LIMIT = 10; // fallback pro vlákna bez bot_reply_limit

// Model pro odpovědi botů. Lze přepsat proměnnou ANTHROPIC_MODEL na Netlify, bez úpravy kódu.
const AI_MODEL = process.env.ANTHROPIC_MODEL || 'claude-sonnet-5-5';

const GLOBAL_INSTRUCTIONS = "Odpovídej vždy v češtině. Nepředstavuj se jménem, jen piš svůj příspěvek přímo. Zůstaň důsledně ve své roli.\n\nPiš vždy jako běžný člověk, který právě něco napsal do chatu nebo na fórum, ne jako AI asistent. Nikdy nepůsobíš vyváženě, vyčerpávajícím způsobem ani stylisticky uhlazeně tak, jak to typicky dělá jazykový model — to je první věc, podle které lidi AI text poznají. Délka odpovědi se má pokaždé výrazně lišit: někdy stačí jedna krátká věta nebo reakce o pár slovech, jindy je na místě delší odstavec s vlastním názorem nebo zkušeností, ale nikdy nepiš odpovědi stále podobně dlouhé nebo stejně strukturované, protože jednotná délka a stejný rytmus napříč odpověďmi je druhý nejsnazší způsob, jak poznat, že texty psal model. Vyhýbej se pomlčkám uprostřed vět (–, —) všude tam, kde by je běžný člověk v rychlé neformální zprávě nepoužil, a vyhýbej se typickým \"AI\" spojkám a frázím jako \"nicméně\", \"nadto\", \"je třeba zmínit\", \"v neposlední řadě\", \"co je důležité\", \"abych to shrnul\", \"doufám, že to pomohlo\", ani neotvírej odpověď frázemi typu \"skvělá otázka\", \"to je zajímavé téma\", \"rozumím, že...\". Nepoužívej odrážky, číslované seznamy, tučné písmo ani žádné jiné formátování uvnitř odpovědi — piš plynulý text tak, jak by ho napsal člověk v běžné zprávě, klidně i s nedokonalou strukturou, nedokončenou myšlenkou nebo odbočkou stranou, která se nikam nevrátí. Věty ať mají různou délku a nepravidelný rytmus, ne uměle vyváženou stavbu, a klidně nech text obsahovat drobné jazykové nepřesnosti, hovorové výrazy nebo neformální zkratky, pokud to odpovídá tomu, jak by daná osoba přirozeně psala. Neopakuj otázku zpátky v odpovědi, nezačínej všechny odpovědi stejným typem věty a nekonči odpověď obecným povzbuzením ani shrnutím toho, co jsi právě napsal. Cílem je, aby text nešel od skutečné lidské zprávy rozeznat: přirozeně nedokonalý, s vlastním rytmem, nikdy ne uhlazený a strukturovaný jako výstup AI modelu.";

// Věcné hranice: témata, orientační čísla a zákaz poradenství (platí pro všechny boty)
const BOUNDARY_INSTRUCTIONS = "\n\nVěcné hranice: Odpovídej jen na témata kolem JOM (jednotné odběrné místo), FVE (fotovoltaika) a energetiky bytových domů. Jiná témata zdvořile odmítni a vrať řeč zpět k těmto tématům. Neposkytuj právní ani finanční poradenství a nedávej závazná doporučení, u složitějších věcí doporuč obrátit se na odborníka. Všechna čísla, ceny, úspory a návratnosti uváděj jen jako orientační, vždy dej najevo, že jsou orientační, a pro přesnější odhad odkaž na kalkulačku úspor na tomto webu (stránka kalkulacka.html).";

const CLOSING_INSTRUCTION = "\n\nToto je tvůj poslední příspěvek v této diskuzi. Uzavři ji přirozeně — třeba krátkým vyjádřením svého celkového pohledu, postřehem k zamyšlení nebo větou, která dá tématu tečku. Nekladuj žádnou otázku, na kterou by ostatní čekali odpověď. Vůbec nezmiňuj, že je to tvůj poslední příspěvek.";

function pickStyle(noQuestion) {
  const r = Math.random();
  if (r < 0.30) return 'Odpověz 1–2 větami.';
  if (r < 0.75) return 'Odpověz 3–5 větami.';
  if (r < 0.90 || noQuestion) return 'Odpověz podrobněji, max. 2 odstavce.';
  return 'Odpověz stručně a polož uživateli jednu doplňující otázku.';
}

// Rozmanitost odpovědí: model už nepřijímá parametr temperature, proto náhodnost vkládáme my.
// Ke každé odpovědi se náhodně vybere úhel pohledu, začátek, zaměření a tón.
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

const ANGLES = [
  'Doplň nebo upřesni to, co řekl předchozí účastník.',
  'Mírně nesouhlas s tím, co zaznělo, a stručně uveď důvod.',
  'Polož jednu konkrétní doplňující otázku k tématu.',
  'Jednoduše vysvětli pojem nebo krok, který by mohl být pro laika nejasný.',
  'Upozorni na jednu věc, na kterou se při tomto tématu často zapomíná.',
  'Shrň, na čem se diskutující zatím shodují, a co zůstává otevřené.',
  'Reaguj jen na jeden konkrétní bod z poslední zprávy a ostatní vynech.'
];
const OPENINGS = [
  'Začni rovnou věcí, bez úvodní reakce.',
  'Začni krátkou reakcí na předchozí zprávu.',
  'Začni otázkou.',
  'Začni zasazením do praxe SVJ.',
  'Začni jedním konkrétním faktem nebo číslem (s upozorněním, že je orientační).'
];
const FOCUSES = [
  'Zaměř se na praktický dopad pro SVJ a vlastníky bytů.',
  'Zaměř se na peníze: náklady, úspory, návratnost.',
  'Zaměř se na postup a to, co se musí udělat v jakém pořadí.',
  'Zaměř se na pravidla a povinnosti (bez právního poradenství).'
];
const TONES = [
  'Piš věcně.',
  'Piš lehce neformálně.',
  'Piš trochu skepticky, opatrně k velkým slibům.'
];

// noQuestion: poslední příspěvek vlákna se nemá ptát, jen uzavřít
function pickVariety(noQuestion) {
  const angles = noQuestion ? ANGLES.filter(a => !/otázk/i.test(a)) : ANGLES;
  const openings = noQuestion ? OPENINGS.filter(o => !/otázk/i.test(o)) : OPENINGS;
  return '\n' + [pick(angles), pick(openings), pick(FOCUSES), pick(TONES)].join(' ');
}

function adminClient() {
  return createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

async function getUserFromEvent(event) {
  const authHeader = event.headers.authorization || event.headers.Authorization;
  if (!authHeader) return null;
  const token = authHeader.replace('Bearer ', '');
  const anon = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
  const { data, error } = await anon.auth.getUser(token);
  if (error || !data.user) return null;
  return data.user;
}

async function botReply(supabase, thread_id) {
  // 1. Načíst vlákno
  const { data: thread, error: threadErr } = await supabase
    .from('threads').select('*').eq('id', thread_id).single();
  if (threadErr || !thread) return { skipped: true, reason: 'vlákno nenalezeno' };
  if (thread.bot_mode !== 'active') return { skipped: true, reason: 'bot_mode není active' };

  const effectiveLimit = thread.bot_reply_limit || BOT_REPLY_LIMIT;

  // 2. Zkontrolovat limit — atomicky zabránit překročení
  const { count: botCount } = await supabase
    .from('messages').select('*', { count: 'exact', head: true })
    .eq('thread_id', thread_id).eq('sender_type', 'bot');
  if ((botCount || 0) >= effectiveLimit) {
    await supabase.from('threads').update({ bot_mode: 'disabled' }).eq('id', thread_id);
    return { skipped: true, reason: 'limit dosažen' };
  }

  const isLastReply = (botCount || 0) === effectiveLimit - 1;

  // 3. Načíst boty vlákna
  const { data: bots, error: botsErr } = await supabase
    .from('bots').select('*').eq('thread_id', thread_id).order('turn_order', { ascending: true });
  if (botsErr || !bots || bots.length === 0) return { skipped: true, reason: 'žádní boti' };

  // 4. Načíst zprávy vlákna
  const { data: messages, error: msgErr } = await supabase
    .from('messages').select('*, bots(name)').eq('thread_id', thread_id)
    .order('created_at', { ascending: true });
  if (msgErr) throw new Error(msgErr.message);

  // 5. Round-robin: kdo je na řadě
  const lastBotMsg = [...(messages || [])].reverse().find(m => m.sender_type === 'bot');
  let nextIndex = 0;
  if (lastBotMsg) {
    const lastIdx = bots.findIndex(b => b.id === lastBotMsg.bot_id);
    nextIndex = lastIdx === -1 ? 0 : (lastIdx + 1) % bots.length;
  }
  const bot = bots[nextIndex];

  // 6. Sestavit kontext pro Claude
  const items = [{
    role: 'user',
    content: `[Téma diskuze]: ${thread.topic}${thread.body ? '\n\n[Text otázky]: ' + thread.body : ''}`
  }];
  for (const m of (messages || [])) {
    if (m.sender_type === 'bot' && m.bot_id === bot.id) {
      items.push({ role: 'assistant', content: m.text });
    } else {
      const speaker = m.sender_type === 'bot' ? (m.bots?.name || 'Bot') : 'Uživatel';
      items.push({ role: 'user', content: `[${speaker}]: ${m.text}` });
    }
  }
  // Sloučit sousední stejné role
  const merged = [];
  for (const item of items) {
    if (merged.length && merged[merged.length - 1].role === item.role) {
      merged[merged.length - 1].content += '\n\n' + item.content;
    } else {
      merged.push({ ...item });
    }
  }

  // 7. Sestavit dynamické instrukce a zavolat Claude API
  const styleInstruction = '\n\n' + pickStyle(isLastReply) + pickVariety(isLastReply);

  const contextRef = Math.random() < 0.25
    ? '\nNavaž na něco konkrétního, co uživatel řekl dříve v tomto vlákně.'
    : '';

  const prevBotTexts = (messages || [])
    .filter(m => m.sender_type === 'bot' && m.bot_id === bot.id)
    .slice(-3)
    .map(m => m.text.substring(0, 160));
  const prevBotContext = prevBotTexts.length > 0
    ? '\nTvoje poslední odpovědi v tomto vlákně — vyhni se podobné struktuře, začátku i délce:\n'
      + prevBotTexts.map(t => '— ' + t).join('\n')
    : '';

  // Poslední odpověď jiného účastníka: nestavět větu ani začátek podobně
  const lastOther = [...(messages || [])].reverse().find(m => m.sender_type === 'bot' && m.bot_id !== bot.id);
  const otherContext = lastOther
    ? '\nNaposledy napsal jiný účastník, nestav začátek ani větu podobně:\n— ' + lastOther.text.substring(0, 160)
    : '';

  const systemPrompt = bot.persona + '\n\n' + GLOBAL_INSTRUCTIONS + BOUNDARY_INSTRUCTIONS
    + styleInstruction + contextRef + prevBotContext + otherContext
    + (isLastReply ? CLOSING_INSTRUCTION : '');
  const aiResponse = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: AI_MODEL,
      max_tokens: 1000,
      system: systemPrompt,
      messages: merged
    })
  });

  if (!aiResponse.ok) {
    const errText = await aiResponse.text();
    throw new Error(`Claude API ${aiResponse.status}: ${errText}`);
  }

  const aiData = await aiResponse.json();
  const text = (aiData.content || []).filter(b => b.type === 'text').map(b => b.text).join('\n').trim();

  // 8. Uložit zprávu
  const { error: insertErr } = await supabase.from('messages').insert({
    thread_id, sender_type: 'bot', bot_id: bot.id, text: text || '(prázdná odpověď)'
  });
  if (insertErr) throw new Error(insertErr.message);

  // 9. Pokud jsme dosáhli limitu, deaktivovat bot_mode
  if (isLastReply) {
    await supabase.from('threads').update({ bot_mode: 'disabled' }).eq('id', thread_id);
  }

  return { ok: true, bot: bot.name };
}

// Limity pro boty ve vlákně (platí při založení vlákna i při přidání bota)
const BOT_MAX_PER_THREAD = 5;
const BOT_NAME_MAX = 60;
const BOT_PERSONA_MAX = 3000;

async function isAdmin(supabase, userId) {
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', userId).single();
  return !!profile && profile.role === 'admin';
}

// Zkontroluje jméno a popis role bota; vrací text chyby, nebo null
function checkBot(name, persona) {
  if (typeof name !== 'string' || typeof persona !== 'string' || !name.trim() || !persona.trim()) {
    return 'Bot musí mít jméno a popis role.';
  }
  if (name.trim().length > BOT_NAME_MAX) return 'Jméno bota může mít nejvýše ' + BOT_NAME_MAX + ' znaků.';
  if (persona.trim().length > BOT_PERSONA_MAX) return 'Popis role bota může mít nejvýše ' + BOT_PERSONA_MAX + ' znaků.';
  return null;
}

module.exports = { adminClient, getUserFromEvent, botReply, BOT_REPLY_LIMIT, BOUNDARY_INSTRUCTIONS, AI_MODEL, BOT_MAX_PER_THREAD, BOT_NAME_MAX, BOT_PERSONA_MAX, isAdmin, checkBot };
