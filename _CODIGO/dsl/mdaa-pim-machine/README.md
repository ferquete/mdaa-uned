# MDA Audio PIM Machine DSL

Este lenguaje permite definir máquinas de audio a nivel PIM (Platform Independent Model), incluyendo generadores (osciladores, ruido, samples), modificadores (filtros, envolventes, LFOs) y efectos (reverb, delay, etc.).

Para una descripción detallada de todos los componentes y parámetros técnicos, consulta la [**Guía Técnica PIM Machines**](../../../_DOCUMENTACION/manual_dsl/markdown/pim-machines.md).

## Comandos Principales

Para trabajar con el DSL, sitúate en la raíz del proyecto `dsl/mdaa-pim-machine/` y utiliza los siguientes comandos:

*   `npm run langium:generate`: Genera el código TypeScript a partir de la gramática `.langium`. Es necesario ejecutarlo cada vez que se modifique la estructura del lenguaje.
*   `npm run build`: Compila el proyecto, incluyendo el validador y los servicios del lenguaje.

## Validación de Modelos JSON

> **Requisitos Previos:** Para poder ejecutar los comandos de compilación y las validaciones (tanto manualmente como con `validar-test.sh`), es imprescindible tener instalado **Node.js** (que ya incluye `npm` y `npx`) en tu sistema. Además, para poder ejecutar la validación (`validate.ts`) de forma manual, se deberá ejecutar previamente lo siguiente:
> ```bash
> npm install && npm run langium:generate && npm run build
> ```

Se ha incluido un script unificado para validar los modelos JSON tanto por estructura (JSON Schema) como por semántica (Validador de Langium).

Para validar un ficheror o un directorio completo, utiliza el comando `node` iniciando en la raíz `dsl/mdaa-pim-machine/`:

```bash
# Validar un fichero individual (solo PIM)
node validate.ts examples/valid/valid-1.json

# Validar todo un directorio (solo PIM)
node validate.ts examples/valid

# Validación Cruzada (PIM + Universo CIM)
# Comprueba que las máquinas CIM y sus elementos referenciados existen realmente.
node validate.ts examples/valid examples/machines
```

### Estructura de Ejemplos
*   **`examples/valid/`**: Modelos PIM que cumplen todas las reglas de negocio y estructura.
*   **`examples/invalid/`**: Modelos con errores deliberados para pruebas de validador (IDs repetidos, rangos inválidos, etc.).
*   **`examples/machines/`**: Copia de máquinas CIM reales para la validación cruzada avanzada de referencias.

### Ficheros Involucrados
*   `validate.ts`: Script de validación polimórfico (ficheros/directorios/cruzada).
*   `mda-audio-pim-machine.schema.json`: Esquema estructural.

El script realizará dos pasos:
1.  **Validación de Langium**: Comprueba reglas de negocio (UUIDs válidos, rangos de frecuencia, integridad de aristas, etc.).
2.  **Validación de Schema**: Comprueba que el JSON cumple estrictamente con el esquema definido en `mda-audio-pim-machine.schema.json`.

Si ambos pasos tienen éxito, se mostrará un mensaje de confirmación ✨. En caso contrario, se detallarán los errores encontrados.

## Ejemplos

En la carpeta `examples/` se pueden encontrar:
*   10 ejemplos válidos cubriendo toda la casuística de nodos y aristas.
*   5 ejemplos erróneos para demostrar las capacidades del validador.
