import { type ValidationAcceptor, type ValidationChecks, AstUtils } from 'langium';
import { type MdaAudioCimMachineAstType, type Document, isBase, type Base, type SendTo } from './generated/ast.js';
import type { MdaAudioCimMachineServices } from './mda-audio-cim-machines-module.js';

/**
 * Registra los chequeos de validación personalizados.
 */
export function registerValidationChecks(services: MdaAudioCimMachineServices) {
    const registry = services.validation.ValidationRegistry;
    const validator = services.validation.MdaAudioCimMachineValidator;
    const checks: ValidationChecks<MdaAudioCimMachineAstType> = {
        Document: [validator.checkUniqueIds, validator.checkDocumentProperties],
        Element: [validator.checkBaseProperties, validator.checkSendToProperties, validator.checkExternalConnections],
        SendTo: [validator.checkSendToPropertiesSingle]
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
        this.checkStringLength(node, 'description', node.description, 10, 600, accept);
        if (!node.elements) accept('error', 'El documento debe contener una lista de elementos.', { node, property: 'elements' });
    }

    /**
     * Verifica las propiedades comunes de Base (id, name, description, params).
     */
    checkBaseProperties(node: Base, accept: ValidationAcceptor): void {
        // Validar id: 36 caracteres
        this.checkStringLength(node, 'id', node.id, 36, 36, accept);
        
        // Validar name: 1-20 caracteres
        this.checkStringLength(node, 'name', node.name, 1, 20, accept);
        
        // Validar description: 10-600 caracteres
        this.checkStringLength(node, 'description', node.description, 10, 600, accept);
        
        // Validar params: 10-600 caracteres
        this.checkStringLength(node, 'params', node.params, 10, 600, accept);
    }

    /**
     * Verifica las propiedades de las conexiones externas (ExternalInput / ExternalOutput)
     */
    checkExternalConnections(node: Base, accept: ValidationAcceptor): void {
        if (node.externalOutput && node.externalOutput.description) {
            if (node.externalOutput.description.length > 600) {
                accept('error', 'El campo description de externalOutput no puede exceder 600 caracteres.', { node: node.externalOutput, property: 'description' });
            }
        }
        if (node.externalInput && node.externalInput.description) {
            if (node.externalInput.description.length > 600) {
                accept('error', 'El campo description de externalInput no puede exceder 600 caracteres.', { node: node.externalInput, property: 'description' });
            }
        }
    }

    /**
     * Verifica que el array sendTo sea válido.
     */
    checkSendToProperties(node: Base, accept: ValidationAcceptor): void {
        if (node.sendTo) {
            const sendToIds = new Set<string>();
            node.sendTo.forEach(item => {
                // Unicidad interna de IDs en sendTo
                if (sendToIds.has(item.id)) {
                    accept('error', `El ID '${item.id}' está duplicado en la lista sendTo.`, { node: item, property: 'id' });
                } else {
                    sendToIds.add(item.id);
                }
                
                // No auto-referencia
                const targetRefId = (item.idRef as any)?.$refText ?? (typeof item.idRef === 'string' ? item.idRef : undefined);
                if (targetRefId === node.id) {
                    accept('error', 'Un elemento no puede referenciarse a sí mismo en la lista sendTo.', { node: item, property: 'idRef' });
                }
            });
        }
    }

    /**
     * Verifica las propiedades de un SendTo individual.
     */
    checkSendToPropertiesSingle(item: SendTo, accept: ValidationAcceptor): void {
        // Validar id: 36 caracteres
        this.checkStringLength(item, 'id', item.id, 36, 36, accept);
        
        // Validar description: 10-600 caracteres
        this.checkStringLength(item, 'description', item.description, 10, 600, accept);
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
