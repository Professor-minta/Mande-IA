const path = require('path');
const rateLimit = require('express-rate-limit');

const PAGE = path.join(__dirname, 'stats.html');
const JOURS = 30;

function setupStats(app, { db, getUser }) {
  const proprietaire = () => String(process.env.STATS_PROPRIETAIRE || process.env.GMAIL_PROPRIETAIRE || process.env.DRIVE_PROPRIETAIRE || process.env.META_PROPRIETAIRE || '').trim().toLowerCase();
  const estProprietaire = (req) => {
    const p = proprietaire();
    const user = req.session && req.session.userId ? getUser(req.session.userId) : null;
    return Boolean(p && user && String(user.email || '').toLowerCase() === p);
  };
  const table = (nom) => Boolean(db.prepare("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = ?").get(nom));
  const colonne = (t, c) => table(t) && db.prepare(`PRAGMA table_info(${t})`).all().some((x) => x.name === c);
  const un = (sql, ...args) => { try { return db.prepare(sql).get(...args); } catch { return null; } };
  const tous = (sql, ...args) => { try { return db.prepare(sql).all(...args); } catch { return []; } };

  function chiffres() {
    const auj = new Date().toISOString().slice(0, 10);
    const depuis = new Date(Date.now() - (JOURS - 1) * 86400000).toISOString().slice(0, 10);
    const pro = colonne('users', 'pro_until')
      ? un("SELECT COUNT(*) n FROM users WHERE plan = 'pro' AND (pro_until IS NULL OR pro_until > ?)", new Date().toISOString())
      : un("SELECT COUNT(*) n FROM users WHERE plan = 'pro'");
    const totaux = {
      comptes: un('SELECT COUNT(*) n FROM users')?.n || 0,
      pro: pro?.n || 0,
      nouveaux7: un("SELECT COUNT(*) n FROM users WHERE created_at >= datetime('now', '-7 days')")?.n || 0,
      coursTech: table('whatsapp_cours') ? un('SELECT COUNT(*) n FROM whatsapp_cours')?.n || 0 : 0,
      whatsapp30: un("SELECT COUNT(DISTINCT identity) n FROM daily_usage WHERE identity LIKE 'wa:%' AND day >= ?", depuis)?.n || 0,
      visiteurs30: un("SELECT COUNT(DISTINCT identity) n FROM daily_usage WHERE identity LIKE 'guest:%' AND day >= ?", depuis)?.n || 0,
      questionsAujourdhui: un("SELECT COALESCE(SUM(count), 0) n FROM daily_usage WHERE day = ? AND identity NOT LIKE 'live:%'", auj)?.n || 0,
      paiements: table('payments') ? un("SELECT COUNT(*) nombre, COALESCE(SUM(amount), 0) montant FROM payments WHERE status = 'paid'") || { nombre: 0, montant: 0 } : null,
    };
    const avant = un('SELECT COUNT(*) n FROM users WHERE substr(created_at, 1, 10) < ?', depuis)?.n || 0;
    const inscrits = Object.fromEntries(tous('SELECT substr(created_at, 1, 10) jour, COUNT(*) n FROM users WHERE substr(created_at, 1, 10) >= ? GROUP BY jour', depuis).map((r) => [r.jour, r.n]));
    const usage = {};
    for (const r of tous(`SELECT day jour,
        COUNT(DISTINCT CASE WHEN identity LIKE 'user:%' OR identity LIKE 'guest:%' THEN identity END) web,
        COUNT(DISTINCT CASE WHEN identity LIKE 'wa:%' THEN identity END) whatsapp,
        COALESCE(SUM(CASE WHEN identity NOT LIKE 'live:%' THEN count END), 0) questions
      FROM daily_usage WHERE day >= ? GROUP BY day`, depuis)) usage[r.jour] = r;
    const serie = [];
    let cumul = avant;
    for (let i = JOURS - 1; i >= 0; i -= 1) {
      const jour = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10);
      cumul += inscrits[jour] || 0;
      const u = usage[jour] || {};
      serie.push({ jour, comptes: cumul, nouveaux: inscrits[jour] || 0, web: u.web || 0, whatsapp: u.whatsapp || 0, questions: u.questions || 0 });
    }
    return { genere: new Date().toISOString(), totaux, serie };
  }

  const limite = rateLimit({ windowMs: 60 * 1000, limit: 30, standardHeaders: true, legacyHeaders: false });
  app.get('/admin/stats', limite, (req, res) => {
    if (!estProprietaire(req)) return res.redirect('/');
    res.set('Cache-Control', 'no-store');
    res.sendFile(PAGE);
  });
  app.get('/api/admin/stats', limite, (req, res) => {
    if (!estProprietaire(req)) return res.status(404).json({ error: 'introuvable' });
    res.set('Cache-Control', 'no-store');
    res.json(chiffres());
  });
  return { chiffres };
}

module.exports = { setupStats };
