package com.proyectobase.backend.service;

import com.proyectobase.backend.domain.PimMachine;
import com.proyectobase.backend.repository.PimMachineRepository;
import com.proyectobase.backend.repository.PimRepository;
import com.proyectobase.backend.repository.ProjectRepository;
import com.proyectobase.backend.repository.UserRepository;
import com.proyectobase.backend.web.dto.PimMachineRequest;
import com.proyectobase.backend.web.dto.PimMachineResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.springframework.web.server.ResponseStatusException;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.Objects;

/**
 * Servicio para la gestión de máquinas PIM (Reactivo).
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class PimMachineService {

    private final PimMachineRepository pimMachineRepository;
    private final PimRepository pimRepository;
    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;
    private final ObjectMapper objectMapper;

    /**
     * Crea una nueva máquina PIM vinculada a un proyecto.
     * @param externalId ID de Keycloak del usuario
     * @param projectId ID del proyecto padre
     * @param request Datos de la máquina
     * @return Mono con la máquina creada
     */
    @Transactional
    public Mono<PimMachineResponse> createMachine(String externalId, Long projectId, PimMachineRequest request) {
        log.info("Creando máquina PIM '{}' para proyecto {} y usuario {}", request.getName(), projectId, externalId);

        return verifyProjectOwnership(externalId, projectId)
                .flatMap(projId -> pimRepository.findByIdProject(projectId))
                .switchIfEmpty(Mono.error(new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Configuración PIM no encontrada para el proyecto")))
                .flatMap(pim -> {
                    String initialJson = "{}";
                    try {
                        ObjectNode root = objectMapper.createObjectNode();
                        root.put("id", java.util.UUID.randomUUID().toString());
                        root.put("description", request.getDescription());
                        root.putArray("nodes");
                        root.putArray("edges");
                        initialJson = objectMapper.writeValueAsString(root);
                    } catch (Exception e) {
                        log.error("Error creando JSON inicial PIM", e);
                    }

                    PimMachine machine = PimMachine.builder()
                            .idPim(pim.getId())
                            .machine(initialJson)
                            .build();
                    return pimMachineRepository.save(machine)
                            .map(savedMachine -> mapToResponse(savedMachine, projectId));
                });
    }

    /**
     * Actualiza una máquina PIM existente.
     * @param externalId ID de Keycloak del usuario
     * @param machineId ID de la máquina a actualizar
     * @param request Nuevos datos de la máquina
     * @return Mono con la máquina actualizada
     */
    @Transactional
    public Mono<PimMachineResponse> updateMachine(String externalId, Long machineId, PimMachineRequest request) {
        log.info("Actualizando máquina PIM {}. Nuevo nombre (info): '{}'.", machineId, request.getName());

        return pimMachineRepository.findById(machineId)
                .switchIfEmpty(Mono.error(new ResponseStatusException(HttpStatus.NOT_FOUND, "Máquina PIM no encontrada")))
                .flatMap(machine -> pimRepository.findById(machine.getIdPim())
                        .flatMap(pim -> verifyProjectOwnership(externalId, pim.getIdProject())
                                .flatMap(projId -> {
                                    try {
                                        String json = request.getMachine();
                                        if (json == null || json.isBlank()) {
                                            json = machine.getMachine();
                                        }
                                        ObjectNode root = (ObjectNode) objectMapper.readTree(json);
                                        // En PIM, el nombre puede estar dentro de los nodos si fuera un Document, 
                                        // pero aquí seguimos el patrón de guardar descripción y asegurar estructura.
                                        root.put("description", request.getDescription());
                                        
                                        // Asegurar que las colecciones obligatorias existen según la gramática PIM
                                        if (!root.has("nodes")) root.putArray("nodes");
                                        if (!root.has("edges")) root.putArray("edges");
                                        
                                        machine.setMachine(objectMapper.writeValueAsString(root));
                                    } catch (Exception e) {
                                        log.error("Error actualizando JSON de máquina PIM {}", machineId, e);
                                        return Mono.error(new ResponseStatusException(HttpStatus.BAD_REQUEST, "Formato JSON inválido: " + e.getMessage()));
                                    }
                                    return pimMachineRepository.save(machine)
                                            .map(saved -> mapToResponse(saved, projId));
                                })));
    }

    /**
     * Lista las máquinas PIM asociadas a un proyecto.
     * @param externalId ID de Keycloak del usuario
     * @param projectId ID del proyecto padre
     * @return Flux de máquinas
     */
    @Transactional(readOnly = true)
    public Flux<PimMachineResponse> getMachinesByProject(String externalId, Long projectId) {
        log.info("Listando máquinas PIM del proyecto {} para usuario {}", projectId, externalId);
        
        return verifyProjectOwnership(externalId, projectId)
                .flatMapMany(projId -> pimRepository.findByIdProject(projectId)
                        .flatMapMany(pim -> pimMachineRepository.findByIdPim(pim.getId())
                                .map(machine -> mapToResponse(machine, projectId))));
    }

    /**
     * Elimina una máquina PIM.
     * @param externalId ID de Keycloak del usuario
     * @param machineId ID de la máquina a eliminar
     * @return Mono vacío
     */
    @Transactional
    public Mono<Void> deleteMachine(String externalId, Long machineId) {
        log.info("Intento de borrado de máquina PIM {} por usuario {}", machineId, externalId);

        return pimMachineRepository.findById(machineId)
                .switchIfEmpty(Mono.error(new ResponseStatusException(HttpStatus.NOT_FOUND, "Máquina PIM no encontrada")))
                .flatMap(machine -> pimRepository.findById(machine.getIdPim())
                        .flatMap(pim -> verifyProjectOwnership(externalId, pim.getIdProject())
                                .flatMap(projId -> pimMachineRepository.delete(machine))));
    }

    /**
     * Verifica que el proyecto existe y pertenece al usuario autenticado.
     */
    private Mono<Long> verifyProjectOwnership(String externalId, Long projectId) {
        return userRepository.findByExternalId(externalId)
                .switchIfEmpty(Mono.error(new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuario no encontrado")))
                .flatMap(user -> projectRepository.findById(projectId)
                        .switchIfEmpty(Mono.error(new ResponseStatusException(HttpStatus.NOT_FOUND, "Proyecto no encontrado")))
                        .flatMap(project -> {
                            if (!Objects.equals(project.getUserId(), user.getId())) {
                                log.warn("Acceso denegado PIM: Usuario {} intentó acceder al proyecto {}", user.getId(), projectId);
                                return Mono.error(new ResponseStatusException(HttpStatus.FORBIDDEN, "No tienes permiso sobre este proyecto"));
                            }
                            return Mono.just(projectId);
                        })
                );
    }

    /**
     * Mapea la entidad a DTO de respuesta.
     */
    private PimMachineResponse mapToResponse(PimMachine machine, Long projectId) {
        return PimMachineResponse.builder()
                .id(machine.getId())
                .idProject(projectId)
                .idPim(machine.getIdPim())
                .machine(machine.getMachine())
                .build();
    }
}
