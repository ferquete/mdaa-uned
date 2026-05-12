package com.proyectobase.backend.web;

import com.proyectobase.backend.service.UserSyncService;
import com.proyectobase.backend.web.dto.UpdateUserRequest;
import com.proyectobase.backend.web.dto.UserResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

/**
 * Controlador para gestionar la información del usuario autenticado.
 */
@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
public class UserController {

    private final UserSyncService userSyncService;

    /**
     * Sincroniza y retorna la información del usuario actual.
     * Al llamar a este endpoint, el UserSessionFilter ya ha procesado la sincronización,
     * pero llamamos de nuevo a syncUser para asegurar que tenemos los datos más frescos
     * y devolver el objeto del dominio mapeado a DTO.
     */
    @GetMapping("/me")
    public Mono<UserResponse> getCurrentUser(@AuthenticationPrincipal Jwt jwt) {
        return userSyncService.syncUser(jwt)
                .map(this::toResponse);
    }

    /**
     * Actualiza la información de perfil del usuario actual.
     */
    @PutMapping("/me")
    public Mono<UserResponse> updateCurrentUser(
            @AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody UpdateUserRequest request) {
        return userSyncService.updateProfile(jwt.getSubject(), request)
                .map(this::toResponse);
    }

    private UserResponse toResponse(com.proyectobase.backend.domain.User user) {
        return new UserResponse(
                user.getId(),
                user.getExternalId(),
                user.getFirstName(),
                user.getLastName(),
                user.getEmail(),
                user.getLastLogin(),
                user.getCreatedAt()
        );
    }
}
