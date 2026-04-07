import { type ValidationAcceptor, type ValidationChecks, AstUtils } from 'langium';
import { type MdaAudioCimAstType, type MDAA_CIM, isCIM_GENERADORES, isOSCILADOR, isMODIFICADOR } from './generated/ast.js';
import type { MdaAudioCimServices } from './mda-audio-cim-module.js';

/**
 * Register custom validation checks.
 */
export function registerValidationChecks(services: MdaAudioCimServices) {
    const registry = services.validation.ValidationRegistry;
    const validator = services.validation.MdaAudioCimValidator;
    const checks: ValidationChecks<MdaAudioCimAstType> = {
        MDAA_CIM: [validator.checkAtLeastOneOscillator, validator.checkUniqueIds]
    };
    registry.register(checks, validator);
}

/**
 * Implementation of custom validations.
 */
export class MdaAudioCimValidator {

    /**
     * Verifica que el documento contenga al menos un OSCILADOR.
     */
    checkAtLeastOneOscillator(model: MDAA_CIM, accept: ValidationAcceptor): void {
        const allNodes = AstUtils.streamAllContents(model);
        const hasOscillator = allNodes.some(node => isOSCILADOR(node));
        
        if (!hasOscillator) {
            accept('error', 'El documento debe contener al menos un OSCILADOR.', { node: model, property: 'name' });
        }
    }

    /**
     * Verifica que todos los IDs sean únicos en todo el documento.
     */
    checkUniqueIds(model: MDAA_CIM, accept: ValidationAcceptor): void {
        const reportedIds = new Set<string>();
        const allNodes = AstUtils.streamAllContents(model);
        
        for (const node of allNodes) {
            if (isCIM_GENERADORES(node) || isOSCILADOR(node) || isMODIFICADOR(node)) {
                const nameNode = node as { name: string };
                if (reportedIds.has(nameNode.name)) {
                    accept('error', `El ID '${nameNode.name}' ya está en uso. Los IDs deben ser únicos en todo el documento.`, { node, property: 'name' });
                } else {
                    reportedIds.add(nameNode.name);
                }
            }
        }
    }
}
