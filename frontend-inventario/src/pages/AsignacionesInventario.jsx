import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Building2, AlertTriangle, ArrowRight } from 'lucide-react';
import api from '@shared/config/api';

function AsignacionesInventario() {
  const navigate = useNavigate();

  // Query para inventario por salones
  const { data: inventarioSalones, isLoading } = useQuery({
    queryKey: ['inventario-salones'],
    queryFn: async () => {
      const response = await api.get('/inventario/salones');
      return response.data;
    }
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Cargando inventario por salones...</div>
      </div>
    );
  }

  const salones = inventarioSalones?.inventario || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Inventario por Salones</h1>
        <p className="text-gray-600 mt-1">Visualiza y gestiona el inventario de cada salón</p>
      </div>

      {/* Lista de Salones */}
      <div className="space-y-4">
        {salones.length > 0 ? (
          salones.map((salon) => {
            const itemsBajoStock = salon.items.filter(item => item.necesita_reposicion);
            
            return (
              <div
                key={salon.salon_id}
                className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden"
              >
                {/* Header del Salón */}
                <div className="p-6 flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    <Building2 className="w-6 h-6 text-blue-600" />
                    <div className="flex-1">
                      <h2 className="text-xl font-semibold text-gray-900">{salon.salon_nombre}</h2>
                      <p className="text-sm text-gray-500">
                        {salon.items.length} items en inventario
                        {itemsBajoStock.length > 0 && (
                          <span className="ml-2 text-red-600 font-medium">
                            • {itemsBajoStock.length} bajo stock
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    {itemsBajoStock.length > 0 && (
                      <div className="flex items-center gap-2 text-red-600">
                        <AlertTriangle className="w-5 h-5" />
                        <span className="text-sm font-medium">{itemsBajoStock.length} alertas</span>
                      </div>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const nombreSalon = salon.salon_nombre.toLowerCase();
                        navigate(`/${nombreSalon}`);
                      }}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                    >
                      Ver Detalles
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No hay inventario en los salones</p>
            <p className="text-gray-400 text-sm mt-2">
              Abastece los salones desde el Dashboard para comenzar
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default AsignacionesInventario;
