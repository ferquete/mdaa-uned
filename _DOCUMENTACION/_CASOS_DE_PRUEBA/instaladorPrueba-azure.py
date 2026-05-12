#!/usr/bin/env python3
"""
instaladorPrueba-azure.py
-------------------
Carga un caso de prueba en la base de datos MariaDB de Azure.
"""

import sys
import json
import os
import mysql.connector

# ── Configuración de Azure ──────────────────────────────────────
DB_CONFIG = {
    "host": "mdaa-app.spaincentral.azurecontainer.io",
    "port": 3306,
    "database": "basedb",
    "user": "devuser",
    "password": "devpassword",
}

TEST_USER_EXTERNAL_ID = "59cd8c60-9936-4f34-8b8a-54d622e4989f"
TEST_USER_EMAIL = "test@uned.es"

def leer_proyecto_md(path_md: str) -> tuple[str, str]:
    with open(path_md, encoding="utf-8") as f:
        contenido = f.read()
    lineas = contenido.strip().splitlines()
    nombre = ""
    desc_lineas = []
    for linea in lineas:
        if not nombre and linea.startswith("# "):
            nombre = linea[2:].strip()
        else:
            desc_lineas.append(linea)
    descripcion = " ".join(desc_lineas).strip()
    return nombre[:40], descripcion[:1000]

def cargar_jsons_directorio(path_dir: str) -> list[dict]:
    if not os.path.isdir(path_dir): return []
    archivos = sorted(f for f in os.listdir(path_dir) if f.endswith(".json"))
    resultado = []
    for archivo in archivos:
        ruta = os.path.join(path_dir, archivo)
        with open(ruta, encoding="utf-8") as f:
            resultado.append(json.load(f))
    return resultado

def obtener_id_usuario(cursor) -> int:
    cursor.execute("SELECT id FROM users WHERE external_id = %s", (TEST_USER_EXTERNAL_ID,))
    fila = cursor.fetchone()
    if not fila:
        raise RuntimeError(f"Usuario {TEST_USER_EXTERNAL_ID} no encontrado.")
    return fila[0]

def instalar_caso(path_caso: str):
    path_caso = os.path.abspath(path_caso)
    path_md = os.path.join(path_caso, "proyecto.md")
    path_cim = os.path.join(path_caso, "CIM")
    path_pim = os.path.join(path_caso, "PIM")

    nombre, descripcion = leer_proyecto_md(path_md)
    cim_machines = cargar_jsons_directorio(os.path.join(path_cim, "machines"))
    cim_rel_file = os.path.join(path_cim, "cim_relations.json")
    cim_relations = json.load(open(cim_rel_file, encoding="utf-8")) if os.path.isfile(cim_rel_file) else {}
    
    pim_machines = cargar_jsons_directorio(os.path.join(path_pim, "machines"))
    pim_rel_file = os.path.join(path_pim, "pim_relations.json")
    pim_relations = json.load(open(pim_rel_file, encoding="utf-8")) if os.path.isfile(pim_rel_file) else {}

    print(f"🔌 Conectando a Azure MariaDB ({DB_CONFIG['host']})...")
    conn = mysql.connector.connect(**DB_CONFIG, use_pure=True)
    cursor = conn.cursor()

    try:
        user_id = obtener_id_usuario(cursor)
        cursor.execute("INSERT INTO projects (name, description, user_id) VALUES (%s, %s, %s)", (nombre, descripcion, user_id))
        project_id = cursor.lastrowid

        # CIM
        cursor.execute("INSERT INTO cim (machines_relations, id_project) VALUES (%s, %s)", (json.dumps(cim_relations), project_id))
        cim_id = cursor.lastrowid
        for m in cim_machines:
            cursor.execute("INSERT INTO cim_machines (id_cim, machine) VALUES (%s, %s)", (cim_id, json.dumps(m)))

        # PIM
        cursor.execute("INSERT INTO pim (machines_relations, id_project) VALUES (%s, %s)", (json.dumps(pim_relations), project_id))
        pim_id = cursor.lastrowid
        for m in pim_machines:
            cursor.execute("INSERT INTO pim_machines (id_pim, machine) VALUES (%s, %s)", (pim_id, json.dumps(m)))

        conn.commit()
        print(f"✅ Proyecto '{nombre}' instalado en Azure (ID: {project_id})")
    except Exception as e:
        conn.rollback()
        print(f"❌ Error: {e}")
        sys.exit(1)
    finally:
        cursor.close()
        conn.close()

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Uso: python3 instaladorPrueba-azure.py <path_directorio_caso>")
        sys.exit(1)
    instalar_caso(sys.argv[1])
