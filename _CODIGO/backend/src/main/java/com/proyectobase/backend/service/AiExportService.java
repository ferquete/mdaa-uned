package com.proyectobase.backend.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.proyectobase.backend.domain.CimMachine;
import com.proyectobase.backend.domain.PimMachine;
import com.proyectobase.backend.domain.Project;
import com.proyectobase.backend.repository.*;
import com.proyectobase.backend.service.aiexport.FreemarkerRenderService;
import com.proyectobase.backend.service.aiexport.GraphResolverService;
import com.proyectobase.backend.service.aiexport.dto.ResolvedGraphDto;
import jakarta.annotation.Nullable;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.Resource;
import org.springframework.core.io.support.PathMatchingResourcePatternResolver;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;

/**
 * Servicio para exportar la documentación DSL y los datos del proyecto en un archivo ZIP para IA.
 * El ZIP incluye: manuales DSL, JSONs brutos del proyecto, grafo resuelto y mapeos de código.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AiExportService {

    private final ProjectRepository projectRepository;
    private final CimRepository cimRepository;
    private final PimRepository pimRepository;
    private final CimMachineRepository cimMachineRepository;
    private final PimMachineRepository pimMachineRepository;
    private final GraphResolverService graphResolverService;
    private final FreemarkerRenderService freemarkerRenderService;
    private final ObjectMapper objectMapper;

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    /**
     * Genera el ZIP completo con toda la información necesaria para que un LLM
     * genere código de síntesis de audio a partir del modelo MDA del proyecto.
     *
     * @param projectId ID del proyecto
     * @param targetLanguage Lenguaje objetivo (opcional)
     * @return Mono con los bytes del ZIP
     */
    public Mono<byte[]> generateProjectAiZip(Long projectId, @Nullable String targetLanguage) {
        return projectRepository.findById(projectId)
            .flatMap(project -> Mono.zip(
                cimRepository.findByIdProject(projectId),
                pimRepository.findByIdProject(projectId)
            ).flatMap(roots -> Mono.zip(
                cimMachineRepository.findByIdCim(roots.getT1().getId()).collectList(),
                pimMachineRepository.findByIdPim(roots.getT2().getId()).collectList()
            ).flatMap(machines -> {
                List<CimMachine> cimMachines = machines.getT1();
                List<PimMachine> pimMachines = machines.getT2();
                String pimRelationsJson = roots.getT2().getMachinesRelations();

                try (ByteArrayOutputStream baos = new ByteArrayOutputStream();
                     ZipOutputStream zos = new ZipOutputStream(baos)) {

                    String generatedAt = LocalDateTime.now().format(DATE_FMT);

                    // ── 0. README.md (User Prompt) ────────────────────────────────
                    addReadmeToZip(zos, project, generatedAt, targetLanguage);

                    // ── 1. INSTRUCTIONS.md (Opción A) ──────────────────────────────
                    addInstructionsToZip(zos, project, generatedAt, targetLanguage);

                    // ── 2. Manuales DSL (Consolidados) ──────────────────────────────
                    addConsolidatedDslRulesToZip(zos);

                    // ── 3. Super-JSON del Proyecto (Consolidado) ───────────────────
                    addConsolidatedProjectDumpToZip(zos, roots.getT1().getMachinesRelations(),
                        pimRelationsJson, cimMachines, pimMachines);

                    // ── 4. RESOLVED_GRAPH.json (Opción B) ──────────────────────────
                    addResolvedGraphToZip(zos, project, cimMachines, pimMachines,
                        pimRelationsJson, generatedAt, targetLanguage);

                    // ── 5. MAPPING_EXAMPLES.md (Opción C) ──────────────────────────
                    addMappingExamplesToZip(zos, targetLanguage);

                    zos.finish();
                    return Mono.just(baos.toByteArray());
                } catch (IOException e) {
                    log.error("Error generando ZIP para IA del proyecto {}", projectId, e);
                    return Mono.error(e);
                }
            })));
    }

    // ──────────────────────────────────────────────────────────────────────────────
    // Sección 0: README.md
    // ──────────────────────────────────────────────────────────────────────────────

    private void addReadmeToZip(ZipOutputStream zos, Project project, String generatedAt,
                                String targetLanguage)
            throws IOException {
        Map<String, Object> model = Map.of(
                "projectName", project.getName(),
                "generatedAt", generatedAt,
                "targetLanguage", targetLanguage != null ? targetLanguage : ""
        );
        String content = freemarkerRenderService.render("readme.md.ftl", model);
        addEntry(zos, "README.md", content.getBytes());
    }

    // ──────────────────────────────────────────────────────────────────────────────
    // Sección 1: INSTRUCTIONS.md
    // ──────────────────────────────────────────────────────────────────────────────

    private void addInstructionsToZip(ZipOutputStream zos, Project project, String generatedAt,
                                      String targetLanguage)
            throws IOException {
        Map<String, Object> model = Map.of(
            "projectName", project.getName(),
            "projectDescription", project.getDescription() != null ? project.getDescription() : "",
            "generatedAt", generatedAt,
            "targetLanguage", targetLanguage != null ? targetLanguage : ""
        );
        String content = freemarkerRenderService.render("instructions.md.ftl", model);
        addEntry(zos, "INSTRUCTIONS.md", content.getBytes());
    }

    // ──────────────────────────────────────────────────────────────────────────────
    // Sección 2: Manuales DSL (classpath:REGLAS_DSLs/)
    // ──────────────────────────────────────────────────────────────────────────────

    private void addConsolidatedDslRulesToZip(ZipOutputStream zos) throws IOException {
        PathMatchingResourcePatternResolver resolver = new PathMatchingResourcePatternResolver();
        Resource[] resources = resolver.getResources("classpath:REGLAS_DSLs/*.md");
        StringBuilder sb = new StringBuilder();
        sb.append("# Consolidated DSL Reference Manuals\n\n");
        sb.append("This file contains all the technical rules and grammar definitions for the MDA-Audio system.\n\n");

        for (Resource resource : resources) {
            sb.append("## File: ").append(resource.getFilename()).append("\n\n");
            sb.append(new String(resource.getInputStream().readAllBytes())).append("\n\n");
            sb.append("---\n\n");
        }
        addEntry(zos, "rules_consolidated.md", sb.toString());
    }

    // ──────────────────────────────────────────────────────────────────────────────
    // Sección 3: Super-JSON consolidado del proyecto
    // ──────────────────────────────────────────────────────────────────────────────

    private void addConsolidatedProjectDumpToZip(ZipOutputStream zos,
            String cimRelationsJson, String pimRelationsJson,
            List<CimMachine> cimMachines, List<PimMachine> pimMachines) throws IOException {

        Map<String, Object> dump = new java.util.LinkedHashMap<>();
        dump.put("cimRelations", parseJson(cimRelationsJson));
        dump.put("pimRelations", parseJson(pimRelationsJson));

        List<Object> cimList = new java.util.ArrayList<>();
        for (CimMachine m : cimMachines) {
            cimList.add(parseJson(m.getMachine()));
        }
        dump.put("cimMachines", cimList);

        List<Object> pimList = new java.util.ArrayList<>();
        for (PimMachine m : pimMachines) {
            pimList.add(parseJson(m.getMachine()));
        }
        dump.put("pimMachines", pimList);

        String fullJson = objectMapper.writerWithDefaultPrettyPrinter().writeValueAsString(dump);
        addEntry(zos, "project_dump.json", fullJson);
    }

    private Object parseJson(String json) {
        if (json == null || json.isBlank()) return Map.of();
        try {
            return objectMapper.readTree(json);
        } catch (Exception e) {
            return Map.of("error", "Invalid JSON", "raw", json);
        }
    }

    // ──────────────────────────────────────────────────────────────────────────────
    // Sección 4: RESOLVED_GRAPH.json
    // ──────────────────────────────────────────────────────────────────────────────

    private void addResolvedGraphToZip(ZipOutputStream zos, Project project,
            List<CimMachine> cimMachines, List<PimMachine> pimMachines,
            String pimRelationsJson, String generatedAt, String targetLanguage) throws IOException {

        ResolvedGraphDto graph = graphResolverService.resolve(
            project, cimMachines, pimMachines, pimRelationsJson);

        // Renderizar con FreeMarker (template genera JSON estructurado legible)
        Map<String, Object> model = Map.of(
            "graph", graph,
            "generatedAt", generatedAt,
            "targetLanguage", targetLanguage != null ? targetLanguage : ""
        );
        String content = freemarkerRenderService.render("resolved-graph.json.ftl", model);
        addEntry(zos, "resolved/RESOLVED_GRAPH.json", content.getBytes());
    }

    // ──────────────────────────────────────────────────────────────────────────────
    // Sección 5: MAPPING_EXAMPLES.md
    // ──────────────────────────────────────────────────────────────────────────────

    private void addMappingExamplesToZip(ZipOutputStream zos, String targetLanguage) throws IOException {
        Map<String, Object> model = Map.of(
                "targetLanguage", targetLanguage != null ? targetLanguage : ""
        );
        String content = freemarkerRenderService.render("mapping-examples.md.ftl", model);
        addEntry(zos, "resolved/MAPPING_EXAMPLES.md", content.getBytes());
    }

    // ──────────────────────────────────────────────────────────────────────────────
    // Utilidades
    // ──────────────────────────────────────────────────────────────────────────────

    private void addEntry(ZipOutputStream zos, String path, String content) throws IOException {
        if (content == null || content.isEmpty()) return;
        addEntry(zos, path, content.getBytes());
    }

    private void addEntry(ZipOutputStream zos, String path, byte[] bytes) throws IOException {
        if (bytes == null || bytes.length == 0) return;
        ZipEntry entry = new ZipEntry(path);
        zos.putNextEntry(entry);
        zos.write(bytes);
        zos.closeEntry();
    }

    /** Extrae el campo "name" del JSON de la máquina para nombrar el archivo. */
    private String extractMachineName(String machineJson, String fallback) {
        try {
            return objectMapper.readTree(machineJson).path("name").asText(fallback);
        } catch (Exception e) {
            return fallback;
        }
    }

    private String sanitize(String name) {
        return name.replaceAll("[^a-zA-Z0-9._-]", "_");
    }
}
