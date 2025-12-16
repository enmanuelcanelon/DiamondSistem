import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Save,
  Loader2,
  Lock,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  CheckCircle,
  Check,
} from 'lucide-react';
import { motion } from 'framer-motion';
import ImagenSeleccion from '@shared/components/ImagenSeleccion';
import { obtenerImagenDecoracion } from '@shared/utils/mapeoImagenes';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

/**
 * Opciones de colores disponibles para servilletas con sus cantidades límite
 */
const SERVILLETAS_OPCIONES = [
  { color: 'blanca', label: 'Blanca', cantidad_disponible: Infinity, nota: 'Ilimitada' },
  { color: 'rosada', label: 'Rosada', cantidad_disponible: 40 },
  { color: 'azul', label: 'Azul', cantidad_disponible: 80 },
  { color: 'beige', label: 'Beige', cantidad_disponible: 80 },
  { color: 'roja', label: 'Roja', cantidad_disponible: 80 },
  { color: 'verde', label: 'Verde', cantidad_disponible: 80 },
  { color: 'morada', label: 'Morada', cantidad_disponible: 80 },
  { color: 'vinotinto', label: 'Vinotinto', cantidad_disponible: 80 },
  { color: 'negro', label: 'Negro', cantidad_disponible: 80 },
];

const CENTROS_OPCIONES = [
  { value: 'flor', label: 'Flor' },
  { value: 'rojo', label: 'Rojo' },
  { value: 'azul', label: 'Azul' },
  { value: 'rosada', label: 'Rosada' },
  { value: 'blanco', label: 'Blanco' },
  { value: 'arbol', label: 'Árbol' },
  { value: 'candelabro', label: 'Candelabro' },
  { value: 'cilindro', label: 'Cilindro (3 por mesa)' },
];

const BASE_OPCIONES = [
  { value: 'silver', label: 'Silver' },
  { value: 'dorado', label: 'Dorado' },
  { value: 'clear', label: 'Clear' },
  { value: 'candelabro', label: 'Candelabro' },
  { value: 'arbol', label: 'Árbol' },
];

const CHALLER_OPCIONES = [
  { value: 'dorado', label: 'Dorado' },
  { value: 'silver', label: 'Silver' },
  { value: 'clear', label: 'Clear' },
];

const AROS_OPCIONES = [
  { value: 'silver', label: 'Silver' },
  { value: 'dorado', label: 'Dorado' },
  { value: 'clear', label: 'Clear' },
];

const RUNNER_OPCIONES = [
  { value: 'dorado', label: 'Dorado' },
  { value: 'silver', label: 'Silver' },
  { value: 'morado', label: 'Morado' },
  { value: 'azul', label: 'Azul' },
  { value: 'rosado', label: 'Rosado' },
  { value: 'verde', label: 'Verde' },
  { value: 'rojo', label: 'Rojo' },
  { value: 'beige', label: 'Beige' },
  { value: 'negro', label: 'Negro' },
  { value: 'disco', label: 'Disco' },
  { value: 'blanco', label: 'Blanco' },
  { value: 'gatsby', label: 'Gatsby' },
];

// Definir los pasos del wizard
const PASOS = [
  { numero: 1, titulo: 'Cojines', campo: 'cojines_color' },
  { numero: 2, titulo: 'Centro de Mesa', campo: 'centro_mesa_1' },
  { numero: 3, titulo: 'Base', campo: 'base_color' },
  { numero: 4, titulo: 'Challer', campo: 'challer_color' },
  { numero: 5, titulo: 'Servilletas', campo: 'servilletas_color' },
  { numero: 6, titulo: 'Aros', campo: 'aros_color' },
  { numero: 7, titulo: 'Runner', campo: 'runner_tipo' },
  { numero: 8, titulo: 'Stage', campo: 'stage_tipo' },
  { numero: 9, titulo: 'Preferencias Generales', campo: 'estilo_decoracion' },
];

