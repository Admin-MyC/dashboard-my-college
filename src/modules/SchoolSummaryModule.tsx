import React from 'react';
import { useApp } from '../context/AppContext';
import {
  GraduationCap,
  Users,
  BookOpen,
  Layers,
  Award,
  Calendar,
  Building2,
  ClipboardCheck,
  ShieldAlert,
  Bell,
  ArrowRight,
  CheckCircle2,
  QrCode,
} from 'lucide-react';

interface Props {
  onNavigateTab: (tab: string) => void;
}

export const SchoolSummaryModule: React.FC<Props> = ({ onNavigateTab }) => {
  const {
    activeCollege,
    currentUser,
    students,
    teachers,
    subjects,
    incidents,
    notices,
    campuses,
    selectedCampusId,
    setSelectedCampusId,
    schoolCycles,
    calendarDays,
  } = useApp();

  if (!activeCollege) return null;

  const primaryColor = activeCollege.colores?.primario || '#0B2545';
  const goldColor = activeCollege.colores?.secundario || '#C59B27';

  // Active campuses for this college
  const collegeCampuses = campuses.filter(
    (c) => c.colegioId === activeCollege.id && c.activo
  );
  const hasMultipleCampuses = collegeCampuses.length > 1;
  const activeCampusObj = hasMultipleCampuses
    ? collegeCampuses.find((c) => c.id === selectedCampusId) || null
    : collegeCampuses[0] || null;

  // Scoped students and teachers (excluding students in estatus 'baja')
  const collegeStudentsAll = students.filter(
    (s) => s.colegioId === activeCollege.id && s.estatus !== 'baja'
  );
  const collegeStudents =
    hasMultipleCampuses && selectedCampusId
      ? collegeStudentsAll.filter((s) => s.campusId === selectedCampusId)
      : collegeStudentsAll;

  const collegeTeachersAll = teachers.filter((t) => t.colegioId === activeCollege.id);
  const collegeTeachers =
    hasMultipleCampuses && selectedCampusId
      ? collegeTeachersAll.filter((t) => t.campusId === selectedCampusId)
      : collegeTeachersAll;

  const collegeSubjects = subjects.filter((s) => s.colegioId === activeCollege.id);
  const collegeIncidents = incidents.filter((i) => i.colegioId === activeCollege.id);
  const collegeNotices = notices.filter((n) => n.colegioId === activeCollege.id);

  // Compute unique groups (Grado + Grupo)
  const groupsMap = new Map<
    string,
    {
      key: string;
      grado: string;
      grupo: string;
      alumnosCount: number;
      promedioSum: number;
      asistenciaSum: number;
      docenteTitular: string;
    }
  >();

  collegeStudents.forEach((st) => {
    const key = `${st.grado} "${st.grupo}"`;
    const existing = groupsMap.get(key);
    if (existing) {
      existing.alumnosCount += 1;
      existing.promedioSum += st.promedio || 9.0;
      existing.asistenciaSum += st.asistenciaPorcentaje || 95;
    } else {
      const assignedTeacher =
        collegeTeachers.find(
          (t) =>
            t.id === st.docenteId ||
            t.grupos.some((g) => g.includes(st.grado) && g.includes(st.grupo))
        )?.nombre ||
        st.docenteNombre ||
        collegeTeachers[0]?.nombre ||
        'Docente Titular Asignado';

      groupsMap.set(key, {
        key,
        grado: st.grado,
        grupo: st.grupo,
        alumnosCount: 1,
        promedioSum: st.promedio || 9.0,
        asistenciaSum: st.asistenciaPorcentaje || 95,
        docenteTitular: assignedTeacher,
      });
    }
  });

  // Also include groups from teachers if not in students
  collegeTeachers.forEach((tch) => {
    tch.grupos.forEach((grpStr) => {
      if (!Array.from(groupsMap.keys()).some((k) => k.replace(/"/g, '') === grpStr.replace(/"/g, ''))) {
        groupsMap.set(grpStr, {
          key: grpStr,
          grado: grpStr.split(' ')[0] || grpStr,
          grupo: grpStr.split(' ')[1] || 'A',
          alumnosCount: 0,
          promedioSum: 0,
          asistenciaSum: 0,
          docenteTitular: tch.nombre,
        });
      }
    });
  });

  const groupsList = Array.from(groupsMap.values());
  const totalGroupsCount = groupsList.length;

  const avgAcademicGpa =
    collegeStudents.length > 0
      ? (
          collegeStudents.reduce((acc, s) => acc + (s.promedio || 0), 0) /
          collegeStudents.length
        ).toFixed(1)
      : '0.0';

  const avgAttendancePct =
    collegeStudents.length > 0
      ? Math.round(
          collegeStudents.reduce((acc, s) => acc + (s.asistenciaPorcentaje || 95), 0) /
            collegeStudents.length
        )
      : 0;

  const activeCycle = schoolCycles.find(
    (c) => c.colegioId === activeCollege.id && c.activo
  );
  const upcomingEvents = calendarDays
    .filter((d) => d.colegioId === activeCollege.id)
    .slice(0, 4);

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
                  Resumen Escolar · Dirección y Coordinación Académica
                </span>
                {activeCycle && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-white/15 text-white border border-white/25 flex items-center gap-1">
                    <Calendar className="w-3 h-3" style={{ color: goldColor }} />
                    <span>{activeCycle.nombre}</span>
                  </span>
                )}
              </div>

              <h2 className="font-display font-bold text-2xl sm:text-3xl text-white tracking-tight">
                {activeCollege.nombre}
              </h2>

              <p className="text-xs sm:text-sm text-slate-200 max-w-2xl">
                Panorama académico integral de docentes, grupos activos, asignaturas, matrícula de alumnos e indicadores escolares para {currentUser.nombre}.
              </p>
            </div>
          </div>

          {hasMultipleCampuses && (
            <div className="bg-white/15 backdrop-blur-xs border border-white/25 rounded-xl px-3.5 py-2 flex items-center gap-2 self-start lg:self-center">
              <Building2 className="w-4 h-4 shrink-0" style={{ color: goldColor }} />
              <div>
                <span className="text-[9px] uppercase tracking-wider font-bold text-slate-200 block">
                  Campus Activo
                </span>
                <select
                  value={selectedCampusId || ''}
                  onChange={(e) => setSelectedCampusId(e.target.value || null)}
                  className="bg-transparent text-white font-bold text-xs focus:outline-none cursor-pointer"
                >
                  <option value="" className="text-slate-900">
                    Todos los Campus ({collegeCampuses.length})
                  </option>
                  {collegeCampuses.map((cmp) => (
                    <option key={cmp.id} value={cmp.id} className="text-slate-900">
                      {cmp.nombre}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions Bar */}
      <div className="flex flex-wrap items-center justify-end gap-2.5">
        <button
          type="button"
          onClick={() => onNavigateTab('docentes')}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs text-white shadow-sm transition-all cursor-pointer"
          style={{ backgroundColor: primaryColor }}
        >
          <Users className="w-4 h-4" style={{ color: goldColor }} />
          <span>Plantilla Docente</span>
        </button>
        <button
          type="button"
          onClick={() => onNavigateTab('materias')}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs text-white shadow-sm transition-all cursor-pointer"
          style={{ backgroundColor: primaryColor }}
        >
          <BookOpen className="w-4 h-4" style={{ color: goldColor }} />
          <span>Materias y Grupos</span>
        </button>
        <button
          type="button"
          onClick={() => onNavigateTab('evaluaciones')}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs text-white shadow-sm transition-all cursor-pointer"
          style={{ backgroundColor: primaryColor }}
        >
          <ClipboardCheck className="w-4 h-4" style={{ color: goldColor }} />
          <span>Evaluaciones</span>
        </button>
        <button
          type="button"
          onClick={() => onNavigateTab('asistencias')}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs shadow-sm transition-all cursor-pointer"
          style={{ backgroundColor: goldColor, color: primaryColor }}
        >
          <QrCode className="w-4 h-4" />
          <span>Control de Asistencia</span>
        </button>
      </div>

      {/* 4 Main KPI Cards: Docentes, Grupos, Materias, Alumnos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Total Docentes */}
        <div
          onClick={() => onNavigateTab('docentes')}
          className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs hover:shadow-md transition-all cursor-pointer flex items-center justify-between"
        >
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Plantilla Docente
            </span>
            <div className="text-3xl font-display font-black text-slate-900 mt-1">
              {collegeTeachers.length}
            </div>
            <span className="text-[11px] font-semibold text-emerald-700 mt-1 inline-flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Docentes titulares activos</span>
            </span>
          </div>
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
            style={{ backgroundColor: `${primaryColor}12`, color: primaryColor }}
          >
            <Users className="w-6 h-6" />
          </div>
        </div>

        {/* KPI 2: Total Grupos */}
        <div
          onClick={() => onNavigateTab('horarios')}
          className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs hover:shadow-md transition-all cursor-pointer flex items-center justify-between"
        >
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Grupos Escolares
            </span>
            <div className="text-3xl font-display font-black text-slate-900 mt-1">
              {totalGroupsCount}
            </div>
            <span className="text-[11px] font-semibold text-slate-500 mt-1 block">
              Nivel {activeCollege.nivel} · Turno Matutino
            </span>
          </div>
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
            style={{ backgroundColor: `${goldColor}25`, color: primaryColor }}
          >
            <Layers className="w-6 h-6" />
          </div>
        </div>

        {/* KPI 3: Total Materias */}
        <div
          onClick={() => onNavigateTab('materias')}
          className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs hover:shadow-md transition-all cursor-pointer flex items-center justify-between"
        >
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Materias Activas
            </span>
            <div className="text-3xl font-display font-black text-slate-900 mt-1">
              {collegeSubjects.length}
            </div>
            <span className="text-[11px] font-semibold text-slate-500 mt-1 block">
              Malla curricular oficial
            </span>
          </div>
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
            style={{ backgroundColor: `${primaryColor}12`, color: primaryColor }}
          >
            <BookOpen className="w-6 h-6" />
          </div>
        </div>

        {/* KPI 4: Total Alumnos */}
        <div
          onClick={() => onNavigateTab('estudiantes')}
          className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs hover:shadow-md transition-all cursor-pointer flex items-center justify-between"
        >
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Matrícula de Alumnos
            </span>
            <div className="text-3xl font-display font-black text-slate-900 mt-1">
              {collegeStudents.length}
            </div>
            <span className="text-[11px] font-semibold text-slate-600 mt-1 block">
              Promedio Gral: <strong>{avgAcademicGpa}</strong> · Asist: <strong>{avgAttendancePct}%</strong>
            </span>
          </div>
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
            style={{ backgroundColor: `${goldColor}25`, color: primaryColor }}
          >
            <GraduationCap className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Main Content Grid: Desglose por Grupos + Materias y Cuerpo Docente */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Resumen de Grupos, Alumnos y Promedios */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="font-display font-bold text-base text-slate-900 flex items-center gap-2">
                <Layers className="w-5 h-5" style={{ color: primaryColor }} />
                <span>Indicadores por Grupo Escolar ({groupsList.length})</span>
              </h3>
              <p className="text-xs text-slate-500">
                Distribución de alumnos, docente titular, promedio académico y asistencia por grupo
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab('estudiantes')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white cursor-pointer"
              style={{ backgroundColor: primaryColor }}
            >
              <span>Ver Alumnos</span>
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
                  <th className="py-3 px-4">Grupo</th>
                  <th className="py-3 px-4">Docente Titular</th>
                  <th className="py-3 px-4 text-center">Alumnos Inscritos</th>
                  <th className="py-3 px-4 text-center">Asistencia Promedio</th>
                  <th className="py-3 px-4 text-center">Promedio General</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {groupsList.map((grp) => {
                  const avgGrp =
                    grp.alumnosCount > 0
                      ? (grp.promedioSum / grp.alumnosCount).toFixed(1)
                      : '9.0';
                  const attGrp =
                    grp.alumnosCount > 0
                      ? Math.round(grp.asistenciaSum / grp.alumnosCount)
                      : 95;

                  return (
                    <tr key={grp.key} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-display font-bold text-slate-900">
                        <span
                          className="px-2.5 py-1 rounded-lg text-xs font-extrabold"
                          style={{ backgroundColor: `${primaryColor}12`, color: primaryColor }}
                        >
                          {grp.key}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-700">
                        {grp.docenteTitular}
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-bold text-slate-800">
                        {grp.alumnosCount} alumno(s)
                      </td>
                      <td className="py-3 px-4 text-center font-mono">
                        <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold">
                          {attGrp}%
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center font-mono">
                        <span
                          className="px-2.5 py-1 rounded-lg font-black text-xs"
                          style={{ backgroundColor: `${goldColor}25`, color: primaryColor }}
                        >
                          {avgGrp}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: Plantilla Docente & Materias Destacadas */}
        <div className="space-y-6">
          {/* Cuerpo Docente Card */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" style={{ color: primaryColor }} />
                <h3 className="font-display font-bold text-sm text-slate-900">
                  Cuerpo Docente ({collegeTeachers.length})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => onNavigateTab('docentes')}
                className="text-xs font-bold hover:underline cursor-pointer"
                style={{ color: primaryColor }}
              >
                Ver todos
              </button>
            </div>

            <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
              {collegeTeachers.map((t) => (
                <div
                  key={t.id}
                  className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-2"
                >
                  <div className="min-w-0">
                    <div className="font-bold text-xs text-slate-900 truncate">
                      {t.nombre}
                    </div>
                    <div className="text-[11px] text-slate-500 truncate">
                      {t.especialidad} · Grupos: {t.grupos.join(', ')}
                    </div>
                  </div>
                  <span
                    className="px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0"
                    style={{ backgroundColor: `${goldColor}25`, color: primaryColor }}
                  >
                    {t.horasSemanales}h/sem
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Seguimiento Académico y Avisos */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-2xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4" style={{ color: primaryColor }} />
                <h3 className="font-display font-bold text-sm text-slate-900">
                  Actividad Escolar
                </h3>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5 text-xs">
              <div
                onClick={() => onNavigateTab('incidencias')}
                className="p-3 rounded-2xl bg-slate-50 border border-slate-200 cursor-pointer hover:border-slate-300"
              >
                <div className="flex items-center gap-1.5 text-slate-500 font-bold text-[11px]">
                  <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
                  <span>Incidencias</span>
                </div>
                <div className="text-xl font-display font-black text-slate-900 mt-1">
                  {collegeIncidents.length}
                </div>
              </div>

              <div
                onClick={() => onNavigateTab('comunicados')}
                className="p-3 rounded-2xl bg-slate-50 border border-slate-200 cursor-pointer hover:border-slate-300"
              >
                <div className="flex items-center gap-1.5 text-slate-500 font-bold text-[11px]">
                  <Bell className="w-3.5 h-3.5 text-blue-600" />
                  <span>Comunicados</span>
                </div>
                <div className="text-xl font-display font-black text-slate-900 mt-1">
                  {collegeNotices.length}
                </div>
              </div>
            </div>

            {upcomingEvents.length > 0 && (
              <div className="pt-2 space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Próximas Fechas del Calendario
                </span>
                {upcomingEvents.slice(0, 2).map((ev) => (
                  <div
                    key={ev.id}
                    className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs flex items-center justify-between gap-2"
                  >
                    <span className="font-semibold text-slate-800 truncate">
                      {ev.motivo}
                    </span>
                    <span className="font-mono text-[10px] font-bold text-slate-500 shrink-0">
                      {ev.fecha}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
