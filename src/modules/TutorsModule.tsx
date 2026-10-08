import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import {
  Users2,
  Search,
  Filter,
  Download,
  Printer,
  Mail,
  Phone,
  GraduationCap,
  QrCode,
  Link,
  ShieldCheck,
  UserPlus,
  Eye,
  Building2,
  Calendar,
  X,
  Send,
  CheckCircle2,
  ExternalLink,
  Copy,
  Check,
  Sparkles,
} from 'lucide-react';
import QRCode from 'qrcode';
import { PublicTutorRegistrationModal } from '../components/PublicTutorRegistrationModal';
import { User, Student } from '../types';

interface Props {
  collegeIdFilter?: string | null;
}

export type TutorRecord = User & {
  alumnosVinculados: Student[];
  origenRegistro: 'preinscripcion' | 'qr' | 'directo';
};

export const TutorsModule: React.FC<Props> = ({ collegeIdFilter }) => {
  const {
    users,
    students,
    activeCollege,
    colleges,
    preenrollments,
    sendEmailNotification,
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterOrigin, setFilterOrigin] = useState<'todos' | 'preinscripcion' | 'qr' | 'directo'>('todos');
  const [filterGrade, setFilterGrade] = useState('todos');
  const [selectedTutorModal, setSelectedTutorModal] = useState<TutorRecord | null>(null);
  const [emailModalTutor, setEmailModalTutor] = useState<User | null>(null);
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [emailSentSuccess, setEmailSentSuccess] = useState(false);

  // QR Modal and live public form
  const [isQrPosterModalOpen, setIsQrPosterModalOpen] = useState(false);
  const [isLivePublicFormOpen, setIsLivePublicFormOpen] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copiedQrLink, setCopiedQrLink] = useState(false);

  const effectiveCollegeId = collegeIdFilter !== undefined ? collegeIdFilter : activeCollege?.id;

  const officialDomain = 'https://dashboard.mycollege.com.mx';
  const registrationUrl = `${officialDomain}/formulario-registro-tutor?form=registro_tutor&colegio=${encodeURIComponent(
    effectiveCollegeId || 'col-cervantes'
  )}`;

  React.useEffect(() => {
    if (registrationUrl) {
      QRCode.toDataURL(registrationUrl, {
        width: 400,
        margin: 2,
        color: { dark: '#0B2545', light: '#FFFFFF' },
      })
        .then(setQrDataUrl)
        .catch(console.error);
    }
  }, [registrationUrl]);

  // Build complete list of tutors:
  // 1. Users with rol === 'tutor'
  // 2. Plus any tutor gathered from students or preenrollments who might not have a full user account yet
  const tutorsList = useMemo(() => {
    const list: Array<User & { alumnosVinculados: Student[]; origenRegistro: 'preinscripcion' | 'qr' | 'directo' }> = [];

    // Filter users with role 'tutor'
    const tutorUsers = users.filter((u) => {
      if (u.rol !== 'tutor') return false;
      if (effectiveCollegeId && u.colegioId && u.colegioId !== effectiveCollegeId) return false;
      return true;
    });

    tutorUsers.forEach((u) => {
      // Find students linked to this tutor
      const linked = students.filter((s) => {
        if (u.hijosIds && u.hijosIds.includes(s.id)) return true;
        if (u.curpsAsociadas && s.curp && u.curpsAsociadas.includes(s.curp.toUpperCase())) return true;
        if (u.correo && s.tutorCorreo && s.tutorCorreo.toLowerCase() === u.correo.toLowerCase()) return true;
        return false;
      });

      list.push({
        ...u,
        alumnosVinculados: linked,
        origenRegistro: u.metodoAcceso || 'preinscripcion',
      });
    });

    // Also look at students who have tutor information but no user record created yet
    students.forEach((st) => {
      if (effectiveCollegeId && st.colegioId !== effectiveCollegeId) return;
      if (!st.tutorCorreo && !st.tutorNombre) return;

      const alreadyExists = list.some(
        (t) =>
          (t.correo && st.tutorCorreo && t.correo.toLowerCase() === st.tutorCorreo.toLowerCase()) ||
          (t.nombre && st.tutorNombre && t.nombre.toLowerCase() === st.tutorNombre.toLowerCase())
      );

      if (!alreadyExists) {
        list.push({
          id: 'tutor-auto-' + st.id,
          nombre: st.tutorNombre || 'Tutor Registrado',
          correo: st.tutorCorreo || 'sin-correo@colegio.edu.mx',
          telefono: st.tutorTelefono || '',
          rol: 'tutor',
          colegioId: st.colegioId,
          cargo: 'Tutor / Padre de Familia',
          avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
          activo: true,
          creadoEn: new Date().toISOString().split('T')[0],
          parentesco: 'Padre / Tutor Legal',
          origenRegistro: 'directo',
          alumnosVinculados: [st],
        });
      }
    });

    return list;
  }, [users, students, effectiveCollegeId]);

  // Filtered tutors
  const filteredTutors = useMemo(() => {
    return tutorsList.filter((tutor) => {
      const term = searchTerm.toLowerCase().trim();
      const matchSearch =
        !term ||
        tutor.nombre.toLowerCase().includes(term) ||
        tutor.correo.toLowerCase().includes(term) ||
        (tutor.telefono && tutor.telefono.includes(term)) ||
        (tutor.usuarioLogin && tutor.usuarioLogin.toLowerCase().includes(term)) ||
        tutor.alumnosVinculados.some(
          (a) =>
            a.nombre.toLowerCase().includes(term) ||
            a.apellidos.toLowerCase().includes(term) ||
            (a.curp && a.curp.toLowerCase().includes(term)) ||
            a.matricula.toLowerCase().includes(term)
        );

      const matchOrigin = filterOrigin === 'todos' || tutor.origenRegistro === filterOrigin;

      const matchGrade =
        filterGrade === 'todos' ||
        tutor.alumnosVinculados.some((a) => a.grado.toLowerCase().includes(filterGrade.toLowerCase()));

      return matchSearch && matchOrigin && matchGrade;
    });
  }, [tutorsList, searchTerm, filterOrigin, filterGrade]);

  // Statistics
  const totalTutors = tutorsList.length;
  const tutorsWithTwoParents = tutorsList.filter((t) => t.segundoTutor && t.segundoTutor.nombre).length;
  const tutorsFromPreenrollment = tutorsList.filter((t) => t.origenRegistro === 'preinscripcion').length;
  const tutorsFromQr = tutorsList.filter((t) => t.origenRegistro === 'qr').length;

  const handleSendEmail = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailModalTutor || !emailSubject.trim() || !emailBody.trim()) return;

    sendEmailNotification({
      colegioId: emailModalTutor.colegioId,
      colegioNombre: activeCollege?.nombre || 'Plataforma My College',
      destinatarios: [emailModalTutor.correo],
      rolesDestino: ['tutor'],
      usuariosDestino: [
        emailModalTutor.id,
        emailModalTutor.correo,
        ...(emailModalTutor.usuarioLogin ? [emailModalTutor.usuarioLogin] : []),
      ],
      asunto: emailSubject,
      cuerpo: emailBody,
      categoria: 'comunicado',
      prioridad: 'alta',
    });

    setEmailSentSuccess(true);
    setTimeout(() => {
      setEmailSentSuccess(false);
      setEmailModalTutor(null);
      setEmailSubject('');
      setEmailBody('');
    }, 2000);
  };

  const handleExportCSV = () => {
    const headers = [
      'Nombre Tutor Principal',
      'Correo',
      'Teléfono',
      'Parentesco',
      'Usuario Login',
      'Segundo Tutor (Nombre)',
      'Segundo Tutor (Teléfono)',
      'Alumnos a Cargo',
      'CURPs Alumnos',
      'Método de Acceso',
    ];

    const rows = filteredTutors.map((t) => [
      `"${t.nombre}"`,
      `"${t.correo}"`,
      `"${t.telefono || ''}"`,
      `"${t.parentesco || 'Tutor Legal'}"`,
      `"${t.usuarioLogin || ''}"`,
      `"${t.segundoTutor?.nombre || ''}"`,
      `"${t.segundoTutor?.telefono || ''}"`,
      `"${t.alumnosVinculados.map((a) => `${a.nombre} ${a.apellidos} (${a.grado} ${a.grupo})`).join('; ')}"`,
      `"${t.alumnosVinculados.map((a) => a.curp).join('; ')}"`,
      `"${t.origenRegistro === 'preinscripcion' ? 'Preinscripción en Línea' : t.origenRegistro === 'qr' ? 'Acceso Código QR' : 'Directo'}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `padron_tutores_${effectiveCollegeId || 'global'}_2026.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const targetCollegeObj = colleges.find((c) => c.id === effectiveCollegeId) || activeCollege;
  const primaryColor = targetCollegeObj?.colores?.primario || '#0B2545';
  const goldColor = targetCollegeObj?.colores?.secundario || '#C59B27';

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
        <div className="flex items-start sm:items-center gap-4">
          {targetCollegeObj ? (
            targetCollegeObj.escudoUrl ? (
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white p-1.5 border-2 border-white/40 shadow-md shrink-0 flex items-center justify-center">
                <img
                  src={targetCollegeObj.escudoUrl}
                  alt={`Escudo de ${targetCollegeObj.nombre}`}
                  className="w-full h-full object-contain"
                />
              </div>
            ) : null
          ) : (
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white p-1.5 border-2 border-white/40 shadow-md shrink-0 flex items-center justify-center">
              <img
                src="/my-college-logo.svg"
                alt="Escudo de My College"
                className="w-full h-full object-contain"
              />
            </div>
          )}
          <div className="space-y-2">
            <div
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-2xs"
              style={{ backgroundColor: goldColor, color: primaryColor }}
            >
              <Users2 className="w-3.5 h-3.5" />
              <span>Control Escolar · Módulo Institucional</span>
            </div>
            <h1 className="font-display font-black text-2xl sm:text-3xl tracking-tight">
              Padrón Institucional de Tutores
            </h1>
            <p className="text-xs sm:text-sm text-slate-200 max-w-2xl leading-relaxed">
              Directorio consolidado de padres de familia y tutores legales asociados a los alumnos. Contiene datos recopilados desde el <strong>formulario de preinscripción</strong> y mediante el <strong>acceso por código QR</strong>.
            </p>
          </div>
        </div>
      </div>

      {/* Action Buttons Bar (Between Header and Summary of Tutors) */}
      <div className="flex flex-wrap items-center justify-end gap-2.5">
        <button
          type="button"
          onClick={() => setIsQrPosterModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 font-bold text-xs shadow-2xs transition-colors cursor-pointer"
        >
          <QrCode className="w-4 h-4" style={{ color: primaryColor }} />
          <span>Generar Código QR de Registro</span>
        </button>
        <button
          type="button"
          onClick={handleExportCSV}
          title="Exportar CSV"
          aria-label="Exportar CSV"
          className="inline-flex items-center justify-center p-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 shadow-2xs transition-colors cursor-pointer"
        >
          <Download className="w-4 h-4" style={{ color: primaryColor }} />
        </button>
        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs shadow-sm transition-colors cursor-pointer"
          style={{ backgroundColor: goldColor, color: primaryColor }}
        >
          <Printer className="w-4 h-4" />
          <span>Imprimir Directorio</span>
        </button>
      </div>

      {/* Top Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500">
            <span>Total de Tutores</span>
            <Users2 className="w-4 h-4 text-blue-600" />
          </div>
          <div className="font-display font-black text-2xl text-slate-900 font-mono">
            {totalTutors}
          </div>
          <span className="text-[10px] text-slate-400 block">Familias vinculadas</span>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500">
            <span>Vía Preinscripción</span>
            <Link className="w-4 h-4 text-blue-600" />
          </div>
          <div className="font-display font-black text-2xl text-blue-800 font-mono">
            {tutorsFromPreenrollment}
          </div>
          <span className="text-[10px] text-blue-600 font-semibold block">Registro en línea</span>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500">
            <span>Vía Código QR</span>
            <QrCode className="w-4 h-4 text-purple-600" />
          </div>
          <div className="font-display font-black text-2xl text-purple-800 font-mono">
            {tutorsFromQr}
          </div>
          <span className="text-[10px] text-purple-600 font-semibold block">Acceso móvil escaneado</span>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500">
            <span>Con 2do Tutor</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="font-display font-black text-2xl text-emerald-800 font-mono">
            {tutorsWithTwoParents}
          </div>
          <span className="text-[10px] text-emerald-600 font-semibold block">Máx. 2 registrados</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nombre de tutor, nombre del alumno, CURP, matrícula o teléfono..."
            className="w-full text-xs pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-800"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Origin filter */}
          <select
            value={filterOrigin}
            onChange={(e) => setFilterOrigin(e.target.value as any)}
            className="px-3 py-2 text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl text-slate-700 cursor-pointer focus:outline-none"
          >
            <option value="todos">Todos los Orígenes</option>
            <option value="preinscripcion">Vía Preinscripción en Línea</option>
            <option value="qr">Vía Código QR</option>
            <option value="directo">Registro Administrativo</option>
          </select>

          {/* Grade filter */}
          <select
            value={filterGrade}
            onChange={(e) => setFilterGrade(e.target.value)}
            className="px-3 py-2 text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl text-slate-700 cursor-pointer focus:outline-none"
          >
            <option value="todos">Todos los Grados</option>
            <option value="1°">1° Grado</option>
            <option value="2°">2° Grado</option>
            <option value="3°">3° Grado</option>
          </select>
        </div>
      </div>

      {/* Tutors Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
          <span className="font-bold text-xs text-slate-800">
            Mostrando {filteredTutors.length} {filteredTutors.length === 1 ? 'tutor registrado' : 'tutores registrados'}
          </span>
          {activeCollege && (
            <span className="text-[11px] font-semibold text-slate-500">
              Plantel: <strong className="text-slate-800">{activeCollege.nombre}</strong>
            </span>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                <th className="py-3 px-4">Tutor Principal</th>
                <th className="py-3 px-4">Contacto</th>
                <th className="py-3 px-4">Alumnos a su Cargo</th>
                <th className="py-3 px-4">Segundo Tutor (Opcional)</th>
                <th className="py-3 px-4 text-center">Método de Acceso</th>
                <th className="py-3 px-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTutors.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-slate-400 text-xs">
                    No se encontraron tutores con los criterios de búsqueda seleccionados.
                  </td>
                </tr>
              ) : (
                filteredTutors.map((tutor) => (
                  <tr key={tutor.id} className="hover:bg-slate-50/60 transition-colors">
                    {/* Tutor Name & Login */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={tutor.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'}
                          alt={tutor.nombre}
                          className="w-10 h-10 rounded-xl object-cover border border-slate-200 shrink-0"
                        />
                        <div className="min-w-0">
                          <div className="font-bold text-slate-900 leading-tight">
                            {tutor.nombre}
                          </div>
                          <span className="text-[10px] font-semibold text-slate-500">
                            {tutor.parentesco || 'Tutor Legal'}
                          </span>
                          {tutor.usuarioLogin && (
                            <div className="text-[10px] font-mono text-amber-800 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200 inline-block mt-0.5 font-bold">
                              Usuario: {tutor.usuarioLogin}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Contact */}
                    <td className="py-3.5 px-4 space-y-1">
                      <div className="flex items-center gap-1.5 text-slate-700">
                        <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate max-w-[180px]">{tutor.correo}</span>
                      </div>
                      {tutor.telefono && (
                        <div className="flex items-center gap-1.5 text-slate-600 font-mono text-[11px]">
                          <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{tutor.telefono}</span>
                        </div>
                      )}
                    </td>

                    {/* Linked Students */}
                    <td className="py-3.5 px-4">
                      {tutor.alumnosVinculados.length === 0 ? (
                        <span className="text-[11px] text-amber-700 italic bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                          Sin alumnos vinculados
                        </span>
                      ) : (
                        <div className="space-y-1.5">
                          {tutor.alumnosVinculados.map((st) => (
                            <div
                              key={st.id}
                              className="p-2 rounded-xl bg-slate-50 border border-slate-200 text-[11px] space-y-0.5"
                            >
                              <div className="font-bold text-slate-900 flex items-center justify-between gap-1">
                                <span>{st.nombre} {st.apellidos}</span>
                                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-blue-100 text-blue-900">
                                  {st.grado} {st.grupo}
                                </span>
                              </div>
                              <div className="text-[10px] font-mono text-slate-500">
                                CURP: {st.curp || 'No registrada'}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </td>

                    {/* Second Tutor */}
                    <td className="py-3.5 px-4">
                      {tutor.segundoTutor && tutor.segundoTutor.nombre ? (
                        <div className="p-2 rounded-xl bg-emerald-50/70 border border-emerald-200 text-[11px] space-y-0.5">
                          <div className="font-bold text-emerald-950">
                            {tutor.segundoTutor.nombre}
                          </div>
                          <div className="text-[10px] text-emerald-800">
                            Parentesco: {tutor.segundoTutor.parentesco || 'Madre'}
                          </div>
                          {tutor.segundoTutor.telefono && (
                            <div className="text-[10px] font-mono text-emerald-700">
                              Tel: {tutor.segundoTutor.telefono}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-400 italic">
                          (Segundo tutor no registrado)
                        </span>
                      )}
                    </td>

                    {/* Access Method Origin */}
                    <td className="py-3.5 px-4 text-center">
                      {tutor.origenRegistro === 'preinscripcion' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-50 text-blue-900 border border-blue-200">
                          <Link className="w-3 h-3 text-blue-600" />
                          <span>Preinscripción</span>
                        </span>
                      ) : tutor.origenRegistro === 'qr' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-purple-50 text-purple-900 border border-purple-200">
                          <QrCode className="w-3 h-3 text-purple-600" />
                          <span>Código QR</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                          <span>Directo</span>
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setSelectedTutorModal(tutor)}
                          title="Ver Expediente de Familia"
                          className="p-1.5 rounded-lg border border-slate-200 hover:border-blue-400 bg-white hover:bg-blue-50 text-slate-700 hover:text-blue-700 transition-colors cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setEmailModalTutor(tutor);
                            setEmailSubject(`[Aviso Oficial] Comunicado para el tutor de ${tutor.alumnosVinculados[0]?.nombre || 'Alumno'}`);
                          }}
                          title="Enviar Notificación por Correo"
                          className="p-1.5 rounded-lg border border-slate-200 hover:border-emerald-400 bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 transition-colors cursor-pointer"
                        >
                          <Mail className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Tutor Detail Modal */}
      {selectedTutorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-5 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Users2 className="w-5 h-5 text-blue-600" />
                <h3 className="font-display font-bold text-base text-slate-900">
                  Expediente de Familia y Tutores
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTutorModal(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Principal Tutor Details */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex items-center gap-3">
                <img
                  src={selectedTutorModal.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'}
                  alt={selectedTutorModal.nombre}
                  className="w-14 h-14 rounded-2xl object-cover border border-slate-200"
                />
                <div>
                  <span className="text-[10px] font-bold uppercase text-blue-700 block">Tutor Principal (Responsable)</span>
                  <div className="font-bold text-sm text-slate-900">{selectedTutorModal.nombre}</div>
                  <div className="text-xs text-slate-500">{selectedTutorModal.parentesco || 'Tutor Legal'}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-slate-200">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 block">Correo Oficial:</span>
                  <span className="font-semibold text-slate-800 break-all">{selectedTutorModal.correo}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 block">Teléfono / WhatsApp:</span>
                  <span className="font-mono font-semibold text-slate-800">{selectedTutorModal.telefono || 'Sin teléfono'}</span>
                </div>
              </div>

              {selectedTutorModal.usuarioLogin && (
                <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-between text-xs">
                  <span className="text-amber-900 font-bold">Usuario Login Asignado:</span>
                  <span className="font-mono font-black text-amber-950">{selectedTutorModal.usuarioLogin}</span>
                </div>
              )}
            </div>

            {/* Second Tutor Section */}
            <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase text-emerald-800">Segundo Tutor Registrado</span>
                <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                  Máximo 2 Tutores
                </span>
              </div>

              {selectedTutorModal.segundoTutor && selectedTutorModal.segundoTutor.nombre ? (
                <div className="space-y-1.5 text-xs">
                  <div className="font-bold text-slate-900">{selectedTutorModal.segundoTutor.nombre}</div>
                  <div className="grid grid-cols-2 gap-2 pt-1 border-t border-emerald-200/60">
                    <div>
                      <span className="text-[10px] text-slate-500 block">Parentesco:</span>
                      <span className="font-semibold text-slate-800">{selectedTutorModal.segundoTutor.parentesco || 'Madre'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">Teléfono:</span>
                      <span className="font-mono font-semibold text-slate-800">{selectedTutorModal.segundoTutor.telefono || 'Sin teléfono'}</span>
                    </div>
                  </div>
                  {selectedTutorModal.segundoTutor.correo && (
                    <div className="text-[11px] text-slate-600">
                      Correo: {selectedTutorModal.segundoTutor.correo}
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic">
                  El tutor principal aún no ha dado de alta al segundo tutor en su apartado "Mi Perfil".
                </p>
              )}
            </div>

            {/* Students List */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <GraduationCap className="w-4 h-4 text-blue-600" />
                <span>Alumnos Vinculados a esta Familia:</span>
              </h4>

              {selectedTutorModal.alumnosVinculados && selectedTutorModal.alumnosVinculados.length > 0 ? (
                <div className="space-y-2">
                  {selectedTutorModal.alumnosVinculados.map((st) => (
                    <div
                      key={st.id}
                      className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={st.foto || 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=150'}
                          alt={st.nombre}
                          className="w-10 h-10 rounded-xl object-cover border"
                        />
                        <div>
                          <div className="font-bold text-slate-900">{st.nombre} {st.apellidos}</div>
                          <div className="text-[11px] font-mono text-slate-500">
                            Matrícula: {st.matricula} · CURP: {st.curp}
                          </div>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold bg-blue-100 text-blue-900 px-2 py-0.5 rounded">
                        {st.grado} {st.grupo}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">Sin alumnos registrados actualmente.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Email Notification Modal */}
      {emailModalTutor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Mail className="w-5 h-5 text-emerald-600" />
                <h3 className="font-display font-bold text-base text-slate-900">
                  Enviar Mensaje al Tutor
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEmailModalTutor(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSendEmail} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Destinatario:</label>
                <input
                  type="text"
                  value={`${emailModalTutor.nombre} (${emailModalTutor.correo})`}
                  disabled
                  className="w-full px-3 py-2 bg-slate-50 border rounded-xl font-medium"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Asunto del Comunicado:</label>
                <input
                  type="text"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  placeholder="Ej. Citatorio de entrega de boletas / Recordatorio"
                  className="w-full px-3 py-2 border rounded-xl"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Mensaje para el Tutor:</label>
                <textarea
                  value={emailBody}
                  onChange={(e) => setEmailBody(e.target.value)}
                  placeholder="Escribe el mensaje institucional..."
                  rows={4}
                  className="w-full px-3 py-2 border rounded-xl resize-none"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={emailSentSuccess}
                className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
              >
                {emailSentSuccess ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>¡Mensaje Enviado con Éxito!</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Enviar Correo al Tutor</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* QR Code Poster & Generation Modal */}
      {isQrPosterModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-5 animate-in zoom-in-95 my-auto max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <QrCode className="w-5 h-5 text-purple-600" />
                <h3 className="font-display font-bold text-base text-slate-900">
                  Código QR Oficial para Registro de Tutores
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsQrPosterModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Poster Card (Printable) */}
            <div className="p-5 rounded-2xl bg-gradient-to-b from-slate-50 to-amber-50/30 border-2 border-slate-300 text-center space-y-4">
              <div className="flex items-center justify-center gap-3">
                {targetCollegeObj?.escudoUrl && (
                  <img
                    src={targetCollegeObj.escudoUrl}
                    alt="Escudo"
                    className="w-12 h-12 object-contain p-1 rounded-xl bg-white border border-slate-200 shadow-xs"
                  />
                )}
                <div className="text-left">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Plantel Educativo
                  </span>
                  <div className="font-display font-bold text-sm text-slate-900">
                    {targetCollegeObj?.nombre || 'My College'}
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono">
                    CCT: {targetCollegeObj?.codigoCCT || 'Oficial'}
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <h4 className="font-display font-black text-sm text-slate-900 uppercase tracking-tight">
                  Registro y Vinculación de Tutores
                </h4>
                <p className="text-[11px] text-slate-600 max-w-xs mx-auto">
                  Escanee este código con la cámara de su teléfono móvil para registrarse como tutor y vincular a sus hijos mediante su CURP.
                </p>
              </div>

              {/* Scannable QR Code */}
              <div className="p-3 bg-white rounded-2xl border-2 border-dashed border-purple-300 shadow-xs inline-block mx-auto">
                {qrDataUrl ? (
                  <img
                    src={qrDataUrl}
                    alt="Código QR de Registro de Tutores"
                    className="w-48 h-48 sm:w-56 sm:h-56 object-contain mx-auto"
                  />
                ) : (
                  <div className="w-48 h-48 flex items-center justify-center text-slate-400">
                    Generando código QR...
                  </div>
                )}
              </div>

              {/* Step by step summary */}
              <div className="text-left bg-white p-3 rounded-xl border border-slate-200 text-[10px] text-slate-600 space-y-1 font-medium">
                <div>1. <strong>Escanee con la cámara</strong> del celular.</div>
                <div>2. Ingrese los datos de <strong>uno o dos tutores</strong>.</div>
                <div>3. Ingrese la <strong>CURP de sus hijos</strong> para vincularlos.</div>
                <div>4. El sistema le asignará su <strong>usuario y contraseña (máx 8 car.)</strong> y le enviará el link a su correo.</div>
              </div>
            </div>

            {/* Direct Link Section */}
            <div className="space-y-2 text-xs">
              <label className="font-bold text-slate-700 block">Enlace directo al formulario exterior:</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={registrationUrl}
                  className="flex-1 px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono text-[11px] truncate text-slate-700"
                />
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(registrationUrl);
                    setCopiedQrLink(true);
                    setTimeout(() => setCopiedQrLink(false), 2500);
                  }}
                  className="px-3 py-2 bg-[#0B2545] hover:bg-[#133E6E] text-white font-bold rounded-xl transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer"
                >
                  {copiedQrLink ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-300" />
                      <span>Copiado</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-amber-300" />
                      <span>Copiar</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  setIsLivePublicFormOpen(true);
                  setIsQrPosterModalOpen(false);
                }}
                className="flex-1 py-2.5 px-4 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
              >
                <ExternalLink className="w-4 h-4 text-purple-200" />
                <span>Abrir Formulario en Vivo</span>
              </button>

              <button
                type="button"
                onClick={() => window.print()}
                className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-bold text-xs flex items-center justify-center gap-2 border border-slate-300 transition-colors cursor-pointer"
              >
                <Printer className="w-4 h-4 text-slate-600" />
                <span>Imprimir Cartel</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Public External Tutor Registration Modal Simulation */}
      {isLivePublicFormOpen && (
        <PublicTutorRegistrationModal
          isOpen={isLivePublicFormOpen}
          onClose={() => setIsLivePublicFormOpen(false)}
          defaultCollegeId={effectiveCollegeId}
        />
      )}
    </div>
  );
};
