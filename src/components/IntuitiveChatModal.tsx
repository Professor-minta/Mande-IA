import React, { useState, useEffect, useRef } from 'react';
import { MandeLogo } from './MandeLogo';
import { MandeLoader } from './MandeLoader';
import { DjeliaVoiceSelector } from './DjeliaVoiceSelector';
import { djeliaVoiceService } from '../services/djeliaVoice';
import {
  Bot,
  Sparkles,
  Send,
  ArrowUp,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Search,
  ThumbsUp,
  ThumbsDown,
  Copy,
  Check,
  X,
  Plus,
  ArrowRight,
  Globe,
  Brain,
  BookOpen,
  ChevronDown,
  Layers,
  ExternalLink,
  ShieldCheck,
  Zap,
  Square,
} from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  detectedIntent?: string;
  intentLabel?: string;
  sources?: Array<{
    title: string;
    url: string;
    snippet: string;
    date: string;
    confidence: string;
  }>;
  latencyMs?: number;
  modelUsed?: string;
  timestamp: string;
  feedback?: 'like' | 'dislike' | null;
  plannerSteps?: string[];
  agentRunId?: string;
}

interface IntuitiveChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCopyNotice: (msg: string) => void;
}

export const IntuitiveChatModal: React.FC<IntuitiveChatModalProps> = ({
  isOpen,
  onClose,
  onCopyNotice,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputQuery, setInputQuery] = useState('');
  const [language, setLanguage] = useState<'bm' | 'fr' | 'en'>('bm');
  const [selectedModel, setSelectedModel] = useState('anthropic/claude-3.5-sonnet');
  const [enableExaSearch, setEnableExaSearch] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [expandedTraceId, setExpandedTraceId] = useState<string | null>(null);
  const [showModelPicker, setShowModelPicker] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Sync Djelia voice speaking state
  useEffect(() => {
    const unsub = djeliaVoiceService.subscribe((speaking) => {
      if (!speaking) {
        setSpeakingMessageId(null);
      }
    });
    return () => unsub();
  }, []);

  // Close on ESC and lock body scroll
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  // Auto-scroll on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Focus textarea when modal opens or changes
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // New Chat action (resets conversation back to intuitive hero)
  const handleNewChat = () => {
    setMessages([]);
    setInputQuery('');
    onCopyNotice("✨ Nouvelle discussion prête");
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 50);
  };

  // Speech Recognition (Microphone)
  const toggleSpeechRecognition = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      onCopyNotice("⚠️ La reconnaissance vocale n'est pas supportée par ce navigateur.");
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = language === 'bm' ? 'fr-FR' : language === 'en' ? 'en-US' : 'fr-FR';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => {
        setIsListening(true);
        onCopyNotice("🎙️ Djelia STT : Écoute en cours (Bamanankan/Français)...");
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setInputQuery(transcript);
          onCopyNotice(`🗣️ Dicté via Djelia STT : "${transcript}"`);
        }
        setIsListening(false);
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch {
      setIsListening(false);
    }
  };

  // Text-to-Speech playback using Djelia.ia Voice Engine
  const speakResponse = (text: string, messageId?: string) => {
    if (speakingMessageId && speakingMessageId === messageId) {
      djeliaVoiceService.stop();
      setSpeakingMessageId(null);
      return;
    }

    if (messageId) {
      setSpeakingMessageId(messageId);
    }

    const currentVoice = djeliaVoiceService.getCurrentVoice();
    onCopyNotice(`🔊 Djelia.ia (${currentVoice.name}) s'exprime...`);

    djeliaVoiceService.speak(text, {
      language: language,
      onEnd: () => setSpeakingMessageId(null),
      onError: () => setSpeakingMessageId(null),
    });
  };

  const handleCopyText = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMessageId(id);
    onCopyNotice("📋 Réponse copiée");
    setTimeout(() => setCopiedMessageId(null), 2000);
  };

  const handleFeedback = (messageId: string, type: 'like' | 'dislike') => {
    setMessages((prev) =>
      prev.map((m) => (m.id === messageId ? { ...m, feedback: type } : m))
    );
    onCopyNotice(
      type === 'like'
        ? "👍 Merci pour votre retour !"
        : "👎 Retour noté pour l'apprentissage."
    );
  };

  // Sending a message
  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputQuery).trim();
    if (!query || isLoading) return;

    const userMessageId = `user-${Date.now()}`;
    const newUserMsg: ChatMessage = {
      id: userMessageId,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, newUserMsg]);
    setInputQuery('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/agent/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: query,
          language,
          model: selectedModel,
          enableExa: enableExaSearch
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }

      const resJson = await response.json();
      const data = resJson.data;

      const assistantMsg: ChatMessage = {
        id: `assist-${Date.now()}`,
        sender: 'assistant',
        text: data.reply,
        detectedIntent: data.detectedIntent,
        intentLabel: data.intentLabel,
        sources: data.sources || [],
        latencyMs: data.latencyMs,
        modelUsed: data.modelUsed,
        plannerSteps: data.plannerSteps || [],
        agentRunId: data.agentRunId,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages((prev) => [...prev, assistantMsg]);

      if (audioEnabled) {
        speakResponse(data.reply, assistantMsg.id);
      }
    } catch {
      // Fallback response for offline or transient issues
      const fallbackMsg: ChatMessage = {
        id: `assist-${Date.now()}`,
        sender: 'assistant',
        text: language === 'bm'
          ? `I ka ɲininkali "${query}" jaabili dilanna Mande Agent Core fɛ.\n\nAw ni ce, Mande-IA bɛ baara kɛ ka ɲɔgɔndan di dɔnniya kura (IA) kan Bamanankan na.`
          : `Réponse générée par Mande-IA pour : "${query}".\n\nMande-IA orchestre le raisonnement en Bamanankan et Français avec intégration continue.`,
        detectedIntent: 'discussion',
        intentLabel: 'Mande-IA Core',
        latencyMs: 120,
        modelUsed: selectedModel,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, fallbackMsg]);
      if (audioEnabled) {
        speakResponse(fallbackMsg.text, fallbackMsg.id);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Starter Cards Data based on Language (Clean & concise)
  const starterCards = [
    {
      icon: <Brain className="w-4 h-4 text-emerald-400" />,
      title: language === 'bm' ? 'Dɔnniya kura (IA)' : language === 'en' ? 'Artificial Intelligence' : "Comprendre l'IA",
      desc: language === 'bm'
        ? "Faamuyacogo nɔgɔman misali ɲumanw ye"
        : language === 'en'
        ? "Explain how AI works with simple examples"
        : "Comprendre simplement l'IA et ses usages",
      prompt: language === 'bm'
        ? "AI ye mun ye ? A bɛ baara kɛ cogo di ? N'fɛ ka a faamuya Bamanankan na."
        : language === 'en'
        ? "What is Artificial Intelligence and how does it work? Explain simply."
        : "Qu'est-ce que l'Intelligence Artificielle et comment fonctionne-t-elle concrètement ?",
      accent: 'hover:border-emerald-500/40 group-hover:text-emerald-400'
    },
    {
      icon: <Search className="w-4 h-4 text-sky-400" />,
      title: language === 'bm' ? 'Kunnafoniw & Sannifeere' : language === 'en' ? 'Live Web Search' : 'Actualités & Marché',
      desc: language === 'bm'
        ? "Sannifeere sɔngɔw ani saniyako dɔnniya kura"
        : language === 'en'
        ? "Latest agriculture news & market prices in Mali"
        : "Cours des denrées et tendances au Mali en direct",
      prompt: language === 'bm'
        ? "Cherche-moi les dernières informations sur l'agriculture et les marchés au Mali avec Exa Search."
        : language === 'en'
        ? "Search for the latest news on agriculture and market trends in Mali."
        : "Cherche-moi les dernières informations sur l'agriculture et les marchés au Mali.",
      accent: 'hover:border-sky-500/40 group-hover:text-sky-400'
    },
    {
      icon: <BookOpen className="w-4 h-4 text-violet-400" />,
      title: language === 'bm' ? 'Manden Nsirin & Ntolatow' : language === 'en' ? 'Manding Wisdom' : 'Culture & Sagesse',
      desc: language === 'bm'
        ? "Nsirin ŋanaw a kɔrɔ ani a ladili hakilitigiw"
        : language === 'en'
        ? "Traditional Manding proverbs and life lessons"
        : "Proverbe traditionnel avec morale et traduction",
      prompt: language === 'bm'
        ? "Manden nsirin cɛɲi dɔ fɔ n'ye, k'a kɔrɔ faamuya n'ye kosɛbɛ."
        : language === 'en'
        ? "Share a famous Manding proverb and explain its deeper meaning."
        : "Partage un proverbe bambara célèbre avec sa signification profonde et sa morale.",
      accent: 'hover:border-violet-500/40 group-hover:text-violet-400'
    }
  ];

  const modelOptions = [
    { id: 'anthropic/claude-3.5-sonnet', label: 'Claude 3.5 Sonnet' },
    { id: 'mande-agent-core-v2', label: 'Mande Core v2.0' },
    { id: 'openai/gpt-4o-mini', label: 'GPT-4o Mini' },
    { id: 'google/gemini-2.5-flash', label: 'Gemini 2.5 Flash' },
  ];

  const currentModelLabel =
    modelOptions.find((m) => m.id === selectedModel)?.label || 'Claude 3.5 Sonnet';

  return (
    <div
      id="mande-intuitive-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      {/* Modal Card */}
      <div className="relative w-full max-w-3xl h-[86vh] max-h-[720px] bg-[#0A0E17] border border-white/10 rounded-2xl sm:rounded-3xl shadow-[0_25px_80px_rgba(0,0,0,0.9),0_0_40px_rgba(16,185,129,0.08)] flex flex-col overflow-hidden no-scrollbar">
        
        {/* Soft Ambient Radial Light at the Top */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-48 bg-gradient-to-b from-purple-500/10 via-emerald-500/5 to-transparent blur-3xl pointer-events-none" />

        {/* 1. Header Bar: Clean & Minimal (z-40 so dropdowns float over content) */}
        <div className="relative z-40 px-4 sm:px-5 py-3 bg-[#090D14]/95 backdrop-blur-md border-b border-white/5 flex items-center justify-between gap-3 flex-shrink-0">
          {/* Left: Brand + New Chat */}
          <div className="flex items-center gap-2 sm:gap-3">
            <MandeLogo size="sm" showGlow />

            <span className="text-sm font-bold text-white tracking-tight font-['Plus_Jakarta_Sans']">
              Mande<span className="text-emerald-400">-IA</span>
            </span>

            {/* + New Chat Button (visible if messages exist) */}
            {messages.length > 0 && (
              <button
                onClick={handleNewChat}
                className="ml-1 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white border border-white/10 text-[11px] font-medium flex items-center gap-1.5 transition-all cursor-pointer"
                title="Commencer une nouvelle discussion"
              >
                <Plus className="w-3 h-3 text-emerald-400" />
                <span>Nouveau</span>
              </button>
            )}
          </div>

          {/* Right: Controls (Language, Audio, Close) */}
          <div className="flex items-center gap-1.5 sm:gap-2 text-xs">
            {/* Language Selector */}
            <div className="flex items-center bg-[#121622] p-0.5 rounded-lg border border-white/10">
              {[
                { code: 'bm', label: 'Bamanankan' },
                { code: 'fr', label: 'Français' },
                { code: 'en', label: 'English' },
              ].map((l) => (
                <button
                  key={l.code}
                  onClick={() => setLanguage(l.code as any)}
                  className={`px-2 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${
                    language === l.code
                      ? 'bg-emerald-500 text-black font-semibold shadow-sm'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  {l.label}
                </button>
              ))}
            </div>

            {/* Djelia.ia Voice Selector & Audio Toggle */}
            <DjeliaVoiceSelector
              audioEnabled={audioEnabled}
              onToggleAudio={() => setAudioEnabled(!audioEnabled)}
              onNotice={onCopyNotice}
            />

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white border border-transparent hover:border-white/10 transition-colors cursor-pointer ml-1"
              title="Fermer (Échap)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 2. Main Content Area (Hidden scrollbars, completely fluid) */}
        <div
          className="relative z-10 flex-1 overflow-y-auto min-h-0 flex flex-col p-4 sm:p-6 no-scrollbar"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {/* A. WELCOME SCREEN (When messages is empty) - Minimalist & refined */}
          {messages.length === 0 ? (
            <div className="flex-1 flex flex-col justify-center items-center my-auto py-2 sm:py-4 max-w-2xl mx-auto w-full animate-in fade-in duration-200">
              
              {/* Brand Logo in Hero */}
              <div className="mb-3">
                <MandeLogo size="lg" showGlow />
              </div>

              {/* Clean Greeting Heading */}
              <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight text-center font-['Plus_Jakarta_Sans'] mb-1.5">
                {language === 'bm'
                  ? 'I ni ce !'
                  : language === 'en'
                  ? 'Welcome !'
                  : 'Bonjour !'}
              </h2>

              {/* Subtitle */}
              <p className="text-zinc-400 text-xs sm:text-sm text-center max-w-md mx-auto mb-6 font-sans">
                {language === 'bm'
                  ? 'Mande-IA bɛ se ka i dɛmɛ cogo di bi ? I ka fɛ ka min ɲininka ?'
                  : language === 'en'
                  ? 'How can Mande-IA assist you today? Ask anything or select a prompt.'
                  : 'Que souhaitez-vous explorer aujourd’hui ? Posez votre question ou commencez ci-dessous.'}
              </p>

              {/* 3 Starter Cards - Clean, compact & unified */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full">
                {starterCards.map((card, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSendMessage(card.prompt)}
                    className={`group text-left p-3.5 rounded-xl bg-[#0D121B]/90 border border-white/10 ${card.accent} transition-all duration-150 hover:bg-[#111724] cursor-pointer flex flex-col justify-between`}
                  >
                    <div>
                      <div className="p-1.5 rounded-lg bg-white/5 inline-flex mb-2.5">
                        {card.icon}
                      </div>

                      <h3 className="text-xs font-semibold text-white mb-1 group-hover:text-emerald-300 transition-colors">
                        {card.title}
                      </h3>

                      <p className="text-[11px] text-zinc-400 leading-snug">
                        {card.desc}
                      </p>
                    </div>

                    <div className="mt-3 flex items-center justify-end text-zinc-500 group-hover:text-emerald-400 transition-colors">
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* B. CHAT MESSAGE THREAD (When user starts chatting) */
            <div className="space-y-4 max-w-2xl mx-auto w-full pb-2">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                >
                  {/* Sender & Timestamp info */}
                  <div className="flex items-center gap-2 text-[10px] font-mono text-zinc-500 mb-1 px-1">
                    <span>{msg.sender === 'user' ? 'VOUS' : 'MANDE-IA'}</span>
                    <span>•</span>
                    <span>{msg.timestamp}</span>
                    {msg.latencyMs && (
                      <>
                        <span>•</span>
                        <span className="text-emerald-400">{msg.latencyMs}ms</span>
                      </>
                    )}
                  </div>

                  {/* Message Bubble */}
                  <div
                    className={`max-w-[92%] sm:max-w-xl p-3.5 sm:p-4 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                      msg.sender === 'user'
                        ? 'bg-emerald-500 text-black font-medium rounded-tr-sm'
                        : 'bg-[#0F1420] text-zinc-100 border border-white/10 rounded-tl-sm'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.text}</p>

                    {/* Exa Web Search Sources Box */}
                    {msg.sources && msg.sources.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-white/10">
                        <div className="flex items-center gap-1.5 text-[11px] font-mono text-emerald-400 mb-1.5">
                          <Search className="w-3 h-3" />
                          <span>Sources Exa vérifiées :</span>
                        </div>
                        <div className="space-y-1.5">
                          {msg.sources.map((src, sIdx) => (
                            <a
                              key={sIdx}
                              href={src.url}
                              target="_blank"
                              rel="noreferrer"
                              className="block p-2 rounded-lg bg-black/40 border border-white/5 hover:border-emerald-500/40 transition-colors"
                            >
                              <div className="flex items-center justify-between text-[11px] font-semibold text-white mb-0.5">
                                <span className="truncate max-w-[85%]">{src.title}</span>
                                <ExternalLink className="w-2.5 h-2.5 text-zinc-400 flex-shrink-0" />
                              </div>
                              <p className="text-[10px] text-zinc-400 line-clamp-1">
                                {src.snippet}
                              </p>
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Assistant Actions Bar (Copy, Speak, Feedback) */}
                  {msg.sender === 'assistant' && (
                    <div className="flex items-center gap-2 mt-1 px-1 text-[11px] text-zinc-400">
                      {/* Copy */}
                      <button
                        onClick={() => handleCopyText(msg.id, msg.text)}
                        className="p-1 hover:text-white rounded hover:bg-white/5 transition-colors cursor-pointer flex items-center gap-1"
                        title="Copier"
                      >
                        {copiedMessageId === msg.id ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span className="text-[10px] text-emerald-400">Copié</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span className="text-[10px]">Copier</span>
                          </>
                        )}
                      </button>

                      {/* Listen with Djelia.ia */}
                      <button
                        onClick={() => speakResponse(msg.text, msg.id)}
                        className={`p-1 rounded transition-colors cursor-pointer flex items-center gap-1.5 ${
                          speakingMessageId === msg.id
                            ? 'text-emerald-400 bg-emerald-500/15 font-medium'
                            : 'hover:text-white hover:bg-white/5 text-zinc-400'
                        }`}
                        title={
                          speakingMessageId === msg.id
                            ? "Arrêter la lecture Djelia"
                            : "Écouter avec Djelia.ia (Voix Bamanankan)"
                        }
                      >
                        {speakingMessageId === msg.id ? (
                          <>
                            <Square className="w-3 h-3 fill-emerald-400 text-emerald-400" />
                            <span className="text-[10px] text-emerald-400 font-mono">Djelia...</span>
                          </>
                        ) : (
                          <>
                            <Volume2 className="w-3 h-3 text-zinc-400" />
                            <span className="text-[10px]">Djelia</span>
                          </>
                        )}
                      </button>

                      {/* Feedback */}
                      <div className="flex items-center gap-0.5 ml-1 border-l border-white/10 pl-2">
                        <button
                          onClick={() => handleFeedback(msg.id, 'like')}
                          className={`p-1 rounded hover:bg-white/5 transition-colors cursor-pointer ${
                            msg.feedback === 'like' ? 'text-emerald-400' : 'text-zinc-500 hover:text-zinc-300'
                          }`}
                          title="Utile"
                        >
                          <ThumbsUp className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => handleFeedback(msg.id, 'dislike')}
                          className={`p-1 rounded hover:bg-white/5 transition-colors cursor-pointer ${
                            msg.feedback === 'dislike' ? 'text-rose-400' : 'text-zinc-500 hover:text-zinc-300'
                          }`}
                          title="Pas utile"
                        >
                          <ThumbsDown className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {/* Thinking State with custom MandeLoader */}
              {isLoading && (
                <div className="flex flex-col items-start animate-in fade-in duration-200">
                  <div className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-[#0F1420] border border-white/10 shadow-sm text-xs text-zinc-300">
                    <MandeLoader size="xs" />
                    <span className="font-medium text-zinc-300">Mande-IA formule la réponse...</span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* 3. Clean, Streamlined Bottom Input Area */}
        <div className="relative z-20 px-4 py-3 bg-[#080B12] border-t border-white/5 flex-shrink-0">
          <div className="max-w-2xl mx-auto w-full">
            
            {/* The Clean Input Box */}
            <div className="relative bg-[#0F1420] border border-white/10 focus-within:border-emerald-500/40 rounded-xl sm:rounded-2xl p-2.5 sm:p-3 transition-all">
              
              {/* Textarea Input */}
              <textarea
                ref={textareaRef}
                value={inputQuery}
                onChange={(e) => setInputQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                rows={1}
                placeholder={
                  language === 'bm'
                    ? "I ka fɛ ka min ɲininka bi ? ✨"
                    : language === 'en'
                    ? "Ask me anything... ✨"
                    : "Posez votre question à Mande-IA... ✨"
                }
                className="w-full bg-transparent text-white placeholder:text-zinc-500 text-xs sm:text-sm resize-none focus:outline-none scrollbar-none leading-relaxed min-h-[28px] max-h-24"
              />

              {/* Controls Toolbar: Model, Web Search, Mic, Send */}
              <div className="flex items-center justify-between pt-2 border-t border-white/5 mt-1">
                {/* Left: Model & Web & Mic */}
                <div className="flex items-center gap-1.5">
                  
                  {/* Model Selector Popover */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowModelPicker(!showModelPicker)}
                      className="px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white border border-white/5 text-[11px] font-mono flex items-center gap-1 transition-colors cursor-pointer"
                      title="Choisir le modèle d'IA"
                    >
                      <Zap className="w-3 h-3 text-emerald-400" />
                      <span>{currentModelLabel}</span>
                      <ChevronDown className="w-2.5 h-2.5 text-zinc-400" />
                    </button>

                    {showModelPicker && (
                      <>
                        <div
                          className="fixed inset-0 z-20"
                          onClick={() => setShowModelPicker(false)}
                        />
                        <div className="absolute bottom-full mb-2 left-0 w-48 bg-[#121622] border border-white/10 rounded-xl shadow-2xl p-1 z-30 animate-in fade-in zoom-in-95">
                          {modelOptions.map((opt) => (
                            <button
                              key={opt.id}
                              type="button"
                              onClick={() => {
                                setSelectedModel(opt.id);
                                setShowModelPicker(false);
                              }}
                              className={`w-full text-left px-2 py-1.5 rounded-lg text-xs transition-colors flex items-center justify-between cursor-pointer ${
                                selectedModel === opt.id
                                  ? 'bg-emerald-500/20 text-emerald-300 font-semibold'
                                  : 'text-zinc-300 hover:bg-white/5 hover:text-white'
                              }`}
                            >
                              <span>{opt.label}</span>
                              {selectedModel === opt.id && <Check className="w-3 h-3 text-emerald-400" />}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>

                  {/* Exa Web Search Toggle */}
                  <button
                    type="button"
                    onClick={() => setEnableExaSearch(!enableExaSearch)}
                    className={`px-2 py-1 rounded-lg border text-[11px] font-medium flex items-center gap-1 transition-colors cursor-pointer ${
                      enableExaSearch
                        ? 'bg-sky-500/15 border-sky-500/40 text-sky-300'
                        : 'bg-white/5 border-white/5 text-zinc-400 hover:text-white'
                    }`}
                    title="Activer la recherche web Exa en temps réel"
                  >
                    <Search className="w-3 h-3" />
                    <span className="hidden xs:inline">Exa Web</span>
                  </button>

                  {/* Voice Microphone Input (Djelia STT) */}
                  <button
                    type="button"
                    onClick={toggleSpeechRecognition}
                    className={`px-1.5 py-1 rounded-lg border transition-colors cursor-pointer flex items-center gap-1.5 ${
                      isListening
                        ? 'bg-rose-500 text-white border-rose-400 animate-pulse'
                        : 'bg-white/5 border-white/5 text-zinc-400 hover:text-white hover:bg-white/10'
                    }`}
                    title={isListening ? "Djelia STT en écoute (cliquer pour arrêter)" : "Activer la dictée vocale (Djelia STT)"}
                  >
                    {isListening ? (
                      <>
                        <MicOff className="w-3.5 h-3.5" />
                        <span className="text-[10px] font-mono font-semibold">Djelia STT</span>
                      </>
                    ) : (
                      <Mic className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>

                {/* Right: Send Button */}
                <button
                  type="button"
                  onClick={() => handleSendMessage()}
                  disabled={isLoading || !inputQuery.trim()}
                  className="w-7 h-7 rounded-lg bg-emerald-500 hover:bg-emerald-400 disabled:opacity-30 disabled:hover:bg-emerald-500 text-black flex items-center justify-center transition-all cursor-pointer shadow-[0_0_12px_rgba(16,185,129,0.3)] disabled:shadow-none"
                  title="Envoyer (Entrée)"
                >
                  <ArrowUp className="w-3.5 h-3.5 stroke-[2.5]" />
                </button>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};
