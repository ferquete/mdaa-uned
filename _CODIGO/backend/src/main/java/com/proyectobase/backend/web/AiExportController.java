package com.proyectobase.backend.web;

import com.proyectobase.backend.service.AiExportService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.RequestParam;
import reactor.core.publisher.Mono;

/**
 * Controlador para la exportación de datos de proyecto optimizados para IA.
 */
@RestController
@RequestMapping("/api/v1/projects")
@RequiredArgsConstructor
public class AiExportController {

    private final AiExportService aiExportService;

    /**
     * Endpoint para descargar el ZIP con reglas DSL y datos del proyecto.
     * @param projectId ID del proyecto
     * @return Respuesta con el archivo ZIP
     */
    @GetMapping("/{projectId}/export-ai")
    public Mono<ResponseEntity<byte[]>> exportProjectForAi(
            @PathVariable Long projectId,
            @RequestParam(required = false) String targetLanguage) {
        return aiExportService.generateProjectAiZip(projectId, targetLanguage)
                .map(bytes -> ResponseEntity.ok()
                        .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=project-ai-export-" + projectId + ".zip")
                        .contentType(MediaType.APPLICATION_OCTET_STREAM)
                        .body(bytes));
    }
}
