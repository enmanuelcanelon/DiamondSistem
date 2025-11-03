import { useState } from 'react';
import { X, AlertTriangle, CheckCircle, DollarSign } from 'lucide-react';

function ModalConfirmacionPago({ isOpen, onClose, datosPago, contrato, onConfirm, loading }) {
  const [confirmacion1, setConfirmacion1] = useState(false);
  const [confirmacion2, setConfirmacion2] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (confirmacion1 && confirmacion2) {
      onConfirm();
    }
  };

  const resetearConfirmaciones = () => {
    setConfirmacion1(false);
    setConfirmacion2(false);
  };

  const handleClose = () => {
    resetearConfirmaciones();
    onClose();
  };

  const saldoPendienteActual = parseFloat(contrato?.saldo_pendiente || 0);
  const montoPago = parseFloat(datosPago.monto || 0);
  const nuevoSaldoPendiente = saldoPendienteActual - montoPago;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-600 to-amber-600 p-6 rounded-t-xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-7 h-7 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Confirmar Registro de Pago</h2>
              <p className="text-orange-100 text-sm">Revisa cuidadosamente antes de confirmar</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-lg transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {/* Resumen del Pago */}
          <div className="bg-gray-50 rounded-xl p-6 border-2 border-gray-200">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-green-600" />
              Resumen del Pago
            </h3>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center pb-2 border-b">
                <span className="text-gray-600">Monto:</span>
                <span className="text-2xl font-bold text-green-600">
                  ${parseFloat(datosPago.monto || 0).toFixed(2)}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-gray-600">Método de pago:</span>
                <span className="font-bold text-gray-900">{datosPago.metodo_pago}</span>
              </div>

              {datosPago.tipo_tarjeta && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Tipo de tarjeta:</span>
                  <span className="font-medium text-gray-700">{datosPago.tipo_tarjeta}</span>
                </div>
              )}

              {datosPago.numero_referencia && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Referencia:</span>
                  <span className="font-medium text-gray-700">{datosPago.numero_referencia}</span>
                </div>
              )}

              {datosPago.notas && (
                <div className="pt-2 border-t">
                  <span className="text-gray-600 block mb-1">Notas:</span>
                  <p className="text-sm text-gray-700 bg-white p-3 rounded-lg border">
                    {datosPago.notas}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Estado del Contrato */}
          <div className="bg-blue-50 rounded-xl p-6 border-2 border-blue-200">
            <h3 className="text-lg font-bold text-blue-900 mb-4">Estado del Contrato</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-blue-700 mb-1">Total del Contrato:</p>
                <p className="text-xl font-bold text-blue-900">
                  ${parseFloat(contrato?.total_contrato || 0).toFixed(2)}
                </p>
              </div>

              <div>
                <p className="text-sm text-blue-700 mb-1">Total Pagado:</p>
                <p className="text-xl font-bold text-blue-900">
                  ${parseFloat(contrato?.total_pagado || 0).toFixed(2)}
                </p>
              </div>

              <div>
                <p className="text-sm text-blue-700 mb-1">Saldo Actual:</p>
                <p className="text-xl font-bold text-orange-600">
                  ${saldoPendienteActual.toFixed(2)}
                </p>
              </div>

              <div className="bg-white rounded-lg p-3 border-2 border-green-400">
                <p className="text-sm text-green-700 mb-1 font-medium">Nuevo Saldo:</p>
                <p className="text-2xl font-bold text-green-600">
                  ${nuevoSaldoPendiente.toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          {/* Advertencia si el monto excede el saldo */}
          {montoPago > saldoPendienteActual && (
            <div className="bg-red-50 border-2 border-red-300 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-red-900 mb-1">⚠️ Atención: Monto Excedido</p>
                  <p className="text-sm text-red-800">
                    El monto del pago (${montoPago.toFixed(2)}) es mayor al saldo pendiente 
                    (${saldoPendienteActual.toFixed(2)}). El contrato quedará con saldo negativo.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Checkboxes de Confirmación */}
          <div className="space-y-3 bg-yellow-50 p-4 rounded-xl border-2 border-yellow-200">
            <p className="font-bold text-yellow-900 mb-3">
              ⚠️ Confirma que toda la información es correcta:
            </p>

            <label className="flex items-start gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={confirmacion1}
                onChange={(e) => setConfirmacion1(e.target.checked)}
                className="mt-1 w-5 h-5 text-orange-600 border-2 border-gray-300 rounded focus:ring-2 focus:ring-orange-500"
              />
              <span className="text-sm text-gray-900 group-hover:text-gray-700">
                Confirmo que el <strong>monto ${parseFloat(datosPago.monto || 0).toFixed(2)}</strong> y el 
                <strong> método de pago "{datosPago.metodo_pago}"</strong> son correctos
              </span>
            </label>

            <label className="flex items-start gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={confirmacion2}
                onChange={(e) => setConfirmacion2(e.target.checked)}
                className="mt-1 w-5 h-5 text-orange-600 border-2 border-gray-300 rounded focus:ring-2 focus:ring-orange-500"
              />
              <span className="text-sm text-gray-900 group-hover:text-gray-700">
                Entiendo que este pago quedará registrado y <strong>podré anularlo</strong> posteriormente 
                si es necesario
              </span>
            </label>
          </div>

          {/* Advertencia final */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>💡 Nota:</strong> Si cometes un error, podrás anular este pago desde la lista de pagos 
              registrados y se revertirán automáticamente los montos del contrato.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 bg-gray-50 rounded-b-xl flex gap-4">
          <button
            onClick={handleClose}
            disabled={loading}
            className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-medium disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={!confirmacion1 || !confirmacion2 || loading}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-orange-600 to-amber-600 text-white rounded-lg hover:from-orange-700 hover:to-amber-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Registrando...
              </>
            ) : (
              <>
                <CheckCircle className="w-5 h-5" />
                Confirmar y Registrar Pago
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ModalConfirmacionPago;



