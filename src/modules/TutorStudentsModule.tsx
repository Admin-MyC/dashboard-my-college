import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  GraduationCap,
  Calendar,
  Award,
  CheckCircle2,
  AlertCircle,
  FileText,
  User,
  Phone,
  Mail,
  Building2,
  ChevronRight,
  Sparkles,
  BookOpen,
  ArrowRight,
  ShieldCheck,
  CreditCard,
  Upload,
  Send,
  Clock,
  Check,
  X,
  Car,
} from 'lucide-react';
import { ReportCardModal } from '../components/ReportCardModal';
import { Student, AttendanceRecord, AcademicLevel } from '../types';
import { compressImageFile } from '../utils/imageCompressor';

interface Props {
  onNavigateTab?: (tab: string) => void;
  onTriggerEnFila?: (studentIds?: string[]) => void;
}

export const TutorStudentsModule: React.FC<Props> = ({
  onNavigateTab,
  onTriggerEnFila,
}) => {
  const {
    currentUser,
    students,
    colleges,
    grades,
    attendanceRecords,
    addAttendanceRecord,
    updateAttendanceRecord,
    users,
    sendEmailNotification,
    drivePickupQueue,
    isCollegeDriveUsageEnabled,
  } = useApp();
  const [selectedStudentForBoleta, setSelectedStudentForBoleta] = useState<Student | null>(null);
  const [selectedStudentForJustificante, setSelectedStudentForJustificante] =
    useState<Student | null>(null);
  const [selectedRecordId, setSelectedRecordId] = useState<string>('nueva_fecha');
  const [customAbsenceDate, setCustomAbsenceDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [justificationMotivo, setJustificationMotivo] = useState<string>('');
  const [proofFileName, setProofFileName] = useState<string>('');
  const [proofFileDataUrl, setProofFileDataUrl] = useState<string>('');
  const [submitSuccessMsg, setSubmitSuccessMsg] = useState<string | null>(null);

  // Find students linked to this tutor via hijosIds, curpsAsociadas, or matching email/phone (excluding estatus 'baja')
  const linkedStudents = students.filter((s) => {
    if (s.estatus === 'baja') return false;
    if (s.tutorId === currentUser.id) return true;
    if (currentUser.hijosIds && currentUser.hijosIds.includes(s.id)) return true;
    if (currentUser.curpsAsociadas && s.curp && currentUser.curpsAsociadas.includes(s.curp.toUpperCase())) return true;
    if (currentUser.correo && s.tutorCorreo && s.tutorCorreo.toLowerCase() === currentUser.correo.toLowerCase()) return true;
    return false;
  });

  const tutorCollege =
    (linkedStudents[0] ? colleges.find((c) => c.id === linkedStudents[0].colegioId) : null) ||
    colleges.find((c) => c.id === currentUser.colegioId);
  const isTutorCollegeDriveEnabled = isCollegeDriveUsageEnabled(tutorCollege?.id || null);
  const primaryColor = tutorCollege?.colores?.primario || '#0B2545';
  const goldColor = tutorCollege?.colores?.secundario || '#C59B27';

  const getStudentEffectiveLevel = (st: Student): AcademicLevel => {
    if (st.nivel) return st.nivel;
    const col = colleges.find((c) => c.id === st.colegioId);
    const colNivel = (col?.nivel || '').toLowerCase();
    if (colNivel === 'preescolar') return 'Preescolar';
    if (colNivel === 'primaria') return 'Primaria';
    if (colNivel === 'secundaria') return 'Secundaria';
    if (colNivel === 'preparatoria') return 'Preparatoria';
    return 'Primaria';
  };

  // Localizar al Coordinador asignado al grupo/nivel del alumno en su colegio (incluyendo coordinadores multinivel o de grupos específicos)
  const getAssignedCoordinatorForStudent = (st: Student) => {
    const stLevel = getStudentEffectiveLevel(st);
    const stGrupoClean = (st.grupo || '').replace(/["']/g, '').trim().toUpperCase();
    const fullGroupKey = `${stLevel} ${st.grado} ${stGrupoClean}`.toLowerCase();

    const collegeCoordinators = users.filter(
      (u) => u.colegioId === st.colegioId && u.rol === 'coordinador' && u.activo !== false
    );

    // 1. Priorizar coordinador que tenga asignado específicamente este grupo (ej. "Primaria 4° A" o "Secundaria 1° B")
    const groupMatch = collegeCoordinators.find((u) =>
      (u.gruposAsignados || []).some(
        (g) => g.replace(/["']/g, '').replace(/\s+/g, ' ').trim().toLowerCase() === fullGroupKey
      )
    );
    if (groupMatch) return groupMatch;

    // 2. Coordinador que tenga asignado el nivel del alumno (sin restricción de otros grupos específicos)
    const levelMatch = collegeCoordinators.find((u) => {
      const hasSpecific = u.gruposAsignados && u.gruposAsignados.length > 0;
      if (hasSpecific) return false;
      if (u.nivelesAsignados && u.nivelesAsignados.includes(stLevel)) return true;
      if (u.nivelAsignado && u.nivelAsignado === stLevel) return true;
      const cargo = (u.cargo || '').toLowerCase();
      return cargo.includes(stLevel.toLowerCase());
    });
    return levelMatch || collegeCoordinators[0] || null;
  };

  const openJustificanteModalForStudent = (st: Student) => {
    setSelectedStudentForJustificante(st);
    const studentFaltas = attendanceRecords.filter(
      (a) =>
        a.estudianteId === st.id &&
        (a.estado === 'falta' || a.estado === 'retardo') &&
        a.justificanteEstado !== 'aprobado'
    );
    if (studentFaltas.length > 0) {
      setSelectedRecordId(studentFaltas[0].id);
    } else {
      setSelectedRecordId('nueva_fecha');
    }
    setCustomAbsenceDate(new Date().toISOString().split('T')[0]);
    setJustificationMotivo('');
    setProofFileName('');
    setProofFileDataUrl('');
    setSubmitSuccessMsg(null);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setProofFileName(file.name);
    try {
      const dataUrl = await compressImageFile(file, 540, 540, 0.82);
      setProofFileDataUrl(dataUrl);
    } catch {
      // ignore
    }
  };

  const handleSubmitJustification = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentForJustificante || !justificationMotivo.trim()) return;

    const st = selectedStudentForJustificante;
    const stLevel = getStudentEffectiveLevel(st);
    const assignedCoordinator = getAssignedCoordinatorForStudent(st);
    const todayIso = new Date().toISOString().split('T')[0];

    let targetFecha = customAbsenceDate;
    let targetMateria = '';

    if (selectedRecordId !== 'nueva_fecha') {
      const existingRec = attendanceRecords.find((r) => r.id === selectedRecordId);
      if (existingRec) {
        targetFecha = existingRec.fecha;
        targetMateria = existingRec.materiaNombre || '';
        updateAttendanceRecord(existingRec.id, {
          nivel: stLevel,
          justificanteEstado: 'pendiente',
          justificanteMotivo: justificationMotivo.trim(),
          justificanteArchivoNombre: proofFileName || 'Comprobante_Justificante.jpg',
          justificanteArchivoUrl:
            proofFileDataUrl ||
            'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=600&q=80',
          justificanteFechaEnvio: todayIso,
          justificanteEnviadoPor: currentUser.nombre,
        });
      }
    } else {
      // Si aún no existía registro para esa fecha o quiere reportar falta con justificante
      const existingOnDate = attendanceRecords.find(
        (r) => r.estudianteId === st.id && r.fecha === customAbsenceDate
      );
      if (existingOnDate) {
        updateAttendanceRecord(existingOnDate.id, {
          nivel: stLevel,
          justificanteEstado: 'pendiente',
          justificanteMotivo: justificationMotivo.trim(),
          justificanteArchivoNombre: proofFileName || 'Comprobante_Justificante.jpg',
          justificanteArchivoUrl:
            proofFileDataUrl ||
            'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=600&q=80',
          justificanteFechaEnvio: todayIso,
          justificanteEnviadoPor: currentUser.nombre,
        });
      } else {
        addAttendanceRecord({
          colegioId: st.colegioId,
          estudianteId: st.id,
          estudianteNombre: `${st.nombre} ${st.apellidos}`,
          matricula: st.matricula,
          nivel: stLevel,
          grado: st.grado,
          grupo: st.grupo,
          foto: st.foto,
          fecha: customAbsenceDate,
          hora: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          tipo: 'clase',
          materiaNombre: 'Matemáticas III',
          docenteNombre: st.docenteNombre || 'Docente Titular',
          estado: 'falta',
          metodo: 'manual',
          registradoPor: `Reporte con Justificante (${currentUser.nombre})`,
          tutorNotificado: true,
          justificanteEstado: 'pendiente',
          justificanteMotivo: justificationMotivo.trim(),
          justificanteArchivoNombre: proofFileName || 'Comprobante_Justificante.jpg',
          justificanteArchivoUrl:
            proofFileDataUrl ||
            'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=600&q=80',
          justificanteFechaEnvio: todayIso,
          justificanteEnviadoPor: currentUser.nombre,
        });
      }
    }

    // Enviar notificación directa al Coordinador asignado al grupo del alumno
    const colObj = colleges.find((c) => c.id === st.colegioId);
    sendEmailNotification({
      colegioId: st.colegioId,
      colegioNombre: colObj?.nombre || 'Colegio',
      destinatarios: [
        assignedCoordinator?.correo || 'coordinacion@colegio.edu.mx',
      ],
      rolesDestino: ['coordinador'],
      usuariosDestino: assignedCoordinator ? [assignedCoordinator.id, assignedCoordinator.correo] : [],
      asunto: `[Solicitud de Justificante] ${st.nombre} ${st.apellidos} (${stLevel} ${st.grado} "${st.grupo}") - Fecha: ${targetFecha}`,
      cuerpo: `El tutor ${currentUser.nombre} ha enviado un comprobante/justificante de inasistencia para el alumno(a) ${st.nombre} ${st.apellidos} (Matrícula: ${st.matricula}, Grupo: ${stLevel} ${st.grado} "${st.grupo}").\n\n• Fecha por justificar: ${targetFecha}${targetMateria ? ` (${targetMateria})` : ''}\n• Motivo expuesto: ${justificationMotivo.trim()}\n• Comprobante adjunto: ${proofFileName || 'Comprobante adjunto'}\n\nIngresa al módulo de Asistencia y Pase de Lista QR para revisar el comprobante y decidir si se cambia la falta a [J] Justificado.`,
      categoria: 'asistencia',
      prioridad: 'alta',
    });

    setSubmitSuccessMsg(
      `✓ Comprobante enviado al Coordinador asignado al grupo (${
        assignedCoordinator?.nombre || `Coordinación de ${stLevel}`
      }). Cuando el Coordinador lo revise y autorice, la falta cambiará a [J] Justificado.`
    );
    setJustificationMotivo('');
  };

  return (
    <div className="space-y-5 sm:space-y-6 animate-in fade-in max-w-7xl w-full min-w-0 mx-auto">
      {/* Header Banner */}
      <div
        className="rounded-3xl p-5 sm:p-8 text-white shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4 sm:gap-5 transition-colors overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}dd 100%)`,
          borderBottom: `4px solid ${goldColor}`,
        }}
      >
        <div className="space-y-2 min-w-0">
          <div
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] sm:text-xs font-bold uppercase tracking-wider shadow-2xs max-w-full"
            style={{ backgroundColor: goldColor, color: primaryColor }}
          >
            <GraduationCap className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Portal de Tutores · Mis Hijos</span>
          </div>
          <h1 className="font-display font-black text-xl sm:text-3xl tracking-tight leading-tight">
            Alumnos a mi Cargo
          </h1>
          <p className="text-xs sm:text-sm text-slate-200 max-w-2xl leading-relaxed">
            Consulta el expediente escolar, grado, grupo, asistencia y acceso rápido a boletas y pagos de tus hijos registrados.
          </p>
        </div>

        {linkedStudents.length > 0 && (
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto shrink-0">
            {onTriggerEnFila && isTutorCollegeDriveEnabled && (() => {
              const anyValidatedInDrive = linkedStudents.some((st) =>
                drivePickupQueue.some(
                  (q) => q.estudianteId === st.id && q.estado === 'en_fila'
                )
              );
              return (
                <button
                  type="button"
                  onClick={() => onTriggerEnFila()}
                  className={`hidden md:flex items-center gap-2 px-5 py-3 rounded-2xl font-black text-xs sm:text-sm shadow-lg border-2 transition-all cursor-pointer ${
                    anyValidatedInDrive
                      ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 border-emerald-200 ring-2 ring-emerald-300/60'
                      : 'bg-amber-400 hover:bg-amber-300 text-slate-950 border-amber-200'
                  }`}
                >
                  <Car className="w-5 h-5" />
                  <span>
                    {anyValidatedInDrive
                      ? '✓ En Fila (Listo para Recoger en Escuela)'
                      : 'En Fila (Recoger en Escuela)'}
                  </span>
                </button>
              );
            })()}
            <div className="bg-white/15 backdrop-blur-md px-4 py-2.5 sm:px-5 sm:py-3 rounded-2xl border border-white/25 flex sm:block items-center justify-between gap-3 w-full sm:w-auto text-center shrink-0">
              <span className="text-[11px] font-semibold text-slate-200 sm:hidden">
                {linkedStudents.length === 1 ? 'Hijo Vinculado' : 'Hijos Vinculados'}
              </span>
              <span className="block text-xl sm:text-2xl font-black" style={{ color: goldColor }}>{linkedStudents.length}</span>
              <span className="hidden sm:block text-[11px] font-semibold text-slate-200">
                {linkedStudents.length === 1 ? 'Hijo Vinculado' : 'Hijos Vinculados'}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Case when no students are linked yet */}
      {linkedStudents.length === 0 ? (
        <div className="bg-white rounded-3xl p-10 border border-dashed border-amber-300 text-center space-y-4 max-w-2xl mx-auto shadow-xs">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border border-amber-200">
            <GraduationCap className="w-8 h-8" />
          </div>
          <div className="space-y-1.5">
            <h3 className="font-display font-bold text-lg text-slate-900">
              No tienes alumnos vinculados a tu cuenta todavía
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
              Puedes vincular a tus hijos ingresando su <strong>Clave Única de Registro de Población (CURP)</strong> en el apartado de <strong>Mi Perfil</strong>.
            </p>
          </div>

          <button
            type="button"
            onClick={() => onNavigateTab && onNavigateTab('mi_perfil')}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0B2545] hover:bg-[#133E6E] text-white text-xs font-bold shadow-md transition-all cursor-pointer"
          >
            <User className="w-4 h-4 text-amber-300" />
            <span>Ir a Mi Perfil para Buscar por CURP</span>
          </button>
        </div>
      ) : (
        /* Students Cards Grid */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {linkedStudents.map((student) => {
            const college = colleges.find((c) => c.id === student.colegioId);
            const studentGrades = grades.filter((g) => g.estudianteId === student.id);
            const realGpa =
              studentGrades.length > 0
                ? (
                    studentGrades.reduce((acc, g) => acc + (g.promedioFinal || 0), 0) /
                    studentGrades.length
                  ).toFixed(1)
                : '0.0';
            const studentAtt = attendanceRecords.filter((a) => a.estudianteId === student.id);
            const presentCount = studentAtt.filter((a) => a.estado === 'presente' || a.estado === 'retardo').length;
            const attRate = studentAtt.length > 0 ? Math.round((presentCount / studentAtt.length) * 100) : 0;

            return (
              <div
                key={student.id}
                className="bg-white rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col justify-between"
              >
                {/* Card Header with School Badge */}
                <div
                  className="p-5 border-b border-slate-100 flex items-center justify-between"
                  style={{
                    background: college
                      ? `linear-gradient(135deg, ${college.colores.primario}0D, #ffffff)`
                      : '#f8fafc',
                  }}
                >
                  <div className="flex items-center gap-3">
                    {college?.escudoUrl && (
                      <img
                        src={college.escudoUrl}
                        alt="Escudo"
                        className="w-10 h-10 object-contain p-1 rounded-xl bg-white border border-slate-200 shadow-xs"
                      />
                    )}
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                        {college?.nombre || 'Colegio Inscrito'}
                      </span>
                      <span className="text-xs font-bold text-slate-800">
                        {student.grado} · Grupo "{student.grupo}"
                      </span>
                    </div>
                  </div>

                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                    <ShieldCheck className="w-3 h-3 text-emerald-600" />
                    <span>Inscrito Regular</span>
                  </span>
                </div>

                {/* Student Personal Info */}
                <div className="p-6 space-y-5">
                  <div className="flex items-start gap-4">
                    <img
                      src={student.foto || 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=150'}
                      alt={student.nombre}
                      className="w-16 h-16 rounded-2xl object-cover border-2 border-slate-100 shadow-xs shrink-0"
                    />
                    <div className="space-y-1 min-w-0 flex-1">
                      <h3 className="font-display font-bold text-lg text-slate-900 leading-tight">
                        {student.nombre} {student.apellidos}
                      </h3>
                      <div className="text-xs font-mono text-slate-500 flex flex-wrap gap-x-3 gap-y-1">
                        <span>Matrícula: <strong className="text-slate-800">{student.matricula}</strong></span>
                        <span>CURP: <strong className="text-slate-800">{student.curp || 'No registrada'}</strong></span>
                      </div>
                    </div>
                  </div>

                  {/* Quick Stat Badges */}
                  <div className="grid grid-cols-3 gap-2.5 pt-1">
                    <div className="p-3 rounded-2xl bg-amber-50/70 border border-amber-200 text-center">
                      <span className="text-[10px] font-bold text-amber-800 uppercase block">Promedio</span>
                      <span className="font-black text-base text-amber-950 font-mono">
                        {realGpa}
                      </span>
                    </div>

                    <div className="p-3 rounded-2xl bg-emerald-50/70 border border-emerald-200 text-center">
                      <span className="text-[10px] font-bold text-emerald-800 uppercase block">Asistencia</span>
                      <span className="font-black text-base text-emerald-950 font-mono">
                        {attRate}%
                      </span>
                    </div>

                    <div className="p-3 rounded-2xl bg-blue-50/70 border border-blue-200 text-center">
                      <span className="text-[10px] font-bold text-blue-800 uppercase block">Conducta</span>
                      <span className="font-black text-xs text-blue-950 mt-1 block font-mono">
                        Excelente
                      </span>
                    </div>
                  </div>

                  {/* Registered Tutor Info & Coordinator Info */}
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                    <div className="text-[10px] font-bold text-slate-400 uppercase">Tutor Principal Registrado:</div>
                    <div className="font-bold text-slate-800 flex items-center justify-between">
                      <span>{student.tutorNombre || currentUser.nombre}</span>
                      <span className="text-[11px] font-mono text-slate-500">{student.tutorTelefono || currentUser.telefono}</span>
                    </div>
                    {(() => {
                      const coord = getAssignedCoordinatorForStudent(student);
                      const faltasCount = studentAtt.filter(
                        (a) => a.estado === 'falta' || a.estado === 'retardo'
                      ).length;
                      const justificadosCount = studentAtt.filter(
                        (a) => a.estado === 'justificado'
                      ).length;
                      return (
                        <div className="pt-1.5 mt-1.5 border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-2 text-[11px]">
                          <span className="text-slate-600">
                            Coordinador de Grupo:{' '}
                            <strong className="text-indigo-900">
                              {coord?.nombre || `Coordinación ${getStudentEffectiveLevel(student)}`}
                            </strong>
                          </span>
                          <div className="flex items-center gap-1.5">
                            {faltasCount > 0 && (
                              <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-800 font-bold text-[10px]">
                                {faltasCount} Falta(s)/Retardo(s)
                              </span>
                            )}
                            {justificadosCount > 0 && (
                              <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-bold text-[10px]">
                                {justificadosCount} [J] Justificada(s)
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>

                {/* Card Action Buttons */}
                <div className="p-4 bg-slate-50/80 border-t border-slate-100 space-y-2">
                  {onTriggerEnFila && isCollegeDriveUsageEnabled(student.colegioId) && (() => {
                    const isStudentInDrive = drivePickupQueue.some(
                      (q) => q.estudianteId === student.id && q.estado === 'en_fila'
                    );
                    return (
                      <button
                        type="button"
                        onClick={() => onTriggerEnFila([student.id])}
                        className={`w-full py-2.5 px-3 rounded-xl font-extrabold text-xs flex items-center justify-center gap-2 transition-colors shadow-xs cursor-pointer ${
                          isStudentInDrive
                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white ring-2 ring-emerald-400/50'
                            : 'bg-[#0B2545] hover:bg-[#133E6E] text-white border border-amber-400/50'
                        }`}
                      >
                        <Car
                          className={`w-4 h-4 shrink-0 ${
                            isStudentInDrive ? 'text-white' : 'text-amber-300'
                          }`}
                        />
                        <span className="truncate">
                          {isStudentInDrive
                            ? `✓ En Fila Validado — Recoger a ${student.nombre}`
                            : `En Fila — Recoger a ${student.nombre}`}
                        </span>
                      </button>
                    );
                  })()}

                  <button
                    type="button"
                    onClick={() => openJustificanteModalForStudent(student)}
                    className="w-full py-2.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors shadow-xs cursor-pointer"
                  >
                    <Upload className="w-4 h-4 text-amber-300 shrink-0" />
                    <span className="truncate">Enviar Justificante / Comprobante de Falta</span>
                  </button>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-0.5">
                    <button
                      type="button"
                      onClick={() => setSelectedStudentForBoleta(student)}
                      className="w-full py-2.5 px-3 rounded-xl bg-white hover:bg-amber-50 border border-slate-200 hover:border-amber-300 text-slate-800 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
                    >
                      <FileText className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span>Ver Boleta Oficial</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onNavigateTab && onNavigateTab('tutor_historial')}
                      className="w-full py-2.5 px-3 rounded-xl bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-300 text-slate-800 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
                    >
                      <Award className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      <span>Historial de Notas</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onNavigateTab && onNavigateTab('tutor_cuotas')}
                      className="w-full py-2.5 px-3 rounded-xl bg-[#0B2545] hover:bg-[#133E6E] text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
                    >
                      <CreditCard className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                      <span>Cuotas Escolares</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Enviar Comprobante o Justificante de Falta al Coordinador del Grupo */}
      {selectedStudentForJustificante && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in duration-200">
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <span className="p-2.5 rounded-2xl bg-indigo-100 text-indigo-700">
                  <Upload className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="font-display font-bold text-base sm:text-lg text-slate-900">
                    Enviar Comprobante / Justificante de Falta
                  </h3>
                  <p className="text-xs text-slate-500">
                    Alumno(a):{' '}
                    <strong className="text-slate-800">
                      {selectedStudentForJustificante.nombre}{' '}
                      {selectedStudentForJustificante.apellidos}
                    </strong>{' '}
                    · {getStudentEffectiveLevel(selectedStudentForJustificante)}{' '}
                    {selectedStudentForJustificante.grado} "{selectedStudentForJustificante.grupo}"
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedStudentForJustificante(null)}
                className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {(() => {
              const coord = getAssignedCoordinatorForStudent(selectedStudentForJustificante);
              const studentAbsenceHistory = attendanceRecords.filter(
                (a) =>
                  a.estudianteId === selectedStudentForJustificante.id &&
                  (a.estado === 'falta' ||
                    a.estado === 'retardo' ||
                    Boolean(a.justificanteEstado))
              );

              return (
                <>
                  {/* Destinatario Coordinador */}
                  <div className="p-3.5 rounded-2xl bg-indigo-50/80 border border-indigo-200 flex items-center justify-between gap-3 text-xs">
                    <div>
                      <span className="text-[10px] font-bold uppercase text-indigo-700 block">
                        Se enviará directamente al Coordinador asignado al grupo:
                      </span>
                      <span className="font-bold text-indigo-950 text-sm">
                        {coord?.nombre ||
                          `Coordinación de ${getStudentEffectiveLevel(
                            selectedStudentForJustificante
                          )}`}
                      </span>
                      <span className="block text-[11px] text-indigo-700">
                        {coord?.cargo ||
                          `Coordinador de ${getStudentEffectiveLevel(
                            selectedStudentForJustificante
                          )}`}{' '}
                        · Revisará el comprobante y decidirá si cambia la falta a [J] Justificado
                      </span>
                    </div>
                    <ShieldCheck className="w-6 h-6 text-indigo-600 shrink-0" />
                  </div>

                  {submitSuccessMsg && (
                    <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-semibold flex items-start gap-2.5">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                      <div>{submitSuccessMsg}</div>
                    </div>
                  )}

                  <form onSubmit={handleSubmitJustification} className="space-y-4 text-xs">
                    {/* Selector de falta registrada o fecha */}
                    <div className="space-y-1.5">
                      <label className="font-bold text-slate-800 block">
                        1. Selecciona la falta o retardo que deseas justificar:
                      </label>
                      <select
                        value={selectedRecordId}
                        onChange={(e) => setSelectedRecordId(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 font-semibold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                      >
                        {studentAbsenceHistory
                          .filter((r) => r.estado !== 'justificado')
                          .map((rec) => (
                            <option key={rec.id} value={rec.id}>
                              [{rec.estado.toUpperCase()}] Fecha: {rec.fecha}{' '}
                              {rec.materiaNombre ? `· ${rec.materiaNombre}` : ''}{' '}
                              {rec.justificanteEstado === 'pendiente'
                                ? '(Justificante ya enviado - Pendiente)'
                                : ''}
                            </option>
                          ))}
                        <option value="nueva_fecha">
                          📅 Seleccionar otra fecha específica de inasistencia...
                        </option>
                      </select>
                    </div>

                    {selectedRecordId === 'nueva_fecha' && (
                      <div className="space-y-1.5">
                        <label className="font-bold text-slate-800 block">
                          Fecha de la inasistencia:
                        </label>
                        <input
                          type="date"
                          value={customAbsenceDate}
                          onChange={(e) => setCustomAbsenceDate(e.target.value)}
                          required
                          className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 font-semibold text-slate-900"
                        />
                      </div>
                    )}

                    {/* Motivo del justificante */}
                    <div className="space-y-1.5">
                      <label className="font-bold text-slate-800 block">
                        2. Motivo de la inasistencia / Explicación para el Coordinador:
                      </label>
                      <textarea
                        rows={3}
                        required
                        value={justificationMotivo}
                        onChange={(e) => setJustificationMotivo(e.target.value)}
                        placeholder="Ej. Consulta médica pediátrica / Receta médica adjunta por infección respiratoria..."
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>

                    {/* Adjuntar comprobante */}
                    <div className="space-y-1.5">
                      <label className="font-bold text-slate-800 block">
                        3. Adjuntar comprobante o receta médica (Imagen o PDF):
                      </label>
                      <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-indigo-200 hover:border-indigo-400 rounded-2xl bg-indigo-50/40 cursor-pointer transition-colors text-center">
                        <Upload className="w-6 h-6 text-indigo-600 mb-1" />
                        <span className="font-bold text-indigo-950">
                          {proofFileName
                            ? `📎 Archivo cargado: ${proofFileName}`
                            : 'Haz clic aquí para subir foto de la receta o comprobante PDF'}
                        </span>
                        <span className="text-[11px] text-slate-500 mt-0.5">
                          Formatos soportados: JPG, PNG, PDF
                        </span>
                        <input
                          type="file"
                          accept="image/*,.pdf"
                          onChange={handleFileChange}
                          className="hidden"
                        />
                      </label>
                    </div>

                    {/* Historial de justificantes enviados para este alumno */}
                    {studentAbsenceHistory.some((r) => r.justificanteEstado) && (
                      <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                        <span className="text-[11px] font-bold text-slate-700 block">
                          Historial de Solicitudes de Justificante de {selectedStudentForJustificante.nombre}:
                        </span>
                        <div className="space-y-1.5 max-h-32 overflow-y-auto">
                          {studentAbsenceHistory
                            .filter((r) => r.justificanteEstado)
                            .map((r) => (
                              <div
                                key={r.id}
                                className="flex items-center justify-between gap-2 text-[11px] bg-white p-2 rounded-xl border border-slate-200"
                              >
                                <div>
                                  <strong>{r.fecha}</strong> · {r.justificanteMotivo}
                                </div>
                                <span
                                  className={`px-2 py-0.5 rounded-full font-bold text-[10px] shrink-0 ${
                                    r.justificanteEstado === 'aprobado'
                                      ? 'bg-blue-100 text-blue-800'
                                      : r.justificanteEstado === 'rechazado'
                                      ? 'bg-red-100 text-red-800'
                                      : 'bg-amber-100 text-amber-800'
                                  }`}
                                >
                                  {r.justificanteEstado === 'aprobado'
                                    ? '✓ Justificado [J]'
                                    : r.justificanteEstado === 'rechazado'
                                    ? '✕ Rechazado'
                                    : '⏳ En revisión'}
                                </span>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => setSelectedStudentForJustificante(null)}
                        className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold cursor-pointer"
                      >
                        Cerrar
                      </button>
                      <button
                        type="submit"
                        className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold flex items-center gap-2 shadow-sm cursor-pointer"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Enviar Justificante al Coordinador</span>
                      </button>
                    </div>
                  </form>
                </>
              );
            })()}
          </div>
        </div>
      )}

      {/* Report Card Modal */}
      {selectedStudentForBoleta && (
        <ReportCardModal
          student={selectedStudentForBoleta}
          onClose={() => setSelectedStudentForBoleta(null)}
        />
      )}
    </div>
  );
};
