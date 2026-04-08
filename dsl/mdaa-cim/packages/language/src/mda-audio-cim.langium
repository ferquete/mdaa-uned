grammar MdaAudioCim

entry Document:
    (generators+=AudioGenerator | modificators+=Modificator)*;

interface Base {
    id: string
    name: string
    description: string
    inputs: string
    outputs: string
    params: string
    refs: Ref[]
}

interface AudioGenerator extends Base {
    rels: Ref[]
}

interface Modificator extends Base {}

AudioGenerator returns AudioGenerator:
    'AudioGenerator' '{'
        'id' id=STRING
        'name' name=STRING
        'description' description=STRING
        'inputs' inputs=STRING
        'outputs' outputs=STRING
        'params' params=STRING
        'ref' '[' (refs+=Ref (',' refs+=Ref)*)? ']'
        'rel' '[' (rels+=Ref (',' rels+=Ref)*)? ']'
    '}';

Modificator returns Modificator:
    'Modificator' '{'
        'id' id=STRING
        'name' name=STRING
        'description' description=STRING
        'inputs' inputs=STRING
        'outputs' outputs=STRING
        'params' params=STRING
        'ref' '[' (refs+=Ref (',' refs+=Ref)*)? ']'
    '}';

Ref:
    '{'
        'id' id=[Base:STRING]
        'description' description=STRING
    '}';

terminal ID: /[_a-zA-Z][\w_]*/;
terminal STRING: /"(\\.|[^"\\])*"|'(\\.|[^'\\])*'/;

hidden terminal WS: /\s+/;
hidden terminal ML_COMMENT: /\/\*[\s\S]*?\*\//;
hidden terminal SL_COMMENT: /\/\/[^\n\r]*/;
