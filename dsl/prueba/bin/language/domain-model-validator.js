/**
 * Implementation of custom validations.
 */
export class DomainModelValidator {
    checkEntityStartsWithCapital(entity, accept) {
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
export function registerValidator(services) {
    const registry = services.validation.ValidationRegistry;
    const validator = services.validation.DomainModelValidator;
    const checks = {
        Entity: validator.checkEntityStartsWithCapital
    };
    registry.register(checks, validator);
}
//# sourceMappingURL=domain-model-validator.js.map