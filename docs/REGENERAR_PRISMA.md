# Regenerar Prisma Client

El error indica que Prisma Client no tiene los nuevos campos `comision_primera_mitad_pagada_monto` y `comision_segunda_mitad_pagada_monto`.

## Solución:

1. **Detén el servidor backend** (Ctrl+C en la terminal donde está corriendo)

2. **Regenera Prisma Client:**
   ```bash
   cd backend
   npx prisma generate
   ```

3. **Reinicia el servidor backend:**
   ```bash
   npm start
   ```

Los campos ya existen en la base de datos (verificado), solo necesitas regenerar el cliente de Prisma.

