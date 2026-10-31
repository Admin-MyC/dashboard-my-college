import React, { useState } from 'react';
import {
  X,
  Copy,
  Check,
  Download,
  Printer,
  QrCode,
  Sparkles,
  ExternalLink,
  BookOpen,
  Award,
  Bell,
  Library,
  GraduationCap,
  Shield,
  KeyRound,
  User,
} from 'lucide-react';
import { Student, College } from '../types';
import {
  generateQrSheetsPdf,
  printHtmlInHiddenIframe,
} from '../utils/qrSheetsPdfGenerator';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  student: Student | null;
  college: College;
  username?: string;
  password?: string;
  qrDataUrl?: string;
}

export const StudentCredentialsModal: React.FC<Props> = ({
  isOpen,
  onClose,
  student,
  college,
  username,
  password,
  qrDataUrl,
}) => {
  const [copied, setCopied] = useState(false);
  const [localQrUrl, setLocalQrUrl] = useState<string>('');

  React.useEffect(() => {
    if (!isOpen || !student) {
      setLocalQrUrl('');
      return;
    }
    if (qrDataUrl) {
      setLocalQrUrl(qrDataUrl);
      return;
    }
    const payload = `https://dashboard.mycollege.com.mx/asistencia?alumno=${encodeURIComponent(
      student.matricula
    )}&sid=${encodeURIComponent(student.id)}&colegio=${encodeURIComponent(
      college.id
    )}&curp=${encodeURIComponent(student.curp)}&grado=${encodeURIComponent(
      student.grado
    )}&grupo=${encodeURIComponent(student.grupo)}&docente=${encodeURIComponent(
      student.docenteId || ''
    )}`;
    import('qrcode').then((QRCode) => {
      QRCode.default
        .toDataURL(payload, {
          width: 300,
          margin: 1,
          color: { dark: '#0B2545', light: '#FFFFFF' },
        })
        .then((url) => setLocalQrUrl(url))
        .catch(() => {});
    });
  }, [isOpen, student?.id, qrDataUrl, college.id]);

  if (!isOpen || !student) return null;

  const effectiveQrUrl = qrDataUrl || localQrUrl;

  // Auto-resolve username (1ra letra nombre + apellido + 4 dígitos) and 8-char password
  const getFallbackUsername = () => {
    const cleanFirst = (student.nombre.trim().split(/\s+/)[0] || 'a')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '')
      .charAt(0) || 'a';
    const cleanSurname = (student.apellidos.trim().split(/\s+/)[0] || 'alumno')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '');
    return `${cleanFirst}${cleanSurname}4821`;
  };

  const resolvedUsername = username || student.usuarioLogin || getFallbackUsername();
  const resolvedPassword =
    password && password !== 'admin123'
      ? password
      : student.password && student.password !== 'admin123'
      ? student.password
      : 'k8Px2mQ9';
  const officialDomain = 'https://dashboard.mycollege.com.mx';

  const handleCopyCredentials = () => {
    const text = `=== CREDENCIALES DE ACCESO ALUMNO (${college.nombre}) ===\nPlataforma: ${officialDomain}\nAlumno: ${student.nombre} ${student.apellidos}\nMatrícula: ${student.matricula}\nGrado y Grupo: ${student.grado} "${student.grupo}"\nDocente Asignado: ${student.docenteNombre || 'Docente Titular'}\nUsuario: ${resolvedUsername}\nContraseña: ${resolvedPassword}\n\nCódigo QR habilitado para toma de asistencia en el módulo del docente asignado.`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handleDownloadQr = () => {
    if (!effectiveQrUrl) return;
    const link = document.createElement('a');
    link.href = effectiveQrUrl;
    link.download = `QR_5x5_${student.matricula}_${student.nombre}_${student.apellidos}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrintIndividualCard = () => {
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Credencial QR Alumno - ${student.nombre} ${student.apellidos}</title>
          <style>
            @page {
              size: letter portrait;
              margin: 15mm;
            }
            * {
              box-sizing: border-box;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            body {
              font-family: system-ui, -apple-system, sans-serif;
              margin: 0;
              padding: 0;
              display: flex;
              align-items: flex-start;
              justify-content: center;
              background: #ffffff;
            }
            .card-5x5 {
              width: 50mm;
              height: 50mm;
              border: 1.5px dashed #475569;
              border-radius: 3mm;
              padding: 2.5mm;
              box-sizing: border-box;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: space-between;
              text-align: center;
              background: white;
            }
            .school-name {
              font-size: 7pt;
              font-weight: 800;
              color: #0b2545;
              text-transform: uppercase;
              line-height: 1.1;
            }
            .student-name {
              font-size: 8pt;
              font-weight: 700;
              color: #0f172a;
              line-height: 1.1;
              margin-top: 1mm;
            }
            .qr-img {
              width: 28mm;
              height: 28mm;
              object-fit: contain;
            }
            .info-line {
              font-size: 6.5pt;
              font-family: monospace;
              color: #475569;
              line-height: 1.1;
            }
            .user-line {
              font-size: 6.5pt;
              font-family: monospace;
              font-weight: bold;
              color: #0b2545;
            }
            .domain {
              font-size: 5.5pt;
              color: #64748b;
              font-weight: 600;
            }
          </style>
        </head>
        <body>
          <div class="card-5x5">
            <div>
              <div class="school-name">${college.nombre}</div>
              <div class="student-name">${student.nombre} ${student.apellidos}</div>
            </div>
            ${effectiveQrUrl ? `<img src="${effectiveQrUrl}" class="qr-img" alt="QR" />` : ''}
            <div>
              <div class="info-line">${student.grado} "${student.grupo}" · ${student.matricula}</div>
              <div class="user-line">User: ${resolvedUsername}</div>
              <div class="domain">www.dashboard.mycollege.com.mx</div>
            </div>
          </div>
        </body>
      </html>
    `;

    printHtmlInHiddenIframe(htmlContent);
  };

  const handleDownloadIndividualPdf = async () => {
    await generateQrSheetsPdf({
      college,
      students: [{ ...student, usuarioLogin: resolvedUsername }],
      qrCodeDataUrls: effectiveQrUrl ? { [student.id]: effectiveQrUrl } : {},
      filename: `QR_Asistencia_5x5_${student.matricula}_${student.nombre}_${student.apellidos}.pdf`.replace(
        /\s+/g,
        '_'
      ),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-200 animate-in zoom-in-95 flex flex-col max-h-[95vh]">
        {/* Header Compact */}
        <div className="px-5 py-3.5 border-b border-slate-100 bg-gradient-to-r from-[#0B2545] via-[#133E6E] to-[#0B2545] text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-400/20 border border-amber-300/30 flex items-center justify-center text-amber-300 shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[9px] uppercase font-bold tracking-wider text-amber-300 block leading-none">
                Control de Alumnos · Credenciales Oficiales
              </span>
              <h3 className="font-display font-black text-sm sm:text-base text-white leading-tight mt-0.5">
                Ficha de Acceso y Código QR
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Compact Two-Column Grid */}
        <div className="p-4 sm:p-5 space-y-3.5 overflow-y-auto text-xs">
          {/* Student Profile Overview Compact */}
          <div className="px-3.5 py-2.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center gap-3">
            <img
              src={student.foto || college.escudoUrl}
              onError={(e) => {
                e.currentTarget.src = college.escudoUrl;
              }}
              alt={student.nombre}
              className="w-11 h-11 rounded-xl object-cover border border-slate-200 shadow-2xs shrink-0 bg-white"
            />
            <div className="min-w-0 flex-1">
              <span className="text-[9px] uppercase font-bold text-indigo-700 tracking-wider block leading-none">
                {college.nombre}
              </span>
              <h4 className="font-display font-black text-sm text-slate-900 truncate mt-0.5">
                {student.nombre} {student.apellidos}
              </h4>
              <div className="flex flex-wrap items-center gap-2 mt-0.5 text-slate-600 font-mono text-[11px]">
                <span>Grado: <strong>{student.grado} "{student.grupo}"</strong></span>
                <span>·</span>
                <span>Matrícula: <strong>{student.matricula}</strong></span>
              </div>
            </div>
          </div>

          {/* Main Grid: QR on the Left, Credentials & Modules on the Right */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5 items-stretch">
            {/* Left Column: Calibrated 5cm x 5cm QR Card Container Preview */}
            <div className="sm:col-span-5 bg-slate-50/70 rounded-xl border border-slate-200 p-3 flex flex-col items-center justify-center">
              <div className="text-[10px] font-bold text-slate-600 mb-1.5 flex items-center gap-1">
                <QrCode className="w-3.5 h-3.5 text-amber-600" />
                <span>Código QR (5cm × 5cm)</span>
              </div>

              {/* The 5cm x 5cm box */}
              <div
                className="relative bg-white border-2 border-dashed border-slate-400 rounded-xl p-2 shadow-sm flex flex-col items-center justify-between text-center"
                style={{
                  width: '44mm',
                  height: '44mm',
                  maxWidth: '44mm',
                  maxHeight: '44mm',
                  boxSizing: 'border-box',
                }}
              >
                <div className="w-full text-center leading-tight overflow-hidden px-0.5">
                  <span className="block text-[7.5px] font-extrabold uppercase text-[#0B2545] truncate">
                    {college.nombre}
                  </span>
                  <span className="block text-[8px] font-bold text-slate-900 truncate">
                    {student.nombre} {student.apellidos}
                  </span>
                </div>

                {effectiveQrUrl ? (
                  <img
                    src={effectiveQrUrl}
                    alt={`QR ${student.nombre}`}
                    className="w-[23mm] h-[23mm] object-contain my-auto"
                  />
                ) : (
                  <div className="w-[23mm] h-[23mm] bg-slate-100 flex items-center justify-center rounded">
                    <span className="text-[8px] text-slate-400 font-mono">Generando QR...</span>
                  </div>
                )}

                <div className="w-full text-center leading-none space-y-0.5 overflow-hidden px-0.5">
                  <div className="text-[7px] font-mono text-slate-600 truncate">
                    {student.grado} "{student.grupo}" · {student.matricula}
                  </div>
                  <div className="text-[6.5px] font-mono font-bold text-slate-800 truncate">
                    User: {resolvedUsername}
                  </div>
                  <div className="text-[6px] text-slate-400 font-semibold uppercase">
                    www.dashboard.mycollege.com.mx
                  </div>
                </div>
              </div>

              <span className="text-[9px] text-slate-400 mt-1.5 font-mono">
                Impresión: 50mm × 50mm
              </span>
            </div>

            {/* Right Column: Generated Access Credentials + Modules */}
            <div className="sm:col-span-7 flex flex-col justify-between gap-2.5">
              {/* Credentials Box */}
              <div className="p-3 bg-gradient-to-br from-amber-50/80 via-white to-amber-50/50 rounded-xl border border-amber-200/80 shadow-2xs space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-amber-900 font-black text-[11px] uppercase tracking-wider">
                    <KeyRound className="w-3.5 h-3.5 text-amber-600" />
                    <span>Credenciales de Inicio de Sesión</span>
                  </div>
                  <span className="text-[9px] bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded-full font-bold">
                    Rol Alumno
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 font-mono text-xs">
                  <div className="p-2 bg-white rounded-lg border border-amber-200">
                    <span className="text-[9px] uppercase font-bold text-slate-400 block font-sans">
                      Usuario Asignado
                    </span>
                    <span className="font-extrabold text-slate-900 text-xs tracking-tight break-all">
                      {resolvedUsername}
                    </span>
                    <span className="text-[8.5px] text-slate-400 block font-sans leading-tight mt-0.5">
                      (1ra letra + apellido + 4 dígitos)
                    </span>
                  </div>

                  <div className="p-2 bg-white rounded-lg border border-amber-200">
                    <span className="text-[9px] uppercase font-bold text-slate-400 block font-sans">
                      Contraseña Generada
                    </span>
                    <span className="font-extrabold text-amber-900 text-xs tracking-widest break-all">
                      {resolvedPassword}
                    </span>
                    <span className="text-[8.5px] text-slate-400 block font-sans leading-tight mt-0.5">
                      (Mín. 8 caracteres)
                    </span>
                  </div>
                </div>

                <div className="px-2.5 py-1.5 bg-blue-50/80 border border-blue-200 rounded-lg text-blue-900 flex items-center justify-between text-[10px]">
                  <span className="font-medium truncate">
                    URL: <code className="font-bold font-mono">www.dashboard.mycollege.com.mx</code>
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyCredentials}
                    className="flex items-center gap-1 font-bold text-blue-700 hover:text-blue-900 hover:underline cursor-pointer ml-2 shrink-0"
                  >
                    {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    <span>{copied ? '¡Copiado!' : 'Copiar Todo'}</span>
                  </button>
                </div>
              </div>

              {/* Accessible Student Modules Explanation */}
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                <span className="font-bold text-slate-700 text-[10px] uppercase tracking-wider block">
                  Módulos Habilitados en el Perfil Alumnos:
                </span>
                <div className="grid grid-cols-2 gap-1.5 text-[10px]">
                  <div className="px-2 py-1.5 bg-white rounded-lg border border-slate-200 flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                    <div className="min-w-0">
                      <strong className="block text-slate-900 leading-tight truncate">Mis Tareas</strong>
                      <span className="text-[9px] text-slate-500 block truncate">Entregas y tareas</span>
                    </div>
                  </div>

                  <div className="px-2 py-1.5 bg-white rounded-lg border border-slate-200 flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                    <div className="min-w-0">
                      <strong className="block text-slate-900 leading-tight truncate">Mis Exámenes</strong>
                      <span className="text-[9px] text-slate-500 block truncate">Evaluaciones y fechas</span>
                    </div>
                  </div>

                  <div className="px-2 py-1.5 bg-white rounded-lg border border-slate-200 flex items-center gap-1.5">
                    <Bell className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <div className="min-w-0">
                      <strong className="block text-slate-900 leading-tight truncate">Mis Comunicados</strong>
                      <span className="text-[9px] text-slate-500 block truncate">Avisos y circulares</span>
                    </div>
                  </div>

                  <div className="px-2 py-1.5 bg-white rounded-lg border border-slate-200 flex items-center gap-1.5">
                    <Library className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <div className="min-w-0">
                      <strong className="block text-slate-900 leading-tight truncate">Mi Biblioteca</strong>
                      <span className="text-[9px] text-slate-500 block truncate">Libros y préstamos</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions Compact Single Row */}
        <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={handleDownloadQr}
              disabled={!effectiveQrUrl}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-[11px] cursor-pointer shadow-2xs transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Descargar PNG</span>
            </button>
            <button
              type="button"
              onClick={handleDownloadIndividualPdf}
              disabled={!effectiveQrUrl}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] cursor-pointer shadow-2xs transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Descargar PDF (5×5cm)</span>
            </button>
            <button
              type="button"
              onClick={handlePrintIndividualCard}
              disabled={!effectiveQrUrl}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-[11px] cursor-pointer shadow-2xs transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimir Ficha</span>
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-[#0B2545] hover:bg-[#133E6E] text-white font-extrabold text-[11px] shadow-sm cursor-pointer transition-colors"
          >
            Aceptar y Continuar
          </button>
        </div>
      </div>
    </div>
  );
};
