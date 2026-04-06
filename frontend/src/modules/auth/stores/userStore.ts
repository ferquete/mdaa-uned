import { defineStore } from 'pinia';
import { ref } from 'vue';
import keycloak from '@/app/plugins/keycloak';
import apiClient from '@/shared/api/apiClient';

export interface User {
  id: number;
  externalId: string;
  firstName: string;
  lastName: string;
  email: string;
  lastLogin: string;
  createdAt: string;
}

export const useUserStore = defineStore('user', () => {
  const user = ref<User | null>(null);
  const isSynced = ref(false);

  /**
   * Sincroniza la sesión actual con el backend.
   * Solo realiza la petición si no ha sido sincronizado en esta instancia (o si se fuerza).
   */
  async function syncSession(force = false) {
    if ((isSynced.value && !force) || !keycloak.authenticated) {
      return;
    }

    try {
      const userData = await apiClient.get<User>('/api/v1/users/me');
      user.value = userData;
      isSynced.value = true;
      console.log('User synced successfully with backend');
    } catch (error) {
      console.error('Error syncing user with backend:', error);
    }
  }

  /**
   * Actualiza el perfil de usuario.
   */
  async function updateProfile(firstName: string, lastName: string) {
    if (!keycloak.authenticated) return { success: false, message: 'No autenticado' };

    try {
      const updatedUser = await apiClient.put<User>('/api/v1/users/me', { 
        firstName, 
        lastName 
      });
      user.value = updatedUser;
      
      // Actualizamos también el token parsed (localmente para la sesión actual)
      if (keycloak.tokenParsed) {
        keycloak.tokenParsed.given_name = firstName;
        keycloak.tokenParsed.family_name = lastName;
      }
      return { success: true };
    } catch (err: any) {
      console.error('Error al actualizar perfil:', err);
      return { success: false, message: err.message || 'Error al actualizar el perfil' };
    }
  }

  function clearUser() {
    user.value = null;
    isSynced.value = false;
  }

  return { 
    user, 
    isSynced, 
    syncSession, 
    updateProfile,
    clearUser 
  };
});
