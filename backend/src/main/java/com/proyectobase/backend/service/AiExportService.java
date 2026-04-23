package com.proyectobase.backend.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.proyectobase.backend.domain.CimMachine;
import com.proyectobase.backend.domain.PimMachine;
import com.proyectobase.backend.domain.Project;
import com.proyectobase.backend.repository.*;
import com.proyectobase.backend.service.aiexport.FreemarkerRenderService;
import com.proyectobase.backend.service.aiexport.GraphResolverService;
import com.proyectobase.backend.service.aiexport.dto.ResolvedGraphDto;
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
     * @return Mono con los bytes del ZIP
     */
    public Mono<byte[]> generateProjectAiZip(Long projectId) {
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
                    addReadmeToZip(zos, project, generatedAt);

                    // ── 1. INSTRUCTIONS.md (Opción A) ──────────────────────────────
                    addInstructionsToZip(zos, project, generatedAt);

                    // ── 2. Manuales DSL ────────────────────────────────────────────
                    addDslRulesToZip(zos);

                    // ── 3. JSONs brutos del proyecto ───────────────────────────────
                    addRawProjectJsonsToZip(zos, roots.getT1().getMachinesRelations(),
                        pimRelationsJson, cimMachines, pimMachines);

                    // ── 4. RESOLVED_GRAPH.json (Opción B) ──────────────────────────
                    addResolvedGraphToZip(zos, project, cimMachines, pimMachines,
                        pimRelationsJson, generatedAt);

                    // ── 5. MAPPING_EXAMPLES.md (Opción C) ──────────────────────────
                    addMappingExamplesToZip(zos);

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

    private void addReadmeToZip(ZipOutputStream zos, Project project, String generatedAt)
            throws IOException {
        Map<String, Object> model = Map.of(
                "projectName", project.getName(),
                "generatedAt", generatedAt
        );
        String content = freemarkerRenderService.render("readme.md.ftl", model);
        addEntry(zos, "README.md", content.getBytes());
    }

    // ──────────────────────────────────────────────────────────────────────────────
    // Sección 1: INSTRUCTIONS.md
    // ──────────────────────────────────────────────────────────────────────────────

    private void addInstructionsToZip(ZipOutputStream zos, Project project, String generatedAt)
            throws IOException {
        Map<String, Object> model = Map.of(
            "projectName", project.getName(),
            "projectDescription", project.getDescription() != null ? project.getDescription() : "",
            "generatedAt", generatedAt
        );
        String content = freemarkerRenderService.render("instructions.md.ftl", model);
        addEntry(zos, "INSTRUCTIONS.md", content.getBytes());
    }

    // ──────────────────────────────────────────────────────────────────────────────
    // Sección 2: Manuales DSL (classpath:REGLAS_DSLs/)
    // ──────────────────────────────────────────────────────────────────────────────

    private void addDslRulesToZip(ZipOutputStream zos) throws IOException {
        PathMatchingResourcePatternResolver resolver = new PathMatchingResourcePatternResolver();
        Resource[] resources = resolver.getResources("classpath:REGLAS_DSLs/*.md");
        for (Resource resource : resources) {
            addEntry(zos, "rules/" + resource.getFilename(),
                resource.getInputStream().readAllBytes());
        }
    }

    // ──────────────────────────────────────────────────────────────────────────────
    // Sección 3: JSONs brutos del proyecto
    // ──────────────────────────────────────────────────────────────────────────────

    private void addRawProjectJsonsToZip(ZipOutputStream zos,
            String cimRelationsJson, String pimRelationsJson,
            List<CimMachine> cimMachines, List<PimMachine> pimMachines) throws IOException {

        addEntry(zos, "project/cim-relations.json", cimRelationsJson);
        addEntry(zos, "project/pim-relations.json", pimRelationsJson);

        for (CimMachine m : cimMachines) {
            String machineName = extractMachineName(m.getMachine(), "cim-" + m.getId());
            addEntry(zos, "project/cim-machines/" + sanitize(machineName) + ".json", m.getMachine());
        }

        for (PimMachine m : pimMachines) {
            String machineName = extractMachineName(m.getMachine(), "pim-" + m.getId());
            addEntry(zos, "project/pim-machines/" + sanitize(machineName) + ".json", m.getMachine());
        }
    }

    // ──────────────────────────────────────────────────────────────────────────────
    // Sección 4: RESOLVED_GRAPH.json
    // ──────────────────────────────────────────────────────────────────────────────

    private void addResolvedGraphToZip(ZipOutputStream zos, Project project,
            List<CimMachine> cimMachines, List<PimMachine> pimMachines,
            String pimRelationsJson, String generatedAt) throws IOException {

        ResolvedGraphDto graph = graphResolverService.resolve(
            project, cimMachines, pimMachines, pimRelationsJson);

        // Renderizar con FreeMarker (template genera JSON estructurado legible)
        Map<String, Object> model = Map.of(
            "graph", graph,
            "generatedAt", generatedAt
        );
        String content = freemarkerRenderService.render("resolved-graph.json.ftl", model);
        addEntry(zos, "resolved/RESOLVED_GRAPH.json", content.getBytes());
    }

    // ──────────────────────────────────────────────────────────────────────────────
    // Sección 5: MAPPING_EXAMPLES.md
    // ──────────────────────────────────────────────────────────────────────────────

    private void addMappingExamplesToZip(ZipOutputStream zos) throws IOException {
        // La plantilla no necesita modelo dinámico (es contenido estático)
        String content = freemarkerRenderService.render("mapping-examples.md.ftl", Map.of());
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
