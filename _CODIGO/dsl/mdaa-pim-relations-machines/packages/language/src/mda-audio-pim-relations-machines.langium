// Gramática para las relaciones de conexión PIM de audio (PimRelationsMachines)
grammar MdaAudioPimRelationsMachines

// Estructura raíz del documento de relaciones PIM
entry RelationDocument:
    '{' 
        (
            '"description"' ':' description=STRING (',' '"relations"' ':' '[' (relations+=Relation (',' relations+=Relation)*)? ']')?
            |
            '"relations"' ':' '[' (relations+=Relation (',' relations+=Relation)*)? ']' (',' '"description"' ':' description=STRING)?
        )
    '}';

// Elemento individual de conexión entre dos puertos/nodos PIM
Relation:
    '{'
        '"id"' ':' id=STRING ','
        '"source"' ':' source=STRING ','
        '"destination"' ':' destination=STRING ','
        '"description"' ':' description=STRING
    '}';

// Terminales básicos de la gramática
hidden terminal WS: /\s+/;
terminal STRING: /"(\\.|[^"\\])*"/;

hidden terminal ML_COMMENT: /\/\*[\s\S]*?\*\//;
hidden terminal SL_COMMENT: /\/\/[^\n\r]*/;
