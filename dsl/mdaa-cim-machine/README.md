# MDAA-CIM-Machine DSL

Este proyecto contiene la definición del lenguaje MDA-Audio CIM Machine, permitiendo modelar máquinas de síntesis de audio de forma conceptual.

## Guía de Validación

Para validar los archivos JSON generados contra la gramática y el esquema de validación, sigue estos pasos:

### Prerrequisitos
- Node.js (v20 o superior)
- npm

### Instalación de dependencias
Asegúrate de haber instalado las dependencias del proyecto:
```bash
npm install
```

### Comandos de Utilidad

A continuación se detallan los comandos principales para trabajar con el DSL:

- `npm run langium:generate`: Ejecuta el generador de Langium para sincronizar los archivos generados (`src/generated/`) con la gramática definida en `.langium`. Debe ejecutarse después de cualquier cambio en la gramática.
- `npm run build`: Compila el código TypeScript del proyecto (incluyendo los validadores y scripts de utilidad) a JavaScript ejecutable en la carpeta `out/`.

### Ejecución de la Validación

Puedes validar uno o varios archivos JSON utilizando el script unificado. El script realiza dos comprobaciones:
1. **Estructura JSON**: Valida que el archivo cumpla con el esquema JSON (`mdaa-cim-machine.schema.json`).
2. **Lógica DSL**: Valida reglas de negocio como unicidad de IDs, longitudes de texto y auto-referencias mediante el motor de Langium.

#### Comando de validación:
```bash
# Primero compila el proyecto si no lo has hecho
npm run build

# Ejecuta el validador (asegúrate de incluir el path si node no está en tu ruta por defecto en macOS)
PATH="/opt/homebrew/bin:$PATH" node packages/language/out/scripts/validate-all.js <ruta_al_archivo.json>
```

#### Ejemplo:
```bash
PATH="/opt/homebrew/bin:$PATH" node packages/language/out/scripts/validate-all.js examples/valid/valid-1.json
```

## Estructura de Ejemplos
- `examples/valid/`: Contiene 10 ejemplos que cumplen todas las reglas.
- `examples/invalid/`: Contiene 5 ejemplos diseñados para fallar por diferentes motivos (IDs duplicados, nombres cortos, etc).
