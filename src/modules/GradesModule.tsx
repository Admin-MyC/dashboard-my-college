import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import {
  Award,
  Printer,
  Search,
  Edit2,
  Download,
  Users,
  Building2,
  Calendar,
  Lock,
  Palette,
  FileSpreadsheet,
} from 'lucide-react';
import {
  Student,
  GradeRecord,
  EvaluationPeriodicity,
  EVALUATION_PERIODICITY_CONFIG,
  ReportCardDesignConfig,
} from '../types';
import { ReportCardModal } from '../components/ReportCardModal';
import { ReportCardDesignStudio } from '../components/ReportCardDesignStudio';
import {
  generateReportCardsPdf,
  getGradePeriodsForModalidad,
  getEffectiveGradesForStudent,
  resolveStudentEffectiveLevel,
} from '../utils/reportCardPdfGenerator';

interface GradesModuleProps {
  onNavigateTab?: (tab: string) => void;
}

export const GradesModule: React.FC<GradesModuleProps> = ({ onNavigateTab }) => {
  const {
    activeCollege,
    currentUser,
    students,
    grades,
    subjects,
    teachers,
    evaluationSavedPeriods,
    studentEvaluations,
    schoolCycles,
    addGrade,
    updateGrade,
    updateCollegeReportCardDesign,
    setCollegeEvaluationPeriodicity,
  } = useApp();
  const [activeSubTab, setActiveSubTab] = useState<'sabana' | 'diseno'>('sabana');
  const [selectedStudentForReport, setSelectedStudentForReport] = useState<Student | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGroupFilter, setSelectedGroupFilter] = useState<string>('todos');
  const [isDownloadingGroupPdf, setIsDownloadingGroupPdf] = useState(false);
  const [isDownloadingCollegePdf, setIsDownloadingCollegePdf] = useState(false);
  const [editingGradeId, setEditingGradeId] = useState<string | null>(null);
  const [tempPeriods, setTempPeriods] = useState<number[]>([]);

  if (!activeCollege) return null;

  const collegeCycles = (schoolCycles || []).filter((c) => c.colegioId === activeCollege.id);
  const activeCycle = collegeCycles.find((c) => c.activo) || collegeCycles[0] || null;
  const [selectedCycleId, setSelectedCycleId] = useState<string>(() => activeCycle?.id || '');

  const selectedCycleObj = collegeCycles.find((c) => c.id === selectedCycleId) || activeCycle;

  const activePeriodicity: EvaluationPeriodicity =
    activeCollege.periodicidadEvaluacion || 'bimestral';
  const meta =
    EVALUATION_PERIODICITY_CONFIG[activePeriodicity] ||
    EVALUATION_PERIODICITY_CONFIG.bimestral;

  const primaryColor = activeCollege.colores.primario || '#0B2545';
  const goldColor = activeCollege.colores.secundario || '#C59B27';

  const isTeacherRole = currentUser.rol === 'docente';

  const collegeTeachers = teachers.filter((t) => t.colegioId === activeCollege.id);
  const collegeSubjects = subjects.filter((s) => s.colegioId === activeCollege.id);
  const collegeSavedPeriods = (evaluationSavedPeriods || []).filter(
    (p) =>
      p.colegioId === activeCollege.id &&
      (!p.cicloId || p.cicloId === selectedCycleId || (!selectedCycleId && p.cicloId === activeCycle?.id))
  );
  const collegeEvals = (studentEvaluations || []).filter(
    (e) =>
      e.colegioId === activeCollege.id &&
      (!e.cicloId || e.cicloId === selectedCycleId || (!selectedCycleId && e.cicloId === activeCycle?.id))
  );
  const evaluatedPeriodsForCollege = collegeSavedPeriods.filter((p) =>
    collegeEvals.some(
      (ev) =>
        ev.periodicidad === p.periodicidad &&
        Number(ev.periodoIndex) === Number(p.periodoIndex) &&
        Number(ev.calificacionFinalPeriodo) > 0
    )
  );
  const collegeGrades = grades.filter((g) => {
    if (g.colegioId !== activeCollege.id) return false;
    if (selectedCycleId && g.cicloId && g.cicloId !== selectedCycleId) return false;
    if (!g.cicloId && selectedCycleId !== activeCycle?.id) return false;
    const pVals = getGradePeriodsForModalidad(
      g,
      activePeriodicity,
      evaluatedPeriodsForCollege
    );
    return pVals.some((v) => v > 0);
  });

  // Resolver el registro de docente vinculado al usuario en sesión (solo si su rol es 'docente')
  const currentTeacherProfile = useMemo(() => {
    if (!isTeacherRole) return null;
    const expectedTchId = currentUser.id.replace(/^usr-/, '');
    const usrLogin = (currentUser.usuarioLogin || '').trim().toLowerCase();
    const usrName = (currentUser.nombre || '').trim().toLowerCase();
    const usrEmail = (currentUser.correo || '').trim().toLowerCase();

    const byId = collegeTeachers.find(
      (t) => t.id === currentUser.id || t.id === expectedTchId
    );
    if (byId) return byId;

    if (usrName) {
      const byName = collegeTeachers.find(
        (t) => (t.nombre || '').trim().toLowerCase() === usrName
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

    if (usrEmail) {
      const emailMatches = collegeTeachers.filter(
        (t) => (t.correo || '').trim().toLowerCase() === usrEmail
      );
      if (emailMatches.length === 1) return emailMatches[0];
    }

    return null;
  }, [isTeacherRole, currentUser, collegeTeachers]);

  // Verifica si un alumno pertenece a alguno de los grupos que el docente tiene asignados
  const isStudentInTeacherAssignedGroups = (student: Student): boolean => {
    if (!isTeacherRole) return true;
    if (!currentTeacherProfile) return false;

    const stLevel = resolveStudentEffectiveLevel(student, activeCollege);
    const stGrado = (student.grado || '').trim();
    const stGrupo = (student.grupo || '').replace(/["']/g, '').trim().toUpperCase();

    if (
      !stGrupo ||
      stGrupo === 'SIN GRUPO' ||
      stGrupo.includes('SIN GRUPO') ||
      stGrupo.includes('PENDIENTE')
    ) {
      return false;
    }

    // Si el docente tiene un nivel específico asignado, debe coincidir con el nivel del alumno
    if (
      currentTeacherProfile.nivel &&
      currentTeacherProfile.nivel.trim().toLowerCase() !== stLevel.toLowerCase()
    ) {
      return false;
    }

    const cleanGradeGroup = `${stGrado} ${stGrupo}`.replace(/\s+/g, ' ').trim().toLowerCase();
    const cleanFullGroup = `${stLevel} ${stGrado} ${stGrupo}`.replace(/\s+/g, ' ').trim().toLowerCase();
    const cleanCompact = `${stGrado}${stGrupo}`.replace(/\s+/g, '').toLowerCase();

    const hasGroupInProfile = (currentTeacherProfile.grupos || []).some((grp) => {
      const norm = grp.replace(/["']/g, '').replace(/\s+/g, ' ').trim().toLowerCase();
      const normCompact = norm.replace(/\s+/g, '');
      return norm === cleanFullGroup || norm === cleanGradeGroup || normCompact === cleanCompact;
    });

    const isGroupTutor =
      Boolean(currentTeacherProfile.esTutorPrincipal) &&
      (currentTeacherProfile.grupoTutorado || '')
        .replace(/["']/g, '')
        .replace(/\s+/g, ' ')
        .trim()
        .toLowerCase() === cleanGradeGroup;

    const isDirectStudentTeacher = student.docenteId === currentTeacherProfile.id;

    return hasGroupInProfile || isGroupTutor || isDirectStudentTeacher;
  };

  const collegeStudents = useMemo(() => {
    return students.filter(
      (s) =>
        s.colegioId === activeCollege.id &&
        s.estatus !== 'baja' &&
        isStudentInTeacherAssignedGroups(s)
    );
  }, [students, activeCollege, isTeacherRole, currentTeacherProfile]);

  // Verifica si el usuario actual es docente y tiene asignado TANTO el grupo del alumno COMO la materia de esa fila
  const canEditStudentSubjectGrade = (student: Student, g: GradeRecord): boolean => {
    if (currentUser.rol !== 'docente' || !currentTeacherProfile) {
      return false;
    }

    const stLevel = resolveStudentEffectiveLevel(student, activeCollege);
    const stGrado = (student.grado || '').trim();
    const stGrupo = (student.grupo || '').replace(/["']/g, '').trim().toUpperCase();
    const cleanGradeGroup = `${stGrado} ${stGrupo}`.replace(/\s+/g, ' ').trim().toLowerCase();
    const cleanFullGroup = `${stLevel} ${stGrado} ${stGrupo}`.replace(/\s+/g, ' ').trim().toLowerCase();

    // Si el docente tiene un nivel específico asignado, debe coincidir con el nivel del alumno
    if (
      currentTeacherProfile.nivel &&
      currentTeacherProfile.nivel.trim().toLowerCase() !== stLevel.toLowerCase()
    ) {
      return false;
    }

    // 1. Validar que el docente tenga asignado el grupo del alumno
    const hasGroupInProfile = (currentTeacherProfile.grupos || []).some((grp) => {
      const norm = grp.replace(/["']/g, '').replace(/\s+/g, ' ').trim().toLowerCase();
      return norm === cleanFullGroup || norm === cleanGradeGroup;
    });
    const isGroupTutor =
      Boolean(currentTeacherProfile.esTutorPrincipal) &&
      (currentTeacherProfile.grupoTutorado || '')
        .replace(/["']/g, '')
        .replace(/\s+/g, ' ')
        .trim()
        .toLowerCase() === cleanGradeGroup;
    const isDirectStudentTeacher = student.docenteId === currentTeacherProfile.id;

    // Buscar si la materia en Materias y Grupos tiene asignado directamente a este docente para este grado/grupo
    const matchingSubjectRecord = collegeSubjects.find((sub) => {
      const sameSubject =
        sub.id === g.materiaId ||
        sub.nombre.trim().toLowerCase() === g.materiaNombre.trim().toLowerCase();
      if (!sameSubject) return false;
      const gradeMatch = (sub.grado || '').match(/([1-6]°)/);
      if (gradeMatch && gradeMatch[1] !== stGrado) return false;
      if (
        sub.grupo &&
        sub.grupo.trim() !== '' &&
        sub.grupo !== 'Sin Grupo' &&
        !sub.grupo.includes('Pendiente')
      ) {
        if (sub.grupo.replace(/["']/g, '').trim().toUpperCase() !== stGrupo) return false;
      }
      return true;
    });

    const isAssignedInSubjectRecord =
      Boolean(matchingSubjectRecord) &&
      (matchingSubjectRecord?.docenteId === currentTeacherProfile.id ||
        (matchingSubjectRecord?.docenteNombre || '').trim().toLowerCase() ===
          currentTeacherProfile.nombre.trim().toLowerCase());

    const hasGroupAssigned =
      hasGroupInProfile || isGroupTutor || isDirectStudentTeacher || isAssignedInSubjectRecord;

    if (!hasGroupAssigned) {
      return false;
    }

    // 2. Validar que el docente tenga asignada dicha materia
    const targetSubjectName = g.materiaNombre.trim().toLowerCase();
    const hasSubjectInProfile = (currentTeacherProfile.materias || []).some(
      (m) => m.trim().toLowerCase() === targetSubjectName
    );

    return hasSubjectInProfile || isAssignedInSubjectRecord;
  };

  // Extract distinct Grado + Grupo options available in this college (or assigned to this teacher)
  const availableGroups = useMemo(() => {
    const set = new Set<string>();
    if (isTeacherRole && currentTeacherProfile) {
      (currentTeacherProfile.grupos || []).forEach((grp) => {
        const clean = grp.replace(/["']/g, '').replace(/\s+/g, ' ').trim();
        const parts = clean.split(' ');
        if (parts.length >= 2) {
          const gr = parts[0].trim();
          const gp = parts.slice(1).join(' ').trim().toUpperCase();
          if (gr && gp) set.add(`${gr}:::${gp}`);
        }
      });
      if (currentTeacherProfile.esTutorPrincipal && currentTeacherProfile.grupoTutorado) {
        const cleanTut = currentTeacherProfile.grupoTutorado.replace(/["']/g, '').replace(/\s+/g, ' ').trim();
        const parts = cleanTut.split(' ');
        if (parts.length >= 2) {
          const gr = parts[0].trim();
          const gp = parts.slice(1).join(' ').trim().toUpperCase();
          if (gr && gp) set.add(`${gr}:::${gp}`);
        }
      }
    }
    collegeStudents.forEach((s) => {
      if (s.grupo && s.grupo !== 'Sin Grupo' && !s.grupo.includes('Pendiente')) {
        const label = `${s.grado}:::${s.grupo}`;
        set.add(label);
      }
    });
    return Array.from(set).sort();
  }, [collegeStudents, isTeacherRole, currentTeacherProfile]);

  const filteredStudents = collegeStudents.filter((s) => {
    const matchesSearch =
      s.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.apellidos.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.matricula.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;
    if (selectedGroupFilter !== 'todos') {
      const [grado, grupo] = selectedGroupFilter.split(':::');
      return s.grado === grado && s.grupo === grupo;
    }
    return true;
  });

  const handleDownloadByGroupPdf = async () => {
    const targetGroupKey =
      selectedGroupFilter !== 'todos'
        ? selectedGroupFilter
        : availableGroups[0] || '';
    const targetStudents = targetGroupKey
      ? collegeStudents.filter((s) => {
          const [gr, gp] = targetGroupKey.split(':::');
          return s.grado === gr && s.grupo === gp;
        })
      : collegeStudents;

    if (!targetStudents.length) return;

    setIsDownloadingGroupPdf(true);
    try {
      const [gr, gp] = targetGroupKey ? targetGroupKey.split(':::') : ['Grupo', 'General'];
      const cleanGroup = `${gr}_Grupo_${gp}`.replace(/[^a-zA-Z0-9_-]/g, '_');
      await generateReportCardsPdf({
        college: activeCollege,
        students: targetStudents,
        grades: collegeGrades,
        subjects,
        teachers,
        periodicidad: activePeriodicity,
        cycleName: selectedCycleObj?.nombre,
        schoolCycle: selectedCycleObj || undefined,
        filename: `Boletas_${meta.label}_${selectedCycleObj ? selectedCycleObj.nombre.replace(/[^a-zA-Z0-9]/g, '_') + '_' : ''}${cleanGroup}_${activeCollege.nombre.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`,
      });
    } finally {
      setIsDownloadingGroupPdf(false);
    }
  };

  const handleDownloadAllCollegePdf = async () => {
    if (!collegeStudents.length) return;
    setIsDownloadingCollegePdf(true);
    try {
      await generateReportCardsPdf({
        college: activeCollege,
        students: collegeStudents,
        grades: collegeGrades,
        subjects,
        teachers,
        periodicidad: activePeriodicity,
        cycleName: selectedCycleObj?.nombre,
        schoolCycle: selectedCycleObj || undefined,
        filename: `Boletas_${meta.label}_${selectedCycleObj ? selectedCycleObj.nombre.replace(/[^a-zA-Z0-9]/g, '_') + '_' : ''}Colegio_Completo_${activeCollege.nombre.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`,
      });
    } finally {
      setIsDownloadingCollegePdf(false);
    }
  };

  const startEdit = (student: Student, g: GradeRecord) => {
    if (!canEditStudentSubjectGrade(student, g)) return;
    setEditingGradeId(g.id);
    setTempPeriods(getGradePeriodsForModalidad(g, activePeriodicity));
  };

  const saveEdit = (student: Student, g: GradeRecord) => {
    if (!canEditStudentSubjectGrade(student, g)) return;
    const cleanArr = tempPeriods.map((v) =>
      Number(Math.max(0, Math.min(10, Number(v) || 0)).toFixed(1))
    );
    const nonZeroClean = cleanArr.filter((v) => v > 0);
    const finalAvg =
      nonZeroClean.length > 0
        ? Number(
            (
              nonZeroClean.reduce((acc, v) => acc + v, 0) / nonZeroClean.length
            ).toFixed(1)
          )
        : 0;
    if (String(g.id).startsWith('virtual-grd-')) {
      addGrade({
        colegioId: g.colegioId,
        cicloId: selectedCycleId,
        estudianteId: g.estudianteId,
        materiaId: g.materiaId,
        materiaNombre: g.materiaNombre,
        periodo1: cleanArr[0] ?? 0,
        periodo2: cleanArr[1] ?? 0,
        periodo3: cleanArr[2] ?? 0,
        periodo4: cleanArr[3] ?? 0,
        periodo5: cleanArr[4] ?? 0,
        promedioFinal: finalAvg,
        observaciones: finalAvg >= 6 ? 'Desempeño adecuado' : 'Requiere apoyo académico',
        periodosPorModalidad: {
          [activePeriodicity]: cleanArr,
        },
      });
    } else {
      updateGrade(g.id, {
        cicloId: g.cicloId || selectedCycleId,
        periodo1: cleanArr[0] ?? g.periodo1,
        periodo2: cleanArr[1] ?? g.periodo2,
        periodo3: cleanArr[2] ?? g.periodo3,
        promedioFinal: finalAvg,
        periodosPorModalidad: {
          ...(g.periodosPorModalidad || {}),
          [activePeriodicity]: cleanArr,
        },
      });
    }
    setEditingGradeId(null);
  };

  const canDesignReportCard =
    currentUser.rol === 'administrador' ||
    currentUser.rol === 'control_escolar' ||
    currentUser.rol === 'superusuario';

  const handleSaveReportCardDesign = async (newDesign: ReportCardDesignConfig) => {
    await updateCollegeReportCardDesign(activeCollege.id, newDesign);
  };

  if (collegeCycles.length === 0) {
    return (
      <div className="space-y-6">
        <div
          className="rounded-2xl p-5 sm:p-6 text-white shadow-md flex flex-col lg:flex-row lg:items-center justify-between gap-4 transition-colors"
          style={{
            background: `linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}dd 100%)`,
            borderBottom: `4px solid ${goldColor}`,
          }}
        >
          <div className="space-y-1">
            <span
              className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider shadow-2xs"
              style={{ backgroundColor: goldColor, color: primaryColor }}
            >
              Evaluación y Control Escolar
            </span>
            <h2 className="font-display font-bold text-xl md:text-2xl text-white flex items-center gap-2">
              <Award className="w-6 h-6" style={{ color: goldColor }} />
              Calificaciones y Boletas de Evaluación
            </h2>
            <p className="text-xs md:text-sm text-slate-200">
              {activeCollege.nombre}
            </p>
          </div>
        </div>

        <div className="max-w-2xl mx-auto p-8 rounded-3xl bg-white border border-amber-200 shadow-xl space-y-6 text-center my-8">
          <div className="w-16 h-16 rounded-2xl bg-amber-100 border border-amber-300 text-amber-700 flex items-center justify-center mx-auto shadow-inner">
            <Calendar className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300 uppercase tracking-wider">
              Requisito Previo de Calificaciones
            </span>
            <h2 className="text-2xl font-display font-bold text-slate-900">
              Es necesario primero crear el Ciclo Escolar
            </h2>
            <p className="text-sm text-slate-600 max-w-xl mx-auto leading-relaxed">
              Las evaluaciones, calificaciones y boletas oficiales se guardan mediante el ciclo escolar activo. Para consultar o emitir boletas y sábanas de calificaciones, crea primero un ciclo escolar en el sistema.
            </p>
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={() => onNavigateTab?.('ciclo_escolar')}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm text-white shadow-lg transition-transform hover:scale-105 cursor-pointer"
              style={{ backgroundColor: primaryColor }}
            >
              <Calendar className="w-4 h-4" style={{ color: goldColor }} />
              <span>Ir a Crear Ciclo Escolar</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div
        className="rounded-2xl p-5 sm:p-6 text-white shadow-md flex flex-col lg:flex-row lg:items-center justify-between gap-4 transition-colors"
        style={{
          background: `linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}dd 100%)`,
          borderBottom: `4px solid ${goldColor}`,
        }}
      >
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider shadow-2xs"
              style={{ backgroundColor: goldColor, color: primaryColor }}
            >
              Evaluación y Control Escolar
            </span>
            {selectedCycleObj && (
              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold shadow-2xs ${
                selectedCycleObj.activo
                  ? 'bg-emerald-500/20 text-emerald-200 border border-emerald-400/40'
                  : 'bg-amber-400/20 text-amber-200 border border-amber-400/40'
              }`}>
                {selectedCycleObj.nombre} {selectedCycleObj.activo ? '· Activo' : '· Histórico'}
              </span>
            )}
          </div>
          <h2 className="font-display font-bold text-xl md:text-2xl text-white flex items-center gap-2">
            <Award className="w-6 h-6" style={{ color: goldColor }} />
            Calificaciones y Boletas de Evaluación
          </h2>
          <p className="text-xs md:text-sm text-slate-200">
            {activeCollege.nombre} · Registro bimestral, boletas de notas, diseño visual y descarga de boletas oficiales en PDF
          </p>
        </div>

        {/* Selector de Ciclo en Header */}
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <div className="flex items-center gap-2 bg-slate-900/60 backdrop-blur-xs px-3.5 py-2 rounded-xl border border-white/20 shadow-inner">
            <Calendar className="w-4 h-4 text-amber-300 shrink-0" />
            <span className="text-xs font-bold text-white/90">Ciclo Escolar:</span>
            <select
              value={selectedCycleId}
              onChange={(e) => setSelectedCycleId(e.target.value)}
              className="bg-transparent text-amber-300 text-xs font-bold focus:outline-none cursor-pointer"
            >
              {collegeCycles.map((c) => (
                <option key={c.id} value={c.id} className="bg-slate-900 text-white font-medium">
                  {c.nombre} {c.activo ? '⭐ (Activo)' : '(Histórico)'}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Historical Cycle Banner */}
      {selectedCycleObj && !selectedCycleObj.activo && (
        <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-300 flex items-center justify-between gap-3 text-amber-900 text-xs shadow-2xs">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>Consulta de Calificaciones de Ciclo Anterior / Histórico:</strong> Estás revisando las calificaciones y boletas de <strong>{selectedCycleObj.nombre}</strong>.
            </span>
          </div>
          <span className="px-2.5 py-0.5 rounded-full bg-amber-200 text-amber-900 font-bold text-[10px]">
            Ciclo Anterior
          </span>
        </div>
      )}

      {/* Pestañas tipo Carpeta (Folder Tabs) debajo del encabezado */}
      {canDesignReportCard && (
        <div className="border-b border-slate-200">
          <div className="flex items-end gap-1.5 pl-3 sm:pl-5 overflow-x-auto">
            <button
              type="button"
              onClick={() => setActiveSubTab('sabana')}
              className={`relative flex items-center gap-2.5 px-6 py-3 rounded-t-2xl text-xs font-extrabold transition-all cursor-pointer select-none ${
                activeSubTab === 'sabana'
                  ? 'z-10 translate-y-[1px] shadow-xs'
                  : 'opacity-85 hover:opacity-100'
              }`}
              style={
                activeSubTab === 'sabana'
                  ? {
                      backgroundColor: primaryColor,
                      color: '#FFFFFF',
                      borderTop: `4px solid ${goldColor}`,
                      borderLeft: `1px solid ${primaryColor}`,
                      borderRight: `1px solid ${primaryColor}`,
                    }
                  : {
                      backgroundColor: '#E2E8F0',
                      color: primaryColor,
                      borderTop: '3px solid transparent',
                      borderLeft: '1px solid #CBD5E1',
                      borderRight: '1px solid #CBD5E1',
                    }
              }
            >
              <FileSpreadsheet
                className="w-4 h-4"
                style={{ color: activeSubTab === 'sabana' ? goldColor : primaryColor }}
              />
              <span>Boletas</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSubTab('diseno')}
              className={`relative flex items-center gap-2.5 px-6 py-3 rounded-t-2xl text-xs font-extrabold transition-all cursor-pointer select-none ${
                activeSubTab === 'diseno'
                  ? 'z-10 translate-y-[1px] shadow-xs'
                  : 'opacity-85 hover:opacity-100'
              }`}
              style={
                activeSubTab === 'diseno'
                  ? {
                      backgroundColor: primaryColor,
                      color: '#FFFFFF',
                      borderTop: `4px solid ${goldColor}`,
                      borderLeft: `1px solid ${primaryColor}`,
                      borderRight: `1px solid ${primaryColor}`,
                    }
                  : {
                      backgroundColor: '#E2E8F0',
                      color: primaryColor,
                      borderTop: '3px solid transparent',
                      borderLeft: '1px solid #CBD5E1',
                      borderRight: '1px solid #CBD5E1',
                    }
              }
            >
              <Palette
                className="w-4 h-4"
                style={{ color: activeSubTab === 'diseno' ? goldColor : primaryColor }}
              />
              <span>Diseñar Boleta (Lienzo Visual)</span>
            </button>
          </div>
        </div>
      )}

      {canDesignReportCard && activeSubTab === 'diseno' ? (
        <ReportCardDesignStudio
          college={activeCollege}
          students={collegeStudents}
          grades={collegeGrades}
          subjects={subjects}
          teachers={teachers}
          periodicidad={activePeriodicity}
          onSaveDesign={handleSaveReportCardDesign}
        />
      ) : (
        <>

      {/* Action Buttons Bar (Below Header) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mr-1">
            <Calendar className="w-4 h-4 text-amber-600" />
            <span>Obtener Boletas y Sábana:</span>
          </div>
          {(
            [
              'mensual',
              'bimestral',
              'trimestral',
              'cuatrimestral',
              'semestral',
            ] as EvaluationPeriodicity[]
          ).map((per) => {
            const isSelected = activePeriodicity === per;
            return (
              <button
                key={per}
                type="button"
                onClick={() => setCollegeEvaluationPeriodicity(activeCollege.id, per)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  isSelected
                    ? 'text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
                style={isSelected ? { backgroundColor: primaryColor } : undefined}
              >
                {EVALUATION_PERIODICITY_CONFIG[per].label}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={handleDownloadAllCollegePdf}
          disabled={isDownloadingCollegePdf || collegeStudents.length === 0}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs shadow-sm transition-all cursor-pointer disabled:opacity-50"
          style={{ backgroundColor: goldColor, color: primaryColor }}
          title={
            isTeacherRole
              ? 'Descargar en un archivo .PDF las boletas de tus grupos asignados'
              : 'Descargar en un archivo .PDF todas las boletas de todo el colegio'
          }
        >
          <Download className="w-4 h-4" />
          <span>
            {isDownloadingCollegePdf
              ? 'Generando PDF...'
              : isTeacherRole
              ? `Descargar Boletas ${meta.label} de Mis Grupos (${collegeStudents.length}) .PDF`
              : `Descargar Boletas ${meta.label} del Colegio (${collegeStudents.length}) .PDF`}
          </span>
        </button>
      </div>

      {/* Search & Group Filter Bar + PDF Download Selector */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="relative w-full md:max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por estudiante o matrícula..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs md:text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Quick Ciclo Escolar selector in filter bar */}
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 shadow-2xs">
            <Calendar className="w-4 h-4 text-amber-600 shrink-0" />
            <span className="text-xs font-bold text-slate-700">Ciclo:</span>
            <select
              value={selectedCycleId}
              onChange={(e) => setSelectedCycleId(e.target.value)}
              className="text-xs font-bold text-slate-800 bg-transparent border-none focus:outline-none cursor-pointer"
            >
              {collegeCycles.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre} {c.activo ? '⭐ (Activo)' : '(Histórico)'}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-slate-500 shrink-0" />
            <span className="text-xs font-bold text-slate-700">
              {isTeacherRole ? 'Mis Grupos Asignados:' : 'Filtrar / Elegir Grupo:'}
            </span>
            <select
              value={selectedGroupFilter}
              onChange={(e) => setSelectedGroupFilter(e.target.value)}
              className="px-3 py-2 text-xs font-semibold rounded-lg border border-slate-300 bg-slate-50 text-slate-800 focus:outline-none cursor-pointer"
            >
              <option value="todos">
                {isTeacherRole
                  ? `Todos Mis Grupos Asignados (${collegeStudents.length} alumnos)`
                  : `Todos los Grupos (${collegeStudents.length} alumnos)`}
              </option>
              {availableGroups.map((grpKey) => {
                const [gr, gp] = grpKey.split(':::');
                const count = collegeStudents.filter((s) => s.grado === gr && s.grupo === gp).length;
                return (
                  <option key={grpKey} value={grpKey}>
                    {gr} — Grupo "{gp}" ({count} alumnos)
                  </option>
                );
              })}
            </select>
          </div>

          <button
            type="button"
            onClick={handleDownloadByGroupPdf}
            disabled={isDownloadingGroupPdf || collegeStudents.length === 0}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold text-white shadow-2xs transition-all cursor-pointer disabled:opacity-50"
            style={{ backgroundColor: primaryColor }}
          >
            <Download className="w-3.5 h-3.5" style={{ color: goldColor }} />
            <span>
              {selectedGroupFilter !== 'todos'
                ? `Descargar PDF de ${selectedGroupFilter.replace(':::', ' Grupo ')}`
                : `Descargar PDF (${availableGroups[0] ? availableGroups[0].replace(':::', ' Grupo ') : 'Grupo'})`}
            </span>
          </button>

          {!isTeacherRole && (
            <button
              type="button"
              onClick={handleDownloadAllCollegePdf}
              disabled={isDownloadingCollegePdf || collegeStudents.length === 0}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold border border-slate-300 bg-slate-100 hover:bg-slate-200 text-slate-800 transition-all cursor-pointer disabled:opacity-50"
            >
              <Building2 className="w-3.5 h-3.5 text-slate-600" />
              <span>Descargar Todo el Colegio (.PDF)</span>
            </button>
          )}
        </div>
      </div>

      {/* Grade Matrix Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <h3 className="font-display font-bold text-sm text-slate-900">
            {isTeacherRole
              ? 'Boletas y Sábana de Calificaciones de Mis Grupos Asignados'
              : 'Sábana de Calificaciones por Alumno'}
          </h3>
          <span className="text-xs text-slate-500">
            Ciclo Escolar Vigente 2026-2027
          </span>
        </div>

        <div className="divide-y divide-slate-200">
          {filteredStudents.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs sm:text-sm">
              {isTeacherRole
                ? availableGroups.length === 0
                  ? 'No tienes grupos asignados actualmente para visualizar boletas.'
                  : 'No hay alumnos registrados en tus grupos asignados.'
                : 'No hay alumnos que coincidan con los filtros seleccionados.'}
            </div>
          ) : (
            filteredStudents.map((student) => {
            const studentGrades = getEffectiveGradesForStudent({
              student,
              college: activeCollege,
              grades: collegeGrades,
              subjects,
              teachers,
              hasSavedPeriods: evaluatedPeriodsForCollege.length > 0,
              savedPeriods: evaluatedPeriodsForCollege,
            });

            return (
              <div key={student.id} className="p-4 hover:bg-slate-50/50 transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={student.foto}
                      alt=""
                      className="w-10 h-10 rounded-full object-cover border shrink-0"
                    />
                    <div>
                      <div className="font-bold text-slate-900 text-sm">
                        {student.apellidos}, {student.nombre}
                      </div>
                      <div className="text-xs text-slate-500">
                        {student.grado} Grupo "{student.grupo}" · Matrícula:{' '}
                        <span className="font-mono">{student.matricula}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => setSelectedStudentForReport(student)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white shadow-2xs self-start sm:self-auto transition-all active:scale-98"
                    style={{ backgroundColor: primaryColor }}
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Imprimir Boleta Oficial</span>
                  </button>
                </div>

                {/* Subjects mini table */}
                <div className="border border-slate-200 rounded-lg overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-100/70 text-slate-600 font-semibold uppercase text-[10px]">
                      <tr>
                        <th className="py-2 px-3">Materia</th>
                        {meta.shortLabels.map((lbl, idx) => (
                          <th key={idx} className="py-2 px-2 text-center">
                            {lbl}
                          </th>
                        ))}
                        <th className="py-2 px-3 text-center">Promedio</th>
                        <th className="py-2 px-3 text-right">Editar</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {studentGrades.map((g) => {
                        const canEditRow = canEditStudentSubjectGrade(student, g);
                        const isEditing = canEditRow && editingGradeId === g.id;
                        const pValues = getGradePeriodsForModalidad(
                          g,
                          activePeriodicity,
                          evaluatedPeriodsForCollege
                        );
                        const nonZeroVals = pValues.filter((v) => v > 0);
                        const rowAvg =
                          nonZeroVals.length > 0
                            ? Number(
                                (
                                  nonZeroVals.reduce((acc, v) => acc + v, 0) /
                                  nonZeroVals.length
                                ).toFixed(1)
                              )
                            : 0;
                        const tempAvg =
                          tempPeriods.length > 0
                            ? (
                                tempPeriods.reduce((acc, v) => acc + (Number(v) || 0), 0) /
                                tempPeriods.length
                              ).toFixed(1)
                            : rowAvg.toFixed(1);

                        return (
                          <tr key={g.id} className="hover:bg-slate-50">
                            <td className="py-2 px-3 font-medium text-slate-800">
                              {g.materiaNombre}
                            </td>

                            {isEditing ? (
                              <>
                                {tempPeriods.map((val, pIdx) => (
                                  <td key={pIdx} className="py-2 px-1.5 text-center">
                                    <input
                                      type="number"
                                      step="0.1"
                                      min="0"
                                      max="10"
                                      value={val}
                                      onChange={(e) => {
                                        const next = [...tempPeriods];
                                        next[pIdx] = Number(e.target.value);
                                        setTempPeriods(next);
                                      }}
                                      className="w-12 text-center border rounded px-1 py-0.5 font-mono text-xs"
                                    />
                                  </td>
                                ))}
                                <td className="py-2 px-3 text-center font-bold text-amber-700 font-mono">
                                  {tempAvg}
                                </td>
                                <td className="py-2 px-3 text-right">
                                  <button
                                    onClick={() => saveEdit(student, g)}
                                    className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-bold cursor-pointer"
                                  >
                                    Guardar
                                  </button>
                                </td>
                              </>
                            ) : (
                              <>
                                {pValues.map((val, pIdx) => (
                                  <td
                                    key={pIdx}
                                    className="py-2 px-2 text-center font-mono tabular-nums"
                                  >
                                    {val.toFixed(1)}
                                  </td>
                                ))}
                                <td className="py-2 px-3 text-center font-mono font-bold tabular-nums text-slate-900">
                                  {rowAvg.toFixed(1)}
                                </td>
                                <td className="py-2 px-3 text-right">
                                  {canEditRow ? (
                                    <button
                                      onClick={() => startEdit(student, g)}
                                      className="p-1 text-slate-500 hover:text-slate-900 cursor-pointer"
                                      title="Modificar calificación (Docente asignado al grupo y materia)"
                                    >
                                      <Edit2 className="w-3.5 h-3.5" />
                                    </button>
                                  ) : (
                                    <span
                                      className="inline-flex items-center justify-end p-1 text-slate-300 cursor-not-allowed"
                                      title="Solo el docente que tiene asignado este grupo y esta materia puede editar la calificación"
                                    >
                                      <Lock className="w-3.5 h-3.5" />
                                    </span>
                                  )}
                                </td>
                              </>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })
          )}
        </div>
      </div>

      <ReportCardModal
        student={selectedStudentForReport}
        onClose={() => setSelectedStudentForReport(null)}
        schoolCycle={selectedCycleObj}
        cycleGrades={collegeGrades}
      />
        </>
      )}
    </div>
  );
};
