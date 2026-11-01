import { jsPDF } from 'jspdf';
import {
  College,
  GradeRecord,
  Student,
  Subject,
  Teacher,
  AcademicLevel,
  EvaluationPeriodicity,
  EVALUATION_PERIODICITY_CONFIG,
} from '../types';
import { resolveStudentTeacherName } from './reportCardDesignHelper';

export function resolveStudentEffectiveLevel(
  student: Student,
  college?: College | null
): AcademicLevel {
  if (student.nivel) return student.nivel;
  const colNivel = (college?.nivel || '').trim().toLowerCase();
  if (colNivel === 'preescolar') return 'Preescolar';
  if (colNivel === 'primaria') return 'Primaria';
  if (colNivel === 'secundaria') return 'Secundaria';
  if (colNivel === 'preparatoria') return 'Preparatoria';
  if (student.grado === '4°' || student.grado === '5°' || student.grado === '6°') {
    return 'Primaria';
  }
  return 'Primaria';
}

export function resolveSubjectEffectiveLevel(
  sub: Subject,
  college?: College | null
): AcademicLevel {
  if (sub.nivel) return sub.nivel;
  const lower = (sub.grado || '').toLowerCase();
  if (lower.includes('preescolar')) return 'Preescolar';
  if (lower.includes('secundaria')) return 'Secundaria';
  if (lower.includes('preparatoria') || lower.includes('bachillerato')) return 'Preparatoria';
  if (lower.includes('primaria')) return 'Primaria';
  const colNivel = (college?.nivel || '').trim().toLowerCase();
  if (colNivel === 'preescolar') return 'Preescolar';
  if (colNivel === 'secundaria') return 'Secundaria';
  if (colNivel === 'preparatoria') return 'Preparatoria';
  return 'Primaria';
}

/**
 * Obtiene únicamente las materias dadas de alta en el módulo Materias y Grupos
 * que corresponden al nivel/grado/grupo asignado al alumno.
 * Si una materia no tiene calificación registrada aún, se muestra con 0.0.
 */
