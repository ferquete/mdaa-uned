import type { ValidationAcceptor, ValidationChecks } from 'langium';
import { 
    MdaAudioPimMachineAstType, Model, Parameter, InputPoint, OutputPoint, Edge, Matrix, OscillatorNode, NoiseNode, SampleNode, 
    FrequencyFilterNode, LFONode, EnvelopeNode, GainAndPanNode, ReverbNode, DelayNode, DistortionNode, 
    ChorusFlangerNode, CompressorNode, EqualizerNode, MixerNode, isNumberValue, isStringValue, isBooleanValue, isMatrix 
} from './generated/ast.js';
import type { MdaAudioPimMachineServices } from './mda-audio-pim-machine-module.js';

/**
 * Register custom validation checks.
 */
export function registerValidationChecks(services: MdaAudioPimMachineServices) {
    const registry = services.validation.ValidationRegistry;
    const validator = services.validation.MdaAudioPimMachineValidator;
    const checks: ValidationChecks<MdaAudioPimMachineAstType> = {
        Model: [validator.checkModelIntegrity],
        Parameter: [validator.checkParameter],
        InputPoint: [validator.checkInputPoint],
        OutputPoint: [validator.checkOutputPoint],
        Edge: [validator.checkEdge],
        Matrix: [validator.checkMatrix],
        OscillatorNode: [validator.checkOscillator, validator.checkAudioOutputs],
        NoiseNode: [validator.checkNoise, validator.checkAudioOutputs],
        SampleNode: [validator.checkSample, validator.checkAudioOutputs],
        FrequencyFilterNode: [validator.checkFilter, validator.checkSoundModifier],
        LFONode: [validator.checkLFO],
        EnvelopeNode: [validator.checkEnvelope],
        MixerNode: [validator.checkMixer],
        GainAndPanNode: [validator.checkGainAndPan, validator.checkGainAndPanStructure],
        ReverbNode: [validator.checkReverb, validator.checkSoundModifier],
        DelayNode: [validator.checkDelay, validator.checkSoundModifier],
        DistortionNode: [validator.checkDistortion, validator.checkSoundModifier],
        ChorusFlangerNode: [validator.checkChorusFlanger, validator.checkSoundModifier],
        CompressorNode: [validator.checkCompressor, validator.checkSoundModifier],
        EqualizerNode: [validator.checkEqualizer, validator.checkSoundModifier]
    };
    registry.register(checks, validator);
}

/**
 * Implementation of custom validations.
 */
export class MdaAudioPimMachineValidator {

