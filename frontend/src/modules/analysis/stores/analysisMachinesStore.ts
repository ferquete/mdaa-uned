import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import apiClient from '@/shared/api/apiClient';
import type { CimMachine, CimDocument, Cim } from '@/shared/types';

export const useAnalysisMachinesStore = defineStore('analysisMachines', () => {
  const loading = ref(false);
  const error = ref<string | null>(null);

  // Estado del Análisis
  const machines = ref<CimMachine[]>([]);
  const parsedDocs = ref<Record<number, CimDocument>>({});
  const currentCim = ref<Cim | null>(null);
  const selectedNodeId = ref<string | number | null>(null);
  const visualizerMode = ref<'2D' | 'JSON' | 'FORM'>('2D');
  
  const parsedCimRelations = computed(() => {
    if (!currentCim.value?.machinesRelations) return { description: '', relations: [] };
    try {
      return JSON.parse(currentCim.value.machinesRelations);
    } catch (e) {
      return { description: '', relations: [] };
    }
  });

  const isRawEditing = computed(() => visualizerMode.value === 'JSON');
  
  /**
   * Mapa de IDs de base de datos a sus respectivos IDs de negocio (UUID)
   */
  const machineUuids = computed(() => {
    const map: Record<number, string> = {};
    machines.value.forEach(m => {
      const doc = parsedDocs.value[m.id];
      if (doc?.id) map[m.id] = doc.id;
    });
    return map;
  });

  /**
   * Parsea los datos de una máquina de string JSON a CimDocument.
   */
  function parseMachineData(machineStr: string): CimDocument {
    try {
      if (!machineStr || machineStr.trim() === '') {
        return { $type: 'Document', id: '', name: '', description: '', generators: [], modificators: [] };
      }
      const parsed = JSON.parse(machineStr);
      return {
        ...parsed,
        $type: parsed.$type || 'Document',
        generators: parsed.generators || [],
        modificators: parsed.modificators || []
      } as CimDocument;
    } catch (err) {
      console.error('Error parseando datos de máquina:', err);
      return { $type: 'Document', id: '', name: '', description: '', generators: [], modificators: [] };
    }
  }

  /**
   * Carga las máquinas de un proyecto.
   */
  async function fetchMachines(projectId: number) {
    loading.value = true;
    try {
      const data = await apiClient.get<CimMachine[]>(`/api/v1/projects/${projectId}/machines`);
      machines.value = data;
      data.forEach(m => {
        parsedDocs.value[m.id] = parseMachineData(m.machine);
      });
      
      // También cargamos el CIM del proyecto
      const cimData = await apiClient.get<Cim>(`/api/v1/projects/${projectId}/cim`);
      currentCim.value = cimData;
    } catch (err: any) {
      console.error('Error al cargar máquinas o CIM:', err);
      machines.value = [];
      parsedDocs.value = {};
      currentCim.value = null;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Actualiza las relaciones entre máquinas del CIM.
   */
  async function updateCimRelations(machinesRelations: string) {
    if (!currentCim.value) return { success: false, message: 'CIM no cargado' };
    try {
      const updated = await apiClient.put<Cim>(`/api/v1/cim/${currentCim.value.id}`, { machinesRelations });
      currentCim.value = updated;
      return { success: true };
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  }

  /**
   * Añade un nuevo análisis (máquina) al proyecto.
   */
  async function addMachine(projectId: number, name: string, description: string) {
    if (machines.value.length >= 10) return { success: false, message: 'Límite de máquinas alcanzado' };

    try {
      const newMachine = await apiClient.post<CimMachine>(`/api/v1/projects/${projectId}/machines`, { 
        name,
        description
      });
      machines.value.push(newMachine);
      parsedDocs.value[newMachine.id] = parseMachineData(newMachine.machine);
      selectedNodeId.value = newMachine.id;
      return { success: true, machine: newMachine };
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  }

  /**
   * Actualiza información básica de una máquina.
   */
  async function updateMachine(machineId: number, name: string, description: string) {
    try {
      const updatedMachine = await apiClient.put<CimMachine>(`/api/v1/machines/${machineId}`, { 
        name,
        description
      });
      
      const index = machines.value.findIndex(m => m.id === machineId);
      if (index !== -1) {
        machines.value[index] = updatedMachine;
        parsedDocs.value[machineId] = parseMachineData(updatedMachine.machine);
      }
      return { success: true, machine: updatedMachine };
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  }

  /**
   * Elimina una máquina.
   */
  async function deleteMachine(id: number) {
    try {
      await apiClient.delete(`/api/v1/machines/${id}`);
      machines.value = machines.value.filter(m => m.id !== id);
      delete parsedDocs.value[id];
      if (selectedNodeId.value === id) {
        selectedNodeId.value = null;
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  }

  /**
   * Selecciona un nodo (máquina o componente).
   */
  function selectNode(id: string | number | null) {
    selectedNodeId.value = id;
  }

  /**
   * Prepara un nuevo sub-nodo (componente) con ID único.
   */
  function selectNewSubNode(machineId: string | number, type: 'g' | 'mod') {
    const doc = parsedDocs.value[Number(machineId)];
    let newId = '';
    do {
      newId = crypto.randomUUID();
      let exists = false;
      if (doc) {
        if (doc.generators?.some((g: any) => g.id === newId)) exists = true;
        if (doc.modificators?.some((m: any) => m.id === newId)) exists = true;
      }
      if (!exists) break;
    } while (true);
    
    selectedNodeId.value = `new-m-${machineId}-${type}-${newId}`;
  }

  /**
   * Getters computados para el nodo y subnodo seleccionado.
   */
  const selectedNode = computed(() => {
    if (!selectedNodeId.value) return null;
    if (selectedNodeId.value === 'analisis') {
      return currentCim.value ? { ...currentCim.value, $type: 'CimCentral' } : null;
    }
    if (typeof selectedNodeId.value === 'string') {
      if (selectedNodeId.value.startsWith('new-m-')) {
        const machineId = Number(selectedNodeId.value.split('-')[2]);
        return machines.value.find(m => m.id === machineId) || null;
      }
      if (selectedNodeId.value.startsWith('m-')) {
        const machineId = Number(selectedNodeId.value.split('-')[1]);
        return machines.value.find(m => m.id === machineId) || null;
      }
    }
    return machines.value.find(m => m.id === selectedNodeId.value) || null;
  });

  const selectedSubNode = computed(() => {
    const id = selectedNodeId.value;
    if (!id || typeof id !== 'string') return null;

    if (id.startsWith('new-m-')) {
      const parts = id.split('-');
      const type = parts[3];
      const newId = parts.slice(4).join('-');
      return {
        $type: type === 'g' ? 'AudioGenerator' : 'Modificator',
        id: newId,
        name: '',
        description: '',
        inputs: '',
        outputs: '',
        params: '',
        refs: [],
        ...(type === 'g' ? { rels: [] } : {})
      };
    }

    if (!id.startsWith('m-')) return null;

    const firstDash = id.indexOf('-');
    const secondDash = id.indexOf('-', firstDash + 1);
    const thirdDash = id.indexOf('-', secondDash + 1);
    
    if (secondDash === -1 || thirdDash === -1) return null;

    const machineId = Number(id.substring(firstDash + 1, secondDash));
    const type = id.substring(secondDash + 1, thirdDash);
    const subId = id.substring(thirdDash + 1);

    const doc = parsedDocs.value[machineId];
    if (!doc) return null;

    if (type === 'g') {
      return doc.generators.find(g => g.id === subId) || null;
    } else if (type === 'mod') {
      return doc.modificators.find(m => m.id === subId) || null;
    }
    return null;
  });

  /**
   * Actualiza datos de componente y persiste.
   */
  async function updateSubNodeData(machineId: number, subNodeId: string, type: 'g' | 'mod', data: any, isNew: boolean = false) {
    const machine = machines.value.find(m => m.id === machineId);
    if (!machine) return { success: false, message: 'Máquina no encontrada' };

    const doc = parsedDocs.value[machineId];
    if (!doc) return { success: false, message: 'Documento no encontrado' };

    if (isNew) {
      if (type === 'g') doc.generators.push({ ...data, $type: 'AudioGenerator' });
      else doc.modificators.push({ ...data, $type: 'Modificator' });
    } else {
      if (type === 'g') {
        const idx = doc.generators.findIndex(g => g.id === subNodeId);
        if (idx !== -1) doc.generators[idx] = { ...doc.generators[idx], ...data };
      } else {
        const idx = doc.modificators.findIndex(m => m.id === subNodeId);
        if (idx !== -1) doc.modificators[idx] = { ...doc.modificators[idx], ...data };
      }
    }

    try {
      const payload = {
        name: doc.name,
        description: doc.description,
        machine: JSON.stringify(doc)
      };

      const updatedMachine = await apiClient.put<CimMachine>(`/api/v1/machines/${machineId}`, payload);
      const machineIdx = machines.value.findIndex(m => m.id === machineId);
      if (machineIdx !== -1) machines.value[machineIdx] = updatedMachine;
      
      if (isNew) selectedNodeId.value = `m-${machineId}-${type}-${data.id}`;
      return { success: true };
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  }

  /**
   * Obtiene los nombres de los nodos que referencian a un sub-nodo específico.
   */
  function getSubNodeReferences(machineId: number, subId: string): string[] {
    const doc = parsedDocs.value[machineId];
    if (!doc) return [];

    const references: string[] = [];
    const checkRef = (node: any, targetId: string) => {
      const hasRef = node.refs?.some((r: any) => (typeof r === 'string' ? r === targetId : r.id === targetId));
      const hasRel = node.rels?.some((r: any) => (typeof r === 'string' ? r === targetId : r.id === targetId));
      return hasRef || hasRel;
    };

    doc.generators.forEach(g => {
      if (g.id !== subId && checkRef(g, subId)) references.push(g.name || g.id);
    });

    doc.modificators.forEach(m => {
      if (m.id !== subId && checkRef(m, subId)) references.push(m.name || m.id);
    });

    return references;
  }

  /**
   * Elimina un componente y limpia sus referencias en cascada.
   */
  async function deleteSubNode(machineId: number, subId: string, type: 'g' | 'mod') {
    const machine = machines.value.find(m => m.id === machineId);
    if (!machine) return { success: false, message: 'Máquina no encontrada' };

    const doc = parsedDocs.value[machineId];
    if (!doc) return { success: false, message: 'Documento no encontrado' };

    if (type === 'g') {
      const idx = doc.generators.findIndex(g => g.id === subId);
      if (idx !== -1) doc.generators.splice(idx, 1);
    } else {
      const idx = doc.modificators.findIndex(m => m.id === subId);
      if (idx !== -1) doc.modificators.splice(idx, 1);
    }

    // Limpieza en cascada de referencias
    const filterRefs = (arr: any[]) => arr?.filter((r: any) => (typeof r === 'string' ? r !== subId : r.id !== subId)) || [];
    
    doc.generators.forEach(g => {
      if (g.refs) g.refs = filterRefs(g.refs);
      if (g.rels) g.rels = filterRefs(g.rels);
    });
    
    doc.modificators.forEach(m => {
      if (m.refs) m.refs = filterRefs(m.refs);
    });

    try {
      const payload = {
        name: doc.name,
        description: doc.description,
        machine: JSON.stringify(doc)
      };

      const updatedMachine = await apiClient.put<CimMachine>(`/api/v1/machines/${machineId}`, payload);
      const machineIdx = machines.value.findIndex(m => m.id === machineId);
      if (machineIdx !== -1) machines.value[machineIdx] = updatedMachine;

      selectedNodeId.value = machineId;
      return { success: true };
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  }

  /**
   * Actualiza el JSON raw.
   */
  async function updateMachineRawJson(machineId: number, rawJson: string) {
    const machine = machines.value.find(m => m.id === machineId);
    if (!machine) return { success: false, message: 'Máquina no encontrada' };

    try {
      const parsed = JSON.parse(rawJson);
      const oldDoc = parsedDocs.value[machineId];
      const payload = {
        name: parsed.name || oldDoc?.name || '',
        description: parsed.description || oldDoc?.description || '',
        machine: rawJson
      };

      const updatedMachine = await apiClient.put<CimMachine>(`/api/v1/machines/${machineId}`, payload);
      const machineIdx = machines.value.findIndex(m => m.id === machineId);
      if (machineIdx !== -1) {
        machines.value[machineIdx] = updatedMachine;
        parsedDocs.value[machineId] = parseMachineData(updatedMachine.machine);
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  }

  return {
    loading,
    error,
    machines,
    parsedDocs,
    currentCim,
    parsedCimRelations,
    machineUuids,
    selectedNodeId,
    visualizerMode,
    isRawEditing,
    selectedNode,
    selectedSubNode,
    fetchMachines,
    updateCimRelations,
    addMachine,
    updateMachine,
    deleteMachine,
    selectNode,
    selectNewSubNode,
    updateSubNodeData,
    deleteSubNode,
    getSubNodeReferences,
    updateMachineRawJson
  };
});
