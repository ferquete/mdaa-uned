/**
 * Esquema JSON para la validación e IntelliSense de las relaciones CIM.
 */
export const CIM_RELATIONS_SCHEMA = {
  type: 'object',
  required: ['description', 'relations'],
  properties: {
    description: { 
      type: 'string', 
      minLength: 1, 
      maxLength: 600, 
      description: 'Descripción general del análisis de relaciones' 
    },
    relations: {
      type: 'array',
      items: {
        type: 'object',
        required: ['id', 'source', 'destination', 'description'],
        properties: {
          id: { 
            type: 'string', 
            minLength: 36, 
            maxLength: 36, 
            description: 'Identificador único de la relación (36 caracteres)' 
          },
          source: { 
            type: 'string', 
            minLength: 36, 
            maxLength: 36, 
            description: 'ID (UUID) de la máquina origen' 
          },
          destination: { 
            type: 'string', 
            minLength: 36, 
            maxLength: 36, 
            description: 'ID (UUID) de la máquina destino' 
          },
          description: { 
            type: 'string', 
            minLength: 10, 
            maxLength: 600, 
            description: 'Descripción de la relación' 
          }
        }
      }
    }
  }
}
