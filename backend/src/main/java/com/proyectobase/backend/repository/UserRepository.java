package com.proyectobase.backend.repository;

import com.proyectobase.backend.domain.User;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Mono;

/**
 * Repositorio reactivo para la tabla de usuarios local.
 */
@Repository
public interface UserRepository extends ReactiveCrudRepository<User, Long> {

    /**
     * Busca un usuario por su identificador externo de Keycloak (sub).
     */
    Mono<User> findByExternalId(String externalId);
}
