# 🔧 Solución: Chrome bloquea conexiones a IPs locales en Mac

## Problema
- ✅ Safari funciona correctamente
- ❌ Chrome no puede conectarse a `http://10.0.0.156:5000`

Esto es una restricción de seguridad de Chrome en macOS.

## Soluciones

### Solución 1: Usar Safari para Desarrollo (Recomendado)

Safari funciona perfectamente, así que puedes usarlo para desarrollo:

1. Abre Safari
2. Ve a `http://localhost:5173`
3. Debería funcionar correctamente

### Solución 2: Iniciar Chrome con flags de seguridad deshabilitados

**⚠️ Solo para desarrollo local - NO usar en producción**

Cierra Chrome completamente y luego inicia desde la terminal:

```bash
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --disable-web-security --user-data-dir=/tmp/chrome_dev --disable-features=IsolateOrigins,site-per-process
```

O crea un alias:

```bash
# Agregar al archivo ~/.zshrc o ~/.bash_profile
alias chrome-dev='/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --disable-web-security --user-data-dir=/tmp/chrome_dev --disable-features=IsolateOrigins,site-per-process'
```

Luego ejecuta:
```bash
chrome-dev
```

### Solución 3: Usar Firefox

Firefox generalmente no tiene este problema:

```bash
# Instalar Firefox si no lo tienes
brew install --cask firefox

# O descargar desde: https://www.mozilla.org/firefox/
```

### Solución 4: Configurar Chrome para permitir conexiones locales

1. Abre Chrome
2. Ve a `chrome://flags/`
3. Busca "Insecure origins treated as secure"
4. Agrega: `http://10.0.0.156:5000`
5. Reinicia Chrome

### Solución 5: Usar un túnel local (ngrok o similar)

Si necesitas que funcione en Chrome sin cambios:

```bash
# Instalar ngrok
brew install ngrok

# En Windows, exponer el puerto 5000
ngrok http 5000
```

Esto creará una URL pública que puedes usar.

## Recomendación

Para desarrollo local, **usa Safari**. Es más simple y no requiere configuración adicional.

Para producción o pruebas con múltiples navegadores, considera usar un túnel o configurar Chrome con los flags de desarrollo.

