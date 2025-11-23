import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loader2, Users, FileText, DollarSign, TrendingUp, Calendar, AlertCircle, CheckCircle2, ChevronLeft, ChevronRight, Download } from 'lucide-react';
import api from '@shared/config/api';
import toast from 'react-hot-toast';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

function DashboardGerente() {
  const fechaActual = new Date();
  const [mesSeleccionado, setMesSeleccionado] = useState(fechaActual.getMonth() + 1);
  const [añoSeleccionado, setAñoSeleccionado] = useState(fechaActual.getFullYear());

  const nombresMeses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

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

  const resetearMes = () => {
    setMesSeleccionado(fechaActual.getMonth() + 1);
    setAñoSeleccionado(fechaActual.getFullYear());
  };

  const { data: dashboardData, isLoading, isError } = useQuery({
    queryKey: ['gerente-dashboard', mesSeleccionado, añoSeleccionado],
    queryFn: async () => {
      const params = {
        mes: mesSeleccionado,
        año: añoSeleccionado
      };
      const response = await api.get('/gerentes/dashboard', { params });
      return response.data.estadisticas;
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-48" />
          </CardHeader>
        </Card>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-4 w-32 mb-2" />
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    toast.error('Error al cargar el dashboard');
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <p className="text-red-600">Error al cargar el dashboard</p>
      </div>
    );
  }

  const stats = dashboardData?.generales || {};
  const vendedores = dashboardData?.vendedores || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <CardTitle>Dashboard de Gerencia</CardTitle>
              <CardDescription>
                Vista general de {nombresMeses[mesSeleccionado - 1]} {añoSeleccionado}
              </CardDescription>
            </div>

            {/* Selector de Mes y Año */}
            <div className="flex items-center gap-2 border rounded-lg p-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => cambiarMes('anterior')}
                title="Mes anterior"
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
              
              <div className="flex items-center gap-2 px-3">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <select
                  value={mesSeleccionado}
                  onChange={(e) => setMesSeleccionado(parseInt(e.target.value))}
                  className="text-sm font-semibold bg-transparent border-none outline-none cursor-pointer"
                >
                  {nombresMeses.map((mes, index) => (
                    <option key={index} value={index + 1}>{mes}</option>
                  ))}
                </select>
                <select
                  value={añoSeleccionado}
                  onChange={(e) => setAñoSeleccionado(parseInt(e.target.value))}
                  className="text-sm font-semibold bg-transparent border-none outline-none cursor-pointer"
                >
                  {Array.from({ length: 5 }, (_, i) => fechaActual.getFullYear() - 2 + i).map(año => (
                    <option key={año} value={año}>{año}</option>
                  ))}
                </select>
              </div>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => cambiarMes('siguiente')}
                title="Mes siguiente"
              >
                <ChevronRight className="w-5 h-5" />
              </Button>

              {(mesSeleccionado !== fechaActual.getMonth() + 1 || añoSeleccionado !== fechaActual.getFullYear()) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={resetearMes}
                  title="Volver al mes actual"
                >
                  Hoy
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Estadísticas Generales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Vendedores</p>
                <p className="text-2xl font-bold">{stats.total_vendedores || 0}</p>
              </div>
              <Users className="w-8 h-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Ofertas Pendientes</p>
                <p className="text-2xl font-bold">{stats.ofertas_pendientes || 0}</p>
              </div>
              <AlertCircle className="w-8 h-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Contratos Pagados</p>
                <p className="text-2xl font-bold">{stats.contratos_pagados || 0}</p>
              </div>
              <CheckCircle2 className="w-8 h-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Clientes Hoy</p>
                <p className="text-2xl font-bold">{stats.clientes_atendidos_hoy || 0}</p>
              </div>
              <Calendar className="w-8 h-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Estadísticas por Vendedor */}
      <Card>
        <CardHeader>
          <CardTitle>Estadísticas por Vendedor</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {vendedores.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No hay vendedores registrados</p>
            ) : (
              vendedores.map((stat) => (
                <Card key={stat.vendedor.id} className="hover:shadow-md transition">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="text-lg font-semibold">
                          {stat.vendedor.nombre_completo}
                        </h3>
                        <p className="text-sm text-muted-foreground">{stat.vendedor.codigo_vendedor}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Comisión</p>
                        <p className="text-lg font-bold">
                          {stat.vendedor.comision_porcentaje}%
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div>
                        <p className="text-xs text-muted-foreground">Ofertas</p>
                        <p className="text-sm font-semibold">
                          {stat.ofertas.total} total
                        </p>
                        <div className="flex gap-2 mt-1">
                          <p className="text-xs text-muted-foreground">
                            {stat.ofertas.pendientes} pendientes
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {stat.ofertas.rechazadas} rechazadas
                          </p>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Tasa Conversión</p>
                        <p className="text-sm font-semibold">
                          {stat.ofertas.tasa_conversion}%
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {stat.ofertas.aceptadas} aceptadas
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Total Ventas</p>
                        <p className="text-sm font-semibold">
                          ${parseFloat(stat.ventas.total_ventas || 0).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Contratos</p>
                        <p className="text-sm font-semibold">
                          {stat.ventas.contratos_totales} total
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {stat.ventas.contratos_pagados} pagados
                        </p>
                      </div>
                    </div>

                    {/* Botón de descarga de reporte */}
                    {mesSeleccionado && añoSeleccionado && (
                      <div className="border-t pt-4 mt-4 mb-4">
                        <Button
                          onClick={async () => {
                            try {
                              const response = await api.get(`/gerentes/vendedores/${stat.vendedor.id}/reporte-mensual/${mesSeleccionado}/${añoSeleccionado}`, {
                                responseType: 'blob'
                              });
                              
                              const blob = new Blob([response.data], { type: 'application/pdf' });
                              const url = window.URL.createObjectURL(blob);
                              const link = document.createElement('a');
                              link.href = url;
                              const nombresMeses = [
                                'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
                                'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
                              ];
                              link.download = `Reporte-${stat.vendedor.nombre_completo}-${nombresMeses[mesSeleccionado - 1]}-${añoSeleccionado}.pdf`;
                              document.body.appendChild(link);
                              link.click();
                              document.body.removeChild(link);
                              window.URL.revokeObjectURL(url);
                              toast.success('Reporte descargado exitosamente');
                            } catch (error) {
                              console.error('Error al descargar reporte:', error);
                              toast.error('Error al descargar el reporte');
                            }
                          }}
                          className="w-full"
                          title="Descargar reporte mensual en PDF"
                        >
                          <Download className="w-4 h-4" />
                          Descargar Reporte Mensual
                        </Button>
                      </div>
                    )}

                    {/* Comisiones */}
                    <div className="border-t pt-4 mt-4">
                      <h4 className="text-sm font-semibold mb-3">Comisiones</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <Card>
                          <CardContent className="p-3">
                            <p className="text-xs text-muted-foreground mb-1">Total Comisiones</p>
                            <p className="text-lg font-bold">
                              ${parseFloat(stat.comisiones?.total || stat.ventas.total_comisiones || 0).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">3% del total de contratos</p>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardContent className="p-3">
                            <p className="text-xs text-muted-foreground mb-1">Desbloqueadas</p>
                            <p className="text-lg font-bold">
                              ${parseFloat(stat.comisiones?.desbloqueadas || stat.ventas.total_comisiones_desbloqueadas || 0).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">Listas para pagar</p>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardContent className="p-3">
                            <p className="text-xs text-muted-foreground mb-1">Pendientes</p>
                            <p className="text-lg font-bold">
                              ${parseFloat(stat.comisiones?.pendientes || 0).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">Aún no desbloqueadas</p>
                          </CardContent>
                        </Card>
                      </div>

                      {/* Comisiones por Mes */}
                      {stat.comisiones?.por_mes && stat.comisiones.por_mes.length > 0 && (
                        <div className="mt-4">
                          <p className="text-xs font-semibold mb-2">Comisiones Desbloqueadas por Mes</p>
                          <div className="space-y-2">
                            {stat.comisiones.por_mes.map((item, idx) => {
                              const [anio, mes] = item.mes.split('-');
                              const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
                              const nombreMes = meses[parseInt(mes) - 1];
                              return (
                                <Card key={idx}>
                                  <CardContent className="p-2">
                                    <div className="flex items-center justify-between">
                                      <span className="text-sm">{nombreMes} {anio}</span>
                                      <span className="text-sm font-semibold">
                                        ${item.total.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                      </span>
                                    </div>
                                  </CardContent>
                                </Card>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default DashboardGerente;

