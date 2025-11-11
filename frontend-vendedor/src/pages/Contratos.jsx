import { useState, useEffect, useRef, useCallback } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { Search, FileCheck, Calendar, Clock, DollarSign, Eye, Download, X, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import api from '../config/api';
import { generarNombreEvento, getEventoEmoji } from '../utils/eventNames';
import { formatearHora, calcularDuracion, calcularHoraFinConExtras, obtenerHorasAdicionales } from '../utils/formatters';

function Contratos() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const clienteIdFromUrl = searchParams.get('cliente_id');
  const fechaActual = new Date();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [mesSeleccionado, setMesSeleccionado] = useState(fechaActual.getMonth() + 1);
  const [añoSeleccionado, setAñoSeleccionado] = useState(fechaActual.getFullYear());
  const [clienteFiltro, setClienteFiltro] = useState(clienteIdFromUrl || '');

  // Nombres de los meses
  const nombresMeses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  // Calcular fechas basadas en mes y año seleccionado
  const calcularFechasPorMes = (mes, año) => {
    const fechaInicio = new Date(año, mes - 1, 1);
    const fechaFin = new Date(año, mes, 0, 23, 59, 59);
    
    return {
      desde: fechaInicio.toISOString().split('T')[0],
      hasta: fechaFin.toISOString().split('T')[0]
    };
  };

  // Calcular fechas del mes seleccionado
  const { desde: fechaDesde, hasta: fechaHasta } = calcularFechasPorMes(mesSeleccionado, añoSeleccionado);

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

  // Sincronizar filtro de cliente con URL
  useEffect(() => {
    if (clienteIdFromUrl) {
      setClienteFiltro(clienteIdFromUrl);
    }
  }, [clienteIdFromUrl]); // Scroll infinito con useInfiniteQuery
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isRefetching,
  } = useInfiniteQuery({
    queryKey: ['contratos', searchTerm, clienteFiltro, mesSeleccionado, añoSeleccionado],
    queryFn: async ({ pageParam = 1 }) => {
      const params = {
        page: pageParam,
        limit: 50,
        // Enviar filtros al backend
        ...(searchTerm && { search: searchTerm }),
        ...(clienteFiltro && { cliente_id: clienteFiltro }),
        ...(fechaDesde && { fecha_desde: fechaDesde }),
        ...(fechaHasta && { fecha_hasta: fechaHasta }),
      };
      const response = await api.get('/contratos', { params });
      return response.data; // Retorna { data: [...], total, page, hasNextPage, ... }
    },
    getNextPageParam: (lastPage) => {
      return lastPage.hasNextPage ? lastPage.page + 1 : undefined;
    },
    initialPageParam: 1,
  }); // Aplanar todos los contratos de todas las páginas
  const contratos = data?.pages.flatMap(page => page.data) || [];
  const totalContratos = data?.pages[0]?.total || 0;

  // Obtener nombre del cliente para mostrar en el filtro (del primer contrato que coincida)
  const clienteFiltrado = contratos.find(c => c.cliente_id === parseInt(clienteFiltro))?.clientes;

  // Limpiar filtro de cliente
  const limpiarFiltroCliente = () => {
    setClienteFiltro('');
    navigate('/contratos');
  };

  // Detección de scroll para cargar más
  const observerTarget = useRef(null);

  const handleObserver = useCallback((entries) => {
    const [target] = entries;
    if (target.isIntersecting && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  useEffect(() => {
    const element = observerTarget.current;
    const option = { threshold: 0.1 };

    const observer = new IntersectionObserver(handleObserver, option);
    if (element) observer.observe(element);

    return () => {
      if (element) observer.unobserve(element);
    };
  }, [handleObserver]);

  const handleDescargarContrato = async (contratoId, codigoContrato) => {
    try {
      const response = await api.get(`/contratos/${contratoId}/pdf-contrato`, {
        responseType: 'blob'
      });
      
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Contrato-${codigoContrato}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      alert('Error al descargar el contrato');
      console.error(error);
    }
  };

  const getEstadoPagoColor = (estadoPago) => {
    switch (estadoPago) {
      case 'pendiente':
        return 'bg-yellow-100 text-yellow-800';
      case 'parcial':
        return 'bg-blue-100 text-blue-800';
      case 'pagado':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getEstadoContratoColor = (estado) => {
    switch (estado) {
      case 'activo':
        return 'bg-green-100 text-green-800';
      case 'completado':
        return 'bg-blue-100 text-blue-800';
      case 'cancelado':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Contratos</h1>
        <p className="text-gray-600 mt-1">Gestiona tus contratos y pagos</p>
      </div>

      {/* Banner de filtro por cliente */}
      {clienteFiltro && clienteFiltrado && (
        <div className="bg-indigo-50 border-l-4 border-indigo-500 p-4 rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
              <span className="text-indigo-600 font-semibold text-sm">
                {clienteFiltrado.nombre_completo.charAt(0)}
              </span>
            </div>
            <div>
              <p className="text-sm font-medium text-indigo-900">
                Filtrando contratos de: <strong>{clienteFiltrado.nombre_completo}</strong>
              </p>
              <p className="text-xs text-indigo-700">
                Mostrando {contratos.length} de {totalContratos} contrato{totalContratos !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <button
            onClick={limpiarFiltroCliente}
            className="flex items-center gap-2 px-3 py-2 bg-white border border-indigo-300 text-indigo-700 rounded-lg hover:bg-indigo-100 transition text-sm font-medium"
          >
            <X className="w-4 h-4" />
            Limpiar filtro
          </button>
        </div>
      )}

      {/* Búsqueda y filtros */}
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Buscar por código o cliente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
              />
            </div>
          </div>
          
          {/* Filtro por Mes y Año */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-gray-400" />
              <span className="text-sm text-gray-700 font-medium">Filtrar por mes:</span>
            </div>
            
            <div className="flex items-center gap-2 bg-white rounded-lg border-2 border-indigo-200 p-2">
              <button
                onClick={() => cambiarMes('anterior')}
                className="p-1 hover:bg-indigo-50 rounded transition"
                title="Mes anterior"
              >
                <ChevronLeft className="w-5 h-5 text-indigo-600" />
              </button>
              
              <div className="flex items-center gap-2 px-3">
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
            </div>
          </div>
        </div>
      </div>

      {/* Lista de contratos */}
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl p-6 shadow-sm border animate-pulse">
              <div className="flex items-center justify-between mb-4">
                <div className="h-6 bg-gray-200 rounded w-32"></div>
                <div className="h-6 bg-gray-200 rounded w-24"></div>
              </div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </div>
          ))}
        </div>
      ) : contratos.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center shadow-sm border">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileCheck className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {searchTerm ? 'No se encontraron contratos' : 'No hay contratos'}
          </h3>
          <p className="text-gray-600 mb-6">
            {searchTerm ? 'Intenta con otros filtros' : 'Los contratos se generan desde las ofertas aceptadas'}
          </p>
          {!searchTerm && (
            <Link
              to="/ofertas"
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
            >
              Ver Ofertas
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {contratos.map((contrato) => (
            <div
              key={contrato.id}
              className="bg-white rounded-xl p-6 shadow-sm border hover:shadow-md transition"
            >
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl">{getEventoEmoji(contrato)}</span>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {generarNombreEvento(contrato)}
                      </h3>
                      <p className="text-xs text-gray-500 font-mono">
                        {contrato.codigo_contrato}
                      </p>
                    </div>
                    <span className={`px-3 py-1 text-xs font-medium rounded-full ${getEstadoContratoColor(contrato.estado)}`}>
                      {contrato.estado.charAt(0).toUpperCase() + contrato.estado.slice(1)}
                    </span>
                    <span className={`px-3 py-1 text-xs font-medium rounded-full ${getEstadoPagoColor(contrato.estado_pago)}`}>
                      {contrato.estado_pago === 'pagado' ? 'Pagado' : contrato.estado_pago === 'parcial' ? 'Pago Parcial' : 'Pago Pendiente'}
                    </span>
                  </div>

                  <p className="text-gray-600 mb-1 ml-11">
                    Cliente: <span className="font-medium">{contrato.clientes?.nombre_completo || 'Sin cliente'}</span>
                    {contrato.homenajeado && (
                      <span className="ml-2 text-purple-600 font-medium">
                        🎉 {contrato.homenajeado}
                      </span>
                    )}
                  </p>

                  <div className="flex flex-wrap gap-4 text-sm text-gray-600 mt-2">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      {contrato.fecha_evento ? new Date(contrato.fecha_evento).toLocaleDateString('es-ES', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      }) : 'Fecha no disponible'}
                    </div>
                    {contrato.hora_inicio && contrato.hora_fin && (
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        <span className="font-medium">
                        {(() => {
                            const horasAdicionales = obtenerHorasAdicionales(contrato.contratos_servicios);
                            const horaFinConExtras = calcularHoraFinConExtras(contrato.hora_fin, horasAdicionales);
                            const duracion = calcularDuracion(contrato.hora_inicio, horaFinConExtras);
                            
                            return (
                              <>
                                {formatearHora(contrato.hora_inicio)} / {formatearHora(horaFinConExtras)}
                                {duracion > 0 && (() => {
                                  const horasEnteras = Math.floor(duracion);
                                  const minutos = Math.round((duracion - horasEnteras) * 60);
                                  if (minutos > 0 && minutos < 60) {
                                    return ` • ${horasEnteras}h ${minutos}m`;
                                  }
                                  return ` • ${horasEnteras} ${horasEnteras === 1 ? 'hora' : 'horas'}`;
                                })()}
                              </>
                            );
                        })()}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{contrato.cantidad_invitados || 0} invitados</span>
                    </div>
                    {(contrato.lugar_salon || contrato.salones?.nombre) ? (
                      <div className="flex items-center gap-2">
                        <span className="text-indigo-600 font-medium">
                          📍 {contrato.lugar_salon || contrato.salones?.nombre || 'Sin salón'}
                        </span>
                      </div>
                    ) : null}
                  </div>
                  {contrato.paquetes?.nombre && (
                    <p className="text-xs text-gray-500 mt-2 ml-11">
                      📦 Paquete: {contrato.paquetes.nombre}
                    </p>
                  )}
                </div>

                <div className="lg:text-right space-y-2">
                  <div>
                    <p className="text-sm text-gray-600">Total Contrato</p>
                    <p className="text-2xl font-bold text-gray-900">
                      ${parseFloat(contrato.total_contrato || 0).toLocaleString()}
                    </p>
                  </div>

                  <div className="flex flex-col gap-1 text-sm">
                    <div className="flex justify-between gap-4">
                      <span className="text-gray-600">Pagado:</span>
                      <span className="font-medium text-green-600">
                        ${parseFloat(contrato.total_pagado || 0).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between gap-4">
                      <span className="text-gray-600">Pendiente:</span>
                      <span className="font-medium text-orange-600">
                        ${parseFloat(contrato.saldo_pendiente || 0).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Barra de progreso de pago */}
              <div className="mt-4">
                <div className="flex justify-between text-xs text-gray-600 mb-1">
                  <span>Progreso de Pago</span>
                  <span>
                    {contrato.total_contrato > 0 
                      ? ((parseFloat(contrato.total_pagado || 0) / parseFloat(contrato.total_contrato)) * 100).toFixed(0)
                      : 0
                    }%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-600 h-2 rounded-full transition-all"
                    style={{ 
                      width: `${contrato.total_contrato > 0 
                        ? (parseFloat(contrato.total_pagado || 0) / parseFloat(contrato.total_contrato)) * 100
                        : 0
                      }%` 
                    }}
                  ></div>
                </div>
              </div>

              {/* Acciones */}
              <div className="mt-4 pt-4 border-t space-y-2">
                <Link
                  to={`/contratos/${contrato.id}`}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition text-sm font-medium"
                >
                  <Eye className="w-4 h-4" />
                  Ver Detalles
                </Link>
                <button
                  onClick={() => handleDescargarContrato(contrato.id, contrato.codigo_contrato)}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 border border-indigo-300 text-indigo-600 rounded-lg hover:bg-indigo-50 transition text-xs font-medium"
                >
                  <Download className="w-3 h-3" />
                  Descargar Contrato PDF
                </button>
              </div>
            </div>
          ))}
          
          {/* Observador para scroll infinito */}
          <div ref={observerTarget} className="h-10 flex items-center justify-center">
            {isFetchingNextPage && (
              <div className="flex items-center gap-2 text-gray-600">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="text-sm">Cargando más contratos...</span>
              </div>
            )}
          </div>
          
          {/* Indicador de fin */}
          {!hasNextPage && contratos.length > 0 && (
            <div className="text-center py-4 text-gray-500 text-sm">
              Mostrando todos los {totalContratos} contrato{totalContratos !== 1 ? 's' : ''}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default Contratos;




