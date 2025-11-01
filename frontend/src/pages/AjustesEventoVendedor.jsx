import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { 
  ArrowLeft, 
  Cake, 
  Sparkles, 
  UtensilsCrossed, 
  Music2, 
  Camera, 
  Settings,
  Loader2,
  Calendar
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
            href="#entretenimiento"
            className="px-4 py-3 text-center hover:bg-gray-50 transition flex flex-col items-center gap-1"
          >
            <Music2 className="w-5 h-5 text-blue-600" />
            <span className="text-xs font-medium">Entretenimiento</span>
          </a>
          <a
            href="#fotografia"
            className="px-4 py-3 text-center hover:bg-gray-50 transition flex flex-col items-center gap-1"
          >
            <Camera className="w-5 h-5 text-green-600" />
            <span className="text-xs font-medium">Fotografía</span>
          </a>
          <a
            href="#otros"
            className="px-4 py-3 text-center hover:bg-gray-50 transition flex flex-col items-center gap-1"
          >
            <Settings className="w-5 h-5 text-gray-600" />
            <span className="text-xs font-medium">Otros</span>
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
          <SeccionMenu ajustes={ajustes} />
          
          {/* Entretenimiento */}
          <SeccionEntretenimiento ajustes={ajustes} />
          
          {/* Fotografía */}
          <SeccionFotografia ajustes={ajustes} />
          
          {/* Otros */}
          <SeccionOtros ajustes={ajustes} />
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
        <Campo label="Número de Pisos" valor={ajustes?.pisos_torta} />
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
  return (
    <div id="decoracion" className="bg-white rounded-xl shadow-sm border p-6">
      <div className="flex items-center gap-3 mb-6 pb-4 border-b">
        <Sparkles className="w-6 h-6 text-purple-600" />
        <h2 className="text-2xl font-bold text-gray-900">Decoración</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Campo label="Tema de Decoración" valor={ajustes?.tema_decoracion} />
        <Campo label="Color Principal" valor={ajustes?.color_principal} />
        <Campo label="Color Secundario" valor={ajustes?.color_secundario} />
        <Campo label="Estilo" valor={ajustes?.estilo_decoracion} />
        <div className="md:col-span-2">
          <Campo label="Elementos Especiales" valor={ajustes?.elementos_decoracion} />
        </div>
        <div className="md:col-span-2">
          <Campo label="Notas Adicionales" valor={ajustes?.notas_decoracion} />
        </div>
      </div>
    </div>
  );
}

// Sección Menú
function SeccionMenu({ ajustes }) {
  return (
    <div id="menu" className="bg-white rounded-xl shadow-sm border p-6">
      <div className="flex items-center gap-3 mb-6 pb-4 border-b">
        <UtensilsCrossed className="w-6 h-6 text-orange-600" />
        <h2 className="text-2xl font-bold text-gray-900">Menú</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Campo label="Tipo de Servicio" valor={ajustes?.tipo_servicio} />
        <Campo label="Entrada" valor={ajustes?.entrada} />
        <Campo label="Plato Principal" valor={ajustes?.plato_principal} />
        <Campo label="Acompañamientos" valor={ajustes?.acompanamientos} />
        <div className="md:col-span-2">
          <Campo label="Opciones Vegetarianas" valor={ajustes?.opciones_vegetarianas} />
        </div>
        <div className="md:col-span-2">
          <Campo label="Opciones Veganas" valor={ajustes?.opciones_veganas} />
        </div>
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

// Sección Entretenimiento
function SeccionEntretenimiento({ ajustes }) {
  return (
    <div id="entretenimiento" className="bg-white rounded-xl shadow-sm border p-6">
      <div className="flex items-center gap-3 mb-6 pb-4 border-b">
        <Music2 className="w-6 h-6 text-blue-600" />
        <h2 className="text-2xl font-bold text-gray-900">Entretenimiento y Música</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Campo label="Música Ceremonial / Entrada" valor={ajustes?.musica_ceremonial} />
        <Campo label="Primer Baile" valor={ajustes?.primer_baile} />
        <Campo label="Baile Padre-Hija" valor={ajustes?.baile_padre_hija} />
        <Campo label="Baile Madre-Hijo" valor={ajustes?.baile_madre_hijo} />
        <Campo label="Hora del Show" valor={ajustes?.hora_show} />
        <div className="md:col-span-2">
          <Campo label="Actividades Especiales" valor={ajustes?.actividades_especiales} />
        </div>
        <div className="md:col-span-2">
          <Campo label="Notas Adicionales" valor={ajustes?.notas_entretenimiento} />
        </div>
      </div>
    </div>
  );
}

// Sección Fotografía
function SeccionFotografia({ ajustes }) {
  return (
    <div id="fotografia" className="bg-white rounded-xl shadow-sm border p-6">
      <div className="flex items-center gap-3 mb-6 pb-4 border-b">
        <Camera className="w-6 h-6 text-green-600" />
        <h2 className="text-2xl font-bold text-gray-900">Fotografía y Video</h2>
      </div>
      <div className="space-y-4">
        <Campo label="Momentos Especiales a Capturar" valor={ajustes?.momentos_especiales} />
        <Campo label="Poses o Fotos Específicas" valor={ajustes?.poses_especificas} />
        <Campo label="Ubicaciones para Sesión de Fotos" valor={ajustes?.ubicaciones_fotos} />
        <Campo label="Notas Adicionales" valor={ajustes?.notas_fotografia} />
      </div>
    </div>
  );
}

// Sección Otros
function SeccionOtros({ ajustes }) {
  return (
    <div id="otros" className="bg-white rounded-xl shadow-sm border p-6">
      <div className="flex items-center gap-3 mb-6 pb-4 border-b">
        <Settings className="w-6 h-6 text-gray-600" />
        <h2 className="text-2xl font-bold text-gray-900">Otros Detalles</h2>
      </div>
      <div className="space-y-4">
        <Campo label="Invitado(s) de Honor" valor={ajustes?.invitado_honor} />
        <Campo label="Brindis Especial" valor={ajustes?.brindis_especial} />
        <Campo label="Sorpresas Planeadas" valor={ajustes?.sorpresas_planeadas} />
        <Campo label="Solicitudes Especiales" valor={ajustes?.solicitudes_especiales} />
      </div>
    </div>
  );
}

export default AjustesEventoVendedor;

