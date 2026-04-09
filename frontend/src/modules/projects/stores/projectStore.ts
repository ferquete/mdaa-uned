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
  const selectedNodeId = ref<string | number | null>(null);

  /**
   * Carga las máquinas de un proyecto desde el backend.
   */
  async function fetchMachines(projectId: number) {
    loading.value = true;
    try {
      const data = await apiClient.get<CimMachine[]>(`/api/v1/projects/${projectId}/machines`);
      machines.value = data;
    } catch (err: any) {
      console.error('Error al cargar máquinas:', err);
      machines.value = [];
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
   * Obtiene el nodo seleccionado actualmente.
   */
  const selectedNode = computed(() => {
    if (!selectedNodeId.value) return null;
    // Buscar en la lista de máquinas persistentes
    return machines.value.find(m => m.id === selectedNodeId.value) || null;
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
    selectedNodeId,
    selectedNode,
    fetchMachines,
    addAnalysisNode,
    updateAnalysisNode,
    deleteAnalysisNode,
    selectNode,
    parseMachineData
  };
});
