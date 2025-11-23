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
  
  // Debug removido para evitar re-renders innecesarios

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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 animate-fade-in">
      {/* Modal para seleccionar invitado */}
      {mesaSeleccionadaParaAsignar && puedeEditar && invitadosSinMesa.length > 0 && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-neutral-900 border border-white/10 rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">
                Seleccionar Invitado
              </h3>
              <button
                onClick={() => setMesaSeleccionadaParaAsignar(null)}
                className="p-1 rounded hover:bg-white/10 transition"
              >
                <X className="w-5 h-5 text-neutral-400" />
              </button>
            </div>
            <p className="text-sm text-neutral-400 mb-4">
              Selecciona un invitado para asignar a la mesa
            </p>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {invitadosSinMesa.map((invitado) => (
                <button
                  key={invitado.id}
                  onClick={() => handleAsignarInvitadoAMesa(invitado.id)}
                  disabled={asignarInvitadoMutation.isPending}
                  className="w-full text-left p-3 border border-white/10 rounded-lg hover:bg-white/5 hover:border-white/20 transition disabled:opacity-50"
                >
                  <p className="font-medium text-white">{invitado.nombre_completo}</p>
                  <p className="text-xs text-neutral-400 capitalize">{invitado.tipo}</p>
                </button>
              ))}
            </div>
            <button
              onClick={() => setMesaSeleccionadaParaAsignar(null)}
              className="mt-4 w-full px-4 py-2 bg-neutral-800 text-white rounded-lg hover:bg-neutral-700 transition border border-white/5"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <button
            onClick={() => window.history.back()}
            className="p-2 rounded-full bg-neutral-900 border border-white/10 text-neutral-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white mb-1">Distribución de Mesas</h1>
            <p className="text-neutral-400 text-sm">Organiza a tus invitados</p>
          </div>
        </div>
        {puedeEditar && (
          <button className="flex items-center gap-2 px-4 py-2 bg-white text-black rounded-full text-sm font-medium hover:bg-neutral-200 transition-colors">
            <Plus size={16} />
            Nueva Mesa
          </button>
        )}
      </div>

      {/* Banner informativo para vendedor */}
      {esVendedor && (
        <div className="bg-blue-500/10 border-l-4 border-blue-500 p-4 rounded-lg mb-6">
          <div className="flex items-start gap-3">
            <Eye className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-blue-400">
                Vista de Solo Lectura
              </p>
              <p className="text-sm text-neutral-400 mt-1">
                Como vendedor, puedes ver la asignación de mesas pero no puedes editarla. Solo el cliente puede realizar cambios en esta sección.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-neutral-900 border border-white/10 rounded-xl p-5">
          <div className="text-xs text-neutral-500 mb-1 uppercase tracking-wider">Invitados</div>
          <div className="text-2xl font-bold text-white">
            {invitadosData?.total || 0}
          </div>
        </div>
        <div className="bg-neutral-900 border border-white/10 rounded-xl p-5">
          <div className="text-xs text-neutral-500 mb-1 uppercase tracking-wider">Mesas</div>
          <div className="text-2xl font-bold text-white">{mesas?.length || 0}</div>
        </div>
        <div className="bg-neutral-900 border border-white/10 rounded-xl p-5">
          <div className="text-xs text-neutral-500 mb-1 uppercase tracking-wider">Sin Asignar</div>
          <div className="text-2xl font-bold text-white">{invitadosSinMesa.length}</div>
        </div>
      </div>

      {/* Tables Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {mesas?.map((mesa) => (
          <div
            key={mesa.id}
            className="bg-neutral-900 border border-white/10 rounded-xl p-6 hover:border-white/30 transition-colors cursor-pointer group"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-white">Mesa {mesa.numero_mesa}</h3>
              <span className="text-xs text-neutral-500 bg-white/5 px-2 py-1 rounded">
                {mesa.capacidad} asientos
              </span>
            </div>
            <div className="aspect-square bg-black/50 rounded-full border-2 border-dashed border-white/10 flex items-center justify-center mb-4 group-hover:border-white/20 transition-colors relative">
              <div className="absolute inset-2 rounded-full border border-white/5" />
              <Users className="text-neutral-600" size={24} />
            </div>
            <div className="space-y-2">
              <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-white rounded-full"
                  style={{
                    width: `${(mesa.invitados.length / mesa.capacidad) * 100}%`
                  }}
                />
              </div>
              <div className="flex justify-between text-xs text-neutral-500">
                <span>{mesa.invitados.length} ocupados</span>
                <span>{mesa.capacidad - mesa.invitados.length} libres</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default AsignacionMesas;



