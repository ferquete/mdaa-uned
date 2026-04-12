# Elementos del DSL mdaa-pim

Desde el punto de vista gráfico, este lenguaje estará formado por nodos que se conectan entre sí a través de aristas. Los nodos pueden ser de tipo generador de audio, modificador, de efectos o mixer. Y las aristas pueden ser de tipo "Señal de Audio" o "Señal de Modificación".

## Estructura del DSL

Tendrá 2 partes bien definidas, que serán 2 arrays de elementos:

* **Lista de nodos**: Cada nodo tendrá un identificador único, un tipo, y una serie de parámetros, como veremos en su definición. Por defecto, no hay nodos.

* **Lista de aristas**: Contendrán las conexiones entre los nodos. Por defecto, no hay aristas. Las aristas pueden ser de tipo "Señal de Audio" o "Señal de Modificación", y por lo tanto, solo se pueden conectar nodos que tengan parámetros de entrada y salida del tipo correcto.

Un ejemplo que cumpla la gramática del lenguaje, debe poder ser escrito en fromato JSON.

## Requisitos preliminares para todos los elementos

Cada nodo tendrá un identificador único, y cada parámetro de un nodo tendrá un identificador único también. Por lo tanto, se puede hacer referencia a cualquier nodo o parámetro de nodo para la creación de las aristas.

Por otro lado, cada arista también tendrá un identificador único, para poder ser referenciadas en un futuro por otro lenguaje.

Todos los identificadores serán de 36 caracteres, y seguirán el formato UUID.

Todo nodo, parámetro de nodo, y arista, tendrá una lista de identificadores de referencia a elementos del tipo "mdaa-cim-machine", por lo que tendrán que tener siempre un array, que llamaremos, ids_ref, asociado. Este array no puede ser vacío. el diseño de un diagrama PIM viene deribado de un diagrama de máquinas CIM, de ahí que cada elemento tenga que ser referenciado a un elemento o varios de CIM. Habrá casos en los que un elemento de este DSL venga derivado de la propia definición del proyecto, para poder referenciar esta circunstancia, se utilizará un identificador especial, que asignamos como "ref_description_project". En otras ocasiones, podrá venir de la propia descripción de la máquina en CIM, y en este caso usaremos el id "ref_description_cim_machine"


---

# Nodos

Todo nodo, y todo parámetro de nodo, tiene un identificador único. Por lo tanto, se puede hacer referencia a cualquier nodo o parámetro de nodo desde cualquier otro nodo o parámetro de nodo, siguiendo las restricciones impuestas.

## Nodo Generador de audio
A continuación se muestra una lista de los nodos generadores de audio que se pueden utilizar en el DSL mdaa-pim. Cada nodo tiene una serie de parámetros que se pueden configurar. A parte, cada uno de estos parámetros debería tener un flag si es modificable por un nodo modificador. Por defecto, los parámetros no son modificables por un nodo modificador.

Todo nodo generador de audio tiene un parámetro de salida que es la señal de audio que se va a generar, y N parametros de entrada, según los parámetros de él que se consideran modificables.

### Entradas/Salidas:
Las señales de entrada y salida pueden ser de 0 a N.

* Entradas: Elementos del tipo Nodo Modificador, conectados a algún o algunos de los parámetros internos de este nodo. O sea, que las entradas son del tipo "Señal de Modificación".

* Salida: tipo "Señal de Audio".

### Tipos de nodos generadores de audio

#### Oscilador
Genera una onda periódica infinita.
  - **Forma de onda**: Senoidal, cuadrada, diente de sierra, triangular. Por defecto: Senoidal. 
  - **Frecuencia**: Frecuencia fundamental de la onda. Rango: [0, 20000]. Por defecto: 440 Hz
  - **Amplitud**: Amplitud de la onda. Rango: [0, 1]. Por defecto: 0
  - **Fase**: Fase inicial de la onda. Rango: [0, 2pi]. Por defecto: 0

