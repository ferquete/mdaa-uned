package com.proyectobase.backend.repository;

import com.proyectobase.backend.domain.Cim;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import reactor.core.publisher.Mono;

/**
 * Repositorio reactivo para la entidad Cim.
 */
public interface CimRepository extends ReactiveCrudRepository<Cim, Long> {

    /**
     * Busca el registro CIM asociado a un proyecto específico.
     * @param idProject ID del proyecto
     * @return Mono con el Cim encontrado
     */
    Mono<Cim> findByIdProject(Long idProject);
}
