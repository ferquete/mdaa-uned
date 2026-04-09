package com.proyectobase.backend.domain;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

/**
 * Entidad que representa una máquina vinculada a un proyecto para su análisis.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table("cim_machines")
public class CimMachine {

    /** Identificador autoincrementado */
    @Id
    private Long id;

    /** ID del proyecto al que pertenece */
    @Column("id_proyect")
    private Long idProyect;

    /** Nombre de la máquina */
    private String name;

    /** Descripción de la máquina */
    private String description;

    /** Definición de la máquina en formato JSON DSL */
    private String machine;
}
