import { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Calculator, Plus, Minus, Save, Loader2, UserPlus, X, ChevronRight, ChevronLeft, CheckCircle2, Calendar, Clock, MapPin, Mail, Phone, Users, Filter, FilterX, AlertCircle, XCircle } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../config/api';
import ModalCrearCliente from '../components/ModalCrearCliente';
import CalendarioSelector from '../components/CalendarioSelector';
import { calcularDuracion, formatearHora } from '../utils/formatters';
import useAuthStore from '../store/useAuthStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Separator } from '../components/ui/separator';
import { Badge } from '../components/ui/badge';
import toast from 'react-hot-toast';

function CrearOferta() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const [searchParams] = useSearchParams();
  const clienteIdFromUrl = searchParams.get('cliente_id');
  
  // Estado para el wizard por pasos
  const [pasoActual, setPasoActual] = useState(1);
  const TOTAL_PASOS = 5;

  const [formData, setFormData] = useState({
    cliente_id: clienteIdFromUrl || '',
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
  const [tarifaServicioCustom, setTarifaServicioCustom] = useState('');
  const [mostrarAjusteTemporada, setMostrarAjusteTemporada] = useState(false);
  const [mostrarAjustePrecioBase, setMostrarAjustePrecioBase] = useState(false);
  const [mostrarAjusteServicios, setMostrarAjusteServicios] = useState(false);
  const [modalClienteOpen, setModalClienteOpen] = useState(false);
  const [errorFecha, setErrorFecha] = useState('');
  const [excedeCapacidad, setExcedeCapacidad] = useState(false);
  const [mostrarModalCapacidad, setMostrarModalCapacidad] = useState(false);
  const [excesoCapacidadConfirmado, setExcesoCapacidadConfirmado] = useState(false);
  const [errorHorario, setErrorHorario] = useState('');
  const [mostrarModalHorasExtras, setMostrarModalHorasExtras] = useState(false);
  const [horasExtrasFaltantes, setHorasExtrasFaltantes] = useState(0);
  const [verificandoDisponibilidad, setVerificandoDisponibilidad] = useState(false);
  const [errorDisponibilidad, setErrorDisponibilidad] = useState('');
  const [conflictosDisponibilidad, setConflictosDisponibilidad] = useState(null);
  const [horasOcupadas, setHorasOcupadas] = useState([]);
  const [cargandoHorasOcupadas, setCargandoHorasOcupadas] = useState(false);
  const [tipoEvento, setTipoEvento] = useState('');
  const [tipoEventoOtro, setTipoEventoOtro] = useState('');
  
  // Tipos de evento disponibles (definido antes de los useEffect)
  const tiposEvento = [
    'Boda',
    'Quinceañera',
    'Cumpleaños',
    'Aniversario',
    'Corporativo',
    'Graduación',
    'Baby Shower',
    'Fiesta Infantil',
    'Dulces 16',
    'Otro'
  ];
  
  // Estado para servicios excluyentes del paquete (ej: Photobooth 360 o Print)
  const [serviciosExcluyentesSeleccionados, setServiciosExcluyentesSeleccionados] = useState({});
  
  // Estados para el calendario del paso 2
  const fechaActual = new Date();
  const [mesCalendario, setMesCalendario] = useState(fechaActual.getMonth() + 1);
  const [añoCalendario, setAñoCalendario] = useState(fechaActual.getFullYear());
  const [diaSeleccionadoCalendario, setDiaSeleccionadoCalendario] = useState(null);
  const [filtrosSalones, setFiltrosSalones] = useState({
    doral: true,
    kendall: true,
    diamond: true,
    otros: true
  });
  

  // Obtener fecha mínima (hoy) en formato YYYY-MM-DD
  const obtenerFechaMinima = () => {
    // Usar hora de Miami (America/New_York) para determinar qué día es hoy
    const ahoraMiami = new Date(new Date().toLocaleString("en-US", {timeZone: "America/New_York"}));
    const year = ahoraMiami.getFullYear();
    const month = String(ahoraMiami.getMonth() + 1).padStart(2, '0');
    const day = String(ahoraMiami.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Validar horarios del evento
  const validarHorarios = (horaInicio, horaFin) => {
    if (!horaInicio || !horaFin) return null;

    // Convertir a minutos desde medianoche para facilitar comparación
    const convertirAMinutos = (hora) => {
      const [h, m] = hora.split(':').map(Number);
      return h * 60 + m;
    };

    const minutosInicio = convertirAMinutos(horaInicio);
    const minutosFin = convertirAMinutos(horaFin);
    
    // Horario permitido: 10:00 AM (600 minutos) a 1:00 AM del día siguiente
    const HORA_MINIMA_INICIO = 10 * 60; // 10:00 AM = 600 minutos
    const HORA_MAXIMA_FIN_NORMAL = 1 * 60; // 1:00 AM = 60 minutos (del día siguiente)
    const HORA_MAXIMA_FIN_CON_EXTRA = 2 * 60; // 2:00 AM = 120 minutos (del día siguiente)

    // Validar hora de inicio (debe ser >= 10:00 AM)
    if (minutosInicio < HORA_MINIMA_INICIO) {
      return 'La hora de inicio debe ser a partir de las 10:00 AM';
    }

    // Si la hora de fin es menor que la de inicio, significa que termina al día siguiente (después de medianoche)
    const terminaDiaSiguiente = minutosFin < minutosInicio;

    if (terminaDiaSiguiente) {
      // Evento termina después de medianoche
      if (minutosFin > HORA_MAXIMA_FIN_CON_EXTRA) {
        return 'La hora de fin no puede ser después de las 2:00 AM (máximo legal permitido con 1 hora extra)';
      }
    } else {
      // Evento termina el mismo día (antes de medianoche)
      // No hay restricción especial para este caso, es válido
    }

    return null; // No hay errores
  };

  // Función para verificar si un rango de horas se solapa con horas ocupadas
  const verificarRangoOcupado = (horaInicio, horaFin) => {
    if (!horaInicio || !horaFin || horasOcupadas.length === 0) {
      return false;
    }

    // Convertir horas a números (solo la hora, sin minutos para simplificar)
    const [horaInicioNum] = horaInicio.split(':').map(Number);
    let [horaFinNum] = horaFin.split(':').map(Number);
    
    // Si la hora de fin es menor que la de inicio, significa que cruza medianoche
    // En ese caso, ajustar la hora de fin sumando 24
    const cruzaMedianoche = horaFinNum < horaInicioNum;
    if (cruzaMedianoche) {
      horaFinNum += 24;
    }

    // Verificar si alguna hora ocupada está dentro del rango
    // Si alguna hora ocupada está entre horaInicioNum y horaFinNum (inclusive), hay solapamiento
    for (const horaOcupada of horasOcupadas) {
      // Caso normal: rango no cruza medianoche
      if (!cruzaMedianoche) {
        // Si la hora ocupada está dentro del rango (inclusive), hay solapamiento
        if (horaOcupada >= horaInicioNum && horaOcupada <= horaFinNum) {
          return true;
        }
      } else {
        // Caso: rango cruza medianoche (ej: 10 PM a 2 AM)
        // Verificar si la hora ocupada está en la primera parte (horaInicioNum a 23)
        // o en la segunda parte (0 a horaFinNum-24)
        if ((horaOcupada >= horaInicioNum && horaOcupada <= 23) || 
            (horaOcupada >= 0 && horaOcupada <= (horaFinNum - 24))) {
          return true;
        }
      }
    }

    return false; // No hay solapamiento
  };

  // Función helper para formatear hora desde timestamp a HH:mm
  const formatearHoraParaInput = (horaValue) => {
    if (!horaValue) return '';
    
    // Si ya está en formato HH:mm, retornar directamente
    if (typeof horaValue === 'string' && /^\d{2}:\d{2}(:\d{2})?$/.test(horaValue)) {
      return horaValue.slice(0, 5); // Retornar solo HH:mm
    }
    
    // Si es un timestamp ISO o Date object, extraer la hora
    try {
      const fecha = new Date(horaValue);
      if (!isNaN(fecha.getTime())) {
        const horas = fecha.getUTCHours().toString().padStart(2, '0');
        const minutos = fecha.getUTCMinutes().toString().padStart(2, '0');
        return `${horas}:${minutos}`;
      }
    } catch (e) {
      console.error('Error formateando hora:', e);
    }
    
    return '';
  };

  // Queries
  const { data: clientes = [] } = useQuery({
    queryKey: ['clientes'],
    queryFn: async () => {
      try {
      const response = await api.get('/clientes');
        // El endpoint retorna { data: [...], total, page, ... }
        return response.data?.data || [];
      } catch (error) {
        console.error('Error al cargar clientes:', error);
        return [];
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

  // Query para obtener salones
  const { data: salones = [] } = useQuery({
    queryKey: ['salones'],
    queryFn: async () => {
      try {
      const response = await api.get('/salones');
        return response.data?.salones || response.data?.data || [];
      } catch (error) {
        console.error('Error al cargar salones:', error);
        return [];
      }
    },
    staleTime: 10 * 60 * 1000, // 10 minutos - los salones no cambian frecuentemente
    refetchOnWindowFocus: false,
  });

  // Query para obtener paquetes según el salón seleccionado
  const { data: paquetes = [] } = useQuery({
    queryKey: ['paquetes-salon', formData.salon_id],
    queryFn: async () => {
      try {
      if (!formData.salon_id || formData.salon_id === 'otro') {
        // Si no hay salón o es "otro" (sede externa), obtener todos los paquetes
        // El filtro del frontend mostrará solo el personalizado cuando sea "otro"
        const response = await api.get('/paquetes');
          return response.data?.paquetes || response.data?.data || [];
      }
      // Si hay salón, obtener paquetes de ese salón con precios personalizados
      const response = await api.get(`/salones/${formData.salon_id}/paquetes`);
        return response.data?.paquetes || response.data?.data || [];
      } catch (error) {
        console.error('Error al cargar paquetes:', error);
        return [];
      }
    },
    enabled: true,
  });

  const { data: temporadas = [] } = useQuery({
    queryKey: ['temporadas'],
    queryFn: async () => {
      try {
      const response = await api.get('/temporadas');
        return response.data?.temporadas || response.data?.data || [];
      } catch (error) {
        console.error('Error al cargar temporadas:', error);
        return [];
      }
    },
    staleTime: 10 * 60 * 1000, // 10 minutos - las temporadas no cambian frecuentemente
    refetchOnWindowFocus: false,
  });

  const { data: servicios = [] } = useQuery({
    queryKey: ['servicios'],
    queryFn: async () => {
      try {
      const response = await api.get('/servicios');
        return response.data?.servicios || response.data?.data || [];
      } catch (error) {
        console.error('Error al cargar servicios:', error);
        return [];
      }
    },
    staleTime: 10 * 60 * 1000, // 10 minutos - los servicios no cambian frecuentemente
    refetchOnWindowFocus: false,
  });

  // Obtener detalles del paquete seleccionado con sus servicios incluidos
  // Incluir salon_id en el queryKey para que se recargue cuando cambia el salón
  const { data: paqueteDetalle } = useQuery({
    queryKey: ['paquete', formData.paquete_id, formData.salon_id],
    queryFn: async () => {
      try {
      const response = await api.get(`/paquetes/${formData.paquete_id}`);
        return response.data?.paquete || null;
      } catch (error) {
        console.error('Error al cargar detalles del paquete:', error);
        return null;
      }
    },
    enabled: !!formData.paquete_id,
  });
  

  // Query para obtener eventos del calendario (solo cuando estamos en paso 2 y hay salón seleccionado, incluyendo "otro")
  const { data: eventosCalendario, isLoading: cargandoEventosCalendario } = useQuery({
    queryKey: ['calendario-ofertas', user?.id, mesCalendario, añoCalendario, formData.salon_id],
    queryFn: async () => {
      const response = await api.get(`/google-calendar/eventos/todos-vendedores/${mesCalendario}/${añoCalendario}`);
      return response.data;
    },
    enabled: !!user?.id && pasoActual === 2 && !!formData.salon_id && formData.salon_id !== '',
    staleTime: 5 * 60 * 1000, // 5 minutos - los eventos del calendario pueden cambiar
    refetchInterval: false, // Sin refresco automático - solo cuando cambia el mes/año
    refetchOnWindowFocus: false, // No refetch al cambiar de pestaña
  });

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
        
        // Resetear ajuste de temporada a 0 para sede externa
        setAjusteTemporadaCustom('0');
        
        // Si hay un paquete seleccionado que NO es personalizado, limpiarlo
        if (formData.paquete_id) {
          const paqueteActual = paquetes?.find(p => p.id === parseInt(formData.paquete_id));
          const esPersonalizado = paqueteActual?.nombre?.toLowerCase().includes('personalizado');
          
          if (!esPersonalizado) {
            // Limpiar el paquete si no es personalizado
            setFormData(prev => ({
              ...prev,
              paquete_id: ''
            }));
            setPaqueteSeleccionado(null);
            setPrecioBaseAjustado('');
          } else {
            // Si es personalizado, solo resetear el precio base ajustado
            setPrecioBaseAjustado('');
          }
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
          
          // Si hay paquete seleccionado, actualizar con los datos del nuevo salón
          if (formData.paquete_id) {
            setPrecioBaseAjustado('');
            // Invalidar el query del paquete para forzar recarga con los nuevos precios del salón
            queryClient.invalidateQueries(['paquete', formData.paquete_id]);
          }
        }
      }
    }
  }, [formData.salon_id, salones, lugarPersonalizado]);

  // Cargar tipo de evento del cliente cuando se seleccione (solo si el campo está vacío)
  // NO cargar automáticamente para permitir que cada oferta tenga su propio tipo de evento
  useEffect(() => {
    if (formData.cliente_id && clientes.length > 0 && !tipoEvento) {
      const cliente = clientes.find(c => c.id.toString() === formData.cliente_id.toString());
      if (cliente && cliente.tipo_evento) {
        // Solo cargar si el campo está vacío (sugerencia, no forzado)
        // Si el tipo de evento no está en la lista, es un valor personalizado
        if (tiposEvento.includes(cliente.tipo_evento)) {
          setTipoEvento(cliente.tipo_evento);
          setTipoEventoOtro('');
        } else {
          setTipoEvento('Otro');
          setTipoEventoOtro(cliente.tipo_evento);
        }
      } else {
        setTipoEvento('');
        setTipoEventoOtro('');
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.cliente_id, clientes]);

  // Sincronizar filtros del calendario con el salón seleccionado
  useEffect(() => {
    if (formData.salon_id && formData.salon_id !== 'otro' && salonSeleccionado) {
      const nombreSalon = salonSeleccionado.nombre?.toLowerCase().trim() || '';
      
      // Determinar qué filtros activar según el salón seleccionado
      let nuevoFiltros = {
        doral: false,
        kendall: false,
        diamond: false,
        otros: true // Siempre mostrar "Otros/Google Calendar"
      };
      
      // Activar solo el filtro correspondiente al salón seleccionado
      if (nombreSalon.includes('diamond')) {
        nuevoFiltros.diamond = true;
      } else if (nombreSalon.includes('doral') && !nombreSalon.includes('diamond')) {
        nuevoFiltros.doral = true;
      } else if (nombreSalon.includes('kendall') || nombreSalon.includes('kendal')) {
        nuevoFiltros.kendall = true;
      }
      
      setFiltrosSalones(nuevoFiltros);
    } else if (formData.salon_id === 'otro') {
      // Si es "otro", activar solo el filtro de "Otros/Google Calendar"
      setFiltrosSalones({
        doral: false,
        kendall: false,
        diamond: false,
        otros: true
      });
    } else if (!formData.salon_id) {
      // Si no hay salón seleccionado, mantener todos los filtros activos
      setFiltrosSalones({
        doral: true,
        kendall: true,
        diamond: true,
        otros: true
      });
    }
  }, [formData.salon_id, salonSeleccionado]);

  // Limpiar servicios exclusivos de Diamond si se cambia a otro salón
  useEffect(() => {
    if (formData.salon_id && formData.salon_id !== 'otro' && salonSeleccionado) {
      const nombreSalon = salonSeleccionado.nombre?.toLowerCase().trim() || '';
      const esDiamond = nombreSalon.includes('diamond');

      // Si NO es Diamond, eliminar servicios exclusivos de Diamond de servicios adicionales
      // FIX: Usar forma funcional de setState para evitar stale closure
      if (!esDiamond) {
        setServiciosSeleccionados(prevServicios => {
          if (prevServicios.length === 0) return prevServicios;

          const serviciosExclusivosDiamond = [
            'Lounge Set + Coctel Dream',
            'Terraza decorada'
          ];

          const serviciosAEliminar = prevServicios.filter(sel => {
            const servicioData = servicios?.find(s => s.id === parseInt(sel.servicio_id));
            return servicioData && serviciosExclusivosDiamond.includes(servicioData.nombre);
          });

          if (serviciosAEliminar.length > 0) {
            const nuevosServicios = prevServicios.filter(sel => {
              const servicioData = servicios?.find(s => s.id === parseInt(sel.servicio_id));
              return !servicioData || !serviciosExclusivosDiamond.includes(servicioData.nombre);
            });

            // Actualizar formData
            setFormData(prev => ({
              ...prev,
              servicios_adicionales: nuevosServicios.map(s => ({
                servicio_id: parseInt(s.servicio_id),
                cantidad: parseInt(s.cantidad),
                precio_ajustado: s.precio_ajustado ? parseFloat(s.precio_ajustado) : null,
                opcion_seleccionada: s.opcion_seleccionada || null,
              })).filter(s => s.servicio_id)
            }));

            return nuevosServicios;
          }

          return prevServicios;
        });
      }
    }
  }, [formData.salon_id, salonSeleccionado, servicios]);

  // Validar capacidad del salón cuando cambian los invitados
  useEffect(() => {
    if (salonSeleccionado && formData.cantidad_invitados) {
      const cantidadInvitados = parseInt(formData.cantidad_invitados);
      if (cantidadInvitados > salonSeleccionado.capacidad_maxima) {
        setExcedeCapacidad(true);
      } else {
        setExcedeCapacidad(false);
      }
    } else {
      setExcedeCapacidad(false);
    }
  }, [formData.cantidad_invitados, salonSeleccionado]);

  // Actualizar servicios incluidos cuando cambia el paquete
  // También actualizar cuando cambia el salón para obtener los precios correctos
  useEffect(() => {
    if (paqueteDetalle) {
      // Si hay un salón seleccionado y hay paquetes cargados, intentar obtener el precio específico del salón
      if (formData.salon_id && formData.salon_id !== 'otro' && paquetes && paquetes.length > 0) {
        const paqueteConPrecioSalon = paquetes.find(p => p.id === parseInt(formData.paquete_id));
        if (paqueteConPrecioSalon) {
          // Actualizar el paquete con los datos del salón (incluyendo precio_base_salon)
          setPaqueteSeleccionado({
            ...paqueteDetalle,
            precio_base: paqueteConPrecioSalon.precio_base_salon || paqueteConPrecioSalon.precio_base || paqueteDetalle.precio_base,
            precio_base_salon: paqueteConPrecioSalon.precio_base_salon,
            invitados_minimo: paqueteConPrecioSalon.invitados_minimo_salon || paqueteConPrecioSalon.invitados_minimo || paqueteDetalle.invitados_minimo,
          });
        } else {
          setPaqueteSeleccionado(paqueteDetalle);
        }
      } else {
        setPaqueteSeleccionado(paqueteDetalle);
      }
      // Resetear precio ajustado cuando cambia el paquete o el salón
      setPrecioBaseAjustado('');
      setMostrarAjustePrecioBase(false);
    } else if (!formData.paquete_id) {
      setPaqueteSeleccionado(null);
      setPrecioBaseAjustado('');
      setMostrarAjustePrecioBase(false);
    }
  }, [paqueteDetalle, formData.paquete_id, formData.salon_id, paquetes]);

  // Calcular si se necesitan horas extras
  const calcularHorasExtras = () => {
    if (!paqueteSeleccionado || !formData.hora_inicio || !formData.hora_fin) {
      return { necesarias: 0, duracionEvento: 0, duracionTotal: 0 };
    }

    // Usar la función calcularDuracion que maneja correctamente el cruce de medianoche
    const duracionEvento = calcularDuracion(formData.hora_inicio, formData.hora_fin);

    // La duración del paquete es solo la duración base (NO se suman horas extras incluidas)
    const duracionTotal = paqueteSeleccionado.duracion_horas || 0;
    
    // Calcular horas extras adicionales necesarias
    const horasExtrasNecesarias = Math.max(0, Math.ceil(duracionEvento - duracionTotal));

    return { necesarias: horasExtrasNecesarias, duracionEvento, duracionTotal };
  };

  // Agregar automáticamente horas extras cuando sean necesarias
  useEffect(() => {
    // Solo ejecutar si tenemos todos los datos necesarios
    if (!paqueteSeleccionado || !formData.hora_inicio || !formData.hora_fin || !servicios) {
      return;
    }

    const { necesarias } = calcularHorasExtras();

    if (necesarias > 0) {
      const horaExtraServicio = servicios.find(s => s.nombre === 'Hora Extra');
      if (!horaExtraServicio) return;

      // FIX: Usar forma funcional de setState para evitar stale closure y duplicación
      setServiciosSeleccionados(prevServicios => {
        const servicioExistente = prevServicios.find(
          s => s.servicio_id === horaExtraServicio.id
        );

        const cantidadAgregada = servicioExistente?.cantidad || 0;

        // Si faltan horas extras, agregarlas automáticamente
        if (cantidadAgregada < necesarias) {
          if (servicioExistente) {
            // Si ya existe, solo actualizar la cantidad (mantener el precio_ajustado si fue editado)
            return prevServicios.map(s =>
              s.servicio_id === horaExtraServicio.id
                ? { ...s, cantidad: necesarias }
                : s
            );
          } else {
            // Si no existe, agregarlo con la cantidad necesaria y precio por defecto de $800 (editable)
            return [
              ...prevServicios,
              {
                servicio_id: horaExtraServicio.id,
                cantidad: necesarias,
                opcion_seleccionada: '',
                precio_ajustado: 800.00 // Precio por defecto de $800, editable
              }
            ];
          }
        } else if (cantidadAgregada > necesarias) {
          // Si hay más horas extras de las necesarias, reducir a las necesarias
          // (pero no eliminar completamente si el usuario las agregó manualmente)
          if (cantidadAgregada > necesarias + 1) {
            // Solo reducir si hay más de 1 hora extra de diferencia
            return prevServicios.map(s =>
              s.servicio_id === horaExtraServicio.id
                ? { ...s, cantidad: necesarias }
                : s
            );
          }
        }

        // Si no se necesita cambio, retornar el estado anterior
        return prevServicios;
      });
    }
    // Nota: No eliminamos automáticamente las horas extras si no se necesitan,
    // para permitir que el usuario las mantenga si las agregó manualmente
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.hora_inicio, formData.hora_fin, paqueteSeleccionado?.duracion_horas, servicios]);

  // Mutation para actualizar tipo de evento del cliente
  const updateClienteTipoEvento = useMutation({
    mutationFn: async ({ clienteId, tipoEvento }) => {
      const response = await api.put(`/clientes/${clienteId}`, { tipo_evento: tipoEvento });
      return response.data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['clientes'], refetchType: 'active' });
    },
  });

  // Mutation para crear oferta
  const mutation = useMutation({
    mutationFn: async (data) => {
      const response = await api.post('/ofertas', data);
      return response.data;
    },
    onSuccess: async () => {
      // Invalidar y forzar refetch inmediato
      await queryClient.invalidateQueries({ queryKey: ['ofertas'], refetchType: 'active' });
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
        // Para sede externa, el ajuste de temporada siempre es 0
        ajuste_temporada_custom: formData.salon_id === 'otro' ? 0 : (ajusteTemporadaCustom && ajusteTemporadaCustom !== '' ? parseFloat(ajusteTemporadaCustom) : null),
        servicios_adicionales: serviciosSeleccionados
          .filter(s => s.servicio_id)
          .map(s => ({
            servicio_id: parseInt(s.servicio_id),
            cantidad: parseInt(s.cantidad) || 1,
            precio_ajustado: s.precio_ajustado ? parseFloat(s.precio_ajustado) : null,
            opcion_seleccionada: s.opcion_seleccionada,
          })),
        descuento: parseFloat(formData.descuento_porcentaje) || 0,
        tarifa_servicio_custom: tarifaServicioCustom && tarifaServicioCustom !== '' ? parseFloat(tarifaServicioCustom) : null,
      });

      setPrecioCalculado(response.data.calculo);
    } catch (error) {
      console.error('Error al calcular precio:', error);
      setPrecioCalculado(null);
    }
  };

  // Effect para recalcular precio
  useEffect(() => {
    calcularPrecio();
  }, [
    formData.paquete_id,
    formData.salon_id, // Agregar salon_id para recalcular cuando cambia el salón
    formData.fecha_evento,
    formData.temporada_id,
    formData.cantidad_invitados,
    formData.descuento_porcentaje,
    precioBaseAjustado,
    ajusteTemporadaCustom,
    tarifaServicioCustom,
    serviciosSeleccionados,
  ]);

  // Función para verificar disponibilidad del salón
  const verificarDisponibilidad = async (salonId, fechaEvento, horaInicio, horaFin) => {
    if (!salonId || salonId === 'otro' || !fechaEvento || !horaInicio || !horaFin) {
      setErrorDisponibilidad('');
      setConflictosDisponibilidad(null);
      return;
    }

    setVerificandoDisponibilidad(true);
    setErrorDisponibilidad('');
    setConflictosDisponibilidad(null);

    try {
      // PRIMERO: Verificar conflictos con horas ocupadas del calendario (frontend)
      const horasOcupadasCalendario = await obtenerHorasOcupadas(salonId, fechaEvento);
      const hayConflictoCalendario = verificarRangoOcupadoConHoras(horaInicio, horaFin, horasOcupadasCalendario);
      
      if (hayConflictoCalendario) {
        // Obtener detalles del conflicto desde el calendario
        const fechaSeleccionada = fechaEvento.split('T')[0];
        const [año, mes, dia] = fechaSeleccionada.split('-').map(Number);
        const diaCalendario = diaSeleccionadoCalendario || (mes === mesCalendario && año === añoCalendario ? dia : null);
        
        if (diaCalendario && eventosCalendario?.eventos_por_dia?.[diaCalendario]) {
          const eventosDelDia = eventosCalendario.eventos_por_dia[diaCalendario];
          const salonSeleccionado = salones?.find(s => {
            const salonIdNum = typeof salonId === 'string' ? parseInt(salonId) : salonId;
            const sIdNum = typeof s.id === 'string' ? parseInt(s.id) : s.id;
            return sIdNum === salonIdNum;
          });
          const nombreSalonSeleccionado = salonSeleccionado?.nombre?.toLowerCase().trim() || '';
          
          // Buscar eventos conflictivos
          const eventosConflictivos = eventosDelDia.filter(evento => {
            // Verificar si pertenece al salón
            let nombreSalonEvento = '';
            if (evento.salones?.nombre) {
              nombreSalonEvento = String(evento.salones.nombre).toLowerCase().trim();
            } else if (evento.salon) {
              nombreSalonEvento = String(evento.salon).toLowerCase().trim();
            } else if (evento.ubicacion) {
              nombreSalonEvento = String(evento.ubicacion).toLowerCase().trim();
            }
            
            let perteneceAlSalon = false;
            if (evento.salones?.id) {
              const eventoSalonIdNum = typeof evento.salones.id === 'string' ? parseInt(evento.salones.id) : evento.salones.id;
              const salonIdNum = typeof salonId === 'string' ? parseInt(salonId) : salonId;
              perteneceAlSalon = eventoSalonIdNum === salonIdNum;
            }
            
            if (!perteneceAlSalon && nombreSalonSeleccionado && nombreSalonEvento) {
              const nombreBaseSeleccionado = nombreSalonSeleccionado.replace(/\s+\d+$/, '').trim();
              const nombreBaseEvento = nombreSalonEvento.replace(/\s+\d+$/, '').trim();
              
              if (nombreBaseSeleccionado.includes('diamond')) {
                perteneceAlSalon = nombreBaseEvento.includes('diamond');
              } else if (nombreBaseSeleccionado.includes('doral') && !nombreBaseSeleccionado.includes('diamond')) {
                perteneceAlSalon = nombreBaseEvento.includes('doral') && !nombreBaseEvento.includes('diamond');
              } else if (nombreBaseSeleccionado.includes('kendall') || nombreBaseSeleccionado.includes('kendal')) {
                perteneceAlSalon = nombreBaseEvento.includes('kendall') || nombreBaseEvento.includes('kendal') || nombreBaseEvento.includes('kentall');
              }
            }
            
            if (!perteneceAlSalon) return false;
            
            // Verificar solapamiento de horarios
            const extraerHora = (hora) => {
              if (!hora) return null;
              try {
                let fechaHora;
                if (hora instanceof Date) {
                  fechaHora = hora;
                } else if (typeof hora === 'string' && hora.match(/^\d{1,2}:\d{2}(:\d{2})?$/)) {
                  const partes = hora.split(':');
                  return parseInt(partes[0]);
                } else {
                  fechaHora = new Date(hora);
                  if (isNaN(fechaHora.getTime())) return null;
                }
                if (fechaHora) {
                  const fechaMiami = new Date(fechaHora.toLocaleString("en-US", {timeZone: "America/New_York"}));
                  return fechaMiami.getHours();
                }
              } catch (error) {}
              return null;
            };
            
            const eventoHoraInicio = extraerHora(evento.hora_inicio);
            const eventoHoraFin = extraerHora(evento.hora_fin);
            const [horaInicioNum] = horaInicio.split(':').map(Number);
            let [horaFinNum] = horaFin.split(':').map(Number);
            const cruzaMedianoche = horaFinNum < horaInicioNum;
            if (cruzaMedianoche) horaFinNum += 24;
            
            if (eventoHoraInicio !== null && eventoHoraFin !== null) {
              const eventoFinAjustado = eventoHoraFin < eventoHoraInicio ? eventoHoraFin + 24 : eventoHoraFin;
              return (horaInicioNum < eventoFinAjustado + 1 && horaFinNum + 1 > eventoHoraInicio);
            }
            return false;
          });
          
          if (eventosConflictivos.length > 0) {
            let mensaje = `⚠️ El salón no está disponible en este horario.\n\n`;
            mensaje += `Eventos del calendario:\n`;
            eventosConflictivos.forEach(e => {
              const nombreEvento = e.nombre_evento || e.titulo || e.summary || 'Evento';
              const horaInicioEvento = e.hora_inicio ? (typeof e.hora_inicio === 'string' ? e.hora_inicio : e.hora_inicio.toTimeString().slice(0, 5)) : 'N/A';
              const horaFinEvento = e.hora_fin ? (typeof e.hora_fin === 'string' ? e.hora_fin : e.hora_fin.toTimeString().slice(0, 5)) : 'N/A';
              mensaje += `- ${nombreEvento}: ${horaInicioEvento} - ${horaFinEvento}\n`;
            });
            
            setErrorDisponibilidad(mensaje);
            setConflictosDisponibilidad({ calendario: eventosConflictivos });
            setVerificandoDisponibilidad(false);
            return;
          }
        }
      }
      
      // SEGUNDO: Verificar disponibilidad en el backend (contratos y ofertas aceptadas)
      const response = await api.post('/salones/disponibilidad', {
        salon_id: parseInt(salonId),
        fecha_evento: fechaEvento,
        hora_inicio: horaInicio,
        hora_fin: horaFin
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
      
      // Si se cambia la hora de inicio o fin y hay un paquete "Especial" seleccionado, verificar si sigue siendo válido
      if ((name === 'hora_inicio' || name === 'hora_fin') && formData.paquete_id && paqueteSeleccionado) {
        const esPaqueteEspecial = paqueteSeleccionado.nombre?.toLowerCase().includes('especial');
        if (esPaqueteEspecial) {
          const horaInicio = name === 'hora_inicio' ? value : formData.hora_inicio;
          const horaFin = name === 'hora_fin' ? value : formData.hora_fin;
          
          // Si no hay ambas horas, no validar aún
          if (!horaInicio || !horaFin) {
            setFormData({
              ...formData,
              [name]: value,
            });
            return;
          }
          
          const [horaInicioNum, minutosInicio] = horaInicio.split(':').map(Number);
          const horaInicioEnMinutos = horaInicioNum * 60 + minutosInicio;
          
          const [horaFinNum, minutosFin] = horaFin.split(':').map(Number);
          const horaFinEnMinutos = horaFinNum * 60 + minutosFin;
          
          const horaMinima = 10 * 60; // 10:00 AM
          const horaMaxima = 17 * 60; // 5:00 PM (17:00)
          
          // Verificar que la hora de inicio esté entre 10 AM y 5 PM
          const inicioFueraDelRango = horaInicioEnMinutos < horaMinima || horaInicioEnMinutos > horaMaxima;
          // Verificar que la hora de fin sea a las 5 PM o antes
          const finDespuesDe5PM = horaFinEnMinutos > horaMaxima;
          
          // Si alguna condición no se cumple, deseleccionar el paquete
          if (inicioFueraDelRango || finDespuesDe5PM) {
            setFormData({
              ...formData,
              paquete_id: '',
              [name]: value,
            });
            toast.error('El paquete "Especial" solo está disponible de 10:00 AM a 5:00 PM. El evento debe terminar a las 5:00 PM o antes.');
            return;
          }
        }
      }
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
      return [];
    }

    try {
      setCargandoHorasOcupadas(true);
      const response = await api.get('/salones/horarios-ocupados', {
        params: {
          salon_id: salonId,
          fecha_evento: fechaEvento
        }
      });

      if (response.data.success) {
        const horasBackend = response.data.horasOcupadas || [];

        // IMPORTANTE: El backend ya retorna TODAS las horas ocupadas correctamente
        // (contratos, ofertas aceptadas Y eventos de Google Calendar)
        // NO necesitamos combinar con cálculos del frontend que tienen bugs de timezone

        setHorasOcupadas(horasBackend);
        return horasBackend;
      }
      return [];
    } catch (error) {
      console.error('Error al obtener horas ocupadas:', error);
      setHorasOcupadas([]);
      return [];
    } finally {
      setCargandoHorasOcupadas(false);
    }
  };

  // Función helper para verificar si un rango está ocupado usando horas ocupadas específicas
  const verificarRangoOcupadoConHoras = (horaInicio, horaFin, horasOcupadasParaVerificar) => {
    if (!horaInicio || !horaFin || !horasOcupadasParaVerificar || horasOcupadasParaVerificar.length === 0) {
      return false;
    }

    const [horaInicioNum] = horaInicio.split(':').map(Number);
    let [horaFinNum] = horaFin.split(':').map(Number);
    
    const cruzaMedianoche = horaFinNum < horaInicioNum;
    if (cruzaMedianoche) {
      horaFinNum += 24;
    }

    for (const horaOcupada of horasOcupadasParaVerificar) {
      if (!cruzaMedianoche) {
        if (horaOcupada >= horaInicioNum && horaOcupada <= horaFinNum) {
          return true;
        }
      } else {
        if ((horaOcupada >= horaInicioNum && horaOcupada <= 23) || 
            (horaOcupada >= 0 && horaOcupada <= (horaFinNum - 24))) {
          return true;
        }
      }
    }
    return false;
  };

  // Effect para obtener horas ocupadas cuando cambian salón, fecha o día del calendario
  useEffect(() => {
    if (formData.salon_id && formData.salon_id !== 'otro' && formData.fecha_evento) {
      const timeoutId = setTimeout(async () => {
        // Forzar recálculo de horas ocupadas, especialmente importante cuando es el mismo día
        // Usar una marca de tiempo para forzar recálculo incluso si las dependencias no cambian
        const horasOcupadasNuevas = await obtenerHorasOcupadas(formData.salon_id, formData.fecha_evento);
        
        // Si hay horas seleccionadas, verificar si están ocupadas en el nuevo salón
        if (formData.hora_inicio && formData.hora_fin && horasOcupadasNuevas && horasOcupadasNuevas.length > 0) {
          const hayConflicto = verificarRangoOcupadoConHoras(
            formData.hora_inicio, 
            formData.hora_fin, 
            horasOcupadasNuevas
          );
          
          // Si hay conflicto, limpiar las horas seleccionadas
          if (hayConflicto) {
            setFormData(prev => ({
              ...prev,
              hora_inicio: '',
              hora_fin: ''
            }));
            toast.error('Las horas seleccionadas no están disponibles en el nuevo salón');
          }
        }
      }, 300); // Reducido a 300ms para respuesta más rápida

      return () => clearTimeout(timeoutId);
    } else {
      setHorasOcupadas([]);
    }
  }, [formData.salon_id, formData.fecha_evento, diaSeleccionadoCalendario, eventosCalendario, mesCalendario, añoCalendario]);

  // Effect para verificar disponibilidad cuando cambian fecha, hora o salón
  // Solo verificar cuando hay salón, fecha Y horas completas
  useEffect(() => {
    if (formData.salon_id && formData.salon_id !== 'otro' && formData.fecha_evento && formData.hora_inicio && formData.hora_fin && !errorHorario) {
      // Esperar un poco para evitar múltiples llamadas mientras el usuario está escribiendo
      const timeoutId = setTimeout(() => {
        verificarDisponibilidad(formData.salon_id, formData.fecha_evento, formData.hora_inicio, formData.hora_fin);
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
  }, [formData.salon_id, formData.fecha_evento, formData.hora_inicio, formData.hora_fin, errorHorario]);

  // Definir servicios mutuamente excluyentes por nombre
  // NOTA: Las reglas varían según el paquete (ver función obtenerReglasExclusionPorPaquete)
  const serviciosExcluyentes = {
    'Foto y Video 3 Horas': ['Foto y Video 5 Horas'],
    'Foto y Video 5 Horas': ['Foto y Video 3 Horas'],
    'Licor Premium': ['Licor House'], // Premium excluye House (no downgrade)
    'Decoración Plus': ['Decoracion House'], // Plus excluye House (no downgrade)
    'Photobooth 360': ['Photobooth Print'],
    'Photobooth Print': ['Photobooth 360'],
    'Sidra': ['Champaña'], // Sidra y Champaña son mutuamente excluyentes
    'Champaña': ['Sidra']
  };

  // Función para obtener reglas de exclusión específicas por paquete
  const obtenerReglasExclusionPorPaquete = (nombrePaquete) => {
    const nombre = nombrePaquete?.toLowerCase() || '';
    
    if (nombre.includes('especial')) {
      return {
        permiteUpgradeLicor: true, // Puede agregar Licor Plus aunque tenga Básico
        permiteUpgradeDecoracion: true, // Puede agregar Decoración Plus aunque tenga Básica
        permiteFotoVideo: true, // Puede agregar Foto y Video 3h o 5h (excluyentes entre sí)
        excluyeLicorBasicoSiTienePremium: true, // Si tiene Premium, no mostrar Básico
        excluyeDecoracionBasicaSiTienePlus: true, // Si tiene Plus, no mostrar Básica
        excluyeFoto3hSiTiene5h: true, // Si tiene 5h, no mostrar 3h
        excluyeFoto5hSiTiene3h: false // Si tiene 3h, SÍ puede agregar 5h (upgrade)
      };
    }
    
    if (nombre.includes('personalizado')) {
      return {
        permiteUpgradeLicor: false, // NO puede tener ambos (Básico y Plus son excluyentes)
        permiteUpgradeDecoracion: false, // NO puede tener ambos (Básica y Plus son excluyentes)
        permiteFotoVideo: true, // Puede agregar Foto y Video 3h o 5h (excluyentes entre sí)
        excluyeLicorBasicoSiTienePremium: true,
        excluyeDecoracionBasicaSiTienePlus: true,
        excluyeFoto3hSiTiene5h: true,
        excluyeFoto5hSiTiene3h: true // Ambos son excluyentes
      };
    }
    
    if (nombre.includes('platinum') || nombre.includes('platino')) {
      return {
        permiteUpgradeLicor: true, // Puede agregar Licor Plus aunque tenga Básico
        permiteUpgradeDecoracion: true, // Puede agregar Decoración Plus aunque tenga Básica
        permiteFotoVideo: true, // Puede agregar Foto y Video 3h o 5h (excluyentes entre sí)
        excluyeLicorBasicoSiTienePremium: true,
        excluyeDecoracionBasicaSiTienePlus: true,
        excluyeFoto3hSiTiene5h: true,
        excluyeFoto5hSiTiene3h: false // Si tiene 3h, SÍ puede agregar 5h (upgrade)
      };
    }
    
    if (nombre.includes('diamond')) {
      return {
        permiteUpgradeLicor: true, // Puede agregar Licor Plus aunque tenga Básico
        permiteUpgradeDecoracion: false, // Ya tiene Plus (lo mejor)
        permiteFotoVideo: true, // Puede cambiar de 3h a 5h
        excluyeLicorBasicoSiTienePremium: true,
        excluyeDecoracionBasicaSiTienePlus: true,
        excluyeFoto3hSiTiene5h: true,
        excluyeFoto5hSiTiene3h: false, // Si tiene 3h, SÍ puede agregar 5h (upgrade)
        ocultarFoto3hSiEstaIncluida: true // NO mostrar Foto 3h si ya está en el paquete
      };
    }
    
    if (nombre.includes('deluxe')) {
      return {
        permiteUpgradeLicor: false, // Ya tiene Premium (lo mejor)
        permiteUpgradeDecoracion: false, // Ya tiene Plus (lo mejor)
        permiteFotoVideo: false, // Ya tiene lo mejor (5h)
        excluyeLicorBasicoSiTienePremium: true,
        excluyeDecoracionBasicaSiTienePlus: true,
        excluyeFoto3hSiTiene5h: true,
        excluyeFoto5hSiTiene3h: false,
        ocultarFoto3hSiEstaIncluida: true // NO mostrar Foto 3h (5h es mejor)
      };
    }
    
    // Default: reglas generales
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
    
    // Reemplazar "Terraza decorada con cajas con letra" o "Terraza decorada con cajas con letra baby" por "Terraza decorada"
    if (nombreServicio === 'Terraza decorada con cajas con letra' || nombreServicio === 'Terraza decorada con cajas con letra baby') {
      return 'Terraza decorada';
    }
    
    // También manejar el caso si contiene el texto (por si hay variaciones)
    if (nombreServicio && nombreServicio.includes('Terraza decorada con cajas con letra')) {
      return 'Terraza decorada';
    }
    
    return nombreServicio;
  };

  // Función helper para limpiar descripciones de servicios
  const obtenerDescripcionServicio = (descripcion) => {
    if (!descripcion) return descripcion;
    
    // Limpiar " con cajas con letra baby" de las descripciones
    if (descripcion.includes(' con cajas con letra baby')) {
      return descripcion.replace(' con cajas con letra baby', '');
    }
    
    // También limpiar " con cajas con letra" por si acaso
    if (descripcion.includes(' con cajas con letra')) {
      return descripcion.replace(' con cajas con letra', '');
    }
    
    return descripcion;
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
        nombre.includes('personal de atención') || nombre.includes('bartender') || nombre.includes('mesero')) {
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

  // Función helper para obtener servicios del paquete realmente seleccionados
  const getServiciosPaqueteSeleccionados = () => {
    if (!paqueteSeleccionado) return [];
    
    const serviciosProcesados = new Set();
    const serviciosFinales = [];
    let grupoIdx = 0;
    
    paqueteSeleccionado.paquetes_servicios.forEach((ps) => {
      if (serviciosProcesados.has(ps.servicio_id)) return;
      
      const nombreServicio = ps.servicios?.nombre;
      const excluyentes = serviciosExcluyentes[nombreServicio];
      
      if (excluyentes) {
        // Buscar servicios excluyentes en el mismo paquete
        const grupoExcluyente = paqueteSeleccionado.paquetes_servicios.filter(
          (otroPs) => {
            const otroNombre = otroPs.servicios?.nombre;
            return otroNombre === nombreServicio || excluyentes.includes(otroNombre);
          }
        );
        
        if (grupoExcluyente.length > 1) {
          // Es un grupo excluyente, tomar solo el seleccionado
          const grupoKey = `grupo_${grupoIdx}`;
          // Para Sidra/Champaña, usar el que está en el paquete como valor por defecto si no hay selección
          let valorPorDefecto = grupoExcluyente[0].servicio_id;
          const esSidraChampana = grupoExcluyente.some(gps => gps.servicios?.nombre === 'Sidra' || gps.servicios?.nombre === 'Champaña');
          if (esSidraChampana) {
            // Si es el grupo Sidra/Champaña, usar el que está en el paquete como valor por defecto
            const sidraEnPaquete = paqueteSeleccionado.paquetes_servicios.some(ps => ps.servicios?.nombre === 'Sidra');
            const champanaEnPaquete = paqueteSeleccionado.paquetes_servicios.some(ps => ps.servicios?.nombre === 'Champaña');
            if (sidraEnPaquete) {
              const sidraServicio = grupoExcluyente.find(gps => gps.servicios?.nombre === 'Sidra');
              valorPorDefecto = sidraServicio?.servicio_id || grupoExcluyente[0].servicio_id;
            } else if (champanaEnPaquete) {
              const champanaServicio = grupoExcluyente.find(gps => gps.servicios?.nombre === 'Champaña');
              valorPorDefecto = champanaServicio?.servicio_id || grupoExcluyente[0].servicio_id;
            }
          }
          const seleccionadoId = serviciosExcluyentesSeleccionados[grupoKey] || valorPorDefecto;
          const servicioSeleccionado = grupoExcluyente.find(gps => gps.servicio_id === seleccionadoId);
          
          if (servicioSeleccionado) {
            serviciosFinales.push(servicioSeleccionado);
          }
          
          grupoExcluyente.forEach(gps => serviciosProcesados.add(gps.servicio_id));
          grupoIdx++;
          return;
        }
      }
      
      // Servicio normal, agregarlo
      serviciosFinales.push(ps);
      serviciosProcesados.add(ps.servicio_id);
    });
    
    // CASO ESPECIAL: Manejar selección de Sidra/Champaña cuando el usuario elige la alternativa
    const tieneSidra = paqueteSeleccionado.paquetes_servicios.some(ps => ps.servicios?.nombre === 'Sidra');
    const tieneChampana = paqueteSeleccionado.paquetes_servicios.some(ps => ps.servicios?.nombre === 'Champaña');
    
    if (tieneSidra || tieneChampana) {
      // Contar grupos excluyentes existentes (Photobooth, etc.) para encontrar el índice del grupo Sidra/Champaña
      let gruposExistentes = 0;
      const serviciosProcesadosGrupo = new Set();
      let grupoSidraChampanaIndex = -1;
      
      paqueteSeleccionado.paquetes_servicios.forEach((ps) => {
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
      grupoSidraChampanaIndex = gruposExistentes;
      
      const sidraServicio = servicios?.find(s => s.nombre === 'Sidra');
      const champanaServicio = servicios?.find(s => s.nombre === 'Champaña');
      
      if (sidraServicio && champanaServicio) {
        const grupoKey = `grupo_${grupoSidraChampanaIndex}`;
        const seleccionadoId = serviciosExcluyentesSeleccionados[grupoKey];
        
        // Si Champaña está seleccionada y el paquete tiene Sidra, reemplazar
        if (seleccionadoId === champanaServicio.id && tieneSidra) {
          const sidraPaquete = paqueteSeleccionado.paquetes_servicios.find(ps => ps.servicios?.nombre === 'Sidra');
          if (sidraPaquete) {
            const champanaPaquete = {
              id: `champana_${champanaServicio.id}`,
              paquete_id: sidraPaquete.paquete_id,
              servicio_id: champanaServicio.id,
              cantidad: sidraPaquete.cantidad || 10,
              incluido_gratis: true,
              notas: 'Opción alternativa a Sidra',
              servicios: champanaServicio
            };
            
            const sidraIndex = serviciosFinales.findIndex(ps => ps.servicios?.nombre === 'Sidra');
            if (sidraIndex !== -1) {
              serviciosFinales[sidraIndex] = champanaPaquete;
            }
          }
        }
        
        // Si Sidra está seleccionada y el paquete tiene Champaña, reemplazar
        if (seleccionadoId === sidraServicio.id && tieneChampana) {
          const champanaPaquete = paqueteSeleccionado.paquetes_servicios.find(ps => ps.servicios?.nombre === 'Champaña');
          if (champanaPaquete) {
            const sidraPaquete = {
              id: `sidra_${sidraServicio.id}`,
              paquete_id: champanaPaquete.paquete_id,
              servicio_id: sidraServicio.id,
              cantidad: champanaPaquete.cantidad || 10,
              incluido_gratis: true,
              notas: 'Opción alternativa a Champaña',
              servicios: sidraServicio
            };
            
            const champanaIndex = serviciosFinales.findIndex(ps => ps.servicios?.nombre === 'Champaña');
            if (champanaIndex !== -1) {
              serviciosFinales[champanaIndex] = sidraPaquete;
            }
          }
        }
      }
    }
    
    return serviciosFinales;
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
    const serviciosPaquete = getServiciosPaqueteSeleccionados();
    
    // REGLA ESPECÍFICA: Personalizado - Licor y Decoración son excluyentes (no upgrades)
    if (paqueteSeleccionado?.nombre?.toLowerCase().includes('personalizado')) {
      // Verificar en servicios adicionales ya seleccionados
      const tieneLicorPremiumEnAdicionales = serviciosSeleccionados.some(sel => {
        const sData = servicios?.find(srv => srv.id === parseInt(sel.servicio_id));
        return sData?.nombre === 'Licor Premium';
      });
      const tieneLicorBasicoEnAdicionales = serviciosSeleccionados.some(sel => {
        const sData = servicios?.find(srv => srv.id === parseInt(sel.servicio_id));
        return sData?.nombre === 'Licor House';
      });
      const tieneDecoracionPlusEnAdicionales = serviciosSeleccionados.some(sel => {
        const sData = servicios?.find(srv => srv.id === parseInt(sel.servicio_id));
        return sData?.nombre === 'Decoración Plus';
      });
      const tieneDecoracionBasicaEnAdicionales = serviciosSeleccionados.some(sel => {
        const sData = servicios?.find(srv => srv.id === parseInt(sel.servicio_id));
        return sData?.nombre === 'Decoracion House';
      });
      
      // Verificar en el paquete
      const tieneLicorPremiumEnPaquete = serviciosPaquete.some(ps => ps.servicios?.nombre === 'Licor Premium');
      const tieneLicorBasicoEnPaquete = serviciosPaquete.some(ps => ps.servicios?.nombre === 'Licor House');
      const tieneDecoracionPlusEnPaquete = serviciosPaquete.some(ps => ps.servicios?.nombre === 'Decoración Plus');
      const tieneDecoracionBasicaEnPaquete = serviciosPaquete.some(ps => ps.servicios?.nombre === 'Decoracion House');
      
      // Combinar verificaciones (paquete O adicionales)
      const tieneLicorPremium = tieneLicorPremiumEnPaquete || tieneLicorPremiumEnAdicionales;
      const tieneLicorBasico = tieneLicorBasicoEnPaquete || tieneLicorBasicoEnAdicionales;
      const tieneDecoracionPlus = tieneDecoracionPlusEnPaquete || tieneDecoracionPlusEnAdicionales;
      const tieneDecoracionBasica = tieneDecoracionBasicaEnPaquete || tieneDecoracionBasicaEnAdicionales;
      
      if (servicioData.nombre === 'Licor Premium' && tieneLicorBasico) {
        alert(`No puedes seleccionar "Licor Premium" porque ya tienes "Licor House" ${tieneLicorBasicoEnPaquete ? 'en el paquete' : 'en servicios adicionales'}. En el paquete Personalizado, estos servicios son excluyentes.`);
          return;
        }
      if (servicioData.nombre === 'Licor House' && tieneLicorPremium) {
        alert(`No puedes seleccionar "Licor House" porque ya tienes "Licor Premium" ${tieneLicorPremiumEnPaquete ? 'en el paquete' : 'en servicios adicionales'}. En el paquete Personalizado, estos servicios son excluyentes.`);
        return;
      }
      if (servicioData.nombre === 'Decoración Plus' && tieneDecoracionBasica) {
        alert(`No puedes seleccionar "Decoración Plus" porque ya tienes "Decoracion House" ${tieneDecoracionBasicaEnPaquete ? 'en el paquete' : 'en servicios adicionales'}. En el paquete Personalizado, estos servicios son excluyentes.`);
        return;
      }
      if (servicioData.nombre === 'Decoracion House' && tieneDecoracionPlus) {
        alert(`No puedes seleccionar "Decoracion House" porque ya tienes "Decoración Plus" ${tieneDecoracionPlusEnPaquete ? 'en el paquete' : 'en servicios adicionales'}. En el paquete Personalizado, estos servicios son excluyentes.`);
        return;
      }
    }
    
    // Verificar si el servicio es excluyente con alguno ya seleccionado (adicionales o incluidos en el paquete)
    // NUEVA LÓGICA: Solo bloquear si intenta agregar un servicio básico cuando ya tiene premium/plus
    // EXCEPCIÓN: En paquetes Especial y Personalizado, Sidra y Champaña NO son excluyentes
    const esPaqueteEspecialOPersonalizado = paqueteSeleccionado?.nombre?.toLowerCase().includes('especial') || 
                                            paqueteSeleccionado?.nombre?.toLowerCase().includes('personalizado');
    const esSidraOChampana = servicioData?.nombre === 'Sidra' || servicioData?.nombre === 'Champaña';
    
    // REGLA ESPECIAL: Photobooth 360 y Print NO se bloquean entre sí cuando están como extras
    // Solo se bloquean si uno está en el paquete
    const esPhotoboothEnToggle = servicioData?.nombre === 'Photobooth 360' || servicioData?.nombre === 'Photobooth Print';
    const tienePhotoboothEnPaquete = serviciosPaquete.some(ps => ps.servicios?.nombre === 'Photobooth 360' || ps.servicios?.nombre === 'Photobooth Print');
    
    if (servicioData && serviciosExcluyentes[servicioData.nombre] && !(esPaqueteEspecialOPersonalizado && esSidraOChampana)) {
      const nombresExcluyentes = serviciosExcluyentes[servicioData.nombre];
      
      // Verificar en servicios adicionales seleccionados
      // EXCEPCIÓN: Photobooth NO se bloquea entre sí cuando están como extras (no en el paquete)
      const tieneExcluyenteEnAdicionales = !(esPhotoboothEnToggle && !tienePhotoboothEnPaquete) && 
        serviciosSeleccionados.some(s => {
          const sData = servicios?.find(srv => srv.id === parseInt(s.servicio_id));
          return sData && nombresExcluyentes.includes(sData.nombre);
        });
      
      // Verificar en servicios incluidos en el paquete (solo los realmente seleccionados)
      // REGLA ESPECIAL: Para Photobooth y Sidra/Champaña, si uno está en el paquete, el otro DEBE estar disponible como adicional
      const esPhotobooth = servicioData?.nombre === 'Photobooth 360' || servicioData?.nombre === 'Photobooth Print';
      
      let tieneExcluyenteEnPaquete = false;
      if (esPhotobooth) {
        // Detectar qué Photobooth está seleccionado en el paquete
        const tienePhotobooth360EnPaquete = serviciosPaquete.some(ps => ps.servicios?.nombre === 'Photobooth 360');
        const tienePhotoboothPrintEnPaquete = serviciosPaquete.some(ps => ps.servicios?.nombre === 'Photobooth Print');
        
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
          tieneExcluyenteEnPaquete = serviciosPaquete.some(ps => {
        return ps.servicios && nombresExcluyentes.includes(ps.servicios.nombre);
      });
        }
      } else if (esSidraOChampana) {
        // Detectar qué servicio está seleccionado en el paquete
        const tieneSidraEnPaquete = serviciosPaquete.some(ps => ps.servicios?.nombre === 'Sidra');
        const tieneChampanaEnPaquete = serviciosPaquete.some(ps => ps.servicios?.nombre === 'Champaña');
        
        if (servicioData.nombre === 'Sidra' && tieneChampanaEnPaquete) {
          // Si el paquete tiene Champaña, Sidra DEBE estar disponible (es la alternativa)
          tieneExcluyenteEnPaquete = false;
        } else if (servicioData.nombre === 'Champaña' && tieneSidraEnPaquete) {
          // Si el paquete tiene Sidra, Champaña DEBE estar disponible (es la alternativa)
          tieneExcluyenteEnPaquete = false;
        } else {
          // Si es el mismo servicio que está en el paquete, sí es excluyente
          tieneExcluyenteEnPaquete = serviciosPaquete.some(ps => {
            return ps.servicios && nombresExcluyentes.includes(ps.servicios.nombre);
          });
        }
      } else {
        // Para otros servicios, aplicar la lógica normal
        tieneExcluyenteEnPaquete = serviciosPaquete.some(ps => {
          return ps.servicios && nombresExcluyentes.includes(ps.servicios.nombre);
        });
      }
      
      // Verificar si es un upgrade permitido según las reglas del paquete
      const esUpgradePermitido = 
        (servicioData.nombre === 'Licor Premium' && reglasPaquete.permiteUpgradeLicor && serviciosPaquete.some(ps => ps.servicios?.nombre === 'Licor House')) ||
        (servicioData.nombre === 'Decoración Plus' && reglasPaquete.permiteUpgradeDecoracion && serviciosPaquete.some(ps => ps.servicios?.nombre === 'Decoracion House')) ||
        (servicioData.nombre === 'Foto y Video 5 Horas' && reglasPaquete.permiteFotoVideo && !reglasPaquete.excluyeFoto5hSiTiene3h && serviciosPaquete.some(ps => ps.servicios?.nombre === 'Foto y Video 3 Horas'));
      
      if (tieneExcluyenteEnAdicionales && !esUpgradePermitido) {
        alert(`No puedes seleccionar "${servicioData.nombre}" porque ya tienes un servicio mejor en servicios adicionales.`);
        return;
      }
      
      if (tieneExcluyenteEnPaquete && !esUpgradePermitido) {
        const servicioEnPaquete = serviciosPaquete.find(ps => 
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
      // Si es paquete personalizado y el servicio es específicamente "Comida", usar $12 por persona
      const esPaquetePersonalizado = paqueteSeleccionado?.nombre?.toLowerCase().includes('personalizado');
      const esComida = servicioData?.nombre?.toLowerCase() === 'comida' || 
                       servicioData?.nombre?.toLowerCase().includes('comida / a menu') ||
                       servicioData?.nombre?.toLowerCase().trim() === 'comida';
      
      let precioInicial = servicioData?.precio_base || 0;
      if (esPaquetePersonalizado && esComida) {
        precioInicial = 12.00; // $12 por persona (solo para "Comida")
      }
      
      // Agregar nuevo servicio con precio original (o $12 si es comida en personalizado)
      setServiciosSeleccionados([
        ...serviciosSeleccionados,
        { 
          servicio_id: servicioId, 
          cantidad: 1, 
          opcion_seleccionada: '',
          precio_ajustado: precioInicial
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

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validar que la fecha no sea pasada antes de enviar
    if (formData.fecha_evento) {
      const fechaSeleccionada = new Date(formData.fecha_evento);
      const fechaHoy = new Date();
      fechaHoy.setHours(0, 0, 0, 0);

      if (fechaSeleccionada < fechaHoy) {
        setErrorFecha('No se puede crear una oferta con fecha pasada. Por favor, selecciona una fecha presente o futura.');
        // Hacer scroll al campo de fecha
        document.querySelector('input[name="fecha_evento"]')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }
    }

    // Validar horarios antes de enviar
    const errorHorarios = validarHorarios(formData.hora_inicio, formData.hora_fin);
    if (errorHorarios) {
      setErrorHorario(errorHorarios);
      document.querySelector('input[name="hora_inicio"]')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    // Validar que se hayan agregado las horas extras necesarias
    const { necesarias } = calcularHorasExtras();
    if (necesarias > 0) {
      const horaExtraServicio = servicios?.find(s => s.nombre === 'Hora Extra');
      if (horaExtraServicio) {
        const cantidadAgregada = serviciosSeleccionados.find(
          s => s.servicio_id === horaExtraServicio.id
        )?.cantidad || 0;

        const faltante = necesarias - cantidadAgregada;

        if (faltante > 0) {
          setHorasExtrasFaltantes(faltante);
          setMostrarModalHorasExtras(true);
          return;
        }
      }
    }

    // Si excede la capacidad, mostrar modal de confirmación
    if (excedeCapacidad) {
      setMostrarModalCapacidad(true);
      return;
    }

    // Si todo está bien, enviar
    enviarOferta();
  };

  // Función para enviar la oferta (separada para reutilizar)
  const enviarOferta = () => {
    // Obtener la selección de Photobooth del paquete
    let seleccionPhotobooth = null;
    if (paqueteSeleccionado) {
      const tienePhotobooth360 = paqueteSeleccionado.paquetes_servicios.some(ps => ps.servicios?.nombre === 'Photobooth 360');
      const tienePhotoboothPrint = paqueteSeleccionado.paquetes_servicios.some(ps => ps.servicios?.nombre === 'Photobooth Print');
      
      if (tienePhotobooth360 || tienePhotoboothPrint) {
        // El grupo Photobooth es el primero (grupo_0)
        const grupoKey = 'grupo_0';
        const seleccionadoId = serviciosExcluyentesSeleccionados[grupoKey];
        
        if (seleccionadoId) {
          const photobooth360Servicio = servicios?.find(s => s.nombre === 'Photobooth 360');
          const photoboothPrintServicio = servicios?.find(s => s.nombre === 'Photobooth Print');
          
          if (seleccionadoId === photobooth360Servicio?.id) {
            seleccionPhotobooth = 'Photobooth 360';
          } else if (seleccionadoId === photoboothPrintServicio?.id) {
            seleccionPhotobooth = 'Photobooth Print';
          }
        } else {
          // Si no hay selección explícita, usar el que viene en el paquete por defecto
          if (tienePhotobooth360) {
            seleccionPhotobooth = 'Photobooth 360';
          } else if (tienePhotoboothPrint) {
            seleccionPhotobooth = 'Photobooth Print';
          }
        }
      }
    }
    
    // Obtener la selección de Sidra/Champaña del paquete
    let seleccionSidraChampana = null;
    if (paqueteSeleccionado) {
      const tieneSidra = paqueteSeleccionado.paquetes_servicios.some(ps => ps.servicios?.nombre === 'Sidra');
      const tieneChampana = paqueteSeleccionado.paquetes_servicios.some(ps => ps.servicios?.nombre === 'Champaña');
      
      if (tieneSidra || tieneChampana) {
        // Contar grupos excluyentes existentes para encontrar el índice del grupo Sidra/Champaña
        let gruposExistentes = 0;
        const serviciosProcesadosGrupo = new Set();
        
        paqueteSeleccionado.paquetes_servicios.forEach((ps) => {
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
        
        const grupoKey = `grupo_${gruposExistentes}`;
        const seleccionadoId = serviciosExcluyentesSeleccionados[grupoKey];
        
        if (seleccionadoId) {
          const sidraServicio = servicios?.find(s => s.nombre === 'Sidra');
          const champanaServicio = servicios?.find(s => s.nombre === 'Champaña');
          
          if (seleccionadoId === sidraServicio?.id) {
            seleccionSidraChampana = 'Sidra';
          } else if (seleccionadoId === champanaServicio?.id) {
            seleccionSidraChampana = 'Champaña';
          }
        } else {
          // Si no hay selección explícita, usar el que viene en el paquete por defecto
          if (tieneSidra) {
            seleccionSidraChampana = 'Sidra';
          } else if (tieneChampana) {
            seleccionSidraChampana = 'Champaña';
          }
        }
      }
    }
    
    
    const dataToSubmit = {
      cliente_id: parseInt(formData.cliente_id),
      paquete_id: parseInt(formData.paquete_id),
      temporada_id: formData.temporada_id ? parseInt(formData.temporada_id) : null,
      fecha_evento: formData.fecha_evento,
      hora_inicio: formData.hora_inicio,
      hora_fin: formData.hora_fin,
      cantidad_invitados: parseInt(formData.cantidad_invitados),
      // Manejar "Otro" como sede externa sin cobro de salón
      salon_id: formData.salon_id === 'otro' ? null : parseInt(formData.salon_id),
      lugar_evento: formData.salon_id === 'otro' ? lugarPersonalizado : formData.lugar_evento,
      homenajeado: formData.homenajeado || null,
      tipo_evento: tipoEvento === 'Otro' ? tipoEventoOtro : (tipoEvento || null), // Incluir tipo de evento de la oferta
      seleccion_sidra_champana: seleccionSidraChampana, // Incluir selección de Sidra/Champaña
      photobooth_tipo: seleccionPhotobooth, // Incluir selección de Photobooth
      descuento: parseFloat(formData.descuento_porcentaje) || 0,
      notas_vendedor: formData.notas_internas || null,
      // Incluir ajustes personalizados para que el backend los use al calcular
      precio_base_ajustado: precioBaseAjustado && precioBaseAjustado !== '' ? parseFloat(precioBaseAjustado) : null,
      // Para sede externa, el ajuste de temporada siempre es 0
      ajuste_temporada_custom: formData.salon_id === 'otro' ? 0 : (ajusteTemporadaCustom && ajusteTemporadaCustom !== '' ? parseFloat(ajusteTemporadaCustom) : null),
      tarifa_servicio_custom: tarifaServicioCustom && tarifaServicioCustom !== '' ? parseFloat(tarifaServicioCustom) : null,
      servicios_adicionales: serviciosSeleccionados.map(s => ({
        servicio_id: parseInt(s.servicio_id),
        cantidad: parseInt(s.cantidad),
        precio_ajustado: s.precio_ajustado ? parseFloat(s.precio_ajustado) : null,
        opcion_seleccionada: s.opcion_seleccionada || null,
      })).filter(s => s.servicio_id),
    };

    mutation.mutate(dataToSubmit);
  };

  // Confirmar y enviar con exceso de capacidad
  const confirmarExcesoCapacidad = () => {
    setMostrarModalCapacidad(false);
    setExcesoCapacidadConfirmado(true); // Marcar que el usuario ya confirmó el exceso
    // Solo avanzar al siguiente paso, no crear la oferta
    // El usuario debe completar todos los pasos antes de crear la oferta
    if (pasoActual < 5) {
      setPasoActual(pasoActual + 1);
    }
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

    // Validar que se hayan agregado las horas extras necesarias
    const { necesarias } = calcularHorasExtras();
    if (necesarias > 0) {
      const horaExtraServicio = servicios?.find(s => s.nombre === 'Hora Extra');
      if (horaExtraServicio) {
        const cantidadAgregada = serviciosSeleccionados.find(
          s => s.servicio_id === horaExtraServicio.id
        )?.cantidad || 0;

        const faltante = necesarias - cantidadAgregada;

        if (faltante > 0) {
          setHorasExtrasFaltantes(faltante);
          setMostrarModalHorasExtras(true);
          return false;
        }
      }
    }

    // Si excede la capacidad, mostrar modal de confirmación solo si no se ha confirmado antes
    if (excedeCapacidad && !excesoCapacidadConfirmado) {
      setMostrarModalCapacidad(true);
      return false;
    }

    return true;
  };

  // Validar Paso 4: Servicios Adicionales (opcional, siempre válido)
  const validarPaso4 = () => {
    // Los servicios adicionales son opcionales, siempre es válido
    return true;
  };

  // Validar Paso 5: Descuento (opcional, siempre válido)
  const validarPaso5 = () => {
    // El descuento es opcional, siempre es válido
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
        // Scroll al inicio del formulario
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        // Si estamos en el último paso, enviar el formulario
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
    // Validar que todos los pasos anteriores estén completos
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
    // Validar todo antes de enviar
    if (!validarPaso1() || !validarPaso2() || !validarPaso3()) {
      alert('⚠️ Por favor, completa todos los pasos obligatorios antes de crear la oferta.');
      return;
    }

    // Si todo está bien, enviar
    enviarOferta();
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

  // ============================================
  // FUNCIONES DEL CALENDARIO - PASO 2
  // ============================================
  
  const nombresMeses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
  
  const diasSemana = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  const diasSemanaCompletos = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  
  const obtenerDiasDelMes = () => {
    const primerDia = new Date(añoCalendario, mesCalendario - 1, 1);
    const diasEnMes = new Date(añoCalendario, mesCalendario, 0).getDate();
    const diaInicioSemana = primerDia.getDay();
    return { diasEnMes, diaInicioSemana };
  };
  
  const obtenerEventosDelDia = (dia) => {
    if (!eventosCalendario?.eventos_por_dia) {
      return [];
    }
    
    let eventos = eventosCalendario.eventos_por_dia[dia] || [];
    
    // IMPORTANTE: Solo mostrar eventos de Google Calendar (es_google_calendar: true)
    // NO mostrar contratos ni ofertas de la base de datos porque tienen bugs
    eventos = eventos.filter(evento => {
      // Solo incluir eventos de Google Calendar
      return evento.es_google_calendar === true || evento.calendario === 'principal' || evento.calendario === 'citas';
    });
    
    // Filtrar eventos pasados - solo mostrar eventos de hoy en adelante (hora Miami)
    const ahoraMiami = new Date(new Date().toLocaleString("en-US", {timeZone: "America/New_York"}));
    const hoyMiami = new Date(ahoraMiami.getFullYear(), ahoraMiami.getMonth(), ahoraMiami.getDate());
    hoyMiami.setHours(0, 0, 0, 0);
    
    eventos = eventos.filter(evento => {
      let fechaEvento;
      if (evento.fecha_evento) {
        fechaEvento = new Date(evento.fecha_evento);
      } else if (evento.fecha_inicio) {
        fechaEvento = new Date(evento.fecha_inicio);
      } else if (evento.hora_inicio) {
        fechaEvento = new Date(evento.hora_inicio);
      } else {
        return false;
      }
      
      const fechaEventoMiami = new Date(fechaEvento.toLocaleString("en-US", {timeZone: "America/New_York"}));
      
      if (evento.es_todo_el_dia) {
        const fechaEventoSolo = new Date(fechaEventoMiami.getFullYear(), fechaEventoMiami.getMonth(), fechaEventoMiami.getDate());
        fechaEventoSolo.setHours(0, 0, 0, 0);
        return fechaEventoSolo >= hoyMiami;
      }
      
      return fechaEventoMiami >= hoyMiami;
    });
    
    // Filtrar eventos según los filtros de salones activos (igual que en CalendarioMensual)
    return eventos.filter(evento => {
      let nombreSalon = '';
      if (evento.salones?.nombre) {
        nombreSalon = String(evento.salones.nombre).toLowerCase();
      } else if (evento.salon) {
        nombreSalon = String(evento.salon).toLowerCase();
      } else if (evento.ubicacion) {
        nombreSalon = String(evento.ubicacion).toLowerCase();
      }
      
      // Normalizar el nombre del salón
      nombreSalon = nombreSalon.toLowerCase().trim().replace(/\s+/g, ' ');
      
      // Verificar si el evento coincide con algún filtro activo
      // PRIORIDAD: Diamond debe verificarse ANTES que Doral porque "DIAMOND AT DORAL" contiene ambas palabras
      if (nombreSalon.includes('diamond')) {
        return filtrosSalones.diamond;
      }
      // Solo clasificar como Doral si NO contiene "diamond"
      if (nombreSalon.includes('doral') && !nombreSalon.includes('diamond')) {
        return filtrosSalones.doral;
      }
      if (nombreSalon.includes('kendall') || nombreSalon.includes('kendal') || nombreSalon.includes('kentall')) {
        return filtrosSalones.kendall;
      }
      // Si no coincide con ningún salón específico, usar el filtro "otros"
      return filtrosSalones.otros;
    });
  };
  
  // Función para calcular horas ocupadas desde los eventos del calendario
  const calcularHorasOcupadasDesdeCalendario = (dia, salonId) => {
    if (!dia || !salonId || salonId === 'otro' || !eventosCalendario?.eventos_por_dia) {
      return [];
    }
    
    // Obtener eventos directamente del calendario SIN filtrar por filtrosSalones
    // porque los filtros del calendario son solo para visualización
    // Para bloquear horas, necesitamos TODOS los eventos del salón seleccionado
    let eventos = eventosCalendario.eventos_por_dia[dia] || [];
    
    // Filtrar eventos pasados - solo considerar eventos de hoy en adelante (hora Miami)
    // IMPORTANTE: Para eventos del mismo día, considerar la hora actual, no solo la fecha
    const ahoraMiami = new Date(new Date().toLocaleString("en-US", {timeZone: "America/New_York"}));
    const hoyMiami = new Date(ahoraMiami.getFullYear(), ahoraMiami.getMonth(), ahoraMiami.getDate());
    hoyMiami.setHours(0, 0, 0, 0);
    
    eventos = eventos.filter(evento => {
      let fechaEvento;
      
      // Obtener la fecha del evento
      if (evento.fecha_evento) {
        fechaEvento = new Date(evento.fecha_evento);
      } else if (evento.fecha_inicio) {
        fechaEvento = new Date(evento.fecha_inicio);
      } else if (evento.hora_inicio) {
        fechaEvento = new Date(evento.hora_inicio);
      } else {
        return false;
      }
      
      const fechaEventoMiami = new Date(fechaEvento.toLocaleString("en-US", {timeZone: "America/New_York"}));
      
      if (evento.es_todo_el_dia) {
        const fechaEventoSolo = new Date(fechaEventoMiami.getFullYear(), fechaEventoMiami.getMonth(), fechaEventoMiami.getDate());
        fechaEventoSolo.setHours(0, 0, 0, 0);
        return fechaEventoSolo >= hoyMiami;
      }
      
      // Para eventos con hora específica, verificar fecha y hora
      const fechaEventoSolo = new Date(fechaEventoMiami.getFullYear(), fechaEventoMiami.getMonth(), fechaEventoMiami.getDate());
      fechaEventoSolo.setHours(0, 0, 0, 0);
      const esMismoDia = fechaEventoSolo.getTime() === hoyMiami.getTime();
      
      if (esMismoDia) {
        // Si es el mismo día, INCLUIR todos los eventos del día (no filtrar por hora)
        // Esto es importante porque necesitamos bloquear las horas ocupadas incluso si el evento es más tarde
        // La lógica de bloquear horas se hace después, aquí solo filtramos eventos pasados de otros días
        return true; // Incluir todos los eventos del mismo día
      }
      
      // Para otros días, solo verificar que la fecha sea mayor o igual a hoy
      return fechaEventoMiami >= hoyMiami;
    });
    
    const horasOcupadas = new Set();
    
    // Obtener el nombre del salón seleccionado para filtrar eventos
    // IMPORTANTE: Comparar IDs como números o strings para evitar problemas de tipo
    const salonSeleccionado = salones?.find(s => {
      const salonIdNum = typeof salonId === 'string' ? parseInt(salonId) : salonId;
      const sIdNum = typeof s.id === 'string' ? parseInt(s.id) : s.id;
      return sIdNum === salonIdNum;
    });
    const nombreSalonSeleccionado = salonSeleccionado?.nombre?.toLowerCase().trim() || '';
    
    eventos.forEach((evento, index) => {
      
      // Si el evento es de todo el día, ocupar todas las horas
      if (evento.es_todo_el_dia) {
        for (let h = 0; h < 24; h++) {
          horasOcupadas.add(h);
        }
        return;
      }
      
      // FIX: Solo bloquear eventos de Google Calendar que tengan un salón asignado Y que coincida con el salón seleccionado
      // Los eventos de Google Calendar sin salón o con salón diferente NO deben bloquear horas
      if (evento.es_google_calendar || evento.id?.toString().startsWith('google_')) {
        const tieneSalonAsignado = evento.salones?.id || evento.salones?.nombre || evento.salon || evento.ubicacion;
        
        // Si no tiene salón asignado, no bloquear
        if (!tieneSalonAsignado) {
          return;
        }
        
        // Si tiene salón pero no coincide con el seleccionado, no bloquear (ya se verifica más abajo con perteneceAlSalon)
        // Pero si es un evento de citas (es_citas) sin salón específico, no bloquear
        if (evento.es_citas && !tieneSalonAsignado) {
          return;
        }
      }
      
      // Verificar si el evento pertenece al salón seleccionado
      let nombreSalonEvento = '';
      if (evento.salones?.nombre) {
        nombreSalonEvento = String(evento.salones.nombre).toLowerCase().trim();
      } else if (evento.salon) {
        nombreSalonEvento = String(evento.salon).toLowerCase().trim();
      } else if (evento.ubicacion) {
        nombreSalonEvento = String(evento.ubicacion).toLowerCase().trim();
      }
      
      // Verificar si el evento pertenece al salón seleccionado
      let perteneceAlSalon = false;
      
      // PRIORIDAD 1: Comparar por ID (más confiable)
      // Comparar como números para evitar problemas de tipo
      if (evento.salones?.id) {
        const eventoSalonIdNum = typeof evento.salones.id === 'string' ? parseInt(evento.salones.id) : evento.salones.id;
        const salonIdNum = typeof salonId === 'string' ? parseInt(salonId) : salonId;
        if (eventoSalonIdNum === salonIdNum) {
          perteneceAlSalon = true;
        }
      }
      
      // PRIORIDAD 2: Comparar por nombre si no coincidió por ID
      if (!perteneceAlSalon && nombreSalonSeleccionado && nombreSalonEvento) {
        // PRIORIDAD 2: Comparar por nombre (normalizado)
        // Normalizar nombres: eliminar números al final y espacios extra
        // Ej: "doral 1" → "doral", "doral 2" → "doral", "doral" → "doral"
        const nombreBaseSeleccionado = nombreSalonSeleccionado.replace(/\s+\d+$/, '').trim();
        const nombreBaseEvento = nombreSalonEvento.replace(/\s+\d+$/, '').trim();
        
        // Verificar por nombre base (Doral, Doral 1, Doral 2 = todos son "Doral")
        if (nombreBaseSeleccionado.includes('diamond')) {
          perteneceAlSalon = nombreBaseEvento.includes('diamond');
        } else if (nombreBaseSeleccionado.includes('doral') && !nombreBaseSeleccionado.includes('diamond')) {
          perteneceAlSalon = nombreBaseEvento.includes('doral') && !nombreBaseEvento.includes('diamond');
        } else if (nombreBaseSeleccionado.includes('kendall') || nombreBaseSeleccionado.includes('kendal')) {
          perteneceAlSalon = nombreBaseEvento.includes('kendall') || nombreBaseEvento.includes('kendal') || nombreBaseEvento.includes('kentall');
        } else {
          // Comparación exacta del nombre base normalizado
          perteneceAlSalon = nombreBaseSeleccionado === nombreBaseEvento;
        }
      }
      
      // Solo considerar eventos del salón seleccionado
      if (!perteneceAlSalon) {
        return;
      }
      
      // FIX: Los eventos que vienen de /eventos/todos-vendedores son solo de Google Calendar
      // Solo bloquear si:
      // 1. Es un evento de Google Calendar con salón asignado que coincide (ya verificado arriba)
      // 2. NO es un evento de citas sin salón específico
      // 3. Tiene horas válidas (hora_inicio y hora_fin)
      
      // Si es un evento de citas sin salón específico, no bloquear
      if (evento.es_citas && !evento.salones?.id && !evento.salones?.nombre && !evento.salon && !evento.ubicacion) {
        return; // No bloquear horas para citas sin salón asignado
      }
      
      // Si es un evento de Google Calendar pero no tiene información de salón válida, no bloquear
      if (evento.es_google_calendar && !perteneceAlSalon) {
        return; // Ya se verifica arriba, pero por seguridad
      }
      
      // Función helper para extraer la hora de diferentes formatos
      // IMPORTANTE: Extraer la hora en la zona horaria de Miami (America/New_York)
      const extraerHora = (hora) => {
        if (!hora) return null;
        
        try {
          let fechaHora;
          
          // Si es un objeto Date
          if (hora instanceof Date) {
            fechaHora = hora;
          }
          // Si es un string, intentar parsearlo
          else if (typeof hora === 'string') {
            // Formato "HH:mm" o "HH:mm:ss" (solo hora, sin fecha)
            if (hora.match(/^\d{1,2}:\d{2}(:\d{2})?$/)) {
              const partes = hora.split(':');
              if (partes.length > 0) {
                return parseInt(partes[0]);
              }
            }
            // Timestamp ISO o formato de fecha/hora
            else {
              fechaHora = new Date(hora);
              if (isNaN(fechaHora.getTime())) {
                return null;
              }
            }
          } else {
            return null;
          }
          
          // Si tenemos un objeto Date, extraer la hora en la zona horaria de Miami
          if (fechaHora) {
            // Convertir a la zona horaria de Miami
            const fechaMiami = new Date(fechaHora.toLocaleString("en-US", {timeZone: "America/New_York"}));
            return fechaMiami.getHours();
          }
        } catch (error) {
          // Error silencioso
        }
        
        return null;
      };
      
      const horaInicio = extraerHora(evento.hora_inicio);
      const horaFin = extraerHora(evento.hora_fin);
      
      if (horaInicio !== null && horaFin !== null) {
        // Determinar si el evento cruza medianoche
        const cruzaMedianoche = horaFin < horaInicio;
        
        if (cruzaMedianoche) {
          // Evento cruza medianoche (ej: 8 PM a 12 AM)
          // SOLO bloquear desde horaInicio hasta 23 (11:59 PM del mismo día)
          // NO bloquear el día siguiente, NO buffers
          for (let h = horaInicio; h < 24; h++) {
            horasOcupadas.add(h);
          }
        } else {
          // Evento NO cruza medianoche (ej: 12 PM a 4 PM)
          // SOLO bloquear las horas exactas del evento, sin buffers
          for (let h = horaInicio; h <= horaFin; h++) {
            if (h >= 0 && h < 24) {
              horasOcupadas.add(h);
            }
          }
        }
      } else if (horaInicio !== null) {
        // Solo tenemos hora de inicio - bloquear solo esa hora
        if (horaInicio >= 0 && horaInicio < 24) {
          horasOcupadas.add(horaInicio);
        }
      }
    });
    
    const horasFinales = Array.from(horasOcupadas).sort((a, b) => a - b);
    return horasFinales;
  };
  
  const obtenerColorEvento = (evento) => {
    let nombreSalon = '';
    if (evento.salones?.nombre) {
      nombreSalon = String(evento.salones.nombre).toLowerCase();
    } else if (evento.salon) {
      nombreSalon = String(evento.salon).toLowerCase();
    } else if (evento.ubicacion) {
      nombreSalon = String(evento.ubicacion).toLowerCase();
    }
    
    nombreSalon = nombreSalon.toLowerCase().trim().replace(/\s+/g, ' ');
    
    // Naranja = Diamond
    if (nombreSalon && nombreSalon.includes('diamond')) {
      return {
        bg: 'bg-orange-50 dark:bg-orange-900/20',
        border: 'border-l-4 border-orange-500',
        text: 'text-orange-800 dark:text-orange-200',
        dot: 'bg-orange-500'
      };
    }
    
    // Verde = Doral
    if (nombreSalon && nombreSalon.includes('doral') && !nombreSalon.includes('diamond')) {
      return {
        bg: 'bg-green-50 dark:bg-green-900/20',
        border: 'border-l-4 border-green-500',
        text: 'text-green-800 dark:text-green-200',
        dot: 'bg-green-500'
      };
    }
    
    // Azul = Kendall
    if (nombreSalon && (nombreSalon.includes('kendall') || nombreSalon.includes('kendal') || nombreSalon.includes('kentall'))) {
      return {
        bg: 'bg-blue-50 dark:bg-blue-900/20',
        border: 'border-l-4 border-blue-500',
        text: 'text-blue-800 dark:text-blue-200',
        dot: 'bg-blue-500'
      };
    }
    
    // Morado = Otros (Google Calendar)
    if (evento.es_google_calendar || evento.id?.toString().startsWith('google_')) {
      return {
        bg: 'bg-purple-50 dark:bg-purple-900/20',
        border: 'border-l-4 border-purple-500',
        text: 'text-purple-800 dark:text-purple-200',
        dot: 'bg-purple-500'
      };
    }
    
    return {
      bg: 'bg-purple-50 dark:bg-purple-900/20',
      border: 'border-l-4 border-purple-500',
      text: 'text-purple-800 dark:text-purple-200',
      dot: 'bg-purple-500'
    };
  };
  
  const renderizarCalendario = () => {
    const { diasEnMes, diaInicioSemana } = obtenerDiasDelMes();
    const dias = [];

    // Días vacíos al inicio
    for (let i = 0; i < diaInicioSemana; i++) {
      dias.push(
        <div key={`empty-${i}`} className="min-h-[80px] border-r border-b border-gray-200 dark:border-gray-800"></div>
      );
    }

    // Días del mes
    for (let dia = 1; dia <= diasEnMes; dia++) {
      const eventosDelDia = obtenerEventosDelDia(dia);
      const esHoy = dia === fechaActual.getDate() && 
                    mesCalendario === fechaActual.getMonth() + 1 && 
                    añoCalendario === fechaActual.getFullYear();
      const estaSeleccionado = diaSeleccionadoCalendario === dia;

      dias.push(
        <div
          key={dia}
          onClick={() => {
            if (esFechaValida(dia)) {
              const fechaStr = formatearFechaParaInput(dia);
              // Si se hace click en el mismo día ya seleccionado, deseleccionar
              if (dia === diaSeleccionadoCalendario) {
                setDiaSeleccionadoCalendario(null);
                // No limpiar la fecha del evento, solo el día del calendario
              } else {
                // Seleccionar el nuevo día
                setDiaSeleccionadoCalendario(dia);
                // Establecer la fecha inmediatamente para desbloquear los campos
                setFormData(prev => ({
                  ...prev,
                  fecha_evento: fechaStr
                }));
                // Forzar recálculo de horas ocupadas cuando se selecciona un día
                if (formData.salon_id && formData.salon_id !== 'otro') {
                  // Usar setTimeout para asegurar que el estado se actualice primero
                  setTimeout(() => {
                    obtenerHorasOcupadas(formData.salon_id, fechaStr);
                  }, 100);
                }
              }
            }
          }}
          className={`
            min-h-[80px] border-r border-b border-gray-200 dark:border-gray-800 p-1.5
            transition-colors cursor-pointer
            ${!esFechaValida(dia)
              ? 'bg-gray-50/30 dark:bg-gray-900/20 cursor-not-allowed opacity-50'
              : estaSeleccionado 
              ? 'bg-blue-50 dark:bg-blue-950/20' 
              : esHoy
              ? 'bg-blue-50/50 dark:bg-blue-950/10'
              : 'hover:bg-gray-50 dark:hover:bg-gray-900/50'
            }
          `}
        >
          <div className={`
            text-xs font-medium mb-0.5
            ${!esFechaValida(dia)
              ? 'text-gray-400 dark:text-gray-600'
              : esHoy 
              ? 'text-blue-600 dark:text-blue-400 font-bold' 
              : estaSeleccionado
              ? 'text-blue-600 dark:text-blue-400'
              : 'text-gray-700 dark:text-gray-300'
            }
          `}>
            {dia}
          </div>

          {/* Eventos */}
          <div className="space-y-0.5">
            {eventosDelDia.slice(0, 2).map((evento, index) => {
              const color = obtenerColorEvento(evento);
              return (
                <div
                  key={evento.id || index}
                  onClick={(e) => {
                    e.stopPropagation();
                  }}
                  className={`
                    ${color.bg} ${color.border} ${color.text}
                    text-[10px] px-1.5 py-0.5 rounded-r cursor-pointer
                    hover:opacity-80 transition-opacity truncate
                  `}
                  title={`${evento.clientes?.nombre_completo || evento.titulo || evento.summary || 'Evento'}${evento.es_todo_el_dia ? ' - Todo el día' : ` - ${formatearHora(evento.hora_inicio)}`} - ${evento.salones?.nombre || evento.salon || evento.ubicacion || 'Sin salón'}`}
                >
                  <div className="flex items-center gap-1">
                    <div className={`w-1.5 h-1.5 rounded-full ${color.dot} flex-shrink-0`} />
                    <span className="truncate">
                      {evento.es_todo_el_dia ? '📅 Todo el día: ' : `${formatearHora(evento.hora_inicio)} `}
                      {evento.clientes?.nombre_completo || evento.titulo || evento.summary || 'Evento'}
                    </span>
                  </div>
                </div>
              );
            })}
            
            {/* Indicador de más eventos */}
            {eventosDelDia.length > 2 && (
              <div className="text-[10px] text-gray-500 dark:text-gray-400 px-1.5 py-0.5">
                +{eventosDelDia.length - 2} más
              </div>
            )}
          </div>
        </div>
      );
    }

    return dias;
  };
  
  const cambiarMesCalendario = (direccion) => {
    if (direccion === 'anterior') {
      if (mesCalendario === 1) {
        setMesCalendario(12);
        setAñoCalendario(añoCalendario - 1);
      } else {
        setMesCalendario(mesCalendario - 1);
      }
    } else {
      if (mesCalendario === 12) {
        setMesCalendario(1);
        setAñoCalendario(añoCalendario + 1);
      } else {
        setMesCalendario(mesCalendario + 1);
      }
    }
  };
  
  const irAlMesActual = () => {
    const hoy = new Date();
    setMesCalendario(hoy.getMonth() + 1);
    setAñoCalendario(hoy.getFullYear());
    setDiaSeleccionadoCalendario(null);
  };
  
  // Generar lista de años (desde 2025 en adelante)
  const añosDisponibles = Array.from({ length: 11 }, (_, i) => 2025 + i);
  
  const esFechaValida = (dia) => {
    const ahoraMiami = new Date(new Date().toLocaleString("en-US", {timeZone: "America/New_York"}));
    const hoyMiami = new Date(ahoraMiami.getFullYear(), ahoraMiami.getMonth(), ahoraMiami.getDate());
    hoyMiami.setHours(0, 0, 0, 0);
    const fecha = new Date(añoCalendario, mesCalendario - 1, dia);
    fecha.setHours(0, 0, 0, 0);
    return fecha >= hoyMiami;
  };
  
  const esFechaSeleccionada = (dia) => {
    if (!formData.fecha_evento) return false;
    const fechaStr = formData.fecha_evento.split('T')[0];
    const [año, mes, diaFecha] = fechaStr.split('-').map(Number);
    return diaFecha === dia && mes === mesCalendario && año === añoCalendario;
  };
  
  const esHoy = (dia) => {
    const ahoraMiami = new Date(new Date().toLocaleString("en-US", {timeZone: "America/New_York"}));
    return dia === ahoraMiami.getDate() && mesCalendario === ahoraMiami.getMonth() + 1 && añoCalendario === ahoraMiami.getFullYear();
  };
  
  const formatearFechaParaInput = (dia) => {
    return `${añoCalendario}-${String(mesCalendario).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
  };
  
  const eventosDiaSeleccionado = diaSeleccionadoCalendario ? obtenerEventosDelDia(diaSeleccionadoCalendario) : [];
  
  // Sincronizar mes/año y día cuando cambia la fecha seleccionada
  useEffect(() => {
    if (formData.fecha_evento) {
      const fechaStr = formData.fecha_evento.split('T')[0];
      const [año, mes, dia] = fechaStr.split('-').map(Number);
      if (mes !== mesCalendario || año !== añoCalendario) {
        setMesCalendario(mes);
        setAñoCalendario(año);
      }
      if (dia !== diaSeleccionadoCalendario) {
        setDiaSeleccionadoCalendario(dia);
      }
    }
  }, [formData.fecha_evento]);
  

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/ofertas">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Nueva Oferta</h1>
          <p className="text-muted-foreground mt-1">Crea una propuesta personalizada para tu cliente</p>
        </div>
      </div>

      {/* Indicador de Progreso */}
      <Card>
        <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          {[1, 2, 3, 4, 5].map((paso, index) => (
            <div key={paso} className="flex items-center flex-1">
              <div className="flex flex-col items-center flex-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => irAPaso(paso)}
                  className={`relative h-10 w-10 rounded-full border-2 transition-all ${
                    paso === pasoActual
                      ? 'bg-primary border-primary text-primary-foreground'
                      : pasoCompleto(paso)
                      ? 'bg-green-50 border-green-500 text-green-700 dark:bg-green-950 dark:border-green-500 dark:text-green-400'
                      : paso < pasoActual
                      ? 'bg-muted border-muted-foreground/30 text-muted-foreground'
                      : 'bg-background border-border text-muted-foreground'
                  }`}
                  disabled={paso > pasoActual && !pasoCompleto(paso - 1)}
                >
                  {pasoCompleto(paso) && paso !== pasoActual ? (
                    <CheckCircle2 className="h-5 w-5" />
                  ) : (
                    <span className="font-semibold text-sm">{paso}</span>
                  )}
                </Button>
                <span className={`mt-2 text-xs font-medium text-center ${
                  paso === pasoActual ? 'text-primary' : 'text-muted-foreground'
                }`}>
                  {nombresPasos[paso - 1]}
                </span>
              </div>
              {index < 4 && (
                <div className={`flex-1 h-0.5 mx-2 ${
                  pasoCompleto(paso) ? 'bg-green-500' : 'bg-border'
                }`} />
              )}
            </div>
          ))}
        </div>
        </CardContent>
      </Card>

      <form onSubmit={(e) => { e.preventDefault(); handleSubmitFinal(); }} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formulario */}
        <div className="lg:col-span-2 space-y-6">
          {/* PASO 1: Información del Cliente */}
          {pasoActual === 1 && (
            <Card>
              <CardHeader className="px-6 pt-6 pb-4">
                <CardTitle>Información del Cliente</CardTitle>
              </CardHeader>
              <CardContent className="px-6 pb-6">
                <div className="space-y-2">
                  <Label htmlFor="cliente_id">
                    Cliente <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={formData.cliente_id || ""}
                    onValueChange={(value) => {
                      setFormData(prev => ({ ...prev, cliente_id: value }));
                    }}
                  >
                    <SelectTrigger id="cliente_id" className="w-full [&>span]:truncate">
                      <SelectValue placeholder="Seleccionar...">
                        {formData.cliente_id && clientes?.find(c => c.id.toString() === formData.cliente_id.toString()) 
                          ? `${clientes.find(c => c.id.toString() === formData.cliente_id.toString()).nombre_completo} - ${clientes.find(c => c.id.toString() === formData.cliente_id.toString()).email}`
                          : null
                        }
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent className="min-w-[400px]">
                      {clientes?.map((cliente) => (
                        <SelectItem key={cliente.id} value={cliente.id.toString()}>
                          <div className="flex flex-col">
                            <span className="font-medium">{cliente.nombre_completo}</span>
                            <span className="text-xs text-muted-foreground">{cliente.email}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          )}

          {/* PASO 2: Detalles del Evento */}
          {pasoActual === 2 && (
            <div className="space-y-6">
            {/* Formulario */}
            <Card>
              <CardHeader>
                <CardTitle>Detalles del Evento</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="homenajeado">Homenajeado/a</Label>
                      <Input
                        id="homenajeado"
                        type="text"
                        name="homenajeado"
                        value={formData.homenajeado}
                        onChange={handleChange}
                        placeholder="Ej: María López, Juan Pérez"
                      />
                      <p className="text-xs text-muted-foreground">
                        Nombre de la persona homenajeada en el evento (opcional)
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="tipo_evento">Tipo de Evento</Label>
                      <Select 
                        value={tipoEvento} 
                        onValueChange={(value) => {
                          setTipoEvento(value);
                          if (value !== 'Otro') {
                            setTipoEventoOtro('');
                            // NO actualizar el cliente automáticamente
                            // Cada oferta tiene su propio tipo_evento independiente
                            // El tipo_evento se guardará en la oferta, no en el cliente
                          }
                        }}
                        disabled={!formData.cliente_id}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar..." />
                        </SelectTrigger>
                        <SelectContent>
                          {tiposEvento.map((tipo) => (
                            <SelectItem key={tipo} value={tipo}>{tipo}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {tipoEvento === 'Otro' && (
                        <div className="mt-2">
                          <Input
                            type="text"
                            value={tipoEventoOtro}
                            onChange={(e) => setTipoEventoOtro(e.target.value)}
                            placeholder="Seleccionar..."
                            // NO actualizar el cliente automáticamente
                            // Cada oferta tiene su propio tipo_evento independiente
                          />
                        </div>
                      )}
                      <p className="text-xs text-muted-foreground">
                        Seleccione el tipo de evento para esta oferta
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Lugar del Evento */}
                      <div className="md:col-span-2 space-y-2">
                        <Label htmlFor="salon_id">
                          Lugar del Evento <span className="text-destructive">*</span>
                        </Label>
                        <select
                          id="salon_id"
                          name="salon_id"
                          value={formData.salon_id}
                          onChange={handleChange}
                          required
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <option value="">Seleccione un lugar</option>
                          {salones?.map((salon) => (
                            <option key={salon.id} value={salon.id}>
                              {salon.nombre} - Capacidad máxima: {salon.capacidad_maxima} invitados
                            </option>
                          ))}
                          <option value="otro">Otro (Sede Externa - Sin cargo de salón)</option>
                        </select>
                        {salonSeleccionado && formData.salon_id !== 'otro' && (
                          <p className="text-xs text-muted-foreground">
                            Capacidad máxima: {salonSeleccionado.capacidad_maxima} invitados
                          </p>
                        )}
                        
                        {/* Calendario - Debajo del campo Lugar del Evento */}
                        {formData.salon_id && formData.salon_id !== '' && (
                          <div className="mt-4">
                            <Card>
                              <CardHeader className="pb-3">
                                <div className="flex items-center justify-between flex-wrap gap-2">
                                  <div className="flex items-center gap-2">
                                    {/* Selector de Mes */}
                                    <Select
                                      value={mesCalendario.toString()}
                                      onValueChange={(value) => setMesCalendario(parseInt(value))}
                                    >
                                      <SelectTrigger className="w-[140px] h-8 text-xs">
                                        <SelectValue>
                                          {nombresMeses[mesCalendario - 1]}
                                        </SelectValue>
                                      </SelectTrigger>
                                      <SelectContent>
                                        {nombresMeses.map((mes, index) => (
                                          <SelectItem key={index + 1} value={(index + 1).toString()}>
                                            {mes}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                    
                                    {/* Selector de Año */}
                                    <Select
                                      value={añoCalendario.toString()}
                                      onValueChange={(value) => setAñoCalendario(parseInt(value))}
                                    >
                                      <SelectTrigger className="w-[100px] h-8 text-xs">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {añosDisponibles.map((año) => (
                                          <SelectItem key={año} value={año.toString()}>
                                            {año}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  
                                  <div className="flex items-center gap-1">
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      className="h-8 text-xs"
                                      onClick={irAlMesActual}
                                    >
                                      Hoy
                                    </Button>
                                    <div className="flex items-center border border-gray-300 dark:border-gray-700 rounded">
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 rounded-none rounded-l"
                                        onClick={() => cambiarMesCalendario('anterior')}
                                      >
                                        <ChevronLeft className="h-4 w-4" />
                                      </Button>
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 rounded-none rounded-r"
                                        onClick={() => cambiarMesCalendario('siguiente')}
                                      >
                                        <ChevronRight className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              </CardHeader>
                              <CardContent className="pt-0 p-0">
                                {cargandoEventosCalendario ? (
                                  <div className="flex items-center justify-center py-8">
                                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                                  </div>
                                ) : (
                                  <>
                                    {/* Días de la semana */}
                                    <div className="sticky top-0 z-10 bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800">
                                      <div className="grid grid-cols-7">
                                        {diasSemana.map((dia, index) => (
                                          <div
                                            key={dia}
                                            className={`
                                              p-2 text-xs font-medium text-center
                                              ${index === 0 || index === 6 
                                                ? 'text-gray-500 dark:text-gray-400' 
                                                : 'text-gray-700 dark:text-gray-300'
                                              }
                                            `}
                                          >
                                            {dia}
                                          </div>
                                        ))}
                                      </div>
                                    </div>

                                    {/* Grid del calendario mensual */}
                                    <div className="grid grid-cols-7">
                                      {renderizarCalendario()}
                                    </div>
                                  </>
                                )}
                              </CardContent>
                            </Card>
                          </div>
                        )}
                        
                        {formData.salon_id === 'otro' && (
                          <div className="space-y-2">
                            <Input
                              type="text"
                              value={lugarPersonalizado}
                              onChange={(e) => setLugarPersonalizado(e.target.value)}
                              placeholder="Especifica el lugar (ej: Universidad de Miami, Auditorio XYZ)"
                              required
                              maxLength={255}
                              className="border-amber-300 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800"
                            />
                            <p className="text-xs text-amber-700 dark:text-amber-400">
                              💡 Importante: Para sedes externas NO se cobra el salón. Solo se cobran los servicios.
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Cantidad de Invitados */}
                      <div className="space-y-2">
                        <Label htmlFor="cantidad_invitados">
                          Cantidad de Invitados <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id="cantidad_invitados"
                          type="number"
                          name="cantidad_invitados"
                          value={formData.cantidad_invitados}
                          onChange={handleChange}
                          min="1"
                          step="1"
                          required
                          placeholder="Ej: 50"
                          className={excedeCapacidad ? 'border-amber-400 bg-amber-50 dark:bg-amber-950/20' : ''}
                        />
                        {excedeCapacidad && salonSeleccionado ? (
                          <p className="text-sm text-amber-600 dark:text-amber-400 flex items-start gap-2">
                            <span>⚠</span>
                            <span>Excede la capacidad máxima del salón <strong>{salonSeleccionado.nombre}</strong> ({salonSeleccionado.capacidad_maxima} invitados). Puedes continuar, pero se te pedirá confirmación.</span>
                          </p>
                        ) : formData.cantidad_invitados && parseInt(formData.cantidad_invitados) > 0 && (
                          <p className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                            ✓ {parseInt(formData.cantidad_invitados).toLocaleString()} {parseInt(formData.cantidad_invitados) === 1 ? 'invitado' : 'invitados'}
                          </p>
                        )}
                      </div>

                      {/* Hora Inicio */}
                      <div className="md:col-span-2">
                      <Label htmlFor="hora_inicio">
                        Hora Inicio <span className="text-destructive">*</span>
                      </Label>
                      <div className="flex gap-2">
                        <select
                    name="hora_inicio_h"
                    value={formData.hora_inicio ? formData.hora_inicio.split(':')[0] : ''}
                    onChange={(e) => {
                      const hora = e.target.value;
                      const minutos = formData.hora_inicio ? formData.hora_inicio.split(':')[1] : '00';
                      const nuevaHora = hora ? `${hora}:${minutos}` : '';
                      
                      // Si hay hora de fin y la nueva hora de inicio es posterior, limpiar hora de fin
                      if (formData.hora_fin && nuevaHora) {
                        const [horaInicioNum] = nuevaHora.split(':').map(Number);
                        const [horaFinNum] = formData.hora_fin.split(':').map(Number);
                        
                        // Si la hora de inicio es mayor que la hora de fin, limpiar hora de fin
                        if (horaInicioNum > horaFinNum) {
                          handleChange({ target: { name: 'hora_fin', value: '' } });
                        } else if (horaInicioNum === horaFinNum) {
                          // Si es la misma hora, verificar minutos
                          const [minutosInicioNum] = nuevaHora.split(':').map(Number);
                          const [minutosFinNum] = formData.hora_fin.split(':').map(Number);
                          if (minutosInicioNum > minutosFinNum) {
                            handleChange({ target: { name: 'hora_fin', value: '' } });
                          }
                        }
                      }
                      
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
                      
                      // Si hay hora de fin y la nueva hora de inicio es posterior, limpiar hora de fin
                      if (formData.hora_fin && nuevaHora) {
                        const [horaInicioNum, minutosInicioNum] = nuevaHora.split(':').map(Number);
                        const [horaFinNum, minutosFinNum] = formData.hora_fin.split(':').map(Number);
                        
                        // Si la hora de inicio es mayor que la hora de fin, limpiar hora de fin
                        if (horaInicioNum > horaFinNum) {
                          handleChange({ target: { name: 'hora_fin', value: '' } });
                        } else if (horaInicioNum === horaFinNum && minutosInicioNum > minutosFinNum) {
                          // Si es la misma hora pero minutos mayores, limpiar hora de fin
                          handleChange({ target: { name: 'hora_fin', value: '' } });
                        }
                      }
                      
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
                ) : cargandoHorasOcupadas && formData.salon_id !== 'otro' ? (
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

                    {/* Hora Fin */}
                    <div className="md:col-span-2">
                    <Label htmlFor="hora_fin">
                      Hora Fin <span className="text-destructive">*</span>
                    </Label>
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
                    {(() => {
                      // Obtener hora de inicio para comparar
                      let horaInicioNum = null;
                      let minutosInicioNum = 0;
                      if (formData.hora_inicio) {
                        const [horaInicio, minutosInicio] = formData.hora_inicio.split(':');
                        horaInicioNum = parseInt(horaInicio);
                        minutosInicioNum = parseInt(minutosInicio) || 0;
                      }
                      
                      return Array.from({ length: 12 }, (_, i) => {
                        const hora = 12 + i; // Desde las 12:00 PM (12) hasta las 11:00 PM (23)
                        const horaOcupada = horasOcupadas.includes(hora);
                        
                        // Verificar si la hora es anterior a la hora de inicio
                        let esAnteriorAInicio = false;
                        if (horaInicioNum !== null) {
                          if (hora < horaInicioNum) {
                            esAnteriorAInicio = true;
                          } else if (hora === horaInicioNum) {
                            // Si es la misma hora, verificar minutos (pero como solo mostramos :00, siempre permitir la misma hora)
                            // La validación de minutos se hará en el selector de minutos
                            esAnteriorAInicio = false;
                          }
                        }
                        
                        // Verificar si el rango completo (hora_inicio a esta hora) se solapa con horas ocupadas
                        let rangoSeSolapa = false;
                        if (formData.hora_inicio && !esAnteriorAInicio) {
                          const horaFinPropuesta = `${hora.toString().padStart(2, '0')}:00`;
                          rangoSeSolapa = verificarRangoOcupado(formData.hora_inicio, horaFinPropuesta);
                        }
                        
                        return (
                          <option 
                            key={hora} 
                            value={hora.toString().padStart(2, '0')}
                            disabled={horaOcupada || esAnteriorAInicio || rangoSeSolapa}
                          >
                            {hora === 12 ? '12:00 PM' : `${hora - 12}:00 PM`}
                            {horaOcupada ? ' (Ocupada)' : ''}
                            {esAnteriorAInicio ? ' (Anterior a inicio)' : ''}
                            {rangoSeSolapa ? ' (Cruza evento ocupado)' : ''}
                          </option>
                        );
                      });
                    })()}
                    {/* Horas después de medianoche permitidas */}
                    {(() => {
                      // Obtener hora de inicio para comparar
                      let horaInicioNum = null;
                      if (formData.hora_inicio) {
                        const [horaInicio] = formData.hora_inicio.split(':');
                        horaInicioNum = parseInt(horaInicio);
                      }
                      
                      // Las horas después de medianoche (00, 01, 02) siempre son válidas si la hora de inicio es tarde
                      // porque representan el día siguiente
                      const horasMedianoche = [
                        { value: '00', label: '12:00 AM (día siguiente)', hora: 0 },
                        { value: '01', label: '1:00 AM (día siguiente)', hora: 1 },
                        { value: '02', label: '2:00 AM (día siguiente)', hora: 2 }
                      ];
                      
                      return horasMedianoche.map(({ value, label, hora }) => {
                        const horaOcupada = horasOcupadas.includes(hora);
                        // Las horas después de medianoche (00, 01, 02) representan el día siguiente
                        // Siempre son válidas si la hora de inicio es tarde (>= 10 PM) para permitir cruce de medianoche
                        // O si la hora de inicio ya es después de medianoche (0, 1, 2)
                        let esValidaMedianoche = true;
                        if (horaInicioNum !== null) {
                          // Si la hora de inicio es temprana (10 AM a 9:59 PM), las horas después de medianoche SÍ son válidas
                          // porque representan el día siguiente (cruce de medianoche)
                          // Solo no son válidas si la hora de inicio es muy temprana (antes de 10 AM)
                          if (horaInicioNum < 10) {
                            // Hora de inicio antes de las 10 AM - no permitir horas después de medianoche
                            esValidaMedianoche = false;
                          } else {
                            // Hora de inicio >= 10 AM - permitir horas después de medianoche (cruce de medianoche)
                            esValidaMedianoche = true;
                          }
                        }
                        
                        // Verificar si el rango completo (hora_inicio a esta hora) se solapa con horas ocupadas
                        let rangoSeSolapa = false;
                        if (formData.hora_inicio && esValidaMedianoche) {
                          const horaFinPropuesta = `${value}:00`;
                          rangoSeSolapa = verificarRangoOcupado(formData.hora_inicio, horaFinPropuesta);
                        }
                        
                        return (
                          <option 
                            key={value} 
                            value={value}
                            disabled={horaOcupada || !esValidaMedianoche || rangoSeSolapa}
                          >
                            {label}{horaOcupada ? ' (Ocupada)' : ''}
                            {!esValidaMedianoche ? ' (Anterior a inicio)' : ''}
                            {rangoSeSolapa ? ' (Cruza evento ocupado)' : ''}
                          </option>
                        );
                      });
                    })()}
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
                    {(() => {
                      // Obtener hora y minutos de inicio para comparar
                      let horaInicioNum = null;
                      let minutosInicioNum = 0;
                      let horaFinNum = null;
                      
                      if (formData.hora_inicio) {
                        const [horaInicio, minutosInicio] = formData.hora_inicio.split(':');
                        horaInicioNum = parseInt(horaInicio);
                        minutosInicioNum = parseInt(minutosInicio) || 0;
                      }
                      
                      if (formData.hora_fin) {
                        const [horaFin] = formData.hora_fin.split(':');
                        horaFinNum = parseInt(horaFin);
                      }
                      
                      const opcionesMinutos = [
                        { value: '00', minutos: 0 },
                        { value: '15', minutos: 15 },
                        { value: '30', minutos: 30 },
                        { value: '45', minutos: 45 }
                      ];
                      
                      return opcionesMinutos.map(({ value, minutos }) => {
                        // Si la hora de fin es la misma que la de inicio, los minutos deben ser >= minutos de inicio
                        let esAnteriorAInicio = false;
                        if (horaInicioNum !== null && horaFinNum !== null && horaFinNum === horaInicioNum) {
                          if (minutos < minutosInicioNum) {
                            esAnteriorAInicio = true;
                          }
                        }
                        
                        return (
                          <option 
                            key={value} 
                            value={value}
                            disabled={esAnteriorAInicio}
                          >
                            :{value}
                          </option>
                        );
                      });
                    })()}
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
                </div>

                {errorHorario && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
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
                  <div>
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
              </CardContent>
            </Card>

            </div>
          )}

          {/* PASO 3: Paquete y Temporada */}
          {pasoActual === 3 && (
          <>
          <Card>
            <CardHeader>
              <CardTitle>Paquete y Temporada</CardTitle>
            </CardHeader>
            <CardContent>
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
                    Seleccionar paquete...
                  </option>
                  {paquetes?.filter(p => {
                    // Si es sede externa (otro), solo mostrar paquete personalizado
                    if (formData.salon_id === 'otro') {
                      const nombrePaquete = p.nombre?.toLowerCase().trim() || '';
                      return nombrePaquete.includes('personalizado');
                    }
                    
                    // Si es salón de la empresa, filtrar los disponibles
                    if (p.disponible_salon === false) {
                      return false;
                    }
                    
                    // Si es paquete "Especial", solo mostrarlo si:
                    // 1. La hora de inicio está entre 10:00 AM y 5:00 PM
                    // 2. La hora de fin es a las 5:00 PM o antes
                    const esPaqueteEspecial = p.nombre?.toLowerCase().includes('especial');
                    if (esPaqueteEspecial) {
                      // Si no hay hora de inicio o hora de fin, no mostrar el paquete "Especial"
                      if (!formData.hora_inicio || !formData.hora_fin) {
                        return false;
                      }
                      
                      const [horaInicio, minutosInicio] = formData.hora_inicio.split(':').map(Number);
                      const horaInicioEnMinutos = horaInicio * 60 + minutosInicio;
                      
                      const [horaFin, minutosFin] = formData.hora_fin.split(':').map(Number);
                      const horaFinEnMinutos = horaFin * 60 + minutosFin;
                      
                      // 10:00 AM = 10:00 = 600 minutos
                      // 5:00 PM = 17:00 = 1020 minutos
                      const horaMinima = 10 * 60; // 10:00 AM
                      const horaMaxima = 17 * 60; // 5:00 PM (17:00)
                      
                      // Verificar que la hora de inicio esté entre 10 AM y 5 PM
                      if (horaInicioEnMinutos < horaMinima || horaInicioEnMinutos > horaMaxima) {
                        return false;
                      }
                      
                      // Verificar que la hora de fin sea a las 5 PM o antes (17:00 = 1020 minutos)
                      if (horaFinEnMinutos > horaMaxima) {
                        return false;
                      }
                    }
                    
                    return true;
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
                {formData.salon_id && formData.salon_id !== 'otro' && formData.hora_inicio && formData.hora_fin && (() => {
                  const [horaInicio, minutosInicio] = formData.hora_inicio.split(':').map(Number);
                  const horaInicioEnMinutos = horaInicio * 60 + minutosInicio;
                  const [horaFin, minutosFin] = formData.hora_fin.split(':').map(Number);
                  const horaFinEnMinutos = horaFin * 60 + minutosFin;
                  const horaMinima = 10 * 60; // 10:00 AM
                  const horaMaxima = 17 * 60; // 5:00 PM (17:00)
                  
                  const inicioFueraDelRango = horaInicioEnMinutos < horaMinima || horaInicioEnMinutos > horaMaxima;
                  const finDespuesDe5PM = horaFinEnMinutos > horaMaxima;
                  
                  if (inicioFueraDelRango || finDespuesDe5PM) {
                    return (
                      <p className="text-xs text-blue-600 mt-1">
                        ℹ️ El paquete "Especial" solo está disponible de 10:00 AM a 5:00 PM. El evento debe terminar a las 5:00 PM o antes.
                      </p>
                    );
                  }
                  return null;
                })()}
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
                            Ajuste: +${formData.salon_id === 'otro' ? 0 : (temporadas.find(t => t.id === parseInt(formData.temporada_id))?.ajuste_precio || 0)}
                            {formData.salon_id === 'otro' && ' (Sede externa: sin ajuste de temporada)'}
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
                          placeholder={`Original: $${formData.salon_id === 'otro' ? 0 : (temporadas.find(t => t.id === parseInt(formData.temporada_id))?.ajuste_precio || 0)}`}
                          value={formData.salon_id === 'otro' ? '0' : ajusteTemporadaCustom}
                          onChange={(e) => {
                            if (formData.salon_id === 'otro') {
                              // No permitir cambiar el ajuste si es sede externa
                              return;
                            }
                            setAjusteTemporadaCustom(e.target.value);
                          }}
                          disabled={formData.salon_id === 'otro'}
                          className="w-full px-2 py-1 text-sm border border-amber-300 rounded focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
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
            </CardContent>
          </Card>

          {/* Servicios Incluidos en el Paquete */}
          {paqueteSeleccionado && paqueteSeleccionado.paquetes_servicios?.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Servicios Incluidos en {paqueteSeleccionado.nombre}</CardTitle>
              </CardHeader>
              <CardContent>
              <div className="space-y-6">
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
                    
                    // Filtrar servicios exclusivos de Diamond si el salón NO es Diamond
                    const serviciosExclusivosDiamond = [
                      'Lounge Set + Coctel Dream',
                      'Terraza decorada'
                    ];
                    
                    if (serviciosExclusivosDiamond.includes(nombreServicio)) {
                      const nombreSalon = salonSeleccionado?.nombre?.toLowerCase().trim() || '';
                      const esDiamond = nombreSalon.includes('diamond');
                      
                      if (!esDiamond) {
                        return; // No mostrar estos servicios si no es Diamond
                      }
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
                          
                          // Filtrar servicios exclusivos de Diamond si el salón NO es Diamond
                          const serviciosExclusivosDiamond = [
                            'Lounge Set + Coctel Dream',
                            'Terraza decorada'
                          ];
                          
                          if (serviciosExclusivosDiamond.includes(otroNombre)) {
                            const nombreSalon = salonSeleccionado?.nombre?.toLowerCase().trim() || '';
                            const esDiamond = nombreSalon.includes('diamond');
                            if (!esDiamond) {
                              return false; // Excluir del grupo si no es Diamond
                            }
                          }
                          
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
                    
                    // IMPORTANTE: Agregar primero el que está en el paquete para que sea el valor por defecto
                    // Si el paquete tiene Sidra, agregar Sidra primero; si tiene Champaña, agregar Champaña primero
                    if (tieneSidra && sidraPaquete) {
                      // El paquete tiene Sidra, agregar Sidra primero
                      grupoSidraChampana.push(sidraPaquete);
                      serviciosProcesados.add(sidraPaquete.servicio_id);
                      
                      // Luego agregar Champaña (temporal si no está en el paquete)
                      if (champanaPaquete) {
                        grupoSidraChampana.push(champanaPaquete);
                        serviciosProcesados.add(champanaPaquete.servicio_id);
                      } else if (champanaServicio) {
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
                    } else if (tieneChampana && champanaPaquete) {
                      // El paquete tiene Champaña, agregar Champaña primero
                      grupoSidraChampana.push(champanaPaquete);
                      serviciosProcesados.add(champanaPaquete.servicio_id);
                      
                      // Luego agregar Sidra (temporal si no está en el paquete)
                      if (sidraPaquete) {
                        grupoSidraChampana.push(sidraPaquete);
                        serviciosProcesados.add(sidraPaquete.servicio_id);
                      } else if (sidraServicio) {
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
                    }
                    
                    // Si tenemos ambas opciones, crear el grupo excluyente
                    if (grupoSidraChampana.length === 2) {
                      gruposExcluyentes.push(grupoSidraChampana);
                    }
                  }
                  
                  // Agrupar servicios normales por categoría
                  const serviciosPorCategoria = serviciosNormales.reduce((acc, ps) => {
                    const categoria = obtenerCategoriaServicio(ps.servicios?.nombre, ps.servicios);
                    if (!acc[categoria]) {
                      acc[categoria] = [];
                    }
                    acc[categoria].push(ps);
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

                  return (
                    <>
                      {/* Servicios normales (no excluyentes) - Agrupados por categoría */}
                      {serviciosNormales.length > 0 && (
                        <div className="space-y-6">
                          {categoriasOrdenadas.map((categoria) => (
                            <div key={categoria} className="space-y-3">
                              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 pb-2 border-b border-border">
                                <div className="w-1 h-5 bg-primary rounded-full"></div>
                                {categoria}
                              </h3>
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                {serviciosPorCategoria[categoria].map((ps) => (
                                  <div 
                                    key={ps.id} 
                                    className="group relative flex items-center gap-3 p-3 rounded-lg border border-green-200 bg-green-50/50 hover:bg-green-50 hover:border-green-300 transition-all dark:bg-green-950/20 dark:border-green-800"
                                  >
                                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                                      <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-medium text-foreground truncate">
                                        {obtenerNombreServicio(ps.servicios?.nombre)}
                                      </p>
                                      {ps.servicios?.descripcion && (
                                        <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                                          {obtenerDescripcionServicio(ps.servicios.descripcion)}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {/* Grupos de servicios excluyentes (con selector) */}
                      {gruposExcluyentes.map((grupo, idx) => {
                        const grupoKey = `grupo_${idx}`;
                        // Determinar valor por defecto: si el grupo contiene Sidra/Champaña, usar el que está en el paquete
                        let valorPorDefecto = grupo[0].servicio_id;
                        if (grupo.length === 2) {
                          const tieneSidra = grupo.some(ps => ps.servicios?.nombre === 'Sidra');
                          const tieneChampana = grupo.some(ps => ps.servicios?.nombre === 'Champaña');
                          if (tieneSidra && tieneChampana) {
                            // Si el paquete tiene Sidra, usar Sidra por defecto; si tiene Champaña, usar Champaña
                            const sidraEnPaquete = paqueteSeleccionado?.paquetes_servicios?.some(ps => ps.servicios?.nombre === 'Sidra');
                            const champanaEnPaquete = paqueteSeleccionado?.paquetes_servicios?.some(ps => ps.servicios?.nombre === 'Champaña');
                            if (sidraEnPaquete) {
                              const sidraServicio = grupo.find(ps => ps.servicios?.nombre === 'Sidra');
                              valorPorDefecto = sidraServicio?.servicio_id || grupo[0].servicio_id;
                            } else if (champanaEnPaquete) {
                              const champanaServicio = grupo.find(ps => ps.servicios?.nombre === 'Champaña');
                              valorPorDefecto = champanaServicio?.servicio_id || grupo[0].servicio_id;
                            }
                          }
                        }
                        const seleccionado = serviciosExcluyentesSeleccionados[grupoKey] || valorPorDefecto;
                        
                        return (
                          <div key={grupoKey} className="p-4 rounded-lg border border-primary/20 bg-primary/5">
                            <p className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                              <span className="text-primary">🎯</span>
                              Selecciona una opción:
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {grupo.map((ps) => (
                                <label 
                                  key={ps.servicio_id}
                                  className={`
                                    relative flex items-start gap-3 p-4 rounded-lg cursor-pointer transition-all border-2
                                    ${seleccionado === ps.servicio_id 
                                      ? 'bg-primary/10 border-primary shadow-sm' 
                                      : 'bg-background border-border hover:border-primary/50 hover:bg-accent/50'
                                    }
                                  `}
                                >
                                  <input
                                    type="radio"
                                    name={grupoKey}
                                    value={ps.servicio_id}
                                    checked={seleccionado === ps.servicio_id}
                                    onChange={(e) => {
                                      const nuevoValor = parseInt(e.target.value);
                                      setServiciosExcluyentesSeleccionados({
                                        ...serviciosExcluyentesSeleccionados,
                                        [grupoKey]: nuevoValor
                                      });
                                    }}
                                    className="mt-0.5 w-4 h-4 text-primary"
                                  />
                                  <div className="flex-1 min-w-0">
                                    <span className="font-medium text-foreground block">
                                      {obtenerNombreServicio(ps.servicios?.nombre)}
                                    </span>
                                    {ps.servicios?.descripcion && (
                                      <span className="text-xs text-muted-foreground block mt-1">
                                        {obtenerDescripcionServicio(ps.servicios.descripcion)}
                                      </span>
                                    )}
                                  </div>
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
              </CardContent>
            </Card>
          )}
          </>
          )}

          {/* PASO 4: Servicios Adicionales */}
          {pasoActual === 4 && (
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Servicios Adicionales</h2>
            
            {/* Alerta de Horas Extras Necesarias */}
            {(() => {
              const { necesarias, duracionEvento, duracionTotal } = calcularHorasExtras();
              
              if (necesarias > 0) {
                const horaExtraServicio = servicios?.find(s => s.nombre === 'Hora Extra');
                if (!horaExtraServicio) return null;

                const cantidadAgregada = serviciosSeleccionados.find(
                  s => s.servicio_id === horaExtraServicio.id
                )?.cantidad || 0;

                const faltante = necesarias - cantidadAgregada;

                if (faltante > 0) {
                  return (
                    <div className="mb-6 p-4 bg-red-50 border-2 border-red-400 rounded-lg">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-10 h-10 bg-red-500 rounded-full flex items-center justify-center text-white font-bold text-xl">
                          ⚠️
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-red-900 mb-2">
                            ¡Se requieren horas extras!
                          </h3>
                          <p className="text-sm text-red-800 mb-3">
                            Tu evento dura <strong>{duracionEvento.toFixed(1)} horas</strong> pero el paquete "<strong>{paqueteSeleccionado.nombre}</strong>" incluye solo <strong>{duracionTotal} horas</strong>.
                          </p>
                          <div className="bg-white rounded-lg p-3 border border-red-300">
                            <p className="text-sm font-semibold text-gray-900 mb-2">
                              📋 Resumen:
                            </p>
                            <ul className="text-sm text-gray-700 space-y-1">
                              <li>• Horas extras <u>adicionales</u> necesarias: <strong>{necesarias} hora(s)</strong></li>
                              <li>• Horas extras adicionales agregadas: <strong>{cantidadAgregada} hora(s)</strong></li>
                              <li className="text-red-700 font-bold">
                                • <span className="bg-red-100 px-2 py-0.5 rounded">Faltan: {faltante} hora(s) extra</span> a ${horaExtraServicio.precio_base} c/u = ${faltante * horaExtraServicio.precio_base}
                              </li>
                            </ul>
                          </div>
                          <p className="text-xs text-red-700 mt-3 font-medium">
                            💡 <strong>Acción requerida:</strong> Busca "Hora Extra" abajo y agrégala {faltante} {faltante === 1 ? 'vez' : 'veces'}.
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                }
              }

              return null;
            })()}
            
            {(() => {
              // Filtrar servicios disponibles (no incluidos en el paquete o solo los NO seleccionados de grupos excluyentes)
              const serviciosPaqueteActivos = getServiciosPaqueteSeleccionados();
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
                
                // Filtrar servicios de "Persona Adicional" (el sistema lo calcula automáticamente)
                if (s.nombre?.includes('Persona Adicional Temporada Alta') || s.nombre?.includes('Persona Adicional Temporada Baja/Media')) {
                  return false;
                }
                
                // EXCEPCIÓN: "Hora Extra" siempre debe estar disponible (se puede contratar múltiples veces)
                if (s.nombre === 'Hora Extra') return true;
                
                // EXCEPCIÓN: Personal (Bartender y Personal de Atención) siempre debe estar disponible como extra
                // Incluso si ya está en el paquete, se puede agregar más personal
                if (s.nombre === 'Bartender' || s.nombre === 'Personal de Atención' || s.nombre === 'Personal de Servicio') {
                  return true;
                }
                
                // REGLA ESPECIAL: Si el paquete tiene Photobooth 360 o Print seleccionado, NO mostrar el seleccionado en servicios adicionales
                // Solo mostrar la alternativa (la que NO está seleccionada)
                // IMPORTANTE: Cuando están como extras (no en el paquete), NO se bloquean entre sí
                if (s.nombre === 'Photobooth 360' || s.nombre === 'Photobooth Print') {
                  // Solo bloquear si el servicio está en el paquete
                  if (servicioPhotoboothSeleccionado === 'Photobooth 360' && s.nombre === 'Photobooth 360') {
                    return false; // NO mostrar Photobooth 360 si ya está seleccionado en el paquete
                  }
                  if (servicioPhotoboothSeleccionado === 'Photobooth Print' && s.nombre === 'Photobooth Print') {
                    return false; // NO mostrar Photobooth Print si ya está seleccionado en el paquete
                  }
                  // Si no está seleccionado en el paquete, sí mostrarlo (puede seleccionarse como extra)
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
                
                // Obtener servicios del paquete
                const serviciosPaquete = getServiciosPaqueteSeleccionados();
                
                // REGLA ESPECÍFICA: Deluxe - NO mostrar Foto y Video 3h si el paquete tiene Foto y Video 5h (5h es mejor)
                if (paqueteSeleccionado?.nombre?.toLowerCase().includes('deluxe') &&
                    s.nombre === 'Foto y Video 3 Horas') {
                  const tieneFoto5h = serviciosPaquete.some(ps => ps.servicios?.nombre === 'Foto y Video 5 Horas');
                  if (tieneFoto5h) {
                    return false; // NO mostrar Foto 3h si el paquete tiene 5h (5h es mejor)
                  }
                }
                
                // REGLA ESPECÍFICA: Diamond - NO mostrar Foto y Video 3h si ya está incluida
                if (paqueteSeleccionado?.nombre?.toLowerCase().includes('diamond') &&
                    !paqueteSeleccionado?.nombre?.toLowerCase().includes('deluxe') &&
                    s.nombre === 'Foto y Video 3 Horas') {
                  const tieneFoto3h = serviciosPaquete.some(ps => ps.servicios?.nombre === 'Foto y Video 3 Horas');
                  if (tieneFoto3h) {
                    return false; // NO mostrar Foto 3h si ya está en el paquete
                  }
                }
                
                // REGLA: Si el paquete tiene Premium/Plus, NO mostrar Básico
                const tienePremiumEnPaquete = serviciosPaquete.some(ps => {
                  const nombreServicio = ps.servicios?.nombre;
                  return nombreServicio === 'Licor Premium' || nombreServicio === 'Decoración Plus';
                });
                
                if (tienePremiumEnPaquete) {
                  if (s.nombre === 'Licor House' || s.nombre === 'Decoracion House') {
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
                    return sData?.nombre === 'Licor House';
                  });
                  const tieneDecoracionPlusEnAdicionales = serviciosSeleccionados.some(sel => {
                    const sData = servicios?.find(srv => srv.id === parseInt(sel.servicio_id));
                    return sData?.nombre === 'Decoración Plus';
                  });
                  const tieneDecoracionBasicaEnAdicionales = serviciosSeleccionados.some(sel => {
                    const sData = servicios?.find(srv => srv.id === parseInt(sel.servicio_id));
                    return sData?.nombre === 'Decoracion House';
                  });
                  
                  // Verificar en el paquete
                  const tieneLicorPremiumEnPaquete = serviciosPaquete.some(ps => ps.servicios?.nombre === 'Licor Premium');
                  const tieneLicorBasicoEnPaquete = serviciosPaquete.some(ps => ps.servicios?.nombre === 'Licor House');
                  const tieneDecoracionPlusEnPaquete = serviciosPaquete.some(ps => ps.servicios?.nombre === 'Decoración Plus');
                  const tieneDecoracionBasicaEnPaquete = serviciosPaquete.some(ps => ps.servicios?.nombre === 'Decoracion House');
                  
                  // Combinar verificaciones (paquete O adicionales)
                  const tieneLicorPremium = tieneLicorPremiumEnPaquete || tieneLicorPremiumEnAdicionales;
                  const tieneLicorBasico = tieneLicorBasicoEnPaquete || tieneLicorBasicoEnAdicionales;
                  const tieneDecoracionPlus = tieneDecoracionPlusEnPaquete || tieneDecoracionPlusEnAdicionales;
                  const tieneDecoracionBasica = tieneDecoracionBasicaEnPaquete || tieneDecoracionBasicaEnAdicionales;
                  
                  if (s.nombre === 'Licor Premium' && tieneLicorBasico) {
                    return false; // NO mostrar Premium si tiene Básico (excluyentes)
                  }
                  if (s.nombre === 'Licor House' && tieneLicorPremium) {
                    return false; // NO mostrar Básico si tiene Premium (excluyentes)
                  }
                  if (s.nombre === 'Decoración Plus' && tieneDecoracionBasica) {
                    return false; // NO mostrar Plus si tiene Básica (excluyentes)
                  }
                  if (s.nombre === 'Decoracion House' && tieneDecoracionPlus) {
                    return false; // NO mostrar Básica si tiene Plus (excluyentes)
                  }
                }
                
                // REGLA: Servicios de decoración exclusivos de Diamond
                // "Lounge Set + Coctel Dream" y "Terraza decorada" solo disponibles en Diamond
                const serviciosExclusivosDiamond = [
                  'Lounge Set + Coctel Dream',
                  'Terraza decorada'
                ];
                
                if (serviciosExclusivosDiamond.includes(s.nombre)) {
                  // Verificar si el salón seleccionado es Diamond
                  const salonSeleccionado = salones?.find(sal => sal.id === parseInt(formData.salon_id));
                  const nombreSalonSeleccionado = salonSeleccionado?.nombre?.toLowerCase().trim() || '';
                  const esDiamond = nombreSalonSeleccionado.includes('diamond');
                  
                  if (!esDiamond) {
                    return false; // No mostrar estos servicios si no es Diamond
                  }
                }
                
                // Verificar si está en el paquete (comparar como números para evitar problemas de tipos)
                const estaEnPaquete = paqueteSeleccionado?.paquetes_servicios?.some(
                  ps => parseInt(ps.servicio_id) === parseInt(s.id)
                );

                // FIX: Comparar correctamente los IDs (convertir a número para evitar problemas de tipos)
                // Verificar si el servicio está ACTIVO en el paquete (seleccionado en grupos excluyentes)
                const estaActivo = serviciosPaqueteActivos.some(ps => {
                  const psId = parseInt(ps.servicio_id || ps.servicios?.id || ps.id);
                  const sId = parseInt(s.id);
                  return psId === sId;
                });

                // También verificar por nombre del servicio como fallback (por si hay problemas con IDs)
                const estaActivoPorNombre = serviciosPaqueteActivos.some(ps => {
                  const nombrePs = ps.servicios?.nombre || ps.nombre;
                  return nombrePs === s.nombre;
                });

                // REGLA: Permitir mostrar upgrades según reglas del paquete
                const esUpgradeDisponible =
                  (s.nombre === 'Licor Premium' && reglasPaquete.permiteUpgradeLicor && serviciosPaqueteActivos.some(ps => ps.servicios?.nombre === 'Licor House')) ||
                  (s.nombre === 'Decoración Plus' && reglasPaquete.permiteUpgradeDecoracion && serviciosPaqueteActivos.some(ps => ps.servicios?.nombre === 'Decoracion House')) ||
                  (s.nombre === 'Foto y Video 5 Horas' && reglasPaquete.permiteFotoVideo && !reglasPaquete.excluyeFoto5hSiTiene3h && serviciosPaqueteActivos.some(ps => ps.servicios?.nombre === 'Foto y Video 3 Horas'));

                // Si NO está en el paquete, está disponible como servicio adicional
                if (!estaEnPaquete) return true;

                // Si está en el paquete Y está activo (seleccionado), NO mostrar (ya está incluido)
                if (estaActivo || estaActivoPorNombre) return false;

                // Si está en el paquete pero NO está activo, verificar si es un upgrade permitido
                if (esUpgradeDisponible) return true;

                // Si está en el paquete pero NO está activo y NO es upgrade, NO mostrar
                // (es un servicio del grupo excluyente que no fue seleccionado)
                return false;
              }) || [];

              // FIX: Deduplicar servicios por ID Y por nombre antes de agrupar por categoría
              // Esto previene servicios duplicados que puedan pasar el filtro
              const serviciosUnicos = [];
              const idsVistos = new Set();
              const nombresVistos = new Set();
              serviciosDisponibles.forEach(servicio => {
                const servicioId = parseInt(servicio.id);
                const servicioNombre = servicio.nombre?.toLowerCase().trim();
                // Solo agregar si no hemos visto ni el ID ni el nombre
                if (!idsVistos.has(servicioId) && !nombresVistos.has(servicioNombre)) {
                  idsVistos.add(servicioId);
                  if (servicioNombre) nombresVistos.add(servicioNombre);
                  serviciosUnicos.push(servicio);
                }
              });

              // Agrupar por categoría usando servicios únicos
              const serviciosPorCategoria = serviciosUnicos.reduce((acc, servicio) => {
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
                            
                            // Verificar si es "Hora Extra" y se necesita
                            const { necesarias } = calcularHorasExtras();
                            const esHoraExtra = servicio.nombre === 'Hora Extra';
                            const necesitaHoraExtra = esHoraExtra && necesarias > 0 && cantidad < necesarias;
                            
                            // Verificar si hay un servicio excluyente en servicios adicionales
                            // EXCEPCIÓN: En paquetes Especial y Personalizado, Sidra y Champaña NO son excluyentes
                            const esPaqueteEspecialOPersonalizado = paqueteSeleccionado?.nombre?.toLowerCase().includes('especial') || 
                                                                      paqueteSeleccionado?.nombre?.toLowerCase().includes('personalizado');
                            const esSidraOChampana = servicio.nombre === 'Sidra' || servicio.nombre === 'Champaña';
                            const esPhotobooth = servicio.nombre === 'Photobooth 360' || servicio.nombre === 'Photobooth Print';
                            
                            // REGLA ESPECIAL: Photobooth 360 y Print NO se bloquean entre sí cuando están como extras
                            // Solo se bloquean si uno está en el paquete
                            const tieneExcluyenteEnAdicionales = !(esPaqueteEspecialOPersonalizado && esSidraOChampana) && 
                              !(esPhotobooth) && // Photobooth NO se bloquea entre sí cuando están como extras
                              serviciosExcluyentes[servicio.nombre] && 
                              serviciosSeleccionados.some(s => {
                                const sData = servicios?.find(srv => srv.id === parseInt(s.servicio_id));
                                return sData && serviciosExcluyentes[servicio.nombre].includes(sData.nombre);
                              });
                            
                            // Verificar si hay un servicio excluyente incluido en el paquete (solo los realmente seleccionados)
                            const serviciosPaquete = getServiciosPaqueteSeleccionados();
                            const reglasPaquete = obtenerReglasExclusionPorPaquete(paqueteSeleccionado?.nombre);
                            
                            // REGLA ESPECIAL: Para Photobooth, si uno está en el paquete, el otro DEBE estar disponible como adicional
                            // IMPORTANTE: Cuando están como extras (no en el paquete), NO se bloquean entre sí
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
                            } else if (esPhotobooth && !servicioPhotoboothSeleccionado) {
                              // Si NO hay Photobooth en el paquete, NO son excluyentes entre sí cuando están como extras
                              // Permitir seleccionar ambos Photobooth como extras
                              tieneExcluyenteEnPaquete = false;
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
                              serviciosPaquete.some(ps => {
                                return ps.servicios && serviciosExcluyentes[servicio.nombre].includes(ps.servicios.nombre);
                              });
                            }
                            
                            // NUEVA LÓGICA: Permitir upgrade según reglas del paquete
                            const esUpgradePermitido = 
                              (servicio.nombre === 'Licor Premium' && reglasPaquete.permiteUpgradeLicor && serviciosPaquete.some(ps => ps.servicios?.nombre === 'Licor House')) ||
                              (servicio.nombre === 'Decoración Plus' && reglasPaquete.permiteUpgradeDecoracion && serviciosPaquete.some(ps => ps.servicios?.nombre === 'Decoracion House')) ||
                              (servicio.nombre === 'Foto y Video 5 Horas' && reglasPaquete.permiteFotoVideo && !reglasPaquete.excluyeFoto5hSiTiene3h && serviciosPaquete.some(ps => ps.servicios?.nombre === 'Foto y Video 3 Horas'));
                            
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
                                return sData?.nombre === 'Licor House';
                              });
                              const tieneDecoracionPlusEnAdicionales = serviciosSeleccionados.some(sel => {
                                const sData = servicios?.find(srv => srv.id === parseInt(sel.servicio_id));
                                return sData?.nombre === 'Decoración Plus';
                              });
                              const tieneDecoracionBasicaEnAdicionales = serviciosSeleccionados.some(sel => {
                                const sData = servicios?.find(srv => srv.id === parseInt(sel.servicio_id));
                                return sData?.nombre === 'Decoracion House';
                              });
                              
                              // Verificar en el paquete
                              const tieneLicorPremiumEnPaquete = serviciosPaquete.some(ps => ps.servicios?.nombre === 'Licor Premium');
                              const tieneLicorBasicoEnPaquete = serviciosPaquete.some(ps => ps.servicios?.nombre === 'Licor House');
                              const tieneDecoracionPlusEnPaquete = serviciosPaquete.some(ps => ps.servicios?.nombre === 'Decoración Plus');
                              const tieneDecoracionBasicaEnPaquete = serviciosPaquete.some(ps => ps.servicios?.nombre === 'Decoracion House');
                              
                              // Combinar verificaciones (paquete O adicionales)
                              const tieneLicorPremium = tieneLicorPremiumEnPaquete || tieneLicorPremiumEnAdicionales;
                              const tieneLicorBasico = tieneLicorBasicoEnPaquete || tieneLicorBasicoEnAdicionales;
                              const tieneDecoracionPlus = tieneDecoracionPlusEnPaquete || tieneDecoracionPlusEnAdicionales;
                              const tieneDecoracionBasica = tieneDecoracionBasicaEnPaquete || tieneDecoracionBasicaEnAdicionales;
                              
                              if (servicio.nombre === 'Licor Premium' && tieneLicorBasico) {
                                esExcluyenteSegunPaquete = true;
                              }
                              if (servicio.nombre === 'Licor House' && tieneLicorPremium) {
                                esExcluyenteSegunPaquete = true;
                              }
                              if (servicio.nombre === 'Decoración Plus' && tieneDecoracionBasica) {
                                esExcluyenteSegunPaquete = true;
                              }
                              if (servicio.nombre === 'Decoracion House' && tieneDecoracionPlus) {
                                esExcluyenteSegunPaquete = true;
                              }
                            }
                            
                            // Solo considerar excluyente si NO es un upgrade permitido Y no está excluido por reglas del paquete
                            const tieneExcluyenteSeleccionado = !esUpgradePermitido && !esExcluyenteSegunPaquete && (tieneExcluyenteEnAdicionales || tieneExcluyenteEnPaquete);
                            
                            // Verificar si realmente está incluido en el paquete (para mostrar "Ya incluido")
                            const estaRealmenteIncluido = serviciosPaquete.some(ps => ps.servicio_id === servicio.id);
                            const mostrarYaIncluido = estaRealmenteIncluido && !esUpgradePermitido;

                            return (
                              <div
                                key={servicio.id}
                                className={`
                                  relative p-4 rounded-lg border-2 transition-all
                                  ${necesitaHoraExtra
                                    ? 'border-red-500 bg-red-50 shadow-lg ring-2 ring-red-300 ring-opacity-50 animate-pulse'
                                    : isSelected 
                                    ? 'border-indigo-500 bg-indigo-50' 
                                    : tieneExcluyenteSeleccionado
                                    ? 'border-gray-200 bg-gray-100 opacity-50 cursor-not-allowed'
                                    : 'border-gray-200 bg-white hover:border-indigo-300'
                                  }
                                `}
                              >
                                <div className="flex flex-col h-full">
                                  {necesitaHoraExtra && (
                                    <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg z-10">
                                      ¡REQUERIDO!
                                    </div>
                                  )}
                                  <div className="flex-1 mb-3">
                                    <h4 className={`font-medium text-sm mb-1 ${necesitaHoraExtra ? 'text-red-900 font-bold' : 'text-gray-900'}`}>
                                      {necesitaHoraExtra && '⏰ '}{obtenerNombreServicio(servicio.nombre)}
                                    </h4>
                                    {servicio.descripcion && (
                                      <p className="text-xs text-gray-500 line-clamp-2">
                                        {obtenerDescripcionServicio(servicio.descripcion)}
                                      </p>
                                    )}
                                    <p className={`text-sm font-semibold mt-2 ${necesitaHoraExtra ? 'text-red-700' : 'text-indigo-600'}`}>
                                      {(() => {
                                        // Si es paquete personalizado y el servicio es específicamente "Comida", mostrar $12 por persona
                                        const esPaquetePersonalizado = paqueteSeleccionado?.nombre?.toLowerCase().includes('personalizado');
                                        const esComida = servicio.nombre?.toLowerCase() === 'comida' || 
                                                         servicio.nombre?.toLowerCase().includes('comida / a menu') ||
                                                         servicio.nombre?.toLowerCase().trim() === 'comida';
                                        
                                        if (esPaquetePersonalizado && esComida) {
                                          const cantidadInvitados = parseInt(formData.cantidad_invitados) || 0;
                                          const precioPorPersona = 12.00;
                                          return `$${precioPorPersona.toLocaleString()} por persona (${cantidadInvitados} × $${precioPorPersona.toLocaleString()} = $${(precioPorPersona * cantidadInvitados).toLocaleString()})`;
                                        } else {
                                          // Precio normal
                                          return `$${parseFloat(servicio.precio_base || 0).toLocaleString()}`;
                                        }
                                      })()}
                                    </p>
                                    {necesitaHoraExtra && (
                                      <p className="text-xs text-red-700 mt-2 font-bold bg-red-100 px-2 py-1 rounded">
                                        👉 Agregar {necesarias - cantidad} {necesarias - cantidad === 1 ? 'hora' : 'horas'}
                                      </p>
                                    )}
                                    {mostrarYaIncluido && !necesitaHoraExtra && (
                                      <p className="text-xs text-red-600 mt-1 font-medium">
                                        ⚠️ Ya incluido en paquete
                                      </p>
                                    )}
                                    {esUpgradePermitido && !necesitaHoraExtra && (
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
                                        {esUpgradePermitido ? 'Agregar Upgrade' : mostrarYaIncluido ? 'Ya incluido en paquete' : tieneExcluyenteSeleccionado ? 'Agregar' : 'Agregar'}
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
          <Card>
            <CardHeader>
              <CardTitle>Descuento</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="descuento_porcentaje">Descuento ($)</Label>
                <Input
                  id="descuento_porcentaje"
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
                  placeholder="0.00"
                />
                {precioCalculado?.desglose?.subtotalBase && (
                  <p className="text-xs text-muted-foreground">
                    Descuento máximo permitido: ${precioCalculado.desglose.subtotalBase.toLocaleString()}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="tarifa_servicio_custom">Service Fee (%)</Label>
                <Input
                  id="tarifa_servicio_custom"
                  type="number"
                  value={tarifaServicioCustom}
                  onChange={(e) => {
                    const valor = parseFloat(e.target.value);
                    if (valor >= 15 && valor <= 18) {
                      setTarifaServicioCustom(e.target.value);
                    } else if (e.target.value === '' || isNaN(valor)) {
                      setTarifaServicioCustom('');
                    } else {
                      alert('⚠️ El Service Fee debe estar entre 15% y 18%');
                    }
                  }}
                  min="15"
                  max="18"
                  step="0.1"
                  placeholder={precioCalculado?.desglose?.impuestos?.tarifaServicio?.porcentaje || "18.00"}
                />
                <p className="text-xs text-muted-foreground">
                  Porcentaje del Service Fee (15% - 18%). Por defecto: {precioCalculado?.desglose?.impuestos?.tarifaServicio?.porcentaje || 18}%
                </p>
              </div>
            </CardContent>
          </Card>
          )}

          {/* Error Message */}
          {mutation.isError && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 text-sm">
                {mutation.error.response?.data?.message || 'Error al crear oferta'}
              </p>
            </div>
          )}

          {/* Botones de Navegación del Wizard */}
          <Separator className="my-6" />
          <div className="flex gap-3">
            {pasoActual > 1 && (
              <Button
                type="button"
                variant="outline"
                onClick={retrocederPaso}
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                Anterior
              </Button>
            )}
            <div className="flex-1" />
            {pasoActual < TOTAL_PASOS ? (
              <Button
                type="button"
                onClick={avanzarPaso}
              >
                Siguiente
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleSubmitFinal}
                disabled={mutation.isPending}
              >
                {mutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Cargando...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Nueva Oferta
                  </>
                )}
              </Button>
            )}
            <Button variant="outline" asChild>
              <Link to="/ofertas">
                Cancelar
              </Link>
            </Button>
          </div>
        </div>

        {/* Panel de Calculadora y Calendario */}
        <div className="lg:col-span-1 space-y-6">
          {/* Panel de Filtros y Eventos del Calendario - Solo en paso 2 */}
          {pasoActual === 2 && formData.salon_id && formData.salon_id !== '' && (
            <Card className="sticky top-6">
              <CardContent className="p-0">
                <div className="flex flex-col h-[calc(100vh-200px)]">
                  {/* Leyenda y Filtros */}
                  <div className="p-4 border-b border-gray-200 dark:border-gray-800">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">Filtros por Salón</h3>
                    
                    {/* Filtros */}
                    <div className="space-y-2 mb-4">
                      <label className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900/50 p-2 rounded">
                        <input
                          type="checkbox"
                          checked={filtrosSalones.doral}
                          onChange={(e) => setFiltrosSalones(prev => ({ ...prev, doral: e.target.checked }))}
                          className="w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                        />
                        <div className="flex items-center gap-2 flex-1">
                          <div className="w-3 h-3 rounded-full bg-green-500 flex-shrink-0" />
                          <span className="text-sm text-gray-700 dark:text-gray-300">Doral</span>
                        </div>
                      </label>
                      
                      <label className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900/50 p-2 rounded">
                        <input
                          type="checkbox"
                          checked={filtrosSalones.kendall}
                          onChange={(e) => setFiltrosSalones(prev => ({ ...prev, kendall: e.target.checked }))}
                          className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <div className="flex items-center gap-2 flex-1">
                          <div className="w-3 h-3 rounded-full bg-blue-500 flex-shrink-0" />
                          <span className="text-sm text-gray-700 dark:text-gray-300">Kendall</span>
                        </div>
                      </label>
                      
                      <label className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900/50 p-2 rounded">
                        <input
                          type="checkbox"
                          checked={filtrosSalones.diamond}
                          onChange={(e) => setFiltrosSalones(prev => ({ ...prev, diamond: e.target.checked }))}
                          className="w-4 h-4 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                        />
                        <div className="flex items-center gap-2 flex-1">
                          <div className="w-3 h-3 rounded-full bg-orange-500 flex-shrink-0" />
                          <span className="text-sm text-gray-700 dark:text-gray-300">Diamond</span>
                        </div>
                      </label>
                      
                      <label className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900/50 p-2 rounded">
                        <input
                          type="checkbox"
                          checked={filtrosSalones.otros}
                          onChange={(e) => setFiltrosSalones(prev => ({ ...prev, otros: e.target.checked }))}
                          className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                        />
                        <div className="flex items-center gap-2 flex-1">
                          <div className="w-3 h-3 rounded-full bg-purple-500 flex-shrink-0" />
                          <span className="text-sm text-gray-700 dark:text-gray-300">Otros / Google Calendar</span>
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* Panel de eventos del día */}
                  <div className="flex-1 overflow-y-auto">
                    {diaSeleccionadoCalendario ? (
                      <div className="p-4">
                        <div className="mb-4">
                          <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-1">
                            {diasSemanaCompletos[new Date(añoCalendario, mesCalendario - 1, diaSeleccionadoCalendario).getDay()]}
                          </h2>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {diaSeleccionadoCalendario} de {nombresMeses[mesCalendario - 1]} {añoCalendario}
                          </p>
                        </div>

                        {/* Mis eventos */}
                        <div className="mb-6">
                          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Mis Eventos ({eventosDiaSeleccionado.length})
                          </h3>
                          <div className="space-y-2">
                            {eventosDiaSeleccionado.length > 0 ? (
                              eventosDiaSeleccionado.map((evento, index) => {
                                const color = obtenerColorEvento(evento);
                                const duracion = calcularDuracion(evento.hora_inicio, evento.hora_fin);
                                return (
                                  <div
                                    key={evento.id || index}
                                    className={`
                                      ${color.bg} ${color.border} ${color.text}
                                      rounded-r-lg p-3 cursor-pointer hover:opacity-80 transition-opacity
                                    `}
                                  >
                                    <div className="flex items-start gap-2">
                                      <div className={`w-2 h-2 rounded-full ${color.dot} mt-1.5 flex-shrink-0`} />
                                      <div className="flex-1 min-w-0">
                                        <div className="font-medium text-sm mb-1 truncate">
                                          {evento.clientes?.nombre_completo || evento.summary || 'Evento'}
                                        </div>
                                        <div className="space-y-1 text-xs opacity-90">
                                          {evento.es_todo_el_dia ? (
                                            <div className="flex items-center gap-1">
                                              <Clock className="w-3 h-3" />
                                              <span className="font-medium">Todo el día</span>
                                            </div>
                                          ) : evento.hora_inicio && (
                                            <div className="flex items-center gap-1">
                                              <Clock className="w-3 h-3" />
                                              <span>
                                                {formatearHora(evento.hora_inicio)}
                                                {evento.hora_fin && ` - ${formatearHora(evento.hora_fin)}`}
                                                {duracion > 0 && ` (${Math.round(duracion * 10) / 10}h)`}
                                              </span>
                                            </div>
                                          )}
                                          {(() => {
                                            const nombreSalon = evento.salones?.nombre || evento.salon || evento.ubicacion;
                                            if (nombreSalon) {
                                              return (
                                                <div className="flex items-center gap-1">
                                                  <MapPin className="w-3 h-3" />
                                                  <span className="truncate">{nombreSalon}</span>
                                                </div>
                                              );
                                            }
                                            return null;
                                          })()}
                                          {!evento.es_google_calendar && evento.estado_pago && (
                                            <div className="flex items-center gap-1">
                                              {evento.estado_pago === 'completado' && <CheckCircle2 className="w-3 h-3" />}
                                              {evento.estado_pago === 'parcial' && <AlertCircle className="w-3 h-3" />}
                                              {evento.estado_pago === 'pendiente' && <XCircle className="w-3 h-3" />}
                                              <span className="capitalize">{evento.estado_pago}</span>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })
                            ) : (
                              <div className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                                No hay eventos programados
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                        <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p className="text-sm">Selecciona un día para ver los eventos</p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Calculadora de Precio - Ocultar en paso 1 y 2 */}
          {pasoActual !== 1 && pasoActual !== 2 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="h-5 w-5" />
                  Calculadora de Precio
                </CardTitle>
              </CardHeader>
              <CardContent>

            {precioCalculado && precioCalculado.desglose ? (
              <div className="space-y-4">
                {/* Desglose Detallado */}
                <div className="space-y-2">
                  {/* Paquete Base */}
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Paquete {precioCalculado.desglose.paquete.nombre}:</span>
                    <span className="font-medium text-foreground">${parseFloat(precioCalculado.desglose.paquete.precioBase || 0).toLocaleString()}</span>
                  </div>

                  {/* Ajuste de Temporada */}
                  {precioCalculado.desglose.paquete.ajusteTemporada > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Ajuste Temporada {precioCalculado.desglose.temporada.nombre}:</span>
                      <span className="font-medium text-orange-600 dark:text-orange-400">+${parseFloat(precioCalculado.desglose.paquete.ajusteTemporada).toLocaleString()}</span>
                    </div>
                  )}

                  {/* Invitados Adicionales */}
                  {precioCalculado.desglose.invitados.adicionales > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        {precioCalculado.desglose.invitados.adicionales} Invitados Adicionales 
                        (${precioCalculado.desglose.invitados.precioUnitario} c/u):
                      </span>
                      <span className="font-medium text-foreground">${parseFloat(precioCalculado.desglose.invitados.subtotal).toLocaleString()}</span>
                    </div>
                  )}

                  {/* Servicios Adicionales */}
                  {(() => {
                    // Solo mostrar si hay servicios adicionales reales (no solo la comida automática del paquete personalizado)
                    const tieneServiciosReales = serviciosSeleccionados && serviciosSeleccionados.length > 0;
                    const subtotalServicios = parseFloat(precioCalculado.desglose.serviciosAdicionales.subtotal || 0);
                    
                    // Si hay subtotal pero no hay servicios seleccionados, es la comida automática del personalizado
                    // No la mostramos como "Servicios Adicionales" porque es parte del paquete
                    if (subtotalServicios > 0 && tieneServiciosReales) {
                      return (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Servicios Adicionales:</span>
                          <span className="font-medium text-foreground">${subtotalServicios.toLocaleString()}</span>
                        </div>
                      );
                    }
                    return null;
                  })()}

                  {/* Subtotal */}
                  <Separator className="my-2" />
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground font-medium">Subtotal:</span>
                    <span className="font-semibold text-foreground">${parseFloat(precioCalculado.desglose.subtotalBase || 0).toLocaleString()}</span>
                  </div>

                  {/* Descuento */}
                  {precioCalculado.desglose.descuento > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Descuento:</span>
                      <span className="font-medium text-green-600 dark:text-green-400">-${parseFloat(precioCalculado.desglose.descuento).toLocaleString()}</span>
                    </div>
                  )}

                  {/* Impuestos */}
                  <Separator className="my-2" />
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">IVA ({precioCalculado.desglose.impuestos.iva.porcentaje}%):</span>
                      <span className="font-medium text-foreground">${parseFloat(precioCalculado.desglose.impuestos.iva.monto || 0).toLocaleString()}</span>
                    </div>

                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Service Fee ({precioCalculado.desglose.impuestos.tarifaServicio.porcentaje}%):</span>
                      <span className="font-medium text-foreground">${parseFloat(precioCalculado.desglose.impuestos.tarifaServicio.monto || 0).toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Total Final */}
                <Separator className="my-4" />
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold">Total:</span>
                    <span className="text-2xl font-bold text-primary">
                      ${parseFloat(precioCalculado.desglose.totalFinal || 0).toLocaleString()}
                    </span>
                  </div>

                  <div className="text-sm text-muted-foreground space-y-1">
                    <p className="flex justify-between">
                      <span>Precio persona adicional:</span>
                      <span className="font-medium text-foreground">${precioCalculado.desglose.invitados.precioUnitario || 0}</span>
                    </p>
                    <p className="flex justify-between">
                      <span>Invitados:</span>
                      <span className="font-medium text-foreground">{precioCalculado.desglose.invitados.contratados} ({precioCalculado.desglose.invitados.minimo} incluidos + {precioCalculado.desglose.invitados.adicionales} adicionales)</span>
                    </p>
                  </div>
                </div>

                <Separator className="my-4" />
                <p className="text-xs text-muted-foreground text-center">
                  Los precios son estimados y pueden variar
                </p>
              </div>
            ) : (
              <div className="text-center py-8">
                <Calculator className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">
                  Completa los datos para ver el cálculo de precio
                </p>
              </div>
            )}
            </CardContent>
          </Card>
          )}

        </div>
      </form>

      {/* Modal para crear cliente */}
      <ModalCrearCliente
        isOpen={modalClienteOpen}
        onClose={() => setModalClienteOpen(false)}
        onClienteCreado={(nuevoCliente) => {
          // Seleccionar automáticamente el nuevo cliente
          setFormData({
            ...formData,
            cliente_id: nuevoCliente.id.toString()
          });
        }}
      />

      {/* Modal de confirmación para exceso de capacidad */}
      {mostrarModalCapacidad && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 animate-fade-in">
            <div className="flex items-start gap-4 mb-4">
              <div className="flex-shrink-0 w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
                <span className="text-2xl">⚠️</span>
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Excede Capacidad del Salón
                </h3>
                <p className="text-gray-600 text-sm mb-4">
                  Has ingresado <strong className="text-amber-600">{formData.cantidad_invitados} invitados</strong>, 
                  pero el salón <strong>{salonSeleccionado?.nombre}</strong> tiene una capacidad máxima de{' '}
                  <strong className="text-amber-600">{salonSeleccionado?.capacidad_maxima} invitados</strong>.
                </p>
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
                  <p className="text-sm text-amber-800">
                    <strong>⚠️ Advertencia:</strong> Exceder la capacidad puede causar problemas de seguridad, 
                    comodidad y cumplimiento de normativas. Se recomienda ajustar la cantidad de invitados o 
                    seleccionar un salón más grande.
                  </p>
                </div>
                <p className="text-sm text-gray-700 font-medium">
                  ¿Deseas continuar de todas formas?
                </p>
              </div>
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setMostrarModalCapacidad(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={confirmarExcesoCapacidad}
                className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition font-medium"
              >
                Sí, Continuar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de error - Horas extras requeridas */}
      {mostrarModalHorasExtras && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 animate-fade-in">
            <div className="flex items-start gap-4 mb-4">
              <div className="flex-shrink-0 w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <span className="text-2xl">🚫</span>
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-red-900 mb-2">
                  Horas Extras Requeridas
                </h3>
                <p className="text-gray-700 text-sm mb-4">
                  El evento dura <strong>más tiempo</strong> que el paquete contratado.
                </p>
                <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4 mb-4">
                  <p className="text-sm text-red-900 font-semibold mb-2">
                    ⚠️ ACCIÓN REQUERIDA:
                  </p>
                  <p className="text-sm text-red-800">
                    Debes agregar <strong className="text-red-900 text-lg">{horasExtrasFaltantes}</strong>{' '}
                    {horasExtrasFaltantes === 1 ? 'Hora Extra' : 'Horas Extras'} en la sección{' '}
                    <strong>"Servicios Adicionales"</strong> antes de continuar.
                  </p>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                  <p className="text-xs text-blue-800">
                    💡 <strong>Tip:</strong> Busca el servicio "Hora Extra" en la lista de servicios adicionales 
                    y agrégalo con la cantidad indicada ({horasExtrasFaltantes}).
                  </p>
                </div>
                <p className="text-sm text-gray-600 font-medium">
                  Esta acción es <strong className="text-red-600">OBLIGATORIA</strong> para poder crear la oferta.
                </p>
              </div>
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setMostrarModalHorasExtras(false);
                  // Hacer scroll a servicios adicionales
                  setTimeout(() => {
                    const serviciosSection = document.querySelector('[name="servicio_id"]');
                    if (serviciosSection) {
                      serviciosSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                  }, 100);
                }}
                className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium"
              >
                Entendido, agregar Horas Extras
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CrearOferta;

