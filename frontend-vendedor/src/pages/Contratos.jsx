import { useState, useEffect, useRef, useCallback } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { Search, FileCheck, Calendar, Clock, DollarSign, Eye, Download, X, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import api from '../config/api';
import { generarNombreEvento, getEventoEmoji } from '../utils/eventNames';
import { formatearHora, calcularDuracion, calcularHoraFinConExtras, obtenerHorasAdicionales } from '../utils/formatters';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Progress } from '../components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Skeleton } from '../components/ui/skeleton';

function Contratos() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const clienteIdFromUrl = searchParams.get('cliente_id');
  const fechaActual = new Date();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [mesSeleccionado, setMesSeleccionado] = useState(fechaActual.getMonth() + 1);
  const [añoSeleccionado, setAñoSeleccionado] = useState(fechaActual.getFullYear());
  const [clienteFiltro, setClienteFiltro] = useState(clienteIdFromUrl || '');
  const [filtroEstadoPago, setFiltroEstadoPago] = useState('');
  const [filtroEstadoEvento, setFiltroEstadoEvento] = useState('');

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
    queryKey: ['contratos', searchTerm, clienteFiltro, mesSeleccionado, añoSeleccionado, filtroEstadoPago, filtroEstadoEvento],
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
  });   // Aplanar todos los contratos de todas las páginas
  const contratosRaw = data?.pages.flatMap(page => page.data) || [];
  const totalContratos = data?.pages[0]?.total || 0;

  // Función para determinar si un contrato está finalizado (fecha del evento ya pasó)
  const esContratoFinalizado = (fechaEvento) => {
    if (!fechaEvento) return false;
    const fechaEventoDate = new Date(fechaEvento);
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    fechaEventoDate.setHours(0, 0, 0, 0);
    return fechaEventoDate < hoy;
  };

  // Función para obtener el estado real del evento (activo o finalizado)
  const obtenerEstadoEvento = (contrato) => {
    if (esContratoFinalizado(contrato.fecha_evento)) {
      return 'finalizado';
    }
    return contrato.estado === 'completado' ? 'completado' : 'activo';
  };

  // Función para obtener el estado de pago
  const obtenerEstadoPago = (contrato) => {
    const total = parseFloat(contrato.total_contrato || 0);
    const pagado = parseFloat(contrato.total_pagado || 0);
    const porcentajePago = total > 0 ? (pagado / total) * 100 : 0;
    const esPagadoCompleto = porcentajePago >= 99.5 || parseFloat(contrato.saldo_pendiente || 0) < 1;
    const tienePagoParcial = pagado > 0 && !esPagadoCompleto;
    
    if (esPagadoCompleto) return 'pagado_completo';
    if (tienePagoParcial) return 'pago_parcial';
    return 'pago_pendiente';
  };

  // Filtrar contratos según los filtros de estado
  const contratos = contratosRaw.filter((contrato) => {
    // Filtro por estado de pago
    if (filtroEstadoPago) {
      const estadoPago = obtenerEstadoPago(contrato);
      if (estadoPago !== filtroEstadoPago) return false;
    }

    // Filtro por estado del evento
    if (filtroEstadoEvento) {
      const estadoEvento = obtenerEstadoEvento(contrato);
      if (estadoEvento !== filtroEstadoEvento) return false;
    }

    return true;
  });

  // Obtener nombre del cliente para mostrar en el filtro (del primer contrato que coincida)
  const clienteFiltrado = contratos.find(c => c.cliente_id === parseInt(clienteFiltro))?.clientes;

  // Limpiar filtro de cliente
  const limpiarFiltroCliente = () => {
    setClienteFiltro('');
    navigate('/contratos');
  };

  // Mapeo de valores a etiquetas para los filtros
  const getEstadoPagoLabel = (value) => {
    const map = {
      '': 'Todos',
      'pagado_completo': 'Pagado Completo',
      'pago_parcial': 'Pago Parcial',
    };
    return map[value] || value;
  };

  const getEstadoEventoLabel = (value) => {
    const map = {
      '': 'Todos',
      'activo': 'Activo',
      'finalizado': 'Finalizado',
    };
    return map[value] || value;
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


  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Contratos</h1>
        <p className="text-muted-foreground mt-1">Gestiona tus contratos y pagos</p>
      </div>

      {/* Banner de filtro por cliente */}
      {clienteFiltro && clienteFiltrado && (
        <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                  <span className="text-blue-700 dark:text-blue-300 font-semibold text-sm">
                    {clienteFiltrado.nombre_completo.charAt(0)}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    Filtrando contratos de: <strong>{clienteFiltrado.nombre_completo}</strong>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Mostrando {contratos.length} contrato{contratos.length !== 1 ? 's' : ''}
                    {(filtroEstadoPago || filtroEstadoEvento) && ` (filtrados)`}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={limpiarFiltroCliente}
                className="gap-2"
              >
                <X className="w-4 h-4" />
                Limpiar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Búsqueda y filtros */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="flex gap-4 flex-wrap">
            <div className="flex-1 relative min-w-[200px]">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
              <Input
                type="text"
                placeholder="Buscar por código o cliente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground whitespace-nowrap">Estado de pago:</span>
              <Select value={filtroEstadoPago} onValueChange={setFiltroEstadoPago}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Todos">
                    {getEstadoPagoLabel(filtroEstadoPago)}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos</SelectItem>
                  <SelectItem value="pagado_completo">Pagado Completo</SelectItem>
                  <SelectItem value="pago_parcial">Pago Parcial</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground whitespace-nowrap">Estado del evento:</span>
              <Select value={filtroEstadoEvento} onValueChange={setFiltroEstadoEvento}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Todos">
                    {getEstadoEventoLabel(filtroEstadoEvento)}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos</SelectItem>
                  <SelectItem value="activo">Activo</SelectItem>
                  <SelectItem value="finalizado">Finalizado</SelectItem>
                </SelectContent>
              </Select>
            </div>
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
            
            <Select
              value={mesSeleccionado.toString()}
              onValueChange={(value) => setMesSeleccionado(parseInt(value))}
            >
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
            
            <Select
              value={añoSeleccionado.toString()}
              onValueChange={(value) => setAñoSeleccionado(parseInt(value))}
            >
              <SelectTrigger className="w-[100px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 5 }, (_, i) => fechaActual.getFullYear() - 2 + i).map(año => (
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
                variant="outline"
                size="sm"
                onClick={resetearMes}
                title="Volver al mes actual"
                className="text-xs ml-1"
              >
                Hoy
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Lista de contratos */}
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <Skeleton className="h-6 w-32" />
                  <Skeleton className="h-6 w-24" />
                </div>
                <Skeleton className="h-4 w-3/4" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : contratos.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <FileCheck className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">
              {searchTerm ? 'No se encontraron contratos' : 'No hay contratos'}
            </h3>
            <p className="text-muted-foreground mb-6">
              {searchTerm ? 'Intenta con otros filtros' : 'Los contratos se generan desde las ofertas aceptadas'}
            </p>
            {!searchTerm && (
              <Button asChild>
                <Link to="/ofertas">
                  Ver Ofertas
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {contratos.map((contrato) => {
            // Calcular porcentaje de pago y determinar estado visual
            const total = parseFloat(contrato.total_contrato || 0);
            const pagado = parseFloat(contrato.total_pagado || 0);
            const porcentajePago = total > 0 ? (pagado / total) * 100 : 0;
            
            // Determinar estado de pago visual
            const esPagadoCompleto = porcentajePago >= 99.5 || parseFloat(contrato.saldo_pendiente || 0) < 1;
            const tienePagoParcial = pagado > 0 && !esPagadoCompleto;
            const esPendiente = pagado === 0;
            
            // Obtener estado real del evento
            const estadoEventoReal = obtenerEstadoEvento(contrato);
            
            // Color del borde izquierdo según estado
            const colorBorde = esPagadoCompleto 
              ? 'border-l-green-500' 
              : tienePagoParcial 
              ? 'border-l-blue-500'
              : 'border-l-orange-500';
            
            // Color de la barra de progreso
            const colorProgreso = esPagadoCompleto 
              ? 'bg-green-500' 
              : tienePagoParcial 
              ? 'bg-blue-500'
              : 'bg-orange-500';
            
            // Determinar estilo del badge según estado del evento
            const getBadgeStyle = (estado) => {
              if (estado === 'finalizado') {
                return 'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-950 dark:text-gray-300 dark:border-gray-800';
              }
              if (estado === 'activo') {
                return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800';
              }
              if (estado === 'completado') {
                return 'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-950 dark:text-gray-300 dark:border-gray-800';
              }
              return 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-800';
            };
            
            const getEstadoLabel = (estado) => {
              if (estado === 'finalizado') return 'Finalizado';
              if (estado === 'activo') return 'Activo';
              if (estado === 'completado') return 'Completado';
              return estado.charAt(0).toUpperCase() + estado.slice(1);
            };
            
            return (
            <Card key={contrato.id} className={`hover:shadow-md transition-shadow border-l-4 ${colorBorde}`}>
              <CardContent className="pt-6">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-base font-semibold text-foreground">
                        {contrato.codigo_contrato}
                      </h3>
                      <Badge 
                        variant="outline"
                        className={`text-xs ${getBadgeStyle(estadoEventoReal)}`}
                      >
                        {getEstadoLabel(estadoEventoReal)}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-1">
                      Cliente: <span className="font-medium text-foreground">{contrato.clientes?.nombre_completo || 'Sin cliente'}</span>
                      {contrato.homenajeado && (
                        <span className="ml-2 text-foreground">
                          {contrato.homenajeado}
                        </span>
                      )}
                    </p>
                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mt-2">
                      {contrato.fecha_evento && (
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5" />
                          {new Date(contrato.fecha_evento).toLocaleDateString('es-ES', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </div>
                      )}
                      {contrato.hora_inicio && contrato.hora_fin && (
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5" />
                          <span className="font-medium text-foreground">
                            {(() => {
                              const horasAdicionales = obtenerHorasAdicionales(contrato.contratos_servicios);
                              const horaFinConExtras = calcularHoraFinConExtras(contrato.hora_fin, horasAdicionales);
                              const duracion = calcularDuracion(contrato.hora_inicio, horaFinConExtras);
                              
                              return (
                                <>
                                  {formatearHora(contrato.hora_inicio)} - {formatearHora(horaFinConExtras)}
                                  {duracion > 0 && (() => {
                                    const horasEnteras = Math.floor(duracion);
                                    const minutos = Math.round((duracion - horasEnteras) * 60);
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
                        <span className="font-medium text-foreground">{contrato.cantidad_invitados || 0} invitados</span>
                      </div>
                      {(contrato.lugar_salon || contrato.salones?.nombre) && (
                        <div className="flex items-center gap-1.5">
                          <span className="text-foreground font-medium">
                            {contrato.lugar_salon || contrato.salones?.nombre || 'Sin salón'}
                          </span>
                        </div>
                      )}
                      {contrato.paquetes?.nombre && (
                        <div className="flex items-center gap-1.5">
                          <span className="text-muted-foreground">Paquete: {contrato.paquetes.nombre}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="lg:text-right">
                    <div className="mb-2">
                      <p className="text-sm text-muted-foreground">Total</p>
                      <p className="text-xl font-bold text-foreground">
                        ${total.toLocaleString()}
                      </p>
                    </div>
                    <div className="text-xs space-y-0.5">
                      <div className="flex justify-between gap-3">
                        <span className="text-muted-foreground">Pagado:</span>
                        <span className={`font-medium ${esPagadoCompleto ? 'text-green-600 dark:text-green-400' : 'text-blue-600 dark:text-blue-400'}`}>
                          ${pagado.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between gap-3">
                        <span className="text-muted-foreground">Pendiente:</span>
                        <span className="font-medium text-orange-600 dark:text-orange-400">
                          ${parseFloat(contrato.saldo_pendiente || 0).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Barra de progreso de pago */}
                {esPagadoCompleto ? (
                  <div className="mt-4 pt-4 border-t">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-medium text-green-700 dark:text-green-300">Pago Completo</span>
                      <span className="text-xs font-medium text-green-700 dark:text-green-300">100%</span>
                    </div>
                    <div className="w-full bg-green-200 dark:bg-green-900 rounded-full h-2">
                      <div 
                        className="h-2 rounded-full transition-all bg-green-500"
                        style={{ width: '100%' }}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 pt-4 border-t">
                    <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                      <span>Progreso de Pago</span>
                      <span className="font-medium text-foreground">
                        {porcentajePago.toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-800 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all ${colorProgreso}`}
                        style={{ width: `${porcentajePago}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Acciones */}
                <div className="mt-4 pt-4 border-t flex gap-2 flex-wrap">
                  <Button asChild variant="outline" className="whitespace-nowrap">
                    <Link to={`/contratos/${contrato.id}`} className="flex items-center gap-2">
                      <Eye className="w-4 h-4" />
                      <span>Ver Detalles</span>
                    </Link>
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleDescargarContrato(contrato.id, contrato.codigo_contrato)}
                    className="whitespace-nowrap"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    PDF
                  </Button>
                </div>
              </CardContent>
            </Card>
            );
          })}
          
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
            <div className="text-center py-4 text-muted-foreground text-sm">
              {filtroEstadoPago || filtroEstadoEvento 
                ? `Mostrando ${contratos.length} contrato${contratos.length !== 1 ? 's' : ''} (filtrados)`
                : `Mostrando todos los ${contratos.length} contrato${contratos.length !== 1 ? 's' : ''}`
              }
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default Contratos;




