import { jsPDF } from 'jspdf';
import {
  College,
  GradeRecord,
  Student,
  EvaluationPeriodicity,
  EVALUATION_PERIODICITY_CONFIG,
} from '../types';

export function getGradePeriodsForModalidad(
  g: GradeRecord,
  periodicidad: EvaluationPeriodicity
): number[] {
  const meta = EVALUATION_PERIODICITY_CONFIG[periodicidad] || EVALUATION_PERIODICITY_CONFIG.bimestral;
  const count = meta.periodCount;

  const customArr = g.periodosPorModalidad?.[periodicidad];
  if (Array.isArray(customArr) && customArr.length >= count) {
    return customArr.slice(0, count).map((n) => Number((Number(n) || 0).toFixed(1)));
  }

  const p1 = Number(g.periodo1 ?? g.promedioFinal ?? 9.0);
  const p2 = Number(g.periodo2 ?? g.promedioFinal ?? p1);
  const p3 = Number(g.periodo3 ?? g.promedioFinal ?? p2);
  const p4 = Number(g.periodo4 ?? Number(((p1 + p2 + p3) / 3).toFixed(1)));
  const p5 = Number(g.periodo5 ?? g.promedioFinal ?? p4);
  const basePool = [p1, p2, p3, p4, p5];

  return Array.from({ length: count }, (_, idx) => {
    if (customArr && customArr[idx] !== undefined) {
      return Number(Number(customArr[idx]).toFixed(1));
    }
    return Number((basePool[idx % basePool.length] || 9.0).toFixed(1));
  });
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
  periodicidad?: EvaluationPeriodicity;
  filename?: string;
}): Promise<void> {
  const { college, students, grades, filename } = params;
  if (!students.length) return;

  const periodicidad: EvaluationPeriodicity =
    params.periodicidad || college.periodicidadEvaluacion || 'bimestral';
  const meta =
    EVALUATION_PERIODICITY_CONFIG[periodicidad] || EVALUATION_PERIODICITY_CONFIG.bimestral;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'letter',
  });

  const [pR, pG, pB] = hexToRgb(college.colores?.primario || '#0B2545');
  const [sR, sG, sB] = hexToRgb(college.colores?.secundario || '#C59B27');
  const shieldPng = college.escudoUrl ? await loadImageAsPngDataUrl(college.escudoUrl) : null;

  students.forEach((student, index) => {
    if (index > 0) {
      doc.addPage();
    }

    const studentGrades = grades.filter(
      (g) => g.colegioId === college.id && g.estudianteId === student.id
    );

    const rowsWithPeriods = (
      studentGrades.length > 0
        ? studentGrades
        : [
            {
              id: 'default-1',
              colegioId: college.id,
              estudianteId: student.id,
              materiaId: 'mat-1',
              materiaNombre: 'Promedio General Curricular',
              periodo1: student.promedio || 9.0,
              periodo2: student.promedio || 9.0,
              periodo3: student.promedio || 9.0,
              promedioFinal: student.promedio || 9.0,
              observaciones: 'Desempeño académico satisfactorio',
            } as GradeRecord,
          ]
    ).map((g) => {
      const pValues = getGradePeriodsForModalidad(g, periodicidad);
      const rowAvg = Number(
        (pValues.reduce((acc, v) => acc + v, 0) / pValues.length).toFixed(1)
      );
      return {
        ...g,
        pValues,
        rowAvg,
      };
    });

    const finalAvg =
      rowsWithPeriods.length > 0
        ? (
            rowsWithPeriods.reduce((sum, r) => sum + r.rowAvg, 0) /
            rowsWithPeriods.length
          ).toFixed(1)
        : (student.promedio || 9.0).toFixed(1);

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
    doc.text(`Modalidad ${meta.label} · Ciclo 2026-2027`, 198, 30, { align: 'right' });
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
    doc.setTextColor(6, 95, 70);
    doc.text('Acreditado', obsColStart, y + 6);

    // Signatures Section
    const sigY = Math.max(y + 38, 215);

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

    // Right Signature: Tutor
    const tutorName = student.tutorNombre || 'Padre o Tutor Legal';
    doc.setFont('times', 'italic');
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text(tutorName, 168, sigY - 4, { align: 'center' });
    doc.setDrawColor(148, 163, 184);
    doc.line(142, sigY, 194, sigY);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(30, 41, 59);
    doc.text(tutorName, 168, sigY + 4.5, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text('Firma de Padre / Tutor', 168, sigY + 8.5, { align: 'center' });
  });

  const safeName =
    filename ||
    `Boletas_${college.nombre.replace(/[^a-zA-Z0-9]/g, '_')}_2026.pdf`;
  doc.save(safeName);
}
