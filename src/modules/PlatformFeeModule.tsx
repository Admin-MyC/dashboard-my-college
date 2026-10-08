import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  Percent,
  DollarSign,
  CheckCircle2,
  Save,
  Calculator,
  Building2,
  Globe,
  RotateCcw,
} from 'lucide-react';
import { PlatformFeeConfig, CollegePlatformFeeRate } from '../types';
import {
  calculatePlatformFee,
  getCollegeEffectiveFeeRate,
  formatPlatformFeeLegend,
} from '../utils/feeCalculator';

export const PlatformFeeModule: React.FC = () => {
  const {
    platformFeeConfig,
    updatePlatformFeeConfig,
    colleges,
    activeCollege,
    selectedCollegeId,
  } = useApp();

  const [config, setConfig] = useState<PlatformFeeConfig>(() => ({
    ...platformFeeConfig,
    porcentajeComision: platformFeeConfig.porcentajeComision ?? 4.5,
    incluirMontoFijo: platformFeeConfig.incluirMontoFijo ?? true,
    montoFijoAdicional: platformFeeConfig.montoFijoAdicional ?? 5.0,
    comisionesPorColegio: platformFeeConfig.comisionesPorColegio || {},
  }));

  // Target college selector: 'global' or a specific college ID
  const [targetCollegeId, setTargetCollegeId] = useState<string>(() => {
    if (selectedCollegeId) return selectedCollegeId;
    if (activeCollege?.id) return activeCollege.id;
    return 'global';
  });

  useEffect(() => {
    if (selectedCollegeId) {
      setTargetCollegeId(selectedCollegeId);
    }
  }, [selectedCollegeId]);

  const effectiveCollegeId = targetCollegeId === 'global' ? null : targetCollegeId;
  const selectedCollegeObj = colleges.find((c) => c.id === effectiveCollegeId) || null;

  // Resolve current edited rate (either for the selected college or global)
  const currentRate = getCollegeEffectiveFeeRate(config, effectiveCollegeId);

  const handleUpdateRate = (updates: Partial<CollegePlatformFeeRate>) => {
    const nextRate: CollegePlatformFeeRate = {
      ...currentRate,
      ...updates,
    };

    if (!effectiveCollegeId) {
      // Editing global rate
      setConfig((prev) => ({
        ...prev,
        porcentajeComision: nextRate.porcentaje,
        incluirMontoFijo: nextRate.incluirMontoFijo,
        montoFijoAdicional: nextRate.montoFijo,
        valorDefecto: nextRate.porcentaje,
      }));
    } else {
      // Editing specific college rate
      setConfig((prev) => ({
        ...prev,
        comisionesPorColegio: {
          ...(prev.comisionesPorColegio || {}),
          [effectiveCollegeId]: nextRate,
        },
      }));
    }
  };

  const handleResetCollegeToGlobal = () => {
    if (!effectiveCollegeId) return;
    setConfig((prev) => {
      const nextMap = { ...(prev.comisionesPorColegio || {}) };
      delete nextMap[effectiveCollegeId];
      return {
        ...prev,
        comisionesPorColegio: nextMap,
      };
    });
  };

  const [saveSuccess, setSaveSuccess] = useState(false);

  // Simulator state
  const [simulatedAmount, setSimulatedAmount] = useState<number>(3500);

  const simulationResult = calculatePlatformFee(simulatedAmount, config, effectiveCollegeId);
  const currentLegend = formatPlatformFeeLegend(config, effectiveCollegeId);

  const handleSaveConfig = () => {
    updatePlatformFeeConfig({
      ...config,
      reglas: [],
      actualizadoEn: new Date().toISOString().split('T')[0],
    });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const hasCustomCollegeRate = Boolean(
    effectiveCollegeId && config.comisionesPorColegio?.[effectiveCollegeId]
  );

  return (
    <div className="space-y-6 animate-in fade-in max-w-6xl mx-auto">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-[#07192F] via-[#0B2545] to-[#133966] rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-amber-500/20 flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 text-xs font-bold uppercase tracking-wider">
            <Percent className="w-3.5 h-3.5" />
            <span>Configuración Global de Superusuario</span>
          </div>
          <h1 className="font-display font-black text-2xl sm:text-3xl tracking-tight text-white">
            Comisiones por Uso de Plataforma
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
            Configura el porcentaje de comisión y opcionalmente agrega una cantidad fija en pesos (ejemplo: <strong>4.5% + $5.00 pesos</strong>) aplicable a los cobros de los colegios.
          </p>
        </div>
      </div>

      {/* Action Buttons Bar (Below Header) */}
      <div className="flex flex-wrap items-center justify-end gap-2.5">
        {hasCustomCollegeRate && (
          <button
            type="button"
            onClick={handleResetCollegeToGlobal}
            className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1.5 shadow-2xs cursor-pointer"
          >
            <RotateCcw className="w-4 h-4 text-slate-500" />
            <span>Usar Comisión Global en este Colegio</span>
          </button>
        )}
        <button
          type="button"
          onClick={handleSaveConfig}
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#DFB743] via-[#C59B27] to-[#B68C1C] hover:from-[#E8C252] hover:to-[#A37B14] text-[#0B2545] font-extrabold text-xs sm:text-sm shadow-sm transition-all active:scale-98 flex items-center justify-center gap-2 cursor-pointer"
        >
          <Save className="w-4 h-4" />
          <span>Guardar Comisión Vigente</span>
        </button>
      </div>

      {saveSuccess && (
        <div className="p-4 bg-emerald-100 border-2 border-emerald-400 rounded-2xl text-xs font-bold text-emerald-950 flex items-center gap-2 shadow-xs animate-in zoom-in-95">
          <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0" />
          <span>
            ¡La comisión ({currentLegend}) se guardó y actualizó en el módulo de Cobros y pagos escolares!
          </span>
        </div>
      )}

      {/* College / Global Scope Selector */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {selectedCollegeObj ? (
            selectedCollegeObj.escudoUrl ? (
              <img
                src={selectedCollegeObj.escudoUrl}
                alt={selectedCollegeObj.nombre}
                className="w-11 h-11 rounded-xl object-contain p-1 bg-white border border-slate-200"
              />
            ) : null
          ) : (
            <div className="w-11 h-11 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center">
              <Globe className="w-5 h-5 text-[#0B2545]" />
            </div>
          )}
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              Ámbito de Configuración de la Comisión:
            </span>
            <h3 className="font-display font-bold text-sm sm:text-base text-slate-900">
              {selectedCollegeObj
                ? `${selectedCollegeObj.nombre} (${
                    hasCustomCollegeRate ? 'Comisión Personalizada' : 'Usa Comisión Global'
                  })`
                : 'Tarifa General para Todos los Colegios'}
            </h3>
          </div>
        </div>

        <select
          value={targetCollegeId}
          onChange={(e) => setTargetCollegeId(e.target.value)}
          className="px-4 py-2.5 rounded-xl border border-slate-300 bg-slate-50 text-xs font-bold text-slate-800 cursor-pointer focus:outline-none focus:ring-2 focus:ring-amber-500"
        >
          <option value="global">🌐 Tarifa Global (Todos los Colegios)</option>
          {colleges.map((col) => (
            <option key={col.id} value={col.id}>
              🏫 {col.nombre}
            </option>
          ))}
        </select>
      </div>

      {/* Main Grid: Settings & Live Simulator */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 cols): Percentage + Optional Fixed Amount Configuration */}
        <div className="lg:col-span-2 space-y-6">
          {/* Master Switch & Name Card */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-2xs space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="space-y-0.5">
                <h3 className="font-display font-bold text-base text-slate-900">
                  Estado de la Comisión de Plataforma
                </h3>
                <p className="text-xs text-slate-500">
                  Activa o desactiva la aplicación automática de comisiones en los cobros
                </p>
              </div>

              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.activa}
                  onChange={(e) => setConfig({ ...config, activa: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
            </div>

            <div className="text-xs">
              <label className="font-bold text-slate-700 block mb-1.5">
                Nombre Público de la Comisión:
              </label>
              <input
                type="text"
                value={config.nombreComision}
                onChange={(e) => setConfig({ ...config, nombreComision: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
                placeholder="Ej. Comisión por Uso de Plataforma"
              />
            </div>

            {/* Percentage + Optional Fixed Amount Formula Configurator */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-5">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <h4 className="font-display font-bold text-sm text-slate-900 flex items-center gap-2">
                    <Percent className="w-4 h-4 text-amber-600" />
                    <span>Esquema de Comisión: Porcentaje + Cantidad Fija (Opcional)</span>
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Define el porcentaje sobre el cobro y activa si deseas sumar una cantidad fija en pesos.
                  </p>
                </div>

                <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-950 border border-amber-300 font-mono font-black text-xs">
                  Vigente: {currentLegend}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* 1. Percentage Input */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-2">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Percent className="w-3.5 h-3.5 text-blue-600" />
                    <span>1. Comisión en Porcentaje (%)</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      value={currentRate.porcentaje}
                      onChange={(e) =>
                        handleUpdateRate({
                          porcentaje: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="w-full pl-4 pr-10 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono font-black text-base text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 font-black text-slate-500">
                      %
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Ejemplo: <strong>4.5%</strong> sobre el precio del concepto.
                  </p>
                </div>

                {/* 2. Optional Fixed Amount Input */}
                <div
                  className={`p-4 rounded-2xl border transition-all space-y-2 ${
                    currentRate.incluirMontoFijo
                      ? 'bg-white border-amber-300 shadow-2xs'
                      : 'bg-slate-100/70 border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <DollarSign className="w-3.5 h-3.5 text-amber-600" />
                      <span>2. Cantidad Fija Adicional (Opcional)</span>
                    </label>
                    <input
                      type="checkbox"
                      checked={currentRate.incluirMontoFijo}
                      onChange={(e) =>
                        handleUpdateRate({ incluirMontoFijo: e.target.checked })
                      }
                      className="w-4 h-4 accent-amber-600 rounded cursor-pointer"
                    />
                  </div>

                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-black text-slate-400">
                      +$
                    </span>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      disabled={!currentRate.incluirMontoFijo}
                      value={currentRate.montoFijo}
                      onChange={(e) =>
                        handleUpdateRate({
                          montoFijo: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="w-full pl-9 pr-14 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono font-black text-base text-slate-900 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500">
                      pesos
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    {currentRate.incluirMontoFijo
                      ? `Se suman $${currentRate.montoFijo.toFixed(2)} pesos fijos al porcentaje.`
                      : 'Casilla desactivada: solo se cobrará el porcentaje.'}
                  </p>
                </div>
              </div>

              {/* Quick Formula Presets */}
              <div className="pt-2 border-t border-slate-200/80 flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-bold text-slate-500">Ejemplos rápidos:</span>
                {[
                  { label: '4.5% + $5.00 pesos', pct: 4.5, fijo: true, monto: 5.0 },
                  { label: '3.5% + $3.00 pesos', pct: 3.5, fijo: true, monto: 3.0 },
                  { label: '4.5% (Solo porcentaje)', pct: 4.5, fijo: false, monto: 0 },
                  { label: '5.0% + $5.00 pesos', pct: 5.0, fijo: true, monto: 5.0 },
                ].map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() =>
                      handleUpdateRate({
                        porcentaje: preset.pct,
                        incluirMontoFijo: preset.fijo,
                        montoFijo: preset.monto,
                      })
                    }
                    className="px-3 py-1.5 rounded-xl bg-white hover:bg-amber-50 border border-slate-200 hover:border-amber-300 text-xs font-bold text-slate-700 transition-colors cursor-pointer"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Preview of the exact legend shown in Cobros module */}
            <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 flex items-center justify-between gap-3">
              <div className="text-xs text-amber-950">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 block mb-0.5">
                  Leyenda visible en el módulo Cobros del colegio:
                </span>
                <p className="font-medium">
                  "Todo cobro genera una comisión de <strong>{currentLegend}</strong>"
                </p>
              </div>
              <Building2 className="w-5 h-5 text-amber-600 shrink-0" />
            </div>
          </div>
        </div>

        {/* Right Column (1 col): Live Interactive Simulator */}
        <div className="space-y-6">
          <div className="bg-gradient-to-b from-[#0B2545] to-[#133E6E] rounded-3xl p-6 text-white shadow-lg space-y-5 border border-slate-700">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-700/60">
              <Calculator className="w-5 h-5 text-amber-400" />
              <div>
                <h3 className="font-display font-bold text-base text-white">
                  Simulador de Comisión
                </h3>
                <span className="text-[11px] text-slate-300">
                  Cálculo en vivo con {currentLegend}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-amber-300 block">
                Precio del Concepto ($ MXN):
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                <input
                  type="number"
                  step="50"
                  min="0"
                  value={simulatedAmount}
                  onChange={(e) => setSimulatedAmount(parseFloat(e.target.value) || 0)}
                  className="w-full pl-8 pr-4 py-2.5 bg-white/10 rounded-xl border border-white/20 text-white font-mono font-bold text-lg focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>

              {/* Quick Preset Buttons */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {[150, 500, 1200, 3500, 4200].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setSimulatedAmount(amt)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold transition-colors cursor-pointer ${
                      simulatedAmount === amt
                        ? 'bg-amber-400 text-[#0B2545]'
                        : 'bg-white/10 hover:bg-white/20 text-slate-200'
                    }`}
                  >
                    ${amt}
                  </button>
                ))}
              </div>
            </div>

            {/* Simulation Breakdown Display */}
            <div className="p-4 rounded-2xl bg-white/10 border border-white/20 space-y-3">
              <div className="text-xs space-y-1.5">
                <div className="flex justify-between text-slate-300">
                  <span>Importe del Concepto:</span>
                  <span className="font-mono font-bold text-white">
                    ${simulationResult.montoBase.toLocaleString(undefined, { minimumFractionDigits: 2 })} MXN
                  </span>
                </div>

                <div className="flex justify-between items-center text-amber-300">
                  <div className="truncate pr-2">
                    <span className="font-bold">Comisión Aplicada:</span>
                    <span className="block text-[10px] text-amber-200 font-mono truncate">
                      {currentLegend}
                    </span>
                  </div>
                  <span className="font-mono font-black text-amber-300 text-sm shrink-0">
                    +${simulationResult.comisionMonto.toLocaleString(undefined, { minimumFractionDigits: 2 })} MXN
                  </span>
                </div>

                <div className="pt-2 border-t border-white/20 flex justify-between items-baseline">
                  <span className="font-extrabold text-sm text-white">Total con Comisión:</span>
                  <span className="font-display font-black text-xl text-emerald-300 font-mono">
                    ${simulationResult.montoTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })} MXN
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
