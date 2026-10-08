import React from 'react';
import { useApp } from '../context/AppContext';
import {
  HeartHandshake,
  Users,
  FolderOpen,
  CheckCircle2,
  ShieldAlert,
  Calendar,
  Lock,
  ArrowRight,
  ClipboardList,
  Bell,
  FileText,
} from 'lucide-react';

interface Props {
  onNavigateTab: (tab: string) => void;
}

export const PsychologySummaryModule: React.FC<Props> = ({ onNavigateTab }) => {
  const {
    activeCollege,
    currentUser,
    psychologyRecords,
    students,
    incidents,
    notices,
  } = useApp();

  if (!activeCollege) return null;

  const primaryColor = activeCollege.colores?.primario || '#0B2545';
  const goldColor = activeCollege.colores?.secundario || '#C59B27';

  const collegeStudents = students.filter(
    (s) => s.colegioId === activeCollege.id && s.estatus !== 'baja'
  );
  const collegeRecords = psychologyRecords.filter(
    (r) => r.colegioId === activeCollege.id
  );
  const collegeIncidents = incidents.filter((i) => i.colegioId === activeCollege.id);
  const collegeNotices = notices.filter((n) => n.colegioId === activeCollege.id);

  // Alumnos únicos en seguimiento psicopedagógico
  const uniqueStudentsInFollowUpIds = Array.from(
    new Set(collegeRecords.map((r) => r.estudianteId))
  );
  const studentsInFollowUpCount = uniqueStudentsInFollowUpIds.length;

  // Expedientes abiertos / en proceso vs canalizados vs cerrados
  const openRecords = collegeRecords.filter(
    (r) => r.estatus === 'En Proceso' || r.estatus === 'Canalizado'
  );
  const inProcessCount = collegeRecords.filter((r) => r.estatus === 'En Proceso').length;
  const referredCount = collegeRecords.filter((r) => r.estatus === 'Canalizado').length;
  const closedCount = collegeRecords.filter((r) => r.estatus === 'Cerrado').length;

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
                  Resumen Psicológico · Gabinete Psicopedagógico
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-200 border border-emerald-400/30">
                  <Lock className="w-3 h-3" />
                  <span>Espacio Confidencial del Psicólogo</span>
                </span>
              </div>

              <h2 className="font-display font-bold text-2xl sm:text-3xl text-white tracking-tight">
                {activeCollege.nombre}
              </h2>

              <p className="text-xs sm:text-sm text-slate-200 max-w-2xl">
                Panel clínico de {currentUser.nombre}: control de alumnos en seguimiento, expedientes abiertos, sesiones psicopedagógicas y canalizaciones.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Action Buttons */}
      <div className="flex flex-wrap items-center justify-end gap-2.5">
        <button
          type="button"
          onClick={() => onNavigateTab('psicologia')}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs text-white shadow-sm transition-all cursor-pointer"
          style={{ backgroundColor: primaryColor }}
        >
          <HeartHandshake className="w-4 h-4" style={{ color: goldColor }} />
          <span>Gestionar Expedientes Clínicos</span>
        </button>
        <button
          type="button"
          onClick={() => onNavigateTab('incidencias')}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs text-white shadow-sm transition-all cursor-pointer"
          style={{ backgroundColor: primaryColor }}
        >
          <ShieldAlert className="w-4 h-4" style={{ color: goldColor }} />
          <span>Incidencias y Conducta</span>
        </button>
        <button
          type="button"
          onClick={() => onNavigateTab('estudiantes')}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs shadow-sm transition-all cursor-pointer"
          style={{ backgroundColor: goldColor, color: primaryColor }}
        >
          <Users className="w-4 h-4" />
          <span>Directorio de Alumnos</span>
        </button>
      </div>

      {/* 4 Main KPI Cards for Psychologist */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Alumnos en Seguimiento */}
        <div
          onClick={() => onNavigateTab('psicologia')}
          className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs hover:shadow-md transition-all cursor-pointer flex items-center justify-between"
        >
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Alumnos en Seguimiento
            </span>
            <div className="text-3xl font-display font-black text-slate-900 mt-1">
              {studentsInFollowUpCount}
            </div>
            <span className="text-[11px] font-semibold text-slate-500 mt-1 block">
              De {collegeStudents.length} alumnos en el plantel
            </span>
          </div>
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
            style={{ backgroundColor: `${primaryColor}12`, color: primaryColor }}
          >
            <Users className="w-6 h-6" />
          </div>
        </div>

        {/* KPI 2: Expedientes Abiertos */}
        <div
          onClick={() => onNavigateTab('psicologia')}
          className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs hover:shadow-md transition-all cursor-pointer flex items-center justify-between"
        >
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Expedientes Abiertos
            </span>
            <div className="text-3xl font-display font-black text-slate-900 mt-1">
              {openRecords.length}
            </div>
            <span className="text-[11px] font-semibold text-amber-700 mt-1 block">
              {inProcessCount} en proceso · {referredCount} canalizados
            </span>
          </div>
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
            style={{ backgroundColor: `${goldColor}25`, color: primaryColor }}
          >
            <FolderOpen className="w-6 h-6" />
          </div>
        </div>

        {/* KPI 3: Total Bitácoras / Sesiones */}
        <div
          onClick={() => onNavigateTab('psicologia')}
          className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs hover:shadow-md transition-all cursor-pointer flex items-center justify-between"
        >
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Total Expedientes
            </span>
            <div className="text-3xl font-display font-black text-slate-900 mt-1">
              {collegeRecords.length}
            </div>
            <span className="text-[11px] font-semibold text-emerald-700 mt-1 inline-flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{closedCount} casos concluidos</span>
            </span>
          </div>
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
            style={{ backgroundColor: `${primaryColor}12`, color: primaryColor }}
          >
            <HeartHandshake className="w-6 h-6" />
          </div>
        </div>

        {/* KPI 4: Incidencias / Alertas Conductuales */}
        <div
          onClick={() => onNavigateTab('incidencias')}
          className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs hover:shadow-md transition-all cursor-pointer flex items-center justify-between"
        >
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Reportes Conductuales
            </span>
            <div className="text-3xl font-display font-black text-slate-900 mt-1">
              {collegeIncidents.length}
            </div>
            <span className="text-[11px] font-semibold text-slate-500 mt-1 block">
              Vinculados con Prefectura
            </span>
          </div>
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
            style={{ backgroundColor: `${goldColor}25`, color: primaryColor }}
          >
            <ShieldAlert className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Main Content: Expedientes Abiertos Table & Alumnos en Seguimiento */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Expedientes Abiertos y Recientes */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="font-display font-bold text-base text-slate-900 flex items-center gap-2">
                <FileText className="w-5 h-5" style={{ color: primaryColor }} />
                <span>Expedientes Abiertos y Seguimiento Activo ({openRecords.length})</span>
              </h3>
              <p className="text-xs text-slate-500">
                Detalle confidencial de alumnos atendidos en el departamento de Psicología y Orientación
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab('psicologia')}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-white cursor-pointer"
              style={{ backgroundColor: primaryColor }}
            >
              <span>Abrir Módulo Psicología</span>
              <ArrowRight className="w-3.5 h-3.5" style={{ color: goldColor }} />
            </button>
          </div>

          <div className="divide-y divide-slate-200">
            {collegeRecords.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">
                No hay expedientes registrados actualmente en el plantel.
              </div>
            ) : (
              collegeRecords.map((rec) => (
                <div
                  key={rec.id}
                  className="p-4 hover:bg-slate-50/80 transition-colors space-y-2"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-display font-bold text-sm text-slate-900">
                        {rec.estudianteNombre}
                      </span>
                      <span
                        className="px-2 py-0.5 rounded-md text-[10px] font-bold"
                        style={{ backgroundColor: `${primaryColor}12`, color: primaryColor }}
                      >
                        {rec.gradoGrupo}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          rec.estatus === 'En Proceso'
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : rec.estatus === 'Canalizado'
                            ? 'bg-purple-50 text-purple-800 border-purple-200'
                            : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        }`}
                      >
                        {rec.estatus}
                      </span>
                      <span className="text-[11px] font-mono text-slate-400">
                        {rec.fecha}
                      </span>
                    </div>
                  </div>

                  <div className="text-xs font-bold text-slate-800">
                    Motivo: {rec.motivoConsulta}
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {rec.resumenSesion}
                  </p>
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-[11px] text-slate-700">
                    <strong>Acuerdos y Seguimiento:</strong> {rec.acuerdos}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Column: Alumnos en Seguimiento List & Incidencias Recientes */}
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" style={{ color: primaryColor }} />
                <h3 className="font-display font-bold text-sm text-slate-900">
                  Alumnos en Seguimiento ({studentsInFollowUpCount})
                </h3>
              </div>
            </div>

            <div className="space-y-2.5">
              {uniqueStudentsInFollowUpIds.map((stId) => {
                const st = collegeStudents.find((s) => s.id === stId);
                const recCount = collegeRecords.filter((r) => r.estudianteId === stId).length;
                const latestRec = collegeRecords.find((r) => r.estudianteId === stId);

                return (
                  <div
                    key={stId}
                    onClick={() => onNavigateTab('psicologia')}
                    className="p-3 rounded-2xl bg-slate-50 border border-slate-200 hover:border-slate-300 transition-all cursor-pointer flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {st?.foto ? (
                        <img
                          src={st.foto}
                          alt={st.nombre}
                          className="w-9 h-9 rounded-full object-cover border border-slate-200 shrink-0"
                        />
                      ) : (
                        <div
                          className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-xs shrink-0"
                          style={{ backgroundColor: primaryColor }}
                        >
                          {(latestRec?.estudianteNombre || 'A')[0]}
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="font-bold text-xs text-slate-900 truncate">
                          {st ? `${st.nombre} ${st.apellidos}` : latestRec?.estudianteNombre}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {st ? `${st.grado} "${st.grupo}"` : latestRec?.gradoGrupo} · Tutor:{' '}
                          {st?.tutorNombre || 'Registrado'}
                        </div>
                      </div>
                    </div>

                    <span
                      className="px-2.5 py-0.5 rounded-full text-[10px] font-bold shrink-0"
                      style={{ backgroundColor: `${goldColor}25`, color: primaryColor }}
                    >
                      {recCount} exp.
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Avisos y Calendario */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-2xs space-y-3">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
              <ClipboardList className="w-4 h-4" style={{ color: primaryColor }} />
              <h3 className="font-display font-bold text-sm text-slate-900">
                Accesos de Orientación
              </h3>
            </div>

            <div className="space-y-2 text-xs">
              <button
                type="button"
                onClick={() => onNavigateTab('calendario')}
                className="w-full p-3 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 flex items-center justify-between cursor-pointer"
              >
                <span className="flex items-center gap-2 font-bold text-slate-800">
                  <Calendar className="w-4 h-4" style={{ color: primaryColor }} />
                  <span>Calendario Escolar</span>
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              </button>

              <button
                type="button"
                onClick={() => onNavigateTab('comunicados')}
                className="w-full p-3 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 flex items-center justify-between cursor-pointer"
              >
                <span className="flex items-center gap-2 font-bold text-slate-800">
                  <Bell className="w-4 h-4" style={{ color: primaryColor }} />
                  <span>Comunicados ({collegeNotices.length})</span>
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
