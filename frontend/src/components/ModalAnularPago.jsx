import { useState } from 'react';
import { X, AlertTriangle, Ban, DollarSign } from 'lucide-react';

function ModalAnularPago({ isOpen, onClose, pago, contrato, onConfirm, loading }) {
  const [motivo, setMotivo] = useState('');
  const [confirmacion, setConfirmacion] = useState(false);

  if (!isOpen || !pago) return null;

  const handleConfirm = () => {
    if (confirmacion && motivo.trim()) {
      onConfirm(pago.id, motivo);
    }
  };

  const handleClose = () => {
    setMotivo('');
    setConfirmacion(false);
    onClose();
  };

  const saldoPendienteActual = parseFloat(contrato?.saldo_pendiente || 0);
  const montoPago = parseFloat(pago.monto_total || 0);
  const nuevoSaldoPendiente = saldoPendienteActual + montoPago;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-600 to-pink-600 p-6 rounded-t-xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
              <Ban className="w-7 h-7 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Anular Pago</h2>
              <p className="text-red-100 text-sm">Esta acción revertirá el pago del contrato</p>
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
          {/* Info del Pago a Anular */}
          <div className="bg-red-50 rounded-xl p-6 border-2 border-red-200">
            <h3 className="text-lg font-bold text-red-900 mb-4 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-red-600" />
              Pago a Anular
            </h3>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center pb-2 border-b border-red-200">
                <span className="text-red-700">Monto:</span>
                <span className="text-2xl font-bold text-red-600">
                  ${parseFloat(pago.monto_total || 0).toFixed(2)}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-red-700">Método de pago:</span>
                <span className="font-bold text-red-900">{pago.metodo_pago}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-red-700">Fecha del pago:</span>
                <span className="font-medium text-red-900">
                  {new Date(pago.fecha_pago).toLocaleDateString('es-ES', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>

              {pago.numero_referencia && (
                <div className="flex justify-between items-center">
                  <span className="text-red-700">Referencia:</span>
                  <span className="font-medium text-red-900">{pago.numero_referencia}</span>
                </div>
              )}

              {pago.vendedores && (
                <div className="flex justify-between items-center pt-2 border-t border-red-200">
                  <span className="text-red-700">Registrado por:</span>
                  <span className="font-medium text-red-900">{pago.vendedores.nombre_completo}</span>
                </div>
              )}
            </div>
          </div>

          {/* Impacto en el Contrato */}
          <div className="bg-orange-50 rounded-xl p-6 border-2 border-orange-200">
            <h3 className="text-lg font-bold text-orange-900 mb-4">
              Impacto en el Contrato
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-orange-700 mb-1">Saldo Actual:</p>
                <p className="text-xl font-bold text-orange-900">
                  ${saldoPendienteActual.toFixed(2)}
                </p>
              </div>

              <div className="bg-white rounded-lg p-3 border-2 border-red-400">
                <p className="text-sm text-red-700 mb-1 font-medium">Nuevo Saldo:</p>
                <p className="text-2xl font-bold text-red-600">
                  ${nuevoSaldoPendiente.toFixed(2)}
                </p>
                <p className="text-xs text-red-600 mt-1">
                  +${montoPago.toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          {/* Advertencia */}
          <div className="bg-yellow-50 border-2 border-yellow-300 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-yellow-900 mb-1">⚠️ Advertencia Importante</p>
                <ul className="text-sm text-yellow-800 space-y-1">
                  <li>• Este pago será marcado como ANULADO</li>
                  <li>• El monto se restará del total pagado del contrato</li>
                  <li>• El saldo pendiente aumentará</li>
                  <li>• Esta acción quedará registrada en el sistema</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Motivo de la Anulación */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Motivo de la anulación: *
            </label>
            <textarea
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              rows={4}
              placeholder="Ej: Pago duplicado, monto incorrecto, error en el método de pago..."
              className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
              required
            />
            {!motivo.trim() && (
              <p className="text-xs text-red-600 mt-1">
                * El motivo es obligatorio para anular el pago
              </p>
            )}
          </div>

          {/* Checkbox de Confirmación */}
          <div className="bg-red-50 p-4 rounded-xl border-2 border-red-200">
            <label className="flex items-start gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={confirmacion}
                onChange={(e) => setConfirmacion(e.target.checked)}
                className="mt-1 w-5 h-5 text-red-600 border-2 border-gray-300 rounded focus:ring-2 focus:ring-red-500"
              />
              <span className="text-sm text-gray-900 group-hover:text-gray-700">
                <strong>Confirmo que quiero anular este pago de ${parseFloat(pago.monto_total || 0).toFixed(2)}</strong> 
                {' '}y entiendo que el saldo pendiente del contrato aumentará
              </span>
            </label>
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
            disabled={!confirmacion || !motivo.trim() || loading}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-red-600 to-pink-600 text-white rounded-lg hover:from-red-700 hover:to-pink-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Anulando...
              </>
            ) : (
              <>
                <Ban className="w-5 h-5" />
                Confirmar Anulación
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ModalAnularPago;



