# Elementos del DSL mdaa-pim-machine

Si lo miramos desde el punto de vista gráfico, tendremso un grafo dirigido. Este lenguaje estará formado por nodos que se conectan entre sí a través de aristas. Los nodos pueden ser de tipo generador de audio, modificador, de efectos o mixer. Y las aristas pueden ser de tipo "Señal de Audio" o "Señal de Modificación".

Aunque las descripciones y los nombres de los elementos están en español, se debe crear la gramatica langium con elementos en ingles, y pensados para que sus implementaciones pueda ser en JSON.

## Estructura del DSL

Tendrá 2 partes bien definidas, que serán 2 arrays de elementos:

* **Lista de nodos**: Cada nodo tendrá un identificador único, un tipo, y una serie de parámetros, según su tipo, como veremos en su definición. Por defecto, no hay nodos.

* **Lista de aristas**: Contendrán las conexiones entre los nodos. Por defecto, no hay aristas. Las aristas pueden ser de tipo "Señal de Audio" o "Señal de Modificación", y por lo tanto, solo pueden conectar nodos que tengan parámetros de entrada y salida del tipo correcto. Para que una arista de tipo señal de audio pueda conectarse a 2 nodos, el nodo origen y destino deben tener los 2 la posibilidad de esta conexión. Idem para las aristas de tipo señal de modificación.
En definitiva, una arista está compuesta por su propio identificador, un identificador de nodo origen, un identificador de parámetro de salida del nodo origen, un identificador parametro de nodo destino, y una lista de ids_references (del cual hablaremos mas adelante)

Un ejemplo que cumpla la gramática del lenguaje, debe poder ser escrito en fromato JSON.

## Requisitos preliminares para todos los elementos

Cada nodo tendrá un identificador único, y cada parámetro de un nodo tendrá un identificador único también. Por lo tanto, se puede hacer referencia a cualquier nodo o parámetro de nodo para la creación de las aristas.

Por otro lado, cada arista también tendrá un identificador único, para poder ser referenciadas en un futuro por otro lenguaje.

Todos los identificadores únicos (de nodos, parámetros de nodos y aristas) serán de 36 caracteres, y seguirán el formato UUID.

A parte, todo nodo, parámetro de nodo, y arista, tendrá una lista de identificadores de referencia a elementos del tipo "mdaa-cim-machine", por lo que tendrán que tener siempre un array, que llamaremos, ids_references, asociado. Este array no puede ser vacío. El diseño de un diagrama PIM viene deribado de un diagrama de máquinas CIM, de ahí que cada elemento tenga que ser referenciado a un elemento o varios de CIM. Habrá casos en los que un elemento de este DSL PIM venga derivado de la propia definición del proyecto, para poder referenciar esta circunstancia, se utilizará un identificador especial, que asignamos como "ref_project_description". En otras ocasiones, podrá venir de la propia descripción de la máquina en CIM, y en este caso usaremos el id "ref_cim_machine_description". Es obligatorio que cada elemento tenga al menos un identificador de referencia, tanto nodos como parrámetros de nodos y aristas. Aunque como hemos dicho un PIM viene deribado de un CIM, esta definición de lenguaje PIM no conoce los elementos CIM que lo componen, por lo que no puede validarlos, solo valida que existan referencias de 36 caracteres a algo.

Todos los elementos, tanto nodos como parámetrso de nodos como aristas, tendrán un campo "description", el cual podrá estar vacio, y como máximo contendrá 600 caracteres.

---

# Nodos

Todo nodo, y todo parámetro de nodo, tiene un identificador único. Por lo tanto, se puede hacer referencia a cualquier nodo o parámetro de nodo desde cualquier otro nodo o parámetro de nodo, siguiendo las restricciones impuestas.

Todo parámetro de nodo, a parte de tener su identificador único, y su lista de referencias, tendrá que tener un valor inicial asociado, y un valor boolean que nos diga si es subsceptible de ser modificado, o sea, si es posible que forme parte de una arista de tipo modificación como destino. Por defecto, el varor de modificable será false.

## Nodo Generador de audio
Un nodo de audio es aquel que su salida genera señal auditiva. A continuación se muestra una lista de los nodos generadores de audio que se pueden utilizar en el DSL mdaa-pim-machine. Cada nodo tiene una serie de parámetros que se pueden configurar. A parte, cada uno de estos parámetros debería tener un flag si es modificable por un nodo modificador. Por defecto, los parámetros no son modificables por un nodo modificador.

