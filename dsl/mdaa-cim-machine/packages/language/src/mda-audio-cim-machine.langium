grammar MdaAudioCimMachine

entry Document:
    'id' id=STRING
    'name' name=STRING
    'description' description=STRING
    'generators' '[' (generators+=AudioGenerator (',' generators+=AudioGenerator)*)? ']'
    'modificators' '[' (modificators+=Modificator (',' modificators+=Modificator)*)? ']'
;

interface Base {
    id: string
    name: string
    description: string
    params: string
    sendTo: SendTo[]
}

interface AudioGenerator extends Base {}

interface Modificator extends Base {}

AudioGenerator returns AudioGenerator:
    'AudioGenerator' '{'
        'id' id=STRING
        'name' name=STRING
        'description' description=STRING
        'params' params=STRING
        'sendTo' '[' (sendTo+=SendTo (',' sendTo+=SendTo)*)? ']'
    '}';

Modificator returns Modificator:
    'Modificator' '{'
        'id' id=STRING
        'name' name=STRING
        'description' description=STRING
        'params' params=STRING
        'sendTo' '[' (sendTo+=SendTo (',' sendTo+=SendTo)*)? ']'
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
