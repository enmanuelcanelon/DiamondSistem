import { useState } from 'react';
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
} from 'lucide-react';
import api from '../config/api';

function AsignacionMesas() {
  const { id: contratoId } = useParams();
  const queryClient = useQueryClient();
  
  const [nuevaMesa, setNuevaMesa] = useState({
    numero_mesa: '',
    nombre_mesa: '',
    capacidad: 10,
    forma: 'redonda',
  });
  
  const [nuevoInvitado, setNuevoInvitado] = useState({
    nombre_completo: '',
    email: '',
    telefono: '',
    tipo: 'adulto',
  });
  
  const [editandoMesa, setEditandoMesa] = useState(null);
  const [mostrarFormMesa, setMostrarFormMesa] = useState(false);
  const [mostrarFormInvitado, setMostrarFormInvitado] = useState(false);

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
      setNuevaMesa({ numero_mesa: '', nombre_mesa: '', capacidad: 10, forma: 'redonda' });
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
      setNuevoInvitado({ nombre_completo: '', email: '', telefono: '', tipo: 'adulto' });
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to={`/contratos/${contratoId}`} className="p-2 hover:bg-gray-100 rounded-lg transition">
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-900">Asignación de Mesas</h1>
          <p className="text-gray-600 mt-1">
            {contrato?.codigo_contrato} - {contrato?.clientes?.nombre_completo}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Panel Izquierdo: Invitados Sin Asignar */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-600" />
                Invitados Sin Mesa ({invitadosSinMesa.length})
              </h2>
              <button
                onClick={() => setMostrarFormInvitado(!mostrarFormInvitado)}
                className="p-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition"
                title="Agregar Invitado"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>

            {/* Formulario para agregar invitado */}
            {mostrarFormInvitado && (
              <form onSubmit={handleCrearInvitado} className="mb-4 p-4 bg-gray-50 rounded-lg space-y-3">
                <input
                  type="text"
                  placeholder="Nombre completo *"
                  value={nuevoInvitado.nombre_completo}
                  onChange={(e) => setNuevoInvitado({ ...nuevoInvitado, nombre_completo: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                  required
                />
                <input
                  type="email"
                  placeholder="Email"
                  value={nuevoInvitado.email}
                  onChange={(e) => setNuevoInvitado({ ...nuevoInvitado, email: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
                <input
                  type="tel"
                  placeholder="Teléfono"
                  value={nuevoInvitado.telefono}
                  onChange={(e) => setNuevoInvitado({ ...nuevoInvitado, telefono: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
                <select
                  value={nuevoInvitado.tipo}
                  onChange={(e) => setNuevoInvitado({ ...nuevoInvitado, tipo: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                >
                  <option value="adulto">Adulto</option>
                  <option value="niño">Niño</option>
                  <option value="bebe">Bebé</option>
                </select>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={crearInvitadoMutation.isPending}
                    className="flex-1 px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm disabled:opacity-50"
                  >
                    {crearInvitadoMutation.isPending ? 'Guardando...' : 'Guardar'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setMostrarFormInvitado(false)}
                    className="px-3 py-2 border rounded-lg hover:bg-gray-100 text-sm"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            )}

            {/* Lista de invitados sin mesa */}
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {loadingInvitados ? (
                <p className="text-gray-500 text-sm text-center py-8">Cargando invitados...</p>
              ) : invitadosSinMesa.length === 0 ? (
                <p className="text-gray-500 text-sm text-center py-8">
                  Todos los invitados están asignados a mesas
                </p>
              ) : (
                invitadosSinMesa.map((invitado) => (
                  <div
                    key={invitado.id}
                    className="p-3 border rounded-lg hover:border-indigo-300 transition bg-white group"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 text-sm">{invitado.nombre_completo}</p>
                        <p className="text-xs text-gray-500">{invitado.tipo}</p>
                      </div>
                      <button
                        onClick={() => handleEliminarInvitado(invitado.id)}
                        className="p-1 rounded text-red-600 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition"
                        title="Eliminar invitado"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    
                    {/* Dropdown para asignar a mesa */}
                    {mesas && mesas.length > 0 && (
                      <select
                        onChange={(e) => handleAsignarInvitado(invitado.id, parseInt(e.target.value))}
                        className="w-full mt-2 px-2 py-1 border rounded text-xs"
                        defaultValue=""
                      >
                        <option value="">Asignar a mesa...</option>
                        {mesas.map((mesa) => (
                          <option
                            key={mesa.id}
                            value={mesa.id}
                            disabled={mesa.invitados.length >= mesa.capacidad}
                          >
                            Mesa {mesa.numero_mesa} {mesa.nombre_mesa ? `(${mesa.nombre_mesa})` : ''} - 
                            {mesa.invitados.length}/{mesa.capacidad}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Panel Derecho: Mesas */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Table className="w-5 h-5 text-indigo-600" />
                Mesas ({mesas?.length || 0})
              </h2>
              <button
                onClick={() => setMostrarFormMesa(!mostrarFormMesa)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition text-sm"
              >
                <Plus className="w-4 h-4" />
                Nueva Mesa
              </button>
            </div>

            {/* Formulario para crear mesa */}
            {mostrarFormMesa && (
              <form onSubmit={handleCrearMesa} className="mb-4 p-4 bg-gray-50 rounded-lg space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="number"
                    placeholder="Número de mesa *"
                    value={nuevaMesa.numero_mesa}
                    onChange={(e) => setNuevaMesa({ ...nuevaMesa, numero_mesa: e.target.value })}
                    className="px-3 py-2 border rounded-lg text-sm"
                    required
                    min="1"
                  />
                  <input
                    type="text"
                    placeholder="Nombre (opcional)"
                    value={nuevaMesa.nombre_mesa}
                    onChange={(e) => setNuevaMesa({ ...nuevaMesa, nombre_mesa: e.target.value })}
                    className="px-3 py-2 border rounded-lg text-sm"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="number"
                    placeholder="Capacidad *"
                    value={nuevaMesa.capacidad}
                    onChange={(e) => setNuevaMesa({ ...nuevaMesa, capacidad: e.target.value })}
                    className="px-3 py-2 border rounded-lg text-sm"
                    required
                    min="1"
                  />
                  <select
                    value={nuevaMesa.forma}
                    onChange={(e) => setNuevaMesa({ ...nuevaMesa, forma: e.target.value })}
                    className="px-3 py-2 border rounded-lg text-sm"
                  >
                    <option value="redonda">Redonda</option>
                    <option value="rectangular">Rectangular</option>
                    <option value="cuadrada">Cuadrada</option>
                  </select>
                </div>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={crearMesaMutation.isPending}
                    className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm disabled:opacity-50"
                  >
                    {crearMesaMutation.isPending ? 'Creando...' : 'Crear Mesa'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setMostrarFormMesa(false)}
                    className="px-4 py-2 border rounded-lg hover:bg-gray-100 text-sm"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            )}

            {/* Lista de mesas */}
            <div className="space-y-4">
              {loadingMesas ? (
                <p className="text-gray-500 text-sm text-center py-8">Cargando mesas...</p>
              ) : !mesas || mesas.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Table className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-gray-600 mb-4">No hay mesas creadas</p>
                  <button
                    onClick={() => setMostrarFormMesa(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                  >
                    <Plus className="w-5 h-5" />
                    Crear Primera Mesa
                  </button>
                </div>
              ) : (
                mesas.map((mesa) => (
                  <div
                    key={mesa.id}
                    className="border rounded-lg p-4 hover:border-indigo-300 transition bg-white"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          Mesa {mesa.numero_mesa}
                          {mesa.nombre_mesa && <span className="text-gray-600 font-normal ml-2">({mesa.nombre_mesa})</span>}
                        </h3>
                        <p className="text-sm text-gray-600">
                          Capacidad: {mesa.invitados.length}/{mesa.capacidad} | Forma: {mesa.forma}
                        </p>
                      </div>
                      <button
                        onClick={() => handleEliminarMesa(mesa.id)}
                        disabled={eliminarMesaMutation.isPending}
                        className="p-2 rounded text-red-600 hover:bg-red-50 transition"
                        title="Eliminar mesa"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Invitados en la mesa */}
                    {mesa.invitados.length === 0 ? (
                      <p className="text-sm text-gray-500 italic">Sin invitados asignados</p>
                    ) : (
                      <div className="space-y-2">
                        {mesa.invitados.map((invitado) => (
                          <div
                            key={invitado.id}
                            className="flex items-center justify-between p-2 bg-gray-50 rounded group"
                          >
                            <div>
                              <p className="text-sm font-medium text-gray-900">{invitado.nombre_completo}</p>
                              <p className="text-xs text-gray-500">{invitado.tipo}</p>
                            </div>
                            <button
                              onClick={() => handleDesasignarInvitado(invitado.id)}
                              disabled={asignarInvitadoMutation.isPending}
                              className="p-1 rounded text-orange-600 hover:bg-orange-50 opacity-0 group-hover:opacity-100 transition"
                              title="Desasignar de esta mesa"
                            >
                              <UserMinus className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Progress bar */}
                    <div className="mt-3">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all ${
                            mesa.invitados.length >= mesa.capacidad
                              ? 'bg-red-500'
                              : mesa.invitados.length > mesa.capacidad * 0.7
                              ? 'bg-yellow-500'
                              : 'bg-green-500'
                          }`}
                          style={{ width: `${Math.min((mesa.invitados.length / mesa.capacidad) * 100, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AsignacionMesas;



