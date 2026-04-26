package com.proyectobase.backend.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import java.util.List;

/**
 * Propiedades generales de la aplicación.
 * Centraliza URLs, puertos y configuraciones específicas del negocio.
 */
@ConfigurationProperties(prefix = "app")
public record AppProperties(
    CorsProperties cors,
    RegistrationProperties registration
) {
    /**
     * Propiedades de CORS.
     */
    public record CorsProperties(List<String> allowedOrigins) {}

    /**
     * Propiedades relacionadas con el registro de usuarios.
     */
    public record RegistrationProperties(String redirectUri) {}
}
