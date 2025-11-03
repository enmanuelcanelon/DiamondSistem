import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast, { Toaster } from 'react-hot-toast';
import {
  Users,
  Plus,
  Loader2,
  CheckCircle,
  ArrowLeft,
  AlertCircle,
  DollarSign,
  Search,
  ShoppingBag,
  Sparkles,
  X,
} from 'lucide-react';
import useAuthStore from '../../store/useAuthStore';
import api from '../../config/api';

function SolicitarCambios() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const contratoId = user?.contrato_id;

  const [tipoSolicitud, setTipoSolicitud] = useState('invitados'); // 'invitados' o 'servicio'
  const [cantidadInvitados, setCantidadInvitados] = useState(1);
  const [servicioSeleccionado, setServicioSeleccionado] = useState(null);
  const [cantidadServicio, setCantidadServicio] = useState(1);
  const [detalles, setDetalles] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [categoriaFiltro, setCategoriaFiltro] = useState('');

  // Obtener contrato para mostrar info
  const { data: contratoData, isLoading: loadingContrato } = useQuery({
    queryKey: ['contrato-cliente', contratoId],
    queryFn: async () => {
      const response = await api.get(`/contratos/${contratoId}`);
      return response.data;
    },
    enabled: !!contratoId,
  });

  // Obtener servicios disponibles
  const { data: serviciosData, isLoading: loadingServicios } = useQuery({
    queryKey: ['servicios-disponibles'],
    queryFn: async () => {
      const response = await api.get('/servicios');
      return response.data;
    },
  });

  // Obtener servicios del paquete del contrato
  const { data: serviciosPaqueteData } = useQuery({
    queryKey: ['servicios-paquete', contratoData?.contrato?.paquete_id],
    queryFn: async () => {
      if (!contratoData?.contrato?.paquete_id) return { servicios: [] };
      const response = await api.get(`/paquetes/${contratoData.contrato.paquete_id}/servicios`);
      return response.data;
    },
    enabled: !!contratoData?.contrato?.paquete_id,
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

  // Filtrar servicios que NO estén en el paquete Y no sean mutuamente excluyentes
  const serviciosDisponibles = useMemo(() => {
    return todosLosServicios.filter(servicio => {
      // 1. Excluir servicios que ya están en el paquete
      if (idsServiciosEnPaquete.has(servicio.id)) {
        return false;
      }

      // 2. Excluir servicios mutuamente excluyentes con los del paquete
      const excluyentes = serviciosExcluyentes[servicio.nombre] || [];
      for (const nombreServicioPaquete of nombresServiciosEnPaquete) {
        if (excluyentes.includes(nombreServicioPaquete)) {
          return false; // Este servicio es excluyente con uno del paquete
        }
      }

      return true;
    });
  }, [todosLosServicios, idsServiciosEnPaquete, nombresServiciosEnPaquete]);

  // Aplicar búsqueda y filtros
  const serviciosFiltrados = useMemo(() => {
    let resultado = serviciosDisponibles;

    // Filtrar por búsqueda
    if (busqueda) {
      resultado = resultado.filter(s =>
        s.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
        s.categoria.toLowerCase().includes(busqueda.toLowerCase())
      );
    }

    // Filtrar por categoría
    if (categoriaFiltro) {
      resultado = resultado.filter(s => s.categoria === categoriaFiltro);
    }

    return resultado;
  }, [serviciosDisponibles, busqueda, categoriaFiltro]);

  // Obtener categorías únicas
  const categorias = useMemo(() => {
    return [...new Set(serviciosDisponibles.map(s => s.categoria))];
  }, [serviciosDisponibles]);

  // Mutation para crear solicitud
  const crearSolicitudMutation = useMutation({
    mutationFn: async (datos) => {
      // Determinar la ruta según el tipo de solicitud
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
      setTimeout(() => navigate('/cliente/solicitudes'), 1500);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Error al enviar la solicitud', {
        duration: 4000,
      });
    },
  });

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

  if (loadingContrato || loadingServicios) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Toaster position="top-right" />

      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/cliente/dashboard')}
          className="p-2 hover:bg-gray-100 rounded-lg transition"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Solicitar Cambios</h1>
          <p className="text-gray-600 mt-1">
            Solicita más invitados o servicios adicionales para tu evento
          </p>
        </div>
      </div>

      {/* Info del Contrato */}
      {contrato && (
        <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-purple-600 mt-0.5" />
            <div className="flex-1">
              <p className="font-medium text-purple-900">Información de tu Contrato</p>
              <div className="text-sm text-purple-700 mt-2 space-y-1">
                <p>• <strong>Paquete:</strong> {contrato.paquetes?.nombre}</p>
                <p>• <strong>Invitados actuales:</strong> {contrato.cantidad_invitados}</p>
                <p>• <strong>Total del contrato:</strong> ${parseFloat(contrato.total_contrato).toFixed(2)}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tipo de Solicitud */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button
          onClick={() => setTipoSolicitud('invitados')}
          className={`p-6 border-2 rounded-xl transition ${
            tipoSolicitud === 'invitados'
              ? 'border-purple-600 bg-purple-50 shadow-lg'
              : 'border-gray-200 hover:border-gray-300 hover:shadow'
          }`}
        >
          <Users
            className={`w-12 h-12 mx-auto mb-3 ${
              tipoSolicitud === 'invitados' ? 'text-purple-600' : 'text-gray-400'
            }`}
          />
          <p
            className={`text-lg font-bold ${
              tipoSolicitud === 'invitados' ? 'text-purple-900' : 'text-gray-700'
            }`}
          >
            Más Invitados
          </p>
          <p className="text-sm text-gray-600 mt-1">Agrega más personas a tu evento</p>
        </button>

        <button
          onClick={() => setTipoSolicitud('servicio')}
          className={`p-6 border-2 rounded-xl transition ${
            tipoSolicitud === 'servicio'
              ? 'border-purple-600 bg-purple-50 shadow-lg'
              : 'border-gray-200 hover:border-gray-300 hover:shadow'
          }`}
        >
          <ShoppingBag
            className={`w-12 h-12 mx-auto mb-3 ${
              tipoSolicitud === 'servicio' ? 'text-purple-600' : 'text-gray-400'
            }`}
          />
          <p
            className={`text-lg font-bold ${
              tipoSolicitud === 'servicio' ? 'text-purple-900' : 'text-gray-700'
            }`}
          >
            Servicio Adicional
          </p>
          <p className="text-sm text-gray-600 mt-1">Agrega un servicio extra</p>
        </button>
      </div>

      {/* Formulario de Invitados */}
      {tipoSolicitud === 'invitados' && (
        <div className="bg-white rounded-xl shadow-sm border p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ¿Cuántos invitados adicionales? *
            </label>
            <input
              type="number"
              min="1"
              value={cantidadInvitados}
              onChange={(e) => setCantidadInvitados(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-lg"
              required
            />
            {contrato && (
              <p className="text-sm text-gray-600 mt-2">
                Nueva cantidad total:{' '}
                <strong className="text-purple-600">
                  {parseInt(contrato.cantidad_invitados) + parseInt(cantidadInvitados || 0)} invitados
                </strong>
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Detalles adicionales (opcional)
            </label>
            <textarea
              value={detalles}
              onChange={(e) => setDetalles(e.target.value)}
              rows={4}
              placeholder="¿Algo que quieras comentar?"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
            />
          </div>

          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => navigate('/cliente/dashboard')}
              className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-medium"
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmitInvitados}
              disabled={isPending}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
        </div>
      )}

      {/* Formulario de Servicios */}
      {tipoSolicitud === 'servicio' && (
        <div className="space-y-6">
          {/* Barra de Búsqueda y Filtros */}
          <div className="bg-white rounded-xl shadow-sm border p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Buscar servicios..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                />
              </div>
              <select
                value={categoriaFiltro}
                onChange={(e) => setCategoriaFiltro(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
              >
                <option value="">Todas las categorías</option>
                {categorias.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Servicio Seleccionado */}
          {servicioSeleccionado && (
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200 rounded-xl p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-5 h-5 text-purple-600" />
                    <h3 className="text-lg font-bold text-purple-900">Servicio Seleccionado</h3>
                  </div>
                  <p className="text-2xl font-bold text-gray-900 mb-2">{servicioSeleccionado.nombre}</p>
                  <p className="text-sm text-gray-600 mb-4">{servicioSeleccionado.descripcion}</p>

                  <div className="flex items-center gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Cantidad
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={cantidadServicio}
                        onChange={(e) => setCantidadServicio(e.target.value)}
                        className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                      />
                    </div>

                    <div className="flex-1">
                      <p className="text-sm text-gray-600">Costo total:</p>
                      <p className="text-3xl font-bold text-green-600">
                        ${(servicioSeleccionado.tipo_cobro === 'por_persona'
                          ? parseFloat(servicioSeleccionado.precio_base) * contrato.cantidad_invitados * cantidadServicio
                          : parseFloat(servicioSeleccionado.precio_base) * cantidadServicio
                        ).toFixed(2)}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {servicioSeleccionado.tipo_cobro === 'por_persona' && 
                          `$${servicioSeleccionado.precio_base} × ${contrato.cantidad_invitados} personas × ${cantidadServicio}`
                        }
                        {servicioSeleccionado.tipo_cobro === 'fijo' && 
                          `$${servicioSeleccionado.precio_base} × ${cantidadServicio}`
                        }
                      </p>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setServicioSeleccionado(null)}
                  className="p-2 hover:bg-purple-100 rounded-lg transition"
                >
                  <X className="w-5 h-5 text-gray-600" />
                </button>
              </div>

              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Detalles adicionales (opcional)
                </label>
                <textarea
                  value={detalles}
                  onChange={(e) => setDetalles(e.target.value)}
                  rows={3}
                  placeholder="¿Algo que quieras comentar sobre este servicio?"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                />
              </div>

              <div className="flex gap-4 mt-6">
                <button
                  type="button"
                  onClick={() => navigate('/cliente/dashboard')}
                  className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-medium"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSubmitServicio}
                  disabled={isPending}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
            </div>
          )}

          {/* Grid de Servicios Disponibles */}
          {!servicioSeleccionado && (
            <div>
              {serviciosFiltrados.length === 0 && (
                <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
                  <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600">
                    {busqueda || categoriaFiltro
                      ? 'No se encontraron servicios con esos filtros'
                      : 'Todos los servicios de tu paquete ya están incluidos'}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {serviciosFiltrados.map((servicio) => (
                  <button
                    key={servicio.id}
                    onClick={() => {
                      setServicioSeleccionado(servicio);
                      setCantidadServicio(1);
                      setDetalles('');
                    }}
                    className="bg-white rounded-xl shadow-sm border p-6 hover:shadow-lg hover:border-purple-300 transition text-left"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <Plus className="w-6 h-6 text-purple-600" />
                      </div>
                      <span className="text-xs font-medium px-2 py-1 bg-gray-100 text-gray-700 rounded-full">
                        {servicio.categoria}
                      </span>
                    </div>

                    <h3 className="font-bold text-gray-900 mb-2">{servicio.nombre}</h3>
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                      {servicio.descripcion || 'Servicio adicional disponible'}
                    </p>

                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-bold text-purple-600">
                        ${parseFloat(servicio.precio_base).toFixed(2)}
                      </span>
                      <span className="text-sm text-gray-500">
                        {servicio.tipo_cobro === 'por_persona' ? '/ persona' : ''}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default SolicitarCambios;
