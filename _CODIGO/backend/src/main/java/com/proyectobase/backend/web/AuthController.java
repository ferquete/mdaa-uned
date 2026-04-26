package com.proyectobase.backend.web;

import com.proyectobase.backend.service.KeycloakAdminClient;
import com.proyectobase.backend.web.dto.RegisterUserRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

/**
 * Controlador de Autenticación para el registro público.
 */
@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    private final KeycloakAdminClient keycloakAdminClient;

    public AuthController(KeycloakAdminClient keycloakAdminClient) {
        this.keycloakAdminClient = keycloakAdminClient;
    }

    /**
     * Endpoint para registrar un usuario de forma nativa.
     */
    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public Mono<Void> register(@Valid @RequestBody RegisterUserRequest request) {
        return keycloakAdminClient.registerUser(request);
    }
}
