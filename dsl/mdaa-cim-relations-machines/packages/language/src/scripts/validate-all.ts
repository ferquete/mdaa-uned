import { createMdaAudioCimRelationsMachinesServices } from '../mda-audio-cim-relations-machines-module.js';
import { NodeFileSystem } from 'langium/node';
import path from 'path';
import fs from 'fs';
import { URI } from 'vscode-uri';
import { Validator } from 'jsonschema';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const services = createMdaAudioCimRelationsMachinesServices(NodeFileSystem).MdaAudioCimRelationsMachines;
const jsonSerializer = services.serializer.JsonSerializer;
const documentValidator = services.validation.DocumentValidator;

// Cargar schema
const schemaPath = path.resolve(__dirname, '../../../../mdaa-cim-relations-machines.schema.json');
const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf-8'));
const v = new Validator();

async function validateFull(filePath: string) {
    if (!fs.existsSync(filePath)) {
        console.error(`❌ Error: El archivo '${filePath}' no existe.`);
        return false;
    }

    const absolutePath = path.resolve(filePath);
    const jsonContent = fs.readFileSync(absolutePath, 'utf-8');
    let data;

    try {
        data = JSON.parse(jsonContent);
    } catch (e: any) {
        console.error(`❌ ${path.basename(filePath)}: JSON malformado.`);
        return false;
    }

    console.log(`\n🔍 Validando: ${path.basename(filePath)}`);

    // 1. Validar contra el Schema JSON (Estructura)
    const schemaResult = v.validate(data, schema);
    if (!schemaResult.valid) {
        console.error('❌ Error de Schema JSON:');
        schemaResult.errors.forEach(err => {
            console.error(`   - ${err.stack}`);
        });
        return false;
    }
    console.log('✅ Estructura JSON válida (Schema).');

    // 2. Validar contra Langium (Lógica de negocio/DSL)
    try {
        if (typeof data === 'object' && data !== null && !data.$type) {
            data.$type = 'RelationDocument';
        }
        const astNode = jsonSerializer.deserialize(JSON.stringify(data));
        const dummyUri = URI.file(absolutePath + '.mdaacimrelationsmachines');
        const document = services.shared.workspace.LangiumDocuments.createDocument(dummyUri, jsonContent);
        
        (document as any).parseResult = { value: astNode, parserErrors: [], lexerErrors: [] };
        (document as any).state = 2; // DocumentState.Parsed

        // Forzar indexación
        await services.shared.workspace.IndexManager.updateContent(document);
        await services.shared.workspace.DocumentBuilder.build([document], { validation: true });

        const diagnostics = await documentValidator.validateDocument(document);
        
        if (diagnostics.length === 0) {
            console.log('✅ Validación de lógica DSL correcta (Langium).');
            return true;
        } else {
            console.error('❌ Errores de validación DSL (Langium):');
            diagnostics.forEach(d => {
                const severity = d.severity === 1 ? 'Error' : 'Warning';
                console.error(`   - [${severity}] ${d.message}`);
            });
            return false;
        }
    } catch (e: any) {
        console.error('❌ Error crítico en validación Langium:', e.message);
        return false;
    }
}

const args = process.argv.slice(2);
if (args.length === 0) {
    console.log('Uso: PATH="/opt/homebrew/bin:$PATH" node out/scripts/validate-all.js <archivo.json>');
    process.exit(1);
}

(async () => {
    let allOk = true;
    for (const arg of args) {
        const ok = await validateFull(arg);
        if (!ok) allOk = false;
    }
    process.exit(allOk ? 0 : 1);
})();
