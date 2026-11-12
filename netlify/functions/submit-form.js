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
    summary: str(data.summary, 1000) || null
  };
}

function withConsent(row, data) {
  if (data.consent !== true) return { error: 'Je potřeba souhlas se zpracováním osobních údajů' };
  const consentText = str(data.consent_text, 2000);
  if (!consentText) return { error: 'Chybí text souhlasu' };
  row.consent = true;
  row.consent_text = consentText;
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
    table: 'savings_requests',
    build(data) {
      const c = common(data);
      const row = { ...c, inputs: jsonField(data.inputs), result: jsonField(data.result) };
      if (!row.name || !row.email) return { error: 'Vyplňte jméno a e-mail' };
      const consent = withConsent(row, data);
      if (consent.error) return consent;
      return { row };
    }
  },

  fve: {
    table: 'fve_requests',
    build(data) {
      const c = common(data);
      const row = {
        name: c.name,
        email: c.email,
        phone: c.phone,
        role: oneOf(data.role, ['predseda', 'clen', 'spravce', 'jine']),
        street: str(data.street, 200),
        city: str(data.city, 200),
        zip: str(data.zip, 5),
        financing: oneOf(data.financing, ['koupe', 'pronajem', 'nevim']),
        horizon: oneOf(data.horizon, ['6m', '12m', '2r', 'zjistuju']),
        note: str(data.note, 5000) || null,
        calc_inputs: jsonField(data.calc_inputs),
        summary: c.summary,
        page_url: c.page_url
      };
      if (!row.name || !row.email || !row.street || !row.city) return { error: 'Vyplňte všechna povinná pole' };
      if (!/^[0-9]{5}$/.test(row.zip)) return { error: 'PSČ musí mít 5 číslic' };
      const consent = withConsent(row, data);
      if (consent.error) return consent;
      return { row };
    }
  },

  jom_quiz: {
    table: 'jom_quiz_submissions',
    build(data) {
      const c = common(data);
      const row = {
        name: c.name,
        email: c.email,
        phone: c.phone,
        organization: str(data.organization, 200) || null,
        answers: jsonField(data.answers),
        result: str(data.result, 50) || null,
        summary: c.summary,
        page_url: c.page_url
      };
      if (!row.name || !row.email) return { error: 'Vyplňte jméno a e-mail' };
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
