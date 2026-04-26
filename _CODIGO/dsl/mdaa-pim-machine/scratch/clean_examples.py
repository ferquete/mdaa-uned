import json
import os
import re

def clean_json(data):
    if isinstance(data, dict):
        # Es un objeto, comprobar si es un parámetro o un punto
        is_param = "isModifiable" in data
        # Identificar si es un punto basado en la clave del padre (esto es difícil en recursión pura)
        # Pero podemos guiarnos por la ausencia de initialValue/isModifiable
        is_point = "id" in data and "ids_references" in data and not is_param
        
        if is_param:
            # Regla 1: Parámetros nunca tienen ids_destination_machines
            if "ids_destination_machines" in data:
                del data["ids_destination_machines"]
            
            # Regla 2: ids_source_machines solo si isModifiable es true
            if not data.get("isModifiable", False):
                if "ids_source_machines" in data:
                    del data["ids_source_machines"]
            elif "ids_source_machines" not in data:
                # Opcional: añadirlo si falta? El usuario dijo "solo podremos tener si isModificable es true"
                # pero no dijo que sea obligatorio tenerlo vacío. Lo dejaré como está si falta.
                pass
        
        # Procesar hijos
        for key, value in list(data.items()):
            # Si la clave indica que es un input o output, aplicamos reglas de puntos
            if isinstance(value, dict) and "id" in value:
                if re.match(r"^input(_\d+)?$", key):
                    if "ids_destination_machines" in value:
                        del value["ids_destination_machines"]
                    if "ids_source_machines" not in value:
                        value["ids_source_machines"] = []
                elif re.match(r"^output(_\d+)?$", key):
                    if "ids_source_machines" in value:
                        del value["ids_source_machines"]
                    if "ids_destination_machines" not in value:
                        value["ids_destination_machines"] = []
            
            clean_json(value)
            
    elif isinstance(data, array := list):
        for item in data:
            clean_json(item)

examples_dir = "dsl/mdaa-pim-machine/examples"
for filename in os.listdir(examples_dir):
    if filename.endswith(".json") and filename != "mdaa-audio-pim-machine-schema.json":
        filepath = os.path.join(examples_dir, filename)
        with open(filepath, 'r') as f:
            try:
                data = json.load(f)
                clean_json(data)
                with open(filepath, 'w') as f_out:
                    json.dump(data, f_out, indent=4)
                print(f"Cleaned {filename}")
            except Exception as e:
                print(f"Error processing {filename}: {e}")
