package com.proyectobase.backend.repository;

import com.proyectobase.backend.domain.CimMachineRel;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import reactor.core.publisher.Flux;

/**
 * Repositorio reactivo para la entidad CimMachineRel.
 */
public interface CimMachineRelRepository extends ReactiveCrudRepository<CimMachineRel, Long> {

    /**
     * Busca todas las relaciones asociadas a un sistema CIM.
     * @param idCim ID del CIM
     * @return Flux de relaciones
     */
    Flux<CimMachineRel> findByIdCim(Long idCim);
}
