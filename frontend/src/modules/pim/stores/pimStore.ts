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
  async function updateMachineRawJson(machineId: number, rawJson: string) {
    try {
      const parsed = JSON.parse(rawJson);
      // Extraer nombre y descripción del JSON para sincronizar metadatos
      const updated = await apiClient.put<PimMachine>(`/api/v1/pim-machines/${machineId}`, {
        name: parsed.name || '',
        description: parsed.description || '',
        machine: rawJson
      });

      const index = machines.value.findIndex(m => m.id === machineId);
      if (index !== -1) {
        machines.value[index] = updated;
      }
      
      // Forzar actualización reactiva del documento parseado para que el árbol se entere
      parsedDocs.value = { 
        ...parsedDocs.value, 
        [machineId]: parsed 
      };
      
      return { success: true };
    } catch (err: any) {
      return { success: false, message: err.message };
    }
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
    updateMachineRawJson
  };
});
