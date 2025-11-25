import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Phone, 
  Mail, 
  Users, 
  Loader2, 
  Eye,
  UserPlus,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Trash2,
  ArrowLeft,
  Trophy
} from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../config/api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Skeleton } from '../components/ui/skeleton';
import ModalCambiarEstadoLeak from '../components/ModalCambiarEstadoLeak';
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

function LeaksMios() {
  const queryClient = useQueryClient();
  const [filtroEstado, setFiltroEstado] = useState('nuevo');
  const [filtroSalon, setFiltroSalon] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [leakSeleccionado, setLeakSeleccionado] = useState(null);
  const [modalEstadoOpen, setModalEstadoOpen] = useState(false);
  const [modalDetalleOpen, setModalDetalleOpen] = useState(false);

  // Query para mis leaks
  const { data: misLeaksData, isLoading: isLoadingMisLeaks } = useQuery({
    queryKey: ['leaks-mios', filtroEstado, filtroSalon, searchTerm],
    queryFn: async () => {
      const params = {};
      if (filtroEstado) params.estado = filtroEstado;
      if (filtroSalon) params.salon = filtroSalon;
      if (searchTerm) params.search = searchTerm;
      const response = await api.get('/leaks', { params });
      return response.data;
    },
    staleTime: 10 * 60 * 1000, // Los datos se consideran frescos por 10 minutos (aumentado)
    gcTime: 30 * 60 * 1000, // Mantener en caché por 30 minutos (aumentado)
    refetchInterval: false, // Sin refresco automático - solo manual
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: false, // No refetch al cambiar de pestaña
    refetchOnMount: false, // No refetch al montar si los datos están frescos
    retry: (failureCount, error) => {
      // No reintentar si es error 429 (rate limit)
      if (error?.response?.status === 429) return false;
      return failureCount < 2;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
  });

  // Mutation para eliminar un leak individual
  const eliminarLeakMutation = useMutation({
    mutationFn: async (leakId) => {
      const response = await api.delete(`/leaks/${leakId}`);
      return response.data;
    },
    onSuccess: async (data) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['leaks-mios'], refetchType: 'active' }),
        queryClient.invalidateQueries({ queryKey: ['leaks-stats'], refetchType: 'active' })
      ]);
      toast.success(data.message || 'Leak eliminado exitosamente');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Error al eliminar el leak');
    },
  });

  const handleCambiarEstado = (leak) => {
    setLeakSeleccionado(leak);
    setModalEstadoOpen(true);
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

  const getEstadoBadge = (estado) => {
    const estados = {
      nuevo: { label: 'Nuevos', variant: 'default', icon: UserPlus },
      interesado: { label: 'Interesado', variant: 'default', icon: CheckCircle },
      contactado_llamar_luego: { label: 'Contactado Llamar Luego', variant: 'secondary', icon: Clock },
      no_contesta_llamar_luego: { label: 'No Contesta Llamar Luego', variant: 'secondary', icon: AlertCircle },
      contactado_no_interesado: { label: 'Contactado No Interesado', variant: 'destructive', icon: XCircle },
      convertido: { label: 'Convertido', variant: 'default', icon: Trophy },
    };
    return estados[estado] || { label: estado || 'Sin estado', variant: 'outline', icon: AlertCircle };
  };

  const leaksMios = misLeaksData?.data || [];
  const totalMios = misLeaksData?.total || 0;

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
          <p className="text-muted-foreground">No hay leaks asignados</p>
        </div>
      );
    }

    return (
      <Table className="w-full">
        <TableHeader>
          <TableRow>
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
          {leaks.map((leak) => {
            const estadoInfo = getEstadoBadge(leak.estado);
            const EstadoIcon = estadoInfo.icon;
            return (
              <TableRow key={leak.id}>
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
                  <Badge variant={estadoInfo.variant} className="text-xs">
                    <EstadoIcon className="w-3 h-3 mr-1" />
                    {estadoInfo.label}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleCambiarEstado(leak)}
                      className="h-7 text-xs px-2"
                    >
                      Estado
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
            <Link to="/leads" title="Volver al Dashboard">
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </Button>
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Mis Leads</h2>
            <p className="text-muted-foreground">
              Leaks asignados a ti
            </p>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Estado</label>
              <Select value={filtroEstado} onValueChange={setFiltroEstado}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar por estado">
                    {filtroEstado ? getEstadoBadge(filtroEstado).label : 'Filtrar por estado'}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="nuevo">Nuevos</SelectItem>
                  <SelectItem value="interesado">Interesado</SelectItem>
                  <SelectItem value="contactado_llamar_luego">Contactado Llamar Luego</SelectItem>
                  <SelectItem value="no_contesta_llamar_luego">No Contesta Llamar Luego</SelectItem>
                  <SelectItem value="contactado_no_interesado">Contactado No Interesado</SelectItem>
                  <SelectItem value="convertido">Convertido</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Salón</label>
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
              <label className="text-sm font-medium mb-2 block">Buscar</label>
              <Input
                placeholder="Nombre, email, teléfono..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de Leaks */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CardTitle>Mis Leads</CardTitle>
              <Badge variant="secondary">
                {totalMios} total
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {renderTablaLeaks(leaksMios, isLoadingMisLeaks)}
        </CardContent>
      </Card>

      {/* Modales */}
      {modalEstadoOpen && leakSeleccionado && (
        <ModalCambiarEstadoLeak
          isOpen={modalEstadoOpen}
          onClose={() => {
            setModalEstadoOpen(false);
            setLeakSeleccionado(null);
          }}
          leak={leakSeleccionado}
          onSuccess={async () => {
            await queryClient.invalidateQueries({ queryKey: ['leaks-mios'], refetchType: 'active' });
          }}
        />
      )}

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

export default LeaksMios;

