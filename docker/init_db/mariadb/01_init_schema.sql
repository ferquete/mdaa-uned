-- Script de inicialización de base de datos para MariaDB
-- Este script se ejecuta automáticamente la primera vez que arranca el contenedor.

-- Creación de la tabla de usuarios
CREATE TABLE IF NOT EXISTS users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    external_id VARCHAR(36) NOT NULL UNIQUE, -- ID de Keycloak (UUID)
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    last_login TIMESTAMP NULL DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Creación de la tabla de proyectos
CREATE TABLE IF NOT EXISTS projects (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(40) NOT NULL,
    description VARCHAR(200) DEFAULT NULL,
    user_id BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_user_project FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT chk_project_name_min CHECK (CHAR_LENGTH(name) >= 1)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Inserción de usuario de prueba inicial sincronizado con Keycloak
-- El external_id debe coincidir con el UUID que usemos en Keycloak
INSERT INTO users (external_id, first_name, last_name, email)
VALUES ('59cd8c60-9936-4f34-8b8a-54d622e4989f', 'Usuario', 'Test', 'test@uned.es');

-- Creación de la tabla cim (Centralización de máquinas y relaciones)
CREATE TABLE IF NOT EXISTS cim (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    description VARCHAR(600) NOT NULL,
    id_project BIGINT NOT NULL UNIQUE,
    CONSTRAINT fk_project_cim FOREIGN KEY (id_project) REFERENCES projects(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Creación de la tabla cim_machines
CREATE TABLE IF NOT EXISTS cim_machines (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    id_cim BIGINT NOT NULL,
    ref_machine VARCHAR(36) NOT NULL UNIQUE,
    name VARCHAR(20) NOT NULL,
    description VARCHAR(600) NOT NULL,
    machine LONGTEXT NOT NULL CHECK (JSON_VALID(machine)),
    CONSTRAINT fk_cim_machine FOREIGN KEY (id_cim) REFERENCES cim(id) ON DELETE CASCADE,
    CONSTRAINT chk_cim_machine_name_min CHECK (CHAR_LENGTH(name) >= 1)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Creación de la tabla cim_machines_rel (Relaciones entre máquinas)
CREATE TABLE IF NOT EXISTS cim_machines_rel (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    description VARCHAR(300) NOT NULL,
    id_cim BIGINT NOT NULL,
    id_src_machine BIGINT DEFAULT NULL,
    id_dest_machine BIGINT DEFAULT NULL,
    CONSTRAINT fk_cim_rel_cim FOREIGN KEY (id_cim) REFERENCES cim(id) ON DELETE CASCADE,
    CONSTRAINT fk_cim_rel_src FOREIGN KEY (id_src_machine) REFERENCES cim_machines(id) ON DELETE CASCADE,
    CONSTRAINT fk_cim_rel_dest FOREIGN KEY (id_dest_machine) REFERENCES cim_machines(id) ON DELETE CASCADE,
    CONSTRAINT chk_rel_desc_min CHECK (CHAR_LENGTH(description) >= 1)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
