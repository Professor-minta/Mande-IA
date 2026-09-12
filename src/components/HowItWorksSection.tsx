import React from 'react';
import { PenTool, Brain, Search, CheckCircle2, ArrowRight, Sparkles } from 'lucide-react';

export const HowItWorksSection: React.FC = () => {
  const steps = [
    {
      num: "01",
      title: "Exprimez votre besoin",
      description: "Écrivez ou, bientôt, dites ce que vous voulez faire. Vous pouvez utiliser le Bamanankan, le Français ou l'English.",
      icon: PenTool
    },
    {
      num: "02",
      title: "Mande-IA comprend",
      description: "L'agent analyse votre demande, son contexte et détermine la meilleure façon de vous aider.",
      icon: Brain
    },
    {
      num: "03",
      title: "L'agent agit",
      description: "Lorsque c'est nécessaire, Mande-IA utilise ses outils — comme la recherche web — pour obtenir les informations dont il a besoin.",
      icon: Search
    },
    {
      num: "04",
      title: "Obtenez votre réponse",
      description: "Mande-IA rassemble les informations et vous répond de manière claire et naturelle dans la langue de votre choix.",
      icon: CheckCircle2
    }
  ];

  return (
    <section id="how-it-works" className="py-24 relative overflow-hidden bg-[#08090C] border-t border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono uppercase tracking-widest mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            <span>COMMENT ÇA MARCHE</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight mb-4 font-['Plus_Jakarta_Sans'] leading-tight">
            De votre idée à une{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">
              réponse intelligente.
            </span>
          </h2>
          <p className="text-zinc-400 text-base sm:text-lg leading-relaxed font-normal">
            Une expérience simple pour l'utilisateur. Une architecture puissante derrière.
          </p>
        </div>

        {/* 4 Steps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <div
                key={step.num}
                className="p-7 rounded-2xl bg-[#0D1017] border border-white/10 hover:border-emerald-500/40 transition-all duration-300 group relative flex flex-col justify-between shadow-lg"
              >
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <span className="text-2xl font-black font-mono text-emerald-400/50 group-hover:text-emerald-400 transition-colors">
                      {step.num}
                    </span>
                    <div className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/10 flex items-center justify-center text-zinc-300 group-hover:text-emerald-400 group-hover:border-emerald-500/30 transition-all">
                      <Icon className="w-5 h-5" />
                    </div>
                  </div>

                  <h3 className="text-lg font-bold text-white mb-2 font-['Plus_Jakarta_Sans']">
                    {step.title}
                  </h3>

                  <p className="text-zinc-400 text-sm leading-relaxed font-normal">
                    {step.description}
                  </p>
                </div>

                <div className="pt-6 mt-4 border-t border-white/5 flex items-center text-xs font-mono text-zinc-500 group-hover:text-emerald-400/80 transition-colors">
                  <span>ÉTAPE {step.num}</span>
                  {idx < 3 && (
                    <ArrowRight className="w-3.5 h-3.5 ml-auto hidden lg:inline text-zinc-600 group-hover:text-emerald-400 transition-colors" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
