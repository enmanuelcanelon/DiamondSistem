import { useState, useEffect, useRef, useCallback } from 'react';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Calendar, DollarSign, Clock, FileText, Download, Filter, Edit2, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '@shared/config/api';
import { formatearHora } from '@shared/utils/formatters';
import ModalPlanPago from '@components/ModalPlanPago';

function Ofertas() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [estadoFiltro, setEstadoFiltro] = useState('');
  const [filtroDias, setFiltroDias] = useState('30'); // Por defecto: últimos 30 días
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const [modalPlanPagoOpen, setModalPlanPagoOpen] = useState(false);
  const [ofertaSeleccionada, setOfertaSeleccionada] = useState(null);

  // Calcular fechas basadas en el filtro de días
  const calcularFechasPorDias = (dias) => {
    if (dias === 'todos') {
      return { desde: '', hasta: '' };
    }
    const hoy = new Date();
    const fechaHasta = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
    const fechaDesde = new Date(hoy);
    fechaDesde.setDate(fechaDesde.getDate() - parseInt(dias));
    
    return {
      desde: fechaDesde.toISOString().split('T')[0],
      hasta: fechaHasta.toISOString().split('T')[0]
    };
  };

  // Actualizar fechas cuando cambia el filtro de días
  useEffect(() => {
    if (filtroDias !== 'personalizado') {
      const fechas = calcularFechasPorDias(filtroDias);
      setFechaDesde(fechas.desde);
      setFechaHasta(fechas.hasta);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtroDias]);
  
  // Scroll infinito con useInfiniteQuery
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useInfiniteQuery({
    queryKey: ['ofertas', searchTerm, estadoFiltro, fechaDesde, fechaHasta],
    queryFn: async ({ pageParam = 1 }) => {
      const params = {
        page: pageParam,
        limit: 50,
        // Enviar filtros al backend
        ...(searchTerm && { search: searchTerm }),
        ...(estadoFiltro && { estado: estadoFiltro }),
        ...(fechaDesde && { fecha_desde: fechaDesde }),
        ...(fechaHasta && { fecha_hasta: fechaHasta }),
      };
      const response = await api.get('/ofertas', { params });
      return response.data; // Retorna { data: [...], total, page, hasNextPage, ... }
    },
    getNextPageParam: (lastPage) => {
      return lastPage.hasNextPage ? lastPage.page + 1 : undefined;
    },
    initialPageParam: 1,
  });

  // Aplanar todas las ofertas de todas las páginas
  const ofertas = data?.pages.flatMap(page => page.data) || [];
  const totalOfertas = data?.pages[0]?.total || 0;

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

  // Mutation para aceptar oferta
  const aceptarMutation = useMutation({
    mutationFn: async (oferta) => {
      const response = await api.put(`/ofertas/${oferta.id}/aceptar`);
      return { ...response.data, oferta };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries(['ofertas']);
      // Abrir automáticamente el modal de plan de pago
      setOfertaSeleccionada(data.oferta);
      setModalPlanPagoOpen(true);
    },
  });

  // Mutation para rechazar oferta
  const rechazarMutation = useMutation({
    mutationFn: async (ofertaId) => {
      const response = await api.put(`/ofertas/${ofertaId}/rechazar`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ofertas'] });
    },
  });

  // Mutation para crear contrato
  const crearContratoMutation = useMutation({
    mutationFn: async ({ ofertaId, planPago }) => {
      const response = await api.post('/contratos', { 
        oferta_id: ofertaId,
        tipo_pago: planPago.tipo_pago,
        numero_plazos: planPago.numero_plazos,
        plan_pagos: planPago.plan_pagos,
        meses_financiamiento: planPago.tipo_pago === 'plazos' ? planPago.numero_plazos : 1,
        nombre_evento: 'Evento'
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['ofertas']);
      queryClient.invalidateQueries(['contratos']);
      setModalPlanPagoOpen(false);
      setOfertaSeleccionada(null);
      alert('¡Contrato creado exitosamente!');
    },
    onError: (error) => {
      alert(error.response?.data?.message || 'Error al crear contrato');
    },
  });

  const handleAceptar = (oferta) => {
    if (window.confirm('¿Estás seguro de aceptar esta oferta? Se abrirá el modal para configurar el plan de pago.')) {
      aceptarMutation.mutate(oferta);
    }
  };

  const handleRechazar = (ofertaId) => {
    if (window.confirm('¿Estás seguro de rechazar esta oferta?')) {
      rechazarMutation.mutate(ofertaId);
    }
  };

  const handleCrearContrato = (oferta) => {
    setOfertaSeleccionada(oferta);
    setModalPlanPagoOpen(true);
  };

  const handleConfirmarPlanPago = (planPago) => {
    crearContratoMutation.mutate({ 
      ofertaId: ofertaSeleccionada.id, 
      planPago 
    });
  };

  const handleDescargarPDF = async (ofertaId, codigoOferta) => {
    try {
      const response = await api.get(`/ofertas/${ofertaId}/pdf-factura`, {
        responseType: 'blob'
      });
      
      // Crear un blob URL y descargar
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Oferta-${codigoOferta}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      alert('Error al descargar el PDF');
      console.error(error);
    }
  };

  const getEstadoColor = (estado) => {
    switch (estado) {
      case 'pendiente':
        return 'bg-yellow-100 text-yellow-800';
      case 'aceptada':
        return 'bg-green-100 text-green-800';
      case 'rechazada':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Ofertas</h1>
          <p className="text-gray-600 mt-1">Gestiona tus propuestas comerciales</p>
        </div>
        <Link
          to="/ofertas/nueva"
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
        >
          <Plus className="w-5 h-5" />
          Nueva Oferta
        </Link>
      </div>

      {/* Búsqueda y filtros */}
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <div className="space-y-3">
          <div className="flex gap-4">
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
            <select 
              value={estadoFiltro}
              onChange={(e) => setEstadoFiltro(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
            >
              <option value="">Todos los estados</option>
              <option value="pendiente">Pendiente</option>
              <option value="aceptada">Aceptada</option>
              <option value="rechazada">Rechazada</option>
            </select>
          </div>
          {/* Filtros de fecha de creación */}
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-gray-400" />
              <span className="text-sm text-gray-700 font-medium">Fecha de creación de la oferta:</span>
            </div>
            
            {/* Selector rápido de días */}
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">Mostrar:</label>
              <select
                value={filtroDias}
                onChange={(e) => {
                  setFiltroDias(e.target.value);
                  if (e.target.value === 'todos') {
                    setFechaDesde('');
                    setFechaHasta('');
                  }
                }}
                className="px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-sm bg-white"
              >
                <option value="7">Últimos 7 días</option>
                <option value="30">Últimos 30 días</option>
                <option value="60">Últimos 60 días</option>
                <option value="90">Últimos 90 días</option>
                <option value="todos">Todos</option>
              </select>
            </div>

            {/* Filtros de fecha manuales */}
            <div className="flex gap-2 items-center">
              <label className="text-sm text-gray-600">Desde:</label>
              <input
                type="date"
                value={fechaDesde}
                onChange={(e) => {
                  setFechaDesde(e.target.value);
                  setFiltroDias('personalizado');
                }}
                className="px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-sm"
              />
            </div>
            <div className="flex gap-2 items-center">
              <label className="text-sm text-gray-600">Hasta:</label>
              <input
                type="date"
                value={fechaHasta}
                onChange={(e) => {
                  setFechaHasta(e.target.value);
                  setFiltroDias('personalizado');
                }}
                className="px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-sm"
              />
            </div>
            {(fechaDesde || fechaHasta) && (
              <button
                onClick={() => {
                  setFechaDesde('');
                  setFechaHasta('');
                  setFiltroDias('30'); // Volver al valor por defecto
                }}
                className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
              >
                Limpiar
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Lista de ofertas */}
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
      ) : ofertas.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center shadow-sm border">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {searchTerm || estadoFiltro ? 'No se encontraron ofertas' : 'No hay ofertas'}
          </h3>
          <p className="text-gray-600 mb-6">
            {searchTerm || estadoFiltro ? 'Intenta con otros filtros' : 'Crea tu primera oferta para un cliente'}
          </p>
          {!searchTerm && !estadoFiltro && (
            <Link
              to="/ofertas/nueva"
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
            >
              <Plus className="w-5 h-5" />
              Crear Primera Oferta
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {ofertas.map((oferta) => (
            <div
              key={oferta.id}
              className="bg-white rounded-xl p-6 shadow-sm border hover:shadow-md transition"
            >
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {oferta.codigo_oferta}
                    </h3>
                    <span className={`px-3 py-1 text-xs font-medium rounded-full ${getEstadoColor(oferta.estado)}`}>
                      {oferta.estado.charAt(0).toUpperCase() + oferta.estado.slice(1)}
                    </span>
                  </div>
                  <p className="text-gray-600 mb-1">
                    Cliente: <span className="font-medium">{oferta.clientes?.nombre_completo}</span>
                    {oferta.homenajeado && (
                      <span className="ml-2 text-purple-600 font-medium">
                        🎉 {oferta.homenajeado}
                      </span>
                    )}
                  </p>
                  <div className="flex flex-wrap gap-4 text-sm text-gray-600 mt-2">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      {new Date(oferta.fecha_evento).toLocaleDateString('es-ES', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      {formatearHora(oferta.hora_inicio)} - {formatearHora(oferta.hora_fin)}
                      {(() => {
                        try {
                          if (!oferta.hora_inicio || !oferta.hora_fin) return '';
                          
                          // Extraer solo HH:mm si viene en formato TIME completo
                          const horaInicioStr = typeof oferta.hora_inicio === 'string' 
                            ? oferta.hora_inicio.slice(0, 5) 
                            : oferta.hora_inicio;
                          const horaFinStr = typeof oferta.hora_fin === 'string' 
                            ? oferta.hora_fin.slice(0, 5) 
                            : oferta.hora_fin;
                          
                          const inicio = new Date(`1970-01-01T${horaInicioStr}`);
                          const fin = new Date(`1970-01-01T${horaFinStr}`);
                          
                          if (isNaN(inicio.getTime()) || isNaN(fin.getTime())) return '';
                          
                          let horas = (fin - inicio) / (1000 * 60 * 60);
                          if (horas < 0) horas += 24;
                          return ` (${horas.toFixed(1)}h)`;
                        } catch (e) {
                          return '';
                        }
                      })()}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{oferta.cantidad_invitados} invitados</span>
                    </div>
                    {(oferta.lugar_salon || oferta.salones?.nombre) && (
                      <div className="flex items-center gap-2">
                        <span className="text-indigo-600 font-medium">
                          📍 {oferta.lugar_salon || oferta.salones?.nombre}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="lg:text-right">
                  <div className="mb-2">
                    <p className="text-sm text-gray-600">Total</p>
                    <p className="text-2xl font-bold text-indigo-600">
                      ${parseFloat(oferta.total_final).toLocaleString()}
                    </p>
                  </div>
                  <p className="text-xs text-gray-500">
                    {oferta.paquetes?.nombre}
                  </p>
                </div>
              </div>

              {/* Botón de descarga PDF */}
              <div className="mt-4 pt-4 border-t">
                <button
                  onClick={() => handleDescargarPDF(oferta.id, oferta.codigo_oferta)}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 border border-indigo-300 text-indigo-600 rounded-lg hover:bg-indigo-50 transition text-sm font-medium"
                >
                  <Download className="w-4 h-4" />
                  Descargar Factura Proforma (PDF)
                </button>
              </div>

              {oferta.estado === 'pendiente' && (
                <div className="mt-4 pt-4 border-t space-y-3">
                  <Link
                    to={`/ofertas/editar/${oferta.id}`}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition text-sm font-medium"
                  >
                    <Edit2 className="w-4 h-4" />
                    Editar Oferta
                  </Link>
                  <div className="flex gap-3">
                    <button 
                      onClick={() => handleAceptar(oferta)}
                      disabled={aceptarMutation.isPending}
                      className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm font-medium disabled:opacity-50"
                    >
                      {aceptarMutation.isPending ? 'Aceptando...' : 'Aceptar Oferta'}
                    </button>
                    <button 
                      onClick={() => handleRechazar(oferta.id)}
                      disabled={rechazarMutation.isPending}
                      className="flex-1 px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition text-sm font-medium disabled:opacity-50"
                    >
                      {rechazarMutation.isPending ? 'Rechazando...' : 'Rechazar'}
                    </button>
                  </div>
                </div>
              )}

              {oferta.estado === 'aceptada' && !oferta.contratos?.length && (
                <div className="mt-4 pt-4 border-t">
                  <div className="flex items-center gap-3">
                    <div className="flex-1 bg-green-50 border border-green-200 rounded-lg p-3">
                      <p className="text-sm text-green-800">
                        ✅ Oferta aceptada. Configura el plan de pago para crear el contrato.
                      </p>
                    </div>
                    <button
                      onClick={() => handleCrearContrato(oferta)}
                      disabled={crearContratoMutation.isPending}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition text-sm font-medium disabled:opacity-50 whitespace-nowrap"
                    >
                      {crearContratoMutation.isPending ? 'Creando...' : 'Plan de Pago →'}
                    </button>
                  </div>
                </div>
              )}
              
              {oferta.estado === 'aceptada' && oferta.contratos?.length > 0 && (
                <div className="mt-4 pt-4 border-t">
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 text-green-800 rounded-lg text-sm font-medium">
                    <FileText className="w-4 h-4" />
                    Contrato ya creado
                  </div>
                </div>
              )}
            </div>
          ))}
          
          {/* Observador para scroll infinito */}
          <div ref={observerTarget} className="h-10 flex items-center justify-center">
            {isFetchingNextPage && (
              <div className="flex items-center gap-2 text-gray-600">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="text-sm">Cargando más ofertas...</span>
              </div>
            )}
          </div>
          
          {/* Indicador de fin */}
          {!hasNextPage && ofertas.length > 0 && (
            <div className="text-center py-4 text-gray-500 text-sm">
              Mostrando todas las {totalOfertas} oferta{totalOfertas !== 1 ? 's' : ''}
            </div>
          )}
        </div>
      )}

      {/* Modal de Plan de Pago */}
      <ModalPlanPago
        isOpen={modalPlanPagoOpen}
        onClose={() => {
          setModalPlanPagoOpen(false);
          setOfertaSeleccionada(null);
        }}
        onConfirm={handleConfirmarPlanPago}
        totalContrato={ofertaSeleccionada?.total_final || 0}
      />
    </div>
  );
}

export default Ofertas;
