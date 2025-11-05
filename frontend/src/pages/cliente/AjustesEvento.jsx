import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast, { Toaster } from 'react-hot-toast';
import {
  Cake,
  Sparkles,
  UtensilsCrossed,
  Music2,
  Settings,
  Save,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Wine,
  Construction,
  Car,
  Clock,
  Plus,
  X,
} from 'lucide-react';
import useAuthStore from '../../store/useAuthStore';
import api from '../../config/api';
import SeccionDecoracion from '../../components/SeccionDecoracion';

function AjustesEvento() {
  const { user } = useAuthStore();
  const contratoId = user?.contrato_id;
  const queryClient = useQueryClient();
  
  const [tabActivo, setTabActivo] = useState('torta');
  const [guardando, setGuardando] = useState(false);

  // Query para obtener el contrato (para la fecha del evento y servicios)
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

  // Verificar si tiene limosina contratada
  const tieneLimosina = contrato?.contratos_servicios?.some(
    cs => cs.servicios?.nombre?.toLowerCase().includes('limosina')
  );

  // Verificar si tiene pasapalos contratados
  const tienePasapalos = contrato?.contratos_servicios?.some(
    cs => cs.servicios?.nombre?.toLowerCase().includes('pasapalo')
  ) || contrato?.paquetes?.paquetes_servicios?.some(
    ps => ps.servicios?.nombre?.toLowerCase().includes('pasapalo')
  );

  const tabs = [
    { id: 'torta', label: 'Torta', icon: Cake, color: 'pink' },
    { id: 'decoracion', label: 'Decoración', icon: Sparkles, color: 'purple' },
    { id: 'menu', label: 'Menú', icon: UtensilsCrossed, color: 'orange' },
    { id: 'entretenimiento', label: 'Música', icon: Music2, color: 'blue' },
    { id: 'bar', label: 'Bar', icon: Wine, color: 'indigo' },
    { id: 'otros', label: 'Final', icon: Settings, color: 'gray' },
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
          <SeccionTorta 
            ajustes={ajustes} 
            onGuardar={handleGuardar} 
            guardando={guardando} 
            estaBloqueado={estaBloqueado}
            contrato={contrato}
          />
        )}
        {tabActivo === 'decoracion' && (
          <SeccionDecoracion 
            ajustes={ajustes} 
            onGuardar={handleGuardar} 
            guardando={guardando} 
            estaBloqueado={estaBloqueado}
            contrato={contrato}
          />
        )}
        {tabActivo === 'menu' && (
          <SeccionMenu 
            ajustes={ajustes} 
            onGuardar={handleGuardar} 
            guardando={guardando} 
            estaBloqueado={estaBloqueado}
            contrato={contrato}
            tienePasapalos={tienePasapalos}
          />
        )}
        {tabActivo === 'entretenimiento' && (
          <SeccionEntretenimiento ajustes={ajustes} onGuardar={handleGuardar} guardando={guardando} estaBloqueado={estaBloqueado} />
        )}
        {tabActivo === 'bar' && (
          <SeccionBar ajustes={ajustes} contrato={contrato} />
        )}
        {tabActivo === 'otros' && (
          <SeccionOtros 
            ajustes={ajustes} 
            onGuardar={handleGuardar} 
            guardando={guardando} 
            estaBloqueado={estaBloqueado}
            tieneLimosina={tieneLimosina}
            contrato={contrato}
          />
        )}
      </div>
    </div>
  );
}

