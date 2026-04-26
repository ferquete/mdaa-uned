package com.proyectobase.backend.web;

import com.proyectobase.backend.service.CimService;
import com.proyectobase.backend.web.dto.CimResponse;
import com.proyectobase.backend.web.dto.UpdateCimRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

/**
 * Controlador REST para el CIM de un proyecto.
 */
@Slf4j
@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class CimController {

    private final CimService cimService;

    @GetMapping("/projects/{projectId}/cim")
    public Mono<CimResponse> getCimByProjectId(JwtAuthenticationToken token, @PathVariable Long projectId) {
        String externalId = token.getName();
        log.info("Obteniendo CIM del proyecto {} para usuario {}", projectId, externalId);
        return cimService.getCimByProjectId(externalId, projectId);
    }

    @PutMapping("/cim/{id}")
    public Mono<CimResponse> updateCim(JwtAuthenticationToken token, @PathVariable Long id, @Valid @RequestBody UpdateCimRequest request) {
        String externalId = token.getName();
        log.info("Actualizando CIM {} para usuario {}", id, externalId);
        return cimService.updateCim(externalId, id, request);
    }
}
