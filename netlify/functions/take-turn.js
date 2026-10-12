const { adminClient, botReply } = require('./_shared');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  try {
    const { thread_id } = JSON.parse(event.body);
    if (!thread_id) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Chybí thread_id' }) };
    }

    const result = await botReply(adminClient(), thread_id);
    return { statusCode: 200, body: JSON.stringify(result) };
  } catch (e) {
    console.error('[take-turn] chyba:', e.message);
    return { statusCode: 500, body: JSON.stringify({ error: e.message }) };
  }
};
