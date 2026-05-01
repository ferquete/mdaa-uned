#!/bin/bash

# Comprobar si se ha pasado el nombre del caso de prueba
if [ -z "$1" ]; then
  echo "❌ Error: Debes proporcionar el nombre del directorio del test (ej: TEST_1)"
  echo "Uso: ./ejecutor/incluir-test <nombre_directorio>"
  exit 1
fi

# Calcular la ruta base relativa a la ubicación del script
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
BASE_TESTS_DIR="$SCRIPT_DIR/../_DOCUMENTACION/_CASOS_DE_PRUEBA"

PYTHON_SCRIPT="$BASE_TESTS_DIR/instaladorPrueba.py"
TEST_PATH="$BASE_TESTS_DIR/$1"

# Verificar que el script de python existe
if [ ! -f "$PYTHON_SCRIPT" ]; then
  echo "❌ Error: No se encuentra el script instalador en $PYTHON_SCRIPT"
  exit 1
fi

# Verificar que el directorio del caso de prueba existe
if [ ! -d "$TEST_PATH" ]; then
  echo "❌ Error: El directorio de prueba $TEST_PATH no existe."
  exit 1
fi

echo "🚀 Iniciando instalación del caso de prueba: $1"
python3 "$PYTHON_SCRIPT" "$TEST_PATH"

if [ $? -eq 0 ]; then
  echo "✅ Instalación completada con éxito."
else
  echo "❌ Error durante la instalación."
  exit 1
fi
