import { PlatformFeeConfig, FeeCalculationResult, CollegePlatformFeeRate } from '../types';

export const DEFAULT_PLATFORM_FEE_CONFIG: PlatformFeeConfig = {
  activa: true,
  nombreComision: 'Comisión por Uso de Plataforma My College',
  porcentajeComision: 4.5,
  incluirMontoFijo: true,
  montoFijoAdicional: 5.0,
  comisionesPorColegio: {},
  tipoCobroDefecto: 'porcentaje',
  valorDefecto: 4.5,
  reglas: [],
  conceptosAfectados: [
    'Inscripciones',
    'Reinscripciones',
    'Colegiaturas Mensuales',
    'Anualidades',
    'Libros y Material Didáctico',
    'Uniformes',
    'Exámenes Extraordinarios',
    'Cuotas de Eventos',
  ],
  mostrarDesgloseEnComprobante: true,
  actualizadoEn: new Date().toISOString().split('T')[0],
};

/**
 * Resolves the effective rate (percentage + optional fixed amount) for a given college or global default.
 */
export function getCollegeEffectiveFeeRate(
  config: PlatformFeeConfig = DEFAULT_PLATFORM_FEE_CONFIG,
  collegeId?: string | null
): CollegePlatformFeeRate {
  const customCollegeRate =
    collegeId && config.comisionesPorColegio ? config.comisionesPorColegio[collegeId] : undefined;

  if (customCollegeRate) {
    return {
      porcentaje: Number(customCollegeRate.porcentaje ?? 4.5),
      incluirMontoFijo: Boolean(customCollegeRate.incluirMontoFijo),
      montoFijo: Number(customCollegeRate.montoFijo ?? 0),
    };
  }

  return {
    porcentaje: Number(config.porcentajeComision ?? config.valorDefecto ?? 4.5),
    incluirMontoFijo: config.incluirMontoFijo ?? true,
    montoFijo: Number(config.montoFijoAdicional ?? 5.0),
  };
}

/**
 * Formats the human-readable commission label, e.g. "4.5% + $5.00 pesos" or "4.5%".
 */
export function formatPlatformFeeLegend(
  config: PlatformFeeConfig = DEFAULT_PLATFORM_FEE_CONFIG,
  collegeId?: string | null
): string {
  if (!config.activa) {
    return '0% (Sin comisión activa)';
  }
  const rate = getCollegeEffectiveFeeRate(config, collegeId);
  const pctStr = `${rate.porcentaje}%`;
  if (rate.incluirMontoFijo && rate.montoFijo > 0) {
    return `${pctStr} + $${rate.montoFijo.toFixed(2)} pesos`;
  }
  return pctStr;
}

/**
 * Calculates the platform commission fee for any base amount according to the configured percentage + optional fixed amount.
 */
export function calculatePlatformFee(
  baseAmount: number,
  config: PlatformFeeConfig = DEFAULT_PLATFORM_FEE_CONFIG,
  collegeId?: string | null
): FeeCalculationResult {
  const safeBase = Math.max(0, baseAmount || 0);

  if (!config.activa) {
    return {
      montoBase: safeBase,
      comisionMonto: 0,
      montoTotal: safeBase,
      reglaAplicadaNombre: 'Comisión inactiva',
      tipoCobro: 'porcentaje',
      valorRegla: 0,
      porcentajeAplicado: 0,
      montoFijoAplicado: 0,
      etiquetaComision: '0%',
      activa: false,
    };
  }

  const rate = getCollegeEffectiveFeeRate(config, collegeId);
  const porcentajeMonto = (safeBase * (rate.porcentaje / 100));
  const fijoMonto = rate.incluirMontoFijo && rate.montoFijo > 0 ? rate.montoFijo : 0;
  const comisionTotal = Math.round((porcentajeMonto + fijoMonto) * 100) / 100;
  const etiqueta = formatPlatformFeeLegend(config, collegeId);

  return {
    montoBase: safeBase,
    comisionMonto: comisionTotal,
    montoTotal: Math.round((safeBase + comisionTotal) * 100) / 100,
    reglaAplicadaNombre: etiqueta,
    tipoCobro: 'porcentaje',
    valorRegla: rate.porcentaje,
    porcentajeAplicado: rate.porcentaje,
    montoFijoAplicado: fijoMonto,
    etiquetaComision: etiqueta,
    activa: true,
  };
}
