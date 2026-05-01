#!/bin/bash

# Script de validación integral de Casos de Prueba MDA-Audio
# Valida CIM (Máquinas y Relaciones) y PIM (Máquinas y Relaciones con validación cruzada)

if [ -z "$1" ]; then
    echo "Error: Debes proporcionar el nombre de la carpeta de prueba (ej: TEST_2)"
    echo "Uso: ./validate-test.sh <TEST_FOLDER>"
    exit 1
fi

TEST_FOLDER=$1
# Obtener la ruta absoluta del directorio donde está el script
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
PROJECT_ROOT="$( cd "$SCRIPT_DIR/../.." &> /dev/null && pwd )"
DSL_BASE_DIR="$PROJECT_ROOT/_CODIGO/dsl"
TEST_PATH="$SCRIPT_DIR/$TEST_FOLDER"

if [ ! -d "$TEST_PATH" ]; then
    echo "Error: La carpeta de prueba '$TEST_FOLDER' no existe en $SCRIPT_DIR"
    exit 1
fi

# Definición de rutas de modelos
CIM_MACHINES="$TEST_PATH/CIM/machines"
CIM_RELATIONS="$TEST_PATH/CIM/cim_relations.json"
PIM_MACHINES="$TEST_PATH/PIM/machines"
PIM_RELATIONS="$TEST_PATH/PIM/pim_relations.json"

echo "================================================================="
echo "🔍 INICIANDO VALIDACIÓN COMPLETA: $TEST_FOLDER"
echo "================================================================="

# Función para ejecutar validación con tsx
run_val() {
    local dsl_folder=$1
    local target=$2
    local cross_ref=$3
    
    echo -e "\n📂 Carpeta DSL: $dsl_folder"
    cd "$DSL_BASE_DIR/$dsl_folder" || exit 1
    
    local cmd="npx tsx validate.ts \"$target\""
    if [ -n "$cross_ref" ]; then
        cmd="npx tsx validate.ts \"$target\" \"$cross_ref\""
    fi
    
    echo "🚀 Ejecutando: $cmd"
    eval "$cmd"
    
    if [ $? -ne 0 ]; then
        echo -e "❌ Error en la etapa de validación: $dsl_folder"
        # No salimos para intentar validar el resto, pero marcamos fallo
        GLOBAL_ERROR=1
    fi
}


GLOBAL_ERROR=0

# 1. Máquinas CIM (Estructural y Semántica)
run_val "mdaa-cim-machine" "$CIM_MACHINES"

# 2. Relaciones CIM (Cruzada con Máquinas CIM)
run_val "mdaa-cim-relations-machines" "$CIM_RELATIONS" "$CIM_MACHINES"

# 3. Máquinas PIM (Cruzada con Máquinas CIM)
run_val "mdaa-pim-machine" "$PIM_MACHINES" "$CIM_MACHINES"

# 4. Relaciones PIM (Cruzada con Máquinas PIM)
run_val "mdaa-pim-relations-machines" "$PIM_RELATIONS" "$PIM_MACHINES"

echo -e "\n================================================================="
if [ $GLOBAL_ERROR -eq 0 ]; then
    echo "✨ ¡EL PROYECTO $TEST_FOLDER ES VÁLIDO EN TODOS LOS NIVELES!"
else
    echo "⚠️ SE ENCONTRARON ERRORES EN LA VALIDACIÓN DE $TEST_FOLDER."
fi
echo "================================================================="

cd "$SCRIPT_DIR"
