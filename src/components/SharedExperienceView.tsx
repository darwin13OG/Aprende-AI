import React, { useState } from 'react';
import { SharedPayload } from '../utils/shareUtils.ts';
import { QuizView } from './QuizView.tsx';
import { FlashcardsView } from './FlashcardsView.tsx';
import { MindmapView } from './MindmapView.tsx';
import {
  HelpCircle,
  Layers,
  Network,
  Sparkles,
  Sun,
  Moon,
  ArrowRight,
  BookOpen,
} from 'lucide-react';

interface SharedExperienceViewProps {
  payload: SharedPayload;
  isDarkMode: boolean;
  onToggleTheme: () => void;
  onExitToApp: () => void;
}

export const SharedExperienceView: React.FC<SharedExperienceViewProps> = ({
  payload,
  isDarkMode,
  onToggleTheme,
  onExitToApp,
}) => {
  // Determine available tabs
  const hasQuiz = Boolean(payload.quiz && payload.quiz.length > 0);
  const hasCards = Boolean(payload.flashcards && payload.flashcards.length > 0);
  const hasMap = Boolean(payload.mindmap && payload.mindmap.subnodos && payload.mindmap.subnodos.length > 0);

  const initialTab =
    payload.type === 'quiz' && hasQuiz
      ? 'quiz'
      : payload.type === 'cards' && hasCards
      ? 'cards'
      : payload.type === 'map' && hasMap
      ? 'map'
      : hasQuiz
      ? 'quiz'
      : hasCards
      ? 'cards'
      : 'map';

  const [activeTab, setActiveTab] = useState<'quiz' | 'cards' | 'map'>(initialTab);
  const [flashcardIndex, setFlashcardIndex] = useState(1);

  return (
    <div className="min-h-screen font-['Plus_Jakarta_Sans'] bg-slate-50 text-slate-900 dark:bg-[#070d1a] dark:text-slate-100 transition-colors duration-200">
      {/* Top Header for Shared Study Mode */}
      <header className="sticky top-0 z-30 w-full bg-white/90 dark:bg-[#070d1a]/90 backdrop-blur-md border-b border-slate-200 dark:border-cyan-500/20 px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
          {/* Brand Logo & Shared Badge */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-sm font-bold text-sm">
              AI
            </div>
            <div className="text-left">
              <div className="flex items-center gap-2">
                <span className="font-black text-sm tracking-tight text-slate-900 dark:text-white">
                  Aprende AI
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 dark:bg-cyan-950/70 text-blue-600 dark:text-cyan-300 border border-blue-200 dark:border-cyan-500/30">
                  Estudio Compartido
                </span>
              </div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 truncate max-w-[220px] sm:max-w-xs">
                {payload.tema}
              </p>
            </div>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-2">
            {/* Theme Toggle */}
            <button
              onClick={onToggleTheme}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              title={isDarkMode ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
              aria-label="Alternar tema"
            >
              {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-blue-600" />}
            </button>

            {/* Create my own entorno button */}
            <button
              onClick={onExitToApp}
              className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-sm flex items-center gap-1.5 transition active:scale-95"
            >
              <span className="hidden sm:inline">Crear mi propio entorno</span>
              <span className="sm:hidden">Crear</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Tab switcher if 'all' or multiple items were shared */}
        {payload.type === 'all' && (
          <div className="max-w-md mx-auto flex items-center justify-center gap-2 pt-3">
            {hasQuiz && (
              <button
                onClick={() => setActiveTab('quiz')}
                className={`flex-1 py-1.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition ${
                  activeTab === 'quiz'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>Cuestionario</span>
              </button>
            )}

            {hasCards && (
              <button
                onClick={() => setActiveTab('cards')}
                className={`flex-1 py-1.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition ${
                  activeTab === 'cards'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Flashcards</span>
              </button>
            )}

            {hasMap && (
              <button
                onClick={() => setActiveTab('map')}
                className={`flex-1 py-1.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition ${
                  activeTab === 'map'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                <Network className="w-3.5 h-3.5" />
                <span>Mapa Mental</span>
              </button>
            )}
          </div>
        )}
      </header>

      {/* Main Content Area: Renders strictly the shared module(s) */}
      <main className="w-full max-w-2xl mx-auto px-4 pt-6 pb-20">
        {activeTab === 'quiz' && payload.quiz && (
          <QuizView
            questions={payload.quiz}
            topicTitle={payload.tema}
            onShareProgress={() => {}}
            onResetQuiz={() => {}}
            onGoToTab={(tab) => {
              if (tab === 'cards' && hasCards) setActiveTab('cards');
              if (tab === 'map' && hasMap) setActiveTab('map');
            }}
          />
        )}

        {activeTab === 'cards' && payload.flashcards && (
          <FlashcardsView
            cards={payload.flashcards}
            topicTitle={payload.tema}
            onCardIndexChange={(idx) => setFlashcardIndex(idx)}
            onGoToQuiz={() => hasQuiz && setActiveTab('quiz')}
            onGoToMap={() => hasMap && setActiveTab('map')}
          />
        )}

        {activeTab === 'map' && payload.mindmap && (
          <MindmapView
            mindmap={payload.mindmap}
            topicTitle={payload.tema}
            author="@AprendeAI"
            onGoToQuiz={() => hasQuiz && setActiveTab('quiz')}
            onShareNode={() => {}}
          />
        )}
      </main>

      {/* Footer Banner for Students */}
      <footer className="fixed bottom-0 left-0 right-0 z-20 bg-white/95 dark:bg-[#070d1a]/95 border-t border-slate-200 dark:border-slate-800 p-3 text-center">
        <div className="max-w-md mx-auto flex items-center justify-between text-xs">
          <span className="text-slate-500 dark:text-slate-400">
            ¿Quieres estudiar con tus propios archivos o enlaces?
          </span>
          <button
            onClick={onExitToApp}
            className="px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold transition active:scale-95 ml-2"
          >
            Abrir Aprende AI
          </button>
        </div>
      </footer>
    </div>
  );
};
