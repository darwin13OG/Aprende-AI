import React, { useState } from 'react';
import { MathMarkdown } from './MathMarkdown.tsx';
import { QuizQuestion, ActiveTab } from '../types.ts';
import {
  Check,
  X,
  ArrowRight,
  RotateCcw,
  Trophy,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

interface QuizViewProps {
  questions: QuizQuestion[];
  topicTitle: string;
  onShareProgress: () => void;
  onResetQuiz: () => void;
  onGoToTab: (tab: ActiveTab) => void;
}

export const QuizView: React.FC<QuizViewProps> = ({
  questions,
  topicTitle,
  onResetQuiz,
  onGoToTab,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [answersState, setAnswersState] = useState<
    Array<{ selected: number; correct: boolean }>
  >([]);
  const [showSummary, setShowSummary] = useState(false);

  if (!questions || questions.length === 0) {
    return (
      <div className="w-full max-w-md mx-auto px-4 py-16 text-center space-y-4 animate-fadeIn">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-white dark:bg-[#0b1528] border border-slate-200 dark:border-cyan-500/30 flex items-center justify-center text-blue-600 dark:text-cyan-400 shadow-sm">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Sin cuestionario generado</h2>
        <p className="text-xs text-slate-500 dark:text-slate-300 leading-relaxed">
          Este entorno aún no tiene preguntas generadas. Sube tus fuentes o notas en la pestaña Chat/Entorno para que la IA cree tu cuestionario.
        </p>
        <button
          onClick={() => onGoToTab('entorno')}
          className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-sm transition active:scale-95"
        >
          Ir a Chat y Subir Fuentes
        </button>
      </div>
    );
  }

  const currentQ = questions[currentIndex] || questions[0];
  const totalQuestions = questions.length;
  const isAnswered = selectedOption !== null;

  const handleSelectOption = (idx: number) => {
    if (isAnswered) return;
    setSelectedOption(idx);
    const isCorrect = idx === currentQ.correcta;
    setAnswersState((prev) => [...prev, { selected: idx, correct: isCorrect }]);
  };

  const handleNextQuestion = () => {
    if (currentIndex + 1 < totalQuestions) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedOption(null);
    } else {
      setShowSummary(true);
    }
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setSelectedOption(null);
    setAnswersState([]);
    setShowSummary(false);
    onResetQuiz();
  };

  const correctCount = answersState.filter((a) => a.correct).length;
  const progressPercent = Math.round(((currentIndex + (isAnswered ? 1 : 0)) / totalQuestions) * 100);

  // Summary Screen when completed
  if (showSummary) {
    const accuracy = Math.round((correctCount / totalQuestions) * 100);

    return (
      <div className="w-full max-w-lg mx-auto px-4 pb-28 pt-8 space-y-6 animate-fadeIn text-center">
        <div className="rounded-3xl bg-white dark:bg-[#0b1528] border border-slate-200 dark:border-cyan-500/25 p-6 sm:p-8 space-y-5 shadow-lg">
          <div className="w-20 h-20 mx-auto rounded-3xl bg-blue-50 dark:bg-cyan-950/70 border border-blue-200 dark:border-cyan-500/40 flex items-center justify-center text-blue-600 dark:text-cyan-400">
            <Trophy className="w-10 h-10" />
          </div>

          <div className="space-y-1">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              ¡Cuestionario Completado!
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Tema: <span className="font-bold text-slate-800 dark:text-slate-200">{topicTitle}</span>
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 py-2">
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#070d1a] border border-slate-200 dark:border-cyan-500/20">
              <span className="text-[11px] text-slate-400 font-semibold block uppercase">Aciertos</span>
              <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                {correctCount} / {totalQuestions}
              </span>
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#070d1a] border border-slate-200 dark:border-cyan-500/20">
              <span className="text-[11px] text-slate-400 font-semibold block uppercase">Precisión</span>
              <span className="text-2xl font-black text-blue-600 dark:text-cyan-400">{accuracy}%</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              onClick={handleRestart}
              className="flex-1 py-3 px-4 rounded-xl bg-slate-100 dark:bg-[#070d1a] border border-slate-300 dark:border-cyan-500/30 hover:border-blue-500 text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center justify-center gap-2 transition"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reintentar Test</span>
            </button>
            <button
              onClick={() => onGoToTab('cards')}
              className="flex-1 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white shadow-sm flex items-center justify-center gap-2 transition"
            >
              <span>Practicar Flashcards</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  const optionLetters = ['A', 'B', 'C', 'D'];

  return (
    <div className="w-full max-w-xl mx-auto px-4 pb-28 pt-4 space-y-4 animate-fadeIn">
      {/* Progress Line */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-semibold">
          <span className="text-blue-600 dark:text-cyan-400 font-bold">
            Pregunta {currentIndex + 1} de {totalQuestions}
          </span>
          <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{correctCount} correctas</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-[#0d172a] overflow-hidden">
          <div
            className="h-full bg-blue-600 dark:bg-cyan-400 transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Main Question Card */}
      <div className="rounded-3xl bg-white dark:bg-[#0b1528] border border-slate-200 dark:border-cyan-500/25 p-5 sm:p-6 space-y-4 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="w-7 h-7 rounded-xl bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-500/40 text-blue-600 dark:text-cyan-400 flex items-center justify-center font-bold text-xs flex-shrink-0 mt-0.5">
            {currentIndex + 1}
          </div>
          <div className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-snug text-left flex-1">
            <MathMarkdown content={currentQ.pregunta} />
          </div>
        </div>

        {/* Options List */}
        <div className="space-y-2.5 pt-2">
          {currentQ.opciones.map((opcion, idx) => {
            const letter = optionLetters[idx] || `${idx + 1}`;
            const isSelected = selectedOption === idx;
            const isTargetCorrect = idx === currentQ.correcta;

            let cardStyles =
              'border-slate-200 dark:border-cyan-500/20 bg-slate-50 dark:bg-[#070d1a] hover:border-blue-400 dark:hover:border-cyan-400 text-slate-800 dark:text-slate-200';
            let circleStyles = 'border-slate-300 dark:border-slate-600 text-slate-500 dark:text-slate-400';

            if (isAnswered) {
              if (isTargetCorrect) {
                cardStyles =
                  'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-white font-semibold';
                circleStyles = 'border-emerald-500 text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950';
              } else if (isSelected && !isTargetCorrect) {
                cardStyles =
                  'border-red-500 bg-red-50 dark:bg-red-950/40 text-red-900 dark:text-slate-200';
                circleStyles = 'border-red-500 text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-950';
              } else {
                cardStyles = 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#070d1a]/50 opacity-60 text-slate-400';
              }
            }

            return (
              <button
                key={idx}
                onClick={() => handleSelectOption(idx)}
                disabled={isAnswered}
                className={`w-full p-3.5 rounded-2xl border flex items-center gap-3 text-left transition-all active:scale-[0.99] cursor-pointer ${cardStyles}`}
              >
                <span
                  className={`w-7 h-7 rounded-xl border flex items-center justify-center font-bold text-xs flex-shrink-0 transition-colors ${circleStyles}`}
                >
                  {isAnswered && isTargetCorrect ? (
                    <Check className="w-4 h-4 stroke-[3]" />
                  ) : isAnswered && isSelected && !isTargetCorrect ? (
                    <X className="w-4 h-4 stroke-[3]" />
                  ) : (
                    letter
                  )}
                </span>
                <div className="text-xs sm:text-sm font-medium leading-relaxed flex-1">
                  <MathMarkdown content={opcion} />
                </div>
              </button>
            );
          })}
        </div>

        {/* Answer Explanation */}
        {isAnswered && (
          <div className="p-4 rounded-2xl bg-blue-50/70 dark:bg-[#071329] border border-blue-200 dark:border-cyan-500/30 space-y-1.5 animate-fadeIn text-left">
            <span className="text-[11px] font-bold text-blue-600 dark:text-cyan-400 uppercase tracking-wider block">
              Explicación Didáctica
            </span>
            <div className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
              <MathMarkdown content={currentQ.explicacion} />
            </div>
          </div>
        )}

        {/* Continue Button */}
        {isAnswered && (
          <div className="pt-2">
            <button
              onClick={handleNextQuestion}
              className="w-full py-3 px-4 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-sm flex items-center justify-center gap-2 transition active:scale-[0.98]"
            >
              <span>
                {currentIndex + 1 < totalQuestions ? 'Siguiente Pregunta' : 'Ver Resultados del Test'}
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
