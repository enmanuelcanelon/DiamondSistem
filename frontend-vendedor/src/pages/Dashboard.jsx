import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Users, FileText, FileCheck, DollarSign, TrendingUp, TrendingDown, Calendar, ChevronLeft, ChevronRight, Download, Eye, EyeOff } from 'lucide-react';
import { Area, AreaChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import api from '../config/api';
import useAuthStore from '../store/useAuthStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Link } from 'react-router-dom';
import { buttonVariants } from '../components/ui/button';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

function Dashboard() {
  const { user } = useAuthStore();

  // Estado para el mes y año seleccionado
  const fechaActual = new Date();
  const [mesSeleccionado, setMesSeleccionado] = useState(fechaActual.getMonth() + 1);
  const [añoSeleccionado, setAñoSeleccionado] = useState(fechaActual.getFullYear());
  const [mostrarDatos, setMostrarDatos] = useState(false);

  // Calcular fechas del mes seleccionado
  const calcularFechasPorMes = (mes, año) => {
    const fechaInicio = new Date(año, mes - 1, 1);
    fechaInicio.setHours(0, 0, 0, 0);
    const fechaFin = new Date(año, mes, 0, 23, 59, 59);
    return {
      desde: fechaInicio.toISOString().split('T')[0],
      hasta: fechaFin.toISOString().split('T')[0],
      fechaInicio,
      fechaFin
    };
  };

  // Obtener estadísticas del vendedor filtradas por mes seleccionado
  // OPTIMIZADO: Usar endpoint del backend en lugar de calcular en frontend
  const { data: stats, isLoading, refetch } = useQuery({
    queryKey: ['vendedor-stats', user?.id, mesSeleccionado, añoSeleccionado],
    staleTime: 10 * 60 * 1000, // Los datos se consideran frescos por 10 minutos (aumentado)
    gcTime: 30 * 60 * 1000, // Mantener en caché por 30 minutos (aumentado)
    refetchInterval: false, // Sin refresco automático
    refetchIntervalInBackground: false, // No refetch cuando la pestaña está en background
    refetchOnWindowFocus: false, // No refetch al cambiar de pestaña (reduce carga)
    refetchOnMount: false, // No refetch al montar si los datos están frescos
    refetchOnReconnect: false, // No refetch automático al reconectar
    retry: (failureCount, error) => {
      // No reintentar si es error 429 (rate limit) o si ya se intentó 2 veces
      if (error?.response?.status === 429) return false;
      return failureCount < 2;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
    queryFn: async () => {
      // Usar endpoint optimizado del backend en lugar de múltiples queries
      const response = await api.get(`/vendedores/${user.id}/stats/mes`, {
        params: {
          mes: mesSeleccionado,
          año: añoSeleccionado
        }
      });

      const statsData = response.data?.estadisticas || {};

      // Calcular período anterior para comparación
      let mesAnterior = mesSeleccionado - 1;
      let añoAnterior = añoSeleccionado;
      if (mesAnterior === 0) {
        mesAnterior = 12;
        añoAnterior = añoSeleccionado - 1;
      }

      // Obtener stats del mes anterior para comparación (solo si es necesario)
      let datosAnteriores = {
        clientes: 0,
        ofertas: 0,
        contratos: 0,
        ventas: 0,
        comisiones: 0
      };

      try {
        const responseAnterior = await api.get(`/vendedores/${user.id}/stats/mes`, {
          params: {
            mes: mesAnterior,
            año: añoAnterior
          }
        });

        const statsAnteriores = responseAnterior.data?.estadisticas || {};
        datosAnteriores = {
          clientes: statsAnteriores.clientes?.total || 0,
          ofertas: statsAnteriores.ofertas?.total || 0,
          contratos: statsAnteriores.contratos?.total || 0,
          ventas: statsAnteriores.finanzas?.total_ventas || 0,
          comisiones: statsAnteriores.finanzas?.total_comisiones || 0
        };
      } catch (error) {
        // Si falla, usar valores por defecto
      }

      // Formatear datos para compatibilidad con el código existente
      return {
        clientes: {
          total: statsData.clientes?.total || 0,
          cambio: (statsData.clientes?.total || 0) - datosAnteriores.clientes
        },
        ofertas: {
          total: statsData.ofertas?.total || 0,
          aceptadas: statsData.ofertas?.aceptadas || 0,
          pendientes: statsData.ofertas?.pendientes || 0,
          rechazadas: statsData.ofertas?.rechazadas || 0,
          tasa_conversion: statsData.ofertas?.tasa_conversion || '0.00%',
          cambio: (statsData.ofertas?.total || 0) - datosAnteriores.ofertas
        },
        contratos: {
          total: statsData.contratos?.total || 0,
          activos: statsData.contratos?.activos || 0,
          pagados_completo: statsData.contratos?.pagados_completo || 0,
          cambio: (statsData.contratos?.total || 0) - datosAnteriores.contratos
        },
        finanzas: {
          total_ventas: statsData.finanzas?.total_ventas || 0,
          total_comisiones: statsData.finanzas?.total_comisiones || 0,
          comision_porcentaje: statsData.finanzas?.comision_porcentaje || 3.0,
          total_comisiones_desbloqueadas: statsData.finanzas?.total_comisiones_desbloqueadas || 0,
          total_comisiones_pendientes: statsData.finanzas?.total_comisiones_pendientes || 0,
          cambio_ventas: (statsData.finanzas?.total_ventas || 0) - datosAnteriores.ventas,
          cambio_comisiones: (statsData.finanzas?.total_comisiones || 0) - datosAnteriores.comisiones
        },
        comisiones: {
          total: statsData.comisiones?.total || 0,
          desbloqueadas: statsData.comisiones?.desbloqueadas || 0,
          pendientes: statsData.comisiones?.pendientes || 0,
          por_mes: statsData.comisiones?.por_mes || []
        }
      };
    },
    enabled: !!user?.id,
  });

  // Código antiguo eliminado - ahora usa endpoint optimizado del backend
  // El endpoint /vendedores/:id/stats/mes hace todas las queries en paralelo en el backend

  const { desde: fechaDesde, hasta: fechaHasta } = calcularFechasPorMes(mesSeleccionado, añoSeleccionado);

  // Obtener contratos del mes seleccionado - Carga diferida para no bloquear stats iniciales
  const { data: contratosData, isLoading: isLoadingContratos } = useQuery({
    queryKey: ['contratos-dashboard', user?.id, mesSeleccionado, añoSeleccionado],
    queryFn: async () => {
      // Calcular fechas del mes seleccionado
      const fechaInicioMes = new Date(añoSeleccionado, mesSeleccionado - 1, 1);
      fechaInicioMes.setHours(0, 0, 0, 0);
      const fechaFinMes = new Date(añoSeleccionado, mesSeleccionado, 0, 23, 59, 59);

      // Obtener todos los contratos creados en el mes seleccionado (fecha_creacion_contrato)
      const response = await api.get('/contratos', {
        params: {
          page: 1,
          limit: 1000,
          fecha_creacion_desde: fechaInicioMes.toISOString().split('T')[0],
          fecha_creacion_hasta: fechaFinMes.toISOString().split('T')[0]
        }
      });

      // Filtrar contratos por fecha_creacion_contrato del mes seleccionado
      const todosContratos = response.data?.data || [];
      const contratosFiltrados = todosContratos.filter(contrato => {
        if (!contrato.fecha_creacion_contrato) return false;

        const fechaCreacion = new Date(contrato.fecha_creacion_contrato);
        const fechaCreacionNormalizada = new Date(fechaCreacion.getFullYear(), fechaCreacion.getMonth(), fechaCreacion.getDate());
        const fechaInicioNormalizada = new Date(fechaInicioMes.getFullYear(), fechaInicioMes.getMonth(), fechaInicioMes.getDate());
        const fechaFinNormalizada = new Date(fechaFinMes.getFullYear(), fechaFinMes.getMonth(), fechaFinMes.getDate());

        return fechaCreacionNormalizada >= fechaInicioNormalizada && fechaCreacionNormalizada <= fechaFinNormalizada;
      });

      // Ordenar por fecha_creacion_contrato descendente (más recientes primero)
      contratosFiltrados.sort((a, b) => {
        const fechaA = new Date(a.fecha_creacion_contrato || 0);
        const fechaB = new Date(b.fecha_creacion_contrato || 0);
        return fechaB - fechaA;
      });

      return {
        ...response.data,
        data: contratosFiltrados // Mostrar todos los contratos del mes
      };
    },
    enabled: !!user?.id,
    // Cargar después de que las stats principales estén listas
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const contratos = contratosData?.data || [];

  // Función para obtener el color del estado del contrato
  const getEstadoContratoColor = (estado) => {
    switch (estado) {
      case 'activo':
        return 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
      case 'completado':
        return 'bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800';
      case 'cancelado':
        return 'bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800';
      default:
        return 'bg-gray-50 dark:bg-gray-950 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-800';
    }
  };

  // Función para obtener el color del estado de pago
  const getEstadoPagoColor = (estadoPago) => {
    switch (estadoPago) {
      case 'pagado':
        return 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
      case 'parcial':
        return 'bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800';
      case 'pendiente':
        return 'bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800';
      default:
        return 'bg-gray-50 dark:bg-gray-950 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-800';
    }
  };

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

  // Descargar reporte
  const descargarReporte = async () => {
    try {
      const response = await api.get(`/vendedores/${user.id}/reporte-mensual/${mesSeleccionado}/${añoSeleccionado}`, {
        responseType: 'blob'
      });

      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Reporte-Mensual-${nombresMeses[mesSeleccionado - 1]}-${añoSeleccionado}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error al descargar reporte:', error);
      alert('Error al descargar el reporte');
    }
  };

  // Calcular tasa de conversión como número
  const tasaConversion = parseFloat(stats?.ofertas?.tasa_conversion?.replace('%', '') || 0);

  const statCards = [
    {
      name: 'Clientes',
      value: stats?.clientes?.total || 0,
      cambio: stats?.clientes?.cambio || 0,
      descripcion: 'Clientes',
    },
    {
      name: 'Ofertas Pendientes',
      value: stats?.ofertas?.pendientes || 0,
      cambio: stats?.ofertas?.cambioPendientes || 0,
      descripcion: 'Ofertas Pendientes',
    },
    {
      name: 'Contratos Activos',
      value: stats?.contratos?.activos || 0,
      cambio: stats?.contratos?.cambio || 0,
      descripcion: 'Contratos Activos',
    },
    {
      name: 'Ventas',
      value: mostrarDatos
        ? `$${parseFloat(stats?.finanzas?.total_ventas || 0).toLocaleString()}`
        : '••••••',
      cambio: stats?.finanzas?.cambio_ventas || 0,
      descripcion: 'Ventas',
    },
  ];

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      {/* Header mejorado */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between space-y-4 md:space-y-0 gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-sm md:text-base text-muted-foreground">
            Resumen de {nombresMeses[mesSeleccionado - 1]} {añoSeleccionado}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setMostrarDatos(!mostrarDatos)}
            className="gap-2"
          >
            {mostrarDatos ? (
              <>
                <EyeOff className="w-4 h-4" />
                Ocultar Datos
              </>
            ) : (
              <>
                <Eye className="w-4 h-4" />
                Mostrar Datos
              </>
            )}
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => cambiarMes('anterior')}
            title="Mes anterior"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <Select value={mesSeleccionado.toString()} onValueChange={(value) => setMesSeleccionado(parseInt(value))}>
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
              variant="ghost"
              size="sm"
              onClick={resetearMes}
            >
              Hoy
            </Button>
          )}

          <Button
            variant="default"
            size="sm"
            onClick={descargarReporte}
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            Reporte
          </Button>
        </div>
      </div>

      {/* Tarjetas de estadísticas - Estilo mejorado */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  <Skeleton className="h-4 w-24" />
                </CardTitle>
                <Skeleton className="h-8 w-8 rounded-lg" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-32 mb-1" />
                <Skeleton className="h-3 w-20" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {statCards.map((stat) => {
            const cambio = stat.cambio || 0;
            const esPositivo = cambio > 0;
            const esNegativo = cambio < 0;
            const esCero = cambio === 0;
            const cambioAbsoluto = Math.abs(cambio);

            // "Ofertas Pendientes" siempre debe ser amarillo
            const esOfertasPendientes = stat.name === 'Ofertas Pendientes';
            const badgeColorClass = esOfertasPendientes
              ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
              : esPositivo
                ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                : esNegativo
                  ? 'bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800'
                  : 'bg-gray-50 dark:bg-gray-950/50 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-800';

            return (
              <Card key={stat.name} className="bg-card relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 group border-l-4" style={{ borderLeftColor: esPositivo ? '#10b981' : esNegativo ? '#ef4444' : esOfertasPendientes ? '#f59e0b' : '#6b7280' }}>
                <div className={`absolute inset-0 bg-gradient-to-br ${esPositivo ? 'from-emerald-50/50 to-transparent dark:from-emerald-950/20' : esNegativo ? 'from-red-50/50 to-transparent dark:from-red-950/20' : esOfertasPendientes ? 'from-amber-50/50 to-transparent dark:from-amber-950/20' : 'from-gray-50/50 to-transparent dark:from-gray-950/20'} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                <CardHeader className="pb-2 relative z-10">
                  <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                    {stat.name}
                  </CardTitle>
                  {/* Indicador de rendimiento/KPI - Esquina superior derecha */}
                  {!esCero && (
                    <Badge
                      variant="outline"
                      className={`absolute top-4 right-4 h-6 px-2 rounded-full border ${badgeColorClass} shadow-sm`}
                    >
                      <div className="flex items-center gap-1">
                        {esPositivo ? (
                          <TrendingUp className="w-3 h-3" />
                        ) : (
                          <TrendingDown className="w-3 h-3" />
                        )}
                        <span className="text-xs font-bold">
                          {esPositivo ? '+' : '-'}{cambioAbsoluto}
                        </span>
                      </div>
                    </Badge>
                  )}
                  {esCero && (
                    <Badge
                      variant="outline"
                      className={`absolute top-4 right-4 h-6 px-2 rounded-full border ${badgeColorClass}`}
                    >
                      <div className="flex items-center gap-1">
                        <span className="text-xs font-semibold">
                          -
                        </span>
                      </div>
                    </Badge>
                  )}
                </CardHeader>
                <CardContent className="pt-0 relative z-10">
                  <div className="text-3xl font-bold tracking-tight">{stat.value}</div>
                  {stat.descripcion && (
                    <p className="text-xs text-muted-foreground mt-1 font-medium">{stat.descripcion}</p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Información detallada - Layout mejorado */}
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-7">
        {/* Ofertas - Ocupa más espacio */}
        <Card className="col-span-1 lg:col-span-4">
          <CardHeader>
            <div>
              <CardTitle>Estado de Ofertas</CardTitle>
              <CardDescription>Resumen de Ofertas</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Pendientes</span>
                <Badge variant="outline" className="bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800">
                  {stats?.ofertas?.pendientes || 0}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Aceptadas</span>
                <Badge variant="outline" className="bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800">
                  {stats?.ofertas?.aceptadas || 0}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Rechazadas</span>
                <Badge variant="outline" className="bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800">
                  {stats?.ofertas?.rechazadas || 0}
                </Badge>
              </div>
              <Separator />
              <div className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">Tasa de Conversión</span>
                  <div className="flex items-center gap-1">
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    <span className="font-semibold">{stats?.ofertas?.tasa_conversion || '0%'}</span>
                  </div>
                </div>
                {/* Gráfico de Tasa de Conversión */}
                <div className="h-[200px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={(() => {
                        // Mostrar datos por semana del mes seleccionado
                        const datosGrafico = [];
                        const fechaInicioMes = new Date(añoSeleccionado, mesSeleccionado - 1, 1);
                        const fechaFinMes = new Date(añoSeleccionado, mesSeleccionado, 0);
                        const semanasEnMes = Math.ceil(fechaFinMes.getDate() / 7);

                        for (let i = 0; i < semanasEnMes; i++) {
                          const semanaInicio = new Date(fechaInicioMes);
                          semanaInicio.setDate(semanaInicio.getDate() + (i * 7));
                          const semanaFin = new Date(semanaInicio);
                          semanaFin.setDate(semanaFin.getDate() + 6);

                          // Verificar si la semana actual está dentro del mes
                          if (semanaInicio <= fechaFinMes) {
                            const fechaActual = new Date();
                            const esSemanaActual = fechaActual >= semanaInicio && fechaActual <= semanaFin &&
                              fechaActual.getMonth() === mesSeleccionado - 1 &&
                              fechaActual.getFullYear() === añoSeleccionado;

                            datosGrafico.push({
                              name: `Sem ${i + 1}`,
                              value: esSemanaActual ? tasaConversion : 0
                            });
                          }
                        }

                        return datosGrafico;
                      })()}
                      margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="colorConversion" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8} />
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis
                        dataKey="name"
                        tick={{ fill: 'hsl(var(--muted-foreground))' }}
                        style={{ fontSize: '12px' }}
                      />
                      <YAxis
                        domain={[0, 100]}
                        tick={{ fill: 'hsl(var(--muted-foreground))' }}
                        style={{ fontSize: '12px' }}
                        label={{ value: '%', angle: -90, position: 'insideLeft', fill: 'hsl(var(--muted-foreground))' }}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--popover))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '6px'
                        }}
                        formatter={(value) => [`${value.toFixed(2)}%`, 'Tasa de Conversión']}
                      />
                      <Area
                        type="monotone"
                        dataKey="value"
                        stroke="hsl(var(--primary))"
                        fillOpacity={1}
                        fill="url(#colorConversion)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Comisiones - Ocupa menos espacio */}
        <Card className="col-span-1 lg:col-span-3">
          <CardHeader>
            <CardTitle>Comisiones</CardTitle>
            <CardDescription>Resumen de Comisiones</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Porcentaje</span>
                <Badge variant="secondary">
                  {stats?.finanzas?.comision_porcentaje || 0}%
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Total Comisiones</span>
                <span className="text-sm font-semibold">
                  {mostrarDatos
                    ? `$${parseFloat(stats?.comisiones?.total || stats?.finanzas?.total_comisiones || 0).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                    : '••••••'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Desbloqueadas</span>
                <Badge variant="outline" className="bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800">
                  {mostrarDatos
                    ? `$${parseFloat(stats?.comisiones?.desbloqueadas || stats?.finanzas?.total_comisiones_desbloqueadas || 0).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                    : '••••••'}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Pendientes</span>
                <Badge variant="outline" className="bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800">
                  {mostrarDatos
                    ? `$${parseFloat(stats?.comisiones?.pendientes || stats?.finanzas?.total_comisiones_pendientes || 0).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                    : '••••••'}
                </Badge>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Contratos Pagados</span>
                <Badge variant="default">
                  {stats?.contratos?.pagados_completo || 0}
                </Badge>
              </div>

              {/* Comisiones por Mes */}
              {stats?.comisiones?.por_mes && stats.comisiones.por_mes.length > 0 && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium">Por Mes</h3>
                    <div className="space-y-1.5 max-h-48 overflow-y-auto">
                      {stats.comisiones.por_mes.map((item, idx) => {
                        const [anio, mes] = item.mes.split('-');
                        const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
                        const nombreMes = meses[parseInt(mes) - 1];
                        return (
                          <div key={idx} className="flex items-center justify-between text-sm py-1.5 px-2 bg-muted/50 rounded-md">
                            <span className="text-muted-foreground">{nombreMes} {anio}</span>
                            <span className="font-medium">
                              {mostrarDatos
                                ? `$${item.total.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                                : '••••••'}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Acciones rápidas - Estilo mejorado */}
      <Card>
        <CardHeader>
          <CardTitle>Acciones Rápidas</CardTitle>
          <CardDescription>Accesos directos a las funciones más utilizadas</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
            <Link
              to="/clientes/nuevo"
              className="relative group overflow-hidden rounded-xl border bg-card p-6 text-card-foreground shadow-sm transition-all hover:shadow-md hover:border-primary/50"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-transparent dark:from-blue-950/20 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative flex flex-col items-center gap-3 text-center">
                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform duration-300">
                  <Users className="h-6 w-6" />
                </div>
                <div className="space-y-1">
                  <span className="font-semibold block">Nuevo Cliente</span>
                  <span className="text-xs text-muted-foreground">Registrar un nuevo prospecto</span>
                </div>
              </div>
            </Link>
            <Link
              to="/ofertas/nueva"
              className="relative group overflow-hidden rounded-xl border bg-card p-6 text-card-foreground shadow-sm transition-all hover:shadow-md hover:border-primary/50"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-purple-50 to-transparent dark:from-purple-950/20 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative flex flex-col items-center gap-3 text-center">
                <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-full text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform duration-300">
                  <FileText className="h-6 w-6" />
                </div>
                <div className="space-y-1">
                  <span className="font-semibold block">Nueva Oferta</span>
                  <span className="text-xs text-muted-foreground">Crear propuesta comercial</span>
                </div>
              </div>
            </Link>
            <Link
              to="/contratos"
              className="relative group overflow-hidden rounded-xl border bg-card p-6 text-card-foreground shadow-sm transition-all hover:shadow-md hover:border-primary/50"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 to-transparent dark:from-emerald-950/20 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative flex flex-col items-center gap-3 text-center">
                <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-full text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform duration-300">
                  <FileCheck className="h-6 w-6" />
                </div>
                <div className="space-y-1">
                  <span className="font-semibold block">Ver Contratos</span>
                  <span className="text-xs text-muted-foreground">Administrar contratos activos</span>
                </div>
              </div>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de Contratos */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Contratos</CardTitle>
              <CardDescription>Resumen de Contratos</CardDescription>
            </div>
            <Link
              to="/contratos"
              className={`inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${buttonVariants.outline} h-9 rounded-md px-3`}
            >
              Ver Todos
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {isLoadingContratos ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : contratos.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No hay contratos para el mes seleccionado
            </div>
          ) : (
            <div className="relative w-full overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Fecha Evento</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Estado de Pago</TableHead>
                    <TableHead className="text-right">Monto Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contratos.map((contrato) => (
                    <TableRow key={contrato.id} className="cursor-pointer hover:bg-muted/50">
                      <TableCell className="font-medium">
                        <Link
                          to={`/contratos/${contrato.id}`}
                          className="hover:underline"
                        >
                          {contrato.codigo_contrato}
                        </Link>
                      </TableCell>
                      <TableCell>
                        {contrato.clientes?.nombre_completo || 'Sin cliente'}
                      </TableCell>
                      <TableCell>
                        {contrato.fecha_evento
                          ? format(new Date(contrato.fecha_evento), 'dd/MM/yyyy', { locale: es })
                          : '-'}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={getEstadoContratoColor(contrato.estado)}
                        >
                          {contrato.estado.charAt(0).toUpperCase() + contrato.estado.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={getEstadoPagoColor(contrato.estado_pago)}
                        >
                          {contrato.estado_pago === 'pagado'
                            ? 'Pagado'
                            : contrato.estado_pago === 'parcial'
                              ? 'Pago Parcial'
                              : 'Pendiente'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {mostrarDatos
                          ? `$${parseFloat(contrato.total_contrato || 0).toLocaleString('es-ES', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                          })}`
                          : '••••••'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default Dashboard;
