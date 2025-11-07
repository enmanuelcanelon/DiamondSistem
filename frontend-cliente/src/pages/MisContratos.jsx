import { useQuery } from '@tanstack/react-query';
import { FileText, Download, Calendar, DollarSign, Users, Clock } from 'lucide-react';
import useAuthStore from '@shared/store/useAuthStore';
import { generarNombreEventoCorto, getEventoEmoji } from '@utils/eventNames';
import api from '@shared/config/api';

function MisContratos() {
  const { user } = useAuthStore();

  // Obtener contrato principal
  const { data: contrato, isLoading } = useQuery({
    queryKey: ['contrato-cliente', user?.contrato_id],
    queryFn: async () => {
      const response = await api.get(`/contratos/${user?.contrato_id}`);
      return response.data.contrato;
    },
    enabled: !!user?.contrato_id,
  });

  // Obtener versiones del contrato
  const { data: versiones } = useQuery({
    queryKey: ['versiones-contrato-cliente', user?.contrato_id],
    queryFn: async () => {
      const response = await api.get(`/contratos/${user?.contrato_id}/versiones`);
      return response.data.versiones;
    },
    enabled: !!user?.contrato_id,
  });

  const handleDescargarContrato = async () => {
    try {
      const response = await api.get(`/contratos/${user.contrato_id}/pdf-contrato`, {
        responseType: 'blob',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Contrato-${generarNombreEventoCorto(contrato)}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error al descargar contrato:', error);
      alert('Error al descargar el contrato');
    }
  };

  const handleDescargarVersion = async (versionId, numeroVersion) => {
    try {
      const response = await api.get(`/contratos/${user.contrato_id}/versiones/${numeroVersion}/pdf`, {
        responseType: 'blob',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Contrato-Version-${numeroVersion}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error al descargar versión:', error);
      alert('Error al descargar la versión del contrato');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
          <p className="mt-4 text-gray-600">Cargando contratos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-gray-900 rounded-full flex items-center justify-center">
            <FileText className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Mis Contratos</h1>
            <p className="text-sm text-gray-600">Descarga y revisa tus documentos</p>
          </div>
        </div>
      </div>

      {/* Contrato Principal */}
      {contrato && (
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="bg-gray-900 p-6 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-4xl">{getEventoEmoji(contrato)}</span>
                <div>
                  <h2 className="text-xl font-bold">{generarNombreEventoCorto(contrato)}</h2>
                  <p className="text-sm text-gray-300">Contrato Actual</p>
                </div>
              </div>
              <button
                onClick={handleDescargarContrato}
                className="flex items-center gap-2 px-4 py-2 bg-white text-gray-900 rounded-lg hover:bg-gray-50 transition font-medium"
              >
                <Download className="w-4 h-4" />
                Descargar PDF
              </button>
            </div>
          </div>

          <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg">
              <Calendar className="w-8 h-8 text-blue-600" />
              <div>
                <p className="text-xs text-gray-600">Fecha del Evento</p>
                <p className="font-semibold text-gray-900">
                  {new Date(contrato.fecha_evento).toLocaleDateString('es-ES', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg">
              <Users className="w-8 h-8 text-green-600" />
              <div>
                <p className="text-xs text-gray-600">Invitados</p>
                <p className="font-semibold text-gray-900">{contrato.cantidad_invitados} personas</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
              <DollarSign className="w-8 h-8 text-gray-700" />
              <div>
                <p className="text-xs text-gray-600">Total</p>
                <p className="font-semibold text-gray-900">
                  ${parseFloat(contrato.total_contrato).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Versiones del Contrato */}
      {versiones && versiones.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">📜 Historial de Versiones</h3>
          <div className="space-y-3">
            {versiones.map((version, index) => (
              <div
                key={version.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border hover:bg-gray-100 transition"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                    <span className="text-gray-900 font-bold">V{version.version_numero}</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      Versión {version.version_numero}
                      {index === 0 && <span className="ml-2 text-xs text-green-600 font-semibold">(Actual)</span>}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-gray-600 mt-1">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(version.fecha_generacion).toLocaleDateString('es-ES')}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {version.cantidad_invitados} inv.
                      </span>
                      <span className="flex items-center gap-1">
                        <DollarSign className="w-3 h-3" />
                        ${parseFloat(version.total_contrato).toLocaleString()}
                      </span>
                    </div>
                    {version.motivo_cambio && (
                      <p className="text-xs text-gray-500 mt-1">
                        💬 {version.motivo_cambio}
                      </p>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => handleDescargarVersion(version.id, version.version_numero)}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-gray-900 hover:bg-gray-50 rounded-lg transition font-medium"
                >
                  <Download className="w-4 h-4" />
                  Descargar
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default MisContratos;

