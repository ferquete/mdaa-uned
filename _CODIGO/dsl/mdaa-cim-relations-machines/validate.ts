/// <reference types="node" />
import fs from 'fs';
import path from 'path';
// @ts-ignore
import { createMdaAudioCimRelationsMachinesServices } from './packages/language/out/mda-audio-cim-relations-machines-module.js';
// @ts-ignore
import { NodeFileSystem } from 'langium/node';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';

async function validateSingleFile(filePath: string, cimMachinesDir?: string, services?: any, ajv?: any, schema?: any) {
    const absolutePath = path.resolve(filePath);
    const content = fs.readFileSync(absolutePath, 'utf-8');
    let json: any;
    try { json = JSON.parse(content); } catch (e) {
        console.error(`❌ ${filePath}: Error de parseo JSON.`);
        return false;
    }

    // 1. Langium
    const { URI } = await import('vscode-uri');
    const uri = URI.file(absolutePath + '.mdaacimrelationsmachines');
    const document = (services.shared.workspace.LangiumDocumentFactory as any).create(uri, content);
    await services.shared.workspace.DocumentBuilder.build([document], { validation: true });
    const diagnostics = document.diagnostics || [];
    let langiumOk = true;
    if (diagnostics.length > 0) {
        langiumOk = false;
        diagnostics.forEach((d: any) => {
            console.error(`  [Langium Error] ${d.message} (línea ${d.range.start.line + 1})`);
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

    // 3. Cross-Validation
    let crossOk = true;
    if (cimMachinesDir) {
        const cimPath = path.resolve(cimMachinesDir);
        const machines = new Map<string, { out: boolean, in: boolean }>();
        fs.readdirSync(cimPath).filter(f => f.endsWith('.json')).forEach(file => {
            try {
                const cim = JSON.parse(fs.readFileSync(path.join(cimPath, file), 'utf-8'));
                if (cim.id) {
                    const hasOut = cim.elements?.some((e: any) => e.externalOutput?.hasExternalOutput === true);
                    const hasIn = cim.elements?.some((e: any) => e.externalInput?.hasExternalInput === true);
                    machines.set(cim.id, { out: !!hasOut, in: !!hasIn });
                }
            } catch (e) {}
        });

        (json.relations || []).forEach((rel: any, index: number) => {
            const src = machines.get(rel.source);
            const dst = machines.get(rel.destination);
            if (!src) { console.error(`  [Cross Error] Relación ${index}: Origen '${rel.source}' no existe.`); crossOk = false; }
            else if (!src.out) { console.error(`  [Cross Error] Relación ${index}: Origen '${rel.source}' sin puertos de salida.`); crossOk = false; }
            if (!dst) { console.error(`  [Cross Error] Relación ${index}: Destino '${rel.destination}' no existe.`); crossOk = false; }
            else if (!dst.in) { console.error(`  [Cross Error] Relación ${index}: Destino '${rel.destination}' sin puertos de entrada.`); crossOk = false; }
        });
    }

    if (langiumOk && schemaOk && crossOk) {
        console.log(`✅ ${filePath}: Válido.`);
        return true;
    } else {
        console.error(`❌ ${filePath}: Inválido.`);
        return false;
    }
}

async function validate() {
    const inputPath = process.argv[2];
    const cimMachinesDir = process.argv[3];

    if (!inputPath) {
        console.error('Uso: node validate-cim-relations.ts <fichero-o-directorio-json> [directorio-maquinas-cim]');
        process.exit(1);
    }

    const absoluteInputPath = path.resolve(inputPath);
    if (!fs.existsSync(absoluteInputPath)) {
        console.error(`Error: '${inputPath}' no existe.`);
        process.exit(1);
    }

    const services = createMdaAudioCimRelationsMachinesServices(NodeFileSystem).MdaAudioCimRelationsMachines;
    const ajv = new (Ajv as any)({ allErrors: true, verbose: true });
    addFormats(ajv as any);
    
    const schemaPath = path.resolve('./mdaa-cim-relations-machines.schema.json');
    const schema = fs.existsSync(schemaPath) ? JSON.parse(fs.readFileSync(schemaPath, 'utf-8')) : null;

    const stats = fs.statSync(absoluteInputPath);
    let allOk = true;

    if (stats.isDirectory()) {
        console.log(`🔍 Validando directorio: ${inputPath}\n`);
        const files = fs.readdirSync(absoluteInputPath).filter(f => f.endsWith('.json'));
        for (const file of files) {
            const ok = await validateSingleFile(path.join(inputPath, file), cimMachinesDir, services, ajv, schema);
            if (!ok) allOk = false;
        }
    } else {
        allOk = await validateSingleFile(inputPath, cimMachinesDir, services, ajv, schema);
    }

    if (allOk) {
        console.log('\n✨ ¡Validación completada con éxito!');
    } else {
        console.error('\n❌ Se encontraron errores durante la validación.');
        process.exit(1);
    }
}

validate().catch(err => { console.error('Error:', err); process.exit(1); });
