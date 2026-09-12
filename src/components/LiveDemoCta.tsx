import React from 'react';
import { ArrowRight, Sparkles, Bot, Globe } from 'lucide-react';

interface LiveDemoCtaProps {
  onOpenChat: () => void;
}

export const LiveDemoCta: React.FC<LiveDemoCtaProps> = ({ onOpenChat }) => {
  return (
    <section className="py-20 relative overflow-hidden bg-[#07090D] border-t border-white/5">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono uppercase tracking-widest mb-4">
          <Bot className="w-3.5 h-3.5" />
          <span>DÉMO EN DIRECT</span>
        </div>

        <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight mb-4 font-['Plus_Jakarta_Sans']">
          Essayez Mande-IA maintenant.
        </h2>

        <p className="text-zinc-400 text-base sm:text-lg mb-8 max-w-lg mx-auto leading-relaxed">
          Ne nous croyez pas sur parole.<br />
          Testez-le directement.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6">
          <button
            id="live-demo-cta-primary"
            onClick={() => {
              onOpenChat();
            }}
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-[#08090C] font-bold text-sm transition-all duration-200 flex items-center justify-center gap-2 shadow-[0_0_30px_rgba(16,185,129,0.35)] hover:shadow-[0_0_40px_rgba(16,185,129,0.55)] cursor-pointer group"
          >
            <Sparkles className="w-4 h-4 text-black" />
            <span>Ouvrir Mande-IA</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>

          <button
            id="live-demo-cta-secondary"
            onClick={() => {
              const elem = document.getElementById('why-mande');
              if (elem) elem.scrollIntoView({ behavior: 'smooth' });
            }}
            className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-[#121620] hover:bg-[#161C28] text-zinc-200 font-semibold text-sm border border-white/10 hover:border-white/20 transition-colors flex items-center justify-center cursor-pointer"
          >
            <span>Découvrir le projet</span>
          </button>
        </div>

        {/* Languages footer */}
        <div className="flex items-center justify-center gap-2 text-xs text-zinc-400">
          <Globe className="w-3.5 h-3.5 text-emerald-400" />
          <span>Bamanankan · Français · English</span>
        </div>
      </div>
    </section>
  );
};
