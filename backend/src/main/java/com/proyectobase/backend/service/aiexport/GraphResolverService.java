package com.proyectobase.backend.service.aiexport;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.proyectobase.backend.domain.CimMachine;
import com.proyectobase.backend.domain.PimMachine;
import com.proyectobase.backend.domain.Project;
import com.proyectobase.backend.service.aiexport.dto.ResolvedGraphDto;
import com.proyectobase.backend.service.aiexport.dto.ResolvedGraphDto.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;
import java.util.stream.StreamSupport;

/**
 * Servicio que transforma los JSON brutos del proyecto en un grafo resuelto,
 * reemplazando UUIDs por nombres simbólicos para facilitar la comprensión de los LLMs.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class GraphResolverService {

    // Campos DSL que son puertos de conexión (ConnectionPoint), no parámetros de valor
    private static final Set<String> CONNECTION_POINT_KEYS = Set.of(
        "output_1", "output_2", "output",
        "input_1", "input_2", "input_3", "input_4", "input_5",
        "input_6", "input_7", "input_8", "input_9", "input_10"
    );

    // Campos que no son parámetros de audio configurables
    private static final Set<String> NON_PARAM_KEYS = Set.of(
        "type", "id", "name", "description", "ids_references",
        "others", "stereo", "edges", "nodes"
    );

    private final ObjectMapper objectMapper;

    /**
     * Construye el grafo resuelto a partir de los datos del proyecto.
     *
     * @param project      entidad del proyecto
     * @param cimMachines  lista de máquinas CIM (JSON bruto)
     * @param pimMachines  lista de máquinas PIM (JSON bruto)
     * @param pimRelationsJson JSON bruto de relaciones PIM
     * @return DTO con el grafo completamente resuelto
     */
    public ResolvedGraphDto resolve(
            Project project,
            List<CimMachine> cimMachines,
            List<PimMachine> pimMachines,
            String pimRelationsJson) {

        // Índices globales: id → nombre simbólico, para cross-reference
        Map<String, String> globalIdToName = new HashMap<>();
        // Índice: id de puerto/param → {machineName, nodeName, portKey}
        Map<String, PortRef> portIndex = new HashMap<>();

        // ── 1. Resolver máquinas CIM ──
        List<ResolvedCimMachineDto> resolvedCim = resolveCimMachines(cimMachines, globalIdToName);

        // ── 2. Resolver máquinas PIM ──
        List<ResolvedPimMachineDto> resolvedPim = resolvePimMachines(
            pimMachines, globalIdToName, portIndex);

        // ── 3. Resolver relaciones PIM ──
        List<ResolvedPimRelationDto> resolvedRelations = resolvePimRelations(
            pimRelationsJson, portIndex);

        return ResolvedGraphDto.builder()
            .projectName(project.getName())
            .projectDescription(project.getDescription())
            .cimMachines(resolvedCim)
            .pimMachines(resolvedPim)
            .pimRelations(resolvedRelations)
            .build();
    }

    // ──────────────────────────────────────────────────────────────────────────────
    // CIM
    // ──────────────────────────────────────────────────────────────────────────────

    private List<ResolvedCimMachineDto> resolveCimMachines(
            List<CimMachine> cimMachines, Map<String, String> globalIdToName) {

        List<ResolvedCimMachineDto> result = new ArrayList<>();
        for (CimMachine cm : cimMachines) {
            try {
                JsonNode root = objectMapper.readTree(cm.getMachine());
                String machineId = root.path("id").asText("");
                String machineName = root.path("name").asText("CIM-" + cm.getId());
                globalIdToName.put(machineId, machineName);

                List<ResolvedCimElementDto> elements = new ArrayList<>();
                for (JsonNode el : root.path("elements")) {
                    String elId = el.path("id").asText("");
                    String elName = el.path("name").asText(elId);
                    globalIdToName.put(elId, elName);

                    // Registrar sendTo ids también
                    for (JsonNode st : el.path("sendTo")) {
                        globalIdToName.put(st.path("id").asText(""), "sendTo→" + elName);
                    }

                    List<String> sendsTo = new ArrayList<>();
                    for (JsonNode st : el.path("sendTo")) {
                        String ref = st.path("idRef").asText("");
                        sendsTo.add(ref); // se resolverá post-índice; por ahora UUID
                    }

                    elements.add(ResolvedCimElementDto.builder()
                        .id(elId)
                        .name(elName)
                        .description(el.path("description").asText(""))
                        .params(el.path("params").asText(""))
                        .hasExternalInput(el.path("externalInput").path("hasExternalInput").asBoolean(false))
                        .hasExternalOutput(el.path("externalOutput").path("hasExternalOutput").asBoolean(false))
                        .sendsToNames(sendsTo)
                        .build());
                }

                result.add(ResolvedCimMachineDto.builder()
                    .id(machineId)
                    .name(machineName)
                    .description(root.path("description").asText(""))
                    .elements(elements)
                    .build());
            } catch (Exception e) {
                log.warn("No se pudo parsear la máquina CIM id={}: {}", cm.getId(), e.getMessage());
            }
        }

        // Segunda pasada: resolver sendsTo UUIDs a nombres
        for (ResolvedCimMachineDto machine : result) {
            for (ResolvedCimElementDto el : machine.getElements()) {
                List<String> resolved = el.getSendsToNames().stream()
                    .map(uuid -> globalIdToName.getOrDefault(uuid, uuid))
                    .collect(Collectors.toList());
                el.setSendsToNames(resolved);
            }
        }

        return result;
    }

    // ──────────────────────────────────────────────────────────────────────────────
    // PIM
    // ──────────────────────────────────────────────────────────────────────────────

    private List<ResolvedPimMachineDto> resolvePimMachines(
            List<PimMachine> pimMachines,
            Map<String, String> globalIdToName,
            Map<String, PortRef> portIndex) {

        // Primera pasada: indexar nodos e ids de máquina
        List<ParsedPimMachine> parsed = new ArrayList<>();
        for (PimMachine pm : pimMachines) {
            try {
                JsonNode root = objectMapper.readTree(pm.getMachine());
                String machineId = root.path("id").asText("");
                String machineName = root.path("name").asText("PIM-" + pm.getId());
                globalIdToName.put(machineId, machineName);

                // Indexar nodos y puertos
                Map<String, JsonNode> nodeById = new LinkedHashMap<>();
                for (JsonNode node : root.path("nodes")) {
                    String nodeId = node.path("id").asText("");
                    String nodeName = node.path("name").asText(nodeId);
                    nodeById.put(nodeId, node);
                    globalIdToName.put(nodeId, nodeName);

                    // Indexar cada campo del nodo que sea puerto o parámetro
                    indexNodePorts(node, machineId, machineName, nodeId, nodeName, portIndex, globalIdToName);
                }
                parsed.add(new ParsedPimMachine(machineId, machineName, root, nodeById));
            } catch (Exception e) {
                log.warn("No se pudo parsear la máquina PIM id={}: {}", pm.getId(), e.getMessage());
            }
        }

        // Segunda pasada: construir DTOs con referencias ya resueltas
        List<ResolvedPimMachineDto> result = new ArrayList<>();
        for (ParsedPimMachine p : parsed) {
            JsonNode root = p.root();
            List<String> cimRefNames = StreamSupport.stream(
                root.path("ids_cim_reference").spliterator(), false)
                .map(n -> globalIdToName.getOrDefault(n.asText(), n.asText()))
                .collect(Collectors.toList());

            List<ResolvedPimNodeDto> nodes = buildPimNodes(p.nodeById(), portIndex, p.machineId(), p.machineName());
            List<ResolvedPimEdgeDto> edges = buildPimEdges(root.path("edges"), p.nodeById(), portIndex, globalIdToName);

            result.add(ResolvedPimMachineDto.builder()
                .id(p.machineId())
                .name(p.machineName())
                .description(root.path("description").asText(""))
                .cimReferenceNames(cimRefNames)
                .nodes(nodes)
                .edges(edges)
                .build());
        }
        return result;
    }

    /** Indexa todos los puertos/parámetros identificables de un nodo PIM en portIndex. */
    private void indexNodePorts(
            JsonNode node, String machineId, String machineName,
            String nodeId, String nodeName,
            Map<String, PortRef> portIndex,
            Map<String, String> globalIdToName) {

        node.fields().forEachRemaining(entry -> {
            String key = entry.getKey();
            JsonNode val = entry.getValue();
            if (NON_PARAM_KEYS.contains(key)) return;
            if (!val.isObject()) return;

            String portId = val.path("id").asText("");
            if (!portId.isEmpty()) {
                portIndex.put(portId, new PortRef(machineId, machineName, nodeId, nodeName, key));
                globalIdToName.put(portId, nodeName + "." + key);
            }
        });

        // también indexar parámetros 'others'
        for (JsonNode other : node.path("others")) {
            String otherId = other.path("id").asText("");
            String otherName = other.path("name").asText(otherId);
            if (!otherId.isEmpty()) {
                portIndex.put(otherId, new PortRef(machineId, machineName, nodeId, nodeName, otherName));
                globalIdToName.put(otherId, nodeName + ".others." + otherName);
            }
        }
    }

    private List<ResolvedPimNodeDto> buildPimNodes(
            Map<String, JsonNode> nodeById,
            Map<String, PortRef> portIndex,
            String machineId,
            String machineName) {

        List<ResolvedPimNodeDto> result = new ArrayList<>();
        for (Map.Entry<String, JsonNode> entry : nodeById.entrySet()) {
            JsonNode node = entry.getValue();
            Map<String, Object> params = new LinkedHashMap<>();
            List<String> extOutputPorts = new ArrayList<>();
            List<String> extInputPorts = new ArrayList<>();

            boolean stereo = node.path("stereo").path("initialValue").asBoolean(false);

            node.fields().forEachRemaining(field -> {
                String key = field.getKey();
                JsonNode val = field.getValue();
                if (NON_PARAM_KEYS.contains(key) || !val.isObject()) return;

                if (CONNECTION_POINT_KEYS.contains(key)) {
                    if (val.path("isExternalOutput").asBoolean(false)) extOutputPorts.add(key);
                    if (val.path("isExternalInput").asBoolean(false)) extInputPorts.add(key);
                } else {
                    // Parámetro de configuración: extraer initialValue
                    JsonNode iv = val.path("initialValue");
                    params.put(key, extractValue(iv));
                }
            });

            result.add(ResolvedPimNodeDto.builder()
                .id(node.path("id").asText(""))
                .name(node.path("name").asText(""))
                .type(node.path("type").asText(""))
                .description(node.path("description").asText(""))
                .stereo(stereo)
                .params(params)
                .externalOutputPorts(extOutputPorts)
                .externalInputPorts(extInputPorts)
                .build());
        }
        return result;
    }

    private List<ResolvedPimEdgeDto> buildPimEdges(
            JsonNode edgesNode,
            Map<String, JsonNode> nodeById,
            Map<String, PortRef> portIndex,
            Map<String, String> globalIdToName) {

        List<ResolvedPimEdgeDto> result = new ArrayList<>();
        for (JsonNode edge : edgesNode) {
            String srcNodeId = edge.path("sourceNode").asText("");
            String srcParamId = edge.path("sourceParam").asText("");
            String tgtNodeId = edge.path("targetNode").asText("");
            String tgtParamId = edge.path("targetParam").asText("");

            String srcNodeName = globalIdToName.getOrDefault(srcNodeId, srcNodeId);
            String tgtNodeName = globalIdToName.getOrDefault(tgtNodeId, tgtNodeId);

            String srcPort = resolvePortKey(srcParamId, portIndex, globalIdToName);
            String tgtPort = resolvePortKey(tgtParamId, portIndex, globalIdToName);

            result.add(ResolvedPimEdgeDto.builder()
                .sourceNodeName(srcNodeName)
                .sourcePort(srcPort)
                .targetNodeName(tgtNodeName)
                .targetPort(tgtPort)
                .type(edge.path("type").asText("audio"))
                .build());
        }
        return result;
    }

    // ──────────────────────────────────────────────────────────────────────────────
    // PIM Relations
    // ──────────────────────────────────────────────────────────────────────────────

    private List<ResolvedPimRelationDto> resolvePimRelations(
            String pimRelationsJson, Map<String, PortRef> portIndex) {

        if (pimRelationsJson == null || pimRelationsJson.isBlank()) return List.of();

        List<ResolvedPimRelationDto> result = new ArrayList<>();
        try {
            JsonNode root = objectMapper.readTree(pimRelationsJson);
            for (JsonNode rel : root.path("relations")) {
                String srcId = rel.path("source").asText("");
                String dstId = rel.path("destination").asText("");

                PortRef srcRef = portIndex.get(srcId);
                PortRef dstRef = portIndex.get(dstId);

                result.add(ResolvedPimRelationDto.builder()
                    .id(rel.path("id").asText(""))
                    .sourceMachineName(srcRef != null ? srcRef.machineName() : srcId)
                    .sourcePortName(srcRef != null ? srcRef.nodeName() + "." + srcRef.portKey() : srcId)
                    .destinationMachineName(dstRef != null ? dstRef.machineName() : dstId)
                    .destinationPortName(dstRef != null ? dstRef.nodeName() + "." + dstRef.portKey() : dstId)
                    .description(rel.path("description").asText(""))
                    .build());
            }
        } catch (Exception e) {
            log.warn("No se pudo parsear pim-relations: {}", e.getMessage());
        }
        return result;
    }

    // ──────────────────────────────────────────────────────────────────────────────
    // Utilidades
    // ──────────────────────────────────────────────────────────────────────────────

    private String resolvePortKey(String portId, Map<String, PortRef> portIndex,
                                   Map<String, String> globalIdToName) {
        PortRef ref = portIndex.get(portId);
        if (ref != null) return ref.portKey();
        return globalIdToName.getOrDefault(portId, portId);
    }

    private Object extractValue(JsonNode node) {
        if (node.isMissingNode() || node.isNull()) return null;
        if (node.isBoolean()) return node.asBoolean();
        if (node.isNumber()) return node.numberValue();
        if (node.isArray()) return "matrix[" + node.size() + "x" + (node.isEmpty() ? 0 : node.get(0).size()) + "]";
        return node.asText();
    }

    /** Referencia a un puerto dentro de un nodo de una máquina PIM. */
    record PortRef(String machineId, String machineName, String nodeId, String nodeName, String portKey) {}

    /** Contenedor temporal de una máquina PIM parseada. */
    record ParsedPimMachine(String machineId, String machineName, JsonNode root, Map<String, JsonNode> nodeById) {}
}
