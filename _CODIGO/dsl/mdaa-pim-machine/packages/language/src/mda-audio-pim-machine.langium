// Gramática principal para el Modelo PIM de Máquinas (MdaAudioPimMachine)
grammar MdaAudioPimMachine

// Punto de entrada principal que define la estructura del documento PIM
entry Model:
    '{'
        '"id"' ':' id=STRING ','
        '"name"' ':' name=STRING ','
        ( '"description"' ':' description=STRING ',')?
        '"ids_cim_reference"' ':' '[' (ids_cim_reference+=STRING (',' ids_cim_reference+=STRING)*)? ']' ','
        '"nodes"' ':' '[' (nodes+=Node (',' nodes+=Node)*)? ']' ','
        '"edges"' ':' '[' (edges+=Edge (',' edges+=Edge)*)? ']'
    '}';

// Interfaz base común para todos los elementos principales del PIM
interface BaseElement {
    id: string
    name: string
    description: string
    ids_references: string[]
}

// Clasificación de todos los tipos de nodos de procesamiento de audio permitidos
Node:
    AudioGeneratorNode | ParameterModifierNode | SoundModifierNode | MixerNode | GainAndPanNode;

// --- NODOS GENERADORES (Fuentes de sonido) ---

// Definición genérica para un nodo generador de audio
AudioGeneratorNode:
    OscillatorNode | NoiseNode | SampleNode;

OscillatorNode:
    '{'
        '"type"' ':' '"oscillator"' ','
        CommonNodeFields
        OscillatorField (',' OscillatorField)*
    '}';

fragment OscillatorField:
    '"waveform"' ':' waveform=Parameter |
    '"frequency"' ':' frequency=Parameter |
    '"pulseWidth"' ':' pulseWidth=Parameter |
    '"gain"' ':' gain=Parameter |
    '"phase"' ':' phase=Parameter |
    '"pan"' ':' pan=Parameter |
    AudioOutputField;

NoiseNode:
    '{'
        '"type"' ':' '"noise"' ','
        CommonNodeFields
        NoiseField (',' NoiseField)*
    '}';

fragment NoiseField:
    '"noiseType"' ':' noiseType=Parameter |
    '"amplitude"' ':' amplitude=Parameter |
    '"gain"' ':' gain=Parameter |
    '"pan"' ':' pan=Parameter |
    AudioOutputField;

SampleNode:
    '{'
        '"type"' ':' '"sample"' ','
        CommonNodeFields
        SampleField (',' SampleField)*
    '}';

fragment SampleField:
    '"file"' ':' file=Parameter |
    '"loop"' ':' loop=Parameter |
    '"gain"' ':' gain=Parameter |
    '"pan"' ':' pan=Parameter |
    AudioOutputField;

// --- NODOS MODIFICADORES ---

ParameterModifierNode:
    LFONode | EnvelopeNode;

SoundModifierNode:
    FrequencyFilterNode | ReverbNode | DelayNode | DistortionNode | ChorusFlangerNode | CompressorNode | EqualizerNode;

FrequencyFilterNode:
    '{'
        '"type"' ':' '"frequency_filter"' ','
        CommonNodeFields
        FrequencyFilterField (',' FrequencyFilterField)*
    '}';

fragment FrequencyFilterField:
    '"filterType"' ':' filterType=Parameter |
    '"cutoff"' ':' cutoff=Parameter |
    '"resonance"' ':' resonance=Parameter |
    '"slope"' ':' slope=Parameter |
    SoundModifierField;

LFONode:
    '{'
        '"type"' ':' '"lfo"' ','
        CommonNodeFields
        LFOField (',' LFOField)*
    '}';

fragment LFOField:
    '"waveform"' ':' waveform=Parameter |
    '"rate"' ':' rate=Parameter |
    '"amplitude"' ':' amplitude=Parameter |
    '"phase"' ':' phase=Parameter |
    '"sync"' ':' sync=Parameter |
    '"output"' ':' output=ConnectionPoint;

EnvelopeNode:
    '{'
        '"type"' ':' '"envelope"' ','
        CommonNodeFields
        EnvelopeField (',' EnvelopeField)*
    '}';

fragment EnvelopeField:
    '"envelopeType"' ':' envelopeType=Parameter |
    '"attack"' ':' attack=Parameter |
    '"decay"' ':' decay=Parameter |
    '"sustain"' ':' sustain=Parameter |
    '"release"' ':' release=Parameter |
    '"delay"' ':' delay=Parameter |
    '"hold"' ':' hold=Parameter |
    '"curve"' ':' curve=Parameter |
    '"output"' ':' output=ConnectionPoint;

// --- MIXER, GAIN Y PAN ---

MixerNode:
    '{'
        '"type"' ':' '"mixer"' ','
        CommonNodeFields
        MixerField (',' MixerField)*
    '}';

