grammar DomainModel

entry Model:
    (elements+=AbstractElement)*;

AbstractElement:
    PackageDeclaration | Type;

PackageDeclaration:
    'package' name=ID '{'
        (elements+=AbstractElement)*
    '}';

Type:
    DataType | Entity;

DataType:
    'datatype' name=ID;

Entity:
    'entity' name=ID ('extends' superType=[Entity:QualifiedName])? '{'
        (features+=Feature)*
    '}';

Feature:
    (many?='many')? name=ID ':' type=TypeReference;

TypeReference:
    primitive=ID | type=[Type:QualifiedName];

QualifiedName returns string:
    ID ('.' ID)*;

terminal ID: /[_a-zA-Z][\w]*/;
terminal STRING: /"(\\.|[^"\\])*"|'(\\.|[^'\\])*'/;

hidden terminal WS: /\s+/;
hidden terminal SL_COMMENT: /\/\/.*/;
hidden terminal ML_COMMENT: /\/\*[\s\S]*?\*\//;
