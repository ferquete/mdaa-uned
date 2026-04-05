import type { ValidationAcceptor, ValidationChecks } from 'langium';
import type { DomainModelAstType, Entity } from './generated/ast.js';
import type { DomainModelServices } from './domain-model-module.js';

/**
 * Implementation of custom validations.
 */
export class DomainModelValidator {

    checkEntityStartsWithCapital(entity: Entity, accept: ValidationAcceptor): void {
        if (entity.name) {
            const firstChar = entity.name.substring(0, 1);
            if (firstChar.toUpperCase() !== firstChar) {
                accept('warning', 'Entity name should start with a capital.', { node: entity, property: 'name' });
            }
        }
    }

}

/**
 * Register custom validation checks.
 */
export function registerValidator(services: DomainModelServices) {
    const registry = services.validation.ValidationRegistry;
    const validator = services.validation.DomainModelValidator;
    const checks: ValidationChecks<DomainModelAstType> = {
        Entity: validator.checkEntityStartsWithCapital
    };
    registry.register(checks, validator);
}
