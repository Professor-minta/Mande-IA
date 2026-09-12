import React, { useState } from 'react';
import { X, Copy, Check, ArrowUpRight, Terminal, Sparkles } from 'lucide-react';
import { ShowcaseItem } from '../types';

interface ShowcaseModalProps {
  item: ShowcaseItem | null;
  onClose: () => void;
  onTestInStudio: (item: ShowcaseItem) => void;
  onCopyNotice: (msg: string) => void;
}

export const ShowcaseModal: React.FC<ShowcaseModalProps> = ({
  item,
  onClose,
  onTestInStudio,
  onCopyNotice,
}) => {
  const [copied, setCopied] = useState(false);

  if (!item) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(item.codeSnippet);
    setCopied(true);
    onCopyNotice(`📋 Copied ${item.title} to clipboard!`);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-[#0D1017] border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 font-mono text-[11px] mb-3">
            <Sparkles className="w-3 h-3" />
            <span>{item.badge}</span>
          </div>
          <h3 className="text-2xl sm:text-3xl font-bold text-white mb-2">
            {item.title}
          </h3>
          <p className="text-zinc-400 text-sm leading-relaxed">
            {item.description}
          </p>
        </div>

        {/* Image Preview */}
        <div className="rounded-2xl overflow-hidden border border-white/10 mb-6 bg-black">
          <img
            src={item.image}
            alt={item.title}
            className="w-full h-auto object-cover max-h-[360px]"
          />
        </div>

        {/* Code Snippet Box */}
        <div className="rounded-xl bg-[#07090D] border border-white/10 p-4 mb-6 font-mono text-xs text-zinc-300">
          <div className="flex justify-between items-center mb-2 pb-2 border-b border-white/5 text-zinc-500 text-[11px]">
            <span>SYNTHESIZED CODE</span>
            <span className="text-emerald-400 font-bold">{item.stats.label}: {item.stats.value}</span>
          </div>
          <pre className="overflow-x-auto text-emerald-300">
            <code>{item.codeSnippet}</code>
          </pre>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-white/5">
          <button
            onClick={handleCopy}
            className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-white flex items-center gap-2 transition-colors cursor-pointer"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Copied' : 'Copy JSX Code'}</span>
          </button>

          <button
            onClick={() => {
              onTestInStudio(item);
              onClose();
            }}
            className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-xs flex items-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.35)] transition-all cursor-pointer"
          >
            <Terminal className="w-4 h-4" />
            <span>Open in Mande Studio</span>
            <ArrowUpRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
