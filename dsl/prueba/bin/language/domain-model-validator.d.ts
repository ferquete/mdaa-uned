import type { ValidationAcceptor } from 'langium';
import type { Entity } from './generated/ast.js';
import type { DomainModelServices } from './domain-model-module.js';
/**
 * Implementation of custom validations.
 */
export declare class DomainModelValidator {
    checkEntityStartsWithCapital(entity: Entity, accept: ValidationAcceptor): void;
}
/**
 * Register custom validation checks.
 */
export declare function registerValidator(services: DomainModelServices): void;
