import React, { useState } from 'react';
import { User, Eye, Brain, Search, Play, CheckCircle2, ShieldCheck, Database, Cpu, Network, Sparkles, ArrowRight, Volume2 } from 'lucide-react';

export const AgentArchitectureSection: React.FC = () => {
  const [activeStage, setActiveStage] = useState<number>(0);

  const workflowStages = [
    {
      id: "you",
      label: "YOU",
      sub: "Utilisateur",
      icon: User,
      desc: "Vous formulez votre demande en Bamanankan, Français ou Anglais."
    },
    {
      id: "understand",
      label: "UNDERSTAND",
      sub: "Compréhension",
      icon: Eye,
      desc: "L'Agent Core analyse le langage, identifie l'intention et le contexte culturel."
    },
    {
      id: "think",
      label: "THINK",
      sub: "Raisonnement",
      icon: Brain,
      desc: "Le Planner décide de la stratégie et détermine si des outils externes sont requis."
    },
    {
      id: "search",
      label: "SEARCH",
      sub: "Recherche Exa",
      icon: Search,
      desc: "Si des faits récents sont nécessaires, l'agent interroge le web via l'API Exa."
    },
    {
      id: "act",
      label: "ACT",
      sub: "Exécution",
      icon: Play,
      desc: "L'agent sélectionne le modèle adapté via OpenRouter et exécute les actions."
    },
    {
      id: "respond",
      label: "RESPOND",
      sub: "Restitution",
      icon: CheckCircle2,
      desc: "Mande-IA synthétise une réponse claire, fluide et naturelle dans votre langue."
    }
  ];

  const techStack = [
    {
      title: "API Djelia.cloud",
      description: "Moteur vocal Bamanankan : lecture vocale neuronale (TTS) et transcription (STT) avec respect des accents et tons mandingues.",
      icon: Volume2,
      tag: "API Lecture Bamanankan"
    },
    {
      title: "OpenRouter",
      description: "Accéder à différents modèles IA à travers une architecture flexible.",
      icon: Cpu,
      tag: "Passerelle Modèles"
    },
    {
      title: "Exa",
      description: "Donner à l'agent la capacité de rechercher des informations actuelles sur le web.",
      icon: Search,
      tag: "Recherche Sémantique"
    },
    {
      title: "Agent Core",
      description: "Orchestrer le raisonnement, le contexte et les outils.",
      icon: Network,
      tag: "Cerveau Agentique"
    },
    {
      title: "Secure API",
      description: "Garder les clés et les opérations sensibles côté serveur.",
      icon: ShieldCheck,
      tag: "Sécurité & Isolation"
    },
    {
      title: "Database",
      description: "Conserver les conversations et les données nécessaires à une expérience personnalisée.",
      icon: Database,
      tag: "PostgreSQL Structuré"
    }
  ];

  return (
    <section id="architecture-section" className="py-24 relative overflow-hidden bg-[#07090D] border-t border-white/5">
      {/* Ambient background glow */}
      <div className="absolute top-1/4 right-1/4 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section 10: Agent Section */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono uppercase tracking-widest mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AGENT AUTONOME</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight mb-4 font-['Plus_Jakarta_Sans'] leading-tight">
            Plus qu'un chatbot.{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">
              Un agent capable d'agir.
            </span>
          </h2>
          <p className="text-zinc-300 text-base sm:text-lg leading-relaxed font-normal">
            La prochaine génération d'IA ne se contente pas de répondre. Elle comprend l'objectif, choisit les bons outils et réalise les étapes nécessaires pour obtenir un résultat. C'est la direction de Mande-IA.
          </p>
        </div>

        {/* Visual Concept Flow: YOU -> UNDERSTAND -> THINK -> SEARCH -> ACT -> RESPOND */}
        <div className="mb-24">
          <div className="p-6 sm:p-8 rounded-3xl bg-[#0B0E15] border border-white/10 shadow-2xl max-w-5xl mx-auto">
            <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-6">
              <span className="text-xs font-mono text-zinc-400 uppercase tracking-wider">
                Cycle d'Orchestration Agentique
              </span>
              <span className="text-xs font-mono text-emerald-400">
                Pipeline temps-réel
              </span>
            </div>

            {/* Step buttons flow */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {workflowStages.map((stage, idx) => {
                const Icon = stage.icon;
                const isSelected = activeStage === idx;
                return (
                  <button
                    key={stage.id}
                    onClick={() => setActiveStage(idx)}
                    className={`p-4 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'bg-emerald-500/15 border-emerald-500/60 shadow-[0_0_20px_rgba(16,185,129,0.2)]'
                        : 'bg-white/[0.02] border-white/5 hover:border-white/20 hover:bg-white/[0.04]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <Icon className={`w-5 h-5 ${isSelected ? 'text-emerald-400' : 'text-zinc-400'}`} />
                      <span className="text-[10px] font-mono text-zinc-500">0{idx + 1}</span>
                    </div>
                    <div>
                      <div className={`text-xs font-bold font-mono tracking-wider ${isSelected ? 'text-emerald-300' : 'text-white'}`}>
                        {stage.label}
                      </div>
                      <div className="text-[11px] text-zinc-400">
                        {stage.sub}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Selected Stage Detail banner */}
            <div className="mt-6 p-4 rounded-xl bg-white/[0.03] border border-white/5 flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
              <div className="text-xs sm:text-sm text-zinc-300">
                <strong className="text-white font-mono">{workflowStages[activeStage].label} : </strong>
                {workflowStages[activeStage].desc}
              </div>
            </div>
          </div>
        </div>

        {/* Section 11: Technology */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/[0.04] border border-white/10 text-zinc-300 text-xs font-mono uppercase tracking-widest mb-4">
            <Cpu className="w-3.5 h-3.5 text-emerald-400" />
            <span>TECHNOLOGIE</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-4 font-['Plus_Jakarta_Sans']">
            Une technologie moderne derrière une expérience simple.
          </h2>
        </div>

        {/* 5 Tech Stack Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-5 max-w-6xl mx-auto">
          {techStack.map((tech, idx) => {
            const Icon = tech.icon;
            return (
              <div
                key={idx}
                className="p-6 rounded-2xl bg-[#0D1017] border border-white/10 hover:border-emerald-500/40 transition-all duration-300 flex flex-col justify-between shadow-lg"
              >
                <div>
                  <div className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/10 flex items-center justify-center text-emerald-400 mb-4">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-bold text-white mb-2 font-['Plus_Jakarta_Sans']">
                    {tech.title}
                  </h3>
                  <p className="text-zinc-400 text-xs sm:text-sm leading-relaxed mb-4">
                    {tech.description}
                  </p>
                </div>
                <div className="pt-3 border-t border-white/5 text-[11px] font-mono text-emerald-400/80">
                  {tech.tag}
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
