import { createMdaAudioCimMachineServices } from '../mda-audio-cim-machines-module.js';
import { NodeFileSystem } from 'langium/node';
import path from 'path';
import fs from 'fs';
import { URI } from 'vscode-uri';

const services = createMdaAudioCimMachineServices(NodeFileSystem).MdaAudioCimMachine;
const documentBuilder = services.shared.workspace.DocumentBuilder;

async function validateDsl(filePath: string) {
    if (!fs.existsSync(filePath)) {
        console.error(`❌ Error: El archivo '${filePath}' no existe.`);
        return;
    }

    const absolutePath = path.resolve(filePath);
    const uri = URI.file(absolutePath);
    
    try {
        const document = await services.shared.workspace.LangiumDocuments.getOrCreateDocument(uri);
        await documentBuilder.build([document], { validation: true });
        
        const diagnostics = document.diagnostics || [];
        
        if (diagnostics.length === 0) {
            console.log(`✅ ${path.basename(filePath)}: El archivo es válido.`);
        } else {
            console.error(`❌ ${path.basename(filePath)}: Se encontraron errores:`);
            diagnostics.forEach(d => {
                const severity = d.severity === 1 ? 'Error' : 'Warning';
                const line = d.range.start.line + 1;
                console.error(`   - [${severity}] ${d.message} (Línea: ${line})`);
            });
        }
    } catch (e: any) {
        console.error(`❌ Error crítico en ${path.basename(filePath)}:`, e.message);
    }
}

const args = process.argv.slice(2);
if (args.length === 0) {
    console.log('Uso: npx tsx validate-dsl.ts <archivo.mdaacimmachine>');
} else {
    for (const arg of args) {
        await validateDsl(arg);
    }
}
