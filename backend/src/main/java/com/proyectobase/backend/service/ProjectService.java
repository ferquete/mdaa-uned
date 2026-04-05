package com.proyectobase.backend.service;

import com.proyectobase.backend.domain.Project;
import com.proyectobase.backend.domain.ProjectGenre;
import com.proyectobase.backend.repository.ProjectRepository;
import com.proyectobase.backend.repository.UserRepository;
import com.proyectobase.backend.web.dto.CreateProjectRequest;
import com.proyectobase.backend.web.dto.ProjectResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

/**
 * Servicio para la gestión de proyectos de usuario (Reactivo).
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ProjectService {

    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;

    private static final int MAX_PROJECTS_PER_USER = 10;

    /**
     * Obtiene todos los proyectos asociados a un usuario por su externalId.
     * @param externalId ID de Keycloak
     * @return Flux de ProjectResponse
     */
    @Transactional(readOnly = true)
    public Flux<ProjectResponse> getProjectsByExternalId(String externalId) {
        log.info("Obteniendo proyectos para el usuario externo: {}", externalId);
        
        return userRepository.findByExternalId(externalId)
                .flatMapMany(user -> projectRepository.findByUserIdOrderByCreatedAtDesc(user.getId()))
                .map(this::mapToResponse);
    }

    /**
     * Crea un nuevo proyecto para el usuario especificado, con límite de 10.
     * @param externalId ID de Keycloak
     * @param request Datos del proyecto
     * @return El proyecto creado
     */
    @Transactional
    public Mono<ProjectResponse> createProject(String externalId, CreateProjectRequest request) {
        log.info("Intento de creación de proyecto '{}' para usuario: {}", request.getName(), externalId);

        return userRepository.findByExternalId(externalId)
                .switchIfEmpty(Mono.error(new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuario no encontrado")))
                .flatMap(user -> 
                    projectRepository.countByUserId(user.getId())
                        .flatMap(count -> {
                            if (count >= MAX_PROJECTS_PER_USER) {
                                log.warn("Límite de proyectos alcanzado para el usuario: {}", externalId);
                                return Mono.error(new ResponseStatusException(
                                    HttpStatus.BAD_REQUEST, 
                                    "Has alcanzado el límite máximo de " + MAX_PROJECTS_PER_USER + " proyectos."
                                ));
                            }
                            
                            Project project = Project.builder()
                                    .name(request.getName())
                                    .description(request.getDescription())
                                    .genre(ProjectGenre.valueOf(request.getGenre()))
                                    .userId(user.getId())
                                    .build();
                                    
                            log.debug("Intentando guardar proyecto: {}", project);
                            return projectRepository.save(project)
                                    .map(savedProject -> savedProject) // Ayuda al tipado reactivo si es necesario
                                    .doOnError(e -> log.error("ERROR CRÍTICO AL GUARDAR PROYECTO: {}", e.getMessage(), e));
                        })
                )
                .map(this::mapToResponse);
    }

    /**
     * Obtiene un proyecto específico si pertenece al usuario.
     * @param externalId ID de Keycloak del usuario
     * @param projectId ID del proyecto
     * @return Mono con el proyecto mapeado a respuesta
     */
    @Transactional(readOnly = true)
    public Mono<ProjectResponse> getProjectById(String externalId, Long projectId) {
        log.info("Obteniendo proyecto {} para usuario {}", projectId, externalId);

        return userRepository.findByExternalId(externalId)
                .switchIfEmpty(Mono.error(new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuario no encontrado")))
                .flatMap(user -> 
                    projectRepository.findById(projectId)
                        .switchIfEmpty(Mono.error(new ResponseStatusException(HttpStatus.NOT_FOUND, "Proyecto no encontrado")))
                        .flatMap(project -> {
                            if (!java.util.Objects.equals(project.getUserId(), user.getId())) {
                                return Mono.error(new ResponseStatusException(HttpStatus.FORBIDDEN, "No tienes permiso para ver este proyecto"));
                            }
                            return Mono.just(mapToResponse(project));
                        })
                );
    }

    /**
     * Actualiza los datos de un proyecto existente.
     * @param externalId ID de Keycloak del usuario
     * @param projectId ID del proyecto a editar
     * @param request Nuevos datos del proyecto
     * @return Mono con el proyecto actualizado
     */
    @Transactional
    public Mono<ProjectResponse> updateProject(String externalId, Long projectId, CreateProjectRequest request) {
        log.info("Actualizando proyecto {} para usuario {}", projectId, externalId);

        return userRepository.findByExternalId(externalId)
                .switchIfEmpty(Mono.error(new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuario no encontrado")))
                .flatMap(user -> 
                    projectRepository.findById(projectId)
                        .switchIfEmpty(Mono.error(new ResponseStatusException(HttpStatus.NOT_FOUND, "Proyecto no encontrado")))
                        .flatMap(project -> {
                            // Verificación de autoría
                            if (!java.util.Objects.equals(project.getUserId(), user.getId())) {
                                return Mono.error(new ResponseStatusException(HttpStatus.FORBIDDEN, "No tienes permiso para editar este proyecto"));
                            }
                            
                            // Actualización de campos
                            project.setName(request.getName());
                            project.setDescription(request.getDescription());
                            project.setGenre(ProjectGenre.valueOf(request.getGenre()));
                            
                            return projectRepository.save(project)
                                    .map(this::mapToResponse);
                        })
                );
    }

    /**
     * Elimina un proyecto si pertenece al usuario especificado.
     * @param externalId ID de Keycloak del usuario
     * @param projectId ID del proyecto a eliminar
     * @return Mono vacío (204)
     */
    @Transactional
    public Mono<Void> deleteProject(String externalId, Long projectId) {
        log.info("Intento de borrado de proyecto {} por usuario {}", projectId, externalId);

        return userRepository.findByExternalId(externalId)
                .switchIfEmpty(Mono.error(new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuario no encontrado")))
                .flatMap(user -> 
                    projectRepository.findById(projectId)
                        .switchIfEmpty(Mono.error(new ResponseStatusException(HttpStatus.NOT_FOUND, "Proyecto no encontrado")))
                        .flatMap(project -> {
                            // Verificación de autoría (Uso de Objects.equals para evitar avisos de nulidad)
                            if (!java.util.Objects.equals(project.getUserId(), user.getId())) {
                                log.warn("Intento de borrado no autorizado: Usuario {} intentó borrar proyecto {} de Usuario {}", 
                                    user.getId(), projectId, project.getUserId());
                                return Mono.error(new ResponseStatusException(HttpStatus.FORBIDDEN, "No tienes permiso para borrar este proyecto"));
                            }
                            
                            return projectRepository.delete(project)
                                .doOnSuccess(v -> log.info("Proyecto {} eliminado correctamente", projectId));
                        })
                );
    }

    /**
     * Mapea una entidad Project a un DTO ProjectResponse.
     * @param project Entidad de origen
     * @return DTO de respuesta
     */
    private ProjectResponse mapToResponse(Project project) {
        return ProjectResponse.builder()
                .id(project.getId())
                .name(project.getName())
                .description(project.getDescription())
                .genre(project.getGenre() != null ? project.getGenre().name() : null)
                .createdAt(project.getCreatedAt())
                .build();
    }
}
