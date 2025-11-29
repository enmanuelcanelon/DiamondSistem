#!/bin/bash

# ============================================
# Script de Deployment Automático - Frontends
# Despliega todos los frontends en Vercel
# ============================================

set -e  # Salir si hay algún error

echo "🚀 Iniciando deployment de frontends en Vercel..."
echo ""

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Verificar si Vercel CLI está instalado
if ! command -v vercel &> /dev/null; then
    echo -e "${YELLOW}⚠️  Vercel CLI no está instalado${NC}"
    echo -e "${BLUE}Instalando Vercel CLI...${NC}"
    npm install -g vercel
    echo -e "${GREEN}✓ Vercel CLI instalado correctamente${NC}"
    echo ""
fi

# Verificar login en Vercel
echo -e "${BLUE}Verificando autenticación en Vercel...${NC}"
if ! vercel whoami &> /dev/null; then
    echo -e "${YELLOW}⚠️  No estás autenticado en Vercel${NC}"
    echo -e "${BLUE}Por favor, inicia sesión:${NC}"
    vercel login
    echo ""
fi

echo -e "${GREEN}✓ Autenticado en Vercel${NC}"
echo ""

# Obtener URL del backend
echo -e "${YELLOW}Por favor, ingresa la URL de tu backend en Railway:${NC}"
echo -e "${BLUE}(Ejemplo: https://tu-backend.up.railway.app/api)${NC}"
read -p "URL del backend: " BACKEND_URL

if [ -z "$BACKEND_URL" ]; then
    echo -e "${RED}❌ Error: Debes proporcionar la URL del backend${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}✓ URL del backend: $BACKEND_URL${NC}"
echo ""

# Array de frontends a desplegar
declare -a frontends=(
    "frontend-administrador:diamond-sistema-administrador"
    "frontend-cliente:diamond-sistema-cliente"
    "frontend-manager:diamond-sistema-manager"
    "frontend-gerente:diamond-sistema-gerente"
)

# Función para desplegar un frontend
deploy_frontend() {
    local dir=$1
    local name=$2

    echo ""
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}Desplegando: $name${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

    cd "$dir"

    # Configurar variable de entorno
    echo -e "${YELLOW}Configurando variable de entorno VITE_API_URL...${NC}"
    echo "$BACKEND_URL" | vercel env add VITE_API_URL production || true

    # Desplegar a producción
    echo -e "${YELLOW}Iniciando deployment...${NC}"
    vercel --prod --yes --name "$name" \
        --build-env VITE_API_URL="$BACKEND_URL" \
        --env VITE_API_URL="$BACKEND_URL"

    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ $name deployado exitosamente${NC}"
    else
        echo -e "${RED}❌ Error al desplegar $name${NC}"
        return 1
    fi

    cd ..
}

# Desplegar cada frontend
for frontend in "${frontends[@]}"; do
    IFS=':' read -r dir name <<< "$frontend"
    deploy_frontend "$dir" "$name" || {
        echo -e "${RED}❌ Error en el deployment de $name${NC}"
        echo -e "${YELLOW}¿Deseas continuar con los siguientes frontends? (s/n)${NC}"
        read -p "" continue_deploy
        if [ "$continue_deploy" != "s" ] && [ "$continue_deploy" != "S" ]; then
            echo -e "${RED}Deployment cancelado${NC}"
            exit 1
        fi
    }
done

echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}🎉 ¡Deployment completado!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${BLUE}Tus frontends están deployados en:${NC}"
echo ""
echo -e "  📦 Administrador: https://diamond-sistema-administrador.vercel.app"
echo -e "  📦 Cliente: https://diamond-sistema-cliente.vercel.app"
echo -e "  📦 Manager: https://diamond-sistema-manager.vercel.app"
echo -e "  📦 Gerente: https://diamond-sistema-gerente.vercel.app"
echo ""
echo -e "${YELLOW}💡 Tip: Verifica que todos los frontends estén funcionando correctamente${NC}"
echo -e "${YELLOW}💡 Recuerda actualizar la configuración CORS en tu backend${NC}"
echo ""
