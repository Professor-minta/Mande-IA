import React, { useState } from 'react';
import { BarChart3, CheckCircle2, XCircle, Sparkles, Sliders, Shield, ArrowRight } from 'lucide-react';
import { BENCHMARKS } from '../data/mockData';

export const ModelBenchmarks: React.FC = () => {
  const [activeComparisonTab, setActiveComparisonTab] = useState<'mande' | 'generic'>('mande');

  return (
    <section id="benchmarks-section" className="py-24 relative bg-[#08090C] overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Heading */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono uppercase tracking-wider mb-4">
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Évaluation Comparative & Rigueur Technique</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight mb-4">
            Mande-IA v2.0 vs. Chatbots Génériques
          </h2>
          <p className="text-zinc-400 text-base leading-relaxed">
            Les chatbots génériques produisent des réponses textuelles non vérifiées. Mande-IA combine un Planner autonome, la recherche sémantique Exa et une compréhension authentique du Bamanankan.
          </p>
        </div>

        {/* Benchmarks Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center mb-16">
          {/* Left: Metrics Bars */}
          <div className="space-y-6 bg-[#0D1017] p-6 sm:p-8 rounded-3xl border border-white/10 shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center justify-between">
              <span>Métriques d'Alignement & Performance</span>
              <span className="text-xs font-mono text-emerald-400">Corpus Mandé & Mali 2026</span>
            </h3>

            {BENCHMARKS.map((item, idx) => (
              <div key={idx} className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-zinc-200">{item.metric}</span>
                  <div className="flex items-center gap-4 font-mono">
                    <span className="text-emerald-400 font-bold">Mande-IA: {item.mandeScore}{item.unit}</span>
                    <span className="text-zinc-500">Générique: {item.genericScore}{item.unit}</span>
                  </div>
                </div>

                {/* Progress bars container */}
                <div className="space-y-1.5">
                  {/* Mande AI bar */}
                  <div className="h-2.5 w-full bg-white/[0.04] rounded-full overflow-hidden flex">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 to-lime-400 rounded-full transition-all duration-1000"
                      style={{ width: `${item.mandeScore}%` }}
                    />
                  </div>
                  {/* Generic LLM bar */}
                  <div className="h-1.5 w-full bg-white/[0.04] rounded-full overflow-hidden flex">
                    <div
                      className="h-full bg-zinc-600 rounded-full transition-all duration-1000"
                      style={{ width: `${item.genericScore}%` }}
                    />
                  </div>
                </div>

                <p className="text-[11px] text-zinc-500 leading-relaxed pt-1">
                  {item.description}
                </p>
              </div>
            ))}
          </div>

          {/* Right: Code Comparison Inspector */}
          <div className="bg-[#0D1017] rounded-3xl border border-white/10 shadow-2xl overflow-hidden">
            {/* Inspector Header Switch */}
            <div className="flex items-center justify-between p-4 bg-[#090C12] border-b border-white/5">
              <span className="text-xs font-mono uppercase tracking-wider text-zinc-400">
                Orchestration : Agent Structuré vs Prompt Naïf
              </span>
              <div className="flex gap-1.5 bg-[#07090D] p-1 rounded-xl border border-white/5">
                <button
                  onClick={() => setActiveComparisonTab('mande')}
                  className={`px-3 py-1 rounded-lg text-xs font-medium font-mono transition-colors ${
                    activeComparisonTab === 'mande'
                      ? 'bg-emerald-500 text-black font-bold'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Mande-IA Agent Core
                </button>
                <button
                  onClick={() => setActiveComparisonTab('generic')}
                  className={`px-3 py-1 rounded-lg text-xs font-medium font-mono transition-colors ${
                    activeComparisonTab === 'generic'
                      ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Chatbot Naïf v1
                </button>
              </div>
            </div>

            {/* Code Output Viewer */}
            <div className="p-6 font-mono text-xs leading-relaxed min-h-[340px]">
              {activeComparisonTab === 'mande' ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold pb-2 border-b border-white/5">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Planner Déterministe • Recherche Exa • Multi-LLM Sécurisé</span>
                  </div>
                  <pre className="text-zinc-300 overflow-x-auto whitespace-pre">
{`// Agent Core Pipeline // Mande-IA v2.0
async function handleQuery(userPrompt: string, history: Message[]) {
  // 1. Planner : Analyse intention & langue cible (Bamanankan)
  const intent = await intentPlanner.classify(userPrompt);
  
  // 2. Tool Router : Invocation conditionnelle Exa Web Search
  let toolData = null;
  if (intent.requiresLiveWeb) {
    toolData = await exaService.search({ query: intent.searchQuery });
  }
  
  // 3. Model Router : OpenRouter avec contexte & prompt mandé
  const response = await modelRouter.execute({
    model: 'anthropic/claude-3.5-sonnet',
    context: { language: 'bm', intent, sources: toolData?.results },
    history
  });
  
  // 4. Persistance relationnelle PostgreSQL
  await db.logAgentRun({ intent, toolCalls: toolData ? 1 : 0 });
  return response;
}`}
                  </pre>
                  <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20 text-[11px] text-emerald-300">
                    ✓ Données fraîches sourcées • Clés API protégées côté serveur • Bamanankan natif.
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-red-400 text-xs font-semibold pb-2 border-b border-white/5">
                    <XCircle className="w-4 h-4" />
                    <span>Clés API Exposées • Hallucinations Temporelles • Pas d'Outils</span>
                  </div>
                  <pre className="text-zinc-500 overflow-x-auto whitespace-pre line-through">
{`// Architecture Naïve / Chatbot monolithique
// ❌ Clé OpenAI exposée dans le navigateur !
const API_KEY = "sk-live-exposed-client-key-123";

async function sendMessage(text) {
  // Aucune détection d'intention, pas de recherche web
  // Incapable de comprendre les nuances du Bambara
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    headers: { Authorization: \`Bearer \${API_KEY}\` },
    body: JSON.stringify({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: text }]
    })
  });
  // ❌ Données stockées dans un fichier JSON local écrasable
  fs.writeFileSync("chat.json", JSON.stringify(data));
}`}
                  </pre>
                  <div className="p-3 rounded-xl bg-red-500/5 border border-red-500/20 text-[11px] text-red-300">
                    ⚠️ Clés dérobables en DevTools, base JSON non concurrente, hallucinations sur l'actualité malienne.
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
