import React, { useState, useEffect, useRef } from 'react';
import { Card, Button, Input, Select, Modal } from '@infrasuite/shared';
import { useAuth } from '@infrasuite/auth';
import { db } from '@infrasuite/firebase';

// Interface definitions
interface Insumo {
  id: string;
  nombre: string;
  unidad: string;
  cuadrilla: number;
  pu: number;
  tipo: 'MO' | 'MT' | 'EQ' | 'SC' | 'SP'; // Mano de Obra, Materiales, Equipos, Subcontratos, Subpartidas
}

interface Partida {
  id: string;
  item: string;
  nombre: string;
  unidad: string;
  metrado: number;
  esTitulo: boolean;
  rendimiento: number;
  insumos: Insumo[];
}

interface Budget {
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

type PartidaColumnKey = 'item' | 'descripcion' | 'unidad' | 'metrado' | 'cu' | 'parcial' | 'mo' | 'mt' | 'eq' | 'sc';

const DEFAULT_PARTIDA_COLUMN_WIDTHS: Record<PartidaColumnKey, number> = {
  item: 70,
  descripcion: 520,
  unidad: 96,
  metrado: 110,
  cu: 145,
  parcial: 145,
  mo: 145,
  mt: 145,
  eq: 145,
  sc: 155
};

type ApuColumnKey = 'nombre' | 'unidad' | 'cuadrilla' | 'cantidad' | 'pu' | 'parcial' | 'tipo';

const DEFAULT_APU_COLUMN_WIDTHS: Record<ApuColumnKey, number> = {
  nombre: 400,
  unidad: 90,
  cuadrilla: 110,
  cantidad: 110,
  pu: 130,
  parcial: 130,
  tipo: 110
};


const WINDOWS_1252_EXTRA_BYTES: Record<number, number> = {
  0x20AC: 0x80,
  0x201A: 0x82,
  0x0192: 0x83,
  0x201E: 0x84,
  0x2026: 0x85,
  0x2020: 0x86,
  0x2021: 0x87,
  0x02C6: 0x88,
  0x2030: 0x89,
  0x0160: 0x8A,
  0x2039: 0x8B,
  0x0152: 0x8C,
  0x017D: 0x8E,
  0x2018: 0x91,
  0x2019: 0x92,
  0x201C: 0x93,
  0x201D: 0x94,
  0x2022: 0x95,
  0x2013: 0x96,
  0x2014: 0x97,
  0x02DC: 0x98,
  0x2122: 0x99,
  0x0161: 0x9A,
  0x203A: 0x9B,
  0x0153: 0x9C,
  0x017E: 0x9E,
  0x0178: 0x9F
};

const MOJIBAKE_MARKER_RE = /[\u00c3\u00c2\u00e2\u00c5\u00f0\u0192\x80-\x9f]/;
const UTF8_DECODER = new TextDecoder('utf-8', { fatal: true });

const encodeWindows1252 = (text: string) => {
  const bytes: number[] = [];

  for (const char of text) {
    const code = char.charCodeAt(0);
    const byte = code <= 0xff ? code : WINDOWS_1252_EXTRA_BYTES[code];
    if (byte === undefined) return null;
    bytes.push(byte);
  }

  return new Uint8Array(bytes);
};

const decodeMojibakeStep = (text: string) => {
  const bytes = encodeWindows1252(text);
  if (!bytes) return null;

  try {
    return UTF8_DECODER.decode(bytes);
  } catch {
    return null;
  }
};

const repairMojibakeText = (text: string) => {
  if (!MOJIBAKE_MARKER_RE.test(text)) return text;

  let repaired = text;
  for (let i = 0; i < 4; i += 1) {
    const decoded = decodeMojibakeStep(repaired);
    if (!decoded || decoded === repaired) break;

    repaired = decoded;
    if (!MOJIBAKE_MARKER_RE.test(repaired)) break;
  }

  return repaired;
};

const repairMojibakeValue = (value: unknown): unknown => {
  if (typeof value === 'string') return repairMojibakeText(value);
  if (Array.isArray(value)) return value.map(repairMojibakeValue);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [key, repairMojibakeValue(entry)])
    );
  }
  return value;
};

// Initial Data representing the screenshot data
const INITIAL_BUDGETS: Budget[] = [
  {
    id: 'b_1',
    nombre: 'CAMBIO DE CUBIERTA DE CUMBRERA',
    cliente: 'NN',
    fechaBase: '2026-01-07',
    grupo: 'EDIFICACIONES',
    categoria: 'Antiguos',
    direccion: 'NN',
    distrito: 'NN',
    provincia: 'NN',
    departamento: 'NN',
    jornada: 8,
    moneda: 'SOLES',
    subPresupuestos: ['SUB PRESUPUESTO 1'],
    partidas: [
      {
        id: 'p_1',
        item: '1',
        nombre: 'OBRAS PROVISIONALES Y SEGURIDAD',
        unidad: '',
        metrado: 0,
        esTitulo: true,
        rendimiento: 1,
        insumos: []
      },
      {
        id: 'p_2',
        item: '2',
        nombre: 'Movilización y desmovilización de equipos y herramientas',
        unidad: 'GLB',
        metrado: 1.00,
        esTitulo: false,
        rendimiento: 1,
        insumos: [
          { id: 'i_1', nombre: 'MOVILIZACION Y DESMOVILIZACION', unidad: 'GLB', cuadrilla: 1, pu: 100.00, tipo: 'SC' }
        ]
      },
      {
        id: 'p_3',
        item: '3',
        nombre: 'Implementación de Seguridad [SCTR, EPPs, Arneses, Señalización]',
        unidad: 'GLB',
        metrado: 1.00,
        esTitulo: false,
        rendimiento: 1,
        insumos: [
          { id: 'i_2', nombre: 'EQUIPO DE SEGURIDAD COMPLETO', unidad: 'GLB', cuadrilla: 1, pu: 400.00, tipo: 'MT' }
        ]
      },
      {
        id: 'p_4',
        item: '4',
        nombre: 'Alquiler y montaje de andamios normados [aprox. 2 cuerpos altos] y Escaleras telescópicas',
        unidad: 'DIA',
        metrado: 5.00,
        esTitulo: false,
        rendimiento: 1,
        insumos: [
          { id: 'i_3', nombre: 'ANDAMIOS CON ESCALERAS', unidad: 'DIA', cuadrilla: 1, pu: 150.00, tipo: 'EQ' }
        ]
      },
      {
        id: 'p_5',
        item: '5',
        nombre: 'DESMONTAJE Y DEMOLICIÓN',
        unidad: '',
        metrado: 0,
        esTitulo: true,
        rendimiento: 1,
        insumos: []
      },
      {
        id: 'p_6',
        item: '6',
        nombre: 'Desmontaje de cobertura existente en cumbrera [inc. retiro de fijaciones oxidadas]',
        unidad: 'M2',
        metrado: 100.80,
        esTitulo: false,
        rendimiento: 0.7, // .7 in the user screenshot
        insumos: [
          { id: 'i_4', nombre: 'PEON', unidad: 'HH', cuadrilla: 0.2500, pu: 20.20, tipo: 'MO' },
          { id: 'i_5', nombre: 'OPERARIO', unidad: 'HH', cuadrilla: 0.1250, pu: 28.10, tipo: 'MO' }
        ]
      },
      {
        id: 'p_7',
        item: '7',
        nombre: 'Acarreo y eliminación de material desmontado (escombros)',
        unidad: 'GLB',
        metrado: 1.00,
        esTitulo: false,
        rendimiento: 1,
        insumos: [
          { id: 'i_6', nombre: 'ACARREO Y ELIMINACION', unidad: 'GLB', cuadrilla: 1, pu: 95.60, tipo: 'SC' }
        ]
      },
      {
        id: 'p_8',
        item: '8',
        nombre: 'ESTRUCTURAS Y COBERTURAS',
        unidad: '',
        metrado: 0,
        esTitulo: true,
        rendimiento: 1,
        insumos: []
      },
      {
        id: 'p_9',
        item: '9',
        nombre: 'Suministro e instalación de Cumbrera dentada metálica [remate central]',
        unidad: 'M2',
        metrado: 100.80,
        esTitulo: false,
        rendimiento: 15,
        insumos: [
          { id: 'i_7', nombre: 'CUMBRERA METALICA DENTADA', unidad: 'M2', cuadrilla: 1, pu: 12.50, tipo: 'MT' },
          { id: 'i_8', nombre: 'OPERARIO', unidad: 'HH', cuadrilla: 2.00, pu: 28.10, tipo: 'MO' },
          { id: 'i_9', nombre: 'PEON', unidad: 'HH', cuadrilla: 1.00, pu: 20.20, tipo: 'MO' }
        ]
      },
      {
        id: 'p_10',
        item: '10',
        nombre: 'CIERRE Y LIMPIEZA',
        unidad: 'GLB',
        metrado: 1.00,
        esTitulo: false,
        rendimiento: 1,
        insumos: [
          { id: 'i_10', nombre: 'LIMPIEZA GENERAL', unidad: 'GLB', cuadrilla: 1, pu: 57.85, tipo: 'SC' }
        ]
      }
    ]
  },
  {
    id: 'b_2',
    nombre: 'VIVIENDA 2',
    cliente: 'Sin cliente asignado',
    fechaBase: '2023-11-07',
    grupo: 'EDIFICACIONES',
    categoria: 'Antiguos',
    direccion: 'Calle Sol 123',
    distrito: 'Miraflores',
    provincia: 'Lima',
    departamento: 'Lima',
    jornada: 8,
    moneda: 'SOLES',
    subPresupuestos: ['SUB PRESUPUESTO 1'],
    partidas: [
      { id: 'p2_1', item: '1', nombre: 'ESTRUCTURAS COMPLETA', unidad: 'GLB', metrado: 1, esTitulo: false, rendimiento: 1, insumos: [{ id: 'i2_1', nombre: 'SOPORTE', unidad: 'GLB', cuadrilla: 1, pu: 5000, tipo: 'SC' }] }
    ]
  }
];

const MOCK_CATALOGO_INSUMOS = [
  { nombre: 'SERVICIO SEGURIDAD EN OBRA', unidad: 'GLB', precio: 300.00, tipo: 'SUB CONTRATO', iu: '39 : INDICE DE PRECIOS AL CONSUMIDOR (INEI)', color: '#8b5cf6' },
  { nombre: 'LIJA AL AGUA #280', unidad: 'UND', precio: 4.00, tipo: 'MATERIAL', iu: '39 : INDICE DE PRECIOS AL CONSUMIDOR (INEI)', color: '#00f0ff' },
  { nombre: 'LAVADERO MADRID CON ESCURRIDERO DE ACERO INOXIDABLE DE 1 POZA 40X75 CM', unidad: 'PZA', precio: 180.00, tipo: 'MATERIAL', iu: '39 : INDICE DE PRECIOS AL CONSUMIDOR (INEI)', color: '#00f0ff' },
  { nombre: 'KIT DE DESAGUE PARA LAVATORIO', unidad: 'UND', precio: 50.00, tipo: 'MATERIAL', iu: '39 : INDICE DE PRECIOS AL CONSUMIDOR (INEI)', color: '#00f0ff' },
  { nombre: 'LAVATORIO OVALIN MAXBELL BLANCO', unidad: 'PZA', precio: 177.88, tipo: 'MATERIAL', iu: '39 : INDICE DE PRECIOS AL CONSUMIDOR (INEI)', color: '#00f0ff' },
  { nombre: 'TUBO DE ABASTO ACERO INOX. 1/2" X 1/2" FIP 40CM', unidad: 'PZA', precio: 23.64, tipo: 'MATERIAL', iu: '39 : INDICE DE PRECIOS AL CONSUMIDOR (INEI)', color: '#00f0ff' },
  { nombre: 'TUBO DE ABASTO ACERO INOX. 1/2" X 7/8" FIP 35CM', unidad: 'PZA', precio: 21.10, tipo: 'MATERIAL', iu: '39 : INDICE DE PRECIOS AL CONSUMIDOR (INEI)', color: '#00f0ff' },
  { nombre: 'KIT DE INSTALACION PARA TANQUE DE INODORO', unidad: 'UND', precio: 50.00, tipo: 'MATERIAL', iu: '39 : INDICE DE PRECIOS AL CONSUMIDOR (INEI)', color: '#00f0ff' },
  { nombre: 'TUBO DE ABASTO 1/99', unidad: 'UND', precio: 123.00, tipo: 'MATERIAL', iu: '39 : INDICE DE PRECIOS AL CONSUMIDOR (INEI)', color: '#00f0ff' },
  { nombre: 'TIBO DE ABASTO 1/2"', unidad: 'UND', precio: 25.00, tipo: 'MATERIAL', iu: '39 : INDICE DE PRECIOS AL CONSUMIDOR (INEI)', color: '#00f0ff' },
  { nombre: 'TUBO DE ABASTO 1/2"', unidad: 'UND', precio: 25.00, tipo: 'MATERIAL', iu: '39 : INDICE DE PRECIOS AL CONSUMIDOR (INEI)', color: '#00f0ff' },
  { nombre: 'TUBO DE ABASTO 1/2"', unidad: '1', precio: 25.00, tipo: 'MATERIAL', iu: '39 : INDICE DE PRECIOS AL CONSUMIDOR (INEI)', color: '#00f0ff' },
  { nombre: 'TRONZADORA PARA FIERRO', unidad: 'HE', precio: 10.00, tipo: 'EQUIPO', iu: '37 : HERRAMIENTA MANUAL', color: '#10b981' },
  { nombre: 'CORTADORA DE FIERROS', unidad: 'HM', precio: 10.00, tipo: 'EQUIPO', iu: '39 : INDICE DE PRECIOS AL CONSUMIDOR (INEI)', color: '#10b981' },
  { nombre: 'CANALETAS PARA COBERTURA', unidad: 'M', precio: 5.00, tipo: 'MATERIAL', iu: '39 : INDICE DE PRECIOS AL CONSUMIDOR (INEI)', color: '#00f0ff' },
  { nombre: 'ABRAZADERAS PARA CANAL DE 4"', unidad: 'UND', precio: 15.00, tipo: 'MATERIAL', iu: '39 : INDICE DE PRECIOS AL CONSUMIDOR (INEI)', color: '#00f0ff' },
  { nombre: 'PERNOS DE ANCLAJE DE FIERRO GALVANIZADO CON CAPUCHON PLASTICO', unidad: 'UND', precio: 1.50, tipo: 'MATERIAL', iu: '39 : INDICE DE PRECIOS AL CONSUMIDOR (INEI)', color: '#00f0ff' }
];

const MOCK_CATALOGO_PARTIDAS = [
  {
    nombre: 'CERCO DE MADERA, H=2.20 M.',
    unidad: 'ML',
    cu: 446.94,
    rendimiento: 1,
    mo: 412.66,
    mt: 29.43,
    eq: 0.00,
    sc: 4.85,
    sp: 0.00,
    insumos: [
      { nombre: 'CAPATAZ', unidad: 'HH', cuadrilla: 0.1000, cantidad: 0.8000, pu: 20.83, parcial: 16.66, tipo: 'MO', color: '#f97316' },
      { nombre: 'OPERARIO', unidad: 'HH', cuadrilla: 1.0000, cantidad: 8.0000, pu: 19.23, parcial: 153.84, tipo: 'MO', color: '#f97316' },
      { nombre: 'OFICIAL', unidad: 'HH', cuadrilla: 1.0000, cantidad: 8.0000, pu: 15.94, parcial: 127.52, tipo: 'MO', color: '#f97316' },
      { nombre: 'PEON', unidad: 'HH', cuadrilla: 1.0000, cantidad: 8.0000, pu: 14.33, parcial: 114.64, tipo: 'MO', color: '#f97316' },
      { nombre: 'CLAVO PARA MADERA C/C 2"', unidad: 'KG', cuadrilla: 0, cantidad: 0.9400, pu: 4.50, parcial: 4.23, tipo: 'MT', color: '#00f0ff' },
      { nombre: 'MADERA TORNILLO', unidad: 'P2', cuadrilla: 0, cantidad: 5.6000, pu: 4.50, parcial: 25.20, tipo: 'MT', color: '#00f0ff' },
      { nombre: 'CONCRETO PREMEZCLADO F\'C=175 KG/CM2', unidad: 'M3', cuadrilla: 0, cantidad: 0.0231, pu: 210.00, parcial: 4.85, tipo: 'SC', color: '#8b5cf6' }
    ]
  },
  {
    nombre: 'OFICINA, ALMACÉN, CASETA DE GUARDIANÍA',
    unidad: 'M2',
    cu: 200.66,
    rendimiento: 1,
    mo: 120.00,
    mt: 80.66,
    eq: 0.00,
    sc: 0.00,
    sp: 0.00,
    insumos: [
      { nombre: 'OPERARIO', unidad: 'HH', cuadrilla: 1.0000, cantidad: 8.0000, pu: 19.23, parcial: 153.84, tipo: 'MO', color: '#f97316' },
      { nombre: 'PEON', unidad: 'HH', cuadrilla: 2.0000, cantidad: 16.0000, pu: 14.33, parcial: 229.28, tipo: 'MO', color: '#f97316' },
      { nombre: 'MADERA TORNILLO', unidad: 'P2', cuadrilla: 0, cantidad: 10.0000, pu: 4.50, parcial: 45.00, tipo: 'MT', color: '#00f0ff' }
    ]
  },
  {
    nombre: 'CARTEL DE OBRA 3.60 X 7.20 M',
    unidad: 'UND',
    cu: 2309.66,
    rendimiento: 1,
    mo: 300.00,
    mt: 2009.66,
    eq: 0.00,
    sc: 0.00,
    sp: 0.00,
    insumos: [
      { nombre: 'OPERARIO', unidad: 'HH', cuadrilla: 1.0000, cantidad: 8.0000, pu: 19.23, parcial: 153.84, tipo: 'MO', color: '#f97316' },
      { nombre: 'GIGANTOGRAFIA IMPRESA', unidad: 'M2', cuadrilla: 0, cantidad: 26.0000, pu: 25.00, parcial: 650.00, tipo: 'MT', color: '#00f0ff' }
    ]
  },
  {
    nombre: 'LIMPIEZA MANUAL DE TERRENO',
    unidad: 'M2',
    cu: 3.41,
    rendimiento: 40,
    mo: 3.41,
    mt: 0.00,
    eq: 0.00,
    sc: 0.00,
    sp: 0.00,
    insumos: [
      { nombre: 'PEON', unidad: 'HH', cuadrilla: 1.0000, cantidad: 0.2000, pu: 14.33, parcial: 2.87, tipo: 'MO', color: '#f97316' }
    ]
  },
  {
    nombre: 'TRAZO Y REPLANTEO DE EJES Y NIVELES',
    unidad: 'M2',
    cu: 2.27,
    rendimiento: 500,
    mo: 1.50,
    mt: 0.77,
    eq: 0.00,
    sc: 0.00,
    sp: 0.00,
    insumos: [
      { nombre: 'TOPOGRAFO', unidad: 'HH', cuadrilla: 1.0000, cantidad: 0.0160, pu: 25.00, parcial: 0.40, tipo: 'MO', color: '#f97316' },
      { nombre: 'PEON', unidad: 'HH', cuadrilla: 2.0000, cantidad: 0.0320, pu: 14.33, parcial: 0.46, tipo: 'MO', color: '#f97316' }
    ]
  }
];

