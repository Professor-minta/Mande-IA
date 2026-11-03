const { PRESENTATION_MINTA } = require('./minta');
const rateLimit = require('express-rate-limit');
const { connaissancesPour } = require('./connaissances');

const ANTHROPIC_BASE_URL = process.env.ANTHROPIC_BASE_URL || 'https://api.anthropic.com';

const AGENTS = [
  { id: 'stratege', nom: 'Stratège', role: 'stratégie d’entreprise, idées de business et plans d’action au Mali' },
  { id: 'historien', nom: 'Historien', role: 'histoire du Mali et de l’Afrique : Kurukan Fuga, Soundiata, Mansa Moussa, les grands empires, les traditions', mots: 110 },
  { id: 'chercheur', nom: 'Chercheur', role: 'explications claires : sciences, santé, géographie, culture générale' },
  { id: 'bambara', nom: 'Bambara', role: 'traductions et petites leçons de bambara' },
  { id: 'tech', nom: 'Tech', role: 'serveurs, sites web, code, cloud et IA locale' },
  { id: 'marketing', nom: 'Marketing', role: 'publicités, slogans et publications pour les réseaux sociaux' },
  { id: 'finance', nom: 'Finance', role: 'prix, budgets, calculs en FCFA et rentabilité' },
  { id: 'redacteur', nom: 'Rédacteur', role: 'lettres, e-mails, discours et documents' },
  { id: 'agriculture', nom: 'Agriculture', role: 'cultures, élevage, saisons et conseils agricoles au Mali' }
];

const SCENE_TOOL = {
  type: 'function',
  name: 'consulter_agent',
  description: 'Confie une tâche à un agent spécialiste de Mande-IA et reçoit sa réponse écrite, à présenter ensuite à voix haute.',
  parameters: {
    type: 'object',
    properties: {
      agent: { type: 'string', enum: AGENTS.map((a) => a.id), description: AGENTS.map((a) => `${a.id} : ${a.role}`).join(' ; ') },
      demande: { type: 'string', description: 'La tâche précise confiée à l’agent, avec tous les détails donnés par l’utilisateur.' }
    },
    required: ['agent', 'demande']
  }
};

function languageRule(preference) {
  if (preference === 'en') return 'Speak English.';
  if (preference === 'bm') return 'Parle bambara autant que possible ; si tu ne sais pas, explique en français simple.';
  if (preference === 'fr') return 'Parle français.';
  return 'Parle la langue de la personne : français, anglais, ou bambara si tu le peux.';
}

function sceneInstructions(preference) {
  return [
    'Tu es Mande-IA, l’assistant vocal créé au Mali par le Professeur Issa Minta (Minta Services).',
    'Tu es en démonstration publique : ton écran est projeté devant un public, qui voit en direct les agents que tu consultes.',
    PRESENTATION_MINTA,
    `Tu diriges une équipe de ${AGENTS.length} agents spécialistes : ${AGENTS.map((a) => `${a.nom} (${a.role})`).join(', ')}.`,
    'Dès qu’une demande relève d’un spécialiste, appelle l’outil consulter_agent avec l’agent le plus adapté et une demande précise. Pour une demande en plusieurs parties, consulte plusieurs agents, un après l’autre.',
    'Avant d’appeler l’outil, annonce en quelques mots quel agent tu mobilises, par exemple « Je demande à mon agent Marketing. »',
    'Ensuite, présente la réponse de l’agent à voix haute, en quelques phrases courtes, sans inventer ce qu’il n’a pas dit.',
    'Pour l’histoire du Mali et de l’Afrique, par exemple Kurukan Fuga, Soundiata ou Mansa Moussa, consulte toujours l’agent Historien.',
    'Pour une salutation ou une question très simple, réponds directement, sans agent.',
    'Phrases courtes, ton chaleureux et clair, une idée à la fois.',
    languageRule(preference)
  ].join(' ');
}

function agentSystem(agent, preference, demande) {
  const dossier = connaissancesPour(demande);
  return [
    `Tu es l’agent ${agent.nom} de Mande-IA, l’assistant créé au Mali par le Professeur Issa Minta (Minta Services). Ton domaine : ${agent.role}.`,
    'Mande-IA te consulte pendant une démonstration en direct, puis lit ta réponse à voix haute devant un public.',
    `Réponds en ${agent.mots || 80} mots maximum, en phrases courtes faciles à dire à l’oral. Pas de liste, pas de titre, pas de mise en forme.`,
    'Si la demande sort de ton domaine, ou si tu n’es pas sûr d’un fait, dis-le simplement.',
    preference === 'en' ? 'Answer in English.' : preference === 'bm' ? 'Réponds en bambara simple si tu le peux, sinon en français simple.' : 'Réponds dans la langue de la demande.',
    dossier ? `\n\n${dossier}` : ''
  ].join(' ').trim();
}

async function askAgent(agent, demande, preference) {
  if (!process.env.ANTHROPIC_API_KEY) throw new Error('ANTHROPIC_API_KEY manquant');
  const response = await fetch(`${ANTHROPIC_BASE_URL}/v1/messages`, {
    method: 'POST',
    signal: AbortSignal.timeout(25000),
    headers: { 'content-type': 'application/json', 'x-api-key': process.env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({ model: process.env.SCENE_AGENT_MODEL || process.env.ANTHROPIC_MODEL || 'claude-haiku-4-5-20251001', max_tokens: 350, system: agentSystem(agent, preference, demande), messages: [{ role: 'user', content: demande }] })
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data?.error?.message || `Claude ${response.status}`);
  return (data.content || []).filter((b) => b.type === 'text').map((b) => b.text).join('\n').trim();
}

function setupScene(app, { getUser, isPro }) {
  const limit = rateLimit({ windowMs: 15 * 60 * 1000, limit: 80, standardHeaders: true, legacyHeaders: false });

  app.get('/api/scene/agents', (req, res) => res.json({ agents: AGENTS.map(({ id, nom, role }) => ({ id, nom, role })) }));

  app.post('/api/scene/agent', limit, async (req, res) => {
    const user = req.session.userId ? getUser(req.session.userId) : null;
    if (!isPro(user)) return res.status(403).json({ error: 'Le mode scène est réservé aux comptes Pro.' });
    const agent = AGENTS.find((a) => a.id === req.body?.agent);
    const demande = String(req.body?.demande || '').trim().slice(0, 1500);
    if (!agent || !demande) return res.status(400).json({ error: 'Agent ou demande manquant.' });
    const preference = ['auto', 'bm', 'fr', 'en'].includes(req.body?.langue) ? req.body.langue : 'auto';
    const started = Date.now();
    try {
      const texte = await askAgent(agent, demande, preference);
      res.json({ agent: agent.id, texte, ms: Date.now() - started });
    } catch (error) {
      console.error(`Scène, agent ${agent.id} :`, error.message);
      res.status(502).json({ error: 'Cet agent ne répond pas pour le moment.' });
    }
  });
}

module.exports = { setupScene, sceneInstructions, SCENE_TOOL, AGENTS };
