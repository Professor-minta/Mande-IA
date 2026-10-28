require('dotenv').config({ quiet: true });
const env = process.env;
const tests = [
  ['Claude', 'https://api.anthropic.com/v1/models', { headers: { 'x-api-key': env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' } }],
  ['OpenAI', 'https://api.openai.com/v1/models', { headers: { Authorization: `Bearer ${env.OPENAI_API_KEY}` } }],
  ['Appel', 'https://api.openai.com/v1/realtime/client_secrets', { method: 'POST', headers: { Authorization: `Bearer ${env.OPENAI_API_KEY}`, 'content-type': 'application/json' }, body: JSON.stringify({ session: { type: 'realtime', model: env.OPENAI_REALTIME_MODEL || 'gpt-realtime-2.1-mini' } }) }],
  ['Gemini', `https://generativelanguage.googleapis.com/v1beta/models/${env.GEMINI_VISION_MODEL || 'gemini-3.6-flash'}`, { headers: { 'x-goog-api-key': env.GEMINI_API_KEY } }]
];
(async () => {
  for (const [name, url, options] of tests) {
    try {
      const r = await fetch(url, options);
      const d = await r.json().catch(() => ({}));
      const why = d.error?.code || d.error?.status || d.error?.type || d.error?.message || '';
      console.log(name.padEnd(7), r.ok ? 'OK, clé acceptée' : `REFUSÉE (${r.status} ${why})`);
    } catch (e) { console.log(name.padEnd(7), 'injoignable :', e.message); }
  }
  console.log('SESSION_SECRET', env.SESSION_SECRET && env.SESSION_SECRET.length >= 32 ? 'OK' : 'MANQUANT : ajoutez-le (voir le guide PM2)');
})();
