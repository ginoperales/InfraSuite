export interface Insumo {
  id: string;
  codigo?: string;   // Código del catálogo de insumos (ej: 0147010004)
  nombre: string;
  unidad: string;
  cuadrilla: number;
  pu: number;
  tipo: 'MO' | 'MT' | 'EQ' | 'SC' | 'SP'; // Mano de Obra, Materiales, Equipos, Subcontratos, Subpartidas
  scope?: 'global' | 'local';
  color?: string;
  cantidad?: number;
  desperdicio?: number;
  parcial?: number;
}

export interface Partida {
  id: string;
  item: string;
  nombre: string;
  unidad: string;
  metrado: number;
  esTitulo: boolean;
  rendimiento: number;
  insumos: Insumo[];
  isImported?: boolean;
  importedFrom?: string;
  importedFromBudgetId?: string;
  importedSourcePartidaId?: string;
  importedAt?: number;
}

export interface PiePresupuestoRow {
  variable: string;
  descripcion: string;
  formula: string;
  iu: string;
  resaltar: boolean;
  ocultarEnPdf?: boolean;
}

export interface BudgetPermission {
  userId: string;
  role: 'OWNER' | 'EDITOR' | 'COMMENTER' | 'VIEWER';
}

export interface Budget {
  id: string;
  nombre: string;
  cliente: string;
  fechaBase: string;
  grupo: string;
  categoria: 'Recientes' | 'Antiguos';
  partidas: Partida[];
  
  // Extended fields for "Datos Generales"
  direccion: string;
  distrito: string;
  provincia: string;
  departamento: string;
  jornada: number;
  moneda: 'SOLES' | 'DOLARES';
  subPresupuestos: string[];
  pieRows?: PiePresupuestoRow[];

  // Sharing and Collaboration
  ownerId?: string; // ID of the user who created it
  permissions?: Record<string, 'OWNER' | 'EDITOR' | 'COMMENTER' | 'VIEWER'>; // Map of userId to role
  linkAccess?: 'RESTRICTED' | 'ANYONE_WITH_LINK';
  linkRole?: 'VIEWER' | 'COMMENTER' | 'EDITOR';
  createdAt?: number;
  updatedAt?: number;
}

export type PartidaColumnKey = 'item' | 'descripcion' | 'unidad' | 'metrado' | 'cu' | 'parcial' | 'mo' | 'mt' | 'eq' | 'sc';

export type ApuColumnKey = 'codigo' | 'nombre' | 'unidad' | 'cuadrilla' | 'cantidad' | 'desperdicio' | 'pu' | 'parcial' | 'tipo';

export interface BudgetsProps {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  companies: any[];
  mode?: 'lite' | 'pro';
  onNavigate?: (tab: string) => void;
  initialOpenBudgetId?: string | null;
  publicReadOnly?: boolean;
  onRequireLogin?: () => void;
}
