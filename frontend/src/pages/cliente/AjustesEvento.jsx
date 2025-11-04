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

  const tabs = [
    { id: 'torta', label: 'Torta', icon: Cake, color: 'pink' },
    { id: 'decoracion', label: 'Decoración', icon: Sparkles, color: 'purple' },
    { id: 'menu', label: 'Menú', icon: UtensilsCrossed, color: 'orange' },
    { id: 'entretenimiento', label: 'Entretenimiento', icon: Music2, color: 'blue' },
    { id: 'bar', label: 'Bar', icon: Wine, color: 'indigo' },
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
          />
        )}
        {tabActivo === 'entretenimiento' && (
          <SeccionEntretenimiento ajustes={ajustes} onGuardar={handleGuardar} guardando={guardando} estaBloqueado={estaBloqueado} />
        )}
        {tabActivo === 'bar' && (
          <SeccionBar ajustes={ajustes} onGuardar={handleGuardar} guardando={guardando} estaBloqueado={estaBloqueado} />
        )}
        {tabActivo === 'otros' && (
          <SeccionOtros 
            ajustes={ajustes} 
            onGuardar={handleGuardar} 
            guardando={guardando} 
            estaBloqueado={estaBloqueado}
            tieneLimosina={tieneLimosina}
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
function SeccionMenu({ ajustes, onGuardar, guardando, estaBloqueado, contrato }) {
  const [datos, setDatos] = useState({
    entrada: 'Ensalada César', // Valor fijo por defecto
    plato_principal: ajustes?.plato_principal || '',
    acompanamientos: ajustes?.acompanamientos || '',
    hay_teenagers: ajustes?.hay_teenagers || false,
    cantidad_teenagers: ajustes?.cantidad_teenagers || 0,
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
              />
              <p className="text-xs text-purple-700 mt-1">
                💡 Los teens/kids recibirán: <strong>Pasta con pollo</strong>
              </p>
            </div>

            {datos.cantidad_teenagers > 0 && (
              <div className="bg-purple-100 border border-purple-300 rounded-lg p-4">
                <p className="text-sm font-medium text-purple-900">
                  📋 Resumen de platos:
                </p>
                <ul className="text-sm text-purple-800 mt-2 space-y-1">
                  <li>• {invitadosAdultos} platos según selección de menú (adultos)</li>
                  <li>• {datos.cantidad_teenagers} pasta(s) con pollo (teens/kids)</li>
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

// ===== SECCIÓN BAR =====
function SeccionBar({ ajustes, onGuardar, guardando, estaBloqueado }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Wine className="w-6 h-6 text-indigo-600" />
        <h2 className="text-2xl font-bold text-gray-900">Bar - Cócteles y Bebidas</h2>
      </div>

      {/* Banner de En Construcción */}
      <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-12 text-center border-2 border-indigo-200">
        <Construction className="w-16 h-16 text-indigo-400 mx-auto mb-4" />
        <h3 className="text-2xl font-bold text-indigo-900 mb-2">Sección en Construcción</h3>
        <p className="text-indigo-700 mb-4">
          Estamos preparando esta sección para que puedas personalizar los cócteles, bebidas y detalles del bar de tu evento.
        </p>
        <div className="flex items-center justify-center gap-2 text-sm text-indigo-600">
          <Wine className="w-4 h-4" />
          <span>Próximamente disponible</span>
        </div>
      </div>
    </div>
  );
}

// ===== SECCIÓN OTROS =====
function SeccionOtros({ ajustes, onGuardar, guardando, estaBloqueado, tieneLimosina }) {
  const [datos, setDatos] = useState({
    invitado_honor: ajustes?.invitado_honor || '',
    brindis_especial: ajustes?.brindis_especial || '',
    sorpresas_planeadas: ajustes?.sorpresas_planeadas || '',
    solicitudes_especiales: ajustes?.solicitudes_especiales || '',
    hora_limosina: ajustes?.hora_limosina || '18:00', // Hora genérica por defecto
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
        {/* Limosina (solo si está contratada) */}
        {tieneLimosina && (
          <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4 mb-4">
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