// ===== SECCIÓN TORTA =====
function SeccionTorta({ ajustes, onGuardar, guardando, estaBloqueado, contrato }) {
  // Determinar número de pisos automáticamente según el salón
  const pisosPorSalon = {
    'Diamond': 3,
    'Kendall': 2,
    'Doral': 2
  };
  
  const nombreSalon = contrato?.lugar_salon || contrato?.salones?.nombre || 'Diamond';
  const pisosAutomaticos = pisosPorSalon[nombreSalon] || 3;

  const [datos, setDatos] = useState({
    sabor_torta: ajustes?.sabor_torta || '',
    sabor_otro: ajustes?.sabor_otro || '',
    diseno_torta: ajustes?.diseno_torta || '',
    diseno_otro: ajustes?.diseno_otro || '',
    pisos_torta: pisosAutomaticos,
    notas_torta: ajustes?.notas_torta || '',
  });

  const [mostrarSaborOtro, setMostrarSaborOtro] = useState(ajustes?.sabor_torta === 'Otro');
  const [mostrarDisenoOtro, setMostrarDisenoOtro] = useState(ajustes?.diseno_torta === 'Otro');

  const handleSubmit = (e) => {
    e.preventDefault();
    onGuardar('torta', { ...datos, pisos_torta: pisosAutomaticos });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Cake className="w-6 h-6 text-pink-600" />
        <h2 className="text-2xl font-bold text-gray-900">Detalles de la Torta</h2>
      </div>


      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Sabor: Vainilla, Marmoleado, u Otro */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Sabor *
          </label>
          <select
            value={datos.sabor_torta}
            onChange={(e) => {
              setDatos({ ...datos, sabor_torta: e.target.value, sabor_otro: e.target.value !== 'Otro' ? '' : datos.sabor_otro });
              setMostrarSaborOtro(e.target.value === 'Otro');
            }}
            disabled={estaBloqueado}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none disabled:bg-gray-100"
          >
            <option value="">Seleccionar...</option>
            <option value="Vainilla">Vainilla</option>
            <option value="Marmoleado">Marmoleado</option>
            <option value="Otro">Otro</option>
          </select>
          {mostrarSaborOtro && (
            <input
              type="text"
              value={datos.sabor_otro}
              onChange={(e) => setDatos({ ...datos, sabor_otro: e.target.value })}
              disabled={estaBloqueado}
              placeholder="Especificar sabor..."
              className="mt-2 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none disabled:bg-gray-100"
            />
          )}
        </div>

        {/* Diseño: Channel, Delux, Blanco, Desnudo, u Otro */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Diseño *
          </label>
          <select
            value={datos.diseno_torta}
            onChange={(e) => {
              setDatos({ ...datos, diseno_torta: e.target.value, diseno_otro: e.target.value !== 'Otro' ? '' : datos.diseno_otro });
              setMostrarDisenoOtro(e.target.value === 'Otro');
            }}
            disabled={estaBloqueado}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none disabled:bg-gray-100"
          >
            <option value="">Seleccionar...</option>
            <option value="Channel">Channel</option>
            <option value="Delux">Delux</option>
            <option value="Blanco">Blanco</option>
            <option value="Desnudo">Desnudo</option>
            <option value="Otro">Otro</option>
          </select>
          {mostrarDisenoOtro && (
            <input
              type="text"
              value={datos.diseno_otro}
              onChange={(e) => setDatos({ ...datos, diseno_otro: e.target.value })}
              disabled={estaBloqueado}
              placeholder="Especificar diseño..."
              className="mt-2 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none disabled:bg-gray-100"
            />
          )}
        </div>

        {/* Pisos (solo lectura) */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Número de Pisos (automático)
          </label>
          <input
            type="text"
            value={`${pisosAutomaticos} ${pisosAutomaticos === 1 ? 'piso' : 'pisos'}`}
            disabled
            className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
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

// ===== SECCIÓN MENÚ =====
function SeccionMenu({ ajustes, onGuardar, guardando, estaBloqueado, contrato, tienePasapalos }) {
  const [datos, setDatos] = useState({
    entrada: 'Ensalada César', // Valor fijo por defecto
    plato_principal: ajustes?.plato_principal || '',
    acompanamientos: ajustes?.acompanamientos || '',
    hay_teenagers: ajustes?.hay_teenagers || false,
    cantidad_teenagers: ajustes?.cantidad_teenagers || 0,
    teenagers_tipo_comida: ajustes?.teenagers_tipo_comida || 'pasta', // 'pasta' o 'menu'
    teenagers_tipo_pasta: ajustes?.teenagers_tipo_pasta || '', // 'napolitana' o 'alfredo'
    restricciones_alimentarias: ajustes?.restricciones_alimentarias || '',
    notas_menu: ajustes?.notas_menu || '',
  });

  const totalInvitados = contrato?.cantidad_invitados || 0;
  const invitadosAdultos = totalInvitados - (datos.cantidad_teenagers || 0);

  const handleSubmit = (e) => {
    e.preventDefault();
    // Enviar solo los campos que Prisma reconoce
    onGuardar('menu', {
      entrada: datos.entrada, // Siempre será "Ensalada César"
      plato_principal: datos.plato_principal,
      acompanamientos: datos.acompanamientos,
      hay_teenagers: datos.hay_teenagers,
      cantidad_teenagers: datos.hay_teenagers ? parseInt(datos.cantidad_teenagers) : 0,
      teenagers_tipo_comida: datos.hay_teenagers ? datos.teenagers_tipo_comida : null,
      teenagers_tipo_pasta: datos.hay_teenagers && datos.teenagers_tipo_comida === 'pasta' ? datos.teenagers_tipo_pasta : null,
      restricciones_alimentarias: datos.restricciones_alimentarias,
      notas_menu: datos.notas_menu,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <UtensilsCrossed className="w-6 h-6 text-orange-600" />
        <h2 className="text-2xl font-bold text-gray-900">Servicio de Comida</h2>
      </div>

      {/* Información de distribución */}
      <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
        <p className="text-sm font-medium text-blue-900">
          📊 Total de invitados: {totalInvitados}
        </p>
        {datos.hay_teenagers && (
          <p className="text-sm text-blue-700 mt-1">
            👥 Adultos: {invitadosAdultos} | 👶 Teens/Kids: {datos.cantidad_teenagers || 0}
          </p>
        )}
      </div>

      {/* Sección de Pasapalos (Solo informativa) */}
      {tienePasapalos && (
        <div className="border-2 border-amber-200 rounded-xl p-6 bg-gradient-to-br from-amber-50 to-yellow-50">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-2xl">🥟</span>
            <h3 className="text-lg font-bold text-amber-900">
              Pasapalos Incluidos
            </h3>
          </div>
          <p className="text-sm text-amber-800 mb-4">
            Tu evento incluye los siguientes pasapalos para deleitar a tus invitados:
          </p>
          <ul className="space-y-2">
            <li className="flex items-start gap-2 text-gray-700">
              <CheckCircle2 className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <span><strong>Tequeños</strong> - Clásicos y deliciosos</span>
            </li>
            <li className="flex items-start gap-2 text-gray-700">
              <CheckCircle2 className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <span><strong>Bolitas de carne</strong> - Jugosas y sabrosas</span>
            </li>
            <li className="flex items-start gap-2 text-gray-700">
              <CheckCircle2 className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <span><strong>Salchichas en hojaldre</strong> - Perfectas para picar</span>
            </li>
            <li className="flex items-start gap-2 text-gray-700">
              <CheckCircle2 className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <span><strong>Tuna tartar</strong> - Elegante y fresco</span>
            </li>
          </ul>
          <div className="mt-4 pt-4 border-t border-amber-200">
            <p className="text-xs text-amber-700 italic">
              ℹ️ Los pasapalos se servirán durante el cóctel de bienvenida
            </p>
          </div>
        </div>
      )}

      {/* Selección de Menú para Adultos */}
      <div className="border-2 border-orange-200 rounded-xl p-6 bg-orange-50">
        <h3 className="text-lg font-bold text-orange-900 mb-4 flex items-center gap-2">
          <span>🍽️</span> Menú para Adultos ({invitadosAdultos} platos)
        </h3>
        
        <div className="space-y-4">
          {/* Ensalada - Solo lectura */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Ensalada * <span className="text-xs text-gray-500">(incluida por defecto)</span>
            </label>
            <div className="w-full px-4 py-2 border-2 border-orange-300 rounded-lg bg-gray-50 text-gray-700 font-medium">
              🥗 {datos.entrada}
            </div>
          </div>

          {/* Plato Principal */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Plato Principal (Main Entrée) *
            </label>
            <select
              value={datos.plato_principal}
              onChange={(e) => setDatos({ ...datos, plato_principal: e.target.value })}
              disabled={estaBloqueado}
              className="w-full px-4 py-2 border-2 border-orange-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none bg-white disabled:bg-gray-100"
            >
              <option value="">Seleccionar...</option>
              <option value="Pollo Strogonoff con una salsa cremosa y champiñones">
                Pollo Strogonoff con una salsa cremosa y champiñones
              </option>
              <option value="Pollo Piccata">Pollo Piccata</option>
              <option value="Bistec (Palomilla o Boliche) en salsa de vino">
                Bistec (Palomilla o Boliche) en salsa de vino
              </option>
              <option value="Solomillo de Cerdo Marinado">
                Solomillo de Cerdo Marinado
              </option>
            </select>
          </div>

          {/* Acompañamiento */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Acompañamiento (Side) *
            </label>
            <select
              value={datos.acompanamientos}
              onChange={(e) => setDatos({ ...datos, acompanamientos: e.target.value })}
              disabled={estaBloqueado}
              className="w-full px-4 py-2 border-2 border-orange-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none bg-white disabled:bg-gray-100"
            >
              <option value="">Seleccionar...</option>
              <option value="Arroz Blanco o Amarillo">Arroz Blanco o Amarillo</option>
              <option value="Puré de Patatas o Patatas al Romero">
                Puré de Patatas o Patatas al Romero
              </option>
              <option value="Verduras al Vapor">Verduras al Vapor</option>
              <option value="Plátano Maduro">Plátano Maduro</option>
              <option value="Pan y Mantequilla">Pan y Mantequilla</option>
            </select>
          </div>
        </div>
      </div>

      {/* Teenagers/Kids */}
      <div className="border-2 border-purple-200 rounded-xl p-6 bg-purple-50">
        <div className="flex items-center gap-3 mb-4">
          <input
            type="checkbox"
            id="hay_teenagers"
            checked={datos.hay_teenagers}
            onChange={(e) => setDatos({ ...datos, hay_teenagers: e.target.checked, cantidad_teenagers: e.target.checked ? datos.cantidad_teenagers : 0 })}
            disabled={estaBloqueado}
            className="w-5 h-5 text-purple-600 border-gray-300 rounded focus:ring-purple-500 disabled:opacity-50"
          />
          <label htmlFor="hay_teenagers" className="text-lg font-bold text-purple-900 cursor-pointer">
            ¿Habrá Teenagers/Kids en el evento?
          </label>
        </div>

        {datos.hay_teenagers && (
          <div className="space-y-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Cantidad de Teens/Kids *
              </label>
              <input
                type="number"
                min="0"
                max={totalInvitados}
                value={datos.cantidad_teenagers}
                onChange={(e) => {
                  const valor = parseInt(e.target.value) || 0;
                  if (valor <= totalInvitados) {
                    setDatos({ ...datos, cantidad_teenagers: valor });
                  }
                }}
                disabled={estaBloqueado}
                className="w-full px-4 py-2 border-2 border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none bg-white disabled:bg-gray-100"
                required
              />
            </div>

            {/* Tipo de comida: Pasta o Menú */}
            {datos.cantidad_teenagers > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  ¿Quieren pasta o menú? *
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="teenagers_tipo_comida"
                      value="pasta"
                      checked={datos.teenagers_tipo_comida === 'pasta'}
                      onChange={(e) => setDatos({ ...datos, teenagers_tipo_comida: e.target.value, teenagers_tipo_pasta: '' })}
                      disabled={estaBloqueado}
                      className="w-4 h-4 text-purple-600 border-gray-300 focus:ring-purple-500 disabled:opacity-50"
                      required
                    />
                    <span className="text-sm font-medium text-gray-900">Pasta</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="teenagers_tipo_comida"
                      value="menu"
                      checked={datos.teenagers_tipo_comida === 'menu'}
                      onChange={(e) => setDatos({ ...datos, teenagers_tipo_comida: e.target.value, teenagers_tipo_pasta: '' })}
                      disabled={estaBloqueado}
                      className="w-4 h-4 text-purple-600 border-gray-300 focus:ring-purple-500 disabled:opacity-50"
                      required
                    />
                    <span className="text-sm font-medium text-gray-900">Menú</span>
                  </label>
                </div>
              </div>
            )}

            {/* Selección de tipo de pasta si eligieron pasta */}
            {datos.cantidad_teenagers > 0 && datos.teenagers_tipo_comida === 'pasta' && (
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Tipo de Pasta *
                </label>
                <select
                  value={datos.teenagers_tipo_pasta}
                  onChange={(e) => setDatos({ ...datos, teenagers_tipo_pasta: e.target.value })}
                  disabled={estaBloqueado}
                  className="w-full px-4 py-2 border-2 border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none bg-white disabled:bg-gray-100"
                  required
                >
                  <option value="">Seleccionar tipo de pasta...</option>
                  <option value="napolitana">Pasta Napolitana</option>
                  <option value="alfredo">Pasta Alfredo</option>
                </select>
              </div>
            )}

            {/* Resumen de platos */}
            {datos.cantidad_teenagers > 0 && (
              <div className="bg-purple-100 border border-purple-300 rounded-lg p-4">
                <p className="text-sm font-medium text-purple-900">
                  📋 Resumen de platos:
                </p>
                <ul className="text-sm text-purple-800 mt-2 space-y-1">
                  <li>• {invitadosAdultos} platos según selección de menú (adultos)</li>
                  <li>
                    • {datos.cantidad_teenagers} {datos.teenagers_tipo_comida === 'pasta' 
                      ? `pasta(s) ${datos.teenagers_tipo_pasta === 'napolitana' ? 'Napolitana' : datos.teenagers_tipo_pasta === 'alfredo' ? 'Alfredo' : ''}`
                      : 'menú(es) según selección'}
                    {' '}(teens/kids)
                  </li>
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Restricciones y Alergias */}
      <div className="border-t pt-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <span>🌱</span> Restricciones y Detalles Especiales
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Restricciones Alimentarias / Alergias / Vegetarianos
            </label>
            <textarea
              value={datos.restricciones_alimentarias}
              onChange={(e) => setDatos({ ...datos, restricciones_alimentarias: e.target.value })}
              disabled={estaBloqueado}
              rows={3}
              placeholder="Ej: 2 personas vegetarianas, 1 alergia a frutos secos, 1 intolerancia a lactosa..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none disabled:bg-gray-100"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notas Adicionales del Menú
            </label>
            <textarea
              value={datos.notas_menu}
              onChange={(e) => setDatos({ ...datos, notas_menu: e.target.value })}
              disabled={estaBloqueado}
              rows={3}
              placeholder="Cualquier comentario o solicitud especial sobre el menú..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none disabled:bg-gray-100"
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

// ===== SECCIÓN MÚSICA =====
function SeccionEntretenimiento({ ajustes, onGuardar, guardando, estaBloqueado }) {
  // Parsear bailes desde JSON o inicializar como array vacío
  const bailesIniciales = ajustes?.bailes_adicionales 
    ? (typeof ajustes.bailes_adicionales === 'string' 
        ? JSON.parse(ajustes.bailes_adicionales) 
        : ajustes.bailes_adicionales)
    : [];

  const [datos, setDatos] = useState({
    musica_ceremonial: ajustes?.musica_ceremonial || '',
    primer_baile: ajustes?.primer_baile || '',
    bailes: bailesIniciales.length > 0 ? bailesIniciales : [{ nombre: '', con_quien: '' }],
    cancion_sorpresa: ajustes?.cancion_sorpresa || '',
    notas_entretenimiento: ajustes?.notas_entretenimiento || '',
  });

  const agregarBaile = () => {
    setDatos({
      ...datos,
      bailes: [...datos.bailes, { nombre: '', con_quien: '' }]
    });
  };

  const eliminarBaile = (index) => {
    const nuevosBailes = datos.bailes.filter((_, i) => i !== index);
    setDatos({
      ...datos,
      bailes: nuevosBailes.length > 0 ? nuevosBailes : [{ nombre: '', con_quien: '' }]
    });
  };

  const actualizarBaile = (index, campo, valor) => {
    const nuevosBailes = [...datos.bailes];
    nuevosBailes[index] = { ...nuevosBailes[index], [campo]: valor };
    setDatos({ ...datos, bailes: nuevosBailes });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Filtrar bailes vacíos antes de guardar
    const bailesFiltrados = datos.bailes.filter(b => b.nombre.trim() || b.con_quien.trim());
    onGuardar('entretenimiento', {
      musica_ceremonial: datos.musica_ceremonial,
      primer_baile: datos.primer_baile,
      bailes_adicionales: JSON.stringify(bailesFiltrados),
      cancion_sorpresa: datos.cancion_sorpresa,
      notas_entretenimiento: datos.notas_entretenimiento,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Music2 className="w-6 h-6 text-blue-600" />
        <h2 className="text-2xl font-bold text-gray-900">Música</h2>
      </div>

      <div className="space-y-6">
        {/* Música para Ceremonia / Entrada */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Música para Ceremonia / Entrada
          </label>
          <input
            type="text"
            value={datos.musica_ceremonial}
            onChange={(e) => setDatos({ ...datos, musica_ceremonial: e.target.value })}
            placeholder="Ej: A Thousand Years - Christina Perri"
            disabled={estaBloqueado}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none disabled:bg-gray-100"
          />
        </div>

        {/* Primer Baile */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Primer Baile
          </label>
          <input
            type="text"
            value={datos.primer_baile}
            onChange={(e) => setDatos({ ...datos, primer_baile: e.target.value })}
            placeholder="Ej: Perfect - Ed Sheeran"
            disabled={estaBloqueado}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none disabled:bg-gray-100"
          />
        </div>

        {/* Bailes Adicionales */}
        <div className="border-2 border-blue-200 rounded-xl p-6 bg-blue-50">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-blue-900">Bailes Adicionales</h3>
            {!estaBloqueado && (
              <button
                type="button"
                onClick={agregarBaile}
                className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium flex items-center gap-1"
              >
                <Plus className="w-4 h-4" />
                Agregar Baile
              </button>
            )}
          </div>
          
          <div className="space-y-4">
            {datos.bailes.map((baile, index) => (
              <div key={index} className="bg-white p-4 rounded-lg border border-blue-200">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold text-blue-900">
                    Baile {index + 1}
                  </span>
                  {!estaBloqueado && datos.bailes.length > 1 && (
                    <button
                      type="button"
                      onClick={() => eliminarBaile(index)}
                      className="text-red-600 hover:text-red-700 transition"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Canción
                    </label>
                    <input
                      type="text"
                      value={baile.nombre}
                      onChange={(e) => actualizarBaile(index, 'nombre', e.target.value)}
                      placeholder="Ej: My Girl - The Temptations"
                      disabled={estaBloqueado}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm disabled:bg-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Con quién
                    </label>
                    <input
                      type="text"
                      value={baile.con_quien}
                      onChange={(e) => actualizarBaile(index, 'con_quien', e.target.value)}
                      placeholder="Ej: Con papá, Con mamá, Con hermano"
                      disabled={estaBloqueado}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm disabled:bg-gray-100"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Canción Sorpresa */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Canción Sorpresa
          </label>
          <input
            type="text"
            value={datos.cancion_sorpresa}
            onChange={(e) => setDatos({ ...datos, cancion_sorpresa: e.target.value })}
            placeholder="Ej: Canción especial para sorprender a alguien"
            disabled={estaBloqueado}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none disabled:bg-gray-100"
          />
        </div>

        {/* Notas Adicionales */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Notas Adicionales
          </label>
          <textarea
            value={datos.notas_entretenimiento}
            onChange={(e) => setDatos({ ...datos, notas_entretenimiento: e.target.value })}
            rows={3}
            placeholder="Cualquier detalle especial sobre la música..."
            disabled={estaBloqueado}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none disabled:bg-gray-100"
          />
        </div>
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

// ===== SECCIÓN BAR =====
function SeccionBar({ ajustes, contrato }) {
  // Detectar tipo de licor contratado
  const todosServicios = [
    ...(contrato?.contratos_servicios || []).map(cs => cs.servicios?.nombre),
    ...(contrato?.paquetes?.paquetes_servicios || []).map(ps => ps.servicios?.nombre)
  ].filter(Boolean);

  const tieneLicorBasico = todosServicios.some(nombre => 
    nombre?.toLowerCase().includes('licor básico') || nombre?.toLowerCase().includes('licor basico')
  );
  const tieneLicorPremium = todosServicios.some(nombre => 
    nombre?.toLowerCase().includes('licor premium')
  );

  const tipoLicor = tieneLicorPremium ? 'premium' : tieneLicorBasico ? 'basico' : null;

  // Productos comunes (iguales para ambos)
  const refrescos = [
    'Club Soda',
    'Agua Tónica',
    'Coca Cola',
    'Coca Cola Diet',
    'Sprite',
    'Sprite Diet',
    'Fanta Naranja'
  ];

  const jugos = [
    'Naranja',
    'Cranberry'
  ];

  const otros = [
    'Granadina',
    'Blue Curaçao'
  ];

  const cocteles = [
    'Piña Colada',
    'Daiquirí',
    'Shirley Temple'
  ];

  const vinos = [
    'Vino Blanco',
    'Vino Tinto',
    'Vino Chardonnay'
  ];

  // Productos según tipo de licor
  const licorBasico = [
    'Whisky House',
    'Ron Spice',
    'Ron Blanco',
    'Vodka',
    'Tequila'
  ];

  const licorPremium = [
    'Whisky Black Label',
    'Ron Bacardi Blanco',
    'Ron Bacardi Gold',
    ...licorBasico // Premium incluye todo lo del básico
  ];

  if (!tipoLicor) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3 mb-6">
          <Wine className="w-6 h-6 text-indigo-600" />
          <h2 className="text-2xl font-bold text-gray-900">Bar - Cócteles y Bebidas</h2>
        </div>
        <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-6 text-center">
          <Wine className="w-12 h-12 text-yellow-600 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-yellow-900 mb-2">Servicio de Bar no Contratado</h3>
          <p className="text-yellow-800">
            No tienes contratado ningún servicio de licor (Básico o Premium) en tu evento.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Wine className="w-6 h-6 text-indigo-600" />
        <h2 className="text-2xl font-bold text-gray-900">Bar - Cócteles y Bebidas</h2>
        {tipoLicor === 'premium' && (
          <span className="px-3 py-1 bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 rounded-full text-sm font-medium">
            ⭐ Premium
          </span>
        )}
        {tipoLicor === 'basico' && (
          <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
            📦 Básico
          </span>
        )}
      </div>

      <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-lg">
        <p className="text-sm text-blue-800">
          <strong>Información del Bar:</strong> Esta es la lista completa de bebidas incluidas en tu servicio de {tipoLicor === 'premium' ? 'Licor Premium' : 'Licor Básico'}.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Alcohol - Izquierda */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center gap-2 mb-4">
              <Wine className="w-6 h-6 text-red-600" />
              <h3 className="text-xl font-bold text-gray-900">Licores y Alcohol</h3>
            </div>
            
            {/* Vinos */}
            <div className="mb-4">
              <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <span className="text-red-500">🍷</span> Vinos
              </h4>
              <div className="space-y-1">
                {vinos.map((vino, index) => (
                  <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                    <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                    <span className="text-gray-900 text-sm">{vino}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Ron */}
            <div className="mb-4">
              <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <span className="text-amber-600">🍸</span> Ron
              </h4>
              <div className="space-y-1">
                {(tipoLicor === 'premium' 
                  ? ['Ron Bacardi Blanco', 'Ron Bacardi Gold'] 
                  : ['Ron Spice', 'Ron Blanco']
                ).map((ron, index) => (
                  <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                    <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                    <span className="text-gray-900 text-sm">{ron}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Whisky */}
            <div className="mb-4">
              <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <span className="text-amber-700">🥃</span> Whisky
              </h4>
              <div className="space-y-1">
                <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                  <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                  <span className="text-gray-900 text-sm">
                    {tipoLicor === 'premium' ? 'Whisky Black Label' : 'Whisky House'}
                  </span>
                </div>
              </div>
            </div>

            {/* Vodka y Tequila */}
            <div className="space-y-1">
              <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                <span className="text-gray-900 text-sm">Vodka</span>
              </div>
              <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                <span className="text-gray-900 text-sm">Tequila</span>
              </div>
            </div>
          </div>

          {/* Cócteles */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span className="text-purple-500">🍹</span> Cócteles
            </h3>
            <div className="space-y-1">
              {cocteles.map((coctel, index) => (
                <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                  <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                  <span className="text-gray-900 text-sm">{coctel}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Refrescos, Jugos y Otros - Derecha */}
        <div className="space-y-4">
          {/* Refrescos */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span className="text-blue-500">🥤</span> Refrescos
            </h3>
            <div className="space-y-1">
              {refrescos.map((refresco, index) => (
                <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                  <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                  <span className="text-gray-900 text-sm">{refresco}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Jugos */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span className="text-orange-500">🧃</span> Jugos
            </h3>
            <div className="space-y-1">
              {jugos.map((jugo, index) => (
                <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                  <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                  <span className="text-gray-900 text-sm">{jugo}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Otros */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span className="text-purple-500">✨</span> Otros
            </h3>
            <div className="space-y-1">
              {otros.map((otro, index) => (
                <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                  <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                  <span className="text-gray-900 text-sm">{otro}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ===== SECCIÓN OTROS (FINAL) =====
function SeccionOtros({ ajustes, onGuardar, guardando, estaBloqueado, tieneLimosina, contrato }) {
  // Determinar si es evento de 15 años (quinceañera)
  // Puede ser por el nombre del evento, homenajeado, o tipo de evento
  const nombreEvento = contrato?.eventos?.nombre_evento?.toLowerCase() || '';
  const homenajeado = contrato?.homenajeado?.toLowerCase() || '';
  const esQuinceanera = nombreEvento.includes('15') || nombreEvento.includes('quince') || 
                        nombreEvento.includes('quinceañera') || homenajeado.includes('quince');

  // Estado del protocolo - parsear desde JSON o string
  const protocoloInicial = ajustes?.protocolo 
    ? (typeof ajustes.protocolo === 'string' && ajustes.protocolo.startsWith('{')
        ? JSON.parse(ajustes.protocolo || '{}')
        : {})
    : {};
  
  // Valores por defecto del protocolo
  const protocoloConDefaults = {
    hora_apertura: protocoloInicial.hora_apertura || '',
    hora_anuncio_padres: protocoloInicial.hora_anuncio_padres || '',
    nombres_padres: protocoloInicial.nombres_padres || '',
    hora_anuncio_homenajeado: protocoloInicial.hora_anuncio_homenajeado || '',
    nombre_homenajeado: protocoloInicial.nombre_homenajeado || contrato?.homenajeado || '',
    acompanantes: protocoloInicial.acompanantes || '',
    cambio_zapatilla: protocoloInicial.cambio_zapatilla !== undefined ? protocoloInicial.cambio_zapatilla : true,
    cambio_zapatilla_a_cargo: protocoloInicial.cambio_zapatilla_a_cargo || 'El papá',
    baile_papa: protocoloInicial.baile_papa !== undefined ? protocoloInicial.baile_papa : true,
    baile_mama: protocoloInicial.baile_mama !== undefined ? protocoloInicial.baile_mama : true,
    bailes_adicionales: protocoloInicial.bailes_adicionales || '',
    ceremonia_velas: protocoloInicial.ceremonia_velas !== undefined ? protocoloInicial.ceremonia_velas : true,
    brindis: protocoloInicial.brindis !== undefined ? protocoloInicial.brindis : true,
    brindis_a_cargo: protocoloInicial.brindis_a_cargo || '',
    hora_fotos: protocoloInicial.hora_fotos || '',
    hora_cena: protocoloInicial.hora_cena || '',
    hora_photobooth: protocoloInicial.hora_photobooth || '',
    hora_loca: protocoloInicial.hora_loca || '',
    hora_happy_birthday: protocoloInicial.hora_happy_birthday || '',
    hora_fin: protocoloInicial.hora_fin || '',
  };

  const [datos, setDatos] = useState({
    vestido_nina: ajustes?.vestido_nina || '',
    observaciones_adicionales: ajustes?.observaciones_adicionales || '',
    items_especiales: ajustes?.items_especiales || '',
    sorpresas_planeadas: ajustes?.sorpresas_planeadas || '',
    protocolo: protocoloConDefaults,
    hora_limosina: ajustes?.hora_limosina || '18:00', // Hora genérica por defecto
  });

  // Función para actualizar protocolo
  const actualizarProtocolo = (campo, valor) => {
    setDatos({
      ...datos,
      protocolo: {
        ...datos.protocolo,
        [campo]: valor
      }
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Convertir protocolo a JSON string antes de enviar
    const datosEnviar = {
      ...datos,
      protocolo: JSON.stringify(datos.protocolo)
    };
    onGuardar('otros', datosEnviar);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Settings className="w-6 h-6 text-gray-600" />
        <h2 className="text-2xl font-bold text-gray-900">Final</h2>
      </div>

      <div className="space-y-6">
        {/* Limosina (solo si está contratada) */}
        {tieneLimosina && (
          <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
            <div className="flex items-center gap-3 mb-3">
              <Car className="w-5 h-5 text-blue-600" />
              <h3 className="font-bold text-blue-900">Servicio de Limosina</h3>
            </div>
            <div>
              <label className="block text-sm font-medium text-blue-900 mb-2 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Hora de Recogida
              </label>
              <input
                type="time"
                value={datos.hora_limosina}
                onChange={(e) => setDatos({ ...datos, hora_limosina: e.target.value })}
                disabled={estaBloqueado}
                className="w-full px-4 py-2 border-2 border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white disabled:bg-gray-100"
              />
              <p className="text-xs text-blue-700 mt-2">
                💡 Esta hora puede ser ajustada por tu asesor según las necesidades del evento
              </p>
            </div>
          </div>
        )}

        {/* Vestido de la niña (solo si es 15 años) */}
        {esQuinceanera && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Vestido de la niña
            </label>
            <input
              type="text"
              value={datos.vestido_nina}
              onChange={(e) => setDatos({ ...datos, vestido_nina: e.target.value })}
              disabled={estaBloqueado}
              placeholder="Describe el vestido o estilo que llevará..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent outline-none disabled:bg-gray-100"
            />
          </div>
        )}

        {/* Observaciones adicionales */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Observaciones Adicionales
          </label>
          <textarea
            value={datos.observaciones_adicionales}
            onChange={(e) => setDatos({ ...datos, observaciones_adicionales: e.target.value })}
            disabled={estaBloqueado}
            rows={4}
            placeholder="Cualquier observación o detalle adicional que quieras comunicar..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent outline-none disabled:bg-gray-100"
          />
        </div>

        {/* Items especiales que el cliente va a llevar */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Items Especiales que Traerás
          </label>
          <textarea
            value={datos.items_especiales}
            onChange={(e) => setDatos({ ...datos, items_especiales: e.target.value })}
            disabled={estaBloqueado}
            rows={3}
            placeholder="Ej: Flores, recuerdos, fotos, decoración especial, etc..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent outline-none disabled:bg-gray-100"
          />
          <p className="text-xs text-gray-500 mt-1">
            💡 Indica cualquier elemento especial que planeas traer al evento
          </p>
        </div>

        {/* Sorpresas Planeadas */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Sorpresas Planeadas
          </label>
          <textarea
            value={datos.sorpresas_planeadas}
            onChange={(e) => setDatos({ ...datos, sorpresas_planeadas: e.target.value })}
            disabled={estaBloqueado}
            rows={3}
            placeholder="Describe cualquier sorpresa que estés planeando..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent outline-none disabled:bg-gray-100"
          />
        </div>

        {/* Sección Protocolo */}
        <div className="border-t-2 border-gray-200 pt-6">
          <div className="flex items-center gap-3 mb-4">
            <Clock className="w-6 h-6 text-purple-600" />
            <h3 className="text-xl font-bold text-gray-900">Protocolo del Evento</h3>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Completa el protocolo de tu evento de forma sencilla. Selecciona las opciones y horarios.
          </p>

          <div className="space-y-6 bg-purple-50 rounded-xl p-6 border-2 border-purple-200">
            {/* Hora de Apertura */}
            <div className="bg-white rounded-lg p-4 border border-purple-200">
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                🕐 Hora de Apertura del Salón para Invitados
              </label>
              <p className="text-xs text-gray-600 mb-2">
                Esta es la hora en que se abrirá el salón para que los invitados puedan ingresar.
              </p>
              <input
                type="time"
                value={datos.protocolo?.hora_apertura || ''}
                onChange={(e) => actualizarProtocolo('hora_apertura', e.target.value)}
                disabled={estaBloqueado}
                className="w-full px-4 py-2 border-2 border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none disabled:bg-gray-100"
              />
            </div>

            {/* Anuncio de Padres */}
            <div className="bg-white rounded-lg p-4 border border-purple-200">
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                👨‍👩‍👧 Anuncio de Padres
              </label>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Hora del anuncio</label>
                  <input
                    type="time"
                    value={datos.protocolo?.hora_anuncio_padres || ''}
                    onChange={(e) => actualizarProtocolo('hora_anuncio_padres', e.target.value)}
                    disabled={estaBloqueado}
                    className="w-full px-4 py-2 border-2 border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none disabled:bg-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Nombres de los Padres</label>
                  <input
                    type="text"
                    value={datos.protocolo?.nombres_padres || ''}
                    onChange={(e) => actualizarProtocolo('nombres_padres', e.target.value)}
                    disabled={estaBloqueado}
                    placeholder="Ej: Sr. Yael y Sra. Yaneli"
                    className="w-full px-4 py-2 border-2 border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none disabled:bg-gray-100"
                  />
                </div>
              </div>
            </div>

            {/* Anuncio de Homenajeado */}
            <div className="bg-white rounded-lg p-4 border border-purple-200">
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                ⭐ Anuncio del Homenajeado
              </label>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Hora del anuncio</label>
                  <input
                    type="time"
                    value={datos.protocolo?.hora_anuncio_homenajeado || ''}
                    onChange={(e) => actualizarProtocolo('hora_anuncio_homenajeado', e.target.value)}
                    disabled={estaBloqueado}
                    className="w-full px-4 py-2 border-2 border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none disabled:bg-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Nombre del Homenajeado</label>
                  <input
                    type="text"
                    value={datos.protocolo?.nombre_homenajeado || contrato?.homenajeado || ''}
                    onChange={(e) => actualizarProtocolo('nombre_homenajeado', e.target.value)}
                    disabled={estaBloqueado}
                    placeholder="Nombre completo"
                    className="w-full px-4 py-2 border-2 border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none disabled:bg-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Acompañado de (opcional)</label>
                  <input
                    type="text"
                    value={datos.protocolo?.acompanantes || ''}
                    onChange={(e) => actualizarProtocolo('acompanantes', e.target.value)}
                    disabled={estaBloqueado}
                    placeholder="Ej: Sus hermanos Yoel y Sebastian"
                    className="w-full px-4 py-2 border-2 border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none disabled:bg-gray-100"
                  />
                </div>
              </div>
            </div>

            {/* Cambio de Zapatilla */}
            <div className="bg-white rounded-lg p-4 border border-purple-200">
              <label className="block text-sm font-semibold text-gray-900 mb-3">
                👠 Cambio de Zapatilla
              </label>
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-700">¿Incluir cambio de zapatilla?</span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => actualizarProtocolo('cambio_zapatilla', true)}
                    disabled={estaBloqueado}
                    className={`px-4 py-2 rounded-lg font-medium transition ${
                      datos.protocolo?.cambio_zapatilla === true
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    } disabled:opacity-50`}
                  >
                    Sí
                  </button>
                  <button
                    type="button"
                    onClick={() => actualizarProtocolo('cambio_zapatilla', false)}
                    disabled={estaBloqueado}
                    className={`px-4 py-2 rounded-lg font-medium transition ${
                      datos.protocolo?.cambio_zapatilla === false
                        ? 'bg-red-500 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    } disabled:opacity-50`}
                  >
                    No
                  </button>
                </div>
              </div>
              {datos.protocolo?.cambio_zapatilla === true && (
                <div className="mt-3">
                  <label className="block text-xs text-gray-600 mb-1">A cargo de</label>
                  <input
                    type="text"
                    value={datos.protocolo?.cambio_zapatilla_a_cargo || 'El papá'}
                    onChange={(e) => actualizarProtocolo('cambio_zapatilla_a_cargo', e.target.value)}
                    disabled={estaBloqueado}
                    placeholder="Ej: El papá"
                    className="w-full px-4 py-2 border-2 border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none disabled:bg-gray-100"
                  />
                </div>
              )}
            </div>

            {/* Bailes */}
            <div className="bg-white rounded-lg p-4 border border-purple-200">
              <label className="block text-sm font-semibold text-gray-900 mb-3">
                💃 Bailes Especiales
              </label>
              <div className="space-y-3">
                {/* Baile con Papá */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">Baile con Papá</span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => actualizarProtocolo('baile_papa', true)}
                      disabled={estaBloqueado}
                      className={`px-3 py-1 rounded font-medium text-sm transition ${
                        datos.protocolo?.baile_papa === true
                          ? 'bg-green-500 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      } disabled:opacity-50`}
                    >
                      Sí
                    </button>
                    <button
                      type="button"
                      onClick={() => actualizarProtocolo('baile_papa', false)}
                      disabled={estaBloqueado}
                      className={`px-3 py-1 rounded font-medium text-sm transition ${
                        datos.protocolo?.baile_papa === false
                          ? 'bg-red-500 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      } disabled:opacity-50`}
                    >
                      No
                    </button>
                  </div>
                </div>

                {/* Baile con Mamá */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">Baile con Mamá</span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => actualizarProtocolo('baile_mama', true)}
                      disabled={estaBloqueado}
                      className={`px-3 py-1 rounded font-medium text-sm transition ${
                        datos.protocolo?.baile_mama === true
                          ? 'bg-green-500 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      } disabled:opacity-50`}
                    >
                      Sí
                    </button>
                    <button
                      type="button"
                      onClick={() => actualizarProtocolo('baile_mama', false)}
                      disabled={estaBloqueado}
                      className={`px-3 py-1 rounded font-medium text-sm transition ${
                        datos.protocolo?.baile_mama === false
                          ? 'bg-red-500 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      } disabled:opacity-50`}
                    >
                      No
                    </button>
                  </div>
                </div>

                {/* Bailes adicionales */}
                <div className="pt-2 border-t border-gray-200">
                  <label className="block text-xs text-gray-600 mb-2">Otros bailes (opcional)</label>
                  <textarea
                    value={datos.protocolo?.bailes_adicionales || ''}
                    onChange={(e) => actualizarProtocolo('bailes_adicionales', e.target.value)}
                    disabled={estaBloqueado}
                    rows={2}
                    placeholder="Ej: Baile con hermano Yoel, Baile con hermano Sebastian..."
                    className="w-full px-3 py-2 border-2 border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-sm disabled:bg-gray-100"
                  />
                </div>
              </div>
            </div>

            {/* Ceremonia de las 15 Velas */}
            {esQuinceanera && (
              <div className="bg-white rounded-lg p-4 border border-purple-200">
                <label className="block text-sm font-semibold text-gray-900 mb-3">
                  🕯️ Ceremonia de las 15 Velas
                </label>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-700">¿Incluir ceremonia?</span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => actualizarProtocolo('ceremonia_velas', true)}
                      disabled={estaBloqueado}
                      className={`px-4 py-2 rounded-lg font-medium transition ${
                        datos.protocolo?.ceremonia_velas === true
                          ? 'bg-green-500 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      } disabled:opacity-50`}
                    >
                      Sí
                    </button>
                    <button
                      type="button"
                      onClick={() => actualizarProtocolo('ceremonia_velas', false)}
                      disabled={estaBloqueado}
                      className={`px-4 py-2 rounded-lg font-medium transition ${
                        datos.protocolo?.ceremonia_velas === false
                          ? 'bg-red-500 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      } disabled:opacity-50`}
                    >
                      No
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Palabras / Brindis */}
            <div className="bg-white rounded-lg p-4 border border-purple-200">
              <label className="block text-sm font-semibold text-gray-900 mb-3">
                🥂 Palabras / Brindis
              </label>
              <div className="flex items-center gap-4 mb-3">
                <span className="text-sm text-gray-700">¿Incluir brindis?</span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => actualizarProtocolo('brindis', true)}
                    disabled={estaBloqueado}
                    className={`px-4 py-2 rounded-lg font-medium transition ${
                      datos.protocolo?.brindis === true
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    } disabled:opacity-50`}
                  >
                    Sí
                  </button>
                  <button
                    type="button"
                    onClick={() => actualizarProtocolo('brindis', false)}
                    disabled={estaBloqueado}
                    className={`px-4 py-2 rounded-lg font-medium transition ${
                      datos.protocolo?.brindis === false
                        ? 'bg-red-500 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    } disabled:opacity-50`}
                  >
                    No
                  </button>
                </div>
              </div>
              {datos.protocolo?.brindis === true && (
                <div>
                  <label className="block text-xs text-gray-600 mb-1">A cargo de (opcional)</label>
                  <input
                    type="text"
                    value={datos.protocolo?.brindis_a_cargo || ''}
                    onChange={(e) => actualizarProtocolo('brindis_a_cargo', e.target.value)}
                    disabled={estaBloqueado}
                    placeholder="Ej: El padrino"
                    className="w-full px-4 py-2 border-2 border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none disabled:bg-gray-100"
                  />
                </div>
              )}
            </div>

            {/* Horarios de Actividades */}
            <div className="bg-white rounded-lg p-4 border border-purple-200">
              <label className="block text-sm font-semibold text-gray-900 mb-3">
                📅 Horarios de Actividades
              </label>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Momento Social / Fotos</label>
                  <input
                    type="time"
                    value={datos.protocolo?.hora_fotos || ''}
                    onChange={(e) => actualizarProtocolo('hora_fotos', e.target.value)}
                    disabled={estaBloqueado}
                    className="w-full px-4 py-2 border-2 border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none disabled:bg-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Cena / Proyección de Video</label>
                  <input
                    type="time"
                    value={datos.protocolo?.hora_cena || ''}
                    onChange={(e) => actualizarProtocolo('hora_cena', e.target.value)}
                    disabled={estaBloqueado}
                    className="w-full px-4 py-2 border-2 border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none disabled:bg-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Photobooth</label>
                  <input
                    type="time"
                    value={datos.protocolo?.hora_photobooth || ''}
                    onChange={(e) => actualizarProtocolo('hora_photobooth', e.target.value)}
                    disabled={estaBloqueado}
                    className="w-full px-4 py-2 border-2 border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none disabled:bg-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Hora Loca</label>
                  <input
                    type="time"
                    value={datos.protocolo?.hora_loca || ''}
                    onChange={(e) => actualizarProtocolo('hora_loca', e.target.value)}
                    disabled={estaBloqueado}
                    className="w-full px-4 py-2 border-2 border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none disabled:bg-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Happy Birthday</label>
                  <input
                    type="time"
                    value={datos.protocolo?.hora_happy_birthday || ''}
                    onChange={(e) => actualizarProtocolo('hora_happy_birthday', e.target.value)}
                    disabled={estaBloqueado}
                    className="w-full px-4 py-2 border-2 border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none disabled:bg-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Fin del Evento</label>
                  <input
                    type="time"
                    value={datos.protocolo?.hora_fin || ''}
                    onChange={(e) => actualizarProtocolo('hora_fin', e.target.value)}
                    disabled={estaBloqueado}
                    className="w-full px-4 py-2 border-2 border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none disabled:bg-gray-100"
                  />
                </div>
              </div>
            </div>
          </div>
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