Todo nodo generador de audio tiene un parámetro de salida que es la señal de audio que se va a generar, y N parametros de entrada, según los parámetros de él que se consideran modificables.



### Entradas/Salidas:
Las señales de entrada van de 0 a N, ya que se podrán modificar N parámetros del nodo, y salida de salida solo tendremos 2, siendo salida estereo. De una misma salida pueden salir varias aristas, y a una misma entrada pueden llegar varias aristas.

* Entradas: Elementos del tipo Nodo Modificador, conectados a algún o algunos de los parámetros internos de este nodo. O sea, que las entradas son del tipo "Señal de Modificación".

* Salida: Serán 2 señales de tipo "Señal de Audio", una para el canal izquierdo y otra para el canal derecho.

### Tipos de nodos generadores de audio

#### Oscilador
Genera una onda periódica infinita. Tendrá los siguientes parámetros:

  - **Forma de onda**: Senoidal, cuadrada, diente de sierra, triangular, pulsos, o definida a través de una matriz de puntos. Por defecto: Senoidal. 
  - **Frecuencia**: Frecuencia fundamental de la onda. Rango: [0, 20000]. Por defecto: 440 Hz
  - **Ancho de pulso**: Solo para tipos de pulso, define el ancho del pulso. Rango: [0, 1]. Por defecto: 0.5
  - **Gain**: Amplitud de la onda. Rango: [0, 1]. Por defecto: 0
  - **Fase**: Fase inicial de la onda. Rango: [0, 2pi]. Por defecto: 0
  - **Pan**: Posición de las señales del oscilador en el espectro estéreo. Rango: [-1, 1]. Por defecto: 0

#### Ruido
Genera ruido blanco. Tendrá los siguientes parámetros:
  - **Tipo de ruido**: Blanco, rosa, marrón. Por defecto: Blanco
  - **Amplitud**: Amplitud del ruido. Rango: [0, 1]. Por defecto: 1
  - **Gain**: Ganancia de salida. Rango: [0, 1]. Por defecto: 0
  - **Pan**: Posición del ruido en el espectro estéreo. Rango: [-1, 1]. Por defecto: 0

#### Sample
Reproduce un archivo de audio. Tendrá los siguientes parámetros:
  - **Archivo**: Ruta del archivo de audio.
  - **Loop**: Si el archivo se reproduce en loop. Por defecto: false
  - **Gain**: Ganancia del archivo de audio. Rango: [0, 1]. Por defecto: 1
  - **Pan**: Posición del archivo de audio en el espectro estéreo. Rango: [-1, 1]. Por defecto: 0




## Nodo Modificador
A continuación se muestra una lista de los nodos modificadores que se pueden utilizar en el DSL mdaa-pim-machine. Cada nodo tiene una serie de parámetros que se pueden configurar.

Todo nodo modificador tiene un parámetro de salida que es la señal que se envía al nodo (o nodos) a modificar, y N parametros de entrada, según los parámetros de él que se consideran modificables.

### Entradas/Salidas:

* Entradas: Elementos del tipo Nodo Modificador, conectados a algún o algunos de los parámetros internos de este nodo. O sea, que las entradas son del tipo arista "Señal de Modificación". Un nodo modificador puede tener N entradas.

* Salida: Tendrá una salida, que podrá ser de tipo "Señal de Modificación". Como siempre, una misma salida podrá conectarse a varios nodos destino

### Tipos de nodos modificadores

#### Filtro de Frecuencia
Transforma el contenido armónico de la señal procesada. Tendrá los siguientes parámetros:

- **Tipo de Filtro**:
  - **Low-pass (LPF)**: Atenúa frecuencias por encima del corte. 
  - **High-pass (HPF)**: Atenúa frecuencias por debajo del corte.
  - **Band-pass (BPF)**: Solo permite el paso de una banda estrecha.
  - **Notch**: Elimina una banda estrecha (filtro rechaza banda).
- **Parámetros Configurables**:
  - **Cutoff**: Frecuencia de corte principal (20Hz - 20kHz). Por defecto 1000Hz.
  - **Resonance / Q**: Realce de la frecuencia de corte (0 - 10). Por defecto 0.
  - **Slope**: Pendiente de atenuación (12dB/oct, 24dB/oct, 48dB/oct). Por defecto 12dB/oct.

