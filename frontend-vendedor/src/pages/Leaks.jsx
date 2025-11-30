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
import { ResponsiveContainer, Tooltip, PieChart, Pie, Cell, Legend } from 'recharts';
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
    staleTime: 5 * 60 * 1000, // Los datos se consideran frescos por 5 minutos
    gcTime: 10 * 60 * 1000, // Mantener en caché por 10 minutos
    refetchInterval: 30 * 1000, // Refrescar cada 30 segundos
    refetchIntervalInBackground: false, // No refetch cuando la pestaña está en background
    refetchOnWindowFocus: true, // Refetch al cambiar de pestaña para mantener datos actualizados
    retry: (failureCount, error) => {
      // No reintentar si es error 429 (rate limit)
      if (error?.response?.status === 429) return false;
      return failureCount < 2;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
  });


  const getEstadoBadge = (estado) => {
    const estados = {
      nuevo: { label: 'Nuevo', variant: 'default', icon: UserPlus },
      interesado: { label: 'Interesado', variant: 'default', icon: CheckCircle },
      contactado_llamar_luego: { label: 'Contactado - Llamar Luego', variant: 'secondary', icon: Clock },
      no_contesta_llamar_luego: { label: 'No Contesta - Llamar Luego', variant: 'secondary', icon: AlertCircle },
      contactado_no_interesado: { label: 'Contactado - No Interesado', variant: 'destructive', icon: XCircle },
    };
    return estados[estado] || { label: estado || 'Estado', variant: 'outline', icon: AlertCircle };
  };

  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Leads</h2>
          <p className="text-muted-foreground">
            Gestiona tus leads y oportunidades de negocio
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline">
            <Link to="/leads/disponibles">
              Ver Disponibles
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/leads/misleads">
              Mis Leads
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
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="bg-card relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 group border-l-4 border-l-blue-500">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-transparent dark:from-blue-950/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <CardHeader className="pb-2 relative z-10">
                <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                  Leads Disponibles
                </CardTitle>
                <div className="absolute top-4 right-4 p-2 bg-blue-100 dark:bg-blue-900/30 rounded-full text-blue-600 dark:text-blue-400">
                  <UserPlus className="w-4 h-4" />
                </div>
              </CardHeader>
              <CardContent className="pt-0 relative z-10">
                <div className="text-3xl font-bold tracking-tight">{statsData?.stats?.totalDisponibles || 0}</div>
                <p className="text-xs text-muted-foreground mt-1 font-medium">Sin asignar</p>
              </CardContent>
            </Card>

            <Card className="bg-card relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 group border-l-4 border-l-purple-500">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-50/50 to-transparent dark:from-purple-950/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <CardHeader className="pb-2 relative z-10">
                <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                  Mis Leads
                </CardTitle>
                <div className="absolute top-4 right-4 p-2 bg-purple-100 dark:bg-purple-900/30 rounded-full text-purple-600 dark:text-purple-400">
                  <Target className="w-4 h-4" />
                </div>
              </CardHeader>
              <CardContent className="pt-0 relative z-10">
                <div className="text-3xl font-bold tracking-tight">{statsData?.stats?.totalMios || 0}</div>
                <p className="text-xs text-muted-foreground mt-1 font-medium">Asignados a mí</p>
              </CardContent>
            </Card>

            <Card className="bg-card relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 group border-l-4 border-l-emerald-500">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/50 to-transparent dark:from-emerald-950/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <CardHeader className="pb-2 relative z-10">
                <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                  Convertidos
                </CardTitle>
                <div className="absolute top-4 right-4 p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-full text-emerald-600 dark:text-emerald-400">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </CardHeader>
              <CardContent className="pt-0 relative z-10">
                <div className="text-3xl font-bold tracking-tight">{statsData?.stats?.leaksConvertidos || 0}</div>
                <p className="text-xs text-muted-foreground mt-1 font-medium">
                  Tasa: {statsData?.stats?.tasaConversion || '0%'}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-card relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 group border-l-4 border-l-amber-500">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-50/50 to-transparent dark:from-amber-950/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <CardHeader className="pb-2 relative z-10">
                <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                  Pendientes
                </CardTitle>
                <div className="absolute top-4 right-4 p-2 bg-amber-100 dark:bg-amber-900/30 rounded-full text-amber-600 dark:text-amber-400">
                  <Clock className="w-4 h-4" />
                </div>
              </CardHeader>
              <CardContent className="pt-0 relative z-10">
                <div className="text-3xl font-bold tracking-tight">{statsData?.stats?.pendientesContacto || 0}</div>
                <p className="text-xs text-muted-foreground mt-1 font-medium">Requieren seguimiento</p>
              </CardContent>
            </Card>
          </div>

          {/* Gráficas */}
          {statsData?.stats && (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mt-4">
              {/* Gráfica de distribución por estado - Pie Chart mejorado */}
              {statsData.stats.porEstado && statsData.stats.porEstado.length > 0 ? (
                <Card>
                  <CardHeader>
                    <div>
                      <CardTitle className="text-sm font-medium">Distribución por Estado</CardTitle>
                      <p className="text-xs text-muted-foreground mt-1">Mis leads</p>
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
                      <p className="text-xs text-muted-foreground mt-1">Mis leads</p>
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

