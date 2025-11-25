import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Users,
  DollarSign,
  FileText,
  CreditCard,
  Loader2,
  Download,
  Table,
  Music,
  MessageCircle,
  Settings,
  X,
  Eye,
  EyeOff,
  Mail,
} from 'lucide-react';
import api from '../config/api';
import { formatearHora, calcularDuracion, calcularHoraFinConExtras, obtenerHorasAdicionales } from '../utils/formatters';
import { generarNombreEvento, getEventoEmoji } from '../utils/eventNames';
import toast, { Toaster } from 'react-hot-toast';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Progress } from '../components/ui/progress';
import { Separator } from '../components/ui/separator';
import { CheckCircle2 } from 'lucide-react';

function DetalleContrato() {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const [mostrarCodigoAcceso, setMostrarCodigoAcceso] = useState(false);
  
  // Estado para notas internas
  const [notasInternas, setNotasInternas] = useState('');
  const [editandoNotas, setEditandoNotas] = useState(false);

  // Query para obtener el contrato
  const { data: contrato, isLoading } = useQuery({
    queryKey: ['contrato', id],
    queryFn: async () => {
      const response = await api.get(`/contratos/${id}`);
      return response.data.contrato;
    },
    onSuccess: (data) => {
      // Inicializar notas internas cuando se carga el contrato
      setNotasInternas(data?.notas_vendedor || '');
    },
  });

  // Query para obtener los pagos
  const { data: pagos } = useQuery({
    queryKey: ['pagos-contrato', id],
    queryFn: async () => {
      const response = await api.get(`/pagos/contrato/${id}`);
      return response.data.pagos;
    },
  });

  // Query para obtener las versiones del contrato
  const { data: versionesData } = useQuery({
    queryKey: ['versiones-contrato', id],
    queryFn: async () => {
      const response = await api.get(`/contratos/${id}/versiones`);
      return response.data;
    },
  });


  // Mutation para actualizar notas internas
  const mutationNotasInternas = useMutation({
    mutationFn: async (notas) => {
      const response = await api.put(`/contratos/${id}/notas`, { notas_vendedor: notas });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['contrato', id]);
      setEditandoNotas(false);
      toast.success('Notas guardadas exitosamente', {
        duration: 3000,
        icon: '📝',
      });
    },
    onError: (error) => {
      console.error('Error al guardar notas:', error);
      const errorMsg = error.response?.data?.message || 'Error al guardar cambios';
      toast.error(errorMsg, { duration: 4000 });
    },
  });

  const handleDescargarContrato = async () => {
    try {
      const response = await api.get(`/contratos/${id}/pdf-contrato`, {
        params: { lang: 'es' },
        responseType: 'blob'
      });
      
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Contrato-${contrato?.codigo_contrato}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      alert('Error al descargar el contrato');
      console.error(error);
    }
  };

  const handleDescargarVersion = async (versionNumero) => {
    try {
      const response = await api.get(`/contratos/${id}/versiones/${versionNumero}/pdf`, {
        params: { lang: 'es' },
        responseType: 'blob'
      });
      
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Contrato-${contrato?.codigo_contrato}-v${versionNumero}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      alert('Error al descargar la versión del contrato');
      console.error(error);
    }
  };

  const handleEnviarContratoPorEmail = async () => {
    const confirmacion = window.confirm(
      `¿Enviar contrato por email a ${contrato?.clientes?.email}?`
    );
    
    if (!confirmacion) return;

    try {
      await api.post(`/emails/contrato/${id}`);
      alert(`✅ Contrato enviado exitosamente a ${contrato?.clientes?.email}`);
    } catch (error) {
      console.error('Error al enviar contrato:', error);
      alert('❌ Error al enviar el contrato por email: ' + (error.response?.data?.message || error.message));
    }
  };


  const handleGuardarNotas = () => {
    mutationNotasInternas.mutate(notasInternas);
  };

  const handleCancelarNotas = () => {
    setNotasInternas(contrato?.notas_vendedor || '');
    setEditandoNotas(false);
  };

  // Función para determinar si el contrato está finalizado
  const esContratoFinalizado = (fechaEvento) => {
    if (!fechaEvento) return false;
    const fechaEventoDate = new Date(fechaEvento);
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    fechaEventoDate.setHours(0, 0, 0, 0);
    return fechaEventoDate < hoy;
  };

  // Obtener estado real del evento
  const obtenerEstadoEvento = (contrato) => {
    if (esContratoFinalizado(contrato?.fecha_evento)) {
      return 'finalizado';
    }
    return contrato?.estado === 'completado' ? 'completado' : 'activo';
  };

  // Obtener estado de pago
  const obtenerEstadoPago = (contrato) => {
    const total = parseFloat(contrato?.total_contrato || 0);
    const pagado = parseFloat(contrato?.total_pagado || 0);
    const porcentajePago = total > 0 ? (pagado / total) * 100 : 0;
    const esPagadoCompleto = porcentajePago >= 99.5 || parseFloat(contrato?.saldo_pendiente || 0) < 1;
    const tienePagoParcial = pagado > 0 && !esPagadoCompleto;
    
    if (esPagadoCompleto) return 'pagado_completo';
    if (tienePagoParcial) return 'pago_parcial';
    return 'pago_pendiente';
  };

  // Función helper para determinar la categoría de un servicio
  const obtenerCategoriaServicio = (nombreServicio, servicioData) => {
    if (!nombreServicio) return 'Otros';
    
    // Si el servicio tiene categoría definida, usarla
    if (servicioData?.categoria) {
      return servicioData.categoria;
    }
    
    const nombre = nombreServicio.toLowerCase();
    
    // Entretenimiento
    if (nombre.includes('dj') || nombre.includes('hora loca') || nombre.includes('animador') || 
        nombre.includes('fotobooth') || nombre.includes('photobooth')) {
      return 'Entretenimiento';
    }
    
    // Bar
    if (nombre.includes('premium') || nombre.includes('basic') || nombre.includes('sidra') || 
        nombre.includes('champaña') || nombre.includes('champagne') || nombre.includes('bar')) {
      return 'Bar';
    }
    
    // Iluminación
    if (nombre.includes('luces') || nombre.includes('mapping') || nombre.includes('lumínico') || 
        nombre.includes('número lumínico') || nombre.includes('numero luminico')) {
      return 'Iluminación';
    }
    
    // Audio/Video
    if (nombre.includes('pantalla') || nombre.includes('led') || nombre.includes('tv') || 
        nombre.includes('foto y video') || nombre.includes('video') || nombre.includes('foto')) {
      return 'Audio/Video';
    }
    
    // Decoración
    if (nombre.includes('lounge') || nombre.includes('decoración') || nombre.includes('decoracion') || 
        nombre.includes('coctel') || nombre.includes('cóctel')) {
      return 'Decoración';
    }
    
    // Comida
    if (nombre.includes('comida') || nombre.includes('quesos') || nombre.includes('cake') || 
        nombre.includes('utensilios') || nombre.includes('mesa de quesos')) {
      return 'Comida';
    }
    
    // Transporte
    if (nombre.includes('limosina') || nombre.includes('transporte')) {
      return 'Transporte';
    }
    
    // Personal
    if (nombre.includes('coordinador') || nombre.includes('personal de servicio') || 
        nombre.includes('bartender') || nombre.includes('mesero')) {
      return 'Personal';
    }
    
    // Extras
    if (nombre.includes('hora extra') || nombre.includes('máquina de humo') || 
        nombre.includes('maquina de humo') || nombre.includes('chispas') || 
        nombre.includes('humo') || nombre.includes('extra')) {
      return 'Extras';
    }
    
    return 'Otros';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const estadoEventoReal = obtenerEstadoEvento(contrato);
  const estadoPagoReal = obtenerEstadoPago(contrato);

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/contratos">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">
            {generarNombreEvento(contrato)}
          </h1>
          <p className="text-muted-foreground mt-1">
            {contrato?.codigo_contrato} • {contrato?.clientes?.nombre_completo || 'Sin cliente'}
          </p>
        </div>
        <div className="flex gap-2">
          <Badge 
            variant="outline"
            className={
              estadoEventoReal === 'activo' 
                ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800' 
                : estadoEventoReal === 'finalizado'
                ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-800'
                : 'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-950 dark:text-gray-300 dark:border-gray-800'
            }
          >
            {estadoEventoReal === 'finalizado' ? 'Finalizado' : estadoEventoReal === 'activo' ? 'Activo' : 'Completado'}
          </Badge>
          <Badge 
            variant="outline"
            className={
              estadoPagoReal === 'pagado_completo'
                ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800'
                : estadoPagoReal === 'pago_parcial'
                ? 'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-950 dark:text-yellow-300 dark:border-yellow-800'
                : 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950 dark:text-orange-300 dark:border-orange-800'
            }
          >
            {estadoPagoReal === 'pagado_completo' ? 'Pagado Completo' :
             estadoPagoReal === 'pago_parcial' ? 'Pago Parcial' :
             'Pago Pendiente'}
          </Badge>
        </div>
      </div>

      {/* Botones de Acción */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-3">
            <Button asChild className="flex-1 min-w-[200px] whitespace-nowrap">
              <Link to={`/contratos/${id}/mesas`} className="flex items-center gap-2">
                <Table className="w-4 h-4" />
                <span>Asignación de Mesas</span>
              </Link>
            </Button>
            <Button asChild variant="outline" className="flex-1 min-w-[200px] whitespace-nowrap">
              <Link to={`/contratos/${id}/playlist`} className="flex items-center gap-2">
                <Music className="w-4 h-4" />
                <span>Playlist Musical</span>
              </Link>
            </Button>
            <Button asChild variant="outline" className="flex-1 min-w-[200px] whitespace-nowrap">
              <Link to={`/chat/${id}`} className="flex items-center gap-2">
                <MessageCircle className="w-4 h-4" />
                <span>Chat con Cliente</span>
              </Link>
            </Button>
            <Button asChild variant="outline" className="flex-1 min-w-[200px] whitespace-nowrap">
              <Link to={`/ajustes/${id}`} className="flex items-center gap-2">
                <Settings className="w-4 h-4" />
                <span>Ajustes del Evento</span>
              </Link>
            </Button>
            <Button 
              onClick={handleDescargarContrato}
              variant="outline"
              className="flex-1 min-w-[200px] whitespace-nowrap"
            >
              <Download className="w-4 h-4 mr-2" />
              Descargar PDF
            </Button>
            <Button 
              onClick={handleEnviarContratoPorEmail}
              variant="outline"
              className="flex-1 min-w-[200px] whitespace-nowrap"
            >
              <Mail className="w-4 h-4 mr-2" />
              Enviar por Email
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Información del Evento */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Detalles del Evento</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <Calendar className="w-4 h-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Fecha del Evento</p>
                    <p className="font-medium text-foreground">
                      {contrato?.fecha_evento ? new Date(contrato.fecha_evento).toLocaleDateString('es-ES', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      }) : 'Fecha no disponible'}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Clock className="w-4 h-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Horario</p>
                    <p className="font-medium text-foreground">
                      {(() => {
                        const horasAdicionales = obtenerHorasAdicionales(contrato?.contratos_servicios);
                        const horaFinConExtras = calcularHoraFinConExtras(contrato?.hora_fin, horasAdicionales);
                        const duracion = calcularDuracion(contrato?.hora_inicio, horaFinConExtras);
                        
                        return (
                          <>
                            {formatearHora(contrato?.hora_inicio)} - {formatearHora(horaFinConExtras)}
                            {duracion > 0 && (() => {
                              const horasEnteras = Math.floor(duracion);
                              const minutos = Math.round((duracion - horasEnteras) * 60);
                              if (minutos > 0 && minutos < 60) {
                                return ` (${horasEnteras}h ${minutos}m)`;
                              }
                              return ` (${horasEnteras}h)`;
                            })()}
                          </>
                        );
                      })()}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Lugar</p>
                    <p className="font-medium text-foreground">{contrato?.ofertas?.lugar_evento || contrato?.eventos?.nombre_evento || 'No especificado'}</p>
                  </div>
                </div>

                {contrato?.homenajeado && (
                  <div className="flex items-start gap-3">
                    <Users className="w-4 h-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">Homenajeado/a</p>
                      <p className="font-medium text-foreground">{contrato.homenajeado}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-3">
                  <Users className="w-4 h-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Invitados</p>
                    <p className="font-medium text-foreground">{contrato?.cantidad_invitados || 0} personas</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Paquete y Servicios */}
          <Card>
            <CardHeader>
              <CardTitle>Paquete y Servicios</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="inline-block p-4 bg-primary/5 rounded-lg border border-primary/20">
                  <h3 className="font-semibold text-foreground">
                    {contrato?.paquetes?.nombre || 'Paquete no especificado'}
                  </h3>
                </div>

                    {(() => {
                // Función helper para obtener el nombre del servicio ajustado según el salón
                const obtenerNombreServicio = (nombreServicio) => {
                  if (!nombreServicio) return nombreServicio;
                  
                  const salonNombre = contrato?.salones?.nombre || contrato?.lugar_salon || '';
                  
                  // Reemplazar Pantalla LED por Pantalla TV en Doral
                  if (salonNombre === 'Doral' && nombreServicio === 'Pantalla LED') {
                    return 'Pantalla TV';
                  }
                  
                  // Agregar información de millas a Limosina
                  if (nombreServicio === 'Limosina') {
                    return 'Limosina (15 Millas)';
                  }
                  
                  return nombreServicio;
                };

                // Separar servicios incluidos en el paquete de servicios adicionales
                const serviciosIncluidos = [];
                const serviciosAdicionales = [];
                const salonNombre = contrato?.salones?.nombre || contrato?.lugar_salon || '';

                // Obtener servicios del paquete y agruparlos por categoría
                if (contrato?.paquetes?.paquetes_servicios) {
                  contrato.paquetes.paquetes_servicios.forEach((ps) => {
                    const nombreServicio = ps.servicios?.nombre || '';
                    
                    // Filtrar Máquina de Chispas si el salón es Kendall
                    if (salonNombre === 'Kendall' && nombreServicio?.toLowerCase().includes('chispas')) {
                      return; // No mostrar este servicio
                    }
                    
                    serviciosIncluidos.push({
                      id: `paquete-${ps.servicio_id}`,
                      nombre: obtenerNombreServicio(nombreServicio),
                      nombreOriginal: nombreServicio,
                      servicioData: ps.servicios,
                      incluido: true
                    });
                  });
                }

                // Agrupar servicios incluidos por categoría
                const serviciosPorCategoria = serviciosIncluidos.reduce((acc, servicio) => {
                  const categoria = obtenerCategoriaServicio(servicio.nombreOriginal, servicio.servicioData);
                  if (!acc[categoria]) {
                    acc[categoria] = [];
                  }
                  acc[categoria].push(servicio);
                  return acc;
                }, {});

                // Orden de categorías (prioridad visual)
                const ordenCategorias = [
                  'Entretenimiento',
                  'Bar',
                  'Iluminación',
                  'Audio/Video',
                  'Decoración',
                  'Comida',
                  'Transporte',
                  'Personal',
                  'Extras',
                  'Otros'
                ];

                // Ordenar categorías según el orden definido
                const categoriasOrdenadas = Object.keys(serviciosPorCategoria).sort((a, b) => {
                  const indexA = ordenCategorias.indexOf(a);
                  const indexB = ordenCategorias.indexOf(b);
                  if (indexA === -1 && indexB === -1) return a.localeCompare(b);
                  if (indexA === -1) return 1;
                  if (indexB === -1) return -1;
                  return indexA - indexB;
                });

                // Obtener servicios adicionales del contrato
                if (contrato?.contratos_servicios) {
                      // Filtrar servicios mutuamente excluyentes (solo mostrar un Photobooth)
                      const serviciosFiltrados = [];
                      let photoboothConPrecio = null;
                      let photoboothSinPrecio = null;
                      
                      for (const cs of contrato.contratos_servicios) {
                    // Solo procesar servicios adicionales (no incluidos en paquete)
                    if (cs.incluido_en_paquete) {
                      continue;
                    }
                    
                        const nombreServicio = cs.servicios?.nombre || '';
                        const subtotal = parseFloat(cs.subtotal || 0);
                        const precioUnitario = parseFloat(cs.precio_unitario || 0);
                    
                    // Filtrar Máquina de Chispas si el salón es Kendall
                    if (salonNombre === 'Kendall' && nombreServicio?.toLowerCase().includes('chispas')) {
                      continue; // No mostrar este servicio
                    }
                        
                        if (nombreServicio.includes('Photobooth')) {
                          // Priorizar el que tiene precio/subtotal > 0 (el realmente seleccionado)
                          if (subtotal > 0 || precioUnitario > 0) {
                            photoboothConPrecio = cs;
                          } else {
                            // Guardar como respaldo si no hay uno con precio
                            if (!photoboothSinPrecio) {
                              photoboothSinPrecio = cs;
                            }
                          }
                          continue;
                        }
                        
                        // Para otros servicios, agregar normalmente
                        serviciosFiltrados.push(cs);
                      }
                      
                      // Agregar el Photobooth seleccionado (priorizar el que tiene precio)
                      if (photoboothConPrecio) {
                        serviciosFiltrados.push(photoboothConPrecio);
                      } else if (photoboothSinPrecio) {
                        serviciosFiltrados.push(photoboothSinPrecio);
                      }
                      
                  serviciosFiltrados.forEach((cs) => {
                    serviciosAdicionales.push({
                      id: cs.id,
                      nombre: obtenerNombreServicio(cs.servicios?.nombre || ''),
                      subtotal: parseFloat(cs.subtotal || 0),
                      cantidad: cs.cantidad || 1,
                      precio_unitario: parseFloat(cs.precio_unitario || 0)
                    });
                  });
                }

                return (
                  <>
                    {/* Servicios Incluidos en el Paquete - Agrupados por categoría */}
                    {serviciosIncluidos.length > 0 && (
                      <div className="space-y-4">
                        {categoriasOrdenadas.map((categoria) => (
                          <div key={categoria} className="space-y-2">
                            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                              {categoria}
                            </h3>
                            <div className="flex flex-wrap gap-2">
                              {serviciosPorCategoria[categoria].map((servicio) => (
                                <div 
                                  key={servicio.id} 
                                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-green-200 bg-green-50/50 dark:bg-green-950/20 dark:border-green-800"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5 text-green-600 dark:text-green-400 flex-shrink-0" />
                                  <span className="text-sm text-foreground whitespace-nowrap">
                                    {servicio.nombre}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Servicios Adicionales */}
                    {serviciosAdicionales.length > 0 && (
                      <div className={serviciosIncluidos.length > 0 ? 'mt-6 pt-6 border-t' : ''}>
                        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                          Servicios Adicionales (Extras)
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {serviciosAdicionales.map((servicio) => (
                            <div 
                              key={servicio.id} 
                              className="inline-flex items-center gap-2 px-3 py-2 rounded-md border border-orange-200 bg-orange-50/50 dark:bg-orange-950/20 dark:border-orange-800"
                            >
                              <span className="text-sm font-medium text-foreground">
                                {servicio.nombre}
                                {servicio.cantidad > 1 && (
                                  <span className="text-muted-foreground text-xs ml-1">
                                    (x{servicio.cantidad})
                                  </span>
                                )}
                              </span>
                              <Badge variant="outline" className="bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300 border-orange-300 dark:border-orange-700 text-xs font-semibold">
                                ${servicio.subtotal.toLocaleString()}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {serviciosIncluidos.length === 0 && serviciosAdicionales.length === 0 && (
                      <p className="text-sm text-muted-foreground">No hay servicios registrados</p>
                    )}
                  </>
                );
              })()}
            </div>
            </CardContent>
          </Card>
 
          {/* Notas Internas del Vendedor */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-amber-600" />
                  Notas Internas
                </CardTitle>
                {!editandoNotas ? (
                  <Button
                    onClick={() => setEditandoNotas(true)}
                    size="sm"
                  >
                    {contrato?.notas_vendedor ? 'Editar Notas' : 'Agregar Notas'}
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button
                      onClick={handleCancelarNotas}
                      disabled={mutationNotasInternas.isLoading}
                      variant="outline"
                      size="sm"
                    >
                      Cancelar
                    </Button>
                    <Button
                      onClick={handleGuardarNotas}
                      disabled={mutationNotasInternas.isLoading}
                      size="sm"
                    >
                      {mutationNotasInternas.isLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                          Guardando...
                        </>
                      ) : (
                        'Guardar'
                      )}
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>

              {editandoNotas ? (
                <div>
                  <textarea
                    value={notasInternas}
                    onChange={(e) => setNotasInternas(e.target.value)}
                    rows="6"
                    placeholder="Escribe tus notas internas aquí... (Solo visibles para vendedores)"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none resize-none"
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    💡 Estas notas solo son visibles para vendedores y no aparecen en documentos del cliente.
                  </p>
                </div>
              ) : (
                <div className="p-4 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800">
                  {contrato?.notas_vendedor ? (
                    <p className="text-sm text-foreground whitespace-pre-wrap">{contrato.notas_vendedor}</p>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">No hay notas registradas aún.</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
  
          {/* Historial de Pagos */}
          <Card>
            <CardHeader>
              <CardTitle>Historial de Pagos</CardTitle>
            </CardHeader>
            <CardContent>
              {pagos?.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No se han registrado pagos aún
                </p>
              ) : (
                <div className="space-y-3">
                  {pagos?.map((pago) => (
                    <div 
                      key={pago.id} 
                      className={`flex items-center justify-between p-4 rounded-lg border ${
                        pago.estado === 'anulado' 
                          ? 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800' 
                          : 'bg-muted/50 border-border'
                      }`}
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          pago.estado === 'anulado' 
                            ? 'bg-red-100 dark:bg-red-900' 
                            : 'bg-green-100 dark:bg-green-900'
                        }`}>
                          <CreditCard className={`w-5 h-5 ${
                            pago.estado === 'anulado' 
                              ? 'text-red-600 dark:text-red-400' 
                              : 'text-green-600 dark:text-green-400'
                          }`} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className={`font-medium ${
                              pago.estado === 'anulado' 
                                ? 'text-red-900 dark:text-red-300 line-through' 
                                : 'text-foreground'
                            }`}>
                              ${parseFloat(pago.monto_total || pago.monto).toLocaleString()}
                            </p>
                            {pago.estado === 'anulado' && (
                              <Badge variant="destructive" className="text-xs">
                                ANULADO
                              </Badge>
                            )}
                          </div>
                          <p className={`text-sm ${
                            pago.estado === 'anulado' 
                              ? 'text-red-700 dark:text-red-300' 
                              : 'text-muted-foreground'
                          }`}>
                            {pago.metodo_pago} - {new Date(pago.fecha_pago).toLocaleDateString('es-ES')}
                          </p>
                          {pago.numero_referencia && (
                            <p className="text-xs text-muted-foreground">Ref: {pago.numero_referencia}</p>
                          )}
                          {pago.vendedores && (
                            <p className="text-xs text-muted-foreground">
                              Por: {pago.vendedores.nombre_completo}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Versiones del Contrato */}
          {versionesData && versionesData.versiones && versionesData.versiones.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Versiones del Contrato</CardTitle>
              </CardHeader>
              <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Historial de todas las versiones generadas del contrato
              </p>
              <div className="space-y-3">
                {versionesData.versiones.map((version, index) => {
                  const esUltimaVersion = index === 0;
                  const versionAnterior = versionesData.versiones[index + 1];
                  const diferenciaTotal = versionAnterior 
                    ? parseFloat(version.total_contrato) - parseFloat(versionAnterior.total_contrato)
                    : 0;

                  return (
                    <div 
                      key={version.id}
                      className={`p-4 rounded-lg border ${
                        esUltimaVersion 
                          ? 'border-primary/50 bg-primary/5' 
                          : 'border-border bg-muted/50'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-primary-foreground font-bold text-sm">
                              v{version.version_numero}
                            </div>
                            <div>
                              <h3 className="font-semibold text-foreground flex items-center gap-2">
                                Versión {version.version_numero}
                                {esUltimaVersion && (
                                  <Badge variant="default" className="text-xs">
                                    Actual
                                  </Badge>
                                )}
                              </h3>
                              <p className="text-xs text-muted-foreground">
                                {new Date(version.fecha_generacion).toLocaleDateString('es-ES', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </p>
                            </div>
                          </div>

                          {version.motivo_cambio && (
                            <p className="text-sm text-foreground mb-2">
                              {version.motivo_cambio}
                            </p>
                          )}

                          <div className="flex items-center gap-4 text-sm">
                            <span className="text-muted-foreground">
                              Total: <strong className="text-foreground">
                                ${parseFloat(version.total_contrato).toLocaleString()}
                              </strong>
                            </span>
                            {version.cantidad_invitados && (
                              <span className="text-muted-foreground">
                                Invitados: <strong className="text-foreground">
                                  {version.cantidad_invitados}
                                </strong>
                              </span>
                            )}
                          </div>

                          {versionAnterior && diferenciaTotal !== 0 && (
                            <p className={`text-xs mt-2 ${
                              diferenciaTotal > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'
                            }`}>
                              {diferenciaTotal > 0 ? '↗' : '↘'} 
                              {diferenciaTotal > 0 ? '+' : ''}
                              ${Math.abs(diferenciaTotal).toLocaleString()} vs v{version.version_numero - 1}
                            </p>
                          )}
                        </div>

                        <Button
                          onClick={() => handleDescargarVersion(version.version_numero)}
                          variant="outline"
                          size="sm"
                        >
                          <Download className="w-4 h-4 mr-2" />
                          PDF
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
              <p className="text-xs text-muted-foreground text-center mt-4">
                {versionesData.total} {versionesData.total === 1 ? 'versión' : 'versiones'} disponibles
              </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Panel Lateral */}
        <div className="space-y-6">
          {/* Resumen Financiero */}
          <Card>
            <CardHeader>
              <CardTitle>Resumen Financiero</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Monto Total:</span>
                  <span className="font-semibold text-foreground">
                    ${parseFloat(contrato?.total_contrato || 0).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Monto Pagado:</span>
                  <span className="font-semibold text-green-600 dark:text-green-400">
                    ${parseFloat(contrato?.total_pagado || 0).toLocaleString()}
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-foreground font-medium">Saldo Pendiente:</span>
                  <span className="font-bold text-orange-600 dark:text-orange-400">
                    ${parseFloat(contrato?.saldo_pendiente || 0).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Barra de progreso */}
              <div className="mt-4">
                <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                  <span>Progreso de Pago</span>
                  <span className="font-medium text-foreground">
                    {contrato?.total_contrato > 0
                      ? ((parseFloat(contrato?.total_pagado || 0) / parseFloat(contrato?.total_contrato)) * 100).toFixed(1)
                      : 0
                    }%
                  </span>
                </div>
                <Progress 
                  value={contrato?.total_contrato > 0
                    ? (parseFloat(contrato?.total_pagado || 0) / parseFloat(contrato?.total_contrato)) * 100
                    : 0
                  }
                  className="h-2"
                />
              </div>
            </CardContent>
          </Card>

          {/* Información del Contrato */}
          <Card>
            <CardHeader>
              <CardTitle>Información</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 text-sm">
                <div>
                  <p className="text-muted-foreground mb-2">Código de Acceso Cliente:</p>
                  <div className="flex items-center gap-2">
                    <p className="font-mono font-medium text-primary flex-1">
                      {mostrarCodigoAcceso 
                        ? contrato?.codigo_acceso_cliente 
                        : '••••••••••••••••••••'}
                    </p>
                    <Button
                      onClick={() => setMostrarCodigoAcceso(!mostrarCodigoAcceso)}
                      variant="outline"
                      size="sm"
                    >
                      {mostrarCodigoAcceso ? (
                        <>
                          <EyeOff className="w-3 h-3 mr-1" />
                          Ocultar
                        </>
                      ) : (
                        <>
                          <Eye className="w-3 h-3 mr-1" />
                          Mostrar
                        </>
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Código privado para acceso del cliente al portal
                  </p>
                </div>
                <Separator />
                <div>
                  <p className="text-muted-foreground">Fecha de Creación:</p>
                  <p className="font-medium text-foreground">
                    {contrato?.fecha_firma 
                      ? new Date(contrato.fecha_firma).toLocaleDateString('es-ES', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })
                      : 'No especificada'}
                  </p>
                </div>
                {contrato?.notas_internas && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-muted-foreground">Notas Internas:</p>
                      <p className="font-medium text-foreground">{contrato?.notas_internas}</p>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Toaster position="top-right" />
    </div>
  );
}

export default DetalleContrato;

