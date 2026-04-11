package com.proyectobase.backend.domain;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

/**
 * Entidad que representa una relación o conexión entre dos máquinas dentro de un sistema CIM.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table("cim_machines_rel")
public class CimMachineRel {

    /** Identificador autoincrementado */
    @Id
    private Long id;

    /** Descripción de la relación (máx 300) */
    private String description;

    /** ID del CIM al que pertenece esta relación */
    @Column("id_cim")
    private Long idCim;

    /** ID de la máquina origen */
    @Column("id_src_machine")
    private Long idSrcMachine;

    /** ID de la máquina destino */
    @Column("id_dest_machine")
    private Long idDestMachine;
}
