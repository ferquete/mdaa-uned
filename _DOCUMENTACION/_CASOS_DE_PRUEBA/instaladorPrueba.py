#!/usr/bin/env python3
"""
instaladorPrueba.py
-------------------
Carga un caso de prueba en la base de datos MariaDB del proyecto.
Dado un directorio con la estructura de un caso de prueba (proyecto.md,
CIM/, PIM/), inserta el proyecto asociado al usuario test@uned.es.

Uso:
    python3 instaladorPrueba.py <path_directorio_caso>

Ejemplo:
    python3 instaladorPrueba.py _DOCUMENTACION/_CASOS_DE_PRUEBA/TEST_1
"""

import sys
import json
import os
import re
import mysql.connector

# ── Configuración de la base de datos ──────────────────────────────────────
DB_CONFIG = {
    "host": "localhost",
    "port": 3306,
    "database": "basedb",
    "user": "devuser",
    "password": "devpassword",
}

# UUID del usuario test@uned.es (debe coincidir con el realm de Keycloak)
TEST_USER_EXTERNAL_ID = "59cd8c60-9936-4f34-8b8a-54d622e4989f"
TEST_USER_EMAIL = "test@uned.es"


# ── Utilidades ────────────────────────────────────────────────────────────

def leer_proyecto_md(path_md: str) -> tuple[str, str]:
    """
    Lee proyecto.md y extrae el nombre (primera línea H1) y la descripción
    (el resto del contenido concatenado).
    """
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
    # Truncar descripción a 1000 caracteres según restricción de la tabla
    descripcion = descripcion[:1000]
    # Truncar nombre a 40 caracteres según restricción de la tabla
    nombre = nombre[:40]

    if not nombre:
        raise ValueError(f"No se encontró título H1 en {path_md}")

    return nombre, descripcion


def cargar_jsons_directorio(path_dir: str) -> list[dict]:
    """Carga todos los archivos .json de un directorio y los devuelve como lista."""
    archivos = sorted(
        f for f in os.listdir(path_dir) if f.endswith(".json")
    )
    resultado = []
    for archivo in archivos:
        ruta = os.path.join(path_dir, archivo)
        with open(ruta, encoding="utf-8") as f:
            resultado.append(json.load(f))
    return resultado


def obtener_id_usuario(cursor) -> int:
    """Obtiene el id interno del usuario test@uned.es."""
    cursor.execute(
        "SELECT id FROM users WHERE external_id = %s",
        (TEST_USER_EXTERNAL_ID,)
    )
    fila = cursor.fetchone()
    if not fila:
        raise RuntimeError(
            f"No se encontró el usuario con external_id={TEST_USER_EXTERNAL_ID}. "
            "Asegúrate de que la BD está inicializada correctamente."
        )
    return fila[0]


# ── Lógica principal ──────────────────────────────────────────────────────

def instalar_caso(path_caso: str):
    path_caso = os.path.abspath(path_caso)

    # Validar estructura mínima
    path_md = os.path.join(path_caso, "proyecto.md")
    path_cim = os.path.join(path_caso, "CIM")
    path_pim = os.path.join(path_caso, "PIM")

    for ruta in [path_md, path_cim, path_pim]:
        if not os.path.exists(ruta):
            print(f"[ERROR] No se encontró: {ruta}")
            sys.exit(1)

    # Leer datos del caso
    nombre, descripcion = leer_proyecto_md(path_md)
    print(f"\n📦 Proyecto: {nombre}")
    print(f"   Descripción: {descripcion[:80]}...")

    # Cargar máquinas y relaciones CIM
    path_cim_machines = os.path.join(path_cim, "machines")
    cim_machines = cargar_jsons_directorio(path_cim_machines) if os.path.isdir(path_cim_machines) else []
    cim_relations_file = os.path.join(path_cim, "cim_relations.json")
    cim_relations = json.load(open(cim_relations_file, encoding="utf-8")) if os.path.isfile(cim_relations_file) else {}
    print(f"   CIM máquinas: {len(cim_machines)} | relaciones: {len(cim_relations.get('relations', []))}")

    # Cargar máquinas y relaciones PIM
    path_pim_machines = os.path.join(path_pim, "machines")
    pim_machines = cargar_jsons_directorio(path_pim_machines) if os.path.isdir(path_pim_machines) else []
    pim_relations_file = os.path.join(path_pim, "pim_relations.json")
    pim_relations = json.load(open(pim_relations_file, encoding="utf-8")) if os.path.isfile(pim_relations_file) else {}
    print(f"   PIM máquinas: {len(pim_machines)} | relaciones: {len(pim_relations.get('relations', []))}")

    # Conectar a la BD
    print("\n🔌 Conectando a la base de datos...")
    conn = mysql.connector.connect(**DB_CONFIG)
    cursor = conn.cursor()

    try:
        # Obtener ID del usuario
        user_id = obtener_id_usuario(cursor)
        print(f"   Usuario encontrado: id={user_id} ({TEST_USER_EMAIL})")

        # Insertar proyecto
        cursor.execute(
            "INSERT INTO projects (name, description, user_id) VALUES (%s, %s, %s)",
            (nombre, descripcion, user_id)
        )
        project_id = cursor.lastrowid
        print(f"   ✅ Proyecto insertado: id={project_id}")

        # Insertar CIM (relaciones en la tabla cim)
        cim_relations_json = json.dumps(cim_relations, ensure_ascii=False)
        cursor.execute(
            "INSERT INTO cim (machines_relations, id_project) VALUES (%s, %s)",
            (cim_relations_json, project_id)
        )
        cim_id = cursor.lastrowid
        print(f"   ✅ CIM insertado: id={cim_id}")

        # Insertar máquinas CIM
        for machine in cim_machines:
            machine_json = json.dumps(machine, ensure_ascii=False)
            cursor.execute(
                "INSERT INTO cim_machines (id_cim, machine) VALUES (%s, %s)",
                (cim_id, machine_json)
            )
        print(f"   ✅ {len(cim_machines)} máquinas CIM insertadas")

        # Insertar PIM (relaciones en la tabla pim)
        pim_relations_json = json.dumps(pim_relations, ensure_ascii=False)
        cursor.execute(
            "INSERT INTO pim (machines_relations, id_project) VALUES (%s, %s)",
            (pim_relations_json, project_id)
        )
        pim_id = cursor.lastrowid
        print(f"   ✅ PIM insertado: id={pim_id}")

        # Insertar máquinas PIM
        for machine in pim_machines:
            machine_json = json.dumps(machine, ensure_ascii=False)
            cursor.execute(
                "INSERT INTO pim_machines (id_pim, machine) VALUES (%s, %s)",
                (pim_id, machine_json)
            )
        print(f"   ✅ {len(pim_machines)} máquinas PIM insertadas")

        conn.commit()
        print(f"\n🎉 Caso de prueba instalado correctamente (project_id={project_id})")

    except Exception as e:
        conn.rollback()
        print(f"\n[ERROR] {e}")
        sys.exit(1)
    finally:
        cursor.close()
        conn.close()


if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Uso: python3 instaladorPrueba.py <path_directorio_caso>")
        sys.exit(1)

    instalar_caso(sys.argv[1])
