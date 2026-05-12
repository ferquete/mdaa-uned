package com.proyectobase.backend.web;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Mono;

import java.util.Map;

/**
 * Controlador para gestionar las comprobaciones de salud de la aplicación.
 */
@RestController
public class HealthController {

    /**
     * Endpoint básico para comprobar si la aplicación está activa.
     * @return Un mapa con el estado de la aplicación.
     */
    @GetMapping("/health")
    public Mono<Map<String, String>> health() {
        return Mono.just(Map.of("status", "UP"));
    }
}
