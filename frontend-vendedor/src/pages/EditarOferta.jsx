import { useState, useEffect } from 'react';
import { useNavigate, Link, useParams } from 'react-router-dom';
import { ArrowLeft, Calculator, Plus, Minus, Save, Loader2, UserPlus, X, ChevronRight, ChevronLeft, CheckCircle2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../config/api';
import ModalCrearCliente from '../components/ModalCrearCliente';
import { calcularDuracion, formatearHora } from '../utils/formatters';

function EditarOferta() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { id: ofertaId } = useParams();
  
  // Estado para el wizard por pasos
  const [pasoActual, setPasoActual] = useState(1);
  const TOTAL_PASOS = 5;

  const [formData, setFormData] = useState({
    cliente_id: '',
    paquete_id: '',
    salon_id: '',
    temporada_id: '',
    fecha_evento: '',
    hora_inicio: '',
    hora_fin: '',
    cantidad_invitados: '',
    lugar_evento: '',
    homenajeado: '',
    servicios_adicionales: [],
    descuento_porcentaje: 0,
    notas_internas: '',
  });

  const [precioCalculado, setPrecioCalculado] = useState(null);
  const [serviciosSeleccionados, setServiciosSeleccionados] = useState([]);
  const [paqueteSeleccionado, setPaqueteSeleccionado] = useState(null);
  const [salonSeleccionado, setSalonSeleccionado] = useState(null);
  const [lugarPersonalizado, setLugarPersonalizado] = useState('');
  const [precioBaseAjustado, setPrecioBaseAjustado] = useState('');
  const [ajusteTemporadaCustom, setAjusteTemporadaCustom] = useState('');
  const [mostrarAjusteTemporada, setMostrarAjusteTemporada] = useState(false);
  const [mostrarAjustePrecioBase, setMostrarAjustePrecioBase] = useState(false);
  const [mostrarAjusteServicios, setMostrarAjusteServicios] = useState(false);
  const [modalClienteOpen, setModalClienteOpen] = useState(false);
  const [errorFecha, setErrorFecha] = useState('');
  const [excedeCapacidad, setExcedeCapacidad] = useState(false);
  const [mostrarModalCapacidad, setMostrarModalCapacidad] = useState(false);
  const [errorHorario, setErrorHorario] = useState('');
  const [mostrarModalHorasExtras, setMostrarModalHorasExtras] = useState(false);
  const [horasExtrasFaltantes, setHorasExtrasFaltantes] = useState(0);
  const [verificandoDisponibilidad, setVerificandoDisponibilidad] = useState(false);
  const [errorDisponibilidad, setErrorDisponibilidad] = useState('');
  const [conflictosDisponibilidad, setConflictosDisponibilidad] = useState(null);
  const [horasOcupadas, setHorasOcupadas] = useState([]);
  const [cargandoHorasOcupadas, setCargandoHorasOcupadas] = useState(false);
  
  // Estado para servicios excluyentes del paquete (ej: Photobooth 360 o Print, Sidra o Champaña)
  const [serviciosExcluyentesSeleccionados, setServiciosExcluyentesSeleccionados] = useState({});

  // Obtener fecha mínima (hoy) en formato YYYY-MM-DD
  const obtenerFechaMinima = () => {
    const hoy = new Date();
    const year = hoy.getFullYear();
    const month = String(hoy.getMonth() + 1).padStart(2, '0');
    const day = String(hoy.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Validar horarios del evento
  const validarHorarios = (horaInicio, horaFin) => {
    if (!horaInicio || !horaFin) return null;

    const convertirAMinutos = (hora) => {
      const [h, m] = hora.split(':').map(Number);
      return h * 60 + m;
    };

    const minutosInicio = convertirAMinutos(horaInicio);
    const minutosFin = convertirAMinutos(horaFin);
    
    const HORA_MINIMA_INICIO = 10 * 60; // 10:00 AM
    const HORA_MAXIMA_FIN_CON_EXTRA = 2 * 60; // 2:00 AM

    if (minutosInicio < HORA_MINIMA_INICIO) {
      return 'La hora de inicio debe ser a partir de las 10:00 AM';
    }

    const terminaDiaSiguiente = minutosFin < minutosInicio;

    if (terminaDiaSiguiente) {
      if (minutosFin > HORA_MAXIMA_FIN_CON_EXTRA) {
        return 'La hora de fin no puede ser después de las 2:00 AM (máximo legal permitido con 1 hora extra)';
      }
    }

    return null;
  };

  // Cargar datos de la oferta existente
  const { data: ofertaExistente, isLoading: cargandoOferta } = useQuery({
    queryKey: ['oferta', ofertaId],
    queryFn: async () => {
      const response = await api.get(`/ofertas/${ofertaId}`);
      return response.data.oferta;
    },
    enabled: !!ofertaId,
  });

  // Queries
  const { data: clientes = [] } = useQuery({
    queryKey: ['clientes'],
    queryFn: async () => {
      try {
        const response = await api.get('/clientes');
        return response.data?.data || [];
      } catch (error) {
        console.error('Error al cargar clientes:', error);
        return [];
      }
    },
  });

  // Query para obtener salones
  const { data: salones } = useQuery({
    queryKey: ['salones'],
    queryFn: async () => {
      const response = await api.get('/salones');
      return response.data.salones;
    },
  });

  // Query para obtener paquetes según el salón seleccionado
  const { data: paquetes } = useQuery({
    queryKey: ['paquetes-salon', formData.salon_id],
    queryFn: async () => {
      if (!formData.salon_id || formData.salon_id === 'otro') {
        // Si no hay salón o es "otro", obtener todos los paquetes
        const response = await api.get('/paquetes');
        return response.data.paquetes;
      }
      // Si hay salón, obtener paquetes de ese salón con precios personalizados
      const response = await api.get(`/salones/${formData.salon_id}/paquetes`);
      return response.data.paquetes;
    },
    enabled: true,
  });

  const { data: temporadas } = useQuery({
    queryKey: ['temporadas'],
    queryFn: async () => {
      const response = await api.get('/temporadas');
      return response.data.temporadas;
    },
  });

  const { data: servicios } = useQuery({
    queryKey: ['servicios'],
    queryFn: async () => {
      const response = await api.get('/servicios');
      return response.data.servicios;
    },
  });

  // Obtener detalles del paquete seleccionado con sus servicios incluidos
  const { data: paqueteDetalle } = useQuery({
    queryKey: ['paquete', formData.paquete_id],
    queryFn: async () => {
      const response = await api.get(`/paquetes/${formData.paquete_id}`);
      return response.data.paquete;
    },
    enabled: !!formData.paquete_id,
  });

  // Cargar datos de la oferta en el formulario
  useEffect(() => {
    if (ofertaExistente) {
      // Validar que se pueda editar
      if (ofertaExistente.estado !== 'pendiente') {
        alert('Solo se pueden editar ofertas en estado pendiente');
        navigate('/ofertas');
        return;
      }

      if (ofertaExistente.contratos && ofertaExistente.contratos.length > 0) {
        alert('No se puede editar una oferta que ya tiene un contrato asociado');
        navigate('/ofertas');
        return;
      }

      // Cargar datos básicos
      setFormData({
        cliente_id: ofertaExistente.cliente_id?.toString() || '',
        paquete_id: ofertaExistente.paquete_id?.toString() || '',
        salon_id: ofertaExistente.salon_id?.toString() || '',
        temporada_id: ofertaExistente.temporada_id?.toString() || '',
        fecha_evento: ofertaExistente.fecha_evento?.split('T')[0] || '',
        hora_inicio: ofertaExistente.hora_inicio || '',
        hora_fin: ofertaExistente.hora_fin || '',
        cantidad_invitados: ofertaExistente.cantidad_invitados?.toString() || '',
        lugar_evento: ofertaExistente.lugar_evento || '',
        homenajeado: ofertaExistente.homenajeado || '',
        descuento_porcentaje: ofertaExistente.descuento || 0,
        notas_internas: ofertaExistente.notas_vendedor || '',
      });
      
      // Si el salon_id es null, podría ser un lugar externo (otro)
      if (!ofertaExistente.salon_id && ofertaExistente.lugar_evento) {
        setLugarPersonalizado(ofertaExistente.lugar_evento);
      }

      // Cargar servicios adicionales
      if (ofertaExistente.ofertas_servicios_adicionales && ofertaExistente.ofertas_servicios_adicionales.length > 0) {
        const serviciosAdicionales = ofertaExistente.ofertas_servicios_adicionales.map(os => ({
          servicio_id: os.servicio_id?.toString(),
          cantidad: os.cantidad || 1,
          precio_ajustado: os.precio_unitario || os.servicios?.precio_base || 0,
          opcion_seleccionada: os.opcion_seleccionada || '',
        }));
        setServiciosSeleccionados(serviciosAdicionales);
      }

      // Nota: Los servicios excluyentes se cargarán en un useEffect separado
      // después de que el paquete y los servicios estén disponibles

      // Cargar ajustes personalizados si existen
      if (ofertaExistente.precio_base_ajustado) {
        setPrecioBaseAjustado(ofertaExistente.precio_base_ajustado.toString());
        setMostrarAjustePrecioBase(true);
      }

      if (ofertaExistente.ajuste_temporada_custom) {
        setAjusteTemporadaCustom(ofertaExistente.ajuste_temporada_custom.toString());
        setMostrarAjusteTemporada(true);
      }

      // Mostrar el precio guardado inicialmente mientras se calcula el nuevo
      if (ofertaExistente.total_final) {
        // Crear un objeto de cálculo temporal con el precio guardado
        setPrecioCalculado({
          desglose: {
            totalFinal: parseFloat(ofertaExistente.total_final),
            subtotalBase: parseFloat(ofertaExistente.subtotal || 0),
            descuento: parseFloat(ofertaExistente.descuento || 0),
            paquete: {
              nombre: ofertaExistente.paquetes?.nombre || 'Paquete',
              precioBase: parseFloat(ofertaExistente.precio_paquete_base || 0),
              ajusteTemporada: parseFloat(ofertaExistente.ajuste_temporada || 0),
            },
            temporada: {
              nombre: ofertaExistente.temporadas?.nombre || 'Temporada',
            },
            serviciosAdicionales: {
              subtotal: parseFloat(ofertaExistente.subtotal_servicios || 0),
            },
            invitados: {
              adicionales: 0,
              subtotal: 0,
              precioUnitario: 0,
            },
            impuestos: {
              iva: {
                porcentaje: parseFloat(ofertaExistente.impuesto_porcentaje || 7),
                monto: parseFloat(ofertaExistente.impuesto_monto || 0),
              },
              tarifaServicio: {
                porcentaje: parseFloat(ofertaExistente.tarifa_servicio_porcentaje || 18),
                monto: parseFloat(ofertaExistente.tarifa_servicio_monto || 0),
              },
              total: parseFloat((ofertaExistente.impuesto_monto || 0) + (ofertaExistente.tarifa_servicio_monto || 0)),
            },
          },
        });
      }
    }
  }, [ofertaExistente, navigate]);

  // Cargar servicios excluyentes seleccionados después de que el paquete y servicios estén disponibles
  useEffect(() => {
    if (ofertaExistente && paqueteSeleccionado && servicios && servicios.length > 0) {
      let grupoIdx = 0;
      const serviciosExcluyentesTemp = {};
      
      // Buscar Photobooth 360 o Print en los servicios del paquete
      const tienePhotobooth360 = paqueteSeleccionado.paquetes_servicios?.some(ps => ps.servicios?.nombre === 'Photobooth 360');
      const tienePhotoboothPrint = paqueteSeleccionado.paquetes_servicios?.some(ps => ps.servicios?.nombre === 'Photobooth Print');
      
      if (tienePhotobooth360 || tienePhotoboothPrint) {
        // Verificar cuál está en los servicios adicionales (si alguno fue cambiado)
        const photoboothEnAdicionales = ofertaExistente.ofertas_servicios_adicionales?.find(
          os => os.servicios?.nombre === 'Photobooth 360' || os.servicios?.nombre === 'Photobooth Print'
        );
        
        if (photoboothEnAdicionales) {
          // Si hay un Photobooth en adicionales, significa que se cambió del original
          serviciosExcluyentesTemp[`grupo_${grupoIdx}`] = photoboothEnAdicionales.servicio_id;
        } else {
          // Usar el que está en el paquete
          const photobooth360Servicio = servicios.find(s => s.nombre === 'Photobooth 360');
          const photoboothPrintServicio = servicios.find(s => s.nombre === 'Photobooth Print');
          
          if (tienePhotobooth360 && photobooth360Servicio) {
            serviciosExcluyentesTemp[`grupo_${grupoIdx}`] = photobooth360Servicio.id;
          } else if (tienePhotoboothPrint && photoboothPrintServicio) {
            serviciosExcluyentesTemp[`grupo_${grupoIdx}`] = photoboothPrintServicio.id;
          }
        }
        grupoIdx++;
      }
      
      // Buscar Sidra o Champaña en los servicios del paquete
      const tieneSidra = paqueteSeleccionado.paquetes_servicios?.some(ps => ps.servicios?.nombre === 'Sidra');
      const tieneChampana = paqueteSeleccionado.paquetes_servicios?.some(ps => ps.servicios?.nombre === 'Champaña');
      
      if (tieneSidra || tieneChampana) {
        // Verificar cuál está en los servicios adicionales (si alguno fue cambiado)
        const sidraChampanaEnAdicionales = ofertaExistente.ofertas_servicios_adicionales?.find(
          os => os.servicios?.nombre === 'Sidra' || os.servicios?.nombre === 'Champaña'
        );
        
        if (sidraChampanaEnAdicionales) {
          // Si hay Sidra/Champaña en adicionales, significa que se cambió del original
          serviciosExcluyentesTemp[`grupo_${grupoIdx}`] = sidraChampanaEnAdicionales.servicio_id;
        } else {
          // Usar el que está en el paquete
          const sidraServicio = servicios.find(s => s.nombre === 'Sidra');
          const champanaServicio = servicios.find(s => s.nombre === 'Champaña');
          
          if (tieneSidra && sidraServicio) {
            serviciosExcluyentesTemp[`grupo_${grupoIdx}`] = sidraServicio.id;
          } else if (tieneChampana && champanaServicio) {
            serviciosExcluyentesTemp[`grupo_${grupoIdx}`] = champanaServicio.id;
          }
        }
      }
      
      setServiciosExcluyentesSeleccionados(serviciosExcluyentesTemp);
    }
  }, [ofertaExistente, paqueteSeleccionado, servicios]);

  // Detectar temporada automáticamente cuando cambia la fecha
  useEffect(() => {
    if (formData.fecha_evento && temporadas && temporadas.length > 0) {
      const fechaEvento = new Date(formData.fecha_evento);
      const mesIndex = fechaEvento.getMonth(); // 0-11
      
      // Nombres de meses en español (minúsculas para comparar)
      const nombresMeses = [
        'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
        'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
      ];
      const mesNombre = nombresMeses[mesIndex];
      
      // Buscar la temporada que contenga este mes
      const temporadaEncontrada = temporadas.find(temp => {
        if (!temp.meses) return false;
        const mesesTemporada = temp.meses.toLowerCase().split(',').map(m => m.trim());
        return mesesTemporada.includes(mesNombre);
      });

      if (temporadaEncontrada) {
        if (temporadaEncontrada.id !== parseInt(formData.temporada_id)) {
          setFormData(prev => ({
            ...prev,
            temporada_id: temporadaEncontrada.id.toString()
          }));
          // Resetear ajuste personalizado cuando cambia la temporada
          setAjusteTemporadaCustom('');
          setMostrarAjusteTemporada(false);
        }
      } else {
        // Si no hay temporada, limpiar el campo
        if (formData.temporada_id) {
          setFormData(prev => ({
            ...prev,
            temporada_id: ''
          }));
          setAjusteTemporadaCustom('');
          setMostrarAjusteTemporada(false);
        }
      }
    }
  }, [formData.fecha_evento, temporadas]);

  // Actualizar información del salón cuando cambia
  useEffect(() => {
    if (formData.salon_id && salones) {
      // Caso especial: "Otro" (sede externa)
      if (formData.salon_id === 'otro') {
        setSalonSeleccionado(null);
        setFormData(prev => ({
          ...prev,
          lugar_evento: lugarPersonalizado || 'Sede Externa'
        }));
        
        // Resetear paquete si hay uno seleccionado (para que no cargue precio de salón)
        if (formData.paquete_id) {
          setPrecioBaseAjustado('');
        }
      } else {
        // Caso normal: salón de la empresa
        const salon = salones.find(s => s.id === parseInt(formData.salon_id));
        if (salon) {
          setSalonSeleccionado(salon);
          // Actualizar lugar_evento con el nombre del salón
          if (formData.lugar_evento !== salon.nombre) {
            setFormData(prev => ({
              ...prev,
              lugar_evento: salon.nombre
            }));
          }
          
          // Si hay paquete seleccionado, resetear para forzar recarga de precio
          if (formData.paquete_id) {
            setPrecioBaseAjustado('');
          }
        }
      }
    }
  }, [formData.salon_id, salones, lugarPersonalizado]);

  // Actualizar servicios incluidos cuando cambia el paquete
  useEffect(() => {
    if (paqueteDetalle) {
      setPaqueteSeleccionado(paqueteDetalle);
      // Resetear precio ajustado cuando cambia el paquete
      setPrecioBaseAjustado('');
      setMostrarAjustePrecioBase(false);
    } else if (!formData.paquete_id) {
      setPaqueteSeleccionado(null);
      setPrecioBaseAjustado('');
      setMostrarAjustePrecioBase(false);
    }
  }, [paqueteDetalle, formData.paquete_id]);

  // Mutation para actualizar oferta
  const mutation = useMutation({
    mutationFn: async (data) => {
      const response = await api.put(`/ofertas/${ofertaId}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['ofertas']);
      queryClient.invalidateQueries(['oferta', ofertaId]);
      navigate('/ofertas');
    },
  });

  // Calcular precio cuando cambian los datos relevantes
  const calcularPrecio = async () => {
    if (!formData.paquete_id || !formData.cantidad_invitados) {
      return;
    }

    try {
      const response = await api.post('/ofertas/calcular', {
        paquete_id: parseInt(formData.paquete_id),
        salon_id: formData.salon_id === 'otro' ? null : (formData.salon_id ? parseInt(formData.salon_id) : null),
        fecha_evento: formData.fecha_evento,
        cantidad_invitados: parseInt(formData.cantidad_invitados),
        precio_base_ajustado: precioBaseAjustado && precioBaseAjustado !== '' ? parseFloat(precioBaseAjustado) : null,
        ajuste_temporada_custom: ajusteTemporadaCustom && ajusteTemporadaCustom !== '' ? parseFloat(ajusteTemporadaCustom) : null,
        servicios_adicionales: serviciosSeleccionados
          .filter(s => s.servicio_id)
          .map(s => ({
            servicio_id: parseInt(s.servicio_id),
            cantidad: parseInt(s.cantidad) || 1,
            precio_ajustado: s.precio_ajustado ? parseFloat(s.precio_ajustado) : null,
            opcion_seleccionada: s.opcion_seleccionada,
          })),
        descuento: parseFloat(formData.descuento_porcentaje) || 0,
      });

      setPrecioCalculado(response.data.calculo);
    } catch (error) {
      console.error('Error al calcular precio:', error);
      setPrecioCalculado(null);
    }
  };

  // Effect para recalcular precio
  useEffect(() => {
    // Solo calcular si tenemos los datos mínimos necesarios
    if (formData.paquete_id && formData.cantidad_invitados) {
      calcularPrecio();
    }
  }, [
    formData.paquete_id,
    formData.fecha_evento,
    formData.temporada_id,
    formData.cantidad_invitados,
    formData.descuento_porcentaje,
    precioBaseAjustado,
    ajusteTemporadaCustom,
    serviciosSeleccionados,
  ]);

  // Función para verificar disponibilidad del salón
  const verificarDisponibilidad = async (salonId, fechaEvento, horaInicio, horaFin, excluirOfertaId = null) => {
    if (!salonId || salonId === 'otro' || !fechaEvento || !horaInicio || !horaFin) {
      setErrorDisponibilidad('');
      setConflictosDisponibilidad(null);
      return;
    }

    setVerificandoDisponibilidad(true);
    setErrorDisponibilidad('');
    setConflictosDisponibilidad(null);

    try {
      const response = await api.post('/salones/disponibilidad', {
        salon_id: parseInt(salonId),
        fecha_evento: fechaEvento,
        hora_inicio: horaInicio,
        hora_fin: horaFin,
        excluir_oferta_id: excluirOfertaId ? parseInt(excluirOfertaId) : null
      });

      if (!response.data.disponible) {
        const conflictos = response.data.conflictos;
        const totalConflictos = (conflictos.contratos?.length || 0) + (conflictos.ofertas?.length || 0);
        
        if (totalConflictos > 0) {
          let mensaje = `⚠️ El salón no está disponible en este horario.\n\n`;
          
          if (conflictos.contratos?.length > 0) {
            mensaje += `Contratos existentes:\n`;
            conflictos.contratos.forEach(c => {
              mensaje += `- ${c.codigo} (${c.cliente}): ${c.hora_inicio} - ${c.hora_fin}\n`;
            });
          }
          
          if (conflictos.ofertas?.length > 0) {
            mensaje += `Ofertas aceptadas:\n`;
            conflictos.ofertas.forEach(o => {
              mensaje += `- ${o.codigo} (${o.cliente}): ${o.hora_inicio} - ${o.hora_fin}\n`;
            });
          }
          
          setErrorDisponibilidad(mensaje);
          setConflictosDisponibilidad(conflictos);
        }
      } else {
        setErrorDisponibilidad('');
        setConflictosDisponibilidad(null);
      }
    } catch (error) {
      console.error('Error al verificar disponibilidad:', error);
      // No mostrar error al usuario si falla la verificación, solo loguear
    } finally {
      setVerificandoDisponibilidad(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Validación especial para fecha del evento
    if (name === 'fecha_evento') {
      const fechaSeleccionada = new Date(value);
      const fechaHoy = new Date();
      fechaHoy.setHours(0, 0, 0, 0); // Resetear horas para comparar solo fechas

      if (fechaSeleccionada < fechaHoy) {
        setErrorFecha('No se puede seleccionar una fecha pasada. Por favor, elige una fecha presente o futura.');
        return; // No actualizar el estado si la fecha es inválida
      } else {
        setErrorFecha(''); // Limpiar error si la fecha es válida
      }
    }

    // Validación para horarios
    if (name === 'hora_inicio' || name === 'hora_fin') {
      const horaInicio = name === 'hora_inicio' ? value : formData.hora_inicio;
      const horaFin = name === 'hora_fin' ? value : formData.hora_fin;
      
      const error = validarHorarios(horaInicio, horaFin);
      setErrorHorario(error || '');
    }

    setFormData({
      ...formData,
      [name]: value,
    });
  };

  // Función para obtener horas ocupadas
  const obtenerHorasOcupadas = async (salonId, fechaEvento) => {
    if (!salonId || salonId === 'otro' || !fechaEvento) {
      setHorasOcupadas([]);
      return;
    }

    try {
      setCargandoHorasOcupadas(true);
      const response = await api.get('/salones/horarios-ocupados', {
        params: {
          salon_id: salonId,
          fecha_evento: fechaEvento,
          excluir_oferta_id: ofertaId
        }
      });

      if (response.data.success) {
        setHorasOcupadas(response.data.horasOcupadas || []);
      }
    } catch (error) {
      console.error('Error al obtener horas ocupadas:', error);
      setHorasOcupadas([]);
    } finally {
      setCargandoHorasOcupadas(false);
    }
  };

  // Effect para obtener horas ocupadas cuando cambian salón o fecha
  useEffect(() => {
    if (formData.salon_id && formData.salon_id !== 'otro' && formData.fecha_evento) {
      const timeoutId = setTimeout(() => {
        obtenerHorasOcupadas(formData.salon_id, formData.fecha_evento);
      }, 500);

      return () => clearTimeout(timeoutId);
    } else {
      setHorasOcupadas([]);
    }
  }, [formData.salon_id, formData.fecha_evento, ofertaId]);

  // Effect para verificar disponibilidad cuando cambian fecha, hora o salón
  // Solo verificar cuando hay salón, fecha Y horas completas
  useEffect(() => {
    if (formData.salon_id && formData.salon_id !== 'otro' && formData.fecha_evento && formData.hora_inicio && formData.hora_fin && !errorHorario) {
      // Esperar un poco para evitar múltiples llamadas mientras el usuario está escribiendo
      const timeoutId = setTimeout(() => {
        verificarDisponibilidad(formData.salon_id, formData.fecha_evento, formData.hora_inicio, formData.hora_fin, ofertaId);
      }, 800); // Debounce de 800ms para evitar falsos positivos

      return () => clearTimeout(timeoutId);
    } else {
      // Limpiar errores si falta algún campo
      if (!formData.salon_id || formData.salon_id === 'otro' || !formData.fecha_evento || !formData.hora_inicio || !formData.hora_fin) {
        setErrorDisponibilidad('');
        setConflictosDisponibilidad(null);
        setVerificandoDisponibilidad(false);
      }
    }
  }, [formData.salon_id, formData.fecha_evento, formData.hora_inicio, formData.hora_fin, errorHorario, ofertaId]);

  // Definir servicios mutuamente excluyentes por nombre
  // NOTA: Las reglas varían según el paquete (ver función obtenerReglasExclusionPorPaquete)
  const serviciosExcluyentes = {
    'Foto y Video 3 Horas': ['Foto y Video 5 Horas'],
    'Foto y Video 5 Horas': ['Foto y Video 3 Horas'],
    'Licor Premium': ['Licor Básico'], // Premium excluye Básico (no downgrade)
    'Decoración Plus': ['Decoración Básica'], // Plus excluye Básica (no downgrade)
    'Photobooth 360': ['Photobooth Print'],
    'Photobooth Print': ['Photobooth 360'],
    'Sidra': ['Champaña'], // Sidra y Champaña son mutuamente excluyentes
    'Champaña': ['Sidra']
  };

  // Función helper para obtener el nombre del servicio ajustado según el salón
  // En Doral, "Pantalla LED" se muestra como "Pantalla TV"
  // Limosina siempre muestra "(15 Millas)"
  const obtenerNombreServicio = (nombreServicio) => {
    if (!nombreServicio) return nombreServicio;
    
    // Reemplazar Pantalla LED por Pantalla TV en Doral
    if (salonSeleccionado?.nombre === 'Doral' && nombreServicio === 'Pantalla LED') {
      return 'Pantalla TV';
    }
    
    // Agregar información de millas a Limosina
    if (nombreServicio === 'Limosina') {
      return 'Limosina (15 Millas)';
    }
    
    return nombreServicio;
  };

  // Función para obtener reglas de exclusión específicas por paquete
  const obtenerReglasExclusionPorPaquete = (nombrePaquete) => {
    const nombre = nombrePaquete?.toLowerCase() || '';
    
    if (nombre.includes('especial')) {
      return {
        permiteUpgradeLicor: true,
        permiteUpgradeDecoracion: true,
        permiteFotoVideo: true,
        excluyeLicorBasicoSiTienePremium: true,
        excluyeDecoracionBasicaSiTienePlus: true,
        excluyeFoto3hSiTiene5h: true,
        excluyeFoto5hSiTiene3h: false
      };
    }
    
    if (nombre.includes('personalizado')) {
      return {
        permiteUpgradeLicor: false,
        permiteUpgradeDecoracion: false,
        permiteFotoVideo: true,
        excluyeLicorBasicoSiTienePremium: true,
        excluyeDecoracionBasicaSiTienePlus: true,
        excluyeFoto3hSiTiene5h: true,
        excluyeFoto5hSiTiene3h: true
      };
    }
    
    if (nombre.includes('platinum') || nombre.includes('platino')) {
      return {
        permiteUpgradeLicor: true,
        permiteUpgradeDecoracion: true,
        permiteFotoVideo: true,
        excluyeLicorBasicoSiTienePremium: true,
        excluyeDecoracionBasicaSiTienePlus: true,
        excluyeFoto3hSiTiene5h: true,
        excluyeFoto5hSiTiene3h: false
      };
    }
    
    if (nombre.includes('diamond')) {
      return {
        permiteUpgradeLicor: true,
        permiteUpgradeDecoracion: false,
        permiteFotoVideo: true,
        excluyeLicorBasicoSiTienePremium: true,
        excluyeDecoracionBasicaSiTienePlus: true,
        excluyeFoto3hSiTiene5h: true,
        excluyeFoto5hSiTiene3h: false,
        ocultarFoto3hSiEstaIncluida: true
      };
    }
    
    if (nombre.includes('deluxe')) {
      return {
        permiteUpgradeLicor: false,
        permiteUpgradeDecoracion: false,
        permiteFotoVideo: false,
        excluyeLicorBasicoSiTienePremium: true,
        excluyeDecoracionBasicaSiTienePlus: true,
        excluyeFoto3hSiTiene5h: true,
        excluyeFoto5hSiTiene3h: false,
        ocultarFoto3hSiEstaIncluida: true
      };
    }
    
    return {
      permiteUpgradeLicor: true,
      permiteUpgradeDecoracion: true,
      permiteFotoVideo: true,
      excluyeLicorBasicoSiTienePremium: true,
      excluyeDecoracionBasicaSiTienePlus: true,
      excluyeFoto3hSiTiene5h: true,
      excluyeFoto5hSiTiene3h: false
    };
  };

  // Calcular horas extras necesarias para el evento
  const calcularHorasExtras = () => {
    if (!paqueteSeleccionado || !formData.hora_inicio || !formData.hora_fin) {
      return { necesarias: 0, duracionEvento: 0, duracionTotal: 0 };
    }

    const [horaInicioH, horaInicioM] = formData.hora_inicio.split(':').map(Number);
    const [horaFinH, horaFinM] = formData.hora_fin.split(':').map(Number);
    
    let duracionEvento = (horaFinH + (horaFinM / 60)) - (horaInicioH + (horaInicioM / 60));
    
    // Si la hora de fin es menor, el evento cruza la medianoche
    if (duracionEvento < 0) {
      duracionEvento += 24;
    }

    // La duración del paquete es solo la duración base (NO se suman horas extras incluidas)
    const duracionTotal = paqueteSeleccionado.duracion_horas || 0;
    
    // Calcular horas extras adicionales necesarias
    const horasExtrasNecesarias = Math.max(0, Math.ceil(duracionEvento - duracionTotal));

    return { necesarias: horasExtrasNecesarias, duracionEvento, duracionTotal };
  };

  const agregarServicio = (servicioId) => {
    const servicioExistente = serviciosSeleccionados.find(s => s.servicio_id === servicioId);
    const servicioData = servicios?.find(s => s.id === parseInt(servicioId));
    
    // ⚠️ VALIDACIÓN ESPECIAL PARA HORA EXTRA
    if (servicioData?.nombre === 'Hora Extra') {
      const cantidadActual = servicioExistente?.cantidad || 0;
      const nuevaCantidad = cantidadActual + 1;
      
      // Calcular hora de fin con las horas extras que se quieren agregar
      // Basarse en la hora de fin actual del evento, no en la hora de inicio
      if (formData.hora_inicio && formData.hora_fin) {
        const [horaFinH, horaFinM] = formData.hora_fin.split(':').map(Number);
        const [horaInicioH] = formData.hora_inicio.split(':').map(Number);
        
        // Determinar si la hora de fin está en el día siguiente (cruza medianoche)
        const cruzaMedianoche = horaFinH < horaInicioH || (horaFinH <= 2 && horaInicioH >= 10);
        
        // Calcular la hora de fin en formato 24h continuo (desde medianoche del día anterior)
        let horaFinEn24hContinuo = horaFinH;
        if (cruzaMedianoche) {
          // Si cruza medianoche: 00 = 24, 01 = 25, 02 = 26
          horaFinEn24hContinuo = horaFinH === 0 ? 24 : (horaFinH === 1 ? 25 : (horaFinH === 2 ? 26 : horaFinH));
        } else {
          // Si no cruza medianoche, pero al agregar horas extras podría cruzar
          // Por ahora mantener la hora normal (0-23)
          horaFinEn24hContinuo = horaFinH;
        }
        
        // Calcular la nueva hora de fin agregando las horas extras
        let nuevaHoraFinEn24hContinuo = horaFinEn24hContinuo + nuevaCantidad;
        
        // Si la nueva hora cruza medianoche (pasa de 23 a 24+), ajustar
        if (!cruzaMedianoche && nuevaHoraFinEn24hContinuo >= 24) {
          // Convertir a formato continuo: 24 = 24, 25 = 25, 26 = 26
          nuevaHoraFinEn24hContinuo = nuevaHoraFinEn24hContinuo;
        }
        
        // Verificar si excede las 2:00 AM (26:00 en formato 24h continuo)
        // El límite es 26 (2:00 AM del día siguiente)
        // Si la nueva hora es mayor a 26, o es 26 pero con minutos, excede el límite
        if (nuevaHoraFinEn24hContinuo > 26 || (nuevaHoraFinEn24hContinuo === 26 && horaFinM > 0)) {
          alert(
            `⚠️ NO PUEDES AGREGAR MÁS HORAS EXTRAS\n\n` +
            `Tu evento termina a las ${formatearHora(formData.hora_fin)}.\n` +
            `Ya tienes ${cantidadActual} hora(s) extra agregada(s).\n\n` +
            `🚫 Si agregas ${nuevaCantidad} hora(s) extra, tu evento terminaría después de las 2:00 AM, lo cual NO está permitido por restricciones legales.\n\n` +
            `Máximo de horas extras permitidas: ${cantidadActual}`
          );
          return;
        }
      }
    }
    
    // Obtener reglas específicas del paquete
    const reglasPaquete = obtenerReglasExclusionPorPaquete(paqueteSeleccionado?.nombre);
    
    // REGLA ESPECÍFICA: Personalizado - Licor y Decoración son excluyentes (no upgrades)
    if (paqueteSeleccionado?.nombre?.toLowerCase().includes('personalizado')) {
      // Verificar en servicios adicionales ya seleccionados
      const tieneLicorPremiumEnAdicionales = serviciosSeleccionados.some(sel => {
        const sData = servicios?.find(srv => srv.id === parseInt(sel.servicio_id));
        return sData?.nombre === 'Licor Premium';
      });
      const tieneLicorBasicoEnAdicionales = serviciosSeleccionados.some(sel => {
        const sData = servicios?.find(srv => srv.id === parseInt(sel.servicio_id));
        return sData?.nombre === 'Licor Básico';
      });
      const tieneDecoracionPlusEnAdicionales = serviciosSeleccionados.some(sel => {
        const sData = servicios?.find(srv => srv.id === parseInt(sel.servicio_id));
        return sData?.nombre === 'Decoración Plus';
      });
      const tieneDecoracionBasicaEnAdicionales = serviciosSeleccionados.some(sel => {
        const sData = servicios?.find(srv => srv.id === parseInt(sel.servicio_id));
        return sData?.nombre === 'Decoración Básica';
      });
      
      // Verificar en el paquete
      const tieneLicorPremiumEnPaquete = paqueteSeleccionado?.paquetes_servicios?.some(ps => ps.servicios?.nombre === 'Licor Premium');
      const tieneLicorBasicoEnPaquete = paqueteSeleccionado?.paquetes_servicios?.some(ps => ps.servicios?.nombre === 'Licor Básico');
      const tieneDecoracionPlusEnPaquete = paqueteSeleccionado?.paquetes_servicios?.some(ps => ps.servicios?.nombre === 'Decoración Plus');
      const tieneDecoracionBasicaEnPaquete = paqueteSeleccionado?.paquetes_servicios?.some(ps => ps.servicios?.nombre === 'Decoración Básica');
      
      // Combinar verificaciones (paquete O adicionales)
      const tieneLicorPremium = tieneLicorPremiumEnPaquete || tieneLicorPremiumEnAdicionales;
      const tieneLicorBasico = tieneLicorBasicoEnPaquete || tieneLicorBasicoEnAdicionales;
      const tieneDecoracionPlus = tieneDecoracionPlusEnPaquete || tieneDecoracionPlusEnAdicionales;
      const tieneDecoracionBasica = tieneDecoracionBasicaEnPaquete || tieneDecoracionBasicaEnAdicionales;
      
      if (servicioData.nombre === 'Licor Premium' && tieneLicorBasico) {
        alert(`No puedes seleccionar "Licor Premium" porque ya tienes "Licor Básico" ${tieneLicorBasicoEnPaquete ? 'en el paquete' : 'en servicios adicionales'}. En el paquete Personalizado, estos servicios son excluyentes.`);
        return;
      }
      if (servicioData.nombre === 'Licor Básico' && tieneLicorPremium) {
        alert(`No puedes seleccionar "Licor Básico" porque ya tienes "Licor Premium" ${tieneLicorPremiumEnPaquete ? 'en el paquete' : 'en servicios adicionales'}. En el paquete Personalizado, estos servicios son excluyentes.`);
        return;
      }
      if (servicioData.nombre === 'Decoración Plus' && tieneDecoracionBasica) {
        alert(`No puedes seleccionar "Decoración Plus" porque ya tienes "Decoración Básica" ${tieneDecoracionBasicaEnPaquete ? 'en el paquete' : 'en servicios adicionales'}. En el paquete Personalizado, estos servicios son excluyentes.`);
        return;
      }
      if (servicioData.nombre === 'Decoración Básica' && tieneDecoracionPlus) {
        alert(`No puedes seleccionar "Decoración Básica" porque ya tienes "Decoración Plus" ${tieneDecoracionPlusEnPaquete ? 'en el paquete' : 'en servicios adicionales'}. En el paquete Personalizado, estos servicios son excluyentes.`);
        return;
      }
    }
    
    // Verificar si el servicio es excluyente con alguno ya seleccionado (adicionales o incluidos en el paquete)
    // NUEVA LÓGICA: Solo bloquear si intenta agregar un servicio básico cuando ya tiene premium/plus
    // EXCEPCIÓN: En paquetes Especial y Personalizado, Sidra y Champaña NO son excluyentes
    const esPaqueteEspecialOPersonalizado = paqueteSeleccionado?.nombre?.toLowerCase().includes('especial') || 
                                            paqueteSeleccionado?.nombre?.toLowerCase().includes('personalizado');
    const esSidraOChampana = servicioData?.nombre === 'Sidra' || servicioData?.nombre === 'Champaña';
    
    if (servicioData && serviciosExcluyentes[servicioData.nombre] && !(esPaqueteEspecialOPersonalizado && esSidraOChampana)) {
      const nombresExcluyentes = serviciosExcluyentes[servicioData.nombre];
      
      // Verificar en servicios adicionales seleccionados
      const tieneExcluyenteEnAdicionales = serviciosSeleccionados.some(s => {
        const sData = servicios?.find(srv => srv.id === parseInt(s.servicio_id));
        return sData && nombresExcluyentes.includes(sData.nombre);
      });
      
      // Verificar en servicios incluidos en el paquete
      // REGLA ESPECIAL: Para Photobooth y Sidra/Champaña, si uno está en el paquete, el otro DEBE estar disponible como adicional
      const esPhotobooth = servicioData?.nombre === 'Photobooth 360' || servicioData?.nombre === 'Photobooth Print';
      
      let tieneExcluyenteEnPaquete = false;
      if (esPhotobooth) {
        // Detectar qué Photobooth está seleccionado en el paquete
        const tienePhotobooth360EnPaquete = paqueteSeleccionado?.paquetes_servicios?.some(ps => ps.servicios?.nombre === 'Photobooth 360');
        const tienePhotoboothPrintEnPaquete = paqueteSeleccionado?.paquetes_servicios?.some(ps => ps.servicios?.nombre === 'Photobooth Print');
        
        // Obtener el servicio seleccionado del grupo excluyente
        const grupoKey = 'grupo_0';
        const seleccionadoId = serviciosExcluyentesSeleccionados[grupoKey];
        let photoboothSeleccionado = null;
        
        if (seleccionadoId) {
          const photobooth360Servicio = servicios?.find(s => s.nombre === 'Photobooth 360');
          const photoboothPrintServicio = servicios?.find(s => s.nombre === 'Photobooth Print');
          
          if (seleccionadoId === photobooth360Servicio?.id) {
            photoboothSeleccionado = 'Photobooth 360';
          } else if (seleccionadoId === photoboothPrintServicio?.id) {
            photoboothSeleccionado = 'Photobooth Print';
          }
        } else {
          if (tienePhotobooth360EnPaquete) {
            photoboothSeleccionado = 'Photobooth 360';
          } else if (tienePhotoboothPrintEnPaquete) {
            photoboothSeleccionado = 'Photobooth Print';
          }
        }
        
        if (servicioData.nombre === 'Photobooth 360' && photoboothSeleccionado === 'Photobooth Print') {
          // Si el paquete tiene Photobooth Print, Photobooth 360 DEBE estar disponible (es la alternativa)
          tieneExcluyenteEnPaquete = false;
        } else if (servicioData.nombre === 'Photobooth Print' && photoboothSeleccionado === 'Photobooth 360') {
          // Si el paquete tiene Photobooth 360, Photobooth Print DEBE estar disponible (es la alternativa)
          tieneExcluyenteEnPaquete = false;
        } else {
          // Si es el mismo servicio que está en el paquete, sí es excluyente
          tieneExcluyenteEnPaquete = paqueteSeleccionado?.paquetes_servicios?.some(ps => {
            return ps.servicios && nombresExcluyentes.includes(ps.servicios.nombre);
          });
        }
      } else if (esSidraOChampana) {
        // Detectar qué servicio está seleccionado en el paquete usando getServiciosPaqueteSeleccionados
        // Primero necesitamos obtener los servicios realmente seleccionados del paquete
        const serviciosPaqueteSeleccionados = [];
        paqueteSeleccionado?.paquetes_servicios?.forEach((ps) => {
          const nombreServicio = ps.servicios?.nombre;
          // Si es Sidra o Champaña, verificar si está seleccionada en el grupo excluyente
          if (nombreServicio === 'Sidra' || nombreServicio === 'Champaña') {
            // Contar grupos excluyentes para encontrar el índice correcto
            let gruposExistentes = 0;
            const serviciosProcesadosGrupo = new Set();
            
            paqueteSeleccionado?.paquetes_servicios?.forEach((ps2) => {
              if (serviciosProcesadosGrupo.has(ps2.servicio_id)) return;
              const nombreServicio2 = ps2.servicios?.nombre;
              const excluyentes2 = serviciosExcluyentes[nombreServicio2];
              
              if (excluyentes2 && (nombreServicio2 === 'Photobooth 360' || nombreServicio2 === 'Photobooth Print')) {
                const grupoExcluyente = paqueteSeleccionado.paquetes_servicios.filter(
                  (otroPs) => {
                    const otroNombre = otroPs.servicios?.nombre;
                    return otroNombre === nombreServicio2 || excluyentes2.includes(otroNombre);
                  }
                );
                
                if (grupoExcluyente.length > 1) {
                  gruposExistentes++;
                  grupoExcluyente.forEach(gps => serviciosProcesadosGrupo.add(gps.servicio_id));
                }
              }
            });
            
            const grupoKey = `grupo_${gruposExistentes}`;
            const seleccionadoId = serviciosExcluyentesSeleccionados[grupoKey];
            
            if (seleccionadoId === ps.servicio_id) {
              serviciosPaqueteSeleccionados.push(ps);
            } else if (!seleccionadoId && nombreServicio === 'Sidra') {
              // Si no hay selección explícita y el paquete tiene Sidra, usarla por defecto
              serviciosPaqueteSeleccionados.push(ps);
            } else if (!seleccionadoId && nombreServicio === 'Champaña') {
              // Si no hay selección explícita y el paquete tiene Champaña, usarla por defecto
              serviciosPaqueteSeleccionados.push(ps);
            }
          } else {
            serviciosPaqueteSeleccionados.push(ps);
          }
        });
        
        const tieneSidraEnPaquete = serviciosPaqueteSeleccionados.some(ps => ps.servicios?.nombre === 'Sidra');
        const tieneChampanaEnPaquete = serviciosPaqueteSeleccionados.some(ps => ps.servicios?.nombre === 'Champaña');
        
        if (servicioData.nombre === 'Sidra' && tieneChampanaEnPaquete) {
          // Si el paquete tiene Champaña, Sidra DEBE estar disponible (es la alternativa)
          tieneExcluyenteEnPaquete = false;
        } else if (servicioData.nombre === 'Champaña' && tieneSidraEnPaquete) {
          // Si el paquete tiene Sidra, Champaña DEBE estar disponible (es la alternativa)
          tieneExcluyenteEnPaquete = false;
        } else {
          // Si es el mismo servicio que está en el paquete, sí es excluyente
          tieneExcluyenteEnPaquete = serviciosPaqueteSeleccionados.some(ps => {
            return ps.servicios && nombresExcluyentes.includes(ps.servicios.nombre);
          });
        }
      } else {
        // Para otros servicios, aplicar la lógica normal
        tieneExcluyenteEnPaquete = paqueteSeleccionado?.paquetes_servicios?.some(ps => {
          return ps.servicios && nombresExcluyentes.includes(ps.servicios.nombre);
        });
      }
      
      // Verificar si es un upgrade permitido según las reglas del paquete
      const esUpgradePermitido = 
        (servicioData.nombre === 'Licor Premium' && reglasPaquete.permiteUpgradeLicor && paqueteSeleccionado?.paquetes_servicios?.some(ps => ps.servicios?.nombre === 'Licor Básico')) ||
        (servicioData.nombre === 'Decoración Plus' && reglasPaquete.permiteUpgradeDecoracion && paqueteSeleccionado?.paquetes_servicios?.some(ps => ps.servicios?.nombre === 'Decoración Básica')) ||
        (servicioData.nombre === 'Foto y Video 5 Horas' && reglasPaquete.permiteFotoVideo && !reglasPaquete.excluyeFoto5hSiTiene3h && paqueteSeleccionado?.paquetes_servicios?.some(ps => ps.servicios?.nombre === 'Foto y Video 3 Horas'));
      
      if (tieneExcluyenteEnAdicionales && !esUpgradePermitido) {
        alert(`No puedes seleccionar "${servicioData.nombre}" porque ya tienes un servicio mejor en servicios adicionales.`);
        return;
      }
      
      if (tieneExcluyenteEnPaquete && !esUpgradePermitido) {
        const servicioEnPaquete = paqueteSeleccionado.paquetes_servicios.find(ps => 
          ps.servicios && nombresExcluyentes.includes(ps.servicios.nombre)
        );
        alert(`No puedes seleccionar "${servicioData.nombre}" porque tu paquete ya incluye "${servicioEnPaquete?.servicios?.nombre}" (versión superior).`);
        return;
      }
    }
    
    if (servicioExistente) {
      // Incrementar cantidad
      setServiciosSeleccionados(
        serviciosSeleccionados.map(s =>
          s.servicio_id === servicioId
            ? { ...s, cantidad: s.cantidad + 1 }
            : s
        )
      );
    } else {
      // Agregar nuevo servicio con precio original
      setServiciosSeleccionados([
        ...serviciosSeleccionados,
        { 
          servicio_id: servicioId, 
          cantidad: 1, 
          opcion_seleccionada: '',
          precio_ajustado: servicioData?.precio_base || 0
        },
      ]);
    }
  };

  const disminuirServicio = (servicioId) => {
    const servicioExistente = serviciosSeleccionados.find(s => s.servicio_id === servicioId);
    
    if (servicioExistente && servicioExistente.cantidad > 1) {
      // Disminuir cantidad
      setServiciosSeleccionados(
        serviciosSeleccionados.map(s =>
          s.servicio_id === servicioId
            ? { ...s, cantidad: s.cantidad - 1 }
            : s
        )
      );
    } else {
      // Eliminar servicio
      setServiciosSeleccionados(
        serviciosSeleccionados.filter(s => s.servicio_id !== servicioId)
      );
    }
  };

  const getCantidadServicio = (servicioId) => {
    const servicio = serviciosSeleccionados.find(s => s.servicio_id === servicioId);
    return servicio ? servicio.cantidad : 0;
  };

  const actualizarPrecioServicio = (servicioId, nuevoPrecio) => {
    setServiciosSeleccionados(
      serviciosSeleccionados.map(s =>
        s.servicio_id === servicioId
          ? { ...s, precio_ajustado: parseFloat(nuevoPrecio) || 0 }
          : s
      )
    );
  };

  // ============================================
  // FUNCIONES DE VALIDACIÓN POR PASO
  // ============================================

  // Validar Paso 1: Información del Cliente
  const validarPaso1 = () => {
    if (!formData.cliente_id || formData.cliente_id === '') {
      alert('⚠️ Por favor, selecciona un cliente antes de continuar.');
      return false;
    }
    return true;
  };

  // Validar Paso 2: Detalles del Evento
  const validarPaso2 = () => {
    if (!formData.fecha_evento) {
      alert('⚠️ Por favor, selecciona la fecha del evento.');
      return false;
    }

    // Validar que la fecha no sea pasada
    const fechaSeleccionada = new Date(formData.fecha_evento);
    const fechaHoy = new Date();
    fechaHoy.setHours(0, 0, 0, 0);

    if (fechaSeleccionada < fechaHoy) {
      setErrorFecha('No se puede seleccionar una fecha pasada. Por favor, elige una fecha presente o futura.');
      alert('⚠️ No se puede seleccionar una fecha pasada.');
      return false;
    }

    if (!formData.cantidad_invitados || parseInt(formData.cantidad_invitados) < 1) {
      alert('⚠️ Por favor, ingresa la cantidad de invitados.');
      return false;
    }

    if (!formData.hora_inicio) {
      alert('⚠️ Por favor, selecciona la hora de inicio del evento.');
      return false;
    }

    if (!formData.hora_fin) {
      alert('⚠️ Por favor, selecciona la hora de fin del evento.');
      return false;
    }

    // Validar horarios
    const errorHorarios = validarHorarios(formData.hora_inicio, formData.hora_fin);
    if (errorHorarios) {
      setErrorHorario(errorHorarios);
      alert(`⚠️ ${errorHorarios}`);
      return false;
    }

    if (!formData.salon_id || formData.salon_id === '') {
      alert('⚠️ Por favor, selecciona un lugar para el evento.');
      return false;
    }

    if (formData.salon_id === 'otro' && !lugarPersonalizado.trim()) {
      alert('⚠️ Por favor, especifica el lugar del evento (sede externa).');
      return false;
    }

    // Validar disponibilidad del salón (solo si no es "otro")
    if (formData.salon_id !== 'otro' && errorDisponibilidad) {
      alert('⚠️ El salón no está disponible en este horario. Por favor, selecciona otra fecha u hora.');
      return false;
    }

    return true;
  };

  // Validar Paso 3: Paquete y Temporada
  const validarPaso3 = () => {
    if (!formData.paquete_id || formData.paquete_id === '') {
      alert('⚠️ Por favor, selecciona un paquete antes de continuar.');
      return false;
    }
    return true;
  };

  // Validar Paso 4: Servicios Adicionales (opcional, siempre válido)
  const validarPaso4 = () => {
    return true;
  };

  // Validar Paso 5: Descuento (opcional, siempre válido)
  const validarPaso5 = () => {
    return true;
  };

  // Función para validar el paso actual
  const validarPasoActual = () => {
    switch (pasoActual) {
      case 1:
        return validarPaso1();
      case 2:
        return validarPaso2();
      case 3:
        return validarPaso3();
      case 4:
        return validarPaso4();
      case 5:
        return validarPaso5();
      default:
        return false;
    }
  };

  // Función para avanzar al siguiente paso
  const avanzarPaso = () => {
    if (validarPasoActual()) {
      if (pasoActual < TOTAL_PASOS) {
        setPasoActual(pasoActual + 1);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        handleSubmitFinal();
      }
    }
  };

  // Función para retroceder al paso anterior
  const retrocederPaso = () => {
    if (pasoActual > 1) {
      setPasoActual(pasoActual - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Función para ir directamente a un paso (solo si los pasos anteriores están completos)
  const irAPaso = (paso) => {
    for (let i = 1; i < paso; i++) {
      let pasoValido = false;
      switch (i) {
        case 1:
          pasoValido = formData.cliente_id !== '';
          break;
        case 2:
          pasoValido = formData.fecha_evento !== '' && 
                      formData.cantidad_invitados !== '' && 
                      formData.hora_inicio !== '' && 
                      formData.hora_fin !== '' && 
                      formData.salon_id !== '';
          break;
        case 3:
          pasoValido = formData.paquete_id !== '';
          break;
        default:
          pasoValido = true;
      }
      
      if (!pasoValido) {
        alert(`⚠️ Debes completar el paso ${i} antes de ir al paso ${paso}.`);
        return;
      }
    }
    
    setPasoActual(paso);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Función para enviar el formulario final (desde el último paso)
  const handleSubmitFinal = () => {
    if (!validarPaso1() || !validarPaso2() || !validarPaso3()) {
      alert('⚠️ Por favor, completa todos los pasos obligatorios antes de guardar los cambios.');
      return;
    }

    const dataToSubmit = {
      cliente_id: parseInt(formData.cliente_id),
      paquete_id: parseInt(formData.paquete_id),
      // Manejar "Otro" como sede externa sin cobro de salón
      salon_id: formData.salon_id === 'otro' ? null : (formData.salon_id ? parseInt(formData.salon_id) : null),
      temporada_id: formData.temporada_id ? parseInt(formData.temporada_id) : null,
      fecha_evento: formData.fecha_evento,
      hora_inicio: formData.hora_inicio,
      hora_fin: formData.hora_fin,
      cantidad_invitados: parseInt(formData.cantidad_invitados),
      lugar_evento: formData.salon_id === 'otro' ? lugarPersonalizado : formData.lugar_evento,
      homenajeado: formData.homenajeado || null,
      descuento: parseFloat(formData.descuento_porcentaje) || 0,
      notas_vendedor: formData.notas_internas || null,
      precio_base_ajustado: precioBaseAjustado && precioBaseAjustado !== '' ? parseFloat(precioBaseAjustado) : null,
      ajuste_temporada_custom: ajusteTemporadaCustom && ajusteTemporadaCustom !== '' ? parseFloat(ajusteTemporadaCustom) : null,
      servicios_adicionales: serviciosSeleccionados.map(s => ({
        servicio_id: parseInt(s.servicio_id),
        cantidad: parseInt(s.cantidad),
        opcion_seleccionada: s.opcion_seleccionada || null,
        precio_ajustado: s.precio_ajustado ? parseFloat(s.precio_ajustado) : null,
      })).filter(s => s.servicio_id),
    };

    mutation.mutate(dataToSubmit);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleSubmitFinal();
  };

  // Función para verificar si un paso está completo
  const pasoCompleto = (paso) => {
    switch (paso) {
      case 1:
        return formData.cliente_id !== '';
      case 2:
        return formData.fecha_evento !== '' && 
               formData.cantidad_invitados !== '' && 
               formData.hora_inicio !== '' && 
               formData.hora_fin !== '' && 
               formData.salon_id !== '' &&
               !errorFecha && !errorHorario;
      case 3:
        return formData.paquete_id !== '';
      case 4:
        return true; // Opcional
      case 5:
        return true; // Opcional
      default:
        return false;
    }
  };

  const nombresPasos = [
    'Información del Cliente',
    'Detalles del Evento',
    'Paquete y Temporada',
    'Servicios Adicionales',
    'Descuento'
  ];

  // Mostrar loading si está cargando
  if (cargandoOferta) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-indigo-600 mx-auto mb-4" />
            <p className="text-gray-600">Cargando oferta...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/ofertas')}
          className="p-2 hover:bg-gray-100 rounded-lg transition"
          type="button"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Editar Oferta</h1>
          <p className="text-gray-600 mt-1">Modifica la propuesta comercial - {ofertaExistente?.codigo_oferta}</p>
        </div>
      </div>

      {/* Indicador de Progreso */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="flex items-center justify-between">
          {[1, 2, 3, 4, 5].map((paso, index) => (
            <div key={paso} className="flex items-center flex-1">
              <div className="flex flex-col items-center flex-1">
                <button
                  type="button"
                  onClick={() => irAPaso(paso)}
                  className={`relative flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all ${
                    paso === pasoActual
                      ? 'bg-indigo-600 border-indigo-600 text-white'
                      : pasoCompleto(paso)
                      ? 'bg-green-100 border-green-500 text-green-700'
                      : paso < pasoActual
                      ? 'bg-gray-100 border-gray-300 text-gray-500'
                      : 'bg-white border-gray-300 text-gray-400'
                  }`}
                  disabled={paso > pasoActual && !pasoCompleto(paso - 1)}
                >
                  {pasoCompleto(paso) && paso !== pasoActual ? (
                    <CheckCircle2 className="w-6 h-6" />
                  ) : (
                    <span className="font-semibold">{paso}</span>
                  )}
                </button>
                <span className={`mt-2 text-xs font-medium text-center ${
                  paso === pasoActual ? 'text-indigo-600' : 'text-gray-500'
                }`}>
                  {nombresPasos[paso - 1]}
                </span>
              </div>
              {index < 4 && (
                <div className={`flex-1 h-0.5 mx-2 ${
                  pasoCompleto(paso) ? 'bg-green-500' : 'bg-gray-200'
                }`} />
              )}
            </div>
          ))}
        </div>
      </div>

      <form onSubmit={(e) => { e.preventDefault(); handleSubmitFinal(); }} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formulario */}
        <div className="lg:col-span-2 space-y-6">
          {/* PASO 1: Información del Cliente */}
          {pasoActual === 1 && (
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Información del Cliente</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cliente *
                </label>
                <select
                  name="cliente_id"
                  value={formData.cliente_id}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                >
                  <option value="">Seleccionar cliente...</option>
                  {clientes?.map((cliente) => (
                    <option key={cliente.id} value={cliente.id}>
                      {cliente.nombre_completo} - {cliente.email}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          )}

          {/* PASO 2: Detalles del Evento */}
          {pasoActual === 2 && (
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Detalles del Evento</h2>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Homenajeado/a
              </label>
              <input
                type="text"
                name="homenajeado"
                value={formData.homenajeado}
                onChange={handleChange}
                placeholder="Ej: María López, Juan Pérez"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
              />
              <p className="text-xs text-gray-500 mt-1">
                Nombre de la persona homenajeada en el evento (opcional)
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Lugar del Evento - PRIMERO */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Lugar del Evento *
                </label>
                <select
                  name="salon_id"
                  value={formData.salon_id}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                >
                  <option value="">Seleccione un lugar</option>
                  {salones?.map((salon) => (
                    <option key={salon.id} value={salon.id}>
                      {salon.nombre} - Capacidad: {salon.capacidad_maxima} invitados
                    </option>
                  ))}
                  <option value="otro">Otro (Sede Externa - Sin cargo de salón)</option>
                </select>
                {salonSeleccionado && formData.salon_id !== 'otro' && (
                  <p className="text-xs text-gray-500 mt-1">
                    ℹ️ Capacidad máxima: {salonSeleccionado.capacidad_maxima} invitados
                  </p>
                )}
                {formData.salon_id === 'otro' && (
                  <div className="mt-3">
                    <input
                      type="text"
                      value={lugarPersonalizado}
                      onChange={(e) => setLugarPersonalizado(e.target.value)}
                      placeholder="Especifica el lugar (ej: Universidad de Miami, Auditorio XYZ)"
                      required
                      className="w-full px-4 py-2 border border-amber-300 bg-amber-50 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
                      maxLength={255}
                    />
                    <p className="text-xs text-amber-700 mt-1 flex items-center gap-1">
                      <span className="font-semibold">💡 Importante:</span> Para sedes externas NO se cobra el salón. Solo se cobran los servicios.
                    </p>
                  </div>
                )}
              </div>

              {/* Fecha del Evento - SEGUNDO */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha del Evento *
                </label>
                <div className="relative">
                  <input
                    type="date"
                    name="fecha_evento"
                    value={formData.fecha_evento}
                    onChange={handleChange}
                    min={obtenerFechaMinima()}
                    required
                    disabled={!formData.salon_id || formData.salon_id === ''}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-colors ${
                      errorFecha ? 'border-red-400 bg-red-50' : (!formData.salon_id || formData.salon_id === '') ? 'border-gray-200 bg-gray-100' : 'border-gray-300 hover:border-gray-400'
                    }`}
                    placeholder="Selecciona una fecha"
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                </div>
                {!formData.salon_id || formData.salon_id === '' ? (
                  <p className="mt-1 text-xs text-gray-500">
                    ⚠️ Primero selecciona un lugar para el evento
                  </p>
                ) : errorFecha ? (
                  <p className="mt-2 text-sm text-red-600 flex items-start gap-2 bg-red-50 border border-red-200 rounded p-2">
                    <span className="text-red-500 font-bold text-base">⚠</span>
                    <span>{errorFecha}</span>
                  </p>
                ) : formData.fecha_evento && (
                  <p className="mt-1 text-xs text-green-600 flex items-center gap-1">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Fecha seleccionada correctamente
                  </p>
                )}
              </div>

              {/* Cantidad de Invitados */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cantidad de Invitados *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    name="cantidad_invitados"
                    value={formData.cantidad_invitados}
                    onChange={handleChange}
                    min="1"
                    step="1"
                    required
                    placeholder="Ej: 50"
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-colors ${
                      excedeCapacidad ? 'border-amber-400 bg-amber-50' : 'border-gray-300 hover:border-gray-400'
                    }`}
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                </div>
                {excedeCapacidad && salonSeleccionado ? (
                  <p className="mt-2 text-sm text-amber-600 flex items-start gap-2 bg-amber-50 border border-amber-200 rounded p-2">
                    <span className="text-amber-500 font-bold text-base">⚠</span>
                    <span>Excede la capacidad máxima del salón <strong>{salonSeleccionado.nombre}</strong> ({salonSeleccionado.capacidad_maxima} invitados). Puedes continuar, pero se te pedirá confirmación.</span>
                  </p>
                ) : formData.cantidad_invitados && parseInt(formData.cantidad_invitados) > 0 && (
                  <p className="mt-1 text-xs text-green-600 flex items-center gap-1">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    {parseInt(formData.cantidad_invitados).toLocaleString()} {parseInt(formData.cantidad_invitados) === 1 ? 'invitado' : 'invitados'}
                  </p>
                )}
              </div>

              {/* Hora Inicio - Selector mejorado */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hora Inicio *
                </label>
                <div className="flex gap-2">
                  <select
                    name="hora_inicio_h"
                    value={formData.hora_inicio ? formData.hora_inicio.split(':')[0] : ''}
                    onChange={(e) => {
                      const hora = e.target.value;
                      const minutos = formData.hora_inicio ? formData.hora_inicio.split(':')[1] : '00';
                      const nuevaHora = hora ? `${hora}:${minutos}` : '';
                      handleChange({ target: { name: 'hora_inicio', value: nuevaHora } });
                    }}
                    required
                    disabled={!formData.salon_id || formData.salon_id === '' || !formData.fecha_evento}
                    className={`flex-1 px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-colors ${
                      errorHorario ? 'border-red-400 bg-red-50' : (!formData.salon_id || formData.salon_id === '' || !formData.fecha_evento) ? 'border-gray-200 bg-gray-100' : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <option value="">Hora</option>
                    {Array.from({ length: 15 }, (_, i) => {
                      const hora = 10 + i; // Desde las 10:00 AM hasta las 12:00 AM (medianoche)
                      const horaOcupada = horasOcupadas.includes(hora);
                      return hora < 24 ? (
                        <option 
                          key={hora} 
                          value={hora.toString().padStart(2, '0')}
                          disabled={horaOcupada}
                        >
                          {hora === 0 ? '12:00 AM' : hora < 12 ? `${hora}:00 AM` : hora === 12 ? '12:00 PM' : `${hora - 12}:00 PM`}
                          {horaOcupada ? ' (Ocupada)' : ''}
                        </option>
                      ) : null;
                    })}
                  </select>
                  <select
                    name="hora_inicio_m"
                    value={formData.hora_inicio ? formData.hora_inicio.split(':')[1] : '00'}
                    onChange={(e) => {
                      const minutos = e.target.value;
                      const hora = formData.hora_inicio ? formData.hora_inicio.split(':')[0] : '';
                      const nuevaHora = hora ? `${hora}:${minutos}` : '';
                      handleChange({ target: { name: 'hora_inicio', value: nuevaHora } });
                    }}
                    className={`w-24 px-3 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-colors ${
                      errorHorario ? 'border-red-400 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <option value="00">:00</option>
                    <option value="15">:15</option>
                    <option value="30">:30</option>
                    <option value="45">:45</option>
                  </select>
                </div>
                {(!formData.salon_id || formData.salon_id === '' || !formData.fecha_evento) ? (
                  <p className="text-xs text-gray-500 mt-1">
                    ⚠️ Primero selecciona el lugar y la fecha del evento
                  </p>
                ) : cargandoHorasOcupadas ? (
                  <p className="text-xs text-blue-500 mt-1 flex items-center gap-1">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Verificando horarios ocupados...
                  </p>
                ) : horasOcupadas.length > 0 ? (
                  <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    ⚠️ Algunas horas están ocupadas y no están disponibles
                  </p>
                ) : (
                  <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Horario permitido: desde las 10:00 AM
                  </p>
                )}
              </div>

              {/* Hora Fin - Selector mejorado - TERCERO */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hora Fin *
                </label>
                <div className="flex gap-2">
                  <select
                    name="hora_fin_h"
                    value={formData.hora_fin ? formData.hora_fin.split(':')[0] : ''}
                    onChange={(e) => {
                      const hora = e.target.value;
                      const minutos = formData.hora_fin ? formData.hora_fin.split(':')[1] : '00';
                      const nuevaHora = hora ? `${hora}:${minutos}` : '';
                      handleChange({ target: { name: 'hora_fin', value: nuevaHora } });
                    }}
                    required
                    disabled={!formData.salon_id || formData.salon_id === '' || !formData.fecha_evento || !formData.hora_inicio}
                    className={`flex-1 px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-colors ${
                      errorHorario ? 'border-red-400 bg-red-50' : (!formData.salon_id || formData.salon_id === '' || !formData.fecha_evento || !formData.hora_inicio) ? 'border-gray-200 bg-gray-100' : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <option value="">Hora</option>
                    {Array.from({ length: 12 }, (_, i) => {
                      const hora = 12 + i; // Desde las 12:00 PM (12) hasta las 11:00 PM (23)
                      const horaOcupada = horasOcupadas.includes(hora);
                      return (
                        <option 
                          key={hora} 
                          value={hora.toString().padStart(2, '0')}
                          disabled={horaOcupada}
                        >
                          {hora === 12 ? '12:00 PM' : `${hora - 12}:00 PM`}
                          {horaOcupada ? ' (Ocupada)' : ''}
                        </option>
                      );
                    })}
                    {/* Horas después de medianoche permitidas */}
                    <option value="00" disabled={horasOcupadas.includes(0)}>
                      12:00 AM (día siguiente){horasOcupadas.includes(0) ? ' (Ocupada)' : ''}
                    </option>
                    <option value="01" disabled={horasOcupadas.includes(1)}>
                      1:00 AM (día siguiente){horasOcupadas.includes(1) ? ' (Ocupada)' : ''}
                    </option>
                    <option value="02" disabled={horasOcupadas.includes(2)}>
                      2:00 AM (día siguiente){horasOcupadas.includes(2) ? ' (Ocupada)' : ''}
                    </option>
                  </select>
                  <select
                    name="hora_fin_m"
                    value={formData.hora_fin ? formData.hora_fin.split(':')[1] : '00'}
                    onChange={(e) => {
                      const minutos = e.target.value;
                      const hora = formData.hora_fin ? formData.hora_fin.split(':')[0] : '';
                      const nuevaHora = hora ? `${hora}:${minutos}` : '';
                      handleChange({ target: { name: 'hora_fin', value: nuevaHora } });
                    }}
                    className={`w-24 px-3 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-colors ${
                      errorHorario ? 'border-red-400 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <option value="00">:00</option>
                    <option value="15">:15</option>
                    <option value="30">:30</option>
                    <option value="45">:45</option>
                  </select>
                </div>
                <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Máximo permitido: 2:00 AM (restricción legal)
                </p>
                {/* Mostrar duración del evento */}
                {formData.hora_inicio && formData.hora_fin && !errorHorario && (() => {
                  const duracion = calcularDuracion(formData.hora_inicio, formData.hora_fin);
                  if (duracion > 0) {
                    const horasEnteras = Math.floor(duracion);
                    const minutos = Math.round((duracion - horasEnteras) * 60);
                    let duracionTexto = '';
                    if (minutos > 0 && minutos < 60) {
                      duracionTexto = `${horasEnteras}h ${minutos}m`;
                    } else {
                      duracionTexto = `${horasEnteras} ${horasEnteras === 1 ? 'hora' : 'horas'}`;
                    }
                    return (
                      <p className="text-sm text-indigo-600 mt-2 font-medium flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Duración del evento: <span className="font-bold">{formatearHora(formData.hora_inicio)} / {formatearHora(formData.hora_fin)} = {duracionTexto}</span>
                      </p>
                    );
                  }
                  return null;
                })()}
              </div>

              {errorHorario && (
                <div className="md:col-span-2 bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm text-red-600 flex items-start gap-2">
                    <span className="text-red-500 font-bold text-lg">⚠</span>
                    <span>
                      <strong>Error de horario:</strong> {errorHorario}
                      <br />
                      <span className="text-xs mt-1 block">
                        💡 Horario de inicio: desde 10:00 AM | Horario de fin: hasta 2:00 AM (restricción legal)
                      </span>
                    </span>
                  </p>
                </div>
              )}

              {/* Mensaje de verificación de disponibilidad */}
              {formData.salon_id && formData.salon_id !== 'otro' && formData.fecha_evento && formData.hora_inicio && formData.hora_fin && !errorHorario && (
                <div className="md:col-span-2">
                  {verificandoDisponibilidad && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <p className="text-sm text-blue-600 flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Verificando disponibilidad del salón...</span>
                      </p>
                    </div>
                  )}
                  
                  {errorDisponibilidad && !verificandoDisponibilidad && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                      <p className="text-sm text-red-600 flex items-start gap-2">
                        <span className="text-red-500 font-bold text-lg">🚫</span>
                        <span className="flex-1">
                          <strong>Salón no disponible:</strong>
                          <pre className="mt-2 text-xs whitespace-pre-wrap font-mono bg-red-100 p-2 rounded border border-red-300">
                            {errorDisponibilidad}
                          </pre>
                          <span className="text-xs mt-2 block text-red-700">
                            ⚠️ No podrás continuar hasta que selecciones un horario disponible.
                          </span>
                        </span>
                      </p>
                    </div>
                  )}
                  
                  {!errorDisponibilidad && !verificandoDisponibilidad && formData.salon_id && formData.salon_id !== 'otro' && formData.fecha_evento && formData.hora_inicio && formData.hora_fin && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                      <p className="text-sm text-green-600 flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>✓ El salón está disponible en este horario</span>
                      </p>
                    </div>
                  )}
                </div>
              )}

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Lugar del Evento *
                </label>
                <select
                  name="salon_id"
                  value={formData.salon_id}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                >
                  <option value="">Seleccione un lugar</option>
                  {salones?.map((salon) => (
                    <option key={salon.id} value={salon.id}>
                      {salon.nombre} - Capacidad: {salon.capacidad_maxima} invitados
                    </option>
                  ))}
                  <option value="otro">Otro (Sede Externa - Sin cargo de salón)</option>
                </select>
                {salonSeleccionado && formData.salon_id !== 'otro' && (
                  <p className="text-xs text-gray-500 mt-1">
                    ℹ️ Capacidad máxima: {salonSeleccionado.capacidad_maxima} invitados
                  </p>
                )}
                {formData.salon_id === 'otro' && (
                  <div className="mt-3">
                    <input
                      type="text"
                      value={lugarPersonalizado}
                      onChange={(e) => setLugarPersonalizado(e.target.value)}
                      placeholder="Especifica el lugar (ej: Universidad de Miami, Auditorio XYZ)"
                      required
                      className="w-full px-4 py-2 border border-amber-300 bg-amber-50 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
                    />
                    <p className="text-xs text-amber-600 mt-1">
                      ⚠️ <strong>Importante:</strong> Al seleccionar una sede externa, no se cobrará el salón. Solo se cobrarán los servicios contratados.
                    </p>
                  </div>
                )}
              </div>

            </div>
          </div>
          )}

          {/* PASO 3: Paquete y Temporada */}
          {pasoActual === 3 && (
          <>
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Paquete y Temporada</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Paquete *
                </label>
                <select
                  name="paquete_id"
                  value={formData.paquete_id}
                  onChange={handleChange}
                  required
                  disabled={!formData.salon_id}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  <option value="">
                    {!formData.salon_id ? 'Primero seleccione un salón' : 'Seleccionar paquete...'}
                  </option>
                  {paquetes?.filter(p => {
                    // Si es sede externa (otro), solo mostrar paquete personalizado
                    if (formData.salon_id === 'otro') {
                      return p.nombre?.toLowerCase().includes('personalizado');
                    }
                    // Si es salón de la empresa, filtrar los disponibles
                    return p.disponible_salon !== false;
                  }).map((paquete) => (
                    <option key={paquete.id} value={paquete.id}>
                      {paquete.nombre} - ${paquete.precio_base_salon || paquete.precio_base} 
                      {paquete.invitados_minimo_salon && ` (Mín: ${paquete.invitados_minimo_salon} inv.)`}
                    </option>
                  ))}
                </select>
                {!formData.salon_id && (
                  <p className="text-xs text-amber-600 mt-1">
                    ⚠️ Debe seleccionar un salón primero para ver los paquetes disponibles
                  </p>
                )}
                {formData.salon_id === 'otro' && (
                  <p className="text-xs text-blue-600 mt-1">
                    ℹ️ Para sedes externas, solo está disponible el <strong>Paquete Personalizado</strong>
                  </p>
                )}
                {paqueteSeleccionado && (
                  <div className="mt-2 space-y-2">
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <p className="text-xs text-blue-700">
                            ⏱️ <strong>Duración:</strong> {paqueteSeleccionado.duracion_horas || 'N/A'} horas
                          </p>
                          {paqueteSeleccionado.invitados_minimo && (
                            <p className="text-xs text-blue-700 mt-1">
                              👥 <strong>Mínimo de invitados:</strong> {paqueteSeleccionado.invitados_minimo} personas
                            </p>
                          )}
                          <p className="text-xs text-blue-700 mt-1">
                            💰 <strong>Precio base:</strong> ${parseFloat(paqueteSeleccionado.precio_base || 0).toLocaleString()}
                          </p>
                          {paqueteSeleccionado.descripcion && (
                            <p className="text-xs text-blue-600 mt-1">
                              📝 {paqueteSeleccionado.descripcion}
                            </p>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => setMostrarAjustePrecioBase(!mostrarAjustePrecioBase)}
                          className="text-xs text-gray-500 hover:text-gray-700 underline whitespace-nowrap"
                        >
                          {mostrarAjustePrecioBase ? 'Ocultar' : 'Ajustar precio'}
                        </button>
                      </div>
                    </div>
                    
                    {/* Campo discreto para ajustar precio base */}
                    {mostrarAjustePrecioBase && (
                      <div className="px-4 py-2 bg-amber-50 border border-amber-200 rounded-lg">
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Precio Base Personalizado
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          placeholder={`Original: $${parseFloat(paqueteSeleccionado.precio_base || 0).toLocaleString()}`}
                          value={precioBaseAjustado}
                          onChange={(e) => setPrecioBaseAjustado(e.target.value)}
                          className="w-full px-2 py-1 text-sm border border-amber-300 rounded focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
                        />
                        <p className="text-xs text-amber-600 mt-1">
                          Opcional: Para negociación o ajustes especiales
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Temporada
                </label>
                {formData.temporada_id && temporadas ? (
                  <div className="space-y-2">
                    <div className="px-4 py-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center gap-2">
                        <span className="text-green-600 font-medium">✓</span>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">
                            Temporada {temporadas.find(t => t.id === parseInt(formData.temporada_id))?.nombre || 'N/A'}
                          </p>
                          <p className="text-xs text-gray-600">
                            Ajuste: +${temporadas.find(t => t.id === parseInt(formData.temporada_id))?.ajuste_precio || 0}
                          </p>
                          <p className="text-xs text-green-600 mt-1">
                            💡 Auto-detectada según la fecha del evento
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setMostrarAjusteTemporada(!mostrarAjusteTemporada)}
                          className="text-xs text-gray-500 hover:text-gray-700 underline"
                        >
                          {mostrarAjusteTemporada ? 'Ocultar' : 'Ajustar'}
                        </button>
                      </div>
                    </div>
                    
                    {/* Campo discreto para ajustar temporada */}
                    {mostrarAjusteTemporada && (
                      <div className="px-4 py-2 bg-amber-50 border border-amber-200 rounded-lg">
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Ajuste de Temporada Personalizado
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          placeholder={`Original: $${temporadas.find(t => t.id === parseInt(formData.temporada_id))?.ajuste_precio || 0}`}
                          value={ajusteTemporadaCustom}
                          onChange={(e) => setAjusteTemporadaCustom(e.target.value)}
                          className="w-full px-2 py-1 text-sm border border-amber-300 rounded focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
                        />
                        <p className="text-xs text-amber-600 mt-1">
                          Opcional: Ajustar el incremento por temporada
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg">
                    <p className="text-sm text-gray-500">
                      {formData.fecha_evento ? 'Sin temporada especial' : 'Selecciona una fecha para detectar la temporada'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Servicios Incluidos en el Paquete */}
          {paqueteSeleccionado && paqueteSeleccionado.paquetes_servicios?.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Servicios Incluidos en {paqueteSeleccionado.nombre}
              </h2>
              <div className="space-y-2">
                {(() => {
                  // Agrupar servicios excluyentes
                  const serviciosProcesados = new Set();
                  const gruposExcluyentes = [];
                  const serviciosNormales = [];
                  
                  // Primero, verificar si el paquete tiene Sidra o Champaña para procesarlas ANTES
                  const tieneSidra = paqueteSeleccionado.paquetes_servicios.some(ps => ps.servicios?.nombre === 'Sidra');
                  const tieneChampana = paqueteSeleccionado.paquetes_servicios.some(ps => ps.servicios?.nombre === 'Champaña');
                  
                  paqueteSeleccionado.paquetes_servicios.forEach((ps) => {
                    if (serviciosProcesados.has(ps.servicio_id)) return;
                    
                    const nombreServicio = ps.servicios?.nombre;
                    
                    // Filtrar Máquina de Chispas si el salón es Kendall
                    if (salonSeleccionado?.nombre === 'Kendall' && nombreServicio?.toLowerCase().includes('chispas')) {
                      return;
                    }
                    
                    // Saltar Sidra y Champaña aquí, las procesaremos después
                    if (nombreServicio === 'Sidra' || nombreServicio === 'Champaña') {
                      return;
                    }
                    
                    const excluyentes = serviciosExcluyentes[nombreServicio];
                    
                    if (excluyentes && excluyentes.length > 0) {
                      // Buscar servicios excluyentes en el mismo paquete
                      const grupoExcluyente = paqueteSeleccionado.paquetes_servicios.filter(
                        (otroPs) => {
                          const otroNombre = otroPs.servicios?.nombre;
                          return otroNombre === nombreServicio || excluyentes.includes(otroNombre);
                        }
                      );
                      
                      if (grupoExcluyente.length > 1) {
                        gruposExcluyentes.push(grupoExcluyente);
                        grupoExcluyente.forEach(gps => serviciosProcesados.add(gps.servicio_id));
                        return;
                      }
                    }
                    
                    // Servicio normal (no tiene excluyentes o no hay grupo)
                    serviciosNormales.push(ps);
                    serviciosProcesados.add(ps.servicio_id);
                  });
                  
                  // CASO ESPECIAL: Si el paquete tiene Sidra o Champaña, crear grupo excluyente con ambas opciones
                  if (tieneSidra || tieneChampana) {
                    const sidraPaquete = paqueteSeleccionado.paquetes_servicios.find(
                      ps => ps.servicios?.nombre === 'Sidra'
                    );
                    const champanaPaquete = paqueteSeleccionado.paquetes_servicios.find(
                      ps => ps.servicios?.nombre === 'Champaña'
                    );
                    
                    // Buscar servicios en la lista de servicios disponibles
                    const sidraServicio = servicios?.find(s => s.nombre === 'Sidra');
                    const champanaServicio = servicios?.find(s => s.nombre === 'Champaña');
                    
                    const grupoSidraChampana = [];
                    
                    // Agregar Sidra al grupo (del paquete o crear uno temporal)
                    if (sidraPaquete) {
                      grupoSidraChampana.push(sidraPaquete);
                      serviciosProcesados.add(sidraPaquete.servicio_id);
                    } else if (sidraServicio && tieneChampana) {
                      // Si el paquete tiene Champaña pero no Sidra, crear un objeto temporal para Sidra
                      const sidraTemporal = {
                        id: `sidra_${sidraServicio.id}`,
                        paquete_id: champanaPaquete?.paquete_id,
                        servicio_id: sidraServicio.id,
                        cantidad: champanaPaquete?.cantidad || 10,
                        incluido_gratis: true,
                        notas: 'Opción alternativa a Champaña',
                        servicios: sidraServicio
                      };
                      grupoSidraChampana.push(sidraTemporal);
                      serviciosProcesados.add(sidraServicio.id);
                    }
                    
                    // Agregar Champaña al grupo (del paquete o crear uno temporal)
                    if (champanaPaquete) {
                      grupoSidraChampana.push(champanaPaquete);
                      serviciosProcesados.add(champanaPaquete.servicio_id);
                    } else if (champanaServicio && tieneSidra) {
                      // Si el paquete tiene Sidra pero no Champaña, crear un objeto temporal para Champaña
                      const champanaTemporal = {
                        id: `champana_${champanaServicio.id}`,
                        paquete_id: sidraPaquete?.paquete_id,
                        servicio_id: champanaServicio.id,
                        cantidad: sidraPaquete?.cantidad || 10,
                        incluido_gratis: true,
                        notas: 'Opción alternativa a Sidra',
                        servicios: champanaServicio
                      };
                      grupoSidraChampana.push(champanaTemporal);
                      serviciosProcesados.add(champanaServicio.id);
                    }
                    
                    // Si tenemos ambas opciones, crear el grupo excluyente
                    if (grupoSidraChampana.length === 2) {
                      gruposExcluyentes.push(grupoSidraChampana);
                    }
                  }
                  
                  return (
                    <>
                      {/* Servicios normales (no excluyentes) */}
                      {serviciosNormales.map((ps) => (
                        <div key={ps.id} className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span className="font-medium text-gray-900">{obtenerNombreServicio(ps.servicios?.nombre)}</span>
                          </div>
                          <span className="text-sm text-green-700 font-medium">
                            ✓ Incluido
                          </span>
                        </div>
                      ))}
                      
                      {/* Grupos de servicios excluyentes (con selector) */}
                      {gruposExcluyentes.map((grupo, idx) => {
                        const grupoKey = `grupo_${idx}`;
                        const seleccionado = serviciosExcluyentesSeleccionados[grupoKey] || grupo[0].servicio_id;
                        
                        return (
                          <div key={grupoKey} className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                            <p className="text-sm font-medium text-gray-900 mb-3">
                              🎯 Selecciona una opción:
                            </p>
                            <div className="space-y-2">
                              {grupo.map((ps) => (
                                <label 
                                  key={ps.servicio_id}
                                  className={`
                                    flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all
                                    ${seleccionado === ps.servicio_id 
                                      ? 'bg-indigo-100 border-2 border-indigo-500' 
                                      : 'bg-white border-2 border-gray-200 hover:border-indigo-300'
                                    }
                                  `}
                                >
                                  <input
                                    type="radio"
                                    name={grupoKey}
                                    value={ps.servicio_id}
                                    checked={seleccionado === ps.servicio_id}
                                    onChange={(e) => {
                                      setServiciosExcluyentesSeleccionados({
                                        ...serviciosExcluyentesSeleccionados,
                                        [grupoKey]: parseInt(e.target.value)
                                      });
                                    }}
                                    className="w-4 h-4 text-indigo-600"
                                  />
                                  <span className="font-medium text-gray-900">
                                    {obtenerNombreServicio(ps.servicios?.nombre)}
                                  </span>
                                  {ps.servicios?.descripcion && (
                                    <span className="text-xs text-gray-500 ml-auto">
                                      {ps.servicios.descripcion}
                                    </span>
                                  )}
                                </label>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </>
                  );
                })()}
              </div>
            </div>
          )}
          </>
          )}

          {/* PASO 4: Servicios Adicionales */}
          {pasoActual === 4 && (
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Servicios Adicionales</h2>
            
            {(() => {
              // Filtrar servicios disponibles (no incluidos en el paquete)
              const reglasPaquete = obtenerReglasExclusionPorPaquete(paqueteSeleccionado?.nombre);
              
              // Detectar qué servicio está seleccionado en el grupo excluyente de Photobooth
              const tienePhotobooth360EnPaquete = paqueteSeleccionado?.paquetes_servicios?.some(ps => ps.servicios?.nombre === 'Photobooth 360');
              const tienePhotoboothPrintEnPaquete = paqueteSeleccionado?.paquetes_servicios?.some(ps => ps.servicios?.nombre === 'Photobooth Print');
              
              let servicioPhotoboothSeleccionado = null;
              if (tienePhotobooth360EnPaquete || tienePhotoboothPrintEnPaquete) {
                // El grupo Photobooth es el primero (grupo_0)
                const grupoKey = 'grupo_0';
                const seleccionadoId = serviciosExcluyentesSeleccionados[grupoKey];
                
                if (seleccionadoId) {
                  const photobooth360Servicio = servicios?.find(s => s.nombre === 'Photobooth 360');
                  const photoboothPrintServicio = servicios?.find(s => s.nombre === 'Photobooth Print');
                  
                  if (seleccionadoId === photobooth360Servicio?.id) {
                    servicioPhotoboothSeleccionado = 'Photobooth 360';
                  } else if (seleccionadoId === photoboothPrintServicio?.id) {
                    servicioPhotoboothSeleccionado = 'Photobooth Print';
                  }
                } else {
                  // Si no hay selección explícita, usar el que viene en el paquete por defecto
                  if (tienePhotobooth360EnPaquete) {
                    servicioPhotoboothSeleccionado = 'Photobooth 360';
                  } else if (tienePhotoboothPrintEnPaquete) {
                    servicioPhotoboothSeleccionado = 'Photobooth Print';
                  }
                }
              }
              
              // Detectar qué servicio está seleccionado en el grupo excluyente de Sidra/Champaña
              const tieneSidraEnPaquete = paqueteSeleccionado?.paquetes_servicios?.some(ps => ps.servicios?.nombre === 'Sidra');
              const tieneChampanaEnPaquete = paqueteSeleccionado?.paquetes_servicios?.some(ps => ps.servicios?.nombre === 'Champaña');
              
              let servicioSidraChampanaSeleccionado = null;
              if (tieneSidraEnPaquete || tieneChampanaEnPaquete) {
                // Contar grupos excluyentes existentes (Photobooth, etc.) para encontrar el índice del grupo Sidra/Champaña
                let gruposExistentes = 0;
                const serviciosProcesadosGrupo = new Set();
                
                paqueteSeleccionado?.paquetes_servicios?.forEach((ps) => {
                  if (serviciosProcesadosGrupo.has(ps.servicio_id)) return;
                  
                  const nombreServicio = ps.servicios?.nombre;
                  const excluyentes = serviciosExcluyentes[nombreServicio];
                  
                  if (excluyentes && (nombreServicio === 'Photobooth 360' || nombreServicio === 'Photobooth Print')) {
                    const grupoExcluyente = paqueteSeleccionado.paquetes_servicios.filter(
                      (otroPs) => {
                        const otroNombre = otroPs.servicios?.nombre;
                        return otroNombre === nombreServicio || excluyentes.includes(otroNombre);
                      }
                    );
                    
                    if (grupoExcluyente.length > 1) {
                      gruposExistentes++;
                      grupoExcluyente.forEach(gps => serviciosProcesadosGrupo.add(gps.servicio_id));
                    }
                  }
                });
                
                // El grupo Sidra/Champaña será el siguiente después de Photobooth
                const grupoKey = `grupo_${gruposExistentes}`;
                const seleccionadoId = serviciosExcluyentesSeleccionados[grupoKey];
                
                if (seleccionadoId) {
                  const sidraServicio = servicios?.find(s => s.nombre === 'Sidra');
                  const champanaServicio = servicios?.find(s => s.nombre === 'Champaña');
                  
                  if (seleccionadoId === sidraServicio?.id) {
                    servicioSidraChampanaSeleccionado = 'Sidra';
                  } else if (seleccionadoId === champanaServicio?.id) {
                    servicioSidraChampanaSeleccionado = 'Champaña';
                  }
                } else {
                  // Si no hay selección explícita, usar el que viene en el paquete por defecto
                  if (tieneSidraEnPaquete) {
                    servicioSidraChampanaSeleccionado = 'Sidra';
                  } else if (tieneChampanaEnPaquete) {
                    servicioSidraChampanaSeleccionado = 'Champaña';
                  }
                }
              }
              
              const serviciosDisponibles = servicios?.filter(s => {
                // Filtrar Máquina de Chispas si el salón es Kendall
                if (salonSeleccionado?.nombre === 'Kendall' && s.nombre?.toLowerCase().includes('chispas')) {
                  return false;
                }
                
                // EXCEPCIÓN: "Hora Extra" siempre debe estar disponible (se puede contratar múltiples veces)
                if (s.nombre === 'Hora Extra') return true;
                
                // REGLA ESPECIAL: Si el paquete tiene Photobooth 360 o Print seleccionado, NO mostrar el seleccionado en servicios adicionales
                // Solo mostrar la alternativa (la que NO está seleccionada)
                if (s.nombre === 'Photobooth 360' || s.nombre === 'Photobooth Print') {
                  if (servicioPhotoboothSeleccionado === 'Photobooth 360' && s.nombre === 'Photobooth 360') {
                    return false; // NO mostrar Photobooth 360 si ya está seleccionado en el paquete
                  }
                  if (servicioPhotoboothSeleccionado === 'Photobooth Print' && s.nombre === 'Photobooth Print') {
                    return false; // NO mostrar Photobooth Print si ya está seleccionado en el paquete
                  }
                  // Si no está seleccionado, sí mostrarlo (es la alternativa)
                  return true;
                }
                
                // REGLA ESPECIAL: Si el paquete tiene Sidra o Champaña seleccionada, NO mostrar la seleccionada en servicios adicionales
                // Solo mostrar la alternativa (la que NO está seleccionada)
                if (s.nombre === 'Sidra' || s.nombre === 'Champaña') {
                  if (servicioSidraChampanaSeleccionado === 'Sidra' && s.nombre === 'Sidra') {
                    return false; // NO mostrar Sidra si ya está seleccionada en el paquete
                  }
                  if (servicioSidraChampanaSeleccionado === 'Champaña' && s.nombre === 'Champaña') {
                    return false; // NO mostrar Champaña si ya está seleccionada en el paquete
                  }
                  // Si no está seleccionada, sí mostrarla (es la alternativa)
                  return true;
                }
                
                // REGLA ESPECÍFICA: Deluxe - NO mostrar Foto y Video 3h si el paquete tiene Foto y Video 5h (5h es mejor)
                if (paqueteSeleccionado?.nombre?.toLowerCase().includes('deluxe') &&
                    s.nombre === 'Foto y Video 3 Horas') {
                  const tieneFoto5h = paqueteSeleccionado?.paquetes_servicios?.some(ps => ps.servicios?.nombre === 'Foto y Video 5 Horas');
                  if (tieneFoto5h) {
                    return false; // NO mostrar Foto 3h si el paquete tiene 5h (5h es mejor)
                  }
                }
                
                // REGLA ESPECÍFICA: Diamond - NO mostrar Foto y Video 3h si ya está incluida
                if (paqueteSeleccionado?.nombre?.toLowerCase().includes('diamond') &&
                    !paqueteSeleccionado?.nombre?.toLowerCase().includes('deluxe') &&
                    s.nombre === 'Foto y Video 3 Horas') {
                  const tieneFoto3h = paqueteSeleccionado?.paquetes_servicios?.some(ps => ps.servicios?.nombre === 'Foto y Video 3 Horas');
                  if (tieneFoto3h) {
                    return false; // NO mostrar Foto 3h si ya está en el paquete
                  }
                }
                
                // REGLA: Si el paquete tiene Premium/Plus, NO mostrar Básico
                const tienePremiumEnPaquete = paqueteSeleccionado?.paquetes_servicios?.some(ps => {
                  const nombreServicio = ps.servicios?.nombre;
                  return nombreServicio === 'Licor Premium' || nombreServicio === 'Decoración Plus';
                });
                
                if (tienePremiumEnPaquete) {
                  if (s.nombre === 'Licor Básico' || s.nombre === 'Decoración Básica') {
                    return false;
                  }
                }
                
                // REGLA: Personalizado - Licor y Decoración son excluyentes (no upgrades)
                if (paqueteSeleccionado?.nombre?.toLowerCase().includes('personalizado')) {
                  // Verificar si ya está seleccionado en servicios adicionales
                  const tieneLicorPremiumEnAdicionales = serviciosSeleccionados.some(sel => {
                    const sData = servicios?.find(srv => srv.id === parseInt(sel.servicio_id));
                    return sData?.nombre === 'Licor Premium';
                  });
                  const tieneLicorBasicoEnAdicionales = serviciosSeleccionados.some(sel => {
                    const sData = servicios?.find(srv => srv.id === parseInt(sel.servicio_id));
                    return sData?.nombre === 'Licor Básico';
                  });
                  const tieneDecoracionPlusEnAdicionales = serviciosSeleccionados.some(sel => {
                    const sData = servicios?.find(srv => srv.id === parseInt(sel.servicio_id));
                    return sData?.nombre === 'Decoración Plus';
                  });
                  const tieneDecoracionBasicaEnAdicionales = serviciosSeleccionados.some(sel => {
                    const sData = servicios?.find(srv => srv.id === parseInt(sel.servicio_id));
                    return sData?.nombre === 'Decoración Básica';
                  });
                  
                  // Verificar en el paquete
                  const tieneLicorPremiumEnPaquete = paqueteSeleccionado?.paquetes_servicios?.some(ps => ps.servicios?.nombre === 'Licor Premium');
                  const tieneLicorBasicoEnPaquete = paqueteSeleccionado?.paquetes_servicios?.some(ps => ps.servicios?.nombre === 'Licor Básico');
                  const tieneDecoracionPlusEnPaquete = paqueteSeleccionado?.paquetes_servicios?.some(ps => ps.servicios?.nombre === 'Decoración Plus');
                  const tieneDecoracionBasicaEnPaquete = paqueteSeleccionado?.paquetes_servicios?.some(ps => ps.servicios?.nombre === 'Decoración Básica');
                  
                  // Combinar verificaciones (paquete O adicionales)
                  const tieneLicorPremium = tieneLicorPremiumEnPaquete || tieneLicorPremiumEnAdicionales;
                  const tieneLicorBasico = tieneLicorBasicoEnPaquete || tieneLicorBasicoEnAdicionales;
                  const tieneDecoracionPlus = tieneDecoracionPlusEnPaquete || tieneDecoracionPlusEnAdicionales;
                  const tieneDecoracionBasica = tieneDecoracionBasicaEnPaquete || tieneDecoracionBasicaEnAdicionales;
                  
                  if (s.nombre === 'Licor Premium' && tieneLicorBasico) {
                    return false; // NO mostrar Premium si tiene Básico (excluyentes)
                  }
                  if (s.nombre === 'Licor Básico' && tieneLicorPremium) {
                    return false; // NO mostrar Básico si tiene Premium (excluyentes)
                  }
                  if (s.nombre === 'Decoración Plus' && tieneDecoracionBasica) {
                    return false; // NO mostrar Plus si tiene Básica (excluyentes)
                  }
                  if (s.nombre === 'Decoración Básica' && tieneDecoracionPlus) {
                    return false; // NO mostrar Básica si tiene Plus (excluyentes)
                  }
                }
                
                const estaEnPaquete = paqueteSeleccionado?.paquetes_servicios?.some(
                  ps => ps.servicio_id === s.id
                );
                
                // REGLA: Permitir mostrar upgrades según reglas del paquete
                const esUpgradeDisponible = 
                  (s.nombre === 'Licor Premium' && reglasPaquete.permiteUpgradeLicor && paqueteSeleccionado?.paquetes_servicios?.some(ps => ps.servicios?.nombre === 'Licor Básico')) ||
                  (s.nombre === 'Decoración Plus' && reglasPaquete.permiteUpgradeDecoracion && paqueteSeleccionado?.paquetes_servicios?.some(ps => ps.servicios?.nombre === 'Decoración Básica')) ||
                  (s.nombre === 'Foto y Video 5 Horas' && reglasPaquete.permiteFotoVideo && !reglasPaquete.excluyeFoto5hSiTiene3h && paqueteSeleccionado?.paquetes_servicios?.some(ps => ps.servicios?.nombre === 'Foto y Video 3 Horas'));
                
                // Si es un upgrade disponible, mostrarlo aunque esté en el paquete
                if (esUpgradeDisponible) return true;
                
                return !estaEnPaquete;
              }) || [];

              // Agrupar por categoría
              const serviciosPorCategoria = serviciosDisponibles.reduce((acc, servicio) => {
                const categoria = servicio.categoria || 'Otros';
                if (!acc[categoria]) {
                  acc[categoria] = [];
                }
                acc[categoria].push(servicio);
                return acc;
              }, {});

              return (
                <div className="space-y-6">
                  {Object.keys(serviciosPorCategoria).length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-8">
                      {paqueteSeleccionado 
                        ? 'Todos los servicios están incluidos en el paquete seleccionado' 
                        : 'Selecciona un paquete para ver servicios disponibles'}
                    </p>
                  ) : (
                    Object.entries(serviciosPorCategoria).map(([categoria, serviciosCategoria]) => (
                      <div key={categoria}>
                        <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                          <div className="w-1 h-4 bg-indigo-500 rounded"></div>
                          {categoria}
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                          {serviciosCategoria.map((servicio) => {
                            const cantidad = getCantidadServicio(servicio.id);
                            const isSelected = cantidad > 0;
                            
                            // Verificar si hay un servicio excluyente en servicios adicionales
                            // EXCEPCIÓN: En paquetes Especial y Personalizado, Sidra y Champaña NO son excluyentes
                            const esPaqueteEspecialOPersonalizado = paqueteSeleccionado?.nombre?.toLowerCase().includes('especial') || 
                                                                      paqueteSeleccionado?.nombre?.toLowerCase().includes('personalizado');
                            const esSidraOChampana = servicio.nombre === 'Sidra' || servicio.nombre === 'Champaña';
                            const esPhotobooth = servicio.nombre === 'Photobooth 360' || servicio.nombre === 'Photobooth Print';
                            
                            const tieneExcluyenteEnAdicionales = !(esPaqueteEspecialOPersonalizado && esSidraOChampana) && 
                              serviciosExcluyentes[servicio.nombre] && 
                              serviciosSeleccionados.some(s => {
                                const sData = servicios?.find(srv => srv.id === parseInt(s.servicio_id));
                                return sData && serviciosExcluyentes[servicio.nombre].includes(sData.nombre);
                              });
                            
                            // Verificar si hay un servicio excluyente incluido en el paquete
                            const reglasPaquete = obtenerReglasExclusionPorPaquete(paqueteSeleccionado?.nombre);
                            
                            // REGLA ESPECIAL: Para Photobooth, si uno está en el paquete, el otro DEBE estar disponible como adicional
                            let tieneExcluyenteEnPaquete = false;
                            if (esPhotobooth && servicioPhotoboothSeleccionado) {
                              // Si el servicio actual es la alternativa (la que NO está seleccionada en el paquete), NO es excluyente
                              const esLaAlternativa = (servicioPhotoboothSeleccionado === 'Photobooth 360' && servicio.nombre === 'Photobooth Print') ||
                                                      (servicioPhotoboothSeleccionado === 'Photobooth Print' && servicio.nombre === 'Photobooth 360');
                              if (esLaAlternativa) {
                                tieneExcluyenteEnPaquete = false; // Permitir la alternativa
                              } else {
                                // Si es el mismo servicio que está en el paquete, sí es excluyente
                                tieneExcluyenteEnPaquete = true;
                              }
                            } else if (esSidraOChampana && servicioSidraChampanaSeleccionado) {
                              // REGLA ESPECIAL: Para Sidra/Champaña, si una está en el paquete, la otra DEBE estar disponible como adicional
                              // Si el servicio actual es la alternativa (la que NO está seleccionada en el paquete), NO es excluyente
                              const esLaAlternativa = (servicioSidraChampanaSeleccionado === 'Sidra' && servicio.nombre === 'Champaña') ||
                                                      (servicioSidraChampanaSeleccionado === 'Champaña' && servicio.nombre === 'Sidra');
                              if (esLaAlternativa) {
                                tieneExcluyenteEnPaquete = false; // Permitir la alternativa
                              } else {
                                // Si es el mismo servicio que está en el paquete, sí es excluyente
                                tieneExcluyenteEnPaquete = true;
                              }
                            } else {
                              // Para otros servicios, aplicar la lógica normal
                              tieneExcluyenteEnPaquete = !(esPaqueteEspecialOPersonalizado && esSidraOChampana) &&
                                serviciosExcluyentes[servicio.nombre] &&
                                paqueteSeleccionado?.paquetes_servicios?.some(ps => {
                                  return ps.servicios && serviciosExcluyentes[servicio.nombre].includes(ps.servicios.nombre);
                                });
                            }
                            
                            // NUEVA LÓGICA: Permitir upgrade según reglas del paquete
                            const esUpgradePermitido = 
                              (servicio.nombre === 'Licor Premium' && reglasPaquete.permiteUpgradeLicor && paqueteSeleccionado?.paquetes_servicios?.some(ps => ps.servicios?.nombre === 'Licor Básico')) ||
                              (servicio.nombre === 'Decoración Plus' && reglasPaquete.permiteUpgradeDecoracion && paqueteSeleccionado?.paquetes_servicios?.some(ps => ps.servicios?.nombre === 'Decoración Básica')) ||
                              (servicio.nombre === 'Foto y Video 5 Horas' && reglasPaquete.permiteFotoVideo && !reglasPaquete.excluyeFoto5hSiTiene3h && paqueteSeleccionado?.paquetes_servicios?.some(ps => ps.servicios?.nombre === 'Foto y Video 3 Horas'));
                            
                            // Verificar exclusiones específicas del paquete Personalizado
                            let esExcluyenteSegunPaquete = false;
                            if (paqueteSeleccionado?.nombre?.toLowerCase().includes('personalizado')) {
                              // Verificar en servicios adicionales ya seleccionados
                              const tieneLicorPremiumEnAdicionales = serviciosSeleccionados.some(sel => {
                                const sData = servicios?.find(srv => srv.id === parseInt(sel.servicio_id));
                                return sData?.nombre === 'Licor Premium';
                              });
                              const tieneLicorBasicoEnAdicionales = serviciosSeleccionados.some(sel => {
                                const sData = servicios?.find(srv => srv.id === parseInt(sel.servicio_id));
                                return sData?.nombre === 'Licor Básico';
                              });
                              const tieneDecoracionPlusEnAdicionales = serviciosSeleccionados.some(sel => {
                                const sData = servicios?.find(srv => srv.id === parseInt(sel.servicio_id));
                                return sData?.nombre === 'Decoración Plus';
                              });
                              const tieneDecoracionBasicaEnAdicionales = serviciosSeleccionados.some(sel => {
                                const sData = servicios?.find(srv => srv.id === parseInt(sel.servicio_id));
                                return sData?.nombre === 'Decoración Básica';
                              });
                              
                              // Verificar en el paquete
                              const tieneLicorPremiumEnPaquete = paqueteSeleccionado?.paquetes_servicios?.some(ps => ps.servicios?.nombre === 'Licor Premium');
                              const tieneLicorBasicoEnPaquete = paqueteSeleccionado?.paquetes_servicios?.some(ps => ps.servicios?.nombre === 'Licor Básico');
                              const tieneDecoracionPlusEnPaquete = paqueteSeleccionado?.paquetes_servicios?.some(ps => ps.servicios?.nombre === 'Decoración Plus');
                              const tieneDecoracionBasicaEnPaquete = paqueteSeleccionado?.paquetes_servicios?.some(ps => ps.servicios?.nombre === 'Decoración Básica');
                              
                              // Combinar verificaciones (paquete O adicionales)
                              const tieneLicorPremium = tieneLicorPremiumEnPaquete || tieneLicorPremiumEnAdicionales;
                              const tieneLicorBasico = tieneLicorBasicoEnPaquete || tieneLicorBasicoEnAdicionales;
                              const tieneDecoracionPlus = tieneDecoracionPlusEnPaquete || tieneDecoracionPlusEnAdicionales;
                              const tieneDecoracionBasica = tieneDecoracionBasicaEnPaquete || tieneDecoracionBasicaEnAdicionales;
                              
                              if (servicio.nombre === 'Licor Premium' && tieneLicorBasico) {
                                esExcluyenteSegunPaquete = true;
                              }
                              if (servicio.nombre === 'Licor Básico' && tieneLicorPremium) {
                                esExcluyenteSegunPaquete = true;
                              }
                              if (servicio.nombre === 'Decoración Plus' && tieneDecoracionBasica) {
                                esExcluyenteSegunPaquete = true;
                              }
                              if (servicio.nombre === 'Decoración Básica' && tieneDecoracionPlus) {
                                esExcluyenteSegunPaquete = true;
                              }
                            }
                            
                            // Solo considerar excluyente si NO es un upgrade permitido Y no está excluido por reglas del paquete
                            const tieneExcluyenteSeleccionado = !esUpgradePermitido && !esExcluyenteSegunPaquete && (tieneExcluyenteEnAdicionales || tieneExcluyenteEnPaquete);
                            
                            // Verificar si realmente está incluido en el paquete (para mostrar "Ya incluido")
                            const estaRealmenteIncluido = paqueteSeleccionado?.paquetes_servicios?.some(ps => ps.servicio_id === servicio.id);
                            const mostrarYaIncluido = estaRealmenteIncluido && !esUpgradePermitido;

                            return (
                              <div
                                key={servicio.id}
                                className={`
                                  relative p-4 rounded-lg border-2 transition-all
                                  ${isSelected 
                                    ? 'border-indigo-500 bg-indigo-50' 
                                    : tieneExcluyenteSeleccionado
                                    ? 'border-gray-200 bg-gray-100 opacity-50 cursor-not-allowed'
                                    : 'border-gray-200 bg-white hover:border-indigo-300'
                                  }
                                `}
                              >
                                <div className="flex flex-col h-full">
                                  <div className="flex-1 mb-3">
                                    <h4 className="font-medium text-gray-900 text-sm mb-1">
                                      {obtenerNombreServicio(servicio.nombre)}
                                    </h4>
                                    {servicio.descripcion && (
                                      <p className="text-xs text-gray-500 line-clamp-2">
                                        {servicio.descripcion}
                                      </p>
                                    )}
                                    <p className="text-sm font-semibold text-indigo-600 mt-2">
                                      ${parseFloat(servicio.precio_base).toLocaleString()}
                                    </p>
                                    {mostrarYaIncluido && (
                                      <p className="text-xs text-red-600 mt-1 font-medium">
                                        ⚠️ Ya incluido en paquete
                                      </p>
                                    )}
                                    {esUpgradePermitido && (
                                      <p className="text-xs text-green-600 mt-1 font-medium">
                                        ⬆️ Upgrade disponible desde el paquete
                                      </p>
                                    )}
                                  </div>

                                  <div className="flex items-center justify-between">
                                    {isSelected ? (
                                      <div className="flex items-center gap-2 w-full">
                                        <button
                                          type="button"
                                          onClick={() => disminuirServicio(servicio.id)}
                                          className="flex items-center justify-center w-8 h-8 rounded-lg bg-white border border-indigo-300 text-indigo-600 hover:bg-indigo-100 transition"
                                        >
                                          <Minus className="w-4 h-4" />
                                        </button>
                                        <div className="flex-1 text-center">
                                          <span className="text-lg font-semibold text-indigo-600">
                                            {cantidad}
                                          </span>
                                        </div>
                                        <button
                                          type="button"
                                          onClick={() => agregarServicio(servicio.id)}
                                          className="flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition"
                                        >
                                          <Plus className="w-4 h-4" />
                                        </button>
                                      </div>
                                    ) : (
                                      <button
                                        type="button"
                                        onClick={() => agregarServicio(servicio.id)}
                                        disabled={tieneExcluyenteSeleccionado}
                                        className={`w-full flex items-center justify-center gap-2 px-3 py-2 text-sm rounded-lg transition ${
                                          tieneExcluyenteSeleccionado
                                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                            : esUpgradePermitido
                                            ? 'bg-green-600 text-white hover:bg-green-700'
                                            : 'bg-indigo-600 text-white hover:bg-indigo-700'
                                        }`}
                                      >
                                        <Plus className="w-4 h-4" />
                                        {esUpgradePermitido ? 'Agregar Upgrade' : mostrarYaIncluido ? 'En paquete' : tieneExcluyenteSeleccionado ? 'No disponible' : 'Agregar'}
                                      </button>
                                    )}
                                  </div>
                                </div>

                                {isSelected && (
                                  <div className="absolute -top-2 -right-2 bg-indigo-600 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                                    {cantidad}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              );
            })()}

            {/* Resumen de servicios seleccionados */}
            {serviciosSeleccionados.length > 0 && (
              <div className="mt-6 p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-900">
                    Servicios Seleccionados ({serviciosSeleccionados.length})
                  </h3>
                  <button
                    type="button"
                    onClick={() => setMostrarAjusteServicios(!mostrarAjusteServicios)}
                    className="text-xs text-gray-500 hover:text-gray-700 underline"
                  >
                    {mostrarAjusteServicios ? 'Ocultar ajustes' : 'Ajustar precios'}
                  </button>
                </div>
                <div className="space-y-2">
                  {serviciosSeleccionados.map((servicio) => {
                    const servicioData = servicios?.find(s => s.id === parseInt(servicio.servicio_id));
                    const precioActual = servicio.precio_ajustado || servicioData?.precio_base || 0;
                    const subtotal = parseFloat(precioActual) * servicio.cantidad;
                    
                    return (
                      <div key={servicio.servicio_id}>
                        <div className="flex items-center justify-between p-3 bg-white border border-indigo-200 rounded-lg group">
                          <div className="flex-1">
                            <p className="font-medium text-gray-900 text-sm">
                              {obtenerNombreServicio(servicioData?.nombre)}
                            </p>
                            <p className="text-xs text-gray-500">
                              Cantidad: {servicio.cantidad} × ${parseFloat(precioActual).toLocaleString()} = <span className="font-medium">${subtotal.toLocaleString()}</span>
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setServiciosSeleccionados(serviciosSeleccionados.filter(s => s.servicio_id !== servicio.servicio_id))}
                            className="p-2 rounded-lg text-red-600 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition"
                            title="Eliminar servicio"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                        
                        {/* Campo de ajuste individual (solo visible si mostrarAjusteServicios está activo) */}
                        {mostrarAjusteServicios && (
                          <div className="ml-3 mt-1 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg">
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-600">Precio unitario:</span>
                              <input
                                type="number"
                                step="0.01"
                                placeholder={`Original: $${servicioData?.precio_base || 0}`}
                                value={servicio.precio_ajustado || ''}
                                onChange={(e) => actualizarPrecioServicio(servicio.servicio_id, e.target.value || servicioData?.precio_base)}
                                className="flex-1 px-2 py-1 text-sm border border-amber-300 rounded focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
                              />
                              <span className="text-xs text-gray-600">
                                Original: ${parseFloat(servicioData?.precio_base || 0).toLocaleString()}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                {mostrarAjusteServicios && (
                  <p className="text-xs text-amber-700 mt-2">
                    💡 Ajusta los precios unitarios para negociación. Los cambios se reflejan automáticamente en el cálculo.
                  </p>
                )}
              </div>
            )}
          </div>
          )}

          {/* PASO 5: Descuento */}
          {pasoActual === 5 && (
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Descuento</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descuento ($)
                </label>
                <input
                  type="number"
                  name="descuento_porcentaje"
                  value={formData.descuento_porcentaje}
                  onChange={(e) => {
                    const valor = parseFloat(e.target.value) || 0;
                    const subtotal = precioCalculado?.desglose?.subtotalBase || 0;
                    
                    // Validar que el descuento no exceda el subtotal base
                    if (valor > subtotal) {
                      alert(`❌ El descuento no puede ser mayor que el subtotal base ($${subtotal.toLocaleString()}). El total no puede ser negativo.`);
                      return;
                    }
                    
                    const porcentajeDescuento = subtotal > 0 ? (valor / subtotal) * 100 : 0;
                    
                    if (porcentajeDescuento > 22) {
                      const mensaje = `⚠️ DESCUENTO ALTO\n\nDescuento: $${valor.toLocaleString()}\nSubtotal: $${subtotal.toLocaleString()}\nPorcentaje: ${porcentajeDescuento.toFixed(1)}%\n\n¿Estás seguro de continuar?`;
                      if (window.confirm(mensaje)) {
                        handleChange(e);
                      }
                    } else {
                      handleChange(e);
                    }
                  }}
                  min="0"
                  step="0.01"
                  max={precioCalculado?.desglose?.subtotalBase || 0}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                  placeholder="0.00"
                />
                {precioCalculado?.desglose?.subtotalBase && (
                  <p className="text-xs text-gray-500 mt-1">
                    Descuento máximo permitido: ${precioCalculado.desglose.subtotalBase.toLocaleString()}
                  </p>
                )}
              </div>
            </div>
          </div>
          )}

          {/* Error Message */}
          {mutation.isError && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 text-sm">
                {mutation.error.response?.data?.message || 'Error al actualizar oferta'}
              </p>
            </div>
          )}

          {/* Botones de Navegación del Wizard */}
          <div className="flex gap-3 pt-4 border-t">
            {pasoActual > 1 && (
              <button
                type="button"
                onClick={retrocederPaso}
                className="flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
              >
                <ChevronLeft className="w-5 h-5" />
                Anterior
              </button>
            )}
            <div className="flex-1" />
            {pasoActual < TOTAL_PASOS ? (
              <button
                type="button"
                onClick={avanzarPaso}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium"
              >
                Siguiente
                <ChevronRight className="w-5 h-5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmitFinal}
                disabled={mutation.isPending}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {mutation.isPending ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Guardando cambios...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    Guardar Cambios
                  </>
                )}
              </button>
            )}
            <button
              onClick={() => navigate('/ofertas')}
              type="button"
              className="px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
            >
              Cancelar
            </button>
          </div>
        </div>

        {/* Panel de Calculadora */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm border p-6 sticky top-6">
            <div className="flex items-center gap-2 mb-6">
              <Calculator className="w-5 h-5 text-indigo-600" />
              <h2 className="text-lg font-semibold text-gray-900">Calculadora de Precio</h2>
            </div>

            {precioCalculado && precioCalculado.desglose ? (
              <div className="space-y-4">
                {/* Desglose Detallado */}
                <div className="space-y-2">
                  {/* Paquete Base */}
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Paquete {precioCalculado.desglose.paquete.nombre}:</span>
                    <span className="font-medium">${parseFloat(precioCalculado.desglose.paquete.precioBase || 0).toLocaleString()}</span>
                  </div>

                  {/* Ajuste de Temporada */}
                  {precioCalculado.desglose.paquete.ajusteTemporada > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Ajuste Temporada {precioCalculado.desglose.temporada.nombre}:</span>
                      <span className="font-medium text-orange-600">+${parseFloat(precioCalculado.desglose.paquete.ajusteTemporada).toLocaleString()}</span>
                    </div>
                  )}

                  {/* Invitados Adicionales */}
                  {precioCalculado.desglose.invitados.adicionales > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">
                        {precioCalculado.desglose.invitados.adicionales} Invitados Adicionales 
                        (${precioCalculado.desglose.invitados.precioUnitario} c/u):
                      </span>
                      <span className="font-medium">${parseFloat(precioCalculado.desglose.invitados.subtotal).toLocaleString()}</span>
                    </div>
                  )}

                  {/* Servicios Adicionales */}
                  {precioCalculado.desglose.serviciosAdicionales.subtotal > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Servicios Adicionales:</span>
                      <span className="font-medium">${parseFloat(precioCalculado.desglose.serviciosAdicionales.subtotal).toLocaleString()}</span>
                    </div>
                  )}

                  {/* Subtotal */}
                  <div className="flex justify-between text-sm pt-2 border-t">
                    <span className="text-gray-600 font-medium">Subtotal:</span>
                    <span className="font-semibold">${parseFloat(precioCalculado.desglose.subtotalBase || 0).toLocaleString()}</span>
                  </div>

                  {/* Descuento */}
                  {precioCalculado.desglose.descuento > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Descuento:</span>
                      <span className="font-medium text-green-600">-${parseFloat(precioCalculado.desglose.descuento).toLocaleString()}</span>
                    </div>
                  )}

                  {/* Impuestos */}
                  <div className="pt-3 border-t space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">IVA ({precioCalculado.desglose.impuestos.iva.porcentaje}%):</span>
                      <span className="font-medium">${parseFloat(precioCalculado.desglose.impuestos.iva.monto || 0).toLocaleString()}</span>
                    </div>

                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Service Fee ({precioCalculado.desglose.impuestos.tarifaServicio.porcentaje}%):</span>
                      <span className="font-medium">${parseFloat(precioCalculado.desglose.impuestos.tarifaServicio.monto || 0).toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Total Final */}
                <div className="pt-4 border-t">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-lg font-semibold text-gray-900">Total Final:</span>
                    <span className="text-2xl font-bold text-indigo-600">
                      ${parseFloat(precioCalculado.desglose.totalFinal || 0).toLocaleString()}
                    </span>
                  </div>

                  <div className="text-sm text-gray-600 space-y-1">
                    <p className="flex justify-between">
                      <span>Precio persona adicional:</span>
                      <span className="font-medium">${precioCalculado.desglose.invitados.precioUnitario || 0}</span>
                    </p>
                    <p className="flex justify-between">
                      <span>Invitados:</span>
                      <span className="font-medium">{precioCalculado.desglose.invitados.contratados} ({precioCalculado.desglose.invitados.minimo} incluidos + {precioCalculado.desglose.invitados.adicionales} adicionales)</span>
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <p className="text-xs text-gray-500 text-center">
                    Los precios son estimados y pueden variar
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <Calculator className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-gray-500">
                  Completa los datos para ver el cálculo de precio
                </p>
              </div>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}

export default EditarOferta;

