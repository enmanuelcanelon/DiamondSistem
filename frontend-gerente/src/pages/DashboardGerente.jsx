import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loader2, Users, FileText, DollarSign, TrendingUp, Calendar, AlertCircle, CheckCircle2, ChevronLeft, ChevronRight, Download } from 'lucide-react';
import api from '@shared/config/api';
import toast from 'react-hot-toast';

function DashboardGerente() {
  const fechaActual = new Date();
  const [mesSeleccionado, setMesSeleccionado] = useState(fechaActual.getMonth() + 1);
  const [añoSeleccionado, setAñoSeleccionado] = useState(fechaActual.getFullYear());

  const nombresMeses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

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

  const resetearMes = () => {
    setMesSeleccionado(fechaActual.getMonth() + 1);
    setAñoSeleccionado(fechaActual.getFullYear());
  };

  const { data: dashboardData, isLoading, isError } = useQuery({
    queryKey: ['gerente-dashboard', mesSeleccionado, añoSeleccionado],
    queryFn: async () => {
      const params = {
        mes: mesSeleccionado,
        año: añoSeleccionado
      };
      const response = await api.get('/gerentes/dashboard', { params });
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard de Gerencia</h1>
            <p className="text-gray-600">
              Vista general de {nombresMeses[mesSeleccionado - 1]} {añoSeleccionado}
            </p>
          </div>

          {/* Selector de Mes y Año */}
          <div className="flex items-center gap-2 bg-white rounded-lg border-2 border-purple-200 p-2">
            <button
              onClick={() => cambiarMes('anterior')}
              className="p-1 hover:bg-purple-50 rounded transition"
              title="Mes anterior"
            >
              <ChevronLeft className="w-5 h-5 text-purple-600" />
            </button>
            
            <div className="flex items-center gap-2 px-3">
              <Calendar className="w-4 h-4 text-purple-600" />
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
              className="p-1 hover:bg-purple-50 rounded transition"
              title="Mes siguiente"
            >
              <ChevronRight className="w-5 h-5 text-purple-600" />
            </button>

            {(mesSeleccionado !== fechaActual.getMonth() + 1 || añoSeleccionado !== fechaActual.getFullYear()) && (
              <button
                onClick={resetearMes}
                className="ml-2 px-3 py-1 text-xs font-medium text-purple-600 hover:bg-purple-50 rounded transition"
                title="Volver al mes actual"
              >
                Hoy
              </button>
            )}
          </div>
        </div>
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

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <p className="text-xs text-gray-500">Ofertas</p>
                    <p className="text-sm font-semibold">
                      {stat.ofertas.total} total
                    </p>
                    <div className="flex gap-2 mt-1">
                      <p className="text-xs text-yellow-600">
                        {stat.ofertas.pendientes} pendientes
                      </p>
                      <p className="text-xs text-red-600">
                        {stat.ofertas.rechazadas} rechazadas
                      </p>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Tasa Conversión</p>
                    <p className="text-sm font-semibold text-green-600">
                      {stat.ofertas.tasa_conversion}%
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {stat.ofertas.aceptadas} aceptadas
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Total Ventas</p>
                    <p className="text-sm font-semibold text-blue-600">
                      ${parseFloat(stat.ventas.total_ventas || 0).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Contratos</p>
                    <p className="text-sm font-semibold text-gray-700">
                      {stat.ventas.contratos_totales} total
                    </p>
                    <p className="text-xs text-green-600">
                      {stat.ventas.contratos_pagados} pagados
                    </p>
                  </div>
                </div>

                {/* Botón de descarga de reporte */}
                {mesSeleccionado && añoSeleccionado && (
                  <div className="border-t border-gray-200 pt-4 mt-4 mb-4">
                    <button
                      onClick={async () => {
                        try {
                          const response = await api.get(`/gerentes/vendedores/${stat.vendedor.id}/reporte-mensual/${mesSeleccionado}/${añoSeleccionado}`, {
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
                          link.download = `Reporte-${stat.vendedor.nombre_completo}-${nombresMeses[mesSeleccionado - 1]}-${añoSeleccionado}.pdf`;
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);
                          window.URL.revokeObjectURL(url);
                        } catch (error) {
                          console.error('Error al descargar reporte:', error);
                          alert('Error al descargar el reporte');
                        }
                      }}
                      className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition text-sm font-medium"
                      title="Descargar reporte mensual en PDF"
                    >
                      <Download className="w-4 h-4" />
                      Descargar Reporte Mensual
                    </button>
                  </div>
                )}

                {/* Comisiones */}
                <div className="border-t border-gray-200 pt-4 mt-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">Comisiones</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-500 mb-1">Total Comisiones</p>
                      <p className="text-lg font-bold text-gray-900">
                        ${parseFloat(stat.comisiones?.total || stat.ventas.total_comisiones || 0).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">3% del total de contratos</p>
                    </div>
                    <div className="bg-green-50 rounded-lg p-3">
                      <p className="text-xs text-gray-500 mb-1">Desbloqueadas</p>
                      <p className="text-lg font-bold text-green-600">
                        ${parseFloat(stat.comisiones?.desbloqueadas || stat.ventas.total_comisiones_desbloqueadas || 0).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">Listas para pagar</p>
                    </div>
                    <div className="bg-yellow-50 rounded-lg p-3">
                      <p className="text-xs text-gray-500 mb-1">Pendientes</p>
                      <p className="text-lg font-bold text-yellow-600">
                        ${parseFloat(stat.comisiones?.pendientes || 0).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">Aún no desbloqueadas</p>
                    </div>
                  </div>

                  {/* Comisiones por Mes */}
                  {stat.comisiones?.por_mes && stat.comisiones.por_mes.length > 0 && (
                    <div className="mt-4">
                      <p className="text-xs font-semibold text-gray-700 mb-2">Comisiones Desbloqueadas por Mes</p>
                      <div className="space-y-2">
                        {stat.comisiones.por_mes.map((item, idx) => {
                          const [anio, mes] = item.mes.split('-');
                          const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
                          const nombreMes = meses[parseInt(mes) - 1];
                          return (
                            <div key={idx} className="flex items-center justify-between bg-white border border-gray-200 rounded-lg p-2">
                              <span className="text-sm text-gray-700">{nombreMes} {anio}</span>
                              <span className="text-sm font-semibold text-green-600">
                                ${item.total.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
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

