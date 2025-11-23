import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Phone, 
  Mail, 
  Users, 
  Loader2, 
  Eye,
  UserPlus,
  Trash2,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  RefreshCw,
  Search,
  Calendar,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../config/api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Skeleton } from '../components/ui/skeleton';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import ModalDetalleLeak from '../components/ModalDetalleLeak';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

// Función helper para parsear fechas sin problemas de timezone
const parsearFechaLocal = (fecha) => {
  if (!fecha) return null;
  
  // Si es un string en formato YYYY-MM-DD, parsearlo como fecha local
  if (typeof fecha === 'string') {
    // Extraer solo la parte de fecha (antes de T o espacio)
    const datePart = fecha.split('T')[0].split(' ')[0];
    if (datePart.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const [year, month, day] = datePart.split('-').map(Number);
      // Crear fecha en timezone local (medianoche local)
      return new Date(year, month - 1, day);
    }
  }
  
  // Si es un objeto Date, extraer año, mes, día y crear nueva fecha local
  if (fecha instanceof Date) {
    const year = fecha.getFullYear();
    const month = fecha.getMonth();
    const day = fecha.getDate();
    return new Date(year, month, day);
  }
  
  // Si es un string ISO con timezone, extraer solo la parte de fecha
  if (typeof fecha === 'string') {
    const datePart = fecha.split('T')[0].split(' ')[0];
    if (datePart.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const [year, month, day] = datePart.split('-').map(Number);
      return new Date(year, month - 1, day);
    }
  }
  
  // Último recurso: parsear normalmente y luego extraer año/mes/día
  const date = new Date(fecha);
  if (!isNaN(date.getTime())) {
    const year = date.getFullYear();
    const month = date.getMonth();
    const day = date.getDate();
    return new Date(year, month, day);
  }
  
  return null;
};

