# Modelo Independiente de Computación (CIM)

Este documento describe los lenguajes específicos de dominio (DSL) utilizados para definir el Modelo Independiente de Computación (CIM) en el sistema MDA-Audio. El CIM se divide en dos gramáticas principales: una para la definición interna de las máquinas de audio y otra para establecer las relaciones de alto nivel entre ellas.

## 1. Lenguaje de Definición de Máquinas de Audio
Este lenguaje permite definir la estructura interna de una máquina de síntesis o procesamiento de audio.

### Elementos Principales

#### Document (Documento)
Es el punto de entrada de la gramática y representa la configuración completa de una máquina.
- **id**: Identificador único de la máquina.
- **name**: Nombre descriptivo.
- **description**: Explicación de la funcionalidad de la máquina.
- **generators**: Lista de generadores de audio incluidos.
- **modificators**: Lista de modificadores de audio incluidos.

#### AudioGenerator (Generador de Audio)
Representa un componente que produce señal de audio (osciladores, samplers, etc.).
- **id**: Identificador único del componente.
- **name**: Nombre del generador.
- **description**: Descripción técnica.
- **params**: Cadena que define los parámetros de configuración.
- **sendTo**: Lista de conexiones hacia otros componentes.

#### Modificator (Modificador)
Representa un componente que transforma una señal de audio existente (filtros, efectos, etc.).
- **id**: Identificador único del componente.
- **name**: Nombre del modificador.
- **description**: Descripción de la transformación.
- **params**: Cadena de parámetros específicos del efecto.
- **sendTo**: Lista de conexiones hacia otros componentes.

#### SendTo (Conexión)
Define el flujo de la señal entre componentes internos.
- **id**: Identificador de la conexión.
- **idRef**: Referencia al identificador del componente destino (Generador o Modificador).
- **description**: Descripción del propósito de la conexión.

---

## 2. Lenguaje de Relaciones entre Máquinas
Este lenguaje se utiliza para orquestar la comunicación y el flujo de trabajo entre diferentes máquinas dentro de un proyecto global.

### Elementos Principales

#### RelationDocument (Documento de Relaciones)
Contenedor principal para las dependencias entre máquinas.
- **description**: Resumen de la lógica de interconexión del proyecto.
- **relations**: Colección de objetos de relación.

#### Relation (Relación)
Define un vínculo direccional entre dos máquinas.
- **id**: Identificador único de la relación (formato UUID recomendado).
- **source**: Identificador de la máquina de origen.
- **destination**: Identificador de la máquina de destino.
- **description**: Texto descriptivo que justifica el vínculo entre ambas entidades.
