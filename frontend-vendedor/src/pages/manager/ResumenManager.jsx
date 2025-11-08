import { useQuery } from '@tanstack/react-query';
import { Loader2, CheckCircle2, Clock, AlertCircle, BarChart3 } from 'lucide-react';
import api from '../../config/api';
import toast from 'react-hot-toast';

const SERVICIOS_LABELS = {
  limosina: 'Limosina',
  hora_loca: 'Hora Loca',
  animador: 'Animador',
  chef: 'Chef'
};

function ResumenManager() {
  const { data: resumenData, isLoading, isError } = useQuery({
    queryKey: ['manager-checklist-resumen'],
    queryFn: async () => {
      const response = await api.get('/managers/checklist/resumen');
      return response.data;
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
        <p className="ml-3 text-gray-600">Cargando resumen...</p>
      </div>
    );
  }

  if (isError) {
    toast.error('Error al cargar el resumen');
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <p className="text-red-600">Error al cargar el resumen</p>
      </div>
    );
  }

  const resumen = resumenData?.resumen || {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center gap-3 mb-2">
          <BarChart3 className="w-6 h-6 text-emerald-600" />
          <h2 className="text-2xl font-bold text-gray-900">Resumen del Checklist</h2>
        </div>
        <p className="text-gray-600">
          Estadísticas generales de servicios externos
        </p>
      </div>

      {/* Estadísticas Generales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total</p>
              <p className="text-2xl font-bold text-gray-900">{resumen.total || 0}</p>
            </div>
            <BarChart3 className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-yellow-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pendientes</p>
              <p className="text-2xl font-bold text-gray-900">{resumen.pendiente || 0}</p>
            </div>
            <Clock className="w-8 h-8 text-yellow-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">En Proceso</p>
              <p className="text-2xl font-bold text-gray-900">{resumen.en_proceso || 0}</p>
            </div>
            <AlertCircle className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Completados</p>
              <p className="text-2xl font-bold text-gray-900">{resumen.completado || 0}</p>
            </div>
            <CheckCircle2 className="w-8 h-8 text-green-500" />
          </div>
        </div>
      </div>

      {/* Estadísticas por Servicio */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Estadísticas por Servicio</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.entries(SERVICIOS_LABELS).map(([tipo, label]) => {
            const servicioData = resumen.por_servicio?.[tipo] || { total: 0, completado: 0 };
            const porcentaje = servicioData.total > 0 
              ? Math.round((servicioData.completado / servicioData.total) * 100) 
              : 0;

            return (
              <div key={tipo} className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-2">{label}</h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Total:</span>
                    <span className="font-medium">{servicioData.total}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Completados:</span>
                    <span className="font-medium text-green-600">{servicioData.completado}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-emerald-600 h-2 rounded-full transition-all"
                      style={{ width: `${porcentaje}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 text-center">{porcentaje}% completado</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default ResumenManager;

