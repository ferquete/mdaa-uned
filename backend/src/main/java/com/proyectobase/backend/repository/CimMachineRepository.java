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
     * Busca todas las máquinas asociadas a un proyecto.
     * @param idProyect ID del proyecto padre
     * @return Flux de máquinas encontradas
     */
    Flux<CimMachine> findByIdProyect(Long idProyect);
}
