/**
 * Esquema JSON para la validación e IntelliSense de las máquinas CIM.
 */
export const CIM_MACHINE_SCHEMA = {
  type: 'object',
  required: ['$type', 'id', 'name', 'description', 'elements'],
  properties: {
    $type: { type: 'string', enum: ['Document'], description: 'Tipo raíz del documento' },
    id: { type: 'string', minLength: 36, maxLength: 36, description: 'Identificador único de la máquina (36 caracteres)' },
    name: { type: 'string', minLength: 1, maxLength: 20, description: 'Nombre descriptivo de la máquina' },
    description: { type: 'string', minLength: 10, maxLength: 600, description: 'Explicación del propósito de la máquina' },
    elements: {
      type: 'array',
      items: {
        type: 'object',
        required: ['id', 'name', 'description', 'sendTo'],
        properties: {
          $type: { type: 'string', enum: ['Element'] },
          id: { type: 'string', minLength: 36, maxLength: 36, description: 'Identificador único del elemento (36 caracteres)' },
          name: { type: 'string', description: 'Nombre descriptivo' },
          description: { type: 'string', minLength: 10, maxLength: 600, description: 'Explicación del propósito del elemento' },
          params: { type: 'string' },
          externalOutput: {
            type: 'object',
            properties: {
              hasExternalOutput: { type: 'boolean' },
              description: { type: 'string', maxLength: 600 }
            }
          },
          externalInput: {
            type: 'object',
            properties: {
              hasExternalInput: { type: 'boolean' },
              description: { type: 'string', maxLength: 600 }
            }
          },
          sendTo: {
            type: 'array',
            items: {
              type: 'object',
              required: ['id', 'idRef', 'description'],
              properties: {
                id: { type: 'string', minLength: 36, maxLength: 36, description: 'ID único de la referencia (36 caracteres)' },
                idRef: { type: 'string', minLength: 36, maxLength: 36, description: 'ID del componente referenciado (36 caracteres)' },
                description: { type: 'string', minLength: 10, maxLength: 600, description: 'Propósito de la referencia' }
              }
            }
          }
        }
      }
    }
  }
}
