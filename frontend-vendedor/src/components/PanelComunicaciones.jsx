import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Phone, 
  MessageSquare, 
  Mail, 
  History,
  BarChart3,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Skeleton } from './ui/skeleton';
import WhatsAppPanel from './comunicaciones/WhatsAppPanel';
import LlamadasPanel from './comunicaciones/LlamadasPanel';
import SMSPanel from './comunicaciones/SMSPanel';
import EmailPanel from './comunicaciones/EmailPanel';
import HistorialPanel from './comunicaciones/HistorialPanel';
import comunicacionesService from '../services/comunicacionesService';

// Icono de WhatsApp SVG
const WhatsAppIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

const PanelComunicaciones = ({ 
  telefono = '', 
  email = '', 
  nombre = '', 
  leadId = null, 
  clienteId = null, 
  contratoId = null,
  defaultTab = 'whatsapp'
}) => {
  const [activeTab, setActiveTab] = useState(defaultTab);

  // Query para estadísticas
  const { data: statsData, isLoading: loadingStats, isError: errorStats } = useQuery({
    queryKey: ['comunicaciones-stats'],
    queryFn: async () => {
      const response = await comunicacionesService.obtenerEstadisticas();
      return response.data;
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 1
  });

  // Query para estado de servicios
  const { data: serviciosData, isLoading: loadingServicios, isError: errorServicios } = useQuery({
    queryKey: ['comunicaciones-servicios'],
    queryFn: async () => {
      const response = await comunicacionesService.verificarServicios();
      return response.data;
    },
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 1
  });

  const getServiceStatus = (servicio) => {
    if (!serviciosData) return 'unknown';
    return serviciosData[servicio]?.activo ? 'active' : 'inactive';
  };

  const getServiceIcon = (status) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="w-3 h-3 text-green-500" />;
      case 'inactive':
        return <XCircle className="w-3 h-3 text-destructive" />;
      default:
        return <AlertCircle className="w-3 h-3 text-muted-foreground" />;
    }
  };

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Centro de Comunicaciones</h2>
          <p className="text-muted-foreground">
            {nombre ? `Comunicaciones con ${nombre}` : 'Gestiona todas tus comunicaciones desde un solo lugar'}
          </p>
        </div>
        
        {/* Estado de servicios */}
        {!loadingServicios && serviciosData && (
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="flex items-center gap-1">
              {getServiceIcon(getServiceStatus('whatsapp'))}
              WhatsApp
            </Badge>
            <Badge variant="outline" className="flex items-center gap-1">
              {getServiceIcon(getServiceStatus('twilio'))}
              Llamadas/SMS
            </Badge>
            <Badge variant="outline" className="flex items-center gap-1">
              {getServiceIcon(getServiceStatus('gmail'))}
              Email
            </Badge>
          </div>
        )}
      </div>

      {/* Estadísticas rápidas */}
      {!loadingStats && statsData && !errorStats && (
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          <Card className="border-l-4 border-l-[#25D366]">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <WhatsAppIcon className="w-4 h-4 text-[#25D366]" />
                WhatsApp
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statsData.whatsapp?.total || 0}</div>
              <p className="text-xs text-muted-foreground">mensajes este mes</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Phone className="w-4 h-4 text-blue-500" />
                Llamadas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statsData.voz?.total || 0}</div>
              <p className="text-xs text-muted-foreground">llamadas este mes</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-[#8B5CF6]">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-[#8B5CF6]" />
                SMS
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statsData.sms?.total || 0}</div>
              <p className="text-xs text-muted-foreground">mensajes este mes</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-[#EF4444]">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Mail className="w-4 h-4 text-[#EF4444]" />
                Emails
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statsData.email?.total || 0}</div>
              <p className="text-xs text-muted-foreground">emails este mes</p>
            </CardContent>
          </Card>
        </div>
      )}

      {loadingStats && (
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-20" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 mb-1" />
                <Skeleton className="h-3 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Tabs de comunicación */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-flex">
          <TabsTrigger value="whatsapp" className="flex items-center gap-2">
            <WhatsAppIcon className="w-4 h-4" />
            <span className="hidden sm:inline">WhatsApp</span>
          </TabsTrigger>
          <TabsTrigger value="llamadas" className="flex items-center gap-2">
            <Phone className="w-4 h-4" />
            <span className="hidden sm:inline">Llamadas</span>
          </TabsTrigger>
          <TabsTrigger value="sms" className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            <span className="hidden sm:inline">SMS</span>
          </TabsTrigger>
          <TabsTrigger value="email" className="flex items-center gap-2">
            <Mail className="w-4 h-4" />
            <span className="hidden sm:inline">Email</span>
          </TabsTrigger>
          <TabsTrigger value="historial" className="flex items-center gap-2">
            <History className="w-4 h-4" />
            <span className="hidden sm:inline">Historial</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="whatsapp">
          <WhatsAppPanel 
            telefono={telefono} 
            nombre={nombre} 
            leadId={leadId} 
            clienteId={clienteId} 
            contratoId={contratoId} 
          />
        </TabsContent>

        <TabsContent value="llamadas">
          <LlamadasPanel 
            telefono={telefono} 
            nombre={nombre} 
            leadId={leadId} 
            clienteId={clienteId} 
            contratoId={contratoId} 
          />
        </TabsContent>

        <TabsContent value="sms">
          <SMSPanel 
            telefono={telefono} 
            nombre={nombre} 
            leadId={leadId} 
            clienteId={clienteId} 
            contratoId={contratoId} 
          />
        </TabsContent>

        <TabsContent value="email">
          <EmailPanel 
            email={email} 
            nombre={nombre} 
            leadId={leadId} 
            clienteId={clienteId} 
            contratoId={contratoId} 
          />
        </TabsContent>

        <TabsContent value="historial">
          <HistorialPanel 
            leadId={leadId} 
            clienteId={clienteId} 
            contratoId={contratoId} 
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PanelComunicaciones;

