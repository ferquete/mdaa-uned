import { defineStore } from 'pinia';
import { ref } from 'vue';
import keycloak from '../plugins/keycloak';

export interface Project {
  id: number;
  name: string;
  description: string;
  genre: string;
  createdAt: string;
}

export interface Genre {
  name: string;
  description: string;
}

export const useProjectStore = defineStore('project', () => {
  const projects = ref<Project[]>([]);
  const genres = ref<Genre[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);
  
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8081';

  async function fetchGenres() {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/projects/genres`, {
        headers: {
          'Authorization': `Bearer ${keycloak.token}`
        }
      });
      if (response.ok) {
        genres.value = await response.json();
      }
    } catch (err) {
      console.error('Error al cargar géneros:', err);
    }
  }

  async function fetchProjects() {
    loading.value = true;
    error.value = null;
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/projects`, {
        headers: {
          'Authorization': `Bearer ${keycloak.token}`
        }
      });
      
      if (response.ok) {
        projects.value = await response.json();
      } else {
        error.value = 'Error al cargar los proyectos';
      }
    } catch (err) {
      error.value = 'Error de red al cargar proyectos';
    } finally {
      loading.value = false;
    }
  }

  async function createProject(name: string, description: string, genre: string) {
    loading.value = true;
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/projects`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${keycloak.token}`
        },
        body: JSON.stringify({ name, description, genre })
      });
      
      if (response.ok) {
        const newProject = await response.json();
        projects.value.unshift(newProject);
        return { success: true, project: newProject };
      } else {
        const data = await response.json().catch(() => ({}));
        // Capturar detalles del error para depurar
        const errorMessage = data.message || data.error || `Error ${response.status}: ${response.statusText}`;
        console.error('Error del backend:', data);
        return { 
          success: false, 
          message: errorMessage
        };
      }
    } catch (err) {
      console.error('Error de red:', err);
      return { success: false, message: 'Error de red al conectar con el servidor' };
    } finally {
      loading.value = false;
    }
  }

  /**
   * Elimina un proyecto por su ID.
   */
  const deleteProject = async (id: number) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/projects/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${keycloak.token}`
        }
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || 'Error al eliminar el proyecto')
      }

      // Actualizar estado local
      projects.value = projects.value.filter(p => p.id !== id)
      return { success: true }
    } catch (err: any) {
      console.error('Error deleting project:', err)
      return { success: false, message: err.message }
    }
  }

  /**
   * Obtiene un proyecto específico por su ID.
   */
  const fetchProjectById = async (id: number) => {
    loading.value = true
    error.value = null
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/projects/${id}`, {
        headers: {
          'Authorization': `Bearer ${keycloak.token}`
        }
      })
      if (!response.ok) throw new Error('No se pudo cargar el proyecto')
      return await response.json()
    } catch (err: any) {
      error.value = err.message
      return null
    } finally {
      loading.value = false
    }
  }

  /**
   * Actualiza un proyecto existente.
   */
  const updateProject = async (id: number, name: string, description: string, genre: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/projects/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${keycloak.token}`
        },
        body: JSON.stringify({ name, description, genre })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || 'Error al actualizar el proyecto')
      }

      const updatedProject = await response.json()
      
      // Actualizar estado local
      const index = projects.value.findIndex(p => p.id === id)
      if (index !== -1) {
        projects.value[index] = updatedProject
      }
      
      return { success: true }
    } catch (err: any) {
      console.error('Error updating project:', err)
      return { success: false, message: err.message }
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
    updateProject
  };
});
