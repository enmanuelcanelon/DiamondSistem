# ⚡ Optimización de Rendimiento - DiamondSistem

## Problemas Identificados

### 1. **React Query refetching demasiado frecuente**
- Calendario: refetch cada 10 segundos
- Chat: refetch cada 5 segundos
- Leaks: refetch cada 60-90 segundos
- Dashboard: refetch cada 5 minutos

### 2. **Queries sin staleTime**
- Muchas queries se refetchean constantemente
- Algunas tienen `staleTime: 0` que fuerza refresco constante

### 3. **Supabase Latency**
- La base de datos en la nube puede tener latencia mayor que local
- Cada query tiene que ir y volver desde Supabase

### 4. **Queries con muchos includes**
- Contratos y ofertas cargan muchas relaciones
- Puede ser lento con muchos datos

## Soluciones Aplicadas

### 1. Optimizar React Query
- Aumentar `staleTime` para datos que no cambian frecuentemente
- Reducir `refetchInterval` en queries no críticas
- Deshabilitar `refetchOnWindowFocus` donde no sea necesario

### 2. Optimizar Queries del Backend
- Reducir includes innecesarios
- Agregar índices en la base de datos
- Usar select específicos en lugar de include completo

### 3. Mejorar Caché
- Configurar mejor el caché de React Query
- Usar `gcTime` (anteriormente cacheTime) apropiadamente

## Cambios Recomendados

### Frontend (React Query)
```javascript
// Antes (malo)
staleTime: 0,
refetchInterval: 10000, // cada 10 segundos
refetchOnWindowFocus: true

// Después (bueno)
staleTime: 5 * 60 * 1000, // 5 minutos
refetchInterval: false, // o 5 * 60 * 1000 (5 minutos)
refetchOnWindowFocus: false
```

### Backend (Prisma)
- Usar `select` en lugar de `include` cuando sea posible
- Limitar campos devueltos
- Agregar índices en campos frecuentemente consultados

## Optimizaciones Aplicadas al Backend

### 1. Estadísticas del Vendedor
- **Antes**: Traía TODOS los contratos solo para sumar `total_contrato`
- **Ahora**: Usa `aggregate` con `_sum` para calcular directamente en SQL
- **Resultado**: Mucho más rápido, especialmente con muchos contratos

### 2. Queries N+1 Eliminadas
- **Pagos**: Antes hacía una query por cada pago para obtener el vendedor
- **Historial**: Antes hacía una query por cada cambio para obtener el vendedor
- **Ahora**: Una sola query para obtener todos los vendedores necesarios
- **Resultado**: Reducción drástica de queries a la base de datos

## Verificación

Para verificar si hay queries lentas, revisa los logs del backend:
```
Slow query detected: XXXXms - SELECT ...
```

Si ves queries > 1000ms, necesitan optimización.

## Notas sobre Supabase

- Supabase puede tener latencia de red mayor que una BD local
- Las optimizaciones ayudan pero la latencia de red siempre existirá
- Considera usar índices en campos frecuentemente consultados
- Connection pooling puede ayudar (Supabase lo maneja automáticamente)