#### Ruido
Genera ruido blanco.
  - **Tipo de ruido**: Blanco, rosa, marrón. Por defecto: Blanco
  - **Amplitud**: Amplitud del ruido. Rango: [0, 1]. Por defecto: 1

#### Sample
Reproduce un archivo de audio.
  - **Archivo**: Ruta del archivo de audio.



## Nodo Modificador
A continuación se muestra una lista de los nodos modificadores que se pueden utilizar en el DSL mdaa-pim. Cada nodo tiene una serie de parámetros que se pueden configurar. A parte, cada uno de estos parámetros debería tener un flag si es modificable por un nodo modificador. Por defecto, los parámetros no son modificables por un nodo modificador.

Todo nodo modificador tiene un parámetro de salida que es la señal que se envía al nodo (o nodos) a modificar/generadores, y N parametros de entrada, según los parámetros de él que se consideran modificables.

### Entradas/Salidas:
Las señales de entrada y salida pueden ser de 0 a N.

* Entradas: Elementos del tipo Nodo Modificador, conectados a algún o algunos de los parámetros internos de este nodo. O sea, que las entradas son del tipo "Señal de Modificación".

* Salida: tipo "Señal de Modificación" y/o "Señal de Audio".

### Tipos de nodos modificadores

#### Filtro de Frecuencia
Transforma el contenido armónico de la señal procesada.
- **Tipo de Filtro**:
  - **Low-pass (LPF)**: Atenúa frecuencias por encima del corte.
  - **High-pass (HPF)**: Atenúa frecuencias por debajo del corte.
  - **Band-pass (BPF)**: Solo permite el paso de una banda estrecha.
  - **Notch**: Elimina una banda estrecha (filtro rechaza banda).
- **Parámetros Configurables**:
  - **Cutoff**: Frecuencia de corte principal (20Hz - 20kHz).
  - **Resonance / Q**: Realce de la frecuencia de corte (0 - 10).
  - **Slope**: Pendiente de atenuación (12dB/oct, 24dB/oct, 48dB/oct).

#### LFO (Low Frequency Oscillator)
Genera una señal de control cíclica para modulación.
- **Forma de onda**: Senoidal, Cuadrada, Triángulo, Diente de Sierra, Random (S&H).
- **Parámetros Configurables**:
  - **Rate/Frequency**: Velocidad de oscilación (0.01Hz a 50Hz).
  - **Amplitud**: Intensidad o "depth" de la modulación aplicada.
  - **Phase**: Desplazamiento inicial de la fase (0 a 360 grados).
  - **Sync**: Booleano para sincronizar el ritmo con el tempo del sistema.

#### Envolventes (Envelopes)
Modificadores que definen la evolución de un parámetro a lo largo del tiempo.

- **Tipos de Envolvente**:
  - **ADSR**: Attack, Decay, Sustain, Release.
  - **ADR**: Attack, Decay, Release.
  - **AR**: Attack, Release.
  - **DAHDSR**: Delay, Attack, Hold, Decay, Sustain, Release.

- **Parámetros Configurables**:
  - **Attack**: Tiempo de subida inicial.
  - **Decay**: Tiempo de caída tras el pico inicial.
  - **Sustain**: Nivel que se mantiene durante la pulsación (0 a 1).
  - **Release**: Tiempo de desvanecimiento tras soltar.
  - **Delay** (solo DAHDSR): Retraso antes del comienzo.
  - **Hold** (solo DAHDSR): Tiempo de mantenimiento del pico.
  - **Curva**: Tipo de interpolación (Lineal, Exponencial, Logarítmica).

#### Ganancia y Mezcla
- **Gain**: Control de nivel de salida (0 a 2.0).
- **Pan**: Posicionamiento estéreo (-1.0 a 1.0).
- **Dry/Wet**: Balance entre señal original y procesada (0% a 100%).


## Nodo Mixer
Solo tiene como fin mezclar señales de audio. Por lo tanto, solo tiene parámetros de entrada, y un parámetro de salida, que será de audio.


### Entradas/Salidas:
Las señales de entrada pueden ser de 0 a N, pero la salida solo será 1.

