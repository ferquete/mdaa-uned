export const PIM_MACHINE_SCHEMA = {
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "MdaAudioPimMachine Model Schema",
  "description": "Schema for validating PIM Audio Machine models according to pim.md specifications",
  "type": "object",
  "properties": {
    "id": {
      "$ref": "#/definitions/UUID",
      "description": "Identificador único de la máquina PIM"
    },
    "name": {
      "type": "string",
      "minLength": 1,
      "maxLength": 20,
      "description": "Nombre de la máquina (máx. 20 caracteres)"
    },
    "description": {
      "$ref": "#/definitions/Description",
      "description": "Descripción opcional de la máquina"
    },
    "ids_cim_reference": {
      "type": "array",
      "description": "Lista de IDs de máquinas CIM relacionadas",
      "items": { "type": "string" }
    },
    "nodes": {
      "type": "array",
      "description": "Lista de nodos de audio (generadores, modificadores, mezcladores, etc.)",
      "items": { "$ref": "#/definitions/AnyNode" }
    },
    "edges": {
      "type": "array",
      "description": "Lista de conexiones entre nodos",
      "items": { "$ref": "#/definitions/Edge" }
    }
  },
  "required": ["id", "name", "ids_cim_reference", "nodes", "edges"],
  "additionalProperties": false,
  "definitions": {
    "UUID": {
      "type": "string",
      "description": "UUID de 36 caracteres",
      "pattern": "^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$"
    },
    "Description": {
      "type": "string",
      "description": "Descripción opcional, máximo 600 caracteres",
      "maxLength": 600
    },
    "IdsReferences": {
      "type": "array",
      "description": "Array de referencias a elementos CIM. Puede estar vacío.",
      "items": { "type": "string" }
    },
    "Parameter": {
      "type": "object",
      "description": "Parámetro de configuración de un nodo",
      "properties": {
        "id": { "$ref": "#/definitions/UUID" },
        "ids_references": { "$ref": "#/definitions/IdsReferences" },
        "initialValue": {
          "description": "Valor inicial del parámetro (número, string, booleano o matriz)"
        },
        "isModifiable": {
          "type": "boolean",
          "description": "Si el parámetro acepta modulación de otros nodos"
        },
        "isExternalInput": {
          "type": "boolean",
          "description": "Si el parámetro puede ser controlado externamente a la máquina"
        },
        "description": { "$ref": "#/definitions/Description" }
      },
      "required": ["id", "ids_references", "initialValue", "isModifiable"],
      "additionalProperties": false
    },
    "OthersParameter": {
      "type": "object",
      "properties": {
        "id": { "$ref": "#/definitions/UUID" },
        "name": {
          "type": "string",
          "minLength": 1,
          "maxLength": 20,
          "description": "Nombre del control dinámico"
        },
        "ids_references": { "$ref": "#/definitions/IdsReferences" },
        "initialValue": {
          "type": "string",
          "minLength": 1,
          "maxLength": 100,
          "description": "Valor inicial obligatorio del control dinámico"
        },
        "isModifiable": { "type": "boolean" },
        "isExternalInput": { "type": "boolean" },
        "description": { "$ref": "#/definitions/Description" }
      },
      "required": ["id", "name", "ids_references", "initialValue", "isModifiable"],
      "additionalProperties": false
    },
    "ConnectionPoint": {
      "type": "object",
      "description": "Puerto de entrada o salida de audio/control",
      "properties": {
        "id": { "$ref": "#/definitions/UUID" },
        "ids_references": { "$ref": "#/definitions/IdsReferences" },
        "isExternalInput": { "type": "boolean" },
        "isExternalOutput": { "type": "boolean" },
        "description": { "$ref": "#/definitions/Description" }
      },
      "required": ["id", "ids_references"],
      "additionalProperties": false
    },
    "CommonNodeFields": {
      "type": "object",
      "properties": {
        "id": { "$ref": "#/definitions/UUID" },
        "name": {
          "type": "string",
          "minLength": 1,
          "maxLength": 20
        },
        "description": { "$ref": "#/definitions/Description" },
        "ids_references": { "$ref": "#/definitions/IdsReferences" },
        "type": { "type": "string" },
        "others": {
          "type": "array",
          "items": { "$ref": "#/definitions/OthersParameter" }
        }
      },
      "required": ["id", "name", "ids_references", "type", "others"],
      "additionalProperties": true
    },
    "AnyNode": {
      "type": "object",
      "description": "Cualquier nodo del grafo PIM",
      "properties": {
        "id": { "$ref": "#/definitions/UUID" },
        "name": { "type": "string", "minLength": 1, "maxLength": 20 },
        "description": { "$ref": "#/definitions/Description" },
        "ids_references": { "$ref": "#/definitions/IdsReferences" },
        "type": {
          "type": "string",
          "enum": [
            "oscillator", "noise", "sample",
            "lfo", "envelope",
            "frequency_filter", "reverb", "delay", "distortion", "chorus_flanger", "compressor", "equalizer",
            "mixer", "gain_pan"
          ]
        },
        "others": {
          "type": "array",
          "description": "Lista de otros parámetros de control dinámicos",
          "items": { "$ref": "#/definitions/OthersParameter" }
        },
        "stereo":        { "$ref": "#/definitions/Parameter" },
        "ping_pong":     { "$ref": "#/definitions/Parameter" },
        "waveform":      { "$ref": "#/definitions/Parameter" },
        "frequency":     { "$ref": "#/definitions/Parameter" },
        "pulseWidth":    { "$ref": "#/definitions/Parameter" },
        "gain":          { "$ref": "#/definitions/Parameter" },
        "phase":         { "$ref": "#/definitions/Parameter" },
        "pan":           { "$ref": "#/definitions/Parameter" },
        "noiseType":     { "$ref": "#/definitions/Parameter" },
        "amplitude":     { "$ref": "#/definitions/Parameter" },
        "file":          { "$ref": "#/definitions/Parameter" },
        "loop":          { "$ref": "#/definitions/Parameter" },
        "rate":          { "$ref": "#/definitions/Parameter" },
        "sync":          { "$ref": "#/definitions/Parameter" },
        "envelopeType":  { "$ref": "#/definitions/Parameter" },
        "attack":        { "$ref": "#/definitions/Parameter" },
        "decay":         { "$ref": "#/definitions/Parameter" },
        "sustain":       { "$ref": "#/definitions/Parameter" },
        "release":       { "$ref": "#/definitions/Parameter" },
        "delay":         { "$ref": "#/definitions/Parameter" },
        "hold":          { "$ref": "#/definitions/Parameter" },
        "curve":         { "$ref": "#/definitions/Parameter" },
        "filterType":    { "$ref": "#/definitions/Parameter" },
        "cutoff":        { "$ref": "#/definitions/Parameter" },
        "resonance":     { "$ref": "#/definitions/Parameter" },
        "slope":         { "$ref": "#/definitions/Parameter" },
        "roomSize":      { "$ref": "#/definitions/Parameter" },
        "damping":       { "$ref": "#/definitions/Parameter" },
        "decayTime":     { "$ref": "#/definitions/Parameter" },
        "dryWet":        { "$ref": "#/definitions/Parameter" },
        "delayTime":     { "$ref": "#/definitions/Parameter" },
        "feedback":      { "$ref": "#/definitions/Parameter" },
        "lowPassCutoff": { "$ref": "#/definitions/Parameter" },
        "highPassCutoff":{ "$ref": "#/definitions/Parameter" },
        "drive":         { "$ref": "#/definitions/Parameter" },
        "tone":          { "$ref": "#/definitions/Parameter" },
        "distType":      { "$ref": "#/definitions/Parameter" },
        "outputLevel":   { "$ref": "#/definitions/Parameter" },
        "depth":         { "$ref": "#/definitions/Parameter" },
        "mix":           { "$ref": "#/definitions/Parameter" },
        "threshold":     { "$ref": "#/definitions/Parameter" },
        "ratio":         { "$ref": "#/definitions/Parameter" },
        "makeupGain":    { "$ref": "#/definitions/Parameter" },
        "bandFrequency": { "$ref": "#/definitions/Parameter" },
        "bandwidth":     { "$ref": "#/definitions/Parameter" },
        "inputs_number": { "$ref": "#/definitions/Parameter" },
        "input_1":   { "$ref": "#/definitions/ConnectionPoint" },
        "input_2":   { "$ref": "#/definitions/ConnectionPoint" },
        "input_3":   { "$ref": "#/definitions/ConnectionPoint" },
        "input_4":   { "$ref": "#/definitions/ConnectionPoint" },
        "input_5":   { "$ref": "#/definitions/ConnectionPoint" },
        "input_6":   { "$ref": "#/definitions/ConnectionPoint" },
        "input_7":   { "$ref": "#/definitions/ConnectionPoint" },
        "input_8":   { "$ref": "#/definitions/ConnectionPoint" },
        "input_9":   { "$ref": "#/definitions/ConnectionPoint" },
        "input_10":  { "$ref": "#/definitions/ConnectionPoint" },
        "output_1":  { "$ref": "#/definitions/ConnectionPoint" },
        "output_2":  { "$ref": "#/definitions/ConnectionPoint" },
        "output":    { "$ref": "#/definitions/ConnectionPoint" }
      },
      "required": ["id", "name", "ids_references", "type", "others"],
      "additionalProperties": false
    },
    "Edge": {
      "type": "object",
      "description": "Conexión entre dos nodos del grafo PIM",
      "properties": {
        "id": { "$ref": "#/definitions/UUID" },
        "description": { "$ref": "#/definitions/Description" },
        "ids_references": { "$ref": "#/definitions/IdsReferences" },
        "sourceNode": { "type": "string" },
        "sourceParam": { "type": "string" },
        "targetNode": { "type": "string" },
        "targetParam": { "type": "string" },
        "type": { "enum": ["audio", "modification"] }
      },
      "required": ["id", "ids_references", "sourceNode", "sourceParam", "targetNode", "targetParam", "type"],
      "additionalProperties": false
    }
  }
}
