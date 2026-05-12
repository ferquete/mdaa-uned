import type { ValidationError } from './analysisMachinesValidation'

export interface ValidMachine {
  id: string
  hasExternalOutput: boolean
  hasExternalInput: boolean
}

/**
 * Valida el documento de relaciones CIM.
 * @param doc El documento JSON de relaciones
 * @param validMachines Lista de máquinas válidas en el proyecto con sus metadatos
 */
export function validateCimRelations(doc: any, validMachines: ValidMachine[] = []): ValidationError[] {
  const errors: ValidationError[] = []

  if (!doc || typeof doc !== 'object') {
    return [{ field: 'document', message: 'Formato de JSON inválido' }]
  }

  // 1. Validar descripción general
  const desc = doc.description || ''
  if (!doc.description && doc.description !== '') {
    errors.push({ field: 'description', message: 'La descripción es obligatoria' })
  } else if (desc.length > 1000) {
    errors.push({ field: 'description', message: 'Descripción: Máximo 1000 caracteres' })
  }

  // 2. Validar array de relaciones
  if (!Array.isArray(doc.relations)) {
    errors.push({ field: 'relations', message: 'El campo relations debe ser un array' })
    return errors
  }

  const validUuidMap = new Map(validMachines.map(m => [m.id, m]))

  const seenRelations = new Set<string>()
  const seenIds = new Set<string>()

  doc.relations.forEach((rel: any, index: number) => {
    const relIdPrefix = `Relación #${index + 1}`
    
    // Validar ID único de la relación
    if (!rel.id) {
      errors.push({ nodeId: relIdPrefix, field: 'id', message: 'ID obligatorio' })
    } else if (rel.id.length !== 36) {
      errors.push({ nodeId: relIdPrefix, field: 'id', message: 'El ID debe tener exactamente 36 caracteres' })
    } else if (seenIds.has(rel.id)) {
      errors.push({ nodeId: relIdPrefix, field: 'id', message: `ID duplicado: ${rel.id}` })
    }
    if (rel.id) seenIds.add(rel.id)

    // Validar source
    if (!rel.source) {
      errors.push({ nodeId: relIdPrefix, field: 'source', message: 'Origen obligatorio' })
    } else if (validUuidMap.size > 0 && !validUuidMap.has(rel.source)) {
      errors.push({ nodeId: relIdPrefix, field: 'source', message: `ID Origen inexistente: ${rel.source}` })
    } else if (validUuidMap.size > 0 && !validUuidMap.get(rel.source)?.hasExternalOutput) {
      errors.push({ nodeId: relIdPrefix, field: 'source', message: 'La máquina de origen no tiene salida externa habilitada' })
    }

    // Validar destination
    if (!rel.destination) {
      errors.push({ nodeId: relIdPrefix, field: 'destination', message: 'Destino obligatorio' })
    } else if (validUuidMap.size > 0 && !validUuidMap.has(rel.destination)) {
      errors.push({ nodeId: relIdPrefix, field: 'destination', message: `ID Destino inexistente: ${rel.destination}` })
    } else if (validUuidMap.size > 0 && !validUuidMap.get(rel.destination)?.hasExternalInput) {
      errors.push({ nodeId: relIdPrefix, field: 'destination', message: 'La máquina de destino no tiene entrada externa habilitada' })
    }

    // Validar que no sea la misma máquina
    if (rel.source && rel.destination && rel.source === rel.destination) {
      errors.push({ nodeId: relIdPrefix, field: 'destination', message: 'No se permiten autoreferencias' })
    }

    // Validar duplicados de pares source/destination
    if (rel.source && rel.destination) {
      const pair = `${rel.source}->${rel.destination}`
      if (seenRelations.has(pair)) {
        errors.push({ nodeId: relIdPrefix, field: 'destination', message: 'Relación duplicada: Ya existe una conexión entre estas máquinas' })
      }
      seenRelations.add(pair)
    }

    // Validar descripción de la relación
    const relDesc = rel.description || ''
    if (relDesc.length < 10) {
       errors.push({ nodeId: relIdPrefix, field: 'description', message: 'Descripción: Mínimo 10 caracteres' })
    } else if (relDesc.length > 1000) {
       errors.push({ nodeId: relIdPrefix, field: 'description', message: 'Descripción: Máximo 1000 caracteres' })
    }
  })

  return errors
}
