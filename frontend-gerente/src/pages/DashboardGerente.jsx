import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loader2, Users, FileText, DollarSign, TrendingUp, Calendar, AlertCircle, CheckCircle2, ChevronLeft, ChevronRight, Download, X, User } from 'lucide-react';
import api from '@shared/config/api';
import toast from 'react-hot-toast';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

function DashboardGerente() {
  const fechaActual = new Date();
  const [mesSeleccionado, setMesSeleccionado] = useState(fechaActual.getMonth() + 1);
  const [añoSeleccionado, setAñoSeleccionado] = useState(fechaActual.getFullYear());
  const [vendedorSeleccionado, setVendedorSeleccionado] = useState(null);

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
      {!vendedorSeleccionado ? (
        <Card>
          <CardHeader>
            <CardTitle>Estadísticas por Vendedor</CardTitle>
            <CardDescription>Selecciona un vendedor para ver sus estadísticas detalladas</CardDescription>
          </CardHeader>
          <CardContent>
            {vendedores.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No hay vendedores registrados</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {vendedores.map((stat) => (
                  <button
                    key={stat.vendedor.id}
                    onClick={() => setVendedorSeleccionado(stat)}
                    className="bg-white hover:bg-gray-50 border-2 border-gray-200 hover:border-gray-300 text-gray-900 rounded-lg shadow-md p-8 transition-all transform hover:scale-105 text-left"
                  >
                    <User className="w-12 h-12 mx-auto mb-4 text-gray-700" />
                    <h2 className="text-2xl font-bold mb-2 text-gray-900 text-center">
                      {stat.vendedor.nombre_completo}
                    </h2>
                    <p className="text-gray-600 text-sm text-center mb-3">
                      {stat.vendedor.codigo_vendedor}
                    </p>
                    <div className="flex items-center justify-center gap-4 mt-4 pt-4 border-t border-gray-200">
                      <div className="text-center">
                        <p className="text-xs text-gray-500">Comisión</p>
                        <p className="text-lg font-bold text-gray-900">
                          {stat.vendedor.comision_porcentaje}%
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-gray-500">Ventas</p>
                        <p className="text-lg font-bold text-gray-900">
                          ${parseFloat(stat.ventas.total_ventas || 0).toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Header con botón de volver */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Estadísticas de {vendedorSeleccionado.vendedor.nombre_completo}</CardTitle>
                  <CardDescription>
                    {vendedorSeleccionado.vendedor.codigo_vendedor} - {nombresMeses[mesSeleccionado - 1]} {añoSeleccionado}
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  onClick={() => setVendedorSeleccionado(null)}
                  className="flex items-center gap-2"
                >
                  <X className="w-4 h-4" />
                  Volver a Vendedores
                </Button>
              </div>
            </CardHeader>
          </Card>

          {/* Información del Vendedor */}
          <Card>
            <CardHeader>
              <CardTitle>Información del Vendedor</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Nombre Completo</p>
                    <p className="text-lg font-semibold">{vendedorSeleccionado.vendedor.nombre_completo}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Código de Vendedor</p>
                    <p className="text-lg font-semibold">{vendedorSeleccionado.vendedor.codigo_vendedor}</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Comisión</p>
                    <p className="text-lg font-semibold">{vendedorSeleccionado.vendedor.comision_porcentaje}%</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Estadísticas de Ofertas */}
          <Card>
            <CardHeader>
              <CardTitle>Estadísticas de Ofertas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-muted/50 rounded-lg p-4">
                  <p className="text-xs text-muted-foreground mb-1">Total Ofertas</p>
                  <p className="text-2xl font-bold">{vendedorSeleccionado.ofertas.total}</p>
                </div>
                <div className="bg-muted/50 rounded-lg p-4">
                  <p className="text-xs text-muted-foreground mb-1">Aceptadas</p>
                  <p className="text-2xl font-bold text-green-600">{vendedorSeleccionado.ofertas.aceptadas}</p>
                </div>
                <div className="bg-muted/50 rounded-lg p-4">
                  <p className="text-xs text-muted-foreground mb-1">Pendientes</p>
                  <p className="text-2xl font-bold text-yellow-600">{vendedorSeleccionado.ofertas.pendientes}</p>
                </div>
                <div className="bg-muted/50 rounded-lg p-4">
                  <p className="text-xs text-muted-foreground mb-1">Rechazadas</p>
                  <p className="text-2xl font-bold text-red-600">{vendedorSeleccionado.ofertas.rechazadas}</p>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t">
                <p className="text-sm text-muted-foreground mb-2">Tasa de Conversión</p>
                <div className="flex items-center gap-4">
                  <div className="flex-1 bg-gray-200 rounded-full h-3">
                    <div 
                      className="bg-foreground h-3 rounded-full transition-all"
                      style={{ width: `${Math.min(vendedorSeleccionado.ofertas.tasa_conversion || 0, 100)}%` }}
                    />
                  </div>
                  <span className="text-lg font-bold">{vendedorSeleccionado.ofertas.tasa_conversion}%</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Estadísticas de Ventas */}
          <Card>
            <CardHeader>
              <CardTitle>Estadísticas de Ventas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-muted/50 rounded-lg p-4">
                  <p className="text-xs text-muted-foreground mb-1">Total Ventas</p>
                  <p className="text-2xl font-bold">
                    ${parseFloat(vendedorSeleccionado.ventas.total_ventas || 0).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="bg-muted/50 rounded-lg p-4">
                  <p className="text-xs text-muted-foreground mb-1">Contratos Totales</p>
                  <p className="text-2xl font-bold">{vendedorSeleccionado.ventas.contratos_totales}</p>
                </div>
                <div className="bg-muted/50 rounded-lg p-4">
                  <p className="text-xs text-muted-foreground mb-1">Contratos Pagados</p>
                  <p className="text-2xl font-bold text-green-600">{vendedorSeleccionado.ventas.contratos_pagados}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Comisiones */}
          <Card>
            <CardHeader>
              <CardTitle>Comisiones</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <Card>
                  <CardContent className="p-4">
                    <p className="text-xs text-muted-foreground mb-1">Total Comisiones</p>
                    <p className="text-2xl font-bold">
                      ${parseFloat(vendedorSeleccionado.comisiones?.total || vendedorSeleccionado.ventas.total_comisiones || 0).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">3% del total de contratos</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <p className="text-xs text-muted-foreground mb-1">Desbloqueadas</p>
                    <p className="text-2xl font-bold text-green-600">
                      ${parseFloat(vendedorSeleccionado.comisiones?.desbloqueadas || vendedorSeleccionado.ventas.total_comisiones_desbloqueadas || 0).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">Listas para pagar</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <p className="text-xs text-muted-foreground mb-1">Pendientes</p>
                    <p className="text-2xl font-bold text-yellow-600">
                      ${parseFloat(vendedorSeleccionado.comisiones?.pendientes || 0).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">Aún no desbloqueadas</p>
                  </CardContent>
                </Card>
              </div>

              {/* Comisiones por Mes */}
              {vendedorSeleccionado.comisiones?.por_mes && vendedorSeleccionado.comisiones.por_mes.length > 0 && (
                <div className="mt-6 pt-6 border-t">
                  <h4 className="text-sm font-semibold mb-4">Comisiones Desbloqueadas por Mes</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {vendedorSeleccionado.comisiones.por_mes.map((item, idx) => {
                      const [anio, mes] = item.mes.split('-');
                      const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
                      const nombreMes = meses[parseInt(mes) - 1];
                      return (
                        <Card key={idx}>
                          <CardContent className="p-3">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium">{nombreMes} {anio}</span>
                              <span className="text-sm font-bold">
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
            </CardContent>
          </Card>

          {/* Botón de descarga de reporte */}
          {mesSeleccionado && añoSeleccionado && (
            <Card>
              <CardContent className="pt-6">
                <Button
                  onClick={async () => {
                    try {
                      const response = await api.get(`/gerentes/vendedores/${vendedorSeleccionado.vendedor.id}/reporte-mensual/${mesSeleccionado}/${añoSeleccionado}`, {
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
                      link.download = `Reporte-${vendedorSeleccionado.vendedor.nombre_completo}-${nombresMeses[mesSeleccionado - 1]}-${añoSeleccionado}.pdf`;
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
                  <Download className="w-4 h-4 mr-2" />
                  Descargar Reporte Mensual en PDF
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

export default DashboardGerente;

