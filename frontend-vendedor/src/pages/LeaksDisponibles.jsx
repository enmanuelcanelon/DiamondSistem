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
  RefreshCw
} from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../config/api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Skeleton } from '../components/ui/skeleton';
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
  const [filtroSalon, setFiltroSalon] = useState('');
  const [ordenarPor, setOrdenarPor] = useState('desc'); // 'asc' = más antigua, 'desc' = más reciente
  const [leakSeleccionado, setLeakSeleccionado] = useState(null);
  const [modalDetalleOpen, setModalDetalleOpen] = useState(false);
  const [resultadoSincronizacion, setResultadoSincronizacion] = useState(null);

  // Query para leaks disponibles
  const { data: disponiblesData, isLoading: isLoadingDisponibles } = useQuery({
    queryKey: ['leaks-disponibles', filtroSalon, ordenarPor],
    queryFn: async () => {
      const params = {};
      if (filtroSalon) params.salon = filtroSalon;
      if (ordenarPor) params.ordenar = ordenarPor;
      const response = await api.get('/leaks/disponibles', { params });
      return response.data;
    },
  });

  // Mutation para tomar un leak
  const tomarLeakMutation = useMutation({
    mutationFn: async (leakId) => {
      const response = await api.post(`/leaks/${leakId}/tomar`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['leaks-disponibles']);
      queryClient.invalidateQueries(['leaks-mios']);
      queryClient.invalidateQueries(['leaks-stats']);
      toast.success('Leak asignado exitosamente');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Error al tomar el leak');
    },
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
      toast.success(data.message || 'Leaks disponibles eliminados exitosamente');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Error al eliminar leaks disponibles');
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


  const handleTomarLeak = (leakId) => {
    tomarLeakMutation.mutate(leakId);
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
    if (window.confirm('¿Estás seguro de que deseas eliminar TODOS los leaks disponibles? Esta acción no se puede deshacer.')) {
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
          <p className="text-muted-foreground">No hay leaks disponibles</p>
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
                      disabled={tomarLeakMutation.isPending}
                      className="h-7 text-xs px-2"
                    >
                      <UserPlus className="w-3 h-3 mr-1" />
                      Tomar
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
            <h2 className="text-3xl font-bold tracking-tight">Leaks Disponibles</h2>
            <p className="text-muted-foreground">
              Leaks sin asignar que puedes tomar. Se sincronizan automáticamente cada 3 minutos.
            </p>
          </div>
        </div>
        <Button
          onClick={() => {
            setResultadoSincronizacion(null);
            sincronizarMutation.mutate();
          }}
          disabled={sincronizarMutation.isPending}
          variant="outline"
        >
          {sincronizarMutation.isPending ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Sincronizando...
            </>
          ) : (
            <>
              <RefreshCw className="w-4 h-4 mr-2" />
              Sincronizar Ahora
            </>
          )}
        </Button>
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
              {resultadoSincronizacion.duplicados > 0 && (
                <p className="text-yellow-700 dark:text-yellow-300 mt-1">
                  ⚠ {resultadoSincronizacion.duplicados} duplicados omitidos
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

      {/* Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Filtrar por Salón</label>
              <Select value={filtroSalon} onValueChange={setFiltroSalon}>
                <SelectTrigger>
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
            <div>
              <label className="text-sm font-medium mb-2 block">Fecha Rec</label>
              <Select value={ordenarPor} onValueChange={setOrdenarPor}>
                <SelectTrigger>
                  <SelectValue>
                    {ordenarPor === 'asc' ? 'Fecha más antigua' : 'Fecha más reciente'}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="desc">
                    <div className="flex items-center gap-2">
                      <ArrowDown className="w-4 h-4" />
                      Fecha más reciente
                    </div>
                  </SelectItem>
                  <SelectItem value="asc">
                    <div className="flex items-center gap-2">
                      <ArrowUp className="w-4 h-4" />
                      Fecha más antigua
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de Leaks */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CardTitle>Leaks Disponibles</CardTitle>
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

