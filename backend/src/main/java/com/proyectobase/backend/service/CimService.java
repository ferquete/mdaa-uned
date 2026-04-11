package com.proyectobase.backend.service;

import com.proyectobase.backend.domain.Cim;
import com.proyectobase.backend.repository.CimRepository;
import com.proyectobase.backend.repository.ProjectRepository;
import com.proyectobase.backend.repository.UserRepository;
import com.proyectobase.backend.web.dto.CimResponse;
import com.proyectobase.backend.web.dto.UpdateCimRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import reactor.core.publisher.Mono;

/**
 * Servicio para la gestión de la entidad CIM (Reactivo).
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class CimService {

    private final CimRepository cimRepository;
    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;

    /**
     * Obtiene el CIM de un proyecto, verificando que pertenezca al usuario.
     */
    @Transactional(readOnly = true)
    public Mono<CimResponse> getCimByProjectId(String externalId, Long projectId) {
        return userRepository.findByExternalId(externalId)
                .switchIfEmpty(Mono.error(new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuario no encontrado")))
                .flatMap(user -> projectRepository.findById(projectId)
                        .switchIfEmpty(Mono.error(new ResponseStatusException(HttpStatus.NOT_FOUND, "Proyecto no encontrado")))
                        .flatMap(project -> {
                            if (!java.util.Objects.equals(project.getUserId(), user.getId())) {
                                return Mono.error(new ResponseStatusException(HttpStatus.FORBIDDEN, "No autorizado"));
                            }
                            return cimRepository.findByIdProject(projectId)
                                    .map(this::mapToResponse);
                        }));
    }

    /**
     * Actualiza la descripción de un CIM previo chequeo de autoría del proyecto vinculado.
     */
    @Transactional
    public Mono<CimResponse> updateCim(String externalId, Long cimId, UpdateCimRequest request) {
        return userRepository.findByExternalId(externalId)
                .switchIfEmpty(Mono.error(new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuario no encontrado")))
                .flatMap(user -> cimRepository.findById(cimId)
                        .switchIfEmpty(Mono.error(new ResponseStatusException(HttpStatus.NOT_FOUND, "CIM no encontrado")))
                        .flatMap(cim -> projectRepository.findById(cim.getIdProject())
                                .flatMap(project -> {
                                    if (!java.util.Objects.equals(project.getUserId(), user.getId())) {
                                        return Mono.error(new ResponseStatusException(HttpStatus.FORBIDDEN, "No autorizado"));
                                    }
                                    cim.setDescription(request.getDescription());
                                    return cimRepository.save(cim)
                                            .map(this::mapToResponse);
                                })));
    }

    private CimResponse mapToResponse(Cim cim) {
        return CimResponse.builder()
                .id(cim.getId())
                .description(cim.getDescription())
                .idProject(cim.getIdProject())
                .build();
    }
}
