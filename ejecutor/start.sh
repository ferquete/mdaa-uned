#!/bin/bash
# Moverse a la raíz del proyecto independientemente de dónde se ejecute el script
cd "$(dirname "$0")/.."


# Script para recompilar y arrancar ProyectoBase con Docker
echo "🚀 Iniciando proceso de despliegue..."

# 1. Detener contenedores existentes y limpiar huérfanos
echo "🛑 Deteniendo servicios actuales..."
docker compose down --remove-orphans

# 2. Recompilar (backend y frontend) y levantar todos los servicios
# El flag --build asegura que se ejecuten las etapas de compilación de los Dockerfiles
echo "🏗️  Recompilando y levantando contenedores..."
docker compose up --build
