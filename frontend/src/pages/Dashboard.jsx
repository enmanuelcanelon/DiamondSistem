import { useQuery } from '@tanstack/react-query';
import { Users, FileText, FileCheck, DollarSign, TrendingUp } from 'lucide-react';
import api from '../config/api';
import useAuthStore from '../store/useAuthStore';

function Dashboard() {
  const { user } = useAuthStore();

  // Obtener estadísticas del vendedor
  const { data: stats, isLoading } = useQuery({
    queryKey: ['vendedor-stats', user?.id],
    queryFn: async () => {
      const response = await api.get(`/vendedores/${user.id}/stats`);
      return response.data;
    },
  });

  const statCards = [
    {
      name: 'Total Clientes',
      value: stats?.estadisticas?.clientes?.total || 0,
      icon: Users,
      color: 'bg-blue-500',
    },
    {
      name: 'Ofertas Pendientes',
      value: stats?.estadisticas?.ofertas?.pendientes || 0,
      icon: FileText,
      color: 'bg-yellow-500',
    },
    {
      name: 'Contratos Activos',
      value: stats?.estadisticas?.contratos?.activos || 0,
      icon: FileCheck,
      color: 'bg-green-500',
    },
    {
      name: 'Total Ventas',
      value: `$${parseFloat(stats?.estadisticas?.finanzas?.total_ventas || 0).toLocaleString()}`,
      icon: DollarSign,
      color: 'bg-indigo-500',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          ¡Bienvenido, {user?.nombre_completo}!
        </h1>
        <p className="text-gray-600 mt-1">
          Aquí está el resumen de tu actividad
        </p>
      </div>

      {/* Tarjetas de estadísticas */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl p-6 shadow-sm border animate-pulse">
              <div className="h-12 w-12 bg-gray-200 rounded-lg mb-4"></div>
              <div className="h-8 bg-gray-200 rounded mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-24"></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.name} className="bg-white rounded-xl p-6 shadow-sm border hover:shadow-md transition">
                <div className={`${stat.color} w-12 h-12 rounded-lg flex items-center justify-center mb-4`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-1">{stat.value}</h3>
                <p className="text-sm text-gray-600">{stat.name}</p>
              </div>
            );
          })}
        </div>
      )}

      {/* Información detallada */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ofertas */}
        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Estado de Ofertas</h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Pendientes</span>
              <span className="font-semibold text-yellow-600">
                {stats?.estadisticas?.ofertas?.pendientes || 0}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Aceptadas</span>
              <span className="font-semibold text-green-600">
                {stats?.estadisticas?.ofertas?.aceptadas || 0}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Rechazadas</span>
              <span className="font-semibold text-red-600">
                {stats?.estadisticas?.ofertas?.rechazadas || 0}
              </span>
            </div>
            <div className="pt-3 border-t flex justify-between items-center">
              <span className="text-gray-900 font-medium">Tasa de Conversión</span>
              <span className="font-bold text-indigo-600 flex items-center gap-1">
                <TrendingUp className="w-4 h-4" />
                {stats?.estadisticas?.ofertas?.tasa_conversion || '0%'}
              </span>
            </div>
          </div>
        </div>

        {/* Comisiones */}
        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Comisiones</h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Porcentaje</span>
              <span className="font-semibold text-indigo-600">
                {stats?.estadisticas?.finanzas?.comision_porcentaje || 0}%
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Total Comisiones</span>
              <span className="font-semibold text-green-600">
                ${parseFloat(stats?.estadisticas?.finanzas?.total_comisiones || 0).toLocaleString()}
              </span>
            </div>
            <div className="pt-3 border-t flex justify-between items-center">
              <span className="text-gray-900 font-medium">Contratos Pagados</span>
              <span className="font-bold text-indigo-600">
                {stats?.estadisticas?.contratos?.pagados_completo || 0}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Acciones rápidas */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl p-8 text-white">
        <h2 className="text-2xl font-bold mb-4">Acciones Rápidas</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <a
            href="/clientes/nuevo"
            className="bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg p-4 text-center transition"
          >
            <Users className="w-8 h-8 mx-auto mb-2" />
            <span className="font-medium">Nuevo Cliente</span>
          </a>
          <a
            href="/ofertas/nueva"
            className="bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg p-4 text-center transition"
          >
            <FileText className="w-8 h-8 mx-auto mb-2" />
            <span className="font-medium">Nueva Oferta</span>
          </a>
          <a
            href="/contratos"
            className="bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg p-4 text-center transition"
          >
            <FileCheck className="w-8 h-8 mx-auto mb-2" />
            <span className="font-medium">Ver Contratos</span>
          </a>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;

