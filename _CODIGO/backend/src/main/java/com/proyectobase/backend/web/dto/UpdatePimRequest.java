package com.proyectobase.backend.web.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Petición para actualizar la configuración de diseño conceptual (PIM).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdatePimRequest {

    /** Relaciones entre máquinas PIM en formato JSON */
    private String machinesRelations;
}
