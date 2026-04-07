grammar MdaAudioCim

entry MDAA_CIM:
    'MDAA_CIM' name=ID '{'
        (generadores+=CIM_GENERADORES)*
    '}';

CIM_GENERADORES:
    'CIM_GENERADOR' name=ID '{'
        (osciladores+=OSCILADOR | modificadores+=MODIFICADOR)*
    '}';

OSCILADOR:
    'OSCILADOR' name=ID '{'
        'descripcion' descripcion=STRING
        'entradas' entradas=STRING
        'salidas' salidas=STRING
        (modificadores+=MODIFICADOR)*
    '}';

MODIFICADOR:
    'MODIFICADOR' name=ID '{'
        'descripcion' descripcion=STRING
        'entradas' entradas=STRING
        'salidas' salidas=STRING
        (modificadores+=MODIFICADOR)*
    '}';

hidden terminal WS: /\s+/;
terminal ID: /[_a-zA-Z][\w_]*/;
terminal STRING: /"(\\.|[^"\\])*"|'(\\.|[^'\\])*'/;

hidden terminal ML_COMMENT: /\/\*[\s\S]*?\*\//;
hidden terminal SL_COMMENT: /\/\/[^\n\r]*/;
