#!/bin/bash

# Script puente para ejecutar la validación integral desde la raíz o carpeta ejecutor
# Uso: ./ejecutor/validar-test.sh <nombre_directorio_test>

if [ -z "$1" ]; then
  echo "❌ Error: Debes proporcionar el nombre del directorio del test (ej: TEST_2)"
  echo "Uso: $0 <nombre_directorio>"
  exit 1
fi

# Calcular la ruta base relativa a la ubicación del script
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
VALIDATE_SCRIPT="$SCRIPT_DIR/../_DOCUMENTACION/_CASOS_DE_PRUEBA/validate-test.sh"

# Verificar que el script de validación existe
if [ ! -f "$VALIDATE_SCRIPT" ]; then
  echo "❌ Error: No se encuentra el script de validación en $VALIDATE_SCRIPT"
  exit 1
fi

# Ejecutar el script de validación pasando el parámetro
bash "$VALIDATE_SCRIPT" "$1"
