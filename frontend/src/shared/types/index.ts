/**
 * Interfaz que representa un proyecto del sistema MDA Audio.
 */
export interface Project {
  id: number;
  name: string;
  description: string;
  idCim: number;
  createdAt: string;
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
  idCim: number;
  machine: string; // JSON String
}

/**
 * Interfaz que representa la entidad central de análisis de un proyecto.
 */
export interface Cim {
  id: number;
  machinesRelations: string; // JSON String
  idProject: number;
}

/**
 * Interfaces para el DSL CIM (basado en la gramática Langium)
 */

export interface CimBaseComponent {
  id: string;
  name: string;
  description: string;
  inputs?: string;
  outputs?: string;
  params?: string;
  $type?: string;
}

export interface CimGenerator extends CimBaseComponent {
  refs?: any[];
  rels?: any[];
}

export interface CimModificator extends CimBaseComponent {
  refs?: any[];
}

export interface CimDocument {
  $type: 'Document';
  id: string;
  name: string;
  description: string;
  generators: CimGenerator[];
  modificators: CimModificator[];
}
