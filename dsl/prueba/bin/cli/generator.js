import { isPackageDeclaration, isEntity, isDataType } from '../language/generated/ast.js';
import * as fs from 'node:fs';
import * as path from 'node:path';
export function generateJavaScript(model, filePath, destination) {
    const data = extractModelData(model);
    const fileName = path.basename(filePath, '.langium');
    const destDir = destination || path.join(path.dirname(filePath), 'generated');
    if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
    }
    const outPath = path.join(destDir, `${fileName}.json`);
    fs.writeFileSync(outPath, JSON.stringify(data, null, 2));
    return outPath;
}
function extractModelData(model) {
    const entities = [];
    const datatypes = [];
    const processElement = (element) => {
        if (isPackageDeclaration(element)) {
            element.elements.forEach(processElement);
        }
        else if (isEntity(element)) {
            entities.push({
                name: element.name,
                extends: element.superType?.$refText,
                features: element.features.map((f) => ({
                    name: f.name,
                    many: f.many,
                    type: f.type.primitive || f.type.type?.$refText
                }))
            });
        }
        else if (isDataType(element)) {
            datatypes.push(element.name);
        }
    };
    model.elements.forEach(processElement);
    return { entities, datatypes };
}
//# sourceMappingURL=generator.js.map