package com.proyectobase.backend.repository;

import com.proyectobase.backend.domain.Project;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

/**
 * Repositorio reactivo de proyectos para R2DBC.
 */
@Repository
public interface ProjectRepository extends ReactiveCrudRepository<Project, Long> {

    /**
     * Busca todos los proyectos asociados a un usuario.
     * @param userId ID del usuario propietario
     * @return Flux de proyectos ordenados por fecha de creación descendente
     */
    Flux<Project> findByUserIdOrderByCreatedAtDesc(Long userId);

    /**
     * Cuenta cuántos proyectos tiene un usuario.
     * @param userId ID del usuario propietario
     * @return Mono con el total de proyectos
     */
    Mono<Long> countByUserId(Long userId);
}
