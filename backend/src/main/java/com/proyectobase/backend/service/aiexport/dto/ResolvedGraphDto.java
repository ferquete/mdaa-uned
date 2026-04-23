package com.proyectobase.backend.service.aiexport.dto;

import lombok.Builder;
import lombok.Data;

import java.util.List;
import java.util.Map;

/**
 * Representación del grafo completo del proyecto con UUIDs resueltos a nombres simbólicos.
 * Se serializa como RESOLVED_GRAPH.json dentro del ZIP de exportación.
 */
@Data
@Builder
public class ResolvedGraphDto {

    /** Nombre del proyecto */
    private String projectName;

    /** Descripción del proyecto */
    private String projectDescription;

    /** Máquinas CIM con sus elementos internos */
    private List<ResolvedCimMachineDto> cimMachines;

    /** Máquinas PIM con sus nodos y conexiones resueltas */
    private List<ResolvedPimMachineDto> pimMachines;

    /** Relaciones entre máquinas PIM ya resueltas */
    private List<ResolvedPimRelationDto> pimRelations;

    // ──────────────────────────────────────────────
    // Máquinas CIM
    // ──────────────────────────────────────────────

    @Data @Builder
    public static class ResolvedCimMachineDto {
        private String id;
        private String name;
        private String description;
        private List<ResolvedCimElementDto> elements;
    }

    @Data @Builder
    public static class ResolvedCimElementDto {
        private String id;
        private String name;
        private String description;
        private String params;
        private boolean hasExternalInput;
        private boolean hasExternalOutput;
        /** Nombres de los elementos a los que este elemento envía señal */
        private List<String> sendsToNames;
    }

    // ──────────────────────────────────────────────
    // Máquinas PIM
    // ──────────────────────────────────────────────

    @Data @Builder
    public static class ResolvedPimMachineDto {
        private String id;
        private String name;
        private String description;
        /** Nombres de las máquinas CIM que implementa esta máquina PIM */
        private List<String> cimReferenceNames;
        private List<ResolvedPimNodeDto> nodes;
        private List<ResolvedPimEdgeDto> edges;
    }

    @Data @Builder
    public static class ResolvedPimNodeDto {
        private String id;
        private String name;
        /** Tipo DSL: oscillator, lfo, frequency_filter, etc. */
        private String type;
        private String description;
        private boolean stereo;
        /** Parámetros de configuración con su valor inicial */
        private Map<String, Object> params;
        /** Puertos con isExternalOutput=true */
        private List<String> externalOutputPorts;
        /** Puertos con isExternalInput=true */
        private List<String> externalInputPorts;
    }

    @Data @Builder
    public static class ResolvedPimEdgeDto {
        /** Nombre del nodo origen */
        private String sourceNodeName;
        /** Nombre del puerto de salida (sourceParam key) */
        private String sourcePort;
        /** Nombre del nodo destino */
        private String targetNodeName;
        /** Nombre del puerto/parámetro de destino (targetParam key) */
        private String targetPort;
        /** "audio" o "modification" */
        private String type;
    }

    // ──────────────────────────────────────────────
    // Relaciones entre máquinas PIM
    // ──────────────────────────────────────────────

    @Data @Builder
    public static class ResolvedPimRelationDto {
        private String id;
        /** Nombre de la máquina PIM origen */
        private String sourceMachineName;
        /** Nombre del puerto de la máquina PIM origen */
        private String sourcePortName;
        /** Nombre de la máquina PIM destino */
        private String destinationMachineName;
        /** Nombre del puerto/parámetro de destino */
        private String destinationPortName;
        private String description;
    }
}