export const Budgets: React.FC = () => {
  const [budgets, setBudgets] = useState<Budget[]>(() => {
    const saved = localStorage.getItem('infrasuite_budgets_v3');
    if (!saved) return INITIAL_BUDGETS;

    try {
      return repairMojibakeValue(JSON.parse(saved)) as Budget[];
    } catch {
      return INITIAL_BUDGETS;
    }
  });
  
  const [viewState, setViewState] = useState<'list' | 'editor'>('list');
  const [activeBudget, setActiveBudget] = useState<Budget | null>(null);
  const [openBudgetIds, setOpenBudgetIds] = useState<string[]>([]);
  const [selectedPartidaId, setSelectedPartidaId] = useState<string | null>(null);
  const [sidebarTab, setSidebarTab] = useState('Presupuesto APU');
  const [isInfraCostSidebarCollapsed, setIsInfraCostSidebarCollapsed] = useState(false);
  const [partidaColumnWidths, setPartidaColumnWidths] = useState<Record<PartidaColumnKey, number>>(DEFAULT_PARTIDA_COLUMN_WIDTHS);
  const [apuColumnWidths, setApuColumnWidths] = useState<Record<ApuColumnKey, number>>(DEFAULT_APU_COLUMN_WIDTHS);
  const [apuPanelHeight, setApuPanelHeight] = useState<number>(() => {
    const saved = localStorage.getItem('infrasuite_apuPanelHeight');
    return saved ? parseInt(saved, 10) : 320;
  });
  const [apuZoom, setApuZoom] = useState<number>(() => {
    const saved = localStorage.getItem('infrasuite_apuZoom');
    return saved ? parseFloat(saved) : 1;
  });
  const { user } = useAuth();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('TODOS LOS PRESUPUESTOS');
  const [isLoading, setIsLoading] = useState(true);

  // Modals status
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isAddInsumoOpen, setIsAddInsumoOpen] = useState(false);
  const [isAddPartidaOpen, setIsAddPartidaOpen] = useState(false);
  
  // "Datos Generales" Modal State
  const [isDatosGeneralesOpen, setIsDatosGeneralesOpen] = useState(false);
  const [dgActiveTab, setDgActiveTab] = useState<'general' | 'subpresupuestos'>('general');

  // "Catálogo de Insumos" Modal State
  const [isCatalogoInsumosOpen, setIsCatalogoInsumosOpen] = useState(false);
  const [ciSearchTerm, setCiSearchTerm] = useState('');
  const [ciSelectedTipo, setCiSelectedTipo] = useState('TODOS');

  // "Catálogo de Partidas" Modal State
  const [isCatalogoPartidasOpen, setIsCatalogoPartidasOpen] = useState(false);
  const [cpSearchTerm, setCpSearchTerm] = useState('');
  const [cpSelectedPartidaIndex, setCpSelectedPartidaIndex] = useState(0);

  // "Lista de Insumos" Modal State
  const [isListaInsumosOpen, setIsListaInsumosOpen] = useState(false);

  // "Gastos Generales" Modal State
  const [isGastosGeneralesOpen, setIsGastosGeneralesOpen] = useState(false);
  const [ggTipo, setGgTipo] = useState<'FIJOS' | 'VARIABLES'>('FIJOS');
  const [ggFijosItems, setGgFijosItems] = useState<{ item: string; titulo: string; parcial: number }[]>([
    { item: '01.01', titulo: 'GASTOS FINANCIEROS Y SEGUROS', parcial: 1500.00 },
    { item: '01.02', titulo: 'GASTOS DE LICITACION Y CONTRATACION', parcial: 800.00 },
    { item: '01.03', titulo: 'OTROS GASTOS FIJOS', parcial: 500.00 }
  ]);
  const [ggVariablesItems, setGgVariablesItems] = useState<{ item: string; titulo: string; parcial: number }[]>([
    { item: '02.01', titulo: 'PERSONAL PROFESIONAL Y TECNICO', parcial: 4500.00 },
    { item: '02.02', titulo: 'ALQUILER DE EQUIPOS DE OFICINA', parcial: 600.00 },
    { item: '02.03', titulo: 'GASTOS DE ADMINISTRACION EN OBRA', parcial: 1200.00 }
  ]);

  // "Pie de Presupuesto" Modal State
  const [isPiePresupuestoOpen, setIsPiePresupuestoOpen] = useState(false);
  const [pieRows, setPieRows] = useState<{ variable: string; descripcion: string; formula: string; iu: string; resaltar: boolean }[]>([
    { variable: 'CD', descripcion: 'COSTO DIRECTO', formula: '', iu: '', resaltar: true },
    { variable: 'GG', descripcion: 'GASTOS GENERALES 10%', formula: 'CD * 0.10', iu: '39', resaltar: false },
    { variable: 'UTI', descripcion: 'UTILIDAD 10%', formula: 'CD * 0.10', iu: '39', resaltar: false },
    { variable: 'ST', descripcion: 'SUB TOTAL', formula: 'CD + GG + UTI', iu: '', resaltar: true },
    { variable: 'IGV', descripcion: 'IGV 18%', formula: 'ST * 0.18', iu: '', resaltar: false },
    { variable: 'TOTAL', descripcion: 'TOTAL PRESUPUESTO', formula: 'ST + IGV', iu: '', resaltar: true }
  ]);

  // "Fórmula Polinómica" Modal State
  const [isFormulaPolinomicaOpen, setIsFormulaPolinomicaOpen] = useState(false);
  const [formulaPolinomicaRows, setFormulaPolinomicaRows] = useState<{ iu: string; coeficiente: number; monomio: number; factor: string; simbolo: string }[]>([
    { iu: '37 : HERRAMIENTA MANUAL', coeficiente: 0.025, monomio: 1, factor: '', simbolo: 'HM' },
    { iu: '39 : INDICE DE PRECIOS AL CONSUMIDOR (INEI)', coeficiente: 0.439, monomio: 1, factor: '', simbolo: 'IPC' },
    { iu: '47 : MANO DE OBRA (INCLUYE LEYES SOCIALES)', coeficiente: 0.536, monomio: 1, factor: '', simbolo: 'MO' }
  ]);

  // User Preferences / Configuraciones
  const [showGridlines, setShowGridlines] = useState<boolean>(() => {
    const saved = localStorage.getItem('infrasuite_show_gridlines');
    return saved !== null ? saved === 'true' : true;
  });
  const [isConfiguracionOpen, setIsConfiguracionOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem('infrasuite_show_gridlines', showGridlines.toString());
  }, [showGridlines]);

  // Gantt Scheduling State
  const [ganttData, setGanttData] = useState<{ [key: string]: { duracion: number; inicio: string; fin: string; predecesora: string } }>({
    'p_1': { duracion: 8, inicio: '2026-01-07', fin: '2026-01-14', predecesora: '' },
    'p_2': { duracion: 1, inicio: '2026-01-07', fin: '2026-01-07', predecesora: '' },
    'p_3': { duracion: 1, inicio: '2026-01-07', fin: '2026-01-07', predecesora: '' },
    'p_4': { duracion: 5, inicio: '2026-01-07', fin: '2026-01-11', predecesora: '' },
    'p_5': { duracion: 4, inicio: '2026-01-07', fin: '2026-01-10', predecesora: '' },
    'p_6': { duracion: 3, inicio: '2026-01-07', fin: '2026-01-09', predecesora: '' },
    'p_7': { duracion: 1, inicio: '2026-01-07', fin: '2026-01-07', predecesora: '' },
    'p_8': { duracion: 8, inicio: '2026-01-07', fin: '2026-01-14', predecesora: '' },
    'p_9': { duracion: 8, inicio: '2026-01-07', fin: '2026-01-14', predecesora: '' },
    'p_10': { duracion: 2, inicio: '2026-01-07', fin: '2026-01-08', predecesora: '' }
  });

  // Extra Sidebar Modals State
  const [specsText, setSpecsText] = useState<{ [key: string]: string }>({});
  const [cotizacionesData, setCotizacionesData] = useState<{ [key: string]: any }>({});
  const [selectedLocalidad, setSelectedLocalidad] = useState('Iquitos');
  const [selectedSpecPartidaId, setSelectedSpecPartidaId] = useState<string | null>(null);

  // Derived: Especificaciones Técnicas
  const selectedSpecPartida = activeBudget?.partidas.find(p => p.id === selectedSpecPartidaId) ?? null;
  const specKey = selectedSpecPartida ? `spec_${activeBudget!.id}_${selectedSpecPartida.id}` : '';
  const specValue = specKey ? (specsText[specKey] ?? '') : '';

  const downloadActiveBudgetDatabase = () => {
    if (!activeBudget) return;
    const dataStr = JSON.stringify(activeBudget, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `${activeBudget.nombre.toLowerCase().replace(/[^a-z0-9]/g, '_')}_db.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    alert('Base de datos exportada y descargada exitosamente en formato JSON.');
  };

  // Form states (Budget creation)
  const [nombre, setNombre] = useState('');
  const [cliente, setCliente] = useState('');
  const [fechaBase, setFechaBase] = useState(new Date().toISOString().split('T')[0]);
  const [grupo, setGrupo] = useState('EDIFICACIONES');

  // Form states (Datos Generales Modal)
  const [dgGrupo, setDgGrupo] = useState('TODOS LOS PRESUPUESTOS');
  const [dgPresupuesto, setDgPresupuesto] = useState('');
  const [dgCliente, setDgCliente] = useState('');
  const [dgDireccion, setDgDireccion] = useState('');
  const [dgDistrito, setDgDistrito] = useState('');
  const [dgProvincia, setDgProvincia] = useState('');
  const [dgDepartamento, setDgDepartamento] = useState('');
  const [dgFechaBase, setDgFechaBase] = useState('');
  const [dgJornada, setDgJornada] = useState(8);
  const [dgMoneda, setDgMoneda] = useState<'SOLES' | 'DOLARES'>('SOLES');
  const [dgSubPresupuestos, setDgSubPresupuestos] = useState<string[]>([]);
  const [newSubPresupuesto, setNewSubPresupuesto] = useState('');

  // Form states (Insumo)
  const [insumoNombre, setInsumoNombre] = useState('');
  const [insumoUnidad, setInsumoUnidad] = useState('HH');
  const [insumoCuadrilla, setInsumoCuadrilla] = useState('1');
  const [insumoPU, setInsumoPU] = useState('10');
  const [insumoTipo, setInsumoTipo] = useState<'MO' | 'MT' | 'EQ' | 'SC' | 'SP'>('MO');

  // Form states (Partida)
  const [partidaNombre, setPartidaNombre] = useState('');
  const [partidaUnidad, setPartidaUnidad] = useState('M2');
  const [partidaMetrado, setPartidaMetrado] = useState('1');
  const [partidaEsTitulo, setPartidaEsTitulo] = useState(false);
  const [partidaRendimiento, setPartidaRendimiento] = useState('1');

  // Context Menu State
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    localStorage.setItem('infrasuite_budgets_v3', JSON.stringify(budgets));
  }, [budgets]);

  useEffect(() => {
    try {
      localStorage.setItem('infrasuite_apuPanelHeight', String(apuPanelHeight));
    } catch {}
  }, [apuPanelHeight]);

  useEffect(() => {
    try {
      localStorage.setItem('infrasuite_apuZoom', String(apuZoom));
    } catch {}
  }, [apuZoom]);

  // Persist preferences to user's Firestore document (with local fallback handled by db.updateDoc)
  useEffect(() => {
    if (!user) return;
    const save = async () => {
      try {
        await db.updateDoc('users', user.uid, { preferences: { apuZoom, apuPanelHeight } });
      } catch (e) {
        // ignore failures
        console.warn('Could not persist user preferences to DB:', e);
      }
    };
    save();
  }, [apuZoom, apuPanelHeight, user]);

  // Load preferences from user's Firestore/local user doc (if available)
  useEffect(() => {
    if (!user) return;
    let mounted = true;
    const load = async () => {
      try {
        const users = await db.getDocs('users');
        const me = users.find((u: any) => u.id === user.uid || u.uid === user.uid);
        if (!me || !me.preferences) return;
        if (!mounted) return;
        if (typeof me.preferences.apuZoom === 'number') setApuZoom(me.preferences.apuZoom);
        if (typeof me.preferences.apuPanelHeight === 'number') setApuPanelHeight(me.preferences.apuPanelHeight);
      } catch (e) {
        console.warn('Could not load preferences from DB:', e);
      }
    };
    load();
    return () => { mounted = false; };
  }, [user]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 600);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpenId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Sync back activeBudget changes to the budgets list
  const updateBudgetsList = (updatedBudget: Budget) => {
    const updatedList = budgets.map(b => b.id === updatedBudget.id ? updatedBudget : b);
    setBudgets(updatedList);
    setActiveBudget(updatedBudget);
  };

  // APU Cost calculation helper formulas
  const getInsumoCantidad = (insumo: Insumo, rendimiento: number) => {
    if (insumo.unidad === 'GLB' || insumo.unidad === 'UND' || insumo.tipo === 'SC' || insumo.tipo === 'MT') {
      return insumo.cuadrilla;
    }
    return rendimiento > 0 ? (insumo.cuadrilla * 8) / rendimiento : 0;
  };

  const getInsumoParcial = (insumo: Insumo, rendimiento: number) => {
    return getInsumoCantidad(insumo, rendimiento) * insumo.pu;
  };

  const getPartidaCU = (partida: Partida) => {
    if (partida.esTitulo) return 0;
    return partida.insumos.reduce((sum, ins) => sum + getInsumoParcial(ins, partida.rendimiento), 0);
  };

  const getPartidaParcial = (partida: Partida) => {
    return partida.metrado * getPartidaCU(partida);
  };

  const getBudgetCD = (budget: Budget) => {
    return budget.partidas.reduce((sum, part) => sum + getPartidaParcial(part), 0);
  };

  // APU breakdown indicators (MO, MT, EQ, SC, SP)
  const getAPUBreakdown = (partida: Partida) => {
    const breakdown = { MO: 0, MT: 0, EQ: 0, SC: 0, SP: 0 };
    if (partida.esTitulo) return breakdown;
    partida.insumos.forEach(ins => {
      breakdown[ins.tipo] += getInsumoParcial(ins, partida.rendimiento);
    });
    return breakdown;
  };

  const activateBudget = (budget: Budget) => {
    setActiveBudget(budget);
    setViewState('editor');
    const firstPartida = budget.partidas.find(p => !p.esTitulo) || budget.partidas[0];
    setSelectedPartidaId(firstPartida?.id || null);
  };

  const handleSelectBudgetTab = (budgetId: string) => {
    const budget = budgets.find(b => b.id === budgetId);
    if (budget) activateBudget(budget);
  };

  const handleCloseBudgetTab = (budgetId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const currentIndex = openBudgetIds.indexOf(budgetId);
    const nextOpenIds = openBudgetIds.filter(id => id !== budgetId);
    setOpenBudgetIds(nextOpenIds);

    if (activeBudget?.id !== budgetId) return;

    const nextActiveId = nextOpenIds[Math.min(currentIndex, nextOpenIds.length - 1)];
    const nextBudget = budgets.find(b => b.id === nextActiveId);

    if (nextBudget) {
      activateBudget(nextBudget);
    } else {
      setActiveBudget(null);
      setSelectedPartidaId(null);
      setViewState('list');
    }
  };

  const startPartidaColumnResize = (key: PartidaColumnKey, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const startX = e.clientX;
    const startWidth = partidaColumnWidths[key];
    const minWidth = key === 'descripcion' ? 240 : 72;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      setPartidaColumnWidths(prev => ({
        ...prev,
        [key]: Math.max(minWidth, startWidth + moveEvent.clientX - startX)
      }));
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const startApuColumnResize = (key: ApuColumnKey, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const startX = e.clientX;
    const startWidth = apuColumnWidths[key];
    const minWidth = key === 'nombre' ? 180 : 50;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      setApuColumnWidths(prev => ({
        ...prev,
        [key]: Math.max(minWidth, startWidth + moveEvent.clientX - startX)
      }));
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const startApuHeightResize = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const startY = e.clientY;
    const startHeight = apuPanelHeight;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaY = moveEvent.clientY - startY;
      setApuPanelHeight(Math.max(160, Math.min(640, startHeight - deltaY)));
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleOpenMenu = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    setMenuPosition({
      x: window.innerWidth - rect.right > 200 ? rect.left : rect.left - 180,
      y: rect.bottom + window.scrollY
    });
    setMenuOpenId(id);
  };

  const handleCreateBudget = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre) return;
    const newB: Budget = {
      id: 'b_' + Math.random().toString(36).substring(2, 9),
      nombre,
      cliente: cliente || 'Sin cliente asignado',
      fechaBase,
      grupo,
      categoria: 'Recientes',
      direccion: '',
      distrito: '',
      provincia: '',
      departamento: '',
      jornada: 8,
      moneda: 'SOLES',
      subPresupuestos: ['SUB PRESUPUESTO 1'],
      partidas: []
    };
    setBudgets([newB, ...budgets]);
    setIsCreateOpen(false);
    resetBudgetForm();
  };

  const handleEditBudget = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeBudget) return;
    const updated = {
      ...activeBudget,
      nombre,
      cliente,
      fechaBase,
      grupo
    };
    updateBudgetsList(updated);
    setIsEditOpen(false);
  };

  const handleDuplicateBudget = (id: string) => {
    const target = budgets.find((b) => b.id === id);
    if (!target) return;
    const duplicated: Budget = {
      ...target,
      id: 'b_' + Math.random().toString(36).substring(2, 9),
      nombre: `${target.nombre} (Copia)`,
      categoria: 'Recientes'
    };
    setBudgets([duplicated, ...budgets]);
    setMenuOpenId(null);
  };

  const handleDeleteBudget = (id: string) => {
    if (confirm('¿Estás seguro de que deseas eliminar este presupuesto?')) {
      setBudgets(budgets.filter((b) => b.id !== id));
      setOpenBudgetIds(openBudgetIds.filter(openId => openId !== id));
      if (activeBudget?.id === id) {
        setActiveBudget(null);
        setSelectedPartidaId(null);
        setViewState('list');
      }
    }
    setMenuOpenId(null);
  };

  const startEditBudget = (b: Budget) => {
    setActiveBudget(b);
    setNombre(b.nombre);
    setCliente(b.cliente);
    setFechaBase(b.fechaBase);
    setGrupo(b.grupo);
    setIsEditOpen(true);
    setMenuOpenId(null);
  };

  const resetBudgetForm = () => {
    setNombre('');
    setCliente('');
    setFechaBase(new Date().toISOString().split('T')[0]);
    setGrupo('EDIFICACIONES');
  };

  // Opens the Datos Generales floating window
  const openDatosGenerales = () => {
    if (!activeBudget) return;
    setDgGrupo(activeBudget.grupo || 'TODOS LOS PRESUPUESTOS');
    setDgPresupuesto(activeBudget.nombre);
    setDgCliente(activeBudget.cliente);
    setDgDireccion(activeBudget.direccion || '');
    setDgDistrito(activeBudget.distrito || '');
    setDgProvincia(activeBudget.provincia || '');
    setDgDepartamento(activeBudget.departamento || '');
    setDgFechaBase(activeBudget.fechaBase);
    setDgJornada(activeBudget.jornada || 8);
    setDgMoneda(activeBudget.moneda || 'SOLES');
    setDgSubPresupuestos(activeBudget.subPresupuestos || ['SUB PRESUPUESTO 1']);
    setDgActiveTab('general');
    setIsDatosGeneralesOpen(true);
  };

  // Saves Datos Generales modal inputs
  const saveDatosGenerales = () => {
    if (!activeBudget) return;
    const updated: Budget = {
      ...activeBudget,
      grupo: dgGrupo,
      nombre: dgPresupuesto,
      cliente: dgCliente,
      direccion: dgDireccion,
      distrito: dgDistrito,
      provincia: dgProvincia,
      departamento: dgDepartamento,
      fechaBase: dgFechaBase,
      jornada: dgJornada,
      moneda: dgMoneda,
      subPresupuestos: dgSubPresupuestos
    };
    updateBudgetsList(updated);
    setIsDatosGeneralesOpen(false);
  };

  // APU Insumos Modifiers
  const handleUpdateInsumoField = (insumoId: string, field: 'cuadrilla' | 'pu', value: number) => {
    if (!activeBudget || !selectedPartidaId) return;
    const updatedPartidas = activeBudget.partidas.map(p => {
      if (p.id === selectedPartidaId) {
        return {
          ...p,
          insumos: p.insumos.map(i => i.id === insumoId ? { ...i, [field]: value } : i)
        };
      }
      return p;
    });
    updateBudgetsList({ ...activeBudget, partidas: updatedPartidas });
  };

  const handleUpdateRendimiento = (value: number) => {
    if (!activeBudget || !selectedPartidaId) return;
    const updatedPartidas = activeBudget.partidas.map(p => {
      if (p.id === selectedPartidaId) {
        return { ...p, rendimiento: value };
      }
      return p;
    });
    updateBudgetsList({ ...activeBudget, partidas: updatedPartidas });
  };

  const handleUpdatePartidaMetrado = (partidaId: string, value: number) => {
    if (!activeBudget) return;
    const updatedPartidas = activeBudget.partidas.map(p => {
      if (p.id === partidaId) {
        return { ...p, metrado: value };
      }
      return p;
    });
    updateBudgetsList({ ...activeBudget, partidas: updatedPartidas });
  };

  const handleAddInsumo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeBudget || !selectedPartidaId || !insumoNombre) return;

    const newInsumo: Insumo = {
      id: 'i_' + Math.random().toString(36).substring(2, 9),
      nombre: insumoNombre,
      unidad: insumoUnidad,
      cuadrilla: parseFloat(insumoCuadrilla) || 0,
      pu: parseFloat(insumoPU) || 0,
      tipo: insumoTipo
    };

    const updatedPartidas = activeBudget.partidas.map(p => {
      if (p.id === selectedPartidaId) {
        return {
          ...p,
          insumos: [...p.insumos, newInsumo]
        };
      }
      return p;
    });

    updateBudgetsList({ ...activeBudget, partidas: updatedPartidas });
    setIsAddInsumoOpen(false);
    // Reset fields
    setInsumoNombre('');
    setInsumoCuadrilla('1');
    setInsumoPU('10');
  };

  const handleAddPartida = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeBudget || !partidaNombre) return;

    const nextIndex = activeBudget.partidas.length + 1;
    const newPartida: Partida = {
      id: 'p_' + Math.random().toString(36).substring(2, 9),
      item: nextIndex.toString(),
      nombre: partidaNombre,
      unidad: partidaEsTitulo ? '' : partidaUnidad,
      metrado: partidaEsTitulo ? 0 : parseFloat(partidaMetrado) || 0,
      esTitulo: partidaEsTitulo,
      rendimiento: parseFloat(partidaRendimiento) || 1,
      insumos: []
    };

    updateBudgetsList({ ...activeBudget, partidas: [...activeBudget.partidas, newPartida] });
    setIsAddPartidaOpen(false);
    setPartidaNombre('');
    setPartidaEsTitulo(false);
    setPartidaMetrado('1');
    setPartidaRendimiento('1');
  };

  const handleOpenBudgetEditor = (b: Budget) => {
    setOpenBudgetIds(prev => prev.includes(b.id) ? prev : [...prev, b.id]);
    activateBudget(b);
  };

  // Filter list
  const filteredBudgets = budgets.filter((b) => {
    const matchesSearch = b.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          b.cliente.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGroup = selectedGroup === 'TODOS LOS PRESUPUESTOS' || b.grupo === selectedGroup;
    return matchesSearch && matchesGroup;
  });

  const recientes = filteredBudgets.filter(b => b.categoria === 'Recientes');
  const antiguos = filteredBudgets.filter(b => b.categoria === 'Antiguos');
  const groups = ['TODOS LOS PRESUPUESTOS', 'EDIFICACIONES', 'CARRETERAS', 'SANEAMIENTO', 'MINERÍA'];

  const selectedPartida = activeBudget?.partidas.find(p => p.id === selectedPartidaId);
  const apuBreakdown = selectedPartida ? getAPUBreakdown(selectedPartida) : { MO: 0, MT: 0, EQ: 0, SC: 0, SP: 0 };
  const openBudgets = openBudgetIds
    .map(id => budgets.find(b => b.id === id))
    .filter((budget): budget is Budget => Boolean(budget));
  const partidaTableWidth = Object.values(partidaColumnWidths).reduce((sum, width) => sum + width, 0);
  const partidaColumnStyle = (key: PartidaColumnKey, extra: React.CSSProperties = {}): React.CSSProperties => ({
    ...thStyle,
    width: `${partidaColumnWidths[key]}px`,
    minWidth: `${partidaColumnWidths[key]}px`,
    maxWidth: `${partidaColumnWidths[key]}px`,
    position: 'relative',
    ...extra
  });
  const renderPartidaHeader = (key: PartidaColumnKey, label: string, extra: React.CSSProperties = {}) => (
    <th key={key} style={partidaColumnStyle(key, extra)}>
      <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</span>
      <span
        role="separator"
        aria-orientation="vertical"
        title="Ajustar columna"
        onMouseDown={(e) => startPartidaColumnResize(key, e)}
        className="resize-handle"
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: '8px',
          height: '100%',
          cursor: 'col-resize',
          userSelect: 'none',
          zIndex: 1
        }}
      />
    </th>
  );

  const apuTableWidth = Object.values(apuColumnWidths).reduce((sum, width) => sum + width, 0);
  const apuColumnStyle = (key: ApuColumnKey, extra: React.CSSProperties = {}): React.CSSProperties => ({
    ...thStyle,
    width: `${apuColumnWidths[key]}px`,
    minWidth: `${apuColumnWidths[key]}px`,
    maxWidth: `${apuColumnWidths[key]}px`,
    position: 'relative',
    ...extra
  });
  const renderApuHeader = (key: ApuColumnKey, label: string, extra: React.CSSProperties = {}) => (
    <th key={key} style={apuColumnStyle(key, extra)}>
      <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</span>
      <span
        role="separator"
        aria-orientation="vertical"
        title="Ajustar columna"
        onMouseDown={(e) => startApuColumnResize(key, e)}
        className="resize-handle"
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: '8px',
          height: '100%',
          cursor: 'col-resize',
          userSelect: 'none',
          zIndex: 1
        }}
      />
    </th>
  );

  // Render list view
  if (viewState === 'list') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 52px)', background: 'var(--bg-main)', overflow: 'hidden', width: '100%' }}>
        {/* Global Tabs Bar */}
        <div style={{
          height: '48px',
          background: 'var(--bg-surface)',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          padding: '0 12px',
          gap: '8px',
          flexShrink: 0
        }}>
          <button
            onClick={() => setViewState('list')}
            style={{
              padding: '6px 14px',
              background: 'var(--bg-surface-elevated)',
              border: '1px solid var(--border-color)',
              borderBottom: 'none',
              borderRadius: '6px 6px 0 0',
              color: 'var(--color-primary)',
              fontSize: '0.82rem',
              cursor: 'pointer',
              fontWeight: 700
            }}
          >
            📂 PRESUPUESTOS
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflowX: 'auto', paddingRight: 8 }}>
            {openBudgets.map(b => (
              <div key={b.id} style={{ position: 'relative', display: 'flex', alignItems: 'center', marginRight: 6 }}>
                <button
                  onClick={() => handleSelectBudgetTab(b.id)}
                  title={b.nombre}
                  style={{
                    padding: '6px 10px 6px 12px',
                    background: 'transparent',
                    border: '1px solid var(--border-color)',
                    borderBottom: 'none',
                    borderRadius: '6px 6px 0 0',
                    color: 'var(--text-secondary)',
                    fontSize: '0.82rem',
                    cursor: 'pointer',
                    fontWeight: 700,
                    whiteSpace: 'nowrap',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <span style={{ fontSize: '0.98rem' }}>📊</span>
                  <span style={{ maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', display: 'inline-block' }}>{b.nombre}</span>
                </button>
                <button
                  onClick={(e) => handleCloseBudgetTab(b.id, e as any)}
                  title="Cerrar pestaña"
                  style={{
                    position: 'absolute',
                    right: -6,
                    top: 2,
                    width: 20,
                    height: 20,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 10,
                    border: '1px solid rgba(255,255,255,0.06)',
                    background: 'rgba(0,0,0,0.4)',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    fontSize: '0.75rem',
                    zIndex: 2
                  }}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="content-container" style={{ position: 'relative', overflowY: 'auto', flexGrow: 1 }}>
        {/* Top Filter and Search Bar */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '20px',
          background: 'rgba(12, 14, 21, 0.4)',
          padding: '20px 24px',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-color)',
          backdropFilter: 'blur(10px)'
        }}>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
            <Button onClick={() => { resetBudgetForm(); setIsCreateOpen(true); }} style={{ background: 'var(--grad-primary)', border: 'none' }}>
              ➕ Nuevo Presupuesto
            </Button>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Grupo:</span>
              <select
                value={selectedGroup}
                onChange={(e) => setSelectedGroup(e.target.value)}
                style={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-primary)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '10px 14px',
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-sans)',
                  outline: 'none'
                }}
              >
                {groups.map(g => (
                  <option key={g} value={g} style={{ background: 'var(--bg-surface)' }}>{g}</option>
                ))}
              </select>
            </div>
            
            <Button variant="secondary" onClick={() => { setIsLoading(true); setTimeout(() => setIsLoading(false), 500); }}>
              🔄 Actualizar
            </Button>
          </div>

          <div style={{ width: '100%', maxWidth: '360px' }}>
            <Input
              placeholder="🔍 Buscar presupuesto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ margin: 0 }}
            />
          </div>
        </div>

        {/* Render list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          {isLoading ? (
            <Card>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '16px' }}>
                <div className="skeleton" style={{ height: '40px', width: '200px', borderRadius: '4px' }}></div>
                <div className="skeleton" style={{ height: '80px', width: '100%', borderRadius: '8px' }}></div>
                <div className="skeleton" style={{ height: '80px', width: '100%', borderRadius: '8px' }}></div>
              </div>
            </Card>
          ) : (
            <>
              {recientes.length > 0 && (
                <div>
                  <h3 style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: '1.2rem',
                    color: 'var(--color-primary)',
                    marginBottom: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <span>⚡</span> Recientes
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {recientes.map(b => (
                      <BudgetRow key={b.id} budget={b} onOpenMenu={handleOpenMenu} onOpen={handleOpenBudgetEditor} getCD={getBudgetCD} />
                    ))}
                  </div>
                </div>
              )}

              <div>
                <h3 style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '1.2rem',
                  color: 'var(--text-secondary)',
                  marginBottom: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <span>📁</span> Antiguos
                </h3>
                {antiguos.length === 0 && recientes.length === 0 ? (
                  <div style={{
                    padding: '48px',
                    textAlign: 'center',
                    color: 'var(--text-muted)',
                    border: '1px dashed var(--border-color)',
                    borderRadius: 'var(--radius-md)',
                    background: 'rgba(0,0,0,0.1)'
                  }}>
                    No se encontraron presupuestos en esta categoría.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {antiguos.map(b => (
                      <BudgetRow key={b.id} budget={b} onOpenMenu={handleOpenMenu} onOpen={handleOpenBudgetEditor} getCD={getBudgetCD} />
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Context Menu */}
        {menuOpenId && (
          <div
            ref={menuRef}
            style={{
              position: 'absolute',
              top: `${menuPosition.y - 120}px`,
              left: `${menuPosition.x - 30}px`,
              zIndex: 9999,
              background: 'var(--bg-surface-elevated)',
              border: '1px solid var(--border-color)',
              boxShadow: 'var(--shadow-lg), 0 0 20px rgba(0, 240, 255, 0.05)',
              borderRadius: 'var(--radius-md)',
              padding: '8px 0',
              width: '180px',
              animation: 'fadeIn 0.15s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
          >
            <button
              onClick={() => {
                const b = budgets.find(x => x.id === menuOpenId);
                if (b) handleOpenBudgetEditor(b);
                setMenuOpenId(null);
              }}
              style={menuItemStyle}
            >
              📂 Abrir presupuesto
            </button>
            <button
              onClick={() => {
                const b = budgets.find(x => x.id === menuOpenId);
                if (b) startEditBudget(b);
              }}
              style={menuItemStyle}
            >
              📝 Datos generales
            </button>
            <button
              onClick={() => handleDuplicateBudget(menuOpenId)}
              style={menuItemStyle}
            >
              📋 Duplicar
            </button>
            <button
              onClick={() => { alert(`Presupuesto enviado con éxito.`); setMenuOpenId(null); }}
              style={menuItemStyle}
            >
              ✉️ Enviar presupuesto
            </button>
            <div style={{ height: '1px', background: 'var(--border-color)', margin: '4px 0' }} />
            <button
              onClick={() => handleDeleteBudget(menuOpenId)}
              style={{ ...menuItemStyle, color: 'var(--color-danger)' }}
            >
              🗑️ Eliminar
            </button>
          </div>
        )}

        {/* Modal - Create Budget */}
        <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Crear Nuevo Presupuesto">
          <form onSubmit={handleCreateBudget} className="login-form">
            <Input
              label="Nombre del Presupuesto *"
              placeholder="Ej. CAMBIO DE COBERTURA DE CUMBRERA"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              required
            />
            <Input
              label="Cliente / Entidad"
              placeholder="Ej. GOBIERNO REGIONAL DE UCAYALI"
              value={cliente}
              onChange={(e) => setCliente(e.target.value)}
            />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <Input
                type="date"
                label="Fecha Base *"
                value={fechaBase}
                onChange={(e) => setFechaBase(e.target.value)}
                required
              />
              <Select
                label="Grupo"
                value={grupo}
                onChange={(e: any) => setGrupo(e.target.value)}
                options={groups.filter(g => g !== 'TODOS LOS PRESUPUESTOS').map(g => ({ value: g, label: g }))}
              />
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
              <Button type="button" variant="secondary" onClick={() => setIsCreateOpen(false)} style={{ flex: 1 }}>
                Cancelar
              </Button>
              <Button type="submit" style={{ flex: 1, background: 'var(--grad-primary)', border: 'none' }}>
                Crear Presupuesto
              </Button>
            </div>
          </form>
        </Modal>

        {/* Modal - Edit Budget */}
        <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title="Modificar Datos Generales">
          <form onSubmit={handleEditBudget} className="login-form">
            <Input
              label="Nombre del Presupuesto *"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              required
            />
            <Input
              label="Cliente / Entidad"
              value={cliente}
              onChange={(e) => setCliente(e.target.value)}
            />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <Input
                type="date"
                label="Fecha Base *"
                value={fechaBase}
                onChange={(e) => setFechaBase(e.target.value)}
                required
              />
              <Select
                label="Grupo"
                value={grupo}
                onChange={(e: any) => setGrupo(e.target.value)}
                options={groups.filter(g => g !== 'TODOS LOS PRESUPUESTOS').map(g => ({ value: g, label: g }))}
              />
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
              <Button type="button" variant="secondary" onClick={() => setIsEditOpen(false)} style={{ flex: 1 }}>
                Cancelar
              </Button>
              <Button type="submit" style={{ flex: 1 }}>
                Guardar Cambios
              </Button>
            </div>
          </form>
        </Modal>
      </div>
      </div>
    );
  }

  // Render budget sheet editor view
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 52px)', background: 'var(--bg-main)', overflow: 'hidden', width: '100%' }}>
      {/* Global Tabs Bar */}
      <div style={{
        height: '48px',
        background: 'var(--bg-surface)',
        borderBottom: '1px solid var(--border-color)',
        display: 'flex',
        alignItems: 'center',
        padding: '0 12px',
        gap: '8px',
        flexShrink: 0
      }}>
        <button
          onClick={() => setViewState('list')}
          style={{
            padding: '6px 14px',
            background: 'transparent',
            border: '1px solid var(--border-color)',
            borderBottom: 'none',
            borderRadius: '6px 6px 0 0',
            color: 'var(--text-secondary)',
            fontSize: '0.82rem',
            cursor: 'pointer',
            fontWeight: 700
          }}
        >
          📂 PRESUPUESTOS
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflowX: 'auto', paddingRight: 8 }}>
          {openBudgets.map(b => (
            <div key={b.id} style={{ position: 'relative', display: 'flex', alignItems: 'center', marginRight: 6 }}>
              <button
                onClick={() => handleSelectBudgetTab(b.id)}
                title={b.nombre}
                style={{
                  padding: '6px 10px 6px 12px',
                  background: activeBudget?.id === b.id ? 'var(--bg-surface-elevated)' : 'transparent',
                  border: '1px solid var(--border-color)',
                  borderBottom: activeBudget?.id === b.id ? 'none' : undefined,
                  borderRadius: '6px 6px 0 0',
                  color: activeBudget?.id === b.id ? 'var(--color-primary)' : 'var(--text-secondary)',
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  fontWeight: 700,
                  whiteSpace: 'nowrap',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <span style={{ fontSize: '0.98rem' }}>📊</span>
                <span style={{ maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', display: 'inline-block' }}>{b.nombre}</span>
              </button>
              <button
                onClick={(e) => handleCloseBudgetTab(b.id, e as any)}
                title="Cerrar pestaña"
                style={{
                  position: 'absolute',
                  right: -6,
                  top: 2,
                  width: 20,
                  height: 20,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 10,
                  border: '1px solid rgba(255,255,255,0.06)',
                  background: 'rgba(0,0,0,0.4)',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  fontSize: '0.75rem',
                  zIndex: 2
                }}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', flexGrow: 1, overflow: 'hidden', width: '100%' }}>
      
      {/* 1. Contextual Sidebar */}
      <aside style={{
        width: isInfraCostSidebarCollapsed ? '72px' : '240px',
        background: 'var(--bg-surface)',
        borderRight: '1px solid var(--border-color)',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
        transition: 'width 0.18s ease'
      }}>
        <div style={{
          padding: isInfraCostSidebarCollapsed ? '18px 12px' : '24px 20px',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: isInfraCostSidebarCollapsed ? 'center' : 'flex-start',
          justifyContent: 'space-between',
          gap: '10px',
          flexDirection: isInfraCostSidebarCollapsed ? 'column' : 'row'
        }}>
          {!isInfraCostSidebarCollapsed && (
            <div style={{ minWidth: 0 }}>
              <h5 style={{ color: 'var(--color-primary)', fontWeight: 700, fontSize: '0.82rem', letterSpacing: '0.5px', textTransform: 'uppercase' }}>InfraCost Editor</h5>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                {activeBudget?.nombre}
              </p>
            </div>
          )}
          <button
            type="button"
            onClick={() => setIsInfraCostSidebarCollapsed(prev => !prev)}
            title={isInfraCostSidebarCollapsed ? 'Expandir panel' : 'Comprimir panel'}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-color)',
              background: 'rgba(255,255,255,0.02)',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              fontSize: '0.9rem'
            }}
          >
            {isInfraCostSidebarCollapsed ? '›' : '‹'}
          </button>
        </div>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px', padding: isInfraCostSidebarCollapsed ? '14px 8px' : '16px 12px' }}>
          {[
            { label: 'Presupuesto APU', icon: '📊', action: () => setSidebarTab('Presupuesto APU') },
            { label: 'Programar', icon: '📅', action: () => setSidebarTab('Programar') },
            { label: 'Datos Generales', icon: '📝', action: openDatosGenerales },
            { label: 'Catálogo de Insumos', icon: '🗂️', action: () => { setSidebarTab('Catálogo de Insumos'); setIsCatalogoInsumosOpen(true); } },
            { label: 'Catálogo de Partidas', icon: '📋', action: () => { setSidebarTab('Catálogo de Partidas'); setIsCatalogoPartidasOpen(true); } },
            { label: 'Lista de Insumos', icon: '🔍', action: () => { setSidebarTab('Lista de Insumos'); setIsListaInsumosOpen(true); } },
            { label: 'Gastos Generales', icon: '💸', action: () => { setSidebarTab('Gastos Generales'); setIsGastosGeneralesOpen(true); } },
            { label: 'Pie de presupuesto', icon: '📐', action: () => { setSidebarTab('Pie de presupuesto'); setIsPiePresupuestoOpen(true); } },
            { label: 'Fórmula Polinómica', icon: '🧬', action: () => { setSidebarTab('Fórmula Polinómica'); setIsFormulaPolinomicaOpen(true); } },
            { label: 'Cotizar', icon: '🛍️', action: () => { setSidebarTab('Cotizar'); } },
            { label: 'Especificaciones Técnicas', icon: '📄', action: () => { setSidebarTab('Especificaciones Técnicas'); } },
            { label: 'Configuraciones', icon: '⚙️', action: () => setIsConfiguracionOpen(true) },
            { label: 'Descargar Base de Datos', icon: '📥', action: downloadActiveBudgetDatabase }
          ].map(tab => (
            <button
              key={tab.label}
              onClick={tab.action}
              title={isInfraCostSidebarCollapsed ? tab.label : undefined}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: isInfraCostSidebarCollapsed ? 'center' : 'flex-start',
                gap: isInfraCostSidebarCollapsed ? 0 : '12px',
                padding: isInfraCostSidebarCollapsed ? '12px 0' : '12px 16px',
                border: 'none',
                background: sidebarTab === tab.label ? 'rgba(0, 240, 255, 0.04)' : 'transparent',
                color: sidebarTab === tab.label ? 'var(--color-primary)' : 'var(--text-secondary)',
                borderRadius: 'var(--radius-sm)',
                textAlign: 'left',
                fontFamily: 'var(--font-sans)',
                fontWeight: sidebarTab === tab.label ? 700 : 500,
                fontSize: '0.88rem',
                cursor: 'pointer',
                transition: 'all 0.15s'
              }}
            >
              <span style={{ fontSize: '1.05rem', lineHeight: 1 }}>{tab.icon}</span>
              {!isInfraCostSidebarCollapsed && <span>{tab.label}</span>}
            </button>
          ))}
        </nav>
      </aside>

      {/* 2. Main Editor Panel */}
      <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        


        {/* Top actions toolbar */}
        <div style={{
          padding: '12px 24px',
          background: 'var(--bg-surface)',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <Button onClick={() => alert('¡Presupuesto guardado en base local!')} style={{ background: 'var(--grad-primary)', border: 'none' }}>
              💾 Guardar
            </Button>
            <Button variant="secondary" onClick={() => { setPartidaEsTitulo(true); setIsAddPartidaOpen(true); }}>
              🏷️ +Título
            </Button>
            <Button variant="secondary" onClick={() => { setPartidaEsTitulo(false); setIsAddPartidaOpen(true); }}>
              ➕ +Partida
            </Button>
            <div style={{ width: '1px', background: 'var(--border-color)', margin: '0 8px' }} />
            <Button variant="secondary" onClick={() => alert('Exportando a Excel...')}>
              📥 Excel
            </Button>
            <Button variant="secondary" onClick={() => alert('Exportando reporte PDF...')}>
              📄 PDF
            </Button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Sub-Pres:</span>
              <select style={{
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-primary)',
                padding: '6px 12px',
                fontSize: '0.8rem',
                borderRadius: '4px',
                fontFamily: 'var(--font-sans)',
                outline: 'none'
              }}>
                {activeBudget?.subPresupuestos.map(sp => (
                  <option key={sp} value={sp}>{sp}</option>
                ))}
              </select>
            </div>

            <div style={{
              background: 'rgba(0, 240, 255, 0.05)',
              border: '1px solid rgba(0, 240, 255, 0.25)',
              borderRadius: 'var(--radius-sm)',
              padding: '6px 16px',
              display: 'flex',
              alignItems: 'baseline',
              gap: '6px'
            }}>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Costo Directo (CD):</span>
              <strong style={{ fontFamily: 'var(--font-display)', fontSize: '1.05rem', color: 'var(--color-primary)' }}>
                S/ {activeBudget ? getBudgetCD(activeBudget).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
              </strong>
            </div>
          </div>
        </div>

        {/* 3. Splitted Workspace (Partidas Spreadsheet + APU breakdown OR Gantt Schedule View) */}
        {sidebarTab === 'Programar' ? (
          <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'var(--bg-main)' }}>
            {/* Gantt Toolbar */}
            <div style={{
              display: 'flex',
              gap: '16px',
              padding: '12px 24px',
              background: 'rgba(255,255,255,0.02)',
              borderBottom: '1px solid var(--border-color)',
              alignItems: 'center',
              flexWrap: 'wrap'
            }}>
              <button 
                onClick={() => setSidebarTab('Presupuesto APU')}
                style={{
                  background: 'var(--color-success)',
                  border: 'none',
                  color: '#ffffff',
                  padding: '8px 16px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '0.82rem',
                  fontFamily: 'var(--font-sans)'
                }}
              >
                📊 Presupuestar
              </button>
              <button 
                onClick={() => alert('Planificación guardada con éxito')}
                style={{
                  background: 'transparent',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-primary)',
                  padding: '7px 14px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '0.82rem'
                }}
              >
                Guardar
              </button>
              <button 
                onClick={() => alert('Configuración de calendarios locales')}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontSize: '0.82rem'
                }}
              >
                📅 Calendarios
              </button>
              <button 
                onClick={() => alert('Generando curva S del proyecto...')}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontSize: '0.82rem'
                }}
              >
                📈 Curva S
              </button>
              <button 
                onClick={() => {
                  alert('Estimando duraciones en base a rendimientos de análisis unitarios.');
                }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontSize: '0.82rem'
                }}
              >
                ⚡ Estimar Duración
              </button>
              <button 
                onClick={() => alert('Exportando a MS Project / Primavera XML...')}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontSize: '0.82rem'
                }}
              >
                Exportar
              </button>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: 'auto' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Zoom:</span>
                <input 
                  type="number" 
                  defaultValue={100} 
                  style={{
                    background: 'rgba(0,0,0,0.3)',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-primary)',
                    width: '60px',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    textAlign: 'center',
                    fontSize: '0.8rem'
                  }}
                />
              </div>
            </div>

            {/* Split view: Table (Left) + Gantt chart (Right) */}
            <div style={{ flexGrow: 1, display: 'flex', overflow: 'hidden' }}>
              {/* Spreadsheet style table */}
              <div style={{ width: '60%', overflowX: 'auto', overflowY: 'auto', borderRight: '1px solid var(--border-color)', background: 'rgba(0,0,0,0.15)' }}>
                <table className={showGridlines ? 'table-gridlines' : ''} style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.8rem' }}>
                  <thead style={{
                    position: 'sticky',
                    top: 0,
                    background: 'var(--bg-surface-elevated)',
                    borderBottom: '1px solid var(--border-color)',
                    color: 'var(--text-secondary)',
                    fontWeight: 600,
                    zIndex: 10
                  }}>
                    <tr>
                      <th style={{ ...thStyle, width: '4%', textAlign: 'center' }}></th>
                      <th style={{ ...thStyle, width: '38%' }}>Partida</th>
                      <th style={{ ...thStyle, width: '8%', textAlign: 'center' }}>Duración</th>
                      <th style={{ ...thStyle, width: '13%', textAlign: 'center' }}>Inicio</th>
                      <th style={{ ...thStyle, width: '13%', textAlign: 'center' }}>Fin</th>
                      <th style={{ ...thStyle, width: '8%', textAlign: 'center' }}>Predecesora</th>
                      <th style={{ ...thStyle, width: '8%', textAlign: 'center' }}>Cuadrilla</th>
                      <th style={{ ...thStyle, width: '8%', textAlign: 'center' }}>Rendimiento</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* Subpresupuesto header row (classic SP header) */}
                    <tr style={{ background: 'rgba(255,255,255,0.01)', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                      <td style={{ ...tdStyle, textAlign: 'center', fontWeight: 'bold', color: 'var(--color-primary)' }}>1</td>
                      <td style={{ ...tdStyle, fontWeight: 'bold', color: 'var(--text-primary)' }}>SP: SUB PRESUPUESTO 1</td>
                      <td style={{ ...tdStyle, textAlign: 'center', fontWeight: 'bold' }}>8</td>
                      <td style={{ ...tdStyle, textAlign: 'center', fontWeight: 'bold', fontFamily: 'monospace' }}>01/07/2026</td>
                      <td style={{ ...tdStyle, textAlign: 'center', fontWeight: 'bold', fontFamily: 'monospace' }}>01/14/2026</td>
                      <td style={tdStyle}></td>
                      <td style={tdStyle}></td>
                      <td style={tdStyle}></td>
                    </tr>

                    {activeBudget?.partidas.map((p, idx) => {
                      const itemNum = idx + 2;
                      const isTitle = p.esTitulo;
                      const info = ganttData[p.id] || { duracion: 1, inicio: '2026-01-07', fin: '2026-01-07', predecesora: '' };

                      const handleUpdateField = (field: 'duracion' | 'inicio' | 'fin' | 'predecesora', val: any) => {
                        const copy = { ...ganttData };
                        const current = copy[p.id] || { duracion: 1, inicio: '2026-01-07', fin: '2026-01-07', predecesora: '' };
                        
                        if (field === 'duracion') {
                          const dur = Math.max(1, parseInt(val) || 1);
                          const start = new Date(current.inicio);
                          start.setDate(start.getDate() + dur - 1);
                          copy[p.id] = {
                            ...current,
                            duracion: dur,
                            fin: start.toISOString().split('T')[0]
                          };
                        } else if (field === 'inicio') {
                          const start = val;
                          const startDate = new Date(val);
                          startDate.setDate(startDate.getDate() + current.duracion - 1);
                          copy[p.id] = {
                            ...current,
                            inicio: start,
                            fin: startDate.toISOString().split('T')[0]
                          };
                        } else {
                          copy[p.id] = { ...current, [field]: val };
                        }
                        setGanttData(copy);
                      };

                      // Format dates to MM/DD/YYYY for S10 style
                      const formatToMDY = (dateStr: string) => {
                        if (!dateStr) return '';
                        const pts = dateStr.split('-');
                        if (pts.length !== 3) return dateStr;
                        return `${pts[1]}/${pts[2]}/${pts[0]}`;
                      };

                      if (isTitle) {
                        return (
                          <tr key={p.id} style={{ background: 'rgba(255,255,255,0.01)', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                            <td style={{ ...tdStyle, textAlign: 'center', fontWeight: 'bold', color: 'var(--color-secondary)' }}>{itemNum}</td>
                            <td style={{ ...tdStyle, fontWeight: 'bold', color: 'var(--text-primary)' }}>{p.nombre}</td>
                            <td style={{ ...tdStyle, textAlign: 'center', fontWeight: 'bold' }}>1</td>
                            <td style={{ ...tdStyle, textAlign: 'center', fontWeight: 'bold', fontFamily: 'monospace' }}>01/07/2026</td>
                            <td style={{ ...tdStyle, textAlign: 'center', fontWeight: 'bold', fontFamily: 'monospace' }}>01/07/2026</td>
                            <td style={tdStyle}></td>
                            <td style={tdStyle}></td>
                            <td style={tdStyle}></td>
                          </tr>
                        );
                      }

                      return (
                        <tr key={p.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                          <td style={{ ...tdStyle, textAlign: 'center', color: 'var(--text-muted)' }}>{itemNum}</td>
                          <td style={{ ...tdStyle, paddingLeft: '24px', color: 'var(--text-primary)', fontWeight: 500 }}>{p.nombre}</td>
                          {/* Duracion */}
                          <td>
                            <input 
                              type="number" 
                              value={info.duracion}
                              onChange={(e) => handleUpdateField('duracion', e.target.value)}
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: 'var(--color-primary)',
                                fontWeight: 'bold',
                                textAlign: 'center',
                                outline: 'none',
                                width: '100%'
                              }}
                            />
                          </td>
                          {/* Inicio Date Input */}
                          <td>
                            <input 
                              type="date" 
                              value={info.inicio}
                              onChange={(e) => handleUpdateField('inicio', e.target.value)}
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: 'var(--text-primary)',
                                fontFamily: 'monospace',
                                textAlign: 'center',
                                outline: 'none',
                                width: '100%',
                                fontSize: '0.78rem'
                              }}
                            />
                          </td>
                          {/* Fin Date Input */}
                          <td style={{ textAlign: 'center', fontFamily: 'monospace', color: 'var(--text-secondary)', fontSize: '0.78rem' }}>
                            {formatToMDY(info.fin)}
                          </td>
                          {/* Predecesora */}
                          <td>
                            <input 
                              type="text" 
                              placeholder=""
                              value={info.predecesora}
                              onChange={(e) => handleUpdateField('predecesora', e.target.value)}
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: 'var(--text-primary)',
                                textAlign: 'center',
                                outline: 'none',
                                width: '100%'
                              }}
                            />
                          </td>
                          {/* Cuadrilla */}
                          <td style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                            {p.insumos.find(i => i.tipo === 'MO')?.cuadrilla || 1}
                          </td>
                          {/* Rendimiento */}
                          <td style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                            {p.rendimiento}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                </div>

              {/* Gantt Timeline Graphic (Right) */}
              <div style={{ width: '40%', overflowX: 'auto', background: 'var(--bg-surface)', position: 'relative', display: 'flex', flexDirection: 'column' }}>
                {/* Timeline Header (Days of Jan 2026) */}
                <div style={{
                  height: '42px',
                  background: 'var(--bg-surface-elevated)',
                  borderBottom: '1px solid var(--border-color)',
                  display: 'flex',
                  flexDirection: 'column',
                  position: 'sticky',
                  top: 0,
                  zIndex: 5
                }}>
                  <div style={{ height: '20px', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '0.72rem', color: 'var(--text-secondary)', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                    Ene - 2026
                  </div>
                  <div style={{ display: 'flex', position: 'relative', height: '22px' }}>
                    {[4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17].map(day => (
                      <div 
                        key={day} 
                        style={{
                          width: '32px',
                          display: 'flex',
                          justifyContent: 'center',
                          alignItems: 'center',
                          fontSize: '0.7rem',
                          fontWeight: 'bold',
                          color: day === 11 ? 'var(--color-danger)' : 'var(--text-muted)',
                          borderRight: '1px solid rgba(255,255,255,0.03)',
                          boxSizing: 'border-box'
                        }}
                      >
                        {day}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Timeline Body grid rows */}
                <div style={{ display: 'flex', flexDirection: 'column', position: 'relative', flexGrow: 1 }}>
                  {/* Grid background lines */}
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', pointerEvents: 'none' }}>
                    {[4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17].map((_, idx) => (
                      <div key={idx} style={{ width: '32px', borderRight: '1px solid rgba(255,255,255,0.02)', boxSizing: 'border-box', height: '100%' }} />
                    ))}
                  </div>

                  {/* Red Today Line */}
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    bottom: 0,
                    left: `${3.5 * 32}px`, // Day 7 start line offset (4, 5, 6 are 3 columns, day 7 is half column)
                    width: '1px',
                    background: 'var(--color-danger)',
                    boxShadow: '0 0 8px var(--color-danger)',
                    zIndex: 2,
                    pointerEvents: 'none'
                  }} />

                  {/* SP Subpresupuesto Summary Gantt Bar */}
                  <div style={{ height: '37px', display: 'flex', alignItems: 'center', position: 'relative', borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                    <div style={{
                      position: 'absolute',
                      left: `${3 * 32}px`, // Starts Jan 7 (3 columns offset: 4, 5, 6)
                      width: `${8 * 32}px`, // 8 days
                      height: '10px',
                      background: 'repeating-linear-gradient(45deg, rgba(255,255,255,0.2) 0px, rgba(255,255,255,0.2) 4px, transparent 4px, transparent 8px), #2d3142',
                      border: '1px solid rgba(255,255,255,0.3)',
                      borderRadius: '2px',
                      boxShadow: '0 0 5px rgba(255,255,255,0.1)'
                    }}>
                      {/* Summary Bracket Ends */}
                      <div style={{ position: 'absolute', left: 0, top: '8px', borderLeft: '3px solid white', borderBottom: '3px solid white', width: '6px', height: '6px' }} />
                      <div style={{ position: 'absolute', right: 0, top: '8px', borderRight: '3px solid white', borderBottom: '3px solid white', width: '6px', height: '6px' }} />
                    </div>
                  </div>

                  {activeBudget?.partidas.map((p) => {
                    const isTitle = p.esTitulo;
                    const info = ganttData[p.id] || { duracion: 1, inicio: '2026-01-07', fin: '2026-01-07', predecesora: '' };

                    // Parse start relative to day 4
                    const getBarCoords = () => {
                      const projStart = new Date('2026-01-04');
                      const taskStart = new Date(info.inicio);
                      const diffDays = (taskStart.getTime() - projStart.getTime()) / (1000 * 60 * 60 * 24);
                      const left = Math.max(0, diffDays * 32);
                      const width = Math.max(8, info.duracion * 32);
                      return { left, width };
                    };

                    const { left, width } = getBarCoords();

                    if (isTitle) {
                      return (
                        <div key={p.id} style={{ height: '37px', display: 'flex', alignItems: 'center', position: 'relative', borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                          <div style={{
                            position: 'absolute',
                            left: `${3 * 32}px`, // Title tasks default summary bar Jan 7
                            width: `${32}px`,
                            height: '8px',
                            background: '#4a5568',
                            borderRadius: '2px'
                          }}>
                            <div style={{ position: 'absolute', left: 0, top: '6px', borderLeft: '2px solid #a0aec0', borderBottom: '2px solid #a0aec0', width: '4px', height: '4px' }} />
                            <div style={{ position: 'absolute', right: 0, top: '6px', borderRight: '2px solid #a0aec0', borderBottom: '2px solid #a0aec0', width: '4px', height: '4px' }} />
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div key={p.id} style={{ height: '33px', display: 'flex', alignItems: 'center', position: 'relative', borderBottom: '1px solid var(--border-color)' }}>
                        <div 
                          style={{
                            position: 'absolute',
                            left: `${left}px`,
                            width: `${width}px`,
                            height: '12px',
                            background: 'linear-gradient(90deg, #3b82f6, #60a5fa)',
                            borderRadius: '6px',
                            boxShadow: '0 0 10px rgba(59, 130, 246, 0.4), inset 0 1px 1px rgba(255,255,255,0.2)',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.boxShadow = '0 0 16px rgba(96, 165, 250, 0.7)';
                            e.currentTarget.style.height = '14px';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.boxShadow = '0 0 10px rgba(59, 130, 246, 0.4)';
                            e.currentTarget.style.height = '12px';
                          }}
                          title={`${p.nombre}: ${info.duracion} días`}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        ) : sidebarTab === 'Cotizar' ? (
          <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'var(--bg-main)', padding: '24px' }}>
            <div style={{
              background: 'rgba(255,255,255,0.01)',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '20px',
              height: '100%',
              overflowY: 'auto'
            }}>
              <div>
                <h3 style={{ color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                  🛍️ Cotización de Insumos del Presupuesto
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '8px', marginBottom: 0 }}>
                  Compara precios de insumos en tiempo real con proveedores y bases de datos históricas de SEACE según la localidad de la obra. Estas columnas pueden ser editadas manualmente o automatizadas mediante Inteligencia Artificial.
                </p>
              </div>

              {(() => {
                const uniqueInsumos: Insumo[] = [];
                if (activeBudget) {
                  const seen = new Set<string>();
                  activeBudget.partidas.forEach(p => {
                    p.insumos.forEach(ins => {
                      if (!seen.has(ins.nombre)) {
                        seen.add(ins.nombre);
                        uniqueInsumos.push(ins);
                      }
                    });
                  });
                }

                return (
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <Button 
                      onClick={() => {
                        const newCotData = { ...cotizacionesData };
                        uniqueInsumos.forEach(ins => {
                          const values = newCotData[ins.nombre] || {
                            cot1: parseFloat((ins.pu * 0.95).toFixed(2)),
                            cot2: parseFloat((ins.pu * 1.02).toFixed(2)),
                            cot3: parseFloat((ins.pu * 0.98).toFixed(2))
                          };
                          newCotData[ins.nombre] = {
                            ...values,
                            cot1Store: selectedLocalidad === 'Iquitos' ? 'Ferretería Selva Alta' : 'Sodimac',
                            cot2Store: selectedLocalidad === 'Iquitos' ? 'Materiales Iquitos S.A.C.' : 'Maestro',
                            cot3Store: selectedLocalidad === 'Iquitos' ? 'Ferretería El Oriente' : 'Promart'
                          };
                        });
                        setCotizacionesData(newCotData);
                        alert(`🤖 IA: Búsqueda completada en la localidad de ${selectedLocalidad}. Se identificaron los proveedores locales con mejores precios.`);
                      }} 
                      style={{ background: 'var(--grad-primary)', border: 'none' }}
                    >
                      🤖 Buscar Precios con IA
                    </Button>
                    <Button variant="secondary" onClick={() => alert('Cotizaciones guardadas en la base de datos.')}>
                      💾 Guardar Precios
                    </Button>
                    <Button variant="secondary" onClick={() => setSidebarTab('Presupuesto APU')}>
                      📊 Volver a Presupuestar
                    </Button>
                    
                    <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>📍 Localidad de la Obra:</span>
                      <select 
                        value={selectedLocalidad}
                        onChange={(e) => {
                          const loc = e.target.value;
                          setSelectedLocalidad(loc);
                          
                          // Auto populate store names on locality switch
                          const newCotData = { ...cotizacionesData };
                          uniqueInsumos.forEach(ins => {
                            const insVal = newCotData[ins.nombre] || {
                              cot1: parseFloat((ins.pu * 0.95).toFixed(2)),
                              cot2: parseFloat((ins.pu * 1.02).toFixed(2)),
                              cot3: parseFloat((ins.pu * 0.98).toFixed(2))
                            };
                            if (loc === 'Iquitos') {
                              newCotData[ins.nombre] = {
                                ...insVal,
                                cot1Store: 'Ferretería Selva Alta',
                                cot2Store: 'Materiales Iquitos S.A.C.',
                                cot3Store: 'Ferretería El Oriente'
                              };
                            } else {
                              newCotData[ins.nombre] = {
                                ...insVal,
                                cot1Store: 'Sodimac',
                                cot2Store: 'Maestro',
                                cot3Store: 'Promart'
                              };
                            }
                          });
                          setCotizacionesData(newCotData);
                        }}
                        style={{
                          background: 'rgba(0,0,0,0.3)',
                          border: '1px solid var(--border-color)',
                          color: 'var(--text-primary)',
                          padding: '6px 12px',
                          fontSize: '0.82rem',
                          borderRadius: '4px',
                          fontFamily: 'var(--font-sans)',
                          outline: 'none',
                          cursor: 'pointer'
                        }}
                      >
                        <option value="Iquitos">Iquitos (Selva Viva)</option>
                        <option value="Lima">Lima Metropolitana</option>
                        <option value="Arequipa">Arequipa</option>
                        <option value="Cusco">Cusco</option>
                        <option value="Trujillo">Trujillo</option>
                      </select>
                    </div>
                  </div>
                );
              })()}

              <div style={{ flexGrow: 1, overflowY: 'auto', border: '1px solid var(--border-color)', borderRadius: '6px', background: 'rgba(0, 0, 0, 0.2)' }}>
                {(() => {
                  const uniqueInsumos: Insumo[] = [];
                  if (activeBudget) {
                    const seen = new Set<string>();
                    activeBudget.partidas.forEach(p => {
                      p.insumos.forEach(ins => {
                        if (!seen.has(ins.nombre)) {
                          seen.add(ins.nombre);
                          uniqueInsumos.push(ins);
                        }
                      });
                    });
                  }

                  if (uniqueInsumos.length === 0) {
                    return (
                      <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>
                        No hay insumos registrados en este presupuesto. Agrega insumos en tus Análisis de Precios Unitarios (APU) primero.
                      </div>
                    );
                  }

                  return (
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                      <thead style={{
                        position: 'sticky',
                        top: 0,
                        background: 'var(--bg-surface-elevated)',
                        borderBottom: '1px solid var(--border-color)',
                        color: 'var(--text-secondary)',
                        fontWeight: 600,
                        zIndex: 2
                      }}>
                        <tr>
                          <th style={{ padding: '12px 16px' }}>Insumo</th>
                          <th style={{ padding: '12px 16px' }}>Und</th>
                          <th style={{ padding: '12px 16px', textAlign: 'right' }}>P. Base</th>
                          <th style={{ padding: '12px 16px', textAlign: 'left' }}>Cotización 1 (Proveedor / Precio)</th>
                          <th style={{ padding: '12px 16px', textAlign: 'left' }}>Cotización 2 (Proveedor / Precio)</th>
                          <th style={{ padding: '12px 16px', textAlign: 'left' }}>Cotización 3 (Proveedor / Precio)</th>
                          <th style={{ padding: '12px 16px', textAlign: 'center' }}>Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {uniqueInsumos.map((ins) => {
                          const values = cotizacionesData[ins.nombre] || {
                            cot1: parseFloat((ins.pu * 0.95).toFixed(2)),
                            cot1Store: selectedLocalidad === 'Iquitos' ? 'Ferretería Selva Alta' : 'Sodimac',
                            cot2: parseFloat((ins.pu * 1.02).toFixed(2)),
                            cot2Store: selectedLocalidad === 'Iquitos' ? 'Materiales Iquitos S.A.C.' : 'Maestro',
                            cot3: parseFloat((ins.pu * 0.98).toFixed(2)),
                            cot3Store: selectedLocalidad === 'Iquitos' ? 'Ferretería El Oriente' : 'Promart'
                          };

                          const handleUpdateField = (field: string, val: any) => {
                            setCotizacionesData({
                              ...cotizacionesData,
                              [ins.nombre]: {
                                ...values,
                                [field]: val
                              }
                            });
                          };

                          return (
                            <tr key={ins.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', background: 'rgba(255,255,255,0.005)' }}>
                              <td style={{ padding: '12px 16px', color: 'var(--text-primary)', fontWeight: 600 }}>{ins.nombre}</td>
                              <td style={{ padding: '12px 16px', fontFamily: 'monospace' }}>{ins.unidad}</td>
                              <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 'bold' }}>S/ {ins.pu.toFixed(2)}</td>
                              
                              {/* Cotización 1 */}
                              <td style={{ padding: '8px 12px' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                  <input 
                                    type="text" 
                                    placeholder="Tienda/Proveedor" 
                                    value={values.cot1Store} 
                                    onChange={(e) => handleUpdateField('cot1Store', e.target.value)}
                                    style={{
                                      background: 'rgba(255,255,255,0.02)',
                                      border: '1px solid var(--border-color)',
                                      color: 'var(--text-primary)',
                                      padding: '4px 8px',
                                      width: '180px',
                                      borderRadius: '4px',
                                      fontSize: '0.8rem',
                                      outline: 'none'
                                    }}
                                  />
                                  <input
                                    type="number"
                                    step="0.01"
                                    value={values.cot1}
                                    onChange={(e) => handleUpdateField('cot1', parseFloat(e.target.value) || 0)}
                                    style={{
                                      background: 'rgba(255,255,255,0.02)',
                                      border: '1px solid var(--border-color)',
                                      color: 'var(--color-primary)',
                                      padding: '4px 8px',
                                      width: '180px',
                                      borderRadius: '4px',
                                      textAlign: 'right',
                                      fontSize: '0.8rem',
                                      outline: 'none'
                                    }}
                                  />
                                </div>
                              </td>

                              {/* Cotización 2 */}
                              <td style={{ padding: '8px 12px' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                  <input 
                                    type="text" 
                                    placeholder="Tienda/Proveedor" 
                                    value={values.cot2Store} 
                                    onChange={(e) => handleUpdateField('cot2Store', e.target.value)}
                                    style={{
                                      background: 'rgba(255,255,255,0.02)',
                                      border: '1px solid var(--border-color)',
                                      color: 'var(--text-primary)',
                                      padding: '4px 8px',
                                      width: '180px',
                                      borderRadius: '4px',
                                      fontSize: '0.8rem',
                                      outline: 'none'
                                    }}
                                  />
                                  <input
                                    type="number"
                                    step="0.01"
                                    value={values.cot2}
                                    onChange={(e) => handleUpdateField('cot2', parseFloat(e.target.value) || 0)}
                                    style={{
                                      background: 'rgba(255,255,255,0.02)',
                                      border: '1px solid var(--border-color)',
                                      color: 'var(--color-primary)',
                                      padding: '4px 8px',
                                      width: '180px',
                                      borderRadius: '4px',
                                      textAlign: 'right',
                                      fontSize: '0.8rem',
                                      outline: 'none'
                                    }}
                                  />
                                </div>
                              </td>

                              {/* Cotización 3 */}
                              <td style={{ padding: '8px 12px' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                  <input 
                                    type="text" 
                                    placeholder="Tienda/Proveedor" 
                                    value={values.cot3Store} 
                                    onChange={(e) => handleUpdateField('cot3Store', e.target.value)}
                                    style={{
                                      background: 'rgba(255,255,255,0.02)',
                                      border: '1px solid var(--border-color)',
                                      color: 'var(--text-primary)',
                                      padding: '4px 8px',
                                      width: '180px',
                                      borderRadius: '4px',
                                      fontSize: '0.8rem',
                                      outline: 'none'
                                    }}
                                  />
                                  <input
                                    type="number"
                                    step="0.01"
                                    value={values.cot3}
                                    onChange={(e) => handleUpdateField('cot3', parseFloat(e.target.value) || 0)}
                                    style={{
                                      background: 'rgba(255,255,255,0.02)',
                                      border: '1px solid var(--border-color)',
                                      color: 'var(--color-primary)',
                                      padding: '4px 8px',
                                      width: '180px',
                                      borderRadius: '4px',
                                      textAlign: 'right',
                                      fontSize: '0.8rem',
                                      outline: 'none'
                                    }}
                                  />
                                </div>
                              </td>

                              <td style={{ padding: '8px 12px', textAlign: 'center', verticalAlign: 'middle' }}>
                                <Button 
                                  onClick={() => {
                                    const minVal = Math.min(values.cot1, values.cot2, values.cot3);
                                    let bestStore = '';
                                    if (minVal === values.cot1) bestStore = values.cot1Store;
                                    else if (minVal === values.cot2) bestStore = values.cot2Store;
                                    else bestStore = values.cot3Store;

                                    alert(`Aplicando mejor precio de S/ ${minVal.toFixed(2)} (${bestStore}) al insumo: ${ins.nombre}`);
                                  }}
                                  style={{ padding: '6px 12px', fontSize: '0.78rem' }}
                                >
                                  Aplicar Mínimo
                                </Button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  );
                })()}
              </div>
            </div>
          </div>
        ) : sidebarTab === 'Especificaciones Técnicas' ? (
          <div style={{ flexGrow: 1, display: 'flex', overflow: 'hidden', background: 'var(--bg-main)', position: 'relative' }}>
            {/* LEFT: Partidas list panel */}
            <div style={{
              width: '300px',
              minWidth: '260px',
              maxWidth: '340px',
              display: 'flex',
              flexDirection: 'column',
              borderRight: '1px solid var(--border-color)',
              background: 'rgba(0,0,0,0.18)',
              overflow: 'hidden',
              flexShrink: 0
            }}>
                {/* List header */}
                <div style={{
                  padding: '16px 18px 12px',
                  borderBottom: '1px solid var(--border-color)',
                  flexShrink: 0,
                  background: 'rgba(0, 240, 255, 0.02)'
                }}>
                  <h3 style={{ margin: '0 0 4px', fontSize: '0.9rem', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '7px' }}>
                    📄 Especificaciones Técnicas
                  </h3>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    Haz clic en una partida para editar
                  </p>
                  <button
                    onClick={() => setSidebarTab('Presupuesto APU')}
                    style={{
                      marginTop: '10px',
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid var(--border-color)',
                      color: 'var(--text-secondary)',
                      borderRadius: '6px',
                      padding: '5px 12px',
                      cursor: 'pointer',
                      fontSize: '0.75rem',
                      width: '100%'
                    }}
                  >
                    ← Volver al Presupuesto
                  </button>
                </div>
                {/* Partidas list */}
                <div style={{ overflowY: 'auto', flexGrow: 1, padding: '8px 6px' }}>
                  {activeBudget && activeBudget.partidas.length > 0 ? (
                    activeBudget.partidas.map((partida, idx) => {
                      const pKey = `spec_${activeBudget.id}_${partida.id}`;
                      const hasContent = !!(specsText[pKey] && specsText[pKey].trim().length > 0);
                      const isSelected = partida.id === selectedSpecPartidaId;
                      const isTitulo = partida.esTitulo;
                      return (
                        <div
                          key={partida.id}
                          onClick={() => { if (!isTitulo) setSelectedSpecPartidaId(partida.id); }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: isTitulo ? '10px 10px 2px' : '9px 10px',
                            marginBottom: '2px',
                            borderRadius: '6px',
                            cursor: isTitulo ? 'default' : 'pointer',
                            background: isSelected ? 'rgba(0, 240, 255, 0.08)' : isTitulo ? 'transparent' : 'rgba(255,255,255,0.02)',
                            border: isSelected ? '1px solid rgba(0, 240, 255, 0.3)' : '1px solid transparent',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          {isTitulo ? (
                            <span style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                              {partida.nombre}
                            </span>
                          ) : (
                            <>
                              <span style={{
                                background: isSelected ? 'var(--grad-primary)' : 'rgba(255,255,255,0.08)',
                                color: isSelected ? '#000' : 'var(--text-secondary)',
                                fontWeight: 700, fontSize: '0.68rem', padding: '2px 6px',
                                borderRadius: '3px', fontFamily: 'monospace', flexShrink: 0
                              }}>{idx + 1}</span>
                              <div style={{ flexGrow: 1, minWidth: 0 }}>
                                <div style={{
                                  fontSize: '0.81rem',
                                  color: isSelected ? 'var(--color-primary)' : 'var(--text-primary)',
                                  fontWeight: isSelected ? 600 : 400,
                                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                                }}>{partida.nombre}</div>
                                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '1px' }}>
                                {partida.unidad} · S/ {getPartidaParcial(partida).toFixed(2)}
                                </div>
                              </div>
                              <span
                                title={hasContent ? 'Tiene especificaciones' : 'Sin especificaciones'}
                                style={{
                                  width: '7px', height: '7px', borderRadius: '50%', flexShrink: 0,
                                  background: hasContent ? 'var(--color-primary)' : 'rgba(255,255,255,0.15)',
                                  boxShadow: hasContent ? '0 0 5px rgba(0,240,255,0.5)' : 'none',
                                  transition: 'all 0.2s'
                                }}
                              />
                            </>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <div style={{ textAlign: 'center', padding: '36px 14px', color: 'var(--text-secondary)' }}>
                      <div style={{ fontSize: '1.8rem', marginBottom: '8px' }}>📄</div>
                      <p style={{ fontSize: '0.82rem' }}>No hay partidas aún</p>
                    </div>
                  )}
                </div>
              </div>

              {/* RIGHT: Editor panel */}
              {selectedSpecPartida ? (
                <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                  {/* Editor header */}
                  <div style={{
                    padding: '12px 20px',
                    borderBottom: '1px solid var(--border-color)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    flexShrink: 0,
                    background: 'rgba(0, 240, 255, 0.025)'
                  }}>
                    <span style={{
                      background: 'var(--grad-primary)', color: '#000', fontWeight: 700,
                      fontSize: '0.7rem', padding: '2px 8px', borderRadius: '4px', fontFamily: 'monospace', flexShrink: 0
                    }}>
                      {activeBudget!.partidas.findIndex(p => p.id === selectedSpecPartida.id) + 1}
                    </span>
                    <div style={{ flexGrow: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {selectedSpecPartida.nombre}
                      </div>
                      <div style={{ fontSize: '0.73rem', color: 'var(--text-secondary)' }}>
                        {selectedSpecPartida.unidad} · S/ {getPartidaParcial(selectedSpecPartida).toFixed(2)}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                      <button
                        onClick={() => alert(`\u2705 Especificaciones de "${selectedSpecPartida.nombre}" guardadas.`)}
                        style={{
                          background: 'var(--grad-primary)', border: 'none', color: '#000',
                          padding: '6px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: 700, fontSize: '0.8rem'
                        }}
                      >💾 Guardar</button>
                      <button
                        onClick={() => setSelectedSpecPartidaId(null)}
                        style={{
                          background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)',
                          padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem'
                        }}
                      >✕</button>
                    </div>
                  </div>

                  {/* Toolbar */}
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '3px',
                    padding: '7px 16px', borderBottom: '1px solid var(--border-color)',
                    flexShrink: 0, flexWrap: 'wrap', background: 'rgba(0,0,0,0.18)'
                  }}>
                    {([
                      { label: 'B', title: 'Negrita', cmd: 'bold', s: { fontWeight: 800 } },
                      { label: 'I', title: 'Cursiva', cmd: 'italic', s: { fontStyle: 'italic' } },
                      { label: 'U', title: 'Subrayado', cmd: 'underline', s: { textDecoration: 'underline' } },
                    ] as const).map(btn => (
                      <button key={btn.cmd} onMouseDown={e => { e.preventDefault(); document.execCommand(btn.cmd); }}
                        title={btn.title} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', width: '28px', height: '26px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem', ...btn.s }}>
                        {btn.label}
                      </button>
                    ))}
                    <div style={{ width: '1px', height: '18px', background: 'var(--border-color)', margin: '0 3px' }} />
                    {(['h1','h2','h3'] as const).map(tag => (
                      <button key={tag} onMouseDown={e => { e.preventDefault(); document.execCommand('formatBlock', false, tag); }}
                        title={`T\u00edtulo ${tag.slice(1)}`} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border-color)', color: 'var(--color-primary)', padding: '0 7px', height: '26px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.72rem', fontWeight: 700 }}>
                        {tag.toUpperCase()}
                      </button>
                    ))}
                    <div style={{ width: '1px', height: '18px', background: 'var(--border-color)', margin: '0 3px' }} />
                    <button onMouseDown={e => { e.preventDefault(); document.execCommand('insertUnorderedList'); }}
                      title="Lista con vi\u00f1etas" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', padding: '0 8px', height: '26px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem' }}>
                      ≡
                    </button>
                    <button onMouseDown={e => { e.preventDefault(); document.execCommand('insertOrderedList'); }}
                      title="Lista numerada" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', padding: '0 8px', height: '26px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.78rem' }}>
                      1.
                    </button>
                    <div style={{ width: '1px', height: '18px', background: 'var(--border-color)', margin: '0 3px' }} />
                    <button onMouseDown={e => { e.preventDefault(); document.execCommand('undo'); }}
                      title="Deshacer" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', padding: '0 7px', height: '26px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.82rem' }}>↩</button>
                    <button onMouseDown={e => { e.preventDefault(); document.execCommand('redo'); }}
                      title="Rehacer" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', padding: '0 7px', height: '26px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.82rem' }}>↪</button>
                    <div style={{ width: '1px', height: '18px', background: 'var(--border-color)', margin: '0 3px' }} />
                    <button onMouseDown={e => { e.preventDefault(); document.execCommand('removeFormat'); }}
                      title="Limpiar formato" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', padding: '0 7px', height: '26px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.7rem' }}>Tx</button>
                    <span style={{ marginLeft: 'auto', fontSize: '0.7rem', color: 'var(--text-secondary)', fontStyle: 'italic', opacity: 0.7 }}>Editor de especificaci\u00f3n</span>
                  </div>

                  {/* ContentEditable editor */}
                  <style>{`
                    [id^="spec-editor-"] { caret-color: var(--color-primary); }
                    [id^="spec-editor-"] h1 { font-size:1.35rem; color:var(--color-primary); margin:14px 0 6px; border-bottom:1px solid var(--border-color); padding-bottom:5px; }
                    [id^="spec-editor-"] h2 { font-size:1.1rem; color:var(--color-primary); margin:12px 0 5px; }
                    [id^="spec-editor-"] h3 { font-size:0.92rem; color:rgba(0,240,255,0.7); margin:10px 0 4px; font-weight:600; }
                    [id^="spec-editor-"] p  { margin:5px 0; }
                    [id^="spec-editor-"] ul,[id^="spec-editor-"] ol { padding-left:20px; margin:5px 0; }
                    [id^="spec-editor-"] li { margin-bottom:3px; }
                    [id^="spec-editor-"] strong { color:#fff; }
                    [id^="spec-editor-"]:focus { outline: none; }
                  `}</style>
                  <div
                    key={selectedSpecPartida.id}
                    contentEditable
                    suppressContentEditableWarning
                    id={`spec-editor-${selectedSpecPartida.id}`}
                    onInput={(e) => {
                      const html = (e.currentTarget as HTMLDivElement).innerHTML;
                      setSpecsText(prev => ({ ...prev, [specKey]: html }));
                    }}
                    dangerouslySetInnerHTML={{
                      __html: specValue || `<h2>Especificaciones T\u00e9cnicas</h2><h3>Descripci\u00f3n General</h3><p>Describa aqu\u00ed el alcance y prop\u00f3sito de la partida <strong>${selectedSpecPartida.nombre}</strong>.</p><h3>Materiales a Utilizar</h3><ul><li>Material 1</li><li>Material 2</li></ul><h3>Procedimiento Constructivo</h3><ol><li>Paso 1</li><li>Paso 2</li></ol><h3>Control de Calidad</h3><ul><li>Verificaci\u00f3n 1</li></ul><h3>Normas Aplicables</h3><ul><li>Norma 1</li></ul>`
                    }}
                    style={{
                      flexGrow: 1, overflowY: 'auto', padding: '24px 32px',
                      outline: 'none', color: 'var(--text-primary)',
                      fontSize: '0.9rem', lineHeight: 1.75,
                      fontFamily: "'Inter', sans-serif"
                    }}
                  />
                </div>
              ) : (
                /* Empty state when no partida selected */
                <div style={{
                  flexGrow: 1, display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center',
                  color: 'var(--text-secondary)', gap: '12px'
                }}>
                  <div style={{ fontSize: '3rem', opacity: 0.3 }}>📄</div>
                  <p style={{ fontSize: '0.9rem', opacity: 0.5, textAlign: 'center', maxWidth: '260px', lineHeight: 1.5 }}>
                    Selecciona una partida de la lista para editar sus especificaciones t\u00e9cnicas
                  </p>
                </div>
              )
            }
          </div>
        ) : (
          <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {/* Main Partidas Table */}
            <div style={{ flexGrow: 1, overflowX: 'auto', overflowY: 'auto', background: 'rgba(0,0,0,0.15)' }}>
            <table className={showGridlines ? 'table-gridlines' : ''} style={{
              width: `${partidaTableWidth}px`,
              tableLayout: 'fixed',
              borderCollapse: 'collapse',
              textAlign: 'left',
              fontSize: '0.85rem'
            }}>
              <thead style={{
                position: 'sticky',
                top: 0,
                background: 'var(--bg-surface-elevated)',
                borderBottom: '1px solid var(--border-color)',
                color: 'var(--text-secondary)',
                fontWeight: 600,
                zIndex: 10
              }}>
                <tr>
                  {renderPartidaHeader('item', 'Ítem')}
                  {renderPartidaHeader('descripcion', 'Descripción de Partida', { width: '40%' })}
                  {renderPartidaHeader('unidad', 'Unidad')}
                  {renderPartidaHeader('metrado', 'Metrado')}
                  {renderPartidaHeader('cu', 'P. Unitario (CU)')}
                  {renderPartidaHeader('parcial', 'Parcial')}
                  {renderPartidaHeader('mo', 'Mano Obra')}
                  {renderPartidaHeader('mt', 'Materiales')}
                  {renderPartidaHeader('eq', 'Equipos')}
                  {renderPartidaHeader('sc', 'Subcontrato')}
                </tr>
              </thead>
              <tbody>
                {activeBudget?.partidas.map(p => {
                  const isSelected = selectedPartidaId === p.id;
                  const cu = getPartidaCU(p);
                  const parcial = getPartidaParcial(p);
                  const br = getAPUBreakdown(p);

                  if (p.esTitulo) {
                    return (
                      <tr key={p.id} style={{ background: 'rgba(255,255,255,0.01)', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                        <td style={{ ...tdStyle, fontWeight: 700, color: 'var(--color-secondary)' }}>{p.item}</td>
                        <td colSpan={9} style={{ ...tdStyle, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '0.5px' }}>
                          {p.nombre}
                        </td>
                      </tr>
                    );
                  }

                  return (
                    <tr
                      key={p.id}
                      onClick={() => setSelectedPartidaId(p.id)}
                      style={{
                        background: isSelected ? 'rgba(0, 240, 255, 0.02)' : 'transparent',
                        borderBottom: '1px solid var(--border-color)',
                        cursor: 'pointer',
                        transition: 'background 0.15s'
                      }}
                      className="budget-editor-row"
                    >
                      <td style={tdStyle}>{p.item}</td>
                      <td style={{ ...tdStyle, fontWeight: 500, color: isSelected ? 'var(--color-primary)' : 'var(--text-primary)' }}>{p.nombre}</td>
                      <td style={{ ...tdStyle, fontFamily: 'monospace' }}>{p.unidad}</td>
                      <td style={{ ...tdStyle, padding: '4px 8px' }}>
                        <input
                          type="number"
                          value={p.metrado}
                          onChange={(e) => handleUpdatePartidaMetrado(p.id, parseFloat(e.target.value) || 0)}
                          style={tableInputStyle}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </td>
                      <td style={{ ...tdStyle, color: 'var(--color-primary)', fontWeight: 600 }}>S/ {cu.toFixed(2)}</td>
                      <td style={{ ...tdStyle, fontWeight: 600 }}>S/ {parcial.toFixed(2)}</td>
                      <td style={tdStyle}>S/ {br.MO.toFixed(2)}</td>
                      <td style={tdStyle}>S/ {br.MT.toFixed(2)}</td>
                      <td style={tdStyle}>S/ {br.EQ.toFixed(2)}</td>
                      <td style={tdStyle}>S/ {br.SC.toFixed(2)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* 4. Bottom APU Calculator Panel */}
          {selectedPartida ? (
            <div style={{
                height: `${apuPanelHeight}px`,
                background: 'var(--bg-surface)',
                borderTop: '1px solid var(--border-color)',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                position: 'relative'
              }}>

              {/* Vertical Height Resizer Handle */}
              <div
                onMouseDown={startApuHeightResize}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '4px',
                  cursor: 'ns-resize',
                  zIndex: 20
                }}
                className="apu-height-resizer"
              />
              
              {/* APU Header and KPI indicators */}
              <div style={{
                padding: '12px 24px',
                borderBottom: '1px solid var(--border-color)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                background: 'rgba(0,0,0,0.1)',
                gap: '12px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    🛠️ APU: <strong style={{ color: 'var(--color-primary)' }}>{selectedPartida.nombre}</strong>
                  </span>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Rendimiento (M2/Día):</span>
                    <input
                      type="number"
                      step="0.1"
                      value={selectedPartida.rendimiento}
                      onChange={(e) => handleUpdateRendimiento(parseFloat(e.target.value) || 1)}
                      style={{
                        background: 'rgba(255, 255, 255, 0.02)',
                        border: '1px solid var(--border-color)',
                        color: 'var(--text-primary)',
                        padding: '4px 8px',
                        width: '70px',
                        borderRadius: '4px',
                        fontSize: '0.8rem',
                        fontWeight: 'bold',
                        outline: 'none'
                      }}
                    />
                  </div>
                </div>

                {/* Costs breakdowns */}
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                  {[
                    { label: 'MO', val: apuBreakdown.MO },
                    { label: 'MT', val: apuBreakdown.MT },
                    { label: 'EQ', val: apuBreakdown.EQ },
                    { label: 'SC', val: apuBreakdown.SC },
                    { label: 'SP', val: apuBreakdown.SP }
                  ].map(ind => (
                    <div key={ind.label} style={{
                      background: 'rgba(255, 255, 255, 0.02)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '4px',
                      padding: '4px 10px',
                      fontSize: '0.78rem',
                      fontWeight: 600
                    }}>
                      <span style={{ color: 'var(--text-secondary)', marginRight: '4px' }}>{ind.label}:</span>
                      <span style={{ color: 'var(--text-primary)' }}>S/ {ind.val.toFixed(2)}</span>
                    </div>
                  ))}
                  <div style={{
                    background: 'rgba(0, 240, 255, 0.05)',
                    border: '1px solid rgba(0, 240, 255, 0.25)',
                    borderRadius: '4px',
                    padding: '4px 12px',
                    fontSize: '0.78rem',
                    fontWeight: 700
                  }}>
                    <span style={{ color: 'var(--color-primary)', marginRight: '4px' }}>C.U:</span>
                    <span style={{ color: 'var(--color-primary)' }}>S/ {getPartidaCU(selectedPartida).toFixed(2)}</span>
                  </div>

                  {/* APU controls: zoom and height */}
                  <div style={{ display: 'flex', gap: '6px', marginLeft: '8px', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginRight: '6px' }}>APU:</span>
                    <button onClick={() => setApuZoom(z => Math.max(0.6, +(z - 0.1).toFixed(2)))} style={{ padding: '6px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'transparent', cursor: 'pointer' }}>🔍-</button>
                    <button onClick={() => setApuZoom(z => Math.min(2, +(z + 0.1).toFixed(2)))} style={{ padding: '6px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'transparent', cursor: 'pointer' }}>🔍+</button>
                    <button onClick={() => setApuPanelHeight(h => Math.max(160, h - 40))} title="Reducir alto" style={{ padding: '6px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'transparent', cursor: 'pointer' }}>⬇️</button>
                    <button onClick={() => setApuPanelHeight(h => Math.min(640, h + 40))} title="Aumentar alto" style={{ padding: '6px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'transparent', cursor: 'pointer' }}>⬆️</button>
                  </div>
                </div>
              </div>

              {/* APU Insumos list */}
              <div style={{ flexGrow: 1, overflowX: 'auto', overflowY: 'auto' }}>
                <div style={{ transform: `scale(${apuZoom})`, transformOrigin: 'left top', width: '100%' }}>
                <table className={showGridlines ? 'table-gridlines' : ''} style={{
                  width: `${apuTableWidth}px`,
                  tableLayout: 'fixed',
                  borderCollapse: 'collapse',
                  fontSize: '0.82rem',
                  textAlign: 'left'
                }}>
                  <thead style={{
                    position: 'sticky',
                    top: 0,
                    background: 'var(--bg-surface-elevated)',
                    borderBottom: '1px solid var(--border-color)',
                    color: 'var(--text-secondary)',
                    zIndex: 5
                  }}>
                    <tr>
                      {renderApuHeader('nombre', 'Nombre de Insumo')}
                      {renderApuHeader('unidad', 'Unidad')}
                      {renderApuHeader('cuadrilla', 'Cuadrilla')}
                      {renderApuHeader('cantidad', 'Cantidad')}
                      {renderApuHeader('pu', 'P. Unitario (PU)')}
                      {renderApuHeader('parcial', 'Parcial')}
                      {renderApuHeader('tipo', 'Tipo')}
                    </tr>
                  </thead>
                  <tbody>
                    {selectedPartida.insumos.map(ins => {
                      const cantidad = getInsumoCantidad(ins, selectedPartida.rendimiento);
                      const parcial = getInsumoParcial(ins, selectedPartida.rendimiento);

                      return (
                        <tr key={ins.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                          <td style={{ ...tdStyle, fontWeight: 600 }}>{ins.nombre}</td>
                          <td style={tdStyle}>{ins.unidad}</td>
                          <td style={{ ...tdStyle, padding: '2px 8px' }}>
                            <input
                              type="number"
                              step="0.0001"
                              value={ins.cuadrilla}
                              onChange={(e) => handleUpdateInsumoField(ins.id, 'cuadrilla', parseFloat(e.target.value) || 0)}
                              style={tableInputStyle}
                            />
                          </td>
                          <td style={tdStyle}>{cantidad.toFixed(4)}</td>
                          <td style={{ ...tdStyle, padding: '2px 8px' }}>
                            <input
                              type="number"
                              step="0.01"
                              value={ins.pu}
                              onChange={(e) => handleUpdateInsumoField(ins.id, 'pu', parseFloat(e.target.value) || 0)}
                              style={tableInputStyle}
                            />
                          </td>
                          <td style={{ ...tdStyle, fontWeight: 600, color: 'var(--color-primary)' }}>S/ {parcial.toFixed(2)}</td>
                          <td style={tdStyle}>
                            <span className={`badge ${ins.tipo === 'MO' ? 'badge-role' : 'badge-secondary'}`} style={{ fontSize: '0.65rem', padding: '2px 8px' }}>
                              {ins.tipo}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

              {/* APU Footer controls */}
              <div style={{
                padding: '12px 24px',
                borderTop: '1px solid var(--border-color)',
                display: 'flex',
                gap: '12px',
                background: 'rgba(0,0,0,0.1)'
              }}>
                <Button onClick={() => setIsAddInsumoOpen(true)}>
                  ➕ Agregar Insumo
                </Button>
                <Button variant="secondary" onClick={() => alert('Nueva subpartida agregada')}>
                  ➕ Agregar Sub Partida
                </Button>
              </div>

            </div>
          ) : (
            <div style={{
              height: '320px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderTop: '1px solid var(--border-color)',
              color: 'var(--text-muted)'
            }}>
              Haz clic en una partida para analizar sus Precios Unitarios (APU).
            </div>
          )}

        </div>
        )}

      </div>

      {/* Modal - Datos Generales (Redesigned Floating Window matching user screenshot) */}
      <Modal 
        isOpen={isDatosGeneralesOpen} 
        onClose={() => setIsDatosGeneralesOpen(false)} 
        title="EDITAR DATOS GENERALES"
      >
        {/* Tabs header */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid var(--border-color)',
          paddingBottom: '12px',
          marginBottom: '20px',
          gap: '8px'
        }}>
          <button
            onClick={() => setDgActiveTab('general')}
            style={{
              padding: '8px 16px',
              background: dgActiveTab === 'general' ? 'rgba(0, 240, 255, 0.1)' : 'transparent',
              color: dgActiveTab === 'general' ? 'var(--color-primary)' : 'var(--text-secondary)',
              borderRadius: '6px',
              border: '1px solid',
              borderColor: dgActiveTab === 'general' ? 'rgba(0, 240, 255, 0.25)' : 'transparent',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            General
          </button>
          <button
            onClick={() => setDgActiveTab('subpresupuestos')}
            style={{
              padding: '8px 16px',
              background: dgActiveTab === 'subpresupuestos' ? 'rgba(0, 240, 255, 0.1)' : 'transparent',
              color: dgActiveTab === 'subpresupuestos' ? 'var(--color-primary)' : 'var(--text-secondary)',
              borderRadius: '6px',
              border: '1px solid',
              borderColor: dgActiveTab === 'subpresupuestos' ? 'rgba(0, 240, 255, 0.25)' : 'transparent',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            Sub Presupuestos
          </button>
        </div>

        {/* Modal Body content */}
        <div style={{ maxHeight: '400px', overflowY: 'auto', paddingRight: '4px', marginBottom: '24px' }}>
          {dgActiveTab === 'general' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              
              {/* Grupo select */}
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: 600, letterSpacing: '0.05em' }}>GRUPO</label>
                <select
                  value={dgGrupo}
                  onChange={(e) => setDgGrupo(e.target.value)}
                  style={{
                    width: '100%',
                    background: 'rgba(0, 0, 0, 0.25)',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-primary)',
                    padding: '10px 14px',
                    borderRadius: '6px',
                    fontSize: '0.88rem',
                    fontFamily: 'var(--font-sans)',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                >
                  <option value="TODOS LOS PRESUPUESTOS" style={{ background: '#121622', color: 'var(--text-primary)' }}>TODOS LOS PRESUPUESTOS</option>
                  <option value="EDIFICACIONES" style={{ background: '#121622', color: 'var(--text-primary)' }}>EDIFICACIONES</option>
                  <option value="CARRETERAS" style={{ background: '#121622', color: 'var(--text-primary)' }}>CARRETERAS</option>
                  <option value="SANEAMIENTO" style={{ background: '#121622', color: 'var(--text-primary)' }}>SANEAMIENTO</option>
                  <option value="MINERÍA" style={{ background: '#121622', color: 'var(--text-primary)' }}>MINERÍA</option>
                </select>
              </div>

              {/* Presupuesto input */}
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: 600, letterSpacing: '0.05em' }}>PRESUPUESTO</label>
                <input
                  type="text"
                  value={dgPresupuesto}
                  onChange={(e) => setDgPresupuesto(e.target.value)}
                  style={{
                    ...dgInputStyle,
                    background: 'rgba(0, 0, 0, 0.25)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '6px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Cliente input */}
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: 600, letterSpacing: '0.05em' }}>CLIENTE</label>
                <input
                  type="text"
                  value={dgCliente}
                  onChange={(e) => setDgCliente(e.target.value)}
                  style={{
                    ...dgInputStyle,
                    background: 'rgba(0, 0, 0, 0.25)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '6px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Dirección input */}
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: 600, letterSpacing: '0.05em' }}>DIRECCIÓN</label>
                <input
                  type="text"
                  value={dgDireccion}
                  onChange={(e) => setDgDireccion(e.target.value)}
                  style={{
                    ...dgInputStyle,
                    background: 'rgba(0, 0, 0, 0.25)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '6px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Distrito, Provincia, Departamento */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: 600, letterSpacing: '0.05em' }}>DISTRITO</label>
                  <input
                    type="text"
                    value={dgDistrito}
                    onChange={(e) => setDgDistrito(e.target.value)}
                    style={{
                      ...dgInputStyle,
                      background: 'rgba(0, 0, 0, 0.25)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '6px',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: 600, letterSpacing: '0.05em' }}>PROVINCIA</label>
                  <input
                    type="text"
                    value={dgProvincia}
                    onChange={(e) => setDgProvincia(e.target.value)}
                    style={{
                      ...dgInputStyle,
                      background: 'rgba(0, 0, 0, 0.25)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '6px',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: 600, letterSpacing: '0.05em' }}>DEPARTAMENTO</label>
                  <input
                    type="text"
                    value={dgDepartamento}
                    onChange={(e) => setDgDepartamento(e.target.value)}
                    style={{
                      ...dgInputStyle,
                      background: 'rgba(0, 0, 0, 0.25)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '6px',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

              {/* Fecha Base, Jornada, Moneda */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: 600, letterSpacing: '0.05em' }}>FECHA BASE</label>
                  <input
                    type="date"
                    value={dgFechaBase}
                    onChange={(e) => setDgFechaBase(e.target.value)}
                    style={{
                      ...dgInputStyle,
                      background: 'rgba(0, 0, 0, 0.25)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '6px',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: 600, letterSpacing: '0.05em' }}>JORNADA (HORAS)</label>
                  <input
                    type="number"
                    value={dgJornada}
                    onChange={(e) => setDgJornada(parseInt(e.target.value) || 8)}
                    style={{
                      ...dgInputStyle,
                      background: 'rgba(0, 0, 0, 0.25)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '6px',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: 600, letterSpacing: '0.05em' }}>MONEDA</label>
                  <select
                    value={dgMoneda}
                    onChange={(e: any) => setDgMoneda(e.target.value)}
                    style={{
                      width: '100%',
                      background: 'rgba(0, 0, 0, 0.25)',
                      border: '1px solid var(--border-color)',
                      color: 'var(--text-primary)',
                      padding: '10px 14px',
                      borderRadius: '6px',
                      fontSize: '0.88rem',
                      fontFamily: 'var(--font-sans)',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  >
                    <option value="SOLES" style={{ background: '#121622', color: 'var(--text-primary)' }}>SOLES</option>
                    <option value="DOLARES" style={{ background: '#121622', color: 'var(--text-primary)' }}>DOLARES</option>
                  </select>
                </div>
              </div>

            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 600, letterSpacing: '0.05em' }}>ESTRUCTURA DE SUB PRESUPUESTOS:</span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', background: 'rgba(0,0,0,0.15)', padding: '12px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                {dgSubPresupuestos.map((sp, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-surface-elevated)', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                    <span style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-primary)' }}>{sp}</span>
                    <button
                      type="button"
                      onClick={() => setDgSubPresupuestos(dgSubPresupuestos.filter(x => x !== sp))}
                      style={{
                        background: 'rgba(244, 63, 94, 0.1)',
                        border: '1px solid rgba(244, 63, 94, 0.25)',
                        color: 'var(--color-danger)',
                        cursor: 'pointer',
                        fontSize: '0.75rem',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(244, 63, 94, 0.2)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(244, 63, 94, 0.1)'}
                    >
                      Eliminar
                    </button>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                <input
                  type="text"
                  placeholder="Nuevo Sub Presupuesto..."
                  value={newSubPresupuesto}
                  onChange={(e) => setNewSubPresupuesto(e.target.value)}
                  style={{
                    ...dgInputStyle,
                    background: 'rgba(0, 0, 0, 0.25)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '6px',
                    boxSizing: 'border-box',
                    flexGrow: 1
                  }}
                />
                <Button
                  type="button"
                  onClick={() => {
                    if (!newSubPresupuesto) return;
                    setDgSubPresupuestos([...dgSubPresupuestos, newSubPresupuesto]);
                    setNewSubPresupuesto('');
                  }}
                >
                  Agregar
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div style={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '12px',
          marginTop: '12px'
        }}>
          <button
            onClick={() => setIsDatosGeneralesOpen(false)}
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-secondary)',
              padding: '10px 20px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.88rem',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.07)';
              e.currentTarget.style.color = 'var(--text-primary)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
              e.currentTarget.style.color = 'var(--text-secondary)';
            }}
          >
            Cancelar
          </button>
          <button
            onClick={saveDatosGenerales}
            style={{
              background: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.35)',
              color: 'var(--color-success)',
              padding: '10px 24px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.88rem',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(16, 185, 129, 0.2)';
              e.currentTarget.style.boxShadow = '0 0 10px rgba(16, 185, 129, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(16, 185, 129, 0.1)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            Aceptar
          </button>
        </div>
      </Modal>

      {/* Modal - Catálogo de Insumos (Redesigned matching screenshot + premium theme) */}
      <Modal 
        isOpen={isCatalogoInsumosOpen} 
        onClose={() => setIsCatalogoInsumosOpen(false)} 
        title="CATÁLOGO DE INSUMOS"
      >
        <style>{`
          .modal-overlay:has(.catalogo-insumos-container) .modal-content {
            max-width: 950px !important;
            width: 95% !important;
          }
        `}</style>

        <div className="catalogo-insumos-container" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Toolbar */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px',
            background: 'rgba(0, 0, 0, 0.15)',
            padding: '12px 16px',
            borderRadius: '8px',
            border: '1px solid var(--border-color)'
          }}>
            {/* Actions button group */}
            <div style={{ display: 'flex', gap: '8px' }}>
              <button 
                onClick={() => {
                  setInsumoNombre('');
                  setInsumoCuadrilla('1');
                  setInsumoPU('10');
                  setIsAddInsumoOpen(true);
                }}
                style={{
                  background: 'rgba(0, 240, 255, 0.08)',
                  border: '1px solid rgba(0, 240, 255, 0.25)',
                  color: 'var(--color-primary)',
                  padding: '8px 14px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0, 240, 255, 0.15)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(0, 240, 255, 0.08)'}
              >
                Nuevo
              </button>
              <button 
                onClick={() => alert('Seleccione un registro para editar')}
                style={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-secondary)',
                  padding: '8px 14px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)'}
              >
                Editar
              </button>
              <button 
                onClick={() => alert('Seleccione un registro para duplicar')}
                style={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-secondary)',
                  padding: '8px 14px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)'}
              >
                Duplicar
              </button>
              <button 
                onClick={() => alert('Seleccione un registro para eliminar')}
                style={{
                  background: 'rgba(244, 63, 94, 0.08)',
                  border: '1px solid rgba(244, 63, 94, 0.25)',
                  color: 'var(--color-danger)',
                  padding: '8px 14px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(244, 63, 94, 0.15)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(244, 63, 94, 0.08)'}
              >
                Eliminar
              </button>
            </div>

            {/* Filter Dropdown & Search Bar */}
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Tipo:</span>
                <select
                  value={ciSelectedTipo}
                  onChange={(e) => setCiSelectedTipo(e.target.value)}
                  style={{
                    background: 'rgba(0, 0, 0, 0.2)',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-primary)',
                    borderRadius: '6px',
                    padding: '8px 12px',
                    fontSize: '0.82rem',
                    cursor: 'pointer',
                    outline: 'none',
                    fontFamily: 'var(--font-sans)'
                  }}
                >
                  <option value="TODOS" style={{ background: '#121622' }}>TODOS LOS REGISTROS ({MOCK_CATALOGO_INSUMOS.length})</option>
                  <option value="MATERIAL" style={{ background: '#121622' }}>MATERIAL</option>
                  <option value="EQUIPO" style={{ background: '#121622' }}>EQUIPO</option>
                  <option value="SUB CONTRATO" style={{ background: '#121622' }}>SUB CONTRATO</option>
                </select>
              </div>

              <div style={{ position: 'relative', width: '220px' }}>
                <input
                  type="text"
                  placeholder="Buscar insumo..."
                  value={ciSearchTerm}
                  onChange={(e) => setCiSearchTerm(e.target.value)}
                  style={{
                    width: '100%',
                    background: 'rgba(0, 0, 0, 0.25)',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-primary)',
                    padding: '8px 32px 8px 12px',
                    borderRadius: '6px',
                    fontSize: '0.82rem',
                    outline: 'none',
                    fontFamily: 'var(--font-sans)'
                  }}
                />
                <span style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                  🔍
                </span>
              </div>
            </div>
          </div>

          {/* Insumos List Table */}
          <div style={{
            maxHeight: '420px',
            overflowY: 'auto',
            borderRadius: '6px',
            border: '1px solid var(--border-color)',
            background: 'rgba(0, 0, 0, 0.1)'
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
              <thead style={{
                position: 'sticky',
                top: 0,
                background: 'var(--bg-surface-elevated)',
                borderBottom: '1px solid var(--border-color)',
                color: 'var(--text-secondary)',
                fontWeight: 600,
                zIndex: 10
              }}>
                <tr>
                  <th style={{ ...thStyle, width: '45%' }}>Insumos</th>
                  <th style={thStyle}>Unidad</th>
                  <th style={thStyle}>Precio</th>
                  <th style={thStyle}>Tipo</th>
                  <th style={thStyle}>IU</th>
                </tr>
              </thead>
              <tbody>
                {MOCK_CATALOGO_INSUMOS
                  .filter(ins => {
                    const matchesSearch = ins.nombre.toLowerCase().includes(ciSearchTerm.toLowerCase());
                    const matchesTipo = ciSelectedTipo === 'TODOS' || ins.tipo === ciSelectedTipo;
                    return matchesSearch && matchesTipo;
                  })
                  .map((ins, idx) => (
                    <tr 
                      key={idx}
                      style={{
                        borderBottom: '1px solid var(--border-color)',
                        cursor: 'pointer',
                        transition: 'background 0.2s'
                      }}
                      className="catalogo-row"
                      onClick={() => {
                        // Insert current insumo if editor is active
                        if (activeBudget && selectedPartidaId) {
                          const newIn: Insumo = {
                            id: 'i_' + Math.random().toString(36).substring(2, 9),
                            nombre: ins.nombre,
                            unidad: ins.unidad,
                            cuadrilla: 1,
                            pu: ins.precio,
                            tipo: ins.tipo === 'SUB CONTRATO' ? 'SC' : (ins.tipo === 'EQUIPO' ? 'EQ' : 'MT')
                          };
                          const updatedPartidas = activeBudget.partidas.map(p => {
                            if (p.id === selectedPartidaId) {
                              return { ...p, insumos: [...p.insumos, newIn] };
                            }
                            return p;
                          });
                          updateBudgetsList({ ...activeBudget, partidas: updatedPartidas });
                          setIsCatalogoInsumosOpen(false);
                          alert(`Insertado: ${ins.nombre}`);
                        } else {
                          alert(`Insumo seleccionado: ${ins.nombre}`);
                        }
                      }}
                    >
                      <td style={{ ...tdStyle, display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--text-primary)' }}>
                        <span style={{
                          display: 'inline-block',
                          width: '10px',
                          height: '10px',
                          borderRadius: '2px',
                          background: ins.color,
                          flexShrink: 0
                        }} />
                        {ins.nombre}
                      </td>
                      <td style={{ ...tdStyle, fontFamily: 'monospace' }}>{ins.unidad}</td>
                      <td style={{ ...tdStyle, fontWeight: 600 }}>S/ {ins.precio.toFixed(2)}</td>
                      <td style={tdStyle}>{ins.tipo}</td>
                      <td style={{ ...tdStyle, color: 'var(--text-muted)', fontSize: '0.8rem' }}>{ins.iu}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

          {/* Footer Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
            <button
              onClick={() => setIsCatalogoInsumosOpen(false)}
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-secondary)',
                padding: '10px 24px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '0.88rem',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.07)';
                e.currentTarget.style.color = 'var(--text-primary)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                e.currentTarget.style.color = 'var(--text-secondary)';
              }}
            >
              Cerrar Catálogo
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal - Catálogo de Partidas (Master-Detail matching screenshot + premium theme) */}
      <Modal 
        isOpen={isCatalogoPartidasOpen} 
        onClose={() => setIsCatalogoPartidasOpen(false)} 
        title="CATÁLOGO DE PARTIDAS"
      >
        <style>{`
          .modal-overlay:has(.catalogo-partidas-container) .modal-content {
            max-width: 1000px !important;
            width: 95% !important;
          }
        `}</style>

        <div className="catalogo-partidas-container" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Toolbar */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px',
            background: 'rgba(0, 0, 0, 0.15)',
            padding: '12px 16px',
            borderRadius: '8px',
            border: '1px solid var(--border-color)'
          }}>
            {/* Actions button group */}
            <div style={{ display: 'flex', gap: '8px' }}>
              <button 
                onClick={() => {
                  setPartidaNombre('');
                  setPartidaEsTitulo(false);
                  setPartidaMetrado('1');
                  setPartidaRendimiento('1');
                  setIsAddPartidaOpen(true);
                }}
                style={{
                  background: 'rgba(0, 240, 255, 0.08)',
                  border: '1px solid rgba(0, 240, 255, 0.25)',
                  color: 'var(--color-primary)',
                  padding: '8px 14px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0, 240, 255, 0.15)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(0, 240, 255, 0.08)'}
              >
                Nuevo
              </button>
              <button 
                onClick={() => alert('Seleccione un registro para editar')}
                style={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-secondary)',
                  padding: '8px 14px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)'}
              >
                Editar
              </button>
              <button 
                onClick={() => alert('Seleccione un registro para duplicar')}
                style={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-secondary)',
                  padding: '8px 14px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)'}
              >
                Duplicar
              </button>
              <button 
                onClick={() => alert('Seleccione un registro para eliminar')}
                style={{
                  background: 'rgba(244, 63, 94, 0.08)',
                  border: '1px solid rgba(244, 63, 94, 0.25)',
                  color: 'var(--color-danger)',
                  padding: '8px 14px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(244, 63, 94, 0.15)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(244, 63, 94, 0.08)'}
              >
                Eliminar
              </button>
            </div>

            {/* Search Bar */}
            <div style={{ position: 'relative', width: '250px' }}>
              <input
                type="text"
                placeholder="Buscar partida..."
                value={cpSearchTerm}
                onChange={(e) => setCpSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  background: 'rgba(0, 0, 0, 0.25)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-primary)',
                  padding: '8px 32px 8px 12px',
                  borderRadius: '6px',
                  fontSize: '0.82rem',
                  outline: 'none',
                  fontFamily: 'var(--font-sans)'
                }}
              />
              <span style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                🔍
              </span>
            </div>
          </div>

          {/* Master Partidas Table (Top Part) */}
          <div style={{
            maxHeight: '180px',
            overflowY: 'auto',
            borderRadius: '6px',
            border: '1px solid var(--border-color)',
            background: 'rgba(0, 0, 0, 0.1)'
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
              <thead style={{
                position: 'sticky',
                top: 0,
                background: 'var(--bg-surface-elevated)',
                borderBottom: '1px solid var(--border-color)',
                color: 'var(--text-secondary)',
                fontWeight: 600,
                zIndex: 10
              }}>
                <tr>
                  <th style={{ ...thStyle, width: '65%' }}>Partida</th>
                  <th style={thStyle}>Unidad</th>
                  <th style={thStyle}>CU</th>
                </tr>
              </thead>
              <tbody>
                {MOCK_CATALOGO_PARTIDAS
                  .map((p, idx) => ({ ...p, originalIndex: idx }))
                  .filter(p => p.nombre.toLowerCase().includes(cpSearchTerm.toLowerCase()))
                  .map((p) => {
                    const isSelected = cpSelectedPartidaIndex === p.originalIndex;
                    return (
                      <tr 
                        key={p.originalIndex}
                        style={{
                          borderBottom: '1px solid var(--border-color)',
                          background: isSelected ? 'rgba(0, 240, 255, 0.05)' : 'transparent',
                          cursor: 'pointer',
                          transition: 'background 0.2s'
                        }}
                        onClick={() => setCpSelectedPartidaIndex(p.originalIndex)}
                      >
                        <td style={{ ...tdStyle, color: isSelected ? 'var(--color-primary)' : 'var(--text-primary)', fontWeight: isSelected ? 600 : 500 }}>
                          {p.nombre}
                        </td>
                        <td style={tdStyle}>{p.unidad}</td>
                        <td style={{ ...tdStyle, fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                          S/ {p.cu.toFixed(2)}
                          <span title="Análisis cerrado/protegido" style={{ color: 'var(--color-warning)', fontSize: '0.85rem' }}>
                            🔒
                          </span>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>

          {/* Selected Partida Detail View (Bottom Part) */}
          {MOCK_CATALOGO_PARTIDAS[cpSelectedPartidaIndex] && (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              padding: '16px',
              background: 'rgba(0,0,0,0.15)'
            }}>
              {/* Rendimiento & Breakdown KPI Row */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '12px',
                borderBottom: '1px solid var(--border-color)',
                paddingBottom: '12px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Rendimiento:</span>
                  <input
                    type="number"
                    disabled
                    value={MOCK_CATALOGO_PARTIDAS[cpSelectedPartidaIndex].rendimiento}
                    style={{
                      background: 'rgba(0, 0, 0, 0.3)',
                      border: '1px solid var(--border-color)',
                      color: 'var(--text-primary)',
                      padding: '6px 10px',
                      width: '60px',
                      borderRadius: '4px',
                      fontSize: '0.82rem',
                      fontWeight: 'bold',
                      textAlign: 'center'
                    }}
                  />
                </div>

                {/* Visual Breakdown Boxes */}
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {[
                    { label: 'MO', val: MOCK_CATALOGO_PARTIDAS[cpSelectedPartidaIndex].mo, bg: 'rgba(249, 115, 22, 0.1)', border: 'rgba(249, 115, 22, 0.35)', color: '#f97316' },
                    { label: 'MT', val: MOCK_CATALOGO_PARTIDAS[cpSelectedPartidaIndex].mt, bg: 'rgba(0, 240, 255, 0.1)', border: 'rgba(0, 240, 255, 0.35)', color: '#00f0ff' },
                    { label: 'EQ', val: MOCK_CATALOGO_PARTIDAS[cpSelectedPartidaIndex].eq, bg: 'rgba(16, 185, 129, 0.1)', border: 'rgba(16, 185, 129, 0.35)', color: '#10b981' },
                    { label: 'SC', val: MOCK_CATALOGO_PARTIDAS[cpSelectedPartidaIndex].sc, bg: 'rgba(139, 92, 246, 0.1)', border: 'rgba(139, 92, 246, 0.35)', color: '#8b5cf6' },
                    { label: 'SP', val: MOCK_CATALOGO_PARTIDAS[cpSelectedPartidaIndex].sp, bg: 'rgba(14, 165, 233, 0.1)', border: 'rgba(14, 165, 233, 0.35)', color: '#0ea5e9' }
                  ].map(box => (
                    <div 
                      key={box.label}
                      style={{
                        background: box.bg,
                        border: `1px solid ${box.border}`,
                        borderRadius: '4px',
                        padding: '6px 12px',
                        fontSize: '0.8rem',
                        fontWeight: 'bold',
                        color: box.color
                      }}
                    >
                      {box.label}: S/ {box.val.toFixed(2)}
                    </div>
                  ))}
                  <div style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '4px',
                    padding: '6px 14px',
                    fontSize: '0.8rem',
                    fontWeight: 800,
                    color: 'var(--text-primary)'
                  }}>
                    CU: S/ {MOCK_CATALOGO_PARTIDAS[cpSelectedPartidaIndex].cu.toFixed(2)}
                  </div>
                </div>
              </div>

              {/* Detail Table (Insumos Breakdown) */}
              <div style={{
                maxHeight: '180px',
                overflowY: 'auto',
                borderRadius: '6px',
                border: '1px solid var(--border-color)',
                background: 'rgba(0,0,0,0.1)'
              }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.82rem' }}>
                  <thead style={{
                    position: 'sticky',
                    top: 0,
                    background: 'var(--bg-surface-elevated)',
                    borderBottom: '1px solid var(--border-color)',
                    color: 'var(--text-secondary)',
                    fontWeight: 600,
                    zIndex: 5
                  }}>
                    <tr>
                      <th style={{ ...thStyle, width: '40%' }}>Insumo</th>
                      <th style={thStyle}>Unidad</th>
                      <th style={thStyle}>Cuadrilla</th>
                      <th style={thStyle}>Cantidad</th>
                      <th style={thStyle}>PU</th>
                      <th style={thStyle}>Parcial</th>
                    </tr>
                  </thead>
                  <tbody>
                    {MOCK_CATALOGO_PARTIDAS[cpSelectedPartidaIndex].insumos.map((ins, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <td style={{ ...tdStyle, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{
                            display: 'inline-block',
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            background: ins.color,
                            flexShrink: 0
                          }} />
                          {ins.nombre}
                        </td>
                        <td style={tdStyle}>{ins.unidad}</td>
                        <td style={tdStyle}>{ins.cuadrilla > 0 ? ins.cuadrilla.toFixed(4) : '-'}</td>
                        <td style={tdStyle}>{ins.cantidad.toFixed(4)}</td>
                        <td style={tdStyle}>S/ {ins.pu.toFixed(2)}</td>
                        <td style={{ ...tdStyle, color: 'var(--color-primary)', fontWeight: 600 }}>S/ {ins.parcial.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '12px',
            marginTop: '8px'
          }}>
            <button
              onClick={() => setIsCatalogoPartidasOpen(false)}
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-secondary)',
                padding: '10px 24px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '0.88rem',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.07)';
                e.currentTarget.style.color = 'var(--text-primary)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                e.currentTarget.style.color = 'var(--text-secondary)';
              }}
            >
              Cancelar
            </button>
            <button
              onClick={() => {
                const targetPartida = MOCK_CATALOGO_PARTIDAS[cpSelectedPartidaIndex];
                if (!targetPartida || !activeBudget) return;

                const nextIndex = activeBudget.partidas.length + 1;
                // Map the mock catalog insumos format into activeBudget Insumo format
                const mappedInsumos: Insumo[] = targetPartida.insumos.map((ins) => ({
                  id: 'i_' + Math.random().toString(36).substring(2, 9),
                  nombre: ins.nombre,
                  unidad: ins.unidad,
                  cuadrilla: ins.cuadrilla,
                  pu: ins.pu,
                  tipo: ins.tipo as 'MO' | 'MT' | 'EQ' | 'SC' | 'SP'
                }));

                const newPartida: Partida = {
                  id: 'p_' + Math.random().toString(36).substring(2, 9),
                  item: nextIndex.toString(),
                  nombre: targetPartida.nombre,
                  unidad: targetPartida.unidad,
                  metrado: 1.00,
                  esTitulo: false,
                  rendimiento: targetPartida.rendimiento,
                  insumos: mappedInsumos
                };

                updateBudgetsList({ ...activeBudget, partidas: [...activeBudget.partidas, newPartida] });
                setIsCatalogoPartidasOpen(false);
                alert(`Insertada partida: ${targetPartida.nombre}`);
              }}
              style={{
                background: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid rgba(16, 185, 129, 0.35)',
                color: 'var(--color-success)',
                padding: '10px 24px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '0.88rem',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(16, 185, 129, 0.2)';
                e.currentTarget.style.boxShadow = '0 0 10px rgba(16, 185, 129, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(16, 185, 129, 0.1)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              Insertar Partida
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal - Lista de Insumos (Redesigned matching screenshot + premium theme) */}
      <Modal 
        isOpen={isListaInsumosOpen} 
        onClose={() => setIsListaInsumosOpen(false)} 
        title={`LISTA DE INSUMOS: ${activeBudget?.subPresupuestos[0] || 'SUB PRESUPUESTO 1'}`}
      >
        <style>{`
          .modal-overlay:has(.lista-insumos-container) .modal-content {
            max-width: 950px !important;
            width: 95% !important;
          }
        `}</style>

        <div className="lista-insumos-container" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Toolbar */}
          <div style={{
            display: 'flex',
            gap: '12px',
            background: 'rgba(0, 0, 0, 0.15)',
            padding: '12px 16px',
            borderRadius: '8px',
            border: '1px solid var(--border-color)',
            alignItems: 'center'
          }}>
            <button 
              onClick={() => alert('Generando reporte PDF de insumos...')}
              style={{
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-primary)',
                padding: '8px 16px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '0.82rem',
                fontWeight: 600,
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)'}
            >
              📄 PDF
            </button>
            <button 
              onClick={() => alert('Exportando a hoja de cálculo...')}
              style={{
                background: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid rgba(16, 185, 129, 0.25)',
                color: 'var(--color-success)',
                padding: '8px 16px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '0.82rem',
                fontWeight: 600,
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(16, 185, 129, 0.15)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(16, 185, 129, 0.1)'}
            >
              📥 Exportar a hoja de cálculo
            </button>
          </div>

          {/* Insumos Table */}
          <div style={{
            maxHeight: '400px',
            overflowY: 'auto',
            borderRadius: '6px',
            border: '1px solid var(--border-color)',
            background: 'rgba(0, 0, 0, 0.1)'
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
              <thead style={{
                position: 'sticky',
                top: 0,
                background: 'var(--bg-surface-elevated)',
                borderBottom: '1px solid var(--border-color)',
                color: 'var(--text-secondary)',
                fontWeight: 600,
                zIndex: 10
              }}>
                <tr>
                  <th style={{ ...thStyle, width: '40%' }}>Insumo</th>
                  <th style={thStyle}>Unidad</th>
                  <th style={thStyle}>Cantidad</th>
                  <th style={thStyle}>PU</th>
                  <th style={thStyle}>Parcial</th>
                  <th style={{ ...thStyle, width: '30%' }}>IU (Índice Unificado)</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { nombre: 'PEON', unidad: 'HH', cantidad: 1008.0000, pu: 14.33, parcial: 14444.64, iu: '39 : INDICE DE PRECIOS AL CONSUMIDOR (INEI)', color: '#f97316' },
                  { nombre: 'OPERARIO', unidad: 'HH', cantidad: 504.0000, pu: 19.23, parcial: 9691.92, iu: '39 : INDICE DE PRECIOS AL CONSUMIDOR (INEI)', color: '#f97316' },
                  { nombre: 'ANDAMIO METALICO', unidad: 'HM', cantidad: 5.0000, pu: 150.00, parcial: 750.00, iu: '39 : INDICE DE PRECIOS AL CONSUMIDOR (INEI)', color: '#00f0ff' },
                  { nombre: 'HERRAMIENTAS MANUALES', unidad: '%MO', cantidad: 1008.0000, pu: 6.85, parcial: 116.92, iu: '37 : HERRAMIENTA MANUAL', color: '#10b981' },
                  { nombre: 'MOVILIZACION Y DESMOVILIZACION DE EQUIPOS', unidad: 'GLB', cantidad: 1.0000, pu: 100.00, parcial: 100.00, iu: '39 : INDICE DE PRECIOS AL CONSUMIDOR (INEI)', color: '#8b5cf6' },
                  { nombre: 'SERVICIO SEGURIDAD EN OBRA', unidad: 'GLB', cantidad: 1.0000, pu: 400.00, parcial: 400.00, iu: '39 : INDICE DE PRECIOS AL CONSUMIDOR (INEI)', color: '#8b5cf6' },
                  { nombre: 'TRANSPORTE DE MATERIALES, EQUIPOS Y HERRAMIENTAS', unidad: 'GLB', cantidad: 5.0400, pu: 8.00, parcial: 40.32, iu: '39 : INDICE DE PRECIOS AL CONSUMIDOR (INEI)', color: '#8b5cf6' }
                ].map((ins, idx) => (
                  <tr 
                    key={idx}
                    style={{
                      borderBottom: '1px solid var(--border-color)',
                      transition: 'background 0.2s'
                    }}
                    className="lista-insumos-row"
                  >
                    <td style={{ ...tdStyle, display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--text-primary)', fontWeight: 600 }}>
                      <span style={{
                        display: 'inline-block',
                        width: '8px',
                        height: '8px',
                        borderRadius: '2px',
                        background: ins.color,
                        flexShrink: 0
                      }} />
                      {ins.nombre}
                    </td>
                    <td style={tdStyle}>{ins.unidad}</td>
                    <td style={{ ...tdStyle, fontFamily: 'monospace' }}>{ins.cantidad.toFixed(4)}</td>
                    <td style={{ ...tdStyle, fontFamily: 'monospace' }}>S/ {ins.pu.toFixed(2)}</td>
                    <td style={{ ...tdStyle, color: 'var(--color-primary)', fontWeight: 600 }}>S/ {ins.parcial.toFixed(2)}</td>
                    <td style={{ ...tdStyle, padding: '4px 8px' }}>
                      <select
                        defaultValue={ins.iu}
                        style={{
                          width: '100%',
                          background: 'rgba(0, 0, 0, 0.25)',
                          border: '1px solid var(--border-color)',
                          color: 'var(--text-primary)',
                          borderRadius: '4px',
                          padding: '6px 10px',
                          fontSize: '0.8rem',
                          fontFamily: 'var(--font-sans)',
                          outline: 'none',
                          cursor: 'pointer'
                        }}
                      >
                        {[
                          '11 : ARTEFACTO DE ALUMBRADO EXTERIOR',
                          '12 : ARTEFACTO DE ALUMBRADO INTERIOR',
                          '13 : ASFALTO',
                          '14 : BALDOSA ACUSTICA',
                          '16 : BALDOSA VINILICA Y PVC',
                          '17 : BLOQUES Y LADRILLOS',
                          '18 : CABLE TELEFONICO Y DE RED',
                          '19 : CABLE NYY, N2XY, NPT, N2XOH, N2XSY',
                          '20 : CEMENTO ASFÁLTICO',
                          '21 : CEMENTO PORTLAND E HIDRAULICO',
                          '24 : CERAMICA Y PORCELANATO',
                          '26 : CERRAJERIA',
                          '27 : DETONANTE',
                          '28 : DINAMITA',
                          '30 : DOLAR MAS INFLACIÓN MERCADO USA',
                          '31 : PREFABRICADO DE CONCRETO',
                          '32 : FLETE TERRESTRE',
                          '33 : FLETE AEREO',
                          '34 : GASOHOL Y GASOLINA',
                          '37 : HERRAMIENTA MANUAL',
                          '39 : INDICE DE PRECIOS AL CONSUMIDOR (INEI)'
                        ].map(iuItem => (
                          <option key={iuItem} value={iuItem} style={{ background: '#121622', color: 'var(--text-primary)' }}>
                            {iuItem}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Footer Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
            <button
              onClick={() => setIsListaInsumosOpen(false)}
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-secondary)',
                padding: '10px 24px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '0.88rem',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.07)';
                e.currentTarget.style.color = 'var(--text-primary)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                e.currentTarget.style.color = 'var(--text-secondary)';
              }}
            >
              Cerrar Lista
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal - Gastos Generales (Redesigned matching screenshot + premium theme) */}
      <Modal 
        isOpen={isGastosGeneralesOpen} 
        onClose={() => setIsGastosGeneralesOpen(false)} 
        title="GASTOS GENERALES"
      >
        <style>{`
          .modal-overlay:has(.gastos-generales-container) .modal-content {
            max-width: 950px !important;
            width: 95% !important;
          }
        `}</style>

        {/* Calculations */}
        {(() => {
          const items = ggTipo === 'FIJOS' ? ggFijosItems : ggVariablesItems;
          const totalGG = items.reduce((sum, item) => sum + (item.parcial || 0), 0);
          const cd = activeBudget ? getBudgetCD(activeBudget) : 0;
          const pgg = cd > 0 ? (totalGG / cd) * 100 : 0;

          const handleUpdateItem = (index: number, field: 'item' | 'titulo' | 'parcial', value: any) => {
            const listCopy = [...items];
            listCopy[index] = { ...listCopy[index], [field]: value };
            if (ggTipo === 'FIJOS') {
              setGgFijosItems(listCopy);
            } else {
              setGgVariablesItems(listCopy);
            }
          };

          const handleAddItem = () => {
            const nextIdx = items.length + 1;
            const prefix = ggTipo === 'FIJOS' ? '01' : '02';
            const newItem = {
              item: `${prefix}.${nextIdx < 10 ? '0' + nextIdx : nextIdx}`,
              titulo: 'NUEVO CONCEPTO',
              parcial: 0.00
            };
            if (ggTipo === 'FIJOS') {
              setGgFijosItems([...ggFijosItems, newItem]);
            } else {
              setGgVariablesItems([...ggVariablesItems, newItem]);
            }
          };

          const handleAddTitle = () => {
            const newItem = {
              item: '',
              titulo: '=== NUEVA CATEGORÍA DE GASTO ===',
              parcial: 0.00
            };
            if (ggTipo === 'FIJOS') {
              setGgFijosItems([...ggFijosItems, newItem]);
            } else {
              setGgVariablesItems([...ggVariablesItems, newItem]);
            }
          };

          const handleDeleteRow = (index: number) => {
            const filtered = items.filter((_, i) => i !== index);
            if (ggTipo === 'FIJOS') {
              setGgFijosItems(filtered);
            } else {
              setGgVariablesItems(filtered);
            }
          };

          return (
            <div className="gastos-generales-container" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Toolbar */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '12px',
                background: 'rgba(0, 0, 0, 0.15)',
                padding: '12px 16px',
                borderRadius: '8px',
                border: '1px solid var(--border-color)'
              }}>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <button 
                    onClick={() => {
                      alert('¡Gastos generales guardados exitosamente!');
                    }}
                    style={{
                      background: 'var(--grad-primary)',
                      border: 'none',
                      color: '#ffffff',
                      padding: '8px 16px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      transition: 'all 0.2s'
                    }}
                  >
                    💾 Guardar
                  </button>
                  <button 
                    onClick={handleAddTitle}
                    style={{
                      background: 'rgba(255, 255, 255, 0.02)',
                      border: '1px solid var(--border-color)',
                      color: 'var(--text-primary)',
                      padding: '8px 14px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)'}
                  >
                    ➕ +Título
                  </button>

                  <select
                    value={ggTipo}
                    onChange={(e: any) => setGgTipo(e.target.value)}
                    style={{
                      background: 'rgba(0, 0, 0, 0.2)',
                      border: '1px solid var(--border-color)',
                      color: 'var(--text-primary)',
                      borderRadius: '6px',
                      padding: '8px 12px',
                      fontSize: '0.82rem',
                      cursor: 'pointer',
                      outline: 'none',
                      fontFamily: 'var(--font-sans)',
                      fontWeight: 600
                    }}
                  >
                    <option value="FIJOS" style={{ background: '#121622' }}>GASTOS GENERALES FIJOS</option>
                    <option value="VARIABLES" style={{ background: '#121622' }}>GASTOS GENERALES VARIABLES</option>
                  </select>
                </div>

                {/* Info and Actions */}
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <button 
                    onClick={() => alert('Exportando a PDF...')}
                    style={{
                      background: 'rgba(255, 255, 255, 0.02)',
                      border: '1px solid var(--border-color)',
                      color: 'var(--text-secondary)',
                      padding: '6px 12px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '0.8rem'
                    }}
                  >
                    PDF
                  </button>
                  <button 
                    onClick={() => alert('Exportando a Hoja de Cálculo...')}
                    style={{
                      background: 'rgba(255, 255, 255, 0.02)',
                      border: '1px solid var(--border-color)',
                      color: 'var(--text-secondary)',
                      padding: '6px 12px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '0.8rem'
                    }}
                  >
                    Hoja de Cálculo
                  </button>

                  {/* Reactive calculations labels */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    background: 'rgba(0, 240, 255, 0.05)',
                    border: '1px solid rgba(0, 240, 255, 0.2)',
                    padding: '6px 12px',
                    borderRadius: '6px',
                    fontSize: '0.82rem',
                    fontWeight: 'bold',
                    color: 'var(--color-primary)'
                  }}>
                    <span>PGG = {pgg.toFixed(4)}%</span>
                    <span style={{ opacity: 0.5 }}>|</span>
                    <span>GG = S/ {totalGG.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </div>

              {/* General Expenses Table */}
              <div style={{
                maxHeight: '320px',
                overflowY: 'auto',
                borderRadius: '6px',
                border: '1px solid var(--border-color)',
                background: 'rgba(0, 0, 0, 0.1)'
              }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                  <thead style={{
                    position: 'sticky',
                    top: 0,
                    background: 'var(--bg-surface-elevated)',
                    borderBottom: '1px solid var(--border-color)',
                    color: 'var(--text-secondary)',
                    fontWeight: 600,
                    zIndex: 10
                  }}>
                    <tr>
                      <th style={{ ...thStyle, width: '15%' }}>Item</th>
                      <th style={{ ...thStyle, width: '60%' }}>Título / Concepto</th>
                      <th style={{ ...thStyle, width: '20%' }}>Parcial</th>
                      <th style={{ ...thStyle, width: '5%', textAlign: 'center' }}>Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((row, idx) => {
                      const isTitle = row.titulo.startsWith('===');
                      return (
                        <tr 
                          key={idx} 
                          style={{ 
                            borderBottom: '1px solid var(--border-color)',
                            background: isTitle ? 'rgba(139, 92, 246, 0.02)' : 'transparent'
                          }}
                        >
                          <td style={tdStyle}>
                            <input
                              type="text"
                              value={row.item}
                              onChange={(e) => handleUpdateItem(idx, 'item', e.target.value)}
                              placeholder="..."
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: 'var(--text-primary)',
                                outline: 'none',
                                fontFamily: 'monospace',
                                width: '100%',
                                fontSize: '0.85rem'
                              }}
                            />
                          </td>
                          <td style={tdStyle}>
                            <input
                              type="text"
                              value={row.titulo}
                              onChange={(e) => handleUpdateItem(idx, 'titulo', e.target.value)}
                              placeholder="Escriba el concepto..."
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: isTitle ? 'var(--color-secondary)' : 'var(--text-primary)',
                                outline: 'none',
                                fontFamily: 'var(--font-sans)',
                                fontWeight: isTitle ? 'bold' : 500,
                                width: '100%',
                                fontSize: '0.85rem'
                              }}
                            />
                          </td>
                          <td style={tdStyle}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <span style={{ color: 'var(--text-muted)' }}>S/</span>
                              <input
                                type="number"
                                step="0.01"
                                value={row.parcial}
                                onChange={(e) => handleUpdateItem(idx, 'parcial', parseFloat(e.target.value) || 0)}
                                style={{
                                  background: 'transparent',
                                  border: 'none',
                                  color: 'var(--color-primary)',
                                  outline: 'none',
                                  fontFamily: 'monospace',
                                  fontWeight: 600,
                                  width: '100%',
                                  fontSize: '0.85rem'
                                }}
                              />
                            </div>
                          </td>
                          <td style={{ ...tdStyle, textAlign: 'center' }}>
                            <button
                              onClick={() => handleDeleteRow(idx)}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: 'var(--color-danger)',
                                cursor: 'pointer',
                                fontSize: '1rem',
                                transition: 'transform 0.1s'
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.15)'}
                              onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                            >
                              🗑️
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Bottom bar */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px 16px',
                background: 'rgba(0,0,0,0.15)',
                borderRadius: '8px',
                border: '1px solid var(--border-color)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Formato:</span>
                  <select
                    style={{
                      background: 'rgba(0, 0, 0, 0.25)',
                      border: '1px solid var(--border-color)',
                      color: 'var(--text-primary)',
                      borderRadius: '4px',
                      padding: '6px 12px',
                      fontSize: '0.8rem',
                      fontFamily: 'var(--font-sans)',
                      outline: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    <option>Estándar</option>
                    <option>Desglosado</option>
                  </select>
                </div>

                <button
                  onClick={handleAddItem}
                  style={{
                    background: 'rgba(0, 240, 255, 0.1)',
                    border: '1px solid rgba(0, 240, 255, 0.35)',
                    color: 'var(--color-primary)',
                    padding: '8px 16px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(0, 240, 255, 0.2)';
                    e.currentTarget.style.boxShadow = '0 0 10px rgba(0, 240, 255, 0.3)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(0, 240, 255, 0.1)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  ➕ Agregar item
                </button>
              </div>

              {/* Close Button Footer */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '4px' }}>
                <button
                  onClick={() => setIsGastosGeneralesOpen(false)}
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-secondary)',
                    padding: '10px 24px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontSize: '0.88rem',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.07)';
                    e.currentTarget.style.color = 'var(--text-primary)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                    e.currentTarget.style.color = 'var(--text-secondary)';
                  }}
                >
                  Cerrar
                </button>
              </div>
            </div>
          );
        })()}
      </Modal>

      {/* Modal - Pie de Presupuesto (Redesigned matching screenshot + premium theme) */}
      <Modal 
        isOpen={isPiePresupuestoOpen} 
        onClose={() => setIsPiePresupuestoOpen(false)} 
        title={`PIE DEL SUB PRESUPUESTO: ${activeBudget?.subPresupuestos[0] || 'SUB PRESUPUESTO 1'}`}
      >
        <style>{`
          .modal-overlay:has(.pie-presupuesto-container) .modal-content {
            max-width: 900px !important;
            width: 95% !important;
            padding: 0 !important;
            overflow: hidden !important;
            background: #0f111a !important;
            border: 1px solid rgba(0, 240, 255, 0.2) !important;
            box-shadow: 0 0 30px rgba(0, 240, 255, 0.1) !important;
          }
          .pie-presupuesto-container {
            display: flex;
            flex-direction: column;
            gap: 0px;
          }
          .pie-presupuesto-toolbar {
            display: flex;
            gap: 20px;
            padding: 12px 20px;
            background: rgba(255, 255, 255, 0.02);
            border-bottom: 1px solid var(--border-color);
          }
          .pie-toolbar-btn {
            background: transparent;
            border: none;
            color: var(--text-secondary);
            font-size: 0.85rem;
            font-weight: 500;
            cursor: pointer;
            padding: 4px 8px;
            transition: all 0.2s;
            font-family: var(--font-sans);
          }
          .pie-toolbar-btn:hover {
            color: var(--color-primary);
            text-shadow: 0 0 8px rgba(0, 240, 255, 0.5);
          }
          .pie-presupuesto-table {
            width: 100%;
            border-collapse: collapse;
            text-align: left;
            font-size: 0.85rem;
          }
          .pie-presupuesto-table th {
            background: rgba(255, 255, 255, 0.03);
            color: var(--text-secondary);
            font-weight: 600;
            text-transform: uppercase;
            font-size: 0.76rem;
            padding: 10px 12px;
            border-bottom: 1px solid var(--border-color);
            border-right: 1px solid rgba(255, 255, 255, 0.05);
          }
          .pie-presupuesto-table td {
            padding: 4px 8px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.05);
            border-right: 1px solid rgba(255, 255, 255, 0.03);
            color: var(--text-secondary);
          }
          .pie-presupuesto-table input[type="text"] {
            background: transparent;
            border: 1px solid transparent;
            color: var(--text-primary);
            outline: none;
            padding: 6px 10px;
            font-size: 0.85rem;
            width: 100%;
            transition: all 0.15s;
            box-sizing: border-box;
          }
          .pie-presupuesto-table input[type="text"]:focus {
            border-color: rgba(0, 240, 255, 0.4);
            background: rgba(0, 240, 255, 0.03);
            border-radius: 4px;
          }
          .pie-presupuesto-table input[type="text"]:hover:not(:focus):not(:disabled) {
            border-color: rgba(255, 255, 255, 0.15);
            background: rgba(255, 255, 255, 0.01);
            border-radius: 4px;
          }
          .pie-presupuesto-table input:disabled {
            color: var(--text-muted) !important;
            cursor: not-allowed;
          }
          .pie-agregar-row {
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 10px;
            background: rgba(255, 255, 255, 0.01);
            border-bottom: 1px solid var(--border-color);
            cursor: pointer;
            font-size: 0.85rem;
            font-weight: 600;
            color: var(--text-secondary);
            transition: all 0.15s;
          }
          .pie-agregar-row:hover {
            background: rgba(0, 240, 255, 0.03);
            color: var(--color-primary);
          }
        `}</style>

        {(() => {
          const cd = activeBudget ? getBudgetCD(activeBudget) : 0;
          const values: { [key: string]: number } = { CD: cd };
          
          const calculatedRows = pieRows.map(row => {
            if (row.variable === 'CD') {
              return { ...row, valor: cd };
            }
            let val = 0;
            try {
              let expr = row.formula;
              Object.keys(values).forEach(key => {
                const regex = new RegExp(`\\b${key}\\b`, 'g');
                expr = expr.replace(regex, values[key].toString());
              });
              if (expr.trim()) {
                const cleanExpr = expr.replace(/[^0-9.+\-*/() ]/g, '');
                val = Function(`"use strict"; return (${cleanExpr})`)();
              }
            } catch (e) {
              val = 0;
            }
            values[row.variable] = val;
            return { ...row, valor: val };
          });

          const handleUpdateRow = (index: number, field: string, val: any) => {
            const copy = [...pieRows];
            copy[index] = { ...copy[index], [field]: val };
            setPieRows(copy);
          };

          const handleAddRow = () => {
            const copy = [...pieRows];
            copy.splice(copy.length - 1, 0, {
              variable: 'CARGO',
              descripcion: 'NUEVO CONCEPTO',
              formula: 'CD * 0.05',
              iu: '39',
              resaltar: false
            });
            setPieRows(copy);
          };

          const handleDeleteRow = (index: number) => {
            const row = pieRows[index];
            if (row.variable === 'CD' || row.variable === 'TOTAL') {
              alert('Las variables de COSTO DIRECTO y TOTAL no se pueden eliminar.');
              return;
            }
            setPieRows(pieRows.filter((_, i) => i !== index));
          };

          return (
            <div className="pie-presupuesto-container">
              {/* Toolbar */}
              <div className="pie-presupuesto-toolbar">
                <button 
                  className="pie-toolbar-btn"
                  onClick={() => {
                    alert('Fórmula de pie aplicada con éxito.');
                    setIsPiePresupuestoOpen(false);
                  }}
                >
                  Aplicar
                </button>
                <button 
                  className="pie-toolbar-btn"
                  onClick={() => alert('Parámetros insertados en la base de datos')}
                >
                  Insertar
                </button>
                <button 
                  className="pie-toolbar-btn"
                  onClick={() => alert('Aplicado el mismo formato a todos los sub presupuestos')}
                >
                  Aplicar a todos los sub presupuestos
                </button>
              </div>

              {/* Pie Table */}
              <div style={{ maxHeight: '380px', overflowY: 'auto' }}>
                <table className="pie-presupuesto-table">
                  <thead>
                    <tr>
                      <th style={{ width: '12%', textAlign: 'center' }}>Variable</th>
                      <th style={{ width: '35%' }}>Descripción</th>
                      <th style={{ width: '20%' }}>Fórmula</th>
                      <th style={{ width: '15%', textAlign: 'right' }}>Valor</th>
                      <th style={{ width: '8%', textAlign: 'center' }}>IU</th>
                      <th style={{ width: '8%', textAlign: 'center' }}>Resaltar?</th>
                      <th style={{ width: '5%', textAlign: 'center' }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {calculatedRows.map((row, idx) => {
                      const isLocked = row.variable === 'CD';
                      return (
                        <tr 
                          key={idx}
                          style={{
                            background: row.resaltar ? 'rgba(0, 240, 255, 0.03)' : 'transparent',
                            fontWeight: row.resaltar ? 'bold' : 'normal'
                          }}
                        >
                          {/* Variable */}
                          <td>
                            <input
                              type="text"
                              disabled={isLocked}
                              value={row.variable}
                              onChange={(e) => handleUpdateRow(idx, 'variable', e.target.value.toUpperCase())}
                              style={{
                                fontFamily: 'monospace',
                                fontWeight: 'bold',
                                textAlign: 'center'
                              }}
                            />
                          </td>

                          {/* Descripción */}
                          <td>
                            <input
                              type="text"
                              disabled={isLocked}
                              value={row.descripcion}
                              onChange={(e) => handleUpdateRow(idx, 'descripcion', e.target.value)}
                            />
                          </td>

                          {/* Fórmula */}
                          <td>
                            <input
                              type="text"
                              disabled={isLocked}
                              placeholder=""
                              value={row.formula}
                              onChange={(e) => handleUpdateRow(idx, 'formula', e.target.value)}
                              style={{
                                fontFamily: 'monospace',
                                color: 'var(--color-secondary)'
                              }}
                            />
                          </td>

                          {/* Valor */}
                          <td style={{ 
                            textAlign: 'right', 
                            color: row.resaltar ? 'var(--color-primary)' : 'var(--text-primary)', 
                            fontWeight: 'bold', 
                            fontFamily: 'monospace',
                            paddingRight: '12px'
                          }}>
                            S/ {row.valor.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>

                          {/* IU */}
                          <td style={{ textAlign: 'center' }}>
                            {!isLocked && row.variable !== 'TOTAL' && row.variable !== 'ST' && row.variable !== 'IGV' ? (
                              <input
                                type="text"
                                value={row.iu}
                                onChange={(e) => handleUpdateRow(idx, 'iu', e.target.value)}
                                style={{
                                  textAlign: 'center',
                                  fontFamily: 'monospace'
                                }}
                              />
                            ) : '-'}
                          </td>

                          {/* Resaltar? */}
                          <td style={{ textAlign: 'center' }}>
                            <input
                              type="checkbox"
                              checked={row.resaltar}
                              disabled={isLocked}
                              onChange={(e) => handleUpdateRow(idx, 'resaltar', e.target.checked)}
                              style={{
                                width: '16px',
                                height: '16px',
                                cursor: isLocked ? 'not-allowed' : 'pointer'
                              }}
                            />
                          </td>

                          {/* Delete */}
                          <td style={{ textAlign: 'center' }}>
                            {!isLocked && row.variable !== 'TOTAL' && (
                              <button
                                onClick={() => handleDeleteRow(idx)}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  color: 'var(--color-danger)',
                                  cursor: 'pointer',
                                  fontSize: '1rem'
                                }}
                              >
                                🗑️
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Bottom Add Row button (Matches screenshot style) */}
              <div className="pie-agregar-row" onClick={handleAddRow}>
                + Agregar
              </div>

              {/* Close Footer */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '16px 20px', background: 'rgba(0,0,0,0.1)' }}>
                <button
                  onClick={() => setIsPiePresupuestoOpen(false)}
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-secondary)',
                    padding: '8px 20px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontSize: '0.85rem',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.07)';
                    e.currentTarget.style.color = 'var(--text-primary)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                    e.currentTarget.style.color = 'var(--text-secondary)';
                  }}
                >
                  Cerrar
                </button>
              </div>
            </div>
          );
        })()}
      </Modal>

      {/* Modal - Fórmula Polinómica (Redesigned matching screenshot + premium theme) */}
      <Modal 
        isOpen={isFormulaPolinomicaOpen} 
        onClose={() => setIsFormulaPolinomicaOpen(false)} 
        title={`FÓRMULA POLINÓMICA: ${activeBudget?.subPresupuestos[0] || 'SUB PRESUPUESTO 1'}`}
      >
        <style>{`
          .modal-overlay:has(.formula-polinomica-container) .modal-content {
            max-width: 900px !important;
            width: 95% !important;
            padding: 0 !important;
            overflow: hidden !important;
            background: #0f111a !important;
            border: 1px solid rgba(0, 240, 255, 0.2) !important;
            box-shadow: 0 0 30px rgba(0, 240, 255, 0.1) !important;
          }
          .formula-polinomica-container {
            display: flex;
            flex-direction: column;
            gap: 0px;
          }
          .formula-toolbar {
            display: flex;
            gap: 20px;
            padding: 12px 20px;
            background: rgba(255, 255, 255, 0.02);
            border-bottom: 1px solid var(--border-color);
          }
          .formula-toolbar-btn {
            background: transparent;
            border: none;
            color: var(--text-secondary);
            font-size: 0.85rem;
            font-weight: 500;
            cursor: pointer;
            padding: 4px 8px;
            transition: all 0.2s;
            font-family: var(--font-sans);
          }
          .formula-toolbar-btn:hover {
            color: var(--color-primary);
            text-shadow: 0 0 8px rgba(0, 240, 255, 0.5);
          }
          .formula-table {
            width: 100%;
            border-collapse: collapse;
            text-align: left;
            font-size: 0.85rem;
          }
          .formula-table th {
            background: rgba(255, 255, 255, 0.03);
            color: var(--text-secondary);
            font-weight: 600;
            text-transform: uppercase;
            font-size: 0.76rem;
            padding: 10px 12px;
            border-bottom: 1px solid var(--border-color);
            border-right: 1px solid rgba(255, 255, 255, 0.05);
          }
          .formula-table td {
            padding: 4px 8px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.05);
            border-right: 1px solid rgba(255, 255, 255, 0.03);
            color: var(--text-secondary);
          }
          .formula-table input[type="text"], .formula-table input[type="number"] {
            background: transparent;
            border: 1px solid transparent;
            color: var(--text-primary);
            outline: none;
            padding: 6px 10px;
            font-size: 0.85rem;
            width: 100%;
            transition: all 0.15s;
            box-sizing: border-box;
          }
          .formula-table input:focus {
            border-color: rgba(0, 240, 255, 0.4);
            background: rgba(0, 240, 255, 0.03);
            border-radius: 4px;
          }
          .formula-table input:hover:not(:focus):not(:disabled) {
            border-color: rgba(255, 255, 255, 0.15);
            background: rgba(255, 255, 255, 0.01);
            border-radius: 4px;
          }
          .formula-table select {
            background: transparent;
            border: 1px solid transparent;
            color: var(--text-primary);
            outline: none;
            padding: 6px 10px;
            font-size: 0.85rem;
            width: 100%;
            cursor: pointer;
            transition: all 0.15s;
            box-sizing: border-box;
          }
          .formula-table select:focus {
            border-color: rgba(0, 240, 255, 0.4);
            background: rgba(15, 17, 26, 0.95);
            border-radius: 4px;
          }
          .formula-table select:hover:not(:focus) {
            border-color: rgba(255, 255, 255, 0.15);
            background: rgba(255, 255, 255, 0.01);
            border-radius: 4px;
          }
          .formula-table select option {
            background: #0f111a;
            color: var(--text-primary);
          }
        `}</style>

        {(() => {
          const sumCoef = formulaPolinomicaRows.reduce((sum, r) => sum + (r.coeficiente || 0), 0);
          const isCorrectSum = Math.abs(sumCoef - 1.000) < 0.001;

          const handleUpdateRow = (index: number, field: string, val: any) => {
            const copy = [...formulaPolinomicaRows];
            copy[index] = { ...copy[index], [field]: val };
            setFormulaPolinomicaRows(copy);
          };

          return (
            <div className="formula-polinomica-container">
              {/* Toolbar */}
              <div className="formula-toolbar">
                <button 
                  className="formula-toolbar-btn"
                  onClick={() => {
                    if (!isCorrectSum) {
                      alert(`La suma de coeficientes es ${sumCoef.toFixed(3)}. Debe ser exactamente 1.000 antes de aplicar.`);
                    } else {
                      alert('Fórmula polinómica aplicada con éxito.');
                      setIsFormulaPolinomicaOpen(false);
                    }
                  }}
                >
                  Aplicar
                </button>
                <button 
                  className="formula-toolbar-btn"
                  onClick={() => {
                    alert('Recalculando coeficientes en base al presupuesto...');
                  }}
                >
                  Recalcular
                </button>
                <button 
                  className="formula-toolbar-btn"
                  onClick={() => alert('Generando PDF de la fórmula polinómica...')}
                >
                  PDF
                </button>
                <button 
                  className="formula-toolbar-btn"
                  onClick={() => alert('Exportando fórmula a hoja de cálculo...')}
                >
                  Exportar a hoja de cálculo
                </button>
              </div>

              {/* Table */}
              <div style={{ maxHeight: '380px', overflowY: 'auto' }}>
                <table className="formula-table">
                  <thead>
                    <tr>
                      <th style={{ width: '45%' }}>IU</th>
                      <th style={{ width: '15%', textAlign: 'right' }}>Coeficiente</th>
                      <th style={{ width: '15%', textAlign: 'center' }}>Monomio</th>
                      <th style={{ width: '12%', textAlign: 'left' }}>Factor</th>
                      <th style={{ width: '13%', textAlign: 'left' }}>Símbolo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {formulaPolinomicaRows.map((row, idx) => (
                      <tr key={idx}>
                        {/* IU */}
                        <td style={{ color: 'var(--text-primary)', fontWeight: 500, paddingLeft: '12px' }}>
                          {row.iu}
                        </td>

                        {/* Coeficiente */}
                        <td>
                          <input
                            type="number"
                            step="0.001"
                            value={row.coeficiente}
                            onChange={(e) => handleUpdateRow(idx, 'coeficiente', parseFloat(e.target.value) || 0)}
                            style={{
                              textAlign: 'right',
                              fontFamily: 'monospace',
                              fontWeight: 'bold',
                              color: 'var(--color-primary)'
                            }}
                          />
                        </td>

                        {/* Monomio */}
                        <td style={{ textAlign: 'center' }}>
                          <select
                            value={row.monomio}
                            onChange={(e) => handleUpdateRow(idx, 'monomio', parseInt(e.target.value) || 1)}
                            style={{
                              textAlign: 'center',
                              fontWeight: 500
                            }}
                          >
                            {[1, 2, 3, 4, 5, 6, 7, 8].map(m => (
                              <option key={m} value={m}>{m}</option>
                            ))}
                          </select>
                        </td>

                        {/* Factor */}
                        <td>
                          <input
                            type="text"
                            placeholder=""
                            value={row.factor}
                            onChange={(e) => handleUpdateRow(idx, 'factor', e.target.value)}
                          />
                        </td>

                        {/* Símbolo */}
                        <td>
                          <input
                            type="text"
                            placeholder=""
                            value={row.simbolo}
                            onChange={(e) => handleUpdateRow(idx, 'simbolo', e.target.value)}
                            style={{
                              fontWeight: 'bold',
                              color: 'var(--color-secondary)'
                            }}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Status bar */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px 20px',
                background: 'rgba(255, 255, 255, 0.01)',
                borderTop: '1px solid var(--border-color)',
                borderBottom: '1px solid var(--border-color)'
              }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  * Los coeficientes deben sumar exactamente 1.000
                </span>
                <div style={{
                  background: isCorrectSum ? 'rgba(16, 185, 129, 0.08)' : 'rgba(244, 63, 94, 0.08)',
                  border: isCorrectSum ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(244, 63, 94, 0.3)',
                  color: isCorrectSum ? 'var(--color-success)' : 'var(--color-danger)',
                  padding: '6px 14px',
                  borderRadius: '6px',
                  fontSize: '0.82rem',
                  fontWeight: 'bold'
                }}>
                  Suma de Coeficientes = {sumCoef.toFixed(3)}
                </div>
              </div>

              {/* Close Footer */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '16px 20px', background: 'rgba(0,0,0,0.1)' }}>
                <button
                  onClick={() => setIsFormulaPolinomicaOpen(false)}
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-secondary)',
                    padding: '8px 20px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontSize: '0.85rem',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.07)';
                    e.currentTarget.style.color = 'var(--text-primary)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                    e.currentTarget.style.color = 'var(--text-secondary)';
                  }}
                >
                  Cerrar
                </button>
              </div>
            </div>
          );
        })()}
      </Modal>

      {/* Modal - Add Insumo */}
      <Modal isOpen={isAddInsumoOpen} onClose={() => setIsAddInsumoOpen(false)} title="Agregar Insumo al Análisis (APU)">
        <form onSubmit={handleAddInsumo} className="login-form">
          <Input
            label="Descripción del Insumo *"
            placeholder="Ej. PEON, ALAMBRE NEGRO, OPERARIO"
            value={insumoNombre}
            onChange={(e) => setInsumoNombre(e.target.value)}
            required
          />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <Select
              label="Tipo de Recurso"
              value={insumoTipo}
              onChange={(e: any) => setInsumoTipo(e.target.value)}
              options={[
                { value: 'MO', label: 'Mano de Obra (MO)' },
                { value: 'MT', label: 'Materiales (MT)' },
                { value: 'EQ', label: 'Equipos (EQ)' },
                { value: 'SC', label: 'Subcontratos (SC)' },
                { value: 'SP', label: 'Subpartidas (SP)' }
              ]}
            />
            <Input
              label="Unidad *"
              placeholder="Ej. HH, M3, GLB, KG"
              value={insumoUnidad}
              onChange={(e) => setInsumoUnidad(e.target.value)}
              required
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <Input
              type="number"
              step="0.0001"
              label="Cuadrilla / Cantidad *"
              value={insumoCuadrilla}
              onChange={(e) => setInsumoCuadrilla(e.target.value)}
              required
            />
            <Input
              type="number"
              step="0.01"
              label="Precio Unitario (PU) *"
              value={insumoPU}
              onChange={(e) => setInsumoPU(e.target.value)}
              required
            />
          </div>

          <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
            <Button type="button" variant="secondary" onClick={() => setIsAddInsumoOpen(false)} style={{ flex: 1 }}>
              Cancelar
            </Button>
            <Button type="submit" style={{ flex: 1, background: 'var(--grad-primary)', border: 'none' }}>
              Insertar Insumo
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal - Add Partida */}
      <Modal isOpen={isAddPartidaOpen} onClose={() => setIsAddPartidaOpen(false)} title={partidaEsTitulo ? "Agregar Nuevo Título" : "Agregar Nueva Partida"}>
        <form onSubmit={handleAddPartida} className="login-form">
          <Input
            label={partidaEsTitulo ? "Nombre del Título *" : "Descripción de la Partida *"}
            placeholder={partidaEsTitulo ? "Ej. OBRAS DE MITIGACION" : "Ej. Trazo y replanteo preliminar"}
            value={partidaNombre}
            onChange={(e) => setPartidaNombre(e.target.value)}
            required
          />

          {!partidaEsTitulo && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <Input
                  label="Unidad *"
                  placeholder="Ej. M2, GLB, M3"
                  value={partidaUnidad}
                  onChange={(e) => setPartidaUnidad(e.target.value)}
                  required
                />
                <Input
                  type="number"
                  step="0.01"
                  label="Metrado *"
                  value={partidaMetrado}
                  onChange={(e) => setPartidaMetrado(e.target.value)}
                  required
                />
              </div>
              <Input
                type="number"
                step="0.1"
                label="Rendimiento Base *"
                value={partidaRendimiento}
                onChange={(e) => setPartidaRendimiento(e.target.value)}
                required
              />
            </>
          )}

          <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
            <Button type="button" variant="secondary" onClick={() => setIsAddPartidaOpen(false)} style={{ flex: 1 }}>
              Cancelar
            </Button>
            <Button type="submit" style={{ flex: 1 }}>
              Insertar Elemento
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal - Configuración de Usuario */}
      <Modal isOpen={isConfiguracionOpen} onClose={() => setIsConfiguracionOpen(false)} title="Configuración de Usuario">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '10px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
            <div>
              <div style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--text-primary)' }}>Mostrar cuadrículas por defecto</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '4px' }}>Muestra las líneas divisorias en la tabla de presupuestos y en la tabla de APU.</div>
            </div>
            <label className="switch-container" style={{ position: 'relative', display: 'inline-block', width: '44px', height: '24px' }}>
              <input
                type="checkbox"
                checked={showGridlines}
                onChange={(e) => setShowGridlines(e.target.checked)}
                style={{ opacity: 0, width: 0, height: 0 }}
              />
              <span className="switch-slider" style={{
                position: 'absolute',
                cursor: 'pointer',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: showGridlines ? 'var(--color-primary)' : 'rgba(255,255,255,0.1)',
                transition: '0.3s',
                borderRadius: '24px',
                border: '1px solid var(--border-color)'
              }}>
                <span style={{
                  position: 'absolute',
                  content: '""',
                  height: '16px',
                  width: '16px',
                  left: showGridlines ? '22px' : '4px',
                  bottom: '3px',
                  backgroundColor: '#ffffff',
                  transition: '0.3s',
                  borderRadius: '50%',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                }} />
              </span>
            </label>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
            <Button onClick={() => setIsConfiguracionOpen(false)}>
              Cerrar
            </Button>
          </div>
        </div>
      </Modal>

      {/* Cotizar modal removed - now rendered inline in workspace */}

      {/* Especificaciones Técnicas modal removed - now rendered inline in workspace */}

    </div>
    </div>
  );
};

// Row item component for budget list view
const BudgetRow: React.FC<{
  budget: Budget;
  onOpenMenu: (e: React.MouseEvent, id: string) => void;
  onOpen: (b: Budget) => void;
  getCD: (b: Budget) => number;
}> = ({ budget, onOpenMenu, onOpen, getCD }) => {
  const cd = getCD(budget);
  return (
    <div
      onClick={() => onOpen(budget)}
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '20px 24px',
        background: 'rgba(255, 255, 255, 0.01)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-md)',
        cursor: 'pointer',
        transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        position: 'relative',
        overflow: 'hidden'
      }}
      className="budget-list-row"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxWidth: '85%' }}>
        <h4 style={{
          fontFamily: 'var(--font-display)',
          fontSize: '1.05rem',
          fontWeight: 700,
          color: 'var(--text-primary)',
          lineHeight: '1.4'
        }}>
          {budget.nombre}
        </h4>
        
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            👤 Cliente: <strong style={{ color: 'var(--text-primary)' }}>{budget.cliente}</strong>
          </span>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            📅 Fecha base: <strong style={{ color: 'var(--text-primary)' }}>{budget.fechaBase}</strong>
          </span>
          <span style={{
            fontSize: '0.75rem',
            background: 'rgba(139, 92, 246, 0.1)',
            color: 'var(--color-secondary)',
            border: '1px solid rgba(139, 92, 246, 0.2)',
            padding: '2px 8px',
            borderRadius: '4px',
            fontWeight: 600,
            textTransform: 'uppercase'
          }}>
            {budget.grupo}
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Costo Directo</div>
          <div style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1.25rem',
            fontWeight: 800,
            color: 'var(--color-primary)'
          }}>
            S/ {cd.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>

        <button
          onClick={(e) => onOpenMenu(e, budget.id)}
          style={{
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid var(--border-color)',
            color: 'var(--text-primary)',
            width: '36px',
            height: '36px',
            borderRadius: 'var(--radius-sm)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.1rem',
            transition: 'all 0.2s'
          }}
          className="three-dots-btn"
          title="Acciones"
        >
          ⋮
        </button>
      </div>
    </div>
  );
};

// Common CSS styles
const thStyle: React.CSSProperties = {
  padding: '12px 16px',
  fontSize: '0.76rem',
  textTransform: 'uppercase',
  borderBottom: '1px solid var(--border-color)'
};

const tdStyle: React.CSSProperties = {
  padding: '12px 16px',
  borderBottom: '1px solid rgba(255, 255, 255, 0.02)',
  color: 'var(--text-secondary)'
};

const tableInputStyle: React.CSSProperties = {
  background: 'rgba(255, 255, 255, 0.02)',
  border: '1px solid var(--border-color)',
  color: 'var(--text-primary)',
  padding: '4px 8px',
  width: '100%',
  maxWidth: '90px',
  borderRadius: '4px',
  fontSize: '0.82rem',
  outline: 'none',
  textAlign: 'right'
};

const dgInputStyle: React.CSSProperties = {
  width: '100%',
  background: 'rgba(255, 255, 255, 0.02)',
  border: '1px solid var(--border-color)',
  color: 'var(--text-primary)',
  padding: '10px 14px',
  borderRadius: '4px',
  fontSize: '0.88rem',
  fontFamily: 'var(--font-sans)',
  outline: 'none'
};

const menuItemStyle: React.CSSProperties = {
  width: '100%',
  background: 'none',
  border: 'none',
  textAlign: 'left',
  padding: '10px 16px',
  color: 'var(--text-secondary)',
  fontSize: '0.88rem',
  cursor: 'pointer',
  fontFamily: 'var(--font-sans)',
  transition: 'all 0.15s',
  display: 'flex',
  alignItems: 'center',
  gap: '8px'
};
