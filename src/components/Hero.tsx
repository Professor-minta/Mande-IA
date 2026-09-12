import React from 'react';
import { MandeLogo } from './MandeLogo';
import { ArrowRight, Sparkles, Code, CheckCircle2, ShieldCheck, Terminal, Cpu, Globe, Search, Mic, Layers, Bot } from 'lucide-react';

interface HeroProps {
  onOpenStudio: () => void;
  onExploreArchitecture: () => void;
  onOpenChat?: () => void;
}

export const Hero: React.FC<HeroProps> = ({
  onOpenStudio,
  onExploreArchitecture,
  onOpenChat
}) => {
  return (
    <section id="hero-section" className="relative pt-32 pb-20 md:pt-40 md:pb-28 overflow-hidden">
      {/* Background ambient radial gradients */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-gradient-to-b from-emerald-500/10 via-emerald-900/5 to-transparent rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-20 right-10 w-96 h-96 bg-lime-500/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Eyebrow Pill Badge (Section 4) */}
        <div className="flex justify-center mb-6">
          <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-[#121620]/90 border border-white/10 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.15)] backdrop-blur-md">
            <MandeLogo size="xs" />
            <span className="text-xs font-semibold tracking-wide font-mono text-zinc-200">
              L'IA, maintenant en Bamanankan.
            </span>
          </div>
        </div>

        {/* Hero Title (Section 4) */}
        <div className="max-w-4xl mx-auto text-center mb-6">
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white leading-[1.1] font-['Plus_Jakarta_Sans']">
            Une intelligence artificielle{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-lime-300">
              qui vous comprend.
            </span>
          </h1>
        </div>

        {/* Hero Subtitle Description (Section 4) */}
        <div className="max-w-3xl mx-auto text-center mb-6">
          <p className="text-base sm:text-lg text-zinc-300 leading-relaxed font-normal">
            Mande-IA est un assistant IA conçu autour du Bamanankan, pour vous permettre de comprendre, créer, rechercher et accomplir des tâches avec l'intelligence artificielle — dans votre langue.
          </p>
        </div>

        {/* Languages (Section 4) */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/[0.04] border border-white/10 text-xs sm:text-sm font-medium text-zinc-200">
            <Globe className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-emerald-300 font-semibold">Bamanankan</span>
            <span className="text-zinc-600">·</span>
            <span>Français</span>
            <span className="text-zinc-600">·</span>
            <span>English</span>
          </div>
        </div>

        {/* CTA Button Group (Section 4) */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 mb-4">
          <button
            id="hero-primary-cta-btn"
            onClick={() => {
              if (onOpenChat) onOpenChat();
            }}
            className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-[#08090C] font-bold text-sm transition-all duration-200 flex items-center justify-center gap-2 shadow-[0_0_30px_rgba(16,185,129,0.4)] hover:shadow-[0_0_40px_rgba(16,185,129,0.6)] cursor-pointer group"
          >
            <span>Essayer Mande-IA</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>

          <button
            id="hero-secondary-cta-btn"
            onClick={() => {
              const elem = document.getElementById('how-it-works');
              if (elem) elem.scrollIntoView({ behavior: 'smooth' });
              else onExploreArchitecture();
            }}
            className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-[#121620] hover:bg-[#161C28] text-zinc-200 font-semibold text-sm border border-white/10 hover:border-emerald-500/40 transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Voir comment ça marche</span>
          </button>
        </div>

        {/* Supporting text (Section 4) */}
        <div className="text-center mb-14">
          <p className="text-xs text-zinc-400">
            Testez gratuitement la démo en direct. Aucune installation nécessaire.
          </p>
        </div>

        {/* Central Labyrinth Orb & Holographic Agent Pipeline Preview */}
        <div className="relative max-w-5xl mx-auto">
          <div className="relative rounded-3xl p-2 sm:p-3 bg-gradient-to-b from-white/10 via-white/[0.04] to-white/[0.01] border border-white/10 shadow-[0_30px_100px_rgba(0,0,0,0.8)] backdrop-blur-2xl">
            {/* Top terminal bar */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-[#090C12]/90 rounded-t-2xl text-xs font-mono">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-red-500/80 inline-block" />
                <span className="w-3 h-3 rounded-full bg-yellow-500/80 inline-block" />
                <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block" />
                <span className="ml-3 text-zinc-400 hidden sm:inline">mande-ia://agent-core/pipeline-live.ts</span>
              </div>
              <div className="flex items-center gap-4 text-zinc-400">
                <span className="flex items-center gap-1.5 text-emerald-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  AGENT STATUS: ACTIF
                </span>
                <span className="text-zinc-600 hidden sm:inline">|</span>
                <span className="hidden sm:inline text-zinc-300">PRIORITY: BAMANANKAN</span>
              </div>
            </div>

            {/* Visual Canvas with Orb and Live Agent Trace */}
            <div className="relative bg-[#0A0D14] rounded-b-2xl p-6 sm:p-8 overflow-hidden min-h-[380px] flex flex-col lg:flex-row items-center justify-between gap-8">
              {/* Glowing Orb Asset */}
              <div className="relative w-64 h-64 sm:w-80 sm:h-80 flex-shrink-0 flex items-center justify-center">
                <div className="absolute inset-0 bg-emerald-500/25 rounded-full blur-2xl animate-pulse" />
                <img
                  src="https://cdn.prod.website-files.com/68f4ee72649c170da7026b71/68f76e999b0300ad737da980_orb.avif"
                  alt="Mande-IA Agent Core"
                  className="relative z-10 w-full h-full object-contain filter drop-shadow-[0_0_35px_rgba(16,185,129,0.5)] transition-transform duration-700 hover:scale-105"
                  loading="eager"
                />

                {/* Orbiting Telemetry Pills */}
                <div className="absolute -top-2 left-2 z-20 px-3 py-1.5 rounded-xl bg-[#0D1117]/90 border border-emerald-500/30 backdrop-blur-md text-[11px] font-mono text-emerald-400 flex items-center gap-1.5 shadow-lg">
                  <Cpu className="w-3.5 h-3.5" />
                  <span>Agent Core: Planner & Router</span>
                </div>

                <div className="absolute -bottom-2 right-2 z-20 px-3 py-1.5 rounded-xl bg-[#0D1117]/90 border border-emerald-500/30 backdrop-blur-md text-[11px] font-mono text-lime-400 flex items-center gap-1.5 shadow-lg">
                  <Search className="w-3.5 h-3.5" />
                  <span>Outil Exa Search Connecté</span>
                </div>
              </div>

              {/* Live Agent Execution Pipeline */}
              <div className="w-full flex-1 bg-[#07090D] border border-white/10 rounded-2xl p-5 shadow-2xl space-y-3 font-mono text-xs">
                <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-400" />
                    <span className="font-semibold text-zinc-200">Cycle d'Exécution Agent Core</span>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[10px]">
                    OpenRouter Gateway
                  </span>
                </div>

                {/* Step 1: User Input */}
                <div className="p-2.5 rounded-lg bg-white/[0.03] border border-white/5">
                  <div className="text-[11px] text-zinc-500 mb-1">01. INTENTION UTILISATEUR (BAMANANKAN) :</div>
                  <div className="text-zinc-200 font-sans font-medium">« I ni ce ! Kunnafoni kura minnu bɛ teknoloji kan Mali la ? »</div>
                </div>

                {/* Step 2: Agent Core Decision */}
                <div className="p-2.5 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
                  <div className="flex items-center justify-between text-[11px] text-emerald-400 mb-1">
                    <span>02. AGENT CORE // DÉCISION OUTIL :</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300">Exa Web Search</span>
                  </div>
                  <div className="text-zinc-300 text-[11px]">
                    Besoin de données actuelles détecté ➔ Lancement de la recherche web augmentée Exa.
                  </div>
                </div>

                {/* Step 3: Tool Execution & LLM Response */}
                <div className="p-2.5 rounded-lg bg-white/[0.03] border border-white/5">
                  <div className="flex items-center justify-between text-[11px] text-zinc-500 mb-1">
                    <span>03. RÉPONSE SYNTHÉTISÉE (BAMANANKAN) :</span>
                    <span className="text-emerald-400 text-[10px]">Latence &lt; 180ms</span>
                  </div>
                  <div className="text-zinc-200 font-sans text-xs leading-relaxed">
                    « I ni ce ! Exa ka lajɛli kɔnɔ, dɔnniya kura bɛ jira ko Mali bɛ ɲɛtaa sɔrɔ numérique kɔnɔ, kɛrɛnkɛrɛnnenya la telekɔmu ni dɔnniya kura (IA) kan... »
                  </div>
                </div>

                {/* Bottom Bar */}
                <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[11px] text-zinc-400 font-sans">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Sécurité stricte : Clés protégées côté serveur</span>
                  </div>
                  <button
                    onClick={onOpenChat}
                    className="text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    Ouvrir le Chat &rarr;
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 4 Pillars Cards */}
        <div className="mt-16 text-center">
          <p className="text-xs uppercase tracking-widest text-zinc-400 font-mono mb-6">
            Piliers Fondateurs de Mande-IA v2.0
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-4xl mx-auto">
            <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 text-center">
              <div className="text-sm font-bold text-emerald-400 mb-0.5">Bamanankan-First</div>
              <div className="text-xs text-zinc-400">Mali & Communautés Mandingues</div>
            </div>
            <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 text-center">
              <div className="text-sm font-bold text-emerald-400 mb-0.5">Agent Core & Exa</div>
              <div className="text-xs text-zinc-400">Intention & Recherche Web</div>
            </div>
            <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 text-center">
              <div className="text-sm font-bold text-emerald-400 mb-0.5">OpenRouter Gateway</div>
              <div className="text-xs text-zinc-400">Couche d'abstraction multi-LLM</div>
            </div>
            <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 text-center">
              <div className="text-sm font-bold text-emerald-400 mb-0.5">Djelia.ia & Données</div>
              <div className="text-xs text-zinc-400">Voix Bamanankan & PostgreSQL</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
