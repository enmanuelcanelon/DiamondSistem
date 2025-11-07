import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Plus,
  Users,
  UserPlus,
  UserMinus,
  Trash2,
  Edit2,
  Save,
  X,
  Table,
  Eye,
} from 'lucide-react';
import api from '@shared/config/api';
import useAuthStore from '@shared/store/useAuthStore';

function AsignacionMesas() {
  const { id: contratoId } = useParams();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  
  // Determinar si el usuario es vendedor (solo lectura) o cliente (puede editar)
  // Usar window.location.pathname para detectar si es área de vendedor
  const esAreaVendedor = window.location.pathname.startsWith('/contratos/');
  const esVendedor = user?.rol === 'vendedor' || esAreaVendedor;
  const puedeEditar = !esVendedor;
  
  const [nuevaMesa, setNuevaMesa] = useState({
    numero_mesa: '',
    nombre_mesa: '',
    capacidad: 10,
  });
  
  const [nuevoInvitado, setNuevoInvitado] = useState({
    nombre_completo: '',
    tipo: 'adulto',
  });
  
  const [editandoMesa, setEditandoMesa] = useState(null);
  const [mostrarFormMesa, setMostrarFormMesa] = useState(false);
  const [mostrarFormInvitado, setMostrarFormInvitado] = useState(false);
  const [mesaSeleccionadaParaAsignar, setMesaSeleccionadaParaAsignar] = useState(null);

  // Query para obtener el contrato
  const { data: contrato } = useQuery({
    queryKey: ['contrato', contratoId],
    queryFn: async () => {
      const response = await api.get(`/contratos/${contratoId}`);
      return response.data.contrato;
    },
  });

  // Query para obtener mesas
  const { data: mesas, isLoading: loadingMesas } = useQuery({
    queryKey: ['mesas', contratoId],
    queryFn: async () => {
      const response = await api.get(`/mesas/contrato/${contratoId}`);
      return response.data.mesas;
    },
  });

  // Query para obtener invitados
  const { data: invitadosData, isLoading: loadingInvitados } = useQuery({
    queryKey: ['invitados', contratoId],
    queryFn: async () => {
      const response = await api.get(`/invitados/contrato/${contratoId}`);
      return response.data;
    },
  });

  // Mutation para crear mesa
  const crearMesaMutation = useMutation({
    mutationFn: async (mesa) => {
      const response = await api.post('/mesas', {
        ...mesa,
        contrato_id: parseInt(contratoId),
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['mesas', contratoId]);
      setNuevaMesa({ numero_mesa: '', nombre_mesa: '', capacidad: 10 });
      setMostrarFormMesa(false);
      alert('Mesa creada exitosamente');
    },
    onError: (error) => {
      alert(error.response?.data?.message || 'Error al crear mesa');
    },
  });

  // Mutation para eliminar mesa
  const eliminarMesaMutation = useMutation({
    mutationFn: async (mesaId) => {
      await api.delete(`/mesas/${mesaId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['mesas', contratoId]);
      queryClient.invalidateQueries(['invitados', contratoId]);
      alert('Mesa eliminada exitosamente');
    },
    onError: (error) => {
      alert(error.response?.data?.message || 'Error al eliminar mesa');
    },
  });

  // Mutation para crear invitado
  const crearInvitadoMutation = useMutation({
    mutationFn: async (invitado) => {
      const response = await api.post('/invitados', {
        contrato_id: parseInt(contratoId),
        invitados: invitado,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['invitados', contratoId]);
      setNuevoInvitado({ nombre_completo: '', tipo: 'adulto' });
      setMostrarFormInvitado(false);
      alert('Invitado agregado exitosamente');
    },
    onError: (error) => {
      alert(error.response?.data?.message || 'Error al agregar invitado');
    },
  });

  // Mutation para asignar/desasignar invitado
  const asignarInvitadoMutation = useMutation({
    mutationFn: async ({ invitadoId, mesaId }) => {
      const response = await api.patch(`/invitados/${invitadoId}/asignar-mesa`, {
        mesa_id: mesaId,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['mesas', contratoId]);
      queryClient.invalidateQueries(['invitados', contratoId]);
    },
    onError: (error) => {
      alert(error.response?.data?.message || 'Error al asignar invitado');
    },
  });

  // Mutation para eliminar invitado
  const eliminarInvitadoMutation = useMutation({
    mutationFn: async (invitadoId) => {
      await api.delete(`/invitados/${invitadoId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['invitados', contratoId]);
      alert('Invitado eliminado exitosamente');
    },
    onError: (error) => {
      alert(error.response?.data?.message || 'Error al eliminar invitado');
    },
  });

  const handleCrearMesa = (e) => {
    e.preventDefault();
    if (!nuevaMesa.numero_mesa || !nuevaMesa.capacidad) {
      alert('Por favor, complete todos los campos requeridos');
      return;
    }
    crearMesaMutation.mutate(nuevaMesa);
  };

  const handleCrearInvitado = (e) => {
    e.preventDefault();
    if (!nuevoInvitado.nombre_completo) {
      alert('Por favor, ingrese el nombre del invitado');
      return;
    }
    crearInvitadoMutation.mutate(nuevoInvitado);
  };

  const handleAsignarInvitado = (invitadoId, mesaId) => {
    asignarInvitadoMutation.mutate({ invitadoId, mesaId });
  };

  const handleDesasignarInvitado = (invitadoId) => {
    if (window.confirm('¿Desasignar este invitado de su mesa?')) {
      asignarInvitadoMutation.mutate({ invitadoId, mesaId: null });
    }
  };

  const handleEliminarMesa = (mesaId) => {
    if (window.confirm('¿Está seguro de eliminar esta mesa? Los invitados asignados quedarán sin mesa.')) {
      eliminarMesaMutation.mutate(mesaId);
    }
  };

  const handleEliminarInvitado = (invitadoId) => {
    if (window.confirm('¿Está seguro de eliminar este invitado?')) {
      eliminarInvitadoMutation.mutate(invitadoId);
    }
  };

  const invitadosSinMesa = invitadosData?.agrupado?.sin_mesa || [];
  
  // Obtener información del salón (múltiples fuentes posibles)
  const salonNombreRaw = contrato?.salones?.nombre || contrato?.lugar_salon || contrato?.ofertas?.lugar_salon || '';
  // Normalizar el nombre del salón (case-insensitive, trim)
  const salonNombre = salonNombreRaw ? salonNombreRaw.trim() : '';
  const salonId = contrato?.salon_id || contrato?.ofertas?.salon_id;
  
  // Configuración de salones según instrucciones
  const configuracionSalones = {
    'Diamond': {
      moverMesas: true,
      mesasConteles: true,
      cantidadMesas: 2,
      asientosPorMesa: 4,
      sillasPorMesa: 12,
      mesasAdicionales: 2,
      imagen: '/distribucion_mesas/Diamond/diamond.png',
      activo: true
    },
    'Kendall': {
      moverMesas: false,
      mesasConteles: true,
      cantidadMesas: 3,
      asientosPorMesa: 4,
      sillasPorMesa: 10,
      imagen: '/distribucion_mesas/Kendall/kendallgood.png',
      activo: true
    },
    'Doral': {
      moverMesas: false,
      mesasConteles: true,
      cantidadMesas: 3,
      asientosPorMesa: 4,
      sillasPorMesa: 10,
      imagen: '/distribucion_mesas/Doral/doral.png',
      activo: true
    }
  };
  
  // Buscar el salón de forma case-insensitive
  const salonNombreKey = salonNombre 
    ? Object.keys(configuracionSalones).find(key => 
        key.toLowerCase() === salonNombre.toLowerCase()
      ) || salonNombre
    : null;
  
  const configSalon = salonNombreKey && salonNombreKey in configuracionSalones
    ? configuracionSalones[salonNombreKey]
    : null;
  
  const mostrarMantenimiento = configSalon && !configSalon.activo;
  
  // Crear mesas iniciales automáticamente si no existen y hay configuración de salón
  useEffect(() => {
    if (configSalon && configSalon.activo && mesas && mesas.length === 0 && contrato && puedeEditar && !loadingMesas) {
      const crearMesasIniciales = async () => {
        try {
          const mesasACrear = [];
          for (let i = 1; i <= configSalon.cantidadMesas; i++) {
            mesasACrear.push({
              contrato_id: parseInt(contratoId),
              numero_mesa: i,
              nombre_mesa: `Mesa ${i}`,
              capacidad: configSalon.sillasPorMesa
            });
          }
          
          // Crear todas las mesas
          for (const mesa of mesasACrear) {
            await api.post('/mesas', mesa);
          }
          
          // Invalidar queries para refrescar
          queryClient.invalidateQueries(['mesas', contratoId]);
        } catch (error) {
          console.error('Error al crear mesas iniciales:', error);
        }
      };
      
      crearMesasIniciales();
    }
  }, [configSalon, mesas, contrato, contratoId, puedeEditar, queryClient, loadingMesas]);
  
  // Debug: mostrar información del salón en consola (siempre en desarrollo)
  console.log('🔍 Debug Asignación Mesas:', {
    contratoId,
    salonNombreRaw,
    salonNombre,
    salonNombreKey,
    salonId,
    tieneSalon: !!contrato?.salones,
    salonDesdeContrato: contrato?.salones?.nombre,
    salonDesdeLugar: contrato?.lugar_salon,
    salonDesdeOferta: contrato?.ofertas?.lugar_salon,
    contrato: contrato ? {
      salon_id: contrato.salon_id,
      lugar_salon: contrato.lugar_salon,
      tieneSalones: !!contrato.salones,
      tieneOfertas: !!contrato.ofertas
    } : null,
    configSalon: !!configSalon
  });

  // Modal/Dropdown para seleccionar invitado a asignar
  const handleAsignarInvitadoAMesa = (invitadoId) => {
    if (mesaSeleccionadaParaAsignar) {
      asignarInvitadoMutation.mutate({ 
        invitadoId, 
        mesaId: mesaSeleccionadaParaAsignar 
      });
      setMesaSeleccionadaParaAsignar(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Modal para seleccionar invitado */}
      {mesaSeleccionadaParaAsignar && puedeEditar && invitadosSinMesa.length > 0 && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Seleccionar Invitado
              </h3>
              <button
                onClick={() => setMesaSeleccionadaParaAsignar(null)}
                className="p-1 rounded hover:bg-gray-100 transition"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Selecciona un invitado para asignar a la mesa
            </p>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {invitadosSinMesa.map((invitado) => (
                <button
                  key={invitado.id}
                  onClick={() => handleAsignarInvitadoAMesa(invitado.id)}
                  disabled={asignarInvitadoMutation.isPending}
                  className="w-full text-left p-3 border rounded-lg hover:bg-indigo-50 hover:border-indigo-300 transition disabled:opacity-50"
                >
                  <p className="font-medium text-gray-900">{invitado.nombre_completo}</p>
                  <p className="text-xs text-gray-500 capitalize">{invitado.tipo}</p>
                </button>
              ))}
            </div>
            <button
              onClick={() => setMesaSeleccionadaParaAsignar(null)}
              className="mt-4 w-full px-4 py-2 border rounded-lg hover:bg-gray-100 transition"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
      
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to={`/contratos/${contratoId}`} className="p-2 hover:bg-gray-100 rounded-lg transition">
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-gray-900">Asignación de Mesas</h1>
            {esVendedor && (
              <span className="px-3 py-1 text-xs font-medium bg-amber-100 text-amber-800 rounded-full flex items-center gap-1">
                <Eye className="w-3 h-3" />
                Solo Lectura
              </span>
            )}
          </div>
          <p className="text-gray-600 mt-1">
            {contrato?.codigo_contrato} - {contrato?.clientes?.nombre_completo}
          </p>
        </div>
      </div>

      {/* Banner informativo para vendedor */}
      {esVendedor && (
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-lg">
          <div className="flex items-start gap-3">
            <Eye className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-blue-900">
                Vista de Solo Lectura
              </p>
              <p className="text-sm text-blue-700 mt-1">
                Como vendedor, puedes ver la asignación de mesas pero no puedes editarla. Solo el cliente puede realizar cambios en esta sección.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
        {/* Panel Central: Gráfico Visual de Distribución */}
        <div className="lg:col-span-1 space-y-4">
          {/* Vista Visual de Distribución - Mostrar si hay salón o si hay mesas */}
          {(salonNombre || salonId) && (
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
                <Table className="w-5 h-5 text-indigo-600" />
                Distribución Visual - {salonNombreKey || salonNombre || (salonId ? 'Salón ID: ' + salonId : 'Salón')}
              </h2>
              
              {!configSalon ? (
                <div className="bg-gray-50 border-l-4 border-gray-400 p-6 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0">
                      <Table className="w-8 h-8 text-gray-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        Salón no configurado
                      </h3>
                      <p className="text-gray-700">
                        El salón "{salonNombre}" aún no tiene una distribución visual configurada.
                        Por favor, utiliza la lista de mesas a continuación para gestionar las asignaciones.
                      </p>
                    </div>
                  </div>
                </div>
              ) : mostrarMantenimiento ? (
                <div className="bg-amber-50 border-l-4 border-amber-500 p-6 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0">
                      <Table className="w-8 h-8 text-amber-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-amber-900 mb-1">
                        {configSalon.mensaje || 'En Mantenimiento'}
                      </h3>
                      <p className="text-amber-700">
                        La distribución visual de mesas para el salón {salonNombreKey || salonNombre} está en desarrollo.
                        Por favor, utiliza la lista de mesas a continuación para gestionar las asignaciones.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="relative bg-white rounded-lg overflow-hidden border-2 border-gray-300">
                  {/* Imagen del plano del salón */}
                  <div className="relative w-full">
                    <img 
                      src={(() => {
                        // Construir URL completa si es relativa
                        const imagenPath = configSalon.imagen;
                        if (!imagenPath) return '';
                        if (imagenPath.startsWith('http')) return imagenPath;
                        
                        // Si es relativa, construir URL completa
                        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
                        const baseUrl = apiUrl.replace('/api', '') || 'http://localhost:5000';
                        const path = imagenPath.startsWith('/') ? imagenPath : `/${imagenPath}`;
                        return `${baseUrl}${path}`;
                      })()} 
                      alt={`Plano del salón ${salonNombreKey || salonNombre}`}
                      className="w-full h-auto object-contain"
                      style={{ maxHeight: '800px' }}
                      onError={(e) => {
                        console.error('Error cargando imagen:', configSalon.imagen);
                        e.target.style.display = 'none';
                      }}
                    />
                  </div>
                  
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AsignacionMesas;



