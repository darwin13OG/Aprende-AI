import React, { useState, useEffect } from 'react';
import {
  X,
  Copy,
  Check,
  Share2,
  ExternalLink,
  Layers,
  HelpCircle,
  Network,
  Package,
  ShieldCheck,
  User,
  Youtube,
  Instagram,
  Globe,
} from 'lucide-react';
import { LearningExperience } from '../types.ts';
import {
  ShareType,
  buildSanitizedSharePayload,
  generateShareUrl,
  formatSocialUrl,
} from '../utils/shareUtils.ts';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  experience?: LearningExperience;
  initialType?: ShareType;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  experience,
  initialType = 'all',
}) => {
  const [selectedType, setSelectedType] = useState<ShareType>(initialType);
  const [creatorHandle, setCreatorHandle] = useState<string>(() => {
    return (
      localStorage.getItem('aprende_creator_handle') ||
      experience?.autor ||
      '@estudiante'
    );
  });
  const [socialPlatform, setSocialPlatform] = useState<string>(() => {
    return localStorage.getItem('aprende_creator_social_platform') || 'YouTube';
  });
  const [socialHandle, setSocialHandle] = useState<string>(() => {
    return (
      localStorage.getItem('aprende_creator_social_handle') ||
      localStorage.getItem('aprende_creator_handle') ||
      '@canal'
    );
  });
  const [copied, setCopied] = useState(false);
  const [generatedUrl, setGeneratedUrl] = useState('');

  // Update selected type when opened with initialType
  useEffect(() => {
    if (initialType) {
      setSelectedType(initialType);
    }
  }, [initialType, isOpen]);

  // Generate URL whenever experience, selectedType, creatorHandle, socialPlatform or socialHandle changes
  useEffect(() => {
    if (!experience) return;

    try {
      localStorage.setItem('aprende_creator_handle', creatorHandle);
      localStorage.setItem('aprende_creator_social_platform', socialPlatform);
      localStorage.setItem('aprende_creator_social_handle', socialHandle);
    } catch {}

    const payload = buildSanitizedSharePayload(
      experience,
      selectedType,
      creatorHandle,
      socialPlatform,
      socialHandle
    );
    const domain = 'https://aprende-ai.pages.dev';
    const url = generateShareUrl(payload, domain);
    setGeneratedUrl(url);
  }, [experience, selectedType, creatorHandle, socialPlatform, socialHandle]);

  if (!isOpen || !experience) return null;

  const previewRedirectUrl = formatSocialUrl(socialPlatform, socialHandle);

  const handleCopy = () => {
    if (!generatedUrl) return;
    navigator.clipboard.writeText(generatedUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleOpenPreview = () => {
    if (!generatedUrl) return;
    // Replace domain with local origin if testing in dev preview
    const targetUrl = generatedUrl.replace('https://aprende-ai.pages.dev', window.location.origin);
    window.open(targetUrl, '_blank');
  };

  const shareOptions: Array<{
    type: ShareType;
    label: string;
    description: string;
    icon: React.ReactNode;
    count: string;
  }> = [
    {
      type: 'all',
      label: 'Todo el Paquete',
      description: 'Cuestionario, Flashcards y Mapa Mental juntos',
      icon: <Package className="w-4 h-4" />,
      count: 'Todo',
    },
    {
      type: 'quiz',
      label: 'Solo Cuestionario',
      description: 'Preguntas interactivas con retroalimentación',
      icon: <HelpCircle className="w-4 h-4" />,
      count: `${experience.quiz?.length || 0} preguntas`,
    },
    {
      type: 'cards',
      label: 'Solo Flashcards',
      description: 'Tarjetas con volteo y autoevaluación',
      icon: <Layers className="w-4 h-4" />,
      count: `${experience.flashcards?.length || 0} tarjetas`,
    },
    {
      type: 'map',
      label: 'Solo Mapa Mental',
      description: 'Árbol conceptual interactivo con zoom',
      icon: <Network className="w-4 h-4" />,
      count: `${experience.mindmap?.subnodos?.length || 0} ramas`,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-lg rounded-3xl bg-white dark:bg-[#0b1528] border border-slate-200 dark:border-cyan-500/30 p-6 sm:p-7 shadow-2xl text-slate-900 dark:text-slate-100">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-full text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          aria-label="Cerrar modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-start gap-3 mb-4 text-left">
          <div className="p-2.5 rounded-2xl bg-blue-50 dark:bg-cyan-950/60 border border-blue-200 dark:border-cyan-500/40 text-blue-600 dark:text-cyan-400">
            <Share2 className="w-5 h-5" />
          </div>
          <div className="space-y-0.5">
            <span className="text-[11px] font-bold text-blue-600 dark:text-cyan-400 uppercase tracking-wider block">
              Compartir Material de Estudio
            </span>
            <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white leading-tight">
              {experience.tema}
            </h3>
          </div>
        </div>

        {/* Privacy Assurance Banner matching user request strictly */}
        <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-500/30 flex items-center gap-2.5 text-xs text-emerald-800 dark:text-emerald-300 text-left mb-4">
          <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
          <p className="leading-snug">
            <strong>Privacidad garantizada:</strong> El destinatario solo verá el contenido de estudio seleccionado. <strong>Nunca se comparte el chat ni tus archivos/fuentes originales.</strong>
          </p>
        </div>

        {/* Selector: ¿Qué deseas compartir? */}
        <div className="space-y-2 text-left mb-4">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
            Elige qué compartir:
          </label>
          <div className="grid grid-cols-2 gap-2">
            {shareOptions.map((opt) => {
              const isSelected = selectedType === opt.type;
              return (
                <button
                  key={opt.type}
                  type="button"
                  onClick={() => setSelectedType(opt.type)}
                  className={`p-3 rounded-2xl border text-left transition-all active:scale-[0.98] ${
                    isSelected
                      ? 'bg-blue-50 dark:bg-cyan-950/60 border-blue-600 dark:border-cyan-400 shadow-sm'
                      : 'bg-slate-50 dark:bg-[#070d1a] border-slate-200 dark:border-slate-800 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`p-1.5 rounded-lg ${
                        isSelected
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {opt.icon}
                    </span>
                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                      {opt.count}
                    </span>
                  </div>
                  <span className="text-xs font-bold text-slate-900 dark:text-white block">
                    {opt.label}
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-1">
                    {opt.description}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Creator Username Field (@user_name) */}
        <div className="space-y-1.5 text-left mb-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-blue-600 dark:text-cyan-400" />
              <span>Tu usuario de creador:</span>
            </label>
            <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
              Visible para los destinatarios
            </span>
          </div>
          <div className="relative">
            <input
              type="text"
              value={creatorHandle}
              onChange={(e) => {
                const val = e.target.value;
                const formatted = val.startsWith('@') ? val : val ? `@${val}` : '@';
                setCreatorHandle(formatted);
              }}
              placeholder="@tu_usuario"
              className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-[#070d1a] border border-slate-300 dark:border-cyan-500/40 text-xs font-mono font-bold text-blue-600 dark:text-cyan-300 focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition"
            />
          </div>
        </div>

        {/* Social Network Linking (YouTube, Instagram, TikTok, etc.) */}
        <div className="space-y-2 text-left mb-4 p-3 rounded-2xl bg-slate-50 dark:bg-[#081122] border border-slate-200 dark:border-cyan-500/30">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              {socialPlatform === 'YouTube' ? (
                <Youtube className="w-3.5 h-3.5 text-red-500" />
              ) : socialPlatform === 'Instagram' ? (
                <Instagram className="w-3.5 h-3.5 text-pink-500" />
              ) : (
                <Globe className="w-3.5 h-3.5 text-cyan-400" />
              )}
              <span>Vincular tu Red Social:</span>
            </label>
            <span className="text-[10px] text-slate-500 dark:text-slate-400">
              Redirige a tu perfil con un clic
            </span>
          </div>

          {/* Platform Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {['YouTube', 'Instagram', 'TikTok', 'X', 'GitHub', 'LinkedIn', 'Web'].map((plat) => (
              <button
                key={plat}
                type="button"
                onClick={() => setSocialPlatform(plat)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition flex-shrink-0 ${
                  socialPlatform === plat
                    ? plat === 'YouTube'
                      ? 'bg-red-600 text-white shadow-sm'
                      : plat === 'Instagram'
                      ? 'bg-pink-600 text-white shadow-sm'
                      : 'bg-blue-600 text-white shadow-sm'
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {plat}
              </button>
            ))}
          </div>

          {/* Social Handle or Profile URL input */}
          <div className="space-y-1">
            <input
              type="text"
              value={socialHandle}
              onChange={(e) => setSocialHandle(e.target.value)}
              placeholder={
                socialPlatform === 'YouTube'
                  ? 'ej: @mi_canal o https://youtube.com/@micanal'
                  : socialPlatform === 'Instagram'
                  ? 'ej: @usuario o https://instagram.com/usuario'
                  : 'ej: @usuario o URL de perfil'
              }
              className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-[#070d1a] border border-slate-300 dark:border-cyan-500/30 text-xs font-mono text-slate-800 dark:text-cyan-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            />
            {previewRedirectUrl && (
              <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                Destino al hacer clic: <span className="text-blue-500 dark:text-cyan-300">{previewRedirectUrl}</span>
              </p>
            )}
          </div>
        </div>

        {/* Link input with copy button */}
        <div className="space-y-2 text-left mb-4">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
            Enlace para compartir:
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={generatedUrl}
              className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#070d1a] border border-slate-300 dark:border-cyan-500/30 text-xs font-mono text-slate-800 dark:text-cyan-200 focus:outline-none select-all"
            />
            <button
              onClick={handleCopy}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition active:scale-95 flex-shrink-0 ${
                copied
                  ? 'bg-emerald-600 text-white'
                  : 'bg-blue-600 hover:bg-blue-500 text-white shadow-sm'
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>¡Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copiar</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Action Button: Test & Preview how it looks */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={handleOpenPreview}
            className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-[#070d1a] hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 transition active:scale-95"
          >
            <span>Ver como destinatario</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
