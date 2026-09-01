const { adminClient, getUserFromEvent } = require('./_shared');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  const user = await getUserFromEvent(event);
  if (!user) {
    return { statusCode: 401, body: JSON.stringify({ error: 'Nepřihlášen' }) };
  }

  let username;
  try {
    ({ username } = JSON.parse(event.body || '{}'));
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: 'Neplatný požadavek' }) };
  }

  if (!username || username.trim().length < 3) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Uživatelské jméno musí mít alespoň 3 znaky.' }) };
  }
  if (username.trim().length > 30) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Uživatelské jméno může mít nejvýše 30 znaků.' }) };
  }

  const supabase = adminClient();

  const { data: existing } = await supabase
    .from('profiles')
    .select('id')
    .eq('username', username.trim())
    .neq('id', user.id)
    .maybeSingle();

  if (existing) {
    return { statusCode: 409, body: JSON.stringify({ error: 'Toto uživatelské jméno je již obsazeno.' }) };
  }

  const { error } = await supabase
    .from('profiles')
    .upsert({ id: user.id, username: username.trim() });

  if (error) {
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }

  return { statusCode: 200, body: JSON.stringify({ ok: true }) };
};
