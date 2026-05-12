// Gramática para definir las Relaciones entre Máquinas en el Modelo CIM
grammar MdaAudioCimRelationsMachines

// Documento principal de relaciones
entry RelationDocument:
    '{'
        (
            '"description"' ':' description=STRING (',' '"relations"' ':' '[' (relations+=Relation (',' relations+=Relation)*)? ']')?
            |
            '"relations"' ':' '[' (relations+=Relation (',' relations+=Relation)*)? ']' (',' '"description"' ':' description=STRING)?
        )?
    '}';

// Elemento individual que representa un enlace entre un origen y un destino
Relation:
    '{'
        '"id"' ':' id=STRING ','
        '"source"' ':' source=STRING ','
        '"destination"' ':' destination=STRING ','
        '"description"' ':' description=STRING
    '}';

// Reglas terminales para espacios, cadenas y comentarios
hidden terminal WS: /\s+/;
terminal STRING: /"(\\.|[^"\\])*"|'(\\.|[^'\\])*'/;

hidden terminal ML_COMMENT: /\/\*[\s\S]*?\*\//;
hidden terminal SL_COMMENT: /\/\/[^\n\r]*/;
