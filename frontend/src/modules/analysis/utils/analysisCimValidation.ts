import type { ValidationError } from './analysisMachinesValidation'

/**
 * Valida el documento de relaciones CIM.
 * @param doc El documento JSON de relaciones
 * @param machineUuids Lista de UUIDs de máquinas válidos en el proyecto
 */
export function validateCimRelations(doc: any, machineUuids: string[] = []): ValidationError[] {
  const errors: ValidationError[] = []

  if (!doc || typeof doc !== 'object') {
    return [{ field: 'document', message: 'Formato de JSON inválido' }]
  }

  // 1. Validar descripción general
  const desc = doc.description || ''
  if (!doc.description && doc.description !== '') {
    errors.push({ field: 'description', message: 'La descripción es obligatoria' })
  } else if (desc.length > 300) {
    errors.push({ field: 'description', message: 'Descripción: Máximo 300 caracteres' })
  }

  // 2. Validar array de relaciones
  if (!Array.isArray(doc.relations)) {
    errors.push({ field: 'relations', message: 'El campo relations debe ser un array' })
    return errors
  }

  const validUuidSet = new Set(machineUuids)
  const seenRelations = new Set<string>()

  doc.relations.forEach((rel: any, index: number) => {
    const relId = `Relación #${index + 1}`
    
    // Validar source
    if (!rel.source) {
      errors.push({ nodeId: relId, field: 'source', message: 'Origen obligatorio' })
    } else if (validUuidSet.size > 0 && !validUuidSet.has(rel.source)) {
      errors.push({ nodeId: relId, field: 'source', message: `ID Origen inexistente: ${rel.source}` })
    }

    // Validar destination
    if (!rel.destination) {
      errors.push({ nodeId: relId, field: 'destination', message: 'Destino obligatorio' })
    } else if (validUuidSet.size > 0 && !validUuidSet.has(rel.destination)) {
      errors.push({ nodeId: relId, field: 'destination', message: `ID Destino inexistente: ${rel.destination}` })
    }

    // Validar que no sea la misma máquina
    if (rel.source && rel.destination && rel.source === rel.destination) {
      errors.push({ nodeId: relId, field: 'destination', message: 'No se permiten autoreferencias' })
    }

    // Validar duplicados
    if (rel.source && rel.destination) {
      const pair = `${rel.source}->${rel.destination}`
      if (seenRelations.has(pair)) {
        errors.push({ nodeId: relId, field: 'destination', message: 'Relación duplicada: Ya existe una conexión entre estas máquinas' })
      }
      seenRelations.add(pair)
    }

    // Validar descripción de la relación
    const relDesc = rel.description || ''
    if (relDesc.length < 10) {
       errors.push({ nodeId: relId, field: 'description', message: 'Descripción: Mínimo 10 caracteres' })
    } else if (relDesc.length > 300) {
       errors.push({ nodeId: relId, field: 'description', message: 'Descripción: Máximo 300 caracteres' })
    }
  })

  return errors
}
