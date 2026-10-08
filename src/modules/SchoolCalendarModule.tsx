import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import {
  Calendar as CalendarIcon,
  Plus,
  Trash2,
  Edit2,
  Users,
  Users2,
  X,
  ChevronLeft,
  ChevronRight,
  PartyPopper,
  Palmtree,
  Flag,
  BookOpen,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import { CalendarNonSchoolDay } from '../types';

const DAY_TYPE_CONFIG: Record<
  CalendarNonSchoolDay['tipo'],
  {
    label: string;
    shortLabel: string;
    badgeBg: string;
    badgeText: string;
    cellBg: string;
    cellBorder: string;
    dotColor: string;
  }
> = {
  dia_feriado: {
    label: 'Día Feriado Oficial',
    shortLabel: 'Día Feriado',
    badgeBg: 'bg-rose-100',
    badgeText: 'text-rose-800 border-rose-300',
    cellBg: 'bg-rose-50/90 hover:bg-rose-100/80',
    cellBorder: 'border-rose-300',
    dotColor: 'bg-rose-600',
  },
  suspension_oficial: {
    label: 'Suspensión Oficial de Clases',
    shortLabel: 'Suspensión',
    badgeBg: 'bg-red-100',
    badgeText: 'text-red-800 border-red-300',
    cellBg: 'bg-red-50/90 hover:bg-red-100/80',
    cellBorder: 'border-red-300',
    dotColor: 'bg-red-600',
  },
  vacaciones: {
    label: 'Periodo Vacacional / Receso',
    shortLabel: 'Vacaciones',
    badgeBg: 'bg-indigo-100',
    badgeText: 'text-indigo-800 border-indigo-300',
    cellBg: 'bg-indigo-50/90 hover:bg-indigo-100/80',
    cellBorder: 'border-indigo-300',
    dotColor: 'bg-indigo-600',
  },
  consejo_tecnico: {
    label: 'Consejo Técnico Escolar (CTE)',
    shortLabel: 'Consejo Técnico',
    badgeBg: 'bg-amber-100',
    badgeText: 'text-amber-900 border-amber-300',
    cellBg: 'bg-amber-50/90 hover:bg-amber-100/80',
    cellBorder: 'border-amber-300',
    dotColor: 'bg-amber-500',
  },
  evento_institucional: {
    label: 'Evento Institucional Sin Clases',
    shortLabel: 'Evento Sin Clases',
    badgeBg: 'bg-teal-100',
    badgeText: 'text-teal-800 border-teal-300',
    cellBg: 'bg-teal-50/90 hover:bg-teal-100/80',
    cellBorder: 'border-teal-300',
    dotColor: 'bg-teal-600',
  },
  evento_escolar: {
    label: 'Evento Escolar / Actividad Cívica o Cultural',
    shortLabel: 'Evento Escolar',
    badgeBg: 'bg-blue-100',
    badgeText: 'text-blue-800 border-blue-300',
    cellBg: 'bg-blue-50/90 hover:bg-blue-100/80',
    cellBorder: 'border-blue-300',
    dotColor: 'bg-blue-600',
  },
};

const MONTH_NAMES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];

const WEEKDAY_HEADERS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

