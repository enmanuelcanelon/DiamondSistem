# 🔧 Solución: Vite no lee el archivo .env

## Problema
El archivo `.env` existe y está correcto, pero Vite no lo está leyendo.

## Solución 1: Reiniciar completamente Vite

```bash
cd ~/Desktop/DiamondSistem/frontend

# 1. Detén el servidor completamente (Ctrl+C)

# 2. Limpia el caché de Vite
rm -rf node_modules/.vite
rm -rf dist

# 3. Reinicia el servidor
npm run dev
```

## Solución 2: Verificar que el archivo .env está en el lugar correcto

El archivo `.env` DEBE estar en:
```
DiamondSistem/frontend/.env
```

NO debe estar en:
- ❌ `DiamondSistem/.env`
- ❌ `DiamondSistem/frontend/src/.env`

## Solución 3: Verificar el contenido del .env

```bash
cd ~/Desktop/DiamondSistem/frontend

# Ver el contenido exacto
cat .env

# Debe mostrar EXACTAMENTE:
# VITE_API_URL=http://10.0.0.156:5000/api

# Si hay espacios o caracteres raros, reescríbelo:
echo "VITE_API_URL=http://10.0.0.156:5000/api" > .env
cat .env
```

## Solución 4: Forzar la recarga de variables de entorno

```bash
cd ~/Desktop/DiamondSistem/frontend

# Detén el servidor (Ctrl+C)

# Elimina el caché
rm -rf node_modules/.vite

# Reinicia con variable de entorno explícita
VITE_API_URL=http://10.0.0.156:5000/api npm run dev
```

## Solución 5: Verificar en el navegador

Después de reiniciar, abre la consola del navegador (F12 > Console) y ejecuta:

```javascript
console.log(import.meta.env.VITE_API_URL)
```

Debería mostrar: `http://10.0.0.156:5000/api`

Si muestra `undefined` o `http://localhost:5000/api`, entonces Vite no está leyendo el `.env`.

## Solución 6: Verificar que el servidor muestra la URL correcta

Cuando ejecutas `npm run dev`, Vite debería mostrar algo como:
```
VITE v5.x.x  ready in xxx ms

➜  Local:   http://localhost:5173/
➜  Network: http://10.0.0.x:5173/
```

Si ves esto, el servidor está corriendo correctamente.

