import { Command } from 'commander';
import { createDomainModelServices } from '../language/domain-model-module.js';
import { NodeFileSystem } from 'langium/node';
import { generateJavaScript } from './generator.js';
import { extractAstNode } from './cli-util.js';
export const generateAction = async (fileName, opts) => {
    const services = createDomainModelServices(NodeFileSystem).DomainModel;
    const model = await extractAstNode(fileName, services);
    const generatedFilePath = generateJavaScript(model, fileName, opts.destination);
    console.log(`Successfully generated to ${generatedFilePath}`);
};
export default function () {
    const program = new Command();
    program
        .version('1.0.0');
    program
        .command('generate')
        .argument('<file>', 'source file (with .langium extension)')
        .option('-d, --destination <dir>', 'destination directory of the output')
        .description('generates a JavaScript file that prints the domain model')
        .action(generateAction);
    program.parse(process.argv);
}
//# sourceMappingURL=index.js.map