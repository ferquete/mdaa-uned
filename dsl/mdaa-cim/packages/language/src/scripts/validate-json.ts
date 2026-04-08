import { createMdaAudioCimServices } from '../mda-audio-cim-module.js';
import { NodeFileSystem } from 'langium/node';
import path from 'path';
import fs from 'fs';
import { URI } from 'vscode-uri';

const services = createMdaAudioCimServices(NodeFileSystem).MdaAudioCim;
const jsonSerializer = services.serializer.JsonSerializer;
const documentValidator = services.validation.DocumentValidator;

/**
 * Valida un archivo JSON contra la gramática y reglas de MDAA-CIM.
 * @param filePath Ruta al archivo JSON.
 */
async function validateJson(filePath: string) {
    if (!fs.existsSync(filePath)) {
        console.error(`❌ Error: El archivo '${filePath}' no existe.`);
        process.exit(1);
    }

    const absolutePath = path.resolve(filePath);
    const jsonContent = fs.readFileSync(absolutePath, 'utf-8');
    
    try {
        // 1. Deserializar el JSON a nodos AST
        const data = JSON.parse(jsonContent);
        // Si el JSON no tiene $type, asumimos que es el nodo raíz 'Document'
        if (typeof data === 'object' && data !== null && !data.$type) {
            data.$type = 'Document';
        }
        const astNode = jsonSerializer.deserialize(JSON.stringify(data));
        
        // 2. Crear un documento virtual con una extensión reconocida por Langium
        // Usamos una extensión falsa para que la ServiceRegistry asocie el documento con MDAA-CIM
        const dummyUri = URI.file(absolutePath + '.mdaacim');
        const document = services.shared.workspace.LangiumDocuments.createDocument(dummyUri, jsonContent);
        
        // Inyectar el AST deserializado y marcar como parseado para saltar el parser de texto
        (document as any).parseResult = { value: astNode, parserErrors: [], lexerErrors: [] };
        (document as any).state = 2; // DocumentState.Parsed

        // 3. Ejecutar la validación completa (incluyendo chequeos personalizados)
        const diagnostics = await documentValidator.validateDocument(document);
        
        if (diagnostics.length === 0) {
            console.log('✅ El JSON es válido y cumple con todas las reglas de MDAA-CIM.');
        } else {
            console.error('❌ Se encontraron errores de validación:');
            diagnostics.forEach(d => {
                const severity = d.severity === 1 ? 'Error' : 'Warning';
                const line = d.range.start.line + 1;
                console.error(`   - [${severity}] ${d.message} (Línea aproximada: ${line})`);
            });
            process.exit(1);
        }
    } catch (e: any) {
        console.error('❌ Error crítico al procesar el JSON:', e.message);
        process.exit(1);
    }
}

// Obtener argumentos de línea de comandos
const args = process.argv.slice(2);
if (args.length === 0) {
    console.log('Uso: node validate-json.js <archivo.json>');
    process.exit(1);
}

validateJson(args[0]);
