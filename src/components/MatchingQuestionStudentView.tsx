import React, { useMemo } from 'react';
import { ExamQuestion } from '../types';
import { shuffleMatchingPairs } from '../utils/matchingPairsShuffler';

interface MatchingQuestionStudentViewProps {
  question: ExamQuestion;
  selectedAnswers?: Record<string, string>;
  onSelectAnswer?: (pairId: string, answerId: string) => void;
  disabled?: boolean;
  themeColor?: string;
  isBuilderPreview?: boolean;
  shuffleKey?: string | number;
}

export const MatchingQuestionStudentView: React.FC<MatchingQuestionStudentViewProps> = ({
  question,
  selectedAnswers = {},
  onSelectAnswer,
  disabled = false,
  isBuilderPreview = false,
  shuffleKey,
}) => {
  const pairs = question.paresRelacion || [];

  // Firma estable para que useMemo mantenga el orden desordenado mientras el alumno o docente responde,
  // pero recalcule si cambian los pares o el usuario fuerza un nuevo intento/toggle.
  const pairsSignature = useMemo(() => {
    return (
      (shuffleKey !== undefined ? `${shuffleKey}_` : '') +
      pairs.map((p) => `${p.id}:${p.fraseIzquierda}:${p.respuestaDerecha}`).join('|')
    );
  }, [pairs, shuffleKey]);

  const { shuffledQuestions, shuffledAnswers } = useMemo(() => {
    return shuffleMatchingPairs(pairs);
  }, [pairsSignature]);

  if (pairs.length === 0) {
    return (
      <div className="p-3 text-center text-xs text-slate-400 italic bg-slate-50 rounded-xl">
        No se han configurado pares de relación para este reactivo.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {shuffledQuestions.map((pair, pIdx) => {
        const currentValue = selectedAnswers[pair.id] || '';
        return (
          <div
            key={pair.id}
            className={`grid grid-cols-1 sm:grid-cols-12 gap-2 items-center p-2.5 rounded-xl border transition-all ${
              isBuilderPreview
                ? 'bg-amber-50/50 border-amber-200/80 text-xs'
                : 'bg-slate-50 border-slate-200 text-xs'
            }`}
          >
            {/* Columna A: Frase / Concepto (Desordenada) */}
            <div className="sm:col-span-5 flex items-center gap-2">
              <span
                className={`w-5 h-5 rounded-full font-mono font-bold text-[11px] flex items-center justify-center shrink-0 ${
                  isBuilderPreview
                    ? 'bg-amber-200 text-amber-950'
                    : 'bg-indigo-100 text-indigo-900'
                }`}
              >
                {pIdx + 1}
              </span>
              <span className="text-xs font-semibold text-slate-800 break-words">
                {pair.fraseIzquierda || `Frase ${pIdx + 1}`}
              </span>
            </div>

            {/* Conector */}
            <div
              className={`sm:col-span-1 text-center font-bold text-xs ${
                isBuilderPreview ? 'text-amber-700' : 'text-slate-400'
              }`}
            >
              ⟷
            </div>

            {/* Columna B: Desplegable de Respuestas (Desordenadas y con Derangement garantizado) */}
            <div className="sm:col-span-6">
              <select
                disabled={disabled}
                value={currentValue}
                onChange={(e) => onSelectAnswer?.(pair.id, e.target.value)}
                className={`w-full px-2.5 py-1.5 bg-white border rounded-lg text-xs font-medium focus:outline-none focus:ring-2 ${
                  isBuilderPreview
                    ? 'border-amber-300 focus:ring-amber-500'
                    : 'border-slate-300 focus:ring-indigo-500'
                } ${disabled ? 'opacity-60 cursor-not-allowed bg-slate-100' : 'cursor-pointer'}`}
              >
                <option value="">Seleccionar respuesta...</option>
                {shuffledAnswers.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.respuestaDerecha || 'Opción sin texto'}
                  </option>
                ))}
              </select>
            </div>
          </div>
        );
      })}
    </div>
  );
};
