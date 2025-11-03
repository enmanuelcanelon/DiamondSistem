import { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Calculator, Plus, Minus, Save, Loader2, UserPlus } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../config/api';
import ModalCrearCliente from '../components/ModalCrearCliente';

function CrearOferta() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const clienteIdFromUrl = searchParams.get('cliente_id');

  const [formData, setFormData] = useState({
    cliente_id: clienteIdFromUrl || '',
    paquete_id: '',
    temporada_id: '',
    fecha_evento: '',
    hora_inicio: '',
    hora_fin: '',
    cantidad_invitados: '',
    lugar_evento: '',
    servicios_adicionales: [],
    descuento_porcentaje: 0,
    notas_internas: '',
  });

  const [precioCalculado, setPrecioCalculado] = useState(null);
  const [serviciosSeleccionados, setServiciosSeleccionados] = useState([]);
  const [paqueteSeleccionado, setPaqueteSeleccionado] = useState(null);
  const [precioBaseAjustado, setPrecioBaseAjustado] = useState('');
  const [ajusteTemporadaCustom, setAjusteTemporadaCustom] = useState('');
  const [mostrarAjusteTemporada, setMostrarAjusteTemporada] = useState(false);
  const [mostrarAjustePrecioBase, setMostrarAjustePrecioBase] = useState(false);
  const [mostrarAjusteServicios, setMostrarAjusteServicios] = useState(false);
  const [modalClienteOpen, setModalClienteOpen] = useState(false);

  // Queries
  const { data: clientes } = useQuery({
    queryKey: ['clientes'],
    queryFn: async () => {
      const response = await api.get('/clientes');
      return response.data.clientes;
    },
  });

  const { data: paquetes } = useQuery({
    queryKey: ['paquetes'],
    queryFn: async () => {
      const response = await api.get('/paquetes');
      return response.data.paquetes;
    },
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

  // Mutation para crear oferta
  const mutation = useMutation({
    mutationFn: async (data) => {
      const response = await api.post('/ofertas', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['ofertas']);
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
        fecha_evento: formData.fecha_evento,
        cantidad_invitados: parseInt(formData.cantidad_invitados),
        precio_base_ajustado: precioBaseAjustado ? parseFloat(precioBaseAjustado) : null,
        ajuste_temporada_custom: ajusteTemporadaCustom ? parseFloat(ajusteTemporadaCustom) : null,
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
    calcularPrecio();
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

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // Definir servicios mutuamente excluyentes por nombre
  const serviciosExcluyentes = {
    'Foto y Video 3 Horas': ['Foto y Video 5 Horas'],
    'Foto y Video 5 Horas': ['Foto y Video 3 Horas'],
    'Licor Básico': ['Licor Premium'],
    'Licor Premium': ['Licor Básico'],
    'Decoración Básica': ['Decoración Plus'],
    'Decoración Plus': ['Decoración Básica'],
    'Photobooth 360': ['Photobooth Print'],
    'Photobooth Print': ['Photobooth 360']
  };

  const agregarServicio = (servicioId) => {
    const servicioExistente = serviciosSeleccionados.find(s => s.servicio_id === servicioId);
    const servicioData = servicios?.find(s => s.id === parseInt(servicioId));
    
    // Verificar si el servicio es excluyente con alguno ya seleccionado (adicionales o incluidos en el paquete)
    if (servicioData && serviciosExcluyentes[servicioData.nombre]) {
      const nombresExcluyentes = serviciosExcluyentes[servicioData.nombre];
      
      // Verificar en servicios adicionales seleccionados
      const tieneExcluyenteEnAdicionales = serviciosSeleccionados.some(s => {
        const sData = servicios?.find(srv => srv.id === parseInt(s.servicio_id));
        return sData && nombresExcluyentes.includes(sData.nombre);
      });
      
      // Verificar en servicios incluidos en el paquete
      const tieneExcluyenteEnPaquete = paqueteSeleccionado?.paquetes_servicios?.some(ps => {
        return ps.servicios && nombresExcluyentes.includes(ps.servicios.nombre);
      });
      
      if (tieneExcluyenteEnAdicionales) {
        alert(`No puedes seleccionar "${servicioData.nombre}" porque ya tienes un servicio similar en servicios adicionales. Por favor, elimina el otro primero.`);
        return;
      }
      
      if (tieneExcluyenteEnPaquete) {
        const servicioEnPaquete = paqueteSeleccionado.paquetes_servicios.find(ps => 
          ps.servicios && nombresExcluyentes.includes(ps.servicios.nombre)
        );
        alert(`No puedes seleccionar "${servicioData.nombre}" porque tu paquete ya incluye "${servicioEnPaquete?.servicios?.nombre}".`);
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

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const dataToSubmit = {
      cliente_id: parseInt(formData.cliente_id),
      paquete_id: parseInt(formData.paquete_id),
      temporada_id: formData.temporada_id ? parseInt(formData.temporada_id) : null,
      fecha_evento: formData.fecha_evento,
      hora_inicio: formData.hora_inicio,
      hora_fin: formData.hora_fin,
      cantidad_invitados: parseInt(formData.cantidad_invitados),
      lugar_evento: formData.lugar_evento,
      descuento: parseFloat(formData.descuento_porcentaje) || 0,
      notas_vendedor: formData.notas_internas || null,
      servicios_adicionales: serviciosSeleccionados.map(s => ({
        servicio_id: parseInt(s.servicio_id),
        cantidad: parseInt(s.cantidad),
        opcion_seleccionada: s.opcion_seleccionada || null,
      })).filter(s => s.servicio_id),
    };

    mutation.mutate(dataToSubmit);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/ofertas" className="p-2 hover:bg-gray-100 rounded-lg transition">
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Nueva Oferta</h1>
          <p className="text-gray-600 mt-1">Crea una propuesta comercial para tu cliente</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formulario */}
        <div className="lg:col-span-2 space-y-6">
          {/* Información del Cliente */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Información del Cliente</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cliente *
                </label>
                <div className="flex gap-2">
                  <select
                    name="cliente_id"
                    value={formData.cliente_id}
                    onChange={handleChange}
                    required
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                  >
                    <option value="">Seleccionar cliente...</option>
                    {clientes?.map((cliente) => (
                      <option key={cliente.id} value={cliente.id}>
                        {cliente.nombre_completo} - {cliente.email}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => setModalClienteOpen(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium whitespace-nowrap"
                    title="Crear nuevo cliente"
                  >
                    <UserPlus className="w-5 h-5" />
                    Nuevo Cliente
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Detalles del Evento */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Detalles del Evento</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha del Evento *
                </label>
                <input
                  type="date"
                  name="fecha_evento"
                  value={formData.fecha_evento}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cantidad de Invitados *
                </label>
                <input
                  type="number"
                  name="cantidad_invitados"
                  value={formData.cantidad_invitados}
                  onChange={handleChange}
                  min="1"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hora Inicio *
                </label>
                <input
                  type="time"
                  name="hora_inicio"
                  value={formData.hora_inicio}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hora Fin *
                </label>
                <input
                  type="time"
                  name="hora_fin"
                  value={formData.hora_fin}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Lugar del Evento *
                </label>
                <select
                  name="lugar_evento"
                  value={formData.lugar_evento}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                >
                  <option value="">Seleccione un lugar</option>
                  <option value="Diamond">Diamond</option>
                  <option value="Doral">Doral</option>
                  <option value="Kendall">Kendall</option>
                  <option value="Otro">Otro</option>
                </select>
              </div>
            </div>
          </div>

          {/* Paquete y Temporada */}
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                >
                  <option value="">Seleccionar paquete...</option>
                  {paquetes?.map((paquete) => (
                    <option key={paquete.id} value={paquete.id}>
                      {paquete.nombre} - ${paquete.precio_base || paquete.precio_base_persona}
                    </option>
                  ))}
                </select>
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
                {paqueteSeleccionado.paquetes_servicios.map((ps) => (
                  <div key={ps.id} className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="font-medium text-gray-900">{ps.servicios?.nombre}</span>
                    </div>
                    <span className="text-sm text-green-700 font-medium">
                      {ps.incluido_gratis ? '✓ Incluido' : 'En paquete'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Servicios Adicionales */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Servicios Adicionales</h2>
            
            {(() => {
              // Filtrar servicios disponibles (no incluidos en el paquete)
              const serviciosDisponibles = servicios?.filter(s => {
                const estaEnPaquete = paqueteSeleccionado?.paquetes_servicios?.some(
                  ps => ps.servicio_id === s.id
                );
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
                            const tieneExcluyenteEnAdicionales = serviciosExcluyentes[servicio.nombre] && 
                              serviciosSeleccionados.some(s => {
                                const sData = servicios?.find(srv => srv.id === parseInt(s.servicio_id));
                                return sData && serviciosExcluyentes[servicio.nombre].includes(sData.nombre);
                              });
                            
                            // Verificar si hay un servicio excluyente incluido en el paquete
                            const tieneExcluyenteEnPaquete = serviciosExcluyentes[servicio.nombre] &&
                              paqueteSeleccionado?.paquetes_servicios?.some(ps => {
                                return ps.servicios && serviciosExcluyentes[servicio.nombre].includes(ps.servicios.nombre);
                              });
                            
                            const tieneExcluyenteSeleccionado = tieneExcluyenteEnAdicionales || tieneExcluyenteEnPaquete;

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
                                      {servicio.nombre}
                                    </h4>
                                    {servicio.descripcion && (
                                      <p className="text-xs text-gray-500 line-clamp-2">
                                        {servicio.descripcion}
                                      </p>
                                    )}
                                    <p className="text-sm font-semibold text-indigo-600 mt-2">
                                      ${parseFloat(servicio.precio_base).toLocaleString()}
                                    </p>
                                    {tieneExcluyenteEnPaquete && (
                                      <p className="text-xs text-red-600 mt-1 font-medium">
                                        ⚠️ Ya incluido en paquete
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
                                            : 'bg-indigo-600 text-white hover:bg-indigo-700'
                                        }`}
                                      >
                                        <Plus className="w-4 h-4" />
                                        {tieneExcluyenteEnPaquete ? 'En paquete' : tieneExcluyenteSeleccionado ? 'No disponible' : 'Agregar'}
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
                        <div className="flex items-center justify-between p-3 bg-white border border-indigo-200 rounded-lg">
                          <div className="flex-1">
                            <p className="font-medium text-gray-900 text-sm">
                              {servicioData?.nombre}
                            </p>
                            <p className="text-xs text-gray-500">
                              Cantidad: {servicio.cantidad} × ${parseFloat(precioActual).toLocaleString()} = <span className="font-medium">${subtotal.toLocaleString()}</span>
                            </p>
                          </div>
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

          {/* Descuento y Notas */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Descuento y Notas</h2>
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notas Internas
                </label>
                <textarea
                  name="notas_internas"
                  value={formData.notas_internas}
                  onChange={handleChange}
                  rows="3"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                />
              </div>
            </div>
          </div>

          {/* Error Message */}
          {mutation.isError && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 text-sm">
                {mutation.error.response?.data?.message || 'Error al crear oferta'}
              </p>
            </div>
          )}

          {/* Botones */}
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={mutation.isPending}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {mutation.isPending ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Creando oferta...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Crear Oferta
                </>
              )}
            </button>
            <Link
              to="/ofertas"
              className="px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
            >
              Cancelar
            </Link>
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
    </div>
  );
}

export default CrearOferta;

