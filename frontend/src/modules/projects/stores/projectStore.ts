import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import apiClient from '@/shared/api/apiClient';
import type { Project, CimMachine, CimDocument } from '@/shared/types';

export const useProjectStore = defineStore('project', () => {
  const projects = ref<Project[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  // Estados para el Dashboard
  const machines = ref<CimMachine[]>([]);
  const parsedDocs = ref<Record<number, CimDocument>>({});
  const selectedNodeId = ref<string | number | null>(null);

  /**
   * Carga las máquinas de un proyecto desde el backend.
   */
  async function fetchMachines(projectId: number) {
    loading.value = true;
    try {
      const data = await apiClient.get<CimMachine[]>(`/api/v1/projects/${projectId}/machines`);
      machines.value = data;
      // Poblamos los documentos parseados en memoria
      data.forEach(m => {
        parsedDocs.value[m.id] = parseMachineData(m.machine);
      });
    } catch (err: any) {
      console.error('Error al cargar máquinas:', err);
      machines.value = [];
      parsedDocs.value = {};
    } finally {
      loading.value = false;
    }
  }

  /**
   * Añade una nueva máquina persistente vinculada al proyecto.
   */
  async function addAnalysisNode(projectId: number, name: string, description: string) {
    if (machines.value.length >= 10) return;

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
      console.error('Error al crear máquina:', err);
      return { success: false, message: err.message };
    }
  }

  /**
   * Actualiza una máquina existente.
   */
  async function updateAnalysisNode(machineId: number, name: string, description: string) {
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
      console.error('Error al actualizar máquina:', err);
      return { success: false, message: err.message };
    }
  }

  /**
   * Elimina una máquina del backend por su ID.
   */
  async function deleteAnalysisNode(id: number) {
    try {
      await apiClient.delete(`/api/v1/machines/${id}`);
      machines.value = machines.value.filter(m => m.id !== id);
      delete parsedDocs.value[id];
      if (selectedNodeId.value === id) {
        selectedNodeId.value = null;
      }
      return { success: true };
    } catch (err: any) {
      console.error('Error al eliminar máquina:', err);
      return { success: false, message: err.message };
    }
  }

  /**
   * Selecciona un nodo para su edición.
   */
  function selectNode(id: string | number | null) {
    selectedNodeId.value = id;
  }

  /**
   * Prepara un nuevo sub-nodo para ser creado con un ID único garantizado.
   */
  function selectNewSubNode(machineId: string | number, type: 'g' | 'mod') {
    const doc = parsedDocs.value[Number(machineId)];
    let newId = '';
    do {
      newId = `${type === 'g' ? 'gen' : 'mod'}_${Math.random().toString(36).substring(2, 8)}`;
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
   * Obtiene el nodo seleccionado actualmente (Máquina).
   */
  const selectedNode = computed(() => {
    if (!selectedNodeId.value) return null;
    
    // Si es un ID compuesto (sub-nodo), extraemos el ID de la máquina
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

    // Buscar en la lista de máquinas persistentes
    return machines.value.find(m => m.id === selectedNodeId.value) || null;
  });

  /**
   * Obtiene el sub-nodo seleccionado (Generador o Modificador).
   */
  const selectedSubNode = computed(() => {
    const id = selectedNodeId.value;
    if (!id || typeof id !== 'string') return null;

    if (id.startsWith('new-m-')) {
      const parts = id.split('-');
      const type = parts[3]; // g | mod
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

    // Formato esperado: m-{machineId}-{type}-{subId}
    // subId puede contener guiones, por lo que no podemos simplemente hacer split y coger parts[3]
    const firstDash = id.indexOf('-');
    const secondDash = id.indexOf('-', firstDash + 1);
    const thirdDash = id.indexOf('-', secondDash + 1);
    
    if (secondDash === -1 || thirdDash === -1) return null;

    const machineId = Number(id.substring(firstDash + 1, secondDash));
    const type = id.substring(secondDash + 1, thirdDash); // 'g' o 'mod'
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
   * Carga todos los proyectos del usuario.
   */
  async function fetchProjects() {
    loading.value = true;
    error.value = null;
    try {
      const data = await apiClient.get<Project[]>('/api/v1/projects');
      projects.value = data;
    } catch (err: any) {
      error.value = err.message || 'Error al cargar los proyectos';
    } finally {
      loading.value = false;
    }
  }

  /**
   * Crea un nuevo proyecto.
   */
  async function createProject(name: string, description: string) {
    loading.value = true;
    try {
      const newProject = await apiClient.post<Project>('/api/v1/projects', { 
        name, description 
      });
      projects.value.unshift(newProject);
      return { success: true, project: newProject };
    } catch (err: any) {
      console.error('Error al crear proyecto:', err);
      return { success: false, message: err.message };
    } finally {
      loading.value = false;
    }
  }

  /**
   * Elimina un proyecto por su ID.
   */
  const deleteProject = async (id: number) => {
    try {
      await apiClient.delete(`/api/v1/projects/${id}`);
      projects.value = projects.value.filter(p => p.id !== id);
      return { success: true };
    } catch (err: any) {
      console.error('Error al eliminar proyecto:', err);
      return { success: false, message: err.message };
    }
  }

  /**
   * Obtiene un proyecto específico por su ID.
   */
  const fetchProjectById = async (id: number) => {
    loading.value = true;
    error.value = null;
    try {
      return await apiClient.get<Project>(`/api/v1/projects/${id}`);
    } catch (err: any) {
      error.value = err.message;
      return null;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Actualiza un proyecto existente.
   */
  const updateProject = async (id: number, name: string, description: string) => {
    try {
      const updatedProject = await apiClient.put<Project>(`/api/v1/projects/${id}`, { 
        name, description 
      });
      
      const index = projects.value.findIndex(p => p.id === id);
      if (index !== -1) {
        projects.value[index] = updatedProject;
      }
      
      return { success: true };
    } catch (err: any) {
      console.error('Error al actualizar proyecto:', err);
      return { success: false, message: err.message };
    }
  }

  /**
   * Parsea los datos de una máquina de string JSON a CimDocument.
   */
  function parseMachineData(machineStr: string): CimDocument {
    try {
      if (!machineStr || machineStr.trim() === '' || machineStr === '{}') {
        return { $type: 'Document', generators: [], modificators: [] };
      }
      return JSON.parse(machineStr) as CimDocument;
    } catch (err) {
      console.error('Error parseando datos de máquina:', err);
      return { $type: 'Document', generators: [], modificators: [] };
    }
  }

  /**
   * Actualiza los datos de un sub-nodo y persiste la máquina completa.
   */
  async function updateSubNodeData(machineId: number, subNodeId: string, type: 'g' | 'mod', data: any, isNew: boolean = false) {
    const machine = machines.value.find(m => m.id === machineId);
    if (!machine) return { success: false, message: 'Máquina no encontrada' };

    const doc = parsedDocs.value[machineId];
    if (!doc) return { success: false, message: 'Documento en caché no encontrado' };

    // Actualizamos el objeto reactivo en memoria directamente para la fluidez visual
    if (isNew) {
      if (type === 'g') {
        doc.generators.push({ ...data, $type: 'AudioGenerator' });
      } else {
        doc.modificators.push({ ...data, $type: 'Modificator' });
      }
    } else {
      if (type === 'g') {
        const idx = doc.generators.findIndex(g => g.id === subNodeId);
        if (idx !== -1) {
          doc.generators[idx] = { ...doc.generators[idx], ...data };
        }
      } else {
        const idx = doc.modificators.findIndex(m => m.id === subNodeId);
        if (idx !== -1) {
          doc.modificators[idx] = { ...doc.modificators[idx], ...data };
        }
      }
    }

    try {
      const jsonStr = JSON.stringify(doc);
      const payload = {
        name: machine.name,
        description: machine.description,
        machine: jsonStr
      };

      console.log(`[CIM Store] Consolidando cambios en base de datos para máquina ${machineId}`);

      const updatedMachine = await apiClient.put<CimMachine>(`/api/v1/machines/${machineId}`, payload);
      
      const machineIdx = machines.value.findIndex(m => m.id === machineId);
      if (machineIdx !== -1) {
        // Mantenemos la reactividad consistente en todo
        machines.value[machineIdx] = updatedMachine;
      }
      
      if (isNew) {
        selectedNodeId.value = `m-${machineId}-${type}-${data.id}`;
      }
      return { success: true };
    } catch (err: any) {
      console.error('[CIM Store] Error al consolidar:', err);
      // Opcional: revertir en memoria o hacer refetch
      await fetchMachines(machine.idProyect);
      return { success: false, message: 'Error de validación/guardado. Revisa la sintaxis generada.' };
    }
  }

  /**
   * Elimina un sub-nodo de una máquina y persiste.
   */
  async function deleteSubNode(machineId: number, subId: string, type: 'g' | 'mod') {
    const machine = machines.value.find(m => m.id === machineId);
    if (!machine) return { success: false, message: 'Máquina no encontrada' };

    const doc = parsedDocs.value[machineId];
    if (!doc) return { success: false, message: 'Documento en caché no encontrado' };

    if (type === 'g') {
      const idx = doc.generators.findIndex(g => g.id === subId);
      if (idx !== -1) {
        doc.generators.splice(idx, 1);
      }
    } else {
      const idx = doc.modificators.findIndex(m => m.id === subId);
      if (idx !== -1) {
        doc.modificators.splice(idx, 1);
      }
    }

    try {
      const jsonStr = JSON.stringify(doc);
      const payload = {
        name: machine.name,
        description: machine.description,
        machine: jsonStr
      };

      const updatedMachine = await apiClient.put<CimMachine>(`/api/v1/machines/${machineId}`, payload);
      const machineIdx = machines.value.findIndex(m => m.id === machineId);
      if (machineIdx !== -1) {
        machines.value[machineIdx] = updatedMachine;
      }

      // Siempre seleccionar la máquina padre tras borrar
      selectedNodeId.value = machineId;
      
      return { success: true };
    } catch (err: any) {
      console.error('[CIM Store] Error al consolidar tras borrar:', err);
      await fetchMachines(machine.idProyect);
      return { success: false, message: 'Error al borrar' };
    }
  }

  return {
    projects,
    loading,
    error,
    fetchProjects,
    createProject,
    deleteProject,
    fetchProjectById,
    updateProject,
    machines,
    parsedDocs,
    selectedNodeId,
    selectedNode,
    fetchMachines,
    addAnalysisNode,
    selectNewSubNode,
    updateAnalysisNode,
    deleteAnalysisNode,
    selectNode,
    parseMachineData,
    selectedSubNode,
    updateSubNodeData,
    deleteSubNode
  };
});