export function getEffectiveGradesForStudent(params: {
  student: Student;
  college: College;
  grades: GradeRecord[];
  subjects?: Subject[];
  teachers?: Teacher[];
  hasSavedPeriods?: boolean;
  savedPeriods?: Array<{ periodicidad: EvaluationPeriodicity; periodoIndex: number }>;
}): GradeRecord[] {
  const {
    student,
    college,
    grades,
    subjects = [],
    hasSavedPeriods = true,
    savedPeriods,
  } = params;
  const stLevel = resolveStudentEffectiveLevel(student, college);
  const stGrado = (student.grado || '').trim();
  const stGrupo = (student.grupo || '').replace(/["']/g, '').trim().toUpperCase();

  // Calificaciones ya registradas para este alumno (solo si el colegio ya tiene periodos de evaluación configurados)
  const existingStudentGrades = hasSavedPeriods
    ? grades.filter((g) => g.colegioId === college.id && g.estudianteId === student.id)
    : [];

  // ÚNICAMENTE materias dadas de alta en el módulo Materias y Grupos de este colegio
  const collegeSubjects = subjects.filter(
    (s) =>
      s.colegioId === college.id &&
      s.nombre &&
      s.nombre.trim().toLowerCase() !== 'materia asignada' &&
      s.nombre.trim().toLowerCase() !== 'evaluación general'
  );

  const matchingSubjects = collegeSubjects.filter((sub) => {
    const subLvl = resolveSubjectEffectiveLevel(sub, college);
    if (subLvl !== stLevel) return false;

    // Si la materia tiene grado específico (ej. "6°"), verificar que coincida con el grado del alumno
    const gradeMatch = (sub.grado || '').match(/([1-6]°)/);
    if (gradeMatch && gradeMatch[1] !== stGrado) {
      return false;
    }

    // Si la materia tiene grupo específico, verificar que coincida con el grupo del alumno
    if (
      sub.grupo &&
      sub.grupo.trim() !== '' &&
      sub.grupo !== 'Sin Grupo' &&
      !sub.grupo.includes('Pendiente')
    ) {
      if (sub.grupo.replace(/["']/g, '').trim().toUpperCase() !== stGrupo) {
        return false;
      }
    }

    return true;
  });

  const result: GradeRecord[] = [];
  const addedSubjectNames = new Set<string>();

  // Mostrar estrictamente las materias del módulo Materias y Grupos asignadas al nivel/grado/grupo del alumno
  matchingSubjects.forEach((sub) => {
    const cleanSubName = sub.nombre.trim();
    const key = cleanSubName.toLowerCase();
    if (addedSubjectNames.has(key)) return;
    addedSubjectNames.add(key);

    const existing = existingStudentGrades.find(
      (g) =>
        g.materiaId === sub.id ||
        g.materiaNombre.trim().toLowerCase() === key
    );

    if (existing) {
      // Si se proporcionaron los periodos guardados, poner en 0 cualquier índice de periodo que no exista
      let sanitizedModMap = existing.periodosPorModalidad;
      if (savedPeriods && existing.periodosPorModalidad) {
        const nextModMap: Record<string, number[]> = {};
        Object.entries(existing.periodosPorModalidad).forEach(([modKey, arr]) => {
          if (!Array.isArray(arr)) return;
          const validIdxs = new Set(
            savedPeriods
              .filter((p) => p.periodicidad === modKey)
              .map((p) => Number(p.periodoIndex))
          );
          nextModMap[modKey] = arr.map((v, idx) =>
            validIdxs.has(idx + 1) ? Number(v) || 0 : 0
          );
        });
        sanitizedModMap = nextModMap as GradeRecord['periodosPorModalidad'];
      }

      result.push({
        ...existing,
        materiaId: sub.id,
        materiaNombre: cleanSubName,
        periodosPorModalidad: sanitizedModMap,
      });
    } else {
      result.push({
        id: `virtual-grd-${student.id}-${sub.id}`,
        colegioId: college.id,
        estudianteId: student.id,
        materiaId: sub.id,
        materiaNombre: cleanSubName,
        periodo1: 0,
        periodo2: 0,
        periodo3: 0,
        periodo4: 0,
        periodo5: 0,
        promedioFinal: 0,
        observaciones: 'Sin calificación registrada',
      });
    }
  });

  return result;
}

/**
 * Promedia las calificaciones mayores a 0 de una lista de meses/periodos.
 * Si todos son 0 o no hay valores registrados, regresa 0.
 */
function averageNonZero(vals: (number | undefined | null)[]): number {
  const valid = vals
    .map((v) => Number(v) || 0)
    .filter((v) => v > 0);
  if (valid.length === 0) return 0;
  const sum = valid.reduce((acc, curr) => acc + curr, 0);
  return Number((sum / valid.length).toFixed(1));
}

/**
 * Obtiene o proyecta los 10 meses base (Sep..Jun) de un registro de calificación.
 * 1. Si existen calificaciones mensuales registradas en g.periodosPorModalidad?.mensual, las usa como fuente principal.
 * 2. Si no hay mensual pero hay bimestral (g.periodosPorModalidad?.bimestral o g.periodo1..5), proyecta a los 10 meses.
 * 3. Si no hay bimestral pero hay trimestral, cuatrimestral o semestral, proyecta proporcionalmente.
 */
export function getBaseMonthlyGrades(g: GradeRecord): number[] {
  // 1. Calificaciones mensuales directas (10 meses: Sep, Oct, Nov, Dic, Ene, Feb, Mar, Abr, May, Jun)
  const monthlyArr = g.periodosPorModalidad?.mensual;
  if (Array.isArray(monthlyArr) && monthlyArr.length > 0 && monthlyArr.some((v) => Number(v) > 0)) {
    return Array.from({ length: 10 }, (_, i) => Number(Number(monthlyArr[i] || 0).toFixed(1)));
  }

  // 2. Proyección desde bimestral (5 bimestres -> 10 meses, 2 meses por cada bimestre)
  const bimestralArr =
    g.periodosPorModalidad?.bimestral ||
    [g.periodo1 || 0, g.periodo2 || 0, g.periodo3 || 0, g.periodo4 || 0, g.periodo5 || 0];

  if (Array.isArray(bimestralArr) && bimestralArr.some((v) => Number(v) > 0)) {
    const projected: number[] = [];
    for (let b = 0; b < 5; b++) {
      const val = Number(Number(bimestralArr[b] || 0).toFixed(1));
      projected.push(val); // Mes impar (Sep, Nov, Ene, Mar, May)
      projected.push(val); // Mes par (Oct, Dic, Feb, Abr, Jun)
    }
    return projected;
  }

  // 3. Proyección desde trimestral (3 trimestres -> 10 meses: [0..2], [3..5], [6..9])
  const trimestralArr = g.periodosPorModalidad?.trimestral;
  if (Array.isArray(trimestralArr) && trimestralArr.some((v) => Number(v) > 0)) {
    const t1 = Number(Number(trimestralArr[0] || 0).toFixed(1));
    const t2 = Number(Number(trimestralArr[1] || 0).toFixed(1));
    const t3 = Number(Number(trimestralArr[2] || 0).toFixed(1));
    return [t1, t1, t1, t2, t2, t2, t3, t3, t3, t3];
  }

  // 4. Proyección desde cuatrimestral (3 cuatrimestres -> [0..3], [4..7], [8..9])
  const cuatrimestralArr = g.periodosPorModalidad?.cuatrimestral;
  if (Array.isArray(cuatrimestralArr) && cuatrimestralArr.some((v) => Number(v) > 0)) {
    const c1 = Number(Number(cuatrimestralArr[0] || 0).toFixed(1));
    const c2 = Number(Number(cuatrimestralArr[1] || 0).toFixed(1));
    const c3 = Number(Number(cuatrimestralArr[2] || 0).toFixed(1));
    return [c1, c1, c1, c1, c2, c2, c2, c2, c3, c3];
  }

  // 5. Proyección desde semestral (2 semestres -> [0..4], [5..9])
  const semestralArr = g.periodosPorModalidad?.semestral;
  if (Array.isArray(semestralArr) && semestralArr.some((v) => Number(v) > 0)) {
    const s1 = Number(Number(semestralArr[0] || 0).toFixed(1));
    const s2 = Number(Number(semestralArr[1] || 0).toFixed(1));
    return [s1, s1, s1, s1, s1, s2, s2, s2, s2, s2];
  }

  // 6. Campos base legado periodo1, periodo2, periodo3
  const p1 = Number(g.periodo1 || 0);
  const p2 = Number(g.periodo2 || 0);
  const p3 = Number(g.periodo3 || 0);
  if (p1 > 0 || p2 > 0 || p3 > 0) {
    return [p1, p1, p2, p2, p3, p3, 0, 0, 0, 0];
  }

  return Array.from({ length: 10 }, () => 0);
}

/**
 * Calcula las calificaciones para cualquier modalidad agrupando y promediando los meses base:
 * - mensual: muestra por mes individual (10 meses: Sep, Oct, Nov, Dic, Ene, Feb, Mar, Abr, May, Jun)
 * - bimestral: junta de a dos los meses y promedia las calificaciones (5 bimestres: Sep-Oct, Nov-Dic, Ene-Feb, Mar-Abr, May-Jun)
 * - trimestral: junta de a tres los meses y promedia las calificaciones (3 trimestres: Sep-Nov, Dic-Feb, Mar-Jun)
 * - cuatrimestral: junta de a cuatro los meses y promedia las calificaciones (3 cuatrimestres: Sep-Dic, Ene-Abr, May-Jun)
 * - semestral: junta los meses por semestre y promedia las calificaciones (2 semestres: Sep-Ene, Feb-Jun)
 */
export function getGradePeriodsForModalidad(
  g: GradeRecord,
  periodicidad: EvaluationPeriodicity,
  savedPeriods?: Array<{ periodicidad: EvaluationPeriodicity; periodoIndex: number }>
): number[] {
  const meta = EVALUATION_PERIODICITY_CONFIG[periodicidad] || EVALUATION_PERIODICITY_CONFIG.bimestral;
  const count = meta.periodCount;

  // 1. Obtener los 10 meses base (registrados o proyectados)
  const months = getBaseMonthlyGrades(g);
  let computed: number[] = [];

  switch (periodicidad) {
    case 'mensual':
      // Muestra por mes individual
      computed = [...months];
      break;

    case 'bimestral':
      // Junta de a dos los meses y promedia las calificaciones
      computed = [
        averageNonZero([months[0], months[1]]), // 1° Bimestre (Sep-Oct)
        averageNonZero([months[2], months[3]]), // 2° Bimestre (Nov-Dic)
        averageNonZero([months[4], months[5]]), // 3° Bimestre (Ene-Feb)
        averageNonZero([months[6], months[7]]), // 4° Bimestre (Mar-Abr)
        averageNonZero([months[8], months[9]]), // 5° Bimestre (May-Jun)
      ];
      break;

    case 'trimestral':
      // Junta de a tres los meses y promedia las calificaciones
      computed = [
        averageNonZero([months[0], months[1], months[2]]), // 1° Trimestre (Sep-Nov)
        averageNonZero([months[3], months[4], months[5]]), // 2° Trimestre (Dic-Feb)
        averageNonZero([months[6], months[7], months[8], months[9]]), // 3° Trimestre (Mar-Jun)
      ];
      break;

    case 'cuatrimestral':
      // Junta de a cuatro los meses y promedia las calificaciones
      computed = [
        averageNonZero([months[0], months[1], months[2], months[3]]), // 1° Cuatrimestre (Sep-Dic)
        averageNonZero([months[4], months[5], months[6], months[7]]), // 2° Cuatrimestre (Ene-Abr)
        averageNonZero([months[8], months[9]]), // 3° Cuatrimestre (May-Jun)
      ];
      break;

    case 'semestral':
      // Junta los meses por semestre y promedia las calificaciones
      computed = [
        averageNonZero([months[0], months[1], months[2], months[3], months[4]]), // 1° Semestre (Sep-Ene)
        averageNonZero([months[5], months[6], months[7], months[8], months[9]]), // 2° Semestre (Feb-Jun)
      ];
      break;

    default:
      computed = Array.from({ length: count }, () => 0);
  }

  // 2. Si existen calificaciones directas guardadas para esta modalidad y los meses estaban en 0, respetar directas
  const customArr = g.periodosPorModalidad?.[periodicidad];
  if (
    Array.isArray(customArr) &&
    customArr.length > 0 &&
    customArr.some((v) => Number(v) > 0) &&
    !months.some((v) => v > 0)
  ) {
    computed = customArr.map((v) => Number((Number(v) || 0).toFixed(1)));
  }

  // 3. Filtrar según periodos oficiales evaluados si se especificaron
  if (savedPeriods && savedPeriods.length > 0) {
    const validIdxs = new Set(
      savedPeriods
        .filter((p) => p.periodicidad === periodicidad)
        .map((p) => Number(p.periodoIndex))
    );
    if (validIdxs.size > 0) {
      return Array.from({ length: count }, (_, idx) => {
        return validIdxs.has(idx + 1) ? Number((computed[idx] || 0).toFixed(1)) : 0;
      });
    }
  }

  return Array.from({ length: count }, (_, idx) => Number((computed[idx] || 0).toFixed(1)));
}

function hexToRgb(hex: string): [number, number, number] {
  const clean = (hex || '#0B2545').replace('#', '');
  if (clean.length === 3) {
    const r = parseInt(clean[0] + clean[0], 16) || 11;
    const g = parseInt(clean[1] + clean[1], 16) || 37;
    const b = parseInt(clean[2] + clean[2], 16) || 69;
    return [r, g, b];
  }
  const r = parseInt(clean.substring(0, 2), 16) || 11;
  const g = parseInt(clean.substring(2, 4), 16) || 37;
  const b = parseInt(clean.substring(4, 6), 16) || 69;
  return [r, g, b];
}

async function loadImageAsPngDataUrl(url: string): Promise<string | null> {
  if (!url) return null;
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || 200;
        canvas.height = img.naturalHeight || 200;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(null);
          return;
        }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/png'));
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

export async function generateReportCardsPdf(params: {
  college: College;
  students: Student[];
  grades: GradeRecord[];
  subjects?: Subject[];
  teachers?: Teacher[];
  periodicidad?: EvaluationPeriodicity;
  firmaTipo?: 'docente' | 'tutor' | 'ambos';
  filename?: string;
  cycleName?: string;
  schoolCycle?: any;
}): Promise<void> {
  const { college, students, grades, subjects = [], teachers = [], filename, cycleName, schoolCycle } = params;
  if (!students.length) return;
  const effectiveCycleLabel = cycleName || schoolCycle?.nombre || 'Ciclo Escolar';

  const firmaTipo: 'docente' | 'tutor' | 'ambos' =
    params.firmaTipo || college.disenoBoleta?.firmaSecundariaTipo || 'docente';

  const periodicidad: EvaluationPeriodicity =
    params.periodicidad || college.periodicidadEvaluacion || 'bimestral';
  const meta =
    EVALUATION_PERIODICITY_CONFIG[periodicidad] || EVALUATION_PERIODICITY_CONFIG.bimestral;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'letter',
  });

  const [pR, pG, pB] = hexToRgb(
    college.disenoBoleta?.colorEncabezadoTabla || college.colores?.primario || '#0B2545'
  );
  const [sR, sG, sB] = hexToRgb(
    college.disenoBoleta?.colorAcento || college.colores?.secundario || '#C59B27'
  );
  const shieldPng = college.escudoUrl ? await loadImageAsPngDataUrl(college.escudoUrl) : null;
  const bgPng = college.disenoBoleta?.imagenFondoUrl
    ? await loadImageAsPngDataUrl(college.disenoBoleta.imagenFondoUrl)
    : null;

  for (let index = 0; index < students.length; index++) {
    const student = students[index];
    if (index > 0) {
      doc.addPage();
    }

    const studentGrades = getEffectiveGradesForStudent({
      student,
      college,
      grades,
      subjects,
      teachers,
    });

    const rowsWithPeriods = studentGrades.map((g) => {
      const pValues = getGradePeriodsForModalidad(g, periodicidad);
      const nonZero = pValues.filter((v) => v > 0);
      const rowAvg =
        nonZero.length > 0
          ? Number((nonZero.reduce((acc, v) => acc + v, 0) / nonZero.length).toFixed(1))
          : 0;
      return {
        ...g,
        pValues,
        rowAvg,
      };
    });

    const gradedRows = rowsWithPeriods.filter((r) => r.rowAvg > 0);
    const hasGrades = gradedRows.length > 0;
    const finalAvgNum =
      gradedRows.length > 0
        ? gradedRows.reduce((sum, r) => sum + r.rowAvg, 0) / gradedRows.length
        : 0;
    const finalAvg = gradedRows.length > 0 ? finalAvgNum.toFixed(1) : '0.0';

    // Si el colegio tiene un diseño personalizado guardado en el Estudio de Diseño de Boletas
    const customDesign = college.disenoBoleta;
    if (
      customDesign &&
      customDesign.usarDisenoPersonalizado &&
      Array.isArray(customDesign.elementos) &&
      customDesign.elementos.length > 0
    ) {
      const pageW = 215.9;
      const pageH = 279.4;

      // 1. Fondo de la hoja
      const [bgR, bgG, bgB] = hexToRgb(customDesign.colorFondoHoja || '#FFFFFF');
      doc.setFillColor(bgR, bgG, bgB);
      doc.rect(0, 0, pageW, pageH, 'F');

      // 2. Imagen de fondo / membrete si se subió
      if (bgPng) {
        try {
          doc.addImage(bgPng, 'PNG', 0, 0, pageW, pageH);
        } catch {
          // ignore
        }
      }

      // 3. Marco decorativo
      if (customDesign.mostrarMarcoDecorativo && customDesign.estiloMarco !== 'ninguno') {
        const [fR, fG, fB] = hexToRgb(
          customDesign.colorMarco || college.colores?.primario || '#0B2545'
        );
        doc.setDrawColor(fR, fG, fB);
        doc.setLineWidth(0.7);
        doc.rect(7, 7, pageW - 14, pageH - 14, 'S');

        if (customDesign.estiloMarco === 'doble_institucional') {
          doc.setDrawColor(sR, sG, sB);
          doc.setLineWidth(0.35);
          doc.rect(9.5, 9.5, pageW - 19, pageH - 19, 'S');
        } else if (customDesign.estiloMarco === 'esquinas_doradas') {
          doc.setDrawColor(sR, sG, sB);
          doc.setLineWidth(1.4);
          // Esquinas superiores e inferiores
          doc.line(5.5, 5.5, 22, 5.5);
          doc.line(5.5, 5.5, 5.5, 22);
          doc.line(pageW - 22, 5.5, pageW - 5.5, 5.5);
          doc.line(pageW - 5.5, 5.5, pageW - 5.5, 22);
          doc.line(5.5, pageH - 5.5, 22, pageH - 5.5);
          doc.line(5.5, pageH - 22, 5.5, pageH - 5.5);
          doc.line(pageW - 22, pageH - 5.5, pageW - 5.5, pageH - 5.5);
          doc.line(pageW - 5.5, pageH - 22, pageW - 5.5, pageH - 5.5);
        }
        doc.setLineWidth(0.2);
      }

      const isSepStyle =
        !customDesign.plantillaId ||
        customDesign.plantillaId === 'clasica' ||
        (customDesign.colorEncabezadoTabla || '').toUpperCase() === '#691C32';
      const stLevel = resolveStudentEffectiveLevel(student, college);
      const surnameParts = (student.apellidos || '').trim().split(/\s+/);
      const primerApellido = surnameParts[0] || student.apellidos || '';
      const segundoApellido = surnameParts.slice(1).join(' ') || '-';

      const sortedElements = [...customDesign.elementos]
        .filter((el) => el.visible)
        .sort((a, b) => (a.zIndex || 1) - (b.zIndex || 1));

      for (const el of sortedElements) {
        const bx = (el.x / 100) * pageW;
        const by = (el.y / 100) * pageH;
        const bw = (el.w / 100) * pageW;
        const bh = (el.h / 100) * pageH;
        const align = el.textAlign || 'left';
        const anchorX =
          align === 'center' ? bx + bw / 2 : align === 'right' ? bx + bw - 3 : bx + 3;

        if (el.type === 'escudo') {
          if (el.showBorder) {
            const [br, bg, bb] = hexToRgb(el.borderColor || '#CBD5E1');
            doc.setDrawColor(br, bg, bb);
            doc.roundedRect(bx, by, bw, bh, 2, 2, 'S');
          }
          if (shieldPng) {
            try {
              const side = Math.min(bw - 2, bh - 2);
              const imgX = bx + (bw - side) / 2;
              const imgY = by + (bh - side) / 2;
              doc.addImage(shieldPng, 'PNG', imgX, imgY, side, side);
            } catch {
              // ignore
            }
          } else {
            doc.setDrawColor(188, 149, 92);
            doc.roundedRect(bx + 1, by + 1, bw - 2, bh - 2, 1.5, 1.5, 'S');
            doc.setFont('times', 'bold');
            doc.setFontSize(12);
            doc.setTextColor(105, 28, 50);
            doc.text('SEP', bx + bw / 2, by + bh / 2, { align: 'center' });
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(5.5);
            doc.setTextColor(84, 86, 90);
            doc.text('EDUCACIÓN PÚBLICA', bx + bw / 2, by + bh / 2 + 4, { align: 'center' });
          }
        } else if (el.type === 'datos_escuela') {
          if (isSepStyle) {
            doc.setTextColor(105, 28, 50);
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(11 * (el.fontSizeScale || 1));
            doc.text('SISTEMA EDUCATIVO NACIONAL', bx + bw / 2, by + 5.5, {
              align: 'center',
            });
            doc.setTextColor(84, 86, 90);
            doc.setFontSize(8.2 * (el.fontSizeScale || 1));
            doc.text('SECRETARÍA DE EDUCACIÓN PÚBLICA', bx + bw / 2, by + 10.2, {
              align: 'center',
            });

            doc.setFillColor(105, 28, 50);
            doc.rect(bx + 4, by + 12.5, bw - 8, 6.5, 'F');
            doc.setFillColor(188, 149, 92);
            doc.rect(bx + 4, by + 19, bw - 8, 1, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(8 * (el.fontSizeScale || 1));
            doc.text(
              `BOLETA DE EVALUACIÓN · ${stLevel.toUpperCase()}`,
              bx + bw / 2,
              by + 17,
              { align: 'center' }
            );
          } else {
            const [tr, tg, tb] = hexToRgb(
              el.textColor || college.colores?.primario || '#0B2545'
            );
            doc.setTextColor(tr, tg, tb);
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(12 * (el.fontSizeScale || 1));
            doc.text(college.nombre.toUpperCase(), anchorX, by + 6, { align });

            doc.setFont('helvetica', 'normal');
            doc.setFontSize(8 * (el.fontSizeScale || 1));
            doc.text(
              `Clave C.C.T.: ${college.codigoCCT} · Incorporado al Sistema Educativo`,
              anchorX,
              by + 11.5,
              { align }
            );
            if (college.lema) {
              doc.setFont('helvetica', 'italic');
              doc.setFontSize(7.5 * (el.fontSizeScale || 1));
              doc.text(`"${college.lema}"`, anchorX, by + 16, { align });
            }
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(7 * (el.fontSizeScale || 1));
            doc.text(
              `${college.direccion || ''} · Tel. ${college.telefono || ''}`,
              anchorX,
              by + 20.5,
              { align }
            );
          }
        } else if (el.type === 'folio_boleta') {
          if (isSepStyle) {
            doc.setDrawColor(105, 28, 50);
            doc.setFillColor(255, 255, 255);
            doc.rect(bx, by, bw, bh, 'FD');
            doc.setFillColor(105, 28, 50);
            doc.rect(bx, by, bw, 6.5, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(7.2);
            doc.text('CICLO ESCOLAR', bx + bw / 2, by + 4.5, { align: 'center' });

            doc.setTextColor(30, 30, 30);
            doc.setFontSize(10);
            doc.text('2026 - 2027', bx + bw / 2, by + 13, { align: 'center' });

            doc.setFillColor(243, 239, 234);
            doc.rect(bx + 0.3, by + bh - 6.5, bw - 0.6, 6.2, 'F');
            doc.setTextColor(105, 28, 50);
            doc.setFont('courier', 'bold');
            doc.setFontSize(7);
            doc.text(`FOLIO: BE-${student.matricula}`, bx + bw / 2, by + bh - 2.3, {
              align: 'center',
            });
          } else {
            const [bgR2, bgG2, bgB2] = hexToRgb(
              el.backgroundColor || college.colores?.primario || '#0B2545'
            );
            doc.setFillColor(bgR2, bgG2, bgB2);
            doc.roundedRect(bx, by, bw, bh, 2, 2, 'F');

            doc.setFillColor(sR, sG, sB);
            doc.roundedRect(bx + 3, by + 2.5, bw - 6, 6, 1.5, 1.5, 'F');
            doc.setTextColor(pR, pG, pB);
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(7);
            doc.text(meta.boletaLabel.toUpperCase(), bx + bw / 2, by + 6.7, {
              align: 'center',
            });

            const [tR2, tG2, tB2] = hexToRgb(el.textColor || '#FFFFFF');
            doc.setTextColor(tR2, tG2, tB2);
            doc.setFontSize(7.5);
            doc.text(`Modalidad ${meta.label} · ${effectiveCycleLabel}`, anchorX, by + 13.5, {
              align,
            });
            doc.setFont('courier', 'bold');
            doc.text(`Folio: BE-${student.matricula}`, anchorX, by + 18, { align });
          }
        } else if (el.type === 'foto_alumno') {
          const stPhoto = student.foto ? await loadImageAsPngDataUrl(student.foto) : null;
          if (el.showBorder) {
            const [br, bg, bb] = hexToRgb(el.borderColor || '#C59B27');
            doc.setDrawColor(br, bg, bb);
            doc.roundedRect(bx, by, bw, bh, 2, 2, 'S');
          }
          if (stPhoto) {
            try {
              doc.addImage(stPhoto, 'PNG', bx + 1, by + 1, bw - 2, bh - 2);
            } catch {
              // ignore
            }
          }
        } else if (el.type === 'datos_alumno') {
          if (isSepStyle) {
            doc.setFillColor(255, 255, 255);
            doc.setDrawColor(84, 86, 90);
            doc.rect(bx, by, bw, bh, 'FD');

            // Cinta 1: DATOS DEL ALUMNO(A)
            doc.setFillColor(84, 86, 90);
            doc.rect(bx, by, bw, 5.5, 'F');
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(7);
            doc.setTextColor(255, 255, 255);
            doc.text('DATOS DEL ALUMNO(A)', bx + 3, by + 3.9);
            doc.text(`MATRÍCULA: ${student.matricula || '-'}`, bx + bw - 3, by + 3.9, {
              align: 'right',
            });

            const colW4 = bw / 4;
            const row1ValY = by + 11.5;
            const row1LineY = by + 13;
            const row1LblY = by + 16.2;

            doc.setTextColor(30, 30, 30);
            doc.setFontSize(8);
            doc.text(primerApellido.toUpperCase(), bx + colW4 * 0.5, row1ValY, {
              align: 'center',
            });
            doc.text(segundoApellido.toUpperCase(), bx + colW4 * 1.5, row1ValY, {
              align: 'center',
            });
            doc.text((student.nombre || '').toUpperCase(), bx + colW4 * 2.5, row1ValY, {
              align: 'center',
            });
            doc.setFont('courier', 'bold');
            doc.text(
              (student.curp || 'HERA140512HDFRRL01').toUpperCase(),
              bx + colW4 * 3.5,
              row1ValY,
              { align: 'center' }
            );

            doc.setDrawColor(148, 163, 184);
            for (let c = 0; c < 4; c++) {
              doc.line(
                bx + c * colW4 + 3,
                row1LineY,
                bx + (c + 1) * colW4 - 3,
                row1LineY
              );
            }

            doc.setFont('helvetica', 'bold');
            doc.setFontSize(5.8);
            doc.setTextColor(100, 116, 139);
            doc.text('PRIMER APELLIDO', bx + colW4 * 0.5, row1LblY, { align: 'center' });
            doc.text('SEGUNDO APELLIDO', bx + colW4 * 1.5, row1LblY, { align: 'center' });
            doc.text('NOMBRE(S)', bx + colW4 * 2.5, row1LblY, { align: 'center' });
            doc.text('CURP', bx + colW4 * 3.5, row1LblY, { align: 'center' });

            // Cinta 2: DATOS DE LA ESCUELA
            const bar2Y = by + 19;
            doc.setFillColor(84, 86, 90);
            doc.rect(bx, bar2Y, bw, 5.5, 'F');
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(7);
            doc.setTextColor(255, 255, 255);
            doc.text('DATOS DE LA ESCUELA', bx + 3, bar2Y + 3.9);

            const row2ValY = bar2Y + 11.5;
            const row2LineY = bar2Y + 13;
            const row2LblY = bar2Y + 16.2;

            const wEsc = bw * 0.44;
            const wGrd = bw * 0.18;
            const wTrn = bw * 0.16;
            const wCct = bw * 0.22;

            doc.setTextColor(30, 30, 30);
            doc.setFontSize(8);
            doc.text(
              college.nombre.toUpperCase().substring(0, 34),
              bx + wEsc / 2,
              row2ValY,
              { align: 'center' }
            );
            doc.text(
              `${student.grado} "${student.grupo}"`,
              bx + wEsc + wGrd / 2,
              row2ValY,
              { align: 'center' }
            );
            doc.text('MATUTINO', bx + wEsc + wGrd + wTrn / 2, row2ValY, {
              align: 'center',
            });
            doc.setFont('courier', 'bold');
            doc.text(
              college.codigoCCT || '-',
              bx + wEsc + wGrd + wTrn + wCct / 2,
              row2ValY,
              { align: 'center' }
            );

            doc.line(bx + 3, row2LineY, bx + wEsc - 3, row2LineY);
            doc.line(bx + wEsc + 3, row2LineY, bx + wEsc + wGrd - 3, row2LineY);
            doc.line(
              bx + wEsc + wGrd + 3,
              row2LineY,
              bx + wEsc + wGrd + wTrn - 3,
              row2LineY
            );
            doc.line(
              bx + wEsc + wGrd + wTrn + 3,
              row2LineY,
              bx + bw - 3,
              row2LineY
            );

            doc.setFont('helvetica', 'bold');
            doc.setFontSize(5.8);
            doc.setTextColor(100, 116, 139);
            doc.text('NOMBRE DE LA ESCUELA', bx + wEsc / 2, row2LblY, {
              align: 'center',
            });
            doc.text('GRADO Y GRUPO', bx + wEsc + wGrd / 2, row2LblY, {
              align: 'center',
            });
            doc.text('TURNO', bx + wEsc + wGrd + wTrn / 2, row2LblY, {
              align: 'center',
            });
            doc.text('CCT', bx + wEsc + wGrd + wTrn + wCct / 2, row2LblY, {
              align: 'center',
            });
          } else {
            const [bgR3, bgG3, bgB3] = hexToRgb(el.backgroundColor || '#F8FAFC');
            const [bdR3, bdG3, bdB3] = hexToRgb(el.borderColor || '#CBD5E1');
            doc.setFillColor(bgR3, bgG3, bgB3);
            doc.setDrawColor(bdR3, bdG3, bdB3);
            doc.roundedRect(bx, by, bw, bh, 2, 2, el.showBorder ? 'FD' : 'F');

            const colStep = bw / 4;
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(7);
            doc.setTextColor(100, 116, 139);
            doc.text('ALUMNO(A)', bx + 4, by + 6);
            doc.text('MATRÍCULA ESCOLAR', bx + colStep + 2, by + 6);
            doc.text('GRADO Y GRUPO', bx + colStep * 2 + 2, by + 6);
            doc.text('MODALIDAD / TUTOR', bx + colStep * 3 + 2, by + 6);

            const [txR, txG, txB] = hexToRgb(el.textColor || '#0F172A');
            doc.setTextColor(txR, txG, txB);
            doc.setFontSize(8.5);
            doc.text(
              `${student.apellidos}, ${student.nombre}`.substring(0, 26),
              bx + 4,
              by + 12
            );
            doc.setFont('courier', 'bold');
            doc.text(student.matricula || '-', bx + colStep + 2, by + 12);
            doc.setFont('helvetica', 'bold');
            doc.text(`${student.grado} "${student.grupo}"`, bx + colStep * 2 + 2, by + 12);
            doc.text(meta.label.toUpperCase(), bx + colStep * 3 + 2, by + 12);

            doc.setFont('helvetica', 'normal');
            doc.setFontSize(7);
            doc.setTextColor(71, 85, 105);
            doc.text(
              `Tutor: ${student.tutorNombre || 'Padre / Tutor'} · CURP: ${student.curp || ''}`,
              bx + 4,
              by + Math.min(bh - 3, 18.5)
            );
          }
        } else if (el.type === 'promedio_destacado') {
          if (isSepStyle) {
            doc.setFillColor(255, 255, 255);
            doc.setDrawColor(105, 28, 50);
            doc.rect(bx, by, bw, bh, 'FD');

            doc.setFillColor(105, 28, 50);
            doc.rect(bx, by, bw, 7, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(6.5);
            doc.text('PROMEDIO FINAL DE GRADO', bx + bw / 2, by + 4.8, {
              align: 'center',
            });

            doc.setFillColor(250, 246, 240);
            doc.setDrawColor(188, 149, 92);
            doc.rect(bx + 4, by + 11, bw - 8, 14, 'FD');
            doc.setTextColor(105, 28, 50);
            doc.setFont('courier', 'bold');
            doc.setFontSize(14);
            doc.text(String(finalAvg), bx + bw / 2, by + 20, { align: 'center' });

            const sitY = by + bh - 15;
            doc.setFillColor(84, 86, 90);
            doc.rect(bx, sitY, bw, 6, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(6);
            doc.text('SITUACIÓN FINAL DEL ALUMNO', bx + bw / 2, sitY + 4.2, {
              align: 'center',
            });

            doc.setTextColor(30, 30, 30);
            doc.setFontSize(7.2);
            doc.text(
              hasGrades
                ? finalAvgNum >= 6
                  ? 'PROMOVIDO(A)'
                  : 'NO PROMOVIDO(A)'
                : 'EN CURSO',
              bx + bw / 2,
              sitY + 11.5,
              { align: 'center' }
            );
          } else {
            const [bgR4, bgG4, bgB4] = hexToRgb(
              el.backgroundColor || college.colores?.primario || '#0B2545'
            );
            doc.setFillColor(bgR4, bgG4, bgB4);
            doc.roundedRect(bx, by, bw, bh, 2.5, 2.5, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(7);
            doc.text('PROMEDIO GENERAL', bx + bw / 2, by + 6, { align: 'center' });

            doc.setFillColor(sR, sG, sB);
            doc.roundedRect(bx + bw / 2 - 10, by + 8.5, 20, 9, 1.5, 1.5, 'F');
            doc.setTextColor(pR, pG, pB);
            doc.setFont('courier', 'bold');
            doc.setFontSize(12);
            doc.text(String(finalAvg), bx + bw / 2, by + 14.8, { align: 'center' });
          }
        } else if (el.type === 'tabla_materias') {
          let ty = by;
          const isManyPeriods = meta.periodCount > 5;
          const subjW = bw * (isManyPeriods ? 0.28 : 0.34);
          const avgW = bw * 0.11;
          const obsW = bw * (isManyPeriods ? 0.15 : 0.2);
          const periodsW = bw - subjW - avgW - obsW;
          const pColW = periodsW / meta.periodCount;

          const periodsStart = bx + subjW;
          const avgStart = periodsStart + periodsW;
          const obsStart = avgStart + avgW;

          doc.setFillColor(pR, pG, pB);
          doc.rect(bx, ty, bw, 8, 'F');
          doc.setFillColor(sR, sG, sB);
          doc.rect(avgStart, ty, avgW, 8, 'F');

          doc.setFont('helvetica', 'bold');
          doc.setFontSize(isManyPeriods ? 6.5 : 7.2);
          doc.setTextColor(255, 255, 255);
          doc.text('MATERIA / ASIGNATURA', bx + 2.5, ty + 5.2);

          meta.shortLabels.forEach((lbl, pIdx) => {
            const cx = periodsStart + pIdx * pColW + pColW / 2;
            doc.text(lbl.toUpperCase(), cx, ty + 5.2, { align: 'center' });
          });

          doc.setTextColor(pR, pG, pB);
          doc.text('PROM.', avgStart + avgW / 2, ty + 5.2, { align: 'center' });

          doc.setTextColor(255, 255, 255);
          doc.text('OBSERVACIONES', obsStart + 2, ty + 5.2);

          ty += 8;
          const rowH = 8;

          if (rowsWithPeriods.length > 0) {
            rowsWithPeriods.forEach((g, rIdx) => {
              if (rIdx % 2 === 0) {
                doc.setFillColor(255, 255, 255);
              } else {
                doc.setFillColor(248, 250, 252);
              }
              doc.rect(bx, ty, bw, rowH, 'F');
              doc.setDrawColor(226, 232, 240);
              doc.line(bx, ty + rowH, bx + bw, ty + rowH);

              const [txR, txG, txB] = hexToRgb(customDesign.colorTextoTabla || '#1E293B');
              doc.setTextColor(txR, txG, txB);
              doc.setFont('helvetica', 'bold');
              doc.setFontSize(isManyPeriods ? 7.2 : 7.8);
              doc.text(String(g.materiaNombre).substring(0, 28), bx + 2.5, ty + 5.2);

              doc.setFont('courier', 'normal');
              g.pValues.forEach((val, pIdx) => {
                const cx = periodsStart + pIdx * pColW + pColW / 2;
                doc.text(val.toFixed(1), cx, ty + 5.2, { align: 'center' });
              });

              doc.setFillColor(254, 249, 195);
              doc.rect(avgStart, ty, avgW, rowH, 'F');
              doc.setFont('courier', 'bold');
              doc.setTextColor(pR, pG, pB);
              doc.text(g.rowAvg.toFixed(1), avgStart + avgW / 2, ty + 5.2, {
                align: 'center',
              });

              doc.setFont('helvetica', 'italic');
              doc.setFontSize(6.8);
              doc.setTextColor(100, 116, 139);
              doc.text(
                (g.observaciones || 'Desempeño adecuado').substring(0, 18),
                obsStart + 2,
                ty + 5.2
              );

              ty += rowH;
            });
          } else {
            doc.setFillColor(255, 255, 255);
            doc.rect(bx, ty, bw, 10, 'F');
            doc.setFont('helvetica', 'italic');
            doc.setFontSize(7.5);
            doc.setTextColor(100, 116, 139);
            doc.text(
              'Sin registros de calificaciones en el periodo actual.',
              bx + bw / 2,
              ty + 6,
              { align: 'center' }
            );
            ty += 10;
          }

          // Footer row
          doc.setFillColor(241, 245, 249);
          doc.rect(bx, ty, bw, 8.5, 'F');
          doc.setDrawColor(148, 163, 184);
          doc.rect(bx, by, bw, ty - by + 8.5, 'S');

          doc.setFont('helvetica', 'bold');
          doc.setFontSize(7.5);
          doc.setTextColor(30, 41, 59);
          doc.text(`PROMEDIO GENERAL (${meta.label.toUpperCase()}):`, bx + 4, ty + 5.5);

          doc.setFillColor(sR, sG, sB);
          doc.rect(avgStart, ty, avgW, 8.5, 'F');
          doc.setFont('courier', 'bold');
          doc.setFontSize(9);
          doc.setTextColor(pR, pG, pB);
          doc.text(String(finalAvg), avgStart + avgW / 2, ty + 5.7, { align: 'center' });

          doc.setFont('helvetica', 'bold');
          doc.setFontSize(7);
          doc.setTextColor(hasGrades && finalAvgNum >= 6 ? 6 : 100, hasGrades && finalAvgNum >= 6 ? 95 : 116, hasGrades && finalAvgNum >= 6 ? 70 : 139);
          doc.text(
            hasGrades ? (finalAvgNum >= 6 ? 'Acreditado' : 'No acreditado') : 'Sin evaluaciones',
            obsStart + 2,
            ty + 5.5
          );
        } else if (el.type === 'firma_director') {
          const sigLineY = by + bh - 8;
          const centerX = bx + bw / 2;
          doc.setFont('times', 'italic');
          doc.setFontSize(9.5);
          doc.setTextColor(100, 116, 139);
          doc.text(college.director || 'Dirección General', centerX, sigLineY - 3, {
            align: 'center',
          });
          doc.setDrawColor(148, 163, 184);
          doc.line(bx + 4, sigLineY, bx + bw - 4, sigLineY);
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(7.5);
          doc.setTextColor(30, 41, 59);
          doc.text(college.director || 'Dirección General', centerX, sigLineY + 4, {
            align: 'center',
          });
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(6.8);
          doc.setTextColor(100, 116, 139);
          doc.text('Director(a) del Plantel', centerX, sigLineY + 7.5, {
            align: 'center',
          });
        } else if (el.type === 'sello_digital') {
          doc.setDrawColor(sR, sG, sB);
          doc.setLineWidth(0.5);
          doc.roundedRect(bx + 4, by + 2, bw - 8, bh - 4, 2, 2, 'S');
          doc.setLineWidth(0.2);
          doc.setFont('courier', 'bold');
          doc.setFontSize(7);
          doc.setTextColor(pR, pG, pB);
          doc.text('SELLO DIGITAL OFICIAL', bx + bw / 2, by + bh / 2, {
            align: 'center',
          });
          doc.setFontSize(6.2);
          doc.setTextColor(100, 116, 139);
          doc.text(`VALIDACIÓN ${college.codigoCCT}`, bx + bw / 2, by + bh / 2 + 4.5, {
            align: 'center',
          });
        } else if (el.type === 'firma_docente') {
          const teacherName = resolveStudentTeacherName(student, college, teachers);
          const sigLineY = by + bh - 8;
          const centerX = bx + bw / 2;
          doc.setFont('times', 'italic');
          doc.setFontSize(9.5);
          doc.setTextColor(100, 116, 139);
          doc.text(teacherName, centerX, sigLineY - 3, { align: 'center' });
          doc.setDrawColor(148, 163, 184);
          doc.line(bx + 4, sigLineY, bx + bw - 4, sigLineY);
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(7.5);
          doc.setTextColor(30, 41, 59);
          doc.text(teacherName, centerX, sigLineY + 4, { align: 'center' });
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(6.8);
          doc.setTextColor(100, 116, 139);
          doc.text('Firma del Docente Titular', centerX, sigLineY + 7.5, {
            align: 'center',
          });
        } else if (el.type === 'firma_tutor') {
          const tutorName = student.tutorNombre || 'Padre o Tutor Legal';
          const sigLineY = by + bh - 8;
          const centerX = bx + bw / 2;
          doc.setFont('times', 'italic');
          doc.setFontSize(9.5);
          doc.setTextColor(100, 116, 139);
          doc.text(tutorName, centerX, sigLineY - 3, { align: 'center' });
          doc.setDrawColor(148, 163, 184);
          doc.line(bx + 4, sigLineY, bx + bw - 4, sigLineY);
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(7.5);
          doc.setTextColor(30, 41, 59);
          doc.text(tutorName, centerX, sigLineY + 4, { align: 'center' });
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(6.8);
          doc.setTextColor(100, 116, 139);
          doc.text('Firma de Padre / Tutor', centerX, sigLineY + 7.5, {
            align: 'center',
          });
        } else if (el.type === 'texto_libre') {
          const [txR, txG, txB] = hexToRgb(el.textColor || '#64748B');
          doc.setTextColor(txR, txG, txB);
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(7.5 * (el.fontSizeScale || 1));
          doc.text(
            el.customText ||
              'Boleta oficial expedida por el Sistema Institucional de Control Escolar.',
            anchorX,
            by + bh / 2 + 1.5,
            { align }
          );
        }
      }

      continue;
    }

    // Top Institutional Banner
    doc.setFillColor(pR, pG, pB);
    doc.rect(14, 14, 188, 28, 'F');
    doc.setFillColor(sR, sG, sB);
    doc.rect(14, 42, 188, 2, 'F');

    // Shield Box
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(18, 17, 22, 22, 2, 2, 'F');
    if (shieldPng) {
      try {
        doc.addImage(shieldPng, 'PNG', 19.5, 18.5, 19, 19);
      } catch {
        // ignore if image fails
      }
    }

    // College Header Text
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text(college.nombre.toUpperCase(), 44, 24);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.text(`Clave C.C.T.: ${college.codigoCCT} · Incorporado al Sistema Educativo`, 44, 29.5);
    if (college.lema) {
      doc.setFont('helvetica', 'italic');
      doc.text(`"${college.lema}"`, 44, 34);
    }
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.text(`${college.direccion || ''} · Tel. ${college.telefono || ''}`, 44, 38.5);

    // Right Badge in Banner
    doc.setFillColor(sR, sG, sB);
    doc.roundedRect(142, 18, 56, 7, 1.5, 1.5, 'F');
    doc.setTextColor(pR, pG, pB);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.text(meta.boletaLabel.toUpperCase(), 170, 22.8, { align: 'center' });

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.text(`Modalidad ${meta.label} · ${effectiveCycleLabel}`, 198, 30, { align: 'right' });
    doc.setFont('courier', 'bold');
    doc.text(`Folio: BE-${student.matricula}`, 198, 35, { align: 'right' });

    // Student Info Card
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(14, 49, 188, 22, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text('ALUMNO(A)', 18, 55);
    doc.text('MATRÍCULA ESCOLAR', 88, 55);
    doc.text('GRADO Y GRUPO', 132, 55);
    doc.text('MODALIDAD DE BOLETA', 164, 55);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(15, 23, 42);
    doc.text(`${student.apellidos}, ${student.nombre}`, 18, 61);

    doc.setFont('courier', 'bold');
    doc.setFontSize(9);
    doc.text(student.matricula || '-', 88, 61);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text(`${student.grado} "${student.grupo}"`, 132, 61);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(pR, pG, pB);
    doc.text(meta.label.toUpperCase(), 164, 61);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);
    doc.text(`Tutor Legal: ${student.tutorNombre || 'Padre / Tutor'} · CURP: ${student.curp || 'HERA080415HDFRRL01'}`, 18, 67.5);
    doc.text(`Fecha de Emisión: ${new Date().toISOString().split('T')[0]}`, 145, 67.5);

    // Dynamic Grades Table Header based on Periodicity (Mensual=10, Bimestral=5, Trimestral=3, Cuatrimestral=3, Semestral=2)
    let y = 78;
    const isManyPeriods = meta.periodCount > 5; // Mensual (10 columns)
    const subjectColEnd = isManyPeriods ? 68 : 78;
    const periodsAreaStart = subjectColEnd;
    const periodsAreaEnd = isManyPeriods ? 158 : 142;
    const periodsAreaWidth = periodsAreaEnd - periodsAreaStart;
    const colW = periodsAreaWidth / meta.periodCount;
    const avgColStart = periodsAreaEnd;
    const avgColW = isManyPeriods ? 18 : 22;
    const obsColStart = avgColStart + avgColW + 2;

    doc.setFillColor(pR, pG, pB);
    doc.rect(14, y, 188, 8.5, 'F');
    doc.setFillColor(sR, sG, sB);
    doc.rect(avgColStart, y, avgColW, 8.5, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(isManyPeriods ? 6.8 : 7.5);
    doc.setTextColor(255, 255, 255);
    doc.text('ASIGNATURA / MATERIA', 16.5, y + 5.5);

    meta.shortLabels.forEach((lbl, pIdx) => {
      const centerX = periodsAreaStart + pIdx * colW + colW / 2;
      doc.text(lbl.toUpperCase(), centerX, y + 5.5, { align: 'center' });
    });

    doc.setTextColor(pR, pG, pB);
    doc.text('PROM.', avgColStart + avgColW / 2, y + 5.5, { align: 'center' });

    doc.setTextColor(255, 255, 255);
    doc.text('OBSERVACIONES', obsColStart, y + 5.5);

    y += 8.5;

    if (rowsWithPeriods.length > 0) {
      rowsWithPeriods.forEach((g, idx) => {
        const rowH = 8.5;
        if (idx % 2 === 0) {
          doc.setFillColor(255, 255, 255);
        } else {
          doc.setFillColor(248, 250, 252);
        }
        doc.rect(14, y, 188, rowH, 'F');
        doc.setDrawColor(226, 232, 240);
        doc.line(14, y + rowH, 202, y + rowH);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(isManyPeriods ? 7.5 : 8);
        doc.setTextColor(30, 41, 59);
        const maxSubjectChars = isManyPeriods ? 26 : 32;
        doc.text(String(g.materiaNombre).substring(0, maxSubjectChars), 16.5, y + 5.5);

        doc.setFont('courier', 'normal');
        doc.setFontSize(isManyPeriods ? 7.2 : 8);
        g.pValues.forEach((val, pIdx) => {
          const centerX = periodsAreaStart + pIdx * colW + colW / 2;
          doc.text(val.toFixed(1), centerX, y + 5.5, { align: 'center' });
        });

        // Highlight Average cell
        doc.setFillColor(254, 249, 195);
        doc.rect(avgColStart, y, avgColW, rowH, 'F');
        doc.setFont('courier', 'bold');
        doc.setFontSize(8.5);
        doc.setTextColor(pR, pG, pB);
        doc.text(g.rowAvg.toFixed(1), avgColStart + avgColW / 2, y + 5.5, { align: 'center' });

        doc.setFont('helvetica', 'italic');
        doc.setFontSize(7);
        doc.setTextColor(100, 116, 139);
        const obs = g.observaciones || 'Desempeño adecuado';
        const maxObsChars = isManyPeriods ? 14 : 20;
        doc.text(obs.substring(0, maxObsChars), obsColStart, y + 5.5);

        y += rowH;
      });
    } else {
      const rowH = 12;
      doc.setFillColor(255, 255, 255);
      doc.rect(14, y, 188, rowH, 'F');
      doc.setDrawColor(226, 232, 240);
      doc.line(14, y + rowH, 202, y + rowH);
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text(
        'Sin registros de calificaciones, tareas ni exámenes evaluados en el periodo actual.',
        108,
        y + 7.5,
        { align: 'center' }
      );
      y += rowH;
    }

    // Table Footer Row (Final Average)
    doc.setFillColor(241, 245, 249);
    doc.rect(14, y, 188, 9.5, 'F');
    doc.setDrawColor(148, 163, 184);
    doc.rect(14, 78, 188, y - 78 + 9.5, 'S');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(30, 41, 59);
    doc.text(`PROMEDIO GENERAL (${meta.label.toUpperCase()}):`, periodsAreaStart + 12, y + 6);

    doc.setFillColor(sR, sG, sB);
    doc.rect(avgColStart, y, avgColW, 9.5, 'F');
    doc.setFont('courier', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(pR, pG, pB);
    doc.text(String(finalAvg), avgColStart + avgColW / 2, y + 6.3, { align: 'center' });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    if (hasGrades && finalAvgNum >= 6) {
      doc.setTextColor(6, 95, 70);
      doc.text('Acreditado', obsColStart, y + 6);
    } else if (hasGrades) {
      doc.setTextColor(185, 28, 28);
      doc.text('No acreditado', obsColStart, y + 6);
    } else {
      doc.setTextColor(100, 116, 139);
      doc.text('Sin evaluaciones', obsColStart, y + 6);
    }

    // Signatures Section
    const sigY = Math.max(y + 38, 215);
    const teacherName = resolveStudentTeacherName(student, college, teachers);
    const tutorName = student.tutorNombre || 'Padre o Tutor Legal';

    if (firmaTipo === 'ambos') {
      // 1. Director
      doc.setFont('times', 'italic');
      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139);
      doc.text(college.director || 'Dirección General', 38, sigY - 4, { align: 'center' });
      doc.setDrawColor(148, 163, 184);
      doc.line(16, sigY, 60, sigY);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(30, 41, 59);
      doc.text(college.director || 'Dirección General', 38, sigY + 4.5, { align: 'center' });
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(100, 116, 139);
      doc.text('Director(a) del Plantel', 38, sigY + 8, { align: 'center' });

      // 2. Digital Seal
      doc.setDrawColor(sR, sG, sB);
      doc.setLineWidth(0.5);
      doc.roundedRect(66, sigY - 14, 28, 18, 2, 2, 'S');
      doc.setLineWidth(0.2);
      doc.setFont('courier', 'bold');
      doc.setFontSize(6.5);
      doc.setTextColor(pR, pG, pB);
      doc.text('SELLO DIGITAL', 80, sigY - 5.5, { align: 'center' });
      doc.setFontSize(6);
      doc.setTextColor(100, 116, 139);
      doc.text('MY COLLEGE', 80, sigY - 1.5, { align: 'center' });
      doc.text('OFICIAL', 80, sigY + 6.5, { align: 'center' });

      // 3. Teacher Signature
      doc.setFont('times', 'italic');
      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139);
      doc.text(teacherName, 122, sigY - 4, { align: 'center' });
      doc.setDrawColor(148, 163, 184);
      doc.line(100, sigY, 144, sigY);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(30, 41, 59);
      doc.text(teacherName, 122, sigY + 4.5, { align: 'center' });
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(100, 116, 139);
      doc.text('Firma del Docente Titular', 122, sigY + 8, { align: 'center' });

      // 4. Tutor Signature
      doc.setFont('times', 'italic');
      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139);
      doc.text(tutorName, 175, sigY - 4, { align: 'center' });
      doc.setDrawColor(148, 163, 184);
      doc.line(153, sigY, 198, sigY);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(30, 41, 59);
      doc.text(tutorName, 175, sigY + 4.5, { align: 'center' });
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(100, 116, 139);
      doc.text('Firma de Padre / Tutor', 175, sigY + 8, { align: 'center' });
    } else {
      // Left Signature: Director
      doc.setFont('times', 'italic');
      doc.setFontSize(10);
      doc.setTextColor(100, 116, 139);
      doc.text(college.director || 'Dirección General', 48, sigY - 4, { align: 'center' });
      doc.setDrawColor(148, 163, 184);
      doc.line(22, sigY, 74, sigY);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(30, 41, 59);
      doc.text(college.director || 'Dirección General', 48, sigY + 4.5, { align: 'center' });
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(100, 116, 139);
      doc.text('Director(a) del Plantel', 48, sigY + 8.5, { align: 'center' });

      // Center Digital Seal
      doc.setDrawColor(sR, sG, sB);
      doc.setLineWidth(0.6);
      doc.roundedRect(92, sigY - 14, 32, 18, 2, 2, 'S');
      doc.setLineWidth(0.2);
      doc.setFont('courier', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(pR, pG, pB);
      doc.text('SELLO DIGITAL', 108, sigY - 5.5, { align: 'center' });
      doc.setFontSize(6.5);
      doc.setTextColor(100, 116, 139);
      doc.text('MY COLLEGE', 108, sigY - 1.5, { align: 'center' });
      doc.text('VALIDACIÓN OFICIAL', 108, sigY + 6.5, { align: 'center' });

      // Right Signature: Docente (por defecto) o Padre/Tutor
      const rightSignerName = firmaTipo === 'tutor' ? tutorName : teacherName;
      const rightSignerRole =
        firmaTipo === 'tutor' ? 'Firma de Padre / Tutor' : 'Firma del Docente Titular';

      doc.setFont('times', 'italic');
      doc.setFontSize(10);
      doc.setTextColor(100, 116, 139);
      doc.text(rightSignerName, 168, sigY - 4, { align: 'center' });
      doc.setDrawColor(148, 163, 184);
      doc.line(142, sigY, 194, sigY);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(30, 41, 59);
      doc.text(rightSignerName, 168, sigY + 4.5, { align: 'center' });
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(100, 116, 139);
      doc.text(rightSignerRole, 168, sigY + 8.5, { align: 'center' });
    }
  }

  const safeName =
    filename ||
    `Boletas_${college.nombre.replace(/[^a-zA-Z0-9]/g, '_')}_2026.pdf`;
  doc.save(safeName);
}
