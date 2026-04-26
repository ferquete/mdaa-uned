package com.proyectobase.backend.service;

import com.proyectobase.backend.domain.Pim;
import com.proyectobase.backend.repository.PimRepository;
import com.proyectobase.backend.repository.ProjectRepository;
import com.proyectobase.backend.repository.UserRepository;
import com.proyectobase.backend.web.dto.PimResponse;
import com.proyectobase.backend.web.dto.UpdatePimRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import reactor.core.publisher.Mono;

/**
 * Servicio para la gestión de la entidad PIM (Reactivo).
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class PimService {

    private final PimRepository pimRepository;
    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;

    /**
     * Obtiene el PIM de un proyecto, verificando que pertenezca al usuario.
     */
    @Transactional(readOnly = true)
    public Mono<PimResponse> getPimByProjectId(String externalId, Long projectId) {
        return userRepository.findByExternalId(externalId)
                .switchIfEmpty(Mono.error(new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuario no encontrado")))
                .flatMap(user -> projectRepository.findById(projectId)
                        .switchIfEmpty(Mono.error(new ResponseStatusException(HttpStatus.NOT_FOUND, "Proyecto no encontrado")))
                        .flatMap(project -> {
                            if (!java.util.Objects.equals(project.getUserId(), user.getId())) {
                                return Mono.error(new ResponseStatusException(HttpStatus.FORBIDDEN, "No autorizado"));
                            }
                            return pimRepository.findByIdProject(projectId)
                                    .map(this::mapToResponse);
                        }));
    }

    /**
     * Actualiza la descripción de un PIM previo chequeo de autoría del proyecto vinculado.
     */
    @Transactional
    public Mono<PimResponse> updatePim(String externalId, Long pimId, UpdatePimRequest request) {
        return userRepository.findByExternalId(externalId)
                .switchIfEmpty(Mono.error(new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuario no encontrado")))
                .flatMap(user -> pimRepository.findById(pimId)
                        .switchIfEmpty(Mono.error(new ResponseStatusException(HttpStatus.NOT_FOUND, "PIM no encontrado")))
                        .flatMap(pim -> projectRepository.findById(pim.getIdProject())
                                .flatMap(project -> {
                                    if (!java.util.Objects.equals(project.getUserId(), user.getId())) {
                                        return Mono.error(new ResponseStatusException(HttpStatus.FORBIDDEN, "No autorizado"));
                                    }
                                    pim.setMachinesRelations(request.getMachinesRelations());
                                    return pimRepository.save(pim)
                                            .map(this::mapToResponse);
                                })));
    }

    private PimResponse mapToResponse(Pim pim) {
        return PimResponse.builder()
                .id(pim.getId())
                .machinesRelations(pim.getMachinesRelations())
                .idProject(pim.getIdProject())
                .build();
    }
}
