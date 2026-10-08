import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import {
  FileText,
  Download,
  Calendar,
  Search,
  Shield,
  Clock,
  User,
  Building2,
  Filter,
  Trash2,
  CheckCircle2,
  Terminal,
  Copy,
  Check,
  Sparkles,
  Plus,
} from 'lucide-react';
import { ActivityLogEntry, ROLES_CONFIG } from '../types';

export const ActivityLogsModule: React.FC = () => {
  const {
    activityLogs,
    clearActivityLogs,
    currentUser,
    isSuperuserSession,
    colleges,
    addActivityLog,
  } = useApp();

  const todayStr = new Date().toISOString().split('T')[0];

  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedModuleFilter, setSelectedModuleFilter] = useState<string>('todos');
  const [selectedAccessFilter, setSelectedAccessFilter] = useState<string>('todos');
  const [copiedTxt, setCopiedTxt] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);

  const isAuthorizedSuperuser =
    currentUser.rol === 'superusuario' || isSuperuserSession;

  const safeLogs: ActivityLogEntry[] = Array.isArray(activityLogs) ? activityLogs : [];

  // Available dates in logs (plus today)
  const availableDates = useMemo(() => {
    const setDates = new Set<string>([todayStr]);
    safeLogs.forEach((l) => {
      if (l?.fecha) setDates.add(l.fecha);
    });
    return Array.from(setDates).sort((a, b) => b.localeCompare(a));
  }, [safeLogs, todayStr]);

  // Available modules in logs
  const availableModules = useMemo(() => {
    const setMods = new Set<string>();
    safeLogs.forEach((l) => {
      if (l?.modulo) setMods.add(l.modulo);
    });
    return Array.from(setMods).sort();
  }, [safeLogs]);

  // Available access scopes in logs
  const availableAccesses = useMemo(() => {
    const setAcc = new Set<string>();
    safeLogs.forEach((l) => {
      if (l?.acceso) setAcc.add(l.acceso);
    });
    return Array.from(setAcc).sort();
  }, [safeLogs]);

  // Filtered logs for the selected day (or all days)
  const filteredLogs = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return safeLogs.filter((log) => {
      if (!log) return false;
      if (selectedDate !== 'todas' && log.fecha !== selectedDate) return false;
      if (selectedModuleFilter !== 'todos' && log.modulo !== selectedModuleFilter) return false;
      if (selectedAccessFilter !== 'todos' && log.acceso !== selectedAccessFilter) return false;
      if (q) {
        const haystack = `${log.fecha} ${log.hora} ${log.usuarioNombre} ${log.usuarioCorreo} ${log.usuarioRol} ${log.acceso} ${log.modulo} ${log.accion} ${log.detalle}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [safeLogs, selectedDate, selectedModuleFilter, selectedAccessFilter, searchTerm]);

  // Generate TXT content formatted for the selected day
  const generateDailyTxtContent = (logsToFormat: ActivityLogEntry[], dateLabel: string) => {
    const headerLines = [
      '====================================================================================================',
      'MY COLLEGE ENTERPRISE · BITÁCORA OFICIAL DE ACTIVIDADES DEL SISTEMA (ARCHIVO .TXT POR DÍA)',
      '====================================================================================================',
      `FECHA DE CORTE / BITÁCORA : ${dateLabel === 'todas' ? 'HISTORIAL COMPLETO DE FECHAS' : dateLabel}`,
      `GENERADO POR              : ${currentUser.nombre} (${currentUser.correo}) - [SUPERUSUARIO]`,
      `FECHA Y HORA DE DESCARGA  : ${new Date().toISOString().split('T')[0]} ${new Date().toTimeString().split(' ')[0]}`,
      `TOTAL DE REGISTROS        : ${logsToFormat.length} actividades registradas`,
      '====================================================================================================',
      'FORMATO: [FECHA] | [HORA] | [USUARIO (PERFIL)] | [ACCESO / PLANTEL] | [MÓDULO] | [TAREA / ACCIÓN REALIZADA]',
      '----------------------------------------------------------------------------------------------------',
      '',
    ];

    if (logsToFormat.length === 0) {
      headerLines.push('Sin registros de actividad para los criterios seleccionados.');
    } else {
      logsToFormat.forEach((entry, idx) => {
        const num = String(idx + 1).padStart(3, '0');
        const roleLabel = ROLES_CONFIG[entry.usuarioRol]?.label || entry.usuarioRol;
        headerLines.push(
          `#${num} | FECHA: ${entry.fecha} | HORA: ${entry.hora} | USUARIO: ${entry.usuarioNombre} <${entry.usuarioCorreo}> (${roleLabel}) | ACCESO: ${entry.acceso} | MÓDULO: ${entry.modulo} | TAREA: [${entry.accion}] ${entry.detalle}`
        );
      });
    }

    headerLines.push('');
    headerLines.push('====================================================================================================');
    headerLines.push('FIN DEL ARCHIVO DE AUDITORÍA DIARIA · MY COLLEGE CENTRAL');
    headerLines.push('====================================================================================================');

    return headerLines.join('\n');
  };

  const txtPreviewContent = useMemo(
    () => generateDailyTxtContent(filteredLogs, selectedDate),
    [filteredLogs, selectedDate, currentUser]
  );

  // Download .txt file for the selected day
  const handleDownloadTxtFile = (dateToExport?: string) => {
    const targetDate = dateToExport || selectedDate;
    const logsForFile =
      targetDate === 'todas'
        ? filteredLogs
        : safeLogs.filter((l) => l.fecha === targetDate);
    const content = generateDailyTxtContent(
      dateToExport ? logsForFile : filteredLogs,
      targetDate
    );

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const fileNameDate = targetDate === 'todas' ? `completo_${todayStr}` : targetDate;
    link.download = `bitacora_actividades_mycollege_${fileNameDate}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleCopyTxt = () => {
    navigator.clipboard.writeText(txtPreviewContent);
    setCopiedTxt(true);
    setTimeout(() => setCopiedTxt(false), 2500);
  };

  if (!isAuthorizedSuperuser) {
    return (
      <div className="bg-white rounded-3xl border border-rose-200 p-12 text-center max-w-xl mx-auto my-8 shadow-sm">
        <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-4">
          <Shield className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-black text-slate-900">
          Acceso Exclusivo para Superusuario
        </h2>
        <p className="text-xs text-slate-500 mt-2 leading-relaxed">
          El módulo de Bitácora de Actividades y Generación de Logs en TXT por día se encuentra disponible únicamente en el Panel General para el perfil de Superusuario Maestro.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Cabecera Limpia Institucional */}
      <div className="bg-gradient-to-r from-[#07192F] via-[#0B2545] to-[#133966] rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden border border-amber-500/20">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-2 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/40 text-xs font-bold uppercase tracking-wider">
              <Terminal className="w-3.5 h-3.5" />
              <span>Panel General · Exclusivo Superusuario</span>
            </div>
            <h1 className="font-display font-black text-2xl sm:text-3xl tracking-tight text-white">
              Bitácora de Actividades y Generador de Logs (.TXT por Día)
            </h1>
            <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
              Control integral y auditoría de todo lo que se realiza en el panel: fecha, hora, usuario, acceso y tarea ejecutada (altas de usuarios, cobros, alumnos, docentes, asignaciones de grupo, creación de campus, permisos y pagos).
            </p>
          </div>
        </div>
      </div>

      {/* Barra de Botones Debajo de la Cabecera */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-amber-600" />
            <span>Archivo TXT del Día:</span>
          </span>
          <div className="flex flex-wrap items-center gap-1.5">
            {availableDates.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setSelectedDate(d)}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                  selectedDate === d
                    ? 'bg-[#0B2545] text-amber-300 shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {d === todayStr ? `${d} (Hoy)` : d}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setSelectedDate('todas')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedDate === 'todas'
                  ? 'bg-[#0B2545] text-amber-300 shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Todas las fechas ({safeLogs.length})
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleCopyTxt}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-colors cursor-pointer"
          >
            {copiedTxt ? (
              <>
                <Check className="w-4 h-4 text-emerald-600" />
                <span>Contenido TXT Copiado</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-slate-600" />
                <span>Copiar Log TXT</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => handleDownloadTxtFile()}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#DFB743] to-[#C59B27] hover:from-[#E8C252] hover:to-[#B68C1C] text-[#0B2545] font-black text-xs sm:text-sm shadow-md transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>
              Descargar Log .TXT ({selectedDate === 'todas' ? 'Completo' : selectedDate})
            </span>
          </button>
        </div>
      </div>

      {/* Tarjetas de Resumen del Día */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500">
            <span>Eventos del Día Seleccionado</span>
            <FileText className="w-4 h-4 text-blue-600" />
          </div>
          <div className="font-display font-black text-2xl text-slate-900 font-mono">
            {filteredLogs.length}
          </div>
          <span className="text-[11px] text-slate-500 block">
            Fecha activa: <strong>{selectedDate === 'todas' ? 'Todas' : selectedDate}</strong>
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500">
            <span>Usuarios Activos en Bitácora</span>
            <User className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="font-display font-black text-2xl text-emerald-700 font-mono">
            {new Set(filteredLogs.map((l) => l.usuarioCorreo)).size}
          </div>
          <span className="text-[11px] text-slate-500 block">
            Cuentas con operaciones registradas
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500">
            <span>Módulos Auditados</span>
            <Building2 className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="font-display font-black text-2xl text-indigo-700 font-mono">
            {new Set(filteredLogs.map((l) => l.modulo)).size}
          </div>
          <span className="text-[11px] text-slate-500 block">
            Usuarios, Cobros, Alumnos, Campus, etc.
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500">
            <span>Formato de Exportación</span>
            <Terminal className="w-4 h-4 text-amber-600" />
          </div>
          <div className="font-display font-black text-lg text-slate-900 font-mono truncate">
            bitacora_{selectedDate === 'todas' ? todayStr : selectedDate}.txt
          </div>
          <span className="text-[11px] text-emerald-700 font-semibold block">
            ● Archivo .txt diario listo para descarga
          </span>
        </div>
      </div>

      {/* Filtros de Búsqueda por Fecha, Módulo, Acceso y Palabra Clave */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="md:col-span-2 relative flex items-center">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por usuario, tarea realizada, cobro, alumno, docente, campus..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
          />
        </div>

        <div>
          <select
            value={selectedModuleFilter}
            onChange={(e) => setSelectedModuleFilter(e.target.value)}
            className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
          >
            <option value="todos">Todos los Módulos</option>
            {availableModules.map((mod) => (
              <option key={mod} value={mod}>
                Módulo: {mod}
              </option>
            ))}
          </select>
        </div>

        <div>
          <select
            value={selectedAccessFilter}
            onChange={(e) => setSelectedAccessFilter(e.target.value)}
            className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
          >
            <option value="todos">Todos los Accesos / Planteles</option>
            {availableAccesses.map((acc) => (
              <option key={acc} value={acc}>
                Acceso: {acc}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tabla Estructurada de Actividades Registradas */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-display font-bold text-base text-slate-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#0B2545]" />
              <span>
                Registro Cronológico de Actividades ({filteredLogs.length})
              </span>
            </h3>
            <p className="text-xs text-slate-500">
              Contiene Fecha, Hora, Usuario, Acceso y Tarea realizada en tiempo real
            </p>
          </div>

          <div className="flex items-center gap-2">
            {confirmClear ? (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    clearActivityLogs(selectedDate);
                    setConfirmClear(false);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-rose-600 text-white text-xs font-bold cursor-pointer"
                >
                  Confirmar Limpieza
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmClear(false)}
                  className="px-3 py-1.5 rounded-xl bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
                >
                  Cancelar
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmClear(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 border border-rose-200 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Limpiar Bitácora mostrada</span>
              </button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                <th className="py-3.5 px-4">Fecha</th>
                <th className="py-3.5 px-4">Hora</th>
                <th className="py-3.5 px-4">Usuario</th>
                <th className="py-3.5 px-4">Acceso</th>
                <th className="py-3.5 px-4">Módulo</th>
                <th className="py-3.5 px-4">Tarea que Hizo / Detalle de Actividad</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 italic">
                    No hay actividades registradas para los filtros seleccionados.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const roleDef = ROLES_CONFIG[log.usuarioRol];
                  return (
                    <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-800 whitespace-nowrap">
                        {log.fecha}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-600 whitespace-nowrap">
                        {log.hora}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{log.usuarioNombre}</div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.2 rounded-full border ${
                              roleDef
                                ? `${roleDef.badgeBg} ${roleDef.badgeText}`
                                : 'bg-slate-100 text-slate-700 border-slate-300'
                            }`}
                          >
                            {roleDef?.label || log.usuarioRol}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400">
                            {log.usuarioCorreo}
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-900 border border-blue-200 font-bold text-[11px]">
                          <Building2 className="w-3 h-3 text-blue-600 shrink-0" />
                          <span>{log.acceso}</span>
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 font-bold text-[11px]">
                          {log.modulo}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{log.accion}</div>
                        <div className="text-slate-600 text-[11px] leading-relaxed mt-0.5">
                          {log.detalle}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Vista Previa en Vivo del Archivo .TXT Diario */}
      <div className="bg-slate-950 rounded-3xl border border-slate-800 shadow-xl overflow-hidden text-slate-100">
        <div className="px-6 py-4 bg-slate-900 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Terminal className="w-4 h-4 text-amber-400" />
            <span className="font-mono font-bold text-xs sm:text-sm text-amber-300">
              bitacora_actividades_mycollege_{selectedDate === 'todas' ? todayStr : selectedDate}.txt
            </span>
          </div>

          <button
            type="button"
            onClick={() => handleDownloadTxtFile()}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Guardar Archivo .TXT</span>
          </button>
        </div>

        <pre className="p-5 text-[11px] font-mono text-emerald-300/95 overflow-x-auto max-h-80 leading-relaxed whitespace-pre-wrap">
          {txtPreviewContent}
        </pre>
      </div>
    </div>
  );
};
