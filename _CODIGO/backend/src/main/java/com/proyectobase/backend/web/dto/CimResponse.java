package com.proyectobase.backend.web.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Respuesta con los detalles de un CIM.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CimResponse {
    private Long id;
    private String machinesRelations;
    private Long idProject;
}
