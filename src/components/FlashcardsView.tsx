import React, { useState } from 'react';
import { Flashcard } from '../types.ts';
import {
  ArrowLeft,
  ArrowRight,
  RotateCw,
  BookOpen,
  Trophy,
  CheckCircle2,
  XCircle,
  RotateCcw,
} from 'lucide-react';

interface FlashcardsViewProps {
  cards: Flashcard[];
  topicTitle: string;
  onCardIndexChange?: (index: number) => void;
  onGoToQuiz?: () => void;
  onGoToMap?: () => void;
}

export const FlashcardsView: React.FC<FlashcardsViewProps> = ({
  cards,
  topicTitle,
  onCardIndexChange,
  onGoToQuiz,
  onGoToMap,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [ratings, setRatings] = useState<Record<number, 'entendido' | 'perdido'>>({});
  const [isSlidingOut, setIsSlidingOut] = useState(false);
  const [feedbackToast, setFeedbackToast] = useState<'entendido' | 'perdido' | null>(null);
  const [isFinished, setIsFinished] = useState(false);

  const totalCards = cards?.length || 0;

  if (!cards || cards.length === 0) {
    return (
      <div className="w-full max-w-md mx-auto px-4 py-16 text-center space-y-4 animate-fadeIn">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-slate-100 dark:bg-[#0b1528] border border-slate-300 dark:border-cyan-500/30 flex items-center justify-center text-blue-600 dark:text-cyan-400 shadow-sm">
          <BookOpen className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-800 dark:text-white">Sin tarjetas de estudio</h2>
        <p className="text-xs text-slate-500 dark:text-slate-300 leading-relaxed">
          Sube tus fuentes o escribe un tema en el Entorno para generar las tarjetas interactivas.
        </p>
      </div>
    );
  }

  const currentCard = cards[currentIndex] || cards[0];
  const currentStatus = ratings[currentIndex];

  // Counts of answered cards
  const entendidoCount = Object.values(ratings).filter((r) => r === 'entendido').length;
  const perdidoCount = Object.values(ratings).filter((r) => r === 'perdido').length;

  const handleToggleAnswer = () => {
    setShowAnswer((prev) => !prev);
  };

  const handleNext = () => {
    if (currentIndex + 1 < totalCards) {
      setShowAnswer(false);
      setCurrentIndex((prev) => {
        const next = prev + 1;
        onCardIndexChange?.(next + 1);
        return next;
      });
    } else {
      setIsFinished(true);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setShowAnswer(false);
      setCurrentIndex((prev) => {
        const prevIdx = prev - 1;
        onCardIndexChange?.(prevIdx + 1);
        return prevIdx;
      });
    }
  };

  // Slower, readable feedback message as requested by user
  const handleRateCard = (status: 'entendido' | 'perdido') => {
    if (isSlidingOut || feedbackToast) return;

    setRatings((prev) => ({ ...prev, [currentIndex]: status }));
    setFeedbackToast(status);

    // Give 1000ms so the user can easily read and appreciate the feedback
    setTimeout(() => {
      setIsSlidingOut(true);

      // Card slides out smoothly to left (380ms)
      setTimeout(() => {
        setIsSlidingOut(false);
        setFeedbackToast(null);
        setShowAnswer(false);

        if (currentIndex + 1 < totalCards) {
          setCurrentIndex((prev) => {
            const next = prev + 1;
            onCardIndexChange?.(next + 1);
            return next;
          });
        } else {
          // Deck finished!
          setIsFinished(true);
        }
      }, 380);
    }, 950);
  };

  const handleRestartAll = () => {
    setRatings({});
    setCurrentIndex(0);
    setShowAnswer(false);
    setIsFinished(false);
    onCardIndexChange?.(1);
  };

  const handleReviewOnlyMissed = () => {
    // Find the first index that was marked as 'perdido'
    const missedIndex = cards.findIndex((_, idx) => ratings[idx] === 'perdido');
    if (missedIndex !== -1) {
      setCurrentIndex(missedIndex);
      setShowAnswer(false);
      setIsFinished(false);
      onCardIndexChange?.(missedIndex + 1);
    } else {
      handleRestartAll();
    }
  };

  // Completion Screen when all cards are finished
  if (isFinished) {
    const totalAnswered = entendidoCount + perdidoCount;
    const masteryPercent = totalAnswered > 0 ? Math.round((entendidoCount / totalCards) * 100) : 0;

    return (
      <div className="w-full max-w-xl mx-auto px-4 pb-28 pt-8 space-y-6 animate-fadeIn text-center select-none">
        <div className="rounded-3xl bg-white dark:bg-[#1a1f2c] border-2 border-slate-200 dark:border-[#2f3543] p-6 sm:p-8 space-y-5 shadow-lg">
          <div className="w-20 h-20 mx-auto rounded-3xl bg-blue-50 dark:bg-cyan-950/70 border border-blue-200 dark:border-cyan-500/40 flex items-center justify-center text-blue-600 dark:text-cyan-400">
            <Trophy className="w-10 h-10" />
          </div>

          <div className="space-y-1">
            <span className="text-[11px] font-bold text-blue-600 dark:text-cyan-400 uppercase tracking-wider block">
              ¡Mazo Completado!
            </span>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white">
              Has revisado las {totalCards} tarjetas
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Tema: <span className="font-bold text-slate-800 dark:text-slate-200">{topicTitle}</span>
            </p>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-2 gap-3 py-2">
            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-500/30">
              <div className="flex items-center justify-center gap-1.5 text-emerald-700 dark:text-emerald-400 mb-1">
                <CheckCircle2 className="w-4 h-4" />
                <span className="text-xs font-bold uppercase">Entendido</span>
              </div>
              <span className="text-2xl font-black text-emerald-700 dark:text-emerald-300">
                {entendidoCount} / {totalCards}
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-500/30">
              <div className="flex items-center justify-center gap-1.5 text-red-700 dark:text-red-400 mb-1">
                <XCircle className="w-4 h-4" />
                <span className="text-xs font-bold uppercase">Para la próxima</span>
              </div>
              <span className="text-2xl font-black text-red-700 dark:text-red-300">
                {perdidoCount} / {totalCards}
              </span>
            </div>
          </div>

          {/* Mastery Percentage Progress Bar */}
          <div className="space-y-1.5 text-left">
            <div className="flex justify-between text-xs font-semibold text-slate-600 dark:text-slate-400">
              <span>Dominio del mazo</span>
              <span className="text-blue-600 dark:text-cyan-400 font-bold">{masteryPercent}%</span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-blue-600 dark:bg-cyan-400 transition-all duration-500"
                style={{ width: `${masteryPercent}%` }}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-3">
            <button
              onClick={handleRestartAll}
              className="flex-1 py-3 px-4 rounded-2xl bg-slate-100 dark:bg-[#070d1a] border border-slate-300 dark:border-slate-700 hover:border-blue-500 text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center justify-center gap-2 transition active:scale-95"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reiniciar Mazo Completo</span>
            </button>

            {perdidoCount > 0 && (
              <button
                onClick={handleReviewOnlyMissed}
                className="flex-1 py-3 px-4 rounded-2xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shadow-sm flex items-center justify-center gap-2 transition active:scale-95"
              >
                <span>Repasar las {perdidoCount} Pendientes</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-xl mx-auto px-4 pb-28 pt-3 space-y-4 select-none">
      {/* Top Header / Counter Bar */}
      <div className="flex items-center justify-between px-1 text-xs">
        <span className="font-bold text-slate-600 dark:text-cyan-400 truncate max-w-[200px]">
          {topicTitle}
        </span>
        <div className="flex items-center gap-2">
          {/* Status Badge of this card if marked */}
          {currentStatus === 'entendido' && (
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-500/40 px-2 py-0.5 rounded-full animate-fadeIn">
              Entendido
            </span>
          )}
          {currentStatus === 'perdido' && (
            <span className="text-xs font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/70 border border-red-500/40 px-2 py-0.5 rounded-full animate-fadeIn">
              Perdido
            </span>
          )}
        </div>
      </div>

      {/* Main Flashcard Frame */}
      <div className="relative w-full min-h-[380px] sm:min-h-[420px] flex flex-col justify-between">
        {/* Floating feedback animation badge - Made prominent and readable as requested */}
        {feedbackToast && (
          <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none animate-fadeIn">
            <div
              className={`px-8 py-4 rounded-3xl font-black text-xl sm:text-2xl shadow-2xl backdrop-blur-md transition-transform scale-105 ${
                feedbackToast === 'entendido'
                  ? 'bg-emerald-600 text-white border-2 border-emerald-300 shadow-[0_10px_35px_rgba(16,185,129,0.5)]'
                  : 'bg-red-600 text-white border-2 border-red-300 shadow-[0_10px_35px_rgba(239,68,68,0.5)]'
              }`}
            >
              {feedbackToast === 'entendido' ? '✓ Entendido' : '✕ Para la próxima'}
            </div>
          </div>
        )}

        {/* Card Component */}
        <div
          onClick={handleToggleAnswer}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === ' ' || e.key === 'Enter') {
              e.preventDefault();
              handleToggleAnswer();
            }
          }}
          className={`w-full min-h-[380px] sm:min-h-[420px] rounded-3xl p-6 sm:p-8 flex flex-col justify-between cursor-pointer transition-all duration-300 bg-white dark:bg-[#1a1f2c] border-2 border-slate-200 dark:border-[#2f3543] shadow-[0_10px_35px_rgba(0,0,0,0.08)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.4)] hover:border-blue-400 dark:hover:border-cyan-500/40 ${
            isSlidingOut ? 'animate-slide-out-left' : 'animate-slide-in-right'
          }`}
        >
          {/* Card Top: Number & Status */}
          <div className="flex items-center justify-between text-xs sm:text-sm text-slate-400 dark:text-slate-400 font-semibold">
            <span className="font-mono text-sm sm:text-base font-bold text-slate-500 dark:text-slate-400">
              {currentIndex + 1}/{totalCards}
            </span>

            {/* Small status indicator inside top of card as requested:
                "las que ya marco como entendido salen arribe el Texto Entendido pequeño en verde y si no sale Perdido en rojo con la letra pequeña al igual que el de entendido" */}
            <div>
              {currentStatus === 'entendido' && (
                <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 tracking-wide">
                  Entendido
                </span>
              )}
              {currentStatus === 'perdido' && (
                <span className="text-[11px] font-bold text-red-600 dark:text-red-400 tracking-wide">
                  Perdido
                </span>
              )}
            </div>
          </div>

          {/* Card Middle: Question & Answer */}
          <div className="my-auto py-4 space-y-5 text-left">
            {/* Question Text in Large Display Font */}
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-slate-900 dark:text-white leading-snug">
              {currentCard.concepto}
            </h2>

            {/* Answer Reveal Area */}
            {showAnswer ? (
              <div className="pt-3 pb-1 border-t border-slate-200 dark:border-slate-700/60 space-y-2 animate-fadeIn text-left">
                <span className="text-[11px] font-bold text-blue-600 dark:text-cyan-400 uppercase tracking-wider block">
                  Respuesta Didáctica
                </span>
                <p className="text-sm sm:text-base font-medium text-slate-700 dark:text-slate-200 leading-relaxed">
                  {currentCard.definicion}
                </p>
                {currentCard.ejemplo && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 italic pt-1">
                    Ejemplo: {currentCard.ejemplo}
                  </p>
                )}
              </div>
            ) : null}
          </div>

          {/* Card Bottom: Click instruction / Flip status */}
          <div className="flex items-center justify-between pt-2 text-xs text-slate-400 border-t border-slate-100 dark:border-slate-800">
            <span className="flex items-center gap-1.5 font-medium">
              <RotateCw className="w-3.5 h-3.5" />
              <span>{showAnswer ? 'Toca para ocultar respuesta' : 'Toca para ver respuesta'}</span>
            </span>
            {currentCard.subtitulo && (
              <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                {currentCard.subtitulo}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Controls Bar: Rating Buttons & Navigation Arrows */}
      <div className="flex items-center justify-between gap-3 pt-2">
        {/* Navigation Arrow Left */}
        <button
          onClick={handlePrev}
          disabled={currentIndex === 0}
          className="w-12 h-12 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#1a1f2c] text-slate-700 dark:text-slate-200 flex items-center justify-center transition active:scale-95 disabled:opacity-30 disabled:pointer-events-none hover:border-blue-500 dark:hover:border-cyan-400"
          title="Tarjeta anterior"
          aria-label="Tarjeta anterior"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        {/* Rating Button: "Para la próxima" (Sad face / Not understood) */}
        <button
          onClick={() => handleRateCard('perdido')}
          className="flex-1 py-3 px-3 sm:px-4 rounded-2xl bg-white dark:bg-[#1a1f2c] border-2 border-red-300 dark:border-red-500/40 hover:bg-red-50 dark:hover:bg-red-950/40 text-red-600 dark:text-red-400 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition active:scale-95 shadow-sm"
        >
          <span className="text-base sm:text-lg">🙁</span>
          <span className="truncate">Para la próxima</span>
          <span className="text-xs px-1.5 py-0.5 rounded-md bg-red-100 dark:bg-red-900/60 font-mono">
            {perdidoCount}
          </span>
        </button>

        {/* Rating Button: "Entendido" (Happy face / Understood) */}
        <button
          onClick={() => handleRateCard('entendido')}
          className="flex-1 py-3 px-3 sm:px-4 rounded-2xl bg-white dark:bg-[#1a1f2c] border-2 border-emerald-300 dark:border-emerald-500/40 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition active:scale-95 shadow-sm"
        >
          <span className="text-base sm:text-lg">😊</span>
          <span className="truncate">Entendido</span>
          <span className="text-xs px-1.5 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-900/60 font-mono">
            {entendidoCount}
          </span>
        </button>

        {/* Navigation Arrow Right */}
        <button
          onClick={handleNext}
          className="w-12 h-12 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#1a1f2c] text-slate-700 dark:text-slate-200 flex items-center justify-center transition active:scale-95 hover:border-blue-500 dark:hover:border-cyan-400"
          title={currentIndex + 1 < totalCards ? 'Siguiente tarjeta' : 'Finalizar mazo'}
          aria-label="Siguiente tarjeta"
        >
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
