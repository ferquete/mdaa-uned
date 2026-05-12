package com.proyectobase.backend.domain;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

import java.time.LocalDateTime;

/**
 * Entidad que representa a un usuario en la base de datos local (MariaDB).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table("users")
public class User {

    /** Identificador interno (Autoincrementado) */
    @Id
    private Long id;

    /** Identificador externo (SUB de Keycloak) */
    @Column("external_id")
    private String externalId;

    /** Nombre del usuario */
    @Column("first_name")
    private String firstName;

    /** Apellidos del usuario */
    @Column("last_name")
    private String lastName;

    /** Correo electrónico */
    private String email;

    /** Último login detectado */
    @Column("last_login")
    private LocalDateTime lastLogin;

    /** Fecha de creación en DB local */
    @Column("created_at")
    private LocalDateTime createdAt;
}
