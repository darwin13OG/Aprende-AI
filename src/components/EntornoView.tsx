import React, { useState, useRef, useEffect } from 'react';
import { MathMarkdown } from './MathMarkdown.tsx';
import { Entorno, Fuente, ActiveTab, ChatMessage } from '../types.ts';
import {
  Sparkles,
  Paperclip,
  Camera,
  Globe,
  Youtube,
  FileText,
  Image as ImageIcon,
  Trash2,
  Loader2,
  ArrowUp,
  Layers,
  Network,
  AlertCircle,
  Plus,
  BookOpen,
  Edit2,
  Check,
  Mic,
  MicOff,
  Key,
  HelpCircle,
  MessageSquare,
  FolderOpen,
  Bot,
  User,
  ArrowRight,
  ExternalLink,
  Copy,
} from 'lucide-react';

interface EntornoViewProps {
  entorno: Entorno;
  onUpdateEntorno: (updated: Entorno) => void;
  onGenerate: (payload: {
    topic: string;
    promptText: string;
    sources: Fuente[];
  }) => Promise<void>;
  isGenerating: boolean;
  generationError?: string | null;
  quotaExhausted?: boolean;
  userApiKey?: string;
  onSaveApiKey?: (key: string) => void;
  onGoToTab: (tab: ActiveTab) => void;
  onShareItem: (title: string, url: string, type: 'cuestionario' | 'flashcards' | 'mapa' | 'pack') => void;
  onOpenEntornosDrawer: () => void;
}

