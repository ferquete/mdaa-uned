package com.proyectobase.backend.web.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Petición para actualizar la configuración central de análisis (CIM).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateCimRequest {

    /** Relaciones entre máquinas en formato JSON */
    private String machinesRelations;
}