fragment MixerField:
    '"stereo"' ':' stereo=StereoParameter |
    '"output_1"' ':' output_1=ConnectionPoint |
    '"output_2"' ':' output_2=ConnectionPoint |
    '"input_1"' ':' input_1=ConnectionPoint |
    '"input_2"' ':' input_2=ConnectionPoint |
    '"input_3"' ':' input_3=ConnectionPoint |
    '"input_4"' ':' input_4=ConnectionPoint |
    '"input_5"' ':' input_5=ConnectionPoint |
    '"input_6"' ':' input_6=ConnectionPoint |
    '"input_7"' ':' input_7=ConnectionPoint |
    '"input_8"' ':' input_8=ConnectionPoint |
    '"input_9"' ':' input_9=ConnectionPoint |
    '"input_10"' ':' input_10=ConnectionPoint;

GainAndPanNode:
    '{'
        '"type"' ':' '"gain_pan"' ','
        CommonNodeFields
        GainAndPanField (',' GainAndPanField)*
    '}';

fragment GainAndPanField:
    '"gain"' ':' gain=Parameter |
    '"pan"' ':' pan=Parameter |
    '"stereo"' ':' stereo=StereoParameter |
    '"input_1"' ':' input_1=ConnectionPoint |
    '"input_2"' ':' input_2=ConnectionPoint |
    '"output_1"' ':' output_1=ConnectionPoint |
    '"output_2"' ':' output_2=ConnectionPoint;

// --- NODOS DE EFECTOS (MODIFICADORES DE SONIDO) ---

fragment SoundModifierField:
    '"stereo"' ':' stereo=StereoParameter |
    '"input_1"' ':' input_1=ConnectionPoint |
    '"input_2"' ':' input_2=ConnectionPoint |
    '"output_1"' ':' output_1=ConnectionPoint |
    '"output_2"' ':' output_2=ConnectionPoint;

fragment AudioOutputField:
    '"stereo"' ':' stereo=StereoParameter |
    '"output_1"' ':' output_1=ConnectionPoint |
    '"output_2"' ':' output_2=ConnectionPoint;

ReverbNode:
    '{'
        '"type"' ':' '"reverb"' ','
        CommonNodeFields
        ReverbField (',' ReverbField)*
    '}';

fragment ReverbField:
    '"roomSize"' ':' roomSize=Parameter |
    '"damping"' ':' damping=Parameter |
    '"decayTime"' ':' decayTime=Parameter |
    '"dryWet"' ':' dryWet=Parameter |
    SoundModifierField;

DelayNode:
    '{'
        '"type"' ':' '"delay"' ','
        CommonNodeFields
        DelayField (',' DelayField)*
    '}';

fragment DelayField:
    '"delayTime"' ':' delayTime=Parameter |
    '"feedback"' ':' feedback=Parameter |
    '"lowPassCutoff"' ':' lowPassCutoff=Parameter |
    '"highPassCutoff"' ':' highPassCutoff=Parameter |
    '"dryWet"' ':' dryWet=Parameter |
    SoundModifierField;

DistortionNode:
    '{'
        '"type"' ':' '"distortion"' ','
        CommonNodeFields
        DistortionField (',' DistortionField)*
    '}';

fragment DistortionField:
    '"drive"' ':' drive=Parameter |
    '"tone"' ':' tone=Parameter |
    '"distType"' ':' distType=Parameter |
    '"outputLevel"' ':' outputLevel=Parameter |
    SoundModifierField;

ChorusFlangerNode:
    '{'
        '"type"' ':' '"chorus_flanger"' ','
        CommonNodeFields
        ChorusFlangerField (',' ChorusFlangerField)*
    '}';

fragment ChorusFlangerField:
    '"rate"' ':' rate=Parameter |
    '"depth"' ':' depth=Parameter |
    '"feedback"' ':' feedback=Parameter |
    '"mix"' ':' mix=Parameter |
    SoundModifierField;

CompressorNode:
    '{'
        '"type"' ':' '"compressor"' ','
        CommonNodeFields
        CompressorField (',' CompressorField)*
    '}';

fragment CompressorField:
    '"threshold"' ':' threshold=Parameter |
    '"ratio"' ':' ratio=Parameter |
    '"attack"' ':' attack=Parameter |
    '"release"' ':' release=Parameter |
    '"makeupGain"' ':' makeupGain=Parameter |
    SoundModifierField;

EqualizerNode:
    '{'
        '"type"' ':' '"equalizer"' ','
        CommonNodeFields
        EqualizerField (',' EqualizerField)*
    '}';

fragment EqualizerField:
    '"bandFrequency"' ':' bandFrequency=Parameter |
    '"bandwidth"' ':' bandwidth=Parameter |
    '"gain"' ':' gain=Parameter |
    SoundModifierField;

// --- ELEMENTOS COMUNES Y PARÁMETROS ---

fragment CommonNodeFields:
    (CommonNodeField (',' CommonNodeField)* ',')?;

fragment CommonNodeField:
    '"id"' ':' id=STRING |
    '"name"' ':' name=STRING |
    '"description"' ':' description=STRING |
    '"ids_references"' ':' '[' (ids_references+=STRING (',' ids_references+=STRING)*)? ']' |
    '"others"' ':' '[' (others+=OthersParameter (',' others+=OthersParameter)*)? ']';