#### LFO (Low Frequency Oscillator)
Genera una señal de control cíclica para modulación. Tendrá los siguientes parámetros:
- **Forma de onda**: Senoidal, Cuadrada, Triángulo, Diente de Sierra, Random (S&H), ruido, o definida a través de una matriz de puntos. Por defecto: Senoidal.
- **Parámetros Configurables**:
  - **Rate/Frequency**: Velocidad de oscilación (0.01Hz a 50Hz). Por defecto 1Hz.
  - **Amplitud**: Intensidad o "depth" de la modulación aplicada. De 0 a 1. Por defecto 0.
  - **Phase**: Desplazamiento inicial de la fase (0 a 360 grados). Por defecto 0.
  - **Sync**: Booleano para sincronizar el ritmo con el tempo del sistema.

#### Envolventes (Envelopes)
Modificadores que definen la evolución de un parámetro a lo largo del tiempo.

- **Tipos de Envolvente**: Por defecto ADSR.
  - **ADSR**: Attack, Decay, Sustain, Release.
  - **ADR**: Attack, Decay, Release.
  - **AR**: Attack, Release.
  - **DAHDSR**: Delay, Attack, Hold, Decay, Sustain, Release.

- **Parámetros Configurables**:
  - **Attack**: Tiempo de subida inicial. Por defecto 0.
  - **Decay**: Tiempo de caída tras el pico inicial. Por defecto 0.
  - **Sustain**: Nivel que se mantiene durante la pulsación (0 a 1). Por defecto 0.
  - **Release**: Tiempo de desvanecimiento tras soltar. Por defecto 0.
  - **Delay** (solo DAHDSR): Retraso antes del comienzo. Por defecto 0.
  - **Hold** (solo DAHDSR): Tiempo de mantenimiento del pico. Por defecto 0.
  - **Curva**: Tipo de interpolación (Lineal, Exponencial, Logarítmica). Por defecto Lineal.



## Nodo Mixer
Solo tiene como fin mezclar señales de audio. 


### Entradas/Salidas:
Las señales de audio de entrada pueden ser de 0 a N, pero la salida solo será 1. No tiene parámetros internos.

* Entradas: Aristas de tipo "Señal de Audio" que vienen de un Nodo Generador de Audio u otro Nodo Mixer, para poder fusionar todas esas entradas en 1 o 2 (la salida), dependiendo de si es stereo o no. 

* Salida: Solo 1, de tipo "Señal de Audio".


## Nodo de Ganancia y Paneo

### Entradas/Salidas:


* Entradas: podrá tener 1 o 2 entradas de tipo "Señal de Audio", que vienen de un Nodo Generador de Audio o Nodo Mixer. Podrá tener varias entrada de señales de modificación, que vienen de un Nodo Modificador de tipo LFO o Envolvente.

* Salida: Tendrá 1 o 2, de tipo "Señal de Audio", dependiendo de si en su parámetro "stereo" es true (2 salidas) o false (1 salida).

### Tipos

No tendrá tipos distintos, solo hay un tipo de nodo de ganancia.

### Parámetros Configurables:

- **Gain**: Control de nivel de salida (0 a 1.0). Por defecto 1.
- **Stereo**: Booleano que indica si la salida es estéreo. Por defecto false. Si es true, se permitirán 2 salidas distintas de tipo audio.
- **Pan**: Posicionamiento estéreo (-1.0 a 1.0). Por defecto 0. Solo aparecerá si stereo es true.


## Nodos de Efectos
Los nodos de efectos reciben 1 o 2 señales de audio como entrada, y tendrá una o 2 ( si es estereo) de salida de audio también. Sus parámetros internos definen la naturaleza del efecto y pueden ser controlados por Nodos Modificadores (señales modificadoras a lso parámetros).

### Entradas/Salidas:

* Entradas: Elementos del tipo Nodo Generador de Audio a procesar, o Nodo Modificador, conectados a algún o algunos de los parámetros internos de este nodo. O sea, que las entradas son del tipo "Señal de Audio", que podrán ser 2 máximo y/o "Señal de Modificación" que podrán ser N (1 por parámetro).

* Salida: Solo 1, de tipo "Señal de Audio" si no es stereo, o 2 si es stereo.