Por cada entrada de audio se tiene un parámetro de ganancia de 0 a 1, y esta ganancia puede ser modificada a su vez por un nodo modificador a través de una señal de modificación.

* Entradas: Elementos del tipo Nodo Generador de Audio u otro Nodo Mixer, para procesar sus señales de audio. O de un Nodo Modificador, conectados a algún o algunos de los parámetros internos de este nodo. O sea, que las entradas son del tipo "Señal de Audio" y/o "Señal de Modificación".

* Salida: Solo 1, de tipo "Señal de Audio".





## Nodos de Efectos
Los nodos de efectos reciben una o varias señales de audio como entrada, aplican un procesamiento digital de señal (DSP) y generan una salida de audio procesada. Sus parámetros internos definen la naturaleza del efecto y pueden ser controlados por Nodos Modificadores.

### Entradas/Salidas:

* Entradas: Elementos del tipo Nodo Generador de Audio a procesar, o Nodo Modificador, conectados a algún o algunos de los parámetros internos de este nodo. O sea, que las entradas son del tipo "Señal de Audio" y/o "Señal de Modificación".

* Salida: Solo 1, de tipo "Señal de Audio".

### Reverb (Reverberación)
Simula la acústica de un espacio físico.
- **Room Size**: Tamaño del espacio simulado (0 a 1).
- **Damping**: Absorción de frecuencias altas en las reflexiones (0 a 1).
- **Decay Time**: Tiempo que tarda el sonido en desvanecerse (s).
- **Dry/Wet**: Balance entre la señal original y la procesada.

### Delay / Echo
Repite la señal de entrada con un retraso determinado.
- **Delay Time**: Tiempo entre repeticiones (ms o sincronizado al tempo).
- **Feedback**: Cantidad de señal procesada que vuelve a la entrada (0 a 1).
- **Low-pass/High-pass**: Filtros aplicados únicamente a las repeticiones.
- **Dry/Wet**: Nivel de las repeticiones frente a la señal original.

### Distorsión / Overdrive
Altera la forma de la onda para añadir armónicos y saturación.
- **Drive / Gain**: Intensidad de la saturación aplicada.
- **Tone**: Control tonal (frecuencia) de la distorsión.
- **Type**: Algoritmo de recorte (Soft-clipping, Hard-clipping, Bitcrush).
- **Output Level**: Compensación de volumen de salida.

### Chorus / Flanger
Utiliza retrasos cortos modulados por un LFO interno para crear efectos de duplicación o "jet".
- **Rate**: Velocidad de la modulación interna.
- **Depth**: Profundidad o intensidad del efecto.
- **Feedback** (especialmente en Flanger): Retroalimentación de la señal modulada.
- **Mix**: Balance de mezcla.

### Compresor de Dinámica
Reduce el rango dinámico de la señal de audio.
- **Threshold**: Nivel a partir del cual comienza la compresión (dB).
- **Ratio**: Proporción de reducción de la ganancia (ej. 4:1).
- **Attack**: Rapidez con la que actúa el compresor (ms).
- **Release**: Rapidez con la que el compresor deja de actuar (ms).
- **Makeup Gain**: Compensación de volumen tras la compresión.

### Ecualizador Paramétrico (EQ)
Controla la ganancia de bandas de frecuencia específicas.
- **Band Frequency**: Frecuencia central de la banda.
- **Q / Bandwidth**: Ancho de banda afectado.
- **Gain**: Cantidad de realce o atenuación (dB).

---

# Aristas

Los nodos están unidos entre sí por aristas, que son relaciones direccionales entre los nodos. Una arista sale de un nodo y entra en otro nodo. Por lo tanto, las aristas son del tipo "Señal de Audio" o "Señal de Modificación".

## Aristas de Señal de Audio

Salen de un nodo generador de audio o de un nodo modificador o de un nodo de efectos o de un nodo mixer, y entran en un nodo mixer o en un nodo de efectos.

## Aristas de Señal de Modificación

Salen de un nodo modificador y entran en un nodo generador de audio o en un nodo modificador o en un nodo de efectos o en un nodo mixer.


