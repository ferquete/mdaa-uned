package com.proyectobase.backend.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Petición para crear una nueva máquina CIM.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CimMachineRequest {

    /** Nombre de la máquina (1-20 caracteres) */
    @NotBlank(message = "El nombre de la máquina es obligatorio")
    @Size(min = 1, max = 20, message = "El nombre debe tener entre 1 y 20 caracteres")
    private String name;
}
