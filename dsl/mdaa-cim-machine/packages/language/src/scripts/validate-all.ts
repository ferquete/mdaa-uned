import { createMdaAudioCimMachineServices } from '../mda-audio-cim-machines-module.js';
import { NodeFileSystem } from 'langium/node';
import path from 'path';
import fs from 'fs';
import { URI } from 'vscode-uri';
import { Validator } from 'jsonschema';

const services = createMdaAudioCimMachineServices(NodeFileSystem).MdaAudioCimMachine;
const jsonSerializer = services.serializer.JsonSerializer;
const documentValidator = services.validation.DocumentValidator;

import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cargar schema
const schemaPath = path.resolve(__dirname, '../../../../mdaa-cim-machine.schema.json');
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
            data.$type = 'Document';
        }
        const astNode = jsonSerializer.deserialize(JSON.stringify(data));
        const dummyUri = URI.file(absolutePath + '.mdaacimmachine');
        const document = services.shared.workspace.LangiumDocuments.createDocument(dummyUri, jsonContent);
        
        (document as any).parseResult = { value: astNode, parserErrors: [], lexerErrors: [] };
        (document as any).state = 2; // DocumentState.Parsed

        // 2.1 Forzar indexación y enlace para validar referencias
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
