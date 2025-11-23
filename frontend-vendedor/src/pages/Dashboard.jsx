import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Users, FileText, FileCheck, DollarSign, TrendingUp, TrendingDown, Calendar, ChevronLeft, ChevronRight, Download, ArrowUpRight, ArrowDownRight, ArrowUp, ArrowDown, Eye, EyeOff } from 'lucide-react';
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
  const { data: stats, isLoading, refetch } = useQuery({
    queryKey: ['vendedor-stats', user?.id, mesSeleccionado, añoSeleccionado],
    staleTime: 5 * 60 * 1000, // Los datos se consideran frescos por 5 minutos
    gcTime: 10 * 60 * 1000, // Mantener en caché por 10 minutos
    refetchInterval: 10 * 60 * 1000, // Auto-refresh cada 10 minutos (optimizado de 5 minutos)
    refetchIntervalInBackground: false, // No refetch cuando la pestaña está en background
    refetchOnWindowFocus: false, // No refetch al cambiar de pestaña (reduce carga)
    refetchOnReconnect: true, // Refetch cuando se reconecta
    retry: (failureCount, error) => {
      // No reintentar si es error 429 (rate limit) o si ya se intentó 2 veces
      if (error?.response?.status === 429) return false;
      return failureCount < 2;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
    queryFn: async () => {
      const { fechaInicio, fechaFin } = calcularFechasPorMes(mesSeleccionado, añoSeleccionado);
      
      // Calcular período anterior (mes anterior) para comparación
      let mesAnterior = mesSeleccionado - 1;
      let añoAnterior = añoSeleccionado;
      if (mesAnterior === 0) {
        mesAnterior = 12;
        añoAnterior = añoSeleccionado - 1;
      }
      const periodoAnterior = calcularFechasPorMes(mesAnterior, añoAnterior);
      
      // Fechas calculadas (sin console.log para evitar spam en producción)
      
      // Obtener ofertas del período actual
      const ofertasResponse = await api.get('/ofertas', {
        params: {
          fecha_desde: fechaInicio.toISOString().split('T')[0],
          fecha_hasta: fechaFin.toISOString().split('T')[0],
          page: 1,
          limit: 1000
        }
      });

      const ofertas = ofertasResponse.data?.data || [];
      const ofertasPendientes = ofertas.filter(o => o.estado === 'pendiente').length;
      const ofertasAceptadas = ofertas.filter(o => o.estado === 'aceptada').length;
      const ofertasRechazadas = ofertas.filter(o => o.estado === 'rechazada').length;
      const totalOfertas = ofertas.length;
      const tasaConversion = totalOfertas > 0 
        ? ((ofertasAceptadas / totalOfertas) * 100).toFixed(2)
        : '0.00';

      // Obtener contratos del período actual (filtrar por fecha del primer pago de $500)
      // Necesitamos obtener todos los contratos y filtrar por fecha del primer pago de $500 en el frontend
      const contratosResponse = await api.get('/contratos', {
        params: {
          page: 1,
          limit: 1000
        }
      });
      
      // Filtrar contratos por fecha del primer pago de $500 en el frontend
      const todosContratos = contratosResponse.data?.data || [];
      const contratos = todosContratos.filter(contrato => {
        // Obtener el primer pago de $500 o más
        if (!contrato.pagos || contrato.pagos.length === 0) return false;
        
        // Buscar el primer pago completado de $500 o más
        const primerPago500 = contrato.pagos.find(pago => 
          pago.estado === 'completado' && 
          parseFloat(pago.monto_total || 0) >= 500
        );
        
        if (!primerPago500 || !primerPago500.fecha_pago) return false;
        
        const fechaPrimerPago = new Date(primerPago500.fecha_pago);
        const fechaPrimerPagoNormalizada = new Date(fechaPrimerPago.getFullYear(), fechaPrimerPago.getMonth(), fechaPrimerPago.getDate());
        const fechaInicioNormalizada = new Date(fechaInicio.getFullYear(), fechaInicio.getMonth(), fechaInicio.getDate());
        const fechaFinNormalizada = new Date(fechaFin.getFullYear(), fechaFin.getMonth(), fechaFin.getDate());
        return fechaPrimerPagoNormalizada >= fechaInicioNormalizada && fechaPrimerPagoNormalizada <= fechaFinNormalizada;
      });
      const contratosActivos = contratos.filter(c => c.estado === 'activo').length;
      const contratosPagadosCompleto = contratos.filter(c => c.estado_pago === 'completado').length;
      // Total Ventas = suma de total_contrato de contratos aceptados (todos los contratos son aceptados por definición)
      const totalVentas = contratos.reduce((sum, c) => sum + parseFloat(c.total_contrato || 0), 0);
      // Número de contratos aceptados (todos los contratos son aceptados por definición)
      const numeroContratosAceptados = contratos.length;

      // Obtener clientes del período actual
      const fechaInicioClientes = new Date(fechaInicio);
      const fechaFinClientes = new Date(fechaFin);
      const clientesResponse = await api.get(`/vendedores/${user.id}/clientes`, {
        params: {
          fecha_desde: fechaInicioClientes.toISOString().split('T')[0],
          fecha_hasta: fechaFinClientes.toISOString().split('T')[0],
          page: 1,
          limit: 1000
        }
      });
      const totalClientes = clientesResponse.data?.total || clientesResponse.data?.data?.length || 0;

      // Obtener comisiones usando el endpoint dedicado (sin filtro de mes para obtener todas)
      let comisionesData = {
        total: 0,
        desbloqueadas: 0,
        pendientes: 0,
        por_mes: []
      };

      try {
        const comisionesResponse = await api.get(`/vendedores/${user.id}/comisiones`);
        if (comisionesResponse.data?.comisiones) {
          comisionesData = {
            total: comisionesResponse.data.comisiones.total || 0,
            desbloqueadas: comisionesResponse.data.comisiones.total_desbloqueadas || 0,
            pendientes: comisionesResponse.data.comisiones.pendientes || 0,
            por_mes: [] // El endpoint no devuelve por_mes, lo calcularemos si es necesario
          };
        }
      } catch (error) {
        // Error al obtener comisiones (silencioso para evitar spam en consola)
        // Se usará el cálculo basado en contratos como fallback
      }

      // Calcular comisiones del período basándose en los contratos del período
      const comisionPorcentaje = 3.0; // 3% fijo
      const totalComisionesPeriodo = totalVentas * (comisionPorcentaje / 100);
      
      // Para las comisiones desbloqueadas y pendientes, usamos los datos del endpoint
      // pero filtramos por el período si es necesario
      const totalComisiones = comisionesData.total || totalComisionesPeriodo;
      const totalComisionesDesbloqueadas = comisionesData.desbloqueadas || 0;
      const totalComisionesPendientes = comisionesData.pendientes || (totalComisiones - totalComisionesDesbloqueadas);

      // Agrupar comisiones por mes basándose en los contratos del período
      const comisionesPorMes = {};
      contratos.forEach((contrato) => {
        if (contrato.fecha_evento) {
          const fechaEvento = new Date(contrato.fecha_evento);
          const mesKey = `${fechaEvento.getFullYear()}-${String(fechaEvento.getMonth() + 1).padStart(2, '0')}`;
          const totalContrato = parseFloat(contrato.total_contrato || 0);
          const comisionTotal = (totalContrato * comisionPorcentaje) / 100;
          
          if (!comisionesPorMes[mesKey]) {
            comisionesPorMes[mesKey] = { total: 0, desbloqueadas: 0 };
          }
          comisionesPorMes[mesKey].total += comisionTotal;
          // Para desbloqueadas, usamos una estimación basada en el porcentaje general
          comisionesPorMes[mesKey].desbloqueadas += comisionTotal * (totalComisionesDesbloqueadas / totalComisiones || 0);
        }
      });

      const comisionesPorMesArray = Object.entries(comisionesPorMes).map(([mes, datos]) => ({
        mes,
        total: datos.total,
        desbloqueadas: datos.desbloqueadas,
        pendientes: datos.total - datos.desbloqueadas
      })).sort((a, b) => b.mes.localeCompare(a.mes));

      // Obtener datos del período anterior para comparación
      let datosAnteriores = {
        clientes: 0,
        ofertasPendientes: 0,
        contratosActivos: 0,
        totalVentas: 0
      };

      // Obtener datos del mes anterior para comparación
      const [ofertasAnterioresResponse, contratosAnterioresResponse, clientesAnterioresResponse] = await Promise.all([
        api.get('/ofertas', {
          params: {
            fecha_desde: periodoAnterior.fechaInicio.toISOString().split('T')[0],
            fecha_hasta: periodoAnterior.fechaFin.toISOString().split('T')[0],
            page: 1,
            limit: 1000
          }
        }),
        api.get('/contratos', {
          params: {
            page: 1,
            limit: 1000
          }
        }),
        api.get(`/vendedores/${user.id}/clientes`, {
          params: {
            fecha_desde: periodoAnterior.fechaInicio.toISOString().split('T')[0],
            fecha_hasta: periodoAnterior.fechaFin.toISOString().split('T')[0],
            page: 1,
            limit: 1000
          }
        })
      ]);

      const ofertasAnteriores = ofertasAnterioresResponse.data?.data || [];
      const todosContratosAnteriores = contratosAnterioresResponse.data?.data || [];
      // Filtrar contratos anteriores por fecha_creacion_contrato
      const contratosAnteriores = todosContratosAnteriores.filter(contrato => {
        if (!contrato.fecha_creacion_contrato) return false;
        const fechaCreacion = new Date(contrato.fecha_creacion_contrato);
        const fechaCreacionNormalizada = new Date(fechaCreacion.getFullYear(), fechaCreacion.getMonth(), fechaCreacion.getDate());
        const fechaInicioNormalizada = new Date(periodoAnterior.fechaInicio.getFullYear(), periodoAnterior.fechaInicio.getMonth(), periodoAnterior.fechaInicio.getDate());
        const fechaFinNormalizada = new Date(periodoAnterior.fechaFin.getFullYear(), periodoAnterior.fechaFin.getMonth(), periodoAnterior.fechaFin.getDate());
        return fechaCreacionNormalizada >= fechaInicioNormalizada && fechaCreacionNormalizada <= fechaFinNormalizada;
      });
      const totalClientesAnteriores = clientesAnterioresResponse.data?.total || clientesAnterioresResponse.data?.data?.length || 0;

      datosAnteriores = {
        clientes: totalClientesAnteriores,
        ofertasPendientes: ofertasAnteriores.filter(o => o.estado === 'pendiente').length,
        contratosActivos: contratosAnteriores.filter(c => c.estado === 'activo').length,
        totalVentas: contratosAnteriores.reduce((sum, c) => sum + parseFloat(c.total_contrato || 0), 0),
        numeroContratosAceptados: contratosAnteriores.length
      };

      // Calcular cambios numéricos (no porcentuales)
      const calcularCambioNumerico = (actual, anterior) => {
        return actual - (anterior || 0);
      };

      // Calcular cambios porcentuales (solo para finanzas)
      const calcularCambioPorcentual = (actual, anterior) => {
        if (!anterior || anterior === 0) return actual > 0 ? 100 : 0;
        return ((actual - anterior) / anterior) * 100;
      };

      return {
        estadisticas: {
          clientes: { 
            total: totalClientes,
            cambio: calcularCambioNumerico(totalClientes, datosAnteriores.clientes)
          },
          ofertas: {
            total: totalOfertas,
            pendientes: ofertasPendientes,
            aceptadas: ofertasAceptadas,
            rechazadas: ofertasRechazadas,
            tasa_conversion: `${tasaConversion}%`,
            cambioPendientes: calcularCambioNumerico(ofertasPendientes, datosAnteriores.ofertasPendientes)
          },
          contratos: {
            activos: contratosActivos,
            total: contratos.length,
            pagados_completo: contratosPagadosCompleto,
            cambio: calcularCambioNumerico(contratosActivos, datosAnteriores.contratosActivos)
          },
          finanzas: {
            total_ventas: totalVentas,
            cambio: calcularCambioNumerico(numeroContratosAceptados, datosAnteriores.numeroContratosAceptados),
            comision_porcentaje: comisionPorcentaje,
            total_comisiones: totalComisiones,
            total_comisiones_desbloqueadas: totalComisionesDesbloqueadas,
            total_comisiones_pendientes: totalComisionesPendientes
          },
          comisiones: {
            total: totalComisiones,
            desbloqueadas: totalComisionesDesbloqueadas,
            pendientes: totalComisionesPendientes,
            por_mes: comisionesPorMesArray
          }
        }
      };
    },
    enabled: !!user?.id,
  });

  const { desde: fechaDesde, hasta: fechaHasta } = calcularFechasPorMes(mesSeleccionado, añoSeleccionado);

  // Obtener contratos del mes seleccionado
  const { data: contratosData, isLoading: isLoadingContratos } = useQuery({
    queryKey: ['contratos-dashboard', user?.id, mesSeleccionado, añoSeleccionado],
    queryFn: async () => {
      // Obtener todos los contratos y filtrar por fecha_creacion_contrato
      const response = await api.get('/contratos', {
        params: {
          page: 1,
          limit: 1000
        }
      });
      
      // Filtrar contratos por fecha del primer pago de $500 del mes seleccionado
      const todosContratos = response.data?.data || [];
      const fechaInicioMes = new Date(añoSeleccionado, mesSeleccionado - 1, 1);
      fechaInicioMes.setHours(0, 0, 0, 0);
      const fechaFinMes = new Date(añoSeleccionado, mesSeleccionado, 0, 23, 59, 59);
      
      const contratosFiltrados = todosContratos.filter(contrato => {
        // Obtener el primer pago de $500 o más
        if (!contrato.pagos || contrato.pagos.length === 0) return false;
        
        // Buscar el primer pago completado de $500 o más
        const primerPago500 = contrato.pagos.find(pago => 
          pago.estado === 'completado' && 
          parseFloat(pago.monto_total || 0) >= 500
        );
        
        if (!primerPago500 || !primerPago500.fecha_pago) return false;
        
        const fechaPrimerPago = new Date(primerPago500.fecha_pago);
        const fechaPrimerPagoNormalizada = new Date(fechaPrimerPago.getFullYear(), fechaPrimerPago.getMonth(), fechaPrimerPago.getDate());
        const fechaInicioNormalizada = new Date(fechaInicioMes.getFullYear(), fechaInicioMes.getMonth(), fechaInicioMes.getDate());
        const fechaFinNormalizada = new Date(fechaFinMes.getFullYear(), fechaFinMes.getMonth(), fechaFinMes.getDate());
        return fechaPrimerPagoNormalizada >= fechaInicioNormalizada && fechaPrimerPagoNormalizada <= fechaFinNormalizada;
      });
      
      return {
        ...response.data,
        data: contratosFiltrados.slice(0, 10) // Solo mostrar los primeros 10
      };
    },
    enabled: !!user?.id,
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
  const tasaConversion = parseFloat(stats?.estadisticas?.ofertas?.tasa_conversion?.replace('%', '') || 0);

  const statCards = [
    {
      name: 'Total Clientes',
      value: stats?.estadisticas?.clientes?.total || 0,
      cambio: stats?.estadisticas?.clientes?.cambio || 0,
      descripcion: 'Clientes registrados',
    },
    {
      name: 'Ofertas Pendientes',
      value: stats?.estadisticas?.ofertas?.pendientes || 0,
      cambio: stats?.estadisticas?.ofertas?.cambioPendientes || 0,
      descripcion: 'Ofertas en revisión',
    },
    {
      name: 'Contratos Activos',
      value: stats?.estadisticas?.contratos?.activos || 0,
      cambio: stats?.estadisticas?.contratos?.cambio || 0,
      descripcion: 'Contratos en curso',
    },
    {
      name: 'Total Ventas',
      value: mostrarDatos 
        ? `$${parseFloat(stats?.estadisticas?.finanzas?.total_ventas || 0).toLocaleString()}`
        : '••••••',
      cambio: stats?.estadisticas?.finanzas?.cambio || 0,
      descripcion: 'Ingresos del período',
    },
  ];

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      {/* Header mejorado */}
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground">
            Resumen de {nombresMeses[mesSeleccionado - 1]} {añoSeleccionado}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setMostrarDatos(!mostrarDatos)}
            className="gap-2"
          >
            {mostrarDatos ? (
              <>
                <EyeOff className="w-4 h-4" />
                Ocultar
              </>
            ) : (
              <>
                <Eye className="w-4 h-4" />
                Mostrar
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
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
              <Card key={stat.name} className="bg-card relative">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {stat.name}
                  </CardTitle>
                  {/* Indicador de rendimiento/KPI - Esquina superior derecha */}
                  {!esCero && (
                    <Badge 
                      variant="outline" 
                      className={`absolute top-4 right-4 h-6 px-2 rounded-full border ${badgeColorClass}`}
                    >
                      <div className="flex items-center gap-1">
                        {esPositivo ? (
                          <TrendingUp className="w-3 h-3" />
                        ) : (
                          <TrendingDown className="w-3 h-3" />
                        )}
                        <span className="text-xs font-semibold">
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
                          0
                        </span>
              </div>
                    </Badge>
                  )}
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="text-2xl font-bold">{stat.value}</div>
                  {stat.descripcion && (
                    <p className="text-xs text-muted-foreground mt-1">{stat.descripcion}</p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Información detallada - Layout mejorado */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* Ofertas - Ocupa más espacio */}
        <Card className="col-span-4">
          <CardHeader>
            <div>
              <CardTitle>Estado de Ofertas</CardTitle>
              <CardDescription>Resumen de ofertas del mes seleccionado</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Pendientes</span>
                <Badge variant="outline" className="bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800">
                {stats?.estadisticas?.ofertas?.pendientes || 0}
                </Badge>
            </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Aceptadas</span>
                <Badge variant="outline" className="bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800">
                {stats?.estadisticas?.ofertas?.aceptadas || 0}
                </Badge>
            </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Rechazadas</span>
                <Badge variant="outline" className="bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800">
                {stats?.estadisticas?.ofertas?.rechazadas || 0}
                </Badge>
              </div>
              <Separator />
              <div className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">Tasa de Conversión</span>
                  <div className="flex items-center gap-1">
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    <span className="font-semibold">{stats?.estadisticas?.ofertas?.tasa_conversion || '0%'}</span>
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
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
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
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Comisiones</CardTitle>
            <CardDescription>Resumen de comisiones del mes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Porcentaje</span>
                <Badge variant="secondary">
                {stats?.estadisticas?.finanzas?.comision_porcentaje || 0}%
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Total Comisiones</span>
                <span className="text-sm font-semibold">
                  {mostrarDatos 
                    ? `$${parseFloat(stats?.estadisticas?.comisiones?.total || stats?.estadisticas?.finanzas?.total_comisiones || 0).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                    : '••••••'}
              </span>
            </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Desbloqueadas</span>
                <Badge variant="outline" className="bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800">
                  {mostrarDatos 
                    ? `$${parseFloat(stats?.estadisticas?.comisiones?.desbloqueadas || stats?.estadisticas?.finanzas?.total_comisiones_desbloqueadas || 0).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                    : '••••••'}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Pendientes</span>
                <Badge variant="outline" className="bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800">
                  {mostrarDatos 
                    ? `$${parseFloat(stats?.estadisticas?.comisiones?.pendientes || stats?.estadisticas?.finanzas?.total_comisiones_pendientes || 0).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                    : '••••••'}
                </Badge>
            </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Contratos Pagados</span>
                <Badge variant="default">
                {stats?.estadisticas?.contratos?.pagados_completo || 0}
                </Badge>
              </div>

              {/* Comisiones por Mes */}
              {stats?.estadisticas?.comisiones?.por_mes && stats.estadisticas.comisiones.por_mes.length > 0 && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium">Por Mes</h3>
                    <div className="space-y-1.5 max-h-48 overflow-y-auto">
                      {stats.estadisticas.comisiones.por_mes.map((item, idx) => {
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
          <div className="grid gap-4 md:grid-cols-3">
            <Link
              to="/clientes/nuevo"
              className={`inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${buttonVariants.outline} h-auto flex-col gap-3 py-6`}
            >
              <Users className="h-5 w-5" />
            <span className="font-medium">Nuevo Cliente</span>
            </Link>
            <Link
              to="/ofertas/nueva"
              className={`inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${buttonVariants.outline} h-auto flex-col gap-3 py-6`}
            >
              <FileText className="h-5 w-5" />
            <span className="font-medium">Nueva Oferta</span>
            </Link>
            <Link
              to="/contratos"
              className={`inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${buttonVariants.outline} h-auto flex-col gap-3 py-6`}
            >
              <FileCheck className="h-5 w-5" />
            <span className="font-medium">Ver Contratos</span>
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
              <CardDescription>Resumen de contratos del mes seleccionado</CardDescription>
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
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default Dashboard;
