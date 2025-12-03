# Análisis Crear Oferta - Bugs y Mejoras Propuestas

## 📋 Resumen Ejecutivo

He realizado un análisis profundo del componente **CrearOferta.jsx** (5288 líneas) y he identificado los problemas principales, sus causas raíz y soluciones propuestas.

---

## 🐛 Problemas Identificados

### 1. **Eventos Duplicados en el Calendario del Paso 2**

#### Causa Raíz:
- La función `obtenerEventosTodosVendedores` en el backend puede devolver eventos duplicados cuando múltiples vendedores comparten el mismo calendario de Google
- **Backend**: En `backend/src/routes/salones.routes.js` (líneas 516-524) SÍ se deduplica correctamente
- **Backend**: En `backend/src/routes/googleCalendar.routes.js` (líneas 561-602) NO se deduplica
- **Frontend**: El código que recibe y muestra los eventos NO deduplica

#### Flujo Actual del Problema:
```javascript
// 1. Frontend hace request (CrearOferta.jsx:321)
GET /api/google-calendar/eventos/todos-vendedores/${mes}/${año}

// 2. Backend en googleCalendar.routes.js (línea 561) llama:
eventosGoogleCalendar = await obtenerEventosTodosVendedores(fechaInicio, fechaFin);

// 3. obtenerEventosTodosVendedores (googleCalendarService.js:1120-1135)
// Itera sobre TODOS los vendedores con Google Calendar conectado
for (const vendedor of vendedores) {
  const eventos = await obtenerEventosCalendarioPrincipal(vendedor.id, ...);
  // Si múltiples vendedores comparten el mismo calendario, 
  // el mismo evento se agrega múltiples veces
  todosLosEventos.push(...eventos);
}

// 4. El endpoint NO deduplica antes de retornar (líneas 572-602)
// 5. Frontend recibe eventos duplicados
// 6. Frontend muestra los duplicados en el calendario
```

#### Código Problemático:
```javascript
// frontend-vendedor/src/pages/CrearOferta.jsx:2184
const obtenerEventosDelDia = (dia) => {
  if (!eventosCalendario?.eventos_por_dia) {
    return [];
  }
  
  let eventos = eventosCalendario.eventos_por_dia[dia] || [];
  // NO HAY DEDUPLICACIÓN AQUÍ
  
  eventos = eventos.filter(evento => {
    return evento.es_google_calendar === true || 
           evento.calendario === 'principal' || 
           evento.calendario === 'citas';
  });
  // ... más filtros pero nunca deduplica por ID
}
```

---

### 2. **No Bloquea Correctamente las Horas Ocupadas del Google Calendar**

#### Causa Raíz:
Hay **DOS fuentes de verdad** desincronizadas:

