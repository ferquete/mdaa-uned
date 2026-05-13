# MDA Audio CIM Relations Machine DSL

Este lenguaje define las conexiones conceptuales entre máquinas CIM, permitiendo modelar el flujo de señales de audio y modificaciones a nivel abstracto.

Para una descripción detallada de la gramática y reglas de conexión, consulta la [**Guía Técnica CIM Relations**](../../../_DOCUMENTACION/manual_dsl/markdown/cim-relations-machines.md).

## Comandos Principales

*   `npm run langium:generate`: Genera el código del lenguaje.
*   `npm run build`: Compila los servicios de validación.

## Validación de Modelos JSON

> **Requisitos Previos:** Para poder ejecutar los comandos de compilación y las validaciones (tanto manualmente como con `validar-test.sh`), es imprescindible tener instalado **Node.js** (que ya incluye `npm` y `npx`) en tu sistema. Además, para poder ejecutar la validación (`validate.ts`) de forma manual, se deberá ejecutar previamente lo siguiente:
> ```bash
> npm install && npm run langium:generate && npm run build
> ```

Se utiliza el script `validate.ts` para validar las conexiones.

### Ejecución de la validación
Para validar un fichero o un directorio completo, utiliza el comando `node` pasando el script y la ruta:

1.  **Validación Interna** (Estructura y semántica):
    ```bash
    # Validar un fichero
    node validate.ts examples/valid/valid-1.json

    # Validar todo un directorio
    node validate.ts examples/valid
    ```

2.  **Validación Cruzada** (Referenciando máquinas reales):
    ```bash
    node validate.ts examples/valid examples/machines
    ```

### Estructura de Ejemplos
*   **`examples/valid/`**: Relaciones que cumplen todas las reglas y referencian máquinas de la carpeta `machines`.
*   **`examples/invalid/`**: Relaciones con fallos estructurales o semánticos internos.
    *   **`invalid_by_relations/`**: Casos específicos de fallo en validación cruzada (IDs inexistentes o puertos mal configurados).
*   **`examples/machines/`**: Copia de máquinas CIM reales para ser usadas como base de la validación cruzada.

### Ficheros Involucrados
*   **`examples/machines/`**: Directorio que contiene máquinas CIM reales. Se utiliza como referencia para la validación cruzada avanzada (verificación de existencia de IDs y configuración de puertos `hasExternalInput`/`hasExternalOutput`).
*   `validate.ts`: Script principal que permite incluso validar contra el directorio de máquinas CIM.
*   `mdaa-cim-relations-machines.schema.json`: Esquema JSON estructural.
