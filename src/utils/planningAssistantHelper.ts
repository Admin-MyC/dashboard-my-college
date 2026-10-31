import { AcademicLevel, TeacherActivityWeekPlan } from '../types';

export interface PiagetStageProfile {
  etapaNombre: string;
  faseNEM: string;
  rangoEdad: string;
  descripcionCognitiva: string;
  estrategiaPiaget: string;
  andamiajeBruner: string;
}

export const NEM_CAMPOS_FORMATIVOS = [
  'Lenguajes',
  'Saberes y Pensamiento Científico',
  'Ética, Naturaleza y Sociedades',
  'De lo Humano y lo Comunitario',
] as const;

export const NEM_EJES_ARTICULADORES = [
  'Inclusión',
  'Pensamiento crítico',
  'Interculturalidad crítica',
  'Igualdad de género',
  'Vida saludable',
  'Apropiación de las culturas a través de la lectura y la escritura',
  'Artes y experiencias estéticas',
] as const;

export const NEM_METODOLOGIAS_SOCIOCRITICAS = [
  'Aprendizaje Basado en Proyectos Comunitarios (ABPC)',
  'Aprendizaje Basado en Indagación (STEAM como enfoque)',
  'Aprendizaje Basado en Problemas (ABP)',
  'Aprendizaje Servicio (AS)',
] as const;

export const NEM_ESCENARIOS = [
  'Proyectos de Aula',
  'Proyectos Escolares',
  'Proyectos Comunitarios',
] as const;

export const inferCampoYMetodologiaNEM = (materia: string): {
  campoFormativo: string;
  metodologia: string;
  ejesSugeridos: string[];
} => {
  const m = (materia || '').toLowerCase();
  if (
    m.includes('matem') ||
    m.includes('cienc') ||
    m.includes('físic') ||
    m.includes('fisic') ||
    m.includes('quím') ||
    m.includes('quim') ||
    m.includes('biolog') ||
    m.includes('tecnolog') ||
    m.includes('robót')
  ) {
    return {
      campoFormativo: 'Saberes y Pensamiento Científico',
      metodologia: 'Aprendizaje Basado en Indagación (STEAM como enfoque)',
      ejesSugeridos: ['Pensamiento crítico', 'Inclusión', 'Vida saludable'],
    };
  }
  if (
    m.includes('histori') ||
    m.includes('geograf') ||
    m.includes('cívic') ||
    m.includes('civic') ||
    m.includes('ética') ||
    m.includes('etica') ||
    m.includes('social') ||
    m.includes('naturaleza')
  ) {
    return {
      campoFormativo: 'Ética, Naturaleza y Sociedades',
      metodologia: 'Aprendizaje Basado en Problemas (ABP)',
      ejesSugeridos: ['Pensamiento crítico', 'Interculturalidad crítica', 'Igualdad de género'],
    };
  }
  if (
    m.includes('educación física') ||
    m.includes('deport') ||
    m.includes('socioemocional') ||
    m.includes('tutoría') ||
    m.includes('vida saludable') ||
    m.includes('humano')
  ) {
    return {
      campoFormativo: 'De lo Humano y lo Comunitario',
      metodologia: 'Aprendizaje Servicio (AS)',
      ejesSugeridos: ['Vida saludable', 'Inclusión', 'Igualdad de género'],
    };
  }
  return {
    campoFormativo: 'Lenguajes',
    metodologia: 'Aprendizaje Basado en Proyectos Comunitarios (ABPC)',
    ejesSugeridos: [
      'Apropiación de las culturas a través de la lectura y la escritura',
      'Pensamiento crítico',
      'Artes y experiencias estéticas',
    ],
  };
};

