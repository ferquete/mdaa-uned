/// <reference types="node" />
import fs from 'fs';
import path from 'path';
// @ts-ignore
import { createMdaAudioPimMachineServices } from './packages/language/out/mda-audio-pim-machine-module.js';
// @ts-ignore
import { NodeFileSystem } from 'langium/node';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';

async function validateSingleFile(filePath: string, services: any, ajv: any, schema: any, cimDir?: string) {
    const absolutePath = path.resolve(filePath);
    const content = fs.readFileSync(absolutePath, 'utf-8');
    let json: any;
    try { json = JSON.parse(content); } catch (e) {
        console.error(`❌ ${filePath}: Error de parseo JSON.`);
        return false;
    }

    // 1. Langium
    const { URI } = await import('vscode-uri');
    const uri = URI.file(absolutePath + '.mdaapimmachine');
    const document = (services.shared.workspace.LangiumDocumentFactory as any).create(uri, content);
    await services.shared.workspace.DocumentBuilder.build([document], { validation: true });
    const diagnostics = (document.diagnostics || []).filter((d: any) => 
        !d.message.includes('ids_references no puede estar vacía') &&
        !d.message.includes('lista de referencias de la arista no puede estar vacía')
    );
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

    // 3. Cross-Validation CIM
    let crossOk = true;
    if (cimDir) {
        const cimPath = path.resolve(cimDir);
        if (!fs.existsSync(cimPath)) {
            console.error(`  [Cross Error] El directorio de máquinas CIM no existe: ${cimDir}`);
            crossOk = false;
        } else {
            // Indexar IDs de máquinas y sus elementos internos
            const cimUniverse = new Map<string, Set<string>>();
            fs.readdirSync(cimPath).filter(f => f.endsWith('.json')).forEach(file => {
                try {
                    const cim = JSON.parse(fs.readFileSync(path.join(cimPath, file), 'utf-8'));
                    if (cim.id) {
                        const elements = new Set<string>();
                        (cim.elements || []).forEach((e: any) => {
                            elements.add(e.id);
                            // También indexar IDs de sendTo si fuera necesario, pero ids_references suele ser a elementos raíz
                        });
                        cimUniverse.set(cim.id, elements);
                    }
                } catch (e) {}
            });

            // Verificar ids_cim_reference
            const referencedCimIds = json.ids_cim_reference || [];
            const activeElements = new Set<string>();

            referencedCimIds.forEach((cimId: string) => {
                const machineElements = cimUniverse.get(cimId);
                if (!machineElements) {
                    console.error(`  [Cross Error] CIM Reference '${cimId}' no encontrada en el directorio.`);
                    crossOk = false;
                } else {
                    machineElements.forEach(id => activeElements.add(id));
                }
            });

            // Verificar ids_references en todo el documento PIM
            const checkRefs = (obj: any, path: string) => {
                if (!obj || typeof obj !== 'object') return;
                
                if (Array.isArray(obj.ids_references)) {
                    obj.ids_references.forEach((refId: string) => {
                        if (!activeElements.has(refId)) {
                            console.error(`  [Cross Error] Referencia CIM '${refId}' no encontrada en las máquinas vinculadas.`);
                            crossOk = false;
                        }
                    });
                }

                for (const key in obj) {
                    if (key !== 'ids_references') checkRefs(obj[key], `${path}.${key}`);
                }
            };

            checkRefs(json, 'root');
        }
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
    const cimDir = process.argv[3];

    if (!inputPath) {
        console.error('Uso: node validate.ts <fichero-o-directorio-pim> [directorio-cim-machines]');
        process.exit(1);
    }

    const services = createMdaAudioPimMachineServices(NodeFileSystem).MdaAudioPimMachine;
    const ajv = new (Ajv as any)({ allErrors: true, verbose: true });
    addFormats(ajv as any);
    
    const schemaPath = path.resolve('./mda-audio-pim-machine.schema.json');
    const schema = fs.existsSync(schemaPath) ? JSON.parse(fs.readFileSync(schemaPath, 'utf-8')) : null;

    const absoluteInputPath = path.resolve(inputPath);
    const stats = fs.statSync(absoluteInputPath);
    let allOk = true;

    if (stats.isDirectory()) {
        console.log(`🔍 Validando directorio PIM: ${inputPath}\n`);
        const files = fs.readdirSync(absoluteInputPath).filter(f => f.endsWith('.json'));
        for (const file of files) {
            const ok = await validateSingleFile(path.join(inputPath, file), services, ajv, schema, cimDir);
            if (!ok) allOk = false;
        }
    } else {
        allOk = await validateSingleFile(inputPath, services, ajv, schema, cimDir);
    }

    if (allOk) {
        console.log('\n✨ ¡Validación completada con éxito!');
    } else {
        console.error('\n❌ Se encontraron errores durante la validación.');
        process.exit(1);
    }
}

validate().catch(err => { console.error('Error:', err); process.exit(1); });
