package com.proyectobase.backend.repository;

import com.proyectobase.backend.domain.PimMachine;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;

/**
 * Repositorio reactivo de máquinas PIM para R2DBC.
 */
@Repository
public interface PimMachineRepository extends ReactiveCrudRepository<PimMachine, Long> {

    /**
     * Busca las máquinas asociadas a un registro PIM.
     * @param idPim ID del PIM
     * @return Flux de máquinas
     */
    Flux<PimMachine> findByIdPim(Long idPim);
}
