export interface Insumo {
  id: string;
  nombre: string;
  unidad: string;
  cuadrilla: number;
  pu: number;
  tipo: 'MO' | 'MT' | 'EQ' | 'SC' | 'SP'; // Mano de Obra, Materiales, Equipos, Subcontratos, Subpartidas
  color?: string;
  cantidad?: number;
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
}

export type PartidaColumnKey = 'item' | 'descripcion' | 'unidad' | 'metrado' | 'cu' | 'parcial' | 'mo' | 'mt' | 'eq' | 'sc';

export type ApuColumnKey = 'nombre' | 'unidad' | 'cuadrilla' | 'cantidad' | 'pu' | 'parcial' | 'tipo';

export interface BudgetsProps {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  companies: any[];
  mode?: 'lite' | 'pro';
  onNavigate?: (tab: string) => void;
  initialOpenBudgetId?: string | null;
}
