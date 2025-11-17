import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Loader2, 
  UserPlus,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  X,
  TrendingUp,
  Target
} from 'lucide-react';
import { Area, AreaChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer, Tooltip, PieChart, Pie, Cell, Legend } from 'recharts';
import api from '../config/api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Skeleton } from '../components/ui/skeleton';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Link } from 'react-router-dom';

function Leaks() {
  const queryClient = useQueryClient();
  // Query para estadísticas de leaks
  const { data: statsData, isLoading: isLoadingStats } = useQuery({
    queryKey: ['leaks-stats'],
    queryFn: async () => {
      const response = await api.get('/leaks/stats');
      return response.data;
    },
    staleTime: 30000, // Los datos se consideran frescos por 30 segundos
    cacheTime: 5 * 60 * 1000, // Mantener en caché por 5 minutos
    refetchInterval: 120000, // Auto-refresh cada 2 minutos (stats no cambian tan frecuentemente)
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
    retry: (failureCount, error) => {
      // No reintentar si es error 429 (rate limit)
      if (error?.response?.status === 429) return false;
      return failureCount < 2;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
  });


  const getEstadoBadge = (estado) => {
    const estados = {
      nuevo: { label: 'Nuevos', variant: 'default', icon: UserPlus },
      interesado: { label: 'Interesado', variant: 'default', icon: CheckCircle },
      contactado_llamar_luego: { label: 'Contactado Llamar Luego', variant: 'secondary', icon: Clock },
      no_contesta_llamar_luego: { label: 'No Contesta Llamar Luego', variant: 'secondary', icon: AlertCircle },
      contactado_no_interesado: { label: 'Contactado No Interesado', variant: 'destructive', icon: XCircle },
    };
    return estados[estado] || { label: estado || 'Sin estado', variant: 'outline', icon: AlertCircle };
  };

  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

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
          <Button asChild variant="outline">
            <Link to="/leaks/disponibles">
              Ver Disponibles
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/leaks/misleaks">
              Ver Mis Leaks
            </Link>
          </Button>
        </div>
      </div>

      {/* Mini Dashboard */}
      {isLoadingStats ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-32 mb-1" />
                <Skeleton className="h-3 w-20" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <>
          {/* Métricas principales */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Leaks Disponibles
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{statsData?.stats?.totalDisponibles || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">Sin asignar</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Mis Leaks
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{statsData?.stats?.totalMios || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">Asignados a mí</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Convertidos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{statsData?.stats?.leaksConvertidos || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Tasa: {statsData?.stats?.tasaConversion || '0%'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Pendientes de Contacto
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{statsData?.stats?.pendientesContacto || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">Requieren seguimiento</p>
              </CardContent>
            </Card>
          </div>

          {/* Gráficas */}
          {statsData?.stats && (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mt-4">
              {/* Gráfica de leaks por fecha - Area Chart mejorado */}
              <Card className="md:col-span-2">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-sm font-medium">Leaks por Fecha</CardTitle>
                      <p className="text-xs text-muted-foreground mt-1">Últimos 30 días</p>
                    </div>
                    {statsData.stats.graficaPorFecha && statsData.stats.graficaPorFecha.length > 0 && (
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">
                          Total: {statsData.stats.graficaPorFecha.reduce((sum, item) => sum + item.cantidad, 0)}
                        </span>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {statsData.stats.graficaPorFecha && statsData.stats.graficaPorFecha.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <AreaChart
                        data={statsData.stats.graficaPorFecha.map(item => ({
                          fecha: format(new Date(item.fecha), 'dd/MM', { locale: es }),
                          fechaCompleta: format(new Date(item.fecha), 'dd MMM yyyy', { locale: es }),
                          cantidad: item.cantidad
                        }))}
                        margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                      >
                        <defs>
                          <linearGradient id="colorLeaks" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis 
                          dataKey="fecha" 
                          tick={{ fill: 'hsl(var(--muted-foreground))' }}
                          style={{ fontSize: '12px' }}
                        />
                        <YAxis 
                          tick={{ fill: 'hsl(var(--muted-foreground))' }}
                          style={{ fontSize: '12px' }}
                        />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--popover))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '6px',
                            padding: '8px 12px'
                          }}
                          formatter={(value, name) => [value, 'Leaks']}
                          labelFormatter={(label) => `Fecha: ${label}`}
                        />
                        <Area
                          type="monotone"
                          dataKey="cantidad"
                          stroke="hsl(var(--primary))"
                          fillOpacity={1}
                          fill="url(#colorLeaks)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                      <p className="text-sm">No hay datos de leaks en los últimos 30 días</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Gráfica de distribución por estado - Pie Chart mejorado */}
              {statsData.stats.porEstado && statsData.stats.porEstado.length > 0 ? (
                <Card>
                  <CardHeader>
                    <div>
                      <CardTitle className="text-sm font-medium">Distribución por Estado</CardTitle>
                      <p className="text-xs text-muted-foreground mt-1">Mis leaks</p>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={statsData.stats.porEstado.map(item => {
                            const estadoInfo = getEstadoBadge(item.estado);
                            return {
                              name: estadoInfo.label,
                              value: item.cantidad,
                              estado: item.estado,
                              fill: COLORS[statsData.stats.porEstado.indexOf(item) % COLORS.length]
                            };
                          }).filter(item => item.value > 0)}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => percent > 0.05 ? `${(percent * 100).toFixed(0)}%` : ''}
                          outerRadius={90}
                          innerRadius={40}
                          paddingAngle={2}
                          dataKey="value"
                        >
                          {statsData.stats.porEstado.map((entry, index) => (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={COLORS[index % COLORS.length]}
                              stroke="hsl(var(--background))"
                              strokeWidth={2}
                            />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--popover))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '6px',
                            padding: '8px 12px'
                          }}
                          formatter={(value, name, props) => [
                            `${value} leaks`,
                            props.payload.name
                          ]}
                        />
                        <Legend 
                          verticalAlign="bottom" 
                          height={36}
                          formatter={(value, entry) => (
                            <span style={{ color: 'hsl(var(--foreground))', fontSize: '12px' }}>
                              {value}
                            </span>
                          )}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardHeader>
                    <div>
                      <CardTitle className="text-sm font-medium">Distribución por Estado</CardTitle>
                      <p className="text-xs text-muted-foreground mt-1">Mis leaks</p>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                      <p className="text-sm">No hay leaks asignados</p>
                    </div>
                  </CardContent>
                </Card>
              )}

            </div>
          )}
        </>
      )}

      {/* Resultado de sincronización */}
    </div>
  );
}

export default Leaks;

