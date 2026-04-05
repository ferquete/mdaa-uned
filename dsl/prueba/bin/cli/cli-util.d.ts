import type { AstNode } from 'langium';
import type { LangiumServices } from 'langium/lsp';
export declare function extractAstNode<T extends AstNode>(fileName: string, services: LangiumServices): Promise<T>;
