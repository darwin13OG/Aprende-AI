import React from 'react';
import { AprendeLogo } from './AprendeLogo.tsx';
import { ActiveTab } from '../types.ts';
import {
  Menu,
  Sun,
  Moon,
  Clock,
  RotateCcw,
  MessageSquare,
  HelpCircle,
  Layers,
  Network,
  Share2,
} from 'lucide-react';

interface NavigationProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  isDarkMode: boolean;
  setIsDarkMode: (val: boolean | ((prev: boolean) => boolean)) => void;
  currentEntornoName?: string;
  onOpenEntornosDrawer?: () => void;
  quizTimeFormatted?: string;
  flashcardIndex?: number;
  flashcardsTotal?: number;
  onResetMapZoom?: () => void;
  topicTitle?: string;
  onOpenShare?: () => void;
  hasExperience?: boolean;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  setActiveTab,
  isDarkMode,
  setIsDarkMode,
  currentEntornoName = 'Nuevo Entorno',
  onOpenEntornosDrawer,
  quizTimeFormatted = '0:45',
  flashcardIndex = 1,
  flashcardsTotal = 15,
  onResetMapZoom,
  onOpenShare,
  hasExperience,
}) => {
  return (
    <>
      {/* Top App Header */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-200 dark:border-cyan-500/15 bg-white/90 dark:bg-[#070d1a]/90 backdrop-blur-md px-3 sm:px-4 py-2.5 transition-colors">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-2">
          {/* Left: Drawer trigger button & Brand */}
          <div className="flex items-center gap-2 sm:gap-3">
            {onOpenEntornosDrawer && (
              <button
                onClick={onOpenEntornosDrawer}
                className="p-2 rounded-xl text-slate-700 dark:text-slate-300 hover:text-cyan-600 dark:hover:text-cyan-400 hover:bg-slate-100 dark:hover:bg-slate-800/70 border border-slate-200 dark:border-cyan-500/20 transition active:scale-95"
                title="Abrir menú de entornos"
                aria-label="Abrir menú de entornos"
              >
                <Menu className="w-5 h-5" />
              </button>
            )}

            {/* Logo + Subtitle matching screen.png */}
            <button
              onClick={() => setActiveTab('entorno')}
              className="flex items-center gap-2 text-left focus:outline-none rounded-lg"
              aria-label="Ir al inicio"
            >
              <AprendeLogo size="md" />
              <div className="hidden sm:block pl-1 text-left border-l border-slate-300 dark:border-cyan-500/30">
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest block leading-none">
                  {currentEntornoName ? currentEntornoName.slice(0, 18) : 'CHAT NUEVO'}
                </span>
              </div>
            </button>
          </div>

          {/* Right Controls: Contextual information & Dark Mode toggle ONLY (profile avatar removed) */}
          <div className="flex items-center gap-2 sm:gap-3">
            {activeTab === 'quiz' && (
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-cyan-950/70 border border-slate-300 dark:border-cyan-500/30 text-slate-800 dark:text-cyan-300 text-xs font-mono font-medium shadow-sm">
                <Clock className="w-3.5 h-3.5 text-blue-600 dark:text-cyan-400 animate-pulse" />
                <span>{quizTimeFormatted}</span>
              </div>
            )}

            {activeTab === 'cards' && (
              <div className="hidden sm:flex items-center gap-1 px-3 py-1 rounded-full bg-slate-100 dark:bg-blue-950/70 border border-slate-300 dark:border-blue-500/30 text-slate-800 dark:text-blue-300 text-xs font-medium">
                <span>Tarjeta</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {flashcardIndex} de {flashcardsTotal}
                </span>
              </div>
            )}

            {activeTab === 'map' && onResetMapZoom && (
              <button
                onClick={onResetMapZoom}
                className="p-1.5 rounded-full bg-slate-100 dark:bg-[#0d172a] border border-slate-300 dark:border-cyan-500/30 text-slate-700 dark:text-slate-300 hover:text-cyan-600 dark:hover:text-cyan-300 transition"
                title="Centrar mapa"
                aria-label="Centrar mapa"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}

            {hasExperience && onOpenShare && (
              <button
                onClick={onOpenShare}
                className="px-2.5 py-2 rounded-xl bg-blue-50 dark:bg-cyan-950/70 border border-blue-200 dark:border-cyan-500/30 text-blue-600 dark:text-cyan-400 hover:bg-blue-100 dark:hover:bg-cyan-900/60 transition shadow-sm active:scale-95 flex items-center gap-1.5 text-xs font-bold"
                title="Compartir paquete o módulo"
                aria-label="Compartir"
              >
                <Share2 className="w-4 h-4" />
                <span className="hidden sm:inline">Compartir</span>
              </button>
            )}

            {/* Dark / Light Mode Toggle */}
            <button
              onClick={() => setIsDarkMode((prev) => !prev)}
              className="p-2 rounded-xl bg-slate-100 dark:bg-[#0d172a] border border-slate-300 dark:border-cyan-500/30 text-slate-700 dark:text-cyan-300 hover:bg-slate-200 dark:hover:bg-cyan-950/60 transition shadow-sm active:scale-95"
              title={isDarkMode ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
              aria-label="Alternar tema"
            >
              {isDarkMode ? (
                <Sun className="w-4 h-4 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]" />
              ) : (
                <Moon className="w-4 h-4 text-indigo-600" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Floating Bottom App Navigation Bar */}
      <nav
        id="bottom-navigation-bar"
        aria-label="Navegación principal"
        className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 dark:border-cyan-500/20 bg-white/95 dark:bg-[#070d1a]/95 backdrop-blur-lg px-2 py-2 safe-area-bottom shadow-[0_-4px_20px_rgba(0,0,0,0.08)] dark:shadow-[0_-5px_25px_rgba(0,0,0,0.6)] transition-colors"
      >
        <div className="max-w-md mx-auto grid grid-cols-4 gap-1">
          {/* 1. Chat / Entorno */}
          <button
            id="nav-tab-entorno"
            onClick={() => setActiveTab('entorno')}
            className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all ${
              activeTab === 'entorno' || activeTab === 'creador'
                ? 'text-blue-600 dark:text-cyan-400 bg-blue-50 dark:bg-cyan-950/40 border border-blue-200 dark:border-cyan-500/40 font-bold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <MessageSquare className="w-5 h-5 mb-0.5" />
            <span className="text-[11px] tracking-tight">Chat</span>
          </button>

          {/* 2. Quizzes */}
          <button
            id="nav-tab-quiz"
            onClick={() => setActiveTab('quiz')}
            className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all ${
              activeTab === 'quiz'
                ? 'text-blue-600 dark:text-cyan-400 bg-blue-50 dark:bg-cyan-950/40 border border-blue-200 dark:border-cyan-500/40 font-bold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <HelpCircle className="w-5 h-5 mb-0.5" />
            <span className="text-[11px] tracking-tight">Quizzes</span>
          </button>

          {/* 3. Flashcards */}
          <button
            id="nav-tab-cards"
            onClick={() => setActiveTab('cards')}
            className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all ${
              activeTab === 'cards'
                ? 'text-blue-600 dark:text-cyan-400 bg-blue-50 dark:bg-cyan-950/40 border border-blue-200 dark:border-cyan-500/40 font-bold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Layers className="w-5 h-5 mb-0.5" />
            <span className="text-[11px] tracking-tight">Flashcards</span>
          </button>

          {/* 4. Mapa */}
          <button
            id="nav-tab-map"
            onClick={() => setActiveTab('map')}
            className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all ${
              activeTab === 'map'
                ? 'text-blue-600 dark:text-cyan-400 bg-blue-50 dark:bg-cyan-950/40 border border-blue-200 dark:border-cyan-500/40 font-bold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Network className="w-5 h-5 mb-0.5" />
            <span className="text-[11px] tracking-tight">Mapa</span>
          </button>
        </div>
      </nav>
    </>
  );
};
