# MDA-Audio CIM Relations Machines

Este proyecto contiene la definición del lenguaje para las relaciones entre máquinas CIM en el ecosistema MDA-Audio.

## Comandos Útiles

*   `npm run langium:generate`: Sincroniza los archivos generados con la gramática `.langium`. Úsalo después de modificar la gramática.
*   `npm run build`: Compila el código TypeScript a JavaScript en la carpeta `out/`. Es necesario para que el validador refleje los cambios.

## Guía de Validación de JSON

Para validar tus archivos JSON de relaciones contra el esquema y las reglas del lenguaje, utiliza el script unificado:

```bash
# Asegúrate de haber compilado primero
npm run build

# Ejecuta la validación sobre un archivo
PATH="/opt/homebrew/bin:$PATH" node packages/language/out/scripts/validate-all.js examples/valid/valid-1.json
```

El programa realizará dos validaciones:
1.  **Estructura**: Verifica que el JSON cumpla con el esquema definido (tipos, longitudes, campos obligatorios).
2.  **Lógica DSL**: Verifica reglas de negocio como la unicidad de IDs y consistencia de referencias.

## Estructura de Carpetas

*   `packages/language`: Definición de la gramática y validadores.
*   `examples/`: Colección de ejemplos válidos e inválidos para pruebas.
*   `mdaa-cim-relations-machines.schema.json`: Esquema JSON oficial del lenguaje.
