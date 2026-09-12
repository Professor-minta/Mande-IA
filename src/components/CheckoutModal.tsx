import React, { useState } from 'react';
import { X, Check, Sparkles, Shield, ArrowRight, Lock } from 'lucide-react';
import { PricingPlan } from '../types';

interface CheckoutModalProps {
  plan: PricingPlan | null;
  onClose: () => void;
  onSuccess: (msg: string) => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({ plan, onClose, onSuccess }) => {
  const [email, setEmail] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  if (!plan) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      onSuccess(`🚀 Welcome to Mande AI ${plan.name}! Account activated.`);
      onClose();
    }, 900);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-[#0C0F16] border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl overflow-hidden">
        {/* Ambient glow */}
        <div className="absolute -top-20 -right-20 w-56 h-56 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Plan Details */}
        <div className="mb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 font-mono text-[11px] mb-3">
            <Sparkles className="w-3 h-3" />
            <span>INSTANT ACCESS // MANDE-AI</span>
          </div>
          <h3 className="text-2xl font-bold text-white mb-1">
            Activate {plan.name}
          </h3>
          <p className="text-zinc-400 text-xs leading-relaxed">
            {plan.tagline}
          </p>
        </div>

        {/* Price display */}
        <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-between mb-6">
          <div>
            <div className="text-xs text-zinc-500 font-mono">SELECTED TIER</div>
            <div className="text-xl font-bold text-white">{plan.name}</div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold font-mono text-emerald-400">${plan.annualPrice}</div>
            <div className="text-[10px] text-zinc-500 font-mono">billed monthly</div>
          </div>
        </div>

        {/* Included Features */}
        <div className="space-y-2 mb-6">
          {plan.features.slice(0, 3).map((feat, idx) => (
            <div key={idx} className="flex items-center gap-2.5 text-xs text-zinc-300">
              <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>{feat}</span>
            </div>
          ))}
        </div>

        {/* Activation Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-mono text-zinc-400 mb-1.5 uppercase">
              Work Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="alex@company.design"
              className="w-full bg-[#080A0E] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-emerald-500/50"
            />
          </div>

          <button
            type="submit"
            disabled={isProcessing}
            className="w-full py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-xs tracking-wider uppercase transition-all duration-200 flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(16,185,129,0.35)] cursor-pointer"
          >
            {isProcessing ? (
              <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Lock className="w-3.5 h-3.5" />
                <span>Activate Workspace &rarr;</span>
              </>
            )}
          </button>
        </form>

        <div className="mt-4 flex items-center justify-center gap-2 text-[11px] text-zinc-500">
          <Shield className="w-3.5 h-3.5 text-emerald-400" />
          <span>7-day risk-free trial • Cancel anytime with one click</span>
        </div>
      </div>
    </div>
  );
};
