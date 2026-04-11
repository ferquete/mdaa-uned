package com.proyectobase.backend.domain;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

/**
 * Entidad que representa la configuración analítica central (CIM) de un proyecto.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table("cim")
public class Cim {

    /** Identificador autoincrementado */
    @Id
    private Long id;

    /** Descripción de la parte de análisis del proyecto */
    private String description;

    /** ID del proyecto vinculado (Relación 1:1) */
    @Column("id_project")
    private Long idProject;
}
