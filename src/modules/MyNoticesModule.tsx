import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import {
  Bell,
  Search,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Filter,
  User,
  GraduationCap,
  Eye,
  X,
  FileText,
  Clock,
  Sparkles,
  ShieldCheck,
  Building2,
  Mail,
  ChevronRight,
} from 'lucide-react';
import { Notice, Student } from '../types';

interface Props {
  onNavigateTab?: (tab: string) => void;
  isEmbedded?: boolean;
}

export const MyNoticesModule: React.FC<Props> = ({ onNavigateTab, isEmbedded = false }) => {
  const { activeCollege, currentUser, students, notices } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPriority, setSelectedPriority] = useState<string>('todos');
  const [selectedStudentFilter, setSelectedStudentFilter] = useState<string>('todos');
  const [selectedNoticeForModal, setSelectedNoticeForModal] = useState<Notice | null>(null);
  const [readNoticeIds, setReadNoticeIds] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(`read_notices_${currentUser?.id}`);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const markAsRead = (noticeId: string) => {
    if (!readNoticeIds.includes(noticeId)) {
      const updated = [...readNoticeIds, noticeId];
      setReadNoticeIds(updated);
      try {
        localStorage.setItem(`read_notices_${currentUser?.id}`, JSON.stringify(updated));
      } catch {
        // ignore
      }
    }
  };

  const openNoticeDetail = (notice: Notice) => {
    markAsRead(notice.id);
    setSelectedNoticeForModal(notice);
  };

  // 1. Estudiantes vinculados al perfil del tutor actual
  const myStudents = useMemo(() => {
    if (!currentUser || currentUser.rol !== 'tutor') return [];
    return students.filter((s) => {
      if (s.colegioId !== activeCollege?.id) return false;
      if (s.estatus === 'baja') return false;
      if (s.tutorId === currentUser.id) return true;
      if (currentUser.hijosIds?.includes(s.id)) return true;
      if (currentUser.curpsAsociadas?.includes(s.curp)) return true;
      if (
        currentUser.correo &&
        s.tutorCorreo &&
        s.tutorCorreo.toLowerCase() === currentUser.correo.toLowerCase()
      ) {
        return true;
      }
      return false;
    });
  }, [students, activeCollege?.id, currentUser]);

  // 2. Registro de alumno si el usuario actual es alumno
  const myStudentRecord = useMemo(() => {
    if (!currentUser || currentUser.rol !== 'alumno') return null;
    return (
      students.find(
        (s) =>
          s.colegioId === activeCollege?.id &&
          (s.id === currentUser.id ||
            s.matricula === currentUser.usuarioLogin ||
            (currentUser.correo && s.tutorCorreo?.toLowerCase() === currentUser.correo.toLowerCase()))
      ) || null
    );
  }, [students, activeCollege?.id, currentUser]);

  // 3. Filtrado estricto de comunicados según el perfil (Tutor vs Alumno)
  const profileNotices = useMemo(() => {
    if (!currentUser) return [];

    return notices.filter((n) => {
      // Colegio activo
      if (activeCollege && n.colegioId !== activeCollege.id && n.colegioId !== 'todos') {
        return false;
      }

      const destLower = (n.destinatarios || '').toLowerCase();
      const titleLower = (n.titulo || '').toLowerCase();
      const contentLower = (n.contenido || '').toLowerCase();
      const myEmail = (currentUser.correo || '').trim().toLowerCase();
      const myId = currentUser.id.toLowerCase();

      // ¿Está explícitamente involucrado por ID o correo directo?
      const isDirectlyInvolved = Boolean(
        n.usuariosInvolucradosIds?.some((id) => id.toLowerCase() === myId) ||
          (myEmail &&
            (n.destinatariosPrincipalesCorreos?.some((c) => c.toLowerCase() === myEmail) ||
              n.enCopiaCorreos?.some((c) => c.toLowerCase() === myEmail)))
      );

      if (isDirectlyInvolved) return true;

      // REGLAS PARA TUTOR:
      if (currentUser.rol === 'tutor') {
        // Excluir comunicados exclusivos para personal docente o directivo
        const isInternalStaffOnly =
          destLower.includes('solo docentes') ||
          destLower.includes('solo profesores') ||
          destLower.includes('consejo técnico') ||
          destLower.includes('administrativo') ||
          (destLower.includes('docentes') &&
            !destLower.includes('padres') &&
            !destLower.includes('tutores') &&
            !destLower.includes('comunidad') &&
            !destLower.includes('familia'));

        if (isInternalStaffOnly) return false;

        // A. Comunicados dirigidos a toda la comunidad o padres/tutores generales
        const isForCommunityOrParents =
          destLower.includes('toda la comunidad') ||
          destLower.includes('padres') ||
          destLower.includes('tutores') ||
          destLower.includes('familia') ||
          destLower.includes('comunidad escolar') ||
          destLower === 'todos';

        // B. Comunicados específicos de los grupos o niveles de sus hijos
        const matchesAnyChild = myStudents.some((st) => {
          const stGroupFull = `${st.grado} ${st.grupo}`.toLowerCase();
          const stGrade = (st.grado || '').toLowerCase();
          const stLevel = (st.nivel || '').toLowerCase();
          const stName = `${st.nombre} ${st.apellidos}`.toLowerCase();
          const stMat = (st.matricula || '').toLowerCase();

          const groupMatch =
            destLower.includes(stGroupFull) ||
            destLower.includes(stGrade) ||
            (stLevel && destLower.includes(stLevel)) ||
            (n.gradoGrupo && n.gradoGrupo.toLowerCase().includes(stGrade));

          const studentDirectMatch =
            n.estudianteId === st.id ||
            n.usuariosInvolucradosIds?.includes(st.id) ||
            titleLower.includes(stName) ||
            titleLower.includes(stMat) ||
            contentLower.includes(stName) ||
            contentLower.includes(stMat);

          return groupMatch || studentDirectMatch;
        });

        // C. Citatorios o avisos oficiales que apliquen a sus alumnos
        const isSpecialTutorNotice =
          (n.tipoComunicado === 'Citatorio' ||
            n.tipoComunicado === 'Reporte al Tutor' ||
            n.tipoComunicado === 'Aviso' ||
            n.tipoComunicado === 'Circular General' ||
            n.tipoComunicado === 'Notificación') &&
          (isForCommunityOrParents || matchesAnyChild);

        return isForCommunityOrParents || matchesAnyChild || isSpecialTutorNotice;
      }

      // REGLAS PARA ALUMNO:
      if (currentUser.rol === 'alumno') {
        const isInternalStaffOnly =
          destLower.includes('docentes') ||
          destLower.includes('profesores') ||
          destLower.includes('administrativo') ||
          destLower.includes('consejo técnico');

        if (
          isInternalStaffOnly &&
          !destLower.includes('alumnos') &&
          !destLower.includes('estudiantes') &&
          !destLower.includes('comunidad')
        ) {
          return false;
        }

        const isForCommunityOrStudents =
          destLower.includes('toda la comunidad') ||
          destLower.includes('alumnos') ||
          destLower.includes('estudiantes') ||
          destLower.includes('comunidad escolar') ||
          destLower === 'todos';

        const matchesMyStudent = Boolean(
          myStudentRecord &&
            (destLower.includes(`${myStudentRecord.grado} ${myStudentRecord.grupo}`.toLowerCase()) ||
              destLower.includes(myStudentRecord.grado.toLowerCase()) ||
              (myStudentRecord.nivel && destLower.includes(myStudentRecord.nivel.toLowerCase())) ||
              (n.gradoGrupo && n.gradoGrupo.toLowerCase().includes(myStudentRecord.grado.toLowerCase())) ||
              n.estudianteId === myStudentRecord.id ||
              n.usuariosInvolucradosIds?.includes(myStudentRecord.id) ||
              titleLower.includes(myStudentRecord.matricula.toLowerCase()))
        );

        return isForCommunityOrStudents || matchesMyStudent;
      }

      return true;
    });
  }, [notices, activeCollege?.id, currentUser, myStudents, myStudentRecord]);

  // 4. Filtrado por búsqueda, prioridad y alumno específico (en caso de tutor con varios hijos)
  const filteredNotices = useMemo(() => {
    return profileNotices.filter((notice) => {
      // Prioridad
      if (selectedPriority !== 'todos' && notice.prioridad.toLowerCase() !== selectedPriority) {
        return false;
      }

      // Filtro por hijo (solo tutor)
      if (currentUser?.rol === 'tutor' && selectedStudentFilter !== 'todos') {
        const targetStudent = myStudents.find((s) => s.id === selectedStudentFilter);
        if (targetStudent) {
          const stGrade = targetStudent.grado.toLowerCase();
          const stName = `${targetStudent.nombre} ${targetStudent.apellidos}`.toLowerCase();
          const dest = (notice.destinatarios || '').toLowerCase();
          const body = (notice.contenido || '').toLowerCase();
          const title = (notice.titulo || '').toLowerCase();

          const isGeneral =
            dest.includes('toda la comunidad') ||
            dest.includes('padres de familia') ||
            dest.includes('tutores generales');

          const isSpecificToChild =
            dest.includes(stGrade) ||
            title.includes(stName) ||
            body.includes(stName) ||
            notice.estudianteId === targetStudent.id ||
            notice.usuariosInvolucradosIds?.includes(targetStudent.id);

          if (!isGeneral && !isSpecificToChild) return false;
        }
      }

      // Búsqueda por texto
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const inTitle = (notice.titulo || '').toLowerCase().includes(q);
        const inContent = (notice.contenido || '').toLowerCase().includes(q);
        const inAuthor = (notice.autor || '').toLowerCase().includes(q);
        const inDest = (notice.destinatarios || '').toLowerCase().includes(q);
        const inTipo = (notice.tipoComunicado || '').toLowerCase().includes(q);
        if (!inTitle && !inContent && !inAuthor && !inDest && !inTipo) return false;
      }

      return true;
    });
  }, [profileNotices, selectedPriority, selectedStudentFilter, searchTerm, currentUser?.rol, myStudents]);

  const unreadCount = useMemo(() => {
    return profileNotices.filter((n) => !readNoticeIds.includes(n.id)).length;
  }, [profileNotices, readNoticeIds]);

  const primaryColor = activeCollege?.colores?.primario || '#0B2545';
  const goldColor = activeCollege?.colores?.secundario || '#C59B27';

  // Helper para saber a qué hijo aplica un comunicado
  const getAppliedChildrenNames = (notice: Notice): string[] => {
    if (currentUser?.rol !== 'tutor') return [];
    const dest = (notice.destinatarios || '').toLowerCase();
    const title = (notice.titulo || '').toLowerCase();
    const body = (notice.contenido || '').toLowerCase();

    return myStudents
      .filter((st) => {
        const stGrade = st.grado.toLowerCase();
        const stName = `${st.nombre} ${st.apellidos}`.toLowerCase();
        return (
          dest.includes(stGrade) ||
          title.includes(stName) ||
          body.includes(stName) ||
          notice.estudianteId === st.id ||
          notice.usuariosInvolucradosIds?.includes(st.id)
        );
      })
      .map((st) => `${st.nombre} (${st.grado} "${st.grupo}")`);
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Cabecera / Banner solo si no está embebido dentro de los tabs del portal alumno */}
      {!isEmbedded && (
        <div
          className="rounded-3xl p-6 lg:p-8 text-white shadow-md relative overflow-hidden"
          style={{
            background: `linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}dd 100%)`,
            borderBottom: `4px solid ${goldColor}`,
          }}
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span
                  className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider inline-flex items-center gap-1.5 shadow-2xs"
                  style={{ backgroundColor: goldColor, color: primaryColor }}
                >
                  <Bell className="w-3.5 h-3.5" />
                  <span>
                    {currentUser?.rol === 'tutor'
                      ? 'Buzón de Comunicados para Padres y Tutores'
                      : 'Buzón de Comunicados y Avisos Oficiales'}
                  </span>
                </span>
                {unreadCount > 0 && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-rose-500 text-white animate-pulse">
                    {unreadCount} nuevo(s)
                  </span>
                )}
              </div>

              <h1 className="font-display font-black text-2xl sm:text-3xl tracking-tight text-white">
                Mis Comunicados
              </h1>

              <p className="text-xs sm:text-sm text-slate-200 max-w-2xl leading-relaxed">
                {currentUser?.rol === 'tutor'
                  ? `Circulares oficiales, avisos de dirección, citatorios y comunicados escolares vinculados a tu perfil y al de tus alumnos a cargo en ${activeCollege?.nombre || 'el colegio'}.`
                  : `Circulares institucionales, avisos de dirección y novedades académicas dirigidas a tu grupo en ${activeCollege?.nombre || 'el colegio'}.`}
              </p>

              {/* Lista de alumnos vinculados al tutor */}
              {currentUser?.rol === 'tutor' && myStudents.length > 0 && (
                <div className="pt-2 flex flex-wrap items-center gap-2 text-xs">
                  <span className="text-slate-300 font-semibold flex items-center gap-1">
                    <GraduationCap className="w-4 h-4 text-amber-300" />
                    <span>Hijos a tu cargo:</span>
                  </span>
                  {myStudents.map((st) => (
                    <span
                      key={st.id}
                      className="px-2.5 py-1 rounded-xl bg-white/20 backdrop-blur-xs text-white font-bold border border-white/30 text-[11px]"
                    >
                      {st.nombre} {st.apellidos} · {st.grado} "{st.grupo}"
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20 self-start md:self-center text-center shrink-0 min-w-[160px]">
              <span className="text-[10px] uppercase font-bold text-slate-300 block">
                Total Recibidos
              </span>
              <div className="text-3xl font-display font-black text-white mt-0.5">
                {profileNotices.length}
              </div>
              <span className="text-[11px] font-semibold text-emerald-300 mt-1 inline-flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Bandeja verificada</span>
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Barra de Filtros y Búsqueda */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200 shadow-sm space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          {/* Input de Búsqueda */}
          <div className={`${currentUser?.rol === 'tutor' && myStudents.length > 1 ? 'md:col-span-5' : 'md:col-span-8'} relative`}>
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar comunicado por título, emisor, tema o contenido..."
              className="w-full pl-9 pr-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-300 focus:outline-hidden focus:border-slate-500 text-slate-900 font-medium"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Filtro por Hijo (solo para tutores con más de 1 alumno a su cargo) */}
          {currentUser?.rol === 'tutor' && myStudents.length > 1 && (
            <div className="md:col-span-4">
              <select
                value={selectedStudentFilter}
                onChange={(e) => setSelectedStudentFilter(e.target.value)}
                className="w-full px-3 py-2.5 text-xs rounded-xl border border-slate-300 bg-white font-medium text-slate-800 focus:outline-hidden cursor-pointer"
              >
                <option value="todos">Todos mis hijos ({myStudents.length})</option>
                {myStudents.map((st) => (
                  <option key={st.id} value={st.id}>
                    {st.nombre} {st.apellidos} ({st.grado} "{st.grupo}")
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Filtro por Prioridad */}
          <div className={`${currentUser?.rol === 'tutor' && myStudents.length > 1 ? 'md:col-span-3' : 'md:col-span-4'}`}>
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="w-full px-3 py-2.5 text-xs rounded-xl border border-slate-300 bg-white font-medium text-slate-800 focus:outline-hidden cursor-pointer"
            >
              <option value="todos">Todas las Prioridades</option>
              <option value="urgente">🚨 Urgente</option>
              <option value="importante">⚠️ Importante</option>
              <option value="normal">ℹ️ Normal</option>
            </select>
          </div>
        </div>

        {/* Resumen rápido de conteo de comunicados */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span>
              Mostrando <strong className="text-slate-900">{filteredNotices.length}</strong> de{' '}
              <strong className="text-slate-900">{profileNotices.length}</strong> comunicados dirigidos a tu perfil
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-50 text-rose-800 font-bold text-[10px]">
              🚨 {profileNotices.filter((n) => n.prioridad === 'Urgente').length} Urgentes
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 font-bold text-[10px]">
              ⚠️ {profileNotices.filter((n) => n.prioridad === 'Importante').length} Importantes
            </span>
          </div>
        </div>
      </div>

      {/* Listado de Comunicados */}
      {filteredNotices.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 shadow-2xs space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <Bell className="w-6 h-6" />
          </div>
          <h3 className="font-display font-bold text-slate-900 text-base">
            No se encontraron comunicados
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            {searchTerm || selectedPriority !== 'todos' || selectedStudentFilter !== 'todos'
              ? 'No hay avisos que coincidan con los filtros seleccionados. Intenta restablecer los filtros de búsqueda.'
              : 'En este momento no hay circulares o comunicados pendientes dirigidos a tu perfil.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3.5">
          {filteredNotices.map((notice) => {
            const isRead = readNoticeIds.includes(notice.id);
            const appliedChildren = getAppliedChildrenNames(notice);

            return (
              <div
                key={notice.id}
                onClick={() => openNoticeDetail(notice)}
                className={`bg-white rounded-3xl p-5 sm:p-6 border transition-all cursor-pointer space-y-3 hover:shadow-md ${
                  !isRead
                    ? 'border-amber-300 shadow-xs ring-1 ring-amber-200/80 bg-gradient-to-r from-amber-50/20 via-white to-white'
                    : 'border-slate-200/90 shadow-2xs hover:border-slate-300'
                }`}
              >
                {/* Fila Superior: Prioridad + Tipo + Fecha + Estado de Lectura */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Badge de Prioridad */}
                    <span
                      className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                        notice.prioridad === 'Urgente'
                          ? 'bg-rose-100 text-rose-800 border border-rose-300'
                          : notice.prioridad === 'Importante'
                          ? 'bg-amber-100 text-amber-900 border border-amber-300'
                          : 'bg-blue-100 text-blue-800 border border-blue-200'
                      }`}
                    >
                      {notice.prioridad}
                    </span>

                    {/* Badge de Tipo de Comunicado */}
                    {notice.tipoComunicado && (
                      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                        {notice.tipoComunicado}
                      </span>
                    )}

                    {/* Indicador de Nuevo / Leído */}
                    {!isRead ? (
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-ping" />
                        <span>Nuevo</span>
                      </span>
                    ) : (
                      <span className="text-[10px] font-semibold text-slate-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-slate-400" />
                        <span>Leído</span>
                      </span>
                    )}
                  </div>

                  <span className="text-xs font-mono text-slate-400 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>{notice.fecha}</span>
                  </span>
                </div>

                {/* Título */}
                <h3 className="font-display font-bold text-base sm:text-lg text-slate-900 group-hover:text-amber-900 transition-colors">
                  {notice.titulo}
                </h3>

                {/* Extracto de contenido */}
                <p className="text-xs sm:text-sm text-slate-600 line-clamp-2 leading-relaxed">
                  {notice.contenido}
                </p>

                {/* Si aplica a hijos específicos del tutor */}
                {appliedChildren.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 pt-1 text-xs">
                    <span className="text-indigo-900 font-bold text-[11px] flex items-center gap-1">
                      <GraduationCap className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Aplica a tu hijo(a):</span>
                    </span>
                    {appliedChildren.map((name, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-950 font-extrabold text-[11px]"
                      >
                        {name}
                      </span>
                    ))}
                  </div>
                )}

                {/* Pie de la tarjeta: Autor y Destinatarios */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span>
                      Publicado por: <strong className="text-slate-800">{notice.autor}</strong>
                      {notice.autorRol ? ` (${notice.autorRol})` : ''}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-slate-500 text-[11px]">
                      Destinatarios: <span className="font-semibold text-slate-700">{notice.destinatarios}</span>
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        openNoticeDetail(notice);
                      }}
                      className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 hover:text-amber-900 transition-colors ml-auto sm:ml-0"
                    >
                      <span>Leer completo</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL DETALLE DE COMUNICADO COMPLETO */}
      {selectedNoticeForModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden animate-in zoom-in-95 max-h-[90vh] flex flex-col">
            {/* Cabecera del modal */}
            <div
              className="p-5 sm:p-6 text-white flex items-start justify-between gap-3 shrink-0"
              style={{ backgroundColor: primaryColor }}
            >
              <div className="space-y-1.5 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                      selectedNoticeForModal.prioridad === 'Urgente'
                        ? 'bg-rose-500 text-white shadow-2xs'
                        : selectedNoticeForModal.prioridad === 'Importante'
                        ? 'bg-amber-400 text-slate-950 shadow-2xs'
                        : 'bg-white/20 text-white'
                    }`}
                  >
                    {selectedNoticeForModal.prioridad}
                  </span>
                  {selectedNoticeForModal.tipoComunicado && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/15 text-slate-100">
                      {selectedNoticeForModal.tipoComunicado}
                    </span>
                  )}
                  <span className="text-xs font-mono text-slate-200 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{selectedNoticeForModal.fecha}</span>
                  </span>
                </div>

                <h2 className="font-display font-bold text-lg sm:text-xl text-white leading-snug">
                  {selectedNoticeForModal.titulo}
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setSelectedNoticeForModal(null)}
                className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Cuerpo del comunicado */}
            <div className="p-6 overflow-y-auto space-y-4 text-xs sm:text-sm text-slate-700 leading-relaxed">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 whitespace-pre-wrap font-sans text-slate-800 leading-relaxed shadow-2xs">
                {selectedNoticeForModal.contenido}
              </div>

              {/* Ficha de Autor y Destinatarios */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-slate-100/70 p-4 rounded-2xl border border-slate-200">
                <div>
                  <span className="text-slate-400 font-bold block text-[10px] uppercase">
                    Emisor / Autor
                  </span>
                  <span className="font-bold text-slate-900 block mt-0.5">
                    {selectedNoticeForModal.autor}
                  </span>
                  {selectedNoticeForModal.autorRol && (
                    <span className="text-slate-500 text-[11px] block">
                      Rol: {selectedNoticeForModal.autorRol}
                    </span>
                  )}
                </div>

                <div>
                  <span className="text-slate-400 font-bold block text-[10px] uppercase">
                    Destinatarios Oficiales
                  </span>
                  <span className="font-semibold text-slate-800 block mt-0.5">
                    {selectedNoticeForModal.destinatarios}
                  </span>
                  {selectedNoticeForModal.gradoGrupo && (
                    <span className="text-indigo-700 font-bold text-[11px] block">
                      Grupo: {selectedNoticeForModal.gradoGrupo}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Pie del modal */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
              <span className="text-xs text-slate-500 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Marcado como leído en tu cuenta</span>
              </span>

              <button
                type="button"
                onClick={() => setSelectedNoticeForModal(null)}
                className="px-5 py-2 rounded-xl text-xs font-bold text-white shadow-sm hover:opacity-90 transition-opacity cursor-pointer"
                style={{ backgroundColor: primaryColor }}
              >
                Entendido / Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
