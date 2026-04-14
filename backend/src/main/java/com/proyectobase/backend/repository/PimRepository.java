package com.proyectobase.backend.repository;

import com.proyectobase.backend.domain.Pim;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import reactor.core.publisher.Mono;

/**
 * Repositorio reactivo para la entidad Pim.
 */
public interface PimRepository extends ReactiveCrudRepository<Pim, Long> {

    /**
     * Busca el registro PIM asociado a un proyecto específico.
     * @param idProject ID del proyecto
     * @return Mono con el Pim encontrado
     */
    Mono<Pim> findByIdProject(Long idProject);
}
