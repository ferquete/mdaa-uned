import json
import os

def total_clean_json(data):
    if isinstance(data, dict):
        # Eliminar las claves prohibidas
        keys_to_remove = ["ids_source_machines", "ids_destination_machines"]
        for key in keys_to_remove:
            if key in data:
                del data[key]
        
        # Procesar hijos
        for key in data:
            total_clean_json(data[key])
            
    elif isinstance(data, list):
        for item in data:
            total_clean_json(item)

examples_dir = "/Users/fernandorealcisneros/trabajo/master/GENERACION_CODIGO/PARCIALES/PEP4/ProyectoBase/dsl/mdaa-pim-machine/examples"
for filename in os.listdir(examples_dir):
    if filename.endswith(".json") and filename != "mdaa-audio-pim-machine-schema.json":
        filepath = os.path.join(examples_dir, filename)
        with open(filepath, 'r') as f:
            try:
                data = json.load(f)
                total_clean_json(data)
                with open(filepath, 'w') as f_out:
                    json.dump(data, f_out, indent=4)
                print(f"Total cleaned {filename}")
            except Exception as e:
                print(f"Error processing {filename}: {e}")
