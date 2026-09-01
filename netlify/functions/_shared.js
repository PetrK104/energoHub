const { createClient } = require('@supabase/supabase-js');

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

module.exports = { adminClient, getUserFromEvent };
