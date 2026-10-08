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
} from 'lucide-react';
import { ReportCardModal } from '../components/ReportCardModal';
import { Student } from '../types';

interface Props {
  onNavigateTab?: (tab: string) => void;
}

export const TutorStudentsModule: React.FC<Props> = ({ onNavigateTab }) => {
  const { currentUser, students, colleges, grades, attendanceRecords } = useApp();
  const [selectedStudentForBoleta, setSelectedStudentForBoleta] = useState<Student | null>(null);

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
  const primaryColor = tutorCollege?.colores?.primario || '#0B2545';
  const goldColor = tutorCollege?.colores?.secundario || '#C59B27';

  return (
    <div className="space-y-6 animate-in fade-in max-w-7xl mx-auto">
      {/* Header Banner */}
      <div
        className="rounded-3xl p-6 sm:p-8 text-white shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-5 transition-colors"
        style={{
          background: `linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}dd 100%)`,
          borderBottom: `4px solid ${goldColor}`,
        }}
      >
        <div className="space-y-2">
          <div
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-2xs"
            style={{ backgroundColor: goldColor, color: primaryColor }}
          >
            <GraduationCap className="w-3.5 h-3.5" />
            <span>Portal de Tutores · Mis Hijos</span>
          </div>
          <h1 className="font-display font-black text-2xl sm:text-3xl tracking-tight">
            Alumnos a mi Cargo
          </h1>
          <p className="text-xs sm:text-sm text-slate-200 max-w-2xl leading-relaxed">
            Consulta el expediente escolar, grado, grupo, asistencia y acceso rápido a boletas y pagos de tus hijos registrados.
          </p>
        </div>

        {linkedStudents.length > 0 && (
          <div className="bg-white/15 backdrop-blur-md px-5 py-3 rounded-2xl border border-white/25 text-center shrink-0">
            <span className="block text-2xl font-black" style={{ color: goldColor }}>{linkedStudents.length}</span>
            <span className="text-[11px] font-semibold text-slate-200">
              {linkedStudents.length === 1 ? 'Hijo Vinculado' : 'Hijos Vinculados'}
            </span>
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
            const studentAtt = attendanceRecords.filter((a) => a.estudianteId === student.id);
            const presentCount = studentAtt.filter((a) => a.estado === 'presente' || a.estado === 'retardo').length;
            const attRate = studentAtt.length > 0 ? Math.round((presentCount / studentAtt.length) * 100) : 98;

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
                        {student.promedio ? student.promedio.toFixed(1) : '9.2'}
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

                  {/* Registered Tutor Info */}
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                    <div className="text-[10px] font-bold text-slate-400 uppercase">Tutor Principal Registrado:</div>
                    <div className="font-bold text-slate-800 flex items-center justify-between">
                      <span>{student.tutorNombre || currentUser.nombre}</span>
                      <span className="text-[11px] font-mono text-slate-500">{student.tutorTelefono || currentUser.telefono}</span>
                    </div>
                  </div>
                </div>

                {/* Card Action Buttons */}
                <div className="p-4 bg-slate-50/80 border-t border-slate-100 flex flex-wrap gap-2 justify-between items-center">
                  <button
                    type="button"
                    onClick={() => setSelectedStudentForBoleta(student)}
                    className="flex-1 min-w-[130px] py-2 px-3 rounded-xl bg-white hover:bg-amber-50 border border-slate-200 hover:border-amber-300 text-slate-800 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5 text-amber-600" />
                    <span>Ver Boleta Oficial</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onNavigateTab && onNavigateTab('tutor_historial')}
                    className="flex-1 min-w-[130px] py-2 px-3 rounded-xl bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-300 text-slate-800 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
                  >
                    <Award className="w-3.5 h-3.5 text-blue-600" />
                    <span>Historial de Notas</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onNavigateTab && onNavigateTab('tutor_cuotas')}
                    className="py-2 px-3 rounded-xl bg-[#0B2545] hover:bg-[#133E6E] text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
                  >
                    <CreditCard className="w-3.5 h-3.5 text-amber-300" />
                    <span>Cuotas</span>
                  </button>
                </div>
              </div>
            );
          })}
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
