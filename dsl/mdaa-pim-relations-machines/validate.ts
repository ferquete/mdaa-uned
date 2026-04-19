/// <reference types="node" />
import fs from 'fs';
import path from 'path';
// @ts-ignore
import { createMdaAudioPimRelationsMachinesServices } from './packages/language/out/mda-audio-pim-relations-machines-module.js';
// @ts-ignore
import { NodeFileSystem } from 'langium/node';
import { URI } from 'vscode-uri';

/**
 * Validador PIM Relations (Version Final - Escaneo Recursivo de Puertos)
 */

async function validateSingleFile(filePath: string, services: any, pimMachinesDir?: string) {
    const absolutePath = path.resolve(filePath);
    const content = fs.readFileSync(absolutePath, 'utf-8');
    let json: any;
    try { 
        json = JSON.parse(content); 
    } catch (e) {
        console.error(`❌ ${filePath}: Error de parseo JSON.`);
        return false;
    }

    // 1. Langium Validation
    const virtualUri = URI.file(absolutePath + '.mdapimrelationsmachines');
    const document = services.shared.workspace.LangiumDocumentFactory.create(virtualUri, content);
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

    // 2. Cross-Validation PIM Machines
    let crossOk = true;
    if (pimMachinesDir) {
        const machinesPath = path.resolve(pimMachinesDir);
        if (!fs.existsSync(machinesPath)) {
            console.error(`  [Cross Error] El directorio de máquinas PIM no existe: ${pimMachinesDir}`);
            crossOk = false;
        } else {
            const possibleOutputs = new Set<string>();
            const possibleInputs = new Set<string>();

            const files = fs.readdirSync(machinesPath).filter(f => f.endsWith('.json'));
            for (const file of files) {
                try {
                    const m = JSON.parse(fs.readFileSync(path.join(machinesPath, file), 'utf-8'));
                    
                    const scanPorts = (obj: any) => {
                        if (!obj || typeof obj !== 'object') return;
                        for (const key in obj) {
                            const val = obj[key];
                            if (val && typeof val === 'object' && val.id) {
                                // Es un punto técnico (puerto o parámetro)
                                if (key.startsWith('output') || val.isExternalOutput === true) {
                                    possibleOutputs.add(val.id);
                                }
                                if (key.startsWith('input') || val.isExternalInput === true || val.isModifiable === true || 
                                    ['frequency', 'gain', 'cutoff', 'resonance', 'q', 'pan', 'rate', 'depth', 'feedback', 'mix', 'roomSize', 'damping', 'decayTime', 'dryWet', 'attack', 'decay', 'sustain', 'release', 'hold', 'delay'].includes(key)) {
                                    possibleInputs.add(val.id);
                                }
                            }
                            scanPorts(val);
                        }
                    };

                    (m.nodes || []).forEach((node: any) => scanPorts(node));
                } catch (e) {}
            }

            (json.relations || []).forEach((rel: any) => {
                const relId = rel.id || 'N/A';
                if (rel.source && !possibleOutputs.has(rel.source)) {
                    console.error(`  [Cross Error] Relacion '${relId}': El source '${rel.source}' no es un puerto de salida valido.`);
                    crossOk = false;
                }
                if (rel.destination && !possibleInputs.has(rel.destination)) {
                    console.error(`  [Cross Error] Relacion '${relId}': El destination '${rel.destination}' no es un puerto de entrada o parametro valido.`);
                    crossOk = false;
                }
            });
        }
    }

    if (langiumOk && crossOk) {
        console.log(`✅ ${filePath}: Válido.`);
        return true;
    } else {
        console.error(`❌ ${filePath}: Inválido.`);
        return false;
    }
}

async function validate() {
    const inputPath = process.argv[2];
    const pimMachinesDir = process.argv[3];

    if (!inputPath) {
        console.error('Uso: node validate.ts <fichero-o-directorio-relations> [directorio-pim-machines]');
        process.exit(1);
    }

    const { MdaAudioPimRelationsMachines } = createMdaAudioPimRelationsMachinesServices(NodeFileSystem);
    const services = MdaAudioPimRelationsMachines;

    const absoluteInputPath = path.resolve(inputPath);
    const stats = fs.statSync(absoluteInputPath);
    let allOk = true;

    if (stats.isDirectory()) {
        console.log(`🔍 Validando directorio PIM Relations: ${inputPath}\n`);
        const files = fs.readdirSync(absoluteInputPath).filter(f => f.endsWith('.json'));
        for (const file of files) {
            const ok = await validateSingleFile(path.join(inputPath, file), services, pimMachinesDir);
            if (!ok) allOk = false;
        }
    } else {
        allOk = await validateSingleFile(inputPath, services, pimMachinesDir);
    }

    if (allOk) {
        console.log('\n✨ ¡Validación completada con éxito!');
    } else {
        console.error('\n❌ Se encontraron errores durante la validación.');
        process.exit(1);
    }
}

validate().catch(err => { 
    console.error('Error catastrófico:', err); 
    process.exit(1); 
});
