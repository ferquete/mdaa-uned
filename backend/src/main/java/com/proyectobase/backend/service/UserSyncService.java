package com.proyectobase.backend.service;

import com.proyectobase.backend.domain.User;
import com.proyectobase.backend.repository.UserRepository;
import com.proyectobase.backend.web.dto.UpdateUserRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import reactor.core.publisher.Mono;

import java.time.LocalDateTime;

/**
 * Servicio encargado de la sincronización entre el JWT de Keycloak y el usuario local de la base de datos.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class UserSyncService {

    private final UserRepository userRepository;
    private final KeycloakAdminClient keycloakAdminClient;

    /**
     * Sincroniza un usuario autenticado a partir de su Token JWT.
     * Si no existe en MariaDB, lo crea; si ya existe, actualiza su último login.
     * @param jwt El token JWT proporcionado por el usuario.
     * @return El usuario sincronizado.
     */
    @Transactional
    public Mono<User> syncUser(Jwt jwt) {
        String externalId = jwt.getSubject();
        String email = jwt.getClaimAsString("email");
        String firstName = jwt.getClaimAsString("given_name");
        String lastName = jwt.getClaimAsString("family_name");

        return userRepository.findByExternalId(externalId)
                .flatMap(existingUser -> {
                    log.debug("User already exists, updating last_login for user: {}", email);
                    existingUser.setLastLogin(LocalDateTime.now());
                    // También actualizamos los datos de perfil por si han cambiado en Keycloak
                    existingUser.setFirstName(firstName);
                    existingUser.setLastName(lastName);
                    existingUser.setEmail(email);
                    return userRepository.save(existingUser);
                })
                .switchIfEmpty(Mono.defer(() -> {
                    log.info("New authenticated user found: {}. Creating local record.", email);
                    User newUser = User.builder()
                            .externalId(externalId)
                            .firstName(firstName)
                            .lastName(lastName)
                            .email(email)
                            .lastLogin(LocalDateTime.now())
                            .createdAt(LocalDateTime.now())
                            .build();
                    return userRepository.save(newUser)
                            .map(savedUser -> savedUser); // Asegura el tipado @NonNull
                }));
    }

    /**
     * Actualiza el perfil del usuario tanto en MariaDB como en Keycloak.
     * @param externalId El ID externo del usuario (Subject del JWT).
     * @param request Los nuevos datos del perfil.
     * @return El usuario actualizado.
     */
    @Transactional
    public Mono<User> updateProfile(String externalId, UpdateUserRequest request) {
        return userRepository.findByExternalId(externalId)
                .switchIfEmpty(Mono.error(new RuntimeException("User not found: " + externalId)))
                .flatMap(user -> {
                    log.info("Updating profile for user: {}", user.getEmail());
                    user.setFirstName(request.firstName());
                    user.setLastName(request.lastName());
                    
                    // Actualizamos en DB local
                    return userRepository.save(user)
                            .flatMap(savedUser -> 
                                // Actualizamos en Keycloak. Si falla, el error propagado hará Rollback de la DB.
                                keycloakAdminClient.updateUser(externalId, request)
                                    .thenReturn(savedUser)
                            );
                });
    }
}
