/// <reference types="node" />
import fs from 'fs';
import path from 'path';
// @ts-ignore
import { createMdaAudioCimMachineServices } from './packages/language/out/mda-audio-cim-machines-module.js';
// @ts-ignore
import { NodeFileSystem } from 'langium/node';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';

async function validateSingleFile(filePath: string, services: any, ajv: any, schema: any) {
    const absolutePath = path.resolve(filePath);
    const content = fs.readFileSync(absolutePath, 'utf-8');
    let json: any;
    try { json = JSON.parse(content); } catch (e) {
        console.error(`❌ ${filePath}: Error de parseo JSON.`);
        return false;
    }

    // 1. Langium
    const { URI } = await import('vscode-uri');
    const uri = URI.file(absolutePath + '.mdaacimmachine');
    const document = (services.shared.workspace.LangiumDocumentFactory as any).create(uri, content);
    await services.shared.workspace.DocumentBuilder.build([document], { validation: true });
    const diagnostics = document.diagnostics || [];
    let langiumOk = true;
    if (diagnostics.length > 0) {
        langiumOk = false;
        diagnostics.forEach((d: any) => {
            const severity = d.severity === 1 ? 'Error' : 'Warning';
            console.error(`  [Langium ${severity}] ${d.message} (línea ${d.range.start.line + 1})`);
        });
    }

    // 2. Schema
    let schemaOk = true;
    if (schema) {
        const validateSchema = ajv.compile(schema);
        schemaOk = validateSchema(json);
        if (!schemaOk) {
            (validateSchema.errors || []).forEach((err: any) => {
                console.error(`  [Schema Error] ${err.instancePath || 'root'}: ${err.message}`);
            });
        }
    }

    if (langiumOk && schemaOk) {
        console.log(`✅ ${filePath}: Válido.`);
        return true;
    } else {
        console.error(`❌ ${filePath}: Inválido.`);
        return false;
    }
}

async function validate() {
    const inputPath = process.argv[2];

    if (!inputPath) {
        console.error('Uso: node validate-cim.ts <fichero-o-directorio-json>');
        process.exit(1);
    }

    const absoluteInputPath = path.resolve(inputPath);
    if (!fs.existsSync(absoluteInputPath)) {
        console.error(`Error: '${inputPath}' no existe.`);
        process.exit(1);
    }

    const services = createMdaAudioCimMachineServices(NodeFileSystem).MdaAudioCimMachine;
    const ajv = new (Ajv as any)({ allErrors: true, verbose: true });
    addFormats(ajv as any);
    
    const schemaPath = path.resolve('./mdaa-cim-machine.schema.json');
    const schema = fs.existsSync(schemaPath) ? JSON.parse(fs.readFileSync(schemaPath, 'utf-8')) : null;

    const stats = fs.statSync(absoluteInputPath);
    let allOk = true;

    if (stats.isDirectory()) {
        console.log(`🔍 Validando directorio: ${inputPath}\n`);
        const files = fs.readdirSync(absoluteInputPath).filter(f => f.endsWith('.json'));
        for (const file of files) {
            const ok = await validateSingleFile(path.join(inputPath, file), services, ajv, schema);
            if (!ok) allOk = false;
        }
    } else {
        allOk = await validateSingleFile(inputPath, services, ajv, schema);
    }

    if (allOk) {
        console.log('\n✨ ¡Validación completada con éxito!');
    } else {
        console.error('\n❌ Se encontraron errores durante la validación.');
        process.exit(1);
    }
}

validate().catch(err => { console.error('Error:', err); process.exit(1); });
