# MDA-Audio-PIM-Relations-Machines

DSL para la orquestación de interconexiones técnicas entre máquinas PIM (Platform Independence Model). Permite establecer vínculos directos entre puertos de salida externos y parámetros o puertos de entrada.

Para una descripción detallada de la lógica de orquestación técnica, consulta la [**Guía Técnica PIM Relations**](../../../_DOCUMENTACION/manual_dsl/markdown/pim-relations-machines.md).

## Estructura de Proyecto

- `validate.ts`: Script de validación polimórfico.
- `mdaa-pim-relations-machines.schema.json`: Esquema JSON estructural.
- `examples/valid/`: Ejemplos de relaciones técnicamente correctas.
- `examples/invalid/`: Errores de sintaxis y formato (UUIDs inválidos, etc.).
- `examples/invalid/invalid_by_relations/`: Errores semánticos detectados mediante validación cruzada.
- `examples/machines/`: Directorio de referencia con máquinas PIM reales.

## Validación

> **Requisitos Previos:** Para poder ejecutar los comandos de compilación y las validaciones (tanto manualmente como con `validar-test.sh`), es imprescindible tener instalado **Node.js** (que ya incluye `npm` y `npx`) en tu sistema. Además, para poder ejecutar la validación (`validate.ts`) de forma manual, se deberá ejecutar previamente lo siguiente:
> ```bash
> npm install && npm run langium:generate && npm run build
> ```

El validador soporta dos modos:

### 1. Validación Estructural (Sintáctica)
Verifica que el archivo sea un JSON válido y cumpla con la gramática y el esquema (UUIDs de 36 caracteres, longitudes de texto).

```bash
node validate.ts <fichero_o_directorio>
```

### 2. Validación Cruzada (Semántica)
Verifica que los IDs de `source` y `destination` existan realmente en las máquinas PIM y que los puertos tengan los permisos de visibilidad interna/externa adecuados.

```bash
node validate.ts <fichero_o_directorio> examples/machines
```

## Ejemplo de Uso

```json
{
  "description": "Conexión de audio principal.",
  "relations": [
    {
      "id": "550e8400-e29b-41d4-a716-446655660001",
      "source": "ID-PUERTO-OUTPUT-PIM",
      "destination": "ID-PARAMETRO-O-INPUT-PIM",
      "description": "Modulación de frecuencia FM."
    }
  ]
}
```
