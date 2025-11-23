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
  Download,
  ArrowLeft,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '@shared/store/useAuthStore';
import api from '@shared/config/api';
import SeccionDecoracion from '@components/SeccionDecoracion';
import ImagenSeleccion from '@shared/components/ImagenSeleccion';
import { obtenerImagenTorta, obtenerImagenDecoracion, obtenerImagenMenu } from '@shared/utils/mapeoImagenes';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

function AjustesEvento() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
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
    { id: 'torta', label: 'Torta', icon: Cake, color: 'pink', description: 'Elige el diseño y sabor' },
    { id: 'decoracion', label: 'Decoración', icon: Sparkles, color: 'purple', description: 'Personaliza la decoración' },
    { id: 'menu', label: 'Menú', icon: UtensilsCrossed, color: 'orange', description: 'Selecciona los platos' },
    { id: 'entretenimiento', label: 'Música', icon: Music2, color: 'blue', description: 'Canciones especiales' },
    { id: 'bar', label: 'Bar', icon: Wine, color: 'indigo', description: 'Bebidas incluidas' },
    { id: 'otros', label: 'Final', icon: Settings, color: 'gray', description: 'Detalles finales' },
  ];

  const TabButton = ({ tab }) => {
    const Icon = tab.icon;
    const activo = tabActivo === tab.id;
    
    return (
      <button
        onClick={() => setTabActivo(tab.id)}
        className={cn(
          "flex flex-col items-center gap-2 px-6 py-4 rounded-xl transition-all duration-200 border-2 min-w-[120px]",
          activo
            ? "bg-primary text-primary-foreground border-primary shadow-lg scale-105"
            : "bg-card text-muted-foreground border-border hover:border-primary/50 hover:bg-muted"
        )}
      >
        <Icon className={cn("w-6 h-6", activo && "scale-110")} />
        <span className="font-semibold text-sm">{tab.label}</span>
        {activo && <span className="text-xs opacity-90">{tab.description}</span>}
      </button>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-4 w-96 mt-2" />
          </CardHeader>
        </Card>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <Skeleton className="h-24 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Toast Notifications */}
      <Toaster position="top-right" />
      
      {/* Header */}
      <Card>
        <CardHeader>
      <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/dashboard')}
                className="h-10 w-10"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
        <div>
                <CardTitle className="text-3xl">Ajustes del Evento</CardTitle>
                <CardDescription className="text-base mt-2">
                  Personaliza todos los detalles de tu día especial. Selecciona cada sección para comenzar.
                </CardDescription>
        </div>
            </div>
            <Button
          onClick={async () => {
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
              toast.success('PDF descargado exitosamente', {
                duration: 3000,
                icon: '✅',
              });
            } catch (error) {
              toast.error('Error al descargar el PDF', {
                duration: 4000,
                icon: '❌',
              });
            }
          }}
              variant="outline"
              className="gap-2"
        >
              <Download className="w-4 h-4" />
          <span className="hidden sm:inline">Descargar PDF</span>
            </Button>
      </div>
        </CardHeader>
      </Card>

      {/* Banner de Bloqueo */}
      {estaBloqueado && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-destructive/10 rounded-full">
                <Lock className="w-6 h-6 text-destructive" />
              </div>
            <div className="flex-1">
                <h3 className="font-bold text-lg text-destructive mb-2">
                ⚠️ Ajustes Bloqueados
              </h3>
                <p className="text-sm text-muted-foreground mb-2">
                Faltan menos de 10 días para tu evento. Los ajustes están bloqueados para garantizar 
                que todo esté listo a tiempo. Si necesitas hacer cambios urgentes, por favor contacta 
                a tu asesor de eventos a través del chat.
              </p>
                <Badge variant="destructive" className="mt-2">
                  📅 Días restantes: {diasHastaEvento}
                </Badge>
            </div>
          </div>
          </CardContent>
        </Card>
      )}

      {/* Banner de Advertencia (5-10 días) */}
      {!estaBloqueado && diasHastaEvento !== null && diasHastaEvento >= 0 && diasHastaEvento < 15 && (
        <Card className="border-yellow-200 bg-yellow-50/50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-yellow-100 rounded-full">
                <AlertTriangle className="w-6 h-6 text-yellow-600" />
              </div>
            <div className="flex-1">
                <h3 className="font-bold text-lg text-yellow-900 mb-2">
                Tiempo Limitado
              </h3>
              <p className="text-sm text-yellow-800">
                Tu evento está próximo ({diasHastaEvento} días). Asegúrate de finalizar todos 
                los ajustes pronto. Recuerda que no podrás modificar nada 10 días antes del evento.
              </p>
            </div>
          </div>
          </CardContent>
        </Card>
      )}

      {/* Progress Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium">Progreso de Personalización</span>
            <Badge variant="secondary" className="text-base px-3 py-1">
            {ajustes?.porcentaje_completado || 0}%
            </Badge>
        </div>
          <div className="w-full bg-muted rounded-full h-4 overflow-hidden">
          <div
              className="bg-primary h-full rounded-full transition-all duration-500"
            style={{ width: `${ajustes?.porcentaje_completado || 0}%` }}
          ></div>
        </div>
          <p className="text-xs text-muted-foreground mt-3">
          Completa los campos importantes para asegurar que todo esté a tu gusto
        </p>
        </CardContent>
      </Card>

      {/* Tabs - Diseño mejorado */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-3 justify-center">
          {tabs.map((tab) => (
            <TabButton key={tab.id} tab={tab} />
          ))}
        </div>
        </CardContent>
      </Card>

      {/* Content */}
      <Card>
        <CardContent className="pt-6">
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
        </CardContent>
      </Card>
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

  const diseños = [
    { value: 'Channel', label: 'Channel' },
    { value: 'Delux', label: 'Delux' },
    { value: 'Blanco', label: 'Blanco' },
    { value: 'Desnudo', label: 'Desnudo' },
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-pink-100 rounded-full mb-4">
          <Cake className="w-8 h-8 text-pink-600" />
        </div>
        <h2 className="text-3xl font-bold mb-2">Elige tu Torta Perfecta</h2>
        <p className="text-muted-foreground">
          Selecciona el diseño y sabor que más te guste. Verás una vista previa grande de cada opción.
        </p>
      </div>

      {/* Información de Pisos */}
      <Card className="bg-blue-50/50 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Cake className="w-5 h-5 text-blue-600" />
            </div>
        <div>
              <p className="font-semibold text-blue-900">Número de Pisos</p>
              <p className="text-sm text-blue-700">
                Tu salón ({nombreSalon}) incluye automáticamente <strong>{pisosAutomaticos} {pisosAutomaticos === 1 ? 'piso' : 'pisos'}</strong>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Selección de Diseño */}
      <div>
        <label className="block text-lg font-semibold mb-4">
          Paso 1: Elige el Diseño de la Torta *
          </label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {diseños.map((diseño) => (
            <button
              key={diseño.value}
              type="button"
              onClick={() => {
                setDatos({ ...datos, diseno_torta: diseño.value, diseno_otro: '' });
                setMostrarDisenoOtro(false);
            }}
            disabled={estaBloqueado}
              className={cn(
                "p-4 rounded-xl border-2 transition-all duration-200 hover:scale-105",
                datos.diseno_torta === diseño.value
                  ? "border-primary bg-primary/10 shadow-lg"
                  : "border-border bg-card hover:border-primary/50"
              )}
            >
              <div className="text-center">
                <p className="font-semibold mb-2">{diseño.label}</p>
                {datos.diseno_torta === diseño.value && (
                  <Badge variant="default" className="text-xs">Seleccionado</Badge>
                )}
              </div>
            </button>
          ))}
        </div>
        
        {/* Opción Otro */}
        <div className="mb-6">
          <label className="flex items-center gap-2 mb-2">
            <input
              type="radio"
              name="diseno_torta"
              value="Otro"
              checked={datos.diseno_torta === 'Otro'}
              onChange={(e) => {
                setDatos({ ...datos, diseno_torta: 'Otro', diseno_otro: '' });
                setMostrarDisenoOtro(true);
              }}
              disabled={estaBloqueado}
              className="w-4 h-4"
            />
            <span className="font-medium">Otro diseño (especificar)</span>
          </label>
          {mostrarDisenoOtro && (
            <input
              type="text"
              value={datos.diseno_otro}
              onChange={(e) => setDatos({ ...datos, diseno_otro: e.target.value })}
              disabled={estaBloqueado}
              placeholder="Describe el diseño que deseas..."
              className="w-full px-4 py-2 border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent outline-none disabled:bg-muted"
            />
          )}
        </div>

        {/* Vista Previa Grande de la Imagen */}
          {datos.diseno_torta && datos.diseno_torta !== 'Otro' && (
          <Card className="bg-gradient-to-br from-pink-50 to-purple-50 border-pink-200">
            <CardContent className="pt-6">
              <div className="text-center mb-4">
                <h3 className="text-xl font-bold mb-2">Vista Previa</h3>
                <p className="text-sm text-muted-foreground">
                  Así se verá tu torta {datos.diseno_torta} de {pisosAutomaticos} {pisosAutomaticos === 1 ? 'piso' : 'pisos'}
                </p>
              </div>
              <div className="flex justify-center">
              <ImagenSeleccion
                urlImagen={obtenerImagenTorta(datos.diseno_torta, pisosAutomaticos)}
                alt={`Torta ${datos.diseno_torta} de ${pisosAutomaticos} pisos`}
                  tamaño="extra-large"
              />
            </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Selección de Sabor */}
      <div>
        <label className="block text-lg font-semibold mb-4">
          Paso 2: Elige el Sabor *
            </label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {['Vainilla', 'Marmoleado'].map((sabor) => (
            <button
              key={sabor}
              type="button"
              onClick={() => {
                setDatos({ ...datos, sabor_torta: sabor, sabor_otro: '' });
                setMostrarSaborOtro(false);
              }}
              disabled={estaBloqueado}
              className={cn(
                "p-6 rounded-xl border-2 transition-all duration-200 hover:scale-105 text-center",
                datos.sabor_torta === sabor
                  ? "border-primary bg-primary/10 shadow-lg"
                  : "border-border bg-card hover:border-primary/50"
              )}
            >
              <p className="text-xl font-semibold mb-2">{sabor}</p>
              {datos.sabor_torta === sabor && (
                <Badge variant="default" className="text-xs">Seleccionado</Badge>
              )}
            </button>
          ))}
          <div>
            <label className="flex items-center gap-2 p-6 rounded-xl border-2 border-border bg-card hover:border-primary/50 transition cursor-pointer">
              <input
                type="radio"
                name="sabor_torta"
                value="Otro"
                checked={datos.sabor_torta === 'Otro'}
                onChange={(e) => {
                  setDatos({ ...datos, sabor_torta: 'Otro', sabor_otro: '' });
                  setMostrarSaborOtro(true);
                }}
                disabled={estaBloqueado}
                className="w-4 h-4"
              />
              <span className="font-semibold">Otro sabor</span>
            </label>
            {mostrarSaborOtro && (
              <input
                type="text"
                value={datos.sabor_otro}
                onChange={(e) => setDatos({ ...datos, sabor_otro: e.target.value })}
                disabled={estaBloqueado}
                placeholder="Especificar sabor..."
                className="mt-2 w-full px-4 py-2 border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent outline-none disabled:bg-muted"
              />
            )}
          </div>
        </div>
      </div>

      {/* Notas Adicionales */}
      <div>
        <label className="block text-lg font-semibold mb-4">
          Notas Adicionales (Opcional)
        </label>
        <textarea
          value={datos.notas_torta}
          onChange={(e) => setDatos({ ...datos, notas_torta: e.target.value })}
          rows="4"
          placeholder="¿Algún detalle especial sobre la torta? Por ejemplo: decoración adicional, mensaje especial, etc..."
          className="w-full px-4 py-3 border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent outline-none resize-none"
          disabled={estaBloqueado}
        />
      </div>

      {/* Botón Guardar */}
      <div className="flex justify-end gap-4 pt-4 border-t">
        <Button
        type="submit"
        disabled={guardando || estaBloqueado}
          size="lg"
          className="min-w-[200px]"
      >
        {guardando ? (
          <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            Guardando...
          </>
        ) : estaBloqueado ? (
          <>
              <Lock className="w-5 h-5 mr-2" />
            Bloqueado
          </>
        ) : (
          <>
              <Save className="w-5 h-5 mr-2" />
            Guardar Cambios
          </>
        )}
        </Button>
      </div>
    </form>
  );
}