function SeccionDecoracion({ ajustes, onGuardar, guardando, estaBloqueado, contrato }) {
  const [pasoActual, setPasoActual] = useState(1);

  const [datos, setDatos] = useState({
    tipo_decoracion: ajustes?.tipo_decoracion || '',

    // Decoración Básica
    cojines_color: ajustes?.cojines_color || '',
    centro_mesa_1: ajustes?.centro_mesa_1 || '',
    base_color: ajustes?.base_color || '',
    challer_color: ajustes?.challer_color || '',
    servilletas_color: ajustes?.servilletas_color || '',
    aros_color: ajustes?.aros_color || '',
    aros_nota: ajustes?.aros_nota || '',
    runner_tipo: ajustes?.runner_tipo || '',
    runner_nota: ajustes?.runner_nota || '',
    stage_tipo: ajustes?.stage_tipo || '',
    stage_color_globos: ajustes?.stage_color_globos || '',

    // Decoración Premium
    decoracion_premium_detalles: ajustes?.decoracion_premium_detalles || '',

    // Campos genéricos
    estilo_decoracion: ajustes?.estilo_decoracion || '',
    estilo_decoracion_otro: ajustes?.estilo_decoracion_otro || '',
    colores_principales: ajustes?.colores_principales || '',
    tematica: ajustes?.tematica || '',
    notas_decoracion: ajustes?.notas_decoracion || '',
  });

  // Determinar el tipo de decoración basado en el contrato
  useEffect(() => {
    if (contrato?.contratos_servicios) {
      const servicioDecoracion = contrato.contratos_servicios.find(
        cs => cs.servicios?.categoria === 'Decoración'
      );

      if (servicioDecoracion) {
        const nombre = servicioDecoracion.servicios.nombre.toLowerCase();
        const tipo = nombre.includes('plus') || nombre.includes('premium') ? 'premium' : 'basica';
        setDatos(prev => ({ ...prev, tipo_decoracion: tipo }));
      }
    }
  }, [contrato]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onGuardar('decoracion', datos);
  };

  const esBasica = datos.tipo_decoracion === 'basica';
  const esPremium = datos.tipo_decoracion === 'premium';

  // Función para verificar si un paso está completo
  const pasoCompleto = (numero) => {
    const paso = PASOS.find(p => p.numero === numero);
    if (!paso) return false;

    // Paso 9 (Preferencias Generales) - todos los campos son opcionales, pero el paso se considera completo si al menos uno está lleno
    if (numero === 9) {
      return datos.estilo_decoracion || datos.tematica || datos.colores_principales || datos.notas_decoracion;
    }

    const valor = datos[paso.campo];
    if (paso.campo === 'aros_color' && valor === 'otro') {
      return datos.aros_nota && datos.aros_nota.trim() !== '';
    }
    if (paso.campo === 'runner_tipo' && valor === 'otros') {
      return datos.runner_nota && datos.runner_nota.trim() !== '';
    }
    if (paso.campo === 'stage_tipo' && valor === 'globos') {
      return datos.stage_color_globos && datos.stage_color_globos.trim() !== '';
    }
    return valor && valor !== '';
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
    // Solo permitir ir a pasos completos o al siguiente paso
    if (numero <= pasoActual || pasoCompleto(numero - 1)) {
      setPasoActual(numero);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  if (!datos.tipo_decoracion) {
    return (
      <div className="text-center py-12">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-4">
          <Sparkles className="w-8 h-8 text-purple-600" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Decoración</h2>
        <p className="text-muted-foreground">
          No se detectó un servicio de decoración en tu contrato.
        </p>
        <p className="text-sm text-muted-foreground mt-2">
          Contacta a tu asesor si crees que esto es un error.
        </p>
      </div>
    );
  }

  // Renderizar el contenido del paso actual
  const renderPasoActual = () => {
    switch (pasoActual) {
      case 1: // Cojines
        return (
          <div className="space-y-8">
            <div className="mb-6">
              <h3 className="text-3xl font-bold text-white mb-2">Paso 1: Elige el Color de Cojines</h3>
              <p className="text-xl text-neutral-400">Selecciona el tono de los cojines para tus sillas</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                { value: 'negros', label: 'Negros', descripcion: 'Elegante y sofisticado' },
                { value: 'blancos', label: 'Blancos', descripcion: 'Clásico y luminoso' }
              ].map((opcion) => {
                const estaSeleccionado = datos.cojines_color === opcion.value;

                return (
                  <div
                    key={opcion.value}
                    onClick={() => {
                      if (!estaBloqueado) {
                        setDatos({ ...datos, cojines_color: opcion.value });
                      }
                    }}
                    className={cn(
                      "group relative aspect-[4/3] rounded-xl overflow-hidden cursor-pointer transition-all duration-300 border-2",
                      estaSeleccionado
                        ? "border-white ring-2 ring-white/50 shadow-2xl scale-[1.02]"
                        : "border-transparent opacity-70 hover:opacity-100 hover:scale-[1.02]"
                    )}
                  >
                    <img
                      src={obtenerImagenDecoracion('cojin', opcion.value)}
                      alt={`Cojín ${opcion.label}`}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />

                    <div className="absolute bottom-0 left-0 w-full p-6">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <h3 className={cn(
                            "text-3xl font-bold mb-1",
                            estaSeleccionado ? "text-white" : "text-white/90"
                          )}>
                            {opcion.label}
                          </h3>
                          <p className="text-sm text-neutral-300">{opcion.descripcion}</p>
                        </div>
                        {estaSeleccionado && (
                          <div className="bg-white text-black rounded-full p-2">
                            <Check size={20} strokeWidth={3} />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );

      case 2: // Centro de Mesa
        return (
          <div className="space-y-8">
            <div className="mb-6">
              <h3 className="text-3xl font-bold text-white mb-2">Paso 2: Elige el Centro de Mesa</h3>
              <p className="text-xl text-neutral-400">Selecciona el tipo de centro de mesa para tus mesas</p>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {CENTROS_OPCIONES.map((opcion) => {
                const estaSeleccionado = datos.centro_mesa_1 === opcion.value;
                return (
                  <div
                    key={opcion.value}
                    onClick={() => !estaBloqueado && setDatos({ ...datos, centro_mesa_1: opcion.value })}
                    className={cn(
                      "group relative aspect-[4/3] rounded-xl overflow-hidden cursor-pointer transition-all duration-300 border-2",
                      estaSeleccionado
                        ? "border-white ring-2 ring-white/50 shadow-2xl scale-[1.02]"
                        : "border-transparent opacity-70 hover:opacity-100 hover:scale-[1.02]"
                    )}
                  >
                    <img
                      src={obtenerImagenDecoracion('centro_mesa', opcion.value)}
                      alt={opcion.label}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />

                    <div className="absolute bottom-0 left-0 w-full p-4">
                      <div className="flex items-center justify-between mb-1">
                        <span className={cn(
                          "font-bold text-lg",
                          estaSeleccionado ? "text-white" : "text-white/90"
                        )}>
                          {opcion.label}
                        </span>
                        {estaSeleccionado && (
                          <div className="bg-white text-black rounded-full p-1">
                            <Check size={14} strokeWidth={3} />
                          </div>
                        )}
                      </div>
                      {opcion.value === 'cilindro' && (
                        <p className="text-xs text-purple-300">Incluye 3 cilindros</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );

      case 3: // Base
        return (
          <div className="space-y-8">
            <div className="mb-6">
              <h3 className="text-3xl font-bold text-white mb-2">Paso 3: Elige la Base</h3>
              <p className="text-xl text-neutral-400">Selecciona el tipo de base para el centro de mesa</p>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {BASE_OPCIONES.map((opcion) => {
                const estaSeleccionado = datos.base_color === opcion.value;
                return (
                  <div
                    key={opcion.value}
                    onClick={() => !estaBloqueado && setDatos({ ...datos, base_color: opcion.value })}
                    className={cn(
                      "group relative aspect-[4/3] rounded-xl overflow-hidden cursor-pointer transition-all duration-300 border-2",
                      estaSeleccionado
                        ? "border-white ring-2 ring-white/50 shadow-2xl scale-[1.02]"
                        : "border-transparent opacity-70 hover:opacity-100 hover:scale-[1.02]"
                    )}
                  >
                    <img
                      src={obtenerImagenDecoracion('base', opcion.value)}
                      alt={opcion.label}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />

                    <div className="absolute bottom-0 left-0 w-full p-4">
                      <div className="flex items-center justify-between">
                        <span className={cn(
                          "font-bold text-lg",
                          estaSeleccionado ? "text-white" : "text-white/90"
                        )}>
                          {opcion.label}
                        </span>
                        {estaSeleccionado && (
                          <div className="bg-white text-black rounded-full p-1">
                            <Check size={14} strokeWidth={3} />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );

      case 4: // Challer
        return (
          <div className="space-y-8">
            <div className="mb-6">
              <h3 className="text-3xl font-bold text-white mb-2">Paso 4: Elige el Challer</h3>
              <p className="text-xl text-neutral-400">Selecciona el color del challer (cargador de plato)</p>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto">
              {CHALLER_OPCIONES.map((opcion) => {
                const estaSeleccionado = datos.challer_color === opcion.value;
                return (
                  <div
                    key={opcion.value}
                    onClick={() => !estaBloqueado && setDatos({ ...datos, challer_color: opcion.value })}
                    className={cn(
                      "group relative aspect-[4/3] rounded-xl overflow-hidden cursor-pointer transition-all duration-300 border-2",
                      estaSeleccionado
                        ? "border-white ring-2 ring-white/50 shadow-2xl scale-[1.02]"
                        : "border-transparent opacity-70 hover:opacity-100 hover:scale-[1.02]"
                    )}
                  >
                    <img
                      src={obtenerImagenDecoracion('challer', opcion.value)}
                      alt={opcion.label}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />

                    <div className="absolute bottom-0 left-0 w-full p-4">
                      <div className="flex items-center justify-between">
                        <span className={cn(
                          "font-bold text-lg",
                          estaSeleccionado ? "text-white" : "text-white/90"
                        )}>
                          {opcion.label}
                        </span>
                        {estaSeleccionado && (
                          <div className="bg-white text-black rounded-full p-1">
                            <Check size={14} strokeWidth={3} />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );

      case 5: // Servilletas
        return (
          <div className="space-y-8">
            <div className="mb-6">
              <h3 className="text-3xl font-bold text-white mb-2">Paso 5: Elige las Servilletas</h3>
              <p className="text-xl text-neutral-400">Selecciona el color de las servilletas para tu evento</p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {SERVILLETAS_OPCIONES.map((opcion) => {
                const estaSeleccionado = datos.servilletas_color === opcion.color;
                return (
                  <div
                    key={opcion.color}
                    onClick={() => !estaBloqueado && setDatos({ ...datos, servilletas_color: opcion.color })}
                    className={cn(
                      "group relative aspect-square rounded-xl overflow-hidden cursor-pointer transition-all duration-300 border-2",
                      estaSeleccionado
                        ? "border-white ring-2 ring-white/50 shadow-2xl scale-[1.02]"
                        : "border-transparent opacity-70 hover:opacity-100 hover:scale-[1.02]"
                    )}
                  >
                    <img
                      src={obtenerImagenDecoracion('servilleta', opcion.color)}
                      alt={opcion.label}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

                    <div className="absolute bottom-0 left-0 w-full p-4">
                      <div className="flex flex-col">
                        <div className="flex items-center justify-between mb-1">
                          <span className={cn(
                            "font-bold text-lg",
                            estaSeleccionado ? "text-white" : "text-white/90"
                          )}>
                            {opcion.label}
                          </span>
                          {estaSeleccionado && (
                            <div className="bg-white text-black rounded-full p-1">
                              <Check size={12} strokeWidth={3} />
                            </div>
                          )}
                        </div>
                        {opcion.cantidad_disponible !== Infinity && (
                          <span className="text-xs text-white/60">
                            {opcion.cantidad_disponible} disponibles
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );

      case 6: // Aros
        return (
          <div className="space-y-8">
            <div className="mb-6">
              <h3 className="text-3xl font-bold text-white mb-2">Paso 6: Elige los Aros</h3>
              <p className="text-xl text-neutral-400">Selecciona el tipo de aros (anillos para servilleta)</p>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {AROS_OPCIONES.map((opcion) => {
                const estaSeleccionado = datos.aros_color === opcion.value;
                return (
                  <div
                    key={opcion.value}
                    onClick={() => !estaBloqueado && setDatos({ ...datos, aros_color: opcion.value, aros_nota: '' })}
                    className={cn(
                      "group relative aspect-[4/3] rounded-xl overflow-hidden cursor-pointer transition-all duration-300 border-2",
                      estaSeleccionado
                        ? "border-white ring-2 ring-white/50 shadow-2xl scale-[1.02]"
                        : "border-transparent opacity-70 hover:opacity-100 hover:scale-[1.02]"
                    )}
                  >
                    <img
                      src={obtenerImagenDecoracion('aros', opcion.value)}
                      alt={opcion.label}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />

                    <div className="absolute bottom-0 left-0 w-full p-4">
                      <div className="flex items-center justify-between">
                        <span className={cn(
                          "font-bold text-lg",
                          estaSeleccionado ? "text-white" : "text-white/90"
                        )}>
                          {opcion.label}
                        </span>
                        {estaSeleccionado && (
                          <div className="bg-white text-black rounded-full p-1">
                            <Check size={14} strokeWidth={3} />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Opción Otro (Tarjeta simple) */}
              <div
                onClick={() => !estaBloqueado && setDatos({ ...datos, aros_color: 'otro' })}
                className={cn(
                  "group relative aspect-[4/3] rounded-xl overflow-hidden cursor-pointer transition-all duration-300 border-2 bg-neutral-800 flex flex-col items-center justify-center text-center p-4",
                  datos.aros_color === 'otro'
                    ? "border-white ring-2 ring-white/50 shadow-2xl scale-[1.02]"
                    : "border-transparent hover:bg-neutral-700 hover:scale-[1.02]"
                )}
              >
                <div className="w-12 h-12 rounded-full bg-neutral-700 flex items-center justify-center mb-3 group-hover:bg-neutral-600">
                  <span className="text-2xl">✨</span>
                </div>
                <h3 className="font-bold text-white text-lg">Otro Estilo</h3>
                <p className="text-sm text-neutral-400 mt-1">Especificar manualmente</p>
                {datos.aros_color === 'otro' && (
                  <div className="absolute top-3 right-3 bg-white text-black rounded-full p-1">
                    <Check size={14} strokeWidth={3} />
                  </div>
                )}
              </div>
            </div>

            {datos.aros_color === 'otro' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-6"
              >
                <label className="block text-lg font-medium text-white mb-2">Especifica el tipo de aro</label>
                <input
                  type="text"
                  value={datos.aros_nota}
                  onChange={(e) => setDatos({ ...datos, aros_nota: e.target.value })}
                  disabled={estaBloqueado}
                  placeholder="Describe el tipo de aro que deseas..."
                  className="w-full px-5 py-4 text-lg border border-white/10 rounded-xl focus:ring-2 focus:ring-white focus:border-transparent outline-none bg-neutral-800 text-white placeholder:text-neutral-500 disabled:bg-neutral-700"
                  autoFocus
                />
              </motion.div>
            )}
          </div>
        );

      case 7: // Runner
        return (
          <div className="space-y-8">
            <div className="mb-6">
              <h3 className="text-3xl font-bold text-white mb-2">Paso 7: Elige el Runner</h3>
              <p className="text-xl text-neutral-400">Selecciona el estilo de runner (camino de mesa)</p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {RUNNER_OPCIONES.map((opcion) => {
                const estaSeleccionado = datos.runner_tipo === opcion.value;
                return (
                  <div
                    key={opcion.value}
                    onClick={() => !estaBloqueado && setDatos({ ...datos, runner_tipo: opcion.value, runner_nota: '' })}
                    className={cn(
                      "group relative aspect-[4/3] rounded-xl overflow-hidden cursor-pointer transition-all duration-300 border-2",
                      estaSeleccionado
                        ? "border-white ring-2 ring-white/50 shadow-2xl scale-[1.02]"
                        : "border-transparent opacity-70 hover:opacity-100 hover:scale-[1.02]"
                    )}
                  >
                    <img
                      src={obtenerImagenDecoracion('runner', opcion.value)}
                      alt={opcion.label}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />

                    <div className="absolute bottom-0 left-0 w-full p-4">
                      <div className="flex items-center justify-between">
                        <span className={cn(
                          "font-bold text-lg",
                          estaSeleccionado ? "text-white" : "text-white/90"
                        )}>
                          {opcion.label}
                        </span>
                        {estaSeleccionado && (
                          <div className="bg-white text-black rounded-full p-1">
                            <Check size={14} strokeWidth={3} />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Opción Otros (Tarjeta simple) */}
              <div
                onClick={() => !estaBloqueado && setDatos({ ...datos, runner_tipo: 'otros' })}
                className={cn(
                  "group relative aspect-[4/3] rounded-xl overflow-hidden cursor-pointer transition-all duration-300 border-2 bg-neutral-800 flex flex-col items-center justify-center text-center p-4",
                  datos.runner_tipo === 'otros'
                    ? "border-white ring-2 ring-white/50 shadow-2xl scale-[1.02]"
                    : "border-transparent hover:bg-neutral-700 hover:scale-[1.02]"
                )}
              >
                <div className="w-12 h-12 rounded-full bg-neutral-700 flex items-center justify-center mb-3 group-hover:bg-neutral-600">
                  <span className="text-2xl">✨</span>
                </div>
                <h3 className="font-bold text-white text-lg">Otro Estilo</h3>
                <p className="text-sm text-neutral-400 mt-1">Especificar manualmente</p>
                {datos.runner_tipo === 'otros' && (
                  <div className="absolute top-3 right-3 bg-white text-black rounded-full p-1">
                    <Check size={14} strokeWidth={3} />
                  </div>
                )}
              </div>
            </div>

            {datos.runner_tipo === 'otros' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-6"
              >
                <label className="block text-lg font-medium text-white mb-2">Especifica el tipo de runner</label>
                <input
                  type="text"
                  value={datos.runner_nota}
                  onChange={(e) => setDatos({ ...datos, runner_nota: e.target.value })}
                  disabled={estaBloqueado}
                  placeholder="Describe el tipo de runner que deseas..."
                  className="w-full px-5 py-4 text-lg border border-white/10 rounded-xl focus:ring-2 focus:ring-white focus:border-transparent outline-none bg-neutral-800 text-white placeholder:text-neutral-500 disabled:bg-neutral-700"
                  autoFocus
                />
              </motion.div>
            )}
          </div>
        );

      case 8: // Stage
        return (
          <div className="space-y-8">
            <div className="mb-6">
              <h3 className="text-3xl font-bold text-white mb-2">Paso 8: Elige el Stage</h3>
              <p className="text-xl text-neutral-400">Selecciona el tipo de stage (escenario/fondo principal)</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {[
                { value: 'globos', label: 'Globos' },
                { value: 'flores', label: 'Flores' },
              ].map((opcion) => {
                const estaSeleccionado = datos.stage_tipo === opcion.value;
                const imagenUrl = obtenerImagenDecoracion('stage', opcion.value);

                return (
                  <div
                    key={opcion.value}
                    onClick={() => !estaBloqueado && setDatos({ ...datos, stage_tipo: opcion.value, stage_color_globos: opcion.value === 'globos' ? datos.stage_color_globos : '' })}
                    className={cn(
                      "group relative aspect-[3/4] rounded-xl overflow-hidden cursor-pointer transition-all duration-300 border-2",
                      estaSeleccionado
                        ? "border-white ring-2 ring-white/50 shadow-2xl scale-[1.02]"
                        : "border-transparent opacity-70 hover:opacity-100 hover:scale-[1.02]"
                    )}
                  >
                    <img
                      src={imagenUrl}
                      alt={opcion.label}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />

                    <div className="absolute bottom-0 left-0 w-full p-6">
                      <div className="flex items-center justify-between">
                        <span className={cn(
                          "font-bold text-xl",
                          estaSeleccionado ? "text-white" : "text-white/90"
                        )}>
                          {opcion.label}
                        </span>
                        {estaSeleccionado && (
                          <div className="bg-white text-black rounded-full p-1">
                            <Check size={16} strokeWidth={3} />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {datos.stage_tipo === 'globos' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-6"
              >
                <label className="block text-lg font-medium text-white mb-2">Color(es) de los Globos</label>
                <input
                  type="text"
                  value={datos.stage_color_globos}
                  onChange={(e) => setDatos({ ...datos, stage_color_globos: e.target.value })}
                  disabled={estaBloqueado}
                  placeholder="Ej: Blanco y dorado, Rosa y verde..."
                  className="w-full px-5 py-4 text-lg border border-white/10 rounded-xl focus:ring-2 focus:ring-white focus:border-transparent outline-none bg-neutral-800 text-white placeholder:text-neutral-500 disabled:bg-neutral-700"
                  autoFocus
                />
              </motion.div>
            )}
          </div>
        );

      case 9: // Preferencias Generales
        return (
          <div className="space-y-6">
            <div className="mb-8">
              <h3 className="text-3xl font-bold text-white mb-2">Paso 9: Preferencias Generales</h3>
              <p className="text-xl text-neutral-400">Completa la información sobre el estilo y temática de tu decoración</p>
            </div>

            {/* Detalles Premium (solo si es premium) */}
            {esPremium && (
              <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200 mb-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-purple-600" />
                    Detalles Especiales Premium
                  </CardTitle>
                  <CardDescription>
                    Describe los elementos especiales que deseas para tu decoración premium
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <textarea
                    value={datos.decoracion_premium_detalles}
                    onChange={(e) => setDatos({ ...datos, decoracion_premium_detalles: e.target.value })}
                    disabled={estaBloqueado}
                    rows={4}
                    placeholder="Describe los elementos especiales que deseas: animales de peluche, estructura de columpio, arcos florales, instalaciones aéreas, etc. Sé específico con colores, tamaños y ubicación."
                    className="w-full px-4 py-3 border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent outline-none bg-background disabled:bg-muted resize-none"
                  />
                </CardContent>
              </Card>
            )}

            {/* Preferencias Generales */}
            <Card>
              <CardHeader>
                <CardTitle>Estilo y Temática</CardTitle>
                <CardDescription>
                  Completa al menos uno de estos campos para continuar
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Estilo General</label>
                    <select
                      value={datos.estilo_decoracion}
                      onChange={(e) => setDatos({ ...datos, estilo_decoracion: e.target.value, estilo_decoracion_otro: e.target.value !== 'Otro' ? '' : datos.estilo_decoracion_otro })}
                      disabled={estaBloqueado}
                      className="w-full px-4 py-3 text-base border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent outline-none bg-background disabled:bg-muted"
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
                      <option value="Otro">Otro</option>
                    </select>
                    {datos.estilo_decoracion === 'Otro' && (
                      <input
                        type="text"
                        value={datos.estilo_decoracion_otro}
                        onChange={(e) => setDatos({ ...datos, estilo_decoracion_otro: e.target.value })}
                        disabled={estaBloqueado}
                        placeholder="Especifica el estilo..."
                        className="w-full px-4 py-3 text-base border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent outline-none bg-background disabled:bg-muted mt-2"
                      />
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Temática</label>
                    <input
                      type="text"
                      value={datos.tematica}
                      onChange={(e) => setDatos({ ...datos, tematica: e.target.value })}
                      disabled={estaBloqueado}
                      placeholder="Ej: Jardín, Playa, Cuento de Hadas"
                      className="w-full px-4 py-3 text-base border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent outline-none bg-background disabled:bg-muted"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Colores Principales</label>
                  <input
                    type="text"
                    value={datos.colores_principales}
                    onChange={(e) => setDatos({ ...datos, colores_principales: e.target.value })}
                    disabled={estaBloqueado}
                    placeholder="Ej: Blanco y dorado, Rosa y verde menta"
                    className="w-full px-4 py-3 text-base border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent outline-none bg-background disabled:bg-muted"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Notas Adicionales</label>
                  <textarea
                    value={datos.notas_decoracion}
                    onChange={(e) => setDatos({ ...datos, notas_decoracion: e.target.value })}
                    disabled={estaBloqueado}
                    rows="4"
                    placeholder="Cualquier detalle especial sobre la decoración..."
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
    <form onSubmit={handleSubmit}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="max-w-5xl mx-auto"
      >
        <div className="flex items-center gap-3 mb-2">
          <span className="px-3 py-1 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 text-xs font-medium border border-purple-500/20">
            Selección Requerida
          </span>
          {esPremium && (
            <span className="px-3 py-1 rounded-full bg-yellow-500/10 text-yellow-400 text-xs font-medium border border-yellow-500/20">
              ⭐ Premium
            </span>
          )}
        </div>
        <h2 className="text-4xl font-bold text-white mb-4">Personaliza tu Decoración</h2>
        <p className="text-xl text-neutral-400 max-w-2xl mb-8">
          Completa cada paso para personalizar la decoración de tu evento. Selecciona los elementos que mejor se adapten a tu temática.
        </p>

        {/* Información Premium */}
        {esPremium && (
          <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-6 mb-8">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-purple-500/20 rounded-lg">
                <Sparkles className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <p className="font-semibold text-purple-200 mb-2">Decoración Premium Incluida</p>
                <p className="text-sm text-purple-300">
                  Tu decoración premium incluye toda la decoración básica más elementos especiales como:
                  animales de peluche, estructuras aéreas, columpio, arcos florales, etc.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Progress Steps - 9 pasos */}
        <div className="mb-12 w-full pb-4">
          <div className="flex items-center justify-between w-full px-4">
            {PASOS.map((paso, index) => {
              const esActivo = pasoActual === paso.numero;
              const esCompletado = pasoCompleto(paso.numero);

              return (
                <div key={paso.numero} className="relative flex flex-col items-center z-10 w-full">
                  {/* Line Connector */}
                  {index < PASOS.length - 1 && (
                    <div className="absolute top-5 left-1/2 w-full h-[2px] -z-10 bg-neutral-800">
                      <div
                        className="h-full bg-green-500 transition-all duration-500"
                        style={{
                          width: esCompletado ? '100%' : '0%'
                        }}
                      />
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => irAPaso(paso.numero)}
                    disabled={estaBloqueado || (!esCompletado && !esActivo && paso.numero > 1 && !pasoCompleto(paso.numero - 1))}
                    className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all duration-300",
                      esActivo
                        ? "bg-white text-black border-white scale-110 shadow-[0_0_15px_rgba(255,255,255,0.5)]"
                        : esCompletado
                          ? "bg-green-500 text-white border-green-500 hover:bg-green-600"
                          : "bg-neutral-800 text-neutral-500 border-neutral-700 hover:border-neutral-600"
                    )}
                  >
                    {esCompletado && !esActivo ? <Check size={16} /> : paso.numero}
                  </button>
                  <span className={cn(
                    "absolute -bottom-8 text-xs font-medium whitespace-nowrap transition-colors duration-300",
                    esActivo ? "text-white scale-105 font-bold" : esCompletado ? "text-green-400" : "text-neutral-500"
                  )}>
                    {paso.titulo}
                  </span>
                </div>
              );
            })}
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
                disabled={guardando || estaBloqueado || !pasoCompleto(pasoActual)}
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
    </form >
  );
}

export default SeccionDecoracion;
