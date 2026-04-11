package com.proyectobase.backend.web.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Petición para actualizar la información de un CIM.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateCimRequest {
    
    @NotBlank(message = "La descripción no puede estar vacía")
    @Size(min = 10, max = 600, message = "La descripción debe tener entre 10 y 600 caracteres")
    private String description;
}
