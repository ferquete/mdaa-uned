import { Model, isPackageDeclaration, isEntity, isDataType } from '../language/generated/ast.js';
import { expandToNode, joinToNode, toString } from 'langium/generate';
import * as fs from 'node:fs';
import * as path from 'node:path';

export function generateJavaScript(model: Model, filePath: string, destination: string | undefined): string {
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

function extractModelData(model: Model): any {
    const entities: any[] = [];
    const datatypes: any[] = [];

    const processElement = (element: any) => {
        if (isPackageDeclaration(element)) {
            element.elements.forEach(processElement);
        } else if (isEntity(element)) {
            entities.push({
                name: element.name,
                extends: element.superType?.$refText,
                features: element.features.map((f: any) => ({
                    name: f.name,
                    many: f.many,
                    type: f.type.primitive || f.type.type?.$refText
                }))
            });
        } else if (isDataType(element)) {
            datatypes.push(element.name);
        }
    };

    model.elements.forEach(processElement);
    return { entities, datatypes };
}