1. **Query para MOSTRAR eventos** (CrearOferta.jsx:318-328):
   - Endpoint: `/google-calendar/eventos/todos-vendedores/:mes/:año`
   - Propósito: Mostrar eventos en el calendario visual
   - Problema: Devuelve eventos duplicados (ver problema #1)

2. **Endpoint para CALCULAR horas ocupadas** (CrearOferta.jsx:984-1017):
   - Endpoint: `/salones/horarios-ocupados`
   - Propósito: Calcular qué horas están ocupadas para bloquear
   - Este SÍ funciona correctamente (deduplica en backend líneas 516-524)

#### El Problema Real:
El frontend tiene su propia función para calcular horas ocupadas desde los eventos del calendario (líneas 2312-2493), que:
- Recibe eventos duplicados
- Tiene lógica compleja de filtrado por salón
- Puede no coincidir con lo que devuelve el backend
- Se usa para MOSTRAR los eventos, pero no necesariamente para BLOQUEAR

#### Inconsistencia:
```javascript
// MOSTRAR (usa eventos duplicados):
const eventosDelDia = obtenerEventosDelDia(dia); // Duplicados

// BLOQUEAR (usa backend correcto):
const horasOcupadas = await obtenerHorasOcupadas(salonId, fecha);
// Este SÍ deduplica en backend

// RESULTADO: Se muestran eventos duplicados pero se bloquean las horas correctas
// Esto confunde al usuario porque ve 2 eventos pero solo 1 bloquea horas
```

---

### 3. **Código Extremadamente Largo y Difícil de Mantener**

#### Estadísticas:
- **CrearOferta.jsx**: 5288 líneas en un solo archivo
- **Complejidad**: Mezcla lógica de negocio, UI, estado, validaciones, cálculos
- **Múltiples responsabilidades**: Wizard, calendario, precios, servicios, validaciones

#### Problemas de Mantenibilidad:
- Difícil de entender el flujo completo
- Cambios en una parte pueden romper otras
- Debugging complejo
- Onboarding de nuevos desarrolladores muy lento
- Testing casi imposible

---

### 4. **Lógica Duplicada y Parcheada**

#### Ejemplos de Duplicación:

1. **Múltiples funciones para formatear fechas**:
   - `obtenerFechaMinima()` (línea 104)
   - `formatearFechaParaInput()` (línea 2176)
   - `extraerFechaStr()` en backend (línea 372)

2. **Múltiples funciones para obtener eventos**:
   - `obtenerEventosDelDia()` (línea 2184)
   - `eventosDiaSeleccionado` (línea 2724)
   - Query `eventosCalendario` (línea 318)

3. **Múltiples validaciones de horarios**:
   - `validarHorarios()` (línea 114)
   - `verificarRangoOcupado()` (línea 153)
   - `verificarRangoOcupadoConHoras()` (línea 1020)

#### Comentarios que Revelan Parches:
```javascript
// Línea 2192: "NO mostrar contratos ni ofertas de la base de datos porque tienen bugs"
// Línea 826: "NO procesar contratos de BD para bloquear horas"
// Línea 1004: "El backend ya retorna TODAS las horas ocupadas correctamente"
// Línea 2399: "FIX: Los eventos que vienen de /eventos/todos-vendedores son solo de Google Calendar"
```

Estos comentarios indican que el código ha sido parcheado múltiples veces para solucionar bugs sin refactorizar la causa raíz.

---

## 💡 Soluciones Propuestas

### Solución 1: Deduplicar Eventos en el Backend

#### Cambio en `backend/src/routes/googleCalendar.routes.js`

**Antes (líneas 557-602):**
```javascript
// Obtener eventos de Google Calendar de todos los vendedores (sin detalles)
let eventosGoogleCalendar = [];
try {
  eventosGoogleCalendar = await obtenerEventosTodosVendedores(fechaInicio, fechaFin);
} catch (error) {
  logger.warn('Error al obtener eventos de Google Calendar:', error);
}

// Mapear directamente sin deduplicar
const eventosCombinados = [
  ...eventosGoogleCalendar.map(e => ({...}))
];
```

**Después:**
```javascript
// Obtener eventos de Google Calendar de todos los vendedores (sin detalles)
let eventosGoogleCalendarRaw = [];
try {
  eventosGoogleCalendarRaw = await obtenerEventosTodosVendedores(fechaInicio, fechaFin);
} catch (error) {
  logger.warn('Error al obtener eventos de Google Calendar:', error);
}

// IMPORTANTE: Deduplicar eventos por ID
// (pueden venir duplicados si múltiples vendedores comparten calendario)
const eventosVistos = new Set();
const eventosGoogleCalendar = eventosGoogleCalendarRaw.filter(evento => {
  if (eventosVistos.has(evento.id)) {
    return false;
  }
  eventosVistos.add(evento.id);
  return true;
});

logger.info(`📅 Eventos deduplicados: ${eventosGoogleCalendar.length} (de ${eventosGoogleCalendarRaw.length} originales)`);

// Mapear eventos deduplicados
const eventosCombinados = [
  ...eventosGoogleCalendar.map(e => ({...}))
];
```

---

### Solución 2: Simplificar la Lógica de Eventos en el Frontend

#### Cambio en `frontend-vendedor/src/pages/CrearOferta.jsx`

**Problema Actual**: El frontend procesa eventos dos veces con lógica inconsistente

**Solución**: Confiar en el backend para horas ocupadas y solo usar el frontend para mostrar

**Crear función helper de deduplicación (línea ~2180):**
```javascript
// Función helper para deduplicar eventos por ID
const deduplicarEventos = (eventos) => {
  const eventosVistos = new Set();
  return eventos.filter(evento => {
    // Generar ID único considerando diferentes formatos
    const eventoId = evento.id || `${evento.fecha_inicio}_${evento.ubicacion}_${evento.titulo}`;
    
    if (eventosVistos.has(eventoId)) {
      return false; // Ya existe, eliminarlo
    }
    
    eventosVistos.add(eventoId);
    return true;
  });
};
```

**Modificar obtenerEventosDelDia (línea 2184):**
```javascript
const obtenerEventosDelDia = (dia) => {
  if (!eventosCalendario?.eventos_por_dia) {
    return [];
  }

  let eventos = eventosCalendario.eventos_por_dia[dia] || [];

  // IMPORTANTE: Solo mostrar eventos de Google Calendar
  eventos = eventos.filter(evento => {
    return evento.es_google_calendar === true || 
           evento.calendario === 'principal' || 
           evento.calendario === 'citas';
  });

  // NUEVO: Deduplicar eventos por ID
  eventos = deduplicarEventos(eventos);

  // Filtrar eventos pasados - solo mostrar eventos de hoy en adelante
  const ahoraMiami = new Date(new Date().toLocaleString("en-US", { timeZone: "America/New_York" }));
  const hoyMiami = new Date(ahoraMiami.getFullYear(), ahoraMiami.getMonth(), ahoraMiami.getDate());
  hoyMiami.setHours(0, 0, 0, 0);

  eventos = eventos.filter(evento => {
    let fechaEvento;
    if (evento.fecha_evento) {
      fechaEvento = new Date(evento.fecha_evento);
    } else if (evento.fecha_inicio) {
      fechaEvento = new Date(evento.fecha_inicio);
    } else if (evento.hora_inicio) {
      fechaEvento = new Date(evento.hora_inicio);
    } else {
      return false;
    }

    const fechaEventoMiami = new Date(fechaEvento.toLocaleString("en-US", { timeZone: "America/New_York" }));

    if (evento.es_todo_el_dia) {
      const fechaEventoSolo = new Date(fechaEventoMiami.getFullYear(), fechaEventoMiami.getMonth(), fechaEventoMiami.getDate());
      fechaEventoSolo.setHours(0, 0, 0, 0);
      return fechaEventoSolo >= hoyMiami;
    }

    return fechaEventoMiami >= hoyMiami;
  });

  // Filtrar según los filtros de salones activos
  eventos = eventos.filter(evento => {
    let nombreSalon = '';
    if (evento.salones?.nombre) {
      nombreSalon = String(evento.salones.nombre).toLowerCase();
    } else if (evento.salon) {
      nombreSalon = String(evento.salon).toLowerCase();
    } else if (evento.ubicacion) {
      nombreSalon = String(evento.ubicacion).toLowerCase();
    }

    nombreSalon = nombreSalon.toLowerCase().trim().replace(/\s+/g, ' ');

    // Verificar contra los filtros activos
    if (nombreSalon.includes('diamond')) {
      return filtrosSalones.diamond;
    }
    if (nombreSalon.includes('doral') && !nombreSalon.includes('diamond')) {
      return filtrosSalones.doral;
    }
    if (nombreSalon.includes('kendall') || nombreSalon.includes('kendal')) {
      return filtrosSalones.kendall;
    }

    // Si no tiene salón asignado o es un salón no reconocido, usar filtro "otros"
    return filtrosSalones.otros;
  });

  return eventos;
};
```

---

### Solución 3: Refactorizar en Componentes Separados

#### Estructura Propuesta:

```
frontend-vendedor/src/
├── pages/
│   └── CrearOferta.jsx (reducido a ~500 líneas - solo orchestration)
├── components/
│   ├── crear-oferta/
│   │   ├── Paso1ClienteYSalon.jsx (300 líneas)
│   │   ├── Paso2DetallesEvento.jsx (400 líneas)
│   │   ├── Paso3PaqueteYTemporada.jsx (350 líneas)
│   │   ├── Paso4ServiciosAdicionales.jsx (450 líneas)
│   │   ├── Paso5Resumen.jsx (250 líneas)
│   │   ├── CalendarioEventos.jsx (400 líneas)
│   │   ├── CalculadoraPrecio.jsx (300 líneas)
│   │   ├── SeccionServiciosIncluidos.jsx (200 líneas)
│   │   └── SeccionServiciosAdicionales.jsx (300 líneas)
│   └── ...
├── hooks/
│   ├── useEventosCalendario.js (manejo de eventos)
│   ├── useHorasOcupadas.js (validación de disponibilidad)
│   ├── useCalculoPrecio.js (cálculos de precio)
│   └── useValidacionOferta.js (validaciones del formulario)
└── utils/
    ├── calendarioHelpers.js (formateo de fechas, deduplicación)
    ├── precioHelpers.js (cálculos de precio)
    └── validacionesHelpers.js (validaciones)
```

#### Ejemplo: `useEventosCalendario.js` Hook

```javascript
import { useQuery } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';
import api from '../config/api';
import { deduplicarEventos, filtrarEventosPorSalon } from '../utils/calendarioHelpers';

export function useEventosCalendario(mes, año, salonId, filtrosSalones) {
  // Query para obtener eventos del calendario
  const { data: eventosCalendario, isLoading } = useQuery({
    queryKey: ['calendario-ofertas', mes, año, salonId],
    queryFn: async () => {
      const response = await api.get(`/google-calendar/eventos/todos-vendedores/${mes}/${año}`);
      return response.data;
    },
    enabled: !!salonId && salonId !== '',
    staleTime: 5 * 60 * 1000,
    refetchInterval: false,
    refetchOnWindowFocus: false,
  });

  // Función para obtener eventos de un día específico (con deduplicación)
  const obtenerEventosDelDia = useCallback((dia) => {
    if (!eventosCalendario?.eventos_por_dia) {
      return [];
    }

    let eventos = eventosCalendario.eventos_por_dia[dia] || [];

    // Filtrar solo eventos de Google Calendar
    eventos = eventos.filter(evento => {
      return evento.es_google_calendar === true || 
             evento.calendario === 'principal' || 
             evento.calendario === 'citas';
    });

    // IMPORTANTE: Deduplicar eventos
    eventos = deduplicarEventos(eventos);

    // Filtrar eventos pasados
    const ahoraMiami = new Date(new Date().toLocaleString("en-US", { timeZone: "America/New_York" }));
    const hoyMiami = new Date(ahoraMiami.getFullYear(), ahoraMiami.getMonth(), ahoraMiami.getDate());
    hoyMiami.setHours(0, 0, 0, 0);

    eventos = eventos.filter(evento => {
      const fechaEvento = new Date(evento.fecha_evento || evento.fecha_inicio || evento.hora_inicio);
      if (!fechaEvento || isNaN(fechaEvento.getTime())) return false;

      const fechaEventoMiami = new Date(fechaEvento.toLocaleString("en-US", { timeZone: "America/New_York" }));

      if (evento.es_todo_el_dia) {
        const fechaEventoSolo = new Date(fechaEventoMiami.getFullYear(), fechaEventoMiami.getMonth(), fechaEventoMiami.getDate());
        fechaEventoSolo.setHours(0, 0, 0, 0);
        return fechaEventoSolo >= hoyMiami;
      }

      return fechaEventoMiami >= hoyMiami;
    });

    // Filtrar por salones activos
    eventos = filtrarEventosPorSalon(eventos, filtrosSalones);

    return eventos;
  }, [eventosCalendario, filtrosSalones]);

  return {
    eventosCalendario,
    isLoading,
    obtenerEventosDelDia
  };
}
```

#### Ejemplo: `utils/calendarioHelpers.js`

```javascript
/**
 * Deduplica un array de eventos por su ID
 * @param {Array} eventos - Array de eventos
 * @returns {Array} Array de eventos sin duplicados
 */
export function deduplicarEventos(eventos) {
  const eventosVistos = new Set();
  
  return eventos.filter(evento => {
    // Generar ID único considerando diferentes formatos
    const eventoId = evento.id || `${evento.fecha_inicio}_${evento.ubicacion}_${evento.titulo}`;
    
    if (eventosVistos.has(eventoId)) {
      return false; // Ya existe, eliminarlo
    }
    
    eventosVistos.add(eventoId);
    return true;
  });
}

/**
 * Filtra eventos según los filtros de salones activos
 * @param {Array} eventos - Array de eventos
 * @param {Object} filtrosSalones - Objeto con filtros activos
 * @returns {Array} Array de eventos filtrados
 */
export function filtrarEventosPorSalon(eventos, filtrosSalones) {
  return eventos.filter(evento => {
    const nombreSalon = obtenerNombreSalon(evento);
    
    if (nombreSalon.includes('diamond')) {
      return filtrosSalones.diamond;
    }
    if (nombreSalon.includes('doral') && !nombreSalon.includes('diamond')) {
      return filtrosSalones.doral;
    }
    if (nombreSalon.includes('kendall') || nombreSalon.includes('kendal')) {
      return filtrosSalones.kendall;
    }
    
    // Si no tiene salón o es desconocido, usar filtro "otros"
    return filtrosSalones.otros;
  });
}

/**
 * Obtiene el nombre del salón de un evento, normalizándolo
 * @param {Object} evento - Evento
 * @returns {string} Nombre normalizado del salón
 */
export function obtenerNombreSalon(evento) {
  let nombreSalon = '';
  
  if (evento.salones?.nombre) {
    nombreSalon = String(evento.salones.nombre);
  } else if (evento.salon) {
    nombreSalon = String(evento.salon);
  } else if (evento.ubicacion) {
    nombreSalon = String(evento.ubicacion);
  }
  
  return nombreSalon.toLowerCase().trim().replace(/\s+/g, ' ');
}

/**
 * Formatea una fecha para input (YYYY-MM-DD)
 * @param {number} dia - Día del mes
 * @param {number} mes - Mes (1-12)
 * @param {number} año - Año
 * @returns {string} Fecha en formato YYYY-MM-DD
 */
export function formatearFechaParaInput(dia, mes, año) {
  return `${año}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
}

