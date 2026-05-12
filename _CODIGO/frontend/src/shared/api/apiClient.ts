import keycloak, { API_BASE_URL } from '@/app/plugins/keycloak';

/**
 * Cliente de API centralizado para gestionar las peticiones al backend.
 * Asegura que se incluya el token de autenticación de Keycloak si está disponible.
 */
class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  /**
   * Realiza una petición fetch con las cabeceras de autorización necesarias.
   */
  private async request<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    // Preparar cabeceras base
    const headers = new Headers(options.headers || {});
    
    // Inyectar token de Keycloak si existe la sesión
    if (keycloak.token) {
      headers.set('Authorization', `Bearer ${keycloak.token}`);
    }
    
    // Cabecera por defecto para JSON si hay cuerpo
    if (options.body && !headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }

    const response = await fetch(url, {
      ...options,
      headers
    });

    if (!response.ok) {
      // Intentar obtener el cuerpo del error si existe
      let errorData;
      try {
        errorData = await response.json();
      } catch (e) {
        errorData = { message: `Error ${response.status}: ${response.statusText}` };
      }
      throw new Error(errorData.message || 'Error en la petición API');
    }

    // Manejar respuestas vacías (como en DELETE)
    if (response.status === 204) {
      return {} as T;
    }

    return await response.json();
  }

  /**
   * Realiza una petición GET y devuelve el cuerpo como un Blob (para descargas binarias).
   */
  async getBlob(endpoint: string, options: RequestInit = {}): Promise<Blob> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = new Headers(options.headers || {});
    
    if (keycloak.token) {
      headers.set('Authorization', `Bearer ${keycloak.token}`);
    }

    const response = await fetch(url, {
      ...options,
      method: 'GET',
      headers
    });

    if (!response.ok) {
      throw new Error(`Error ${response.status}: No se pudo descargar el archivo.`);
    }

    return await response.blob();
  }

  /** Petición GET */
  get<T>(endpoint: string, options?: RequestInit) {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  /** Petición POST */
  post<T>(endpoint: string, data?: any, options?: RequestInit) {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined
    });
  }

  /** Petición PUT */
  put<T>(endpoint: string, data?: any, options?: RequestInit) {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined
    });
  }

  /** Petición DELETE */
  delete<T>(endpoint: string, options?: RequestInit) {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }
}

const apiClient = new ApiClient(API_BASE_URL);
export default apiClient;
