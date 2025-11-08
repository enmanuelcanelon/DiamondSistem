import { useQuery } from '@tanstack/react-query';
import { 
  FileText, 
  Download, 
  Calendar, 
  User, 
  DollarSign, 
  Users as UsersIcon, 
  Loader2,
  ArrowLeft,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import useAuthStore from '../../store/useAuthStore';
import api from '../../config/api';

function VersionesContrato() {
  const { user } = useAuthStore();
  const contratoId = user?.contrato_id;

  // Query para obtener todas las versiones
  const { data: versionesData, isLoading } = useQuery({
    queryKey: ['versiones-contrato', contratoId],
    queryFn: async () => {
      const response = await api.get(`/contratos/${contratoId}/versiones`);
      return response.data;
    },
    enabled: !!contratoId,
  });

  const descargarVersion = async (versionNumero) => {
    try {
      const response = await api.get(
        `/contratos/${contratoId}/versiones/${versionNumero}/pdf`,
        {
          responseType: 'blob', // Importante para archivos binarios
        }
      );

      // Crear un blob y descargarlo
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Contrato-v${versionNumero}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error al descargar PDF:', error);
      alert('Error al descargar el PDF. Por favor, intenta nuevamente.');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  const versiones = versionesData?.versiones || [];
  const contrato = versionesData?.contrato || {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl p-6 text-white shadow-lg">
        <div className="flex items-center gap-4 mb-4">
          <Link
            to="/cliente/dashboard"
            className="p-2 hover:bg-white/20 rounded-lg transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Versiones del Contrato</h1>
            <p className="text-purple-100 text-sm mt-1">
              Historial completo de todas las versiones de tu contrato
            </p>
          </div>
        </div>
        
        {contrato.codigo && (
          <div className="bg-white/20 rounded-lg p-3 backdrop-blur-sm">
            <p className="text-sm font-medium">Contrato: {contrato.codigo}</p>
            <p className="text-xs text-purple-100 mt-1">
              {versiones.length} {versiones.length === 1 ? 'versión' : 'versiones'} disponibles
            </p>
          </div>
        )}
      </div>

      {/* Descripción */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <FileText className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-blue-900 font-medium mb-1">
              ¿Por qué hay varias versiones?
            </p>
            <p className="text-sm text-blue-700">
              Cada vez que se aprueba un cambio en tu contrato (como agregar invitados o servicios adicionales), 
              se genera automáticamente una nueva versión. Aquí puedes ver y descargar todas las versiones históricas.
            </p>
          </div>
        </div>
      </div>

      {/* Lista de versiones */}
      {versiones.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
          <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No hay versiones disponibles
          </h3>
          <p className="text-gray-600">
            Aún no se han generado versiones de tu contrato
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {versiones.map((version, index) => {
            const esUltimaVersion = index === 0;
            const versionAnterior = versiones[index + 1];
            const diferenciaTotal = versionAnterior 
              ? parseFloat(version.total_contrato) - parseFloat(versionAnterior.total_contrato)
              : 0;

            return (
              <div
                key={version.id}
                className={`bg-white rounded-xl shadow-sm border p-6 ${
                  esUltimaVersion ? 'ring-2 ring-purple-500' : ''
                }`}
              >
                {/* Badge de versión actual */}
                {esUltimaVersion && (
                  <div className="mb-4">
                    <span className="px-3 py-1 bg-purple-100 text-purple-700 text-xs rounded-full font-semibold">
                      ⭐ Versión Actual
                    </span>
                  </div>
                )}

                <div className="flex items-start justify-between gap-6">
                  {/* Información de la versión */}
                  <div className="flex-1 space-y-4">
                    {/* Header */}
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center text-white font-bold text-lg">
                        v{version.version_numero}
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-900">
                          Versión {version.version_numero}
                        </h3>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Calendar className="w-4 h-4" />
                          {new Date(version.fecha_generacion).toLocaleDateString('es-ES', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Motivo del cambio */}
                    {version.motivo_cambio && (
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-sm font-medium text-gray-700 mb-1">
                          Motivo del cambio:
                        </p>
                        <p className="text-sm text-gray-600">
                          {version.motivo_cambio}
                        </p>
                      </div>
                    )}

                    {/* Detalles */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-green-600" />
                        <div>
                          <p className="text-xs text-gray-600">Total</p>
                          <p className="text-sm font-semibold text-gray-900">
                            ${parseFloat(version.total_contrato).toLocaleString()}
                          </p>
                        </div>
                      </div>

                      {version.cantidad_invitados && (
                        <div className="flex items-center gap-2">
                          <UsersIcon className="w-4 h-4 text-blue-600" />
                          <div>
                            <p className="text-xs text-gray-600">Invitados</p>
                            <p className="text-sm font-semibold text-gray-900">
                              {version.cantidad_invitados} personas
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Diferencia con versión anterior */}
                    {versionAnterior && diferenciaTotal !== 0 && (
                      <div className={`flex items-center gap-2 text-sm ${
                        diferenciaTotal > 0 ? 'text-red-600' : 'text-green-600'
                      }`}>
                        {diferenciaTotal > 0 ? (
                          <TrendingUp className="w-4 h-4" />
                        ) : (
                          <TrendingDown className="w-4 h-4" />
                        )}
                        <span>
                          {diferenciaTotal > 0 ? '+' : ''}
                          ${Math.abs(diferenciaTotal).toLocaleString()} respecto a v{version.version_numero - 1}
                        </span>
                      </div>
                    )}

                    {/* Generado por */}
                    {version.vendedores && (
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <User className="w-3 h-3" />
                        Generado por: {version.vendedores.nombre_completo}
                      </div>
                    )}
                  </div>

                  {/* Botón de descarga */}
                  <div className="flex flex-col items-end gap-2">
                    <button
                      onClick={() => descargarVersion(version.version_numero)}
                      className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition font-medium"
                    >
                      <Download className="w-4 h-4" />
                      Descargar PDF
                    </button>
                    <p className="text-xs text-gray-500">
                      Versión {version.version_numero}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Nota al pie */}
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
        <p className="text-sm text-gray-600 text-center">
          💡 <strong>Consejo:</strong> Guarda todas las versiones importantes de tu contrato para tu referencia personal
        </p>
      </div>
    </div>
  );
}

export default VersionesContrato;

