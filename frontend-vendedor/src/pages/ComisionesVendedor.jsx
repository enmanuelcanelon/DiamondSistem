import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DollarSign, CheckCircle2, XCircle, Loader2, AlertCircle, Calendar, FileText, Filter, Download, ChevronLeft, ChevronRight, Eye, EyeOff } from 'lucide-react';
import api from '../config/api';
import useAuthStore from '../store/useAuthStore';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Separator } from '../components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs';

function ComisionesVendedor() {
  const { user } = useAuthStore();
  const { t, language } = useLanguage();
  const fechaActual = new Date();
  const [mesSeleccionado, setMesSeleccionado] = useState(fechaActual.getMonth() + 1);
  const [añoSeleccionado, setAñoSeleccionado] = useState(fechaActual.getFullYear());
  const [tabActivo, setTabActivo] = useState('primera_mitad');
  const [tabActivoPagadas, setTabActivoPagadas] = useState('primera_mitad');
  const [mostrarDatos, setMostrarDatos] = useState(false);

  const nombresMeses = language === 'es' ? [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ] : [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
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

  // Generar años disponibles (5 años atrás y 5 años adelante)
  const generarAños = () => {
    const años = [];
    const añoActual = fechaActual.getFullYear();
    for (let i = añoActual - 5; i <= añoActual + 5; i++) {
      años.push(i);
    }
    return años;
  };

  const { data: comisionesData, isLoading, isError } = useQuery({
    queryKey: ['vendedor-comisiones', user?.id, mesSeleccionado, añoSeleccionado],
    queryFn: async () => {
      const response = await api.get(`/vendedores/${user.id}/comisiones`, {
        params: {
          mes: mesSeleccionado,
          año: añoSeleccionado
        }
      });
      return response.data;
    },
    enabled: !!user?.id
  });

  const [descargandoPDF, setDescargandoPDF] = useState(false);

  const handleDescargarResumen = async () => {
    try {
      setDescargandoPDF(true);
      const response = await api.get(`/vendedores/${user.id}/comisiones/resumen-pdf`, {
        params: {
          mes: mesSeleccionado,
          año: añoSeleccionado
        },
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Resumen-Comisiones-${nombresMeses[mesSeleccionado - 1]}-${añoSeleccionado}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('PDF descargado exitosamente');
    } catch (error) {
      toast.error('Error al descargar el PDF');
      console.error(error);
    } finally {
      setDescargandoPDF(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isError) {
    return (
      <Card className="border-destructive">
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
            <p className="text-destructive">Error al cargar las comisiones</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const { vendedor, comisiones, comisiones_pendientes, comisiones_pagadas, comisiones_no_desbloqueadas } = comisionesData || {};

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('commissions.title')}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {t('commissions.title')}
          </p>
        </div>
        <Button
          onClick={handleDescargarResumen}
          disabled={descargandoPDF}
          className="whitespace-nowrap"
        >
          {descargandoPDF ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Generando...
            </>
          ) : (
            <>
              <Download className="w-4 h-4 mr-2" />
              {t('offers.downloadPDF')}
            </>
          )}
        </Button>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="icon"
                onClick={() => cambiarMes('anterior')}
                title="Mes anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              
              <div className="flex items-center gap-2">
                <Select value={mesSeleccionado.toString()} onValueChange={(value) => setMesSeleccionado(parseInt(value))}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue>
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
                    <SelectValue>
                      {añoSeleccionado}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {generarAños().map((año) => (
                      <SelectItem key={año} value={año.toString()}>
                        {año}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button
                variant="outline"
                size="icon"
                onClick={() => cambiarMes('siguiente')}
                title="Mes siguiente"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>

              {(mesSeleccionado !== fechaActual.getMonth() + 1 || añoSeleccionado !== fechaActual.getFullYear()) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={resetearMes}
                  title="Volver al mes actual"
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Hoy
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resumen de Comisiones */}
      {vendedor && (
        <Card>
          <CardHeader className="bg-primary/5 border-b">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl">{vendedor.nombre_completo}</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">{vendedor.codigo_vendedor}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Total Desbloqueadas</p>
                <p className="text-2xl font-bold text-primary">
                  {mostrarDatos 
                    ? `$${parseFloat(comisiones?.total_desbloqueadas || 0).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                    : '••••••'}
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            {/* Resumen de Comisiones */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Resumen de Comisiones</h3>
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
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="bg-card relative">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Pendientes de Pago
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="text-2xl font-bold text-yellow-700 dark:text-yellow-300">
                    {mostrarDatos 
                      ? `$${parseFloat(comisiones?.pendientes || 0).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                      : '••••••'}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Comisiones pendientes</p>
                </CardContent>
              </Card>
              <Card className="bg-card relative">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Pagadas
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="text-2xl font-bold text-green-700 dark:text-green-300">
                    {mostrarDatos 
                      ? `$${parseFloat(comisiones?.pagadas || 0).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                      : '••••••'}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Comisiones pagadas</p>
                </CardContent>
              </Card>
              <Card className="bg-card relative">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="text-2xl font-bold text-primary">
                    {mostrarDatos 
                      ? `$${parseFloat(comisiones?.total || 0).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                      : '••••••'}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Total de comisiones</p>
                </CardContent>
              </Card>
            </div>

            {/* Comisiones Pendientes */}
            {comisiones_pendientes && comisiones_pendientes.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <XCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                  <h4 className="text-lg font-semibold text-foreground">
                    Comisiones Pendientes de Pago ({comisiones_pendientes.length})
                  </h4>
                </div>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Contrato</TableHead>
                        <TableHead>Cliente</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead className="text-right">Total Contrato</TableHead>
                        <TableHead className="text-right">Monto Comisión</TableHead>
                        <TableHead className="text-right">Pagado</TableHead>
                        <TableHead className="text-right">Pendiente</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {comisiones_pendientes.map((comision, idx) => (
                        <TableRow key={idx}>
                          <TableCell className="font-medium">{comision.codigo_contrato}</TableCell>
                          <TableCell className="text-muted-foreground">{comision.cliente}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={
                              comision.tipo === 'primera_mitad' 
                                ? 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300' 
                                : 'bg-purple-50 dark:bg-purple-950/20 border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300'
                            }>
                              {comision.tipo === 'primera_mitad' ? 'Primera Mitad' : 'Segunda Mitad'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            {mostrarDatos 
                              ? `$${parseFloat(comision.total_contrato || 0).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                              : '••••••'}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {mostrarDatos 
                              ? `$${parseFloat(comision.monto_total || 0).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                              : '••••••'}
                          </TableCell>
                          <TableCell className="text-right text-muted-foreground">
                            {mostrarDatos 
                              ? `$${parseFloat(comision.monto_pagado || 0).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                              : '••••••'}
                          </TableCell>
                          <TableCell className="text-right font-semibold text-yellow-700 dark:text-yellow-300">
                            {mostrarDatos 
                              ? `$${parseFloat(comision.monto_pendiente || 0).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                              : '••••••'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

            {/* Comisiones Pagadas */}
            {comisiones_pagadas && comisiones_pagadas.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
                    <h4 className="text-lg font-semibold text-foreground">
                      Comisiones Pagadas
                    </h4>
                  </div>
                </div>
                
                <Tabs value={tabActivoPagadas} onValueChange={setTabActivoPagadas} className="w-full">
                  <TabsList className="grid w-full max-w-md grid-cols-2">
                    <TabsTrigger value="primera_mitad">
                      Primera Mitad ({comisiones_pagadas.filter(c => c.tipo === 'primera_mitad').length})
                    </TabsTrigger>
                    <TabsTrigger value="segunda_mitad">
                      Segunda Mitad ({comisiones_pagadas.filter(c => c.tipo === 'segunda_mitad').length})
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="primera_mitad" className="mt-4">
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Contrato</TableHead>
                            <TableHead>Cliente</TableHead>
                            <TableHead className="text-right">Total Contrato</TableHead>
                            <TableHead className="text-right">Monto Comisión</TableHead>
                            <TableHead className="text-right">Pagado</TableHead>
                            <TableHead>Fecha Pago</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {comisiones_pagadas
                            .filter(comision => comision.tipo === 'primera_mitad')
                            .map((comision, idx) => (
                              <TableRow key={idx}>
                                <TableCell className="font-medium">{comision.codigo_contrato}</TableCell>
                                <TableCell className="text-muted-foreground">{comision.cliente}</TableCell>
                                <TableCell className="text-right">
                                  {mostrarDatos 
                                    ? `$${parseFloat(comision.total_contrato || 0).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                                    : '••••••'}
                                </TableCell>
                                <TableCell className="text-right font-medium">
                                  {mostrarDatos 
                                    ? `$${parseFloat(comision.monto_total || 0).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                                    : '••••••'}
                                </TableCell>
                                <TableCell className="text-right font-semibold text-green-700 dark:text-green-300">
                                  {mostrarDatos 
                                    ? `$${parseFloat(comision.monto_pagado || 0).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                                    : '••••••'}
                                </TableCell>
                                <TableCell className="text-muted-foreground">
                                  {comision.fecha_pago 
                                    ? format(new Date(comision.fecha_pago), 'dd/MM/yyyy', { locale: es })
                                    : '-'}
                                </TableCell>
                              </TableRow>
                            ))}
                        </TableBody>
                      </Table>
                    </div>
                  </TabsContent>

                  <TabsContent value="segunda_mitad" className="mt-4">
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Contrato</TableHead>
                            <TableHead>Cliente</TableHead>
                            <TableHead className="text-right">Total Contrato</TableHead>
                            <TableHead className="text-right">Monto Comisión</TableHead>
                            <TableHead className="text-right">Pagado</TableHead>
                            <TableHead>Fecha Pago</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {comisiones_pagadas
                            .filter(comision => comision.tipo === 'segunda_mitad')
                            .map((comision, idx) => (
                              <TableRow key={idx}>
                                <TableCell className="font-medium">{comision.codigo_contrato}</TableCell>
                                <TableCell className="text-muted-foreground">{comision.cliente}</TableCell>
                                <TableCell className="text-right">
                                  {mostrarDatos 
                                    ? `$${parseFloat(comision.total_contrato || 0).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                                    : '••••••'}
                                </TableCell>
                                <TableCell className="text-right font-medium">
                                  {mostrarDatos 
                                    ? `$${parseFloat(comision.monto_total || 0).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                                    : '••••••'}
                                </TableCell>
                                <TableCell className="text-right font-semibold text-green-700 dark:text-green-300">
                                  {mostrarDatos 
                                    ? `$${parseFloat(comision.monto_pagado || 0).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                                    : '••••••'}
                                </TableCell>
                                <TableCell className="text-muted-foreground">
                                  {comision.fecha_pago 
                                    ? format(new Date(comision.fecha_pago), 'dd/MM/yyyy', { locale: es })
                                    : '-'}
                                </TableCell>
                              </TableRow>
                            ))}
                        </TableBody>
                      </Table>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            )}

            {/* Comisiones No Desbloqueadas */}
            {comisiones_no_desbloqueadas && comisiones_no_desbloqueadas.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                    <h4 className="text-lg font-semibold text-foreground">
                      Comisiones No Desbloqueadas
                    </h4>
                  </div>
                </div>
                
                <Tabs value={tabActivo} onValueChange={setTabActivo} className="w-full">
                  <TabsList className="grid w-full max-w-md grid-cols-2">
                    <TabsTrigger value="primera_mitad">
                      Primera Mitad ({comisiones_no_desbloqueadas.filter(c => c.mitades?.some(m => m.tipo === 'primera_mitad')).length})
                    </TabsTrigger>
                    <TabsTrigger value="segunda_mitad">
                      Segunda Mitad ({comisiones_no_desbloqueadas.filter(c => c.mitades?.some(m => m.tipo === 'segunda_mitad')).length})
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="primera_mitad" className="mt-4">
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Código</TableHead>
                            <TableHead>Cliente</TableHead>
                            <TableHead>Fecha Evento</TableHead>
                            <TableHead className="text-right">Total Contrato</TableHead>
                            <TableHead className="text-right">Monto Comisión</TableHead>
                            <TableHead>Motivo</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {comisiones_no_desbloqueadas
                            .filter(comision => comision.mitades?.some(m => m.tipo === 'primera_mitad'))
                            .map((comision, idx) => {
                              const mitad = comision.mitades?.find(m => m.tipo === 'primera_mitad');
                              if (!mitad) return null;
                              return (
                                <TableRow key={idx}>
                                  <TableCell className="font-medium">{comision.codigo_contrato}</TableCell>
                                  <TableCell className="text-muted-foreground">{comision.cliente}</TableCell>
                                  <TableCell>
                                    {comision.fecha_evento 
                                      ? format(new Date(comision.fecha_evento), 'dd/MM/yyyy', { locale: es })
                                      : '-'}
                                  </TableCell>
                                  <TableCell className="text-right">
                                    {mostrarDatos 
                                      ? `$${parseFloat(comision.total_contrato || 0).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                                      : '••••••'}
                                  </TableCell>
                                  <TableCell className="text-right font-medium">
                                    {mostrarDatos 
                                      ? `$${parseFloat(mitad.monto_comision || 0).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                                      : '••••••'}
                                  </TableCell>
                                  <TableCell className="text-sm max-w-md">
                                    {mitad.motivo && mitad.motivo.includes('FUERA DE PLAZO') ? (
                                      <span className="text-red-600 dark:text-red-400 font-medium">
                                        {mitad.motivo}
                                      </span>
                                    ) : (
                                      <span className="text-muted-foreground">
                                        {mitad.motivo || 'No disponible'}
                                      </span>
                                    )}
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                        </TableBody>
                      </Table>
                    </div>
                  </TabsContent>

                  <TabsContent value="segunda_mitad" className="mt-4">
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Código</TableHead>
                            <TableHead>Cliente</TableHead>
                            <TableHead>Fecha Evento</TableHead>
                            <TableHead className="text-right">Total Contrato</TableHead>
                            <TableHead className="text-right">Monto Comisión</TableHead>
                            <TableHead>Motivo</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {comisiones_no_desbloqueadas
                            .filter(comision => comision.mitades?.some(m => m.tipo === 'segunda_mitad'))
                            .map((comision, idx) => {
                              const mitad = comision.mitades?.find(m => m.tipo === 'segunda_mitad');
                              if (!mitad) return null;
                              return (
                                <TableRow key={idx}>
                                  <TableCell className="font-medium">{comision.codigo_contrato}</TableCell>
                                  <TableCell className="text-muted-foreground">{comision.cliente}</TableCell>
                                  <TableCell>
                                    {comision.fecha_evento 
                                      ? format(new Date(comision.fecha_evento), 'dd/MM/yyyy', { locale: es })
                                      : '-'}
                                  </TableCell>
                                  <TableCell className="text-right">
                                    {mostrarDatos 
                                      ? `$${parseFloat(comision.total_contrato || 0).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                                      : '••••••'}
                                  </TableCell>
                                  <TableCell className="text-right font-medium">
                                    {mostrarDatos 
                                      ? `$${parseFloat(mitad.monto_comision || 0).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                                      : '••••••'}
                                  </TableCell>
                                  <TableCell className="text-sm max-w-md">
                                    {mitad.motivo && mitad.motivo.includes('FUERA DE PLAZO') ? (
                                      <span className="text-red-600 dark:text-red-400 font-medium">
                                        {mitad.motivo}
                                      </span>
                                    ) : (
                                      <span className="text-muted-foreground">
                                        {mitad.motivo || 'No disponible'}
                                      </span>
                                    )}
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                        </TableBody>
                      </Table>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            )}

            {(!comisiones_pendientes || comisiones_pendientes.length === 0) && 
             (!comisiones_pagadas || comisiones_pagadas.length === 0) && 
             (!comisiones_no_desbloqueadas || comisiones_no_desbloqueadas.length === 0) && (
              <div className="text-center py-12">
                <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">No hay comisiones registradas para este período</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default ComisionesVendedor;

