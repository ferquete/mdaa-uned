package com.proyectobase.backend.service;

import com.proyectobase.backend.domain.CimMachine;
import com.proyectobase.backend.repository.CimMachineRepository;
import com.proyectobase.backend.repository.CimRepository;
import com.proyectobase.backend.repository.ProjectRepository;
import com.proyectobase.backend.repository.UserRepository;
import com.proyectobase.backend.web.dto.CimMachineRequest;
import com.proyectobase.backend.web.dto.CimMachineResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.Objects;

/**
 * Servicio para la gestión de máquinas CIM (Reactivo).
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class CimMachineService {

    private final CimMachineRepository cimMachineRepository;
    private final CimRepository cimRepository;
    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;

    /**
     * Crea una nueva máquina vinculada a un proyecto.
     * @param externalId ID de Keycloak del usuario
     * @param projectId ID del proyecto padre
     * @param request Datos de la máquina
     * @return Mono con la máquina creada
     */
    @Transactional
    public Mono<CimMachineResponse> createMachine(String externalId, Long projectId, CimMachineRequest request) {
        log.info("Creando máquina '{}' para proyecto {} y usuario {}", request.getName(), projectId, externalId);

        return verifyProjectOwnership(externalId, projectId)
                .flatMap(projId -> cimRepository.findByIdProject(projectId))
                .switchIfEmpty(Mono.error(new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Configuración CIM no encontrada para el proyecto")))
                .flatMap(cim -> {
                    CimMachine machine = CimMachine.builder()
                            .idCim(cim.getId())
                            .refMachine(java.util.UUID.randomUUID().toString())
                            .name(request.getName())
                            .description(request.getDescription())
                            .machine("{}")
                            .build();
                    return cimMachineRepository.save(machine)
                            .map(savedMachine -> mapToResponse(savedMachine, projectId));
                });
    }

    /**
     * Actualiza una máquina existente.
     * @param externalId ID de Keycloak del usuario
     * @param machineId ID de la máquina a actualizar
     * @param request Nuevos datos de la máquina
     * @return Mono con la máquina actualizada
     */
    @Transactional
    public Mono<CimMachineResponse> updateMachine(String externalId, Long machineId, CimMachineRequest request) {
        log.info("Actualizando máquina {}. Nuevo nombre: '{}'. JSON recibido: {}", 
                machineId, request.getName(), request.getMachine());

        return cimMachineRepository.findById(machineId)
                .switchIfEmpty(Mono.error(new ResponseStatusException(HttpStatus.NOT_FOUND, "Máquina no encontrada")))
                .flatMap(machine -> cimRepository.findById(machine.getIdCim())
                        .flatMap(cim -> verifyProjectOwnership(externalId, cim.getIdProject())
                                .flatMap(projId -> {
                                    machine.setName(request.getName());
                                    machine.setDescription(request.getDescription());
                                    if (request.getMachine() != null && !request.getMachine().isBlank()) {
                                        log.debug("Actualizando estructura JSON para máquina {}", machineId);
                                        machine.setMachine(request.getMachine());
                                    }
                                    return cimMachineRepository.save(machine)
                                            .map(saved -> mapToResponse(saved, projId));
                                })))
                .map(response -> response); // Tipado reactivo
    }

    /**
     * Lista las máquinas asociadas a un proyecto.
     * @param externalId ID de Keycloak del usuario
     * @param projectId ID del proyecto padre
     * @return Flux de máquinas
     */
    @Transactional(readOnly = true)
    public Flux<CimMachineResponse> getMachinesByProject(String externalId, Long projectId) {
        log.info("Listando máquinas del proyecto {} para usuario {}", projectId, externalId);
        
        return verifyProjectOwnership(externalId, projectId)
                .flatMapMany(projId -> cimRepository.findByIdProject(projectId)
                        .flatMapMany(cim -> cimMachineRepository.findByIdCim(cim.getId())
                                .map(machine -> mapToResponse(machine, projectId))));
    }

    /**
     * Elimina una máquina si el usuario tiene permisos sobre el proyecto padre.
     * @param externalId ID de Keycloak del usuario
     * @param machineId ID de la máquina a eliminar
     * @return Mono vacío
     */
    @Transactional
    public Mono<Void> deleteMachine(String externalId, Long machineId) {
        log.info("Intento de borrado de máquina {} por usuario {}", machineId, externalId);

        return cimMachineRepository.findById(machineId)
                .switchIfEmpty(Mono.error(new ResponseStatusException(HttpStatus.NOT_FOUND, "Máquina no encontrada")))
                .flatMap(machine -> cimRepository.findById(machine.getIdCim())
                        .flatMap(cim -> verifyProjectOwnership(externalId, cim.getIdProject())
                                .flatMap(projId -> cimMachineRepository.delete(machine))));
    }

    /**
     * Verifica que el proyecto existe y pertenece al usuario autenticado.
     * @param externalId ID de Keycloak
     * @param projectId ID del proyecto
     * @return Mono con el ID del proyecto si la verificación es exitosa
     */
    private Mono<Long> verifyProjectOwnership(String externalId, Long projectId) {
        return userRepository.findByExternalId(externalId)
                .switchIfEmpty(Mono.error(new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuario no encontrado")))
                .flatMap(user -> projectRepository.findById(projectId)
                        .switchIfEmpty(Mono.error(new ResponseStatusException(HttpStatus.NOT_FOUND, "Proyecto no encontrado")))
                        .flatMap(project -> {
                            Long projectUserId = project.getUserId();
                            if (!Objects.equals(projectUserId, user.getId())) {
                                log.warn("Acceso denegado: Usuario {} intentó acceder al proyecto {} de {}", user.getId(), projectId, projectUserId);
                                return Mono.error(new ResponseStatusException(HttpStatus.FORBIDDEN, "No tienes permiso sobre este proyecto"));
                            }
                            return Mono.just(projectId);
                        })
                );
    }

    /**
     * Mapea la entidad a DTO de respuesta.
     */
    private CimMachineResponse mapToResponse(CimMachine machine, Long projectId) {
        return CimMachineResponse.builder()
                .id(machine.getId())
                .idProyect(projectId)
                .idCim(machine.getIdCim())
                .refMachine(machine.getRefMachine())
                .name(machine.getName())
                .description(machine.getDescription())
                .machine(machine.getMachine())
                .build();
    }
}
