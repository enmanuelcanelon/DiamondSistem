import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  Users,
  Plus,
  Loader2,
  CheckCircle,
  Search,
  ShoppingBag,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import useAuthStore from '@shared/store/useAuthStore';
import api from '@shared/config/api';

function ModalSolicitarCambios({ isOpen, onClose, onSuccess }) {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const contratoId = user?.contrato_id;

  const [selectedOption, setSelectedOption] = useState(null); // 'guests' o 'service'
  const [cantidadInvitados, setCantidadInvitados] = useState(1);
  const [servicioSeleccionado, setServicioSeleccionado] = useState(null);
  const [cantidadServicio, setCantidadServicio] = useState(1);
  const [detalles, setDetalles] = useState('');
  const [busqueda, setBusqueda] = useState('');

  // Obtener contrato para mostrar info
  const { data: contratoData, isLoading: loadingContrato } = useQuery({
    queryKey: ['contrato-cliente', contratoId],
    queryFn: async () => {
      const response = await api.get(`/contratos/${contratoId}`);
      return response.data;
    },
    enabled: !!contratoId && isOpen,
  });

  // Obtener servicios disponibles
  const { data: serviciosData, isLoading: loadingServicios } = useQuery({
    queryKey: ['servicios-disponibles'],
    queryFn: async () => {
      const response = await api.get('/servicios');
      return response.data;
    },
    enabled: isOpen,
  });

  // Obtener servicios del paquete del contrato
  const { data: serviciosPaqueteData } = useQuery({
    queryKey: ['servicios-paquete', contratoData?.contrato?.paquete_id],
    queryFn: async () => {
      if (!contratoData?.contrato?.paquete_id) return { servicios: [] };
      const response = await api.get(`/paquetes/${contratoData.contrato.paquete_id}/servicios`);
      return response.data;
    },
    enabled: !!contratoData?.contrato?.paquete_id && isOpen,
  });

  const contrato = contratoData?.contrato;
  const todosLosServicios = serviciosData?.servicios || [];
  const serviciosDelPaquete = serviciosPaqueteData?.servicios || [];

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

  // IDs de servicios que ya están en el paquete
  const idsServiciosEnPaquete = useMemo(() => {
    return new Set(serviciosDelPaquete.map(s => s.id || s.servicio_id));
  }, [serviciosDelPaquete]);

  // Nombres de servicios que ya tiene el cliente (del paquete)
  const nombresServiciosEnPaquete = useMemo(() => {
    return serviciosDelPaquete.map(s => s.nombre || s.servicios?.nombre);
  }, [serviciosDelPaquete]);

  // Filtrar servicios que NO están en el paquete Y no sean mutuamente excluyentes
  const serviciosDisponibles = useMemo(() => {
    return todosLosServicios.filter(servicio => {
      if (servicio.nombre === 'Hora Extra') {
        return true;
      }
      
      if (idsServiciosEnPaquete.has(servicio.id)) {
        return false;
      }

      const excluyentes = serviciosExcluyentes[servicio.nombre] || [];
      for (const nombreServicioPaquete of nombresServiciosEnPaquete) {
        if (excluyentes.includes(nombreServicioPaquete)) {
          return false;
        }
      }

      return true;
    });
  }, [todosLosServicios, idsServiciosEnPaquete, nombresServiciosEnPaquete]);

  // Aplicar búsqueda
  const serviciosFiltrados = useMemo(() => {
    if (!busqueda) return serviciosDisponibles;
    return serviciosDisponibles.filter(s =>
      s.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      s.categoria.toLowerCase().includes(busqueda.toLowerCase())
    );
  }, [serviciosDisponibles, busqueda]);

  // Mutation para crear solicitud
  const crearSolicitudMutation = useMutation({
    mutationFn: async (datos) => {
      const ruta = datos.tipo_solicitud === 'invitados' 
        ? '/solicitudes/invitados' 
        : '/solicitudes/servicio';
      
      const response = await api.post(ruta, datos);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['solicitudes']);
      toast.success('✅ Solicitud enviada exitosamente', {
        duration: 3000,
      });
      handleClose();
      if (onSuccess) onSuccess();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Error al enviar la solicitud', {
        duration: 4000,
      });
    },
  });

  const handleClose = () => {
    setSelectedOption(null);
    setCantidadInvitados(1);
    setServicioSeleccionado(null);
    setCantidadServicio(1);
    setDetalles('');
    setBusqueda('');
    onClose();
  };

  const handleSubmitInvitados = () => {
    const cantidad = parseInt(cantidadInvitados) || 0;
    
    if (cantidad < 1) {
      toast.error('⚠️ Debes agregar al menos 1 invitado adicional');
      return;
    }

    if (cantidad > 500) {
      toast.error('⚠️ La cantidad de invitados no puede exceder 500');
      return;
    }

    if (contrato?.salones?.capacidad_maxima) {
      const capacidadMaxima = contrato.salones.capacidad_maxima;
      const cantidadActual = contrato.cantidad_invitados || 0;
      const cantidadTotal = cantidadActual + cantidad;
      
      if (cantidadTotal > capacidadMaxima) {
        toast.error(
          `⚠️ La capacidad máxima del salón es ${capacidadMaxima} invitados\n\n` +
          `Invitados actuales: ${cantidadActual}\n` +
          `Invitados solicitados: ${cantidad}\n` +
          `Total: ${cantidadTotal}\n\n` +
          `Solo puedes solicitar hasta ${capacidadMaxima - cantidadActual} invitado(s) adicional(es).`,
          { duration: 8000 }
        );
        return;
      }
    }

    crearSolicitudMutation.mutate({
      contrato_id: contratoId,
      cliente_id: user.id,
      tipo_solicitud: 'invitados',
      invitados_adicionales: cantidad,
      detalles_solicitud: detalles || null,
    });
  };

  const handleSubmitServicio = () => {
    if (!servicioSeleccionado) {
      toast.error('⚠️ Selecciona un servicio');
      return;
    }

    const cantidad = parseInt(cantidadServicio) || 0;
    
    if (cantidad < 1) {
      toast.error('⚠️ La cantidad del servicio debe ser al menos 1');
      return;
    }

    const costoTotal = servicioSeleccionado.tipo_cobro === 'por_persona'
      ? parseFloat(servicioSeleccionado.precio_base) * contrato.cantidad_invitados * cantidad
      : parseFloat(servicioSeleccionado.precio_base) * cantidad;

    if (costoTotal <= 0) {
      toast.error('⚠️ El costo calculado debe ser mayor a $0');
      return;
    }

    crearSolicitudMutation.mutate({
      contrato_id: contratoId,
      cliente_id: user.id,
      tipo_solicitud: 'servicio',
      servicio_id: servicioSeleccionado.id,
      cantidad_servicio: cantidad,
      costo_adicional: costoTotal,
      detalles_solicitud: detalles || null,
    });
  };

  const isPending = crearSolicitudMutation.isPending;
  const nuevaCantidadInvitados = contrato ? parseInt(contrato.cantidad_invitados) + parseInt(cantidadInvitados || 0) : 0;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-neutral-900 border border-white/10 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Sticky Header */}
        <div className="sticky top-0 bg-neutral-900 border-b border-white/10 px-6 py-4 flex items-center justify-between z-10">
          <h2 className="text-2xl font-bold text-white">Solicitar Cambios</h2>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X size={20} className="text-neutral-400 hover:text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {!selectedOption ? (
            /* Selección de Opción */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={() => setSelectedOption('guests')}
                className={cn(
                  "p-8 border-2 rounded-xl transition-all duration-200 text-left group",
                  "hover:shadow-lg hover:scale-[1.02]",
                  selectedOption === 'guests'
                    ? "border-white bg-neutral-800 shadow-lg"
                    : "border-white/10 hover:border-white/30 bg-neutral-900"
                )}
              >
                <Users
                  size={24}
                  className={cn(
                    "mb-4",
                    selectedOption === 'guests'
                      ? "text-white"
                      : "text-neutral-400 group-hover:text-neutral-300"
                  )}
                />
                <h3 className="text-xl font-bold text-white mb-2">Más Invitados</h3>
                <p className="text-sm text-neutral-400">Agrega más personas a tu evento</p>
              </button>

              <button
                onClick={() => setSelectedOption('service')}
                className={cn(
                  "p-8 border-2 rounded-xl transition-all duration-200 text-left group",
                  "hover:shadow-lg hover:scale-[1.02]",
                  selectedOption === 'service'
                    ? "border-white bg-neutral-800 shadow-lg"
                    : "border-white/10 hover:border-white/30 bg-neutral-900"
                )}
              >
                <ShoppingBag
                  size={24}
                  className={cn(
                    "mb-4",
                    selectedOption === 'service'
                      ? "text-white"
                      : "text-neutral-400 group-hover:text-neutral-300"
                  )}
                />
                <h3 className="text-xl font-bold text-white mb-2">Servicio Adicional</h3>
                <p className="text-sm text-neutral-400">Agrega un servicio extra</p>
              </button>
            </div>
          ) : selectedOption === 'guests' ? (
            /* Formulario de Invitados */
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">
                  ¿Cuántos invitados adicionales? *
                </label>
                <input
                  type="number"
                  min="1"
                  value={cantidadInvitados}
                  onChange={(e) => setCantidadInvitados(e.target.value)}
                  className="w-full px-4 py-3 border border-white/10 rounded-lg focus:ring-2 focus:ring-white focus:border-transparent outline-none text-lg bg-neutral-800 text-white placeholder:text-neutral-500"
                  required
                />
                {contrato && (
                  <p className="text-sm text-neutral-400 mt-2">
                    Nueva cantidad total:{' '}
                    <strong className="text-white text-lg">
                      {nuevaCantidadInvitados} invitados
                    </strong>
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">
                  Detalles adicionales (opcional)
                </label>
                <textarea
                  value={detalles}
                  onChange={(e) => setDetalles(e.target.value)}
                  rows={4}
                  placeholder="¿Algo que quieras comentar?"
                  className="w-full px-4 py-2 border border-white/10 rounded-lg focus:ring-2 focus:ring-white focus:border-transparent outline-none bg-neutral-800 text-white placeholder:text-neutral-500"
                />
              </div>
            </div>
          ) : (
            /* Formulario de Servicios */
            <div className="space-y-6">
              {/* Barra de Búsqueda */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Buscar servicios..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-white/10 rounded-lg focus:ring-2 focus:ring-white focus:border-transparent outline-none bg-neutral-800 text-white placeholder:text-neutral-500"
                />
              </div>

              {/* Servicio Seleccionado */}
              {servicioSeleccionado ? (
                <div className="p-6 border-2 border-white rounded-xl bg-neutral-800">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-white mb-2">
                        {servicioSeleccionado.nombre}
                      </h3>
                      <p className="text-sm text-neutral-400 mb-4">
                        {servicioSeleccionado.descripcion || 'Servicio adicional disponible'}
                      </p>
                      <div className="flex items-center gap-4">
                        <div>
                          <label className="block text-sm font-medium text-neutral-300 mb-1">
                            Cantidad
                          </label>
                          <input
                            type="number"
                            min="1"
                            value={cantidadServicio}
                            onChange={(e) => setCantidadServicio(e.target.value)}
                            className="w-24 px-3 py-2 border border-white/10 rounded-lg focus:ring-2 focus:ring-white focus:border-transparent outline-none bg-neutral-900 text-white"
                          />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-neutral-400">Costo total:</p>
                          <p className="text-3xl font-bold text-green-400">
                            ${(servicioSeleccionado.tipo_cobro === 'por_persona'
                              ? parseFloat(servicioSeleccionado.precio_base) * contrato.cantidad_invitados * cantidadServicio
                              : parseFloat(servicioSeleccionado.precio_base) * cantidadServicio
                            ).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => setServicioSeleccionado(null)}
                      className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                    >
                      <X size={20} className="text-neutral-400 hover:text-white" />
                    </button>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-300 mb-2">
                      Detalles adicionales (opcional)
                    </label>
                    <textarea
                      value={detalles}
                      onChange={(e) => setDetalles(e.target.value)}
                      rows={3}
                      placeholder="¿Algo que quieras comentar sobre este servicio?"
                      className="w-full px-4 py-2 border border-white/10 rounded-lg focus:ring-2 focus:ring-white focus:border-transparent outline-none bg-neutral-900 text-white placeholder:text-neutral-500"
                    />
                  </div>
                </div>
              ) : (
                /* Grid de Servicios (3 columnas) */
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {serviciosFiltrados.length === 0 ? (
                    <div className="col-span-full text-center py-12">
                      <ShoppingBag className="w-16 h-16 text-neutral-300 dark:text-neutral-600 mx-auto mb-4" />
                      <p className="text-neutral-600 dark:text-neutral-400">
                        {busqueda
                          ? 'No se encontraron servicios con esa búsqueda'
                          : 'Todos los servicios de tu paquete ya están incluidos'}
                      </p>
                    </div>
                  ) : (
                    serviciosFiltrados.map((servicio) => (
                      <div
                        key={servicio.id}
                        onClick={() => {
                          setServicioSeleccionado(servicio);
                          setCantidadServicio(1);
                          setDetalles('');
                        }}
                        className="p-4 rounded-xl border border-white/10 group cursor-pointer hover:border-white hover:shadow-lg transition-all duration-200 bg-neutral-900"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <span className="text-xs px-2 py-1 rounded bg-neutral-800 text-neutral-400 font-medium border border-white/10">
                            {servicio.categoria}
                          </span>
                          <button className="w-6 h-6 rounded-full border-2 border-white/20 flex items-center justify-center group-hover:border-white group-hover:bg-white transition-colors">
                            <Plus size={14} className="text-neutral-400 group-hover:text-neutral-900" />
                          </button>
                        </div>
                        <h4 className="font-bold text-white mb-2">{servicio.nombre}</h4>
                        <p className="text-sm text-neutral-400 mb-3 line-clamp-2">
                          {servicio.descripcion || 'Servicio adicional disponible'}
                        </p>
                        <div className="text-lg font-bold text-white">
                          ${parseFloat(servicio.precio_base).toFixed(2)}
                          {servicio.tipo_cobro === 'por_persona' && (
                            <span className="text-sm font-normal text-neutral-500"> /persona</span>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        {selectedOption && (
          <div className="sticky bottom-0 bg-neutral-900 border-t border-white/10 px-6 py-4 flex gap-4">
            <button
              type="button"
              onClick={() => {
                if (servicioSeleccionado) {
                  setServicioSeleccionado(null);
                } else {
                  setSelectedOption(null);
                }
              }}
              className="flex-1 px-6 py-3 bg-neutral-800 text-neutral-300 rounded-lg hover:bg-neutral-700 transition font-medium border border-white/10"
            >
              {servicioSeleccionado ? 'Volver' : 'Cancelar'}
            </button>
            <button
              onClick={selectedOption === 'guests' ? handleSubmitInvitados : handleSubmitServicio}
              disabled={isPending || (selectedOption === 'service' && !servicioSeleccionado)}
              className="flex-1 px-6 py-3 bg-white text-neutral-900 rounded-lg hover:bg-neutral-200 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5" />
                  Enviar Solicitud
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default ModalSolicitarCambios;

