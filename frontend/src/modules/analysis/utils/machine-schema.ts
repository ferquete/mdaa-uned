/**
 * Esquema JSON para la validación e IntelliSense de las máquinas CIM.
 */
export const CIM_MACHINE_SCHEMA = {
  type: 'object',
  required: ['$type', 'id', 'name', 'description', 'generators', 'modificators'],
  properties: {
    $type: { type: 'string', enum: ['Document'], description: 'Tipo raíz del documento' },
    id: { type: 'string', minLength: 36, maxLength: 36, description: 'Identificador único de la máquina (36 caracteres)' },
    name: { type: 'string', minLength: 1, maxLength: 20, description: 'Nombre descriptivo de la máquina' },
    description: { type: 'string', minLength: 10, maxLength: 300, description: 'Explicación del propósito de la máquina' },
    generators: {
      type: 'array',
      items: {
        type: 'object',
        required: ['id', 'name', 'description'],
        properties: {
          $type: { type: 'string', enum: ['AudioGenerator'] },
          id: { type: 'string', minLength: 36, maxLength: 36, description: 'Identificador único del generador (36 caracteres)' },
          name: { type: 'string', description: 'Nombre descriptivo' },
          description: { type: 'string', minLength: 10, maxLength: 300, description: 'Explicación del propósito del generador' },
          inputs: { type: 'string' },
          outputs: { type: 'string' },
          params: { type: 'string' },
          refs: {
            type: 'array',
            items: {
              type: 'object',
              required: ['id', 'description'],
              properties: {
                id: { type: 'string', minLength: 36, maxLength: 36, description: 'ID del componente referenciado (36 caracteres)' },
                description: { type: 'string', minLength: 10, description: 'Propósito de la referencia' }
              }
            }
          },
          rels: {
            type: 'array',
            items: {
              type: 'object',
              required: ['id', 'description'],
              properties: {
                id: { type: 'string', minLength: 36, maxLength: 36, description: 'ID del componente relacionado (36 caracteres)' },
                description: { type: 'string', minLength: 10, description: 'Naturaleza de la relación' }
              }
            }
          }
        }
      }
    },
    modificators: {
      type: 'array',
      items: {
        type: 'object',
        required: ['id', 'name', 'description'],
        properties: {
          $type: { type: 'string', enum: ['Modificator'] },
          id: { type: 'string', minLength: 36, maxLength: 36, description: 'Identificador único del modificador (36 caracteres)' },
          name: { type: 'string' },
          description: { type: 'string', minLength: 10, maxLength: 300 },
          inputs: { type: 'string' },
          outputs: { type: 'string' },
          params: { type: 'string' },
          refs: {
            type: 'array',
            items: {
              type: 'object',
              required: ['id', 'description'],
              properties: {
                id: { type: 'string', minLength: 36, maxLength: 36, description: 'ID del componente referenciado (36 caracteres)' },
                description: { type: 'string', minLength: 10 }
              }
            }
          }
        }
      }
    }
  }
}
