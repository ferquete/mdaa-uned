package com.proyectobase.backend.domain;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

/**
 * Entidad que representa la configuración de diseño conceptual (PIM) de un proyecto.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table("pim")
public class Pim {

    /** Identificador autoincrementado */
    @Id
    private Long id;

    /** Relaciones entre máquinas PIM en formato JSON */
    @Column("machines_relations")
    private String machinesRelations;

    /** ID del proyecto vinculado (Relación 1:1) */
    @Column("id_project")
    private Long idProject;
}
