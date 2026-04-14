/**
 * Interfaz que representa un proyecto del sistema MDA Audio.
 */
export interface Project {
  id: number;
  name: string;
  description: string;
  idCim: number;
  idPim: number;
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
  idProject: number;
  idCim: number;
  name: string;
  description: string;
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
 * Interfaz que representa una máquina PIM persistida en base de datos.
 */
export interface PimMachine {
  id: number;
  idProject: number;
  idPim: number;
  name: string;
  description: string;
  machine: string; // JSON String
}

/**
 * Interfaz que representa la entidad central de diseño conceptual de un proyecto.
 */
export interface Pim {
  id: number;
  machinesRelations: string; // JSON String
  idProject: number;
}

/**
 * Interfaces para el DSL CIM (basado en la gramática Langium)
 */

export interface CimSendTo {
  id: string;
  idRef: string;
  description: string;
}

export interface CimBaseComponent {
  id: string;
  name: string;
  description: string;
  params?: string;
  $type?: string;
  sendTo: CimSendTo[];
}

export interface CimGenerator extends CimBaseComponent {}

export interface CimModificator extends CimBaseComponent {}

export interface CimDocument {
  $type: 'Document';
  id: string;
  name: string;
  description: string;
  generators: CimGenerator[];
  modificators: CimModificator[];
}

export interface CimRelation {
  id: string;
  source: string;
  destination: string;
  description: string;
}

export interface CimRelationsDocument {
  description: string;
  relations: CimRelation[];
}

/**
 * Interfaces para el DSL PIM (Diseño Conceptual)
 */

export interface PimRelation {
  id: string;
  source: string;
  destination: string;
  description: string;
}

export interface PimRelationsDocument {
  description: string;
  relations: PimRelation[];
}

export interface PimMachineDocument {
  id: string;
  name: string;
  description?: string;
  ids_cim_reference: string[];
  nodes: any[];
  edges: any[];
}
