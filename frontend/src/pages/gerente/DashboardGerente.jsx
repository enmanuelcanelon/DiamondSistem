import { useQuery } from '@tanstack/react-query';
import { Loader2, Users, FileText, DollarSign, TrendingUp, Calendar, AlertCircle, CheckCircle2 } from 'lucide-react';
import api from '../../config/api';
import toast from 'react-hot-toast';

function DashboardGerente() {
  const { data: dashboardData, isLoading, isError } = useQuery({
    queryKey: ['gerente-dashboard'],
    queryFn: async () => {
      const response = await api.get('/gerentes/dashboard');
      return response.data.estadisticas;
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
        <p className="ml-3 text-gray-600">Cargando estadísticas...</p>
      </div>
    );
  }

  if (isError) {
    toast.error('Error al cargar el dashboard');
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <p className="text-red-600">Error al cargar el dashboard</p>
      </div>
    );
  }

  const stats = dashboardData?.generales || {};
  const vendedores = dashboardData?.vendedores || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard de Gerencia</h1>
        <p className="text-gray-600">Vista general del sistema y estadísticas por vendedor</p>
      </div>

      {/* Estadísticas Generales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Vendedores</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total_vendedores || 0}</p>
            </div>
            <Users className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-yellow-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Ofertas Pendientes</p>
              <p className="text-2xl font-bold text-gray-900">{stats.ofertas_pendientes || 0}</p>
            </div>
            <AlertCircle className="w-8 h-8 text-yellow-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Contratos Pagados</p>
              <p className="text-2xl font-bold text-gray-900">{stats.contratos_pagados || 0}</p>
            </div>
            <CheckCircle2 className="w-8 h-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Clientes Hoy</p>
              <p className="text-2xl font-bold text-gray-900">{stats.clientes_atendidos_hoy || 0}</p>
            </div>
            <Calendar className="w-8 h-8 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Estadísticas por Vendedor */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Estadísticas por Vendedor</h2>
        <div className="space-y-4">
          {vendedores.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No hay vendedores registrados</p>
          ) : (
            vendedores.map((stat) => (
              <div key={stat.vendedor.id} className="border rounded-lg p-4 hover:shadow-md transition">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {stat.vendedor.nombre_completo}
                    </h3>
                    <p className="text-sm text-gray-500">{stat.vendedor.codigo_vendedor}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Comisión</p>
                    <p className="text-lg font-bold text-purple-600">
                      {stat.vendedor.comision_porcentaje}%
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-xs text-gray-500">Ofertas</p>
                    <p className="text-sm font-semibold">
                      {stat.ofertas.total} total
                    </p>
                    <p className="text-xs text-yellow-600">
                      {stat.ofertas.pendientes} pendientes
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Tasa Conversión</p>
                    <p className="text-sm font-semibold text-green-600">
                      {stat.ofertas.tasa_conversion}%
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Total Ventas</p>
                    <p className="text-sm font-semibold text-blue-600">
                      ${parseFloat(stat.ventas.total_ventas || 0).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Comisiones</p>
                    <p className="text-sm font-semibold text-purple-600">
                      ${parseFloat(stat.ventas.total_comisiones || 0).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default DashboardGerente;

