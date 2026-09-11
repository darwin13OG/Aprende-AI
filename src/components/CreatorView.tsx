import React, { useState, useRef } from 'react';
import { LearningExperience, ActiveTab } from '../types.ts';
import {
  Sparkles,
  Paperclip,
  Camera,
  CheckCircle2,
  Share2,
  Copy,
  ExternalLink,
  Play,
  RotateCw,
  Compass,
  QrCode,
  FileText,
  Image as ImageIcon,
  Loader2,
  ArrowUp,
  AlertCircle,
  FileSpreadsheet,
} from 'lucide-react';

interface CreatorViewProps {
  experience: LearningExperience;
  setActiveTab: (tab: ActiveTab) => void;
  onShareItem: (title: string, path: string, type: 'cuestionario' | 'flashcards' | 'mapa' | 'pack') => void;
  onGenerateNew: (params: {
    topic: string;
    promptText: string;
    fileBase64?: string;
    fileMimeType?: string;
    fileName?: string;
  }) => Promise<void>;
  isGenerating: boolean;
  generationError?: string | null;
}

export const CreatorView: React.FC<CreatorViewProps> = ({
  experience,
  setActiveTab,
  onShareItem,
  onGenerateNew,
  isGenerating,
  generationError,
}) => {
  const [topicInput, setTopicInput] = useState(experience.tema);
  const [promptInput, setPromptInput] = useState('');
  const [copiedLink, setCopiedLink] = useState<string | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [uploadedFileBase64, setUploadedFileBase64] = useState<string | null>(null);
  const [uploadedFileMime, setUploadedFileMime] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedLink(id);
    setTimeout(() => setCopiedLink(null), 2000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadedFileName(file.name);
    setUploadedFileMime(file.type || 'application/octet-stream');

    const reader = new FileReader();
    reader.onload = () => {
      setUploadedFileBase64(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleTriggerGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topicInput.trim() && !promptInput.trim() && !uploadedFileBase64) return;

    await onGenerateNew({
      topic: topicInput || experience.tema,
      promptText: promptInput,
      fileBase64: uploadedFileBase64 || undefined,
      fileMimeType: uploadedFileMime || undefined,
      fileName: uploadedFileName || undefined,
    });

    setPromptInput('');
    setUploadedFileName(null);
    setUploadedFileBase64(null);
  };

  const originUrl = typeof window !== 'undefined' ? window.location.origin : 'https://aprendeia.pages.dev';
  const quizLink = `${originUrl}#quiz?id=${experience.id}`;
  const cardsLink = `${originUrl}#cards?id=${experience.id}`;
  const mapLink = `${originUrl}#map?id=${experience.id}`;
  const packLink = `${originUrl}#creator?id=${experience.id}`;

  return (
    <div className="w-full max-w-xl mx-auto px-4 pb-28 pt-4 space-y-5 animate-fadeIn">
      {/* Status Badges */}
      <div className="flex items-center justify-between text-xs font-semibold">
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 shadow-[0_0_12px_rgba(0,210,255,0.15)]">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
          <span>Motor Pedagógico Activo</span>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-950/60 border border-blue-500/30 text-blue-300">
          <span className="text-cyan-400">⚡</span>
          <span>{experience.version || 'Deep Learning v3.2'}</span>
        </div>
      </div>

      {/* Main Title Banner */}
      <div className="space-y-1 text-left">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-['Plus_Jakarta_Sans']">
          Generador de Experiencias
        </h1>
        <p className="text-xs sm:text-sm text-slate-300/80 leading-relaxed font-normal">
          Transforma apuntes, capturas y guiones en micro-aprendizajes gamificados listos para compartir.
        </p>
      </div>

      {/* Source & Generator Input Card */}
      <div className="rounded-2xl bg-[#0b1528] border border-cyan-500/25 p-4 sm:p-5 shadow-[0_0_25px_rgba(0,102,255,0.15)] space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-950/70 border border-cyan-500/30 text-cyan-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-cyan-400/90 tracking-wide uppercase">
                Tema en Estudio
              </span>
              <input
                type="text"
                value={topicInput}
                onChange={(e) => setTopicInput(e.target.value)}
                placeholder="Ej. Redes Neuronales y Deep Learning"
                className="w-full bg-transparent font-bold text-sm sm:text-base text-white focus:outline-none focus:border-b focus:border-cyan-400 transition"
              />
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-lg bg-[#070d1a] border border-cyan-500/30 text-[11px] font-bold text-cyan-300">
            {experience.fuentes.length} Fuentes
          </span>
        </div>

        {/* Attached Sources Pills */}
        <div className="flex flex-wrap gap-2 pt-1">
          {experience.fuentes.map((fuente) => (
            <div
              key={fuente.id}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-[#070d1a] border border-cyan-500/25 text-xs text-slate-200 shadow-sm hover:border-cyan-400/50 transition"
            >
              {fuente.tipo === 'pdf' ? (
                <FileSpreadsheet className="w-3.5 h-3.5 text-red-400" />
              ) : fuente.tipo === 'imagen' ? (
                <ImageIcon className="w-3.5 h-3.5 text-cyan-400" />
              ) : (
                <FileText className="w-3.5 h-3.5 text-blue-400" />
              )}
              <span className="font-medium max-w-[130px] truncate">{fuente.nombre}</span>
              {fuente.tamano && <span className="text-[10px] text-slate-400">• {fuente.tamano}</span>}
              <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 ml-0.5" />
            </div>
          ))}

          {/* Recently uploaded file chip preview */}
          {uploadedFileName && (
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-cyan-950/80 border border-cyan-400 text-xs text-cyan-200 animate-pulse">
              <FileText className="w-3.5 h-3.5 text-cyan-300" />
              <span className="font-semibold max-w-[130px] truncate">{uploadedFileName}</span>
              <span className="text-[10px] text-cyan-300/80">Listo para procesar</span>
            </div>
          )}
        </div>

        {/* Hidden File Inputs */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,application/pdf,text/*"
          className="hidden"
          onChange={handleFileChange}
        />
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handleFileChange}
        />

        {/* Action input bar */}
        <form onSubmit={handleTriggerGenerate} className="flex items-center gap-2 pt-2">
          {/* Paperclip upload */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-2.5 rounded-xl bg-[#070d1a] border border-cyan-500/30 text-slate-300 hover:text-cyan-300 hover:border-cyan-400 transition"
            title="Adjuntar PDF, Apuntes o Imagen"
            aria-label="Adjuntar archivo"
          >
            <Paperclip className="w-4 h-4" />
          </button>

          {/* Camera OCR trigger */}
          <button
            type="button"
            onClick={() => cameraInputRef.current?.click()}
            className="p-2.5 rounded-xl bg-[#070d1a] border border-cyan-500/30 text-slate-300 hover:text-cyan-300 hover:border-cyan-400 transition"
            title="Captura con Cámara para OCR"
            aria-label="Tomar foto para OCR"
          >
            <Camera className="w-4 h-4" />
          </button>

          {/* Feedback/prompt input */}
          <input
            type="text"
            value={promptInput}
            onChange={(e) => setPromptInput(e.target.value)}
            placeholder="Añade retroalimentación o especificaciones..."
            className="flex-1 px-3 py-2.5 rounded-xl bg-[#070d1a] border border-cyan-500/30 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400 transition"
          />

          {/* Primary Update/Generate Button */}
          <button
            type="submit"
            disabled={isGenerating}
            className="px-3.5 py-2.5 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 disabled:opacity-50 transition shadow-[0_0_15px_rgba(0,210,255,0.3)] flex items-center gap-1.5 flex-shrink-0"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span className="hidden sm:inline">Analizando...</span>
              </>
            ) : (
              <>
                <span>Actualizar</span>
                <ArrowUp className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </form>

        {generationError && (
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-red-950/60 border border-red-500/30 text-red-300 text-xs">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-400" />
            <span>{generationError}</span>
          </div>
        )}
      </div>

      {/* Synthesis Completed Card */}
      <div className="rounded-2xl bg-[#0b1528] border border-cyan-500/25 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(0,210,255,0.8)]" />
            <h2 className="font-bold text-sm text-white">Síntesis Pedagógica Completada</h2>
          </div>
          <span className="px-2.5 py-1 rounded-full bg-cyan-950/60 border border-cyan-500/30 text-[11px] font-bold text-cyan-300">
            100% Sincronizado
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          <div className="p-2 rounded-xl bg-[#070d1a] border border-cyan-500/20 text-slate-300 flex items-center justify-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
            <span className="truncate">OCR & Docs</span>
          </div>
          <div className="p-2 rounded-xl bg-[#070d1a] border border-cyan-500/20 text-slate-300 flex items-center justify-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
            <span className="truncate">Didáctica IA</span>
          </div>
          <div className="p-2 rounded-xl bg-[#070d1a] border border-cyan-500/20 text-slate-300 flex items-center justify-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
            <span className="truncate">3 Módulos</span>
          </div>
        </div>
      </div>

      {/* Experiencias Generadas List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm">
            <Sparkles className="w-4 h-4" />
            <span>Experiencias Generadas</span>
          </div>
          <span className="text-xs text-slate-400">3 Activos para compartir</span>
        </div>

        {/* 1. Cuestionario Dinámico Card */}
        <div className="rounded-2xl bg-[#0b1528] border border-cyan-500/25 p-4 sm:p-5 space-y-3.5 hover:border-cyan-500/40 transition">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-blue-950/80 border border-blue-500/40 text-cyan-400">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-white leading-snug">
                  Cuestionario Dinámico
                </h3>
                <p className="text-xs text-slate-400">
                  Retroalimentación con IA adaptativa
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="px-2 py-0.5 rounded-md bg-blue-950/70 border border-blue-500/30 text-[11px] font-semibold text-cyan-300">
                {experience.quiz.length} preguntas
              </span>
              <span className="px-2 py-0.5 rounded-md bg-[#070d1a] border border-cyan-500/20 text-[11px] font-mono text-cyan-400">
                👁 {experience.stats.quizViews}
              </span>
            </div>
          </div>

          {/* Clean Public Link */}
          <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-[#070d1a] border border-cyan-500/20 text-xs">
            <div className="flex items-center gap-2 truncate text-cyan-300/80 font-mono">
              <span className="text-slate-500">🔗</span>
              <span className="truncate">aprende.ai/q/{experience.id}</span>
            </div>
            <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider pl-2 flex-shrink-0">
              LINK PÚBLICO
            </span>
          </div>

          {/* Card Action Buttons */}
          <div className="grid grid-cols-2 gap-2.5 pt-1">
            <button
              onClick={() => handleCopy(quizLink, 'quiz')}
              className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-[#070d1a] border border-cyan-500/30 hover:border-cyan-400 text-xs font-semibold text-slate-200 transition"
            >
              <Copy className="w-3.5 h-3.5 text-cyan-400" />
              <span>{copiedLink === 'quiz' ? '¡Copiado!' : 'Copiar Enlace'}</span>
            </button>
            <button
              onClick={() => setActiveTab('quiz')}
              className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-xs font-bold text-white shadow-sm transition"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Resolver / Vista previa</span>
            </button>
          </div>
        </div>

        {/* 2. Flashcards de Repaso Card */}
        <div className="rounded-2xl bg-[#0b1528] border border-cyan-500/25 p-4 sm:p-5 space-y-3.5 hover:border-cyan-500/40 transition">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-blue-950/80 border border-blue-500/40 text-cyan-400">
                <RotateCw className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-white leading-snug">
                  Flashcards de Repaso
                </h3>
                <p className="text-xs text-slate-400">
                  Algoritmo SRS de repetición espaciada
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="px-2 py-0.5 rounded-md bg-blue-950/70 border border-blue-500/30 text-[11px] font-semibold text-cyan-300">
                {experience.flashcards.length} fichas
              </span>
              <span className="px-2 py-0.5 rounded-md bg-[#070d1a] border border-cyan-500/20 text-[11px] font-mono text-cyan-400">
                👁 {experience.stats.cardViews}
              </span>
            </div>
          </div>

          {/* Clean Public Link */}
          <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-[#070d1a] border border-cyan-500/20 text-xs">
            <div className="flex items-center gap-2 truncate text-cyan-300/80 font-mono">
              <span className="text-slate-500">🔗</span>
              <span className="truncate">aprende.ai/f/{experience.id}</span>
            </div>
            <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider pl-2 flex-shrink-0">
              LINK PÚBLICO
            </span>
          </div>

          {/* Card Action Buttons */}
          <div className="grid grid-cols-2 gap-2.5 pt-1">
            <button
              onClick={() => handleCopy(cardsLink, 'cards')}
              className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-[#070d1a] border border-cyan-500/30 hover:border-cyan-400 text-xs font-semibold text-slate-200 transition"
            >
              <Copy className="w-3.5 h-3.5 text-cyan-400" />
              <span>{copiedLink === 'cards' ? '¡Copiado!' : 'Copiar Enlace'}</span>
            </button>
            <button
              onClick={() => setActiveTab('cards')}
              className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-xs font-bold text-white shadow-sm transition"
            >
              <RotateCw className="w-3.5 h-3.5" />
              <span>Practicar / Modo SRS</span>
            </button>
          </div>
        </div>

        {/* 3. Mapa Mental Conceptual Card */}
        <div className="rounded-2xl bg-[#0b1528] border border-cyan-500/25 p-4 sm:p-5 space-y-3.5 hover:border-cyan-500/40 transition">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-blue-950/80 border border-blue-500/40 text-cyan-400">
                <Compass className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-white leading-snug">
                  Mapa Mental Conceptual
                </h3>
                <p className="text-xs text-slate-400">
                  Grafo vectorial interactivo con zoom
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="px-2 py-0.5 rounded-md bg-blue-950/70 border border-blue-500/30 text-[11px] font-semibold text-cyan-300">
                {experience.mindmap.subnodos.length} ramas
              </span>
              <span className="px-2 py-0.5 rounded-md bg-[#070d1a] border border-cyan-500/20 text-[11px] font-mono text-cyan-400">
                👁 {experience.stats.mapViews}
              </span>
            </div>
          </div>

          {/* Clean Public Link */}
          <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-[#070d1a] border border-cyan-500/20 text-xs">
            <div className="flex items-center gap-2 truncate text-cyan-300/80 font-mono">
              <span className="text-slate-500">🔗</span>
              <span className="truncate">aprende.ai/m/{experience.id}</span>
            </div>
            <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider pl-2 flex-shrink-0">
              LINK PÚBLICO
            </span>
          </div>

          {/* Card Action Buttons */}
          <div className="grid grid-cols-2 gap-2.5 pt-1">
            <button
              onClick={() => handleCopy(mapLink, 'map')}
              className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-[#070d1a] border border-cyan-500/30 hover:border-cyan-400 text-xs font-semibold text-slate-200 transition"
            >
              <Copy className="w-3.5 h-3.5 text-cyan-400" />
              <span>{copiedLink === 'map' ? '¡Copiado!' : 'Copiar Enlace'}</span>
            </button>
            <button
              onClick={() => setActiveTab('map')}
              className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-xs font-bold text-white shadow-sm transition"
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Explorar Grafo</span>
            </button>
          </div>
        </div>
      </div>

      {/* Difusión & Bio Link Card */}
      <div className="rounded-2xl bg-[#0b1528] border border-cyan-500/30 p-4 sm:p-5 space-y-3 shadow-[0_0_20px_rgba(0,102,255,0.15)]">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-cyan-950/80 border border-cyan-500/40 text-cyan-400">
            <Share2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-base text-white">Difusión y Bio Link</h3>
            <p className="text-xs text-slate-400">Lanza el paquete unificado a tus redes</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2.5 pt-1">
          <button
            onClick={() => onShareItem(experience.tema, packLink, 'pack')}
            className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-[#070d1a] border border-cyan-500/30 hover:border-cyan-400 text-xs font-bold text-cyan-300 transition"
          >
            <QrCode className="w-4 h-4" />
            <span>Código QR Bio</span>
          </button>
          <button
            onClick={() => onShareItem(experience.tema, packLink, 'pack')}
            className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-xs font-bold text-white shadow-sm transition"
          >
            <ExternalLink className="w-4 h-4" />
            <span>Compartir Pack Completo</span>
          </button>
        </div>
      </div>
    </div>
  );
};
