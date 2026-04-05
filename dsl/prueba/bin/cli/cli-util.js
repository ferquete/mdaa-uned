import { URI } from 'vscode-uri';
import * as path from 'node:path';
export async function extractAstNode(fileName, services) {
    const extensions = services.LanguageMetaData.fileExtensions;
    if (!extensions.includes(path.extname(fileName))) {
        throw new Error(`Please choose a file with one of these extensions: ${extensions}.`);
    }
    const uri = URI.file(path.resolve(fileName));
    const document = await services.shared.workspace.LangiumDocuments.getOrCreateDocument(uri);
    if (!document) {
        throw new Error(`Could not read file: ${fileName}`);
    }
    const parseResult = document.parseResult;
    if (parseResult.lexerErrors.length > 0 || parseResult.parserErrors.length > 0) {
        throw new Error(`File ${fileName} has parsing errors.`);
    }
    return parseResult.value;
}
//# sourceMappingURL=cli-util.js.map