    private uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    /**
     * Valida la integridad referencial del modelo (nodos y parámetros existentes en las aristas).
     */
    checkModelIntegrity(model: Model, accept: ValidationAcceptor): void {
        const paramIds = new Set<string>();

        for (const node of model.nodes) {
            this.collectParamIds(node, paramIds);
        }

        for (const edge of model.edges) {
            const sNodeId = edge.sourceNode.replace(/"/g, '');
            const sParamId = edge.sourceParam.replace(/"/g, '');
            const tNodeId = edge.targetNode.replace(/"/g, '');
            const tParamId = edge.targetParam.replace(/"/g, '');

            const sNode = model.nodes.find(n => n.id.replace(/"/g, '') === sNodeId);
            const tNode = model.nodes.find(n => n.id.replace(/"/g, '') === tNodeId);

            if (!sNode) {
                accept('error', `El nodo origen '${sNodeId}' no existe.`, { node: edge, property: 'sourceNode' });
            }
            if (!tNode) {
                accept('error', `El nodo destino '${tNodeId}' no existe.`, { node: edge, property: 'targetNode' });
            }

            if (!paramIds.has(sParamId)) {
                accept('error', `El parámetro origen '${sParamId}' no existe en ningún nodo.`, { node: edge, property: 'sourceParam' });
            }
            if (!paramIds.has(tParamId)) {
                accept('error', `El parámetro destino '${tParamId}' no existe en ningún nodo.`, { node: edge, property: 'targetParam' });
            }

            // Validación de tipos de arista según el parámetro destino
            if (tNode && paramIds.has(tParamId)) {
                this.checkEdgeTypeConsistency(edge, tNode, tParamId, accept);
            }
        }
    }

    /**
     * Valida que el tipo de arista coincida con la naturaleza del parámetro destino.
     * audio -> debe ir a entradas de sonido (input_1..10)
     * modification -> debe ir a parámetros de control
     */
    private checkEdgeTypeConsistency(edge: Edge, tNode: any, tParamId: string, accept: ValidationAcceptor): void {
        const audioInputNames = ['input_1', 'input_2', 'input_3', 'input_4', 'input_5', 'input_6', 'input_7', 'input_8', 'input_9', 'input_10'];
        const outputNames = ['output_1', 'output_2', 'output'];
        const configNames = ['stereo', 'ping_pong', 'inputs_number'];

        let tParamName = '';
        for (const key in tNode) {
            const val = tNode[key];
            if (val && (val.$type === 'Parameter' || val.$type === 'InputPoint' || val.$type === 'OutputPoint') && (val as any).id.replace(/"/g, '') === tParamId) {
                tParamName = key;
                break;
            }
        }

        const isAudioInput = audioInputNames.includes(tParamName);
        const isOutput = outputNames.includes(tParamName);
        const isConfig = configNames.includes(tParamName);

        if (edge.type === '"audio"') {
            if (!isAudioInput) {
                accept('error', `Las aristas de tipo 'audio' solo pueden conectar con entradas de sonido (input_x). El parámetro '${tParamName}' no lo es.`, { node: edge, property: 'type' });
            }
        } else if (edge.type === '"modification"') {
            if (isAudioInput) {
                accept('error', `Las aristas de tipo 'modification' no pueden conectar con entradas de sonido.`, { node: edge, property: 'type' });
            }
            if (isOutput) {
                accept('error', `No se puede aplicar una modificación a un parámetro de salida.`, { node: edge, property: 'type' });
            }
            if (isConfig) {
                accept('error', `No se puede aplicar una modificación a parámetros de configuración base (stereo, ping_pong, inputs_number).`, { node: edge, property: 'type' });
            }
        }
    }

    private collectParamIds(node: any, paramIds: Set<string>): void {
        for (const key in node) {
            const val = node[key];
            if (val && typeof val === 'object' && (val.$type === 'Parameter' || val.$type === 'InputPoint' || val.$type === 'OutputPoint')) {
                paramIds.add((val as any).id.replace(/"/g, ''));
            } else if (Array.isArray(val)) {
                val.forEach(item => {
                    if (item && typeof item === 'object' && (item.$type === 'Parameter' || item.$type === 'InputPoint' || item.$type === 'OutputPoint')) {
                        paramIds.add((item as any).id.replace(/"/g, ''));
                    }
                });
            }
        }
    }

    /**
     * Valida los campos comunes de un parámetro de configuración.
     * Solo permite ids_source_machines si isModifiable es true.
     * NUNCA permite ids_destination_machines.
     */
    checkParameter(param: Parameter, accept: ValidationAcceptor): void {
        const id = param.id.replace(/"/g, '');
        if (!this.uuidRegex.test(id)) {
            accept('error', 'El ID debe ser un UUID válido de 36 caracteres.', { node: param, property: 'id' });
        }
        if (param.ids_references.length === 0) {
            accept('error', 'La lista de referencias ids_references no puede estar vacía.', { node: param, property: 'ids_references' });
        }
        
        // Un parámetro NUNCA puede ser origen de máquinas (no es una salida)
        if ((param as any).ids_destination_machines) {
            accept('error', 'Los parámetros de configuración no pueden tener ids_destination_machines. Usa OutputPoint para salidas.', { node: param, property: 'ids_destination_machines' as any });
        }

        // ids_source_machines SOLO si es modificable
        if (param.isModifiable) {
            if (param.ids_source_machines) {
                param.ids_source_machines.forEach((machineId, index) => {
                    const cleanId = machineId.replace(/"/g, '');
                    if (cleanId.length !== 36) {
                        accept('error', 'Cada ID de máquina de origen debe tener exactamente 36 caracteres.', { node: param, property: 'ids_source_machines', index });
                    }
                });
            }
        } else {
            if (param.ids_source_machines) {
                accept('error', 'Un parámetro no modificable (isModifiable: false) no puede tener ids_source_machines.', { node: param, property: 'ids_source_machines' });
            }
        }

        if (param.description && param.description.length > 600) {
            accept('error', 'La descripción no puede superar los 600 caracteres.', { node: param, property: 'description' });
        }
    }

    /**
     * Valida los campos de una arista.
     */
    checkEdge(edge: Edge, accept: ValidationAcceptor): void {
        const id = edge.id.replace(/"/g, '');
        if (!this.uuidRegex.test(id)) {
            accept('error', 'El ID de la arista debe ser un UUID válido.', { node: edge, property: 'id' });
        }
        if (edge.ids_references.length === 0) {
            accept('error', 'La lista de referencias de la arista no puede estar vacía.', { node: edge, property: 'ids_references' });
        }
        if (edge.description && edge.description.length > 600) {
            accept('error', 'La descripción de la arista no puede superar los 600 caracteres.', { node: edge, property: 'description' });
        }
    }

    /**
     * Valida los campos de un punto de entrada.
     * Solo permite ids_source_machines.
     */
    checkInputPoint(ip: InputPoint, accept: ValidationAcceptor): void {
        this.checkCommonPointFields(ip, accept);
        if ((ip as any).ids_destination_machines) {
            accept('error', 'Un punto de entrada no puede tener ids_destination_machines.', { node: ip, property: 'ids_destination_machines' as any });
        }
        if (ip.ids_source_machines) {
            ip.ids_source_machines.forEach((machineId, index) => {
                const cleanId = machineId.replace(/"/g, '');
                if (cleanId.length !== 36) {
                    accept('error', 'Cada ID de máquina de origen debe tener exactamente 36 caracteres.', { node: ip, property: 'ids_source_machines', index });
                }
            });
        }
    }

    /**
     * Valida los campos de un punto de salida.
     * Solo permite ids_destination_machines.
     */
    checkOutputPoint(op: OutputPoint, accept: ValidationAcceptor): void {
        this.checkCommonPointFields(op, accept);
        if ((op as any).ids_source_machines) {
            accept('error', 'Un punto de salida no puede tener ids_source_machines.', { node: op, property: 'ids_source_machines' as any });
        }
        if (op.ids_destination_machines) {
            op.ids_destination_machines.forEach((machineId, index) => {
                const cleanId = machineId.replace(/"/g, '');
                if (cleanId.length !== 36) {
                    accept('error', 'Cada ID de máquina de destino debe tener exactamente 36 caracteres.', { node: op, property: 'ids_destination_machines', index });
                }
            });
        }
    }

    private checkCommonPointFields(cp: any, accept: ValidationAcceptor): void {
        const id = cp.id.replace(/"/g, '');
        if (!this.uuidRegex.test(id)) {
            accept('error', 'El ID debe ser un UUID válido de 36 caracteres.', { node: cp, property: 'id' });
        }
        if (cp.ids_references.length === 0) {
            accept('error', 'La lista de referencias ids_references no puede estar vacía.', { node: cp, property: 'ids_references' });
        }
        if (cp.description && cp.description.length > 600) {
            accept('error', 'La descripción no puede superar los 600 caracteres.', { node: cp, property: 'description' });
        }
    }

    /**
     * Valida que la matriz sea cuadrada y tenga un tamaño válido (4x4 a 1000x1000).
     */
    checkMatrix(matrix: Matrix, accept: ValidationAcceptor): void {
        const rowCount = matrix.rows.length;
        if (rowCount < 4 || rowCount > 1000) {
            accept('error', 'La matriz debe tener entre 4x4 y 1000x1000 elementos.', { node: matrix });
            return;
        }
        matrix.rows.forEach((row, index) => {
            if (row.values.length !== rowCount) {
                accept('error', `La matriz debe ser cuadrada. La fila ${index} tiene ${row.values.length} valores, pero hay ${rowCount} filas.`, { node: row });
            }
            row.values.forEach((val, vIndex) => {
                if (val !== 0 && val !== 1) {
                    accept('error', 'Los valores de la matriz deben ser 0 o 1.', { node: row, property: 'values', index: vIndex });
                }
            });
        });
    }

    // --- COMPROBACIONES DE RANGO ---

    checkOscillator(node: OscillatorNode, accept: ValidationAcceptor): void {
        this.checkRange(node.frequency, 0, 20000, accept);
        this.checkRange(node.pulseWidth, 0, 1, accept);
        this.checkRange(node.gain, 0, 1, accept);
        this.checkRange(node.phase, 0, 6.28318530718, accept); // 2pi
        this.checkRange(node.pan, -1, 1, accept);
    }

    checkNoise(node: NoiseNode, accept: ValidationAcceptor): void {
        this.checkRange(node.amplitude, 0, 1, accept);
        this.checkRange(node.gain, 0, 1, accept);
        this.checkRange(node.pan, -1, 1, accept);
    }

    checkSample(node: SampleNode, accept: ValidationAcceptor): void {
        this.checkRange(node.gain, 0, 1, accept);
        this.checkRange(node.pan, -1, 1, accept);

        const isStereo = this.getRawValue(node.stereo);
        if (isStereo === false) {
            const panVal = this.getRawValue(node.pan);
            if (typeof panVal === 'number' && panVal !== 0) {
                accept('error', 'Si stereo es false, el parámetro pan debe ser 0 siempre.', { node: node.pan, property: 'initialValue' });
            }
        }
    }

    checkFilter(node: FrequencyFilterNode, accept: ValidationAcceptor): void {
        this.checkRange(node.cutoff, 20, 20000, accept);
        this.checkRange(node.resonance, 0, 10, accept);
    }

    checkLFO(node: LFONode, accept: ValidationAcceptor): void {
        this.checkRange(node.rate, 0.01, 50, accept);
        this.checkRange(node.amplitude, 0, 1, accept);
        this.checkRange(node.phase, 0, 360, accept);
    }

    checkEnvelope(node: EnvelopeNode, accept: ValidationAcceptor): void {
        this.checkMin(node.attack, 0, accept);
        this.checkMin(node.decay, 0, accept);
        this.checkRange(node.sustain, 0, 1, accept);
        this.checkMin(node.release, 0, accept);
        
        const typeVal = this.getRawValue(node.envelopeType);
        if (typeof typeVal === 'string' && typeVal.replace(/"/g, '') === 'DAHDSR') {
            if (node.delay) this.checkMin(node.delay, 0, accept);
            if (node.hold) this.checkMin(node.hold, 0, accept);
        }
    }

    checkGainAndPan(node: GainAndPanNode, accept: ValidationAcceptor): void {
        this.checkRange(node.gain, 0, 1, accept);
        this.checkRange(node.pan, -1, 1, accept);
    }

    checkReverb(node: ReverbNode, accept: ValidationAcceptor): void {
        this.checkRange(node.roomSize, 0, 1, accept);
        this.checkRange(node.damping, 0, 1, accept);
        this.checkMin(node.decayTime, 0, accept);
        this.checkRange(node.dryWet, 0, 1, accept);
    }

    checkDelay(node: DelayNode, accept: ValidationAcceptor): void {
        this.checkMin(node.delayTime, 0, accept);
        this.checkRange(node.feedback, 0, 1, accept);
        this.checkRange(node.dryWet, 0, 1, accept);
    }

    checkDistortion(node: DistortionNode, accept: ValidationAcceptor): void {
        this.checkRange(node.drive, 0, 1, accept);
        this.checkRange(node.tone, 0, 1, accept);
        this.checkRange(node.outputLevel, 0, 1, accept);
    }

    checkChorusFlanger(node: ChorusFlangerNode, accept: ValidationAcceptor): void {
        this.checkMin(node.rate, 0, accept);
        this.checkRange(node.depth, 0, 1, accept);
        this.checkRange(node.feedback, 0, 1, accept);
        this.checkRange(node.mix, 0, 1, accept);
    }

    checkCompressor(node: CompressorNode, accept: ValidationAcceptor): void {
        this.checkMin(node.attack, 0, accept);
        this.checkMin(node.release, 0, accept);
    }

    checkEqualizer(node: EqualizerNode, accept: ValidationAcceptor): void {
        this.checkRange(node.bandFrequency, 20, 20000, accept);
    }

    /**
     * Valida que el número de salidas coincida con el modo stereo.
     */
    checkAudioOutputs(node: any, accept: ValidationAcceptor): void {
        this.internalCheckOutputs(node, accept);
    }

    /**
     * Valida la estructura de SoundModifierNode (Filtros y Efectos)
     */
    checkSoundModifier(node: any, accept: ValidationAcceptor): void {
        const isStereo = this.internalCheckStereoAndPingPong(node, accept);
        this.internalCheckOutputs(node, accept);
        
        // Entradas: 1 en mono, 2 en estéreo
        if (!node.input_1) {
            accept('error', 'Debe definirse input_1.', { node, property: 'id' });
        }
        if (isStereo) {
            if (!node.input_2) {
                accept('error', 'En modo estéreo, debe definirse input_2.', { node, property: 'id' });
            }
        } else {
            if (node.input_2) {
                accept('error', 'En modo mono, no debe definirse input_2.', { node, property: 'input_2' });
            }
        }
    }

    /**
     * Valida la estructura de GainAndPanNode (1 entrada fija, salidas según estéreo)
     */
    checkGainAndPanStructure(node: GainAndPanNode, accept: ValidationAcceptor): void {
        this.internalCheckStereoAndPingPong(node, accept);
        this.internalCheckOutputs(node, accept);
        
        if (!node.input_1) {
            accept('error', 'GainAndPan requiere input_1.', { node, property: 'id' });
        }
    }

    /**
     * Valida el Mezclador (entradas variables vñia inputs_number)
     */
    checkMixer(node: MixerNode, accept: ValidationAcceptor): void {
        this.internalCheckStereoAndPingPong(node, accept);
        this.internalCheckOutputs(node, accept);

        const numInputs = this.getRawValue(node.inputs_number);
        if (typeof numInputs !== 'number' || numInputs < 1 || numInputs > 10) {
            accept('error', 'inputs_number debe estar entre 1 y 10.', { node: node.inputs_number, property: 'initialValue' });
            return;
        }

        for (let i = 1; i <= 10; i++) {
            const inputKey = `input_${i}`;
            const inputVal = (node as any)[inputKey];
            if (i <= numInputs) {
                if (!inputVal) {
                    accept('error', `El mezclador tiene inputs_number=${numInputs}, pero falta ${inputKey}.`, { node, property: 'inputs_number' });
                }
            } else {
                if (inputVal) {
                    accept('error', `${inputKey} no debe estar definido ya que inputs_number es ${numInputs}.`, { node, property: inputKey as any });
                }
            }
        }
    }

    private internalCheckStereoAndPingPong(node: any, accept: ValidationAcceptor): boolean {
        const isStereo = this.getRawValue(node.stereo);
        if (typeof isStereo !== 'boolean') {
            accept('error', 'El parámetro stereo debe tener un valor inicial booleano.', { node: node.stereo, property: 'initialValue' });
            return false;
        }

        if (isStereo) {
            if (!node.ping_pong) {
                accept('error', 'Si stereo es true, debe definirse el parámetro ping_pong.', { node, property: 'stereo' });
            } else {
                const isPP = this.getRawValue(node.ping_pong);
                if (typeof isPP !== 'boolean') {
                    accept('error', 'El parámetro ping_pong debe ser booleano.', { node: node.ping_pong, property: 'initialValue' });
                }
            }
        } else {
            if (node.ping_pong) {
                accept('error', 'Si stereo es false, no debe definirse ping_pong.', { node, property: 'ping_pong' });
            }
        }
        return isStereo;
    }

    private internalCheckOutputs(node: any, accept: ValidationAcceptor): void {
        const isStereo = this.getRawValue(node.stereo);
        if (typeof isStereo !== 'boolean') return;

        if (isStereo) {
            if (!node.output_1) accept('error', 'Falta output_1.', { node });
            if (!node.output_2) accept('error', 'En estéreo falta output_2.', { node });
        } else {
            if (!node.output_1) accept('error', 'Falta output_1.', { node });
            if (node.output_2) accept('error', 'En mono no debe existir output_2.', { node, property: 'output_2' });
        }
    }

    private getRawValue(param: Parameter): any {
        const val = param.initialValue;
        if (isNumberValue(val)) return val.value;
        if (isStringValue(val)) return val.value;
        if (isBooleanValue(val)) return val.value;
        if (isMatrix(val)) return val;
        return undefined;
    }

    private checkRange(param: Parameter, min: number, max: number, accept: ValidationAcceptor): void {
        const val = this.getRawValue(param);
        if (typeof val === 'number') {
            if (val < min || val > max) {
                accept('error', `El valor debe estar entre ${min} y ${max}.`, { node: param, property: 'initialValue' });
            }
        }
    }

    private checkMin(param: Parameter, min: number, accept: ValidationAcceptor): void {
        const val = this.getRawValue(param);
        if (typeof val === 'number') {
            if (val < min) {
                accept('error', `El valor debe ser como mínimo ${min}.`, { node: param, property: 'initialValue' });
            }
        }
    }
}
