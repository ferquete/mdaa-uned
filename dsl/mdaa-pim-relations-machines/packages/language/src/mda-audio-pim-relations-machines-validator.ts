import type { ValidationChecks } from 'langium';
import type { MdaAudioPimRelationsMachinesAstType } from './generated/ast.js';
import type { MdaAudioPimRelationsMachinesServices } from './mda-audio-pim-relations-machines-module.js';

/**
 * Register custom validation checks.
 */
export function registerValidationChecks(services: MdaAudioPimRelationsMachinesServices) {
    const registry = services.validation.ValidationRegistry;
    const validator = services.validation.MdaAudioPimRelationsMachinesValidator;
    const checks: ValidationChecks<MdaAudioPimRelationsMachinesAstType> = {
        // TODO: Declare validators for your properties
        // See doc : https://langium.org/docs/learn/workflow/create_validations/
        /*
        Element: validator.checkElement
        */
    };
    registry.register(checks, validator);
}

/**
 * Implementation of custom validations.
 */
export class MdaAudioPimRelationsMachinesValidator {

    // TODO: Add logic here for validation checks of properties
    // See doc : https://langium.org/docs/learn/workflow/create_validations/
    /*
    checkElement(element: Element, accept: ValidationAcceptor): void {
        // Always accepts
    }
    */
}
