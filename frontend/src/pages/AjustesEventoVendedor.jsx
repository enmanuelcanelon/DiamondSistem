import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { 
  ArrowLeft, 
  Cake, 
  Sparkles, 
  UtensilsCrossed, 
  Music2, 
  Settings,
  Loader2,
  Calendar,
  Clock,
  Car,
  Wine,
  CheckCircle2
} from 'lucide-react';
import api from '../config/api';

function AjustesEventoVendedor() {
  const { contratoId } = useParams();
  const navigate = useNavigate();

  // Query para obtener el contrato y ajustes
  const { data: contrato, isLoading: loadingContrato } = useQuery({
    queryKey: ['contrato-ajustes-vendedor', contratoId],
    queryFn: async () => {
      const response = await api.get(`/contratos/${contratoId}`);
      return response.data.contrato;
    },
    enabled: !!contratoId,
  });

  // Query para obtener los ajustes del evento
  const { data: ajustes, isLoading: loadingAjustes } = useQuery({
    queryKey: ['ajustes-evento', contratoId],
    queryFn: async () => {
      const response = await api.get(`/ajustes/contrato/${contratoId}`);
      return response.data.ajustes;
    },
    enabled: !!contratoId,
  });

  if (loadingContrato || loadingAjustes) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(`/contratos/${contratoId}`)}
          className="p-2 hover:bg-gray-100 rounded-lg transition"
        >
          <ArrowLeft className="w-6 h-6 text-gray-600" />
        </button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Settings className="w-8 h-8 text-purple-600" />
            Ajustes del Evento
          </h1>
          <p className="text-gray-600 mt-1">
            Cliente: {contrato?.clientes?.nombre_completo} - {contrato?.codigo_contrato}
          </p>
        </div>
        {contrato?.fecha_evento && (
          <div className="bg-purple-100 px-4 py-2 rounded-lg">
            <div className="flex items-center gap-2 text-purple-700">
              <Calendar className="w-5 h-5" />
              <span className="font-medium">
                {new Date(contrato.fecha_evento).toLocaleDateString('es-ES', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <p className="text-sm text-blue-800">
          <strong>Vista de Solo Lectura:</strong> Estos son los ajustes que el cliente ha configurado para su evento. 
          El cliente puede modificar estos detalles hasta 10 días antes del evento.
        </p>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-0 divide-x">
          <a
            href="#torta"
            className="px-4 py-3 text-center hover:bg-gray-50 transition flex flex-col items-center gap-1"
          >
            <Cake className="w-5 h-5 text-pink-600" />
            <span className="text-xs font-medium">Torta</span>
          </a>
          <a
            href="#decoracion"
            className="px-4 py-3 text-center hover:bg-gray-50 transition flex flex-col items-center gap-1"
          >
            <Sparkles className="w-5 h-5 text-purple-600" />
            <span className="text-xs font-medium">Decoración</span>
          </a>
          <a
            href="#menu"
            className="px-4 py-3 text-center hover:bg-gray-50 transition flex flex-col items-center gap-1"
          >
            <UtensilsCrossed className="w-5 h-5 text-orange-600" />
            <span className="text-xs font-medium">Menú</span>
          </a>
          <a
            href="#musica"
            className="px-4 py-3 text-center hover:bg-gray-50 transition flex flex-col items-center gap-1"
          >
            <Music2 className="w-5 h-5 text-blue-600" />
            <span className="text-xs font-medium">Música</span>
          </a>
          <a
            href="#bar"
            className="px-4 py-3 text-center hover:bg-gray-50 transition flex flex-col items-center gap-1"
          >
            <Wine className="w-5 h-5 text-indigo-600" />
            <span className="text-xs font-medium">Bar</span>
          </a>
          <a
            href="#otros"
            className="px-4 py-3 text-center hover:bg-gray-50 transition flex flex-col items-center gap-1"
          >
            <Settings className="w-5 h-5 text-gray-600" />
            <span className="text-xs font-medium">Final</span>
          </a>
        </div>
      </div>

      {/* Secciones */}
      {ajustes ? (
        <div className="space-y-6">
          {/* Torta */}
          <SeccionTorta ajustes={ajustes} />
          
          {/* Decoración */}
          <SeccionDecoracion ajustes={ajustes} />
          
          {/* Menú */}
          <SeccionMenu ajustes={ajustes} contrato={contrato} />
          
          {/* Música */}
          <SeccionMusica ajustes={ajustes} />
          
          {/* Bar */}
          <SeccionBar ajustes={ajustes} contrato={contrato} />
          
          {/* Final */}
          <SeccionOtros ajustes={ajustes} contrato={contrato} />
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
          <Settings className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600">El cliente aún no ha configurado los ajustes del evento</p>
        </div>
      )}
    </div>
  );
}

// Componente para mostrar campo
function Campo({ label, valor, icono }) {
  if (!valor) return null;
  
  return (
    <div className="bg-gray-50 rounded-lg p-4">
      <div className="flex items-start gap-3">
        {icono && <div className="mt-1">{icono}</div>}
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-700 mb-1">{label}</p>
          <p className="text-gray-900 whitespace-pre-wrap">{valor}</p>
        </div>
      </div>
    </div>
  );
}

// Sección Torta
function SeccionTorta({ ajustes }) {
  return (
    <div id="torta" className="bg-white rounded-xl shadow-sm border p-6">
      <div className="flex items-center gap-3 mb-6 pb-4 border-b">
        <Cake className="w-6 h-6 text-pink-600" />
        <h2 className="text-2xl font-bold text-gray-900">Torta</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Campo label="Sabor de la Torta" valor={ajustes?.sabor_torta} />
        <Campo label="Relleno" valor={ajustes?.relleno_torta} />
        <Campo label="Decoración de la Torta" valor={ajustes?.decoracion_torta} />
        <div className="md:col-span-2">
          <Campo label="Notas Adicionales" valor={ajustes?.notas_torta} />
        </div>
      </div>
    </div>
  );
}

// Sección Decoración
function SeccionDecoracion({ ajustes }) {
  // Formatear servilletas si existen
  const formatearServilletas = () => {
    if (!ajustes?.servilletas || !Array.isArray(ajustes.servilletas)) return null;
    
    return ajustes.servilletas.map((s, i) => (
      <span key={i} className="inline-block bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm mr-2 mb-2 capitalize">
        {s.color}: {s.cantidad}
      </span>
    ));
  };

  return (
    <div id="decoracion" className="bg-white rounded-xl shadow-sm border p-6">
      <div className="flex items-center gap-3 mb-6 pb-4 border-b">
        <Sparkles className="w-6 h-6 text-purple-600" />
        <h2 className="text-2xl font-bold text-gray-900">Decoración</h2>
        {ajustes?.tipo_decoracion && (
          <span className={`px-3 py-1 text-sm font-medium rounded-full ${
            ajustes.tipo_decoracion === 'premium' 
              ? 'bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700' 
              : 'bg-blue-100 text-blue-700'
          }`}>
            {ajustes.tipo_decoracion === 'premium' ? '⭐ Premium' : '📦 Básica'}
          </span>
        )}
      </div>

      {/* Preferencias Generales */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <span>🎨</span> Preferencias Generales
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Campo label="Estilo General" valor={ajustes?.estilo_decoracion} />
          {ajustes?.estilo_decoracion === 'Otro' && ajustes?.estilo_decoracion_otro && (
            <Campo label="Estilo Personalizado" valor={ajustes?.estilo_decoracion_otro} />
          )}
          <Campo label="Temática" valor={ajustes?.tematica} />
          <Campo label="Colores Principales" valor={ajustes?.colores_principales} />
          <div className="md:col-span-2">
            <Campo label="Notas Adicionales" valor={ajustes?.notas_decoracion} />
          </div>
        </div>
      </div>

      {/* Decoración Detallada (Solo si está configurada) */}
      {ajustes?.tipo_decoracion && (
        <>
          <div className="border-t pt-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <span>✨</span> Detalles Específicos de Decoración
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Cojines */}
              {ajustes?.cojines_color && (
                <div className="bg-purple-50 rounded-lg p-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">Cojines</p>
                  <p className="text-gray-900 capitalize font-medium">{ajustes.cojines_color}</p>
                </div>
              )}

              {/* Centro de Mesa */}
              {ajustes?.centro_mesa_1 && (
                <div className="bg-purple-50 rounded-lg p-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">Centro de Mesa</p>
                  <p className="text-gray-900 capitalize font-medium">{ajustes.centro_mesa_1}</p>
                  {ajustes.centro_mesa_1 === 'cilindro' && (
                    <p className="text-xs text-gray-600 mt-1">💡 Incluye 3 cilindros</p>
                  )}
                </div>
              )}

              {/* Base */}
              {ajustes?.base_color && (
                <div className="bg-purple-50 rounded-lg p-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">Base</p>
                  <p className="text-gray-900 capitalize font-medium">{ajustes.base_color}</p>
                </div>
              )}

              {/* Challer */}
              {ajustes?.challer_color && (
                <div className="bg-purple-50 rounded-lg p-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">Challer (Cargador de Plato)</p>
                  <p className="text-gray-900 capitalize font-medium">{ajustes.challer_color}</p>
                </div>
              )}

              {/* Aros */}
              {ajustes?.aros_color && (
                <div className="bg-purple-50 rounded-lg p-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">Aros (Anillos para Servilleta)</p>
                  <p className="text-gray-900 capitalize font-medium">{ajustes.aros_color}</p>
                  {ajustes.aros_color === 'otro' && ajustes.aros_nota && (
                    <p className="text-sm text-gray-700 mt-1">📝 {ajustes.aros_nota}</p>
                  )}
                </div>
              )}

              {/* Runner */}
              {ajustes?.runner_tipo && (
                <div className="bg-purple-50 rounded-lg p-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">Runner (Camino de Mesa)</p>
                  <p className="text-gray-900 capitalize font-medium">{ajustes.runner_tipo}</p>
                  {ajustes.runner_tipo === 'otros' && ajustes.runner_nota && (
                    <p className="text-sm text-gray-700 mt-1">📝 {ajustes.runner_nota}</p>
                  )}
                </div>
              )}

              {/* Stage */}
              {ajustes?.stage_tipo && (
                <div className="bg-purple-50 rounded-lg p-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">Stage (Escenario)</p>
                  <p className="text-gray-900 capitalize font-medium">{ajustes.stage_tipo}</p>
                  {ajustes.stage_tipo === 'globos' && ajustes.stage_color_globos && (
                    <p className="text-sm text-gray-700 mt-1">🎈 Color: {ajustes.stage_color_globos}</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Servilletas */}
          {ajustes?.servilletas && ajustes.servilletas.length > 0 && (
            <div className="border-t pt-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <span>🧻</span> Servilletas
              </h3>
              <div className="bg-purple-50 rounded-lg p-4">
                <div className="flex flex-wrap gap-2">
                  {formatearServilletas()}
                </div>
              </div>
            </div>
          )}

          {/* Detalles Premium */}
          {ajustes?.tipo_decoracion === 'premium' && ajustes?.decoracion_premium_detalles && (
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <span>⭐</span> Detalles Especiales Premium
              </h3>
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-4 border-2 border-purple-200">
                <p className="text-gray-900 whitespace-pre-wrap">{ajustes.decoracion_premium_detalles}</p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// Sección Menú
function SeccionMenu({ ajustes, contrato }) {
  const mostrarTeenagers = ajustes?.hay_teenagers && ajustes?.cantidad_teenagers > 0;
  
  // Verificar si tiene pasapalos contratados
  const tienePasapalos = contrato?.contratos_servicios?.some(
    cs => cs.servicios?.nombre?.toLowerCase().includes('pasapalo')
  ) || contrato?.paquetes?.paquetes_servicios?.some(
    ps => ps.servicios?.nombre?.toLowerCase().includes('pasapalo')
  );
  
  return (
    <div id="menu" className="bg-white rounded-xl shadow-sm border p-6">
      <div className="flex items-center gap-3 mb-6 pb-4 border-b">
        <UtensilsCrossed className="w-6 h-6 text-orange-600" />
        <h2 className="text-2xl font-bold text-gray-900">Menú</h2>
      </div>
      
      {/* Sección de Pasapalos (Solo informativa) */}
      {tienePasapalos && (
        <div className="mb-6 bg-amber-50 border-2 border-amber-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">🍤</span>
            <h3 className="text-lg font-bold text-amber-900">
              Pasapalos Incluidos
            </h3>
          </div>
          <p className="text-sm text-amber-800 mb-2">
            Tu evento incluye los siguientes pasapalos para deleitar a tus invitados:
          </p>
          <div className="bg-white rounded-lg p-3 border border-amber-300">
            <ul className="text-sm text-amber-900 space-y-1">
              <li>• Empanadas de Carne</li>
              <li>• Empanadas de Pollo</li>
              <li>• Tequeños</li>
              <li>• Croquetas de Jamón</li>
              <li>• Mini Pastelitos</li>
            </ul>
          </div>
          <p className="text-xs text-amber-700 italic mt-2">
            ℹ️ Los pasapalos se servirán durante el cóctel de bienvenida
          </p>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Campo label="Tipo de Servicio" valor={ajustes?.tipo_servicio} />
        {ajustes?.entrada && (
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm font-medium text-gray-700 mb-1">Entrada</p>
            <p className="text-gray-900 font-medium">🥗 {ajustes.entrada}</p>
            {ajustes.entrada === 'Ensalada César' && (
              <p className="text-xs text-gray-600 mt-2 italic">
                💡 Incluye Pan y Mantequilla
              </p>
            )}
          </div>
        )}
        <Campo label="Plato Principal" valor={ajustes?.plato_principal} />
        <Campo label="Acompañamientos" valor={ajustes?.acompanamientos} />
        <div className="md:col-span-2">
          <Campo label="Opciones Vegetarianas" valor={ajustes?.opciones_vegetarianas} />
        </div>
        <div className="md:col-span-2">
          <Campo label="Opciones Veganas" valor={ajustes?.opciones_veganas} />
        </div>
        
        {/* Teenagers/Kids */}
        {mostrarTeenagers && (
          <div className="md:col-span-2 bg-purple-50 border-2 border-purple-200 rounded-xl p-4">
            <h3 className="text-lg font-bold text-purple-900 mb-3">👶 Teens/Kids</h3>
            <div className="space-y-2">
              <p className="text-sm text-gray-700">
                <span className="font-medium">Cantidad:</span> {ajustes.cantidad_teenagers}
              </p>
              <p className="text-sm text-gray-700">
                <span className="font-medium">Tipo de comida:</span> {ajustes.teenagers_tipo_comida === 'pasta' ? 'Pasta' : 'Menú'}
              </p>
              {ajustes.teenagers_tipo_comida === 'pasta' && ajustes.teenagers_tipo_pasta && (
                <p className="text-sm text-gray-700">
                  <span className="font-medium">Tipo de pasta:</span> {
                    ajustes.teenagers_tipo_pasta === 'napolitana' ? 'Pasta Napolitana' : 
                    ajustes.teenagers_tipo_pasta === 'alfredo' ? 'Pasta Alfredo' : 
                    ajustes.teenagers_tipo_pasta
                  }
                </p>
              )}
            </div>
          </div>
        )}
        
        <div className="md:col-span-2">
          <Campo label="Restricciones Alimentarias" valor={ajustes?.restricciones_alimentarias} />
        </div>
        <div className="md:col-span-2">
          <Campo label="Bebidas Incluidas" valor={ajustes?.bebidas_incluidas} />
        </div>
        <div className="md:col-span-2">
          <Campo label="Notas Adicionales del Menú" valor={ajustes?.notas_menu} />
        </div>
      </div>
    </div>
  );
}

// Sección Música
function SeccionMusica({ ajustes }) {
  // Parsear bailes adicionales si existen
  let bailesAdicionales = null;
  if (ajustes?.bailes_adicionales) {
    try {
      const parsed = typeof ajustes.bailes_adicionales === 'string' 
        ? JSON.parse(ajustes.bailes_adicionales)
        : ajustes.bailes_adicionales;
      if (Array.isArray(parsed) && parsed.length > 0) {
        bailesAdicionales = parsed;
      }
    } catch (e) {
      console.error('Error parsing bailes_adicionales:', e);
    }
  }

  return (
    <div id="musica" className="bg-white rounded-xl shadow-sm border p-6">
      <div className="flex items-center gap-3 mb-6 pb-4 border-b">
        <Music2 className="w-6 h-6 text-blue-600" />
        <h2 className="text-2xl font-bold text-gray-900">Música</h2>
      </div>
      <div className="space-y-4">
        <Campo label="Música para Ceremonia / Entrada" valor={ajustes?.musica_ceremonial} />
        <Campo label="Primer Baile" valor={ajustes?.primer_baile} />
        
        {/* Bailes Adicionales */}
        {bailesAdicionales && bailesAdicionales.length > 0 && (
          <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
            <h3 className="text-lg font-bold text-blue-900 mb-4">Bailes Adicionales</h3>
            <div className="space-y-3">
              {bailesAdicionales.map((baile, index) => (
                <div key={index} className="bg-white p-3 rounded-lg border border-blue-200">
                  <p className="text-sm font-semibold text-blue-900 mb-2">Baile {index + 1}</p>
                  {baile.nombre && (
                    <p className="text-sm text-gray-700 mb-1">
                      <span className="font-medium">Canción:</span> {baile.nombre}
                    </p>
                  )}
                  {baile.con_quien && (
                    <p className="text-sm text-gray-700">
                      <span className="font-medium">Con quién:</span> {baile.con_quien}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
        
        <Campo label="Canción Sorpresa" valor={ajustes?.cancion_sorpresa} />
        <Campo label="Notas Adicionales" valor={ajustes?.notas_entretenimiento} />
      </div>
    </div>
  );
}


// Sección Bar
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

  if (!tipoLicor) {
    return (
      <div id="bar" className="bg-white rounded-xl shadow-sm border p-6">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b">
          <Wine className="w-6 h-6 text-indigo-600" />
          <h2 className="text-2xl font-bold text-gray-900">Bar - Cócteles y Bebidas</h2>
        </div>
        <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-6 text-center">
          <Wine className="w-12 h-12 text-yellow-600 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-yellow-900 mb-2">Servicio de Bar no Contratado</h3>
          <p className="text-yellow-800">
            El cliente no tiene contratado ningún servicio de licor (Básico o Premium) en su evento.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div id="bar" className="bg-white rounded-xl shadow-sm border p-6">
      <div className="flex items-center gap-3 mb-6 pb-4 border-b">
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

      <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-lg mb-6">
        <p className="text-sm text-blue-800">
          <strong>Información del Bar:</strong> Lista completa de bebidas incluidas en el servicio de {tipoLicor === 'premium' ? 'Licor Premium' : 'Licor Básico'}.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Alcohol - Izquierda */}
        <div className="space-y-4">
          <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
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
                  <div key={index} className="flex items-center gap-2 p-2 bg-white rounded-lg border border-gray-200">
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
                {(tipoLicor === 'premium' ? ['Ron Bacardi Blanco', 'Ron Bacardi Gold'] : ['Ron Spice', 'Ron Blanco']).map((ron, index) => (
                  <div key={index} className="flex items-center gap-2 p-2 bg-white rounded-lg border border-gray-200">
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
                <div className="flex items-center gap-2 p-2 bg-white rounded-lg border border-gray-200">
                  <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                  <span className="text-gray-900 text-sm">
                    {tipoLicor === 'premium' ? 'Whisky Black Label' : 'Whisky House'}
                  </span>
                </div>
              </div>
            </div>

            {/* Vodka y Tequila */}
            <div className="space-y-1">
              <div className="flex items-center gap-2 p-2 bg-white rounded-lg border border-gray-200">
                <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                <span className="text-gray-900 text-sm">Vodka</span>
              </div>
              <div className="flex items-center gap-2 p-2 bg-white rounded-lg border border-gray-200">
                <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                <span className="text-gray-900 text-sm">Tequila</span>
              </div>
            </div>
          </div>

          {/* Cócteles */}
          <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span className="text-purple-500">🍹</span> Cócteles
            </h3>
            <div className="space-y-1">
              {cocteles.map((coctel, index) => (
                <div key={index} className="flex items-center gap-2 p-2 bg-white rounded-lg border border-gray-200">
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
          <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span className="text-blue-500">🥤</span> Refrescos
            </h3>
            <div className="space-y-1">
              {refrescos.map((refresco, index) => (
                <div key={index} className="flex items-center gap-2 p-2 bg-white rounded-lg border border-gray-200">
                  <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                  <span className="text-gray-900 text-sm">{refresco}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Jugos */}
          <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span className="text-orange-500">🧃</span> Jugos
            </h3>
            <div className="space-y-1">
              {jugos.map((jugo, index) => (
                <div key={index} className="flex items-center gap-2 p-2 bg-white rounded-lg border border-gray-200">
                  <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                  <span className="text-gray-900 text-sm">{jugo}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Otros */}
          <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span className="text-purple-500">✨</span> Otros
            </h3>
            <div className="space-y-1">
              {otros.map((otro, index) => (
                <div key={index} className="flex items-center gap-2 p-2 bg-white rounded-lg border border-gray-200">
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

// Sección Otros (Final)
function SeccionOtros({ ajustes, contrato }) {
  // Parsear protocolo si existe
  let protocolo = null;
  if (ajustes?.protocolo) {
    try {
      protocolo = typeof ajustes.protocolo === 'string' 
        ? JSON.parse(ajustes.protocolo)
        : ajustes.protocolo;
    } catch (e) {
      console.error('Error parsing protocolo:', e);
    }
  }

  // Determinar si es quinceañera
  const nombreEvento = contrato?.eventos?.nombre_evento?.toLowerCase() || '';
  const homenajeado = contrato?.homenajeado?.toLowerCase() || '';
  const esQuinceanera = nombreEvento.includes('15') || nombreEvento.includes('quince') || 
                        nombreEvento.includes('quinceañera') || homenajeado.includes('quince');

  // Formatear hora de limosina
  const formatearHoraLimosina = (hora) => {
    if (!hora) return null;
    if (typeof hora === 'string') {
      // Si ya es string "HH:MM"
      return hora;
    }
    // Si es Date object
    const date = new Date(hora);
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  };

  return (
    <div id="otros" className="bg-white rounded-xl shadow-sm border p-6">
      <div className="flex items-center gap-3 mb-6 pb-4 border-b">
        <Settings className="w-6 h-6 text-gray-600" />
        <h2 className="text-2xl font-bold text-gray-900">Final</h2>
      </div>
      <div className="space-y-6">
        {/* Limosina */}
        {ajustes?.hora_limosina && (
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <div className="flex items-center gap-2 mb-2">
              <Car className="w-5 h-5 text-blue-600" />
              <p className="text-sm font-semibold text-gray-700">Servicio de Limosina</p>
            </div>
            <p className="text-gray-900">
              <span className="font-medium">Hora de Recogida:</span> {formatearHoraLimosina(ajustes.hora_limosina)}
            </p>
          </div>
        )}

        {/* Vestido de la niña (solo si es quinceañera) */}
        {esQuinceanera && ajustes?.vestido_nina && (
          <Campo label="Vestido de la niña" valor={ajustes.vestido_nina} />
        )}

        {/* Observaciones adicionales */}
        <Campo label="Observaciones Adicionales" valor={ajustes?.observaciones_adicionales} />

        {/* Items especiales */}
        <Campo label="Items Especiales que Traerá" valor={ajustes?.items_especiales} />

        {/* Sorpresas planeadas */}
        <Campo label="Sorpresas Planeadas" valor={ajustes?.sorpresas_planeadas} />

        {/* Protocolo */}
        {protocolo && (
          <div className="border-t-2 border-gray-200 pt-6">
            <div className="flex items-center gap-3 mb-4">
              <Clock className="w-6 h-6 text-purple-600" />
              <h3 className="text-xl font-bold text-gray-900">Protocolo del Evento</h3>
            </div>
            <div className="bg-gray-50 rounded-lg p-6 space-y-4">
              {protocolo.hora_apertura && (
                <div className="bg-white rounded-lg p-3 border border-gray-200">
                  <p className="text-sm font-semibold text-gray-700 mb-1">🕐 Apertura del Salón para Invitados</p>
                  <p className="text-gray-900">{protocolo.hora_apertura}</p>
                </div>
              )}

              {protocolo.hora_anuncio_padres && (
                <div className="bg-white rounded-lg p-3 border border-gray-200">
                  <p className="text-sm font-semibold text-gray-700 mb-1">👨‍👩‍👧 Anuncio de Padres</p>
                  <p className="text-gray-900">{protocolo.hora_anuncio_padres}</p>
                  {protocolo.nombres_padres && (
                    <p className="text-gray-700 text-sm mt-1">Padres: {protocolo.nombres_padres}</p>
                  )}
                </div>
              )}

              {protocolo.hora_anuncio_homenajeado && (
                <div className="bg-white rounded-lg p-3 border border-gray-200">
                  <p className="text-sm font-semibold text-gray-700 mb-1">⭐ Anuncio del Homenajeado</p>
                  <p className="text-gray-900">{protocolo.hora_anuncio_homenajeado}</p>
                  {protocolo.nombre_homenajeado && (
                    <p className="text-gray-700 text-sm mt-1">Nombre: {protocolo.nombre_homenajeado}</p>
                  )}
                  {protocolo.acompanantes && (
                    <p className="text-gray-700 text-sm mt-1">Acompañado de: {protocolo.acompanantes}</p>
                  )}
                </div>
              )}

              {protocolo.cambio_zapatilla !== undefined && (
                <div className="bg-white rounded-lg p-3 border border-gray-200">
                  <p className="text-sm font-semibold text-gray-700 mb-1">👠 Cambio de Zapatilla</p>
                  <p className="text-gray-900">{protocolo.cambio_zapatilla ? 'Sí' : 'No'}</p>
                  {protocolo.cambio_zapatilla && protocolo.cambio_zapatilla_a_cargo && (
                    <p className="text-gray-700 text-sm mt-1">A cargo de: {protocolo.cambio_zapatilla_a_cargo}</p>
                  )}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {protocolo.baile_papa !== undefined && (
                  <div className="bg-white rounded-lg p-3 border border-gray-200">
                    <p className="text-sm font-semibold text-gray-700 mb-1">💃 Baile con Papá</p>
                    <p className="text-gray-900">{protocolo.baile_papa ? 'Sí' : 'No'}</p>
                    {protocolo.baile_papa && protocolo.nombre_papa && (
                      <p className="text-gray-700 text-sm mt-1">Nombre: {protocolo.nombre_papa}</p>
                    )}
                  </div>
                )}

                {protocolo.baile_mama !== undefined && (
                  <div className="bg-white rounded-lg p-3 border border-gray-200">
                    <p className="text-sm font-semibold text-gray-700 mb-1">💃 Baile con Mamá</p>
                    <p className="text-gray-900">{protocolo.baile_mama ? 'Sí' : 'No'}</p>
                    {protocolo.baile_mama && protocolo.nombre_mama && (
                      <p className="text-gray-700 text-sm mt-1">Nombre: {protocolo.nombre_mama}</p>
                    )}
                  </div>
                )}
              </div>

              {protocolo.bailes_adicionales && (
                <div className="bg-white rounded-lg p-3 border border-gray-200">
                  <p className="text-sm font-semibold text-gray-700 mb-1">💃 Bailes Adicionales</p>
                  <p className="text-gray-900 whitespace-pre-wrap">{protocolo.bailes_adicionales}</p>
                </div>
              )}

              {protocolo.ceremonia_velas !== undefined && (
                <div className="bg-white rounded-lg p-3 border border-gray-200">
                  <p className="text-sm font-semibold text-gray-700 mb-1">🕯️ Ceremonia de las 15 Velas</p>
                  <p className="text-gray-900">{protocolo.ceremonia_velas ? 'Sí' : 'No'}</p>
                </div>
              )}

              {protocolo.brindis !== undefined && (
                <div className="bg-white rounded-lg p-3 border border-gray-200">
                  <p className="text-sm font-semibold text-gray-700 mb-1">🥂 Palabras / Brindis</p>
                  <p className="text-gray-900">{protocolo.brindis ? 'Sí' : 'No'}</p>
                  {protocolo.brindis && protocolo.brindis_a_cargo && (
                    <p className="text-gray-700 text-sm mt-1">A cargo de: {protocolo.brindis_a_cargo}</p>
                  )}
                </div>
              )}

              {protocolo.momento_social_fotos !== undefined && (
                <div className="bg-white rounded-lg p-3 border border-gray-200">
                  <p className="text-sm font-semibold text-gray-700 mb-1">📸 Momento Social / Fotos</p>
                  <p className="text-gray-900">{protocolo.momento_social_fotos ? 'Sí' : 'No'}</p>
                  {protocolo.hora_fotos && (
                    <p className="text-gray-700 text-sm mt-1">Hora: {protocolo.hora_fotos}</p>
                  )}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {protocolo.hora_cena && (
                  <div className="bg-white rounded-lg p-3 border border-gray-200">
                    <p className="text-sm font-semibold text-gray-700 mb-1">🍽️ Cena</p>
                    <p className="text-gray-900">{protocolo.hora_cena}</p>
                    {protocolo.proyectar_video !== undefined && (
                      <p className="text-gray-700 text-sm mt-1">
                        Proyectar Video: {protocolo.proyectar_video ? 'Sí' : 'No'}
                      </p>
                    )}
                  </div>
                )}

                {protocolo.hora_photobooth && (
                  <div className="bg-white rounded-lg p-3 border border-gray-200">
                    <p className="text-sm font-semibold text-gray-700 mb-1">📸 Photobooth</p>
                    <p className="text-gray-900">{protocolo.hora_photobooth}</p>
                  </div>
                )}

                {protocolo.hora_loca && (
                  <div className="bg-white rounded-lg p-3 border border-gray-200">
                    <p className="text-sm font-semibold text-gray-700 mb-1">🎉 Hora Loca</p>
                    <p className="text-gray-900">{protocolo.hora_loca}</p>
                  </div>
                )}

                {protocolo.hora_happy_birthday && (
                  <div className="bg-white rounded-lg p-3 border border-gray-200">
                    <p className="text-sm font-semibold text-gray-700 mb-1">🎂 Happy Birthday</p>
                    <p className="text-gray-900">{protocolo.hora_happy_birthday}</p>
                    {protocolo.happy_birthday !== undefined && (
                      <p className="text-gray-700 text-sm mt-1">
                        Incluido: {protocolo.happy_birthday ? 'Sí' : 'No'}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {protocolo.hora_fin && (
                <div className="bg-white rounded-lg p-3 border border-gray-200">
                  <p className="text-sm font-semibold text-gray-700 mb-1">⏰ Fin del Evento</p>
                  <p className="text-gray-900">{protocolo.hora_fin}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AjustesEventoVendedor;

