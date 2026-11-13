const { adminClient } = require('./_shared');

const json = (statusCode, body) => ({
  statusCode,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body)
});

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function str(v, max) {
  if (typeof v !== 'string') return '';
  return v.trim().slice(0, max);
}

// Omezí velikost JSON příloh (výsledky kalkulací, odpovědi kvízu)
function jsonField(v) {
  if (v === null || typeof v !== 'object') return null;
  try {
    const s = JSON.stringify(v);
    return s.length <= 20000 ? v : null;
  } catch (e) {
    return null;
  }
}

function oneOf(v, allowed) {
  return allowed.includes(v) ? v : null;
}

function common(data) {
  return {
    name: str(data.name, 200),
    email: str(data.email, 320),
    phone: str(data.phone, 50) || null,
    page_url: str(data.page_url, 500) || null,
    // Čitelná věta o poptávce (sloupec summary), jen u formulářů s kalkulací
    summary: str(data.summary, 3000) || null
  };
}

// Číslo pro sloupec: celé nebo s jedním desetinným místem, jinak null (nekonečno, text, chybějící hodnota)
function num(v, dec) {
  if (typeof v !== 'number' || !isFinite(v) || Math.abs(v) > 1e10) return null;
  return dec ? Math.round(v * 10) / 10 : Math.round(v);
}

// Vybere z objektu "sloupce" jen povolené sloupce a zkontroluje jejich typ
// spec: { sloupec: 'int' | 'dec' | 'text' | ['povolené', 'hodnoty'] }
function pickColumns(src, spec) {
  const out = {};
  const s = src && typeof src === 'object' ? src : {};
  Object.keys(spec).forEach((k) => {
    const t = spec[k], v = s[k];
    if (t === 'int') out[k] = num(v, false);
    else if (t === 'dec') out[k] = num(v, true);
    else if (t === 'text') out[k] = typeof v === 'string' && v.trim() ? v.trim().slice(0, 200) : null;
    else out[k] = oneOf(v, t);
  });
  return out;
}

const CALC_COLUMNS = {
  pocet_bytu: 'int', rocni_spotreba_kwh: 'int',
  investice_od_kc: 'int', investice_do_kc: 'int',
  uspora_rocne_od_kc: 'int', uspora_rocne_do_kc: 'int',
  navratnost_od_roky: 'dec', navratnost_do_roky: 'dec',
  verze_vypoctu: 'text'
};

// Společné sloupce všech poptávek (jméno, e-mail, telefon, souhlas, shrnutí…)
function commonColumns(c, data) {
  return { jmeno: c.name, email: c.email, telefon: c.phone, shrnuti: c.summary, stranka_url: c.page_url };
}

function withConsent(row, data) {
  if (data.consent !== true) return { error: 'Je potřeba souhlas se zpracováním osobních údajů' };
  const consentText = str(data.consent_text, 2000);
  if (!consentText) return { error: 'Chybí text souhlasu' };
  row.souhlas = true;
  row.souhlas_text = consentText;
  return {};
}

// Každý formulář má svou tabulku
const FORMS = {
  contact: {
    table: 'contact_messages',
    build(data) {
      const c = common(data);
      const row = { name: c.name, email: c.email, message: str(data.message, 5000), page_url: c.page_url };
      if (!row.name || !row.email || !row.message) return { error: 'Vyplňte jméno, e-mail a zprávu' };
      return { row };
    }
  },

  savings: {
    table: 'poptavky_uspora',
    build(data) {
      const c = common(data);
      const row = {
        ...commonColumns(c, data),
        ...pickColumns(data.sloupce, { ...CALC_COLUMNS, vybrane_kroky: 'text' }),
        vstupy: jsonField(data.vstupy),
        vysledek: jsonField(data.vysledek)
      };
      if (!row.jmeno || !row.email) return { error: 'Vyplňte jméno a e-mail' };
      const consent = withConsent(row, data);
      if (consent.error) return consent;
      return { row };
    }
  },

  fve: {
    table: 'poptavky_fve',
    build(data) {
      const c = common(data);
      const role = { predseda: 'předseda výboru', clen: 'člen výboru', spravce: 'správce', jine: 'jiné' };
      const financing = { koupe: 'vlastní koupě', pronajem: 'pronájem (PPA)', nevim: 'zatím neví' };
      const horizon = { '6m': 'do 6 měsíců', '12m': '6–12 měsíců', '2r': '1–2 roky', zjistuju: 'zatím zjišťuje' };
      const row = {
        ...commonColumns(c, data),
        role_zadatele: role[data.role] || null,
        ulice: str(data.street, 200),
        mesto: str(data.city, 200),
        psc: str(data.zip, 5),
        financovani: financing[data.financing] || null,
        horizont: horizon[data.horizon] || null,
        poznamka: str(data.note, 5000) || null,
        ...pickColumns(data.sloupce, { ...CALC_COLUMNS, vykon_kwp: 'dec' }),
        vstupy: jsonField(data.vstupy),
        vysledek: jsonField(data.vysledek)
      };
      if (!row.jmeno || !row.email || !row.ulice || !row.mesto) return { error: 'Vyplňte všechna povinná pole' };
      if (!/^[0-9]{5}$/.test(row.psc)) return { error: 'PSČ musí mít 5 číslic' };
      const consent = withConsent(row, data);
      if (consent.error) return consent;
      return { row };
    }
  },

  jom_quiz: {
    table: 'poptavky_jom',
    build(data) {
      const c = common(data);
      const row = {
        ...commonColumns(c, data),
        organizace: str(data.organization, 200) || null,
        ...pickColumns(data.sloupce, {
          pocet_bytu: 'int', rocni_spotreba_kwh: 'int', skore: 'int',
          uspora_rocne_od_kc: 'int', uspora_rocne_do_kc: 'int', verze_vypoctu: 'text',
          typ_domu: ['SVJ', 'bytové družstvo', 'obecní dům', 'jiný'],
          stav_fve: ['mají', 'plánují', 'nemají'],
          vyhodnoceni: ['vysoká', 'střední', 'nízká']
        }),
        vstupy: jsonField(data.vstupy),
        vysledek: jsonField(data.vysledek)
      };
      if (!row.jmeno || !row.email) return { error: 'Vyplňte jméno a e-mail' };
      const consent = withConsent(row, data);
      if (consent.error) return consent;
      return { row };
    }
  }
};

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return json(405, { error: 'Method not allowed' });

  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return json(500, { error: 'Server není správně nastaven' });
  }

  let payload;
  try {
    payload = JSON.parse(event.body || '{}');
  } catch (e) {
    return json(400, { error: 'Neplatný požadavek' });
  }

  // Skryté pole pro boty: lidé ho nevyplní. Tváříme se, že vše proběhlo v pořádku.
  if (payload.website) return json(200, { ok: true });

  const form = FORMS[payload.form];
  if (!form) return json(400, { error: 'Neznámý formulář' });

  const data = payload.data && typeof payload.data === 'object' ? payload.data : {};
  const built = form.build(data);
  if (built.error) return json(400, { error: built.error });
  if (!EMAIL_RE.test(built.row.email)) return json(400, { error: 'Zadejte platný e-mail' });

  const { error } = await adminClient().from(form.table).insert(built.row);
  if (error) {
    console.error('[submit-form]', payload.form, error.message);
    return json(500, { error: 'Zprávu se nepodařilo uložit' });
  }

  return json(200, { ok: true });
};
