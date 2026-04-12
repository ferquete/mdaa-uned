grammar MdaAudioPimMachine

entry Model:
    '{'
        '"nodes"' ':' '[' (nodes+=Node (',' nodes+=Node)*)? ']' ','
        '"edges"' ':' '[' (edges+=Edge (',' edges+=Edge)*)? ']'
    '}';

interface BaseElement {
    id: string
    description: string
    ids_references: string[]
}

Node:
    AudioGeneratorNode | ParameterModifierNode | SoundModifierNode | MixerNode | GainAndPanNode;

// --- NODOS GENERADORES ---

AudioGeneratorNode:
    OscillatorNode | NoiseNode | SampleNode;

OscillatorNode:
    '{'
        '"type"' ':' '"oscillator"' ','
        CommonNodeFields
        '"waveform"' ':' waveform=Parameter ','
        '"frequency"' ':' frequency=Parameter ','
        '"pulseWidth"' ':' pulseWidth=Parameter ','
        '"gain"' ':' gain=Parameter ','
        '"phase"' ':' phase=Parameter ','
        '"pan"' ':' pan=Parameter ','
        AudioOutputFields
    '}';

NoiseNode:
    '{'
        '"type"' ':' '"noise"' ','
        CommonNodeFields
        '"noiseType"' ':' noiseType=Parameter ','
        '"amplitude"' ':' amplitude=Parameter ','
        '"gain"' ':' gain=Parameter ','
        '"pan"' ':' pan=Parameter ','
        AudioOutputFields
    '}';

SampleNode:
    '{'
        '"type"' ':' '"sample"' ','
        CommonNodeFields
        '"file"' ':' file=Parameter ','
        '"loop"' ':' loop=Parameter ','
        '"gain"' ':' gain=Parameter ','
        '"pan"' ':' pan=Parameter ','
        AudioOutputFields
    '}';

// --- NODOS MODIFICADORES ---

ParameterModifierNode:
    LFONode | EnvelopeNode;

SoundModifierNode:
    FrequencyFilterNode | ReverbNode | DelayNode | DistortionNode | ChorusFlangerNode | CompressorNode | EqualizerNode;

FrequencyFilterNode:
    '{'
        '"type"' ':' '"frequency_filter"' ','
        CommonNodeFields
        '"filterType"' ':' filterType=Parameter ','
        '"cutoff"' ':' cutoff=Parameter ','
        '"resonance"' ':' resonance=Parameter ','
        '"slope"' ':' slope=Parameter ','
        SoundModifierFields
    '}';

LFONode:
    '{'
        '"type"' ':' '"lfo"' ','
        CommonNodeFields
        '"waveform"' ':' waveform=Parameter ','
        '"rate"' ':' rate=Parameter ','
        '"amplitude"' ':' amplitude=Parameter ','
        '"phase"' ':' phase=Parameter ','
        '"sync"' ':' sync=Parameter ','
        '"output"' ':' output=Parameter
    '}';

EnvelopeNode:
    '{'
        '"type"' ':' '"envelope"' ','
        CommonNodeFields
        '"envelopeType"' ':' envelopeType=Parameter ','
        '"attack"' ':' attack=Parameter ','
        '"decay"' ':' decay=Parameter ','
        '"sustain"' ':' sustain=Parameter ','
        '"release"' ':' release=Parameter ','
        '"delay"' ':' delay=Parameter ','
        '"hold"' ':' hold=Parameter ','
        '"curve"' ':' curve=Parameter ','
        '"output"' ':' output=Parameter
    '}';

// --- MIXER, GAIN Y PAN ---

MixerNode:
    '{'
        '"type"' ':' '"mixer"' ','
        CommonNodeFields
        '"stereo"' ':' stereo=Parameter ','
        ( '"ping_pong"' ':' ping_pong=Parameter ',')?
        '"inputs_number"' ':' inputs_number=Parameter ','
        '"output_1"' ':' output_1=Parameter (',' '"output_2"' ':' output_2=Parameter)?
        (',' '"input_1"' ':' input_1=Parameter)?
        (',' '"input_2"' ':' input_2=Parameter)?
        (',' '"input_3"' ':' input_3=Parameter)?
        (',' '"input_4"' ':' input_4=Parameter)?
        (',' '"input_5"' ':' input_5=Parameter)?
        (',' '"input_6"' ':' input_6=Parameter)?
        (',' '"input_7"' ':' input_7=Parameter)?
        (',' '"input_8"' ':' input_8=Parameter)?
        (',' '"input_9"' ':' input_9=Parameter)?
        (',' '"input_10"' ':' input_10=Parameter)?
    '}';

GainAndPanNode:
    '{'
        '"type"' ':' '"gain_pan"' ','
        CommonNodeFields
        '"gain"' ':' gain=Parameter ','
        '"pan"' ':' pan=Parameter ','
        '"stereo"' ':' stereo=Parameter ','
        ( '"ping_pong"' ':' ping_pong=Parameter ',')?
        '"input_1"' ':' input_1=Parameter ','
        '"output_1"' ':' output_1=Parameter (',' '"output_2"' ':' output_2=Parameter)?
    '}';

