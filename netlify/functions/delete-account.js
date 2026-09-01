const { adminClient, getUserFromEvent } = require('./_shared');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  const user = await getUserFromEvent(event);
  if (!user) {
    return { statusCode: 401, body: JSON.stringify({ error: 'Nepřihlášen' }) };
  }

  const supabase = adminClient();

  // Delete profile row first (may cascade, but explicit is safer)
  await supabase.from('profiles').delete().eq('id', user.id);

  // Delete auth user via admin API
  const { error } = await supabase.auth.admin.deleteUser(user.id);
  if (error) {
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }

  return { statusCode: 200, body: JSON.stringify({ ok: true }) };
};
