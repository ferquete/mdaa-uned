# MDA Audio CIM Machine DSL

Este lenguaje permite la definición conceptual de máquinas de audio en el nivel CIM (Computation Independent Model). Define la identidad, puertos y configuraciones base de las máquinas.

Para una descripción detallada de la gramática, tipos y reglas, consulta la [**Guía Técnica CIM Machines**](../../../_DOCUMENTACION/manual_dsl/markdown/cim-machines.md).

## Comandos Principales

*   `npm run langium:generate`: Genera el código del lenguaje a partir de la gramática.
*   `npm run build`: Compila los servicios y validadores.

## Validación de Modelos JSON

> **Requisitos Previos:** Para poder ejecutar los comandos de compilación y las validaciones (tanto manualmente como con `validar-test.sh`), es imprescindible tener instalado **Node.js** (que ya incluye `npm` y `npx`) en tu sistema. Además, para poder ejecutar la validación (`validate.ts`) de forma manual, se deberá ejecutar previamente lo siguiente:
> ```bash
> npm install && npm run langium:generate && npm run build
> ```

Se utiliza el script `validate.ts` para asegurar que los modelos cumplen tanto con la estructura JSON como con las reglas del lenguaje.

### Ejecución de la validación
Para validar un fichero o un directorio completo, utiliza el comando `node` pasando el script y la ruta:

```bash
# Validar un fichero individual
node validate.ts examples/valid/valid-1.json

# Validar todos los ficheros de un directorio
node validate.ts examples/valid
```

### Estructura de Ejemplos
*   **`examples/valid/`**: Máquinas CIM que cumplen todas las reglas (puertos, IDs, longitudes).
*   **`examples/invalid/`**: Máquinas con fallos de estructura o semántica para testeo.

### Ficheros Involucrados
*   `validate.ts`: Script principal de validación (soporta ficheros y directorios).
*   `mdaa-cim-machine.schema.json`: Esquema JSON estructural.
*   `packages/language/out/`: Contiene el validador semántico compilado de Langium.
