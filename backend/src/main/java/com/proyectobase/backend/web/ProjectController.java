package com.proyectobase.backend.web;

import com.proyectobase.backend.domain.ProjectGenre;
import com.proyectobase.backend.service.ProjectService;
import com.proyectobase.backend.web.dto.CreateProjectRequest;
import com.proyectobase.backend.web.dto.ProjectResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Controlador REST para proyectos (Reactivo).
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/projects")
@RequiredArgsConstructor
public class ProjectController {

    private final ProjectService projectService;

    /**
     * Obtiene la lista de géneros musicales disponibles con su descripción.
     * @return Lista de mapas conteniendo el nombre técnico y la descripción amigable.
     */
    @GetMapping("/genres")
    public List<Map<String, String>> getGenres() {
        return Arrays.stream(ProjectGenre.values())
                .map(genre -> Map.of(
                        "name", genre.name(),
                        "description", genre.getDescription()
                ))
                .collect(Collectors.toList());
    }

    /**
     * Lista todos los proyectos del usuario autenticado.
     * @param token Información del token JWT
     * @return Flux de ProjectResponse
     */
    @GetMapping
    public Flux<ProjectResponse> getMyProjects(JwtAuthenticationToken token) {
        String externalId = token.getName(); // El SUB de Keycloak
        log.info("Cargando proyectos para el usuario autenticado: {}", externalId);
        return projectService.getProjectsByExternalId(externalId);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Mono<ProjectResponse> createProject(JwtAuthenticationToken token, @Valid @RequestBody CreateProjectRequest request) {
        String externalId = token.getName();
        log.info("Petición de creación recibida para usuario externo: {}", externalId);
        return projectService.createProject(externalId, request);
    }

    /**
     * Obtiene los detalles de un proyecto específico por su ID.
     * @param token Información del token JWT
     * @param id ID del proyecto
     * @return Mono con los detalles del proyecto
     */
    @GetMapping("/{id}")
    public Mono<ProjectResponse> getProjectById(JwtAuthenticationToken token, @PathVariable Long id) {
        String externalId = token.getName();
        log.info("Obteniendo detalles del proyecto {} para usuario {}", id, externalId);
        return projectService.getProjectById(externalId, id);
    }

    /**
     * Actualiza un proyecto existente.
     * @param token Información del token JWT
     * @param id ID del proyecto a actualizar
     * @param request Nuevos datos del proyecto
     * @return Mono con el proyecto actualizado
     */
    @PutMapping("/{id}")
    public Mono<ProjectResponse> updateProject(JwtAuthenticationToken token, @PathVariable Long id, @Valid @RequestBody CreateProjectRequest request) {
        String externalId = token.getName();
        log.info("Actualizando proyecto {} para usuario {}", id, externalId);
        return projectService.updateProject(externalId, id, request);
    }

    /**
     * Elimina un proyecto específico por su ID.
     * @param token Información del token JWT
     * @param id ID del proyecto a eliminar
     * @return Mono vacío (204 No Content)
     */
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public Mono<Void> deleteProject(JwtAuthenticationToken token, @PathVariable Long id) {
        String externalId = token.getName();
        log.info("Eliminando proyecto con id {} para usuario {}", id, externalId);
        return projectService.deleteProject(externalId, id);
    }
}
