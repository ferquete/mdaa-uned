import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import apiClient from '@/shared/api/apiClient';
import type { Project, Genre } from '@/shared/types';

export const useProjectStore = defineStore('project', () => {
  const projects = ref<Project[]>([]);
  const genres = ref<Genre[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  // Estados para el Dashboard
  const analysisNodes = ref<{ id: string, text: string }[]>([]);
  const selectedNodeId = ref<string | null>(null);

  /**
   * Añade un nuevo nodo de análisis con validación.
   */
  function addAnalysisNode(nameCandidate: string) {
    if (analysisNodes.value.length >= 10) return;

    const name = nameCandidate.trim();
    if (!name) return;

    const newNode = {
      id: `analisis-${Date.now()}`,
      text: name
    };

    analysisNodes.value.push(newNode);
    selectedNodeId.value = newNode.id;
  }

  /**
   * Elimina un nodo de análisis por su ID.
   */
  function deleteAnalysisNode(id: string) {
    analysisNodes.value = analysisNodes.value.filter(n => n.id !== id);
    if (selectedNodeId.value === id) {
      selectedNodeId.value = null;
    }
  }

  /**
   * Selecciona un nodo para su edición.
   */
  function selectNode(id: string | null) {
    selectedNodeId.value = id;
  }

  /**
   * Obtiene el nodo seleccionado actualmente.
   */
  const selectedNode = computed(() => {
    if (!selectedNodeId.value) return null;
    // Buscar en nodos dinámicos
    return analysisNodes.value.find(n => n.id === selectedNodeId.value) || null;
  });

  /**
   * Carga los géneros disponibles desde la API.
   */
  async function fetchGenres() {
    try {
      const data = await apiClient.get<Genre[]>('/api/v1/projects/genres');
      genres.value = data;
    } catch (err: any) {
      console.error('Error al cargar géneros:', err);
    }
  }

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
  async function createProject(name: string, description: string, genre: string) {
    loading.value = true;
    try {
      const newProject = await apiClient.post<Project>('/api/v1/projects', { 
        name, description, genre 
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
  const updateProject = async (id: number, name: string, description: string, genre: string) => {
    try {
      const updatedProject = await apiClient.put<Project>(`/api/v1/projects/${id}`, { 
        name, description, genre 
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

  return {
    projects,
    genres,
    loading,
    error,
    fetchProjects,
    fetchGenres,
    createProject,
    deleteProject,
    fetchProjectById,
    updateProject,
    analysisNodes,
    selectedNodeId,
    selectedNode,
    addAnalysisNode,
    deleteAnalysisNode,
    selectNode
  };
});
