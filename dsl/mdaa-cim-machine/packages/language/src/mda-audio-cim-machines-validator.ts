import { type ValidationAcceptor, type ValidationChecks, AstUtils } from 'langium';
import { type MdaAudioCimMachineAstType, type Document, isBase, isAudioGenerator, isRef, type Base } from './generated/ast.js';
import type { MdaAudioCimMachineServices } from './mda-audio-cim-machines-module.js';

/**
 * Registra los chequeos de validación personalizados.
 */
export function registerValidationChecks(services: MdaAudioCimMachineServices) {
    const registry = services.validation.ValidationRegistry;
    const validator = services.validation.MdaAudioCimMachineValidator;
    const checks: ValidationChecks<MdaAudioCimMachineAstType> = {
        Document: [validator.checkUniqueIds, validator.checkDocumentProperties],
        AudioGenerator: [validator.checkBaseProperties, validator.checkRefProperties],
        Modificator: [validator.checkBaseProperties, validator.checkRefProperties],
        Ref: validator.checkRefDescription
    };
    registry.register(checks, validator);
}

/**
 * Implementación de validaciones personalizadas.
 */
export class MdaAudioCimMachineValidator {

    /**
     * Verifica que todos los IDs sean únicos en todo el documento.
     */
    checkUniqueIds(doc: Document, accept: ValidationAcceptor): void {
        const reportedIds = new Set<string>();
        const allBaseNodes = AstUtils.streamAllContents(doc).filter(isBase);
        
        for (const node of allBaseNodes) {
            if (reportedIds.has(node.id)) {
                accept('error', `El ID '${node.id}' ya está en uso. Los IDs deben ser únicos en todo el documento.`, { node, property: 'id' });
            } else {
                reportedIds.add(node.id);
            }
        }
    }
    
    /**
     * Verifica las propiedades del documento raíz (name, description).
     */
    checkDocumentProperties(node: Document, accept: ValidationAcceptor): void {
        this.checkStringLength(node, 'id', node.id, 36, 36, accept);
        this.checkStringLength(node, 'name', node.name, 1, 20, accept);
        this.checkStringLength(node, 'description', node.description, 10, 300, accept);
        if (!node.generators) accept('error', 'El documento debe contener una lista de generadores.', { node, property: 'generators' });
        if (!node.modificators) accept('error', 'El documento debe contener una lista de modificadores.', { node, property: 'modificators' });
    }

    /**
     * Verifica las propiedades comunes de Base (id, name, description, inputs, outputs, params).
     */
    checkBaseProperties(node: Base, accept: ValidationAcceptor): void {
        // Validar id: 36 caracteres
        this.checkStringLength(node, 'id', node.id, 36, 36, accept);
        
        // Validar name: 1-20 caracteres
        this.checkStringLength(node, 'name', node.name, 1, 20, accept);
        
        // Validar description: 10-300 caracteres
        this.checkStringLength(node, 'description', node.description, 10, 300, accept);
        
        // Validar inputs: 10-300 caracteres
        this.checkStringLength(node, 'inputs', node.inputs, 10, 300, accept);
        
        // Validar outputs: 10-300 caracteres
        this.checkStringLength(node, 'outputs', node.outputs, 10, 300, accept);
        
        // Validar params: 10-300 caracteres
        this.checkStringLength(node, 'params', node.params, 10, 300, accept);
    }

    /**
     * Verifica que las referencias (rel y ref) tengan descriptions válidas.
     */
    checkRefProperties(node: Base, accept: ValidationAcceptor): void {
        if (node.refs) {
            node.refs.forEach(ref => this.checkRefDescription(ref, accept));
        }
        if (isAudioGenerator(node) && node.rels) {
            node.rels.forEach(rel => {
                this.checkRefDescription(rel, accept);
                // Validar que la referencia en rel sea de tipo AudioGenerator
                if (rel.id && rel.id.ref && !isAudioGenerator(rel.id.ref)) {
                    accept('error', 'Solo se permiten referencias a objetos de tipo AudioGenerator en el array rel.', { node: rel, property: 'id' });
                }
            });
        }
    }

    /**
     * Verifica la longitud de la descripción de un Ref.
     */
    checkRefDescription(ref: any, accept: ValidationAcceptor): void {
        if (isRef(ref)) {
            this.checkStringLength(ref, 'description', ref.description, 10, 300, accept);
        }
    }

    /**
     * Función auxiliar para validar la longitud de una cadena.
     */
    private checkStringLength(node: any, property: string, value: string, min: number, max: number, accept: ValidationAcceptor): void {
        if (!value) {
            accept('error', `El campo '${property}' es obligatorio.`, { node, property });
        } else if (value.length < min || value.length > max) {
            accept('error', `El campo '${property}' debe tener entre ${min} y ${max} caracteres. Longitud actual: ${value.length}.`, { node, property });
        }
    }
}
