import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Building2, AlertTriangle, ArrowRight, Package, CheckCircle, RotateCcw, ArrowUp } from 'lucide-react';
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {salones.length > 0 ? (
          salones.map((salon) => {
            const itemsBajoStock = salon.items.filter(item => item.necesita_reposicion);
            const nombreSalon = salon.salon_nombre.toLowerCase();
            
            return (
              <button
                key={salon.salon_id}
                onClick={() => navigate(`/${nombreSalon}`)}
                className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition border-2 border-transparent hover:border-blue-500 text-left w-full"
              >
                <div className="flex items-center gap-4 mb-4">
                  <Building2 className="w-12 h-12 text-blue-600" />
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">{salon.salon_nombre}</h3>
                    <p className="text-sm text-gray-600">Salón</p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Items en inventario:</span>
                    <span className="font-semibold text-gray-900">{salon.items.length}</span>
                  </div>
                  {itemsBajoStock.length > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-red-600">Items bajo stock:</span>
                      <span className="font-semibold text-red-600">{itemsBajoStock.length}</span>
                    </div>
                  )}
                </div>
              </button>
            );
          })
        ) : (
          <div className="col-span-3 bg-white rounded-lg shadow p-12 text-center">
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
