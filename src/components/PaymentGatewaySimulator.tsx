import React, { useState } from 'react';
import {
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  CreditCard,
  Building2,
  ShieldCheck,
  Zap,
  ArrowRight,
  Lock,
  Clock,
  X,
  RefreshCw,
  FlaskConical,
} from 'lucide-react';

export interface SimulatedPaymentSuccessDetails {
  metodo: 'Stripe (Tarjeta Demo)' | 'SPEI Instantáneo (Demo)' | 'Mercado Pago (Demo)';
  folio: string;
  transaccionId: string;
  autorizacion: string;
  fecha: string;
  detallesTexto: string;
}

interface PaymentGatewaySimulatorProps {
  monto: number;
  concepto: string;
  onSimulateSuccess: (details: SimulatedPaymentSuccessDetails) => void;
  onSimulateDeclined?: (errorMsg: string) => void;
  className?: string;
  compact?: boolean;
}

export const PaymentGatewaySimulator: React.FC<PaymentGatewaySimulatorProps> = ({
  monto,
  concepto,
  onSimulateSuccess,
  onSimulateDeclined,
  className = '',
  compact = false,
}) => {
  const [processingState, setProcessingState] = useState<
    'idle' | 'connecting' | 'authorizing' | 'approved' | 'declined' | '3ds_modal'
  >('idle');
  const [activeGateway, setActiveGateway] = useState<'stripe' | 'spei' | 'mercadopago'>('stripe');
  const [declinedReason, setDeclinedReason] = useState<string | null>(null);
  const [otpInput, setOtpInput] = useState('8391');

  const generateRandomAuth = () =>
    `AUTH-${Math.floor(100000 + Math.random() * 900000)}`;

  const generateRandomTxnId = (prefix: string) =>
    `${prefix}_demo_${Math.random().toString(36).substring(2, 10)}${Date.now().toString(36)}`;

  const handleRunImmediateApproval = (gateway: 'stripe' | 'mercadopago') => {
    setActiveGateway(gateway);
    setProcessingState('connecting');
    setDeclinedReason(null);

    setTimeout(() => {
      setProcessingState('authorizing');
    }, 450);

    setTimeout(() => {
      setProcessingState('approved');
      const auth = generateRandomAuth();
      const txn = generateRandomTxnId(gateway === 'stripe' ? 'ch' : 'mp');
      const methodLabel =
        gateway === 'stripe' ? 'Stripe (Tarjeta Demo)' : 'Mercado Pago (Demo)';
      const folio = `REC-DEMO-${Math.floor(1000 + Math.random() * 9000)}`;

      setTimeout(() => {
        setProcessingState('idle');
        onSimulateSuccess({
          metodo: methodLabel,
          folio,
          transaccionId: txn,
          autorizacion: auth,
          fecha: new Date().toISOString().split('T')[0],
          detallesTexto: `Transacción aprobada mediante pasarela de pago ${methodLabel}. ID: ${txn} · Autorización: ${auth}`,
        });
      }, 500);
    }, 1100);
  };

  const handleRunSpeiImmediate = () => {
    setActiveGateway('spei');
    setProcessingState('connecting');
    setDeclinedReason(null);

    setTimeout(() => {
      setProcessingState('authorizing');
    }, 400);

    setTimeout(() => {
      setProcessingState('approved');
      const trackingKey = `SPEI-BANXICO-${Date.now().toString().slice(-8)}`;
      const folio = `REC-SPEI-${Math.floor(1000 + Math.random() * 9000)}`;

      setTimeout(() => {
        setProcessingState('idle');
        onSimulateSuccess({
          metodo: 'SPEI Instantáneo (Demo)',
          folio,
          transaccionId: trackingKey,
          autorizacion: `STP-${Math.floor(100000 + Math.random() * 900000)}`,
          fecha: new Date().toISOString().split('T')[0],
          detallesTexto: `Transferencia SPEI conciliada vía Webhook STP/Banxico. Clave de rastreo: ${trackingKey}`,
        });
      }, 500);
    }, 950);
  };

  const handleRunDecline = () => {
    setProcessingState('declined');
    const msg =
      'Error en pasarela (Simulación): Tarjeta declinada por el banco emisor (Código 51: Fondos insuficientes / Operación no autorizada).';
    setDeclinedReason(msg);
    if (onSimulateDeclined) {
      onSimulateDeclined(msg);
    }
    setTimeout(() => {
      setProcessingState('idle');
    }, 5000);
  };

  const handleComplete3DS = () => {
    setProcessingState('approved');
    const auth = generateRandomAuth();
    const txn = generateRandomTxnId('ch_3ds');
    const folio = `REC-3DS-${Math.floor(1000 + Math.random() * 9000)}`;

    setTimeout(() => {
      setProcessingState('idle');
      onSimulateSuccess({
        metodo: 'Stripe (Tarjeta Demo)',
        folio,
        transaccionId: txn,
        autorizacion: auth,
        fecha: new Date().toISOString().split('T')[0],
        detallesTexto: `Pago autenticado con 3D Secure 2.0 y aprobado exitosamente. ID: ${txn}`,
      });
    }, 500);
  };

  return (
    <div
      className={`rounded-2xl border-2 border-purple-300 bg-gradient-to-br from-purple-50/90 via-indigo-50/50 to-white p-4 shadow-sm space-y-3 ${className}`}
    >
      {/* Header bar of the simulation widget */}
      <div className="flex items-center justify-between gap-2 border-b border-purple-200/80 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-purple-600 text-white flex items-center justify-center shadow-xs">
            <FlaskConical className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-black text-purple-950 uppercase tracking-wide">
                Simulador de Pasarela de Pagos
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-200 text-purple-900 border border-purple-300">
                Modo Prueba Activo
              </span>
            </div>
            <p className="text-[11px] text-purple-900/80 leading-tight">
              Botones automáticos para demostración a clientes sin cargos bancarios reales.
            </p>
          </div>
        </div>
      </div>

      {/* Processing overlay if running */}
      {processingState !== 'idle' && processingState !== '3ds_modal' && (
        <div className="p-3 rounded-xl bg-white border border-purple-200 shadow-xs flex items-center gap-3 animate-in fade-in">
          {processingState === 'connecting' && (
            <>
              <RefreshCw className="w-5 h-5 text-purple-600 animate-spin shrink-0" />
              <div className="text-xs">
                <span className="font-bold text-slate-800 block">
                  Conectando con la pasarela de pagos...
                </span>
                <span className="text-slate-500 font-mono text-[11px]">
                  POST https://api.{activeGateway}.com/v1/charges
                </span>
              </div>
            </>
          )}

          {processingState === 'authorizing' && (
            <>
              <Zap className="w-5 h-5 text-amber-500 animate-bounce shrink-0" />
              <div className="text-xs">
                <span className="font-bold text-amber-800 block">
                  Autorizando cargo de ${monto.toFixed(2)} MXN...
                </span>
                <span className="text-slate-500 text-[11px]">
                  Respuesta de red bancaria: 200 OK
                </span>
              </div>
            </>
          )}

          {processingState === 'approved' && (
            <>
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <div className="text-xs">
                <span className="font-bold text-emerald-800 block">
                  ¡Transacción autorizada exitosamente!
                </span>
                <span className="text-emerald-700 text-[11px]">
                  Generando comprobante digital oficial...
                </span>
              </div>
            </>
          )}

          {processingState === 'declined' && (
            <>
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
              <div className="text-xs">
                <span className="font-bold text-rose-800 block">
                  Transacción Declinada (Simulación)
                </span>
                <span className="text-rose-700 text-[11px]">{declinedReason}</span>
              </div>
            </>
          )}
        </div>
      )}

      {/* Declined alert box */}
      {declinedReason && processingState === 'idle' && (
        <div className="p-3 rounded-xl bg-rose-50 border border-rose-300 text-rose-900 text-xs flex items-start justify-between gap-2">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block">Respuesta de Pasarela: Pago Declinado</span>
              <p className="text-[11px] text-rose-800">{declinedReason}</p>
              <span className="text-[10px] text-slate-500 mt-1 block">
                Muestra al cliente cómo el sistema maneja declinaciones bancarias y orienta amigablemente al usuario.
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setDeclinedReason(null)}
            className="text-rose-400 hover:text-rose-700 p-0.5 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Action buttons grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
        {/* 1. Stripe Immediate Approval */}
        <button
          type="button"
          disabled={processingState !== 'idle'}
          onClick={() => handleRunImmediateApproval('stripe')}
          className="p-2.5 rounded-xl font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-all flex items-center justify-between gap-2 active:scale-98 cursor-pointer disabled:opacity-50"
        >
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-emerald-200 shrink-0" />
            <div className="text-left">
              <span className="block font-extrabold text-[11px] leading-tight">
                Simular Pago Aprobado
              </span>
              <span className="text-[10px] text-emerald-100 font-normal">
                Pasarela Stripe / Tarjetas
              </span>
            </div>
          </div>
          <span className="text-[10px] font-black bg-emerald-700 px-1.5 py-0.5 rounded">
            1-Clic
          </span>
        </button>

        {/* 2. SPEI Webhook Immediate Approval */}
        <button
          type="button"
          disabled={processingState !== 'idle'}
          onClick={handleRunSpeiImmediate}
          className="p-2.5 rounded-xl font-bold bg-sky-700 hover:bg-sky-800 text-white shadow-xs transition-all flex items-center justify-between gap-2 active:scale-98 cursor-pointer disabled:opacity-50"
        >
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-sky-200 shrink-0" />
            <div className="text-left">
              <span className="block font-extrabold text-[11px] leading-tight">
                Simular Transferencia SPEI
              </span>
              <span className="text-[10px] text-sky-100 font-normal">
                Webhook STP / Banxico
              </span>
            </div>
          </div>
          <span className="text-[10px] font-black bg-sky-900 px-1.5 py-0.5 rounded">
            Instantáneo
          </span>
        </button>

        {/* 3. 3D Secure / OTP SMS Simulation */}
        <button
          type="button"
          disabled={processingState !== 'idle'}
          onClick={() => setProcessingState('3ds_modal')}
          className="p-2.5 rounded-xl font-bold bg-purple-700 hover:bg-purple-800 text-white shadow-xs transition-all flex items-center justify-between gap-2 active:scale-98 cursor-pointer disabled:opacity-50"
        >
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-purple-200 shrink-0" />
            <div className="text-left">
              <span className="block font-extrabold text-[11px] leading-tight">
                Simular 3D Secure (OTP)
              </span>
              <span className="text-[10px] text-purple-100 font-normal">
                Verificación SMS bancaria
              </span>
            </div>
          </div>
          <ArrowRight className="w-3.5 h-3.5 text-purple-200" />
        </button>

        {/* 4. Declined / Insufficient Funds */}
        <button
          type="button"
          disabled={processingState !== 'idle'}
          onClick={handleRunDecline}
          className="p-2.5 rounded-xl font-bold bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-300 transition-all flex items-center justify-between gap-2 active:scale-98 cursor-pointer disabled:opacity-50"
        >
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <div className="text-left">
              <span className="block font-extrabold text-[11px] leading-tight">
                Simular Declinación
              </span>
              <span className="text-[10px] text-rose-600 font-normal">
                Fondos insuficientes
              </span>
            </div>
          </div>
          <span className="text-[10px] font-black bg-rose-200 px-1.5 py-0.5 rounded text-rose-900">
            Error 51
          </span>
        </button>
      </div>

      {/* 3DS Modal Simulation */}
      {processingState === '3ds_modal' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-6 space-y-4 border border-slate-200">
            <div className="flex items-center justify-between border-b pb-3 border-slate-100">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-indigo-600" />
                <div>
                  <h4 className="font-bold text-xs text-slate-900">
                    Verificación Bancaria 3D Secure
                  </h4>
                  <span className="text-[10px] text-slate-500 font-mono">
                    Banco Emisor · Visa Secure / Mastercard ID
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setProcessingState('idle')}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
              <div className="flex justify-between text-slate-600">
                <span>Comercio:</span>
                <strong className="text-slate-900">{concepto}</strong>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Monto a autorizar:</span>
                <strong className="text-slate-900 font-mono font-bold">
                  ${monto.toFixed(2)} MXN
                </strong>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Tarjeta:</span>
                <span className="font-mono">•••• •••• •••• 4242</span>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <label className="font-bold text-slate-800 block">
                Código de Seguridad SMS (Enviado al +52 55 **** 8210):
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  maxLength={6}
                  value={otpInput}
                  onChange={(e) => setOtpInput(e.target.value)}
                  className="flex-1 px-3 py-2 text-center text-lg font-mono font-black tracking-widest border border-indigo-300 rounded-xl bg-indigo-50/50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <p className="text-[11px] text-slate-500">
                Demostración: El código OTP ya viene prellenado (8391). Haz clic en autorizar para continuar.
              </p>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setProcessingState('idle')}
                className="flex-1 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleComplete3DS}
                className="flex-1 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs"
              >
                Validar y Autorizar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
