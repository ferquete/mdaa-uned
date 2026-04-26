package com.proyectobase.backend.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Petición para crear o actualizar una máquina PIM.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PimMachineRequest {

    /** Nombre de la máquina (1-20 caracteres) */
    @NotBlank(message = "El nombre de la máquina es obligatorio")
    @Size(min = 1, max = 20, message = "El nombre debe tener entre 1 y 20 caracteres")
    private String name;

    /** Descripción de la máquina (0-600 caracteres) */
    @Size(max = 600, message = "La descripción debe tener máximo 600 caracteres")
    private String description;

    /** Estructura JSON de la máquina PIM */
    private String machine;
}
