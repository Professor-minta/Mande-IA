import React from 'react';
import { Globe, Search, Cpu, Database, Mic, ShieldCheck, ArrowUpRight, Sparkles, Bot, Layers } from 'lucide-react';

export const Features: React.FC = () => {
  return (
    <section id="features-section" className="py-24 relative overflow-hidden bg-[#08090C]">
      {/* Background ambient lighting */}
      <div className="absolute top-1/2 left-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-[130px] pointer-events-none" />
      <div className="absolute bottom-10 right-0 w-96 h-96 bg-lime-500/5 rounded-full blur-[130px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Heading */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono uppercase tracking-wider mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Capacités Fondatrices // Mande-IA v2.0</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight mb-4">
            Une Plateforme d'Agents Pensée pour le Mali & la Région Mandé
          </h2>
          <p className="text-zinc-400 text-base leading-relaxed">
            Plus qu'un simple habillage d'API générique : une architecture robuste, modulaire et ancrée dans les réalités linguistiques et techniques locales.
          </p>
        </div>

        {/* Features Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Card 1: Bamanankan-First */}
          <div className="p-8 rounded-2xl bg-[#0D1017] border border-white/10 hover:border-emerald-500/40 transition-all duration-300 group relative overflow-hidden flex flex-col justify-between shadow-xl">
            <div className="absolute -top-12 -right-12 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-colors" />
            <div>
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-6 group-hover:scale-105 transition-transform">
                <Globe className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2 group-hover:text-emerald-300 transition-colors">
                Bamanankan-First & Trilingue
              </h3>
              <p className="text-zinc-400 text-sm leading-relaxed mb-6">
                Le Bamanankan est la priorité absolue du produit, soutenu par le Français et l'Anglais. Formulations authentiques, salutations culturelles et terminologie adaptée au quotidien mandingue.
              </p>
            </div>
            <div className="pt-4 border-t border-white/5 flex items-center justify-between text-xs font-mono text-emerald-400">
              <span>PRIORITÉ PRODUIT #1</span>
              <ArrowUpRight className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
            </div>
          </div>

          {/* Card 2: Agent Core & Planner */}
          <div className="p-8 rounded-2xl bg-[#0D1017] border border-white/10 hover:border-emerald-500/40 transition-all duration-300 group relative overflow-hidden flex flex-col justify-between shadow-xl">
            <div className="absolute -top-12 -right-12 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-colors" />
            <div>
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-6 group-hover:scale-105 transition-transform">
                <Bot className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2 group-hover:text-emerald-300 transition-colors">
                Agent Core & Planification
              </h3>
              <p className="text-zinc-400 text-sm leading-relaxed mb-6">
                Compréhension fine des intentions sans forcer l'utilisateur à structurer un prompt technique. Le Planner décide du plan d'action et orchestre les sous-tâches de manière autonome.
              </p>
            </div>
            <div className="pt-4 border-t border-white/5 flex items-center justify-between text-xs font-mono text-emerald-400">
              <span>ORCHESTRATION AGENTIQUE</span>
              <ArrowUpRight className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
            </div>
          </div>

          {/* Card 3: Exa Web Search Integration */}
          <div className="p-8 rounded-2xl bg-[#0D1017] border border-white/10 hover:border-emerald-500/40 transition-all duration-300 group relative overflow-hidden flex flex-col justify-between shadow-xl">
            <div className="absolute -top-12 -right-12 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-colors" />
            <div>
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-6 group-hover:scale-105 transition-transform">
                <Search className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2 group-hover:text-emerald-300 transition-colors">
                Recherche Augmentée Exa
              </h3>
              <p className="text-zinc-400 text-sm leading-relaxed mb-6">
                Outil de recherche web sémantique intégré. Quand des informations récentes ou des faits locaux sont requis, l'Agent interroge Exa et cite ses sources avec traçabilité et score de confiance.
              </p>
            </div>
            <div className="pt-4 border-t border-white/5 flex items-center justify-between text-xs font-mono text-emerald-400">
              <span>SOURCES CITÉES & INDEXÉES</span>
              <ArrowUpRight className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
            </div>
          </div>

          {/* Card 4: OpenRouter Multi-LLM Gateway */}
          <div className="p-8 rounded-2xl bg-[#0D1017] border border-white/10 hover:border-emerald-500/40 transition-all duration-300 group relative overflow-hidden flex flex-col justify-between shadow-xl">
            <div className="absolute -top-12 -right-12 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-colors" />
            <div>
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-6 group-hover:scale-105 transition-transform">
                <Cpu className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2 group-hover:text-emerald-300 transition-colors">
                Passerelle OpenRouter
              </h3>
              <p className="text-zinc-400 text-sm leading-relaxed mb-6">
                Couche d'abstraction indépendante des fournisseurs LLM. Capacité de basculer en temps réel entre modèles spécialisés avec une isolation absolue des clés API côté serveur.
              </p>
            </div>
            <div className="pt-4 border-t border-white/5 flex items-center justify-between text-xs font-mono text-emerald-400">
              <span>SÉCURITÉ ZERO-LEAK</span>
              <ArrowUpRight className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
            </div>
          </div>

          {/* Card 5: Structured PostgreSQL Data Layer */}
          <div className="p-8 rounded-2xl bg-[#0D1017] border border-white/10 hover:border-emerald-500/40 transition-all duration-300 group relative overflow-hidden flex flex-col justify-between shadow-xl">
            <div className="absolute -top-12 -right-12 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-colors" />
            <div>
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-6 group-hover:scale-105 transition-transform">
                <Database className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2 group-hover:text-emerald-300 transition-colors">
                Base Relationnelle PostgreSQL
              </h3>
              <p className="text-zinc-400 text-sm leading-relaxed mb-6">
                Finis les fichiers JSON fragiles. Modélisation relationnelle complète (utilisateurs, sessions, messages, exécutions d'outils et feedback) pour une traçabilité et une montée en charge pérennes.
              </p>
            </div>
            <div className="pt-4 border-t border-white/5 flex items-center justify-between text-xs font-mono text-emerald-400">
              <span>MIGRATIONS & PERSISTANCE</span>
              <ArrowUpRight className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
            </div>
          </div>

          {/* Card 6: API Djelia.cloud pour la lecture en Bamanankan */}
          <div className="p-8 rounded-2xl bg-[#0D1017] border border-white/10 hover:border-emerald-500/40 transition-all duration-300 group relative overflow-hidden flex flex-col justify-between shadow-xl">
            <div className="absolute -top-12 -right-12 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-colors" />
            <div>
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-6 group-hover:scale-105 transition-transform">
                <Mic className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2 group-hover:text-emerald-300 transition-colors">
                API Djelia.cloud (Lecture Bamanankan)
              </h3>
              <p className="text-zinc-400 text-sm leading-relaxed mb-6">
                Le Bamanankan étant une langue de tradition orale, Mande-IA intègre directement l'API de <strong>djelia.cloud</strong> pour la lecture audio et la synthèse neuronale (TTS) avec respect rigoureux des tons, des voyelles nasales et des inflexions mandingues.
              </p>
            </div>
            <div className="pt-4 border-t border-white/5 flex items-center justify-between text-xs font-mono text-emerald-400">
              <span>API DJELIA.CLOUD INTÉGRÉE</span>
              <ArrowUpRight className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
