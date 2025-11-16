import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Phone, 
  Mail, 
  Calendar, 
  Users, 
  MapPin, 
  ExternalLink, 
  Loader2, 
  RefreshCw,
  Eye,
  UserPlus,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle
} from 'lucide-react';
import api from '../config/api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Skeleton } from '../components/ui/skeleton';
import ModalCambiarEstadoLeak from '../components/ModalCambiarEstadoLeak';
import ModalDetalleLeak from '../components/ModalDetalleLeak';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

function Leaks() {
  const queryClient = useQueryClient();
  const [tabActivo, setTabActivo] = useState('disponibles');
  const [filtroEstado, setFiltroEstado] = useState('');
  const [filtroSalon, setFiltroSalon] = useState('');
  const [filtroFuente, setFiltroFuente] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [leakSeleccionado, setLeakSeleccionado] = useState(null);
  const [modalEstadoOpen, setModalEstadoOpen] = useState(false);
  const [modalDetalleOpen, setModalDetalleOpen] = useState(false);

  // Obtener leaks pendientes de contacto (para el badge)
  const { data: pendientesData } = useQuery({
    queryKey: ['leaks-pendientes'],
    queryFn: async () => {
      const response = await api.get('/leaks/pendientes-contacto');
      return response.data;
    },
    refetchInterval: 60000, // Refrescar cada minuto
  });

  const pendientesCount = pendientesData?.count || 0;

  // Query para leaks disponibles
  const { data: disponiblesData, isLoading: isLoadingDisponibles, refetch: refetchDisponibles } = useQuery({
    queryKey: ['leaks-disponibles', filtroSalon],
    queryFn: async () => {
      const params = {};
      if (filtroSalon) params.salon = filtroSalon;
      const response = await api.get('/leaks/disponibles', { params });
      return response.data;
    },
    enabled: tabActivo === 'disponibles',
  });

  // Query para mis leaks
  const { data: misLeaksData, isLoading: isLoadingMisLeaks, refetch: refetchMisLeaks } = useQuery({
    queryKey: ['leaks-mios', filtroEstado, filtroSalon, filtroFuente, searchTerm],
    queryFn: async () => {
      const params = {};
      if (filtroEstado) params.estado = filtroEstado;
      if (filtroSalon) params.salon = filtroSalon;
      if (filtroFuente) params.fuente = filtroFuente;
      if (searchTerm) params.search = searchTerm;
      const response = await api.get('/leaks', { params });
      return response.data;
    },
    enabled: tabActivo === 'mios',
  });

  // Query para pendientes de contacto
  const { data: pendientesLeaksData, isLoading: isLoadingPendientes, refetch: refetchPendientes } = useQuery({
    queryKey: ['leaks-pendientes-lista'],
    queryFn: async () => {
      const response = await api.get('/leaks/pendientes-contacto');
      return response.data;
    },
    enabled: tabActivo === 'pendientes',
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
      queryClient.invalidateQueries(['leaks-pendientes']);
      toast.success('Leak asignado exitosamente');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Error al tomar el leak');
    },
  });

  // Mutation para sincronizar
  const sincronizarMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post('/leaks/sincronizar');
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['leaks-disponibles']);
      queryClient.invalidateQueries(['leaks-mios']);
      queryClient.invalidateQueries(['leaks-pendientes']);
      toast.success('Sincronización iniciada');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Error al sincronizar');
    },
  });

  const handleTomarLeak = (leakId) => {
    tomarLeakMutation.mutate(leakId);
  };

  const handleCambiarEstado = (leak) => {
    setLeakSeleccionado(leak);
    setModalEstadoOpen(true);
  };

  const handleVerDetalle = (leak) => {
    setLeakSeleccionado(leak);
    setModalDetalleOpen(true);
  };

  const getEstadoBadge = (estado) => {
    const estados = {
      nuevo: { label: 'Nuevo', variant: 'default', icon: UserPlus },
      contactado: { label: 'Contactado', variant: 'default', icon: CheckCircle },
      no_contesta: { label: 'No Contesta', variant: 'secondary', icon: Clock },
      rechazado: { label: 'Rechazado', variant: 'destructive', icon: XCircle },
      contactado_llamar_otra_vez: { label: 'Llamar Otra Vez', variant: 'secondary', icon: Phone },
      convertido: { label: 'Convertido', variant: 'default', icon: CheckCircle },
    };
    return estados[estado] || { label: estado, variant: 'outline', icon: AlertCircle };
  };

  const leaksDisponibles = disponiblesData?.data || [];
  const leaksMios = misLeaksData?.data || [];
  const leaksPendientes = pendientesLeaksData?.leaks || [];

  const renderTablaLeaks = (leaks, isLoading, mostrarAcciones = true) => {
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
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Fecha</TableHead>
            <TableHead>Nombre</TableHead>
            <TableHead>Teléfono</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Tipo Evento</TableHead>
            <TableHead>Invitados</TableHead>
            <TableHead>Salón</TableHead>
            <TableHead>Fuente</TableHead>
            <TableHead>Estado</TableHead>
            {mostrarAcciones && <TableHead>Acciones</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {leaks.map((leak) => {
            const estadoInfo = getEstadoBadge(leak.estado);
            const EstadoIcon = estadoInfo.icon;
            return (
              <TableRow key={leak.id}>
                <TableCell className="text-xs text-muted-foreground">
                  {format(new Date(leak.fecha_recepcion), 'dd/MM/yyyy', { locale: es })}
                </TableCell>
                <TableCell className="font-medium">{leak.nombre_completo}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-1 text-sm">
                    <Phone className="w-3 h-3 text-muted-foreground" />
                    {leak.telefono}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1 text-sm">
                    <Mail className="w-3 h-3 text-muted-foreground" />
                    {leak.email}
                  </div>
                </TableCell>
                <TableCell>{leak.tipo_evento || '-'}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Users className="w-3 h-3 text-muted-foreground" />
                    {leak.cantidad_invitados || '-'}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{leak.salon_preferido || '-'}</Badge>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {leak.fuente || '-'}
                </TableCell>
                <TableCell>
                  <Badge variant={estadoInfo.variant}>
                    <EstadoIcon className="w-3 h-3 mr-1" />
                    {estadoInfo.label}
                  </Badge>
                </TableCell>
                {mostrarAcciones && (
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {tabActivo === 'disponibles' && (
                        <Button
                          size="sm"
                          onClick={() => handleTomarLeak(leak.id)}
                          disabled={tomarLeakMutation.isPending}
                        >
                          <UserPlus className="w-4 h-4 mr-1" />
                          Tomar
                        </Button>
                      )}
                      {tabActivo === 'mios' && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleCambiarEstado(leak)}
                          >
                            Cambiar Estado
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleVerDetalle(leak)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                      {tabActivo === 'pendientes' && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleCambiarEstado(leak)}
                          >
                            Contactar
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleVerDetalle(leak)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                )}
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
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Leaks</h2>
          <p className="text-muted-foreground">
            Gestiona los clientes potenciales de tus campañas
          </p>
        </div>
        <div className="flex items-center gap-2">
          {pendientesCount > 0 && (
            <Badge variant="destructive" className="mr-2">
              {pendientesCount} pendientes
            </Badge>
          )}
          <Button
            onClick={() => sincronizarMutation.mutate()}
            disabled={sincronizarMutation.isPending}
            variant="outline"
          >
            {sincronizarMutation.isPending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4 mr-2" />
            )}
            Sincronizar
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={tabActivo} onValueChange={setTabActivo} className="space-y-4">
        <TabsList>
          <TabsTrigger value="disponibles">
            Disponibles
            {leaksDisponibles.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {leaksDisponibles.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="mios">
            Mis Leaks
            {leaksMios.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {leaksMios.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="pendientes">
            Pendientes de Contacto
            {pendientesCount > 0 && (
              <Badge variant="destructive" className="ml-2">
                {pendientesCount}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Filtros (solo para Mis Leaks) */}
        {tabActivo === 'mios' && (
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Estado</label>
                  <Select value={filtroEstado} onValueChange={setFiltroEstado}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Todos</SelectItem>
                      <SelectItem value="nuevo">Nuevo</SelectItem>
                      <SelectItem value="contactado">Contactado</SelectItem>
                      <SelectItem value="no_contesta">No Contesta</SelectItem>
                      <SelectItem value="rechazado">Rechazado</SelectItem>
                      <SelectItem value="contactado_llamar_otra_vez">Llamar Otra Vez</SelectItem>
                      <SelectItem value="convertido">Convertido</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Salón</label>
                  <Select value={filtroSalon} onValueChange={setFiltroSalon}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Todos</SelectItem>
                      <SelectItem value="Diamond">Diamond</SelectItem>
                      <SelectItem value="Kendall">Kendall</SelectItem>
                      <SelectItem value="Doral">Doral</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Fuente</label>
                  <Input
                    placeholder="Buscar fuente..."
                    value={filtroFuente}
                    onChange={(e) => setFiltroFuente(e.target.value)}
                  />
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
        )}

        {/* Filtro de salón para disponibles */}
        {tabActivo === 'disponibles' && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <label className="text-sm font-medium">Filtrar por Salón:</label>
                <Select value={filtroSalon} onValueChange={setFiltroSalon}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Todos los salones" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todos los salones</SelectItem>
                    <SelectItem value="Diamond">Diamond</SelectItem>
                    <SelectItem value="Kendall">Kendall</SelectItem>
                    <SelectItem value="Doral">Doral</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tab Content - Disponibles */}
        <TabsContent value="disponibles">
          <Card>
            <CardHeader>
              <CardTitle>Leaks Disponibles</CardTitle>
            </CardHeader>
            <CardContent>
              {renderTablaLeaks(leaksDisponibles, isLoadingDisponibles, true)}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Content - Mis Leaks */}
        <TabsContent value="mios">
          <Card>
            <CardHeader>
              <CardTitle>Mis Leaks</CardTitle>
            </CardHeader>
            <CardContent>
              {renderTablaLeaks(leaksMios, isLoadingMisLeaks, true)}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Content - Pendientes */}
        <TabsContent value="pendientes">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-destructive" />
                Pendientes de Contacto
              </CardTitle>
            </CardHeader>
            <CardContent>
              {renderTablaLeaks(leaksPendientes, isLoadingPendientes, true)}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modales */}
      {modalEstadoOpen && leakSeleccionado && (
        <ModalCambiarEstadoLeak
          isOpen={modalEstadoOpen}
          onClose={() => {
            setModalEstadoOpen(false);
            setLeakSeleccionado(null);
          }}
          leak={leakSeleccionado}
          onSuccess={() => {
            queryClient.invalidateQueries(['leaks-mios']);
            queryClient.invalidateQueries(['leaks-pendientes']);
            queryClient.invalidateQueries(['leaks-pendientes-lista']);
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

export default Leaks;