Parameter:
    '{'
        ParameterField (',' ParameterField)*
    '}';

fragment ParameterField:
    '"id"' ':' id=STRING |
    '"ids_references"' ':' '[' (ids_references+=STRING (',' ids_references+=STRING)*)? ']' |
    '"initialValue"' ':' initialValue=Value |
    '"isModifiable"' ':' isModifiable=BOOLEAN |
    '"isExternalInput"' ':' isExternalInput=BOOLEAN |
    '"description"' ':' description=STRING;

StereoParameter:
    '{'
        StereoParameterField (',' StereoParameterField)*
    '}';

fragment StereoParameterField:
    '"id"' ':' id=STRING |
    '"ids_references"' ':' '[' (ids_references+=STRING (',' ids_references+=STRING)*)? ']' |
    '"initialValue"' ':' initialValue=BOOLEAN |
    '"description"' ':' description=STRING;

OthersParameter:
    '{'
        OthersParameterField (',' OthersParameterField)*
    '}';

fragment OthersParameterField:
    '"id"' ':' id=STRING |
    '"name"' ':' name=STRING |
    '"ids_references"' ':' '[' (ids_references+=STRING (',' ids_references+=STRING)*)? ']' |
    '"initialValue"' ':' initialValue=STRING |
    '"isModifiable"' ':' isModifiable=BOOLEAN |
    '"isExternalInput"' ':' isExternalInput=BOOLEAN |
    '"description"' ':' description=STRING;

ConnectionPoint:
    '{'
        ConnectionPointField (',' ConnectionPointField)*
    '}';

fragment ConnectionPointField:
    '"id"' ':' id=STRING |
    '"ids_references"' ':' '[' (ids_references+=STRING (',' ids_references+=STRING)*)? ']' |
    '"isExternalInput"' ':' isExternalInput=BOOLEAN |
    '"isExternalOutput"' ':' isExternalOutput=BOOLEAN |
    '"description"' ':' description=STRING;

Value:
    {infer NumberValue} value=NUMBER |
    {infer StringValue} value=STRING |
    {infer BooleanValue} value=BOOLEAN |
    Matrix;

Matrix:
    '[' (rows+=Row (',' rows+=Row)*)? ']';

Row:
    '[' (values+=NUMBER (',' values+=NUMBER)*)? ']';

// --- ARISTAS ---

Edge:
    '{'
        EdgeField (',' EdgeField)*
    '}';

fragment EdgeField:
    '"id"' ':' id=STRING |
    '"description"' ':' description=STRING |
    '"ids_references"' ':' '[' (ids_references+=STRING (',' ids_references+=STRING)*)? ']' |
    '"sourceNode"' ':' sourceNode=STRING |
    '"sourceParam"' ':' sourceParam=AnyString |
    '"targetNode"' ':' targetNode=STRING |
    '"targetParam"' ':' targetParam=AnyString |
    '"type"' ':' type=('"audio"' | '"modification"');

AnyString returns string:
    STRING | '"output_1"' | '"output_2"' | '"input_1"' | '"input_2"' | '"input_3"' | '"input_4"' | '"input_5"' | '"input_6"' | '"input_7"' | '"input_8"' | '"input_9"' | '"input_10"' | '"output"' | '"frequency"' | '"gain"' | '"pan"' |
    '"waveform"' | '"noiseType"' | '"filterType"' | '"envelopeType"' | '"distType"' | '"audio"' | '"modification"' | '"id"' | '"name"' | '"description"' |
    '"cutoff"' | '"resonance"' | '"slope"' | '"roomSize"' | '"damping"' | '"decayTime"' | '"dryWet"' | '"delayTime"' | '"feedback"' | '"lowPassCutoff"' | '"highPassCutoff"' | 
    '"drive"' | '"tone"' | '"outputLevel"' | '"rate"' | '"depth"' | '"mix"' | '"threshold"' | '"ratio"' | '"makeupGain"' | '"bandFrequency"' | '"bandwidth"' | 
    '"attack"' | '"decay"' | '"sustain"' | '"release"' | '"delay"' | '"hold"' | '"curve"' | '"pulseWidth"' | '"phase"' | '"sync"' | '"loop"' | '"file"' | '"amplitude"' |
    '"initialValue"' | '"isModifiable"' | '"isExternalInput"' | '"isExternalOutput"' | '"sourceNode"' | '"sourceParam"' | '"targetNode"' | '"targetParam"' | '"type"';





// --- TERMINALES ---

terminal BOOLEAN returns boolean: 'true' | 'false';
terminal NUMBER returns number: /-?[0-9]+(\.[0-9]+)?/;
terminal STRING: /"(\\.|[^"\\])*"|'(\\.|[^'\\])*'/;

hidden terminal WS: /\s+/;
hidden terminal ML_COMMENT: /\/\*[\s\S]*?\*\//;
hidden terminal SL_COMMENT: /\/\/[^\n\r]*/;
