import React, { useState } from 'react';
import { Check, Sparkles, Zap, Shield, ArrowRight } from 'lucide-react';
import { PRICING_PLANS } from '../data/mockData';
import { PricingPlan } from '../types';

interface PricingProps {
  onSelectPlan: (plan: PricingPlan) => void;
}

export const Pricing: React.FC<PricingProps> = ({ onSelectPlan }) => {
  const [isAnnual, setIsAnnual] = useState(true);

  return (
    <section id="pricing-section" className="py-24 relative bg-[#08090C] overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-emerald-500/5 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono uppercase tracking-wider mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Offres & Accessibilité // Mali & International</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight mb-4">
            Des Tarifs Clairs et Inclusifs
          </h2>
          <p className="text-zinc-400 text-base leading-relaxed">
            Un accès universel pour la communauté et les étudiants, et des formules adaptées aux entreprises et institutions déployant l'IA au Sahel.
          </p>

          {/* Billing Cycle Toggle */}
          <div className="mt-8 inline-flex items-center gap-3 p-1.5 rounded-full bg-[#121620] border border-white/10">
            <button
              id="billing-monthly-btn"
              onClick={() => setIsAnnual(false)}
              className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all duration-200 cursor-pointer ${
                !isAnnual
                  ? 'bg-emerald-500 text-black font-semibold'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Facturation Mensuelle
            </button>
            <button
              id="billing-annual-btn"
              onClick={() => setIsAnnual(true)}
              className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all duration-200 flex items-center gap-1.5 cursor-pointer ${
                isAnnual
                  ? 'bg-emerald-500 text-black font-semibold'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <span>Facturation Annuelle</span>
              <span className="px-1.5 py-0.5 rounded-full bg-black/30 text-[10px] font-mono font-bold">
                -20%
              </span>
            </button>
          </div>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
          {PRICING_PLANS.map((plan) => {
            const price = isAnnual ? plan.annualPrice : plan.monthlyPrice;
            const fcfaPrice = price === 0 ? '0 FCFA' : `${(price * 600).toLocaleString('fr-FR')} FCFA`;
            return (
              <div
                key={plan.id}
                className={`relative rounded-3xl p-8 flex flex-col justify-between transition-all duration-300 ${
                  plan.popular
                    ? 'bg-gradient-to-b from-[#131924] to-[#0D111A] border-2 border-emerald-500/50 shadow-[0_0_50px_rgba(16,185,129,0.15)] -translate-y-2'
                    : 'bg-[#0D1017] border border-white/10 hover:border-white/20'
                }`}
              >
                {/* Popular Pill */}
                {plan.popular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3.5 py-0.5 rounded-full bg-emerald-500 text-black font-mono text-[11px] font-bold tracking-wider uppercase shadow-[0_0_15px_rgba(16,185,129,0.5)]">
                    Recommandé
                  </div>
                )}

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-2xl font-bold text-white font-['Plus_Jakarta_Sans']">
                      {plan.name}
                    </h3>
                  </div>

                  <p className="text-zinc-400 text-xs leading-relaxed mb-6">
                    {plan.tagline}
                  </p>

                  {/* Price */}
                  <div className="mb-8 pb-6 border-b border-white/5">
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl sm:text-5xl font-extrabold text-white font-mono">
                        {price === 0 ? '0$' : `$${price}`}
                      </span>
                      <span className="text-zinc-500 text-xs font-mono">
                        / mois
                      </span>
                    </div>
                    <div className="text-xs font-mono text-emerald-400 mt-1">
                      {fcfaPrice} / mois
                    </div>
                  </div>

                  {/* Features list */}
                  <div className="space-y-3 mb-8">
                    <div className="text-[11px] font-mono text-zinc-500 uppercase tracking-wider mb-2">
                      Capacités Incluses
                    </div>
                    {plan.features.map((feature, idx) => (
                      <div key={idx} className="flex items-start gap-3 text-xs text-zinc-300">
                        <Check className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Plan Action Button */}
                <button
                  id={`select-plan-${plan.id}`}
                  onClick={() => onSelectPlan(plan)}
                  className={`w-full py-3.5 rounded-xl font-semibold text-xs tracking-wide transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer ${
                    plan.popular
                      ? 'bg-emerald-500 hover:bg-emerald-400 text-black shadow-[0_0_20px_rgba(16,185,129,0.35)]'
                      : 'bg-white/5 hover:bg-white/10 text-white border border-white/10'
                  }`}
                >
                  <span>{plan.buttonText}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
