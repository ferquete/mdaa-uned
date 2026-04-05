import { defineStore } from 'pinia';
import { ref } from 'vue';
import keycloak from '../plugins/keycloak';

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
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8081';

  /**
   * Sincroniza la sesión actual con el backend.
   * Solo realiza la petición si no ha sido sincronizado en esta instancia (o si se fuerza).
   */
  async function syncSession(force = false) {
    if ((isSynced.value && !force) || !keycloak.authenticated) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/users/me`, {
        headers: {
          'Authorization': `Bearer ${keycloak.token}`,
          'Accept': 'application/json',
        },
      });

      if (response.ok) {
        const userData = await response.json();
        user.value = userData;
        isSynced.value = true;
        console.log('User synced successfully with backend');
      } else {
        console.error('Failed to sync user with backend:', response.statusText);
      }
    } catch (error) {
      console.error('Error syncing user with backend:', error);
    }
  }

  /**
   * Actualiza el perfil de usuario.
   */
  async function updateProfile(firstName: string, lastName: string) {
    if (!keycloak.authenticated) return;

    const response = await fetch(`${API_BASE_URL}/api/v1/users/me`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${keycloak.token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({ firstName, lastName }),
    });

    if (response.ok) {
      const updatedUser = await response.json();
      user.value = updatedUser;
      // Actualizamos también el token parsed (aunque esto es local, sirve para la sesión actual)
      if (keycloak.tokenParsed) {
          keycloak.tokenParsed.given_name = firstName;
          keycloak.tokenParsed.family_name = lastName;
      }
      return { success: true };
    } else {
      const errorData = await response.json().catch(() => ({}));
      return { success: false, message: errorData.message || 'Error al actualizar el perfil' };
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
