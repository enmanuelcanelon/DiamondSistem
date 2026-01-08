import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  History, 
  Phone, 
  PhoneIncoming,
  PhoneOutgoing,
  PhoneMissed,
  MessageSquare, 
  Mail, 
  Filter,
  Calendar,
  ArrowDownLeft,
  ArrowUpRight,
  RefreshCw,
  Loader2,
  Clock,
  User,
  TrendingUp,
  CheckCircle2,
  XCircle,
  ChevronDown,
  Search,
  X
} from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Badge } from '../ui/badge';
import { Skeleton } from '../ui/skeleton';
import comunicacionesService from '../../services/comunicacionesService';
import { format, isToday, isYesterday, isThisWeek, formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

// Icono de WhatsApp SVG
const WhatsAppIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

const CANALES = [
  { value: '', label: 'Todos', icon: null },
  { value: 'whatsapp', label: 'WhatsApp', icon: WhatsAppIcon, color: 'bg-[#25D366]', textColor: 'text-[#25D366]' },
  { value: 'sms', label: 'SMS', icon: MessageSquare, color: 'bg-[#8B5CF6]', textColor: 'text-[#8B5CF6]' },
  { value: 'voz', label: 'Llamadas', icon: Phone, color: 'bg-blue-500', textColor: 'text-blue-500' },
  { value: 'email', label: 'Email', icon: Mail, color: 'bg-[#EF4444]', textColor: 'text-[#EF4444]' }
];

const HistorialPanel = ({ leadId = null, clienteId = null, contratoId = null }) => {
  const [filtros, setFiltros] = useState({
    canal: '',
    direccion: '',
    desde: '',
    hasta: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const [busqueda, setBusqueda] = useState('');

  // Query para obtener historial
  const { data: historialData, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['historial', { leadId, clienteId, contratoId, ...filtros }],
    queryFn: async () => {
      if (leadId) {
        const response = await comunicacionesService.obtenerHistorialLead(leadId);
        return response.data;
      } else if (clienteId) {
        const response = await comunicacionesService.obtenerHistorialCliente(clienteId);
        return response.data;
      } else if (contratoId) {
        const response = await comunicacionesService.obtenerHistorialContrato(contratoId);
        return response.data;
      } else {
        const response = await comunicacionesService.obtenerMisComunicaciones(filtros);
        return response.data;
      }
    },
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false
  });

  // Query para estadísticas
  const { data: statsData } = useQuery({
    queryKey: ['comunicaciones-stats'],
    queryFn: async () => {
      const response = await comunicacionesService.obtenerEstadisticas();
      return response.data;
    },
    staleTime: 5 * 60 * 1000,
    enabled: !leadId && !clienteId && !contratoId // Solo si no hay filtro específico
  });

  // El backend devuelve { success, count, data: [...] }
  const comunicaciones = historialData?.data || [];

  // Filtrar por búsqueda
  const comunicacionesFiltradas = useMemo(() => {
    if (!busqueda.trim()) return comunicaciones;
    const termino = busqueda.toLowerCase();
    return comunicaciones.filter(com => 
      com.destinatario?.toLowerCase().includes(termino) ||
      com.contenido?.toLowerCase().includes(termino) ||
      com.leaks?.nombre_completo?.toLowerCase().includes(termino) ||
      com.clientes?.nombre_completo?.toLowerCase().includes(termino)
    );
  }, [comunicaciones, busqueda]);

  // Estadísticas calculadas
  const stats = useMemo(() => {
    if (statsData?.stats) return statsData.stats;
    
    // Calcular desde los datos locales
    const porCanal = {};
    comunicaciones.forEach(com => {
      porCanal[com.canal] = (porCanal[com.canal] || 0) + 1;
    });
    
    return {
      total: comunicaciones.length,
      deHoy: comunicaciones.filter(c => isToday(new Date(c.fecha_creacion))).length,
      porCanal: Object.entries(porCanal).map(([canal, cantidad]) => ({ canal, cantidad }))
    };
  }, [statsData, comunicaciones]);

  const getCanalInfo = (canal) => {
    const info = CANALES.find(c => c.value === canal);
    if (info) {
      return { 
        icon: info.icon || MessageSquare, 
        color: info.color || 'bg-gray-500', 
        textColor: info.textColor || 'text-gray-500',
        label: info.label 
      };
    }
    return { icon: MessageSquare, color: 'bg-gray-500', textColor: 'text-gray-500', label: canal };
  };

  const getDireccionInfo = (direccion) => {
    switch (direccion) {
      case 'entrante':
        return { icon: ArrowDownLeft, color: 'text-green-500', label: 'Recibido' };
      case 'saliente':
        return { icon: ArrowUpRight, color: 'text-blue-500', label: 'Enviado' };
      default:
        return null;
    }
  };

  const getEstadoInfo = (estado, canal) => {
    if (canal !== 'voz') return null;
    
    switch (estado) {
      case 'completed':
        return { label: 'Completada', color: 'text-green-500', bgColor: 'bg-green-100 dark:bg-green-900/30' };
      case 'busy':
        return { label: 'Ocupado', color: 'text-yellow-500', bgColor: 'bg-yellow-100 dark:bg-yellow-900/30' };
      case 'no-answer':
        return { label: 'Sin respuesta', color: 'text-orange-500', bgColor: 'bg-orange-100 dark:bg-orange-900/30' };
      case 'failed':
        return { label: 'Fallida', color: 'text-red-500', bgColor: 'bg-red-100 dark:bg-red-900/30' };
      case 'in-progress':
        return { label: 'En curso', color: 'text-blue-500', bgColor: 'bg-blue-100 dark:bg-blue-900/30' };
      default:
        return { label: estado, color: 'text-gray-500', bgColor: 'bg-gray-100 dark:bg-gray-900/30' };
    }
  };

  const formatearFecha = (fecha) => {
    if (!fecha) return '';
    const date = new Date(fecha);

    if (isToday(date)) {
      return `Hoy ${format(date, 'HH:mm', { locale: es })}`;
    }
    if (isYesterday(date)) {
      return `Ayer ${format(date, 'HH:mm', { locale: es })}`;
    }
    if (isThisWeek(date)) {
      return format(date, "EEEE HH:mm", { locale: es });
    }
    return format(date, "d MMM, HH:mm", { locale: es });
  };

  const formatearDuracion = (segundos) => {
    if (!segundos) return '';
    const mins = Math.floor(segundos / 60);
    const secs = segundos % 60;
    if (mins === 0) return `${secs}s`;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Agrupar por fecha
  const comunicacionesAgrupadas = useMemo(() => {
    const grupos = {};
    comunicacionesFiltradas.forEach(com => {
      const fecha = new Date(com.fecha_creacion);
      let grupo;
      
      if (isToday(fecha)) {
        grupo = 'Hoy';
      } else if (isYesterday(fecha)) {
        grupo = 'Ayer';
      } else if (isThisWeek(fecha)) {
        grupo = 'Esta semana';
      } else {
        grupo = format(fecha, "MMMM yyyy", { locale: es });
      }
      
      if (!grupos[grupo]) grupos[grupo] = [];
      grupos[grupo].push(com);
    });
    return grupos;
  }, [comunicacionesFiltradas]);

  return (
    <div className="space-y-4">
      {/* Stats Cards - Solo si no hay filtro específico */}
      {!leadId && !clienteId && !contratoId && stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {/* Total */}
          <Card className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Total</p>
                  <p className="text-2xl font-bold">{stats.total || 0}</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                  <History className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Hoy */}
          <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30 border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Hoy</p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.deHoy || 0}</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-green-200 dark:bg-green-700 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-300" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Por Canal - WhatsApp */}
          <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/30 dark:to-emerald-800/30 border-0 shadow-sm">
            <CardContent className="p-4">
          <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-medium">WhatsApp</p>
                  <p className="text-2xl font-bold text-[#25D366]">
                    {stats.porCanal?.find(c => c.canal === 'whatsapp')?.cantidad || 0}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-full bg-[#25D366]/20 flex items-center justify-center">
                  <WhatsAppIcon className="w-5 h-5 text-[#25D366]" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Por Canal - Llamadas */}
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
              <div>
                  <p className="text-xs text-muted-foreground font-medium">Llamadas</p>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {stats.porCanal?.find(c => c.canal === 'voz')?.cantidad || 0}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-full bg-blue-200 dark:bg-blue-700 flex items-center justify-center">
                  <Phone className="w-5 h-5 text-blue-600 dark:text-blue-300" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filtros y búsqueda */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Búsqueda */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar en historial..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="pl-10"
              />
              {busqueda && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                  onClick={() => setBusqueda('')}
                >
                  <X className="w-3 h-3" />
                </Button>
              )}
            </div>

            {/* Filtros rápidos por canal */}
            <div className="flex gap-2 overflow-x-auto pb-1">
              {CANALES.map(canal => {
                const isActive = filtros.canal === canal.value;
                const Icon = canal.icon;
                return (
                  <Button
                    key={canal.value}
                    variant={isActive ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFiltros(prev => ({ ...prev, canal: canal.value }))}
                    className={`whitespace-nowrap ${isActive ? 'bg-[#EF4444] hover:bg-[#DC2626]' : ''}`}
                  >
                    {Icon && <Icon className="w-3.5 h-3.5 mr-1.5" />}
                    {canal.label}
                  </Button>
                );
              })}
            </div>

            {/* Refrescar */}
              <Button 
                variant="outline" 
                size="icon"
                onClick={() => refetch()}
                disabled={isFetching}
              className="flex-shrink-0"
              >
                <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
              </Button>
          </div>

          {/* Filtros avanzados */}
          <div className="mt-3 flex items-center gap-2">
              <Button 
              variant="ghost"
              size="sm"
                onClick={() => setShowFilters(!showFilters)}
              className="text-xs"
              >
              <Filter className="w-3 h-3 mr-1.5" />
              Más filtros
              <ChevronDown className={`w-3 h-3 ml-1 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
              </Button>

            {/* Badges de filtros activos */}
            {(filtros.direccion || filtros.desde || filtros.hasta) && (
              <div className="flex gap-1 flex-wrap">
                {filtros.direccion && (
                  <Badge variant="secondary" className="text-xs">
                    {filtros.direccion === 'entrante' ? 'Recibidos' : 'Enviados'}
                    <X 
                      className="w-3 h-3 ml-1 cursor-pointer" 
                      onClick={() => setFiltros(prev => ({ ...prev, direccion: '' }))}
                    />
                  </Badge>
                )}
                {filtros.desde && (
                  <Badge variant="secondary" className="text-xs">
                    Desde: {filtros.desde}
                    <X 
                      className="w-3 h-3 ml-1 cursor-pointer" 
                      onClick={() => setFiltros(prev => ({ ...prev, desde: '' }))}
                    />
                  </Badge>
                )}
            </div>
            )}
          </div>
        
        {showFilters && (
            <div className="mt-4 pt-4 border-t grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">Dirección</label>
                <select
                  value={filtros.direccion}
                  onChange={(e) => setFiltros(prev => ({ ...prev, direccion: e.target.value }))}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="">Todas</option>
                  <option value="entrante">Recibidos</option>
                  <option value="saliente">Enviados</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">Desde</label>
                <Input
                  type="date"
                  value={filtros.desde}
                  onChange={(e) => setFiltros(prev => ({ ...prev, desde: e.target.value }))}
                  className="h-9"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">Hasta</label>
                <Input
                  type="date"
                  value={filtros.hasta}
                  onChange={(e) => setFiltros(prev => ({ ...prev, hasta: e.target.value }))}
                  className="h-9"
                />
              </div>
            </div>
          )}
          </CardContent>
      </Card>

      {/* Lista de comunicaciones */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-start gap-3 p-3">
                  <Skeleton className="w-10 h-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <div className="flex justify-between">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : comunicacionesFiltradas.length > 0 ? (
            <div className="divide-y">
              {Object.entries(comunicacionesAgrupadas).map(([grupo, items]) => (
                <div key={grupo}>
                  {/* Header del grupo */}
                  <div className="px-4 py-2 bg-muted/50 sticky top-0 z-10">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      {grupo}
                    </p>
                  </div>
                  
                  {/* Items del grupo */}
                  <div className="divide-y">
                    {items.map((com, index) => {
                  const canalInfo = getCanalInfo(com.canal);
                      const direccionInfo = getDireccionInfo(com.direccion);
                      const estadoInfo = getEstadoInfo(com.estado, com.canal);
                      const IconCanal = canalInfo.icon;
                      const IconDireccion = direccionInfo?.icon;

                  return (
                        <div 
                          key={com.id || index} 
                          className="flex items-start gap-3 p-4 hover:bg-muted/30 transition-colors"
                        >
                          {/* Avatar/Icono del canal */}
                          <div className={`w-10 h-10 rounded-full ${canalInfo.color} flex items-center justify-center flex-shrink-0`}>
                            <IconCanal className="w-5 h-5 text-white" />
                      </div>

                      {/* Contenido */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <div className="flex items-center gap-2 flex-wrap min-w-0">
                                {/* Destinatario/Nombre */}
                                <span className="font-medium truncate">
                                  {com.leaks?.nombre_completo || com.clientes?.nombre_completo || com.destinatario || 'Desconocido'}
                                </span>
                                
                                {/* Dirección */}
                                {direccionInfo && (
                                  <span className={`flex items-center gap-0.5 text-xs ${direccionInfo.color}`}>
                                    <IconDireccion className="w-3 h-3" />
                                    {direccionInfo.label}
                                  </span>
                                )}
                              </div>
                              
                              {/* Hora */}
                              <span className="text-xs text-muted-foreground whitespace-nowrap flex-shrink-0">
                                {format(new Date(com.fecha_creacion), 'HH:mm', { locale: es })}
                          </span>
                        </div>

                            {/* Número/Email si es diferente del nombre */}
                            {com.destinatario && (com.leaks?.nombre_completo || com.clientes?.nombre_completo) && (
                              <p className="text-xs text-muted-foreground mb-1">
                                {com.destinatario}
                          </p>
                        )}

                            {/* Contenido */}
                            {com.contenido && (
                          <p className="text-sm text-muted-foreground line-clamp-2">
                                {com.contenido}
                          </p>
                            )}

                            {/* Info adicional */}
                            <div className="flex items-center gap-3 mt-2">
                              {/* Estado para llamadas */}
                              {estadoInfo && (
                                <span className={`text-xs px-2 py-0.5 rounded-full ${estadoInfo.bgColor} ${estadoInfo.color}`}>
                                  {estadoInfo.label}
                                </span>
                        )}

                        {/* Duración para llamadas */}
                              {com.canal === 'voz' && com.duracion_seg > 0 && (
                                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <Clock className="w-3 h-3" />
                                  {formatearDuracion(com.duracion_seg)}
                                </span>
                        )}

                              {/* Usuario que hizo la comunicación */}
                              {com.usuarios?.nombre_completo && (
                                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <User className="w-3 h-3" />
                                  {com.usuarios.nombre_completo}
                                </span>
                              )}
                            </div>
                      </div>
                    </div>
                  );
                })}
              </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <History className="w-8 h-8" />
              </div>
              <p className="font-medium">No hay comunicaciones</p>
              <p className="text-sm mt-1">
                {busqueda ? 'No se encontraron resultados' : 'Las comunicaciones aparecerán aquí'}
              </p>
              {(filtros.canal || filtros.direccion || filtros.desde || filtros.hasta || busqueda) && (
                <Button 
                  variant="link" 
                  size="sm"
                  onClick={() => {
                    setFiltros({ canal: '', direccion: '', desde: '', hasta: '' });
                    setBusqueda('');
                  }}
                  className="mt-2"
                >
                  Limpiar filtros
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default HistorialPanel;
