package com.proyectobase.backend.domain;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

/**
 * Entidad que representa una máquina vinculada a un proyecto para su diseño conceptual (PIM).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table("pim_machines")
public class PimMachine {

    /** Identificador autoincrementado */
    @Id
    private Long id;

    /** ID del registro PIM al que pertenece */
    @Column("id_pim")
    private Long idPim;

    /** Definición de la máquina PIM en formato JSON DSL */
    private String machine;
}
