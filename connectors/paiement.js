const crypto = require('crypto');

const PLANS = {
  semaine: { id: 'semaine', label: 'Pro Semaine', price: 1000, days: 7, minutes: 15 },
  mois: { id: 'mois', label: 'Pro Mois', price: 3000, days: 30, minutes: 60 },
  trimestre: { id: 'trimestre', label: 'Pro 3 mois', price: 8000, days: 90, minutes: 180 }
};
const PRO_DAILY_QUESTIONS = 100;
const PUBLIC_URL = (process.env.PUBLIC_URL || 'https://ia.mintaservices.com').replace(/\/+$/, '');
const PAYDUNYA_BASE = process.env.PAYDUNYA_MODE === 'test' ? 'https://app.paydunya.com/sandbox-api/v1' : 'https://app.paydunya.com/api/v1';
const CINETPAY_BASE = 'https://api-checkout.cinetpay.com/v2';

function migrate(db) {
  const columns = db.prepare('PRAGMA table_info(users)').all().map((c) => c.name);
  if (!columns.includes('pro_until')) db.exec('ALTER TABLE users ADD COLUMN pro_until TEXT');
  if (!columns.includes('call_seconds')) db.exec('ALTER TABLE users ADD COLUMN call_seconds INTEGER NOT NULL DEFAULT 0');
  db.exec(`CREATE TABLE IF NOT EXISTS payments (id TEXT PRIMARY KEY, user_id TEXT NOT NULL, plan TEXT NOT NULL, amount INTEGER NOT NULL, provider TEXT NOT NULL, reference TEXT UNIQUE, status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'paid', 'failed')), created_at TEXT NOT NULL, paid_at TEXT); CREATE INDEX IF NOT EXISTS payments_user ON payments(user_id);`);
}

function isPro(user) {
  return user?.plan === 'pro' && (!user.pro_until || user.pro_until > new Date().toISOString());
}

function provider() {
  const name = String(process.env.PAIEMENT_PROVIDER || '').trim().toLowerCase();
  if (name === 'paydunya' && process.env.PAYDUNYA_MASTER_KEY && process.env.PAYDUNYA_PRIVATE_KEY && process.env.PAYDUNYA_TOKEN) return 'paydunya';
  if (name === 'cinetpay' && process.env.CINETPAY_API_KEY && process.env.CINETPAY_SITE_ID) return 'cinetpay';
  return '';
}

async function call(url, options = {}) {
  try {
    const response = await fetch(url, { ...options, signal: AbortSignal.timeout(20000) });
    const data = await response.json().catch(() => ({}));
    return { ok: response.ok, status: response.status, data };
  } catch (error) { return { ok: false, status: 0, data: { message: error.message } }; }
}

const paydunyaHeaders = () => ({
  'content-type': 'application/json',
  'PAYDUNYA-MASTER-KEY': process.env.PAYDUNYA_MASTER_KEY,
  'PAYDUNYA-PRIVATE-KEY': process.env.PAYDUNYA_PRIVATE_KEY,
  'PAYDUNYA-TOKEN': process.env.PAYDUNYA_TOKEN
});

const PROVIDERS = {
  paydunya: {
    async create(payment, plan, user) {
      const res = await call(`${PAYDUNYA_BASE}/checkout-invoice/create`, {
        method: 'POST',
        headers: paydunyaHeaders(),
        body: JSON.stringify({
          invoice: { total_amount: plan.price, description: `${plan.label} : ${plan.days} jours de Mande-IA Pro`, customer: { email: user.email } },
          store: { name: 'Mande-IA', tagline: 'Votre voix, notre intelligence', website_url: PUBLIC_URL, logo_url: `${PUBLIC_URL}/icons/icon-512.png` },
          custom_data: { payment_id: payment.id },
          actions: { cancel_url: `${PUBLIC_URL}/?paiement=annule`, return_url: `${PUBLIC_URL}/paiement/retour`, callback_url: `${PUBLIC_URL}/api/paiement/webhook` }
        })
      });
      if (res.data?.response_code !== '00' || !res.data?.token) throw new Error(`PayDunya ${res.status} ${res.data?.response_text || res.data?.message || ''}`.trim());
      return { url: res.data.response_text, reference: res.data.token };
    },
    async check(reference) {
      const res = await call(`${PAYDUNYA_BASE}/checkout-invoice/confirm/${encodeURIComponent(reference)}`, { headers: paydunyaHeaders() });
      const status = res.data?.status;
      return { status: status === 'completed' ? 'paid' : status === 'cancelled' || status === 'failed' ? 'failed' : 'pending', amount: Number(res.data?.invoice?.total_amount) };
    },
    reference(req) {
      const body = req.body || {};
      return body['data[invoice][token]'] || body.data?.invoice?.token || req.query.token || body.token || '';
    }
  },
  cinetpay: {
    async create(payment, plan, user) {
      const res = await call(`${CINETPAY_BASE}/payment`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          apikey: process.env.CINETPAY_API_KEY,
          site_id: process.env.CINETPAY_SITE_ID,
          transaction_id: payment.reference,
          amount: plan.price,
          currency: 'XOF',
          description: `${plan.label} Mande-IA`,
          customer_email: user.email,
          notify_url: `${PUBLIC_URL}/api/paiement/webhook`,
          return_url: `${PUBLIC_URL}/paiement/retour`,
          channels: 'MOBILE_MONEY',
          lang: 'fr',
          metadata: payment.id
        })
      });
      if (res.data?.code !== '201' || !res.data?.data?.payment_url) throw new Error(`CinetPay ${res.status} ${res.data?.message || ''} ${res.data?.description || ''}`.trim());
      return { url: res.data.data.payment_url, reference: payment.reference };
    },
    async check(reference) {
      const res = await call(`${CINETPAY_BASE}/payment/check`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ apikey: process.env.CINETPAY_API_KEY, site_id: process.env.CINETPAY_SITE_ID, transaction_id: reference })
      });
      const status = res.data?.data?.status;
      return { status: status === 'ACCEPTED' ? 'paid' : status === 'REFUSED' ? 'failed' : 'pending', amount: Number(res.data?.data?.amount) };
    },
    reference(req) {
      const body = req.body || {};
      return body.cpm_trans_id || body.transaction_id || req.query.transaction_id || '';
    }
  }
};

