#!/usr/bin/env node
const path = require('path');
const Database = require('better-sqlite3');
const { migrate, isPro } = require('../connectors/paiement');

const db = new Database(path.join(__dirname, '..', 'data', 'mande-ia.db'));
db.pragma('journal_mode = WAL');
migrate(db);

const [command, email, daysArg, minutesArg] = process.argv.slice(2);
const findUser = (value) => db.prepare('SELECT id, email, plan, pro_until, call_seconds FROM users WHERE email = ?').get(String(value || '').trim().toLowerCase());
const frenchDate = (iso) => new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Africa/Bamako' });
function show(user) {
  if (!isPro(user)) return console.log(`${user.email} : plan gratuit.`);
  if (!user.pro_until) return console.log(`${user.email} : Pro sans date de fin.`);
  console.log(`${user.email} : Pro jusqu’au ${frenchDate(user.pro_until)}, ${Math.floor(user.call_seconds / 60)} min d’appel.`);
}

if (command === 'activer') {
  const user = findUser(email);
  const days = Number.parseInt(daysArg, 10);
  const minutes = Number.parseInt(minutesArg ?? '60', 10);
  if (!user) { console.log(`Aucun compte avec l’adresse ${email || '(vide)'}. La personne doit d’abord créer son compte sur ia.mintaservices.com.`); process.exitCode = 1; }
  else if (!(days > 0) || !(minutes >= 0)) { console.log('Usage : node scripts/pro.js activer EMAIL JOURS [MINUTES_D_APPEL]'); process.exitCode = 1; }
  else {
    const start = user.pro_until && user.pro_until > new Date().toISOString() ? new Date(user.pro_until) : new Date();
    const until = new Date(start.getTime() + days * 24 * 60 * 60 * 1000).toISOString();
    db.prepare("UPDATE users SET plan = 'pro', pro_until = ?, call_seconds = call_seconds + ? WHERE id = ?").run(until, minutes * 60, user.id);
    show(findUser(email));
  }
} else if (command === 'retirer') {
  const user = findUser(email);
  if (!user) { console.log(`Aucun compte avec l’adresse ${email || '(vide)'}.`); process.exitCode = 1; }
  else { db.prepare("UPDATE users SET plan = 'free', pro_until = NULL, call_seconds = 0 WHERE id = ?").run(user.id); show(findUser(email)); }
} else if (command === 'voir') {
  const user = findUser(email);
  if (!user) { console.log(`Aucun compte avec l’adresse ${email || '(vide)'}.`); process.exitCode = 1; }
  else show(user);
} else if (command === 'paiements') {
  const rows = db.prepare('SELECT p.created_at, p.plan, p.amount, p.provider, p.status, u.email FROM payments p LEFT JOIN users u ON u.id = p.user_id ORDER BY p.created_at DESC LIMIT 30').all();
  if (!rows.length) console.log('Aucun paiement pour l’instant.');
  for (const r of rows) console.log(`${frenchDate(r.created_at)}  ${String(r.amount).padStart(6)} FCFA  ${r.plan.padEnd(9)}  ${r.status.padEnd(7)}  ${r.provider.padEnd(8)}  ${r.email || '(compte supprimé)'}`);
  const total = db.prepare("SELECT COALESCE(SUM(amount), 0) AS total, COUNT(*) AS count FROM payments WHERE status = 'paid'").get();
  console.log(`\nTotal encaissé : ${total.total} FCFA (${total.count} paiement${total.count > 1 ? 's' : ''}).`);
} else {
  console.log([
    'Commandes (à lancer en tant que www) :',
    '  sudo -u www node scripts/pro.js activer EMAIL JOURS [MINUTES]   ex. activer ecole@exemple.com 90 180',
    '  sudo -u www node scripts/pro.js voir EMAIL',
    '  sudo -u www node scripts/pro.js retirer EMAIL',
    '  sudo -u www node scripts/pro.js paiements'
  ].join('\n'));
}
db.close();