export const SchoolCalendarModule: React.FC = () => {
  const {
    activeCollege,
    currentUser,
    colleges,
    students,
    calendarDays,
    addCalendarDay,
    updateCalendarDay,
    deleteCalendarDay,
    schoolCycles,
  } = useApp();

  // Resolve effective college for Tutors, Teachers, or Admins
  const linkedStudent = students.find(
    (s) =>
      currentUser.hijosIds?.includes(s.id) ||
      (currentUser.correo && s.tutorCorreo?.toLowerCase() === currentUser.correo.toLowerCase())
  );
  const effectiveCollege =
    activeCollege ||
    colleges.find((c) => c.id === currentUser.colegioId) ||
    (linkedStudent ? colleges.find((c) => c.id === linkedStudent.colegioId) : null) ||
    colleges[0];

  const canManageCalendar = [
    'superusuario',
    'administrador',
    'directivo',
    'coordinador',
    'supervisor',
    'prefecto',
  ].includes(currentUser.rol);

  // Current displayed year & month (0-indexed month: 9 = Octubre 2026)
  const [currentYear, setCurrentYear] = useState<number>(2026);
  const [currentMonth, setCurrentMonth] = useState<number>(9); // October
  const [typeFilter, setTypeFilter] = useState<string>('todos');
  const [selectedDateDetail, setSelectedDateDetail] = useState<string | null>(null);

  // Add/Edit Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDay, setEditingDay] = useState<CalendarNonSchoolDay | null>(null);
  const [fecha, setFecha] = useState('2026-10-30');
  const [fechaFin, setFechaFin] = useState('');
  const [motivo, setMotivo] = useState('');
  const [tipo, setTipo] = useState<CalendarNonSchoolDay['tipo']>('dia_feriado');
  const [visibleTutores, setVisibleTutores] = useState(true);
  const [visibleDocentes, setVisibleDocentes] = useState(true);

  if (!effectiveCollege) return null;

  const primaryColor = effectiveCollege.colores.primario || '#0B2545';
  const goldColor = effectiveCollege.colores.secundario || '#C59B27';

  const activeCycle = schoolCycles.find(
    (c) => c.colegioId === effectiveCollege.id && c.activo
  );

  // Filter days by college and role visibility
  const collegeDays = useMemo(() => {
    return calendarDays.filter((d) => {
      if (d.colegioId !== effectiveCollege.id) return false;
      if (currentUser.rol === 'tutor' && !d.visibleTutores) return false;
      if (currentUser.rol === 'docente' && !d.visibleDocentes) return false;
      if (typeFilter !== 'todos' && d.tipo !== typeFilter) return false;
      return true;
    });
  }, [calendarDays, effectiveCollege.id, currentUser.rol, typeFilter]);

  // Helper to check if a YYYY-MM-DD falls on a CalendarNonSchoolDay (supports single date or date range fecha..fechaFin)
  const getEventsForDateString = (dateStr: string): CalendarNonSchoolDay[] => {
    return collegeDays.filter((d) => {
      if (d.fecha === dateStr) return true;
      if (d.fechaFin && dateStr >= d.fecha && dateStr <= d.fechaFin) return true;
      return false;
    });
  };

  // Build all days of the selected month grid (with leading/trailing padding cells for 7-col calendar)
  const calendarCells = useMemo(() => {
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const startWeekday = firstDayOfMonth.getDay(); // 0 (Sun) - 6 (Sat)

    const cells: Array<{
      dayNumber: number | null;
      dateStr: string | null;
      isWeekend: boolean;
      isToday: boolean;
      events: CalendarNonSchoolDay[];
    }> = [];

    // Leading empty cells before day 1
    for (let i = 0; i < startWeekday; i++) {
      cells.push({
        dayNumber: null,
        dateStr: null,
        isWeekend: i === 0 || i === 6,
        isToday: false,
        events: [],
      });
    }

    const todayStr = new Date().toISOString().split('T')[0];

    // All days of the current month (1 .. daysInMonth)
    for (let day = 1; day <= daysInMonth; day++) {
      const mm = String(currentMonth + 1).padStart(2, '0');
      const dd = String(day).padStart(2, '0');
      const dateStr = `${currentYear}-${mm}-${dd}`;
      const weekday = (startWeekday + day - 1) % 7;
      const events = getEventsForDateString(dateStr);

      cells.push({
        dayNumber: day,
        dateStr,
        isWeekend: weekday === 0 || weekday === 6,
        isToday: dateStr === todayStr,
        events,
      });
    }

    // Trailing empty cells to complete the last week row
    while (cells.length % 7 !== 0) {
      const weekday = cells.length % 7;
      cells.push({
        dayNumber: null,
        dateStr: null,
        isWeekend: weekday === 0 || weekday === 6,
        isToday: false,
        events: [],
      });
    }

    return cells;
  }, [currentYear, currentMonth, collegeDays]);

  // Events occurring in the currently selected month
  const currentMonthPrefix = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;
  const eventsInCurrentMonth = collegeDays.filter(
    (d) =>
      d.fecha.startsWith(currentMonthPrefix) ||
      (d.fechaFin && d.fechaFin.startsWith(currentMonthPrefix)) ||
      (d.fecha <= `${currentMonthPrefix}-31` && d.fechaFin && d.fechaFin >= `${currentMonthPrefix}-01`)
  );

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
    setSelectedDateDetail(null);
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
    setSelectedDateDetail(null);
  };

  const handleOpenAddForDate = (
    dateStr?: string,
    defaultType: CalendarNonSchoolDay['tipo'] = 'dia_feriado'
  ) => {
    setEditingDay(null);
    const fallbackDate = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-15`;
    setFecha(dateStr || fallbackDate);
    setFechaFin('');
    setMotivo('');
    setTipo(defaultType);
    setVisibleTutores(true);
    setVisibleDocentes(true);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (day: CalendarNonSchoolDay) => {
    setEditingDay(day);
    setFecha(day.fecha);
    setFechaFin(day.fechaFin || '');
    setMotivo(day.motivo);
    setTipo(day.tipo);
    setVisibleTutores(day.visibleTutores);
    setVisibleDocentes(day.visibleDocentes);
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fecha || !motivo.trim()) return;

    if (editingDay) {
      updateCalendarDay(editingDay.id, {
        fecha,
        fechaFin: fechaFin || undefined,
        motivo: motivo.trim(),
        tipo,
        visibleTutores,
        visibleDocentes,
      });
    } else {
      addCalendarDay({
        colegioId: effectiveCollege.id,
        cicloId: activeCycle?.id,
        fecha,
        fechaFin: fechaFin || undefined,
        motivo: motivo.trim(),
        tipo,
        visibleTutores,
        visibleDocentes,
        creadoPor: `${currentUser.nombre} (${currentUser.rol})`,
      });
    }

    // Automatically jump calendar view to the month of the saved event
    const parts = fecha.split('-');
    if (parts.length === 3) {
      setCurrentYear(parseInt(parts[0], 10));
      setCurrentMonth(parseInt(parts[1], 10) - 1);
    }

    setIsModalOpen(false);
  };

  return (
    <div className="space-y-4">
      {/* Header Banner */}
      <div
        className="rounded-2xl p-4 sm:p-5 text-white shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-3"
        style={{
          background: `linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}dd 100%)`,
          borderBottom: `3px solid ${goldColor}`,
        }}
      >
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white/15 text-amber-300 border border-white/20">
              Calendario Mensual Interactivo
            </span>
            {activeCycle && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-200 border border-emerald-400/30">
                {activeCycle.nombre}: Inicio {activeCycle.fechaInicioClases} · Fin {activeCycle.fechaFinClases}
              </span>
            )}
          </div>
          <h2 className="font-display font-bold text-lg sm:text-xl text-white flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-amber-300" />
            Calendario Escolar, Eventos, Feriados y Vacaciones
          </h2>
          <p className="text-xs text-slate-200 max-w-2xl">
            Haz clic en cualquier día del mes para registrar <strong>eventos escolares, días feriados, suspensiones o periodos vacacionales</strong>. Visible en el perfil de <strong>Tutores</strong> y <strong>Docentes</strong>.
          </p>
        </div>
      </div>

      {/* Action Buttons Bar (Below Header) */}
      {canManageCalendar && (
        <div className="flex flex-wrap items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => handleOpenAddForDate(undefined, 'evento_escolar')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-bold text-xs bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 shadow-2xs transition-all cursor-pointer"
          >
            <PartyPopper className="w-3.5 h-3.5" style={{ color: primaryColor }} />
            <span>+ Evento Escolar</span>
          </button>

          <button
            type="button"
            onClick={() => handleOpenAddForDate(undefined, 'dia_feriado')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-bold text-xs bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 shadow-2xs transition-all cursor-pointer"
          >
            <Flag className="w-3.5 h-3.5 text-rose-600" />
            <span>+ Día Feriado</span>
          </button>

          <button
            type="button"
            onClick={() => handleOpenAddForDate(undefined, 'vacaciones')}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl font-bold text-xs shadow-sm transition-all cursor-pointer"
            style={{ backgroundColor: goldColor, color: primaryColor }}
          >
            <Palmtree className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>+ Periodo Vacacional</span>
          </button>
        </div>
      )}

      {/* Compact Calendar Container */}
      <div className="max-w-2xl mx-auto space-y-2.5">
        {/* Month Navigation & Filter Bar */}
        <div className="bg-white rounded-xl border border-slate-200 p-2.5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          {/* Left: Month & Year Selector + Prev/Next */}
          <div className="flex flex-wrap items-center gap-1.5">
            <div className="flex items-center bg-slate-100 rounded-lg p-0.5 border border-slate-200">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="p-1 rounded-md hover:bg-white text-slate-700 transition-colors cursor-pointer"
                title="Mes anterior"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <span className="px-2 font-display font-bold text-xs text-slate-900 min-w-[110px] text-center">
                {MONTH_NAMES[currentMonth]} {currentYear}
              </span>
              <button
                type="button"
                onClick={handleNextMonth}
                className="p-1 rounded-md hover:bg-white text-slate-700 transition-colors cursor-pointer"
                title="Mes siguiente"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Direct Month Dropdown */}
            <select
              value={currentMonth}
              onChange={(e) => setCurrentMonth(Number(e.target.value))}
              className="px-2 py-1 rounded-lg border border-slate-200 bg-white text-[11px] font-bold text-slate-800 cursor-pointer"
            >
              {MONTH_NAMES.map((mName, idx) => (
                <option key={mName} value={idx}>
                  {mName}
                </option>
              ))}
            </select>

            {/* Direct Year Dropdown */}
            <select
              value={currentYear}
              onChange={(e) => setCurrentYear(Number(e.target.value))}
              className="px-2 py-1 rounded-lg border border-slate-200 bg-white text-[11px] font-bold text-slate-800 cursor-pointer"
            >
              <option value={2025}>2025</option>
              <option value={2026}>2026</option>
              <option value={2027}>2027</option>
            </select>
          </div>

          {/* Right: Category Legend & Filter */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] font-semibold text-slate-500">Filtrar:</span>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-2 py-1 rounded-lg border border-slate-200 text-[11px] font-bold text-slate-700 bg-slate-50 cursor-pointer"
            >
              <option value="todos">Todas las Categorías ({collegeDays.length})</option>
              <option value="dia_feriado">Días Feriados Oficiales</option>
              <option value="suspension_oficial">Suspensión de Clases</option>
              <option value="vacaciones">Periodo Vacacional</option>
              <option value="consejo_tecnico">Consejo Técnico Escolar (CTE)</option>
              <option value="evento_escolar">Eventos Escolares y Culturales</option>
              <option value="evento_institucional">Evento Institucional Sin Clases</option>
            </select>
          </div>
        </div>

        {/* Color Legend Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-2.5 py-1.5 bg-white rounded-xl border border-slate-200 text-[10px]">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-bold text-slate-500 uppercase text-[9px]">Simbología:</span>
            <span className="inline-flex items-center gap-1 font-semibold text-rose-800">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-600" /> Feriado / Suspensión
            </span>
            <span className="inline-flex items-center gap-1 font-semibold text-indigo-800">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-600" /> Vacaciones
            </span>
            <span className="inline-flex items-center gap-1 font-semibold text-amber-800">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> Consejo Técnico
            </span>
            <span className="inline-flex items-center gap-1 font-semibold text-blue-800">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600" /> Evento Escolar
            </span>
          </div>

          <div className="flex items-center gap-1 text-[9px] text-slate-500">
            <Users2 className="w-3 h-3 text-emerald-600" />
            <span>Visible en Tutores y Docentes</span>
          </div>
        </div>

        {/* ================================================================= */}
        {/* COMPACT MONTH CALENDAR GRID (TODOS LOS DÍAS DEL MES)              */}
        {/* ================================================================= */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          {/* Weekday Headers */}
          <div
            className="grid grid-cols-7 text-white text-center text-[10px] font-bold uppercase tracking-wider py-1.5"
            style={{ backgroundColor: primaryColor }}
          >
            {WEEKDAY_HEADERS.map((wd) => (
              <div key={wd} className="px-0.5">
                {wd}
              </div>
            ))}
          </div>

          {/* Days Grid (7 columns - compact height) */}
          <div className="grid grid-cols-7 divide-x divide-y divide-slate-200 border-t border-slate-200">
            {calendarCells.map((cell, index) => {
              if (cell.dayNumber === null || !cell.dateStr) {
                return (
                  <div
                    key={`empty-${index}`}
                    className="min-h-[48px] sm:min-h-[54px] bg-slate-50/70 p-1"
                  />
                );
              }

              const hasEvents = cell.events.length > 0;
              const primaryEvent = cell.events[0];
              const primaryCfg = primaryEvent
                ? DAY_TYPE_CONFIG[primaryEvent.tipo] || DAY_TYPE_CONFIG.suspension_oficial
                : null;

              return (
                <div
                  key={cell.dateStr}
                  onClick={() => {
                    if (canManageCalendar && cell.events.length === 0) {
                      handleOpenAddForDate(cell.dateStr!, 'evento_escolar');
                    } else if (cell.events.length > 0) {
                      setSelectedDateDetail(cell.dateStr!);
                    }
                  }}
                  className={`min-h-[48px] sm:min-h-[54px] p-1 flex flex-col justify-between transition-all relative group ${
                    hasEvents && primaryCfg
                      ? primaryCfg.cellBg
                      : cell.isWeekend
                      ? 'bg-slate-50/50 hover:bg-slate-100/60'
                      : 'bg-white hover:bg-blue-50/30'
                  } ${canManageCalendar || hasEvents ? 'cursor-pointer' : ''}`}
                >
                  {/* Top row: Day Number + Quick Add button on hover */}
                  <div className="flex items-center justify-between gap-0.5">
                    <span
                      className={`w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                        cell.isToday
                          ? 'bg-amber-500 text-slate-950 shadow-2xs ring-1 ring-amber-300'
                          : hasEvents
                          ? 'bg-white/90 text-slate-900 shadow-2xs font-extrabold'
                          : cell.isWeekend
                          ? 'text-slate-400'
                          : 'text-slate-700'
                      }`}
                    >
                      {cell.dayNumber}
                    </span>

                    {canManageCalendar && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenAddForDate(cell.dateStr!, 'evento_escolar');
                        }}
                        className="opacity-0 group-hover:opacity-100 p-0.5 rounded bg-white hover:bg-slate-900 text-slate-600 hover:text-white border border-slate-200 shadow-2xs transition-all text-[8px] font-bold flex items-center cursor-pointer"
                        title={`Agregar evento o día feriado el ${cell.dateStr}`}
                      >
                        <Plus className="w-2.5 h-2.5" />
                      </button>
                    )}
                  </div>

                  {/* Middle/Bottom: Events list on this day */}
                  <div className="mt-0.5 space-y-0.5">
                    {cell.events.map((ev) => {
                      const cfg = DAY_TYPE_CONFIG[ev.tipo] || DAY_TYPE_CONFIG.suspension_oficial;
                      return (
                        <div
                          key={ev.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (canManageCalendar) {
                              handleOpenEdit(ev);
                            } else {
                              setSelectedDateDetail(cell.dateStr!);
                            }
                          }}
                          className={`px-1 py-0.2 rounded border text-[8px] sm:text-[9px] leading-tight font-semibold shadow-2xs truncate ${cfg.badgeBg} ${cfg.badgeText}`}
                          title={`${cfg.label}: ${ev.motivo}`}
                        >
                          <span className={`inline-block w-1 h-1 rounded-full mr-0.5 ${cfg.dotColor}`} />
                          <span>{ev.motivo}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Monthly Summary List below the Calendar Grid */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h3 className="font-display font-bold text-base text-slate-900">
              Eventos, Feriados y Suspensiones en {MONTH_NAMES[currentMonth]} {currentYear} ({eventsInCurrentMonth.length})
            </h3>
            <p className="text-xs text-slate-500">
              Detalle de todas las fechas marcadas en el mes seleccionado
            </p>
          </div>

          {canManageCalendar && (
            <button
              type="button"
              onClick={() => handleOpenAddForDate(undefined, 'dia_feriado')}
              className="text-xs font-bold px-3 py-1.5 rounded-xl text-white self-start sm:self-auto cursor-pointer"
              style={{ backgroundColor: primaryColor }}
            >
              + Registrar Fecha en {MONTH_NAMES[currentMonth]}
            </button>
          )}
        </div>

        {eventsInCurrentMonth.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {eventsInCurrentMonth.map((day) => {
              const cfg = DAY_TYPE_CONFIG[day.tipo] || DAY_TYPE_CONFIG.suspension_oficial;
              return (
                <div
                  key={day.id}
                  className="rounded-xl border border-slate-200 p-4 hover:shadow-xs transition-all flex flex-col justify-between gap-3 bg-slate-50/40"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${cfg.badgeBg} ${cfg.badgeText}`}
                      >
                        {cfg.label}
                      </span>

                      {canManageCalendar && (
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(day)}
                            className="p-1 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-white cursor-pointer"
                            title="Editar"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteCalendarDay(day.id)}
                            className="p-1 rounded-lg text-rose-400 hover:text-rose-700 hover:bg-rose-50 cursor-pointer"
                            title="Eliminar"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="font-mono font-bold text-xs text-slate-700">
                      📅 {day.fecha}
                      {day.fechaFin ? ` al ${day.fechaFin}` : ''}
                    </div>

                    <h4 className="font-bold text-sm text-slate-900 leading-snug">
                      {day.motivo}
                    </h4>
                  </div>

                  <div className="pt-2 border-t border-slate-200/70 flex items-center justify-between text-[10px] text-slate-500">
                    <div className="flex items-center gap-1.5">
                      {day.visibleTutores && (
                        <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold">
                          Tutores ✓
                        </span>
                      )}
                      {day.visibleDocentes && (
                        <span className="px-2 py-0.5 rounded bg-teal-50 text-teal-700 font-bold">
                          Docentes ✓
                        </span>
                      )}
                    </div>
                    <span className="truncate max-w-[130px]">{day.creadoPor}</span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 text-xs text-slate-400">
            No hay eventos, días feriados ni vacaciones registrados en {MONTH_NAMES[currentMonth]} {currentYear}. Haz clic en cualquier día de la cuadrícula para agregar uno.
          </div>
        )}
      </div>

      {/* Modal: Add / Edit Event, Holiday, Vacation or Non-School Day */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200">
            <div
              className="p-4 text-white flex items-center justify-between"
              style={{ backgroundColor: primaryColor }}
            >
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-amber-300" />
                <h3 className="font-bold text-sm">
                  {editingDay
                    ? 'Editar Fecha en el Calendario'
                    : 'Agregar Evento, Día Feriado o Periodo Vacacional'}
                </h3>
              </div>
              <button onClick={() => setIsModalOpen(false)}>
                <X className="w-5 h-5 text-white/80 hover:text-white" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-5 space-y-4 text-xs sm:text-sm">
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Categoría en el Calendario *
                </label>
                <select
                  value={tipo}
                  onChange={(e) => setTipo(e.target.value as CalendarNonSchoolDay['tipo'])}
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-xl font-bold text-slate-900 bg-slate-50"
                >
                  <option value="dia_feriado">🎌 Día Feriado Oficial (Inhábil)</option>
                  <option value="vacaciones">🌴 Periodo Vacacional / Receso Escolar</option>
                  <option value="evento_escolar">🎉 Evento Escolar / Actividad Cívica o Cultural</option>
                  <option value="suspension_oficial">🚫 Suspensión Oficial de Clases</option>
                  <option value="consejo_tecnico">📋 Consejo Técnico Escolar (CTE)</option>
                  <option value="evento_institucional">🏛️ Evento Institucional Sin Clases</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Fecha de Inicio *
                  </label>
                  <input
                    type="date"
                    required
                    value={fecha}
                    onChange={(e) => setFecha(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Fecha Fin (Para Vacaciones/Rango)
                  </label>
                  <input
                    type="date"
                    value={fechaFin}
                    min={fecha}
                    onChange={(e) => setFechaFin(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Título / Motivo del Evento o Día Feriado *
                </label>
                <textarea
                  rows={2}
                  required
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                  placeholder="Ej. Día de Muertos, Festival Navideño, Vacaciones de Invierno, etc."
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                />
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <span className="text-[11px] font-bold uppercase text-slate-500 block">
                  Visibilidad en Perfiles:
                </span>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={visibleTutores}
                    onChange={(e) => setVisibleTutores(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600"
                  />
                  <span className="text-xs font-semibold text-slate-800">
                    Mostrar en el Perfil de Tutores (Padres de Familia)
                  </span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={visibleDocentes}
                    onChange={(e) => setVisibleDocentes(e.target.checked)}
                    className="w-4 h-4 rounded text-teal-600"
                  />
                  <span className="text-xs font-semibold text-slate-800">
                    Mostrar en el Perfil de Docentes (Profesores)
                  </span>
                </label>
              </div>

              <div className="pt-3 border-t flex items-center justify-between gap-2">
                {editingDay ? (
                  <button
                    type="button"
                    onClick={() => {
                      deleteCalendarDay(editingDay.id);
                      setIsModalOpen(false);
                    }}
                    className="px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Eliminar</span>
                  </button>
                ) : (
                  <div />
                )}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold text-xs"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl text-white font-bold text-xs shadow-sm cursor-pointer"
                    style={{ backgroundColor: primaryColor }}
                  >
                    Guardar en Calendario
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