function setupPayments(app, { db, getUser, now, id }) {
  migrate(db);
  const active = provider();
  console.log(active ? `Paiement : ${active}${active === 'paydunya' && process.env.PAYDUNYA_MODE === 'test' ? ' (mode test)' : ''}.` : 'Paiement : désactivé (PAIEMENT_PROVIDER vide ou clés manquantes). « Passer à Pro » ouvre WhatsApp.');

  const activate = db.transaction((payment, plan) => {
    const updated = db.prepare("UPDATE payments SET status = 'paid', paid_at = ? WHERE id = ? AND status != 'paid'").run(now(), payment.id);
    if (!updated.changes) return false;
    const user = db.prepare('SELECT pro_until FROM users WHERE id = ?').get(payment.user_id);
    if (!user) return true;
    const start = user.pro_until && user.pro_until > now() ? new Date(user.pro_until) : new Date();
    const until = new Date(start.getTime() + plan.days * 24 * 60 * 60 * 1000).toISOString();
    db.prepare("UPDATE users SET plan = 'pro', pro_until = ?, call_seconds = call_seconds + ? WHERE id = ?").run(until, plan.minutes * 60, payment.user_id);
    return true;
  });

  async function confirm(reference) {
    const payment = reference ? db.prepare('SELECT * FROM payments WHERE reference = ?').get(String(reference)) : null;
    if (!payment) return null;
    if (payment.status !== 'pending') return payment.status;
    const plan = PLANS[payment.plan];
    const result = await PROVIDERS[payment.provider].check(payment.reference);
    if (result.status === 'paid') {
      if (result.amount !== payment.amount) { console.error(`Paiement ${payment.id} : montant reçu ${result.amount} au lieu de ${payment.amount}, Pro non activé.`); return 'pending'; }
      if (activate(payment, plan)) console.log(`Paiement ${payment.id} : ${plan.label} activé.`);
      return 'paid';
    }
    if (result.status === 'failed') db.prepare("UPDATE payments SET status = 'failed' WHERE id = ? AND status = 'pending'").run(payment.id);
    return result.status;
  }

  app.get('/api/paiement/offres', (req, res) => {
    res.json({ enabled: Boolean(active), plans: Object.values(PLANS), proDailyQuestions: PRO_DAILY_QUESTIONS });
  });

  app.post('/api/paiement/checkout', async (req, res, next) => {
    try {
      if (!active) return res.status(503).json({ error: 'Le paiement en ligne n’est pas encore ouvert.' });
      const user = req.session.userId ? getUser(req.session.userId) : null;
      if (!user) return res.status(401).json({ error: 'Connectez-vous ou créez un compte pour passer à Pro.' });
      const plan = PLANS[req.body?.plan];
      if (!plan) return res.status(400).json({ error: 'Formule inconnue.' });
      const payment = { id: id(), reference: `MIA${crypto.randomBytes(9).toString('hex').toUpperCase()}` };
      let checkout;
      try { checkout = await PROVIDERS[active].create(payment, plan, user); }
      catch (error) { console.error('Paiement :', error.message); return res.status(502).json({ error: 'Le service de paiement ne répond pas. Réessayez dans un instant.' }); }
      db.prepare('INSERT INTO payments (id, user_id, plan, amount, provider, reference, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)').run(payment.id, user.id, plan.id, plan.price, active, checkout.reference, now());
      res.json({ url: checkout.url });
    } catch (error) { next(error); }
  });

  app.post('/api/paiement/verifier', async (req, res, next) => {
    try {
      const reference = String(req.body?.reference || '');
      const owned = req.session.userId && db.prepare('SELECT 1 FROM payments WHERE reference = ? AND user_id = ?').get(reference, req.session.userId);
      if (!owned) return res.status(404).json({ error: 'Paiement introuvable.' });
      const status = await confirm(reference);
      const user = getUser(req.session.userId);
      res.json({ status, pro: isPro(user), proUntil: user?.pro_until || null });
    } catch (error) { next(error); }
  });

  app.get('/api/paiement/webhook', (req, res) => res.sendStatus(200));
  app.post('/api/paiement/webhook', (req, res) => {
    res.sendStatus(200);
    const reference = Object.values(PROVIDERS).map((p) => p.reference(req)).find(Boolean);
    if (reference) confirm(reference).catch((error) => console.error('Paiement webhook :', error.message));
  });

  app.all('/paiement/retour', (req, res) => {
    const reference = Object.values(PROVIDERS).map((p) => p.reference(req)).find(Boolean) || '';
    res.redirect(303, `/?paiement=retour&ref=${encodeURIComponent(reference)}`);
  });
}

module.exports = { setupPayments, migrate, isPro, PLANS, PRO_DAILY_QUESTIONS };