// --- NODOS DE EFECTOS (MODIFICADORES DE SONIDO) ---

fragment SoundModifierFields:
    '"stereo"' ':' stereo=Parameter ','
    ( '"ping_pong"' ':' ping_pong=Parameter ',')?
    '"input_1"' ':' input_1=Parameter ','
    ( '"input_2"' ':' input_2=Parameter ',')?
    '"output_1"' ':' output_1=Parameter (',' '"output_2"' ':' output_2=Parameter)?;

fragment AudioOutputFields:
    '"stereo"' ':' stereo=Parameter ','
    '"output_1"' ':' output_1=Parameter
    (',' '"output_2"' ':' output_2=Parameter)?;

ReverbNode:
    '{'
        '"type"' ':' '"reverb"' ','
        CommonNodeFields
        '"roomSize"' ':' roomSize=Parameter ','
        '"damping"' ':' damping=Parameter ','
        '"decayTime"' ':' decayTime=Parameter ','
        '"dryWet"' ':' dryWet=Parameter ','
        SoundModifierFields
    '}';

DelayNode:
    '{'
        '"type"' ':' '"delay"' ','
        CommonNodeFields
        '"delayTime"' ':' delayTime=Parameter ','
        '"feedback"' ':' feedback=Parameter ','
        '"lowPassCutoff"' ':' lowPassCutoff=Parameter ','
        '"highPassCutoff"' ':' highPassCutoff=Parameter ','
        '"dryWet"' ':' dryWet=Parameter ','
        SoundModifierFields
    '}';

DistortionNode:
    '{'
        '"type"' ':' '"distortion"' ','
        CommonNodeFields
        '"drive"' ':' drive=Parameter ','
        '"tone"' ':' tone=Parameter ','
        '"distType"' ':' distType=Parameter ','
        '"outputLevel"' ':' outputLevel=Parameter ','
        SoundModifierFields
    '}';

ChorusFlangerNode:
    '{'
        '"type"' ':' '"chorus_flanger"' ','
        CommonNodeFields
        '"rate"' ':' rate=Parameter ','
        '"depth"' ':' depth=Parameter ','
        '"feedback"' ':' feedback=Parameter ','
        '"mix"' ':' mix=Parameter ','
        SoundModifierFields
    '}';

CompressorNode:
    '{'
        '"type"' ':' '"compressor"' ','
        CommonNodeFields
        '"threshold"' ':' threshold=Parameter ','
        '"ratio"' ':' ratio=Parameter ','
        '"attack"' ':' attack=Parameter ','
        '"release"' ':' release=Parameter ','
        '"makeupGain"' ':' makeupGain=Parameter ','
        SoundModifierFields
    '}';

EqualizerNode:
    '{'
        '"type"' ':' '"equalizer"' ','
        CommonNodeFields
        '"bandFrequency"' ':' bandFrequency=Parameter ','
        '"bandwidth"' ':' bandwidth=Parameter ','
        '"gain"' ':' gain=Parameter ','
        SoundModifierFields
    '}';

// --- ELEMENTOS COMUNES Y PARÁMETROS ---

fragment CommonNodeFields:
    '"id"' ':' id=STRING ','
    '"description"' ':' description=STRING ','
    '"ids_references"' ':' '[' (ids_references+=STRING (',' ids_references+=STRING)*)? ']' ',';

Parameter:
    '{'
        '"id"' ':' id=STRING ','
        '"ids_references"' ':' '[' (ids_references+=STRING (',' ids_references+=STRING)*)? ']' ','
        '"initialValue"' ':' initialValue=Value ','
        '"isModifiable"' ':' isModifiable=BOOLEAN
        (',' '"description"' ':' description=STRING)?
    '}';

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
        '"id"' ':' id=STRING ','
        '"description"' ':' description=STRING ','
        '"ids_references"' ':' '[' (ids_references+=STRING (',' ids_references+=STRING)*)? ']' ','
        '"sourceNode"' ':' sourceNode=STRING ','
        '"sourceParam"' ':' sourceParam=STRING ','
        '"targetNode"' ':' targetNode=STRING ','
        '"targetParam"' ':' targetParam=STRING ','
        '"type"' ':' type=('"audio"' | '"modification"')
    '}';

// --- TERMINALES ---

terminal BOOLEAN returns boolean: 'true' | 'false';
terminal NUMBER returns number: /-?[0-9]+(\.[0-9]+)?/;
terminal STRING: /"(\\.|[^"\\])*"|'(\\.|[^'\\])*'/;

hidden terminal WS: /\s+/;
hidden terminal ML_COMMENT: /\/\*[\s\S]*?\*\//;
hidden terminal SL_COMMENT: /\/\/[^\n\r]*/;
