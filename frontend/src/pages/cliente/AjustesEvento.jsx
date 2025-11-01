import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast, { Toaster } from 'react-hot-toast';
import {
  Cake,
  Sparkles,
  UtensilsCrossed,
  Music2,
  Camera,
  Settings,
  Save,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Lock,
} from 'lucide-react';
import useAuthStore from '../../store/useAuthStore';
import api from '../../config/api';

function AjustesEvento() {
  const { user } = useAuthStore();
  const contratoId = user?.contrato_id;
  const queryClient = useQueryClient();
  
  const [tabActivo, setTabActivo] = useState('torta');
  const [guardando, setGuardando] = useState(false);

  // Query para obtener el contrato (para la fecha del evento)
  const { data: contrato } = useQuery({
    queryKey: ['contrato-cliente-ajustes', contratoId],
    queryFn: async () => {
      const response = await api.get(`/contratos/${contratoId}`);
      return response.data.contrato;
    },
    enabled: !!contratoId,
  });

  // Calcular días hasta el evento
  const diasHastaEvento = contrato?.fecha_evento 
    ? Math.floor((new Date(contrato.fecha_evento) - new Date()) / (1000 * 60 * 60 * 24))
    : null;
  
  // Verificar si está bloqueado (menos de 10 días)
  const estaBloqueado = diasHastaEvento !== null && diasHastaEvento < 10;

  // Query para obtener ajustes
  const { data: ajustes, isLoading } = useQuery({
    queryKey: ['ajustes', contratoId],
    queryFn: async () => {
      const response = await api.get(`/ajustes/contrato/${contratoId}`);
      return response.data.ajustes;
    },
    enabled: !!contratoId,
  });

  // Mutation para actualizar ajustes
  const actualizarMutation = useMutation({
    mutationFn: async (datos) => {
      const response = await api.put(`/ajustes/contrato/${contratoId}`, datos);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries(['ajustes', contratoId]);
      setGuardando(false);
      // Mostrar notificación de éxito
      toast.success(data.message || 'Cambios guardados exitosamente', {
        duration: 3000,
        icon: '✅',
        style: {
          background: '#10b981',
          color: '#fff',
          fontWeight: 'bold',
        },
      });
    },
    onError: (error) => {
      setGuardando(false);
      const errorMsg = error.response?.data?.message || 'Error al guardar los cambios';
      toast.error(errorMsg, {
        duration: 4000,
        icon: '❌',
        style: {
          background: '#ef4444',
          color: '#fff',
          fontWeight: 'bold',
        },
      });
    },
  });

  const handleGuardar = (seccion, datos) => {
    setGuardando(true);
    actualizarMutation.mutate(datos);
  };

  const tabs = [
    { id: 'torta', label: 'Torta', icon: Cake, color: 'pink' },
    { id: 'decoracion', label: 'Decoración', icon: Sparkles, color: 'purple' },
    { id: 'menu', label: 'Menú', icon: UtensilsCrossed, color: 'orange' },
    { id: 'entretenimiento', label: 'Entretenimiento', icon: Music2, color: 'blue' },
    { id: 'fotografia', label: 'Fotografía', icon: Camera, color: 'green' },
    { id: 'otros', label: 'Otros', icon: Settings, color: 'gray' },
  ];

  const TabButton = ({ tab }) => {
    const Icon = tab.icon;
    const activo = tabActivo === tab.id;
    
    return (
      <button
        onClick={() => setTabActivo(tab.id)}
        className={`flex items-center gap-2 px-4 py-3 rounded-lg transition font-medium ${
          activo
            ? `bg-${tab.color}-100 text-${tab.color}-700`
            : 'text-gray-600 hover:bg-gray-100'
        }`}
      >
        <Icon className="w-5 h-5" />
        <span className="hidden sm:inline">{tab.label}</span>
      </button>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Toast Notifications */}
      <Toaster position="top-right" />
      
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Ajustes del Evento</h1>
        <p className="text-gray-600 mt-1">
          Personaliza todos los detalles de tu día especial
        </p>
      </div>

      {/* Banner de Bloqueo */}
      {estaBloqueado && (
        <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <Lock className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-bold text-red-900 mb-1">
                ⚠️ Ajustes Bloqueados
              </h3>
              <p className="text-sm text-red-800">
                Faltan menos de 10 días para tu evento. Los ajustes están bloqueados para garantizar 
                que todo esté listo a tiempo. Si necesitas hacer cambios urgentes, por favor contacta 
                a tu asesor de eventos a través del chat.
              </p>
              <p className="text-xs text-red-700 mt-2">
                📅 Días restantes: <strong>{diasHastaEvento}</strong>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Banner de Advertencia (5-10 días) */}
      {!estaBloqueado && diasHastaEvento !== null && diasHastaEvento >= 0 && diasHastaEvento < 15 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-bold text-yellow-900 mb-1">
                Tiempo Limitado
              </h3>
              <p className="text-sm text-yellow-800">
                Tu evento está próximo ({diasHastaEvento} días). Asegúrate de finalizar todos 
                los ajustes pronto. Recuerda que no podrás modificar nada 10 días antes del evento.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Progress Bar */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Progreso de Personalización</span>
          <span className="text-sm font-bold text-purple-600">
            {ajustes?.porcentaje_completado || 0}%
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className="bg-gradient-to-r from-purple-600 to-pink-600 h-3 rounded-full transition-all"
            style={{ width: `${ajustes?.porcentaje_completado || 0}%` }}
          ></div>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Completa los campos importantes para asegurar que todo esté a tu gusto
        </p>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border p-4">
        <div className="flex flex-wrap gap-2">
          {tabs.map((tab) => (
            <TabButton key={tab.id} tab={tab} />
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        {tabActivo === 'torta' && (
          <SeccionTorta ajustes={ajustes} onGuardar={handleGuardar} guardando={guardando} estaBloqueado={estaBloqueado} />
        )}
        {tabActivo === 'decoracion' && (
          <SeccionDecoracion ajustes={ajustes} onGuardar={handleGuardar} guardando={guardando} estaBloqueado={estaBloqueado} />
        )}
        {tabActivo === 'menu' && (
          <SeccionMenu ajustes={ajustes} onGuardar={handleGuardar} guardando={guardando} estaBloqueado={estaBloqueado} />
        )}
        {tabActivo === 'entretenimiento' && (
          <SeccionEntretenimiento ajustes={ajustes} onGuardar={handleGuardar} guardando={guardando} estaBloqueado={estaBloqueado} />
        )}
        {tabActivo === 'fotografia' && (
          <SeccionFotografia ajustes={ajustes} onGuardar={handleGuardar} guardando={guardando} estaBloqueado={estaBloqueado} />
        )}
        {tabActivo === 'otros' && (
          <SeccionOtros ajustes={ajustes} onGuardar={handleGuardar} guardando={guardando} estaBloqueado={estaBloqueado} />
        )}
      </div>
    </div>
  );
}

// ===== SECCIÓN TORTA =====
function SeccionTorta({ ajustes, onGuardar, guardando, estaBloqueado }) {
  const [datos, setDatos] = useState({
    sabor_torta: ajustes?.sabor_torta || '',
    tamano_torta: ajustes?.tamano_torta || '',
    tipo_relleno: ajustes?.tipo_relleno || '',
    diseno_torta: ajustes?.diseno_torta || '',
    notas_torta: ajustes?.notas_torta || '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onGuardar('torta', datos);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Cake className="w-6 h-6 text-pink-600" />
        <h2 className="text-2xl font-bold text-gray-900">Detalles de la Torta</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Sabor Principal *
          </label>
          <select
            value={datos.sabor_torta}
            onChange={(e) => setDatos({ ...datos, sabor_torta: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none"
          >
            <option value="">Seleccionar...</option>
            <option value="Vainilla">Vainilla</option>
            <option value="Chocolate">Chocolate</option>
            <option value="Red Velvet">Red Velvet</option>
            <option value="Zanahoria">Zanahoria</option>
            <option value="Limón">Limón</option>
            <option value="Fresa">Fresa</option>
            <option value="Marmoleado">Marmoleado</option>
            <option value="Otro">Otro</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tamaño
          </label>
          <select
            value={datos.tamano_torta}
            onChange={(e) => setDatos({ ...datos, tamano_torta: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none"
          >
            <option value="">Seleccionar...</option>
            <option value="1 piso">1 piso</option>
            <option value="2 pisos">2 pisos</option>
            <option value="3 pisos">3 pisos</option>
            <option value="4+ pisos">4+ pisos</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tipo de Relleno
          </label>
          <input
            type="text"
            value={datos.tipo_relleno}
            onChange={(e) => setDatos({ ...datos, tipo_relleno: e.target.value })}
            placeholder="Ej: Crema de mantequilla, Mermelada de fresa"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Diseño/Decoración
          </label>
          <input
            type="text"
            value={datos.diseno_torta}
            onChange={(e) => setDatos({ ...datos, diseno_torta: e.target.value })}
            placeholder="Ej: Flores naturales, Fondant, Minimalista"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Notas Adicionales
        </label>
        <textarea
          value={datos.notas_torta}
          onChange={(e) => setDatos({ ...datos, notas_torta: e.target.value })}
          rows="3"
          placeholder="Cualquier detalle especial sobre la torta..."
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none"
        ></textarea>
      </div>

      <button
        type="submit"
        disabled={guardando || estaBloqueado}
        className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-pink-600 to-rose-600 text-white rounded-lg hover:from-pink-700 hover:to-rose-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {guardando ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Guardando...
          </>
        ) : estaBloqueado ? (
          <>
            <Lock className="w-5 h-5" />
            Bloqueado
          </>
        ) : (
          <>
            <Save className="w-5 h-5" />
            Guardar Cambios
          </>
        )}
      </button>
    </form>
  );
}

// ===== SECCIÓN DECORACIÓN =====
function SeccionDecoracion({ ajustes, onGuardar, guardando, estaBloqueado }) {
  const [datos, setDatos] = useState({
    estilo_decoracion: ajustes?.estilo_decoracion || '',
    colores_principales: ajustes?.colores_principales || '',
    flores_preferidas: ajustes?.flores_preferidas || '',
    tematica: ajustes?.tematica || '',
    notas_decoracion: ajustes?.notas_decoracion || '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onGuardar('decoracion', datos);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Sparkles className="w-6 h-6 text-purple-600" />
        <h2 className="text-2xl font-bold text-gray-900">Decoración del Evento</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Estilo de Decoración
          </label>
          <select
            value={datos.estilo_decoracion}
            onChange={(e) => setDatos({ ...datos, estilo_decoracion: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
          >
            <option value="">Seleccionar...</option>
            <option value="Clásico">Clásico</option>
            <option value="Moderno">Moderno</option>
            <option value="Rústico">Rústico</option>
            <option value="Elegante">Elegante</option>
            <option value="Vintage">Vintage</option>
            <option value="Bohemio">Bohemio</option>
            <option value="Minimalista">Minimalista</option>
            <option value="Romántico">Romántico</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Temática
          </label>
          <input
            type="text"
            value={datos.tematica}
            onChange={(e) => setDatos({ ...datos, tematica: e.target.value })}
            placeholder="Ej: Jardín, Playa, Cuento de Hadas"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Colores Principales
          </label>
          <input
            type="text"
            value={datos.colores_principales}
            onChange={(e) => setDatos({ ...datos, colores_principales: e.target.value })}
            placeholder="Ej: Blanco y dorado, Rosa y verde menta"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Flores Preferidas
          </label>
          <input
            type="text"
            value={datos.flores_preferidas}
            onChange={(e) => setDatos({ ...datos, flores_preferidas: e.target.value })}
            placeholder="Ej: Rosas, Peonías, Hortensias"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Notas Adicionales
        </label>
        <textarea
          value={datos.notas_decoracion}
          onChange={(e) => setDatos({ ...datos, notas_decoracion: e.target.value })}
          rows="3"
          placeholder="Cualquier detalle especial sobre la decoración..."
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
        ></textarea>
      </div>

      <button
        type="submit"
        disabled={guardando || estaBloqueado}
        className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 transition font-medium disabled:opacity-50"
      >
        {guardando ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Guardando...
          </>
        ) : (
          <>
            <Save className="w-5 h-5" />
            Guardar Cambios
          </>
        )}
      </button>
    </form>
  );
}

// ===== SECCIÓN MENÚ =====
function SeccionMenu({ ajustes, onGuardar, guardando, estaBloqueado }) {
  const [datos, setDatos] = useState({
    tipo_servicio: ajustes?.tipo_servicio || '',
    entrada: ajustes?.entrada || '',
    plato_principal: ajustes?.plato_principal || '',
    acompanamientos: ajustes?.acompanamientos || '',
    opciones_vegetarianas: ajustes?.opciones_vegetarianas || '',
    opciones_veganas: ajustes?.opciones_veganas || '',
    restricciones_alimentarias: ajustes?.restricciones_alimentarias || '',
    bebidas_incluidas: ajustes?.bebidas_incluidas || '',
    notas_menu: ajustes?.notas_menu || '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onGuardar('menu', datos);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <UtensilsCrossed className="w-6 h-6 text-orange-600" />
        <h2 className="text-2xl font-bold text-gray-900">Servicio de Comida</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tipo de Servicio
          </label>
          <select
            value={datos.tipo_servicio}
            onChange={(e) => setDatos({ ...datos, tipo_servicio: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
          >
            <option value="">Seleccionar...</option>
            <option value="Buffet">Buffet</option>
            <option value="Emplatado">Emplatado</option>
            <option value="Estaciones">Estaciones</option>
            <option value="Cocktail">Cocktail</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Entrada
          </label>
          <input
            type="text"
            value={datos.entrada}
            onChange={(e) => setDatos({ ...datos, entrada: e.target.value })}
            placeholder="Ej: Ensalada César"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Plato Principal
          </label>
          <input
            type="text"
            value={datos.plato_principal}
            onChange={(e) => setDatos({ ...datos, plato_principal: e.target.value })}
            placeholder="Ej: Lomo a la parrilla"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Acompañamientos
          </label>
          <input
            type="text"
            value={datos.acompanamientos}
            onChange={(e) => setDatos({ ...datos, acompanamientos: e.target.value })}
            placeholder="Ej: Papas gratinadas, vegetales"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
          />
        </div>
      </div>

      <div className="border-t pt-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <span>🌱</span> Opciones Especiales
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Opciones Vegetarianas
            </label>
            <textarea
              value={datos.opciones_vegetarianas}
              onChange={(e) => setDatos({ ...datos, opciones_vegetarianas: e.target.value })}
              rows={2}
              placeholder="Describe las opciones vegetarianas disponibles"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Opciones Veganas
            </label>
            <textarea
              value={datos.opciones_veganas}
              onChange={(e) => setDatos({ ...datos, opciones_veganas: e.target.value })}
              rows={2}
              placeholder="Describe las opciones veganas disponibles"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Restricciones Alimentarias
            </label>
            <textarea
              value={datos.restricciones_alimentarias}
              onChange={(e) => setDatos({ ...datos, restricciones_alimentarias: e.target.value })}
              rows={2}
              placeholder="Alergias, intolerancias, o restricciones especiales"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Bebidas Incluidas
            </label>
            <textarea
              value={datos.bebidas_incluidas}
              onChange={(e) => setDatos({ ...datos, bebidas_incluidas: e.target.value })}
              rows={2}
              placeholder="Lista de bebidas disponibles"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notas Adicionales del Menú
            </label>
            <textarea
              value={datos.notas_menu}
              onChange={(e) => setDatos({ ...datos, notas_menu: e.target.value })}
              rows={3}
              placeholder="Cualquier comentario o solicitud especial sobre el menú"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
            />
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={guardando || estaBloqueado}
        className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-600 to-amber-600 text-white rounded-lg hover:from-orange-700 hover:to-amber-700 transition font-medium disabled:opacity-50"
      >
        {guardando ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Guardando...
          </>
        ) : (
          <>
            <Save className="w-5 h-5" />
            Guardar Cambios
          </>
        )}
      </button>
    </form>
  );
}

// ===== SECCIÓN ENTRETENIMIENTO =====
function SeccionEntretenimiento({ ajustes, onGuardar, guardando, estaBloqueado }) {
  const [datos, setDatos] = useState({
    musica_ceremonial: ajustes?.musica_ceremonial || '',
    primer_baile: ajustes?.primer_baile || '',
    baile_padre_hija: ajustes?.baile_padre_hija || '',
    baile_madre_hijo: ajustes?.baile_madre_hijo || '',
    hora_show: ajustes?.hora_show || '',
    actividades_especiales: ajustes?.actividades_especiales || '',
    notas_entretenimiento: ajustes?.notas_entretenimiento || '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onGuardar('entretenimiento', datos);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Music2 className="w-6 h-6 text-blue-600" />
        <h2 className="text-2xl font-bold text-gray-900">Entretenimiento y Música</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Música para Ceremonia / Entrada
          </label>
          <input
            type="text"
            value={datos.musica_ceremonial}
            onChange={(e) => setDatos({ ...datos, musica_ceremonial: e.target.value })}
            placeholder="Ej: A Thousand Years - Christina Perri"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Primer Baile
          </label>
          <input
            type="text"
            value={datos.primer_baile}
            onChange={(e) => setDatos({ ...datos, primer_baile: e.target.value })}
            placeholder="Ej: Perfect - Ed Sheeran"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Baile Padre-Hija
          </label>
          <input
            type="text"
            value={datos.baile_padre_hija}
            onChange={(e) => setDatos({ ...datos, baile_padre_hija: e.target.value })}
            placeholder="Ej: My Girl - The Temptations"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Baile Madre-Hijo
          </label>
          <input
            type="text"
            value={datos.baile_madre_hijo}
            onChange={(e) => setDatos({ ...datos, baile_madre_hijo: e.target.value })}
            placeholder="Ej: A Song for Mama - Boyz II Men"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Hora del Show / Entretenimiento Especial
          </label>
          <input
            type="text"
            value={datos.hora_show}
            onChange={(e) => setDatos({ ...datos, hora_show: e.target.value })}
            placeholder="Ej: 22:00 - Show de Fuego"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Actividades Especiales
        </label>
        <textarea
          value={datos.actividades_especiales}
          onChange={(e) => setDatos({ ...datos, actividades_especiales: e.target.value })}
          rows={3}
          placeholder="Juegos, sorpresas, dinámicas especiales..."
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Notas Adicionales
        </label>
        <textarea
          value={datos.notas_entretenimiento}
          onChange={(e) => setDatos({ ...datos, notas_entretenimiento: e.target.value })}
          rows={3}
          placeholder="Cualquier detalle especial sobre el entretenimiento..."
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
        />
      </div>

      <button
        type="submit"
        disabled={guardando || estaBloqueado}
        className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg hover:from-blue-700 hover:to-cyan-700 transition font-medium disabled:opacity-50"
      >
        {guardando ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Guardando...
          </>
        ) : (
          <>
            <Save className="w-5 h-5" />
            Guardar Cambios
          </>
        )}
      </button>
    </form>
  );
}

// ===== SECCIÓN FOTOGRAFÍA =====
function SeccionFotografia({ ajustes, onGuardar, guardando, estaBloqueado }) {
  const [datos, setDatos] = useState({
    momentos_especiales: ajustes?.momentos_especiales || '',
    poses_especificas: ajustes?.poses_especificas || '',
    ubicaciones_fotos: ajustes?.ubicaciones_fotos || '',
    notas_fotografia: ajustes?.notas_fotografia || '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onGuardar('fotografia', datos);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Camera className="w-6 h-6 text-green-600" />
        <h2 className="text-2xl font-bold text-gray-900">Fotografía y Video</h2>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Momentos Especiales a Capturar
          </label>
          <textarea
            value={datos.momentos_especiales}
            onChange={(e) => setDatos({ ...datos, momentos_especiales: e.target.value })}
            rows={3}
            placeholder="Ej: Preparación de novia, llegada de invitados, intercambio de votos, primer baile..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Poses o Fotos Específicas Deseadas
          </label>
          <textarea
            value={datos.poses_especificas}
            onChange={(e) => setDatos({ ...datos, poses_especificas: e.target.value })}
            rows={3}
            placeholder="Ej: Foto con toda la familia, fotos espontáneas, retratos formales..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Ubicaciones para Sesión de Fotos
          </label>
          <textarea
            value={datos.ubicaciones_fotos}
            onChange={(e) => setDatos({ ...datos, ubicaciones_fotos: e.target.value })}
            rows={2}
            placeholder="Ej: Jardín exterior, escaleras, frente al lago..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Notas Adicionales
          </label>
          <textarea
            value={datos.notas_fotografia}
            onChange={(e) => setDatos({ ...datos, notas_fotografia: e.target.value })}
            rows={3}
            placeholder="Cualquier detalle especial sobre fotografía/video..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={guardando || estaBloqueado}
        className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition font-medium disabled:opacity-50"
      >
        {guardando ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Guardando...
          </>
        ) : (
          <>
            <Save className="w-5 h-5" />
            Guardar Cambios
          </>
        )}
      </button>
    </form>
  );
}

// ===== SECCIÓN OTROS =====
function SeccionOtros({ ajustes, onGuardar, guardando, estaBloqueado }) {
  const [datos, setDatos] = useState({
    invitado_honor: ajustes?.invitado_honor || '',
    brindis_especial: ajustes?.brindis_especial || '',
    sorpresas_planeadas: ajustes?.sorpresas_planeadas || '',
    solicitudes_especiales: ajustes?.solicitudes_especiales || '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onGuardar('otros', datos);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Settings className="w-6 h-6 text-gray-600" />
        <h2 className="text-2xl font-bold text-gray-900">Otros Detalles</h2>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Invitado(s) de Honor
          </label>
          <input
            type="text"
            value={datos.invitado_honor}
            onChange={(e) => setDatos({ ...datos, invitado_honor: e.target.value })}
            placeholder="Ej: Padrinos, abuelos, persona especial..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Brindis Especial
          </label>
          <input
            type="text"
            value={datos.brindis_especial}
            onChange={(e) => setDatos({ ...datos, brindis_especial: e.target.value })}
            placeholder="Ej: Brindis del padrino a las 20:30"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Sorpresas Planeadas
          </label>
          <textarea
            value={datos.sorpresas_planeadas}
            onChange={(e) => setDatos({ ...datos, sorpresas_planeadas: e.target.value })}
            rows={3}
            placeholder="Describe cualquier sorpresa que estés planeando..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Solicitudes Especiales
          </label>
          <textarea
            value={datos.solicitudes_especiales}
            onChange={(e) => setDatos({ ...datos, solicitudes_especiales: e.target.value })}
            rows={4}
            placeholder="Cualquier otra solicitud o detalle importante que quieras comunicar..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent outline-none"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={guardando || estaBloqueado}
        className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-gray-600 to-slate-600 text-white rounded-lg hover:from-gray-700 hover:to-slate-700 transition font-medium disabled:opacity-50"
      >
        {guardando ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Guardando...
          </>
        ) : (
          <>
            <Save className="w-5 h-5" />
            Guardar Cambios
          </>
        )}
      </button>
    </form>
  );
}

export default AjustesEvento;