function LeaksDisponibles() {
  const queryClient = useQueryClient();
  const fechaActual = new Date();
  const [filtroSalon, setFiltroSalon] = useState('');
  const [ordenarPorFechaEvento, setOrdenarPorFechaEvento] = useState(''); // '' = no usar, 'asc' = más antigua, 'desc' = más reciente (fecha_evento)
  const [ordenarPorFechaRecepcion, setOrdenarPorFechaRecepcion] = useState(''); // '' = no usar, 'asc' = más antigua, 'desc' = más reciente (fecha_recepcion)
  const [searchTerm, setSearchTerm] = useState('');
  const [mesSeleccionado, setMesSeleccionado] = useState(fechaActual.getMonth() + 1);
  const [añoSeleccionado, setAñoSeleccionado] = useState(fechaActual.getFullYear());
  const [limiteMostrar, setLimiteMostrar] = useState('todos'); // 'todos', '15', '25', '50'
  const [leakSeleccionado, setLeakSeleccionado] = useState(null);
  const [modalDetalleOpen, setModalDetalleOpen] = useState(false);
  const [resultadoSincronizacion, setResultadoSincronizacion] = useState(null);

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

  // Query para leaks disponibles
  const { 
    data: disponiblesData, 
    isLoading: isLoadingDisponibles,
    isRefetching: isRefetchingDisponibles,
    refetch: refetchDisponibles
  } = useQuery({
    queryKey: ['leaks-disponibles', filtroSalon, ordenarPorFechaEvento, ordenarPorFechaRecepcion, searchTerm, mesSeleccionado, añoSeleccionado, limiteMostrar],
    queryFn: async () => {
      const params = {};
      if (filtroSalon) params.salon = filtroSalon;
      // Priorizar ordenamiento por fecha_evento si está activo, sino usar fecha_recepcion
      if (ordenarPorFechaEvento && ordenarPorFechaEvento !== '') {
        params.ordenar = `fecha_evento_${ordenarPorFechaEvento}`;
      } else if (ordenarPorFechaRecepcion && ordenarPorFechaRecepcion !== '') {
        params.ordenar = `fecha_recepcion_${ordenarPorFechaRecepcion}`;
      }
      // Si ninguno está activo, usar ordenamiento por defecto (fecha_recepcion desc)
      if (!params.ordenar) {
        params.ordenar = 'fecha_recepcion_desc';
      }
      if (searchTerm) params.search = searchTerm;
      if (mesSeleccionado) params.mes = mesSeleccionado.toString();
      if (añoSeleccionado) params.año = añoSeleccionado.toString();
      if (limiteMostrar && limiteMostrar !== 'todos') params.limit = limiteMostrar;
      const response = await api.get('/leaks/disponibles', { params });
      return response.data;
    },
    staleTime: 2 * 60 * 1000, // Los datos se consideran frescos por 2 minutos
    gcTime: 5 * 60 * 1000, // Mantener en caché por 5 minutos
    refetchInterval: 3 * 60 * 1000, // Auto-refresh cada 3 minutos (optimizado de 60 segundos)
    refetchIntervalInBackground: false, // No refetch cuando la pestaña está en background
    refetchOnWindowFocus: false, // No refetch al cambiar de pestaña (reduce carga)
    refetchOnReconnect: true, // Refetch cuando se reconecta
    retry: (failureCount, error) => {
      // No reintentar si es error 429 (rate limit)
      if (error?.response?.status === 429) return false;
      return failureCount < 2; // Máximo 2 reintentos
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000), // Exponential backoff
  });

  // Mutation para tomar un leak
  const tomarLeakMutation = useMutation({
    mutationFn: async (leakId) => {
      const response = await api.post(`/leaks/${leakId}/tomar`);
      return response.data;
    },
    onSuccess: async (data, leakId) => {
      // Optimistic update: remover el leak de la lista local inmediatamente
      queryClient.setQueryData(
        ['leaks-disponibles', filtroSalon, ordenarPorFechaEvento, ordenarPorFechaRecepcion, searchTerm, mesSeleccionado, añoSeleccionado, limiteMostrar],
        (oldData) => {
          if (!oldData) return oldData;
          return {
            ...oldData,
            data: (oldData.data || []).filter(leak => leak.id !== leakId),
            total: (oldData.total || oldData.count || 0) - 1,
            count: (oldData.count || oldData.total || 0) - 1
          };
        }
      );
      
      // Invalidar queries sin refetch inmediato (se refetchearán en el próximo intervalo)
      // Esto evita múltiples requests simultáneos
      queryClient.invalidateQueries(['leaks-disponibles'], { refetchType: 'none' });
      queryClient.invalidateQueries(['leaks-mios'], { refetchType: 'none' });
      queryClient.invalidateQueries(['leaks-stats'], { refetchType: 'none' });
      
      // NO hacer refetch inmediato - dejar que el refetchInterval lo maneje
      // Esto previene acumulación de requests
      
      toast.success('Leak asignado exitosamente');
    },
    onError: (error) => {
      // Si hay error, solo invalidar sin refetch inmediato
      queryClient.invalidateQueries(['leaks-disponibles'], { refetchType: 'none' });
      
      // NO hacer refetch automático - dejar que el refetchInterval lo maneje
      // Esto previene acumulación de requests cuando hay rate limiting
      
      const errorMessage = error?.isRateLimit || error.response?.status === 429 
        ? 'Demasiadas solicitudes. El sistema se pausará automáticamente. Por favor espera un momento.'
        : error.response?.data?.message || 'Error al tomar el leak';
      toast.error(errorMessage);
    },
    retry: (failureCount, error) => {
      // No reintentar si es error 429 (rate limit)
      if (error.response?.status === 429) return false;
      return failureCount < 2; // Reintentar máximo 2 veces
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
  });

  // Mutation para limpiar leaks disponibles
  const limpiarDisponiblesMutation = useMutation({
    mutationFn: async () => {
      const response = await api.delete('/leaks/disponibles');
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries(['leaks-disponibles']);
      queryClient.invalidateQueries(['leaks-stats']);
      toast.success(data.message || 'Leads disponibles eliminados exitosamente');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Error al eliminar leads disponibles');
    },
  });

  // Mutation para eliminar un leak individual
  const eliminarLeakMutation = useMutation({
    mutationFn: async (leakId) => {
      const response = await api.delete(`/leaks/${leakId}`);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries(['leaks-disponibles']);
      queryClient.invalidateQueries(['leaks-stats']);
      toast.success(data.message || 'Leak eliminado exitosamente');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Error al eliminar el leak');
    },
  });


  const [leakTomandoId, setLeakTomandoId] = useState(null);

  const handleTomarLeak = (leakId) => {
    setLeakTomandoId(leakId);
    tomarLeakMutation.mutate(leakId, {
      onSettled: () => {
        setLeakTomandoId(null);
      }
    });
  };

  const handleVerDetalle = (leak) => {
    setLeakSeleccionado(leak);
    setModalDetalleOpen(true);
  };

  const handleEliminarLeak = (leakId, nombreCompleto) => {
    if (window.confirm(`¿Estás seguro de que deseas eliminar el leak de ${nombreCompleto}? Esta acción no se puede deshacer.`)) {
      eliminarLeakMutation.mutate(leakId);
    }
  };

  const handleLimpiarDisponibles = () => {
    if (window.confirm('¿Estás seguro de que deseas eliminar TODOS los leads disponibles? Esta acción no se puede deshacer.')) {
      limpiarDisponiblesMutation.mutate();
    }
  };

  // Mutation para sincronizar manualmente (temporal para debugging)
  const sincronizarMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post('/leaks/sincronizar');
      return response.data;
    },
    onSuccess: (data) => {
      setResultadoSincronizacion(data);
      queryClient.invalidateQueries(['leaks-disponibles']);
      queryClient.invalidateQueries(['leaks-stats']);
      queryClient.refetchQueries(['leaks-disponibles']);
      toast.success(data.message || 'Sincronización completada');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Error al sincronizar');
    },
  });

  const leaksDisponibles = disponiblesData?.data || [];
  const totalDisponibles = disponiblesData?.total || disponiblesData?.count || 0;

  const renderTablaLeaks = (leaks, isLoading) => {
    if (isLoading) {
      return (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      );
    }

    if (leaks.length === 0) {
      return (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No hay leads disponibles</p>
        </div>
      );
    }

    return (
      <Table className="w-full">
        <TableHeader>
          <TableRow>
            <TableHead className="w-[50px] text-center">#</TableHead>
            <TableHead className="w-[80px]">Fecha Rec.</TableHead>
            <TableHead className="w-[140px]">Nombre</TableHead>
            <TableHead className="w-[110px]">Teléfono</TableHead>
            <TableHead className="w-[160px]">Email</TableHead>
            <TableHead className="w-[100px]">Tipo</TableHead>
            <TableHead className="w-[70px]">Invit.</TableHead>
            <TableHead className="w-[80px]">Salón</TableHead>
            <TableHead className="w-[100px]">Fecha Evento</TableHead>
            <TableHead className="w-[120px]">Fuente</TableHead>
            <TableHead className="w-[110px]">Estado</TableHead>
            <TableHead className="w-[140px]">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {leaks.map((leak, index) => {
            return (
              <TableRow key={leak.id}>
                <TableCell className="text-center text-sm font-medium text-muted-foreground">
                  {index + 1}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                  {leak.fecha_recepcion ? format(parsearFechaLocal(leak.fecha_recepcion), 'yyyy-MM-dd') : '-'}
                </TableCell>
                <TableCell className="font-medium text-sm">
                  <div className="truncate max-w-[120px]" title={leak.nombre_completo}>
                    {leak.nombre_completo}
                  </div>
                </TableCell>
                <TableCell className="text-xs">
                  <div className="flex items-center gap-1">
                    <Phone className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                    <span className="truncate">{leak.telefono}</span>
                  </div>
                </TableCell>
                <TableCell className="text-xs">
                  <div className="flex items-center gap-1">
                    <Mail className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                    <span className="truncate max-w-[140px]" title={leak.email}>
                      {leak.email}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-xs">
                  <div className="truncate max-w-[100px]" title={leak.tipo_evento || '-'}>
                    {leak.tipo_evento || '-'}
                  </div>
                </TableCell>
                <TableCell className="text-xs">
                  <div className="flex items-center gap-1">
                    <Users className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                    {leak.cantidad_invitados || '-'}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="text-xs">
                    {leak.salon_preferido === '?' ? 'Desconocido' : (leak.salon_preferido || '-')}
                  </Badge>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                  {leak.fecha_evento ? format(parsearFechaLocal(leak.fecha_evento), 'yyyy-MM-dd') : '-'}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  <div className="truncate max-w-[100px]" title={leak.fuente || '-'}>
                    {leak.fuente || '-'}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="text-xs">
                    {leak.estado || 'Nuevo'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Button
                      size="sm"
                      onClick={() => handleTomarLeak(leak.id)}
                      disabled={tomarLeakMutation.isPending || leakTomandoId === leak.id}
                      className="h-7 text-xs px-2"
                    >
                      {leakTomandoId === leak.id ? (
                        <>
                          <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                          Tomando...
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-3 h-3 mr-1" />
                          Tomar
                        </>
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleVerDetalle(leak)}
                      className="h-9 w-9 p-0"
                    >
                      <Eye className="w-5 h-5" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleEliminarLeak(leak.id, leak.nombre_completo)}
                      disabled={eliminarLeakMutation.isPending}
                      className="h-9 w-9 p-0 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    );
  };

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
            <Link to="/leaks" title="Volver al Dashboard">
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </Button>
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Leads Disponibles</h2>
            <p className="text-muted-foreground">
              Leaks sin asignar que puedes tomar. Se actualizan automáticamente cada minuto.
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => refetchDisponibles()}
            disabled={isRefetchingDisponibles || isLoadingDisponibles}
            variant="outline"
            className="gap-2"
          >
            {isRefetchingDisponibles ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Refrescando...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4" />
                Refrescar
              </>
            )}
          </Button>
          <Button
            onClick={() => {
              setResultadoSincronizacion(null);
              sincronizarMutation.mutate();
            }}
            disabled={sincronizarMutation.isPending}
            variant="outline"
            className="gap-2"
          >
            {sincronizarMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Sincronizando...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4" />
                Sincronizar Ahora
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Resultado de sincronización */}
      {resultadoSincronizacion && (
        <Card className="border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/20">
          <CardContent className="pt-6">
            <div className="text-sm">
              <p className="font-semibold text-blue-900 dark:text-blue-100">
                {resultadoSincronizacion.success ? 'Sincronización completada' : 'Error en sincronización'}
              </p>
              <p className="text-blue-700 dark:text-blue-300 mt-1">
                {resultadoSincronizacion.message}
              </p>
              {resultadoSincronizacion.creados > 0 && (
                <p className="text-green-700 dark:text-green-300 mt-1">
                  ✓ {resultadoSincronizacion.creados} leaks creados
                </p>
              )}
              {resultadoSincronizacion.omitidas > 0 && (
                <p className="text-orange-700 dark:text-orange-300 mt-1">
                  ⚠ {resultadoSincronizacion.omitidas} filas omitidas (faltan datos obligatorios: nombre, teléfono o email)
                </p>
              )}
              {resultadoSincronizacion.errores > 0 && (
                <p className="text-red-700 dark:text-red-300 mt-1">
                  ✗ {resultadoSincronizacion.errores} errores
                </p>
              )}
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
                placeholder="Buscar por nombre, email o teléfono..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground whitespace-nowrap">Salón:</span>
              <Select value={filtroSalon} onValueChange={setFiltroSalon}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Todos">
                    {filtroSalon === '?' ? 'Desconocido' : 
                     filtroSalon === '' ? 'Todos' :
                     filtroSalon || 'Todos'}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos</SelectItem>
                  <SelectItem value="Diamond">Diamond</SelectItem>
                  <SelectItem value="Kendall">Kendall</SelectItem>
                  <SelectItem value="Doral">Doral</SelectItem>
                  <SelectItem value="?">Desconocido</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground whitespace-nowrap">Ordenar por Fecha Evento:</span>
              <Select value={ordenarPorFechaEvento || 'none'} onValueChange={(value) => setOrdenarPorFechaEvento(value === 'none' ? '' : value)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue>
                    {ordenarPorFechaEvento === 'desc' ? 'Más reciente' : 
                     ordenarPorFechaEvento === 'asc' ? 'Más antigua' : 
                     'No usar'}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No usar</SelectItem>
                  <SelectItem value="desc">Más reciente</SelectItem>
                  <SelectItem value="asc">Más antigua</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground whitespace-nowrap">Ordenar por Fecha Recepción:</span>
              <Select value={ordenarPorFechaRecepcion || 'none'} onValueChange={(value) => setOrdenarPorFechaRecepcion(value === 'none' ? '' : value)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue>
                    {ordenarPorFechaRecepcion === 'desc' ? 'Más reciente' : 
                     ordenarPorFechaRecepcion === 'asc' ? 'Más antigua' : 
                     'No usar'}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No usar</SelectItem>
                  <SelectItem value="desc">Más reciente</SelectItem>
                  <SelectItem value="asc">Más antigua</SelectItem>
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
              >
                Hoy
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tabla de Leaks */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CardTitle>Leads Disponibles</CardTitle>
                <Badge variant="secondary">
                  {totalDisponibles} total
                </Badge>
              </div>
              {leaksDisponibles.length > 0 && (
                <Button
                  onClick={handleLimpiarDisponibles}
                  disabled={limpiarDisponiblesMutation.isPending}
                  variant="destructive"
                  size="sm"
                >
                  {limpiarDisponiblesMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Eliminando...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4 mr-2" />
                      Limpiar Todos
                    </>
                  )}
                </Button>
              )}
            </div>
            {/* Botones de paginación */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm text-muted-foreground">Mostrar:</span>
              <Button
                variant={limiteMostrar === '15' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setLimiteMostrar('15')}
              >
                15
              </Button>
              <Button
                variant={limiteMostrar === '25' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setLimiteMostrar('25')}
              >
                25
              </Button>
              <Button
                variant={limiteMostrar === '50' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setLimiteMostrar('50')}
              >
                50
              </Button>
              <Button
                variant={limiteMostrar === 'todos' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setLimiteMostrar('todos')}
              >
                Todos
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {renderTablaLeaks(leaksDisponibles, isLoadingDisponibles)}
        </CardContent>
      </Card>

      {/* Modal de Detalle */}
      {modalDetalleOpen && leakSeleccionado && (
        <ModalDetalleLeak
          isOpen={modalDetalleOpen}
          onClose={() => {
            setModalDetalleOpen(false);
            setLeakSeleccionado(null);
          }}
          leak={leakSeleccionado}
        />
      )}
    </div>
  );
}

export default LeaksDisponibles;

