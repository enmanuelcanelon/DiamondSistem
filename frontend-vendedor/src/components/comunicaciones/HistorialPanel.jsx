import { useState } from 'react';
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
  Loader2
} from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Badge } from '../ui/badge';
import { Skeleton } from '../ui/skeleton';
import comunicacionesService from '../../services/comunicacionesService';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

// Icono de WhatsApp SVG
const WhatsAppIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

const CANALES = [
  { value: '', label: 'Todos los canales' },
  { value: 'whatsapp', label: 'WhatsApp', icon: WhatsAppIcon, color: 'text-[#25D366]' },
  { value: 'sms', label: 'SMS', icon: MessageSquare, color: 'text-[#8B5CF6]' },
  { value: 'voz', label: 'Llamadas', icon: Phone, color: 'text-blue-500' },
  { value: 'email', label: 'Email', icon: Mail, color: 'text-[#EF4444]' }
];

const DIRECCIONES = [
  { value: '', label: 'Todas' },
  { value: 'entrante', label: 'Entrantes', icon: ArrowDownLeft },
  { value: 'saliente', label: 'Salientes', icon: ArrowUpRight }
];

const HistorialPanel = ({ leadId = null, clienteId = null, contratoId = null }) => {
  const [filtros, setFiltros] = useState({
    canal: '',
    direccion: '',
    desde: '',
    hasta: ''
  });
  const [showFilters, setShowFilters] = useState(false);

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

  const getCanalInfo = (canal) => {
    switch (canal) {
      case 'whatsapp':
        return { icon: WhatsAppIcon, color: 'bg-[#25D366]', label: 'WhatsApp' };
      case 'sms':
        return { icon: MessageSquare, color: 'bg-[#8B5CF6]', label: 'SMS' };
      case 'voz':
        return { icon: Phone, color: 'bg-blue-500', label: 'Llamada' };
      case 'email':
        return { icon: Mail, color: 'bg-[#EF4444]', label: 'Email' };
      default:
        return { icon: MessageSquare, color: 'bg-gray-500', label: canal };
    }
  };

  const getDireccionIcon = (direccion) => {
    switch (direccion) {
      case 'entrante':
        return <ArrowDownLeft className="w-3 h-3 text-green-500" />;
      case 'saliente':
        return <ArrowUpRight className="w-3 h-3 text-blue-500" />;
      default:
        return null;
    }
  };

  const getEstadoLlamada = (estado) => {
    switch (estado) {
      case 'completed':
        return { label: 'Completada', variant: 'default' };
      case 'busy':
        return { label: 'Ocupado', variant: 'secondary' };
      case 'no-answer':
        return { label: 'Sin respuesta', variant: 'destructive' };
      case 'failed':
        return { label: 'Fallida', variant: 'destructive' };
      default:
        return { label: estado, variant: 'outline' };
    }
  };

  const formatearFecha = (fecha) => {
    if (!fecha) return '';
    const date = new Date(fecha);
    const hoy = new Date();
    const ayer = new Date(hoy);
    ayer.setDate(ayer.getDate() - 1);

    if (date.toDateString() === hoy.toDateString()) {
      return `Hoy ${format(date, 'HH:mm', { locale: es })}`;
    } else if (date.toDateString() === ayer.toDateString()) {
      return `Ayer ${format(date, 'HH:mm', { locale: es })}`;
    }
    return format(date, "d 'de' MMM, HH:mm", { locale: es });
  };

  const formatearDuracion = (segundos) => {
    if (!segundos) return '';
    const mins = Math.floor(segundos / 60);
    const secs = segundos % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const comunicaciones = historialData?.comunicaciones || historialData || [];

  return (
    <div className="space-y-6">
      {/* Header con filtros */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-gray-100 dark:bg-gray-800">
                <History className="w-6 h-6 text-gray-600 dark:text-gray-400" />
              </div>
              <div>
                <CardTitle className="text-lg">Historial de comunicaciones</CardTitle>
                <CardDescription>
                  {leadId && 'Comunicaciones con este lead'}
                  {clienteId && 'Comunicaciones con este cliente'}
                  {contratoId && 'Comunicaciones de este contrato'}
                  {!leadId && !clienteId && !contratoId && 'Todas tus comunicaciones'}
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="icon"
                onClick={() => refetch()}
                disabled={isFetching}
              >
                <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
              </Button>
              <Button 
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className={showFilters ? 'bg-muted' : ''}
              >
                <Filter className="w-4 h-4 mr-2" />
                Filtros
              </Button>
            </div>
          </div>
        </CardHeader>
        
        {/* Panel de filtros */}
        {showFilters && (
          <CardContent className="border-t pt-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Filtro por canal */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Canal</label>
                <select
                  value={filtros.canal}
                  onChange={(e) => setFiltros(prev => ({ ...prev, canal: e.target.value }))}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  {CANALES.map(canal => (
                    <option key={canal.value} value={canal.value}>{canal.label}</option>
                  ))}
                </select>
              </div>

              {/* Filtro por dirección */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Dirección</label>
                <select
                  value={filtros.direccion}
                  onChange={(e) => setFiltros(prev => ({ ...prev, direccion: e.target.value }))}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  {DIRECCIONES.map(dir => (
                    <option key={dir.value} value={dir.value}>{dir.label}</option>
                  ))}
                </select>
              </div>

              {/* Filtro por fecha desde */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Desde</label>
                <Input
                  type="date"
                  value={filtros.desde}
                  onChange={(e) => setFiltros(prev => ({ ...prev, desde: e.target.value }))}
                />
              </div>

              {/* Filtro por fecha hasta */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Hasta</label>
                <Input
                  type="date"
                  value={filtros.hasta}
                  onChange={(e) => setFiltros(prev => ({ ...prev, hasta: e.target.value }))}
                />
              </div>
            </div>

            <div className="flex justify-end mt-4">
              <Button 
                variant="ghost" 
                onClick={() => setFiltros({ canal: '', direccion: '', desde: '', hasta: '' })}
              >
                Limpiar filtros
              </Button>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Timeline de comunicaciones */}
      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-start gap-4">
                  <Skeleton className="w-10 h-10 rounded-full" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-1/4 mb-2" />
                    <Skeleton className="h-4 w-3/4 mb-2" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : comunicaciones.length > 0 ? (
            <div className="relative">
              {/* Línea vertical del timeline */}
              <div className="absolute left-5 top-0 bottom-0 w-px bg-border" />

              <div className="space-y-6">
                {comunicaciones.map((com, index) => {
                  const canalInfo = getCanalInfo(com.canal);
                  const IconComponent = canalInfo.icon;

                  return (
                    <div key={com.id || index} className="relative flex gap-4 pl-2">
                      {/* Icono del canal */}
                      <div className={`relative z-10 flex-shrink-0 w-8 h-8 rounded-full ${canalInfo.color} flex items-center justify-center`}>
                        <IconComponent className="w-4 h-4 text-white" />
                      </div>

                      {/* Contenido */}
                      <div className="flex-1 bg-muted/30 rounded-lg p-4 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant="outline" className="text-xs">
                              {canalInfo.label}
                            </Badge>
                            {com.direccion && (
                              <div className="flex items-center gap-1">
                                {getDireccionIcon(com.direccion)}
                                <span className="text-xs text-muted-foreground capitalize">
                                  {com.direccion}
                                </span>
                              </div>
                            )}
                            {com.canal === 'voz' && com.estado && (
                              <Badge variant={getEstadoLlamada(com.estado).variant} className="text-xs">
                                {getEstadoLlamada(com.estado).label}
                              </Badge>
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                            {formatearFecha(com.fecha || com.createdAt)}
                          </span>
                        </div>

                        {/* Número/Email */}
                        {(com.telefono || com.email || com.hacia || com.desde_numero) && (
                          <p className="text-sm font-medium mb-1">
                            {com.telefono || com.email || com.hacia || com.desde_numero}
                          </p>
                        )}

                        {/* Contenido del mensaje */}
                        {(com.mensaje || com.asunto || com.contenido) && (
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {com.asunto && <strong>{com.asunto}: </strong>}
                            {com.mensaje || com.contenido}
                          </p>
                        )}

                        {/* Duración para llamadas */}
                        {com.canal === 'voz' && com.duracion > 0 && (
                          <p className="text-xs text-muted-foreground mt-2">
                            Duración: {formatearDuracion(com.duracion)}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <History className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No hay comunicaciones registradas</p>
              {(filtros.canal || filtros.direccion || filtros.desde || filtros.hasta) && (
                <p className="text-sm mt-2">Intenta ajustar los filtros</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default HistorialPanel;

