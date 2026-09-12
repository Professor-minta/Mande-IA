import React from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';

interface FinalCtaProps {
  onOpenChat: () => void;
}

export const FinalCta: React.FC<FinalCtaProps> = ({ onOpenChat }) => {
  return (
    <section className="py-24 relative overflow-hidden bg-gradient-to-b from-[#07090D] via-[#090D14] to-[#08090C] border-t border-white/5">
      {/* Central Emerald Radial */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-emerald-500/10 rounded-full blur-[160px] pointer-events-none" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
        <h2 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight mb-6 font-['Plus_Jakarta_Sans'] leading-[1.15]">
          Faisons en sorte qu'elle parle{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-lime-300">
            aussi les nôtres.
          </span>
        </h2>

        <p className="text-zinc-300 text-base sm:text-xl leading-relaxed mb-10 max-w-2xl mx-auto font-normal">
          Découvrez Mande-IA et participez à la construction d'une IA plus accessible, plus inclusive et plus proche des communautés africaines.
        </p>

        <div className="flex justify-center">
          <button
            id="final-cta-btn"
            onClick={() => {
              onOpenChat();
            }}
            className="px-8 py-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-[#08090C] font-bold text-base transition-all duration-200 flex items-center gap-2 shadow-[0_0_35px_rgba(16,185,129,0.4)] hover:shadow-[0_0_50px_rgba(16,185,129,0.6)] cursor-pointer group"
          >
            <span>Essayer Mande-IA</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    </section>
  );
};
