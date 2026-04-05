package com.proyectobase.backend.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Petición de creación de proyecto.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateProjectRequest {

    /** Nombre del proyecto (1-40 caracteres) */
    @NotBlank(message = "El nombre del proyecto es obligatorio")
    @Size(min = 1, max = 40, message = "El nombre debe tener entre 1 y 40 caracteres")
    private String name;

    /** Descripción opcional (max 200 caracteres) */
    @Size(max = 200, message = "La descripción no puede superar los 200 caracteres")
    private String description;

    /** Género musical seleccionado */
    @NotBlank(message = "El género del proyecto es obligatorio")
    private String genre;
}
