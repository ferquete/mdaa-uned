/**
 * Interfaz que representa un proyecto del sistema MDA Audio.
 */
export interface Project {
  id: number;
  name: string;
  description: string;
  genre: string;
  createdAt: string;
}

/**
 * Interfaz que representa un género musical disponible.
 */
export interface Genre {
  name: string;
  description: string;
}

/**
 * Interfaz que representa la sesión del usuario actual.
 */
export interface UserSession {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
}

/**
 * Resultado estándar de las operaciones de API.
 */
export interface ApiResult<T = any> {
  success: boolean;
  data?: T;
  message?: string;
}

/**
 * Interfaz que representa una máquina CIM persistida en base de datos.
 */
export interface CimMachine {
  id: number;
  idProyect: number;
  name: string;
  machine: string; // JSON String
}
