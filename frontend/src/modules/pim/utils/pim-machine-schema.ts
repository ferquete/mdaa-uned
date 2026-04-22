export const PIM_MACHINE_SCHEMA = {
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "MDA Audio PIM Machine Model Schema",
  "description": "Schema for validating PIM Audio Machine models according to pim-machines.md technical specifications",
  "type": "object",
  "properties": {
    "id": {
      "$ref": "#/definitions/UUID",
      "description": "Identificador único de la máquina PIM (UUIDv4)"
    },
    "name": {
      "type": "string",
      "minLength": 1,
      "maxLength": 20,
      "description": "Nombre de la máquina (1-20 caracteres)"
    },
    "description": {
      "$ref": "#/definitions/Description",
      "description": "Descripción conceptual general (20-600 caracteres)"
    },
    "ids_cim_reference": {
      "type": "array",
      "description": "Lista de máquinas CIM vinculadas a este diseño PIM",
      "items": {
        "type": "string",
        "pattern": "^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$"
      }
    },
    "nodes": {
      "type": "array",
      "description": "Nodos de audio y control que componen la máquina",
      "items": { "$ref": "#/definitions/AnyNode" }
    },
    "edges": {
      "type": "array",
      "description": "Conexiones internas entre puertos de los nodos",
      "items": { "$ref": "#/definitions/Edge" }
    }
  },
  "required": ["id", "name", "description", "ids_cim_reference", "nodes", "edges"],
  "additionalProperties": false,
  "definitions": {
    "UUID": {
      "type": "string",
      "pattern": "^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$",
      "description": "Formato estándar UUIDv4 de 36 caracteres"
    },
    "Description": {
      "type": "string",
      "minLength": 1,
      "maxLength": 600,
      "description": "Texto descriptivo con límites de longitud técnicos"
    },
    "IdsReferences": {
      "type": "array",
      "description": "Referencias a elementos CIM (obligatorio, puede estar vacío [])",
      "items": {
        "type": "string",
        "pattern": "^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$"
      }
    },
    "Parameter": {
      "type": "object",
      "required": ["id", "ids_references", "initialValue"],
      "properties": {
        "id": { "$ref": "#/definitions/UUID" },
        "ids_references": { "$ref": "#/definitions/IdsReferences" },
        "initialValue": { "description": "Valor inicial técnico" },
        "isModifiable": { "type": "boolean" },
        "isExternalInput": { "type": "boolean" },
        "description": { "type": "string", "maxLength": 600 }
      },
      "additionalProperties": false
    },
    "StereoParameter": {
      "type": "object",
      "required": ["id", "ids_references", "initialValue"],
      "properties": {
        "id": { "$ref": "#/definitions/UUID" },
        "ids_references": { "$ref": "#/definitions/IdsReferences" },
        "initialValue": { "type": "boolean" },
        "description": { "type": "string", "maxLength": 600 }
      },
      "additionalProperties": false
    },
    "OthersParameter": {
      "type": "object",
      "required": ["id", "name", "ids_references", "initialValue", "isModifiable"],
      "properties": {
        "id": { "$ref": "#/definitions/UUID" },
        "name": { "type": "string", "maxLength": 20 },
        "ids_references": { "$ref": "#/definitions/IdsReferences" },
        "initialValue": { "type": "string", "maxLength": 100 },
        "isModifiable": { "type": "boolean" },
        "isExternalInput": { "type": "boolean" },
        "description": { "type": "string", "maxLength": 600 }
      },
      "additionalProperties": false
    },
    "ConnectionPoint": {
      "type": "object",
      "required": ["id", "ids_references"],
      "properties": {
        "id": { "$ref": "#/definitions/UUID" },
        "ids_references": { "$ref": "#/definitions/IdsReferences" },
        "isExternalInput": { "type": "boolean" },
        "isExternalOutput": { "type": "boolean" },
        "description": { "type": "string", "maxLength": 600 }
      },
      "additionalProperties": false
    },
    "AnyNode": {
      "type": "object",
      "required": ["id", "name", "description", "ids_references", "type", "others"],
      "properties": {
        "id": { "$ref": "#/definitions/UUID" },
        "name": { "type": "string", "maxLength": 20 },
        "description": { "type": "string", "maxLength": 600 },
        "ids_references": { "$ref": "#/definitions/IdsReferences" },
        "type": { "type": "string" },
        "others": { "type": "array", "items": { "$ref": "#/definitions/OthersParameter" } },
        "stereo": { "$ref": "#/definitions/StereoParameter" },
        "waveform": { "$ref": "#/definitions/Parameter" },
        "frequency": { "$ref": "#/definitions/Parameter" },
        "pulseWidth": { "$ref": "#/definitions/Parameter" },
        "gain": { "$ref": "#/definitions/Parameter" },
        "phase": { "$ref": "#/definitions/Parameter" },
        "pan": { "$ref": "#/definitions/Parameter" },
        "noiseType": { "$ref": "#/definitions/Parameter" },
        "amplitude": { "$ref": "#/definitions/Parameter" },
        "file": { "$ref": "#/definitions/Parameter" },
        "loop": { "$ref": "#/definitions/Parameter" },
        "rate": { "$ref": "#/definitions/Parameter" },
        "sync": { "$ref": "#/definitions/Parameter" },
        "envelopeType": { "$ref": "#/definitions/Parameter" },
        "attack": { "$ref": "#/definitions/Parameter" },
        "decay": { "$ref": "#/definitions/Parameter" },
        "sustain": { "$ref": "#/definitions/Parameter" },
        "release": { "$ref": "#/definitions/Parameter" },
        "delay": { "$ref": "#/definitions/Parameter" },
        "hold": { "$ref": "#/definitions/Parameter" },
        "curve": { "$ref": "#/definitions/Parameter" },
        "filterType": { "$ref": "#/definitions/Parameter" },
        "cutoff": { "$ref": "#/definitions/Parameter" },
        "resonance": { "$ref": "#/definitions/Parameter" },
        "slope": { "$ref": "#/definitions/Parameter" },
        "roomSize": { "$ref": "#/definitions/Parameter" },
        "damping": { "$ref": "#/definitions/Parameter" },
        "decayTime": { "$ref": "#/definitions/Parameter" },
        "dryWet": { "$ref": "#/definitions/Parameter" },
        "delayTime": { "$ref": "#/definitions/Parameter" },
        "feedback": { "$ref": "#/definitions/Parameter" },
        "lowPassCutoff": { "$ref": "#/definitions/Parameter" },
        "highPassCutoff": { "$ref": "#/definitions/Parameter" },
        "drive": { "$ref": "#/definitions/Parameter" },
        "tone": { "$ref": "#/definitions/Parameter" },
        "distType": { "$ref": "#/definitions/Parameter" },
        "outputLevel": { "$ref": "#/definitions/Parameter" },
        "depth": { "$ref": "#/definitions/Parameter" },
        "mix": { "$ref": "#/definitions/Parameter" },
        "threshold": { "$ref": "#/definitions/Parameter" },
        "ratio": { "$ref": "#/definitions/Parameter" },
        "makeupGain": { "$ref": "#/definitions/Parameter" },
        "bandFrequency": { "$ref": "#/definitions/Parameter" },
        "bandwidth": { "$ref": "#/definitions/Parameter" },
        "input_1": { "$ref": "#/definitions/ConnectionPoint" },
        "input_2": { "$ref": "#/definitions/ConnectionPoint" },
        "input_3": { "$ref": "#/definitions/ConnectionPoint" },
        "input_4": { "$ref": "#/definitions/ConnectionPoint" },
        "input_5": { "$ref": "#/definitions/ConnectionPoint" },
        "input_6": { "$ref": "#/definitions/ConnectionPoint" },
        "input_7": { "$ref": "#/definitions/ConnectionPoint" },
        "input_8": { "$ref": "#/definitions/ConnectionPoint" },
        "input_9": { "$ref": "#/definitions/ConnectionPoint" },
        "input_10": { "$ref": "#/definitions/ConnectionPoint" },
        "output_1": { "$ref": "#/definitions/ConnectionPoint" },
        "output_2": { "$ref": "#/definitions/ConnectionPoint" },
        "output": { "$ref": "#/definitions/ConnectionPoint" }
      },
      "additionalProperties": false
    },
    "Edge": {
      "type": "object",
      "required": ["id", "description", "ids_references", "sourceNode", "sourceParam", "targetNode", "targetParam", "type"],
      "properties": {
        "id": { "$ref": "#/definitions/UUID" },
        "description": { "type": "string", "maxLength": 600 },
        "ids_references": { "$ref": "#/definitions/IdsReferences" },
        "sourceNode": { "type": "string" },
        "sourceParam": { "type": "string" },
        "targetNode": { "type": "string" },
        "targetParam": { "type": "string" },
        "type": { "enum": ["audio", "modification"] }
      },
      "additionalProperties": false
    }
  }
}
