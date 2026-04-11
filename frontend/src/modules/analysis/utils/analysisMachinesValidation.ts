export const ANALYSIS_RULES = {
  name: { min: 1, max: 20 },
  description: { min: 10, max: 300 },
  inputs: { min: 10, max: 300 },
  outputs: { min: 10, max: 300 },
  params: { min: 10, max: 300 },
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
  if (!Array.isArray(doc.generators)) errors.push({ field: 'generators', message: 'GENERATORS: El array de generadores es obligatorio' })
  if (!Array.isArray(doc.modificators)) errors.push({ field: 'modificators', message: 'MODIFICATORS: El array de modificadores es obligatorio' })

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

  // 1. Recolección de IDs (Generadores y Modificadores)
  if (Array.isArray(doc.generators)) {
    doc.generators.forEach((g: any) => {
      if (g.id) {
        if (allDefinedIds.has(g.id)) errors.push({ nodeId: g.id, field: 'id', message: `ID duplicado: ${g.id}` })
        allDefinedIds.add(g.id)
      }
    })
  }
  if (Array.isArray(doc.modificators)) {
    doc.modificators.forEach((m: any) => {
      if (m.id) {
        if (allDefinedIds.has(m.id)) errors.push({ nodeId: m.id, field: 'id', message: `ID duplicado: ${m.id}` })
        allDefinedIds.add(m.id)
      }
    })
  }

  // 2. Validación estructural y referencial
  // Validar generadores
  if (Array.isArray(doc.generators)) {
    doc.generators.forEach((g: any) => {
      if (!g.id) errors.push({ field: 'id', message: 'Generador sin ID detectado' })
      checkStrings(g, g.id || 'unknown')

      // Validar relaciones e integridad
      if (g.rels && Array.isArray(g.rels)) {
        g.rels.forEach((r: any) => {
          if (!r.id) {
            errors.push({ nodeId: g.id, field: 'rels', message: 'Relación sin ID de destino' })
          } else if (!allDefinedIds.has(r.id)) {
            errors.push({ nodeId: g.id, field: 'rels', message: `Relación hacia ID inexistente: ${r.id}` })
          }
          const desc = r.description || ''
          if (desc.length < 10 || desc.length > 300) {
            errors.push({ nodeId: g.id, field: 'rels', message: `Relación hacia ${r.id || '?'}: Descripción requerida (10-300)` })
          }
        })
      }

      // Validar referencias e integridad
      if (g.refs && Array.isArray(g.refs)) {
        g.refs.forEach((r: any) => {
          if (!r.id) {
            errors.push({ nodeId: g.id, field: 'refs', message: 'Referencia sin ID de destino' })
          } else if (!allDefinedIds.has(r.id)) {
            errors.push({ nodeId: g.id, field: 'refs', message: `Referencia hacia ID inexistente: ${r.id}` })
          }
          const desc = r.description || ''
          if (desc.length < 10 || desc.length > 300) {
            errors.push({ nodeId: g.id, field: 'refs', message: `Referencia hacia ${r.id || '?'}: Descripción requerida (10-300)` })
          }
        })
      }
    })
  }

  // Validar modificadores
  if (Array.isArray(doc.modificators)) {
    doc.modificators.forEach((m: any) => {
      if (!m.id) errors.push({ field: 'id', message: 'Modificador sin ID detectado' })
      checkStrings(m, m.id || 'unknown')

      // Validar referencias e integridad
      if (m.refs && Array.isArray(m.refs)) {
        m.refs.forEach((r: any) => {
          if (!r.id) {
            errors.push({ nodeId: m.id, field: 'refs', message: 'Referencia sin ID de destino' })
          } else if (!allDefinedIds.has(r.id)) {
            errors.push({ nodeId: m.id, field: 'refs', message: `Referencia hacia ID inexistente: ${r.id}` })
          }
          const desc = r.description || ''
          if (desc.length < 10 || desc.length > 300) {
            errors.push({ nodeId: m.id, field: 'refs', message: `Referencia hacia ${r.id || '?'}: Descripción requerida (10-300)` })
          }
        })
      }
    })
  }

  return errors
}
