// Definición de la gramática para el Modelo CIM de Máquinas (MdaAudioCimMachine)
grammar MdaAudioCimMachine

// Punto de entrada principal del documento JSON
entry Document:
    '{'
        '"id"' ':' id=STRING ','
        '"name"' ':' name=STRING ','
        '"description"' ':' description=STRING ','
        '"elements"' ':' '[' (elements+=Element (',' elements+=Element)*)? ']'
    '}';

// Interfaz base que define los atributos comunes para los elementos CIM
interface Base {
    id: string
    name: string
    description: string
    params: string
    sendTo: SendTo[]
    externalOutput: ExternalOutput
    externalInput: ExternalInput
}

// Un Element hereda de Base y representa una máquina o componente de audio
interface Element extends Base {}

// Regla de parseo para un Element (Máquina)
Element returns Element:
    '{'
        '"id"' ':' id=STRING ','
        '"name"' ':' name=STRING ','
        '"description"' ':' description=STRING ','
        '"params"' ':' params=STRING ','
        '"externalInput"' ':' externalInput=ExternalInput ','
        '"externalOutput"' ':' externalOutput=ExternalOutput ','
        '"sendTo"' ':' '[' (sendTo+=SendTo (',' sendTo+=SendTo)*)? ']'
    '}';

// Definición de salidas externas del componente
ExternalOutput:
    '{'
        '"hasExternalOutput"' ':' (hasExternalOutput?='true' | 'false')
        (',' '"description"' ':' description=STRING)?
    '}';

// Definición de entradas externas al componente
ExternalInput:
    '{'
        '"hasExternalInput"' ':' (hasExternalInput?='true' | 'false')
        (',' '"description"' ':' description=STRING)?
    '}';

// Relación de envío de audio a otra máquina (sendTo)
SendTo:
    '{'
        '"id"' ':' id=STRING ','
        '"idRef"' ':' idRef=[Base:STRING] ','
        '"description"' ':' description=STRING
    '}';

// Terminales base (cadenas, espacios y comentarios)
terminal STRING: /"(\\.|[^"\\])*"|'(\\.|[^'\\])*'/;

hidden terminal WS: /\s+/;
hidden terminal ML_COMMENT: /\/\*[\s\S]*?\*\//;
hidden terminal SL_COMMENT: /\/\/[^\n\r]*/;

