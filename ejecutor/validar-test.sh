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

# Generar código y compilar cada DSL
DSL_BASE_DIR="$SCRIPT_DIR/../_CODIGO/dsl"
DSLS=("mdaa-cim-machine" "mdaa-cim-relations-machines" "mdaa-pim-machine" "mdaa-pim-relations-machines")

echo "================================================================="
echo "⚙️ GENERANDO Y COMPILANDO DSLs"
echo "================================================================="
for dsl in "${DSLS[@]}"; do
  echo -e "\n🔹 Procesando: $dsl"
  (cd "$DSL_BASE_DIR/$dsl" && npm install && npm run langium:generate && npm run build)
  
  if [ $? -ne 0 ]; then
    echo "❌ Error al generar/compilar $dsl"
    exit 1
  fi
done
echo -e "\n✅ DSLs compilados correctamente.\n"

# Ejecutar el script de validación pasando el parámetro
bash "$VALIDATE_SCRIPT" "$1"
