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
  CheckCircle,
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
  Info,
  Check,
} from 'lucide-react';
import { motion } from 'framer-motion';
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
import PremiumToggle from '@/components/ui/PremiumToggle';
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
          "relative overflow-hidden rounded-xl p-4 flex flex-col items-center justify-center gap-3 border transition-all duration-300 group min-w-[120px]",
          activo
            ? "bg-white text-black border-white shadow-[0_0_20px_rgba(255,255,255,0.1)]"
            : "bg-neutral-900 border-white/10 text-neutral-400 hover:bg-neutral-800 hover:text-white"
        )}
      >
        <Icon className={cn("w-6 h-6", activo ? "text-black" : "text-neutral-500 group-hover:text-white")} />
        <span className="text-sm font-medium">{tab.label}</span>
        {activo && <span className="text-xs text-black/70">{tab.description}</span>}
      </button>
    );
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="space-y-6">
          <div className="bg-neutral-900 border border-white/10 rounded-xl p-6">
            <div className="h-10 w-64 bg-neutral-800 rounded mb-2 animate-pulse" />
            <div className="h-4 w-96 bg-neutral-800 rounded animate-pulse" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-neutral-900 border border-white/10 rounded-xl p-6">
                <div className="h-24 w-full bg-neutral-800 rounded animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 animate-fade-in">
      {/* Toast Notifications */}
      <Toaster position="top-right" />
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="p-2 rounded-full bg-neutral-900 border border-white/10 text-neutral-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            <ChevronLeft size={20} />
          </button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white mb-1">Ajustes</h1>
            <p className="text-neutral-400 text-sm">Personaliza cada detalle de tu evento</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <div className="text-xs text-neutral-500 mb-1">Progreso</div>
            <div className="w-32 h-1.5 bg-neutral-800 rounded-full overflow-hidden">
              <div className="h-full bg-white rounded-full" style={{ width: `${ajustes?.porcentaje_completado || 0}%` }} />
            </div>
          </div>
          <button
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
            className="flex items-center gap-2 px-4 py-2 bg-white text-black rounded-full text-sm font-medium hover:bg-neutral-200 transition-colors"
          >
            <Download size={16} />
            Descargar PDF
          </button>
        </div>
      </div>

      {/* Banner de Bloqueo */}
      {estaBloqueado && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 mb-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-red-500/20 rounded-full">
              <Lock className="w-6 h-6 text-red-400" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-lg text-red-400 mb-2">
                ⚠️ Ajustes Bloqueados
              </h3>
              <p className="text-sm text-neutral-400 mb-2">
                Faltan menos de 10 días para tu evento. Los ajustes están bloqueados para garantizar 
                que todo esté listo a tiempo. Si necesitas hacer cambios urgentes, por favor contacta 
                a tu asesor de eventos a través del chat.
              </p>
              <span className="px-3 py-1 bg-red-500/20 text-red-400 text-xs font-medium rounded-full border border-red-500/30">
                📅 Días restantes: {diasHastaEvento}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Banner de Advertencia (5-10 días) */}
      {!estaBloqueado && diasHastaEvento !== null && diasHastaEvento >= 0 && diasHastaEvento < 15 && (
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-6 mb-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-yellow-500/20 rounded-full">
              <AlertTriangle className="w-6 h-6 text-yellow-400" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-lg text-yellow-400 mb-2">
                Tiempo Limitado
              </h3>
              <p className="text-sm text-neutral-400">
                Tu evento está próximo ({diasHastaEvento} días). Asegúrate de finalizar todos 
                los ajustes pronto. Recuerda que no podrás modificar nada 10 días antes del evento.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Grid */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-6">
        {tabs.map((tab) => (
          <TabButton key={tab.id} tab={tab} />
        ))}
      </div>

      {/* Main Content Area - Bento Style */}
      <div className="relative rounded-2xl overflow-hidden bg-neutral-900 border border-white/10 min-h-[600px]">
        {/* Background Image for the Section */}
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1605807646983-377bc5a76493?q=80&w=2000&auto=format&fit=crop"
            alt="Settings Background"
            className="w-full h-full object-cover opacity-20"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/80 to-[#0a0a0a]/40" />
        </div>

        <div className="relative z-10 p-8 md:p-12">
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
    <form onSubmit={handleSubmit}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="max-w-5xl mx-auto"
      >
        <div className="flex items-center gap-3 mb-2">
          <span className="px-3 py-1 rounded-full bg-pink-500/10 text-pink-400 text-xs font-medium border border-pink-500/20">
            Selección Requerida
          </span>
        </div>
        <h2 className="text-4xl font-bold text-white mb-4">Elige tu Torta Perfecta</h2>
        <p className="text-xl text-neutral-400 max-w-2xl mb-12">
          El salón {nombreSalon} incluye automáticamente una torta de {pisosAutomaticos} {pisosAutomaticos === 1 ? 'piso' : 'pisos'}. Selecciona el diseño que mejor se adapte a tu temática.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {diseños.map((option) => {
            const imagenUrl = obtenerImagenTorta(option.value, pisosAutomaticos);
            const estaSeleccionado = datos.diseno_torta === option.value;
            
            return (
              <div
                key={option.value}
                onClick={() => {
                  if (!estaBloqueado) {
                    setDatos({ ...datos, diseno_torta: option.value, diseno_otro: '' });
                    setMostrarDisenoOtro(false);
                  }
                }}
                className={`group relative aspect-[3/4] rounded-xl overflow-hidden cursor-pointer transition-all duration-300 ${
                  estaSeleccionado
                    ? 'ring-2 ring-white scale-[1.02] shadow-2xl'
                    : 'hover:scale-[1.02] opacity-80 hover:opacity-100'
                } ${estaBloqueado ? 'cursor-not-allowed opacity-50' : ''}`}
              >
                <img
                  src={imagenUrl}
                  alt={option.label}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

                <div className="absolute bottom-0 left-0 w-full p-6">
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-medium text-white">{option.label}</span>
                    {estaSeleccionado && (
                      <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center text-black">
                        <CheckCircle size={14} strokeWidth={3} />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Opción Otro */}
        <div className="mt-6">
          <label className="flex items-center gap-2 mb-2 text-neutral-300">
            <input
              type="radio"
              name="diseno_torta"
              value="Otro"
              checked={datos.diseno_torta === 'Otro'}
              onChange={(e) => {
                if (!estaBloqueado) {
                  setDatos({ ...datos, diseno_torta: 'Otro', diseno_otro: '' });
                  setMostrarDisenoOtro(true);
                }
              }}
              disabled={estaBloqueado}
              className="w-4 h-4 text-white bg-neutral-800 border-neutral-700 focus:ring-white"
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
              className="w-full px-4 py-2 border border-white/10 rounded-lg focus:ring-2 focus:ring-white focus:border-transparent outline-none bg-neutral-800 text-white placeholder:text-neutral-500 disabled:bg-neutral-700"
            />
          )}
        </div>

        {/* Selección de Sabor */}
        {datos.diseno_torta && datos.diseno_torta !== 'Otro' && (
          <div className="mt-12">
            <h3 className="text-2xl font-bold text-white mb-6">Elige el Sabor</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {['Vainilla', 'Marmoleado'].map((sabor) => (
                <button
                  key={sabor}
                  type="button"
                  onClick={() => {
                    if (!estaBloqueado) {
                      setDatos({ ...datos, sabor_torta: sabor, sabor_otro: '' });
                      setMostrarSaborOtro(false);
                    }
                  }}
                  disabled={estaBloqueado}
                  className={cn(
                    "p-6 rounded-xl border-2 transition-all duration-200 hover:scale-105 text-center",
                    datos.sabor_torta === sabor
                      ? "border-white bg-white/10 shadow-lg text-white"
                      : "border-white/10 bg-neutral-800 hover:border-white/30 text-neutral-300"
                  )}
                >
                  <p className="text-xl font-semibold mb-2">{sabor}</p>
                  {datos.sabor_torta === sabor && (
                    <div className="inline-flex items-center gap-1 text-xs text-white">
                      <CheckCircle size={12} />
                      Seleccionado
                    </div>
                  )}
                </button>
              ))}
              <div>
                <label className="flex items-center gap-2 p-6 rounded-xl border-2 border-white/10 bg-neutral-800 hover:border-white/30 transition cursor-pointer text-neutral-300">
                  <input
                    type="radio"
                    name="sabor_torta"
                    value="Otro"
                    checked={datos.sabor_torta === 'Otro'}
                    onChange={(e) => {
                      if (!estaBloqueado) {
                        setDatos({ ...datos, sabor_torta: 'Otro', sabor_otro: '' });
                        setMostrarSaborOtro(true);
                      }
                    }}
                    disabled={estaBloqueado}
                    className="w-4 h-4 text-white bg-neutral-800 border-neutral-700 focus:ring-white"
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
                    className="mt-2 w-full px-4 py-2 border border-white/10 rounded-lg focus:ring-2 focus:ring-white focus:border-transparent outline-none bg-neutral-800 text-white placeholder:text-neutral-500 disabled:bg-neutral-700"
                  />
                )}
              </div>
            </div>
          </div>
        )}

        {/* Botón Guardar */}
        <div className="mt-12 flex justify-end">
          <button
            type="submit"
            disabled={guardando || estaBloqueado || !datos.diseno_torta}
            className="flex items-center gap-2 px-6 py-3 bg-white text-black rounded-xl font-medium hover:bg-neutral-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {guardando ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                Guardar Selección
                <ChevronRight size={18} />
              </>
            )}
          </button>
        </div>
      </motion.div>
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
          <div className="space-y-8">
            <div className="mb-8">
              <h3 className="text-3xl font-bold text-white mb-2">Paso 1: Entrada (Incluida)</h3>
              <p className="text-xl text-neutral-400">Tu entrada está incluida por defecto</p>
            </div>
            <div className="bg-neutral-900 border border-white/10 rounded-xl p-6">
              <div className="flex items-center gap-4 mb-6 justify-center">
                <span className="px-3 py-1 rounded-full bg-white/10 text-white text-base font-medium border border-white/20">
                  🥗 {datos.entrada}
                </span>
                <span className="text-sm text-neutral-400">Incluida por defecto</span>
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
                    <p className="font-semibold text-lg text-white">Ensalada César</p>
                  </div>
                  <div className="text-center">
                    <div className="mb-3">
                      <ImagenSeleccion
                        urlImagen={obtenerImagenMenu('pan', 'pan y mantequilla')}
                        alt="Pan y Mantequilla"
                        tamaño="extra-large"
                      />
                    </div>
                    <p className="font-semibold text-lg text-white">Pan y Mantequilla</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      case 2: // Plato Principal
        return (
          <div className="space-y-8">
            <div className="mb-8">
              <h3 className="text-3xl font-bold text-white mb-2">Paso 2: Elige el Plato Principal</h3>
              <p className="text-xl text-neutral-400">Selecciona el plato principal que más te guste</p>
            </div>
            <select
              value={datos.plato_principal}
              onChange={(e) => setDatos({ ...datos, plato_principal: e.target.value })}
              disabled={estaBloqueado}
              className="w-full px-4 py-3 text-base border border-white/10 rounded-lg focus:ring-1 focus:ring-white/50 focus:border-white/20 outline-none bg-neutral-800/50 text-white placeholder:text-neutral-500 disabled:bg-neutral-700 disabled:cursor-not-allowed mb-8"
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
              <div className="relative aspect-[4/3] rounded-xl overflow-hidden border-2 border-white/20">
                <img
                  src={obtenerImagenMenu('plato_principal', datos.plato_principal)}
                  alt={datos.plato_principal}
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-0 left-0 w-full p-6 bg-gradient-to-t from-black/90 via-black/50 to-transparent">
                  <p className="text-lg font-medium text-white">{datos.plato_principal}</p>
                </div>
              </div>
            )}
          </div>
        );

      case 3: // Acompañamiento
        return (
          <div className="space-y-8">
            <div className="mb-8">
              <h3 className="text-3xl font-bold text-white mb-2">Paso 3: Elige el Acompañamiento</h3>
              <p className="text-xl text-neutral-400">Selecciona el acompañamiento que más te guste</p>
            </div>
            <select
              value={datos.acompanamientos}
              onChange={(e) => setDatos({ ...datos, acompanamientos: e.target.value, acompanamiento_seleccionado: '' })}
              disabled={estaBloqueado}
              className="w-full px-4 py-3 text-base border border-white/10 rounded-lg focus:ring-1 focus:ring-white/50 focus:border-white/20 outline-none bg-neutral-800/50 text-white placeholder:text-neutral-500 disabled:bg-neutral-700 disabled:cursor-not-allowed mb-4"
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
              <div className="bg-neutral-900 border border-white/10 rounded-xl p-6">
                <p className="text-lg font-semibold mb-4 text-center text-white">Selecciona el tipo de arroz:</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <button
                    type="button"
                    onClick={() => !estaBloqueado && setDatos({ ...datos, acompanamiento_seleccionado: 'Arroz Blanco' })}
                    disabled={estaBloqueado}
                    className={cn(
                      "p-6 rounded-xl border-2 transition-all duration-200 hover:scale-105 text-center",
                      datos.acompanamiento_seleccionado === 'Arroz Blanco'
                        ? "border-white bg-white/10 shadow-lg"
                        : "border-white/10 bg-neutral-800/50 hover:border-white/20"
                    )}
                  >
                      <div className="mb-4 flex justify-center">
              <ImagenSeleccion
                          urlImagen={obtenerImagenMenu('acompanamiento', 'arroz blanco')}
                          alt="Arroz Blanco"
                          tamaño="large"
                        />
            </div>
                      <p className="text-lg font-semibold mb-2 text-white">Arroz Blanco</p>
                      {datos.acompanamiento_seleccionado === 'Arroz Blanco' && (
                        <span className="text-xs px-2 py-1 rounded bg-white/20 text-white">Seleccionado</span>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => !estaBloqueado && setDatos({ ...datos, acompanamiento_seleccionado: 'Arroz Amarillo' })}
                      disabled={estaBloqueado}
                      className={cn(
                        "p-6 rounded-xl border-2 transition-all duration-200 hover:scale-105 text-center",
                        datos.acompanamiento_seleccionado === 'Arroz Amarillo'
                          ? "border-white bg-white/10 shadow-lg"
                          : "border-white/10 bg-neutral-800/50 hover:border-white/20"
                      )}
                    >
                      <div className="mb-4 flex justify-center">
              <ImagenSeleccion
                          urlImagen={obtenerImagenMenu('acompanamiento', 'arroz amarillo')}
                          alt="Arroz Amarillo"
                          tamaño="large"
                        />
            </div>
                      <p className="text-lg font-semibold mb-2 text-white">Arroz Amarillo</p>
                      {datos.acompanamiento_seleccionado === 'Arroz Amarillo' && (
                        <span className="text-xs px-2 py-1 rounded bg-white/20 text-white">Seleccionado</span>
                      )}
                    </button>
                  </div>
              </div>
            )}

            {datos.acompanamientos === 'Puré de Patatas o Patatas al Romero' && (
              <div className="bg-neutral-900 border border-white/10 rounded-xl p-6">
                <p className="text-lg font-semibold mb-4 text-center text-white">Selecciona el tipo de patatas:</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <button
                    type="button"
                    onClick={() => !estaBloqueado && setDatos({ ...datos, acompanamiento_seleccionado: 'Puré de Patatas' })}
                    disabled={estaBloqueado}
                    className={cn(
                      "p-6 rounded-xl border-2 transition-all duration-200 hover:scale-105 text-center",
                      datos.acompanamiento_seleccionado === 'Puré de Patatas'
                        ? "border-white bg-white/10 shadow-lg"
                        : "border-white/10 bg-neutral-800/50 hover:border-white/20"
                    )}
                  >
                    <div className="mb-4 flex justify-center">
              <ImagenSeleccion
                          urlImagen={obtenerImagenMenu('acompanamiento', 'puré de patatas')}
                          alt="Puré de Patatas"
                          tamaño="large"
                        />
            </div>
                    <p className="text-lg font-semibold mb-2 text-white">Puré de Patatas</p>
                    {datos.acompanamiento_seleccionado === 'Puré de Patatas' && (
                      <span className="text-xs px-2 py-1 rounded bg-white/20 text-white">Seleccionado</span>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => !estaBloqueado && setDatos({ ...datos, acompanamiento_seleccionado: 'Patatas al Romero' })}
                    disabled={estaBloqueado}
                    className={cn(
                      "p-6 rounded-xl border-2 transition-all duration-200 hover:scale-105 text-center",
                      datos.acompanamiento_seleccionado === 'Patatas al Romero'
                        ? "border-white bg-white/10 shadow-lg"
                        : "border-white/10 bg-neutral-800/50 hover:border-white/20"
                    )}
                  >
                    <div className="mb-4 flex justify-center">
              <ImagenSeleccion
                          urlImagen={obtenerImagenMenu('acompanamiento', 'patatas al romero')}
                          alt="Patatas al Romero"
                          tamaño="large"
                        />
                      </div>
                    <p className="text-lg font-semibold mb-2 text-white">Patatas al Romero</p>
                    {datos.acompanamiento_seleccionado === 'Patatas al Romero' && (
                      <span className="text-xs px-2 py-1 rounded bg-white/20 text-white">Seleccionado</span>
                    )}
                  </button>
                </div>
              </div>
            )}

            {datos.acompanamientos && 
             datos.acompanamientos !== 'Arroz Blanco o Amarillo' && 
             datos.acompanamientos !== 'Puré de Patatas o Patatas al Romero' && (
              <div className="bg-neutral-900 border border-white/10 rounded-xl p-6">
                <div className="text-center mb-4">
                  <h4 className="text-xl font-bold mb-2 text-white">Vista Previa</h4>
                  <p className="text-sm text-neutral-400">{datos.acompanamientos}</p>
                </div>
                <div className="flex justify-center">
                  <ImagenSeleccion
                    urlImagen={obtenerImagenMenu('acompanamiento', datos.acompanamientos)}
                    alt={datos.acompanamientos}
                    tamaño="extra-large"
                  />
                </div>
              </div>
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
            <div className="bg-neutral-900 border border-white/10 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-6">
                  <input
                    type="checkbox"
                    id="hay_teenagers"
                    checked={datos.hay_teenagers}
                    onChange={(e) => setDatos({ ...datos, hay_teenagers: e.target.checked, cantidad_teenagers: e.target.checked ? datos.cantidad_teenagers : 0 })}
                    disabled={estaBloqueado}
                    className="w-5 h-5 text-white border-white/20 rounded focus:ring-white/50 disabled:opacity-50"
                  />
                  <label htmlFor="hay_teenagers" className="text-lg font-semibold cursor-pointer text-white">
                    ¿Habrá Teenagers/Kids en el evento?
                  </label>
                </div>

                {datos.hay_teenagers && (
                  <div className="space-y-4 mt-4">
                    <div>
                      <label className="block text-sm font-medium mb-2 text-neutral-300">
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
                        className="w-full px-4 py-2 text-base border border-white/10 rounded-lg focus:ring-1 focus:ring-white/50 focus:border-white/20 outline-none bg-neutral-800/50 text-white disabled:bg-neutral-700"
                        required
                      />
                    </div>

                    {datos.cantidad_teenagers > 0 && (
                      <div>
                        <label className="block text-sm font-medium mb-2 text-neutral-300">
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
                              className="w-4 h-4 text-white border-white/20 focus:ring-white/50 disabled:opacity-50"
                              required
                            />
                            <span className="text-sm font-medium text-white">Pasta</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name="teenagers_tipo_comida"
                              value="menu"
                              checked={datos.teenagers_tipo_comida === 'menu'}
                              onChange={(e) => setDatos({ ...datos, teenagers_tipo_comida: e.target.value, teenagers_tipo_pasta: '' })}
                              disabled={estaBloqueado}
                              className="w-4 h-4 text-white border-white/20 focus:ring-white/50 disabled:opacity-50"
                              required
                            />
                            <span className="text-sm font-medium text-white">Menú</span>
                          </label>
                        </div>
                      </div>
                    )}

                    {datos.cantidad_teenagers > 0 && datos.teenagers_tipo_comida === 'pasta' && (
                      <div>
                        <label className="block text-sm font-medium mb-2 text-neutral-300">
                          Tipo de Pasta *
                        </label>
                        <select
                          value={datos.teenagers_tipo_pasta}
                          onChange={(e) => setDatos({ ...datos, teenagers_tipo_pasta: e.target.value })}
                          disabled={estaBloqueado}
                          className="w-full px-4 py-2 text-base border border-white/10 rounded-lg focus:ring-1 focus:ring-white/50 focus:border-white/20 outline-none bg-neutral-800/50 text-white disabled:bg-neutral-700"
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
                      <div className="bg-neutral-800/50 border border-white/10 rounded-xl p-4">
                        <p className="text-sm font-medium text-white mb-2">
                          📋 Resumen de platos:
                        </p>
                        <ul className="text-sm text-neutral-300 space-y-1">
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
          </div>
        );

      case 5: // Restricciones y Notas
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold mb-2 text-white">Paso 5: Restricciones y Notas</h3>
              <p className="text-neutral-400">Información adicional sobre restricciones alimentarias y notas especiales</p>
            </div>
            <div className="bg-neutral-900 border border-white/10 rounded-xl p-6">
              <div className="mb-4">
                <h4 className="text-lg font-semibold flex items-center gap-2 text-white mb-2">
                  🌱 Restricciones y Detalles Especiales
                </h4>
                <p className="text-sm text-neutral-400">
                  Información importante sobre alergias, restricciones alimentarias o preferencias especiales
                </p>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-neutral-300">
                    Restricciones Alimentarias / Alergias / Vegetarianos
                  </label>
                  <textarea
                    value={datos.restricciones_alimentarias}
                    onChange={(e) => setDatos({ ...datos, restricciones_alimentarias: e.target.value })}
                    disabled={estaBloqueado}
                    rows={4}
                    placeholder="Ej: 2 personas vegetarianas, 1 alergia a frutos secos, 1 intolerancia a lactosa..."
                    className="w-full px-4 py-3 text-base border border-white/10 rounded-lg focus:ring-1 focus:ring-white/50 focus:border-white/20 outline-none bg-neutral-800/50 text-white placeholder:text-neutral-500 disabled:bg-neutral-700 resize-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-neutral-300">
                    Notas Adicionales del Menú
                  </label>
                  <textarea
                    value={datos.notas_menu}
                    onChange={(e) => setDatos({ ...datos, notas_menu: e.target.value })}
                    disabled={estaBloqueado}
                    rows={4}
                    placeholder="Cualquier comentario o solicitud especial sobre el menú..."
                    className="w-full px-4 py-3 text-base border border-white/10 rounded-lg focus:ring-1 focus:ring-white/50 focus:border-white/20 outline-none bg-neutral-800/50 text-white placeholder:text-neutral-500 disabled:bg-neutral-700 resize-none"
                  />
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="max-w-5xl mx-auto"
      >
        <div className="flex items-center gap-3 mb-2">
          <span className="px-3 py-1 rounded-full bg-orange-500/10 text-orange-400 text-xs font-medium border border-orange-500/20">
            Selección Requerida
          </span>
        </div>
        <h2 className="text-4xl font-bold text-white mb-4">Elige tu Menú</h2>
        <p className="text-xl text-neutral-400 max-w-2xl mb-8">
          Completa cada paso para personalizar el menú de tu evento. Selecciona los platos que mejor se adapten a tu celebración.
        </p>

        {/* Banner de Invitados Mejorado */}
        <div className="mb-8 p-6 rounded-xl bg-neutral-900 border border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
                <span className="text-2xl">👥</span>
              </div>
              <div>
                <div className="text-sm text-neutral-400 font-medium mb-1">Total de Invitados</div>
                <div className="text-3xl font-bold text-white">{totalInvitados}</div>
                {datos.hay_teenagers && (
                  <div className="text-xs text-neutral-400 mt-1">
                    👥 Adultos: {invitadosAdultos} | 👶 Teens/Kids: {datos.cantidad_teenagers || 0}
                  </div>
                )}
              </div>
            </div>
            <div className="text-xs text-neutral-400 max-w-xs text-right">
              El menú se ajustará según el número de invitados confirmados
            </div>
          </div>
        </div>

        {/* Sección de Pasapalos (Solo informativa) */}
        {tienePasapalos && (
          <div className="border border-white/10 bg-neutral-900 rounded-xl p-6 mb-8">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-3xl">🥟</span>
              <h3 className="text-2xl font-bold text-white">Pasapalos Incluidos</h3>
            </div>
            <p className="text-neutral-400 mb-6">
              Tu evento incluye los siguientes pasapalos para deleitar a tus invitados durante el cóctel de bienvenida
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                  <p className="font-semibold text-sm mb-1 text-white">{item.nombre}</p>
                  <p className="text-xs text-neutral-400">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Indicador de Pasos Horizontal */}
        <div className="bg-neutral-800/50 border border-white/10 rounded-xl p-6 mb-8">
          <div className="flex items-center justify-between overflow-x-auto pb-2">
            {PASOS.map((paso, index) => (
              <div key={paso.numero} className="flex items-center flex-1 min-w-0">
                <div className="flex flex-col items-center flex-1 min-w-0">
                  <button
                    type="button"
                    onClick={() => irAPaso(paso.numero)}
                    disabled={estaBloqueado || (paso.numero > pasoActual && !pasoCompleto(paso.numero - 1))}
                    className={cn(
                      "relative h-12 w-12 rounded-full border-2 transition-all font-semibold text-sm flex items-center justify-center",
                      paso.numero === pasoActual
                        ? "bg-white border-white text-black shadow-lg scale-110"
                        : pasoCompleto(paso.numero)
                        ? "bg-green-500/20 border-green-500 text-green-400 hover:scale-105 cursor-pointer"
                        : paso.numero < pasoActual
                        ? "bg-neutral-700 border-neutral-600 text-neutral-400 hover:scale-105 cursor-pointer"
                        : "bg-neutral-800 border-neutral-700 text-neutral-500 cursor-not-allowed opacity-50"
                    )}
                  >
                    {pasoCompleto(paso.numero) && paso.numero !== pasoActual ? (
                      <CheckCircle className="h-6 w-6" />
                    ) : (
                      <span>{paso.numero}</span>
                    )}
                  </button>
                  <span className={cn(
                    "mt-2 text-xs font-medium text-center max-w-[80px] truncate",
                    paso.numero === pasoActual ? "text-white font-semibold" : "text-neutral-400"
                  )}>
                    {paso.titulo}
                  </span>
                </div>
                {index < PASOS.length - 1 && (
                  <div className={cn(
                    "flex-1 h-0.5 mx-2 transition-all min-w-[20px]",
                    pasoCompleto(paso.numero) ? "bg-green-500" : "bg-neutral-700"
                  )} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Contenido del Paso Actual */}
        <div className="bg-neutral-800/30 border border-white/10 rounded-xl p-8 min-h-[500px] mb-8">
          {renderPasoActual()}
        </div>

        {/* Navegación */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={retrocederPaso}
            disabled={pasoActual === 1 || estaBloqueado}
            className="flex items-center gap-2 px-6 py-3 bg-neutral-800 text-white rounded-xl font-medium hover:bg-neutral-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-white/10"
          >
            <ChevronLeft className="w-5 h-5" />
            Anterior
          </button>

          <div className="flex gap-2">
            {pasoActual < PASOS.length ? (
              <button
                type="button"
                onClick={avanzarPaso}
                disabled={!pasoCompleto(pasoActual) || estaBloqueado}
                className="flex items-center gap-2 px-6 py-3 bg-white text-black rounded-xl font-medium hover:bg-neutral-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Siguiente
                <ChevronRight className="w-5 h-5" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={guardando || estaBloqueado}
                className="flex items-center gap-2 px-6 py-3 bg-white text-black rounded-xl font-medium hover:bg-neutral-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-w-[200px] justify-center"
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
                    Guardar Selección
                    <ChevronRight className="w-5 h-5" />
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </motion.div>
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
    bailes: bailesIniciales.length > 0 ? bailesIniciales : [],
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
      bailes: nuevosBailes
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

  // Parsear canción ceremonial (título - artista)
  const parsearCancion = (cancion) => {
    if (!cancion) return { titulo: '', artista: '' };
    const partes = cancion.split(' - ');
    return {
      titulo: partes[0] || cancion,
      artista: partes[1] || ''
    };
  };

  const musicaCeremonial = parsearCancion(datos.musica_ceremonial);
  const primerBaileParsed = parsearCancion(datos.primer_baile);
  // Mostrar todos los bailes (incluyendo vacíos) para que se puedan editar
  const bailesParaMostrar = datos.bailes.length > 0 ? datos.bailes : [];
  const bailesFiltrados = datos.bailes.filter(b => b.nombre.trim() || b.con_quien.trim());

  return (
    <form onSubmit={handleSubmit}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="max-w-6xl mx-auto"
      >
        <div className="flex items-center gap-3 mb-2">
          <span className="px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-xs font-medium border border-blue-500/20">
            Opcional
          </span>
        </div>
        <h2 className="text-4xl font-bold text-white mb-4">Música</h2>
        <p className="text-xl text-neutral-400 max-w-2xl mb-8">
          Personaliza la música especial para momentos importantes de tu evento.
        </p>

        {/* Bento Grid for Music */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 auto-rows-[minmax(180px,auto)] mb-8">
          {/* Música para Ceremonia / Entrada */}
          <div className="relative overflow-hidden rounded-xl bg-neutral-900 border border-white/10 group transition-all duration-300 hover:border-white/20">
            <div className="absolute inset-0 w-full h-full z-0">
              <img
                src="https://images.unsplash.com/photo-1465847899084-d164df4dedc6?q=80&w=2000&auto=format&fit=crop"
                alt="Ceremonia"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 opacity-50 group-hover:opacity-30"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/30" />
            </div>
            <div className="relative z-10 h-full w-full p-6">
              <div className="flex flex-col justify-center h-full">
                <h3 className="text-sm text-neutral-400 mb-2 uppercase tracking-wider font-medium">Música para Ceremonia / Entrada</h3>
                {!estaBloqueado ? (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={musicaCeremonial.titulo}
                      onChange={(e) => {
                        const nuevaCancion = e.target.value + (musicaCeremonial.artista ? ` - ${musicaCeremonial.artista}` : '');
                        setDatos({ ...datos, musica_ceremonial: nuevaCancion });
                      }}
                      placeholder="Título de la canción"
                      className="w-full px-3 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white placeholder:text-neutral-400 focus:ring-2 focus:ring-white focus:border-transparent outline-none text-sm"
                    />
                    <input
                      type="text"
                      value={musicaCeremonial.artista}
                      onChange={(e) => {
                        const nuevaCancion = (musicaCeremonial.titulo || '') + (e.target.value ? ` - ${e.target.value}` : '');
                        setDatos({ ...datos, musica_ceremonial: nuevaCancion });
                      }}
                      placeholder="Artista"
                      className="w-full px-3 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white placeholder:text-neutral-400 focus:ring-2 focus:ring-white focus:border-transparent outline-none text-sm"
                    />
                  </div>
                ) : (
                  <>
                    <div className="text-lg font-semibold text-white mb-1 drop-shadow-lg">
                      {musicaCeremonial.titulo || 'Sin especificar'}
                    </div>
                    {musicaCeremonial.artista && (
                      <div className="text-sm text-neutral-300 drop-shadow-sm">{musicaCeremonial.artista}</div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Primer Baile */}
          <div className="relative overflow-hidden rounded-xl bg-neutral-900 border border-white/10 group transition-all duration-300 hover:border-white/20">
            <div className="absolute inset-0 w-full h-full z-0">
              <img
                src="https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=2000&auto=format&fit=crop"
                alt="Primer Baile"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 opacity-50 group-hover:opacity-30"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/30" />
            </div>
            <div className="relative z-10 h-full w-full p-6">
              <div className="flex flex-col justify-center h-full">
                <h3 className="text-sm text-neutral-400 mb-2 uppercase tracking-wider font-medium">Primer Baile</h3>
                {!estaBloqueado ? (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={primerBaileParsed.titulo}
                      onChange={(e) => {
                        const nuevaCancion = e.target.value + (primerBaileParsed.artista ? ` - ${primerBaileParsed.artista}` : '');
                        setDatos({ ...datos, primer_baile: nuevaCancion });
                      }}
                      placeholder="Título de la canción"
                      className="w-full px-3 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white placeholder:text-neutral-400 focus:ring-2 focus:ring-white focus:border-transparent outline-none text-sm"
                    />
                    <input
                      type="text"
                      value={primerBaileParsed.artista}
                      onChange={(e) => {
                        const nuevaCancion = (primerBaileParsed.titulo || '') + (e.target.value ? ` - ${e.target.value}` : '');
                        setDatos({ ...datos, primer_baile: nuevaCancion });
                      }}
                      placeholder="Artista"
                      className="w-full px-3 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white placeholder:text-neutral-400 focus:ring-2 focus:ring-white focus:border-transparent outline-none text-sm"
                    />
                  </div>
                ) : (
                  <>
                    <div className="text-lg font-semibold text-white mb-1 drop-shadow-lg">
                      {primerBaileParsed.titulo || 'Sin especificar'}
                    </div>
                    {primerBaileParsed.artista && (
                      <div className="text-sm text-neutral-300 drop-shadow-sm">{primerBaileParsed.artista}</div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Bailes Adicionales - Large Card */}
          <div className="relative overflow-hidden rounded-xl bg-neutral-900 border border-white/10 group transition-all duration-300 hover:border-white/20 col-span-1 md:col-span-2">
            <div className="absolute inset-0 w-full h-full z-0">
              <img
                src="https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=2000&auto=format&fit=crop"
                alt="Bailes Adicionales"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 opacity-50 group-hover:opacity-30"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/30" />
            </div>
            <div className="relative z-10 h-full w-full p-6">
              <div className="flex flex-col h-full">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm text-neutral-400 uppercase tracking-wider font-medium">Bailes Adicionales</h3>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-white drop-shadow-lg">{bailesFiltrados.length}</span>
                    {!estaBloqueado && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          agregarBaile();
                        }}
                        className="p-1.5 bg-white/20 hover:bg-white/30 rounded-lg transition text-white"
                        title="Agregar Baile"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
                {bailesParaMostrar.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-neutral-400 text-sm">No hay bailes adicionales configurados</p>
                    {!estaBloqueado && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          agregarBaile();
                        }}
                        className="mt-4 px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition text-sm font-medium"
                      >
                        Agregar Primer Baile
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
                    {bailesParaMostrar.map((baile, index) => (
                      <div key={index} className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-4 relative">
                        <div className="flex items-center justify-between mb-3">
                          <div className="text-xs text-neutral-400 mb-2 font-medium">Baile {index + 1}</div>
                          {!estaBloqueado && bailesParaMostrar.length > 0 && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                eliminarBaile(index);
                              }}
                              className="p-1.5 bg-red-500/20 hover:bg-red-500/30 rounded-lg transition text-red-400 hover:text-red-300"
                              title="Eliminar Baile"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                        {!estaBloqueado ? (
                          <div className="space-y-2">
                            <input
                              type="text"
                              value={baile.nombre}
                              onChange={(e) => actualizarBaile(index, 'nombre', e.target.value)}
                              placeholder="Canción"
                              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder:text-neutral-400 focus:ring-2 focus:ring-white focus:border-transparent outline-none text-sm"
                            />
                            <input
                              type="text"
                              value={baile.con_quien}
                              onChange={(e) => actualizarBaile(index, 'con_quien', e.target.value)}
                              placeholder="Con quién"
                              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder:text-neutral-400 focus:ring-2 focus:ring-white focus:border-transparent outline-none text-sm"
                            />
                          </div>
                        ) : (
                          <>
                            <div className="text-base font-semibold text-white mb-1 drop-shadow-sm">
                              {baile.nombre || 'Sin especificar'}
                            </div>
                            {baile.con_quien && (
                              <div className="text-sm text-neutral-300 drop-shadow-sm">• {baile.con_quien}</div>
                            )}
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Canción Sorpresa */}
          <div className="relative overflow-hidden rounded-xl bg-neutral-900 border border-white/10 group transition-all duration-300 hover:border-white/20">
            <div className="absolute inset-0 w-full h-full z-0">
              <img
                src="https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?q=80&w=2000&auto=format&fit=crop"
                alt="Sorpresa"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 opacity-50 group-hover:opacity-30"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/30" />
            </div>
            <div className="relative z-10 h-full w-full p-6">
              <div className="flex flex-col justify-center h-full">
                <h3 className="text-sm text-neutral-400 mb-2 uppercase tracking-wider font-medium">Canción Sorpresa</h3>
                {!estaBloqueado ? (
                  <input
                    type="text"
                    value={datos.cancion_sorpresa}
                    onChange={(e) => setDatos({ ...datos, cancion_sorpresa: e.target.value })}
                    placeholder="Canción especial para sorprender..."
                    className="w-full px-3 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white placeholder:text-neutral-400 focus:ring-2 focus:ring-white focus:border-transparent outline-none text-sm italic"
                  />
                ) : (
                  <div className="text-base text-neutral-300 italic drop-shadow-sm">
                    {datos.cancion_sorpresa || 'Sin especificar'}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Notas Adicionales */}
          <div className="relative overflow-hidden rounded-xl bg-neutral-900 border border-white/10 group transition-all duration-300 hover:border-white/20">
            <div className="absolute inset-0 w-full h-full z-0">
              <img
                src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=2000&auto=format&fit=crop"
                alt="Notas"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 opacity-50 group-hover:opacity-30"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/30" />
            </div>
            <div className="relative z-10 h-full w-full p-6">
              <div className="flex flex-col justify-center h-full">
                <h3 className="text-sm text-neutral-400 mb-2 uppercase tracking-wider font-medium">Notas Adicionales</h3>
                {!estaBloqueado ? (
                  <textarea
                    value={datos.notas_entretenimiento}
                    onChange={(e) => setDatos({ ...datos, notas_entretenimiento: e.target.value })}
                    placeholder="Cualquier detalle especial..."
                    rows={3}
                    className="w-full px-3 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white placeholder:text-neutral-400 focus:ring-2 focus:ring-white focus:border-transparent outline-none text-sm resize-none"
                  />
                ) : (
                  <div className="text-sm text-neutral-300 italic drop-shadow-sm">
                    {datos.notas_entretenimiento || 'Sin notas adicionales'}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={guardando || estaBloqueado}
            className="flex items-center gap-2 px-6 py-3 bg-white text-black rounded-xl font-medium hover:bg-neutral-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {guardando ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                Guardar Selección
                <ChevronRight className="w-5 h-5" />
              </>
            )}
          </button>
        </div>
      </motion.div>
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

  // Obtener productos según tipo de licor
  const rones = tipoLicor === 'premium' 
    ? ['Ron Bacardi Blanco', 'Ron Bacardi Gold'] 
    : ['Ron Spice', 'Ron Blanco'];
  
  const whisky = tipoLicor === 'premium' ? 'Whisky Black Label' : 'Whisky House';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="max-w-6xl mx-auto"
    >
      <div className="flex items-center gap-3 mb-2">
        <span className="px-3 py-1 rounded-full bg-purple-500/10 text-purple-400 text-xs font-medium border border-purple-500/20">
          Bebidas Incluidas
        </span>
        {tipoLicor === 'premium' && (
          <span className="px-3 py-1 rounded-full bg-purple-500/20 text-purple-400 text-xs font-medium border border-purple-500/30">
            ⭐ Premium
          </span>
        )}
        {tipoLicor === 'basico' && (
          <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-400 text-xs font-medium border border-blue-500/30">
            📦 Básico
          </span>
        )}
      </div>
      <h2 className="text-4xl font-bold text-white mb-4">Bar - Cócteles y Bebidas</h2>
      <p className="text-xl text-neutral-400 max-w-2xl mb-8">
        Revisa las bebidas incluidas en tu paquete de bar.
      </p>

      {!tipoLicor ? (
        <div className="bg-yellow-500/10 border-2 border-yellow-500/30 rounded-xl p-6 text-center">
          <Wine className="w-12 h-12 text-yellow-400 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-yellow-200 mb-2">Servicio de Bar no Contratado</h3>
          <p className="text-yellow-300">
            No tienes contratado ningún servicio de licor (Básico o Premium) en tu evento.
          </p>
        </div>
      ) : (
        <>
          <div className="mb-8 p-4 rounded-xl bg-blue-500/10 border border-blue-500/30">
            <div className="flex items-start gap-3">
              <Info size={20} className="text-blue-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-blue-200 mb-1">Información del Bar</p>
                <p className="text-sm text-blue-300">
                  Esta es la lista completa de bebidas incluidas en el servicio de <span className="font-semibold text-white">{tipoLicor === 'premium' ? 'Licor Premium' : 'Licor Básico'}</span>.
                </p>
              </div>
            </div>
          </div>

          {/* Bento Grid for Drinks */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 auto-rows-[minmax(200px,auto)]">
            {/* Licores y Alcohol - Large Card */}
            <div className="relative overflow-hidden rounded-xl bg-neutral-900 border border-white/10 group cursor-pointer col-span-1 md:col-span-2 row-span-1 transition-all duration-300 hover:border-white/20">
              <div className="absolute inset-0 w-full h-full z-0">
                <img
                  src="https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?q=80&w=2000&auto=format&fit=crop"
                  alt="Licores"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 opacity-50 group-hover:opacity-30"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/30" />
              </div>
              <div className="relative z-10 h-full w-full p-6">
                <div className="flex flex-col h-full">
                  <div className="mb-4">
                    <h3 className="text-sm text-neutral-400 mb-2 uppercase tracking-wider font-medium flex items-center gap-2">
                      <Wine size={16} />
                      Licores y Alcohol
                    </h3>
                  </div>
                  <div className="grid grid-cols-2 gap-3 flex-1">
                    <div>
                      <div className="text-xs text-neutral-400 mb-2 font-medium">Vinos</div>
                      <div className="space-y-1">
                        {vinos.map((item) => (
                          <div key={item} className="text-sm text-white drop-shadow-sm">• {item}</div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-neutral-400 mb-2 font-medium">Ron</div>
                      <div className="space-y-1">
                        {rones.map((item) => (
                          <div key={item} className="text-sm text-white drop-shadow-sm">• {item}</div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-neutral-400 mb-2 font-medium">Whisky</div>
                      <div className="space-y-1">
                        <div className="text-sm text-white drop-shadow-sm">• {whisky}</div>
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-neutral-400 mb-2 font-medium">Otros</div>
                      <div className="space-y-1">
                        {['Vodka', 'Tequila'].map((item) => (
                          <div key={item} className="text-sm text-white drop-shadow-sm">• {item}</div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Refrescos Card */}
            <div className="relative overflow-hidden rounded-xl bg-neutral-900 border border-white/10 group cursor-pointer col-span-1 row-span-1 transition-all duration-300 hover:border-white/20">
              <div className="absolute inset-0 w-full h-full z-0">
                <img
                  src="https://images.unsplash.com/photo-1581006852262-e4307cf6283a?q=80&w=2000&auto=format&fit=crop"
                  alt="Refrescos"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 opacity-50 group-hover:opacity-30"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/30" />
              </div>
              <div className="relative z-10 h-full w-full p-6">
                <div className="flex flex-col h-full">
                  <h3 className="text-sm text-neutral-400 mb-3 uppercase tracking-wider font-medium">Refrescos</h3>
                  <div className="space-y-1 flex-1">
                    {refrescos.map((item) => (
                      <div key={item} className="text-sm text-white drop-shadow-sm">• {item}</div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Jugos Card */}
            <div className="relative overflow-hidden rounded-xl bg-neutral-900 border border-white/10 group cursor-pointer col-span-1 row-span-1 transition-all duration-300 hover:border-white/20">
              <div className="absolute inset-0 w-full h-full z-0">
                <img
                  src="https://images.unsplash.com/photo-1600271886742-f049cd451bba?q=80&w=2000&auto=format&fit=crop"
                  alt="Jugos"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 opacity-50 group-hover:opacity-30"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/30" />
              </div>
              <div className="relative z-10 h-full w-full p-6">
                <div className="flex flex-col justify-center h-full">
                  <h3 className="text-sm text-neutral-400 mb-2 uppercase tracking-wider font-medium">Jugos</h3>
                  <div className="text-4xl font-bold tracking-tight text-white mb-3 drop-shadow-lg">{jugos.length}</div>
                  <div className="space-y-1">
                    {jugos.map((item) => (
                      <div key={item} className="text-sm text-neutral-300 drop-shadow-sm">• {item}</div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Cócteles Card */}
            <div className="relative overflow-hidden rounded-xl bg-neutral-900 border border-white/10 group cursor-pointer col-span-1 row-span-1 transition-all duration-300 hover:border-white/20">
              <div className="absolute inset-0 w-full h-full z-0">
                <img
                  src="https://images.unsplash.com/photo-1536935338788-846bb9981813?q=80&w=2000&auto=format&fit=crop"
                  alt="Cócteles"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 opacity-50 group-hover:opacity-30"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/30" />
              </div>
              <div className="relative z-10 h-full w-full p-6">
                <div className="flex flex-col justify-center h-full">
                  <h3 className="text-sm text-neutral-400 mb-2 uppercase tracking-wider font-medium">Cócteles</h3>
                  <div className="text-4xl font-bold tracking-tight text-white mb-3 drop-shadow-lg">{cocteles.length}</div>
                  <div className="space-y-1">
                    {cocteles.map((item) => (
                      <div key={item} className="text-sm text-neutral-300 drop-shadow-sm">• {item}</div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Otros Card */}
            <div className="relative overflow-hidden rounded-xl bg-neutral-900 border border-white/10 group cursor-pointer col-span-1 row-span-1 transition-all duration-300 hover:border-white/20">
              <div className="absolute inset-0 w-full h-full z-0">
                <img
                  src="https://images.unsplash.com/photo-1587223075055-82e9a937ddff?q=80&w=2000&auto=format&fit=crop"
                  alt="Otros"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 opacity-50 group-hover:opacity-30"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/30" />
              </div>
              <div className="relative z-10 h-full w-full p-6">
                <div className="flex flex-col justify-center h-full">
                  <h3 className="text-sm text-neutral-400 mb-2 uppercase tracking-wider font-medium">Otros</h3>
                  <div className="text-4xl font-bold tracking-tight text-white mb-3 drop-shadow-lg">{otros.length}</div>
                  <div className="space-y-1">
                    {otros.map((item) => (
                      <div key={item} className="text-sm text-neutral-300 drop-shadow-sm">• {item}</div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </motion.div>
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
    <div className={cn(
      "flex items-center gap-2",
      label && "justify-between"
    )}>
      {label && <span className="text-xs font-medium text-neutral-400">{label}</span>}
      <div className="flex gap-1.5">
        <button
          type="button"
          onClick={() => onChange(true)}
          disabled={disabled}
          className={cn(
            "px-3 py-1 rounded-md text-xs font-medium transition-all duration-200 min-w-[50px]",
            value === true
              ? "bg-green-500 text-white"
              : "bg-neutral-800/50 text-neutral-400 hover:bg-neutral-800 border border-white/5"
          )}
        >
          Sí
        </button>
        <button
          type="button"
          onClick={() => onChange(false)}
          disabled={disabled}
          className={cn(
            "px-3 py-1 rounded-md text-xs font-medium transition-all duration-200 min-w-[50px]",
            value === false
              ? "bg-red-500 text-white"
              : "bg-neutral-800/50 text-neutral-400 hover:bg-neutral-800 border border-white/5"
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
          <div className="space-y-8">
            <div className="mb-8">
              <h3 className="text-3xl font-bold text-white mb-2">Paso 1: Información General</h3>
              <p className="text-xl text-neutral-400">Completa la información adicional sobre tu evento</p>
            </div>
            
            {/* Limosina (solo si está contratada) */}
            {tieneLimosina && (
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Car className="w-6 h-6 text-blue-400" />
                  <h4 className="text-xl font-bold text-white">Servicio de Limosina</h4>
                </div>
                <p className="text-neutral-400 mb-4">
                  Indica la hora en que deseas que la limosina te recoga
                </p>
                <div>
                  <label className="block text-sm font-medium text-white mb-2 flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Hora de Recogida
                  </label>
                  <input
                    type="time"
                    value={datos.hora_limosina}
                    onChange={(e) => setDatos({ ...datos, hora_limosina: e.target.value })}
                    disabled={estaBloqueado}
                    className="w-full px-4 py-3 text-base border border-white/10 rounded-xl focus:ring-2 focus:ring-white focus:border-transparent outline-none bg-neutral-800 text-white disabled:bg-neutral-700"
                  />
                  <p className="text-xs text-neutral-400 mt-2">
                    💡 Esta hora puede ser ajustada por tu asesor según las necesidades del evento
                  </p>
                </div>
              </div>
            )}

            {/* Vestido de la niña (solo si es 15 años) */}
            {esQuinceanera && (
              <div className="bg-neutral-800/50 border border-white/10 rounded-xl p-6">
                <h4 className="text-lg font-bold text-white mb-2">Vestido de la Quinceañera</h4>
                <p className="text-neutral-400 mb-4 text-sm">
                  Describe el vestido o estilo que llevará la quinceañera
                </p>
                <input
                  type="text"
                  value={datos.vestido_nina}
                  onChange={(e) => setDatos({ ...datos, vestido_nina: e.target.value })}
                  disabled={estaBloqueado}
                  placeholder="Ej: Vestido largo blanco con detalles dorados, estilo princesa..."
                  className="w-full px-4 py-3 text-base border border-white/10 rounded-xl focus:ring-2 focus:ring-white focus:border-transparent outline-none bg-neutral-900 text-white placeholder:text-neutral-500 disabled:bg-neutral-700"
                />
              </div>
            )}

            {/* Items Especiales */}
            <div className="bg-neutral-800/50 border border-white/10 rounded-xl p-6">
              <h4 className="text-lg font-bold text-white mb-2">Items Especiales que Traerás</h4>
              <p className="text-neutral-400 mb-4 text-sm">
                Indica cualquier elemento especial que planeas traer al evento
              </p>
              <textarea
                value={datos.items_especiales}
                onChange={(e) => setDatos({ ...datos, items_especiales: e.target.value })}
                disabled={estaBloqueado}
                rows={4}
                placeholder="Ej: Flores, recuerdos, fotos, decoración especial, elementos personales..."
                className="w-full px-4 py-3 text-base border border-white/10 rounded-xl focus:ring-2 focus:ring-white focus:border-transparent outline-none bg-neutral-900 text-white placeholder:text-neutral-500 disabled:bg-neutral-700 resize-none"
              />
            </div>

            {/* Sorpresas Planeadas */}
            <div className="bg-neutral-800/50 border border-white/10 rounded-xl p-6">
              <h4 className="text-lg font-bold text-white mb-2">Sorpresas Planeadas</h4>
              <p className="text-neutral-400 mb-4 text-sm">
                Describe cualquier sorpresa especial que estés planeando para el evento
              </p>
              <textarea
                value={datos.sorpresas_planeadas}
                onChange={(e) => setDatos({ ...datos, sorpresas_planeadas: e.target.value })}
                disabled={estaBloqueado}
                rows={4}
                placeholder="Ej: Sorpresa de video, presentación especial, sorpresa para los padres..."
                className="w-full px-4 py-3 text-base border border-white/10 rounded-xl focus:ring-2 focus:ring-white focus:border-transparent outline-none bg-neutral-900 text-white placeholder:text-neutral-500 disabled:bg-neutral-700 resize-none"
              />
            </div>

            {/* Observaciones Adicionales */}
            <div className="bg-neutral-800/50 border border-white/10 rounded-xl p-6">
              <h4 className="text-lg font-bold text-white mb-2">Observaciones Adicionales</h4>
              <p className="text-neutral-400 mb-4 text-sm">
                Cualquier otra observación o detalle que quieras comunicar
              </p>
              <textarea
                value={datos.observaciones_adicionales}
                onChange={(e) => setDatos({ ...datos, observaciones_adicionales: e.target.value })}
                disabled={estaBloqueado}
                rows={4}
                placeholder="Cualquier observación o detalle adicional que quieras comunicar..."
                className="w-full px-4 py-3 text-base border border-white/10 rounded-xl focus:ring-2 focus:ring-white focus:border-transparent outline-none bg-neutral-900 text-white placeholder:text-neutral-500 disabled:bg-neutral-700 resize-none"
              />
            </div>
          </div>
        );

      case 2: // Protocolo Básico
        return (
          <div className="space-y-8">
            <div className="mb-8">
              <h3 className="text-3xl font-bold text-white mb-2">Paso 2: Protocolo Básico</h3>
              <p className="text-xl text-neutral-400">Completa la información básica del protocolo del evento</p>
            </div>

            {/* Hora de Apertura */}
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-6">
              <h4 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                🕐 Hora de Apertura del Salón
              </h4>
              <p className="text-neutral-400 mb-4 text-sm">
                Hora en que se abrirá el salón para que los invitados puedan ingresar
              </p>
              <input
                type="time"
                value={datos.protocolo?.hora_apertura || ''}
                onChange={(e) => actualizarProtocolo('hora_apertura', e.target.value)}
                disabled={estaBloqueado}
                className="w-full px-4 py-3 text-base border border-white/10 rounded-xl focus:ring-2 focus:ring-white focus:border-transparent outline-none bg-neutral-800 text-white disabled:bg-neutral-700"
              />
            </div>

            {/* Anuncio de Padres */}
            <div className="bg-pink-500/10 border border-pink-500/30 rounded-xl p-6">
              <h4 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                👨‍👩‍👧 Anuncio de Padres
              </h4>
              <p className="text-neutral-400 mb-4 text-sm">
                Información sobre el anuncio de entrada de los padres
              </p>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Hora del Anuncio *</label>
                  <input
                    type="time"
                    value={datos.protocolo?.hora_anuncio_padres || ''}
                    onChange={(e) => actualizarProtocolo('hora_anuncio_padres', e.target.value)}
                    disabled={estaBloqueado}
                    className="w-full px-4 py-3 text-base border border-white/10 rounded-xl focus:ring-2 focus:ring-white focus:border-transparent outline-none bg-neutral-800 text-white disabled:bg-neutral-700"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Nombres de los Padres *</label>
                  <input
                    type="text"
                    value={datos.protocolo?.nombres_padres || ''}
                    onChange={(e) => actualizarProtocolo('nombres_padres', e.target.value)}
                    disabled={estaBloqueado}
                    placeholder="Ej: Sr. Yael y Sra. Yaneli"
                    className="w-full px-4 py-3 text-base border border-white/10 rounded-xl focus:ring-2 focus:ring-white focus:border-transparent outline-none bg-neutral-800 text-white placeholder:text-neutral-500 disabled:bg-neutral-700"
                  />
                </div>
              </div>
            </div>

            {/* Anuncio de Homenajeado */}
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-6">
              <h4 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                ⭐ Anuncio del Homenajeado
              </h4>
              <p className="text-neutral-400 mb-4 text-sm">
                Información sobre el anuncio de entrada del homenajeado
              </p>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Hora del Anuncio *</label>
                  <input
                    type="time"
                    value={datos.protocolo?.hora_anuncio_homenajeado || ''}
                    onChange={(e) => actualizarProtocolo('hora_anuncio_homenajeado', e.target.value)}
                    disabled={estaBloqueado}
                    className="w-full px-4 py-3 text-base border border-white/10 rounded-xl focus:ring-2 focus:ring-white focus:border-transparent outline-none bg-neutral-800 text-white disabled:bg-neutral-700"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Nombre del Homenajeado *</label>
                  <input
                    type="text"
                    value={datos.protocolo?.nombre_homenajeado || contrato?.homenajeado || ''}
                    onChange={(e) => actualizarProtocolo('nombre_homenajeado', e.target.value)}
                    disabled={estaBloqueado}
                    placeholder="Nombre completo"
                    className="w-full px-4 py-3 text-base border border-white/10 rounded-xl focus:ring-2 focus:ring-white focus:border-transparent outline-none bg-neutral-800 text-white placeholder:text-neutral-500 disabled:bg-neutral-700"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Acompañado de (opcional)</label>
                  <input
                    type="text"
                    value={datos.protocolo?.acompanantes || ''}
                    onChange={(e) => actualizarProtocolo('acompanantes', e.target.value)}
                    disabled={estaBloqueado}
                    placeholder="Ej: Sus hermanos Yoel y Sebastian"
                    className="w-full px-4 py-3 text-base border border-white/10 rounded-xl focus:ring-2 focus:ring-white focus:border-transparent outline-none bg-neutral-800 text-white placeholder:text-neutral-500 disabled:bg-neutral-700"
                  />
                </div>
              </div>
            </div>
          </div>
        );

      case 3: // Actividades Especiales
        return (
          <div className="space-y-8">
            <div className="mb-8">
              <h3 className="text-3xl font-bold text-white mb-2">Paso 3: Actividades Especiales</h3>
              <p className="text-xl text-neutral-400">Selecciona las actividades especiales que deseas incluir en el protocolo</p>
            </div>

            {/* Cambio de Zapatilla */}
            <div className="bg-neutral-800/50 border border-white/10 rounded-xl p-6">
              <h4 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                👠 Cambio de Zapatilla
              </h4>
              <p className="text-neutral-400 mb-4 text-sm">
                ¿Deseas incluir el cambio de zapatilla en el protocolo?
              </p>
              <div className="space-y-4">
                <ToggleButton
                  label="¿Incluir cambio de zapatilla?"
                  value={datos.protocolo?.cambio_zapatilla}
                  onChange={(val) => actualizarProtocolo('cambio_zapatilla', val)}
                  disabled={estaBloqueado}
                />
                {datos.protocolo?.cambio_zapatilla === true && (
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">A cargo de</label>
                    <input
                      type="text"
                      value={datos.protocolo?.cambio_zapatilla_a_cargo || 'El papá'}
                      onChange={(e) => actualizarProtocolo('cambio_zapatilla_a_cargo', e.target.value)}
                      disabled={estaBloqueado}
                      placeholder="Ej: El papá"
                      className="w-full px-4 py-3 text-base border border-white/10 rounded-xl focus:ring-2 focus:ring-white focus:border-transparent outline-none bg-neutral-900 text-white placeholder:text-neutral-500 disabled:bg-neutral-700"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Bailes Especiales */}
            <div className="bg-neutral-800/50 border border-white/10 rounded-xl p-6">
              <h4 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                💃 Bailes Especiales
              </h4>
              <p className="text-neutral-400 mb-4 text-sm">
                Selecciona los bailes especiales que deseas incluir en el protocolo
              </p>
              <div className="space-y-4">
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
                <div className="pt-4 border-t border-white/10">
                  <label className="block text-sm font-medium text-white mb-2">Otros Bailes (Opcional)</label>
                  <textarea
                    value={datos.protocolo?.bailes_adicionales || ''}
                    onChange={(e) => actualizarProtocolo('bailes_adicionales', e.target.value)}
                    disabled={estaBloqueado}
                    rows={3}
                    placeholder="Ej: Baile con hermano Yoel, Baile con hermano Sebastian..."
                    className="w-full px-4 py-3 text-base border border-white/10 rounded-xl focus:ring-2 focus:ring-white focus:border-transparent outline-none bg-neutral-900 text-white placeholder:text-neutral-500 disabled:bg-neutral-700 resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Ceremonia de las 15 Velas */}
            {esQuinceanera && (
              <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-6">
                <h4 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                  🕯️ Ceremonia de las 15 Velas
                </h4>
                <p className="text-neutral-400 mb-4 text-sm">
                  ¿Deseas incluir la ceremonia tradicional de las 15 velas?
                </p>
                <ToggleButton
                  label="¿Incluir ceremonia de las 15 velas?"
                  value={datos.protocolo?.ceremonia_velas}
                  onChange={(val) => actualizarProtocolo('ceremonia_velas', val)}
                  disabled={estaBloqueado}
                />
              </div>
            )}

            {/* Palabras / Brindis */}
            <div className="bg-neutral-800/50 border border-white/10 rounded-xl p-6">
              <h4 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                🥂 Palabras / Brindis
              </h4>
              <p className="text-neutral-400 mb-4 text-sm">
                ¿Deseas incluir un brindis o palabras especiales en el protocolo?
              </p>
              <div className="space-y-4">
                <ToggleButton
                  label="¿Incluir brindis?"
                  value={datos.protocolo?.brindis}
                  onChange={(val) => actualizarProtocolo('brindis', val)}
                  disabled={estaBloqueado}
                />
                {datos.protocolo?.brindis === true && (
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">A cargo de (opcional)</label>
                    <input
                      type="text"
                      value={datos.protocolo?.brindis_a_cargo || ''}
                      onChange={(e) => actualizarProtocolo('brindis_a_cargo', e.target.value)}
                      disabled={estaBloqueado}
                      placeholder="Ej: El padrino"
                      className="w-full px-4 py-3 text-base border border-white/10 rounded-xl focus:ring-2 focus:ring-white focus:border-transparent outline-none bg-neutral-900 text-white placeholder:text-neutral-500 disabled:bg-neutral-700"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      case 4: // Horarios de Actividades
        return (
          <div className="space-y-8">
            <div className="mb-8">
              <h3 className="text-3xl font-bold text-white mb-2">Paso 4: Horarios de Actividades</h3>
              <p className="text-xl text-neutral-400">Indica los horarios aproximados para las diferentes actividades del evento</p>
            </div>
            <div className="bg-neutral-800/50 border border-white/10 rounded-xl p-6">
              <h4 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                📅 Horarios de Actividades
              </h4>
              <p className="text-neutral-400 mb-4 text-sm">
                Completa los horarios para cada actividad (todos son opcionales)
              </p>
              <div className="space-y-4">
                {[
                  { key: 'hora_fotos', label: 'Momento Social / Fotos', icon: '📸' },
                  { key: 'hora_cena', label: 'Cena / Proyección de Video', icon: '🍽️' },
                  { key: 'hora_photobooth', label: 'Photobooth', icon: '📷' },
                  { key: 'hora_loca', label: 'Hora Loca', icon: '🎉' },
                  { key: 'hora_happy_birthday', label: 'Happy Birthday', icon: '🎂' },
                  { key: 'hora_fin', label: 'Fin del Evento', icon: '🏁' },
                ].map((actividad) => (
                  <div key={actividad.key}>
                    <label className="block text-sm font-medium text-white mb-2 flex items-center gap-2">
                      <span>{actividad.icon}</span>
                      {actividad.label}
                    </label>
                    <input
                      type="time"
                      value={datos.protocolo?.[actividad.key] || ''}
                      onChange={(e) => actualizarProtocolo(actividad.key, e.target.value)}
                      disabled={estaBloqueado}
                      className="w-full px-4 py-3 text-base border border-white/10 rounded-xl focus:ring-2 focus:ring-white focus:border-transparent outline-none bg-neutral-900 text-white disabled:bg-neutral-700"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // Formatear hora para mostrar
  const formatearHora = (hora) => {
    if (!hora) return '--:-- --';
    const [h, m] = hora.split(':');
    const hora12 = parseInt(h);
    const ampm = hora12 >= 12 ? 'PM' : 'AM';
    const hora12h = hora12 % 12 || 12;
    return `${hora12h.toString().padStart(2, '0')}:${m} ${ampm}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="max-w-6xl mx-auto"
    >
      <div className="flex items-center gap-3 mb-2">
        <span className="px-3 py-1 rounded-full bg-green-500/10 text-green-400 text-xs font-medium border border-green-500/20">
          Opcional
        </span>
      </div>
      <h2 className="text-4xl font-bold text-white mb-4">Detalles Finales</h2>
      <p className="text-xl text-neutral-400 max-w-2xl mb-8">
        Completa cada paso para finalizar los detalles de tu evento.
      </p>

      {/* Progress Steps */}
      <div className="mb-8 p-6 rounded-xl bg-neutral-900 border border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex flex-col items-center flex-1">
              <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center text-white mb-2">
                <Check size={20} />
              </div>
              <span className="text-xs text-neutral-400">Información...</span>
            </div>
            <div className="h-0.5 bg-green-500 flex-1 mx-2" />
            <div className="flex flex-col items-center flex-1">
              <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center text-white mb-2">
                <Check size={20} />
              </div>
              <span className="text-xs text-neutral-400">Protocolo B...</span>
            </div>
            <div className="h-0.5 bg-green-500 flex-1 mx-2" />
            <div className="flex flex-col items-center flex-1">
              <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center text-white mb-2">
                <Check size={20} />
              </div>
              <span className="text-xs text-neutral-400">Actividades...</span>
            </div>
            <div className="h-0.5 bg-neutral-700 flex-1 mx-2" />
            <div className="flex flex-col items-center flex-1">
              <div className="w-10 h-10 rounded-full bg-neutral-700 flex items-center justify-center text-white mb-2">
                4
              </div>
              <span className="text-xs text-neutral-400">Horarios</span>
            </div>
          </div>
        </div>

        {/* Bento Grid for Final Details */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 auto-rows-[minmax(200px,auto)] mb-8">
          {/* Paso 1: Información General - Large Card */}
          <div className="relative overflow-hidden rounded-xl bg-neutral-900 border border-white/10 group cursor-pointer col-span-1 md:col-span-2 row-span-1 transition-all duration-300 hover:shadow-lg">
            <div className="absolute inset-0 w-full h-full z-0">
              <img
                src="https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?q=80&w=2000&auto=format&fit=crop"
                alt="Información General"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 opacity-50 group-hover:opacity-30"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/30" />
            </div>
            <div className="relative z-10 h-full w-full p-6">
              <div className="flex flex-col h-full">
                <h3 className="text-sm text-neutral-400 mb-4 uppercase tracking-wider font-medium">Paso 1: Información General</h3>
                <div className="grid grid-cols-1 gap-4 flex-1">
                  <div>
                    <div className="text-xs text-neutral-400 mb-1 font-medium">Items Especiales que Traerás</div>
                    {!estaBloqueado ? (
                      <textarea
                        value={datos.items_especiales}
                        onChange={(e) => setDatos({ ...datos, items_especiales: e.target.value })}
                        onBlur={handleSubmit}
                        placeholder="Ej: Flores, recuerdos, fotos..."
                        className="w-full px-3 py-2 bg-neutral-800/80 border border-white/10 rounded-lg text-white placeholder:text-neutral-500 text-sm focus:ring-2 focus:ring-white focus:border-transparent outline-none resize-none"
                        rows={2}
                      />
                    ) : (
                      <div className="text-sm text-white drop-shadow-sm">
                        {datos.items_especiales || 'No especificado'}
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="text-xs text-neutral-400 mb-1 font-medium">Sorpresas Planeadas</div>
                    {!estaBloqueado ? (
                      <textarea
                        value={datos.sorpresas_planeadas}
                        onChange={(e) => setDatos({ ...datos, sorpresas_planeadas: e.target.value })}
                        onBlur={handleSubmit}
                        placeholder="Ej: Sorpresa de video, presentación especial..."
                        className="w-full px-3 py-2 bg-neutral-800/80 border border-white/10 rounded-lg text-white placeholder:text-neutral-500 text-sm focus:ring-2 focus:ring-white focus:border-transparent outline-none resize-none"
                        rows={2}
                      />
                    ) : (
                      <div className="text-sm text-white drop-shadow-sm">
                        {datos.sorpresas_planeadas || 'No especificado'}
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="text-xs text-neutral-400 mb-1 font-medium">Observaciones Adicionales</div>
                    {!estaBloqueado ? (
                      <textarea
                        value={datos.observaciones_adicionales}
                        onChange={(e) => setDatos({ ...datos, observaciones_adicionales: e.target.value })}
                        onBlur={handleSubmit}
                        placeholder="Cualquier observación adicional..."
                        className="w-full px-3 py-2 bg-neutral-800/80 border border-white/10 rounded-lg text-white placeholder:text-neutral-500 text-sm focus:ring-2 focus:ring-white focus:border-transparent outline-none resize-none"
                        rows={2}
                      />
                    ) : (
                      <div className="text-sm text-white drop-shadow-sm">
                        {datos.observaciones_adicionales || 'No especificado'}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Paso 2: Protocolo Básico */}
          <div className="relative overflow-hidden rounded-xl bg-neutral-900 border border-white/10 group cursor-pointer col-span-1 row-span-1 transition-all duration-300 hover:shadow-lg">
            <div className="absolute inset-0 w-full h-full z-0">
              <img
                src="https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?q=80&w=2000&auto=format&fit=crop"
                alt="Protocolo"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 opacity-50 group-hover:opacity-30"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/30" />
            </div>
            <div className="relative z-10 h-full w-full p-6">
              <div className="flex flex-col h-full">
                <h3 className="text-sm text-neutral-400 mb-3 uppercase tracking-wider font-medium">Paso 2: Protocolo Básico</h3>
                <div className="space-y-3 flex-1">
                  <div>
                    <div className="text-xs text-neutral-400 mb-1 font-medium">🕐 Apertura del Salón</div>
                    {!estaBloqueado ? (
                      <input
                        type="time"
                        value={datos.protocolo?.hora_apertura || ''}
                        onChange={(e) => {
                          actualizarProtocolo('hora_apertura', e.target.value);
                          setTimeout(() => handleSubmit(e), 500);
                        }}
                        className="w-full px-3 py-2 bg-neutral-800/50 border border-white/10 rounded-lg text-white text-sm focus:ring-1 focus:ring-white/50 focus:border-white/20 outline-none"
                      />
                    ) : (
                      <div className="text-base font-bold text-white drop-shadow-sm">
                        {formatearHora(datos.protocolo?.hora_apertura)}
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="text-xs text-neutral-400 mb-1 font-medium">👨‍👩‍👧 Anuncio de Padres</div>
                    {!estaBloqueado ? (
                      <>
                        <input
                          type="time"
                          value={datos.protocolo?.hora_anuncio_padres || ''}
                          onChange={(e) => {
                            actualizarProtocolo('hora_anuncio_padres', e.target.value);
                            setTimeout(() => handleSubmit(e), 500);
                          }}
                          className="w-full px-3 py-2 mb-2 bg-neutral-800/50 border border-white/10 rounded-lg text-white text-sm focus:ring-1 focus:ring-white/50 focus:border-white/20 outline-none"
                        />
                        <input
                          type="text"
                          value={datos.protocolo?.nombres_padres || ''}
                          onChange={(e) => {
                            actualizarProtocolo('nombres_padres', e.target.value);
                            setTimeout(() => handleSubmit(e), 500);
                          }}
                          placeholder="Nombres"
                          className="w-full px-3 py-2 bg-neutral-800/50 border border-white/10 rounded-lg text-white placeholder:text-neutral-500 text-xs focus:ring-1 focus:ring-white/50 focus:border-white/20 outline-none"
                        />
                      </>
                    ) : (
                      <>
                        <div className="text-sm text-white drop-shadow-sm">
                          {formatearHora(datos.protocolo?.hora_anuncio_padres)}
                        </div>
                        <div className="text-xs text-neutral-300">
                          {datos.protocolo?.nombres_padres || 'No especificado'}
                        </div>
                      </>
                    )}
                  </div>
                  <div>
                    <div className="text-xs text-neutral-400 mb-1 font-medium">⭐ Anuncio Homenajeado</div>
                    {!estaBloqueado ? (
                      <>
                        <input
                          type="time"
                          value={datos.protocolo?.hora_anuncio_homenajeado || ''}
                          onChange={(e) => {
                            actualizarProtocolo('hora_anuncio_homenajeado', e.target.value);
                            setTimeout(() => handleSubmit(e), 500);
                          }}
                          className="w-full px-3 py-2 mb-2 bg-neutral-800/50 border border-white/10 rounded-lg text-white text-sm focus:ring-1 focus:ring-white/50 focus:border-white/20 outline-none"
                        />
                        <input
                          type="text"
                          value={datos.protocolo?.nombre_homenajeado || contrato?.homenajeado || ''}
                          onChange={(e) => {
                            actualizarProtocolo('nombre_homenajeado', e.target.value);
                            setTimeout(() => handleSubmit(e), 500);
                          }}
                          placeholder="Nombre"
                          className="w-full px-3 py-2 bg-neutral-800/50 border border-white/10 rounded-lg text-white placeholder:text-neutral-500 text-xs focus:ring-1 focus:ring-white/50 focus:border-white/20 outline-none"
                        />
                        {datos.protocolo?.acompanantes && (
                          <div className="text-xs text-neutral-300 mt-1">
                            ({datos.protocolo.acompanantes})
                          </div>
                        )}
                      </>
                    ) : (
                      <>
                        <div className="text-sm text-white drop-shadow-sm">
                          {formatearHora(datos.protocolo?.hora_anuncio_homenajeado)}
                        </div>
                        <div className="text-xs text-neutral-300">
                          {datos.protocolo?.nombre_homenajeado || contrato?.homenajeado || 'No especificado'}
                          {datos.protocolo?.acompanantes && ` (${datos.protocolo.acompanantes})`}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Paso 3: Actividades Especiales - Large Card */}
          <div className="relative overflow-hidden rounded-xl bg-neutral-900 border border-white/10 group cursor-pointer col-span-1 md:col-span-2 row-span-1 transition-all duration-300 hover:shadow-lg">
            <div className="absolute inset-0 w-full h-full z-0">
              <img
                src="https://images.unsplash.com/photo-1530103862676-de8c9debad1d?q=80&w=2000&auto=format&fit=crop"
                alt="Actividades"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 opacity-50 group-hover:opacity-30"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/30" />
            </div>
            <div className="relative z-10 h-full w-full p-8">
              <div className="flex flex-col h-full justify-center">
                <h3 className="text-sm text-neutral-400 mb-6 uppercase tracking-wider font-medium text-center">Paso 3: Actividades Especiales</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1 items-start">
                  {/* Columna Izquierda: Bailes y Brindis */}
                  <div className="flex flex-col space-y-4">
                    {!estaBloqueado ? (
                      <div className="space-y-4">
                        <div className="flex flex-col space-y-2">
                          <div className="text-xs text-neutral-400 font-medium">💃 Baile con Papá</div>
                          <PremiumToggle
                            label=""
                            value={datos.protocolo?.baile_papa}
                            onChange={(val) => {
                              actualizarProtocolo('baile_papa', val);
                              setTimeout(() => handleSubmit({ preventDefault: () => {} }), 500);
                            }}
                            disabled={estaBloqueado}
                          />
                        </div>
                        <div className="flex flex-col space-y-2">
                          <div className="text-xs text-neutral-400 font-medium">💃 Baile con Mamá</div>
                          <PremiumToggle
                            label=""
                            value={datos.protocolo?.baile_mama}
                            onChange={(val) => {
                              actualizarProtocolo('baile_mama', val);
                              setTimeout(() => handleSubmit({ preventDefault: () => {} }), 500);
                            }}
                            disabled={estaBloqueado}
                          />
                        </div>
                        <div className="flex flex-col space-y-2">
                          <div className="text-xs text-neutral-400 font-medium">🎤 Palabras / Brindis</div>
                          <PremiumToggle
                            label=""
                            value={datos.protocolo?.brindis}
                            onChange={(val) => {
                              actualizarProtocolo('brindis', val);
                              setTimeout(() => handleSubmit({ preventDefault: () => {} }), 500);
                            }}
                            disabled={estaBloqueado}
                          />
                          {datos.protocolo?.brindis === true && (
                            <input
                              type="text"
                              value={datos.protocolo?.brindis_a_cargo || ''}
                              onChange={(e) => {
                                actualizarProtocolo('brindis_a_cargo', e.target.value);
                                setTimeout(() => handleSubmit(e), 500);
                              }}
                              placeholder="A cargo de"
                              className="w-full mt-2 px-3 py-2 bg-neutral-800/50 border border-white/5 rounded text-white placeholder:text-neutral-500 text-sm focus:ring-1 focus:ring-white/50 focus:border-white/20 outline-none"
                            />
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div>
                          <div className="text-xs text-neutral-400 mb-2 font-medium">💃 Baile con Papá</div>
                          <div className="text-sm text-white drop-shadow-sm">
                            {datos.protocolo?.baile_papa ? '✓ Sí' : '✗ No'}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-neutral-400 mb-2 font-medium">💃 Baile con Mamá</div>
                          <div className="text-sm text-white drop-shadow-sm">
                            {datos.protocolo?.baile_mama ? '✓ Sí' : '✗ No'}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-neutral-400 mb-2 font-medium">🎤 Palabras / Brindis</div>
                          <div className="text-sm text-white drop-shadow-sm mb-1">
                            {datos.protocolo?.brindis ? '✓ Sí' : '✗ No'}
                          </div>
                          {datos.protocolo?.brindis && datos.protocolo?.brindis_a_cargo && (
                            <div className="text-xs text-neutral-300">
                              A cargo de: {datos.protocolo.brindis_a_cargo}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  {/* Columna Derecha: Cambio de Zapatilla y Otros Bailes */}
                  <div className="flex flex-col space-y-4">
                    <div className="flex flex-col space-y-2">
                      <div className="text-xs text-neutral-400 font-medium">👠 Cambio de Zapatilla</div>
                      {!estaBloqueado ? (
                        <>
                          <PremiumToggle
                            label=""
                            value={datos.protocolo?.cambio_zapatilla}
                            onChange={(val) => {
                              actualizarProtocolo('cambio_zapatilla', val);
                              setTimeout(() => handleSubmit({ preventDefault: () => {} }), 500);
                            }}
                            disabled={estaBloqueado}
                          />
                          {datos.protocolo?.cambio_zapatilla === true && (
                            <input
                              type="text"
                              value={datos.protocolo?.cambio_zapatilla_a_cargo || 'El papá'}
                              onChange={(e) => {
                                actualizarProtocolo('cambio_zapatilla_a_cargo', e.target.value);
                                setTimeout(() => handleSubmit(e), 500);
                              }}
                              placeholder="A cargo de"
                              className="w-full mt-2 px-3 py-2 bg-neutral-800/50 border border-white/5 rounded text-white placeholder:text-neutral-500 text-sm focus:ring-1 focus:ring-white/50 focus:border-white/20 outline-none"
                            />
                          )}
                        </>
                      ) : (
                        <div>
                          <div className="text-sm text-white drop-shadow-sm mb-1">
                            {datos.protocolo?.cambio_zapatilla ? '✓ Sí' : '✗ No'}
                          </div>
                          {datos.protocolo?.cambio_zapatilla && datos.protocolo?.cambio_zapatilla_a_cargo && (
                            <div className="text-xs text-neutral-300">
                              A cargo de: {datos.protocolo.cambio_zapatilla_a_cargo}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col space-y-2 mt-4">
                      <div className="text-xs text-neutral-400 font-medium">Otros Bailes</div>
                      {!estaBloqueado ? (
                        <textarea
                          value={datos.protocolo?.bailes_adicionales || ''}
                          onChange={(e) => actualizarProtocolo('bailes_adicionales', e.target.value)}
                          onBlur={handleSubmit}
                          placeholder="Ej: Baile con hermano..."
                          className="w-full px-3 py-2 bg-neutral-800/80 border border-white/10 rounded text-white placeholder:text-neutral-500 text-sm focus:ring-2 focus:ring-white focus:border-transparent outline-none resize-none"
                          rows={3}
                        />
                      ) : (
                        <div className="text-xs text-neutral-300">
                          {datos.protocolo?.bailes_adicionales || 'No especificado'}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Paso 4: Horarios de Actividades */}
          <div className="relative overflow-hidden rounded-xl bg-neutral-900 border border-white/10 group cursor-pointer col-span-1 row-span-1 transition-all duration-300 hover:shadow-lg">
            <div className="absolute inset-0 w-full h-full z-0">
              <img
                src="https://images.unsplash.com/photo-1495364141860-b0d03eccd065?q=80&w=2000&auto=format&fit=crop"
                alt="Horarios"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 opacity-50 group-hover:opacity-30"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/30" />
            </div>
            <div className="relative z-10 h-full w-full p-6">
              <div className="flex flex-col h-full">
                <h3 className="text-sm text-neutral-400 mb-3 uppercase tracking-wider font-medium">Paso 4: Horarios</h3>
                <div className="space-y-2 flex-1">
                  {[
                    { key: 'hora_fotos', label: '📸 Momento Social / Fotos' },
                    { key: 'hora_cena', label: '🍽️ Cena / Video' },
                    { key: 'hora_photobooth', label: '📷 Photobooth' },
                    { key: 'hora_loca', label: '🎊 Hora Loca' },
                    { key: 'hora_happy_birthday', label: '🎂 Happy Birthday' },
                    { key: 'hora_fin', label: '🏁 Fin del Evento' },
                  ].map((actividad, index, array) => (
                    <div
                      key={actividad.key}
                      className={cn(
                        "flex justify-between items-center text-xs",
                        index < array.length - 1 && "border-b border-white/10 pb-1"
                      )}
                    >
                      <span className="text-neutral-400">{actividad.label}</span>
                      {!estaBloqueado ? (
                        <input
                          type="time"
                          value={datos.protocolo?.[actividad.key] || ''}
                          onChange={(e) => {
                            actualizarProtocolo(actividad.key, e.target.value);
                            setTimeout(() => handleSubmit(e), 500);
                          }}
                          className="px-3 py-1.5 bg-neutral-800/50 border border-white/10 rounded-lg text-white text-xs font-mono focus:ring-1 focus:ring-white/50 focus:border-white/20 outline-none w-24"
                        />
                      ) : (
                        <span className="font-mono text-neutral-500">
                          {formatearHora(datos.protocolo?.[actividad.key])}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
  );
}

export default AjustesEvento;
