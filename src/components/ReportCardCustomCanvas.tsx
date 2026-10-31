import React, { useState, useRef } from 'react';
import {
  College,
  Student,
  Subject,
  Teacher,
  GradeRecord,
  EvaluationPeriodicity,
  EVALUATION_PERIODICITY_CONFIG,
  ReportCardCanvasElement,
  ReportCardDesignConfig,
} from '../types';
import {
  getEffectiveGradesForStudent,
  getGradePeriodsForModalidad,
  resolveStudentEffectiveLevel,
} from '../utils/reportCardPdfGenerator';
import {
  resolveStudentTeacherName,
  SEP_OFFICIAL_COLORS,
} from '../utils/reportCardDesignHelper';
import { ShieldCheck, Move } from 'lucide-react';

interface ReportCardCustomCanvasProps {
  college: College;
  student: Student;
  design: ReportCardDesignConfig;
  periodicidad: EvaluationPeriodicity;
  grades: GradeRecord[];
  subjects: Subject[];
  teachers: Teacher[];
  editable?: boolean;
  selectedElementId?: string | null;
  onSelectElement?: (id: string | null) => void;
  onUpdateElement?: (id: string, updates: Partial<ReportCardCanvasElement>) => void;
  showGrid?: boolean;
}

export const ReportCardCustomCanvas: React.FC<ReportCardCustomCanvasProps> = ({
  college,
  student,
  design,
  periodicidad,
  grades,
  subjects,
  teachers,
  editable = false,
  selectedElementId = null,
  onSelectElement,
  onUpdateElement,
  showGrid = false,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [interactionState, setInteractionState] = useState<{
    mode: 'move' | 'resize';
    elementId: string;
    startX: number;
    startY: number;
    origX: number;
    origY: number;
    origW: number;
    origH: number;
  } | null>(null);

  const meta =
    EVALUATION_PERIODICITY_CONFIG[periodicidad] || EVALUATION_PERIODICITY_CONFIG.bimestral;

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
  const hasRecordedGrades = gradedRows.length > 0;
  const finalAvgNum =
    gradedRows.length > 0
      ? gradedRows.reduce((sum, g) => sum + g.rowAvg, 0) / gradedRows.length
      : 0;
  const finalAvg = gradedRows.length > 0 ? finalAvgNum.toFixed(1) : '0.0';

  const primaryColor = design.colorEncabezadoTabla || college.colores?.primario || '#0B2545';
  const accentColor = design.colorAcento || college.colores?.secundario || '#C59B27';
  const frameColor = design.colorMarco || primaryColor;

  const handlePointerDown = (
    e: React.PointerEvent,
    el: ReportCardCanvasElement,
    mode: 'move' | 'resize'
  ) => {
    if (!editable || !onUpdateElement) return;
    e.stopPropagation();
    onSelectElement?.(el.id);

    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    setInteractionState({
      mode,
      elementId: el.id,
      startX: e.clientX,
      startY: e.clientY,
      origX: el.x,
      origY: el.y,
      origW: el.w,
      origH: el.h,
    });
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!interactionState || !editable || !onUpdateElement || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    const deltaXPercent = ((e.clientX - interactionState.startX) / rect.width) * 100;
    const deltaYPercent = ((e.clientY - interactionState.startY) / rect.height) * 100;

    const snap = (val: number) => (showGrid ? Math.round(val * 2) / 2 : Number(val.toFixed(1)));

    if (interactionState.mode === 'move') {
      const nextX = Math.max(
        0,
        Math.min(100 - interactionState.origW, snap(interactionState.origX + deltaXPercent))
      );
      const nextY = Math.max(
        0,
        Math.min(100 - interactionState.origH, snap(interactionState.origY + deltaYPercent))
      );
      onUpdateElement(interactionState.elementId, { x: nextX, y: nextY });
    } else {
      const nextW = Math.max(
        6,
        Math.min(100 - interactionState.origX, snap(interactionState.origW + deltaXPercent))
      );
      const nextH = Math.max(
        3.5,
        Math.min(100 - interactionState.origY, snap(interactionState.origH + deltaYPercent))
      );
      onUpdateElement(interactionState.elementId, { w: nextW, h: nextH });
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (interactionState) {
      try {
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        // ignore
      }
      setInteractionState(null);
    }
  };

  const isSepStyle =
    !design.plantillaId ||
    design.plantillaId === 'clasica' ||
    (design.colorEncabezadoTabla || '').toUpperCase() === SEP_OFFICIAL_COLORS.guinda;
  const studentEffectiveLevel = resolveStudentEffectiveLevel(student, college);
  const nameParts = (student.apellidos || '').trim().split(/\s+/);
  const primerApellido = nameParts[0] || student.apellidos || '';
  const segundoApellido = nameParts.slice(1).join(' ') || '-';

  const renderElementContent = (el: ReportCardCanvasElement) => {
    const scale = el.fontSizeScale || 1;
    const alignClass =
      el.textAlign === 'center'
        ? 'text-center items-center'
        : el.textAlign === 'right'
        ? 'text-right items-end'
        : 'text-left items-start';

    switch (el.type) {
      case 'escudo':
        return (
          <div className="w-full h-full flex items-center justify-center p-1 overflow-hidden">
            {college.escudoUrl ? (
              <img
                src={college.escudoUrl}
                alt={college.nombre}
                className="w-full h-full object-contain select-none pointer-events-none"
              />
            ) : (
              <div
                className="w-full h-full flex flex-col items-center justify-center rounded border text-center px-1"
                style={{
                  borderColor: SEP_OFFICIAL_COLORS.dorado,
                  color: SEP_OFFICIAL_COLORS.guinda,
                }}
              >
                <span className="text-[11px] font-serif font-extrabold tracking-widest leading-none">
                  SEP
                </span>
                <span className="text-[7px] font-semibold uppercase tracking-tight leading-tight mt-0.5 text-slate-600">
                  EDUCACIÓN PÚBLICA
                </span>
              </div>
            )}
          </div>
        );

      case 'datos_escuela':
        if (isSepStyle) {
          return (
            <div
              className={`w-full h-full flex flex-col justify-center px-2 py-0.5 overflow-hidden ${alignClass}`}
              style={{ fontSize: `${scale * 100}%` }}
            >
              <div
                className="font-extrabold text-[11px] sm:text-xs uppercase tracking-widest leading-tight"
                style={{ color: SEP_OFFICIAL_COLORS.guinda }}
              >
                SISTEMA EDUCATIVO NACIONAL
              </div>
              <div className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-slate-700 leading-tight">
                SECRETARÍA DE EDUCACIÓN PÚBLICA
              </div>
              <div
                className="mt-1 px-2.5 py-0.5 text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wider text-white rounded-xs"
                style={{
                  backgroundColor: SEP_OFFICIAL_COLORS.guinda,
                  borderBottom: `2px solid ${SEP_OFFICIAL_COLORS.dorado}`,
                }}
              >
                BOLETA DE EVALUACIÓN · {studentEffectiveLevel.toUpperCase()}
              </div>
            </div>
          );
        }
        return (
          <div
            className={`w-full h-full flex flex-col justify-center px-2 py-1 overflow-hidden ${alignClass}`}
            style={{ color: el.textColor || primaryColor, fontSize: `${scale * 100}%` }}
          >
            <div className="font-display font-extrabold text-sm sm:text-base uppercase tracking-wide leading-tight">
              {college.nombre}
            </div>
            <div className="text-[10px] sm:text-[11px] font-semibold opacity-90 mt-0.5">
              Clave C.C.T.: <span className="font-mono font-bold">{college.codigoCCT}</span> · Incorporado al Sistema Educativo
            </div>
            {college.lema && (
              <div className="text-[10px] italic opacity-75 mt-0.5">"{college.lema}"</div>
            )}
            <div className="text-[9px] sm:text-[10px] opacity-70 mt-0.5">
              {college.direccion} · Tel. {college.telefono}
            </div>
          </div>
        );

      case 'folio_boleta':
        if (isSepStyle) {
          return (
            <div
              className="w-full h-full flex flex-col justify-between overflow-hidden rounded-xs border"
              style={{
                borderColor: SEP_OFFICIAL_COLORS.guinda,
                backgroundColor: '#FFFFFF',
                fontSize: `${scale * 100}%`,
              }}
            >
              <div
                className="w-full py-0.5 px-1.5 text-center text-[8px] sm:text-[9px] font-extrabold uppercase tracking-wider text-white"
                style={{ backgroundColor: SEP_OFFICIAL_COLORS.guinda }}
              >
                CICLO ESCOLAR
              </div>
              <div className="text-center font-extrabold text-[11px] sm:text-xs text-slate-900 leading-tight py-0.5">
                2026 - 2027
              </div>
              <div
                className="w-full py-0.5 px-1.5 text-center text-[8px] font-bold uppercase border-t"
                style={{
                  backgroundColor: '#F3EFEA',
                  borderColor: SEP_OFFICIAL_COLORS.dorado,
                  color: SEP_OFFICIAL_COLORS.guinda,
                }}
              >
                FOLIO SEP: <span className="font-mono">BE-{student.matricula}</span>
              </div>
            </div>
          );
        }
        return (
          <div
            className={`w-full h-full flex flex-col justify-center px-3 py-1.5 rounded-lg overflow-hidden ${alignClass}`}
            style={{
              backgroundColor: el.backgroundColor || primaryColor,
              color: el.textColor || '#FFFFFF',
              fontSize: `${scale * 100}%`,
            }}
          >
            <div
              className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded mb-0.5"
              style={{ backgroundColor: accentColor, color: primaryColor }}
            >
              {meta.boletaLabel}
            </div>
            <div className="text-[10px] font-semibold opacity-95">
              Modalidad {meta.label} · Ciclo 2026-2027
            </div>
            <div className="text-[10px] font-mono opacity-85">
              Folio: BE-{student.matricula}
            </div>
          </div>
        );

      case 'foto_alumno':
        return (
          <div className="w-full h-full flex flex-col items-center justify-center p-1 overflow-hidden bg-white/80 rounded-lg">
            <img
              src={student.foto}
              alt={student.nombre}
              className="w-full h-full object-cover rounded select-none pointer-events-none"
            />
          </div>
        );

      case 'datos_alumno':
        if (isSepStyle) {
          return (
            <div
              className="w-full h-full flex flex-col justify-between overflow-hidden bg-white"
              style={{ fontSize: `${scale * 100}%` }}
            >
              {/* Barra SEP: DATOS DEL ALUMNO(A) */}
              <div>
                <div
                  className="px-2 py-0.5 text-[8px] sm:text-[9px] font-extrabold uppercase tracking-wider text-white flex items-center justify-between"
                  style={{ backgroundColor: SEP_OFFICIAL_COLORS.grisBarra }}
                >
                  <span>DATOS DEL ALUMNO(A)</span>
                  <span className="font-mono text-[8px] opacity-90">
                    MATRÍCULA: {student.matricula}
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-2 px-2 pt-1 pb-0.5 text-[9px] sm:text-[10px]">
                  <div className="border-b border-slate-400 pb-0.5">
                    <div className="font-bold text-slate-900 uppercase truncate text-center">
                      {primerApellido}
                    </div>
                    <div className="text-[7px] uppercase font-semibold text-slate-500 text-center">
                      PRIMER APELLIDO
                    </div>
                  </div>
                  <div className="border-b border-slate-400 pb-0.5">
                    <div className="font-bold text-slate-900 uppercase truncate text-center">
                      {segundoApellido}
                    </div>
                    <div className="text-[7px] uppercase font-semibold text-slate-500 text-center">
                      SEGUNDO APELLIDO
                    </div>
                  </div>
                  <div className="border-b border-slate-400 pb-0.5">
                    <div className="font-bold text-slate-900 uppercase truncate text-center">
                      {student.nombre}
                    </div>
                    <div className="text-[7px] uppercase font-semibold text-slate-500 text-center">
                      NOMBRE(S)
                    </div>
                  </div>
                  <div className="border-b border-slate-400 pb-0.5">
                    <div className="font-mono font-bold text-slate-900 uppercase truncate text-center">
                      {student.curp || 'HERA140512HDFRRL01'}
                    </div>
                    <div className="text-[7px] uppercase font-semibold text-slate-500 text-center">
                      CURP
                    </div>
                  </div>
                </div>
              </div>

              {/* Barra SEP: DATOS DE LA ESCUELA */}
              <div>
                <div
                  className="px-2 py-0.5 text-[8px] sm:text-[9px] font-extrabold uppercase tracking-wider text-white"
                  style={{ backgroundColor: SEP_OFFICIAL_COLORS.grisBarra }}
                >
                  DATOS DE LA ESCUELA
                </div>
                <div className="grid grid-cols-12 gap-2 px-2 pt-1 pb-0.5 text-[9px] sm:text-[10px]">
                  <div className="col-span-5 border-b border-slate-400 pb-0.5">
                    <div className="font-bold text-slate-900 uppercase truncate text-center">
                      {college.nombre}
                    </div>
                    <div className="text-[7px] uppercase font-semibold text-slate-500 text-center">
                      NOMBRE DE LA ESCUELA
                    </div>
                  </div>
                  <div className="col-span-2 border-b border-slate-400 pb-0.5">
                    <div className="font-bold text-slate-900 uppercase text-center">
                      {student.grado} "{student.grupo}"
                    </div>
                    <div className="text-[7px] uppercase font-semibold text-slate-500 text-center">
                      GRADO Y GRUPO
                    </div>
                  </div>
                  <div className="col-span-2 border-b border-slate-400 pb-0.5">
                    <div className="font-bold text-slate-900 uppercase text-center">
                      MATUTINO
                    </div>
                    <div className="text-[7px] uppercase font-semibold text-slate-500 text-center">
                      TURNO
                    </div>
                  </div>
                  <div className="col-span-3 border-b border-slate-400 pb-0.5">
                    <div className="font-mono font-bold text-slate-900 uppercase text-center">
                      {college.codigoCCT}
                    </div>
                    <div className="text-[7px] uppercase font-semibold text-slate-500 text-center">
                      CCT
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        }
        return (
          <div
            className="w-full h-full flex flex-col justify-center px-3 py-2 rounded-lg overflow-hidden"
            style={{
              backgroundColor: el.backgroundColor || '#F8FAFC',
              color: el.textColor || '#0F172A',
              fontSize: `${scale * 100}%`,
            }}
          >
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px] sm:text-xs">
              <div>
                <span className="text-[9px] uppercase font-bold opacity-55 block">
                  Alumno(a)
                </span>
                <span className="font-bold truncate block">
                  {student.apellidos}, {student.nombre}
                </span>
              </div>
              <div>
                <span className="text-[9px] uppercase font-bold opacity-55 block">
                  Matrícula / CURP
                </span>
                <span className="font-mono font-bold block truncate">
                  {student.matricula} · {student.curp?.slice(0, 10) || 'CURP'}
                </span>
              </div>
              <div>
                <span className="text-[9px] uppercase font-bold opacity-55 block">
                  Grado y Grupo
                </span>
                <span className="font-bold block">
                  {student.grado} Grupo "{student.grupo}"
                </span>
              </div>
              <div>
                <span className="text-[9px] uppercase font-bold opacity-55 block">
                  Periodo / Tutor
                </span>
                <span className="font-semibold block truncate">
                  {meta.label} · {student.tutorNombre || 'Tutor'}
                </span>
              </div>
            </div>
          </div>
        );

      case 'promedio_destacado':
        if (isSepStyle) {
          return (
            <div
              className="w-full h-full flex flex-col justify-between overflow-hidden bg-white"
              style={{ fontSize: `${scale * 100}%` }}
            >
              <div
                className="w-full py-1 px-1.5 text-center text-[8px] sm:text-[9px] font-extrabold uppercase tracking-wider text-white leading-tight"
                style={{
                  backgroundColor: SEP_OFFICIAL_COLORS.guinda,
                  borderBottom: `2px solid ${SEP_OFFICIAL_COLORS.dorado}`,
                }}
              >
                PROMEDIO FINAL DE GRADO
              </div>
              <div className="flex-1 flex flex-col items-center justify-center p-1">
                <div
                  className="w-full py-1.5 rounded-xs border-2 text-center font-mono font-extrabold text-base sm:text-lg"
                  style={{
                    borderColor: SEP_OFFICIAL_COLORS.guinda,
                    color: SEP_OFFICIAL_COLORS.guinda,
                    backgroundColor: '#FAF6F0',
                  }}
                >
                  {finalAvg}
                </div>
              </div>
              <div
                className="w-full py-0.5 px-1 text-center text-[7px] sm:text-[8px] font-extrabold uppercase text-white"
                style={{ backgroundColor: SEP_OFFICIAL_COLORS.grisBarra }}
              >
                SITUACIÓN FINAL DEL ALUMNO
              </div>
              <div className="py-1 px-1 text-center text-[8px] sm:text-[9px] font-extrabold uppercase text-slate-800 bg-slate-50">
                {hasRecordedGrades
                  ? finalAvgNum >= 6
                    ? '☑ PROMOVIDO(A)'
                    : '☐ NO PROMOVIDO(A)'
                  : 'EN CURSO'}
              </div>
            </div>
          );
        }
        return (
          <div
            className="w-full h-full flex flex-col items-center justify-center px-2 py-1 rounded-xl overflow-hidden"
            style={{
              backgroundColor: el.backgroundColor || primaryColor,
              color: el.textColor || '#FFFFFF',
              fontSize: `${scale * 100}%`,
            }}
          >
            <span className="text-[9px] uppercase tracking-wider font-bold opacity-85">
              Promedio General
            </span>
            <span
              className="font-mono font-extrabold text-lg sm:text-xl leading-tight my-0.5 px-2.5 py-0.5 rounded"
              style={{ backgroundColor: accentColor, color: primaryColor }}
            >
              {finalAvg}
            </span>
            <span className="text-[9px] font-semibold opacity-90">
              {hasRecordedGrades
                ? finalAvgNum >= 6
                  ? 'Acreditado'
                  : 'No Acreditado'
                : 'Sin evaluaciones'}
            </span>
          </div>
        );

      case 'tabla_materias':
        return (
          <div
            className="w-full h-full overflow-hidden flex flex-col"
            style={{
              backgroundColor: el.backgroundColor || '#FFFFFF',
              fontSize: `${scale * 100}%`,
            }}
          >
            <table className="w-full text-[9px] sm:text-[10.5px] text-left border-collapse">
              <thead>
                {isSepStyle && (
                  <tr
                    className="text-white uppercase font-extrabold text-[8px] tracking-wider"
                    style={{ backgroundColor: SEP_OFFICIAL_COLORS.grisBarra }}
                  >
                    <th className="py-0.5 px-2 border border-slate-400">
                      CAMPOS FORMATIVOS / DISCIPLINAS
                    </th>
                    <th
                      colSpan={meta.periodCount}
                      className="py-0.5 px-1 text-center border border-slate-400"
                    >
                      PERIODOS DE EVALUACIÓN ({meta.label.toUpperCase()})
                    </th>
                    <th className="py-0.5 px-1 text-center border border-slate-400">
                      FINAL
                    </th>
                    <th className="py-0.5 px-2 border border-slate-400">
                      OBSERVACIONES
                    </th>
                  </tr>
                )}
                <tr
                  className="text-white uppercase font-bold tracking-wider"
                  style={{ backgroundColor: primaryColor }}
                >
                  <th className="py-1.5 px-2 border border-slate-300/40">
                    {isSepStyle ? 'Asignatura / Materia' : 'Materia / Asignatura'}
                  </th>
                  {meta.shortLabels.map((lbl, idx) => (
                    <th
                      key={idx}
                      className="py-1.5 px-1 text-center border border-slate-300/40"
                    >
                      {lbl}
                    </th>
                  ))}
                  <th
                    className="py-1.5 px-2 text-center border border-slate-300/40"
                    style={{
                      backgroundColor: accentColor,
                      color: isSepStyle ? '#1E1E1E' : primaryColor,
                    }}
                  >
                    Prom.
                  </th>
                  <th className="py-1.5 px-2 border border-slate-300/40">
                    Observaciones
                  </th>
                </tr>
              </thead>
              <tbody
                className="divide-y divide-slate-300"
                style={{ color: design.colorTextoTabla || '#1E293B' }}
              >
                {rowsWithPeriods.length > 0 ? (
                  rowsWithPeriods.map((g) => (
                    <tr key={g.id} className="even:bg-slate-50/80">
                      <td className="py-1 px-2 font-semibold truncate max-w-[145px] border-r border-slate-300">
                        {g.materiaNombre}
                      </td>
                      {g.pValues.map((val, pIdx) => (
                        <td
                          key={pIdx}
                          className="py-1 px-1 text-center font-mono tabular-nums border-r border-slate-300"
                        >
                          {val.toFixed(1)}
                        </td>
                      ))}
                      <td
                        className="py-1 px-2 text-center font-mono font-bold tabular-nums border-r border-slate-300"
                        style={{
                          backgroundColor: `${accentColor}28`,
                          color: primaryColor,
                        }}
                      >
                        {g.rowAvg.toFixed(1)}
                      </td>
                      <td className="py-1 px-2 text-[9px] italic text-slate-600 truncate max-w-[120px]">
                        {g.observaciones || 'Sin observaciones'}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={meta.periodCount + 3}
                      className="py-4 text-center text-slate-400 italic"
                    >
                      Sin materias dadas de alta en el grupo asignado al alumno.
                    </td>
                  </tr>
                )}
              </tbody>
              <tfoot>
                <tr className="bg-slate-100 font-bold border-t-2 border-slate-400 text-[9.5px]">
                  <td className="py-1.5 px-2 text-right uppercase text-slate-800 border-r border-slate-300">
                    Promedio General ({meta.label}):
                  </td>
                  <td
                    colSpan={meta.periodCount}
                    className="text-center font-mono text-slate-600 border-r border-slate-300"
                  >
                    {hasRecordedGrades
                      ? finalAvgNum >= 6
                        ? 'Acreditado'
                        : 'No Acreditado'
                      : 'Sin evaluaciones'}
                  </td>
                  <td
                    className="py-1.5 px-2 text-center font-mono font-extrabold border-r border-slate-300"
                    style={{
                      backgroundColor: accentColor,
                      color: isSepStyle ? '#1E1E1E' : primaryColor,
                    }}
                  >
                    {finalAvg}
                  </td>
                  <td className="py-1.5 px-2 text-[9px] font-semibold text-slate-700">
                    {hasRecordedGrades
                      ? finalAvgNum >= 9
                        ? 'Excelencia Académica'
                        : finalAvgNum >= 6
                        ? 'Promovido'
                        : 'No Promovido'
                      : 'En curso'}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        );

      case 'firma_director':
        return (
          <div
            className="w-full h-full flex flex-col justify-between items-center text-center overflow-hidden bg-white"
            style={{ color: el.textColor || '#1E293B', fontSize: `${scale * 100}%` }}
          >
            {isSepStyle && (
              <div
                className="w-full py-0.5 px-1 text-[7.5px] font-extrabold uppercase tracking-wider text-white"
                style={{ backgroundColor: SEP_OFFICIAL_COLORS.grisBarra }}
              >
                NOMBRE Y FIRMA DEL DIRECTOR(A)
              </div>
            )}
            <div className="flex-1 flex flex-col justify-end items-center w-full px-2 pb-1">
              <div className="font-serif italic text-slate-400 text-xs mb-0.5 truncate max-w-full">
                {college.director || 'Dirección General'}
              </div>
              <div className="w-full border-t border-slate-500 pt-0.5 font-bold text-[9.5px] sm:text-[10.5px] leading-tight truncate">
                {college.director || 'Dirección General'}
              </div>
              <div className="text-[8px] text-slate-500 uppercase">
                Director(a) de la Escuela
              </div>
            </div>
          </div>
        );

      case 'sello_digital':
        return (
          <div
            className="w-full h-full flex flex-col items-center justify-between text-center overflow-hidden bg-white"
            style={{ color: el.textColor || primaryColor, fontSize: `${scale * 100}%` }}
          >
            {isSepStyle && (
              <div
                className="w-full py-0.5 px-1 text-[7.5px] font-extrabold uppercase tracking-wider text-white"
                style={{ backgroundColor: SEP_OFFICIAL_COLORS.guinda }}
              >
                SELLO SISTEMA EDUCATIVO NACIONAL
              </div>
            )}
            <div className="flex-1 flex flex-col items-center justify-center p-1">
              <ShieldCheck className="w-4 h-4 mb-0.5" style={{ color: accentColor }} />
              <div className="text-[8.5px] font-mono font-bold uppercase leading-tight">
                ESTADOS UNIDOS MEXICANOS
              </div>
              <div className="text-[7.5px] font-mono text-slate-500 uppercase">
                CCT: {college.codigoCCT}
              </div>
            </div>
          </div>
        );

      case 'firma_docente': {
        const teacherName = resolveStudentTeacherName(student, college, teachers);
        return (
          <div
            className="w-full h-full flex flex-col justify-between items-center text-center overflow-hidden bg-white"
            style={{ color: el.textColor || '#1E293B', fontSize: `${scale * 100}%` }}
          >
            {isSepStyle && (
              <div
                className="w-full py-0.5 px-1 text-[7.5px] font-extrabold uppercase tracking-wider text-white"
                style={{ backgroundColor: SEP_OFFICIAL_COLORS.grisBarra }}
              >
                NOMBRE Y FIRMA DEL DOCENTE
              </div>
            )}
            <div className="flex-1 flex flex-col justify-end items-center w-full px-2 pb-1">
              <div className="font-serif italic text-slate-400 text-xs mb-0.5 truncate max-w-full">
                {teacherName}
              </div>
              <div className="w-full border-t border-slate-500 pt-0.5 font-bold text-[9.5px] sm:text-[10.5px] leading-tight truncate">
                {teacherName}
              </div>
              <div className="text-[8px] text-slate-500 uppercase">
                Docente / Maestra(o) de Grupo
              </div>
            </div>
          </div>
        );
      }

      case 'firma_tutor':
        return (
          <div
            className="w-full h-full flex flex-col justify-between items-center text-center overflow-hidden bg-white"
            style={{ color: el.textColor || '#1E293B', fontSize: `${scale * 100}%` }}
          >
            {isSepStyle && (
              <div
                className="w-full py-0.5 px-1 text-[7.5px] font-extrabold uppercase tracking-wider text-white"
                style={{ backgroundColor: SEP_OFFICIAL_COLORS.grisBarra }}
              >
                FIRMA DE MADRE, PADRE O TUTOR(A)
              </div>
            )}
            <div className="flex-1 flex flex-col justify-end items-center w-full px-2 pb-1">
              <div className="font-serif italic text-slate-400 text-xs mb-0.5 truncate max-w-full">
                {student.tutorNombre || 'Padre o Tutor Legal'}
              </div>
              <div className="w-full border-t border-slate-500 pt-0.5 font-bold text-[9.5px] sm:text-[10.5px] leading-tight truncate">
                {student.tutorNombre || 'Padre o Tutor Legal'}
              </div>
              <div className="text-[8px] text-slate-500 uppercase">
                Madre, Padre de Familia o Tutor(a)
              </div>
            </div>
          </div>
        );

      case 'texto_libre':
        return (
          <div
            className={`w-full h-full flex flex-col justify-center px-2 overflow-hidden ${alignClass}`}
            style={{
              backgroundColor: el.backgroundColor || 'transparent',
              color: el.textColor || '#64748B',
              fontSize: `${scale * 100}%`,
            }}
          >
            <p className="text-[8.5px] sm:text-[9.5px] font-bold tracking-wide leading-snug">
              {el.customText ||
                'SISTEMA EDUCATIVO NACIONAL · SECRETARÍA DE EDUCACIÓN PÚBLICA · BOLETA OFICIAL DE EVALUACIÓN'}
            </p>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div
      ref={containerRef}
      onClick={() => editable && onSelectElement?.(null)}
      className="relative w-full aspect-[8.5/11] shadow-lg overflow-hidden select-none print:shadow-none"
      style={{
        backgroundColor: design.colorFondoHoja || '#FFFFFF',
      }}
    >
      {/* Background Image Layer */}
      {design.imagenFondoUrl && (
        <img
          src={design.imagenFondoUrl}
          alt=""
          className="absolute inset-0 w-full h-full object-cover pointer-events-none"
          style={{ opacity: design.opacidadImagenFondo ?? 0.2 }}
        />
      )}

      {/* Institutional Shield Watermark Layer */}
      {design.marcaAguaEscudo && college.escudoUrl && (
        <div
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
          style={{ opacity: design.opacidadMarcaAgua ?? 0.06 }}
        >
          <img
            src={college.escudoUrl}
            alt=""
            className="w-1/2 h-1/2 object-contain"
          />
        </div>
      )}

      {/* Decorative Page Frame Layer */}
      {design.mostrarMarcoDecorativo && design.estiloMarco !== 'ninguno' && (
        <>
          {design.estiloMarco === 'simple' && (
            <div
              className="absolute inset-3 pointer-events-none rounded-sm"
              style={{ border: `2px solid ${frameColor}` }}
            />
          )}
          {design.estiloMarco === 'doble_institucional' && (
            <>
              <div
                className="absolute inset-2.5 pointer-events-none rounded-sm"
                style={{ border: `2.5px solid ${frameColor}` }}
              />
              <div
                className="absolute inset-4 pointer-events-none rounded-xs"
                style={{ border: `1px solid ${accentColor}` }}
              />
            </>
          )}
          {design.estiloMarco === 'esquinas_doradas' && (
            <>
              <div
                className="absolute inset-3 pointer-events-none"
                style={{ border: `1.5px solid ${frameColor}` }}
              />
              <div
                className="absolute top-2 left-2 w-8 h-8 border-t-4 border-l-4 pointer-events-none"
                style={{ borderColor: accentColor }}
              />
              <div
                className="absolute top-2 right-2 w-8 h-8 border-t-4 border-r-4 pointer-events-none"
                style={{ borderColor: accentColor }}
              />
              <div
                className="absolute bottom-2 left-2 w-8 h-8 border-b-4 border-l-4 pointer-events-none"
                style={{ borderColor: accentColor }}
              />
              <div
                className="absolute bottom-2 right-2 w-8 h-8 border-b-4 border-r-4 pointer-events-none"
                style={{ borderColor: accentColor }}
              />
            </>
          )}
        </>
      )}

      {/* Visual Guide Grid when Editing */}
      {editable && showGrid && (
        <div
          className="absolute inset-0 pointer-events-none opacity-25"
          style={{
            backgroundImage:
              'linear-gradient(to right, #94a3b8 1px, transparent 1px), linear-gradient(to bottom, #94a3b8 1px, transparent 1px)',
            backgroundSize: '5% 5%',
          }}
        />
      )}

      {/* Draggable / Positioned Canvas Elements */}
      {design.elementos
        .filter((el) => el.visible)
        .sort((a, b) => (a.zIndex || 1) - (b.zIndex || 1))
        .map((el) => {
          const isSelected = editable && selectedElementId === el.id;

          return (
            <div
              key={el.id}
              onPointerDown={(e) => handlePointerDown(e, el, 'move')}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onClick={(e) => {
                if (editable) {
                  e.stopPropagation();
                  onSelectElement?.(el.id);
                }
              }}
              className={`absolute transition-shadow ${
                editable ? 'cursor-move hover:ring-2 hover:ring-amber-400/80' : ''
              } ${
                isSelected
                  ? 'ring-2 ring-amber-500 shadow-lg z-40'
                  : ''
              }`}
              style={{
                left: `${el.x}%`,
                top: `${el.y}%`,
                width: `${el.w}%`,
                height: `${el.h}%`,
                zIndex: isSelected ? 50 : el.zIndex || 5,
                border: el.showBorder
                  ? `1.5px solid ${el.borderColor || '#CBD5E1'}`
                  : undefined,
                borderRadius: el.showBorder ? '0.5rem' : undefined,
                backgroundColor:
                  el.backgroundColor &&
                  el.type !== 'folio_boleta' &&
                  el.type !== 'datos_alumno' &&
                  el.type !== 'promedio_destacado' &&
                  el.type !== 'tabla_materias'
                    ? el.backgroundColor
                    : undefined,
              }}
            >
              {/* Floating Tag Label when Selected in Studio */}
              {isSelected && (
                <div className="absolute -top-6 left-0 bg-amber-500 text-slate-950 text-[10px] font-extrabold px-2 py-0.5 rounded-t-md shadow-xs flex items-center gap-1 whitespace-nowrap pointer-events-none z-50">
                  <Move className="w-3 h-3" />
                  <span>{el.label}</span>
                  <span className="font-mono opacity-75">
                    ({Math.round(el.x)}%, {Math.round(el.y)}%)
                  </span>
                </div>
              )}

              {renderElementContent(el)}

              {/* Bottom-Right Resize Handle in Studio */}
              {isSelected && (
                <div
                  onPointerDown={(e) => handlePointerDown(e, el, 'resize')}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerUp}
                  title="Arrastra para cambiar el tamaño de este bloque"
                  className="absolute -bottom-2 -right-2 w-4 h-4 rounded-full bg-amber-500 border-2 border-white shadow-md cursor-nwse-resize z-50"
                />
              )}
            </div>
          );
        })}
    </div>
  );
};
