import { ExamMatchingPair } from '../types';

export interface ShuffledMatchingResult {
  shuffledQuestions: ExamMatchingPair[];
  shuffledAnswers: { id: string; respuestaDerecha: string }[];
}

/**
 * Desordena tanto las preguntas (frases de la izquierda) como las respuestas (opciones de la derecha/desplegable).
 * Garantiza de forma estricta que NINGUNA pregunta quede alineada en la misma fila con su respuesta correcta
 * (derangement matemático: para todo índice i, shuffledAnswers[i].id !== shuffledQuestions[i].id cuando hay 2 o más pares).
 */
export function shuffleMatchingPairs(pairs: ExamMatchingPair[]): ShuffledMatchingResult {
  if (!pairs || pairs.length === 0) {
    return { shuffledQuestions: [], shuffledAnswers: [] };
  }

  // Si solo hay un par, no es posible un derangement (desordenamiento cruzado sin puntos fijos)
  if (pairs.length === 1) {
    return {
      shuffledQuestions: [...pairs],
      shuffledAnswers: [{ id: pairs[0].id, respuestaDerecha: pairs[0].respuestaDerecha }],
    };
  }

  const shuffleArray = <T>(arr: T[]): T[] => {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  };

  // 1. Desordenar preguntas (Columna A / frases de la izquierda)
  let shuffledQuestions = shuffleArray(pairs);
  let qAttempts = 0;
  // Asegurar que el orden de las preguntas sea diferente al orden original de captura
  while (
    qAttempts < 25 &&
    shuffledQuestions.every((p, i) => p.id === pairs[i].id)
  ) {
    shuffledQuestions = shuffleArray(pairs);
    qAttempts++;
  }
  // Si por azar coincidió con el orden original, forzar desplazamiento
  if (shuffledQuestions.every((p, i) => p.id === pairs[i].id)) {
    shuffledQuestions = [
      ...shuffledQuestions.slice(1),
      shuffledQuestions[0],
    ];
  }

  // 2. Desordenar respuestas (Columna B / opciones en el desplegable)
  // Requisito: "no pueden quedar alineada la pregunta con su respuesta"
  // Derangement respecto a shuffledQuestions:
  // Para cada índice i (0 <= i < N), shuffledAnswers[i].id !== shuffledQuestions[i].id.
  const baseAnswers = pairs.map((p) => ({
    id: p.id,
    respuestaDerecha: p.respuestaDerecha,
  }));

  const isStrictDerangement = (
    questions: ExamMatchingPair[],
    answers: { id: string; respuestaDerecha: string }[]
  ): boolean => {
    return answers.every((ans, idx) => {
      const q = questions[idx];
      if (!q) return true;
      if (ans.id === q.id) return false;
      // Si tienen texto y son respuestas diferentes en el ejercicio, tampoco deben coincidir en texto
      if (
        ans.respuestaDerecha &&
        q.respuestaDerecha &&
        ans.respuestaDerecha.trim().toLowerCase() === q.respuestaDerecha.trim().toLowerCase()
      ) {
        return false;
      }
      return true;
    });
  };

  let shuffledAnswers = shuffleArray(baseAnswers);
  let aAttempts = 0;
  while (aAttempts < 100 && !isStrictDerangement(shuffledQuestions, shuffledAnswers)) {
    shuffledAnswers = shuffleArray(baseAnswers);
    aAttempts++;
  }

  // Si no se obtuvo derangement por azar en 100 intentos, aplicar desplazamiento cíclico garantizado:
  if (!isStrictDerangement(shuffledQuestions, shuffledAnswers)) {
    // Un shift de 1 posición hacia adelante garantiza que nextIdx = (i + 1) % N !== i (para N >= 2)
    // por lo que ningún elemento queda en su propia posición i.
    const shift = 1 + Math.floor(Math.random() * (shuffledQuestions.length - 1)); // 1 <= shift < N
    shuffledAnswers = shuffledQuestions.map((_, i) => {
      const targetIdx = (i + shift) % shuffledQuestions.length;
      return {
        id: shuffledQuestions[targetIdx].id,
        respuestaDerecha: shuffledQuestions[targetIdx].respuestaDerecha,
      };
    });
  }

  return { shuffledQuestions, shuffledAnswers };
}
