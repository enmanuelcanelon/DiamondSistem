import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Users, FileText, FileCheck, DollarSign, TrendingUp, Calendar, ChevronLeft, ChevronRight, Download } from 'lucide-react';
import api from '../config/api';
import useAuthStore from '../store/useAuthStore';

function Dashboard() {
  const { user } = useAuthStore();
  
  // Estado para el mes y año seleccionado
  const fechaActual = new Date();
  const [mesSeleccionado, setMesSeleccionado] = useState(fechaActual.getMonth() + 1);
  const [añoSeleccionado, setAñoSeleccionado] = useState(fechaActual.getFullYear());
  const [usarFiltroMensual, setUsarFiltroMensual] = useState(false);

  // Obtener estadísticas del vendedor (totales o mensuales)
  const { data: stats, isLoading } = useQuery({
    queryKey: ['vendedor-stats', user?.id, usarFiltroMensual ? mesSeleccionado : null, usarFiltroMensual ? añoSeleccionado : null],
    queryFn: async () => {
      if (usarFiltroMensual) {
        const response = await api.get(`/vendedores/${user.id}/stats/mes`, {
          params: { mes: mesSeleccionado, año: añoSeleccionado }
        });
        return response.data;
      } else {
        const response = await api.get(`/vendedores/${user.id}/stats`);
        return response.data;
      }
    },
    enabled: !!user?.id,
  });

  // Nombres de los meses
  const nombresMeses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  // Cambiar mes
  const cambiarMes = (direccion) => {
    if (direccion === 'anterior') {
      if (mesSeleccionado === 1) {
        setMesSeleccionado(12);
        setAñoSeleccionado(añoSeleccionado - 1);
      } else {
        setMesSeleccionado(mesSeleccionado - 1);
      }
    } else {
      if (mesSeleccionado === 12) {
        setMesSeleccionado(1);
        setAñoSeleccionado(añoSeleccionado + 1);
      } else {
        setMesSeleccionado(mesSeleccionado + 1);
      }
    }
  };

  // Volver al mes actual
  const resetearMes = () => {
    setMesSeleccionado(fechaActual.getMonth() + 1);
    setAñoSeleccionado(fechaActual.getFullYear());
  };

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            ¡Bienvenido, {user?.nombre_completo}!
          </h1>
          <p className="text-gray-600 mt-1">
            {usarFiltroMensual 
              ? `Resumen de ${nombresMeses[mesSeleccionado - 1]} ${añoSeleccionado}`
              : 'Resumen general de tu actividad'
            }
          </p>
        </div>

        {/* Selector de Filtro Mensual */}
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={usarFiltroMensual}
              onChange={(e) => {
                setUsarFiltroMensual(e.target.checked);
                if (!e.target.checked) {
                  resetearMes();
                }
              }}
              className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
            />
            <span className="text-sm font-medium text-gray-700">Filtrar por mes</span>
          </label>

          {usarFiltroMensual && (
            <div className="flex items-center gap-2 bg-white rounded-lg border-2 border-indigo-200 p-2">
              <button
                onClick={() => cambiarMes('anterior')}
                className="p-1 hover:bg-indigo-50 rounded transition"
                title="Mes anterior"
              >
                <ChevronLeft className="w-5 h-5 text-indigo-600" />
              </button>
              
              <div className="flex items-center gap-2 px-3">
                <Calendar className="w-4 h-4 text-indigo-600" />
                <select
                  value={mesSeleccionado}
                  onChange={(e) => setMesSeleccionado(parseInt(e.target.value))}
                  className="text-sm font-semibold text-gray-900 bg-transparent border-none outline-none cursor-pointer"
                >
                  {nombresMeses.map((mes, index) => (
                    <option key={index} value={index + 1}>{mes}</option>
                  ))}
                </select>
                <select
                  value={añoSeleccionado}
                  onChange={(e) => setAñoSeleccionado(parseInt(e.target.value))}
                  className="text-sm font-semibold text-gray-900 bg-transparent border-none outline-none cursor-pointer"
                >
                  {Array.from({ length: 5 }, (_, i) => fechaActual.getFullYear() - 2 + i).map(año => (
                    <option key={año} value={año}>{año}</option>
                  ))}
                </select>
              </div>

              <button
                onClick={() => cambiarMes('siguiente')}
                className="p-1 hover:bg-indigo-50 rounded transition"
                title="Mes siguiente"
              >
                <ChevronRight className="w-5 h-5 text-indigo-600" />
              </button>

              {(mesSeleccionado !== fechaActual.getMonth() + 1 || añoSeleccionado !== fechaActual.getFullYear()) && (
                <button
                  onClick={resetearMes}
                  className="ml-2 px-3 py-1 text-xs font-medium text-indigo-600 hover:bg-indigo-50 rounded transition"
                  title="Volver al mes actual"
                >
                  Hoy
                </button>
              )}

              {/* Botón de descarga de reporte */}
              {usarFiltroMensual && (
                <button
                  onClick={async () => {
                    try {
                      const response = await api.get(`/vendedores/${user.id}/reporte-mensual/${mesSeleccionado}/${añoSeleccionado}`, {
                        responseType: 'blob'
                      });
                      
                      const blob = new Blob([response.data], { type: 'application/pdf' });
                      const url = window.URL.createObjectURL(blob);
                      const link = document.createElement('a');
                      link.href = url;
                      const nombresMeses = [
                        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
                        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
                      ];
                      link.download = `Reporte-Mensual-${nombresMeses[mesSeleccionado - 1]}-${añoSeleccionado}.pdf`;
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                      window.URL.revokeObjectURL(url);
                    } catch (error) {
                      console.error('Error al descargar reporte:', error);
                      alert('Error al descargar el reporte');
                    }
                  }}
                  className="ml-2 inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition text-sm font-medium"
                  title="Descargar reporte mensual en PDF"
                >
                  <Download className="w-4 h-4" />
                  Descargar Reporte
                </button>
              )}
            </div>
          )}
        </div>
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
