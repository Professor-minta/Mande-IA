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
  const waToken = env.WHATSAPP_ACCESS_TOKEN || env.WHATSAPP_ROOT_TOKEN;
  if (waToken && env.WHATSAPP_PHONE_NUMBER_ID) {
    try {
      const r = await fetch(`https://graph.facebook.com/${env.META_GRAPH_API_VERSION || 'v26.0'}/${env.WHATSAPP_PHONE_NUMBER_ID}?fields=display_phone_number,verified_name,name_status`, { headers: { Authorization: `Bearer ${waToken}` } });
      const d = await r.json().catch(() => ({}));
      console.log('WhatsApp', r.ok ? `OK, ${d.display_phone_number} (${d.verified_name}, nom : ${d.name_status})` : `REFUSÉE (${r.status} ${d.error?.code || ''} ${d.error?.message || ''})`);
    } catch (e) { console.log('WhatsApp injoignable :', e.message); }
    console.log('WhatsApp mode', env.WHATSAPP_TEST_MODE === 'false' ? (env.META_APP_SECRET ? 'public' : 'public mais META_APP_SECRET MANQUANT') : `test (répond seulement à ${env.WHATSAPP_TEST_RECIPIENT || 'personne : ajoutez WHATSAPP_TEST_RECIPIENT'})`);
    console.log('Vérif. webhook', env.WHATSAPP_VERIFY_TOKEN ? 'OK' : 'MANQUANT : ajoutez WHATSAPP_VERIFY_TOKEN');
  } else {
    console.log('WhatsApp pas encore configuré');
  }
  console.log('SESSION_SECRET', env.SESSION_SECRET && env.SESSION_SECRET.length >= 32 ? 'OK' : 'MANQUANT : ajoutez-le (voir le guide PM2)');
})();
