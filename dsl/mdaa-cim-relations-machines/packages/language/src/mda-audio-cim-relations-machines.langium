grammar MdaAudioCimRelationsMachines

entry RelationDocument:
    '{'
        (
            '"description"' ':' description=STRING (',' '"relations"' ':' '[' (relations+=Relation (',' relations+=Relation)*)? ']')?
            |
            '"relations"' ':' '[' (relations+=Relation (',' relations+=Relation)*)? ']' (',' '"description"' ':' description=STRING)?
        )?
    '}';

Relation:
    '{'
        '"source"' ':' source=STRING ','
        '"destination"' ':' destination=STRING ','
        '"description"' ':' description=STRING
    '}';

hidden terminal WS: /\s+/;
terminal STRING: /"(\\.|[^"\\])*"|'(\\.|[^'\\])*'/;

hidden terminal ML_COMMENT: /\/\*[\s\S]*?\*\//;
hidden terminal SL_COMMENT: /\/\/[^\n\r]*/;
