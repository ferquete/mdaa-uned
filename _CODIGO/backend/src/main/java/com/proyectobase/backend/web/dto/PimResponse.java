package com.proyectobase.backend.web.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Respuesta con los detalles de un PIM.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PimResponse {
    private Long id;
    private String machinesRelations;
    private Long idProject;
}
