import type { ValidationAcceptor, ValidationChecks } from 'langium';
import type { MdaAudioPimRelationsMachinesAstType, RelationDocument, Relation } from './generated/ast.js';
import type { MdaAudioPimRelationsMachinesServices } from './mda-audio-pim-relations-machines-module.ts';
 
 export function registerValidationChecks(services: MdaAudioPimRelationsMachinesServices) {
     const registry = services.validation.ValidationRegistry;
     const validator = services.validation.MdaAudioPimRelationsMachinesValidator;
     const checks: ValidationChecks<MdaAudioPimRelationsMachinesAstType> = {
         RelationDocument: validator.checkRelationDocument,
         Relation: validator.checkRelation
     };
     registry.register(checks, validator);
 }
 
 export class MdaAudioPimRelationsMachinesValidator {
 
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
         this.checkUUID(relation, 'id', relation.id, accept);
         
         // En PIM, source y destination DEBEN ser UUIDs de 36 caracteres (referencias a puntos PIM)
         this.checkUUID(relation, 'source', relation.source, accept);
         this.checkUUID(relation, 'destination', relation.destination, accept);
 
         if (relation.description !== undefined && relation.description !== null) {
             const cleanDesc = relation.description.replace(/^["']|["']$/g, '');
             if (cleanDesc.length < 10 || cleanDesc.length > 600) {
                 accept('error', 'El campo description en cada relation debe tener entre 10 y 600 caracteres.', { node: relation, property: 'description' });
             }
         }
     }
 
     private checkUUID(node: any, property: string, value: string | undefined, accept: ValidationAcceptor): void {
         if (value !== undefined && value !== null) {
             const cleanValue = value.replace(/^["']|["']$/g, '');
             if (cleanValue.length !== 36) {
                 accept('error', `El campo ${property} debe tener exactamente 36 caracteres.`, { node, property });
             }
         } else {
             accept('error', `El campo ${property} es obligatorio en cada relación.`, { node, property });
         }
     }
 }
