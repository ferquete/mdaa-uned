package com.proyectobase.backend.web;

import com.proyectobase.backend.service.CimMachineService;
import com.proyectobase.backend.web.dto.CimMachineRequest;
import com.proyectobase.backend.web.dto.CimMachineResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

/**
 * Controlador REST para la gestión de máquinas CIM asociadas a proyectos.
 */
@Slf4j
@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class CimMachineController {

    private final CimMachineService cimMachineService;

    /**
     * Lista todas las máquinas de un proyecto específico.
     * @param token Token JWT del usuario
     * @param projectId ID del proyecto
     * @return Flux de CimMachineResponse
     */
    @GetMapping("/projects/{projectId}/machines")
    public Flux<CimMachineResponse> getMachinesByProject(JwtAuthenticationToken token, @PathVariable Long projectId) {
        String externalId = token.getName();
        return cimMachineService.getMachinesByProject(externalId, projectId);
    }

    /**
     * Crea una nueva máquina en un proyecto.
     * @param token Token JWT del usuario
     * @param projectId ID del proyecto
     * @param request Datos de la máquina (nombre)
     * @return Mono con la máquina creada
     */
    @PostMapping("/projects/{projectId}/machines")
    @ResponseStatus(HttpStatus.CREATED)
    public Mono<CimMachineResponse> createMachine(
            JwtAuthenticationToken token,
            @PathVariable Long projectId,
            @Valid @RequestBody CimMachineRequest request) {
        String externalId = token.getName();
        return cimMachineService.createMachine(externalId, projectId, request);
    }

    /**
     * Actualiza una máquina existente por su ID.
     * @param token Token JWT del usuario
     * @param machineId ID de la máquina a actualizar
     * @param request Datos de la máquina (nombre, descripción)
     * @return Mono con la máquina actualizada
     */
    @PutMapping("/machines/{machineId}")
    public Mono<CimMachineResponse> updateMachine(
            JwtAuthenticationToken token,
            @PathVariable Long machineId,
            @Valid @RequestBody CimMachineRequest request) {
        String externalId = token.getName();
        return cimMachineService.updateMachine(externalId, machineId, request);
    }

    /**
     * Elimina una máquina por su ID.
     * @param token Token JWT del usuario
     * @param machineId ID de la máquina a eliminar
     * @return Mono vacío
     */
    @DeleteMapping("/machines/{machineId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public Mono<Void> deleteMachine(JwtAuthenticationToken token, @PathVariable Long machineId) {
        String externalId = token.getName();
        return cimMachineService.deleteMachine(externalId, machineId);
    }
}
