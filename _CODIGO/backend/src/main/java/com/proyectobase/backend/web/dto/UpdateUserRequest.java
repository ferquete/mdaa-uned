package com.proyectobase.backend.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * DTO para actualizar el perfil del usuario.
 * Solo permitimos modificar nombre y apellidos.
 */
public record UpdateUserRequest(
    @NotBlank(message = "El nombre es obligatorio")
    @Size(max = 50, message = "El nombre no puede superar los 50 caracteres")
    String firstName,

    @NotBlank(message = "Los apellidos son obligatorios")
    @Size(max = 50, message = "Los apellidos no pueden superar los 50 caracteres")
    String lastName
) {}
