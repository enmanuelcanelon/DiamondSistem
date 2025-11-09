import { useState, useEffect } from 'react';
import { X, Calendar, DollarSign, CreditCard, Check, Loader2 } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import api from '../config/api';

function ModalPlanPago({ isOpen, onClose, onConfirm, totalContrato, ofertaId, clienteId }) {
  const [tipoPago, setTipoPago] = useState('unico'); // 'unico' o 'plazos'
  const [numeroPlazos, setNumeroPlazos] = useState(6);
  const [planGenerado, setPlanGenerado] = useState(null);
  const [pagoReservaRegistrado, setPagoReservaRegistrado] = useState(null);
  const [mostrarFormularioPago, setMostrarFormularioPago] = useState(true);
  const [formPagoReserva, setFormPagoReserva] = useState({
    monto: 500,
    metodo_pago: 'Efectivo',
    tipo_tarjeta: '',
    numero_referencia: '',
    notas: ''
  });

  // Mutation para registrar pago de reserva
  const registrarPagoReservaMutation = useMutation({
    mutationFn: async (datosPago) => {
      const response = await api.post('/pagos/reserva', {
        oferta_id: ofertaId,
        cliente_id: clienteId,
        ...datosPago
      });
      return response.data;
    },
    onSuccess: (data) => {
      setPagoReservaRegistrado(data.pago);
      setMostrarFormularioPago(false);
    },
    onError: (error) => {
      alert(error.response?.data?.message || 'Error al registrar el pago de reserva');
    }
  });

  useEffect(() => {
    if (tipoPago === 'plazos') {
      generarPlanPagos();
    } else {
      setPlanGenerado(null);
    }
  }, [tipoPago, numeroPlazos, totalContrato, pagoReservaRegistrado]);

  // Resetear estado cuando se abre el modal
  useEffect(() => {
    if (isOpen) {
      setPagoReservaRegistrado(null);
      setMostrarFormularioPago(true);
      setFormPagoReserva({
        monto: 500,
        metodo_pago: 'Efectivo',
        tipo_tarjeta: '',
        numero_referencia: '',
        notas: ''
      });
    }
  }, [isOpen]);

  const generarPlanPagos = () => {
    const total = parseFloat(totalContrato);
    
    // Depósito de reserva (se resta del total)
    const depositoReserva = pagoReservaRegistrado ? parseFloat(pagoReservaRegistrado.monto_total || pagoReservaRegistrado.monto) : 500;
    
    // Total restante después de la reserva
    const totalRestante = total - depositoReserva;
    
    // Pagos obligatorios sobre el total restante
    const pagoInicial = Math.min(1000, totalRestante);
    
    // Saldo restante después del pago inicial
    const saldoRestante = totalRestante - pagoInicial;
    
    if (saldoRestante <= 0) {
      // Si el total restante es menor que el pago inicial, solo cobrar el total restante
      setPlanGenerado({
        depositoReserva,
        pagoInicial: Math.min(pagoInicial, totalRestante),
        pagos: [],
        totalContrato: total,
        totalRestante: totalRestante,
        totalConDeposito: total
      });
      return;
    }
    
    // Calcular pagos mensuales
    const montoMensual = Math.max(500, Math.ceil(saldoRestante / numeroPlazos));
    const pagos = [];
    let saldoPendiente = saldoRestante;
    
    for (let i = 0; i < numeroPlazos; i++) {
      const esUltimoPago = i === numeroPlazos - 1;
      const montoPago = esUltimoPago ? saldoPendiente : Math.min(montoMensual, saldoPendiente);
      
      pagos.push({
        numero: i + 1,
        monto: montoPago,
        descripcion: `Pago mensual ${i + 1} de ${numeroPlazos}`
      });
      
      saldoPendiente -= montoPago;
      
      if (saldoPendiente <= 0) break;
    }
    
    setPlanGenerado({
      depositoReserva,
      pagoInicial,
      pagos,
      totalContrato: total,
      totalRestante: totalRestante,
      totalConDeposito: total
    });
  };

  const handleRegistrarPagoReserva = () => {
    if (formPagoReserva.monto < 500) {
      alert('El pago de reserva debe ser de al menos $500');
      return;
    }

    if (formPagoReserva.metodo_pago === 'Tarjeta' && !formPagoReserva.tipo_tarjeta) {
      alert('Debe seleccionar el tipo de tarjeta');
      return;
    }

    registrarPagoReservaMutation.mutate(formPagoReserva);
  };

  const handleConfirm = () => {
    if (!pagoReservaRegistrado) {
      alert('Debe registrar el pago de reserva primero');
      return;
    }

    if (tipoPago === 'unico') {
      onConfirm({
        tipo_pago: 'unico',
        plan_pagos: null,
        pago_reserva_id: pagoReservaRegistrado.id
      });
    } else {
      onConfirm({
        tipo_pago: 'plazos',
        numero_plazos: numeroPlazos,
        plan_pagos: planGenerado,
        pago_reserva_id: pagoReservaRegistrado.id
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-green-600 to-emerald-600 text-white p-6 rounded-t-xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
              <CreditCard className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Plan de Pago</h2>
              <p className="text-sm text-green-100">Selecciona cómo deseas realizar el pago</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Contenido */}
        <div className="p-6 space-y-6">
          {/* Total del Contrato */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-6">
            <div className="text-center mb-4">
              <p className="text-sm text-gray-600 mb-1">Total del Contrato</p>
              <p className="text-4xl font-bold text-gray-900">
                ${parseFloat(totalContrato).toLocaleString()}
              </p>
            </div>
            {pagoReservaRegistrado && (
            <div className="border-t border-blue-300 pt-3">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-gray-600">💎 Pago de Reserva:</span>
                  <span className="font-bold text-green-700">
                    -${parseFloat(pagoReservaRegistrado.monto_total || pagoReservaRegistrado.monto).toLocaleString()}
                  </span>
                </div>
              <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 font-semibold">Total Restante:</span>
                  <span className="font-bold text-indigo-700 text-lg">
                    ${(parseFloat(totalContrato) - parseFloat(pagoReservaRegistrado.monto_total || pagoReservaRegistrado.monto)).toLocaleString()}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Formulario de Pago de Reserva */}
          {mostrarFormularioPago && !pagoReservaRegistrado && (
            <div className="bg-amber-50 border-2 border-amber-300 rounded-xl p-6 space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-amber-500 rounded-full flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Pago de Reserva</h3>
                  <p className="text-sm text-gray-600">Registre el pago de reserva de $500 antes de crear el contrato</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Monto *
                  </label>
                  <input
                    type="number"
                    min="500"
                    step="0.01"
                    value={formPagoReserva.monto}
                    onChange={(e) => setFormPagoReserva({ ...formPagoReserva, monto: parseFloat(e.target.value) || 500 })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">Mínimo $500</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Método de Pago *
                  </label>
                  <select
                    value={formPagoReserva.metodo_pago}
                    onChange={(e) => setFormPagoReserva({ ...formPagoReserva, metodo_pago: e.target.value, tipo_tarjeta: e.target.value === 'Tarjeta' ? '' : formPagoReserva.tipo_tarjeta })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    required
                  >
                    <option value="Efectivo">Efectivo</option>
                    <option value="Transferencia">Transferencia</option>
                    <option value="Zelle">Zelle</option>
                    <option value="Tarjeta">Tarjeta</option>
                    <option value="Cheque">Cheque</option>
                  </select>
                </div>

                {formPagoReserva.metodo_pago === 'Tarjeta' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tipo de Tarjeta *
                    </label>
                    <select
                      value={formPagoReserva.tipo_tarjeta}
                      onChange={(e) => setFormPagoReserva({ ...formPagoReserva, tipo_tarjeta: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                      required
                    >
                      <option value="">Seleccione...</option>
                      <option value="Visa">Visa</option>
                      <option value="MasterCard">MasterCard</option>
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Número de Referencia
                  </label>
                  <input
                    type="text"
                    value={formPagoReserva.numero_referencia}
                    onChange={(e) => setFormPagoReserva({ ...formPagoReserva, numero_referencia: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    placeholder="Opcional"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notas
                </label>
                <textarea
                  value={formPagoReserva.notas}
                  onChange={(e) => setFormPagoReserva({ ...formPagoReserva, notas: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  rows="2"
                  placeholder="Notas adicionales (opcional)"
                />
              </div>

              <button
                type="button"
                onClick={handleRegistrarPagoReserva}
                disabled={registrarPagoReservaMutation.isPending}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition font-semibold disabled:opacity-50"
              >
                {registrarPagoReservaMutation.isPending ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Registrando...
                  </>
                ) : (
                  <>
                    <Check className="w-5 h-5" />
                    Registrar Pago de Reserva
                  </>
                )}
              </button>
            </div>
          )}

          {/* Confirmación de Pago Registrado */}
          {pagoReservaRegistrado && (
            <div className="bg-green-50 border-2 border-green-300 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <Check className="w-6 h-6 text-green-600" />
                <div>
                  <p className="font-semibold text-green-900">Pago de Reserva Registrado</p>
                  <p className="text-sm text-green-700">
                    ${parseFloat(pagoReservaRegistrado.monto_total || pagoReservaRegistrado.monto).toLocaleString()} - {formPagoReserva.metodo_pago}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Opciones de Pago */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Pago Único */}
            <button
              type="button"
              onClick={() => setTipoPago('unico')}
              className={`p-6 border-2 rounded-xl transition-all text-left ${
                tipoPago === 'unico'
                  ? 'border-green-500 bg-green-50 shadow-md'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-green-600" />
                </div>
                {tipoPago === 'unico' && (
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                )}
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Pago Único</h3>
              <p className="text-sm text-gray-600">
                Paga el total del contrato de una sola vez
              </p>
            </button>

            {/* Pago en Plazos */}
            <button
              type="button"
              onClick={() => setTipoPago('plazos')}
              className={`p-6 border-2 rounded-xl transition-all text-left ${
                tipoPago === 'plazos'
                  ? 'border-blue-500 bg-blue-50 shadow-md'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-blue-600" />
                </div>
                {tipoPago === 'plazos' && (
                  <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                )}
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Pago en Plazos</h3>
              <p className="text-sm text-gray-600">
                Divide el pago en cuotas mensuales (hasta 12 meses)
              </p>
            </button>
          </div>

          {/* Configuración de Plazos */}
          {tipoPago === 'plazos' && (
            <div className="bg-white border-2 border-blue-200 rounded-xl p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Número de Plazos (meses)
                </label>
                <input
                  type="range"
                  min="2"
                  max="12"
                  value={numeroPlazos}
                  onChange={(e) => setNumeroPlazos(parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>2 meses</span>
                  <span className="font-bold text-blue-600 text-lg">{numeroPlazos} meses</span>
                  <span>12 meses</span>
                </div>
              </div>

              {/* Plan de Pagos Generado */}
              {planGenerado && (
                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-900 text-center mb-4">
                    📋 Plan de Pagos Detallado
                  </h4>

                  {/* Pagos Iniciales */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-3 bg-amber-50 border border-amber-300 rounded-lg">
                      <div>
                        <p className="font-semibold text-gray-900">💎 Depósito de Reserva</p>
                        <p className="text-xs text-amber-700">⚠️ Adicional - No reembolsable</p>
                      </div>
                      <span className="font-bold text-amber-700">
                        +${planGenerado.depositoReserva.toLocaleString()}
                      </span>
                    </div>

                    {planGenerado.pagoInicial > 0 && (
                      <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <div>
                          <p className="font-semibold text-gray-900">💳 Pago Inicial</p>
                          <p className="text-xs text-gray-600">Dentro de 10 días después de reservar</p>
                        </div>
                        <span className="font-bold text-blue-700">
                          ${planGenerado.pagoInicial.toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Pagos Mensuales */}
                  {planGenerado.pagos.length > 0 && (
                    <div className="space-y-2 mt-4">
                      <p className="text-sm font-medium text-gray-700 mb-2">
                        📅 Pagos Mensuales:
                      </p>
                      <div className="max-h-48 overflow-y-auto space-y-2 pr-2">
                        {planGenerado.pagos.map((pago, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm"
                          >
                            <span className="text-gray-700">{pago.descripcion}</span>
                            <span className="font-semibold text-gray-900">
                              ${pago.monto.toLocaleString()}
                            </span>
                          </div>
                        ))}
                      </div>
                      
                      {/* Subtotal de Pagos Mensuales */}
                      <div className="flex items-center justify-between p-2 bg-gray-100 border border-gray-300 rounded-lg text-sm mt-2">
                        <span className="text-gray-700 font-medium">Subtotal Pagos Mensuales:</span>
                        <span className="font-bold text-gray-900">
                          ${planGenerado.pagos.reduce((sum, p) => sum + p.monto, 0).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Total General */}
                  <div className="mt-4 pt-4 border-t-2 border-gray-300 space-y-3">
                    {/* Total del Contrato */}
                    <div className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-300 rounded-lg">
                      <span className="text-base font-bold text-gray-900">Total del Contrato:</span>
                      <span className="text-xl font-bold text-indigo-700">
                        ${parseFloat(planGenerado.totalContrato).toLocaleString()}
                      </span>
                    </div>
                    
                    {/* Total Final */}
                    <div className="flex items-center justify-between p-4 bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-400 rounded-lg">
                      <div>
                        <span className="text-lg font-bold text-gray-900">💰 TOTAL RESTANTE:</span>
                        <p className="text-xs text-gray-600 mt-1">(Después del pago de reserva)</p>
                      </div>
                      <span className="text-2xl font-bold text-amber-700">
                        ${parseFloat(planGenerado.totalRestante).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Advertencia */}
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mt-4">
                    <p className="text-xs text-amber-800">
                      ⚠️ <strong>Importante:</strong> El pago completo debe estar al menos 15 días hábiles antes del evento.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Términos y Condiciones */}
          <div className="bg-gray-50 rounded-lg p-4 text-xs text-gray-600 space-y-2">
            <p className="font-semibold text-gray-900">📜 Términos de Pago:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>El depósito de $500 es no reembolsable</li>
              <li>Pagos mensuales mínimos de $500</li>
              <li>Pago completo requerido 15 días antes del evento</li>
              <li>Visa y MasterCard aceptadas hasta 30 días antes (cargo 3.8%)</li>
              <li>American Express no aceptado</li>
              <li>Todos los pagos son no reembolsables</li>
            </ul>
          </div>

          {/* Botones */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleConfirm}
              disabled={!pagoReservaRegistrado}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-semibold text-lg shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Check className="w-5 h-5" />
              {pagoReservaRegistrado ? 'Confirmar y Crear Contrato' : 'Registre el pago de reserva primero'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ModalPlanPago;

