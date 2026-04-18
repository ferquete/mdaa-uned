export const ANALYSIS_RULES = {
  name: { min: 1, max: 20 },
  description: { min: 10, max: 600 },
  params: { min: 10, max: 600 },
  id: { min: 36, max: 36 }
}

export interface ValidationError {
  field: string
  message: string
  nodeId?: string
}

/**
 * Valida un documento CIM completo, incluyendo integridad referencial.
 * @param doc El documento a validar
 * @param existingMachineIds Mapa de IDs de otras máquinas del proyecto para validar unicidad global del ID de la máquina
 * @param currentMachineId ID de base de datos de la máquina actual para no validar contra sí misma
 */
export function validateCimDocument(doc: any, existingMachineIds: Record<number, string> = {}, currentMachineId?: number): ValidationError[] {
  const errors: ValidationError[] = []

  if (!doc || typeof doc !== 'object') {
    return [{ field: 'document', message: 'Formato de JSON inválido' }]
  }

  // Comprobar campos permitidos en raíz para evitar ruido (generators/modificators)
  const rootAllowed = ['$type', 'id', 'name', 'description', 'elements'];
  Object.keys(doc).forEach(key => {
    if (!rootAllowed.includes(key)) {
      errors.push({ field: key, message: `Campo '${key}' no permitido en la raíz del documento CIM.` })
    }
  });

  const checkStrings = (node: any, nodeId: string) => {
    Object.entries(ANALYSIS_RULES).forEach(([key, rule]) => {
      if (key in node) {
        const val = node[key] || ''
        if (val.length < rule.min) {
          errors.push({ nodeId, field: key, message: `${key.toUpperCase()}: Mínimo ${rule.min} caracteres` })
        } else if (val.length > rule.max) {
          errors.push({ nodeId, field: key, message: `${key.toUpperCase()}: Máximo ${rule.max} caracteres` })
        }
      }
    })
  }

  // Validar campos de raíz obligatorios
  if (!doc.id) errors.push({ field: 'id', message: 'ID: El identificador único de la máquina (36 caracteres) es obligatorio' })
  if (!doc.name) errors.push({ field: 'name', message: 'NAME: El nombre de la máquina es obligatorio' })
  if (!doc.description) errors.push({ field: 'description', message: 'DESCRIPTION: La descripción de la máquina es obligatoria' })
  if (!Array.isArray(doc.elements)) errors.push({ field: 'elements', message: 'ELEMENTS: El array de elementos es obligatorio' })

  // Validar unicidad global del ID de la máquina en el proyecto
  if (doc.id && doc.id.length === 36) {
    const duplicateMachine = Object.entries(existingMachineIds).find(([dbId, uuid]) => {
      return uuid === doc.id && Number(dbId) !== currentMachineId
    })
    if (duplicateMachine) {
      errors.push({ field: 'id', message: `ID Global duplicado: El ID ${doc.id} ya pertenece a otra máquina de este proyecto` })
    }
  }

  checkStrings(doc, 'Document')

  const allDefinedIds = new Set<string>()

  // 1. Recolección de IDs (Elementos)
  if (Array.isArray(doc.elements)) {
    doc.elements.forEach((e: any) => {
      if (e.id) {
        if (allDefinedIds.has(e.id)) errors.push({ nodeId: e.id, field: 'id', message: `ID duplicado: ${e.id}` })
        allDefinedIds.add(e.id)
      }
    })
  }

  // 2. Validación estructural y referencial
  const validateSendTo = (node: any) => {
    if (node.sendTo && Array.isArray(node.sendTo)) {
      const sendToIds = new Set<string>();
      node.sendTo.forEach((s: any) => {
        // Validar ID único de la entrada sendTo dentro del array
        if (!s.id || s.id.length !== 36) {
          errors.push({ nodeId: node.id, field: 'sendTo', message: 'Entrada sendTo con ID inválido o ausente (36 caracteres requeridos)' })
        } else if (sendToIds.has(s.id)) {
          errors.push({ nodeId: node.id, field: 'sendTo', message: `ID de sendTo duplicado: ${s.id}` })
        }
        sendToIds.add(s.id);

        // Validar idRef
        if (!s.idRef) {
          errors.push({ nodeId: node.id, field: 'sendTo', message: 'Referencia sendTo sin idRef' })
        } else if (s.idRef === node.id) {
          errors.push({ nodeId: node.id, field: 'sendTo', message: 'Un elemento no puede referenciarse a sí mismo en sendTo' })
        } else if (!allDefinedIds.has(s.idRef)) {
          errors.push({ nodeId: node.id, field: 'sendTo', message: `Referencia hacia ID inexistente: ${s.idRef}` })
        }

        const desc = s.description || ''
        if (desc.length < 10 || desc.length > 600) {
          errors.push({ nodeId: node.id, field: 'sendTo', message: `Referencia hacia ${s.idRef || '?'}: Descripción requerida (10-600)` })
        }
      })
    }
  }

  // Validar elementos
  if (Array.isArray(doc.elements)) {
    const elementAllowed = ['$type', 'id', 'name', 'description', 'params', 'externalOutput', 'externalInput', 'sendTo'];
    doc.elements.forEach((e: any) => {
      if (!e.id) errors.push({ field: 'id', message: 'Elemento sin ID detectado' })
      
      // Strict keys check for elements
      Object.keys(e).forEach(k => {
        if (!elementAllowed.includes(k)) {
          errors.push({ nodeId: e.id || 'unknown', field: k, message: `Campo '${k}' no permitido en un Elemento.` })
        }
      });

      checkStrings(e, e.id || 'unknown')
      
      const extOut = e.externalOutput?.description || ''
      if (extOut.length > 600) {
        errors.push({ nodeId: e.id, field: 'externalOutput', message: 'Salida externa: Máximo 600 caracteres' })
      }
      
      const extIn = e.externalInput?.description || ''
      if (extIn.length > 600) {
        errors.push({ nodeId: e.id, field: 'externalInput', message: 'Entrada externa: Máximo 600 caracteres' })
      }

      validateSendTo(e)
    })
  }

  return errors
}
