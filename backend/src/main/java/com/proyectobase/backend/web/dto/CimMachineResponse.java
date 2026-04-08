package com.proyectobase.backend.web.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Respuesta con los datos de una máquina CIM.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CimMachineResponse {

    private Long id;
    private Long idProyect;
    private String name;
    private String machine;
}