export const EntornoView: React.FC<EntornoViewProps> = ({
  entorno,
  onUpdateEntorno,
  onGenerate,
  isGenerating,
  generationError,
  quotaExhausted,
  userApiKey = '',
  onSaveApiKey,
  onGoToTab,
  onShareItem,
  onOpenEntornosDrawer,
}) => {
  // Sub-view mode: 'chat' or 'fuentes'
  const [subView, setSubView] = useState<'chat' | 'fuentes'>('chat');

  // Chat message input & state
  const [chatInput, setChatInput] = useState('');
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Sources management states
  const [urlInput, setUrlInput] = useState('');
  const [activeSourceModal, setActiveSourceModal] = useState<'none' | 'web' | 'youtube' | 'texto'>('none');
  const [isExtractingUrl, setIsExtractingUrl] = useState(false);
  const [urlError, setUrlError] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState(userApiKey);
  const [showKeyCard, setShowKeyCard] = useState(false);

  // File inputs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (quotaExhausted) {
      setShowKeyCard(true);
    }
  }, [quotaExhausted]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (subView === 'chat') {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [entorno.chatMessages, subView, isSendingMessage]);

  // Add a file source
  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    const isImage = file.type.startsWith('image/');
    const isPdf = file.type.includes('pdf');

    reader.onload = () => {
      const base64 = reader.result as string;
      const newFuente: Fuente = {
        id: `file-${Date.now()}`,
        nombre: file.name,
        tipo: isPdf ? 'pdf' : isImage ? 'imagen' : 'texto',
        tamano: `${Math.round(file.size / 1024)} KB`,
        base64,
        mimeType: file.type || 'application/octet-stream',
        estado: 'Cargado',
        fecha: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      onUpdateEntorno({
        ...entorno,
        fuentes: [...entorno.fuentes, newFuente],
      });
    };

    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Extract text from Web or YouTube URL
  const handleAddUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim()) return;

    setIsExtractingUrl(true);
    setUrlError(null);

    try {
      const res = await fetch('/api/extract-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: urlInput.trim() }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'No se pudo extraer contenido de la URL.');
      }

      const newFuente: Fuente = {
        id: `url-${Date.now()}`,
        nombre: data.title || urlInput.trim(),
        tipo: data.type === 'youtube' ? 'youtube' : 'web',
        url: data.url || urlInput.trim(),
        extractedText: data.extractedText,
        estado: 'Analizado',
        tamano: data.type === 'youtube' ? 'Video YT' : `${Math.round((data.extractedText?.length || 0) / 1000)} KB texto`,
        fecha: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      onUpdateEntorno({
        ...entorno,
        fuentes: [...entorno.fuentes, newFuente],
      });

      setUrlInput('');
      setActiveSourceModal('none');
    } catch (err: any) {
      setUrlError(err?.message || 'Fallo al procesar el enlace.');
    } finally {
      setIsExtractingUrl(false);
    }
  };

  // Add raw text notes
  const handleAddRawText = (text: string) => {
    if (!text.trim()) return;

    const newFuente: Fuente = {
      id: `text-${Date.now()}`,
      nombre: `Apuntes: ${text.slice(0, 24)}...`,
      tipo: 'texto',
      extractedText: text,
      estado: 'Analizado',
      tamano: `${Math.round(text.length / 1000)} KB`,
      fecha: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    onUpdateEntorno({
      ...entorno,
      fuentes: [...entorno.fuentes, newFuente],
    });
    setActiveSourceModal('none');
  };

  // Remove source
  const handleRemoveFuente = (id: string) => {
    onUpdateEntorno({
      ...entorno,
      fuentes: entorno.fuentes.filter((f) => f.id !== id),
    });
  };

  // Trigger Gemini Multimodal Generation of Quiz, Cards, Map
  const handleTriggerGenerate = async () => {
    if (isGenerating) return;
    const effectiveTopic = entorno.experience?.tema || entorno.nombre || 'Tema de Estudio';

    await onGenerate({
      topic: effectiveTopic,
      promptText: 'Genera el paquete pedagógico completo basado en las fuentes del entorno.',
      sources: entorno.fuentes,
    });
  };

  // Send message to the interactive chat grounded in sources
  const handleSendMessage = async (textToSend?: string) => {
    const messageContent = (textToSend || chatInput).trim();
    if (!messageContent || isSendingMessage) return;

    setChatError(null);
    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: messageContent,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const currentMessages = entorno.chatMessages || [];
    const updatedMessages = [...currentMessages, userMsg];

    // Optimistically add user message
    onUpdateEntorno({
      ...entorno,
      chatMessages: updatedMessages,
    });

    setChatInput('');
    setIsSendingMessage(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(userApiKey ? { 'x-gemini-api-key': userApiKey } : {}),
        },
        body: JSON.stringify({
          message: messageContent,
          history: currentMessages.slice(-6).map((m) => ({ role: m.role, content: m.content })),
          sources: entorno.fuentes,
          topic: entorno.experience?.tema || entorno.nombre,
          userApiKey,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        if (data.quotaExhausted) {
          setShowKeyCard(true);
        }
        throw new Error(data.message || 'Error al comunicarse con el tutor de IA.');
      }

      const assistantMsg: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        role: 'assistant',
        content: data.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        sourcesCited: data.sourcesCited || [],
      };

      onUpdateEntorno({
        ...entorno,
        chatMessages: [...updatedMessages, assistantMsg],
      });
    } catch (err: any) {
      console.error('Chat error:', err);
      setChatError(err?.message || 'No se pudo obtener respuesta.');
      // Add error notification message in chat
      const errorMsg: ChatMessage = {
        id: `msg-err-${Date.now()}`,
        role: 'assistant',
        content: `⚠️ Hubo un inconveniente al responder: ${err?.message || 'Error de conexión'}. Por favor intenta de nuevo.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      onUpdateEntorno({
        ...entorno,
        chatMessages: [...updatedMessages, errorMsg],
      });
    } finally {
      setIsSendingMessage(false);
    }
  };

  // Web Speech API Voice Dictation
  const handleToggleVoice = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('El reconocimiento de voz no está disponible en este navegador.');
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.lang = 'es-ES';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onerror = () => setIsListening(false);

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setChatInput((prev) => (prev ? `${prev} ${transcript}` : transcript));
      };

      recognition.start();
    } catch (e) {
      console.error('Speech recognition error:', e);
      setIsListening(false);
    }
  };

  const handleCopyMessage = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMessageId(id);
    setTimeout(() => setCopiedMessageId(null), 1500);
  };

  const messages = entorno.chatMessages || [];

  return (
    <div className="w-full max-w-3xl mx-auto px-3 sm:px-4 pt-3 sm:pt-4 pb-28 space-y-3 sm:space-y-4">
      {/* Hidden File Inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,application/pdf,text/*"
        className="hidden"
        onChange={handleFileSelected}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileSelected}
      />

      {/* Desktop Entorno Header (Preserved for PC where it looks great) */}
      <div className="hidden sm:flex items-center justify-between gap-2.5 px-4 py-2.5 rounded-2xl bg-white/70 dark:bg-[#0c1424]/70 backdrop-blur-md border border-slate-200/80 dark:border-cyan-500/20 shadow-sm">
        {/* Entorno Title (Read-only; editing is done only in drawer) */}
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-2 h-2 rounded-full bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.8)] flex-shrink-0" />
          <h2 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white tracking-tight truncate">
            {entorno.nombre}
          </h2>
        </div>

        {/* Sleek Segmented Switcher for Chat vs Fuentes */}
        <div className="flex items-center bg-slate-100 dark:bg-[#070d1a] p-1 rounded-2xl border border-slate-200 dark:border-cyan-500/25 flex-shrink-0">
          <button
            type="button"
            onClick={() => setSubView('chat')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95 ${
              subView === 'chat'
                ? 'bg-white dark:bg-[#111c33] text-blue-600 dark:text-cyan-400 shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
            title="Ver chat con fuentes"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Chat</span>
            {messages.length > 0 && (
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 dark:bg-cyan-400 inline-block" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setSubView('fuentes')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95 ${
              subView === 'fuentes'
                ? 'bg-white dark:bg-[#111c33] text-blue-600 dark:text-cyan-400 shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
            title="Gestionar fuentes"
          >
            <FolderOpen className="w-3.5 h-3.5" />
            <span>Fuentes</span>
            <span className="px-1.5 py-0.2 rounded-full bg-slate-200 dark:bg-slate-800 text-[10px] font-extrabold text-slate-700 dark:text-cyan-300">
              {entorno.fuentes.length}
            </span>
          </button>
        </div>
      </div>

      {/* Mobile Native Ergonomic Segment Control (Compact, avoids generic duplicate box) */}
      <div className="flex sm:hidden items-center justify-between p-1 rounded-2xl bg-slate-200/70 dark:bg-[#0c1424] border border-slate-300/50 dark:border-cyan-500/20 shadow-sm">
        <button
          type="button"
          onClick={() => setSubView('chat')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 ${
            subView === 'chat'
              ? 'bg-white dark:bg-cyan-500/20 text-blue-600 dark:text-cyan-300 shadow-sm border border-slate-200/80 dark:border-cyan-500/30'
              : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>Chat</span>
          {messages.length > 0 && (
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 dark:bg-cyan-400 inline-block" />
          )}
        </button>

        <button
          type="button"
          onClick={() => setSubView('fuentes')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 ${
            subView === 'fuentes'
              ? 'bg-white dark:bg-cyan-500/20 text-blue-600 dark:text-cyan-300 shadow-sm border border-slate-200/80 dark:border-cyan-500/30'
              : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          <FolderOpen className="w-4 h-4" />
          <span>Fuentes</span>
          <span className="px-1.5 py-0.2 rounded-full bg-slate-100 dark:bg-[#070d1a] text-[10px] font-extrabold text-blue-600 dark:text-cyan-300">
            {entorno.fuentes.length}
          </span>
        </button>
      </div>

      {/* Model Quota Exhausted Alert / API Key Input Card */}
      {(quotaExhausted || showKeyCard) && (
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-500/40 space-y-3 animate-fadeIn">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-amber-200 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300 flex-shrink-0">
              <Key className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h3 className="text-xs font-bold text-amber-900 dark:text-amber-200 uppercase tracking-wider">
                Modelos Saturados • Clave de API Personal Requerida
              </h3>
              <p className="text-xs text-amber-800 dark:text-amber-300/90 leading-relaxed">
                Los modelos compartidos alcanzaron el límite de cuota. Introduce tu clave gratuita de Google AI Studio para continuar sin interrupción:
              </p>
            </div>
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              onSaveApiKey?.(apiKeyInput.trim());
              setShowKeyCard(false);
            }}
            className="flex items-center gap-2 pt-1"
          >
            <input
              type="password"
              placeholder="Pega aquí tu Gemini API Key (AIzaSy...)"
              value={apiKeyInput}
              onChange={(e) => setApiKeyInput(e.target.value)}
              className="flex-1 px-3 py-2 rounded-xl bg-white dark:bg-[#070d1a] border border-amber-300 dark:border-amber-500/40 text-xs text-slate-900 dark:text-white focus:outline-none"
              required
            />
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs transition active:scale-95 flex-shrink-0 shadow-sm"
            >
              Guardar y Usar
            </button>
          </form>
        </div>
      )}

      {/* Quick Banner to jump to generated study modules if ready */}
      {entorno.hasGenerated && entorno.experience && (
        <div className="rounded-2xl bg-white dark:bg-[#0d1526] border border-emerald-500/30 p-3.5 flex items-center justify-between shadow-sm animate-fadeIn">
          <div className="flex items-center gap-2 truncate">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" />
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
              Material generado: <span className="text-emerald-600 dark:text-emerald-400">{entorno.experience.tema}</span>
            </span>
          </div>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button
              onClick={() => onGoToTab('quiz')}
              className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-[#121d33] border border-blue-200 dark:border-cyan-500/30 text-[11px] font-bold text-blue-600 dark:text-cyan-400 hover:border-blue-400 transition"
              title="Ir al Cuestionario"
            >
              Quiz ({entorno.experience.quiz.length})
            </button>
            <button
              onClick={() => onGoToTab('cards')}
              className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-[#121d33] border border-blue-200 dark:border-cyan-500/30 text-[11px] font-bold text-blue-600 dark:text-cyan-400 hover:border-blue-400 transition"
              title="Ir a las Flashcards"
            >
              Cards ({entorno.experience.flashcards.length})
            </button>
            <button
              onClick={() => onGoToTab('map')}
              className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-[#121d33] border border-blue-200 dark:border-cyan-500/30 text-[11px] font-bold text-blue-600 dark:text-cyan-400 hover:border-blue-400 transition"
              title="Ir al Mapa Mental"
            >
              Mapa
            </button>
          </div>
        </div>
      )}

      {/* VIEW 1: CHAT CON LAS FUENTES */}
      {subView === 'chat' && (
        <div className="space-y-3 sm:space-y-4 animate-fadeIn">
          {/* Chat Messages Scrollable Box */}
          <div className="min-h-[320px] sm:min-h-[380px] max-h-[calc(100dvh-300px)] sm:max-h-[560px] overflow-y-auto space-y-3.5 p-3 sm:p-4 rounded-2xl sm:rounded-3xl bg-white dark:bg-[#0c1424] border border-slate-200 dark:border-cyan-500/20 shadow-sm no-scrollbar">
            {/* If no messages: Welcome & Suggestion Chips */}
            {messages.length === 0 && (
              <div className="text-center py-8 space-y-4 animate-fadeIn">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/70 border border-blue-200 dark:border-cyan-500/30 text-blue-600 dark:text-cyan-400 flex items-center justify-center mx-auto shadow-sm">
                  <Bot className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                    Tutor Interactivo de Fuentes
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
                    {entorno.fuentes.length > 0
                      ? `Tienes ${entorno.fuentes.length} fuentes cargadas en este entorno. Pregúntale a la IA cualquier duda sobre tus materiales o pídela sintetizar conceptos.`
                      : 'Puedes conversar libremente o subir documentos, PDFs, fotos o enlaces en la sección de Fuentes para que la IA responda citando tus apuntes.'}
                  </p>
                </div>

                {/* Quick suggestions */}
                <div className="pt-2 flex flex-wrap justify-center gap-2 max-w-lg mx-auto">
                  <button
                    type="button"
                    onClick={() => handleSendMessage('¿Cuáles son los puntos clave y conceptos principales de las fuentes?')}
                    className="px-3 py-1.5 rounded-full bg-slate-100 dark:bg-[#111c33] hover:bg-blue-50 dark:hover:bg-cyan-950/60 border border-slate-200 dark:border-cyan-500/20 text-xs font-semibold text-slate-700 dark:text-slate-200 transition text-left"
                  >
                    💡 ¿Cuáles son los puntos clave?
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSendMessage('Hazme un resumen ejecutivo y didáctico con ejemplos prácticos')}
                    className="px-3 py-1.5 rounded-full bg-slate-100 dark:bg-[#111c33] hover:bg-blue-50 dark:hover:bg-cyan-950/60 border border-slate-200 dark:border-cyan-500/20 text-xs font-semibold text-slate-700 dark:text-slate-200 transition text-left"
                  >
                    📝 Resumen didáctico con ejemplos
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSendMessage('Explícame los conceptos más complejos o difíciles paso a paso')}
                    className="px-3 py-1.5 rounded-full bg-slate-100 dark:bg-[#111c33] hover:bg-blue-50 dark:hover:bg-cyan-950/60 border border-slate-200 dark:border-cyan-500/20 text-xs font-semibold text-slate-700 dark:text-slate-200 transition text-left"
                  >
                    🧠 Conceptos difíciles explicados fácil
                  </button>
                </div>
              </div>
            )}

            {/* Conversation Messages */}
            {messages.map((msg) => {
              const isUser = msg.role === 'user';
              return (
                <div
                  key={msg.id}
                  className={`flex items-start gap-2.5 ${isUser ? 'justify-end' : 'justify-start'} animate-fadeIn`}
                >
                  {!isUser && (
                    <div className="w-8 h-8 rounded-xl bg-blue-600 dark:bg-cyan-500 text-white flex items-center justify-center flex-shrink-0 shadow-sm mt-0.5">
                      <Sparkles className="w-4 h-4" />
                    </div>
                  )}

                  <div
                    className={`max-w-[85%] rounded-2xl p-3.5 space-y-1.5 shadow-sm text-left ${
                      isUser
                        ? 'bg-blue-600 text-white rounded-tr-none'
                        : 'bg-slate-50 dark:bg-[#111c33] text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-cyan-500/20 rounded-tl-none'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-4 text-[10px] opacity-75">
                      <span className="font-bold">{isUser ? 'Tú' : 'Aprende AI'}</span>
                      <div className="flex items-center gap-1.5">
                        {msg.timestamp && <span>{msg.timestamp}</span>}
                        {!isUser && (
                          <button
                            type="button"
                            onClick={() => handleCopyMessage(msg.id, msg.content)}
                            className="hover:text-blue-500 transition ml-1"
                            title="Copiar respuesta"
                          >
                            {copiedMessageId === msg.id ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Body */}
                    {isUser ? (
                      <p className="text-xs sm:text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                    ) : (
                      <MathMarkdown content={msg.content} />
                    )}

                    {/* Sources cited footer */}
                    {!isUser && msg.sourcesCited && msg.sourcesCited.length > 0 && (
                      <div className="pt-2 mt-2 border-t border-slate-200/60 dark:border-slate-800 flex flex-wrap items-center gap-1.5">
                        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">
                          Fuentes consultadas:
                        </span>
                        {msg.sourcesCited.map((sName, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded-md bg-blue-50 dark:bg-[#070d1a] text-[10px] font-semibold text-blue-600 dark:text-cyan-300 border border-blue-200 dark:border-cyan-500/20 truncate max-w-[160px]"
                          >
                            {sName}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {isUser && (
                    <div className="w-8 h-8 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <User className="w-4 h-4" />
                    </div>
                  )}
                </div>
              );
            })}

            {/* Thinking indicator */}
            {isSendingMessage && (
              <div className="flex items-start gap-2.5 justify-start animate-fadeIn">
                <div className="w-8 h-8 rounded-xl bg-blue-600 dark:bg-cyan-500 text-white flex items-center justify-center flex-shrink-0 shadow-sm mt-0.5">
                  <Sparkles className="w-4 h-4 animate-spin" />
                </div>
                <div className="p-3.5 rounded-2xl rounded-tl-none bg-slate-50 dark:bg-[#111c33] border border-slate-200 dark:border-cyan-500/20 flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
                  <Loader2 className="w-4 h-4 animate-spin text-blue-600 dark:text-cyan-400" />
                  <span>Consultando tus fuentes y sintetizando respuesta...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick CTA to generate Quiz/Cards/Map right from chat */}
          {entorno.fuentes.length > 0 && (
            <div className="p-3 rounded-2xl bg-gradient-to-r from-blue-50 via-cyan-50 to-indigo-50 dark:from-[#0d172a] dark:via-[#09152b] dark:to-[#0d172a] border border-blue-200 dark:border-cyan-500/30 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 shadow-sm">
              <div className="flex items-center gap-2 truncate">
                <Sparkles className="w-4 h-4 text-blue-600 dark:text-cyan-400 flex-shrink-0" />
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                  ¿Quieres practicar y evaluar lo aprendido?
                </span>
              </div>
              <button
                type="button"
                onClick={handleTriggerGenerate}
                disabled={isGenerating}
                className="w-full sm:w-auto px-3.5 py-2 sm:py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold transition active:scale-95 shadow-sm flex items-center justify-center gap-1.5 flex-shrink-0"
              >
                {isGenerating ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <>
                    <span>⚡ Generar Cuestionario y Tarjetas</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* Chat Sticky Bottom Input Bar (Always accessible to thumb above navigation bar) */}
          <div className="sticky bottom-[60px] sm:bottom-[68px] z-30 pt-1 pb-1">
            <div className="relative rounded-2xl sm:rounded-3xl bg-white/95 dark:bg-[#0c1424]/95 backdrop-blur-md border border-slate-200 dark:border-cyan-500/25 shadow-lg dark:shadow-[0_10px_35px_rgba(0,0,0,0.5)] p-1.5 sm:p-2 flex items-center gap-1 sm:gap-2">
              {/* Paperclip Button -> quick attach to sources */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-2 sm:p-2.5 rounded-xl text-slate-400 hover:text-blue-600 dark:hover:text-cyan-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition flex-shrink-0 active:scale-95"
                title="Adjuntar PDF o imagen a las fuentes"
                aria-label="Adjuntar archivo a las fuentes"
              >
                <Paperclip className="w-5 h-5" />
              </button>

              {/* Chat Text Input */}
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder={
                  entorno.fuentes.length > 0
                    ? 'Pregunta algo sobre tus fuentes o conceptos...'
                    : 'Escribe tu duda o sube fuentes para responder...'
                }
                className="flex-1 bg-transparent border-none text-xs sm:text-sm font-medium text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none px-1 py-1"
              />

              {/* Voice Dictation Mic Button */}
              <button
                type="button"
                onClick={handleToggleVoice}
                className={`p-2 sm:p-2.5 rounded-xl transition flex-shrink-0 active:scale-95 ${
                  isListening
                    ? 'bg-red-500 text-white animate-pulse'
                    : 'text-slate-400 hover:text-blue-600 dark:hover:text-cyan-400 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                }`}
                title={isListening ? 'Detener dictado' : 'Dictar por voz'}
                aria-label="Dictar por voz"
              >
                {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>

              {/* Send Button */}
              <button
                type="button"
                onClick={() => handleSendMessage()}
                disabled={isSendingMessage || !chatInput.trim()}
                className="w-10 h-10 rounded-xl sm:rounded-2xl bg-blue-600 hover:bg-blue-500 disabled:opacity-30 disabled:pointer-events-none text-white flex items-center justify-center transition active:scale-95 flex-shrink-0 shadow-md shadow-blue-600/30"
                title="Enviar mensaje"
                aria-label="Enviar mensaje al chat"
              >
                {isSendingMessage ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <ArrowUp className="w-5 h-5 stroke-[2.5]" />
                )}
              </button>
            </div>

            <div className="flex items-center justify-between px-2 pt-1.5 text-[10px] sm:text-[11px] text-slate-400 dark:text-slate-500">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className={`w-1.5 h-1.5 rounded-full ${entorno.fuentes.length > 0 ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                <span>
                  {entorno.fuentes.length === 0
                    ? 'Sin fuentes'
                    : `${entorno.fuentes.length} ${entorno.fuentes.length === 1 ? 'fuente' : 'fuentes'}`}
                </span>
                <button
                  type="button"
                  onClick={() => setSubView('fuentes')}
                  className="text-blue-600 dark:text-cyan-400 hover:underline font-semibold ml-0.5 inline-flex items-center gap-0.5"
                  title="Administrar las fuentes de este entorno"
                >
                  <span>• Fuentes</span>
                  <ArrowRight className="w-2.5 h-2.5" />
                </button>
              </div>
              <span className="hidden sm:inline">Enter ↵ para enviar</span>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: GESTIÓN DE FUENTES */}
      {subView === 'fuentes' && (
        <div className="space-y-4 animate-fadeIn">
          {/* Fuentes Card */}
          <div className="relative rounded-3xl bg-white dark:bg-[#0d1526] border border-slate-200 dark:border-cyan-500/20 shadow-md dark:shadow-[0_10px_35px_rgba(0,0,0,0.35)] overflow-hidden transition-all">
            <div className="h-0.5 w-full bg-gradient-to-r from-blue-600 via-cyan-400 to-blue-600" />

            <div className="p-5 sm:p-6 space-y-4 text-left">
              {/* Card Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/70 border border-blue-200 dark:border-cyan-500/30 flex items-center justify-center text-blue-600 dark:text-cyan-400">
                    <FolderOpen className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
                      Fuentes de estudio
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Sube, quita o añade materiales. El chat y las actividades responderán con base en ellas.
                    </p>
                  </div>
                </div>

                <span className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-[11px] font-bold text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                  {entorno.fuentes.length} {entorno.fuentes.length === 1 ? 'fuente' : 'fuentes'}
                </span>
              </div>

              {/* 2x2 Action Buttons Grid */}
              <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
                {/* 1. PDF / Guías */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#111c33] border border-slate-200 dark:border-cyan-500/15 hover:border-blue-500 dark:hover:border-cyan-400/50 flex items-center gap-3 transition-all active:scale-[0.98] group"
                >
                  <div className="w-9 h-9 rounded-xl bg-red-100 dark:bg-red-950/50 text-red-600 dark:text-red-400 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-bold text-xs text-slate-900 dark:text-white block">
                      PDF / Guías
                    </span>
                    <span className="text-[10px] text-slate-400">Subir documentos</span>
                  </div>
                </button>

                {/* 2. Foto / Pizarra */}
                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#111c33] border border-slate-200 dark:border-cyan-500/15 hover:border-blue-500 dark:hover:border-cyan-400/50 flex items-center gap-3 transition-all active:scale-[0.98] group"
                >
                  <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition">
                    <Camera className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-bold text-xs text-slate-900 dark:text-white block">
                      Foto / Pizarra
                    </span>
                    <span className="text-[10px] text-slate-400">Cámara u OCR</span>
                  </div>
                </button>

                {/* 3. Enlace / Web */}
                <button
                  type="button"
                  onClick={() => setActiveSourceModal('web')}
                  className={`p-3.5 rounded-2xl border transition-all active:scale-[0.98] flex items-center gap-3 ${
                    activeSourceModal === 'web'
                      ? 'bg-blue-50 dark:bg-cyan-950/60 border-blue-500 dark:border-cyan-400'
                      : 'bg-slate-50 dark:bg-[#111c33] border-slate-200 dark:border-cyan-500/15 hover:border-blue-500 dark:hover:border-cyan-400/50'
                  }`}
                >
                  <div className="w-9 h-9 rounded-xl bg-cyan-100 dark:bg-cyan-950/50 text-cyan-600 dark:text-cyan-400 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition">
                    <Globe className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-bold text-xs text-slate-900 dark:text-white block">
                      Enlace / Web
                    </span>
                    <span className="text-[10px] text-slate-400">Páginas o YouTube</span>
                  </div>
                </button>

                {/* 4. Pegar texto */}
                <button
                  type="button"
                  onClick={() => setActiveSourceModal('texto')}
                  className={`p-3.5 rounded-2xl border transition-all active:scale-[0.98] flex items-center gap-3 ${
                    activeSourceModal === 'texto'
                      ? 'bg-blue-50 dark:bg-cyan-950/60 border-blue-500 dark:border-cyan-400'
                      : 'bg-slate-50 dark:bg-[#111c33] border-slate-200 dark:border-cyan-500/15 hover:border-blue-500 dark:hover:border-cyan-400/50'
                  }`}
                >
                  <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-bold text-xs text-slate-900 dark:text-white block">
                      Pegar texto
                    </span>
                    <span className="text-[10px] text-slate-400">Apuntes o notas</span>
                  </div>
                </button>
              </div>

              {/* URL modal input */}
              {activeSourceModal === 'web' && (
                <form onSubmit={handleAddUrl} className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#070d1a] border border-blue-200 dark:border-cyan-500/30 space-y-2 animate-fadeIn">
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Pega la URL de una página web o video de YouTube:
                  </p>
                  <div className="flex items-center gap-2">
                    <input
                      type="url"
                      value={urlInput}
                      onChange={(e) => setUrlInput(e.target.value)}
                      placeholder="https://... o enlace de YouTube"
                      required
                      className="flex-1 px-3 py-2 rounded-xl bg-white dark:bg-[#0d172a] border border-slate-300 dark:border-cyan-500/30 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-cyan-400"
                    />
                    <button
                      type="submit"
                      disabled={isExtractingUrl}
                      className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 transition disabled:opacity-50"
                    >
                      {isExtractingUrl ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <>
                          <Plus className="w-3.5 h-3.5" />
                          <span>Extraer</span>
                        </>
                      )}
                    </button>
                  </div>
                  {urlError && <p className="text-[11px] text-red-500">{urlError}</p>}
                </form>
              )}

              {/* Text notes input */}
              {activeSourceModal === 'texto' && (
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#070d1a] border border-blue-200 dark:border-cyan-500/30 space-y-2 animate-fadeIn">
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Pega tus apuntes de clase, notas o resumen:
                  </p>
                  <textarea
                    rows={3}
                    id="entorno-notes-input"
                    placeholder="Pega aquí el contenido..."
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#0d172a] border border-slate-300 dark:border-cyan-500/30 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-cyan-400"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveSourceModal('none')}
                      className="px-3 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-900"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const el = document.getElementById('entorno-notes-input') as HTMLTextAreaElement;
                        if (el && el.value) {
                          handleAddRawText(el.value);
                          el.value = '';
                        }
                      }}
                      className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition"
                    >
                      Agregar Apuntes
                    </button>
                  </div>
                </div>
              )}

              {/* Drag and Drop Zone */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="p-3.5 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700/80 bg-slate-50/70 dark:bg-[#09101f] text-center cursor-pointer hover:border-cyan-400 transition group"
              >
                <div className="flex items-center justify-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-300">
                  <span className="w-2 h-2 rounded-full bg-blue-500 dark:bg-cyan-400 animate-ping inline-block" />
                  <span>Arrastra archivos aquí o haz clic para subir</span>
                </div>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                  PDF, JPG, PNG o apuntes de texto hasta 50MB
                </p>
              </div>

              {/* Active Sources List with Delete / Quitar */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                    Fuentes Cargadas ({entorno.fuentes.length})
                  </span>
                  {entorno.fuentes.length > 0 && (
                    <span className="text-[11px] text-slate-400">
                      Puedes eliminar las que ya no necesites
                    </span>
                  )}
                </div>

                {entorno.fuentes.length === 0 ? (
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#070d1a] border border-dashed border-slate-200 dark:border-slate-800 text-center text-xs text-slate-400">
                    No has subido ninguna fuente aún. Añade documentos o enlaces arriba para que el chat responda con ellos.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto pr-1 custom-scrollbar">
                    {entorno.fuentes.map((f) => (
                      <div
                        key={f.id}
                        className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-[#070d1a] border border-slate-200 dark:border-cyan-500/20 text-xs text-slate-800 dark:text-slate-200 hover:border-slate-300 dark:hover:border-cyan-500/40 transition"
                      >
                        <div className="flex items-center gap-2.5 truncate">
                          <div className="p-2 rounded-xl bg-white dark:bg-[#111c33] border border-slate-200 dark:border-slate-800 flex-shrink-0">
                            {f.tipo === 'youtube' ? (
                              <Youtube className="w-4 h-4 text-red-500" />
                            ) : f.tipo === 'web' ? (
                              <Globe className="w-4 h-4 text-cyan-500" />
                            ) : f.tipo === 'pdf' ? (
                              <FileText className="w-4 h-4 text-red-500" />
                            ) : f.tipo === 'imagen' ? (
                              <ImageIcon className="w-4 h-4 text-emerald-500" />
                            ) : (
                              <BookOpen className="w-4 h-4 text-blue-500" />
                            )}
                          </div>
                          <div className="truncate">
                            <span className="font-bold text-slate-900 dark:text-white block truncate">
                              {f.nombre}
                            </span>
                            <div className="flex items-center gap-2 text-[10px] text-slate-400">
                              <span>{f.tipo.toUpperCase()}</span>
                              {f.tamano && <span>• {f.tamano}</span>}
                              {f.estado && <span className="text-emerald-500">• {f.estado}</span>}
                            </div>
                          </div>
                        </div>

                        {/* Quitar fuente button */}
                        <button
                          type="button"
                          onClick={() => handleRemoveFuente(f.id)}
                          className="p-2 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition ml-2 flex-shrink-0"
                          title="Eliminar esta fuente"
                          aria-label={`Eliminar fuente ${f.nombre}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Bottom Actions inside Fuentes */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setSubView('chat')}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-[#111c33] hover:bg-slate-200 dark:hover:bg-[#162544] text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center justify-center gap-2 transition"
                >
                  <MessageSquare className="w-4 h-4 text-blue-600 dark:text-cyan-400" />
                  <span>Chatear con estas Fuentes</span>
                </button>

                <button
                  type="button"
                  onClick={handleTriggerGenerate}
                  disabled={isGenerating || entorno.fuentes.length === 0}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white text-xs font-bold shadow-md shadow-blue-600/30 flex items-center justify-center gap-2 transition active:scale-95"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Generando Síntesis...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>⚡ Generar Material de Estudio</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {generationError && (
        <div className="flex items-center gap-2 p-3 rounded-2xl bg-red-50 dark:bg-red-950/60 border border-red-300 dark:border-red-500/30 text-red-700 dark:text-red-300 text-xs text-left">
          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
          <span>{generationError}</span>
        </div>
      )}
    </div>
  );
};
