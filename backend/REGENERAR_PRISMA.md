# Regenerar Cliente de Prisma

El cliente de Prisma necesita ser regenerado para reconocer el campo `fecha_pago`.

## Pasos:

1. Detener el servidor backend (Ctrl+C)
2. Ejecutar: `cd backend && npx prisma generate`
3. Reiniciar el servidor

Esto sincronizará el cliente de Prisma con el schema actual.

