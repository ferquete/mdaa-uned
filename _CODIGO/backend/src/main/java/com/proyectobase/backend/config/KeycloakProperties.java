package com.proyectobase.backend.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Propiedades de configuración de Keycloak para el cliente administrador.
 */
@ConfigurationProperties(prefix = "keycloak")
public record KeycloakProperties(
    String authServerUrl,
    String realm,
    String clientId,
    String clientSecret
) {}
