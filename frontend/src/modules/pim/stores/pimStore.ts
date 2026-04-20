import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import apiClient from '@/shared/api/apiClient';
import type { Pim, PimMachine, PimRelationsDocument, PimMachineDocument } from '@/shared/types';
import { useAnalysisMachinesStore } from '@/modules/analysis/stores/analysisMachinesStore';

/**
 * Store para la gestión del diseño conceptual (PIM) de un proyecto.
 */
export const usePimStore = defineStore('pim', () => {
  const analysisStore = useAnalysisMachinesStore();
  const loading = ref(false);
  const error = ref<string | null>(null);
  
  // Datos centrales de PIM (Relaciones)
  const currentPim = ref<Pim | null>(null);
  
  // Máquinas PIM (Nodos del diseño conceptual)
  const machines = ref<PimMachine[]>([]);
  
  // Documentos parseados para acceso rápido y reactividad
  const parsedDocs = ref<Record<number, PimMachineDocument>>({});
  
  const parsedPimRelations = computed<PimRelationsDocument>(() => {
    if (!currentPim.value?.machinesRelations) {
      return { description: '', relations: [] };
    }
    try {
      return JSON.parse(currentPim.value.machinesRelations);
    } catch (e) {
      return { description: '', relations: [] };
    }
  });

  const selectedNodeId = ref<string | number | null>(null);
  const visualizerMode = ref<'2D' | 'JSON'>('2D');
  const isRawEditing = ref(false);

  /**
   * Carga las máquinas PIM y el registro central de un proyecto.
   */
  async function fetchPimData(projectId: number) {
    loading.value = true;
    error.value = null;
    try {
      const [pim, pimMachines] = await Promise.all([
        apiClient.get<Pim>(`/api/v1/projects/${projectId}/pim`),
        apiClient.get<PimMachine[]>(`/api/v1/projects/${projectId}/pim-machines`)
      ]) as [Pim, PimMachine[]];
      
      currentPim.value = pim;
      machines.value = pimMachines;
      
      // Parsear documentos de máquinas
      const docs: Record<number, PimMachineDocument> = {};
      pimMachines.forEach(m => {
        try {
          docs[m.id] = JSON.parse(m.machine);
        } catch (e) {
          docs[m.id] = { 
            id: crypto.randomUUID(),
            name: m.name,
            description: m.description,
            ids_cim_reference: [],
            nodes: [], 
            edges: [] 
          };
        }
      });
      parsedDocs.value = docs;
    } catch (err: any) {
      error.value = err.message || 'Error al cargar datos PIM';
    } finally {
      loading.value = false;
    }
  }

  /**
   * Actualiza el JSON central de relaciones PIM.
   */
  async function updatePimRelations(rawJson: string) {
    if (!currentPim.value) return { success: false, message: 'No hay PIM cargado' };
    
    try {
      // Validar JSON mínimamente
      JSON.parse(rawJson);
      
      const updated = await apiClient.put<Pim>(`/api/v1/pim/${currentPim.value.id}`, {
        machinesRelations: rawJson
      });
      currentPim.value = updated;
      return { success: true };
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  }

  /**
   * Añade una nueva máquina PIM al proyecto.
   */
  async function addMachine(projectId: number, name: string, description: string, cimReferences: string[]) {
    try {
      const machineBusinessId = crypto.randomUUID();
      const initialDoc: PimMachineDocument = {
        id: machineBusinessId,
        name,
        description,
        ids_cim_reference: cimReferences,
        nodes: [],
        edges: []
      };

      const newMachine = await apiClient.post<PimMachine>(`/api/v1/projects/${projectId}/pim-machines`, {
        name,
        description,
        machine: JSON.stringify(initialDoc)
      });

      machines.value.push(newMachine);
      
      // ActualizarparsedDocs inmediatamente con el documento inicial
      parsedDocs.value[newMachine.id] = initialDoc;
      
      // Sincronizar selección global DESPUÉS de actualizar los datos para asegurar visibilidad
      const selectionId = `pim-m-${newMachine.id}`;
      selectedNodeId.value = selectionId;
      analysisStore.selectedNodeId = selectionId;

      return { success: true, machine: newMachine };
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  }

  /**
   * Actualiza una máquina PIM existente.
   */
  async function updateMachine(machineId: number, name: string, description: string, cimReferences: string[]) {
    try {
      // Sincronizar el nombre y descripción DENTRO del JSON antes de guardar
      const currentDoc = parsedDocs.value[machineId] || { nodes: [], edges: [] };
      const updatedDoc: PimMachineDocument = {
        ...currentDoc,
        id: currentDoc.id || crypto.randomUUID(), // Asegurar que tenga ID de negocio
        name,
        description,
        ids_cim_reference: cimReferences
      };

      const updated = await apiClient.put<PimMachine>(`/api/v1/pim-machines/${machineId}`, {
        name,
        description,
        machine: JSON.stringify(updatedDoc)
      });

      const index = machines.value.findIndex(m => m.id === machineId);
      if (index !== -1) {
        machines.value[index] = updated;
      }
      
      // Forzar actualización reactiva del documento parseado
      parsedDocs.value = { 
        ...parsedDocs.value, 
        [machineId]: updatedDoc 
      };

      // Limpieza exhaustiva tras actualizar metadatos
      await exhaustivePruneRelations();
      
      return { success: true, machine: updated };
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  }

  /**
   * Elimina una máquina PIM.
   */
  async function deleteMachine(machineId: number) {
    try {
      await apiClient.delete(`/api/v1/pim-machines/${machineId}`);
      machines.value = machines.value.filter(m => m.id !== machineId);
      delete parsedDocs.value[machineId];
      if (selectedNodeId.value === `pim-m-${machineId}`) {
        selectedNodeId.value = 'diseno';
      }

      // Limpieza exhaustiva tras eliminar una máquina
      await exhaustivePruneRelations();

      return { success: true };
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  }

  /**
   * Selecciona un nodo en el explorador.
   */
  function selectNode(id: string | number | null) {
    selectedNodeId.value = id;
  }

  /**
   * Computado para obtener la máquina actualmente seleccionada si existe.
   */
  const selectedMachine = computed(() => {
    if (typeof selectedNodeId.value === 'string' && selectedNodeId.value.startsWith('pim-m-')) {
      const id = Number(selectedNodeId.value.replace('pim-m-', ''));
      return machines.value.find(m => m.id === id) || null;
    }
    return null;
  });

  /**
   * Actualiza el JSON raw de una máquina PIM.
   */
  /**
   * Extrae todos los IDs de puertos marcados como externos (isExternalInput/Output) 
   * de un documento de máquina PIM.
   */
  function extractExternalPortIds(doc: PimMachineDocument): Set<string> {
    const portIds = new Set<string>();
    
    doc.nodes?.forEach((node: any) => {
      if (!node) return;
      
      // Revisar propiedades de primer nivel
      Object.entries(node).forEach(([key, val]: [string, any]) => {
        if (['id', 'name', 'type', 'description', 'ids_references', 'others'].includes(key)) return;
        if (val && typeof val === 'object') {
          if (val.isExternalInput || val.isExternalOutput) {
            if (val.id) portIds.add(val.id);
          }
        }
      });

      // Revisar la lista 'others'
      if (Array.isArray(node.others)) {
        node.others.forEach((o: any) => {
          if (o.isExternalInput || o.isExternalOutput) {
            if (o.id) portIds.add(o.id);
          }
        });
      }
    });

    return portIds;
  }

  /**
   * Realiza una limpieza exhaustiva de todas las relaciones PIM del proyecto.
   * Elimina cualquier relación cuyo puerto de origen o destino ya no exista o no sea externo.
   */
  async function exhaustivePruneRelations() {
    const currentRelationsDoc = parsedPimRelations.value;
    if (!currentRelationsDoc.relations.length) return { success: true };

    // 1. Recopilar TODOS los puertos externos válidos de TODAS las máquinas cargadas
    const allExternalPorts = new Set<string>();
    Object.values(parsedDocs.value).forEach(doc => {
      const ports = extractExternalPortIds(doc);
      ports.forEach(p => allExternalPorts.add(p));
    });

    // 2. Filtrar relaciones: ambos extremos deben existir en el conjunto global
    const initialCount = currentRelationsDoc.relations.length;
    const cleanedRelations = currentRelationsDoc.relations.filter(rel => {
      const isSourceValid = allExternalPorts.has(rel.source);
      const isTargetValid = allExternalPorts.has(rel.destination);
      return isSourceValid && isTargetValid;
    });

    if (cleanedRelations.length < initialCount) {
      console.log(`[PIM Global Sync] Podando ${initialCount - cleanedRelations.length} relaciones huérfanas o inválidas en todo el proyecto.`);
      const updatedRelationsJson = JSON.stringify({
        ...currentRelationsDoc,
        relations: cleanedRelations
      });
      return await updatePimRelations(updatedRelationsJson);
    }

    return { success: true };
  }

  async function updateMachineRawJson(machineId: number, rawJson: string) {
    try {
      const parsed = JSON.parse(rawJson);

      // Proceder con la actualización de la máquina primero
      const updated = await apiClient.put<PimMachine>(`/api/v1/pim-machines/${machineId}`, {
        name: parsed.name || '',
        description: parsed.description || '',
        machine: rawJson
      });

      const index = machines.value.findIndex(m => m.id === machineId);
      if (index !== -1) {
        machines.value[index] = updated;
      }
      
      // Actualizar el documento parseado localmente
      parsedDocs.value = { 
        ...parsedDocs.value, 
        [machineId]: parsed 
      };

      // --- SINCRONIZACIÓN EXHAUSTIVA ---
      // Tras actualizar los documentos locales, validamos la integridad global
      await exhaustivePruneRelations();
      
      return { success: true };
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  }

  /**
   * Maneja el cambio de modulaibilidad de un parámetro con integridad referencial.
   * Si se desactiva, limpia flags externos y borra aristas conectadas.
   */
  function handleParamModifiabilityChange(machineId: number, nodeId: string, paramName: string, isModifiable: boolean) {
    const doc = parsedDocs.value[machineId];
    if (!doc) return;

    // 1. Localizar el nodo y el parámetro
    const node = doc.nodes?.find((n: any) => n.id === nodeId);
    if (!node) return;

    const param = node[paramName];
    if (param && typeof param === 'object') {
      param.isModifiable = isModifiable;
      
      // Si desactivamos modulación, forzar isExternalInput a false
      if (!isModifiable) {
        param.isExternalInput = false;
        
        // 2. Podar aristas que terminan en este parámetro (targetParam)
        if (doc.edges) {
          const initialCount = doc.edges.length;
          doc.edges = doc.edges.filter((e: any) => 
            !(e.targetNode === nodeId && e.targetParam === paramName)
          );
          
          if (doc.edges.length < initialCount) {
            console.log(`[PIM Store] Podadas ${initialCount - doc.edges.length} aristas por desactivación de modulación en '${paramName}'.`);
          }
        }
      }
    }

    // Actualizar el documento en el estado reactivo local
    parsedDocs.value = { ...parsedDocs.value, [machineId]: doc };
  }

  return {
    loading,
    error,
    currentPim,
    machines,
    parsedDocs,
    parsedPimRelations,
    selectedNodeId,
    visualizerMode,
    isRawEditing,
    selectedMachine,
    fetchPimData,
    updatePimRelations,
    addMachine,
    updateMachine,
    deleteMachine,
    selectNode,
    updateMachineRawJson,
    handleParamModifiabilityChange
  };
})