### Reverb (Reverberación)
Simula la acústica de un espacio físico.
- **Room Size**: Tamaño del espacio simulado (0 a 1). Por defecto 0.5.
- **Damping**: Absorción de frecuencias altas en las reflexiones (0 a 1). Por defecto 0.5.
- **Decay Time**: Tiempo que tarda el sonido en desvanecerse (s). Por defecto 1.
- **Dry/Wet**: Balance entre la señal original y la procesada. Por defecto 0.5.
- **Stereo**: Booleano que indica si la salida es estéreo. Por defecto false. Si es true, se permitirán 2 salidas distintas de tipo audio.

### Delay / Echo
Repite la señal de entrada con un retraso determinado.
- **Delay Time**: Tiempo entre repeticiones (ms o sincronizado al tempo). Por defecto 1.
- **Feedback**: Cantidad de señal procesada que vuelve a la entrada (0 a 1). Por defecto 0.5.
- **Low-pass/High-pass**: Filtros aplicados únicamente a las repeticiones. Por defecto 0.
- **Dry/Wet**: Nivel de las repeticiones frente a la señal original. Por defecto 0.5.
- **Stereo**: Booleano que indica si la salida es estéreo. Por defecto false. Si es true, se permitirán 2 salidas distintas de tipo audio.

### Distorsión / Overdrive
Altera la forma de la onda para añadir armónicos y saturación.
- **Drive / Gain**: Intensidad de la saturación aplicada. Por defecto 0.5.
- **Tone**: Control tonal (frecuencia) de la distorsión. Por defecto 0.5.
- **Type**: Algoritmo de recorte (Soft-clipping, Hard-clipping, Bitcrush). Por defecto Soft-clipping.
- **Output Level**: Compensación de volumen de salida. Por defecto 0.5.
- **Stereo**: Booleano que indica si la salida es estéreo. Por defecto false. Si es true, se permitirán 2 salidas distintas de tipo audio.

### Chorus / Flanger
Utiliza retrasos cortos modulados por un LFO interno para crear efectos de duplicación o "jet".
- **Rate**: Velocidad de la modulación interna. Por defecto 1.
- **Depth**: Profundidad o intensidad del efecto. Por defecto 0.5.
- **Feedback** (especialmente en Flanger): Retroalimentación de la señal modulada. Por defecto 0.5.
- **Mix**: Balance de mezcla. Por defecto 0.5.
- **Stereo**: Booleano que indica si la salida es estéreo. Por defecto false. Si es true, se permitirán 2 salidas distintas de tipo audio.

### Compresor de Dinámica
Reduce el rango dinámico de la señal de audio.
- **Threshold**: Nivel a partir del cual comienza la compresión (dB). Por defecto 0.
- **Ratio**: Proporción de reducción de la ganancia (ej. 4:1). Por defecto 1.
- **Attack**: Rapidez con la que actúa el compresor (ms). Por defecto 0.
- **Release**: Rapidez con la que el compresor deja de actuar (ms). Por defecto 0.
- **Makeup Gain**: Compensación de volumen tras la compresión. Por defecto 0.
- **Stereo**: Booleano que indica si la salida es estéreo. Por defecto false. Si es true, se permitirán 2 salidas distintas de tipo audio.

### Ecualizador Paramétrico (EQ)
Controla la ganancia de bandas de frecuencia específicas.
- **Band Frequency**: Frecuencia central de la banda. Por defecto 0.
- **Q / Bandwidth**: Ancho de banda afectado. Por defecto 0.
- **Gain**: Cantidad de realce o atenuación (dB). Por defecto 0.
- **Stereo**: Booleano que indica si la salida es estéreo. Por defecto false. Si es true, se permitirán 2 salidas distintas de tipo audio.

---

# Aristas

Los nodos están unidos entre sí por aristas, que son relaciones direccionales entre los nodos. Una arista sale de un nodo y entra en otro nodo a través de una conexión del mismo tipo (o de sonido o de modificación, nunca mixta). Por lo tanto, las aristas son del tipo "Señal de Audio" o "Señal de Modificación". En definitiva, una arista está compuesta por su propio identificador, un identificador de parámetro de salida del nodo origen, un identificador parametro de nodo destino, y una lista de ids_references (del cual hablaremos mas adelante). Consideramos a las salidas de los nodos también como parámetros de un nodo.


## Aristas de Señal de Audio

Salen de un nodo generador de audio o de un nodo modificador o de un nodo de efectos o de un nodo mixer, y entran en un nodo mixer, de ganancia o de efectos.

## Aristas de Señal de Modificación

Salen de un nodo modificador y entran en un parámetro de cualquier tipo de nodo que tenga parámetros modificables.


