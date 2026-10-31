import React, { useMemo } from 'react';
import { useApp } from '../context/AppContext';
import {
  GraduationCap,
  Layers,
  Award,
  BookOpen,
  ClipboardCheck,
  QrCode,
  Calendar,
  ClipboardList,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';
import { EvaluationPeriodicity } from '../types';
import {
  getEffectiveGradesForStudent,
  getGradePeriodsForModalidad,
} from '../utils/reportCardPdfGenerator';

interface Props {
  onNavigateTab: (tab: string) => void;
}

export const TeacherSummaryModule: React.FC<Props> = ({ onNavigateTab }) => {
  const {
    activeCollege,
    currentUser,
    students,
    teachers,
    subjects,
    tasksExams,
    evaluationSavedPeriods,
    grades,
    studentEvaluations,
    attendanceRecords,
  } = useApp();

  if (!activeCollege) return null;

  const primaryColor = activeCollege.colores?.primario || '#0B2545';
  const goldColor = activeCollege.colores?.secundario || '#C59B27';

  // Find teacher record matching currentUser if available (prioritizing ID, exact Name, and Login before Email)
  const teacherRecord = useMemo(() => {
    const collegeTeachers = (teachers || []).filter((t) => t.colegioId === activeCollege.id);
    const expectedTchId = currentUser.id.replace(/^usr-/, '');
    const usrLogin = (currentUser.usuarioLogin || '').trim().toLowerCase();
    const normEmail = (currentUser.correo || '').trim().toLowerCase();
    const normName = (currentUser.nombre || '').trim().toLowerCase();

    const byId = collegeTeachers.find(
      (t) => t.id === currentUser.id || t.id === expectedTchId
    );
    if (byId) return byId;

    if (normName) {
      const byName = collegeTeachers.find(
        (t) => (t.nombre || '').trim().toLowerCase() === normName
      );
      if (byName) return byName;
    }

    if (usrLogin) {
      const byLogin = collegeTeachers.find((t) => {
        const generatedFromTch = (t.nombre || '')
          .trim()
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '');
        const parts = generatedFromTch.split(/\s+/).filter(Boolean);
        const candidatePrefix =
          parts.length >= 2 ? `${parts[0][0]}${parts[1]}` : parts[0] || '';
        return Boolean(candidatePrefix && usrLogin.startsWith(candidatePrefix));
      });
      if (byLogin) return byLogin;
    }

    if (normEmail) {
      const emailMatches = collegeTeachers.filter(
        (t) => (t.correo || '').trim().toLowerCase() === normEmail
      );
      if (emailMatches.length === 1) return emailMatches[0];
    }

    return null;
  }, [teachers, activeCollege.id, currentUser]);

  const currentOwnerIds = useMemo(() => {
    const ids = new Set<string>();
    if (currentUser.id) {
      ids.add(currentUser.id.trim().toLowerCase());
      ids.add(currentUser.id.replace(/^usr-/, '').trim().toLowerCase());
    }
    if (currentUser.usuarioLogin) {
      ids.add(currentUser.usuarioLogin.trim().toLowerCase());
    }
    if (teacherRecord?.id) {
      ids.add(teacherRecord.id.trim().toLowerCase());
      ids.add(`usr-${teacherRecord.id}`.trim().toLowerCase());
    }
    return ids;
  }, [currentUser, teacherRecord]);

  const currentOwnerNames = useMemo(() => {
    const names = new Set<string>();
    if (currentUser.nombre) names.add(currentUser.nombre.trim().toLowerCase());
    if (teacherRecord?.nombre) {
      names.add(teacherRecord.nombre.trim().toLowerCase());
    }
    return names;
  }, [currentUser.nombre, teacherRecord]);

  const activePeriodicity: EvaluationPeriodicity =
    activeCollege.periodicidadEvaluacion || 'bimestral';

  const collegeSavedPeriods = useMemo(
    () =>
      (evaluationSavedPeriods || []).filter((p) => {
        if (p.colegioId !== activeCollege.id) return false;
        const pDocId = (p.docenteId || '').trim().toLowerCase();
        const pDocName = (p.docenteNombre || '').trim().toLowerCase();
        if (pDocId && currentOwnerIds.has(pDocId)) return true;
        if (pDocName && currentOwnerNames.has(pDocName)) return true;
        if (
          !pDocId &&
          !pDocName &&
          Array.isArray(p.conceptos) &&
          p.conceptos.length > 0 &&
          p.conceptos.every(
            (c) => c.docenteId && currentOwnerIds.has(c.docenteId.trim().toLowerCase())
          )
        ) {
          return true;
        }
        return false;
      }),
    [evaluationSavedPeriods, activeCollege.id, currentOwnerIds, currentOwnerNames]
  );

  // Materias asignadas exclusivamente a este docente
  const collegeSubjects = useMemo(() => {
    if (!teacherRecord) return [];
    const assignedNames = (teacherRecord.materias || [])
      .map((m) => m.trim())
      .filter(Boolean);
    const assignedNamesLower = new Set(assignedNames.map((m) => m.toLowerCase()));
    return (subjects || []).filter((s) => {
      if (s.colegioId !== activeCollege.id) return false;
      if (assignedNamesLower.size > 0) {
        return assignedNamesLower.has(s.nombre.trim().toLowerCase());
      }
      return (
        s.docenteId === teacherRecord.id ||
        (s.docenteNombre &&
          s.docenteNombre.trim().toLowerCase() === teacherRecord.nombre.trim().toLowerCase())
      );
    });
  }, [subjects, activeCollege.id, teacherRecord]);

  const teacherSubjectIds = useMemo(
    () => new Set(collegeSubjects.map((s) => s.id)),
    [collegeSubjects]
  );
  const teacherSubjectNames = useMemo(
    () =>
      new Set(
        [
          ...collegeSubjects.map((s) => s.nombre),
          ...(teacherRecord?.materias || []),
        ]
          .filter(Boolean)
          .map((n) => n.trim().toLowerCase())
      ),
    [collegeSubjects, teacherRecord]
  );

  // Calificaciones y Asistencias son a nivel global para consulta de quienes tengan acceso
  const allCollegeSavedPeriodsGlobal = useMemo(
    () => (evaluationSavedPeriods || []).filter((p) => p.colegioId === activeCollege.id),
    [evaluationSavedPeriods, activeCollege.id]
  );

  const evaluatedPeriodsForCollege = useMemo(() => {
    const collegeEvals = (studentEvaluations || []).filter(
      (e) => e.colegioId === activeCollege.id && Number(e.calificacionFinalPeriodo) > 0
    );
    return allCollegeSavedPeriodsGlobal.filter((p) =>
      collegeEvals.some(
        (e) =>
          p.periodicidad === e.periodicidad &&
          Number(p.periodoIndex) === Number(e.periodoIndex)
      )
    );
  }, [
    allCollegeSavedPeriodsGlobal,
    studentEvaluations,
    activeCollege.id,
  ]);

  const collegeGrades = useMemo(() => {
    return (grades || []).filter((g) => {
      if (g.colegioId !== activeCollege.id) return false;
      const pValues = getGradePeriodsForModalidad(
        g,
        activePeriodicity,
        evaluatedPeriodsForCollege
      );
      return pValues.some((v) => v > 0);
    });
  }, [
    grades,
    activeCollege.id,
    evaluatedPeriodsForCollege,
    activePeriodicity,
  ]);

  const collegeAttendances = useMemo(
    () => (attendanceRecords || []).filter((a) => a.colegioId === activeCollege.id),
    [attendanceRecords, activeCollege.id]
  );

  // Students assigned to this teacher (excluding students in estatus 'baja')
  const teacherStudents = useMemo(() => {
    const allInCollege = (students || []).filter(
      (s) => s.colegioId === activeCollege.id && s.estatus !== 'baja'
    );
    const assignedGroups = new Set<string>();
    if (teacherRecord) {
      (teacherRecord.gruposAsignados || []).forEach((ga: any) => {
        if (typeof ga === 'string') {
          const parts = ga.trim().split(/\s+/);
          if (parts.length >= 2) {
            assignedGroups.add(`${parts[0]}:::${parts[1].toUpperCase()}`);
          }
        } else if (ga && ga.grado && ga.grupo) {
          assignedGroups.add(`${ga.grado.trim()}:::${ga.grupo.trim().toUpperCase()}`);
        }
      });
      (teacherRecord.grupos || []).forEach((g: string) => {
        const parts = g.trim().split(/\s+/);
        if (parts.length >= 2) {
          assignedGroups.add(`${parts[0]}:::${parts[1].toUpperCase()}`);
        }
      });
      if (teacherRecord.esTutorGrupo && teacherRecord.tutorGrado && teacherRecord.tutorGrupo) {
        assignedGroups.add(
          `${teacherRecord.tutorGrado.trim()}:::${teacherRecord.tutorGrupo.trim().toUpperCase()}`
        );
      }
      (subjects || [])
        .filter((s) => s.colegioId === activeCollege.id && s.docenteId === teacherRecord.id)
        .forEach((sub: any) => {
          const grps: string[] = sub.grupos && sub.grupos.length > 0 ? sub.grupos : [sub.grupo || 'A'];
          grps.forEach((grp: string) => {
            if (sub.grado && grp) {
              assignedGroups.add(`${sub.grado.trim()}:::${grp.trim().toUpperCase()}`);
            }
          });
        });
    }

    return allInCollege.filter((s) => {
      if (s.docenteId === currentUser.id) return true;
      if (teacherRecord && s.docenteId === teacherRecord.id) return true;
      const key = `${(s.grado || '').trim()}:::${(s.grupo || '').trim().toUpperCase()}`;
      if (assignedGroups.has(key)) return true;
      if (
        teacherRecord &&
        Array.isArray(teacherRecord.grupos) &&
        teacherRecord.grupos.some((g) => g.includes(s.grado) && g.includes(s.grupo))
      ) {
        return true;
      }
      return false;
    });
  }, [students, activeCollege.id, currentUser.id, teacherRecord, subjects]);

  // Breakdown by group with real average GPA and attendance per group (matching GradesModule)
  const teacherGroupsBreakdown = useMemo(() => {
    const map = new Map<
      string,
      {
        groupName: string;
        grado: string;
        grupo: string;
        studentCount: number;
        gradedStudentCount: number;
        gpaSum: number;
        attendanceSum: number;
      }
    >();

    teacherStudents.forEach((st) => {
      const grpKey = `${st.grado} "${st.grupo}"`;
      const effectiveRows = getEffectiveGradesForStudent({
        student: st,
        college: activeCollege,
        grades: collegeGrades,
        subjects,
        teachers,
        hasSavedPeriods: evaluatedPeriodsForCollege.length > 0,
        savedPeriods: evaluatedPeriodsForCollege,
      });

      const recordedSubjectAvgs: number[] = [];
      effectiveRows.forEach((g) => {
        const pValues = getGradePeriodsForModalidad(
          g,
          activePeriodicity,
          evaluatedPeriodsForCollege
        );
        const nonZero = pValues.filter((v) => v > 0);
        if (nonZero.length > 0) {
          const avgRow = Number(
            (nonZero.reduce((acc, v) => acc + v, 0) / nonZero.length).toFixed(1)
          );
          if (avgRow > 0) {
            recordedSubjectAvgs.push(avgRow);
          }
        }
      });

      const hasRecordedGrade = recordedSubjectAvgs.length > 0;
      const stGpa = hasRecordedGrade
        ? recordedSubjectAvgs.reduce((a, b) => a + b, 0) / recordedSubjectAvgs.length
        : 0;

      const sAtt = collegeAttendances.filter((a) => a.estudianteId === st.id);
      const stAtt =
        sAtt.length > 0
          ? Math.round(
              (sAtt.filter((a) => a.estado === 'presente' || a.estado === 'retardo').length /
                sAtt.length) *
                100
            )
          : 0;

      const existing = map.get(grpKey);
      if (existing) {
        existing.studentCount += 1;
        if (hasRecordedGrade && stGpa > 0) {
          existing.gradedStudentCount += 1;
          existing.gpaSum += stGpa;
        }
        existing.attendanceSum += stAtt;
      } else {
        map.set(grpKey, {
          groupName: grpKey,
          grado: st.grado,
          grupo: st.grupo,
          studentCount: 1,
          gradedStudentCount: hasRecordedGrade && stGpa > 0 ? 1 : 0,
          gpaSum: hasRecordedGrade && stGpa > 0 ? stGpa : 0,
          attendanceSum: stAtt,
        });
      }
    });

    return Array.from(map.values()).map((item) => ({
      ...item,
      promedioGrupo:
        item.gradedStudentCount > 0
          ? Number((item.gpaSum / item.gradedStudentCount).toFixed(1))
          : 0,
      asistenciaGrupo: Math.round(item.attendanceSum / Math.max(1, item.studentCount)),
    }));
  }, [
    teacherStudents,
    activeCollege,
    collegeGrades,
    subjects,
    teachers,
    evaluatedPeriodsForCollege,
    teacherRecord,
    teacherSubjectIds,
    teacherSubjectNames,
    activePeriodicity,
    collegeAttendances,
  ]);

  const groupsWithGrades = teacherGroupsBreakdown.filter((g) => g.gradedStudentCount > 0);
  const overallTeacherGpa =
    groupsWithGrades.length > 0
      ? (
          groupsWithGrades.reduce((acc, g) => acc + g.promedioGrupo, 0) /
          groupsWithGrades.length
        ).toFixed(1)
      : '0.0';

  const collegeTasksExams = (tasksExams || []).filter((t) => {
    if (t.colegioId !== activeCollege.id) return false;
    const itemDocId = (t.docenteId || '').trim().toLowerCase();
    const itemDocName = (t.docenteNombre || '').trim().toLowerCase();
    const matchesOwner =
      Boolean(itemDocId && currentOwnerIds.has(itemDocId)) ||
      Boolean(itemDocName && currentOwnerNames.has(itemDocName));
    if (!matchesOwner) return false;
    if (teacherSubjectNames.size > 0 && t.materia) {
      const itemSub = t.materia.trim().toLowerCase();
      return Array.from(teacherSubjectNames).some(
        (sub) => itemSub === sub || itemSub.includes(sub) || sub.includes(itemSub)
      );
    }
    return true;
  });
  const savedPeriodsCount = collegeSavedPeriods.length;

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Institutional Hero Header */}
      <div
        className="rounded-2xl p-6 lg:p-7 text-white shadow-md relative overflow-hidden transition-colors"
        style={{
          background: `linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}dd 65%, ${primaryColor}bb 100%)`,
          borderBottom: `4px solid ${goldColor}`,
        }}
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-4 sm:gap-5">
            {activeCollege.escudoUrl && (
              <div className="bg-white p-2 rounded-2xl shadow-lg border border-white/20 shrink-0">
                <img
                  src={activeCollege.escudoUrl}
                  alt={activeCollege.nombre}
                  className="w-16 h-16 sm:w-20 sm:h-20 object-contain"
                />
              </div>
            )}

            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider shadow-2xs"
                  style={{ backgroundColor: goldColor, color: primaryColor }}
                >
                  Resumen Docentes · Panel Académico del Profesor
                </span>
                {teacherRecord && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-white/15 text-white border border-white/25">
                    Especialidad: {teacherRecord.especialidad}
                  </span>
                )}
              </div>

              <h2 className="font-display font-bold text-2xl sm:text-3xl text-white tracking-tight">
                { currentUser.nombre }
              </h2>

              <p className="text-xs sm:text-sm text-slate-200 max-w-2xl">
                {activeCollege.nombre} · Resumen de tus alumnos asignados, cantidad de grupos, promedio académico por cada grupo y accesos directos a tu bitácora docente.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Action Bar */}
      <div className="flex flex-wrap items-center justify-end gap-2.5">
        <button
          type="button"
          onClick={() => onNavigateTab('evaluaciones')}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs text-white shadow-sm transition-all cursor-pointer"
          style={{ backgroundColor: primaryColor }}
        >
          <ClipboardCheck className="w-4 h-4" style={{ color: goldColor }} />
          <span>Mis Bitácoras y Evaluaciones</span>
        </button>
        <button
          type="button"
          onClick={() => onNavigateTab('tareas_examenes')}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs text-white shadow-sm transition-all cursor-pointer"
          style={{ backgroundColor: primaryColor }}
        >
          <ClipboardList className="w-4 h-4" style={{ color: goldColor }} />
          <span>Tareas y Exámenes</span>
        </button>
        <button
          type="button"
          onClick={() => onNavigateTab('asistencias')}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs shadow-sm transition-all cursor-pointer"
          style={{ backgroundColor: goldColor, color: primaryColor }}
        >
          <QrCode className="w-4 h-4" />
          <span>Pase de Lista QR</span>
        </button>
      </div>

      {/* 4 Main KPI Cards for Docente */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Número de Alumnos */}
        <div
          onClick={() => onNavigateTab('evaluaciones')}
          className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs hover:shadow-md transition-all cursor-pointer flex items-center justify-between"
        >
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Número de Alumnos
            </span>
            <div className="text-3xl font-display font-black text-slate-900 mt-1">
              {teacherStudents.length}
            </div>
            <span className="text-[11px] font-semibold text-emerald-700 mt-1 inline-flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Alumnos asignados en lista</span>
            </span>
          </div>
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
            style={{ backgroundColor: `${primaryColor}12`, color: primaryColor }}
          >
            <GraduationCap className="w-6 h-6" />
          </div>
        </div>

        {/* KPI 2: Cantidad de Grupos */}
        <div
          onClick={() => onNavigateTab('horarios')}
          className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs hover:shadow-md transition-all cursor-pointer flex items-center justify-between"
        >
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Cantidad de Grupos
            </span>
            <div className="text-3xl font-display font-black text-slate-900 mt-1">
              {teacherGroupsBreakdown.length}
            </div>
            <span className="text-[11px] font-semibold text-slate-500 mt-1 block truncate max-w-[160px]">
              {teacherGroupsBreakdown.map((g) => g.groupName).join(', ')}
            </span>
          </div>
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
            style={{ backgroundColor: `${goldColor}25`, color: primaryColor }}
          >
            <Layers className="w-6 h-6" />
          </div>
        </div>

        {/* KPI 3: Promedio General de Grupos */}
        <div
          onClick={() => onNavigateTab('calificaciones')}
          className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs hover:shadow-md transition-all cursor-pointer flex items-center justify-between"
        >
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Promedio General
            </span>
            <div className="text-3xl font-display font-black text-slate-900 mt-1">
              {overallTeacherGpa}
            </div>
            <span className="text-[11px] font-semibold text-slate-500 mt-1 block">
              Escala oficial 0 a 10
            </span>
          </div>
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
            style={{ backgroundColor: `${primaryColor}12`, color: primaryColor }}
          >
            <Award className="w-6 h-6" />
          </div>
        </div>

        {/* KPI 4: Tareas, Exámenes y Bitácoras */}
        <div
          onClick={() => onNavigateTab('tareas_examenes')}
          className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs hover:shadow-md transition-all cursor-pointer flex items-center justify-between"
        >
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Tareas y Evaluaciones
            </span>
            <div className="text-3xl font-display font-black text-slate-900 mt-1">
              {collegeTasksExams.length}
            </div>
            <span className="text-[11px] font-semibold text-slate-600 mt-1 block">
              {savedPeriodsCount} periodo(s) en Mis Bitácoras
            </span>
          </div>
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
            style={{ backgroundColor: `${goldColor}25`, color: primaryColor }}
          >
            <BookOpen className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Main Content Grid: Promedio de Cada Grupo + Alumnos Asignados */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Promedio de Cada Grupo y Métricas */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="font-display font-bold text-base text-slate-900 flex items-center gap-2">
                <Layers className="w-5 h-5" style={{ color: primaryColor }} />
                <span>Promedio por Cada Grupo Asignado ({teacherGroupsBreakdown.length})</span>
              </h3>
              <p className="text-xs text-slate-500">
                Desglose del número de alumnos, asistencia media y promedio de calificación de cada uno de tus grupos
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab('evaluaciones')}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-white cursor-pointer"
              style={{ backgroundColor: primaryColor }}
            >
              <span>Evaluar en Bitácora</span>
              <ArrowRight className="w-3.5 h-3.5" style={{ color: goldColor }} />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr
                  className="text-white text-[10px] font-bold uppercase tracking-wider"
                  style={{ backgroundColor: primaryColor }}
                >
                  <th className="py-3 px-4">Grupo Asignado</th>
                  <th className="py-3 px-4 text-center">Número de Alumnos</th>
                  <th className="py-3 px-4 text-center">Asistencia del Grupo</th>
                  <th className="py-3 px-4 text-center">Promedio del Grupo</th>
                  <th className="py-3 px-4 text-right">Acción Rápida</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {teacherGroupsBreakdown.map((grp) => (
                  <tr key={grp.groupName} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-display font-bold text-slate-900">
                      <span
                        className="px-3 py-1 rounded-xl text-xs font-extrabold"
                        style={{ backgroundColor: `${primaryColor}12`, color: primaryColor }}
                      >
                        Grupo {grp.groupName}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-800">
                      {grp.studentCount} alumno(s)
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono">
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold">
                        {grp.asistenciaGrupo}%
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono">
                      <span
                        className="px-3 py-1 rounded-xl font-black text-sm"
                        style={{ backgroundColor: `${goldColor}25`, color: primaryColor }}
                      >
                        {grp.promedioGrupo.toFixed(1)}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => onNavigateTab('evaluaciones')}
                        className="px-3 py-1.5 rounded-xl text-[11px] font-bold text-white cursor-pointer"
                        style={{ backgroundColor: primaryColor }}
                      >
                        Abrir Bitácora
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: Materias Impartidas y Actividades */}
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-2xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4" style={{ color: primaryColor }} />
                <h3 className="font-display font-bold text-sm text-slate-900">
                  Materias y Carga Horaria
                </h3>
              </div>
              {teacherRecord && (
                <span
                  className="px-2.5 py-0.5 rounded-full text-[10px] font-bold"
                  style={{ backgroundColor: `${goldColor}25`, color: primaryColor }}
                >
                  {teacherRecord.horasSemanales} hrs/sem
                </span>
              )}
            </div>

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {collegeSubjects.map((sub) => (
                <div
                  key={sub.id}
                  className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-2"
                >
                  <div className="min-w-0">
                    <div className="font-bold text-xs text-slate-900 truncate">
                      {sub.nombre}
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono">
                      Clave: {sub.clave} · Grado: {sub.grado}
                    </div>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-slate-600 shrink-0">
                    {sub.horasSemanales}h
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-2xs space-y-2.5">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
              <Calendar className="w-4 h-4" style={{ color: primaryColor }} />
              <h3 className="font-display font-bold text-sm text-slate-900">
                Herramientas del Docente
              </h3>
            </div>

            <button
              type="button"
              onClick={() => onNavigateTab('actividades_docentes')}
              className="w-full p-3 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 flex items-center justify-between text-xs font-bold text-slate-800 cursor-pointer"
            >
              <span>Planeaciones Docentes</span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
            </button>
            <button
              type="button"
              onClick={() => onNavigateTab('horarios')}
              className="w-full p-3 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 flex items-center justify-between text-xs font-bold text-slate-800 cursor-pointer"
            >
              <span>Mi Horario de Clases</span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
