import { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Save, 
  Loader2, 
  Lock,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
} from 'lucide-react';
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
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold mb-2">Paso 1: Elige el Color de los Cojines</h3>
              <p className="text-muted-foreground">Selecciona el color de los cojines para las sillas</p>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-6">
              {[
                { value: 'negros', label: 'Negros' },
                { value: 'blancos', label: 'Blancos' }
              ].map((opcion) => (
                <button
                  key={opcion.value}
                  type="button"
                  onClick={() => setDatos({ ...datos, cojines_color: opcion.value })}
                  disabled={estaBloqueado}
                  className={cn(
                    "p-8 rounded-xl border-2 transition-all duration-200 hover:scale-105 text-center",
                    datos.cojines_color === opcion.value
                      ? "border-primary bg-primary/10 shadow-lg"
                      : "border-border bg-card hover:border-primary/50"
                  )}
                >
                  <p className="text-2xl font-semibold mb-2">{opcion.label}</p>
                  {datos.cojines_color === opcion.value && (
                    <Badge variant="default" className="text-base px-3 py-1">Seleccionado</Badge>
                  )}
                </button>
              ))}
            </div>
            {datos.cojines_color && (
              <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
                <CardContent className="pt-6">
                  <div className="text-center mb-4">
                    <h4 className="text-xl font-bold mb-2">Vista Previa</h4>
                    <p className="text-sm text-muted-foreground">Cojines {datos.cojines_color}</p>
                  </div>
                  <div className="flex justify-center">
                    <ImagenSeleccion
                      urlImagen={obtenerImagenDecoracion('cojin', datos.cojines_color)}
                      alt={`Cojines ${datos.cojines_color}`}
                      tamaño="extra-large"
                    />
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        );

      case 2: // Centro de Mesa
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold mb-2">Paso 2: Elige el Centro de Mesa</h3>
              <p className="text-muted-foreground">Selecciona el tipo de centro de mesa para tus mesas</p>
            </div>
            <select
              value={datos.centro_mesa_1}
              onChange={(e) => setDatos({ ...datos, centro_mesa_1: e.target.value })}
              disabled={estaBloqueado}
              className="w-full px-4 py-4 text-lg border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent outline-none bg-background disabled:bg-muted disabled:cursor-not-allowed mb-6"
            >
              <option value="">Selecciona un centro de mesa...</option>
              {CENTROS_OPCIONES.map(opcion => (
                <option key={opcion.value} value={opcion.value}>{opcion.label}</option>
              ))}
            </select>
            {datos.centro_mesa_1 && (
              <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
                <CardContent className="pt-6">
                  <div className="text-center mb-4">
                    <h4 className="text-xl font-bold mb-2">Vista Previa</h4>
                    <p className="text-sm text-muted-foreground">
                      {CENTROS_OPCIONES.find(c => c.value === datos.centro_mesa_1)?.label}
                    </p>
                    {datos.centro_mesa_1 === 'cilindro' && (
                      <p className="text-xs text-purple-600 mt-1">💡 Incluye 3 cilindros por mesa</p>
                    )}
                  </div>
                  <div className="flex justify-center">
                    <ImagenSeleccion
                      urlImagen={obtenerImagenDecoracion('centro_mesa', datos.centro_mesa_1)}
                      alt={`Centro de mesa ${datos.centro_mesa_1}`}
                      tamaño="extra-large"
                    />
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        );

      case 3: // Base
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold mb-2">Paso 3: Elige la Base</h3>
              <p className="text-muted-foreground">Selecciona el tipo de base para el centro de mesa</p>
            </div>
            <select
              value={datos.base_color}
              onChange={(e) => setDatos({ ...datos, base_color: e.target.value })}
              disabled={estaBloqueado}
              className="w-full px-4 py-4 text-lg border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent outline-none bg-background disabled:bg-muted disabled:cursor-not-allowed mb-6"
            >
              <option value="">Selecciona una base...</option>
              {BASE_OPCIONES.map(opcion => (
                <option key={opcion.value} value={opcion.value}>{opcion.label}</option>
              ))}
            </select>
            {datos.base_color && (
              <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
                <CardContent className="pt-6">
                  <div className="text-center mb-4">
                    <h4 className="text-xl font-bold mb-2">Vista Previa</h4>
                    <p className="text-sm text-muted-foreground">
                      {BASE_OPCIONES.find(b => b.value === datos.base_color)?.label}
                    </p>
                  </div>
                  <div className="flex justify-center">
                    <ImagenSeleccion
                      urlImagen={obtenerImagenDecoracion('base', datos.base_color)}
                      alt={`Base ${datos.base_color}`}
                      tamaño="extra-large"
                    />
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        );

      case 4: // Challer
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold mb-2">Paso 4: Elige el Challer</h3>
              <p className="text-muted-foreground">Selecciona el color del challer (cargador de plato)</p>
            </div>
            <select
              value={datos.challer_color}
              onChange={(e) => setDatos({ ...datos, challer_color: e.target.value })}
              disabled={estaBloqueado}
              className="w-full px-4 py-4 text-lg border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent outline-none bg-background disabled:bg-muted disabled:cursor-not-allowed mb-6"
            >
              <option value="">Selecciona un challer...</option>
              {CHALLER_OPCIONES.map(opcion => (
                <option key={opcion.value} value={opcion.value}>{opcion.label}</option>
              ))}
            </select>
            {datos.challer_color && (
              <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
                <CardContent className="pt-6">
                  <div className="text-center mb-4">
                    <h4 className="text-xl font-bold mb-2">Vista Previa</h4>
                    <p className="text-sm text-muted-foreground">
                      {CHALLER_OPCIONES.find(c => c.value === datos.challer_color)?.label}
                    </p>
                  </div>
                  <div className="flex justify-center">
                    <ImagenSeleccion
                      urlImagen={obtenerImagenDecoracion('challer', datos.challer_color)}
                      alt={`Challer ${datos.challer_color}`}
                      tamaño="extra-large"
                    />
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        );

      case 5: // Servilletas
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold mb-2">Paso 5: Elige el Color de las Servilletas</h3>
              <p className="text-muted-foreground">Selecciona el color de las servilletas para tu evento</p>
            </div>
            <select
              value={datos.servilletas_color}
              onChange={(e) => setDatos({ ...datos, servilletas_color: e.target.value })}
              disabled={estaBloqueado}
              className="w-full px-4 py-4 text-lg border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent outline-none bg-background disabled:bg-muted disabled:cursor-not-allowed mb-6"
            >
              <option value="">Selecciona un color...</option>
              {SERVILLETAS_OPCIONES.map(opcion => (
                <option key={opcion.color} value={opcion.color}>
                  {opcion.label} {opcion.cantidad_disponible !== Infinity && `(${opcion.cantidad_disponible} disponibles)`}
                </option>
              ))}
            </select>
            {datos.servilletas_color && (
              <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
                <CardContent className="pt-6">
                  <div className="text-center mb-4">
                    <h4 className="text-xl font-bold mb-2">Vista Previa</h4>
                    <p className="text-sm text-muted-foreground">
                      Servilletas {SERVILLETAS_OPCIONES.find(s => s.color === datos.servilletas_color)?.label}
                    </p>
                  </div>
                  <div className="flex justify-center">
                    <ImagenSeleccion
                      urlImagen={obtenerImagenDecoracion('servilleta', datos.servilletas_color)}
                      alt={`Servilleta ${datos.servilletas_color}`}
                      tamaño="extra-large"
                    />
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        );

      case 6: // Aros
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold mb-2">Paso 6: Elige los Aros</h3>
              <p className="text-muted-foreground">Selecciona el tipo de aros (anillos para servilleta)</p>
            </div>
            <select
              value={datos.aros_color}
              onChange={(e) => setDatos({ ...datos, aros_color: e.target.value, aros_nota: e.target.value !== 'otro' ? '' : datos.aros_nota })}
              disabled={estaBloqueado}
              className="w-full px-4 py-4 text-lg border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent outline-none bg-background disabled:bg-muted disabled:cursor-not-allowed mb-4"
            >
              <option value="">Selecciona un tipo de aro...</option>
              {AROS_OPCIONES.map(opcion => (
                <option key={opcion.value} value={opcion.value}>{opcion.label}</option>
              ))}
              <option value="otro">Otro (especificar)</option>
            </select>
            {datos.aros_color === 'otro' && (
              <input
                type="text"
                value={datos.aros_nota}
                onChange={(e) => setDatos({ ...datos, aros_nota: e.target.value })}
                disabled={estaBloqueado}
                placeholder="Especifica el tipo de aro..."
                className="w-full px-4 py-4 text-lg border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent outline-none bg-background disabled:bg-muted mb-4"
              />
            )}
            {datos.aros_color && datos.aros_color !== 'otro' && (
              <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
                <CardContent className="pt-6">
                  <div className="text-center mb-4">
                    <h4 className="text-xl font-bold mb-2">Vista Previa</h4>
                    <p className="text-sm text-muted-foreground">
                      {AROS_OPCIONES.find(a => a.value === datos.aros_color)?.label}
                    </p>
                  </div>
                  <div className="flex justify-center">
                    <ImagenSeleccion
                      urlImagen={obtenerImagenDecoracion('aros', datos.aros_color)}
                      alt={`Aro ${datos.aros_color}`}
                      tamaño="extra-large"
                    />
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        );

      case 7: // Runner
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold mb-2">Paso 7: Elige el Runner</h3>
              <p className="text-muted-foreground">Selecciona el tipo de runner (camino de mesa)</p>
            </div>
            <select
              value={datos.runner_tipo}
              onChange={(e) => setDatos({ ...datos, runner_tipo: e.target.value, runner_nota: e.target.value !== 'otros' ? '' : datos.runner_nota })}
              disabled={estaBloqueado}
              className="w-full px-4 py-4 text-lg border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent outline-none bg-background disabled:bg-muted disabled:cursor-not-allowed mb-4"
            >
              <option value="">Selecciona un tipo de runner...</option>
              {RUNNER_OPCIONES.map(opcion => (
                <option key={opcion.value} value={opcion.value}>{opcion.label}</option>
              ))}
              <option value="otros">Otros (especificar)</option>
            </select>
            {datos.runner_tipo === 'otros' && (
              <input
                type="text"
                value={datos.runner_nota}
                onChange={(e) => setDatos({ ...datos, runner_nota: e.target.value })}
                disabled={estaBloqueado}
                placeholder="Especifica el tipo de runner..."
                className="w-full px-4 py-4 text-lg border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent outline-none bg-background disabled:bg-muted mb-4"
              />
            )}
            {datos.runner_tipo && datos.runner_tipo !== 'otros' && (
              <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
                <CardContent className="pt-6">
                  <div className="text-center mb-4">
                    <h4 className="text-xl font-bold mb-2">Vista Previa</h4>
                    <p className="text-sm text-muted-foreground">
                      {RUNNER_OPCIONES.find(r => r.value === datos.runner_tipo)?.label}
                    </p>
                  </div>
                  <div className="flex justify-center">
                    <ImagenSeleccion
                      urlImagen={obtenerImagenDecoracion('runner', datos.runner_tipo)}
                      alt={`Runner ${datos.runner_tipo}`}
                      tamaño="extra-large"
                    />
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        );

      case 8: // Stage
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold mb-2">Paso 8: Elige el Stage</h3>
              <p className="text-muted-foreground">Selecciona el tipo de stage (escenario/fondo principal)</p>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-6">
              {[
                { value: 'globos', label: 'Globos' },
                { value: 'flores', label: 'Flores' }
              ].map((opcion) => (
                <button
                  key={opcion.value}
                  type="button"
                  onClick={() => setDatos({ ...datos, stage_tipo: opcion.value })}
                  disabled={estaBloqueado}
                  className={cn(
                    "p-8 rounded-xl border-2 transition-all duration-200 hover:scale-105 text-center",
                    datos.stage_tipo === opcion.value
                      ? "border-primary bg-primary/10 shadow-lg"
                      : "border-border bg-card hover:border-primary/50"
                  )}
                >
                  <p className="text-2xl font-semibold mb-2">{opcion.label}</p>
                  {datos.stage_tipo === opcion.value && (
                    <Badge variant="default" className="text-base px-3 py-1">Seleccionado</Badge>
                  )}
                </button>
              ))}
            </div>
            {datos.stage_tipo === 'globos' && (
              <div>
                <label className="block text-lg font-medium mb-2">Color(es) de los Globos</label>
                <input
                  type="text"
                  value={datos.stage_color_globos}
                  onChange={(e) => setDatos({ ...datos, stage_color_globos: e.target.value })}
                  disabled={estaBloqueado}
                  placeholder="Ej: Blanco y dorado, Rosa y verde..."
                  className="w-full px-4 py-4 text-lg border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent outline-none bg-background disabled:bg-muted"
                />
              </div>
            )}
          </div>
        );

      case 9: // Preferencias Generales
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold mb-2">Paso 9: Preferencias Generales</h3>
              <p className="text-muted-foreground">Completa la información sobre el estilo y temática de tu decoración</p>
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
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-4">
          <Sparkles className="w-8 h-8 text-purple-600" />
        </div>
        <h2 className="text-3xl font-bold mb-2">Personaliza tu Decoración</h2>
        <p className="text-muted-foreground">
          Completa cada paso para personalizar la decoración de tu evento
        </p>
        {esPremium && (
          <Badge variant="secondary" className="mt-3 text-base px-4 py-1">
            ⭐ Decoración Premium
          </Badge>
        )}
      </div>

      {/* Información Premium */}
      {esPremium && (
        <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Sparkles className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="font-semibold text-purple-900 mb-2">Decoración Premium Incluida</p>
                <p className="text-sm text-purple-700">
                  Tu decoración premium incluye toda la decoración básica más elementos especiales como: 
                  animales de peluche, estructuras aéreas, columpio, arcos florales, etc.
                </p>
              </div>
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
              disabled={guardando || estaBloqueado || !pasoCompleto(pasoActual)}
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

export default SeccionDecoracion;
