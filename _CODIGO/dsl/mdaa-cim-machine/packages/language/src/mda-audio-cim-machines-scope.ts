import { DefaultNameProvider, type AstNode } from 'langium';
import { isBase } from './generated/ast.js';

export class MdaAudioCimMachineNameProvider extends DefaultNameProvider {
    override getName(node: AstNode): string | undefined {
        if (isBase(node)) {
            return node.id;
        }
        return super.getName(node);
    }
}
