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
 * Entidad que representa un proyecto del usuario.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table("projects")
public class Project {

    /** Identificador autoincrementado */
    @Id
    private Long id;

    /** Nombre del proyecto */
    private String name;
 
    /** Descripción opcional */
    private String description;

    /** Género musical seleccionado */
    @Column("genre")
    private ProjectGenre genre;

    /** Usuario propietario del proyecto */
    @Column("user_id")
    private Long userId;

    /** Fecha de creación */
    @Column("created_at")
    private LocalDateTime createdAt;
}
