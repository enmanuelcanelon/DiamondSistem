import { useState, useEffect, useRef, useCallback } from 'react';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Calendar, DollarSign, Clock, FileText, Download, Loader2, ChevronLeft, ChevronRight, TrendingUp, TrendingDown, CheckCircle, XCircle, AlertCircle, Percent } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../config/api';
import { formatearHora, calcularDuracion, calcularHoraFinConExtras, obtenerHorasAdicionales } from '../utils/formatters';
import ModalPlanPago from '../components/ModalPlanPago';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Skeleton } from '../components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Separator } from '../components/ui/separator';
import toast from 'react-hot-toast';

function Ofertas() {
  const queryClient = useQueryClient();
  const fechaActual = new Date();
  const [searchTerm, setSearchTerm] = useState('');
  const [estadoFiltro, setEstadoFiltro] = useState('');
  const [mesSeleccionado, setMesSeleccionado] = useState(fechaActual.getMonth() + 1);
  const [añoSeleccionado, setAñoSeleccionado] = useState(fechaActual.getFullYear());
  const [modalPlanPagoOpen, setModalPlanPagoOpen] = useState(false);
  const [ofertaSeleccionada, setOfertaSeleccionada] = useState(null);

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

  // Scroll infinito con useInfiniteQuery
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useInfiniteQuery({
    queryKey: ['ofertas', searchTerm, estadoFiltro, mesSeleccionado, añoSeleccionado],
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

  // Calcular métricas de ofertas
  const ofertasPendientes = ofertas.filter(o => o.estado === 'pendiente').length;
  const ofertasAceptadas = ofertas.filter(o => o.estado === 'aceptada').length;
  const ofertasRechazadas = ofertas.filter(o => o.estado === 'rechazada').length;
  const valorPendiente = ofertas
    .filter(o => o.estado === 'pendiente')
    .reduce((sum, o) => sum + parseFloat(o.total_final || 0), 0);
  const tasaConversion = totalOfertas > 0
    ? ((ofertasAceptadas / totalOfertas) * 100).toFixed(1)
    : '0.0';

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

  // DEPRECATED: Ya no marcamos la oferta como "aceptada" hasta que se cree el contrato
  // La oferta se marcará como "aceptada" automáticamente cuando se cree el contrato exitosamente
  // Esto evita que quede en estado "aceptada" si el usuario cancela el plan de pagos

  // Mutation para rechazar oferta
  const rechazarMutation = useMutation({
    mutationFn: async (ofertaId) => {
      const response = await api.put(`/ofertas/${ofertaId}/rechazar`);
      return response.data;
    },
    onSuccess: async () => {
      // Invalidar y forzar refetch inmediato
      await queryClient.invalidateQueries({ queryKey: ['ofertas'], refetchType: 'active' });
    },
  });

  // Mutation para crear contrato
  const crearContratoMutation = useMutation({
    mutationFn: async ({ ofertaId, planPago }) => {
      const response = await api.post('/contratos', {
        oferta_id: ofertaId,
        tipo_pago: planPago.tipo_pago,
        numero_plazos: planPago.numero_plazos,
        dia_mes_pago: planPago.dia_mes_pago,
        plan_pagos: planPago.plan_pagos,
        meses_financiamiento: planPago.tipo_pago === 'plazos' ? planPago.numero_plazos : 1,
        nombre_evento: 'Evento',
        pago_reserva_id: planPago.pago_reserva_id
      });
      return response.data;
    },
    onSuccess: async () => {
      // Invalidar y forzar refetch inmediato de todas las queries relacionadas
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['ofertas'], refetchType: 'active' }),
        queryClient.invalidateQueries({ queryKey: ['contratos'], refetchType: 'active' }),
        queryClient.invalidateQueries({ queryKey: ['calendario-todos'], refetchType: 'active' }),
        queryClient.invalidateQueries({ queryKey: ['calendario-mensual'], refetchType: 'active' }),
        queryClient.invalidateQueries({ queryKey: ['calendario-citas'], refetchType: 'active' })
      ]);
      setModalPlanPagoOpen(false);
      setOfertaSeleccionada(null);
      toast.success('Contrato creado exitosamente');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Error al crear contrato');
    },
  });

  const handleAceptar = (oferta) => {
    // Ya no marcamos la oferta como "aceptada" aquí
    // En su lugar, abrimos directamente el modal de plan de pagos
    // La oferta se marcará como "aceptada" automáticamente cuando se cree el contrato
    const ofertaConTotal = { ...oferta };
    if (ofertaConTotal.total_final) {
      ofertaConTotal.total_final = parseFloat(ofertaConTotal.total_final);
    }
    setOfertaSeleccionada(ofertaConTotal);
    setModalPlanPagoOpen(true);
  };

  const handleRechazar = (ofertaId) => {
    rechazarMutation.mutate(ofertaId);
    toast.success('Oferta rechazada exitosamente');
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
        params: { lang: 'es' },
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
      toast.error('Error al completar la operación');
      console.error(error);
    }
  };

  const getEstadoColor = (estado) => {
    switch (estado) {
      case 'pendiente':
        return 'bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800';
      case 'aceptada':
        return 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
      case 'rechazada':
        return 'bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Ofertas</h2>
          <p className="text-sm md:text-base text-muted-foreground">
            Gestiona tus propuestas comerciales
          </p>
        </div>
        <Button size="lg" asChild className="w-full md:w-auto whitespace-nowrap">
          <Link to="/ofertas/nueva">
            <Plus className="h-5 w-5 mr-2" />
            Nueva Oferta
          </Link>
        </Button>
      </div>

      {/* Panel de Métricas */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total de Ofertas */}
        <Card className="bg-card relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 group border-l-4 border-l-blue-500">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-transparent dark:from-blue-950/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <CardHeader className="pb-2 relative z-10">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Ofertas
            </CardTitle>
            <div className="absolute top-4 right-4 p-2 bg-blue-100 dark:bg-blue-900/30 rounded-full text-blue-600 dark:text-blue-400">
              <FileText className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent className="pt-0 relative z-10">
            <div className="text-3xl font-bold tracking-tight">{totalOfertas}</div>
            <p className="text-xs text-muted-foreground mt-1 font-medium">Total de ofertas</p>
          </CardContent>
        </Card>

        {/* Pendientes */}
        <Card className="bg-card relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 group border-l-4 border-l-amber-500">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-50/50 to-transparent dark:from-amber-950/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <CardHeader className="pb-2 relative z-10">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Pendiente
            </CardTitle>
            <div className="absolute top-4 right-4 p-2 bg-amber-100 dark:bg-amber-900/30 rounded-full text-amber-600 dark:text-amber-400">
              <Clock className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent className="pt-0 relative z-10">
            <div className="text-3xl font-bold tracking-tight">{ofertasPendientes}</div>
            <p className="text-xs text-muted-foreground mt-1 font-medium">
              ${valorPendiente.toLocaleString()} en espera
            </p>
          </CardContent>
        </Card>

        {/* Aceptadas */}
        <Card className="bg-card relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 group border-l-4 border-l-emerald-500">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/50 to-transparent dark:from-emerald-950/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <CardHeader className="pb-2 relative z-10">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Aceptada
            </CardTitle>
            <div className="absolute top-4 right-4 p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-full text-emerald-600 dark:text-emerald-400">
              <CheckCircle className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent className="pt-0 relative z-10">
            <div className="text-3xl font-bold tracking-tight">{ofertasAceptadas}</div>
            <p className="text-xs text-muted-foreground mt-1 font-medium">
              Tasa: {tasaConversion}%
            </p>
          </CardContent>
        </Card>

        {/* Rechazadas */}
        <Card className="bg-card relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 group border-l-4 border-l-red-500">
          <div className="absolute inset-0 bg-gradient-to-br from-red-50/50 to-transparent dark:from-red-950/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <CardHeader className="pb-2 relative z-10">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Rechazada
            </CardTitle>
            <div className="absolute top-4 right-4 p-2 bg-red-100 dark:bg-red-900/30 rounded-full text-red-600 dark:text-red-400">
              <XCircle className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent className="pt-0 relative z-10">
            <div className="text-3xl font-bold tracking-tight">{ofertasRechazadas}</div>
            <p className="text-xs text-muted-foreground mt-1 font-medium">Ofertas rechazadas</p>
          </CardContent>
        </Card>
      </div>

      {/* Búsqueda y filtros */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
              <Input
                type="text"
                placeholder="Buscar oferta..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={estadoFiltro} onValueChange={setEstadoFiltro}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Todos los estados" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos los estados</SelectItem>
                <SelectItem value="pendiente">Pendiente</SelectItem>
                <SelectItem value="aceptada">Aceptada</SelectItem>
                <SelectItem value="rechazada">Rechazada</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Filtro por Mes y Año */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => cambiarMes('anterior')}
              title="Mes anterior"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <Select value={mesSeleccionado.toString()} onValueChange={(value) => setMesSeleccionado(parseInt(value))}>
              <SelectTrigger className="w-auto min-w-[180px] [&>span]:line-clamp-none [&>span]:whitespace-nowrap">
                <Calendar className="h-4 w-4 mr-2 flex-shrink-0" />
                <SelectValue placeholder="Seleccionar mes">
                  {nombresMeses[mesSeleccionado - 1]}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {nombresMeses.map((mes, index) => (
                  <SelectItem key={index} value={(index + 1).toString()}>
                    {mes}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={añoSeleccionado.toString()} onValueChange={(value) => setAñoSeleccionado(parseInt(value))}>
              <SelectTrigger className="w-[100px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: Math.max(8, 2030 - fechaActual.getFullYear() + 3) }, (_, i) => {
                  const año = fechaActual.getFullYear() - 2 + i;
                  return año <= 2030 ? año : null;
                }).filter(año => año !== null).map(año => (
                  <SelectItem key={año} value={año.toString()}>
                    {año}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              size="icon"
              onClick={() => cambiarMes('siguiente')}
              title="Mes siguiente"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>

            {(mesSeleccionado !== fechaActual.getMonth() + 1 || añoSeleccionado !== fechaActual.getFullYear()) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={resetearMes}
                title="Volver al mes actual"
              >
                Hoy
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Lista de ofertas */}
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-32 mb-2" />
                <Skeleton className="h-4 w-3/4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-2/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : ofertas.length === 0 ? (
        <Card>
          <CardContent className="pt-12 pb-12 text-center">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">
              {searchTerm || estadoFiltro ? 'No hay ofertas registradas' : 'No hay ofertas registradas'}
            </h3>
            <p className="text-muted-foreground mb-6">
              {searchTerm || estadoFiltro ? 'Buscar oferta...' : 'Nueva Oferta'}
            </p>
            {!searchTerm && !estadoFiltro && (
              <Button asChild>
                <Link to="/ofertas/nueva">
                  <Plus className="h-4 w-4 mr-2" />
                  Nueva Oferta
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {ofertas.map((oferta) => {
            // Determinar color del borde izquierdo según estado
            const colorBorde = oferta.estado === 'aceptada'
              ? 'border-l-green-500'
              : oferta.estado === 'pendiente'
                ? 'border-l-yellow-500'
                : 'border-l-red-500';

            return (
              <Card key={oferta.id} className={`hover:shadow-md transition-shadow border-l-4 ${colorBorde}`}>
                <CardContent className="pt-6">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-base font-semibold text-foreground">
                          {oferta.codigo_oferta}
                        </h3>
                        <Badge variant="outline" className={getEstadoColor(oferta.estado)}>
                          {oferta.estado.charAt(0).toUpperCase() + oferta.estado.slice(1)}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-1">
                        Cliente: <span className="font-medium text-foreground">{oferta.clientes?.nombre_completo}</span>
                        {oferta.homenajeado && (
                          <span className="ml-2 text-foreground">
                            {oferta.homenajeado}
                          </span>
                        )}
                      </p>
                      {oferta.tipo_evento && (
                        <p className="text-xs text-muted-foreground mb-1">
                          Tipo de evento: <span className="font-medium text-foreground capitalize">{oferta.tipo_evento}</span>
                        </p>
                      )}
                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mt-2">
                        {oferta.fecha_evento && (
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5" />
                            {new Date(oferta.fecha_evento).toLocaleDateString('es-ES', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                              timeZone: 'America/New_York' // Usar zona horaria de Miami para consistencia
                            })}
                          </div>
                        )}
                        {oferta.hora_inicio && oferta.hora_fin && (
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5" />
                            <span className="font-medium text-foreground">
                              {(() => {
                                // Calcular la duración que el usuario seleccionó
                                const duracionSeleccionada = calcularDuracion(oferta.hora_inicio, oferta.hora_fin);
                                
                                // Obtener duración base del paquete
                                const duracionPaquete = oferta.paquetes?.duracion_horas || 4;
                                
                                // Calcular horas extras "implícitas" en la selección del usuario
                                // (si seleccionó más tiempo que el paquete, esas horas ya están en hora_fin)
                                const horasExtrasImplicitas = Math.max(0, Math.ceil(duracionSeleccionada - duracionPaquete));
                                
                                // Obtener horas extras reales de los servicios adicionales
                                const horasExtrasEnServicios = obtenerHorasAdicionales(oferta.ofertas_servicios_adicionales || []);
                                
                                // Solo sumar las horas extras que NO están ya incluidas en hora_fin
                                const horasExtrasAdicionales = Math.max(0, horasExtrasEnServicios - horasExtrasImplicitas);
                                
                                // Calcular hora fin real y duración total
                                const horaFinReal = horasExtrasAdicionales > 0 
                                  ? calcularHoraFinConExtras(oferta.hora_fin, horasExtrasAdicionales)
                                  : oferta.hora_fin;
                                const duracionTotal = calcularDuracion(oferta.hora_inicio, horaFinReal);

                                return (
                                  <>
                                    {formatearHora(oferta.hora_inicio)} - {formatearHora(horaFinReal)}
                                    {duracionTotal > 0 && (() => {
                                      const horasEnteras = Math.floor(duracionTotal);
                                      const minutos = Math.round((duracionTotal - horasEnteras) * 60);
                                      if (minutos > 0 && minutos < 60) {
                                        return ` (${horasEnteras}h ${minutos}m)`;
                                      }
                                      return ` (${horasEnteras}h)`;
                                    })()}
                                  </>
                                );
                              })()}
                            </span>
                          </div>
                        )}
                        <div className="flex items-center gap-1.5">
                          <span className="font-medium text-foreground">{oferta.cantidad_invitados} invitados</span>
                        </div>
                        {(oferta.lugar_salon || oferta.salones?.nombre) && (
                          <div className="flex items-center gap-1.5">
                            <span className="text-foreground font-medium">
                              {oferta.lugar_salon || oferta.salones?.nombre}
                            </span>
                          </div>
                        )}
                        {oferta.paquetes?.nombre && (
                          <div className="flex items-center gap-1.5">
                            <span className="text-muted-foreground">Paquete: {oferta.paquetes.nombre}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="lg:text-right">
                      <div className="mb-2">
                        <p className="text-sm text-muted-foreground">Total</p>
                        <p className="text-xl font-bold text-foreground">
                          ${parseFloat(oferta.total_final).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Acciones - Todos los botones juntos */}
                  <div className="mt-4 pt-4 border-t flex gap-2 flex-wrap">
                    <Button
                      variant="outline"
                      onClick={() => handleDescargarPDF(oferta.id, oferta.codigo_oferta)}
                      className="whitespace-nowrap"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Descargar PDF
                    </Button>

                    {oferta.estado === 'pendiente' && (
                      <>
                        <Button
                          variant="outline"
                          onClick={() => handleAceptar(oferta)}
                          className="!border-green-500 !text-green-600 hover:!bg-green-50 dark:!border-green-500 dark:!text-green-400 dark:hover:!bg-green-950/20 whitespace-nowrap"
                        >
                          Aceptar Oferta
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => handleRechazar(oferta.id)}
                          disabled={rechazarMutation.isPending}
                          className="border-red-300 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950/20 whitespace-nowrap"
                        >
                          {rechazarMutation.isPending ? 'Rechazando...' : 'Rechazar'}
                        </Button>
                      </>
                    )}

                    {oferta.estado === 'aceptada' && !oferta.contratos?.length && (
                      <Button
                        variant="outline"
                        onClick={() => handleCrearContrato(oferta)}
                        disabled={crearContratoMutation.isPending}
                        className="whitespace-nowrap"
                      >
                        {crearContratoMutation.isPending ? 'Creando...' : 'Plan de Pago →'}
                      </Button>
                    )}

                    {oferta.estado === 'aceptada' && oferta.contratos?.length > 0 && (
                      <Badge variant="outline" className="bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800">
                        <FileText className="w-4 h-4 mr-2" />
                        Contrato ya creado
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}

          {/* Observador para scroll infinito */}
          <div ref={observerTarget} className="h-10 flex items-center justify-center py-4">
            {isFetchingNextPage && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="text-sm">Cargando más ofertas...</span>
              </div>
            )}
          </div>

          {/* Indicador de fin */}
          {!hasNextPage && ofertas.length > 0 && (
            <div className="text-center py-4 text-muted-foreground text-sm">
              Ofertas: {totalOfertas}
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
        totalContrato={ofertaSeleccionada?.total_final ? parseFloat(ofertaSeleccionada.total_final) : 0}
        ofertaId={ofertaSeleccionada?.id}
        clienteId={ofertaSeleccionada?.cliente_id}
      />
    </div>
  );
}

export default Ofertas;
