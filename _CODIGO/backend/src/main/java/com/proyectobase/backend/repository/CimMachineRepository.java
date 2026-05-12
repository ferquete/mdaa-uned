package com.proyectobase.backend.repository;

import com.proyectobase.backend.domain.CimMachine;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;

/**
 * Repositorio reactivo de máquinas CIM para R2DBC.
 */
@Repository
public interface CimMachineRepository extends ReactiveCrudRepository<CimMachine, Long> {

    /**
     * Busca las máquinas asociadas a un registro CIM.
     * @param idCim ID del CIM
     * @return Flux de máquinas
     */
    Flux<CimMachine> findByIdCim(Long idCim);
}
