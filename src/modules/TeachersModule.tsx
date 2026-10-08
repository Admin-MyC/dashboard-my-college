import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import {
  Users,
  Plus,
  Calendar,
  X,
  QrCode,
  Edit2,
  Upload,
  Shield,
  BookOpen,
  UserCheck,
} from 'lucide-react';
import { Teacher, AcademicLevel, Subject } from '../types';
import { createShieldSvg } from '../utils/shieldHelper';

interface TeachersModuleProps {
  onNavigateTab?: (tab: string) => void;
}

export const TeachersModule: React.FC<TeachersModuleProps> = ({ onNavigateTab }) => {
  const {
    activeCollege,
    teachers,
    subjects,
    activities,
    addTeacher,
    updateTeacher,
    campuses,
    selectedCampusId,
    setSelectedCampusId,
    calendarDays,
    getGroupsForCollegeLevel,
  } = useApp();

  const [activeSubTab, setActiveSubTab] = useState<'plantilla' | 'planeaciones' | 'calendario'>('plantilla');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddTeacherOpen, setIsAddTeacherOpen] = useState(false);

  // New teacher form state
  const [nombre, setNombre] = useState('');
  const [correo, setCorreo] = useState('');
  const [telefono, setTelefono] = useState('');
  const [especialidad, setEspecialidad] = useState('');
  const [nivelDocente, setNivelDocente] = useState<AcademicLevel>('Primaria');
  const [selectedNewGroups, setSelectedNewGroups] = useState<string[]>(['1° A']);
  const [selectedNewSubjects, setSelectedNewSubjects] = useState<string[]>([]);
  const [newEsTutorPrincipal, setNewEsTutorPrincipal] = useState<boolean>(false);
  const [newGrupoTutorado, setNewGrupoTutorado] = useState<string>('');
  const [fotoPersonalizada, setFotoPersonalizada] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Edit teacher groups/subjects/level/tutor modal state
  const [editingTeacherForGroups, setEditingTeacherForGroups] = useState<Teacher | null>(null);
  const [editNivelDocente, setEditNivelDocente] = useState<AcademicLevel>('Primaria');
  const [editGroupsList, setEditGroupsList] = useState<string[]>([]);
  const [editSubjectsList, setEditSubjectsList] = useState<string[]>([]);
  const [editEsTutorPrincipal, setEditEsTutorPrincipal] = useState<boolean>(false);
  const [editGrupoTutorado, setEditGrupoTutorado] = useState<string>('');

  if (!activeCollege) return null;

  const getAllowedLevelsForCollege = (collegeNivel?: string): AcademicLevel[] => {
    const clean = (collegeNivel || '').trim().toLowerCase();
    if (clean === 'preescolar') return ['Preescolar'];
    if (clean === 'primaria') return ['Primaria'];
    if (clean === 'secundaria') return ['Secundaria'];
    if (clean === 'preparatoria') return ['Preparatoria'];
    return ['Preescolar', 'Primaria', 'Secundaria', 'Preparatoria'];
  };

  const allowedLevels = getAllowedLevelsForCollege(activeCollege.nivel);

  useEffect(() => {
    if (!allowedLevels.includes(nivelDocente)) {
      const defaultLvl = allowedLevels[0] || 'Primaria';
      setNivelDocente(defaultLvl);
      const groupsForLvl = getGroupsForCollegeLevel(activeCollege.id, defaultLvl);
      setSelectedNewGroups(groupsForLvl.length > 0 ? [groupsForLvl[0]] : []);
    }
  }, [activeCollege.id, activeCollege.nivel]);

  const primaryColor = activeCollege.colores.primario || '#0B2545';
  const goldColor = activeCollege.colores.secundario || '#C59B27';

  // Escudo oficial del colegio para usar cuando no se ha subido una foto personalizada
  const collegeShieldUrl =
    activeCollege.escudoUrl ||
    createShieldSvg(primaryColor, goldColor, activeCollege.nombre);

  const resolveTeacherPhoto = (foto?: string): string => {
    if (!foto || foto.includes('images.unsplash.com')) {
      return collegeShieldUrl;
    }
    return foto;
  };

  const resolveTeacherLevel = (tch: Teacher): AcademicLevel => {
    if (tch.nivel && allowedLevels.includes(tch.nivel)) return tch.nivel;
    if (tch.nivel) return tch.nivel;
    const hasUpperPrimary = (tch.grupos || []).some(
      (g) => g.includes('4°') || g.includes('5°') || g.includes('6°')
    );
    if (hasUpperPrimary && allowedLevels.includes('Primaria')) return 'Primaria';
    return allowedLevels[0] || 'Primaria';
  };

  // Grupos obtenidos directamente desde el módulo Materias y Grupos según el nivel seleccionado
  const availableGroupsForNewTeacher = getGroupsForCollegeLevel(activeCollege.id, nivelDocente);
  const availableGroupsForEditTeacher = getGroupsForCollegeLevel(activeCollege.id, editNivelDocente);

  // Materias obtenidas desde Materias y Grupos filtradas únicamente por el nivel del profesor
  const collegeSubjects = subjects.filter((s) => s.colegioId === activeCollege.id);
  const resolveSubjectLevel = (sub: Subject): AcademicLevel => {
    if (sub.nivel && allowedLevels.includes(sub.nivel)) return sub.nivel;
    if (sub.nivel) return sub.nivel;
    const lower = (sub.grado || '').toLowerCase();
    if (lower.includes('preescolar')) return 'Preescolar';
    if (lower.includes('secundaria')) return 'Secundaria';
    if (lower.includes('preparatoria') || lower.includes('bachillerato')) return 'Preparatoria';
    if (lower.includes('primaria')) return 'Primaria';
    return allowedLevels[0] || 'Primaria';
  };

  const getSubjectsForLevel = (lvl: AcademicLevel): string[] => {
    const names = collegeSubjects
      .filter((s) => resolveSubjectLevel(s) === lvl)
      .map((s) => s.nombre.trim())
      .filter(Boolean);
    return Array.from(new Set(names));
  };

  const availableSubjectsForNewTeacher = getSubjectsForLevel(nivelDocente);
  const availableSubjectsForEditTeacher = getSubjectsForLevel(editNivelDocente);

  const openTeacherAssignmentModal = (tch: Teacher) => {
    const currentLvl = resolveTeacherLevel(tch);
    const currentGroups = tch.grupos || [];
    setEditingTeacherForGroups(tch);
    setEditNivelDocente(currentLvl);
    setEditGroupsList(currentGroups);
    setEditSubjectsList(tch.materias || []);
    setEditEsTutorPrincipal(Boolean(tch.esTutorPrincipal));
    setEditGrupoTutorado(
      tch.grupoTutorado || currentGroups[0] || getGroupsForCollegeLevel(activeCollege.id, currentLvl)[0] || ''
    );
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setFotoPersonalizada(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const collegeCampuses = campuses.filter((c) => c.colegioId === activeCollege.id && c.activo);
  const hasMultipleCampuses = collegeCampuses.length > 1;

  const collegeTeachersAll = teachers.filter((t) => t.colegioId === activeCollege.id);
  const collegeTeachers =
    hasMultipleCampuses && selectedCampusId
      ? collegeTeachersAll.filter((t) => t.campusId === selectedCampusId)
      : collegeTeachersAll;
  const collegeActivities = activities.filter((a) => a.colegioId === activeCollege.id);
  const teacherCalendarDays = calendarDays.filter(
    (d) => d.colegioId === activeCollege.id && d.visibleDocentes
  );

  const filteredTeachers = collegeTeachers.filter(
    (t) =>
      t.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.especialidad.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.correo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.nivel || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateTeacher = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim() || !correo.trim()) return;

    const finalSubjects =
      selectedNewSubjects.length > 0
        ? selectedNewSubjects
        : especialidad.trim()
        ? [especialidad.trim()]
        : [];

    const effectiveTutorGroup =
      newEsTutorPrincipal && newGrupoTutorado
        ? newGrupoTutorado
        : newEsTutorPrincipal && selectedNewGroups.length > 0
        ? selectedNewGroups[0]
        : undefined;

    const finalGroupsForTeacher =
      effectiveTutorGroup && !selectedNewGroups.includes(effectiveTutorGroup)
        ? [...selectedNewGroups, effectiveTutorGroup]
        : selectedNewGroups;

    addTeacher({
      colegioId: activeCollege.id,
      nombre,
      correo,
      telefono: telefono || '+52 (55) 0000-0000',
      especialidad: especialidad || finalSubjects[0] || 'Docencia General',
      nivel: nivelDocente,
      esTutorPrincipal: newEsTutorPrincipal,
      grupoTutorado: effectiveTutorGroup,
      materias: finalSubjects,
      grupos: finalGroupsForTeacher,
      horasSemanales: 0,
      estatus: 'activo',
      // Si no han subido una imagen personalizada, toma el escudo del colegio (nunca una imagen random)
      foto: fotoPersonalizada || collegeShieldUrl,
    });

    setNombre('');
    setCorreo('');
    setTelefono('');
    setEspecialidad('');
    setFotoPersonalizada('');
    setSelectedNewSubjects([]);
    setNewEsTutorPrincipal(false);
    setNewGrupoTutorado('');
    const defaultGroups = getGroupsForCollegeLevel(activeCollege.id, nivelDocente);
    setSelectedNewGroups(defaultGroups.length > 0 ? [defaultGroups[0]] : []);
    setIsAddTeacherOpen(false);
  };

  return (
    <div className="space-y-6">
      <div
        className="rounded-2xl p-5 sm:p-6 text-white shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors"
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
              Plantilla y Planeación Académica
            </span>
          </div>
          <h2 className="font-display font-bold text-xl md:text-2xl text-white flex items-center gap-2">
            <Users className="w-6 h-6" style={{ color: goldColor }} />
            Docentes y Actividades Académicas
          </h2>
          <p className="text-xs md:text-sm text-slate-200">
            {activeCollege.nombre} · Plantilla de profesores, nivel educativo y grupos asignados
          </p>
        </div>
      </div>

      {/* Action Buttons Bar (Below Header) */}
      <div className="flex flex-wrap items-center justify-end gap-2.5">
        {onNavigateTab && (
          <button
            onClick={() => onNavigateTab('asistencias')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs md:text-sm bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 shadow-2xs transition-all active:scale-98 cursor-pointer"
          >
            <QrCode className="w-4 h-4" style={{ color: primaryColor }} />
            <span>Tomar Asistencia QR (Aula)</span>
          </button>
        )}

        <button
          onClick={() => {
            const initialLvl = allowedLevels[0] || 'Primaria';
            setNivelDocente(initialLvl);
            const lvGroups = getGroupsForCollegeLevel(activeCollege.id, initialLvl);
            setSelectedNewGroups(lvGroups.length > 0 ? [lvGroups[0]] : []);
            const lvSubs = getSubjectsForLevel(initialLvl);
            setSelectedNewSubjects(lvSubs.length > 0 ? [lvSubs[0]] : []);
            setFotoPersonalizada('');
            setIsAddTeacherOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs md:text-sm shadow-sm transition-all active:scale-98 cursor-pointer"
          style={{ backgroundColor: goldColor, color: primaryColor }}
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Registrar Profesor</span>
        </button>
      </div>

      {/* Classroom Attendance Banner for Teachers */}
      {onNavigateTab && (
        <div className="p-4 bg-gradient-to-r from-teal-900 to-slate-900 text-white rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-md">
          <div className="flex items-center gap-3.5">
            <div className="p-3 bg-teal-500/20 rounded-xl border border-teal-400/30 text-teal-300">
              <QrCode className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-sm md:text-base flex items-center gap-2">
                Pase de Lista Inteligente en la Puerta del Salón
                <span className="text-[10px] bg-teal-500 text-slate-950 font-extrabold px-2 py-0.5 rounded-full">
                  NUEVO
                </span>
              </h3>
              <p className="text-xs text-slate-300 mt-0.5">
                Abre el escáner en tu tablet: los alumnos muestran su código QR al entrar al aula y se valida automáticamente su grupo.
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigateTab('asistencias')}
            className="px-4 py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 rounded-xl text-xs md:text-sm font-bold transition-all shadow-sm shrink-0 self-start sm:self-auto"
          >
            Abrir Escáner de Aula →
          </button>
        </div>
      )}

      {/* Segmented Controls (Tabs) */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 p-1 bg-slate-100 rounded-xl w-fit">
          <button
            onClick={() => setActiveSubTab('plantilla')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              activeSubTab === 'plantilla'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Plantilla Docente ({collegeTeachers.length})
          </button>
          <button
            onClick={() => setActiveSubTab('planeaciones')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              activeSubTab === 'planeaciones'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Actividades y Planeaciones ({collegeActivities.length})
          </button>
          <button
            onClick={() => setActiveSubTab('calendario')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'calendario'
                ? 'bg-white text-rose-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Calendar className="w-3.5 h-3.5 text-rose-600" />
            <span>Calendario Días Sin Clases ({teacherCalendarDays.length})</span>
          </button>
        </div>

        {hasMultipleCampuses && (
          <div className="flex items-center gap-2 bg-amber-50 border border-amber-300 rounded-xl px-3 py-1.5">
            <span className="text-[10px] font-bold uppercase text-amber-800">Campus:</span>
            <select
              value={selectedCampusId || ''}
              onChange={(e) => setSelectedCampusId(e.target.value || null)}
              className="bg-transparent text-xs font-bold text-slate-900 focus:outline-none cursor-pointer"
            >
              <option value="">Todos los Campus ({collegeCampuses.length})</option>
              {collegeCampuses.map((cmp) => (
                <option key={cmp.id} value={cmp.id}>
                  {cmp.nombre}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {activeSubTab === 'calendario' ? (
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-display font-bold text-base text-slate-900 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-rose-600" />
                Calendario Oficial de Días Sin Clases (Perfil Docente)
              </h3>
              <p className="text-xs text-slate-500">
                Fechas de suspensión de labores, Consejos Técnicos Escolares (CTE) y vacaciones registradas por Control Escolar.
              </p>
            </div>
            {onNavigateTab && (
              <button
                onClick={() => onNavigateTab('calendario')}
                className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 cursor-pointer"
              >
                Abrir Módulo Calendario →
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {teacherCalendarDays.map((day) => (
              <div
                key={day.id}
                className="p-4 rounded-xl border border-rose-200/80 bg-rose-50/40 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-xs text-rose-800 bg-rose-100 px-2 py-0.5 rounded">
                    {day.fecha}
                    {day.fechaFin ? ` al ${day.fechaFin}` : ''}
                  </span>
                  <span className="text-[10px] font-bold uppercase text-rose-700">
                    Sin Clases
                  </span>
                </div>
                <p className="font-bold text-xs text-slate-900">{day.motivo}</p>
              </div>
            ))}
          </div>
        </div>
      ) : activeSubTab === 'plantilla' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTeachers.map((tch) => {
            const tchLevel = resolveTeacherLevel(tch);
            const displayFoto = resolveTeacherPhoto(tch.foto);

            return (
              <div
                key={tch.id}
                onClick={() => openTeacherAssignmentModal(tch)}
                className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs hover:shadow-md hover:border-indigo-300 transition-all space-y-3 cursor-pointer group"
                title="Clic para elegir nivel, grupos y materias impartidas del profesor"
              >
                <div className="flex items-start gap-3.5">
                  <img
                    src={displayFoto}
                    alt={tch.nombre}
                    className="w-12 h-12 rounded-full object-contain bg-slate-50 border border-slate-200 shrink-0 p-0.5"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-bold text-slate-900 text-sm truncate group-hover:text-indigo-700 transition-colors">
                        {tch.nombre}
                      </h3>
                      <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 shrink-0">
                        {tchLevel}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 font-medium">{tch.especialidad}</p>
                    <p className="text-[11px] text-slate-400 font-mono truncate">{tch.correo}</p>
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-xs space-y-1.5">
                  <div className="flex justify-between text-slate-600">
                    <span>Nivel que imparte:</span>
                    <span className="font-bold text-indigo-900">{tchLevel}</span>
                  </div>
                  {tch.esTutorPrincipal && tch.grupoTutorado && (
                    <div className="flex items-center justify-between text-emerald-800 bg-emerald-50/90 border border-emerald-200 px-2 py-1 rounded-md">
                      <span className="flex items-center gap-1 font-bold text-[11px]">
                        <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Tutor Principal:</span>
                      </span>
                      <span className="font-extrabold text-[11px]">
                        Grupo {tch.grupoTutorado}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between gap-2 text-slate-600">
                    <span>Grupos a Cargo:</span>
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-slate-800">
                        {tch.grupos && tch.grupos.length > 0
                          ? tch.grupos.join(', ')
                          : 'Sin grupo asignado'}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          openTeacherAssignmentModal(tch);
                        }}
                        className="p-1 rounded-md bg-white border border-slate-200 hover:bg-indigo-50 text-indigo-600 font-bold text-[10px] inline-flex items-center gap-1 cursor-pointer"
                        title="Asignar o modificar nivel, grupos y materias del docente"
                      >
                        <Edit2 className="w-3 h-3" />
                        <span>Asignar</span>
                      </button>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      Materias Impartidas ({tchLevel})
                    </span>
                    <span className="text-[10px] font-semibold text-indigo-600 group-hover:underline">
                      + Elegir materias
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {tch.materias && tch.materias.length > 0 ? (
                      tch.materias.map((m, idx) => (
                        <span
                          key={idx}
                          className="text-[11px] bg-indigo-50/80 text-indigo-900 border border-indigo-200/70 font-semibold px-2 py-0.5 rounded-md"
                        >
                          {m}
                        </span>
                      ))
                    ) : (
                      <span className="text-[11px] text-slate-400 italic">
                        Clic para asignar materias de {tchLevel}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Actividades Docentes / Planeaciones */
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <h3 className="font-display font-bold text-sm text-slate-900">
              Planeaciones Didácticas Semanales
            </h3>
            <span className="text-xs text-slate-500">Supervisadas por Coordinación</span>
          </div>

          <div className="divide-y divide-slate-100">
            {collegeActivities.map((act) => (
              <div key={act.id} className="p-4 hover:bg-slate-50/50 transition-colors space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded ${
                        act.estado === 'Aprobada'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {act.estado}
                    </span>
                    <span className="font-bold text-sm text-slate-900">{act.titulo}</span>
                  </div>
                  <span className="text-xs text-slate-400 font-mono">{act.semana}</span>
                </div>

                <div className="text-xs text-slate-600">
                  <strong>Docente:</strong> {act.docenteNombre} · <strong>Materia:</strong>{' '}
                  {act.materia} ({act.gradoGrupo})
                </div>

                <div className="text-xs text-slate-500 bg-slate-50 p-2.5 rounded-lg border">
                  <strong>Objetivo de Aprendizaje:</strong> {act.objetivo}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Teacher Modal */}
      {isAddTeacherOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border">
            <div className="p-4 border-b flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-sm text-slate-900">Registrar Profesor</h3>
              <button type="button" onClick={() => setIsAddTeacherOpen(false)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleCreateTeacher} className="p-5 space-y-3 text-xs md:text-sm">
              {/* Fotografía opcional o escudo del colegio por defecto */}
              <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <img
                  src={fotoPersonalizada || collegeShieldUrl}
                  alt="Foto o Escudo"
                  className="w-12 h-12 rounded-full object-contain bg-white border border-slate-200 p-0.5 shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-bold text-slate-800 block">
                    Fotografía del Docente (Opcional)
                  </span>
                  <span className="text-[11px] text-slate-500 block">
                    {fotoPersonalizada
                      ? 'Fotografía personalizada cargada.'
                      : 'Si no se sube foto, se asigna el escudo oficial del colegio.'}
                  </span>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 text-[11px] font-bold text-slate-700 flex items-center gap-1 cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Subir</span>
                  </button>
                  {fotoPersonalizada && (
                    <button
                      type="button"
                      onClick={() => setFotoPersonalizada('')}
                      className="px-2 py-1.5 rounded-lg bg-rose-50 border border-rose-200 text-[11px] font-bold text-rose-700 cursor-pointer"
                      title="Usar escudo del colegio"
                    >
                      Escudo
                    </button>
                  )}
                </div>
              </div>

              <div>
                <label className="font-semibold block mb-1">Nombre Completo *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Lic. Fernando Treviño"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1">Correo Electrónico *</label>
                <input
                  type="email"
                  required
                  placeholder="profesor@colegio.edu.mx"
                  value={correo}
                  onChange={(e) => setCorreo(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold block mb-1">Especialidad</label>
                  <input
                    type="text"
                    placeholder="Ej. Matemáticas"
                    value={especialidad}
                    onChange={(e) => setEspecialidad(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1">Nivel que Impartirá *</label>
                  <select
                    value={nivelDocente}
                    onChange={(e) => {
                      const nextLevel = e.target.value as AcademicLevel;
                      setNivelDocente(nextLevel);
                      const levelGroups = getGroupsForCollegeLevel(activeCollege.id, nextLevel);
                      setSelectedNewGroups(levelGroups.length > 0 ? [levelGroups[0]] : []);
                      const levelSubs = getSubjectsForLevel(nextLevel);
                      setSelectedNewSubjects(levelSubs.length > 0 ? [levelSubs[0]] : []);
                    }}
                    className="w-full px-3 py-2 border rounded-lg bg-white font-semibold text-slate-800"
                  >
                    {allowedLevels.map((lvl) => (
                      <option key={lvl} value={lvl}>
                        {lvl}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="font-semibold block">
                    Grupos de {nivelDocente} Asignados al Docente
                  </label>
                  <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full">
                    Módulo Materias y Grupos
                  </span>
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                  {availableGroupsForNewTeacher.map((grp) => {
                    const isSelected = selectedNewGroups.includes(grp);
                    return (
                      <button
                        key={grp}
                        type="button"
                        onClick={() => {
                          setSelectedNewGroups((prev) =>
                            prev.includes(grp) ? prev.filter((g) => g !== grp) : [...prev, grp]
                          );
                        }}
                        className={`py-1.5 rounded-lg text-[11px] font-bold border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {grp}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="font-semibold block">
                    Materias de {nivelDocente} a Impartir
                  </label>
                  <span className="text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                    Nivel {nivelDocente}
                  </span>
                </div>
                {availableSubjectsForNewTeacher.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5 p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                    {availableSubjectsForNewTeacher.map((subName) => {
                      const isSelected = selectedNewSubjects.includes(subName);
                      return (
                        <button
                          key={subName}
                          type="button"
                          onClick={() => {
                            setSelectedNewSubjects((prev) =>
                              prev.includes(subName)
                                ? prev.filter((s) => s !== subName)
                                : [...prev, subName]
                            );
                          }}
                          className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold border transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {subName}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-2.5 bg-slate-50 border border-dashed border-slate-300 rounded-xl text-[11px] text-slate-500">
                    No hay materias dadas de alta para <strong>{nivelDocente}</strong> en el módulo Materias y Grupos.
                  </div>
                )}
              </div>

              <div className="pt-3 border-t flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddTeacherOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white rounded-lg"
                  style={{ backgroundColor: primaryColor }}
                >
                  Registrar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Level, Groups & Subjects to Teacher Modal */}
      {editingTeacherForGroups && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
            <div className="p-4 border-b flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="font-bold text-sm text-slate-900">
                  Asignar Nivel, Grupos y Materias al Docente
                </h3>
                <p className="text-[11px] text-slate-500">
                  {editingTeacherForGroups.nombre} ({editingTeacherForGroups.especialidad})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingTeacherForGroups(null)}
                className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs max-h-[82vh] overflow-y-auto">
              <div>
                <label className="font-semibold block mb-1 text-slate-800">
                  Nivel Educativo que Impartirá el Docente
                </label>
                <select
                  value={editNivelDocente}
                  onChange={(e) => {
                    const nextLvl = e.target.value as AcademicLevel;
                    setEditNivelDocente(nextLvl);
                    const validGroupSet = new Set(
                      getGroupsForCollegeLevel(activeCollege.id, nextLvl)
                    );
                    setEditGroupsList((prev) => prev.filter((g) => validGroupSet.has(g)));
                    const validSubjectSet = new Set(getSubjectsForLevel(nextLvl));
                    setEditSubjectsList((prev) => prev.filter((s) => validSubjectSet.has(s)));
                  }}
                  className="w-full px-3 py-2 border rounded-lg bg-white font-semibold text-slate-800"
                >
                  {allowedLevels.map((lvl) => (
                    <option key={lvl} value={lvl}>
                      {lvl}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-semibold text-slate-800">
                    Grupos de {editNivelDocente} (desde Materias y Grupos)
                  </span>
                </div>
                <p className="text-slate-600 leading-relaxed mb-2">
                  Selecciona los grupos de <strong>{editNivelDocente}</strong> a cargo de este docente. Al guardar, los alumnos de esos grupos en <strong>Control de Alumnos</strong> se enlazarán automáticamente.
                </p>

                <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  {availableGroupsForEditTeacher.map((grp) => {
                    const isSelected = editGroupsList.includes(grp);
                    return (
                      <button
                        key={grp}
                        type="button"
                        onClick={() => {
                          setEditGroupsList((prev) =>
                            prev.includes(grp) ? prev.filter((g) => g !== grp) : [...prev, grp]
                          );
                        }}
                        className={`py-2 rounded-lg text-[11px] font-bold border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {grp}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Materias de {editNivelDocente} a Impartir</span>
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                    Solo nivel {editNivelDocente}
                  </span>
                </div>
                <p className="text-slate-600 leading-relaxed mb-2">
                  Selecciona las materias del nivel <strong>{editNivelDocente}</strong> que impartirá este profesor:
                </p>

                {availableSubjectsForEditTeacher.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                    {availableSubjectsForEditTeacher.map((subName) => {
                      const isSelected = editSubjectsList.includes(subName);
                      return (
                        <button
                          key={subName}
                          type="button"
                          onClick={() => {
                            setEditSubjectsList((prev) =>
                              prev.includes(subName)
                                ? prev.filter((s) => s !== subName)
                                : [...prev, subName]
                            );
                          }}
                          className={`px-3 py-2 rounded-lg text-[11px] font-bold border text-left transition-all cursor-pointer truncate ${
                            isSelected
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                          title={subName}
                        >
                          {subName}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-3 bg-slate-50 border border-dashed border-slate-300 rounded-xl text-slate-500 text-center">
                    No hay materias registradas en el nivel <strong>{editNivelDocente}</strong> dentro del módulo <strong>Materias y Grupos</strong>.
                  </div>
                )}
              </div>

              {/* Opción Tutor Principal para asignar un grupo bajo su tutela */}
              <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/50 space-y-3">
                <label className="flex items-start gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={editEsTutorPrincipal}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setEditEsTutorPrincipal(checked);
                      if (checked && !editGrupoTutorado) {
                        setEditGrupoTutorado(
                          editGroupsList[0] || availableGroupsForEditTeacher[0] || ''
                        );
                      }
                    }}
                    className="mt-0.5 w-4 h-4 rounded border-emerald-400 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                  />
                  <div className="flex-1">
                    <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                      <UserCheck className="w-4 h-4 text-emerald-600" />
                      <span>Tutor Principal (Grupo bajo su tutela)</span>
                    </span>
                    <span className="text-[11px] text-slate-600 block mt-0.5">
                      Activa esta opción para designar a este profesor como tutor titular de un grupo específico de {editNivelDocente}.
                    </span>
                  </div>
                </label>

                {editEsTutorPrincipal && (
                  <div className="pt-2 border-t border-emerald-200/70 space-y-2">
                    <span className="font-semibold text-emerald-950 text-[11px] block">
                      Selecciona el grupo bajo su tutela ({editNivelDocente}):
                    </span>
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                      {availableGroupsForEditTeacher.map((grp) => {
                        const isTutored = editGrupoTutorado === grp;
                        return (
                          <button
                            key={grp}
                            type="button"
                            onClick={() => {
                              setEditGrupoTutorado(grp);
                              if (!editGroupsList.includes(grp)) {
                                setEditGroupsList((prev) => [...prev, grp]);
                              }
                            }}
                            className={`py-2 rounded-lg text-[11px] font-bold border transition-all cursor-pointer ${
                              isTutored
                                ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                                : 'bg-white text-slate-700 border-emerald-200 hover:bg-emerald-100/50'
                            }`}
                          >
                            {grp}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-2 border-t flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingTeacherForGroups(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const effectiveTutorGroup =
                      editEsTutorPrincipal && editGrupoTutorado ? editGrupoTutorado : undefined;
                    const finalGroups =
                      effectiveTutorGroup && !editGroupsList.includes(effectiveTutorGroup)
                        ? [...editGroupsList, effectiveTutorGroup]
                        : editGroupsList;

                    // If another teacher in the same college & level had this same tutored group, clear theirs so there's 1 tutor principal per group
                    if (effectiveTutorGroup) {
                      collegeTeachers.forEach((other) => {
                        if (
                          other.id !== editingTeacherForGroups.id &&
                          other.esTutorPrincipal &&
                          other.grupoTutorado === effectiveTutorGroup &&
                          resolveTeacherLevel(other) === editNivelDocente
                        ) {
                          updateTeacher(other.id, {
                            esTutorPrincipal: false,
                            grupoTutorado: undefined,
                          });
                        }
                      });
                    }

                    updateTeacher(editingTeacherForGroups.id, {
                      nivel: editNivelDocente,
                      grupos: finalGroups,
                      materias: editSubjectsList,
                      esTutorPrincipal: editEsTutorPrincipal,
                      grupoTutorado: effectiveTutorGroup,
                    });
                    setEditingTeacherForGroups(null);
                  }}
                  className="px-4 py-2 text-xs font-bold text-white rounded-lg cursor-pointer"
                  style={{ backgroundColor: primaryColor }}
                >
                  Guardar Asignación
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
