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
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
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
    private final ObjectMapper objectMapper;

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
                    String initialJson = "{}";
                    try {
                        ObjectNode root = objectMapper.createObjectNode();
                        root.put("$type", "Document");
                        root.put("id", java.util.UUID.randomUUID().toString());
                        root.put("name", request.getName());
                        root.put("description", request.getDescription());
                        root.putArray("elements");
                        initialJson = objectMapper.writeValueAsString(root);
                    } catch (Exception e) {
                        log.error("Error creando JSON inicial", e);
                    }

                    CimMachine machine = CimMachine.builder()
                            .idCim(cim.getId())
                            .machine(initialJson)
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
                                    try {
                                        String json = request.getMachine();
                                        if (json == null || json.isBlank()) {
                                            json = machine.getMachine();
                                        }
                                        ObjectNode root = (ObjectNode) objectMapper.readTree(json);
                                        root.put("name", request.getName());
                                        root.put("description", request.getDescription());
                                        
                                        String newId = root.has("id") ? root.get("id").asText() : null;
                                        if (newId != null && newId.length() == 36) {
                                            // Validar unicidad en el proyecto
                                            return cimMachineRepository.findByIdCim(machine.getIdCim())
                                                .filter(m -> !Objects.equals(m.getId(), machine.getId())) // No comparar con la misma máquina
                                                .flatMap(m -> {
                                                    try {
                                                        ObjectNode otherRoot = (ObjectNode) objectMapper.readTree(m.getMachine());
                                                        if (otherRoot.has("id") && Objects.equals(otherRoot.get("id").asText(), newId)) {
                                                            return Mono.error(new ResponseStatusException(HttpStatus.BAD_REQUEST, "ID de máquina duplicado en el proyecto"));
                                                        }
                                                    } catch (Exception e) {}
                                                    return Mono.empty();
                                                })
                                                .then(Mono.defer(() -> {
                                                    try {
                                                        // Asegurar que las colecciones obligatorias existen
                                                        if (!root.has("elements")) root.putArray("elements");
                                                        
                                                        machine.setMachine(objectMapper.writeValueAsString(root));
                                                        return cimMachineRepository.save(machine)
                                                                .map(saved -> mapToResponse(saved, projId));
                                                    } catch (Exception e) {
                                                        return Mono.error(new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Error al guardar máquina"));
                                                    }
                                                }));
                                        }

                                        // Asegurar que las colecciones obligatorias existen
                                        if (!root.has("elements")) root.putArray("elements");
                                        
                                        machine.setMachine(objectMapper.writeValueAsString(root));
                                    } catch (Exception e) {
                                        log.error("Error actualizando JSON de máquina {}", machineId, e);
                                        return Mono.error(new ResponseStatusException(HttpStatus.BAD_REQUEST, "Formato JSON inválido: " + e.getMessage()));
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
                .machine(machine.getMachine())
                .build();
    }
}
