import { useParams, useNavigate, Link } from 'react-router-dom';
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
  CheckCircle2,
  Download
} from 'lucide-react';
import api from '../config/api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Separator } from '../components/ui/separator';

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

  const handleDescargarPDF = async () => {
    try {
      const response = await api.get(`/ajustes/contrato/${contratoId}/pdf`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Ajustes-Evento-${contrato?.codigo_contrato || 'evento'}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      alert('PDF descargado exitosamente');
    } catch (error) {
      alert('Error al descargar el PDF');
    }
  };

  if (loadingContrato || loadingAjustes) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link to={`/contratos/${contratoId}`}>
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">Ajustes del Evento</h1>
          <p className="text-muted-foreground mt-1">
            {contrato?.clientes?.nombre_completo} • {contrato?.codigo_contrato}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {contrato?.fecha_evento && (
            <Badge variant="outline" className="gap-2">
              <Calendar className="w-4 h-4" />
              <span className="font-medium">
                {new Date(contrato.fecha_evento).toLocaleDateString('es-ES', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </span>
            </Badge>
          )}
          <Button
            onClick={handleDescargarPDF}
            variant="outline"
            className="whitespace-nowrap"
          >
            <Download className="w-4 h-4 mr-2" />
            Descargar PDF
          </Button>
        </div>
      </div>

      {/* Info Banner */}
      <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
        <CardContent className="pt-6">
          <p className="text-sm text-blue-800 dark:text-blue-300">
            El cliente puede modificar estos detalles hasta 10 días antes del evento.
          </p>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Card>
        <CardContent className="p-0">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 divide-x divide-border">
            <a
              href="#torta"
              className="px-4 py-3 text-center hover:bg-muted/50 transition flex flex-col items-center gap-1.5"
            >
              <Cake className="w-5 h-5 text-pink-600 dark:text-pink-400" />
              <span className="text-xs font-medium text-foreground">Torta</span>
            </a>
            <a
              href="#decoracion"
              className="px-4 py-3 text-center hover:bg-muted/50 transition flex flex-col items-center gap-1.5"
            >
              <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              <span className="text-xs font-medium text-foreground">Decoración</span>
            </a>
            <a
              href="#menu"
              className="px-4 py-3 text-center hover:bg-muted/50 transition flex flex-col items-center gap-1.5"
            >
              <UtensilsCrossed className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              <span className="text-xs font-medium text-foreground">Menú</span>
            </a>
            <a
              href="#musica"
              className="px-4 py-3 text-center hover:bg-muted/50 transition flex flex-col items-center gap-1.5"
            >
              <Music2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <span className="text-xs font-medium text-foreground">Música</span>
            </a>
            <a
              href="#bar"
              className="px-4 py-3 text-center hover:bg-muted/50 transition flex flex-col items-center gap-1.5"
            >
              <Wine className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <span className="text-xs font-medium text-foreground">Bar</span>
            </a>
            <a
              href="#otros"
              className="px-4 py-3 text-center hover:bg-muted/50 transition flex flex-col items-center gap-1.5"
            >
              <Settings className="w-5 h-5 text-muted-foreground" />
              <span className="text-xs font-medium text-foreground">Final</span>
            </a>
          </div>
        </CardContent>
      </Card>

      {/* Secciones */}
      {ajustes ? (
        <div className="space-y-4">
          {/* Torta */}
          <SeccionTorta ajustes={ajustes} contrato={contrato} />
          
          {/* Decoración */}
          <SeccionDecoracion ajustes={ajustes} contrato={contrato} />
          
          {/* Menú */}
          <SeccionMenu ajustes={ajustes} contrato={contrato} />
          
          {/* Música */}
          <SeccionMusica ajustes={ajustes} contrato={contrato} />
          
          {/* Bar */}
          <SeccionBar ajustes={ajustes} contrato={contrato} />
          
          {/* Final */}
          <SeccionOtros ajustes={ajustes} contrato={contrato} />
        </div>
      ) : (
        <Card>
          <CardContent className="pt-12 pb-12 text-center">
            <Settings className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">El cliente aún no ha configurado los ajustes del evento</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Componente para mostrar campo
function Campo({ label, valor, icono }) {
  if (!valor) return null;
  
  return (
    <div className="bg-muted/50 rounded-lg p-3 border border-border">
      <div className="flex items-start gap-2">
        {icono && <div className="mt-0.5 text-muted-foreground">{icono}</div>}
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-muted-foreground mb-0.5">{label}</p>
          <p className="text-sm text-foreground whitespace-pre-wrap break-words">{valor}</p>
        </div>
      </div>
    </div>
  );
}

// Helper para detectar si un servicio está contratado
function tieneServicioContratado(contrato, palabrasClave) {
  // Verificar si el paquete es personalizado
  const nombrePaquete = contrato?.paquetes?.nombre?.toLowerCase() || '';
  const esPaquetePersonalizado = nombrePaquete.includes('personalizado');

  // Si NO es paquete personalizado, todos los paquetes incluyen estos servicios
  if (!esPaquetePersonalizado) {
    return true;
  }

  // Si es personalizado, verificar si el servicio está en servicios adicionales (extras)
  // Los servicios adicionales son los que están en contratos_servicios pero NO incluidos en el paquete
  const serviciosAdicionales = (contrato?.contratos_servicios || [])
    .filter(cs => !cs.incluido_en_paquete) // Solo servicios que NO están incluidos en el paquete
    .map(cs => cs.servicios?.nombre)
    .filter(Boolean);

  // También verificar servicios del paquete (por si acaso)
  const serviciosPaquete = (contrato?.paquetes?.paquetes_servicios || [])
    .map(ps => ps.servicios?.nombre)
    .filter(Boolean);

  // Combinar ambos
  const todosServicios = [...serviciosAdicionales, ...serviciosPaquete];

  return todosServicios.some(nombre => {
    const nombreLower = nombre?.toLowerCase() || '';
    return palabrasClave.some(palabra => nombreLower.includes(palabra.toLowerCase()));
  });
}

// Sección Torta
function SeccionTorta({ ajustes, contrato }) {
  // Verificar si tiene torta contratada
  const tieneTorta = tieneServicioContratado(contrato, ['torta', 'cake', 'pastel']);

  // Determinar número de pisos automáticamente según el salón
  const pisosPorSalon = {
    'Diamond': 3,
    'Kendall': 2,
    'Doral': 2
  };
  
  const nombreSalon = contrato?.lugar_salon || contrato?.salones?.nombre || 'Diamond';
  const pisosAutomaticos = pisosPorSalon[nombreSalon] || 3;

  if (!tieneTorta) {
    return (
      <Card id="torta">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <Cake className="w-6 h-6 text-pink-600 dark:text-pink-400" />
            Torta
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Card className="bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-800">
            <CardContent className="pt-12 pb-12 text-center">
              <Cake className="w-12 h-12 text-yellow-600 dark:text-yellow-400 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-yellow-900 dark:text-yellow-300 mb-2">Servicio de Torta no Contratado</h3>
              <p className="text-sm text-yellow-800 dark:text-yellow-300">
                El cliente no tiene contratado ningún servicio de torta en su evento.
              </p>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card id="torta">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Cake className="w-5 h-5 text-pink-600 dark:text-pink-400" />
          Torta
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          <Campo label="Diseño" valor={ajustes?.diseno_torta || ajustes?.diseno_otro} />
          <Campo label="Sabor" valor={ajustes?.sabor_torta || ajustes?.sabor_otro} />
          <Campo label="Pisos" valor={`${pisosAutomaticos} ${pisosAutomaticos === 1 ? 'piso' : 'pisos'}`} />
          <Campo label="Notas" valor={ajustes?.notas_torta} />
        </div>
      </CardContent>
    </Card>
  );
}

// Sección Decoración
function SeccionDecoracion({ ajustes, contrato }) {
  // Verificar si tiene decoración contratada
  const tieneDecoracion = tieneServicioContratado(contrato, ['decoración', 'decoracion', 'decoración básica', 'decoración premium', 'decoracion basica', 'decoracion premium']);

  // Formatear servilletas si existen
  const formatearServilletas = () => {
    if (!ajustes?.servilletas || !Array.isArray(ajustes.servilletas)) return null;
    
    return ajustes.servilletas.map((s, i) => (
      <span key={i} className="inline-block bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm mr-2 mb-2 capitalize">
        {s.color}: {s.cantidad}
      </span>
    ));
  };

  if (!tieneDecoracion) {
    return (
      <Card id="decoracion">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <Sparkles className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            Decoración
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Card className="bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-800">
            <CardContent className="pt-12 pb-12 text-center">
              <Sparkles className="w-12 h-12 text-yellow-600 dark:text-yellow-400 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-yellow-900 dark:text-yellow-300 mb-2">Servicio de Decoración no Contratado</h3>
              <p className="text-sm text-yellow-800 dark:text-yellow-300">
                El cliente no tiene contratado ningún servicio de decoración en su evento.
              </p>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card id="decoracion">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            Decoración
          </CardTitle>
          {ajustes?.tipo_decoracion && (
            <Badge 
              variant="outline"
              className="text-xs"
            >
              {ajustes.tipo_decoracion === 'premium' ? 'Premium' : 'Básica'}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-4">
        {/* Preferencias Generales */}
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-2">Preferencias Generales</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Campo label="Estilo" valor={ajustes?.estilo_decoracion} />
            {ajustes?.estilo_decoracion === 'Otro' && ajustes?.estilo_decoracion_otro && (
              <Campo label="Estilo Personalizado" valor={ajustes?.estilo_decoracion_otro} />
            )}
            <Campo label="Temática" valor={ajustes?.tematica} />
            <Campo label="Colores" valor={ajustes?.colores_principales} />
          </div>
          {ajustes?.notas_decoracion && (
            <div className="mt-3">
              <Campo label="Notas" valor={ajustes?.notas_decoracion} />
            </div>
          )}
        </div>

        {/* Decoración Detallada (Solo si está configurada) */}
        {ajustes?.tipo_decoracion && (
          <>
            <Separator />
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-3">Detalles Específicos</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-2">
                {/* Cojines */}
                {ajustes?.cojines_color && (
                  <div className="bg-muted/50 rounded-lg p-2.5 border border-border">
                    <p className="text-xs font-medium text-muted-foreground mb-0.5">Cojines</p>
                    <p className="text-xs font-semibold text-foreground capitalize">{ajustes.cojines_color}</p>
                  </div>
                )}

                {/* Centro de Mesa */}
                {ajustes?.centro_mesa_1 && (
                  <div className="bg-muted/50 rounded-lg p-2.5 border border-border">
                    <p className="text-xs font-medium text-muted-foreground mb-0.5">Centro de Mesa</p>
                    <p className="text-xs font-semibold text-foreground capitalize">{ajustes.centro_mesa_1}</p>
                    {ajustes.centro_mesa_1 === 'cilindro' && (
                      <p className="text-[10px] text-muted-foreground mt-0.5">3 cilindros</p>
                    )}
                  </div>
                )}

                {/* Base */}
                {ajustes?.base_color && (
                  <div className="bg-muted/50 rounded-lg p-2.5 border border-border">
                    <p className="text-xs font-medium text-muted-foreground mb-0.5">Base</p>
                    <p className="text-xs font-semibold text-foreground capitalize">{ajustes.base_color}</p>
                  </div>
                )}

                {/* Challer */}
                {ajustes?.challer_color && (
                  <div className="bg-muted/50 rounded-lg p-2.5 border border-border">
                    <p className="text-xs font-medium text-muted-foreground mb-0.5">Challer</p>
                    <p className="text-xs font-semibold text-foreground capitalize">{ajustes.challer_color}</p>
                  </div>
                )}

                {/* Aros */}
                {ajustes?.aros_color && (
                  <div className="bg-muted/50 rounded-lg p-2.5 border border-border">
                    <p className="text-xs font-medium text-muted-foreground mb-0.5">Aros</p>
                    <p className="text-xs font-semibold text-foreground capitalize">{ajustes.aros_color}</p>
                    {ajustes.aros_color === 'otro' && ajustes.aros_nota && (
                      <p className="text-[10px] text-muted-foreground mt-0.5 italic truncate" title={ajustes.aros_nota}>{ajustes.aros_nota}</p>
                    )}
                  </div>
                )}

                {/* Runner */}
                {ajustes?.runner_tipo && (
                  <div className="bg-muted/50 rounded-lg p-2.5 border border-border">
                    <p className="text-xs font-medium text-muted-foreground mb-0.5">Runner</p>
                    <p className="text-xs font-semibold text-foreground capitalize">{ajustes.runner_tipo}</p>
                    {ajustes.runner_tipo === 'otros' && ajustes.runner_nota && (
                      <p className="text-[10px] text-muted-foreground mt-0.5 italic truncate" title={ajustes.runner_nota}>{ajustes.runner_nota}</p>
                    )}
                  </div>
                )}

                {/* Stage */}
                {ajustes?.stage_tipo && (
                  <div className="bg-muted/50 rounded-lg p-2.5 border border-border">
                    <p className="text-xs font-medium text-muted-foreground mb-0.5">Stage</p>
                    <p className="text-xs font-semibold text-foreground capitalize">{ajustes.stage_tipo}</p>
                    {ajustes.stage_tipo === 'globos' && ajustes.stage_color_globos && (
                      <p className="text-[10px] text-muted-foreground mt-0.5">Color: {ajustes.stage_color_globos}</p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Servilletas */}
            {ajustes?.servilletas && ajustes.servilletas.length > 0 && (
              <>
                <Separator />
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-2">Servilletas</h3>
                  <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                    {ajustes.servilletas.map((s, i) => (
                      <div key={i} className="bg-muted/50 rounded-lg p-2.5 border border-border">
                        <p className="text-xs font-semibold text-foreground capitalize">{s.color}</p>
                        <p className="text-[10px] text-muted-foreground">Qty: {s.cantidad}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Detalles Premium */}
            {ajustes?.tipo_decoracion === 'premium' && ajustes?.decoracion_premium_detalles && (
              <>
                <Separator />
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-2">Detalles Premium</h3>
                  <div className="bg-purple-50 dark:bg-purple-950/20 rounded-lg p-3 border border-purple-200 dark:border-purple-800">
                    <p className="text-xs text-foreground whitespace-pre-wrap">{ajustes.decoracion_premium_detalles}</p>
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

// Sección Menú
function SeccionMenu({ ajustes, contrato }) {
  // Verificar si tiene menú/comida contratada
  const tieneMenu = tieneServicioContratado(contrato, ['comida', 'menú', 'menu', 'pasapalo', 'pasapalos', 'cena', 'almuerzo']);
  
  const mostrarTeenagers = ajustes?.hay_teenagers && ajustes?.cantidad_teenagers > 0;
  
  // Verificar si tiene pasapalos contratados
  const tienePasapalos = contrato?.contratos_servicios?.some(
    cs => cs.servicios?.nombre?.toLowerCase().includes('pasapalo')
  ) || contrato?.paquetes?.paquetes_servicios?.some(
    ps => ps.servicios?.nombre?.toLowerCase().includes('pasapalo')
  );

  if (!tieneMenu) {
    return (
      <Card id="menu">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <UtensilsCrossed className="w-6 h-6 text-orange-600 dark:text-orange-400" />
            Menú
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Card className="bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-800">
            <CardContent className="pt-12 pb-12 text-center">
              <UtensilsCrossed className="w-12 h-12 text-yellow-600 dark:text-yellow-400 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-yellow-900 dark:text-yellow-300 mb-2">Servicio de Menú no Contratado</h3>
              <p className="text-sm text-yellow-800 dark:text-yellow-300">
                El cliente no tiene contratado ningún servicio de menú o comida en su evento.
              </p>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card id="menu">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <UtensilsCrossed className="w-5 h-5 text-orange-600 dark:text-orange-400" />
          Menú
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 space-y-4">
        {/* Sección de Pasapalos (Solo informativa) */}
        {tienePasapalos && (
          <div className="bg-amber-50 dark:bg-amber-950/20 rounded-lg p-3 border border-amber-200 dark:border-amber-800">
            <p className="text-xs font-semibold text-amber-900 dark:text-amber-300 mb-2">Pasapalos Incluidos</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <div className="bg-background rounded p-2 border border-amber-200 dark:border-amber-800">
                <p className="text-xs font-semibold text-foreground">Tequeños</p>
              </div>
              <div className="bg-background rounded p-2 border border-amber-200 dark:border-amber-800">
                <p className="text-xs font-semibold text-foreground">Bolitas de carne</p>
              </div>
              <div className="bg-background rounded p-2 border border-amber-200 dark:border-amber-800">
                <p className="text-xs font-semibold text-foreground">Salchichas en hojaldre</p>
              </div>
              <div className="bg-background rounded p-2 border border-amber-200 dark:border-amber-800">
                <p className="text-xs font-semibold text-foreground">Tuna tartar</p>
              </div>
            </div>
          </div>
        )}
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          <Campo label="Tipo de Servicio" valor={ajustes?.tipo_servicio} />
          <Campo label="Entrada" valor={ajustes?.entrada} />
          <Campo label="Plato Principal" valor={ajustes?.plato_principal} />
          <Campo label="Acompañamientos" valor={ajustes?.acompanamientos || ajustes?.acompanamiento_seleccionado} />
          <Campo label="Vegetarianas" valor={ajustes?.opciones_vegetarianas} />
          <Campo label="Veganas" valor={ajustes?.opciones_veganas} />
          <Campo label="Restricciones" valor={ajustes?.restricciones_alimentarias} />
          <Campo label="Bebidas" valor={ajustes?.bebidas_incluidas} />
          
          {/* Teenagers/Kids */}
          {mostrarTeenagers && (
            <div className="bg-purple-50 dark:bg-purple-950/20 rounded-lg p-3 border border-purple-200 dark:border-purple-800">
              <p className="text-xs font-semibold text-foreground mb-2">Teens/Kids</p>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <p className="text-[10px] text-muted-foreground">Cantidad</p>
                  <p className="text-xs font-semibold text-foreground">{ajustes.cantidad_teenagers}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground">Tipo</p>
                  <p className="text-xs font-semibold text-foreground">{ajustes.teenagers_tipo_comida === 'pasta' ? 'Pasta' : 'Menú'}</p>
                </div>
                {ajustes.teenagers_tipo_comida === 'pasta' && ajustes.teenagers_tipo_pasta && (
                  <div>
                    <p className="text-[10px] text-muted-foreground">Pasta</p>
                    <p className="text-xs font-semibold text-foreground">
                      {ajustes.teenagers_tipo_pasta === 'napolitana' ? 'Napolitana' : 
                       ajustes.teenagers_tipo_pasta === 'alfredo' ? 'Alfredo' : 
                       ajustes.teenagers_tipo_pasta}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
          
          <Campo label="Notas del Menú" valor={ajustes?.notas_menu} />
        </div>
      </CardContent>
    </Card>
  );
}

// Sección Música
function SeccionMusica({ ajustes, contrato }) {
  // Verificar si tiene DJ/música contratada
  const tieneMusica = tieneServicioContratado(contrato, ['dj', 'música', 'musica', 'entretenimiento', 'sonido', 'audio']);

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

  if (!tieneMusica) {
    return (
      <Card id="musica">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <Music2 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            Música
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Card className="bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-800">
            <CardContent className="pt-12 pb-12 text-center">
              <Music2 className="w-12 h-12 text-yellow-600 dark:text-yellow-400 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-yellow-900 dark:text-yellow-300 mb-2">Servicio de Música/DJ no Contratado</h3>
              <p className="text-sm text-yellow-800 dark:text-yellow-300">
                El cliente no tiene contratado ningún servicio de música o DJ en su evento.
              </p>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card id="musica">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Music2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          Música
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          <Campo label="Música Ceremonia" valor={ajustes?.musica_ceremonial} />
          <Campo label="Primer Baile" valor={ajustes?.primer_baile} />
          <Campo label="Canción Sorpresa" valor={ajustes?.cancion_sorpresa} />
          <Campo label="Notas" valor={ajustes?.notas_entretenimiento} />
        </div>
        
        {/* Bailes Adicionales */}
        {bailesAdicionales && bailesAdicionales.length > 0 && (
          <div className="mt-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg p-3 border border-blue-200 dark:border-blue-800">
            <p className="text-xs font-semibold text-foreground mb-2">Bailes Adicionales</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {bailesAdicionales.map((baile, index) => (
                <div key={index} className="bg-background rounded p-2.5 border border-border">
                  <p className="text-xs font-semibold text-foreground mb-1">Baile {index + 1}</p>
                  {baile.nombre && (
                    <p className="text-xs text-foreground mb-1">{baile.nombre}</p>
                  )}
                  {baile.con_quien && (
                    <p className="text-[10px] text-muted-foreground">Con: {baile.con_quien}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
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
      <Card id="bar">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <Wine className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            Bar - Cócteles y Bebidas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Card className="bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-800">
            <CardContent className="pt-12 pb-12 text-center">
              <Wine className="w-12 h-12 text-yellow-600 dark:text-yellow-400 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-yellow-900 dark:text-yellow-300 mb-2">Servicio de Bar no Contratado</h3>
              <p className="text-sm text-yellow-800 dark:text-yellow-300">
                El cliente no tiene contratado ningún servicio de licor (Básico o Premium) en su evento.
              </p>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card id="bar">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Wine className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            Bar - Cócteles y Bebidas
          </CardTitle>
          {tipoLicor === 'premium' && (
            <Badge variant="outline" className="text-xs">
              Premium
            </Badge>
          )}
          {tipoLicor === 'basico' && (
            <Badge variant="outline" className="text-xs">
              Básico
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-4">
        <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-2.5 border border-blue-200 dark:border-blue-800">
          <p className="text-xs text-blue-800 dark:text-blue-300">
            Servicio de {tipoLicor === 'premium' ? 'Licor Premium' : 'Licor Básico'}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Alcohol - Izquierda */}
          <div className="space-y-3">
            <div>
              <h4 className="text-xs font-semibold text-foreground mb-2">Vinos</h4>
              <div className="grid grid-cols-3 gap-2">
                {vinos.map((vino, index) => (
                  <div key={index} className="bg-muted/50 rounded-lg p-2 border border-border">
                    <p className="text-xs font-medium text-foreground text-center">{vino}</p>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-xs font-semibold text-foreground mb-2">Ron</h4>
              <div className="grid grid-cols-2 gap-2">
                {(tipoLicor === 'premium' ? ['Ron Bacardi Blanco', 'Ron Bacardi Gold'] : ['Ron Spice', 'Ron Blanco']).map((ron, index) => (
                  <div key={index} className="bg-muted/50 rounded-lg p-2 border border-border">
                    <p className="text-xs font-medium text-foreground text-center">{ron}</p>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-xs font-semibold text-foreground mb-2">Whisky</h4>
              <div className="grid grid-cols-1 gap-2">
                <div className="bg-muted/50 rounded-lg p-2 border border-border">
                  <p className="text-xs font-medium text-foreground text-center">
                    {tipoLicor === 'premium' ? 'Whisky Black Label' : 'Whisky House'}
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-semibold text-foreground mb-2">Vodka y Tequila</h4>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-muted/50 rounded-lg p-2 border border-border">
                  <p className="text-xs font-medium text-foreground text-center">Vodka</p>
                </div>
                <div className="bg-muted/50 rounded-lg p-2 border border-border">
                  <p className="text-xs font-medium text-foreground text-center">Tequila</p>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-semibold text-foreground mb-2">Cócteles</h4>
              <div className="grid grid-cols-3 gap-2">
                {cocteles.map((coctel, index) => (
                  <div key={index} className="bg-muted/50 rounded-lg p-2 border border-border">
                    <p className="text-xs font-medium text-foreground text-center">{coctel}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Refrescos, Jugos y Otros - Derecha */}
          <div className="space-y-3">
            <div>
              <h4 className="text-xs font-semibold text-foreground mb-2">Refrescos</h4>
              <div className="grid grid-cols-2 gap-2">
                {refrescos.map((refresco, index) => (
                  <div key={index} className="bg-muted/50 rounded-lg p-2 border border-border">
                    <p className="text-xs font-medium text-foreground text-center">{refresco}</p>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-xs font-semibold text-foreground mb-2">Jugos</h4>
              <div className="grid grid-cols-2 gap-2">
                {jugos.map((jugo, index) => (
                  <div key={index} className="bg-muted/50 rounded-lg p-2 border border-border">
                    <p className="text-xs font-medium text-foreground text-center">{jugo}</p>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-xs font-semibold text-foreground mb-2">Otros</h4>
              <div className="grid grid-cols-2 gap-2">
                {otros.map((otro, index) => (
                  <div key={index} className="bg-muted/50 rounded-lg p-2 border border-border">
                    <p className="text-xs font-medium text-foreground text-center">{otro}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
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
    <Card id="otros">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Settings className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          Final
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Limosina */}
          {ajustes?.hora_limosina && (
            <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-3 border border-blue-200 dark:border-blue-800">
              <div className="flex items-center gap-2 mb-1">
                <Car className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <p className="text-xs font-semibold text-foreground">Limosina</p>
              </div>
              <p className="text-xs text-muted-foreground">Hora de Recogida</p>
              <p className="text-xs font-medium text-foreground">{formatearHoraLimosina(ajustes.hora_limosina)}</p>
            </div>
          )}

          {/* Vestido de la niña (solo si es quinceañera) */}
          {esQuinceanera && ajustes?.vestido_nina && (
            <Campo label="Vestido de la niña" valor={ajustes.vestido_nina} />
          )}

          {/* Observaciones adicionales */}
          <Campo label="Observaciones" valor={ajustes?.observaciones_adicionales} />

          {/* Items especiales */}
          <Campo label="Items Especiales" valor={ajustes?.items_especiales} />

          {/* Sorpresas planeadas */}
          <Campo label="Sorpresas" valor={ajustes?.sorpresas_planeadas} />
        </div>

        {/* Protocolo */}
        {protocolo && (
          <>
            <Separator className="my-4" />
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Clock className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <h3 className="text-sm font-semibold text-foreground">Protocolo del Evento</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                {protocolo.hora_apertura && (
                  <div className="bg-muted/50 rounded-lg p-2.5 border border-border">
                    <p className="text-[10px] text-muted-foreground mb-0.5">Apertura Salón</p>
                    <p className="text-xs font-medium text-foreground">{protocolo.hora_apertura}</p>
                  </div>
                )}

                {protocolo.hora_anuncio_padres && (
                  <div className="bg-muted/50 rounded-lg p-2.5 border border-border">
                    <p className="text-[10px] text-muted-foreground mb-0.5">Anuncio Padres</p>
                    <p className="text-xs font-medium text-foreground">{protocolo.hora_anuncio_padres}</p>
                    {protocolo.nombres_padres && (
                      <p className="text-[10px] text-muted-foreground mt-0.5 truncate" title={protocolo.nombres_padres}>{protocolo.nombres_padres}</p>
                    )}
                  </div>
                )}

                {protocolo.hora_anuncio_homenajeado && (
                  <div className="bg-muted/50 rounded-lg p-2.5 border border-border">
                    <p className="text-[10px] text-muted-foreground mb-0.5">Anuncio Homenajeado</p>
                    <p className="text-xs font-medium text-foreground">{protocolo.hora_anuncio_homenajeado}</p>
                    {protocolo.nombre_homenajeado && (
                      <p className="text-[10px] text-muted-foreground mt-0.5">{protocolo.nombre_homenajeado}</p>
                    )}
                    {protocolo.acompanantes && (
                      <p className="text-[10px] text-muted-foreground mt-0.5 truncate" title={protocolo.acompanantes}>Con: {protocolo.acompanantes}</p>
                    )}
                  </div>
                )}

                {protocolo.cambio_zapatilla !== undefined && (
                  <div className="bg-muted/50 rounded-lg p-2.5 border border-border">
                    <p className="text-[10px] text-muted-foreground mb-0.5">Cambio Zapatilla</p>
                    <p className="text-xs font-medium text-foreground">{protocolo.cambio_zapatilla ? 'Sí' : 'No'}</p>
                    {protocolo.cambio_zapatilla && protocolo.cambio_zapatilla_a_cargo && (
                      <p className="text-[10px] text-muted-foreground mt-0.5 truncate" title={protocolo.cambio_zapatilla_a_cargo}>{protocolo.cambio_zapatilla_a_cargo}</p>
                    )}
                  </div>
                )}

                {protocolo.baile_papa !== undefined && (
                  <div className="bg-muted/50 rounded-lg p-2.5 border border-border">
                    <p className="text-[10px] text-muted-foreground mb-0.5">Baile con Papá</p>
                    <p className="text-xs font-medium text-foreground">{protocolo.baile_papa ? 'Sí' : 'No'}</p>
                    {protocolo.baile_papa && protocolo.nombre_papa && (
                      <p className="text-[10px] text-muted-foreground mt-0.5">{protocolo.nombre_papa}</p>
                    )}
                  </div>
                )}

                {protocolo.baile_mama !== undefined && (
                  <div className="bg-muted/50 rounded-lg p-2.5 border border-border">
                    <p className="text-[10px] text-muted-foreground mb-0.5">Baile con Mamá</p>
                    <p className="text-xs font-medium text-foreground">{protocolo.baile_mama ? 'Sí' : 'No'}</p>
                    {protocolo.baile_mama && protocolo.nombre_mama && (
                      <p className="text-[10px] text-muted-foreground mt-0.5">{protocolo.nombre_mama}</p>
                    )}
                  </div>
                )}

                {protocolo.bailes_adicionales && (
                  <div className="bg-muted/50 rounded-lg p-2.5 border border-border md:col-span-2 lg:col-span-3">
                    <p className="text-[10px] text-muted-foreground mb-0.5">Bailes Adicionales</p>
                    <p className="text-xs font-medium text-foreground whitespace-pre-wrap">{protocolo.bailes_adicionales}</p>
                  </div>
                )}

                {protocolo.ceremonia_velas !== undefined && (
                  <div className="bg-muted/50 rounded-lg p-2.5 border border-border">
                    <p className="text-[10px] text-muted-foreground mb-0.5">15 Velas</p>
                    <p className="text-xs font-medium text-foreground">{protocolo.ceremonia_velas ? 'Sí' : 'No'}</p>
                  </div>
                )}

                {protocolo.brindis !== undefined && (
                  <div className="bg-muted/50 rounded-lg p-2.5 border border-border">
                    <p className="text-[10px] text-muted-foreground mb-0.5">Brindis</p>
                    <p className="text-xs font-medium text-foreground">{protocolo.brindis ? 'Sí' : 'No'}</p>
                    {protocolo.brindis && protocolo.brindis_a_cargo && (
                      <p className="text-[10px] text-muted-foreground mt-0.5 truncate" title={protocolo.brindis_a_cargo}>{protocolo.brindis_a_cargo}</p>
                    )}
                  </div>
                )}

                {protocolo.momento_social_fotos !== undefined && (
                  <div className="bg-muted/50 rounded-lg p-2.5 border border-border">
                    <p className="text-[10px] text-muted-foreground mb-0.5">Fotos</p>
                    <p className="text-xs font-medium text-foreground">{protocolo.momento_social_fotos ? 'Sí' : 'No'}</p>
                    {protocolo.hora_fotos && (
                      <p className="text-[10px] text-muted-foreground mt-0.5">{protocolo.hora_fotos}</p>
                    )}
                  </div>
                )}

                {protocolo.hora_cena && (
                  <div className="bg-muted/50 rounded-lg p-2.5 border border-border">
                    <p className="text-[10px] text-muted-foreground mb-0.5">Cena</p>
                    <p className="text-xs font-medium text-foreground">{protocolo.hora_cena}</p>
                    {protocolo.proyectar_video !== undefined && (
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        Video: {protocolo.proyectar_video ? 'Sí' : 'No'}
                      </p>
                    )}
                  </div>
                )}

                {protocolo.hora_photobooth && (
                  <div className="bg-muted/50 rounded-lg p-2.5 border border-border">
                    <p className="text-[10px] text-muted-foreground mb-0.5">Photobooth</p>
                    <p className="text-xs font-medium text-foreground">{protocolo.hora_photobooth}</p>
                  </div>
                )}

                {protocolo.hora_loca && (
                  <div className="bg-muted/50 rounded-lg p-2.5 border border-border">
                    <p className="text-[10px] text-muted-foreground mb-0.5">Hora Loca</p>
                    <p className="text-xs font-medium text-foreground">{protocolo.hora_loca}</p>
                  </div>
                )}

                {protocolo.hora_happy_birthday && (
                  <div className="bg-muted/50 rounded-lg p-2.5 border border-border">
                    <p className="text-[10px] text-muted-foreground mb-0.5">Happy Birthday</p>
                    <p className="text-xs font-medium text-foreground">{protocolo.hora_happy_birthday}</p>
                    {protocolo.happy_birthday !== undefined && (
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        Incluido: {protocolo.happy_birthday ? 'Sí' : 'No'}
                      </p>
                    )}
                  </div>
                )}

                {protocolo.hora_fin && (
                  <div className="bg-muted/50 rounded-lg p-2.5 border border-border">
                    <p className="text-[10px] text-muted-foreground mb-0.5">Fin del Evento</p>
                    <p className="text-xs font-medium text-foreground">{protocolo.hora_fin}</p>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default AjustesEventoVendedor;
