/**
 * Esquema JSON para la validación e IntelliSense de las relaciones PIM (Diseño Conceptual).
 * Sincronizado con mdaa-pim-relations-machines.schema.json del DSL.
 */
export const PIM_RELATIONS_SCHEMA = {
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "MDA Audio PIM Relations Machines Schema",
  "type": "object",
  "required": ["relations"],
  "properties": {
    "description": {
      "type": "string",
      "minLength": 1,
      "maxLength": 600,
      "description": "Propósito de la red de relaciones (máx 600 caracteres)."
    },
    "relations": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["id", "source", "destination", "description"],
        "properties": {
          "id": {
            "type": "string",
            "pattern": "^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$",
            "description": "UUID de la relación (36 caracteres)."
          },
          "source": {
            "type": "string",
            "pattern": "^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$",
            "description": "ID del puerto origen (UUID)."
          },
          "destination": {
            "type": "string",
            "pattern": "^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$",
            "description": "ID del puerto destino o parámetro (UUID)."
          },
          "description": {
            "type": "string",
            "minLength": 10,
            "maxLength": 300,
            "description": "Descripción técnica de la modulación o flujo (10-300 caracteres)."
          }
        },
        "additionalProperties": false
      }
    }
  },
  "additionalProperties": false
}
