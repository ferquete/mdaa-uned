#!/bin/bash

# Script para limpieza TOTAL de MDAA en Docker

echo "Deteniendo y eliminando contenedores, redes y volúmenes de MDAA..."
# Usamos docker compose down para limpiar lo definido en el proyecto
docker compose down -v --rmi all

echo "Eliminando imágenes específicas de mdaa..."
docker rmi mdaa-frontend mdaa-backend 2>/dev/null

echo "Eliminando imágenes huérfanas (<none>)..."
docker image prune -f

echo "Limpiando volúmenes huérfanos..."
docker volume prune -f

echo "MDAA ha sido eliminado completamente de Docker."
