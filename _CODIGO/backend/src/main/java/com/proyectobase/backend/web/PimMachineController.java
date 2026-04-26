package com.proyectobase.backend.web;

import com.proyectobase.backend.service.PimMachineService;
import com.proyectobase.backend.web.dto.PimMachineRequest;
import com.proyectobase.backend.web.dto.PimMachineResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

/**
 * Controlador REST para la gestión de máquinas PIM asociadas a proyectos (Diseño Conceptual).
 */
@Slf4j
@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class PimMachineController {

    private final PimMachineService pimMachineService;

    /**
     * Lista todas las máquinas PIM de un proyecto específico.
     * @param token Token JWT del usuario
     * @param projectId ID del proyecto
     * @return Flux de PimMachineResponse
     */
    @GetMapping("/projects/{projectId}/pim-machines")
    public Flux<PimMachineResponse> getMachinesByProject(JwtAuthenticationToken token, @PathVariable Long projectId) {
        String externalId = token.getName();
        return pimMachineService.getMachinesByProject(externalId, projectId);
    }

    /**
     * Crea una nueva máquina PIM en un proyecto.
     * @param token Token JWT del usuario
     * @param projectId ID del proyecto
     * @param request Datos de la máquina
     * @return Mono con la máquina creada
     */
    @PostMapping("/projects/{projectId}/pim-machines")
    @ResponseStatus(HttpStatus.CREATED)
    public Mono<PimMachineResponse> createMachine(
            JwtAuthenticationToken token,
            @PathVariable Long projectId,
            @Valid @RequestBody PimMachineRequest request) {
        String externalId = token.getName();
        return pimMachineService.createMachine(externalId, projectId, request);
    }

    /**
     * Actualiza una máquina PIM existente por su ID.
     * @param token Token JWT del usuario
     * @param machineId ID de la máquina a actualizar
     * @param request Datos de la máquina
     * @return Mono con la máquina actualizada
     */
    @PutMapping("/pim-machines/{machineId}")
    public Mono<PimMachineResponse> updateMachine(
            JwtAuthenticationToken token,
            @PathVariable Long machineId,
            @Valid @RequestBody PimMachineRequest request) {
        String externalId = token.getName();
        return pimMachineService.updateMachine(externalId, machineId, request);
    }

    /**
     * Elimina una máquina PIM por su ID.
     * @param token Token JWT del usuario
     * @param machineId ID de la máquina a eliminar
     * @return Mono vacío
     */
    @DeleteMapping("/pim-machines/{machineId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public Mono<Void> deleteMachine(JwtAuthenticationToken token, @PathVariable Long machineId) {
        String externalId = token.getName();
        return pimMachineService.deleteMachine(externalId, machineId);
    }
}
