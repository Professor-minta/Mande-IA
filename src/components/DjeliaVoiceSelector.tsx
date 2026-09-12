import React, { useState, useEffect } from 'react';
import { DJELIA_VOICES, DjeliaVoice, djeliaVoiceService } from '../services/djeliaVoice';
import { Volume2, VolumeX, Mic, Sliders, Check, Play, Square, Sparkles, X, Key, ExternalLink } from 'lucide-react';
import { MandeLoader } from './MandeLoader';

interface DjeliaVoiceSelectorProps {
  audioEnabled: boolean;
  onToggleAudio: () => void;
  className?: string;
  onNotice?: (msg: string) => void;
}

export const DjeliaVoiceSelector: React.FC<DjeliaVoiceSelectorProps> = ({
  audioEnabled,
  onToggleAudio,
  className = '',
  onNotice,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentVoice, setCurrentVoice] = useState<DjeliaVoice>(djeliaVoiceService.getCurrentVoice());
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speed, setSpeed] = useState<number>(1.0);
  const [testPlayingId, setTestPlayingId] = useState<string | null>(null);
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);
  const [apiKey, setApiKey] = useState('');

  useEffect(() => {
    const unsub = djeliaVoiceService.subscribe((speaking, voiceId) => {
      setIsSpeaking(speaking);
      const v = DJELIA_VOICES.find(item => item.id === voiceId);
      if (v) setCurrentVoice(v);
    });
    if (typeof window !== 'undefined') {
      const savedKey = localStorage.getItem('mande_djelia_api_key') || '';
      setApiKey(savedKey);
    }
    return () => unsub();
  }, []);

  const handleSelectVoice = (voice: DjeliaVoice) => {
    djeliaVoiceService.setVoice(voice.id);
    setCurrentVoice(voice);
    onNotice?.(`Voix Djelia sélectionnée : ${voice.name} (${voice.tone})`);
  };

  const handleTestVoice = (voice: DjeliaVoice) => {
    if (testPlayingId === voice.id && isSpeaking) {
      djeliaVoiceService.stop();
      setTestPlayingId(null);
      return;
    }

    setTestPlayingId(voice.id);
    const testPhrase = voice.gender === 'female'
      ? "I ni ce ! N tɔgɔ ye Aminata ye. Mande-IA bɛ kuma k'i dɛmɛ ni API Djelia.cloud ye Bamanankan kɔnɔ."
      : "I ni ce kɔsɛbɛ ! N ye Djeli Bakary ye, Mande-IA bɛ baara kɛ ni API Djelia.cloud ye k'a fɔ Bamanankan na.";

    djeliaVoiceService.speak(testPhrase, {
      voiceId: voice.id,
      language: 'bm',
      speed: speed,
      onEnd: () => setTestPlayingId(null),
      onError: () => setTestPlayingId(null),
    });
  };

  const handleSaveApiKey = () => {
    djeliaVoiceService.setApiKey(apiKey.trim());
    setShowApiKeyInput(false);
    onNotice?.("Clé API Djelia.cloud enregistrée pour la lecture Bamanankan !");
  };

  return (
    <div className={`relative ${className}`}>
      {/* Trigger Button */}
      <div className="flex items-center gap-1.5 bg-[#0D111A] border border-white/10 rounded-xl p-1 shadow-sm">
        {/* Toggle Audio Button */}
        <button
          onClick={onToggleAudio}
          className={`p-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
            audioEnabled
              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5 border border-transparent'
          }`}
          title={audioEnabled ? "Lecture audio Djelia.ia activée" : "Lecture audio désactivée"}
        >
          {audioEnabled ? (
            isSpeaking ? (
              <div className="flex items-center gap-1">
                <MandeLoader size="xs" />
                <span className="text-[11px] font-mono font-medium hidden sm:inline text-emerald-400">
                  Djelia
                </span>
              </div>
            ) : (
              <>
                <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-[11px] font-mono hidden sm:inline text-emerald-400">
                  Djelia
                </span>
              </>
            )
          ) : (
            <>
              <VolumeX className="w-3.5 h-3.5" />
              <span className="text-[11px] font-mono hidden sm:inline">Muet</span>
            </>
          )}
        </button>

        {/* Voice Selector Popover Toggle */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`px-2 py-1 rounded-lg text-[11px] font-mono transition-all flex items-center gap-1.5 cursor-pointer border ${
            isOpen
              ? 'bg-white/10 border-white/20 text-white'
              : 'border-transparent text-zinc-400 hover:text-white hover:bg-white/5'
          }`}
          title="Paramètres de voix Djelia.ia"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          <span className="hidden md:inline max-w-[80px] truncate text-zinc-300">
            {currentVoice.name.split(' ')[0]}
          </span>
          <Sliders className="w-3 h-3 text-zinc-400" />
        </button>
      </div>

      {/* Popover Dropdown */}
      {isOpen && (
        <>
          {/* Click-away backdrop to close popover */}
          <div
            className="fixed inset-0 z-40 bg-transparent"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-[#0B0F19] border border-white/15 rounded-2xl p-4 shadow-[0_25px_70px_rgba(0,0,0,0.95),0_0_30px_rgba(16,185,129,0.12)] z-50 animate-in fade-in zoom-in-95">
            {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-white/5 mb-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white tracking-tight flex items-center gap-1.5">
                  API Djelia.cloud
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono">
                    Lecture Bamanankan
                  </span>
                </h4>
                <p className="text-[10px] text-zinc-400">Synthèse vocale neuronale & tonalités mandingues</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 text-zinc-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Voices list */}
          <div className="space-y-1.5 mb-3 max-h-56 overflow-y-auto pr-1">
            <div className="text-[10px] uppercase font-mono text-zinc-500 px-1 mb-1">
              Voix Bamanankan disponibles
            </div>
            {DJELIA_VOICES.map((voice) => {
              const isSelected = currentVoice.id === voice.id;
              const isVoiceTesting = testPlayingId === voice.id && isSpeaking;

              return (
                <div
                  key={voice.id}
                  onClick={() => handleSelectVoice(voice)}
                  className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-2 ${
                    isSelected
                      ? 'bg-emerald-500/10 border-emerald-500/40 text-white shadow-[0_0_15px_rgba(16,185,129,0.1)]'
                      : 'bg-white/[0.02] border-white/5 hover:border-white/10 hover:bg-white/[0.04] text-zinc-300'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold font-mono ${
                        isSelected
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-white/5 text-zinc-400 border border-white/5'
                      }`}
                    >
                      {voice.avatarInitials}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold truncate">{voice.name}</span>
                        <span className="text-[9px] px-1 rounded bg-white/5 text-zinc-400 font-mono">
                          {voice.tone}
                        </span>
                      </div>
                      <p className="text-[10px] text-zinc-400 truncate">{voice.recommendedFor}</p>
                    </div>
                  </div>

                  {/* Actions: Test Button + Check */}
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleTestVoice(voice);
                      }}
                      className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white transition-colors cursor-pointer"
                      title="Tester cette voix"
                    >
                      {isVoiceTesting ? (
                        <Square className="w-3 h-3 text-amber-400 fill-amber-400" />
                      ) : (
                        <Play className="w-3 h-3" />
                      )}
                    </button>
                    {isSelected && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Speed control */}
          <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5 mb-3">
            <div className="flex items-center justify-between text-[11px] mb-1.5">
              <span className="text-zinc-400">Vitesse d'élocution</span>
              <span className="font-mono text-emerald-400">{speed.toFixed(1)}x</span>
            </div>
            <div className="flex items-center gap-2">
              {[0.8, 1.0, 1.2].map((s) => (
                <button
                  key={s}
                  onClick={() => setSpeed(s)}
                  className={`flex-1 py-1 rounded-lg text-[10px] font-mono border transition-all cursor-pointer ${
                    speed === s
                      ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                      : 'bg-white/5 border-transparent text-zinc-400 hover:text-white'
                  }`}
                >
                  {s === 1.0 ? 'Normal (1.0x)' : `${s}x`}
                </button>
              ))}
            </div>
          </div>

          {/* Djelia Cloud API Key configuration */}
          <div className="pt-2 border-t border-white/5">
            {!showApiKeyInput ? (
              <div className="flex items-center justify-between text-[10px] text-zinc-400">
                <button
                  onClick={() => setShowApiKeyInput(true)}
                  className="flex items-center gap-1 hover:text-white transition-colors cursor-pointer"
                >
                  <Key className="w-3 h-3 text-zinc-500" />
                  <span>{apiKey ? 'Clé API configurée' : 'Connecter clé Djelia Cloud'}</span>
                </button>
                <a
                  href="https://djelia.cloud"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 hover:text-emerald-400 transition-colors"
                >
                  <span>djelia.cloud</span>
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-zinc-400">Clé API Djelia Cloud (Optionnelle)</span>
                  <button
                    onClick={() => setShowApiKeyInput(false)}
                    className="text-zinc-500 hover:text-white"
                  >
                    Fermer
                  </button>
                </div>
                <div className="flex gap-1.5">
                  <input
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="djelia_live_..."
                    className="flex-1 bg-black/40 border border-white/10 rounded-lg px-2.5 py-1 text-[11px] text-white focus:outline-none focus:border-emerald-500 font-mono"
                  />
                  <button
                    onClick={handleSaveApiKey}
                    className="px-2.5 py-1 rounded-lg bg-emerald-500 text-black text-[10px] font-bold hover:bg-emerald-400 cursor-pointer"
                  >
                    OK
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </>
    )}
    </div>
  );
};
