import React from 'react';
import { MessageSquare, Search, Brain, Wrench, Languages, Mic, Sparkles } from 'lucide-react';

export const CapabilitiesSection: React.FC = () => {
  const capabilities = [
    {
      title: "Conversation",
      description: "Posez une question, demandez une explication ou discutez naturellement avec Mande-IA.",
      icon: MessageSquare,
      badge: null
    },
    {
      title: "Recherche",
      description: "Obtenez des informations actuelles grâce à la recherche web intégrée.",
      icon: Search,
      badge: "Exa"
    },
    {
      title: "Raisonnement",
      description: "Mande-IA analyse votre demande, comprend le contexte et choisit la meilleure manière de vous répondre.",
      icon: Brain,
      badge: null
    },
    {
      title: "Agents & outils",
      description: "L'architecture de Mande-IA permet d'ajouter progressivement des outils capables d'accomplir de véritables tâches.",
      icon: Wrench,
      badge: null
    },
    {
      title: "Multilingue",
      description: "Passez du Bamanankan au Français ou à l'English selon votre besoin.",
      icon: Languages,
      badge: "3 Langues"
    },
    {
      title: "Voice",
      description: "Bientôt : parlez directement à Mande-IA et écoutez ses réponses dans votre langue.",
      icon: Mic,
      badge: "Bientôt",
      isFuture: true
    }
  ];

  return (
    <section id="capabilities-section" className="py-24 relative overflow-hidden bg-[#07090D] border-t border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono uppercase tracking-widest mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            <span>FONCTIONNALITÉS</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight mb-4 font-['Plus_Jakarta_Sans'] leading-tight">
            Tout ce dont vous avez besoin.{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">
              Une seule conversation.
            </span>
          </h2>
          <p className="text-zinc-400 text-base sm:text-lg leading-relaxed font-normal">
            Demandez. Explorez. Créez. Recherchez. Mande-IA transforme une simple conversation en une expérience intelligente capable d'évoluer avec vos besoins.
          </p>
        </div>

        {/* 6 Capabilities Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {capabilities.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className={`p-7 rounded-2xl border transition-all duration-300 relative overflow-hidden flex flex-col justify-between ${
                  item.isFuture
                    ? 'bg-[#0B0E14] border-white/10 hover:border-emerald-500/30'
                    : 'bg-[#0D1017] border-white/10 hover:border-emerald-500/40 shadow-lg hover:shadow-xl'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-5">
                    <div className="w-11 h-11 rounded-xl bg-white/[0.04] border border-white/10 flex items-center justify-center text-emerald-400">
                      <Icon className="w-5 h-5" />
                    </div>
                    {item.badge && (
                      <span className={`px-2.5 py-1 rounded-full text-xs font-mono font-medium ${
                        item.isFuture
                          ? 'bg-amber-500/10 border border-amber-500/20 text-amber-400'
                          : 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                      }`}>
                        {item.badge}
                      </span>
                    )}
                  </div>

                  <h3 className="text-lg font-bold text-white mb-2 font-['Plus_Jakarta_Sans']">
                    {item.title}
                  </h3>

                  <p className="text-zinc-400 text-sm leading-relaxed font-normal">
                    {item.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
