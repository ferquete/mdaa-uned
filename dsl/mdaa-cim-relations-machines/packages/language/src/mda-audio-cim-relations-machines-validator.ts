import type { ValidationAcceptor, ValidationChecks } from 'langium';
import type { MdaAudioCimRelationsMachinesAstType, RelationDocument, Relation } from './generated/ast.js';
import type { MdaAudioCimRelationsMachinesServices } from './mda-audio-cim-relations-machines-module.js';

export function registerValidationChecks(services: MdaAudioCimRelationsMachinesServices) {
    const registry = services.validation.ValidationRegistry;
    const validator = services.validation.MdaAudioCimRelationsMachinesValidator;
    const checks: ValidationChecks<MdaAudioCimRelationsMachinesAstType> = {
        RelationDocument: validator.checkRelationDocument,
        Relation: validator.checkRelation
    };
    registry.register(checks, validator);
}

export class MdaAudioCimRelationsMachinesValidator {

    checkRelationDocument(doc: RelationDocument, accept: ValidationAcceptor): void {
        if (doc.description !== undefined && doc.description !== null) {
            const cleanDesc = doc.description.replace(/^["']|["']$/g, '');
            if (cleanDesc.length < 1 || cleanDesc.length > 600) {
                accept('error', 'El campo description del documento principal debe tener entre 1 y 600 caracteres.', { node: doc, property: 'description' });
            }
        }

        // Validación de unicidad de IDs en las relaciones
        const ids = new Set<string>();
        doc.relations.forEach((rel) => {
            if (rel.id) {
                const cleanId = rel.id.replace(/^["']|["']$/g, '');
                if (ids.has(cleanId)) {
                    accept('error', `ID duplicado detectado: ${cleanId}. Cada relación debe tener un ID único.`, { node: rel, property: 'id' });
                }
                ids.add(cleanId);
            }
        });
    }

    checkRelation(relation: Relation, accept: ValidationAcceptor): void {
        // Validación del campo id (36 caracteres obligatorios)
        if (relation.id !== undefined && relation.id !== null) {
            const cleanId = relation.id.replace(/^["']|["']$/g, '');
            if (cleanId.length !== 36) {
                accept('error', 'El campo id debe tener exactamente 36 caracteres.', { node: relation, property: 'id' });
            }
        } else {
            accept('error', 'El campo id es obligatorio en cada relación.', { node: relation, property: 'id' });
        }

        if (relation.source !== undefined && relation.source !== null) {
            const cleanSource = relation.source.replace(/^["']|["']$/g, '');
            if (cleanSource.length < 1 || cleanSource.length > 36) {
                accept('error', 'El campo source debe tener entre 1 y 36 caracteres.', { node: relation, property: 'source' });
            }
        }
        
        if (relation.destination !== undefined && relation.destination !== null) {
            const cleanDest = relation.destination.replace(/^["']|["']$/g, '');
            if (cleanDest.length < 1 || cleanDest.length > 36) {
                accept('error', 'El campo destination debe tener entre 1 y 36 caracteres.', { node: relation, property: 'destination' });
            }
        }

        if (relation.description !== undefined && relation.description !== null) {
            const cleanDesc = relation.description.replace(/^["']|["']$/g, '');
            if (cleanDesc.length < 10 || cleanDesc.length > 300) {
                accept('error', 'El campo description en cada relation debe tener entre 10 y 300 caracteres.', { node: relation, property: 'description' });
            }
        }
    }
}