// ===== SECCIÓN MENÚ =====
function SeccionMenu({ ajustes, onGuardar, guardando, estaBloqueado, contrato, tienePasapalos }) {
  const [pasoActual, setPasoActual] = useState(1);
  
  const [datos, setDatos] = useState({
    entrada: 'Ensalada César', // Valor fijo por defecto
    plato_principal: ajustes?.plato_principal || '',
    acompanamientos: ajustes?.acompanamientos || '',
    acompanamiento_seleccionado: ajustes?.acompanamiento_seleccionado || '', // Para arroz o patatas específico
    hay_teenagers: ajustes?.hay_teenagers || false,
    cantidad_teenagers: ajustes?.cantidad_teenagers || 0,
    teenagers_tipo_comida: ajustes?.teenagers_tipo_comida || 'pasta', // 'pasta' o 'menu'
    teenagers_tipo_pasta: ajustes?.teenagers_tipo_pasta || '', // 'napolitana' o 'alfredo'
    restricciones_alimentarias: ajustes?.restricciones_alimentarias || '',
    notas_menu: ajustes?.notas_menu || '',
  });

  const totalInvitados = contrato?.cantidad_invitados || 0;
  const invitadosAdultos = totalInvitados - (datos.cantidad_teenagers || 0);

  // Definir los pasos del wizard
  const PASOS = [
    { numero: 1, titulo: 'Entrada', campo: 'entrada' },
    { numero: 2, titulo: 'Plato Principal', campo: 'plato_principal' },
    { numero: 3, titulo: 'Acompañamiento', campo: 'acompanamientos' },
    { numero: 4, titulo: 'Teenagers/Kids', campo: 'hay_teenagers' },
    { numero: 5, titulo: 'Restricciones', campo: 'restricciones_alimentarias' },
  ];

  // Función para verificar si un paso está completo
  const pasoCompleto = (numero) => {
    const paso = PASOS.find(p => p.numero === numero);
    if (!paso) return false;
    
    // Paso 1 (Entrada) - siempre completo porque es fijo
    if (numero === 1) return true;
    
    // Paso 2 (Plato Principal) - debe estar seleccionado
    if (numero === 2) return datos.plato_principal && datos.plato_principal !== '';
    
    // Paso 3 (Acompañamiento) - debe estar seleccionado (o el específico si aplica)
    if (numero === 3) {
      if (datos.acompanamiento_seleccionado) return true;
      return datos.acompanamientos && datos.acompanamientos !== '';
    }
    
    // Paso 4 (Teenagers/Kids) - si no hay teenagers, está completo. Si hay, debe tener cantidad y tipo
    if (numero === 4) {
      if (!datos.hay_teenagers) return true;
      if (datos.cantidad_teenagers <= 0) return false;
      if (datos.teenagers_tipo_comida === 'pasta' && !datos.teenagers_tipo_pasta) return false;
      return true;
    }
    
    // Paso 5 (Restricciones) - siempre completo (opcional)
    if (numero === 5) return true;
    
    return false;
  };

  // Función para avanzar al siguiente paso
  const avanzarPaso = () => {
    if (pasoActual < PASOS.length) {
      setPasoActual(pasoActual + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Función para retroceder al paso anterior
  const retrocederPaso = () => {
    if (pasoActual > 1) {
      setPasoActual(pasoActual - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Función para ir directamente a un paso
  const irAPaso = (numero) => {
    if (numero <= pasoActual || pasoCompleto(numero - 1)) {
      setPasoActual(numero);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Enviar solo los campos que Prisma reconoce
    // Si hay un acompañamiento seleccionado específico, usar ese, sino el general
    const acompanamientoFinal = datos.acompanamiento_seleccionado || datos.acompanamientos;
    
    onGuardar('menu', {
      entrada: datos.entrada, // Siempre será "Ensalada César"
      plato_principal: datos.plato_principal,
      acompanamientos: acompanamientoFinal,
      hay_teenagers: datos.hay_teenagers,
      cantidad_teenagers: datos.hay_teenagers ? parseInt(datos.cantidad_teenagers) : 0,
      teenagers_tipo_comida: datos.hay_teenagers ? datos.teenagers_tipo_comida : null,
      teenagers_tipo_pasta: datos.hay_teenagers && datos.teenagers_tipo_comida === 'pasta' ? datos.teenagers_tipo_pasta : null,
      restricciones_alimentarias: datos.restricciones_alimentarias,
      notas_menu: datos.notas_menu,
    });
  };

  // Renderizar el contenido del paso actual
  const renderPasoActual = () => {
    switch (pasoActual) {
      case 1: // Entrada
  return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold mb-2">Paso 1: Entrada (Incluida)</h3>
              <p className="text-muted-foreground">Tu entrada está incluida por defecto</p>
      </div>
            <Card className="bg-orange-50/50 border-orange-200">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4 mb-4 justify-center">
                  <Badge variant="secondary" className="text-base px-3 py-1">
                    🥗 {datos.entrada}
                  </Badge>
                  <span className="text-sm text-muted-foreground">Incluida por defecto</span>
                </div>
                {datos.entrada === 'Ensalada César' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                    <div className="text-center">
                      <div className="mb-3">
                        <ImagenSeleccion
                          urlImagen={obtenerImagenMenu('entrada', datos.entrada)}
                          alt="Ensalada César"
                          tamaño="extra-large"
                        />
                      </div>
                      <p className="font-semibold text-lg">Ensalada César</p>
                    </div>
                    <div className="text-center">
                      <div className="mb-3">
                        <ImagenSeleccion
                          urlImagen={obtenerImagenMenu('pan', 'pan y mantequilla')}
                          alt="Pan y Mantequilla"
                          tamaño="extra-large"
                        />
                      </div>
                      <p className="font-semibold text-lg">Pan y Mantequilla</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        );

      case 2: // Plato Principal
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold mb-2">Paso 2: Elige el Plato Principal</h3>
              <p className="text-muted-foreground">Selecciona el plato principal que más te guste</p>
            </div>
            <select
              value={datos.plato_principal}
              onChange={(e) => setDatos({ ...datos, plato_principal: e.target.value })}
              disabled={estaBloqueado}
              className="w-full px-4 py-4 text-lg border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent outline-none bg-background disabled:bg-muted disabled:cursor-not-allowed mb-6"
            >
              <option value="">Selecciona un plato principal...</option>
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
            {datos.plato_principal && (
              <Card className="bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200">
                <CardContent className="pt-6">
                  <div className="text-center mb-4">
                    <h4 className="text-xl font-bold mb-2">Vista Previa</h4>
                    <p className="text-sm text-muted-foreground">{datos.plato_principal}</p>
                  </div>
                  <div className="flex justify-center">
                    <ImagenSeleccion
                      urlImagen={obtenerImagenMenu('plato_principal', datos.plato_principal)}
                      alt={datos.plato_principal}
                      tamaño="extra-large"
                    />
                  </div>
                </CardContent>
              </Card>
        )}
      </div>
        );

      case 3: // Acompañamiento
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold mb-2">Paso 3: Elige el Acompañamiento</h3>
              <p className="text-muted-foreground">Selecciona el acompañamiento que más te guste</p>
          </div>
            <select
              value={datos.acompanamientos}
              onChange={(e) => setDatos({ ...datos, acompanamientos: e.target.value, acompanamiento_seleccionado: '' })}
              disabled={estaBloqueado}
              className="w-full px-4 py-4 text-lg border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent outline-none bg-background disabled:bg-muted disabled:cursor-not-allowed mb-4"
            >
              <option value="">Selecciona un acompañamiento...</option>
              <option value="Arroz Blanco o Amarillo">Arroz Blanco o Amarillo</option>
              <option value="Puré de Patatas o Patatas al Romero">
                Puré de Patatas o Patatas al Romero
              </option>
              <option value="Verduras al Vapor">Verduras al Vapor</option>
              <option value="Plátano Maduro">Plátano Maduro</option>
            </select>
            
            {datos.acompanamientos === 'Arroz Blanco o Amarillo' && (
              <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
                <CardContent className="pt-6">
                  <p className="text-lg font-semibold mb-4 text-center">Selecciona el tipo de arroz:</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <button
                      type="button"
                      onClick={() => !estaBloqueado && setDatos({ ...datos, acompanamiento_seleccionado: 'Arroz Blanco' })}
                      disabled={estaBloqueado}
                      className={cn(
                        "p-6 rounded-xl border-2 transition-all duration-200 hover:scale-105 text-center",
                        datos.acompanamiento_seleccionado === 'Arroz Blanco'
                          ? "border-primary bg-primary/10 shadow-lg"
                          : "border-border bg-card hover:border-primary/50"
                      )}
                    >
                      <div className="mb-4 flex justify-center">
              <ImagenSeleccion
                          urlImagen={obtenerImagenMenu('acompanamiento', 'arroz blanco')}
                          alt="Arroz Blanco"
                          tamaño="large"
                        />
            </div>
                      <p className="text-lg font-semibold mb-2">Arroz Blanco</p>
                      {datos.acompanamiento_seleccionado === 'Arroz Blanco' && (
                        <Badge variant="default">Seleccionado</Badge>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => !estaBloqueado && setDatos({ ...datos, acompanamiento_seleccionado: 'Arroz Amarillo' })}
                      disabled={estaBloqueado}
                      className={cn(
                        "p-6 rounded-xl border-2 transition-all duration-200 hover:scale-105 text-center",
                        datos.acompanamiento_seleccionado === 'Arroz Amarillo'
                          ? "border-primary bg-primary/10 shadow-lg"
                          : "border-border bg-card hover:border-primary/50"
                      )}
                    >
                      <div className="mb-4 flex justify-center">
              <ImagenSeleccion
                          urlImagen={obtenerImagenMenu('acompanamiento', 'arroz amarillo')}
                          alt="Arroz Amarillo"
                          tamaño="large"
                        />
            </div>
                      <p className="text-lg font-semibold mb-2">Arroz Amarillo</p>
                      {datos.acompanamiento_seleccionado === 'Arroz Amarillo' && (
                        <Badge variant="default">Seleccionado</Badge>
                      )}
                    </button>
                  </div>
                </CardContent>
              </Card>
            )}

            {datos.acompanamientos === 'Puré de Patatas o Patatas al Romero' && (
              <Card className="bg-gradient-to-br from-yellow-50 to-amber-50 border-yellow-200">
                <CardContent className="pt-6">
                  <p className="text-lg font-semibold mb-4 text-center">Selecciona el tipo de patatas:</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <button
                      type="button"
                      onClick={() => !estaBloqueado && setDatos({ ...datos, acompanamiento_seleccionado: 'Puré de Patatas' })}
                      disabled={estaBloqueado}
                      className={cn(
                        "p-6 rounded-xl border-2 transition-all duration-200 hover:scale-105 text-center",
                        datos.acompanamiento_seleccionado === 'Puré de Patatas'
                          ? "border-primary bg-primary/10 shadow-lg"
                          : "border-border bg-card hover:border-primary/50"
                      )}
                    >
                      <div className="mb-4 flex justify-center">
              <ImagenSeleccion
                          urlImagen={obtenerImagenMenu('acompanamiento', 'puré de patatas')}
                          alt="Puré de Patatas"
                          tamaño="large"
                        />
            </div>
                      <p className="text-lg font-semibold mb-2">Puré de Patatas</p>
                      {datos.acompanamiento_seleccionado === 'Puré de Patatas' && (
                        <Badge variant="default">Seleccionado</Badge>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => !estaBloqueado && setDatos({ ...datos, acompanamiento_seleccionado: 'Patatas al Romero' })}
                      disabled={estaBloqueado}
                      className={cn(
                        "p-6 rounded-xl border-2 transition-all duration-200 hover:scale-105 text-center",
                        datos.acompanamiento_seleccionado === 'Patatas al Romero'
                          ? "border-primary bg-primary/10 shadow-lg"
                          : "border-border bg-card hover:border-primary/50"
                      )}
                    >
                      <div className="mb-4 flex justify-center">
              <ImagenSeleccion
                          urlImagen={obtenerImagenMenu('acompanamiento', 'patatas al romero')}
                          alt="Patatas al Romero"
                          tamaño="large"
                        />
                      </div>
                      <p className="text-lg font-semibold mb-2">Patatas al Romero</p>
                      {datos.acompanamiento_seleccionado === 'Patatas al Romero' && (
                        <Badge variant="default">Seleccionado</Badge>
                      )}
                    </button>
                  </div>
                </CardContent>
              </Card>
            )}

            {datos.acompanamientos && 
             datos.acompanamientos !== 'Arroz Blanco o Amarillo' && 
             datos.acompanamientos !== 'Puré de Patatas o Patatas al Romero' && (
              <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
                <CardContent className="pt-6">
                  <div className="text-center mb-4">
                    <h4 className="text-xl font-bold mb-2">Vista Previa</h4>
                    <p className="text-sm text-muted-foreground">{datos.acompanamientos}</p>
                  </div>
                  <div className="flex justify-center">
                    <ImagenSeleccion
                      urlImagen={obtenerImagenMenu('acompanamiento', datos.acompanamientos)}
                      alt={datos.acompanamientos}
                      tamaño="extra-large"
                    />
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        );

      case 4: // Teenagers/Kids
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold mb-2">Paso 4: Teenagers/Kids</h3>
              <p className="text-muted-foreground">Indica si habrá teenagers o niños en el evento</p>
            </div>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-6">
                  <input
                    type="checkbox"
                    id="hay_teenagers"
                    checked={datos.hay_teenagers}
                    onChange={(e) => setDatos({ ...datos, hay_teenagers: e.target.checked, cantidad_teenagers: e.target.checked ? datos.cantidad_teenagers : 0 })}
                    disabled={estaBloqueado}
                    className="w-5 h-5 text-primary border-input rounded focus:ring-primary disabled:opacity-50"
                  />
                  <label htmlFor="hay_teenagers" className="text-lg font-semibold cursor-pointer">
                    ¿Habrá Teenagers/Kids en el evento?
                  </label>
                </div>

                {datos.hay_teenagers && (
                  <div className="space-y-4 mt-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">
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
                        className="w-full px-4 py-3 text-base border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent outline-none bg-background disabled:bg-muted"
                        required
                      />
                    </div>

                    {datos.cantidad_teenagers > 0 && (
                      <div>
                        <label className="block text-sm font-medium mb-2">
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
                              className="w-4 h-4 text-primary border-input focus:ring-primary disabled:opacity-50"
                              required
                            />
                            <span className="text-sm font-medium">Pasta</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name="teenagers_tipo_comida"
                              value="menu"
                              checked={datos.teenagers_tipo_comida === 'menu'}
                              onChange={(e) => setDatos({ ...datos, teenagers_tipo_comida: e.target.value, teenagers_tipo_pasta: '' })}
                              disabled={estaBloqueado}
                              className="w-4 h-4 text-primary border-input focus:ring-primary disabled:opacity-50"
                              required
                            />
                            <span className="text-sm font-medium">Menú</span>
                          </label>
                        </div>
                      </div>
                    )}

                    {datos.cantidad_teenagers > 0 && datos.teenagers_tipo_comida === 'pasta' && (
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Tipo de Pasta *
                        </label>
                        <select
                          value={datos.teenagers_tipo_pasta}
                          onChange={(e) => setDatos({ ...datos, teenagers_tipo_pasta: e.target.value })}
                          disabled={estaBloqueado}
                          className="w-full px-4 py-3 text-base border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent outline-none bg-background disabled:bg-muted"
                          required
                        >
                          <option value="">Seleccionar tipo de pasta...</option>
                          <option value="napolitana">Pasta Napolitana</option>
                          <option value="alfredo">Pasta Alfredo</option>
                        </select>
                        {datos.teenagers_tipo_pasta && (
                          <div className="mt-4 flex justify-center">
                            <ImagenSeleccion
                              urlImagen={obtenerImagenMenu('pasta', datos.teenagers_tipo_pasta)}
                              alt={`Pasta ${datos.teenagers_tipo_pasta}`}
                              tamaño="large"
                            />
                          </div>
                        )}
                      </div>
                    )}

                    {datos.cantidad_teenagers > 0 && (
                      <Card className="bg-blue-50/50 border-blue-200">
                        <CardContent className="pt-6">
                          <p className="text-sm font-medium text-blue-900 mb-2">
                            📋 Resumen de platos:
                          </p>
                          <ul className="text-sm text-blue-800 space-y-1">
                            <li>• {invitadosAdultos} platos según selección de menú (adultos)</li>
                            <li>
                              • {datos.cantidad_teenagers} {datos.teenagers_tipo_comida === 'pasta' 
                                ? `pasta(s) ${datos.teenagers_tipo_pasta === 'napolitana' ? 'Napolitana' : datos.teenagers_tipo_pasta === 'alfredo' ? 'Alfredo' : ''}`
                                : 'menú(es) según selección'}
                              {' '}(teens/kids)
                            </li>
                          </ul>
                        </CardContent>
                      </Card>
                    )}
            </div>
                )}
              </CardContent>
            </Card>
          </div>
        );

      case 5: // Restricciones y Notas
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold mb-2">Paso 5: Restricciones y Notas</h3>
              <p className="text-muted-foreground">Información adicional sobre restricciones alimentarias y notas especiales</p>
            </div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  🌱 Restricciones y Detalles Especiales
                </CardTitle>
                <CardDescription>
                  Información importante sobre alergias, restricciones alimentarias o preferencias especiales
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Restricciones Alimentarias / Alergias / Vegetarianos
                  </label>
                  <textarea
                    value={datos.restricciones_alimentarias}
                    onChange={(e) => setDatos({ ...datos, restricciones_alimentarias: e.target.value })}
                    disabled={estaBloqueado}
                    rows={4}
                    placeholder="Ej: 2 personas vegetarianas, 1 alergia a frutos secos, 1 intolerancia a lactosa..."
                    className="w-full px-4 py-3 text-base border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent outline-none bg-background disabled:bg-muted resize-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Notas Adicionales del Menú
                  </label>
                  <textarea
                    value={datos.notas_menu}
                    onChange={(e) => setDatos({ ...datos, notas_menu: e.target.value })}
                    disabled={estaBloqueado}
                    rows={4}
                    placeholder="Cualquier comentario o solicitud especial sobre el menú..."
                    className="w-full px-4 py-3 text-base border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent outline-none bg-background disabled:bg-muted resize-none"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-100 rounded-full mb-4">
          <UtensilsCrossed className="w-8 h-8 text-orange-600" />
        </div>
        <h2 className="text-3xl font-bold mb-2">Elige tu Menú</h2>
        <p className="text-muted-foreground">
          Completa cada paso para personalizar el menú de tu evento
            </p>
          </div>

      {/* Información de distribución */}
      <Card className="bg-blue-50/50 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-900 mb-1">
                📊 Total de invitados: <strong className="text-lg">{totalInvitados}</strong>
              </p>
              {datos.hay_teenagers && (
                <p className="text-sm text-blue-700">
                  👥 Adultos: <strong>{invitadosAdultos}</strong> | 👶 Teens/Kids: <strong>{datos.cantidad_teenagers || 0}</strong>
                </p>
              )}
        </div>
          </div>
        </CardContent>
      </Card>

      {/* Sección de Pasapalos (Solo informativa) */}
      {tienePasapalos && (
        <Card className="border-2 border-orange-200 bg-gradient-to-br from-orange-50 to-amber-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-2xl">
              <span className="text-3xl">🥟</span>
              Pasapalos Incluidos
            </CardTitle>
            <CardDescription className="text-base">
              Tu evento incluye los siguientes pasapalos para deleitar a tus invitados durante el cóctel de bienvenida
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[
                { nombre: 'Tequeños', desc: 'Clásicos y deliciosos' },
                { nombre: 'Bolitas de carne', desc: 'Jugosas y sabrosas' },
                { nombre: 'Salchichas en hojaldre', desc: 'Perfectas para picar' },
                { nombre: 'Tuna tartar', desc: 'Elegante y fresco' }
              ].map((item) => (
                <div key={item.nombre} className="text-center">
                  <div className="mb-3 flex justify-center">
                    <ImagenSeleccion
                      urlImagen={obtenerImagenMenu('pasapalos', item.nombre.toLowerCase())}
                      alt={item.nombre}
                      tamaño="large"
                    />
                  </div>
                  <p className="font-semibold text-sm mb-1">{item.nombre}</p>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Indicador de Pasos Horizontal */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            {PASOS.map((paso, index) => (
              <div key={paso.numero} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <button
                    type="button"
                    onClick={() => irAPaso(paso.numero)}
                    disabled={estaBloqueado || (paso.numero > pasoActual && !pasoCompleto(paso.numero - 1))}
                    className={cn(
                      "relative h-12 w-12 rounded-full border-2 transition-all font-semibold text-sm",
                      paso.numero === pasoActual
                        ? "bg-primary border-primary text-primary-foreground shadow-lg scale-110"
                        : pasoCompleto(paso.numero)
                        ? "bg-green-50 border-green-500 text-green-700 hover:scale-105 cursor-pointer"
                        : paso.numero < pasoActual
                        ? "bg-muted border-muted-foreground/30 text-muted-foreground hover:scale-105 cursor-pointer"
                        : "bg-background border-border text-muted-foreground cursor-not-allowed opacity-50"
                    )}
                  >
                    {pasoCompleto(paso.numero) && paso.numero !== pasoActual ? (
                      <CheckCircle2 className="h-6 w-6 mx-auto" />
                    ) : (
                      <span>{paso.numero}</span>
                    )}
                  </button>
                  <span className={cn(
                    "mt-2 text-xs font-medium text-center max-w-[80px]",
                    paso.numero === pasoActual ? "text-primary font-semibold" : "text-muted-foreground"
                  )}>
                    {paso.titulo}
                  </span>
                </div>
                {index < PASOS.length - 1 && (
                  <div className={cn(
                    "flex-1 h-0.5 mx-2 transition-all",
                    pasoCompleto(paso.numero) ? "bg-green-500" : "bg-muted"
                  )} />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Contenido del Paso Actual */}
      <Card className="min-h-[500px]">
        <CardContent className="pt-8">
          {renderPasoActual()}
        </CardContent>
      </Card>

      {/* Navegación */}
      <div className="flex items-center justify-between">
        <Button
          type="button"
          variant="outline"
          onClick={retrocederPaso}
          disabled={pasoActual === 1 || estaBloqueado}
          size="lg"
        >
          <ChevronLeft className="w-5 h-5 mr-2" />
          Anterior
        </Button>

        <div className="flex gap-2">
          {pasoActual < PASOS.length ? (
            <Button
              type="button"
              onClick={avanzarPaso}
              disabled={!pasoCompleto(pasoActual) || estaBloqueado}
              size="lg"
            >
              Siguiente
              <ChevronRight className="w-5 h-5 ml-2" />
            </Button>
          ) : (
            <Button
              type="submit"
              disabled={guardando || estaBloqueado}
              size="lg"
              className="min-w-[200px]"
            >
              {guardando ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Guardando...
                </>
              ) : estaBloqueado ? (
                <>
                  <Lock className="w-5 h-5 mr-2" />
                  Bloqueado
                </>
              ) : (
                <>
                  <Save className="w-5 h-5 mr-2" />
                  Guardar Cambios
                </>
              )}
            </Button>
          )}
        </div>
      </div>
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

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Wine className="w-6 h-6 text-indigo-600" />
        <h2 className="text-2xl font-bold text-gray-900">Bar - Cócteles y Bebidas</h2>
      </div>


      {!tipoLicor ? (
        <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-6 text-center">
          <Wine className="w-12 h-12 text-yellow-600 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-yellow-900 mb-2">Servicio de Bar no Contratado</h3>
          <p className="text-yellow-800">
            No tienes contratado ningún servicio de licor (Básico o Premium) en tu evento.
          </p>
        </div>
      ) : (
        <div>
          <div className="flex items-center gap-3 mb-4">
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
              <div className="grid grid-cols-2 gap-3">
                {vinos.map((vino, index) => (
                  <div key={index} className="p-3 bg-gray-50 rounded-lg text-center">
                    <span className="text-gray-900 text-sm font-medium">{vino}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Ron */}
            <div className="mb-4">
              <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <span className="text-amber-600">🍸</span> Ron
              </h4>
              <div className="grid grid-cols-2 gap-3">
                {(tipoLicor === 'premium' 
                  ? ['Ron Bacardi Blanco', 'Ron Bacardi Gold'] 
                  : ['Ron Spice', 'Ron Blanco']
                ).map((ron, index) => (
                  <div key={index} className="p-3 bg-gray-50 rounded-lg text-center">
                    <span className="text-gray-900 text-sm font-medium">{ron}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Whisky */}
            <div className="mb-4">
              <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <span className="text-amber-700">🥃</span> Whisky
              </h4>
              <div className="flex justify-center">
                <div className="p-3 bg-gray-50 rounded-lg text-center">
                  <span className="text-gray-900 text-sm font-medium">
                    {tipoLicor === 'premium' ? 'Whisky Black Label' : 'Whisky House'}
                  </span>
                </div>
              </div>
            </div>

            {/* Vodka y Tequila */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="p-3 bg-gray-50 rounded-lg text-center">
                <span className="text-gray-900 text-sm font-medium">Vodka</span>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg text-center">
                <span className="text-gray-900 text-sm font-medium">Tequila</span>
              </div>
            </div>
          </div>

          {/* Cócteles */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span className="text-purple-500">🍹</span> Cócteles
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {cocteles.map((coctel, index) => (
                <div key={index} className="p-3 bg-gray-50 rounded-lg text-center">
                  <span className="text-gray-900 text-sm font-medium">{coctel}</span>
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
            <div className="grid grid-cols-2 gap-3">
              {refrescos.map((refresco, index) => (
                <div key={index} className="p-3 bg-gray-50 rounded-lg text-center">
                  <span className="text-gray-900 text-sm font-medium">{refresco}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Jugos */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span className="text-orange-500">🧃</span> Jugos
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {jugos.map((jugo, index) => (
                <div key={index} className="p-3 bg-gray-50 rounded-lg text-center">
                  <span className="text-gray-900 text-sm font-medium">{jugo}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Otros */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span className="text-purple-500">✨</span> Otros
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {otros.map((otro, index) => (
                <div key={index} className="p-3 bg-gray-50 rounded-lg text-center">
                  <span className="text-gray-900 text-sm font-medium">{otro}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      </div>
      )}
    </div>
  );
}

// ===== SECCIÓN OTROS (FINAL) =====
function SeccionOtros({ ajustes, onGuardar, guardando, estaBloqueado, tieneLimosina, contrato }) {
  const [pasoActual, setPasoActual] = useState(1);
  
  // Determinar si es evento de 15 años (quinceañera)
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
    hora_limosina: ajustes?.hora_limosina || '18:00',
  });

  // Definir los pasos del wizard
  const PASOS = [
    { numero: 1, titulo: 'Información General', campo: 'items_especiales' },
    { numero: 2, titulo: 'Protocolo Básico', campo: 'hora_apertura' },
    { numero: 3, titulo: 'Actividades Especiales', campo: 'cambio_zapatilla' },
    { numero: 4, titulo: 'Horarios', campo: 'hora_fotos' },
  ];

  // Función para verificar si un paso está completo
  const pasoCompleto = (numero) => {
    const paso = PASOS.find(p => p.numero === numero);
    if (!paso) return false;
    
    // Paso 1 (Información General) - siempre completo (opcional)
    if (numero === 1) return true;
    
    // Paso 2 (Protocolo Básico) - requiere hora_apertura, hora_anuncio_padres, nombres_padres, hora_anuncio_homenajeado, nombre_homenajeado
    if (numero === 2) {
      return datos.protocolo?.hora_apertura && 
             datos.protocolo?.hora_anuncio_padres && 
             datos.protocolo?.nombres_padres &&
             datos.protocolo?.hora_anuncio_homenajeado &&
             datos.protocolo?.nombre_homenajeado;
    }
    
    // Paso 3 (Actividades Especiales) - siempre completo (tiene valores por defecto)
    if (numero === 3) return true;
    
    // Paso 4 (Horarios) - siempre completo (opcional)
    if (numero === 4) return true;
    
    return false;
  };

  // Función para avanzar al siguiente paso
  const avanzarPaso = () => {
    if (pasoActual < PASOS.length) {
      setPasoActual(pasoActual + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Función para retroceder al paso anterior
  const retrocederPaso = () => {
    if (pasoActual > 1) {
      setPasoActual(pasoActual - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Función para ir directamente a un paso
  const irAPaso = (numero) => {
    if (numero <= pasoActual || pasoCompleto(numero - 1)) {
      setPasoActual(numero);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

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
    const datosEnviar = {
      ...datos,
      protocolo: JSON.stringify(datos.protocolo)
    };
    onGuardar('otros', datosEnviar);
  };

  // Componente para botones Sí/No mejorados
  const ToggleButton = ({ label, value, onChange, disabled }) => (
    <div className="flex items-center justify-between p-4 bg-card rounded-lg border">
      <span className="text-base font-medium">{label}</span>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => onChange(true)}
          disabled={disabled}
          className={cn(
            "px-6 py-2 rounded-lg font-semibold transition-all duration-200 min-w-[80px]",
            value === true
              ? "bg-green-500 text-white shadow-lg scale-105"
              : "bg-muted text-muted-foreground hover:bg-muted/80"
          )}
        >
          Sí
        </button>
        <button
          type="button"
          onClick={() => onChange(false)}
          disabled={disabled}
          className={cn(
            "px-6 py-2 rounded-lg font-semibold transition-all duration-200 min-w-[80px]",
            value === false
              ? "bg-red-500 text-white shadow-lg scale-105"
              : "bg-muted text-muted-foreground hover:bg-muted/80"
          )}
        >
          No
        </button>
      </div>
    </div>
  );

  // Renderizar el contenido del paso actual
  const renderPasoActual = () => {
    switch (pasoActual) {
      case 1: // Información General
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold mb-2">Paso 1: Información General</h3>
              <p className="text-muted-foreground">Completa la información adicional sobre tu evento</p>
            </div>
            
            {/* Limosina (solo si está contratada) */}
            {tieneLimosina && (
              <Card className="bg-blue-50/50 border-blue-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <Car className="w-6 h-6 text-blue-600" />
                    Servicio de Limosina
                  </CardTitle>
                  <CardDescription>
                    Indica la hora en que deseas que la limosina te recoga
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div>
                    <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Hora de Recogida
                    </label>
                    <input
                      type="time"
                      value={datos.hora_limosina}
                      onChange={(e) => setDatos({ ...datos, hora_limosina: e.target.value })}
                      disabled={estaBloqueado}
                      className="w-full px-4 py-3 text-base border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent outline-none bg-background disabled:bg-muted"
                    />
                    <p className="text-xs text-muted-foreground mt-2">
                      💡 Esta hora puede ser ajustada por tu asesor según las necesidades del evento
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Vestido de la niña (solo si es 15 años) */}
            {esQuinceanera && (
              <Card>
                <CardHeader>
                  <CardTitle>Vestido de la Quinceañera</CardTitle>
                  <CardDescription>
                    Describe el vestido o estilo que llevará la quinceañera
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <input
                    type="text"
                    value={datos.vestido_nina}
                    onChange={(e) => setDatos({ ...datos, vestido_nina: e.target.value })}
                    disabled={estaBloqueado}
                    placeholder="Ej: Vestido largo blanco con detalles dorados, estilo princesa..."
                    className="w-full px-4 py-3 text-base border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent outline-none bg-background disabled:bg-muted"
                  />
                </CardContent>
              </Card>
            )}

            {/* Items Especiales */}
            <Card>
              <CardHeader>
                <CardTitle>Items Especiales que Traerás</CardTitle>
                <CardDescription>
                  Indica cualquier elemento especial que planeas traer al evento
                </CardDescription>
              </CardHeader>
              <CardContent>
                <textarea
                  value={datos.items_especiales}
                  onChange={(e) => setDatos({ ...datos, items_especiales: e.target.value })}
                  disabled={estaBloqueado}
                  rows={4}
                  placeholder="Ej: Flores, recuerdos, fotos, decoración especial, elementos personales..."
                  className="w-full px-4 py-3 text-base border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent outline-none bg-background disabled:bg-muted resize-none"
                />
              </CardContent>
            </Card>

            {/* Sorpresas Planeadas */}
            <Card>
              <CardHeader>
                <CardTitle>Sorpresas Planeadas</CardTitle>
                <CardDescription>
                  Describe cualquier sorpresa especial que estés planeando para el evento
                </CardDescription>
              </CardHeader>
              <CardContent>
                <textarea
                  value={datos.sorpresas_planeadas}
                  onChange={(e) => setDatos({ ...datos, sorpresas_planeadas: e.target.value })}
                  disabled={estaBloqueado}
                  rows={4}
                  placeholder="Ej: Sorpresa de video, presentación especial, sorpresa para los padres..."
                  className="w-full px-4 py-3 text-base border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent outline-none bg-background disabled:bg-muted resize-none"
                />
              </CardContent>
            </Card>

            {/* Observaciones Adicionales */}
            <Card>
              <CardHeader>
                <CardTitle>Observaciones Adicionales</CardTitle>
                <CardDescription>
                  Cualquier otra observación o detalle que quieras comunicar
                </CardDescription>
              </CardHeader>
              <CardContent>
                <textarea
                  value={datos.observaciones_adicionales}
                  onChange={(e) => setDatos({ ...datos, observaciones_adicionales: e.target.value })}
                  disabled={estaBloqueado}
                  rows={4}
                  placeholder="Cualquier observación o detalle adicional que quieras comunicar..."
                  className="w-full px-4 py-3 text-base border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent outline-none bg-background disabled:bg-muted resize-none"
                />
              </CardContent>
            </Card>
          </div>
        );

      case 2: // Protocolo Básico
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold mb-2">Paso 2: Protocolo Básico</h3>
              <p className="text-muted-foreground">Completa la información básica del protocolo del evento</p>
            </div>

            {/* Hora de Apertura */}
            <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  🕐 Hora de Apertura del Salón
                </CardTitle>
                <CardDescription>
                  Hora en que se abrirá el salón para que los invitados puedan ingresar
                </CardDescription>
              </CardHeader>
              <CardContent>
                <input
                  type="time"
                  value={datos.protocolo?.hora_apertura || ''}
                  onChange={(e) => actualizarProtocolo('hora_apertura', e.target.value)}
                  disabled={estaBloqueado}
                  className="w-full px-4 py-3 text-base border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent outline-none bg-background disabled:bg-muted"
                />
              </CardContent>
            </Card>

            {/* Anuncio de Padres */}
            <Card className="bg-gradient-to-br from-pink-50 to-rose-50 border-pink-200">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  👨‍👩‍👧 Anuncio de Padres
                </CardTitle>
                <CardDescription>
                  Información sobre el anuncio de entrada de los padres
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Hora del Anuncio *</label>
                  <input
                    type="time"
                    value={datos.protocolo?.hora_anuncio_padres || ''}
                    onChange={(e) => actualizarProtocolo('hora_anuncio_padres', e.target.value)}
                    disabled={estaBloqueado}
                    className="w-full px-4 py-3 text-base border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent outline-none bg-background disabled:bg-muted"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Nombres de los Padres *</label>
                  <input
                    type="text"
                    value={datos.protocolo?.nombres_padres || ''}
                    onChange={(e) => actualizarProtocolo('nombres_padres', e.target.value)}
                    disabled={estaBloqueado}
                    placeholder="Ej: Sr. Yael y Sra. Yaneli"
                    className="w-full px-4 py-3 text-base border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent outline-none bg-background disabled:bg-muted"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Anuncio de Homenajeado */}
            <Card className="bg-gradient-to-br from-yellow-50 to-amber-50 border-yellow-200">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  ⭐ Anuncio del Homenajeado
                </CardTitle>
                <CardDescription>
                  Información sobre el anuncio de entrada del homenajeado
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Hora del Anuncio *</label>
                  <input
                    type="time"
                    value={datos.protocolo?.hora_anuncio_homenajeado || ''}
                    onChange={(e) => actualizarProtocolo('hora_anuncio_homenajeado', e.target.value)}
                    disabled={estaBloqueado}
                    className="w-full px-4 py-3 text-base border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent outline-none bg-background disabled:bg-muted"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Nombre del Homenajeado *</label>
                  <input
                    type="text"
                    value={datos.protocolo?.nombre_homenajeado || contrato?.homenajeado || ''}
                    onChange={(e) => actualizarProtocolo('nombre_homenajeado', e.target.value)}
                    disabled={estaBloqueado}
                    placeholder="Nombre completo"
                    className="w-full px-4 py-3 text-base border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent outline-none bg-background disabled:bg-muted"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Acompañado de (opcional)</label>
                  <input
                    type="text"
                    value={datos.protocolo?.acompanantes || ''}
                    onChange={(e) => actualizarProtocolo('acompanantes', e.target.value)}
                    disabled={estaBloqueado}
                    placeholder="Ej: Sus hermanos Yoel y Sebastian"
                    className="w-full px-4 py-3 text-base border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent outline-none bg-background disabled:bg-muted"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 3: // Actividades Especiales
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold mb-2">Paso 3: Actividades Especiales</h3>
              <p className="text-muted-foreground">Selecciona las actividades especiales que deseas incluir en el protocolo</p>
            </div>

            {/* Cambio de Zapatilla */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  👠 Cambio de Zapatilla
                </CardTitle>
                <CardDescription>
                  ¿Deseas incluir el cambio de zapatilla en el protocolo?
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ToggleButton
                  label="¿Incluir cambio de zapatilla?"
                  value={datos.protocolo?.cambio_zapatilla}
                  onChange={(val) => actualizarProtocolo('cambio_zapatilla', val)}
                  disabled={estaBloqueado}
                />
                {datos.protocolo?.cambio_zapatilla === true && (
                  <div>
                    <label className="block text-sm font-medium mb-2">A cargo de</label>
                    <input
                      type="text"
                      value={datos.protocolo?.cambio_zapatilla_a_cargo || 'El papá'}
                      onChange={(e) => actualizarProtocolo('cambio_zapatilla_a_cargo', e.target.value)}
                      disabled={estaBloqueado}
                      placeholder="Ej: El papá"
                      className="w-full px-4 py-3 text-base border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent outline-none bg-background disabled:bg-muted"
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Bailes Especiales */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  💃 Bailes Especiales
                </CardTitle>
                <CardDescription>
                  Selecciona los bailes especiales que deseas incluir en el protocolo
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ToggleButton
                  label="Baile con Papá"
                  value={datos.protocolo?.baile_papa}
                  onChange={(val) => actualizarProtocolo('baile_papa', val)}
                  disabled={estaBloqueado}
                />
                <ToggleButton
                  label="Baile con Mamá"
                  value={datos.protocolo?.baile_mama}
                  onChange={(val) => actualizarProtocolo('baile_mama', val)}
                  disabled={estaBloqueado}
                />
                <div className="pt-4 border-t">
                  <label className="block text-sm font-medium mb-2">Otros Bailes (Opcional)</label>
                  <textarea
                    value={datos.protocolo?.bailes_adicionales || ''}
                    onChange={(e) => actualizarProtocolo('bailes_adicionales', e.target.value)}
                    disabled={estaBloqueado}
                    rows={3}
                    placeholder="Ej: Baile con hermano Yoel, Baile con hermano Sebastian..."
                    className="w-full px-4 py-3 text-base border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent outline-none bg-background disabled:bg-muted resize-none"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Ceremonia de las 15 Velas */}
            {esQuinceanera && (
              <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    🕯️ Ceremonia de las 15 Velas
                  </CardTitle>
                  <CardDescription>
                    ¿Deseas incluir la ceremonia tradicional de las 15 velas?
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ToggleButton
                    label="¿Incluir ceremonia de las 15 velas?"
                    value={datos.protocolo?.ceremonia_velas}
                    onChange={(val) => actualizarProtocolo('ceremonia_velas', val)}
                    disabled={estaBloqueado}
                  />
                </CardContent>
              </Card>
            )}

            {/* Palabras / Brindis */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  🥂 Palabras / Brindis
                </CardTitle>
                <CardDescription>
                  ¿Deseas incluir un brindis o palabras especiales en el protocolo?
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ToggleButton
                  label="¿Incluir brindis?"
                  value={datos.protocolo?.brindis}
                  onChange={(val) => actualizarProtocolo('brindis', val)}
                  disabled={estaBloqueado}
                />
                {datos.protocolo?.brindis === true && (
                  <div>
                    <label className="block text-sm font-medium mb-2">A cargo de (opcional)</label>
                    <input
                      type="text"
                      value={datos.protocolo?.brindis_a_cargo || ''}
                      onChange={(e) => actualizarProtocolo('brindis_a_cargo', e.target.value)}
                      disabled={estaBloqueado}
                      placeholder="Ej: El padrino"
                      className="w-full px-4 py-3 text-base border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent outline-none bg-background disabled:bg-muted"
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        );

      case 4: // Horarios de Actividades
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold mb-2">Paso 4: Horarios de Actividades</h3>
              <p className="text-muted-foreground">Indica los horarios aproximados para las diferentes actividades del evento</p>
            </div>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  📅 Horarios de Actividades
                </CardTitle>
                <CardDescription>
                  Completa los horarios para cada actividad (todos son opcionales)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { key: 'hora_fotos', label: 'Momento Social / Fotos', icon: '📸' },
                  { key: 'hora_cena', label: 'Cena / Proyección de Video', icon: '🍽️' },
                  { key: 'hora_photobooth', label: 'Photobooth', icon: '📷' },
                  { key: 'hora_loca', label: 'Hora Loca', icon: '🎉' },
                  { key: 'hora_happy_birthday', label: 'Happy Birthday', icon: '🎂' },
                  { key: 'hora_fin', label: 'Fin del Evento', icon: '🏁' },
                ].map((actividad) => (
                  <div key={actividad.key}>
                    <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                      <span>{actividad.icon}</span>
                      {actividad.label}
                    </label>
                    <input
                      type="time"
                      value={datos.protocolo?.[actividad.key] || ''}
                      onChange={(e) => actualizarProtocolo(actividad.key, e.target.value)}
                      disabled={estaBloqueado}
                      className="w-full px-4 py-3 text-base border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent outline-none bg-background disabled:bg-muted"
                    />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
          <Settings className="w-8 h-8 text-gray-600" />
        </div>
        <h2 className="text-3xl font-bold mb-2">Detalles Finales</h2>
        <p className="text-muted-foreground">
          Completa cada paso para finalizar los detalles de tu evento
        </p>
      </div>

      {/* Indicador de Pasos Horizontal */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            {PASOS.map((paso, index) => (
              <div key={paso.numero} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <button
                    type="button"
                    onClick={() => irAPaso(paso.numero)}
                    disabled={estaBloqueado || (paso.numero > pasoActual && !pasoCompleto(paso.numero - 1))}
                    className={cn(
                      "relative h-12 w-12 rounded-full border-2 transition-all font-semibold text-sm",
                      paso.numero === pasoActual
                        ? "bg-primary border-primary text-primary-foreground shadow-lg scale-110"
                        : pasoCompleto(paso.numero)
                        ? "bg-green-50 border-green-500 text-green-700 hover:scale-105 cursor-pointer"
                        : paso.numero < pasoActual
                        ? "bg-muted border-muted-foreground/30 text-muted-foreground hover:scale-105 cursor-pointer"
                        : "bg-background border-border text-muted-foreground cursor-not-allowed opacity-50"
                    )}
                  >
                    {pasoCompleto(paso.numero) && paso.numero !== pasoActual ? (
                      <CheckCircle2 className="h-6 w-6 mx-auto" />
                    ) : (
                      <span>{paso.numero}</span>
                    )}
                  </button>
                  <span className={cn(
                    "mt-2 text-xs font-medium text-center max-w-[80px]",
                    paso.numero === pasoActual ? "text-primary font-semibold" : "text-muted-foreground"
                  )}>
                    {paso.titulo}
                  </span>
                </div>
                {index < PASOS.length - 1 && (
                  <div className={cn(
                    "flex-1 h-0.5 mx-2 transition-all",
                    pasoCompleto(paso.numero) ? "bg-green-500" : "bg-muted"
                  )} />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Contenido del Paso Actual */}
      <Card className="min-h-[500px]">
        <CardContent className="pt-8">
          {renderPasoActual()}
        </CardContent>
      </Card>

      {/* Navegación */}
      <div className="flex items-center justify-between">
        <Button
          type="button"
          variant="outline"
          onClick={retrocederPaso}
          disabled={pasoActual === 1 || estaBloqueado}
          size="lg"
        >
          <ChevronLeft className="w-5 h-5 mr-2" />
          Anterior
        </Button>

        <div className="flex gap-2">
          {pasoActual < PASOS.length ? (
            <Button
              type="button"
              onClick={avanzarPaso}
              disabled={!pasoCompleto(pasoActual) || estaBloqueado}
              size="lg"
            >
              Siguiente
              <ChevronRight className="w-5 h-5 ml-2" />
            </Button>
          ) : (
            <Button
              type="submit"
              disabled={guardando || estaBloqueado}
              size="lg"
              className="min-w-[200px]"
            >
              {guardando ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Guardando...
                </>
              ) : estaBloqueado ? (
                <>
                  <Lock className="w-5 h-5 mr-2" />
                  Bloqueado
                </>
              ) : (
                <>
                  <Save className="w-5 h-5 mr-2" />
                  Guardar Cambios
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </form>
  );
}

export default AjustesEvento;