export const getPiagetStageForLevelAndGrade = (
  nivel?: AcademicLevel,
  gradoGrupo?: string
): PiagetStageProfile => {
  const cleanNivel = (nivel || 'Primaria').trim();
  const cleanGrade = (gradoGrupo || '1° A').trim();
  const gradeNumMatch = cleanGrade.match(/([1-6])/);
  const gradeNum = gradeNumMatch ? Number(gradeNumMatch[1]) : 1;

  if (cleanNivel === 'Preescolar') {
    return {
      etapaNombre: 'Etapa Preoperacional (Jean Piaget · 3 a 6 años)',
      faseNEM: 'Fase 2 · Educación Preescolar (1°, 2° y 3°)',
      rangoEdad: '3 a 6 años',
      descripcionCognitiva:
        'Pensamiento simbólico e intuitivo, aprendizaje centrado en el juego, la exploración sensorial, el lenguaje oral y la manipulación directa de objetos.',
      estrategiaPiaget:
        'Partir de experiencias concretas e inmediatas (asimilación lúdica), plantear retos visuales sencillos (conflicto cognitivo guiado) y consolidar hábitos y nociones mediante canciones, cuentos y clasificación de objetos.',
      andamiajeBruner:
        'Andamiaje intensivo y modelado paso a paso en currículum en espiral: 1° manipulación psicomotriz (Enactivo), 2° láminas e ilustraciones (Icónico), 3° expresión verbal y trazos iniciales (Simbólico).',
    };
  }

  if (cleanNivel === 'Primaria' && gradeNum <= 2) {
    return {
      etapaNombre: `Transición Preoperacional a Operaciones Concretas (${gradeNum}° de Primaria · 6 a 8 años)`,
      faseNEM: `Fase 3 · Educación Primaria (${gradeNum}° Grado · 1° y 2° de Primaria)`,
      rangoEdad: '6 a 8 años',
      descripcionCognitiva:
        'Inicio de la conservación, seriación y clasificación lógica con apoyo de material concreto, regletas, fichas, dibujos y situaciones cotidianas cercanas al alumno.',
      estrategiaPiaget:
        'Activar saberes previos con objetos manipulables (Asimilación), introducir preguntas detonadoras que retan la percepción inmediata (Acomodación) y construir reglas sencillas en equipo (Equilibración).',
      andamiajeBruner:
        'Aprendizaje por descubrimiento guiado: Semana 1 con juegos y material manipulable (Modo Enactivo), Semana 2 con esquemas visuales y pictogramas (Modo Icónico), Semana 3 con lectoescritura y símbolos numéricos (Modo Simbólico).',
    };
  }

  if (cleanNivel === 'Primaria' && (gradeNum === 3 || gradeNum === 4)) {
    return {
      etapaNombre: `Etapa de Operaciones Concretas (${gradeNum}° de Primaria · 8 a 10 años)`,
      faseNEM: `Fase 4 · Educación Primaria (${gradeNum}° Grado · 3° y 4° de Primaria)`,
      rangoEdad: '8 a 10 años',
      descripcionCognitiva:
        'Dominio de relaciones causa-efecto, reversibilidad del pensamiento, clasificación jerárquica, operaciones lógicas y trabajo colaborativo sobre situaciones de su comunidad.',
      estrategiaPiaget:
        'Vincular conceptos con fenómenos observables (Asimilación), presentar problemas con múltiples variables concretas (Conflicto Cognitivo / Acomodación) y sistematizar conclusiones verificables (Equilibración).',
      andamiajeBruner:
        'Currículum en espiral con retiro progresivo de ayudas: Semana 1 experimentación práctica (Enactivo), Semana 2 mapas mentales, tablas y modelos gráficos (Icónico), Semana 3 formulación de conceptos y exposición (Simbólico).',
    };
  }

  if (cleanNivel === 'Primaria' && gradeNum >= 5) {
    return {
      etapaNombre: `Operaciones Concretas Avanzadas hacia Abstracción (${gradeNum}° de Primaria · 10 a 12 años)`,
      faseNEM: `Fase 5 · Educación Primaria (${gradeNum}° Grado · 5° y 6° de Primaria)`,
      rangoEdad: '10 a 12 años',
      descripcionCognitiva:
        'Consolidación de operaciones lógicas complejas, proporcionalidad, pensamiento crítico comunitario y transición hacia la formulación de hipótesis.',
      estrategiaPiaget:
        'Relacionar saberes previos con problemáticas del entorno escolar/comunitario (Asimilación), contrastar fuentes y evidencias (Conflicto Cognitivo y Acomodación) y proponer soluciones argumentadas (Equilibración).',
      andamiajeBruner:
        'Andamiaje colaborativo en espiral: Semana 1 indagación empírica en aula/comunidad (Enactivo), Semana 2 modelado gráfico, gráficas e infografías (Icónico), Semana 3 formalización simbólica y socialización del proyecto (Simbólico).',
    };
  }

  if (cleanNivel === 'Secundaria') {
    return {
      etapaNombre: `Etapa de Operaciones Formales Iniciales (${gradeNum}° de Secundaria · 12 a 15 años)`,
      faseNEM: `Fase 6 · Educación Secundaria (${gradeNum}° Grado · 1°, 2° y 3° de Secundaria)`,
      rangoEdad: '12 a 15 años',
      descripcionCognitiva:
        'Desarrollo del pensamiento hipotético-deductivo, abstracción progresiva, formulación de hipótesis, debate argumentado y análisis crítico de problemas.',
      estrategiaPiaget:
        'Conectar experiencias previas con dilemas o retos reales (Asimilación), confrontar hipótesis mediante contraejemplos y experimentación (Conflicto Cognitivo y Acomodación) y construir modelos explicativos formales (Equilibración).',
      andamiajeBruner:
        'Descubrimiento inductivo y andamiaje colaborativo entre pares: Semana 1 laboratorio / simulación práctica (Enactivo), Semana 2 diagramas de flujo, gráficas e infografías (Icónico), Semana 3 formalización teórica, ensayo o demostración (Simbólico).',
    };
  }

  return {
    etapaNombre: `Etapa de Operaciones Formales Avanzadas (${cleanGrade} ${cleanNivel} · 15 a 18 años)`,
    faseNEM: `Educación Media Superior · Marco Curricular Común NEM (${cleanGrade})`,
    rangoEdad: '15 a 18 años',
    descripcionCognitiva:
      'Pensamiento abstracto, metacognición, investigación científica, modelado matemático/verbal riguroso y transferencia interdisciplinaria.',
    estrategiaPiaget:
      'Diagnosticar marcos conceptuales previos (Asimilación), plantear casos complejos o paradojas disciplinares (Conflicto Cognitivo / Acomodación) y sintetizar soluciones fundamentadas teóricamente (Equilibración).',
    andamiajeBruner:
      'Andamiaje de transferencia autónoma en espiral: Semana 1 prototipado o estudio de caso empírico (Enactivo), Semana 2 modelado esquemático y analítico (Icónico), Semana 3 producción académica formal y defensa argumentativa (Simbólico).',
  };
};

