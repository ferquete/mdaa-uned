package com.proyectobase.backend.web.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Respuesta con los datos de una máquina PIM.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PimMachineResponse {

    private Long id;
    private Long idProject;
    private Long idPim;
    private String machine;
}
