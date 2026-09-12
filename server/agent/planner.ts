export type UserIntent = 'recherche_web' | 'synthese' | 'explication' | 'production' | 'discussion';

export interface PlanResult {
  intent: UserIntent;
  intentLabel: string;
  confidence: number;
  requiresLiveWeb: boolean;
  searchQuery?: string;
  language: 'bm' | 'fr' | 'en';
  steps: string[];
}

export class AgentPlanner {
  public plan(query: string, requestedLang?: string, enableWebSearch = true): PlanResult {
    const text = query.trim();
    const lower = text.toLowerCase();

    // 1. Language detection
    let language: 'bm' | 'fr' | 'en' = 'bm';
    if (requestedLang === 'fr' || requestedLang === 'en' || requestedLang === 'bm') {
      language = requestedLang;
    } else {
      // Heuristic language detection
      if (lower.includes('i ni ce') || lower.includes('aw ni ce') || lower.includes('an bɛ') || lower.includes('mun') || lower.includes('kuma') || lower.includes('bamanankan')) {
        language = 'bm';
      } else if (lower.includes('the') || lower.includes('what') || lower.includes('how') || lower.includes('hello')) {
        language = 'en';
      } else {
        language = 'fr';
      }
    }

    // 2. Intent classification
    let intent: UserIntent = 'discussion';
    let intentLabel = 'Discussion & Échange';
    let confidence = 0.95;
    let requiresLiveWeb = false;
    let searchQuery: string | undefined = undefined;

    const webKeywords = [
      'cherche', 'recherche', 'actualité', 'nouvelle', 'dernier', 'prix', 'météo',
      'source', 'exa', 'web', 'mali', 'afrique', '2025', '2026', 'qui est',
      'quand', 'marché', 'cours', 'nouvelles'
    ];

    const isSearch = enableWebSearch && webKeywords.some(k => lower.includes(k));

    if (isSearch) {
      intent = 'recherche_web';
      intentLabel = 'Recherche Web Augmentée (Exa)';
      requiresLiveWeb = true;
      searchQuery = text.replace(/^(cherche|recherche|trouve|donne-moi des infos sur)\s+/i, '').trim();
      confidence = 0.98;
    } else if (lower.includes('résume') || lower.includes('synthétise') || lower.includes('en bref') || lower.includes('points clés')) {
      intent = 'synthese';
      intentLabel = 'Synthèse & Extraction Analytique';
      confidence = 0.96;
    } else if (lower.includes('explique') || lower.includes('comment') || lower.includes('pourquoi') || lower.includes("qu'est-ce que") || lower.includes('mun bɛ')) {
      intent = 'explication';
      intentLabel = 'Explication & Pédagogie';
      confidence = 0.97;
    } else if (lower.includes('génère') || lower.includes('crée') || lower.includes('écris') || lower.includes('code') || lower.includes('plan') || lower.includes('traduis')) {
      intent = 'production';
      intentLabel = 'Production de Contenu';
      confidence = 0.94;
    }

    const steps = [
      `1. Analyse sémantique de l'intention : ${intentLabel}`,
      requiresLiveWeb ? `2. Invocation de l'outil Exa Search pour "${searchQuery || text}"` : '2. Vérification des connaissances internes Mandé & multilingues',
      `3. Synthèse via passerelle OpenRouter (priorité linguistique: ${language === 'bm' ? 'Bamanankan' : language.toUpperCase()})`,
      '4. Journalisation relationnelle PostgreSQL (audit & observabilité)'
    ];

    return {
      intent,
      intentLabel,
      confidence,
      requiresLiveWeb,
      searchQuery,
      language,
      steps
    };
  }
}

export const agentPlanner = new AgentPlanner();
