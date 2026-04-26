package com.proyectobase.backend.web.dto;

import java.time.LocalDateTime;

/**
 * DTO para la respuesta de información del usuario.
 */
public record UserResponse(
        Long id,
        String externalId,
        String firstName,
        String lastName,
        String email,
        LocalDateTime lastLogin,
        LocalDateTime createdAt
) {}
