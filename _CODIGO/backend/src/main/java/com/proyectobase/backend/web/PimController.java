package com.proyectobase.backend.web;

import com.proyectobase.backend.service.PimService;
import com.proyectobase.backend.web.dto.PimResponse;
import com.proyectobase.backend.web.dto.UpdatePimRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

/**
 * Controlador REST para el PIM (Diseño Conceptual) de un proyecto.
 */
@Slf4j
@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class PimController {

    private final PimService pimService;

    @GetMapping("/projects/{projectId}/pim")
    public Mono<PimResponse> getPimByProjectId(JwtAuthenticationToken token, @PathVariable Long projectId) {
        String externalId = token.getName();
        log.info("Obteniendo PIM del proyecto {} para usuario {}", projectId, externalId);
        return pimService.getPimByProjectId(externalId, projectId);
    }

    @PutMapping("/pim/{id}")
    public Mono<PimResponse> updatePim(JwtAuthenticationToken token, @PathVariable Long id, @Valid @RequestBody UpdatePimRequest request) {
        String externalId = token.getName();
        log.info("Actualizando PIM {} para usuario {}", id, externalId);
        return pimService.updatePim(externalId, id, request);
    }
}