export interface GeneratedPiagetBrunerPlan {
  tituloSugerido: string;
  etapaPiaget: string;
  modalidadBruner: string;
  faseNEM: string;
  campoFormativoNEM: string;
  ejesArticuladoresNEM: string[];
  metodologiaDidacticaNEM: string;
  escenarioNEM: string;
  contenidoProgramaSinteticoNEM: string;
  pdaNEM: string;
  problematizacionProgramaAnaliticoNEM: string;
  evaluacionFormativaNEM: string;
  objetivoGeneral: string;
  entregablesEvaluacion: string;
  semanasDetalle: TeacherActivityWeekPlan[];
}

export const generatePiagetBrunerThreeWeekPlan = (params: {
  nivel?: AcademicLevel;
  gradoGrupo: string;
  materia: string;
  temaCentral: string;
  contextoGrupo?: string;
  campoFormativoNEM?: string;
  metodologiaDidacticaNEM?: string;
  escenarioNEM?: string;
  ejesArticuladoresNEM?: string[];
}): GeneratedPiagetBrunerPlan => {
  const {
    nivel = 'Primaria',
    gradoGrupo,
    materia,
    temaCentral,
    contextoGrupo,
  } = params;
  const cleanTema = temaCentral.trim() || `Contenidos Fundamentales de ${materia}`;
  const cleanMateria = materia.trim() || 'Materia General';
  const cleanGrupo = gradoGrupo.trim() || '1° A';
  const profile = getPiagetStageForLevelAndGrade(nivel, cleanGrupo);
  const inferredNEM = inferCampoYMetodologiaNEM(cleanMateria);

  const finalCampo = params.campoFormativoNEM || inferredNEM.campoFormativo;
  const finalMetodologia = params.metodologiaDidacticaNEM || inferredNEM.metodologia;
  const finalEscenario = params.escenarioNEM || 'Proyectos de Aula';
  const finalEjes =
    params.ejesArticuladoresNEM && params.ejesArticuladoresNEM.length > 0
      ? params.ejesArticuladoresNEM
      : inferredNEM.ejesSugeridos;

  const contextoNota = contextoGrupo?.trim()
    ? ` Considerando el diagnóstico del grupo (${contextoGrupo.trim()}).`
    : '';

  const tituloSugerido = `Proyecto NEM 3 Semanas (Piaget-Bruner): ${cleanTema}`;

  const contenidoProgramaSinteticoNEM =
    `Estudio, comprensión y aplicación de "${cleanTema}" desde la asignatura de ${cleanMateria}, articulado al Campo Formativo "${finalCampo}" (${profile.faseNEM}).`;

  const pdaNEM =
    `Los alumnos de ${cleanGrupo} (${nivel}) indagan, representan y explican de manera gradual los principios de "${cleanTema}", ` +
    `transitando de la manipulación concreta (Bruner Enactivo) a la modelación visual (Icónico) y la argumentación formal (Simbólico) para resolver situaciones reales en su entorno (${finalEscenario}).`;

  const problematizacionProgramaAnaliticoNEM =
    `En el grupo ${cleanGrupo} se identificó la necesidad de fortalecer la comprensión profunda y contextualizada de "${cleanTema}" evitando la memorización mecánica. ` +
    `Se vincula con la metodología "${finalMetodologia}" en el escenario de ${finalEscenario} y los ejes articuladores (${finalEjes.join(', ')}).` +
    contextoNota;

  const objetivoGeneral =
    `Desarrollar el Proceso de Desarrollo de Aprendizaje (PDA) sobre "${cleanTema}" en los alumnos de ${cleanGrupo} (${profile.faseNEM} · Campo Formativo: ${finalCampo}), ` +
    `articulando la metodología sociocrítica "${finalMetodologia}" de la Nueva Escuela Mexicana con el desarrollo cognitivo de Jean Piaget (${profile.etapaNombre}) ` +
    `y el andamiaje en espiral de 3 semanas de Jerome Bruner (Enactivo → Icónico → Simbólico).`;

  const semanasDetalle: TeacherActivityWeekPlan[] = [
    {
      semanaNumero: 1,
      etiquetaSemana: 'Semana 1 · Punto de Partida, Saberes Previos y Exploración Enactiva',
      enfoqueBruner:
        'Fase Enactiva (Jerome Bruner): Aprendizaje por medio de la acción, manipulación directa, indagación vivencial y contacto tangible con el fenómeno.',
      enfoquePiaget:
        'Asimilación y Activación de Esquemas Previos (Jean Piaget): Recuperación de saberes comunitarios y escolares previos del alumno mediante preguntas detonadoras.',
      actividadesInicioDesarrolloCierre:
        `• INICIO (Problematización NEM y Asimilación - Piaget): Presentación de la situación o reto del ${finalEscenario} en ${cleanGrupo} sobre "${cleanTema}". Recuperación de saberes previos.\n` +
        `• DESARROLLO (Representación Enactiva - Bruner / Metodología ${finalMetodologia}): Actividad práctica, manipulativa y experimental donde los estudiantes interactúan con materiales concretos o casos vivenciales de ${cleanMateria}.\n` +
        `• CIERRE (Acuerdos de Indagación): Registro en bitácora de los primeros hallazgos concretos y organización de equipos para la siguiente semana.`,
      materialesYAndamiaje:
        `Material concreto manipulable acorde a ${cleanGrupo} (${profile.faseNEM}), Libros de Texto Gratuitos / recursos de ${finalEscenario} y andamiaje docente cercano.`,
      productoSemanal:
        `Bitácora de indagación vivencial y evidencia manipulativa inicial sobre "${cleanTema}".`,
    },
    {
      semanaNumero: 2,
      etiquetaSemana: 'Semana 2 · Indagación, Conflicto Cognitivo y Representación Icónica',
      enfoqueBruner:
        'Fase Icónica (Jerome Bruner): Estructuración del pensamiento mediante esquemas visuales, diagramas, mapas conceptuales, tablas comparativas e ilustraciones.',
      enfoquePiaget:
        'Conflicto Cognitivo y Acomodación (Jean Piaget): Retos analíticos que llevan al estudiante a reorganizar sus esquemas previos y descubrir relaciones lógicas.',
      actividadesInicioDesarrolloCierre:
        `• INICIO (Conflicto Cognitivo - Piaget): Planteamiento de una pregunta o caso desafiante sobre "${cleanTema}" vinculado a los ejes (${finalEjes.join(', ')}) que requiere analizar causas y efectos.\n` +
        `• DESARROLLO (Representación Icónica - Bruner): Construcción colaborativa de organizadores gráficos, infografías, esquemas ilustrados o modelos visuales que expliquen el funcionamiento de "${cleanTema}" en ${cleanMateria}.\n` +
        `• CIERRE (Acomodación y Retroalimentación Formativa): Puesta en común de los modelos visuales entre equipos y retroalimentación docente para afinar conceptos.`,
      materialesYAndamiaje:
        `Organizadores gráficos, láminas, esquemas comparativos, fuentes de consulta y andamiaje colaborativo entre pares.`,
      productoSemanal:
        `Organizador gráfico / Infografía / Modelo visual en equipo sobre "${cleanTema}".`,
    },
    {
      semanaNumero: 3,
      etiquetaSemana: 'Semana 3 · Socialización, Abstracción Simbólica y Metacognición',
      enfoqueBruner:
        'Fase Simbólica y Currículum en Espiral (Jerome Bruner): Dominio del lenguaje formal, reglas, conceptos abstractos, producción escrita y transferencia comunitaria.',
      enfoquePiaget:
        'Equilibración Mayorante y Metacognición (Jean Piaget): Síntesis autónoma del aprendizaje, evaluación formativa y reflexión crítica sobre lo aprendido.',
      actividadesInicioDesarrolloCierre:
        `• INICIO (Puente Icónico-Simbólico): Integración en espiral de lo vivido en las Semanas 1 y 2 hacia la formalización conceptual del PDA de ${cleanMateria}.\n` +
        `• DESARROLLO (Representación Simbólica - Bruner): Elaboración y presentación del producto final del proyecto (${finalEscenario}), resolución formal de ejercicios o propuesta de solución sobre "${cleanTema}" por los alumnos de ${cleanGrupo}.\n` +
        `• CIERRE (Evaluación Formativa NEM y Equilibración - Piaget): Asamblea de aula para valorar logros, autoevaluación, coevaluación y reflexión metacognitiva ("¿Cómo transformamos nuestro saber durante las 3 semanas?").`,
      materialesYAndamiaje:
        `Rúbrica formativa NEM, lista de cotejo, portafolio de evidencias y retiro gradual del andamiaje (autonomía del alumno).`,
      productoSemanal:
        `Producto integrador del proyecto (${finalEscenario}), demostración formal y autoevaluación reflexiva de "${cleanTema}".`,
    },
  ];

  const evaluacionFormativaNEM =
    `Evaluación formativa continua (NEM): Observación sistemática en bitácora docente, lista de cotejo por semana, rúbrica del PDA y ejercicios de autoevaluación y coevaluación en asamblea de grupo.`;

  const entregablesEvaluacion =
    `1) Semana 1 (Enactivo · Asimilación): Bitácora y práctica manipulativa inicial.\n` +
    `2) Semana 2 (Icónico · Acomodación): Esquema visual, mapa o modelo gráfico colaborativo.\n` +
    `3) Semana 3 (Simbólico · Equilibración): Producto integrador del ${finalEscenario} y rúbrica de Evaluación Formativa NEM.`;

  return {
    tituloSugerido,
    etapaPiaget: profile.etapaNombre,
    modalidadBruner: 'Currículum en Espiral (Enactivo → Icónico → Simbólico · 3 Semanas)',
    faseNEM: profile.faseNEM,
    campoFormativoNEM: finalCampo,
    ejesArticuladoresNEM: finalEjes,
    metodologiaDidacticaNEM: finalMetodologia,
    escenarioNEM: finalEscenario,
    contenidoProgramaSinteticoNEM,
    pdaNEM,
    problematizacionProgramaAnaliticoNEM,
    evaluacionFormativaNEM,
    objetivoGeneral,
    entregablesEvaluacion,
    semanasDetalle,
  };
};
