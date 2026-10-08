import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import {
  FileSpreadsheet,
  Download,
  X,
  Filter,
  Check,
  Building2,
  Users2,
  GraduationCap,
  KeyRound,
  Shield,
  Layers,
  Sparkles,
} from 'lucide-react';
import { Student, College, User } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  students: Student[];
  college: College;
  users: User[];
}

export const StudentExcelExportModal: React.FC<Props> = ({
  isOpen,
  onClose,
  students,
  college,
  users,
}) => {
  const [exportScope, setExportScope] = useState<'all' | 'group'>('all');
  const [selectedGroup, setSelectedGroup] = useState<string>('');
  const [fileFormat, setFileFormat] = useState<'xlsx' | 'xls'>('xlsx');
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  if (!isOpen) return null;

  // Filter students belonging to this college
  const collegeStudents = students.filter((s) => s.colegioId === college.id);

  // Discover all distinct Grade & Group combinations
  const availableGroups = Array.from(
    new Set(
      collegeStudents
        .map((s) => `${s.grado} "${s.grupo}"`)
        .filter((g) => !g.includes('Sin Grupo') && !g.includes('Pendiente'))
    )
  ).sort();

  // Set default group if not set
  const currentGroup = selectedGroup || (availableGroups[0] || '1° "A"');

  // Filter students based on selected scope
  const targetStudents =
    exportScope === 'all'
      ? collegeStudents
      : collegeStudents.filter((s) => `${s.grado} "${s.grupo}"` === currentGroup);

  // Helper to resolve or auto-generate student username (1ra letra nombre + apellido + 4 dígitos)
  const getStudentUsername = (student: Student): string => {
    if (student.usuarioLogin) return student.usuarioLogin;
    const matchingUser = users.find(
      (u) =>
        u.estudianteId === student.id ||
        u.correo?.startsWith(student.matricula.toLowerCase())
    );
    if (matchingUser?.usuarioLogin) return matchingUser.usuarioLogin;

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
    // Deterministic 4 digits derived from student id/matricula so export is consistent
    let hash = 0;
    const seed = student.id + student.matricula;
    for (let i = 0; i < seed.length; i++) {
      hash = (hash * 31 + seed.charCodeAt(i)) % 9000;
    }
    const digits4 = Math.abs(hash) + 1000;
    return `${cleanFirst}${cleanSurname}${digits4}`;
  };

  // Helper to resolve or auto-generate student password (mínimo 8 caracteres entre letras y números)
  const getStudentPassword = (student: Student): string => {
    if (student.password && student.password !== 'admin123') return student.password;
    const matchingUser = users.find(
      (u) =>
        u.estudianteId === student.id ||
        (student.usuarioLogin && u.usuarioLogin === student.usuarioLogin)
    );
    if (matchingUser?.password && matchingUser.password !== 'admin123') {
      return matchingUser.password;
    }

    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789@#$%&*!?';
    let pwd = '';
    const seed = student.matricula + student.curp + student.id;
    for (let i = 0; i < 8; i++) {
      const code = seed.charCodeAt(i % seed.length) + i * 17;
      pwd += chars.charAt(code % chars.length);
    }
    return pwd;
  };

  const handleExportToExcel = () => {
    if (targetStudents.length === 0) {
      alert('No hay alumnos para exportar con los filtros seleccionados.');
      return;
    }

    // Build tabular dataset with full user & password credentials
    const excelRows = targetStudents.map((st, index) => {
      const username = getStudentUsername(st);
      const password = getStudentPassword(st);

      return {
        'N°': index + 1,
        'Matrícula': st.matricula,
        'Apellidos': st.apellidos,
        'Nombre(s)': st.nombre,
        'Nombre Completo': `${st.apellidos} ${st.nombre}`.trim(),
        'Grado': st.grado,
        'Grupo': st.grupo,
        'Docente Asignado': st.docenteNombre || 'Docente Titular de Grupo',
        'CURP': st.curp,
        'Usuario de Acceso': username,
        'Contraseña de Acceso': password,
        'Promedio General': Number(st.promedio.toFixed(1)),
        'Estatus del Alumno': st.estatus.toUpperCase(),
        'Tutor Legal': st.tutorNombre || 'Sin asignar',
        'Teléfono Tutor': st.tutorTelefono || '',
        'Correo Tutor': st.tutorCorreo || '',
        'Segundo Tutor': st.segundoTutorNombre || 'N/A',
        'Teléfono Segundo Tutor': st.segundoTutorTelefono || 'N/A',
        'Colegio / Plantel': college.nombre,
        'Código CCT': college.codigoCCT,
        'Portal Web de Acceso': 'dashboard.mycollege.com.mx',
      };
    });

    // Create Worksheet
    const worksheet = XLSX.utils.json_to_sheet(excelRows);

    // Auto-fit column widths for clear presentation
    const colKeys = Object.keys(excelRows[0] || {});
    worksheet['!cols'] = colKeys.map((key) => {
      let maxLen = key.length;
      for (const row of excelRows) {
        const val = String((row as any)[key] || '');
        if (val.length > maxLen) maxLen = val.length;
      }
      return { wch: Math.min(Math.max(maxLen + 3, 10), 45) };
    });

    // Create Workbook
    const workbook = XLSX.utils.book_new();
    const sheetName =
      exportScope === 'all'
        ? 'Padrón General Alumnos'
        : `Grupo ${currentGroup.replace(/[^a-zA-Z0-9]/g, '')}`.slice(0, 31);

    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

    // Generate Clean File Name
    const sanitizedCollege = college.nombre
      .replace(/[^a-zA-Z0-9]/g, '_')
      .slice(0, 20);
    const dateStr = new Date().toISOString().split('T')[0];
    const groupSuffix =
      exportScope === 'all'
        ? 'Todo_Colegio'
        : `Grupo_${currentGroup.replace(/[^a-zA-Z0-9]/g, '')}`;

    const fileName = `Alumnos_${sanitizedCollege}_${groupSuffix}_${dateStr}.${fileFormat}`;

    // Trigger Download
    XLSX.writeFile(workbook, fileName, { bookType: fileFormat });

    setDownloadSuccess(true);
    setTimeout(() => {
      setDownloadSuccess(false);
      onClose();
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl max-w-xl w-full overflow-hidden border border-slate-200 animate-in zoom-in-95 my-auto flex flex-col">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-100 bg-gradient-to-r from-[#0B2545] via-[#133E6E] to-[#0B2545] text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-400/20 border border-emerald-300/30 flex items-center justify-center text-emerald-300 shrink-0">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-300">
                  Control de Alumnos · Exportación
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  Formato Excel (.xlsx / .xls)
                </span>
              </div>
              <h3 className="font-display font-black text-lg text-white">
                Exportar Lista de Alumnos con Credenciales
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-5 text-xs">
          {/* Scope Selector */}
          <div className="space-y-2">
            <label className="block font-bold text-slate-700 uppercase tracking-wider text-[11px]">
              Selecciona el alcance de la exportación:
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Option 1: Todo el Colegio */}
              <button
                type="button"
                onClick={() => setExportScope('all')}
                className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex items-start gap-3 ${
                  exportScope === 'all'
                    ? 'border-emerald-500 bg-emerald-50/70 shadow-xs ring-2 ring-emerald-400/40 text-emerald-950'
                    : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    exportScope === 'all'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  <Building2 className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <strong className="block text-xs font-bold">Todo el Colegio</strong>
                  <span className="text-[11px] text-slate-500 block leading-tight mt-0.5">
                    Exporta la matrícula completa ({collegeStudents.length} alumnos)
                  </span>
                </div>
              </button>

              {/* Option 2: Un Grupo en Específico */}
              <button
                type="button"
                onClick={() => setExportScope('group')}
                className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex items-start gap-3 ${
                  exportScope === 'group'
                    ? 'border-emerald-500 bg-emerald-50/70 shadow-xs ring-2 ring-emerald-400/40 text-emerald-950'
                    : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    exportScope === 'group'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  <Users2 className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <strong className="block text-xs font-bold">Grupo Específico</strong>
                  <span className="text-[11px] text-slate-500 block leading-tight mt-0.5">
                    Filtra por salón (ej. 1° "A", 3° "B", etc.)
                  </span>
                </div>
              </button>
            </div>
          </div>

          {/* Group Dropdown if group scope is chosen */}
          {exportScope === 'group' && (
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2 animate-in fade-in">
              <label className="block font-bold text-slate-700 text-xs">
                Selecciona el Grupo Oficial:
              </label>
              <select
                value={currentGroup}
                onChange={(e) => setSelectedGroup(e.target.value)}
                className="w-full px-3 py-2 bg-white rounded-xl border border-slate-300 font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs"
              >
                {availableGroups.length > 0 ? (
                  availableGroups.map((grp) => {
                    const count = collegeStudents.filter(
                      (s) => `${s.grado} "${s.grupo}"` === grp
                    ).length;
                    return (
                      <option key={grp} value={grp}>
                        Grupo {grp} — ({count} alumnos)
                      </option>
                    );
                  })
                ) : (
                  <option value="1° A">No hay grupos configurados</option>
                )}
              </select>
            </div>
          )}

          {/* Summary Box with Columns included */}
          <div className="p-4 bg-gradient-to-br from-emerald-50/60 via-slate-50 to-blue-50/50 rounded-2xl border border-emerald-200/70 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <span>Resumen del Archivo a Generar</span>
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 font-extrabold text-[11px]">
                {targetStudents.length} alumnos incluidos
              </span>
            </div>

            <p className="text-[11px] text-slate-600 leading-relaxed">
              El archivo generado contendrá las columnas oficiales de control escolar, incluyendo los <strong>usuarios</strong> y <strong>contraseñas confidenciales</strong> asignados a cada estudiante para el acceso a su portal escolar:
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 text-[10px] text-slate-600 font-medium">
              <span className="flex items-center gap-1 bg-white px-2 py-1 rounded-lg border border-slate-200">
                <Check className="w-3 h-3 text-emerald-600 shrink-0" />
                <span>Matrícula & CURP</span>
              </span>
              <span className="flex items-center gap-1 bg-white px-2 py-1 rounded-lg border border-slate-200">
                <Check className="w-3 h-3 text-emerald-600 shrink-0" />
                <span>Nombre Completo</span>
              </span>
              <span className="flex items-center gap-1 bg-white px-2 py-1 rounded-lg border border-slate-200">
                <Check className="w-3 h-3 text-emerald-600 shrink-0" />
                <span>Grado y Grupo</span>
              </span>
              <span className="flex items-center gap-1 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-200 text-emerald-900 font-bold">
                <KeyRound className="w-3 h-3 text-emerald-600 shrink-0" />
                <span>Usuario Asignado</span>
              </span>
              <span className="flex items-center gap-1 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-200 text-emerald-900 font-bold">
                <KeyRound className="w-3 h-3 text-emerald-600 shrink-0" />
                <span>Contraseña</span>
              </span>
              <span className="flex items-center gap-1 bg-white px-2 py-1 rounded-lg border border-slate-200">
                <Check className="w-3 h-3 text-emerald-600 shrink-0" />
                <span>Datos del Tutor</span>
              </span>
            </div>
          </div>

          {/* Format selection (.xlsx vs .xls) */}
          <div className="flex items-center justify-between pt-1">
            <span className="text-slate-600 font-medium text-xs">Formato de Archivo:</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setFileFormat('xlsx')}
                className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-colors cursor-pointer ${
                  fileFormat === 'xlsx'
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                .XLSX (Excel Moderno)
              </button>
              <button
                type="button"
                onClick={() => setFileFormat('xls')}
                className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-colors cursor-pointer ${
                  fileFormat === 'xls'
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                .XLS (Excel Clásico)
              </button>
            </div>
          </div>

          {/* Success notice */}
          {downloadSuccess && (
            <div className="p-3 bg-emerald-100 border border-emerald-300 rounded-xl text-xs font-bold text-emerald-950 flex items-center gap-2 animate-in zoom-in-95">
              <Check className="w-4 h-4 text-emerald-700 shrink-0" />
              <span>¡Archivo Excel generado y descargado correctamente!</span>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={handleExportToExcel}
            disabled={targetStudents.length === 0}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-extrabold text-xs shadow-md transition-all active:scale-95 cursor-pointer disabled:opacity-50"
          >
            <Download className="w-4 h-4 stroke-[2.5]" />
            <span>
              Descargar Lista en Excel ({targetStudents.length} alumnos)
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
