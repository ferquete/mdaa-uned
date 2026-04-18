grammar MdaAudioCimMachine

entry Document:
    'id' id=STRING
    'name' name=STRING
    'description' description=STRING
    'elements' '[' (elements+=Element (',' elements+=Element)*)? ']'
;

interface Base {
    id: string
    name: string
    description: string
    params: string
    sendTo: SendTo[]
    externalOutput: ExternalOutput
    externalInput: ExternalInput
}

interface Element extends Base {}

Element returns Element:
    'Element' '{'
        'id' id=STRING
        'name' name=STRING
        'description' description=STRING
        'params' params=STRING
        'externalOutput' externalOutput=ExternalOutput
        'externalInput' externalInput=ExternalInput
        'sendTo' '[' (sendTo+=SendTo (',' sendTo+=SendTo)*)? ']'
    '}';

ExternalOutput:
    '{'
        'hasExternalOutput' hasExternalOutput?='true' | 'hasExternalOutput' 'false'
        ('description' description=STRING)?
    '}';

ExternalInput:
    '{'
        'hasExternalInput' hasExternalInput?='true' | 'hasExternalInput' 'false'
        ('description' description=STRING)?
    '}';

SendTo:
    '{'
        'id' id=STRING
        'idRef' idRef=[Base:STRING]
        'description' description=STRING
    '}';

terminal STRING: /"(\\.|[^"\\])*"|'(\\.|[^'\\])*'/;

hidden terminal WS: /\s+/;
hidden terminal ML_COMMENT: /\/\*[\s\S]*?\*\//;
hidden terminal SL_COMMENT: /\/\/[^\n\r]*/;
