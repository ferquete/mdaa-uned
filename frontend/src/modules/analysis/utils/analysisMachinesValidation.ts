export const ANALYSIS_RULES = {
  name: { min: 1, max: 20 },
  description: { min: 10, max: 300 },
  cim_description: { min: 10, max: 600 },
  inputs: { min: 10, max: 300 },
  outputs: { min: 10, max: 300 },
  params: { min: 10, max: 300 }
}

export interface ValidationError {
  field: string
  message: string
  nodeId?: string
}

/**
 * Valida un documento CIM completo.
 */
export function validateCimDocument(doc: any): ValidationError[] {
  const errors: ValidationError[] = []

  if (!doc || typeof doc !== 'object') {
    return [{ field: 'document', message: 'Formato de JSON inválido' }]
  }

  const checkStrings = (node: any, nodeId: string) => {
    Object.entries(ANALYSIS_RULES).forEach(([key, rule]) => {
      const val = node[key] || ''
      if (val.length < rule.min) {
        errors.push({ nodeId, field: key, message: `${key.toUpperCase()}: Mínimo ${rule.min} caracteres` })
      } else if (val.length > rule.max) {
        errors.push({ nodeId, field: key, message: `${key.toUpperCase()}: Máximo ${rule.max} caracteres` })
      }
    })
  }

  const ids = new Set<string>()

  // Validar generadores
  if (Array.isArray(doc.generators)) {
    doc.generators.forEach((g: any) => {
      if (!g.id) errors.push({ field: 'id', message: 'Generador sin ID detectado' })
      else if (ids.has(g.id)) errors.push({ nodeId: g.id, field: 'id', message: `ID duplicado: ${g.id}` })
      else ids.add(g.id)

      checkStrings(g, g.id || 'unknown')

      // Validar relaciones
      if (g.rels && Array.isArray(g.rels)) {
        g.rels.forEach((r: any) => {
          if (r.description && (r.description.length < 10 || r.description.length > 300)) {
            errors.push({ nodeId: g.id, field: 'rels', message: `Relación hacia ${r.id}: Descripción inválida (10-300)` })
          }
        })
      }
    })
  }

  // Validar modificadores
  if (Array.isArray(doc.modificators)) {
    doc.modificators.forEach((m: any) => {
      if (!m.id) errors.push({ field: 'id', message: 'Modificador sin ID detectado' })
      else if (ids.has(m.id)) errors.push({ nodeId: m.id, field: 'id', message: `ID duplicado: ${m.id}` })
      else ids.add(m.id)

      checkStrings(m, m.id || 'unknown')
    })
  }

  return errors
}
