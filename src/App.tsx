/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Entorno, Fuente, ActiveTab, LearningExperience } from './types.ts';
import { Navigation } from './components/Navigation.tsx';
import { EntornoView } from './components/EntornoView.tsx';
import { EntornoDrawer } from './components/EntornoDrawer.tsx';
import { QuizView } from './components/QuizView.tsx';
import { FlashcardsView } from './components/FlashcardsView.tsx';
import { MindmapView } from './components/MindmapView.tsx';
import { ShareModal } from './components/ShareModal.tsx';
import { SharedExperienceView } from './components/SharedExperienceView.tsx';
import {
  ShareType,
  SharedPayload,
  parseSharedPayloadFromUrl,
  fetchSharedPayloadById,
} from './utils/shareUtils.ts';
import { safeFetchJson } from './utils/apiUtils.ts';

const STORAGE_KEY = 'aprende_ai_entornos_v3';

export default function App() {
  // Shared study mode if URL contains #share payload
  const [sharedPayload, setSharedPayload] = useState<SharedPayload | null>(() => {
    return parseSharedPayloadFromUrl();
  });
  // Load or initialize Entornos
  const [entornos, setEntornos] = useState<Entorno[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Error loading stored entornos:', e);
    }

    // Clean initial empty entorno
    return [
      {
        id: `entorno-${Date.now().toString(36)}`,
        nombre: 'Nuevo Entorno',
        createdAt: new Date().toISOString(),
        hasGenerated: false,
        fuentes: [],
      },
    ];
  });

  const [activeEntornoId, setActiveEntornoId] = useState<string>(() => {
    return entornos[0]?.id || '';
  });

  const [activeTab, setActiveTab] = useState<ActiveTab>('entorno');

  // Light / Dark Mode with persistent storage and document classList sync
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    const saved = localStorage.getItem('aprende_ai_theme');
    return saved ? saved === 'dark' : true;
  });

  useEffect(() => {
    if (typeof document !== 'undefined') {
      if (isDarkMode) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('aprende_ai_theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('aprende_ai_theme', 'light');
      }
    }
  }, [isDarkMode]);

  // User Gemini API Key (Fallback for model saturation)
  const [userApiKey, setUserApiKey] = useState<string>(() => {
    if (typeof window === 'undefined') return '';
    return localStorage.getItem('user_gemini_api_key') || '';
  });

  const handleSaveApiKey = (key: string) => {
    setUserApiKey(key);
    if (typeof window !== 'undefined') {
      localStorage.setItem('user_gemini_api_key', key);
    }
  };

  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [quotaExhausted, setQuotaExhausted] = useState<boolean>(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);

  // Quiz Timer State
  const [quizSeconds, setQuizSeconds] = useState<number>(0);

  // Flashcard Progress State
  const [flashcardIndex, setFlashcardIndex] = useState<number>(1);

  // Share Modal State
  const [shareModal, setShareModal] = useState<{
    isOpen: boolean;
    type: ShareType;
  }>({
    isOpen: false,
    type: 'all',
  });

  // Current active Entorno helper
  const currentEntorno =
    entornos.find((e) => e.id === activeEntornoId) || entornos[0] || {
      id: 'default',
      nombre: 'Nuevo Entorno',
      createdAt: new Date().toISOString(),
      hasGenerated: false,
      fuentes: [],
    };

  // Persist Entornos in localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(entornos));
    } catch (e) {
      console.error('Error saving entornos:', e);
    }
  }, [entornos]);

  // Handle URL hash routing (#quiz, #cards, #map, #entorno, or #share)
  const parseUrlRoute = useCallback(() => {
    if (typeof window === 'undefined') return;
    const rawHash = window.location.hash;
    const hash = rawHash.toLowerCase();

    // Check if this is a shared study link
    const shared = parseSharedPayloadFromUrl();
    if (shared) {
      setSharedPayload(shared);
      return;
    } else if (rawHash.includes('share') || rawHash.includes('estudio')) {
      const queryString = rawHash.split('?')[1] || window.location.search.replace(/^\?/, '');
      const params = new URLSearchParams(queryString);
      const id = params.get('id');
      if (id) {
        fetchSharedPayloadById(id).then((loaded) => {
          if (loaded) setSharedPayload(loaded);
        });
        return;
      }
      setSharedPayload(null);
    } else {
      setSharedPayload(null);
    }

    if (hash.startsWith('#quiz')) {
      setActiveTab('quiz');
    } else if (hash.startsWith('#cards') || hash.startsWith('#flashcards')) {
      setActiveTab('cards');
    } else if (hash.startsWith('#map') || hash.startsWith('#mapa')) {
      setActiveTab('map');
    } else {
      setActiveTab('entorno');
    }
  }, []);

  useEffect(() => {
    parseUrlRoute();
    window.addEventListener('hashchange', parseUrlRoute);
    return () => window.removeEventListener('hashchange', parseUrlRoute);
  }, [parseUrlRoute]);

  // Tab change
  const handleTabChange = (tab: ActiveTab) => {
    const normalizedTab = tab === 'creador' ? 'entorno' : tab;
    setActiveTab(normalizedTab);
    const id = currentEntorno?.experience?.id || currentEntorno.id;
    window.history.pushState(null, '', `#${normalizedTab}?id=${id}`);
  };

  // Timer for quiz
  useEffect(() => {
    if (activeTab !== 'quiz') return;
    const interval = setInterval(() => {
      setQuizSeconds((s) => s + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [activeTab]);

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Create new Entorno following sequential numbering rule
  const handleCreateNewEntorno = () => {
    const existingNames = entornos.map((e) => e.nombre.trim());

    let nextName = 'Nuevo Entorno';
    if (existingNames.includes('Nuevo Entorno')) {
      let maxNum = 1;
      for (const name of existingNames) {
        const match = name.match(/^Nuevo Entorno\s*(\d+)$/i);
        if (match) {
          const num = parseInt(match[1], 10);
          if (num > maxNum) maxNum = num;
        }
      }
      nextName = `Nuevo Entorno ${maxNum + 1}`;
    }

    const newEntorno: Entorno = {
      id: `entorno-${Date.now().toString(36)}`,
      nombre: nextName,
      createdAt: new Date().toISOString(),
      hasGenerated: false,
      fuentes: [],
    };

    setEntornos((prev) => [newEntorno, ...prev]);
    setActiveEntornoId(newEntorno.id);
    setActiveTab('entorno');
    setFlashcardIndex(1);
    window.history.pushState(null, '', `#entorno?id=${newEntorno.id}`);
  };

  // Rename Entorno
  const handleRenameEntorno = (id: string, newName: string) => {
    setEntornos((prev) =>
      prev.map((e) => (e.id === id ? { ...e, nombre: newName } : e))
    );
  };

  // Delete Entorno
  const handleDeleteEntorno = (id: string) => {
    const remaining = entornos.filter((e) => e.id !== id);
    if (remaining.length > 0) {
      setEntornos(remaining);
      if (activeEntornoId === id) {
        setActiveEntornoId(remaining[0].id);
      }
    }
  };

  // Update Entorno
  const handleUpdateEntorno = (updated: Entorno) => {
    setEntornos((prev) =>
      prev.map((e) => (e.id === updated.id ? updated : e))
    );
  };

  // Gemini API Multimodal Generation with Cascade Fallback
  const handleGenerateExperience = async ({
    topic,
    promptText,
    sources,
  }: {
    topic: string;
    promptText: string;
    sources: Fuente[];
  }) => {
    setIsGenerating(true);
    setGenerationError(null);
    setQuotaExhausted(false);

    try {
      const res = await safeFetchJson('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(userApiKey ? { 'x-gemini-api-key': userApiKey } : {}),
        },
        body: JSON.stringify({
          topic,
          promptText,
          sources,
          userApiKey: userApiKey || undefined,
        }),
      });

      if (!res.ok || res.error) {
        throw new Error(
          res.error || 'Error al procesar la solicitud con el servidor.'
        );
      }

      const data = res.data;

      if (data.quotaExhausted) {
        setQuotaExhausted(true);
        setGenerationError(data.message || 'Modelos saturados. Introduce tu API Key de Gemini para continuar.');
        return;
      }

      if (!data.success) {
        throw new Error(data.message || 'Error al procesar la solicitud con Gemini.');
      }

      if (data.experience) {
        const generatedExp: LearningExperience = data.experience;

        const updated: Entorno = {
          ...currentEntorno,
          hasGenerated: true,
          topic: generatedExp.tema || topic || currentEntorno.nombre,
          experience: generatedExp,
        };

        handleUpdateEntorno(updated);
        setQuizSeconds(0);
        setFlashcardIndex(1);
      }
    } catch (err: any) {
      console.error('Error generating experience:', err);
      setGenerationError(err?.message || 'Error al conectar con la API de Gemini.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Open Share modal
  const handleOpenShareModal = (
    param1?: string | ShareType,
    _url?: string,
    paramType?: 'cuestionario' | 'flashcards' | 'mapa' | 'pack'
  ) => {
    let finalType: ShareType = 'all';
    if (param1 === 'all' || param1 === 'quiz' || param1 === 'cards' || param1 === 'map') {
      finalType = param1;
    } else if (paramType) {
      if (paramType === 'cuestionario') finalType = 'quiz';
      else if (paramType === 'flashcards') finalType = 'cards';
      else if (paramType === 'mapa') finalType = 'map';
      else finalType = 'all';
    } else if (typeof param1 === 'string') {
      const lower = param1.toLowerCase();
      if (lower.includes('quiz') || lower.includes('cuestionario')) finalType = 'quiz';
      else if (lower.includes('card') || lower.includes('ficha')) finalType = 'cards';
      else if (lower.includes('map') || lower.includes('nodo')) finalType = 'map';
    }

    setShareModal({
      isOpen: true,
      type: finalType,
    });
  };

  // If a student or recipient opened a shared study link, show strictly the shared view
  if (sharedPayload) {
    return (
      <SharedExperienceView
        payload={sharedPayload}
        isDarkMode={isDarkMode}
        onToggleTheme={() => setIsDarkMode((prev) => !prev)}
        onExitToApp={() => {
          setSharedPayload(null);
          window.location.hash = '';
        }}
      />
    );
  }

  return (
    <div className="min-h-screen font-['Plus_Jakarta_Sans'] bg-slate-50 text-slate-900 dark:bg-[#070d1a] dark:text-slate-100 transition-colors duration-200">
      {/* Navigation Header & Bottom Bar */}
      <Navigation
        activeTab={activeTab}
        setActiveTab={handleTabChange}
        isDarkMode={isDarkMode}
        setIsDarkMode={setIsDarkMode}
        currentEntornoName={currentEntorno.nombre}
        isDrawerOpen={isDrawerOpen}
        onOpenEntornosDrawer={() => setIsDrawerOpen((prev) => !prev)}
        quizTimeFormatted={formatTimer(quizSeconds)}
        flashcardIndex={flashcardIndex}
        flashcardsTotal={currentEntorno.experience?.flashcards.length || 0}
        topicTitle={currentEntorno.experience?.tema || currentEntorno.nombre}
        hasExperience={Boolean(currentEntorno.hasGenerated && currentEntorno.experience)}
        onOpenShare={() => handleOpenShareModal('all')}
      />

      {/* Main Dynamic View */}
      <main className="w-full">
        {(activeTab === 'entorno' || activeTab === 'creador') && (
          <EntornoView
            entorno={currentEntorno}
            onUpdateEntorno={handleUpdateEntorno}
            onGenerate={handleGenerateExperience}
            isGenerating={isGenerating}
            generationError={generationError}
            quotaExhausted={quotaExhausted}
            userApiKey={userApiKey}
            onSaveApiKey={handleSaveApiKey}
            onGoToTab={handleTabChange}
            onShareItem={handleOpenShareModal}
            onOpenEntornosDrawer={() => setIsDrawerOpen(true)}
          />
        )}

        {activeTab === 'quiz' && (
          <QuizView
            questions={currentEntorno.experience?.quiz || []}
            topicTitle={currentEntorno.experience?.tema || currentEntorno.nombre}
            onShareProgress={() => handleOpenShareModal('quiz')}
            onResetQuiz={() => setQuizSeconds(0)}
            onGoToTab={handleTabChange}
          />
        )}

        {activeTab === 'cards' && (
          <FlashcardsView
            cards={currentEntorno.experience?.flashcards || []}
            topicTitle={currentEntorno.experience?.tema || currentEntorno.nombre}
            onCardIndexChange={(idx) => setFlashcardIndex(idx)}
            onGoToQuiz={() => handleTabChange('quiz')}
            onGoToMap={() => handleTabChange('map')}
          />
        )}

        {activeTab === 'map' && (
          <MindmapView
            mindmap={
              currentEntorno.experience?.mindmap || {
                nodoPrincipal: '',
                subnodos: [],
              }
            }
            topicTitle={currentEntorno.experience?.tema || currentEntorno.nombre}
            author={
              currentEntorno.experience?.autor ||
              localStorage.getItem('aprende_creator_handle') ||
              '@AprendeAI'
            }
            fuentesCount={currentEntorno.fuentes?.length || 1}
            onGoToQuiz={() => handleTabChange('quiz')}
            onShareNode={() => handleOpenShareModal('map')}
          />
        )}
      </main>

      {/* Entornos Drawer (Left Side Menu for managing saved Entornos & custom API Key) */}
      <EntornoDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        entornos={entornos}
        activeEntornoId={activeEntornoId}
        onSelectEntorno={(id) => {
          setActiveEntornoId(id);
          setActiveTab('entorno');
          setFlashcardIndex(1);
        }}
        onCreateEntorno={handleCreateNewEntorno}
        onRenameEntorno={handleRenameEntorno}
        onDeleteEntorno={handleDeleteEntorno}
        userApiKey={userApiKey}
        onSaveApiKey={handleSaveApiKey}
      />

      {/* Share Modal */}
      <ShareModal
        isOpen={shareModal.isOpen}
        onClose={() => setShareModal((prev) => ({ ...prev, isOpen: false }))}
        experience={currentEntorno.experience}
        initialType={shareModal.type}
      />
    </div>
  );
}