/**
 * Obtiene la fecha mínima permitida (hoy en Miami)
 * @returns {string} Fecha en formato YYYY-MM-DD
 */
export function obtenerFechaMinima() {
  const ahoraMiami = new Date(new Date().toLocaleString("en-US", { timeZone: "America/New_York" }));
  const year = ahoraMiami.getFullYear();
  const month = String(ahoraMiami.getMonth() + 1).padStart(2, '0');
  const day = String(ahoraMiami.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
```

---

### Solución 4: Eliminar Lógica Duplicada y Confiar en el Backend

#### Simplificar Validación de Disponibilidad

**ANTES**: El frontend tiene dos funciones que calculan horas ocupadas
1. `obtenerHorasOcupadasDelCalendario()` (línea 2147) - desde eventos visuales (con bugs)
2. `obtenerHorasOcupadas()` (línea 984) - desde endpoint backend (correcto)

**DESPUÉS**: Eliminar la función #1 y solo usar #2

```javascript
// ELIMINAR: función obtenerHorasOcupadasDelCalendario (líneas 2147-2493)

// MANTENER SOLO: función obtenerHorasOcupadas que llama al backend
const obtenerHorasOcupadas = async (salonId, fechaEvento) => {
  if (!salonId || salonId === 'otro' || !fechaEvento) {
    setHorasOcupadas([]);
    return [];
  }

  try {
    setCargandoHorasOcupadas(true);
    const response = await api.get('/salones/horarios-ocupados', {
      params: {
        salon_id: salonId,
        fecha_evento: fechaEvento
      }
    });

    if (response.data.success) {
      const horasBackend = response.data.horasOcupadas || [];
      // El backend ya deduplica, filtra por salón, y calcula correctamente
      setHorasOcupadas(horasBackend);
      return horasBackend;
    }
    return [];
  } catch (error) {
    console.error('Error al obtener horas ocupadas:', error);
    setHorasOcupadas([]);
    return [];
  } finally {
    setCargandoHorasOcupadas(false);
  }
};

// USO: Confiar completamente en el backend
useEffect(() => {
  if (formData.salon_id && formData.fecha_evento) {
    obtenerHorasOcupadas(formData.salon_id, formData.fecha_evento);
  }
}, [formData.salon_id, formData.fecha_evento]);
```

---

## 📊 Plan de Implementación (Fases)

### Fase 1: Fixes Críticos (1-2 días) ⚡ PRIORITARIO

1. **Fix Backend - Deduplicación**: Agregar deduplicación en `googleCalendar.routes.js`
2. **Fix Frontend - Deduplicación**: Agregar función `deduplicarEventos` en `obtenerEventosDelDia`
3. **Testing**: Verificar que no haya eventos duplicados

**Archivos a modificar**:
- `backend/src/routes/googleCalendar.routes.js` (agregar deduplicación en línea 561)
- `frontend-vendedor/src/pages/CrearOferta.jsx` (agregar deduplicación en línea 2184)

### Fase 2: Simplificación de Lógica (3-5 días)

1. **Crear archivo `calendarioHelpers.js`** con funciones utilitarias
2. **Eliminar función duplicada** de cálculo de horas ocupadas del frontend
3. **Simplificar `obtenerEventosDelDia`** usando helpers
4. **Testing exhaustivo** de disponibilidad y bloqueo de horas

**Archivos a crear/modificar**:
- `frontend-vendedor/src/utils/calendarioHelpers.js` (nuevo)
- `frontend-vendedor/src/pages/CrearOferta.jsx` (simplificar líneas 2147-2493)

### Fase 3: Refactorización en Componentes (1-2 semanas)

1. **Crear hooks personalizados**:
   - `useEventosCalendario.js`
   - `useHorasOcupadas.js`
   - `useCalculoPrecio.js`
   - `useValidacionOferta.js`

2. **Extraer componentes por paso**:
   - `Paso1ClienteYSalon.jsx`
   - `Paso2DetallesEvento.jsx`
   - `Paso3PaqueteYTemporada.jsx`
   - `Paso4ServiciosAdicionales.jsx`
   - `Paso5Resumen.jsx`

3. **Extraer componentes compartidos**:
   - `CalendarioEventos.jsx`
   - `CalculadoraPrecio.jsx`
   - `SeccionServiciosIncluidos.jsx`
   - `SeccionServiciosAdicionales.jsx`

4. **Reducir `CrearOferta.jsx`** a ~500 líneas (solo orchestration)

5. **Testing completo** de cada componente

---

## ✅ Beneficios Esperados

### Inmediatos (Fase 1):
- ✅ **No más eventos duplicados** en el calendario
- ✅ **Bloqueo correcto de horas ocupadas**
- ✅ **Mejor experiencia de usuario**

### Corto Plazo (Fase 2):
- ✅ **Código más limpio y mantenible**
- ✅ **Menos bugs por lógica duplicada**
- ✅ **Rendimiento mejorado** (menos cálculos redundantes)

### Largo Plazo (Fase 3):
- ✅ **Mantenibilidad drásticamente mejorada** (5288 → ~500 líneas en archivo principal)
- ✅ **Componentes reutilizables** para otras partes de la app
- ✅ **Testing más fácil** (componentes pequeños y enfocados)
- ✅ **Onboarding más rápido** para nuevos desarrolladores
- ✅ **Menos riesgo de introducir bugs** al hacer cambios

---

## 🚀 Próximos Pasos

### Acción Inmediata Recomendada:

1. **Revisar y aprobar** este análisis
2. **Implementar Fase 1** (fixes críticos) - 1-2 días
3. **Testing** de los fixes en desarrollo
4. **Deploy a producción** de Fase 1
5. **Evaluar resultados** antes de continuar con Fase 2

### Preguntas para el Usuario:

1. ¿Quieres que implemente la **Fase 1** (fixes críticos) ahora mismo?
2. ¿Prefieres una implementación gradual (Fase 1 → Fase 2 → Fase 3) o agresiva (todo junto)?
3. ¿Hay alguna funcionalidad específica del calendario que no esté funcionando como esperas que deba ser prioritaria?

---

## 📝 Notas Técnicas Adicionales

### Consideraciones de Zona Horaria:
- Todos los cálculos de fecha/hora deben usar **zona horaria de Miami** (`America/New_York`)
- Usar `Intl.DateTimeFormat` para extraer componentes de fecha en la zona correcta
- Evitar crear objetos `Date` sin especificar zona horaria

### Consideraciones de Rendimiento:
- La deduplicación con `Set` es O(n) - muy eficiente
- Reducir queries redundantes al backend
- Cachear resultados de eventos con React Query (ya implementado)

### Consideraciones de Testing:
- Crear tests unitarios para `calendarioHelpers.js`
- Tests de integración para hooks personalizados
- Tests E2E para el flujo completo de crear oferta

---

**Documento creado**: Diciembre 3, 2025  
**Autor**: Análisis realizado por Claude (Anthropic)  
**Versión**: 1.0

