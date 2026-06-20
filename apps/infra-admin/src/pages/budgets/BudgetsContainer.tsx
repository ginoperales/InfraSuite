import React, { useState, useEffect, useRef } from 'react';
import { Card, Button, Input, Select, Modal } from '@infrasuite/shared';
import { useAuth } from '@infrasuite/auth';
import { db } from '@infrasuite/firebase';

import type { Budget, Partida, Insumo, PartidaColumnKey, ApuColumnKey, BudgetsProps } from './types';
import { BudgetsListLite } from './BudgetsListLite';
import { BudgetsListPro } from './BudgetsListPro';
import { BudgetEditorLite } from './BudgetEditorLite';
import { BudgetEditorPro } from './BudgetEditorPro';
import * as Modals from './Modals';

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
        rendimiento: 0.7,
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
  },
  // === User-created InfraCost Pro files (synced with HomeUser) ===
  {
    id: 'u_pro_1',
    nombre: '0. RESUMEN DE PRESUP. SEDE GOREU I ETAPA',
    cliente: 'SELVAVIVACONSTRUCCIONES',
    fechaBase: '2026-05-22',
    grupo: 'EDIFICACIONES',
    categoria: 'Recientes',
    direccion: 'Sede Goreu',
    distrito: 'Ucayali',
    provincia: 'Coronel Portillo',
    departamento: 'Ucayali',
    jornada: 8,
    moneda: 'SOLES',
    subPresupuestos: ['SUB PRESUPUESTO 1'],
    partidas: [
      { id: 'up1_1', item: '1', nombre: 'OBRAS PRELIMINARES', unidad: '', metrado: 0, esTitulo: true, rendimiento: 1, insumos: [] },
      { id: 'up1_2', item: '1.1', nombre: 'Movilización y desmovilización de equipos', unidad: 'GLB', metrado: 1, esTitulo: false, rendimiento: 1, insumos: [{ id: 'up1_i1', nombre: 'MOVILIZACION Y DESMOVILIZACION', unidad: 'GLB', cuadrilla: 1, pu: 2500, tipo: 'SC' }] },
      { id: 'up1_3', item: '2', nombre: 'ESTRUCTURAS', unidad: '', metrado: 0, esTitulo: true, rendimiento: 1, insumos: [] },
      { id: 'up1_4', item: '2.1', nombre: 'Concreto en zapatas f\'c=210 kg/cm²', unidad: 'M3', metrado: 45.60, esTitulo: false, rendimiento: 12, insumos: [{ id: 'up1_i2', nombre: 'CONCRETO PREMEZCLADO F\'C=210 KG/CM2', unidad: 'M3', cuadrilla: 1, pu: 380, tipo: 'SC' }, { id: 'up1_i3', nombre: 'OPERARIO', unidad: 'HH', cuadrilla: 2, pu: 28.10, tipo: 'MO' }] },
      { id: 'up1_5', item: '2.2', nombre: 'Acero de refuerzo fy=4200 kg/cm²', unidad: 'KG', metrado: 8420, esTitulo: false, rendimiento: 250, insumos: [{ id: 'up1_i4', nombre: 'ACERO CORRUGADO fy=4200', unidad: 'KG', cuadrilla: 0, pu: 4.20, tipo: 'MT' }, { id: 'up1_i5', nombre: 'OPERARIO', unidad: 'HH', cuadrilla: 1, pu: 28.10, tipo: 'MO' }] },
    ]
  },
  {
    id: 'u_pro_2',
    nombre: 'ESTRUCTURAS SEDE PUCALLPA',
    cliente: 'SELVAVIVACONSTRUCCIONES',
    fechaBase: '2026-04-06',
    grupo: 'EDIFICACIONES',
    categoria: 'Recientes',
    direccion: 'Pucallpa',
    distrito: 'Callería',
    provincia: 'Coronel Portillo',
    departamento: 'Ucayali',
    jornada: 8,
    moneda: 'SOLES',
    subPresupuestos: ['ESTRUCTURAS'],
    partidas: [
      { id: 'up2_1', item: '1', nombre: 'CONCRETO ARMADO', unidad: '', metrado: 0, esTitulo: true, rendimiento: 1, insumos: [] },
      { id: 'up2_2', item: '1.1', nombre: 'Columnas de concreto f\'c=210 kg/cm²', unidad: 'M3', metrado: 28.40, esTitulo: false, rendimiento: 10, insumos: [{ id: 'up2_i1', nombre: 'CONCRETO PREMEZCLADO F\'C=210 KG/CM2', unidad: 'M3', cuadrilla: 1, pu: 380, tipo: 'SC' }, { id: 'up2_i2', nombre: 'OPERARIO', unidad: 'HH', cuadrilla: 2, pu: 28.10, tipo: 'MO' }] },
      { id: 'up2_3', item: '1.2', nombre: 'Vigas de concreto armado', unidad: 'M3', metrado: 18.60, esTitulo: false, rendimiento: 8, insumos: [{ id: 'up2_i3', nombre: 'CONCRETO PREMEZCLADO F\'C=210 KG/CM2', unidad: 'M3', cuadrilla: 1, pu: 380, tipo: 'SC' }] }
    ]
  },
  {
    id: 'u_pro_3',
    nombre: 'PRESUPUESTO INSTALACIONES SANITARIAS FINAL',
    cliente: 'SELVAVIVACONSTRUCCIONES',
    fechaBase: '2026-04-02',
    grupo: 'SANEAMIENTO',
    categoria: 'Recientes',
    direccion: 'Sede Principal',
    distrito: 'Callería',
    provincia: 'Coronel Portillo',
    departamento: 'Ucayali',
    jornada: 8,
    moneda: 'SOLES',
    subPresupuestos: ['AGUA FRÍA', 'DESAGUE'],
    partidas: [
      { id: 'up3_1', item: '1', nombre: 'INSTALACIONES DE AGUA FRÍA', unidad: '', metrado: 0, esTitulo: true, rendimiento: 1, insumos: [] },
      { id: 'up3_2', item: '1.1', nombre: 'Tubería PVC-U de 1/2" para agua fría', unidad: 'ML', metrado: 145.20, esTitulo: false, rendimiento: 20, insumos: [{ id: 'up3_i1', nombre: 'TUBERIA PVC-U 1/2"', unidad: 'ML', cuadrilla: 0, pu: 8.50, tipo: 'MT' }, { id: 'up3_i2', nombre: 'OPERARIO', unidad: 'HH', cuadrilla: 1, pu: 28.10, tipo: 'MO' }] },
      { id: 'up3_3', item: '2', nombre: 'INSTALACIONES DE DESAGUE', unidad: '', metrado: 0, esTitulo: true, rendimiento: 1, insumos: [] },
      { id: 'up3_4', item: '2.1', nombre: 'Tubería PVC-SAP de 4" para desagüe', unidad: 'ML', metrado: 88.60, esTitulo: false, rendimiento: 15, insumos: [{ id: 'up3_i3', nombre: 'TUBERIA PVC-SAP 4"', unidad: 'ML', cuadrilla: 0, pu: 22.00, tipo: 'MT' }] }
    ]
  },
  // === Templates InfraCost Pro (synced with HomeUser) ===
  {
    id: 't_pro_1',
    nombre: 'PRESUPUESTO HOSPITAL DE COMPLEJIDAD II - PLANTILLA PRO',
    cliente: 'PLANTILLA',
    fechaBase: '2026-05-18',
    grupo: 'EDIFICACIONES',
    categoria: 'Recientes',
    direccion: 'NN',
    distrito: 'NN',
    provincia: 'NN',
    departamento: 'NN',
    jornada: 8,
    moneda: 'SOLES',
    subPresupuestos: ['ARQUITECTURA', 'ESTRUCTURA', 'INSTALACIONES'],
    partidas: [
      { id: 'tp1_1', item: '1', nombre: 'OBRAS CIVILES', unidad: '', metrado: 0, esTitulo: true, rendimiento: 1, insumos: [] },
      { id: 'tp1_2', item: '1.1', nombre: 'Movimiento de tierras y excavación masiva', unidad: 'M3', metrado: 520.00, esTitulo: false, rendimiento: 40, insumos: [{ id: 'tp1_i1', nombre: 'EXCAVADORA SOBRE ORUGAS', unidad: 'HM', cuadrilla: 1, pu: 350, tipo: 'EQ' }] }
    ]
  },
  {
    id: 't_pro_2',
    nombre: 'PRESUPUESTO EDIFICIO RESIDENCIAL 15 PISOS - PLANTILLA PRO',
    cliente: 'PLANTILLA',
    fechaBase: '2026-05-14',
    grupo: 'EDIFICACIONES',
    categoria: 'Recientes',
    direccion: 'NN',
    distrito: 'NN',
    provincia: 'NN',
    departamento: 'NN',
    jornada: 8,
    moneda: 'SOLES',
    subPresupuestos: ['ESTRUCTURAS', 'ARQUITECTURA'],
    partidas: [
      { id: 'tp2_1', item: '1', nombre: 'CIMENTACIÓN', unidad: '', metrado: 0, esTitulo: true, rendimiento: 1, insumos: [] },
      { id: 'tp2_2', item: '1.1', nombre: 'Pilotes de concreto armado diámetro 60cm', unidad: 'ML', metrado: 1200.00, esTitulo: false, rendimiento: 8, insumos: [{ id: 'tp2_i1', nombre: 'CONCRETO PREMEZCLADO F\'C=280 KG/CM2', unidad: 'M3', cuadrilla: 1, pu: 450, tipo: 'SC' }] }
    ]
  },
  {
    id: 't_pro_3',
    nombre: 'PRESUPUESTO PAVIMENTACIÓN VIAL URBANA - PLANTILLA PRO',
    cliente: 'PLANTILLA',
    fechaBase: '2026-05-12',
    grupo: 'CARRETERAS',
    categoria: 'Recientes',
    direccion: 'NN',
    distrito: 'NN',
    provincia: 'NN',
    departamento: 'NN',
    jornada: 8,
    moneda: 'SOLES',
    subPresupuestos: ['SUB BASE', 'BASE', 'CARPETA ASFALTICA'],
    partidas: [
      { id: 'tp3_1', item: '1', nombre: 'TRABAJOS PRELIMINARES', unidad: '', metrado: 0, esTitulo: true, rendimiento: 1, insumos: [] },
      { id: 'tp3_2', item: '1.1', nombre: 'Trazo y replanteo en vías', unidad: 'M2', metrado: 8500.00, esTitulo: false, rendimiento: 300, insumos: [{ id: 'tp3_i1', nombre: 'OPERARIO', unidad: 'HH', cuadrilla: 1, pu: 28.10, tipo: 'MO' }, { id: 'tp3_i2', nombre: 'PEON', unidad: 'HH', cuadrilla: 2, pu: 20.20, tipo: 'MO' }] }
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
  { fontName: 'Inter', nombre: 'KIT DE INSTALACION PARA TANQUE DE INODORO', unidad: 'UND', precio: 50.00, tipo: 'MATERIAL', iu: '39 : INDICE DE PRECIOS AL CONSUMIDOR (INEI)', color: '#00f0ff' }
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
  }
];

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

const DEFAULT_APU_COLUMN_WIDTHS: Record<ApuColumnKey, number> = {
  nombre: 400,
  unidad: 90,
  cuadrilla: 110,
  cantidad: 110,
  pu: 130,
  parcial: 130,
  tipo: 110
};

export const Budgets: React.FC<BudgetsProps> = ({ theme, toggleTheme, companies, mode = 'lite', onNavigate, initialOpenBudgetId }) => {
  const { user } = useAuth();
  
  // Budgets state — merge saved data with INITIAL_BUDGETS so new entries always appear
  const [budgets, setBudgets] = useState<Budget[]>(() => {
    const saved = localStorage.getItem('infrasuite_budgets_v3');
    let base = INITIAL_BUDGETS;
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as Budget[];
        // Merge: keep saved entries, add any INITIAL_BUDGETS entries not yet in saved
        const savedIds = new Set(parsed.map(b => b.id));
        const missing = INITIAL_BUDGETS.filter(b => !savedIds.has(b.id));
        base = [...parsed, ...missing];
      } catch {
        base = INITIAL_BUDGETS;
      }
    }
    return base;
  });

  // UI State
  const [viewState, setViewState] = useState<'list' | 'editor'>('list');
  const [activeBudget, setActiveBudget] = useState<Budget | null>(null);
  const [openBudgetIds, setOpenBudgetIds] = useState<string[]>([]);
  const [selectedPartidaId, setSelectedPartidaId] = useState<string | null>(null);
  const [sidebarTab, setSidebarTab] = useState('Presupuesto APU');
  const [isInfraCostSidebarCollapsed, setIsInfraCostSidebarCollapsed] = useState(false);
  const [partidaColumnWidths, setPartidaColumnWidths] = useState<Record<PartidaColumnKey, number>>(DEFAULT_PARTIDA_COLUMN_WIDTHS);
  const [apuColumnWidths, setApuColumnWidths] = useState<Record<ApuColumnKey, number>>(DEFAULT_APU_COLUMN_WIDTHS);

  // Persist budgets to localStorage
  useEffect(() => {
    localStorage.setItem('infrasuite_budgets_v3', JSON.stringify(budgets));
  }, [budgets]);

  const [catalogoInsumos, setCatalogoInsumos] = useState<any[]>(() => {
    const saved = localStorage.getItem('infrasuite_catalogo_insumos');
    if (!saved) return MOCK_CATALOGO_INSUMOS;
    try { return JSON.parse(saved); } catch { return MOCK_CATALOGO_INSUMOS; }
  });

  useEffect(() => {
    localStorage.setItem('infrasuite_catalogo_insumos', JSON.stringify(catalogoInsumos));
  }, [catalogoInsumos]);

  // Open specific budget directly (from HomeUser file click)
  useEffect(() => {
    if (initialOpenBudgetId && budgets.length > 0) {
      const target = budgets.find(b => b.id === initialOpenBudgetId);
      if (target) {
        setActiveBudget(target);
        setOpenBudgetIds(prev => prev.includes(target.id) ? prev : [...prev, target.id]);
        setViewState('editor');
      }
    }
  }, [initialOpenBudgetId]);

  // Resize functions
  const startPartidaColumnResize = (key: PartidaColumnKey, e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = partidaColumnWidths[key];
    const onMouseMove = (moveEvent: MouseEvent) => {
      const diff = moveEvent.clientX - startX;
      setPartidaColumnWidths(prev => ({
        ...prev,
        [key]: Math.max(40, startWidth + diff)
      }));
    };
    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  const startApuColumnResize = (key: ApuColumnKey, e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = apuColumnWidths[key];
    const onMouseMove = (moveEvent: MouseEvent) => {
      const diff = moveEvent.clientX - startX;
      setApuColumnWidths(prev => ({
        ...prev,
        [key]: Math.max(40, startWidth + diff)
      }));
    };
    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  // Zoom / Heights
  const [apuPanelHeight, setApuPanelHeight] = useState<number>(() => {
    const saved = localStorage.getItem('infrasuite_apuPanelHeight');
    return saved ? parseInt(saved, 10) : 320;
  });
  const [apuZoom, setApuZoom] = useState<number>(() => {
    const saved = localStorage.getItem('infrasuite_apuZoom');
    return saved ? parseFloat(saved) : 1;
  });

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

  // AI & Specs
  const [specifications, setSpecifications] = useState<Record<string, string>>({
    'p1': 'CURADO DE LOSAS DE PAVIMENTO RÍGIDO (unidad de medida: m²)\n\nDESCRIPCIÓN - Procesando...',
    'p2': 'TRAZO, NIVELACIÓN Y REPLANTEO PRELIMINAR (unidad de medida: m²)\n\nDESCRIPCIÓN - Esta partida comprende los trabajos de trazo y replanteo de las estructuras proyectadas.',
    'p3': 'SUB BASE GRANULAR E=20CM (unidad de medida: m³)\n\nDESCRIPCIÓN - Material granular compactado para la base del pavimento.',
    'p4': 'CONCRETO F\'C=210KG/CM2 PARA PAVIMENTO RÍGIDO\n\nDESCRIPCIÓN - Suministro e instalación de concreto premezclado de alta resistencia.'
  });
  const [geminiPrompt, setGeminiPrompt] = useState('');
  const [geminiResponse, setGeminiResponse] = useState('');
  const [geminiIsLoading, setGeminiIsLoading] = useState(false);

  const handleAskGemini = () => {
    if (!geminiPrompt.trim()) return;
    setGeminiIsLoading(true);
    setTimeout(() => {
      setGeminiResponse(`[IA Gemini]: Para "${geminiPrompt}", se recomienda establecer una descripción detallada que estipule:\n1. Descripción de los materiales de calidad estructural.\n2. Equipos requeridos (vibradores, reglas de aluminio).\n3. Método de colocación y curado por un periodo mínimo de 7 días.`);
      setGeminiIsLoading(false);
    }, 1200);
  };

  // Search / Filters
  const [portfolioSearchTerm, setPortfolioSearchTerm] = useState('');
  const [selectedPortfolio, setSelectedPortfolio] = useState('Construcción');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('TODOS LOS PRESUPUESTOS');
  const [isLoading, setIsLoading] = useState(false);

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isAddInsumoOpen, setIsAddInsumoOpen] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isAddPartidaOpen, setIsAddPartidaOpen] = useState(false);
  const [isDatosGeneralesOpen, setIsDatosGeneralesOpen] = useState(false);
  const [dgActiveTab, setDgActiveTab] = useState<'general' | 'subpresupuestos'>('general');
  const [isCatalogoInsumosOpen, setIsCatalogoInsumosOpen] = useState(false);
  const [ciSearchTerm, setCiSearchTerm] = useState('');
  const [ciSelectedTipo, setCiSelectedTipo] = useState('TODOS');
  const [isCatalogoPartidasOpen, setIsCatalogoPartidasOpen] = useState(false);
  const [cpSearchTerm, setCpSearchTerm] = useState('');
  const [cpSelectedPartidaIndex, setCpSelectedPartidaIndex] = useState(0);
  const [isListaInsumosOpen, setIsListaInsumosOpen] = useState(false);
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

  const [isPiePresupuestoOpen, setIsPiePresupuestoOpen] = useState(false);
  const [pieRows, setPieRows] = useState<{ variable: string; descripcion: string; formula: string; iu: string; resaltar: boolean }[]>([
    { variable: 'CD', descripcion: 'COSTO DIRECTO', formula: '', iu: '', resaltar: true },
    { variable: 'GG', descripcion: 'GASTOS GENERALES 10%', formula: 'CD * 0.10', iu: '39', resaltar: false },
    { variable: 'UTI', descripcion: 'UTILIDAD 10%', formula: 'CD * 0.10', iu: '39', resaltar: false },
    { variable: 'ST', descripcion: 'SUB TOTAL', formula: 'CD + GG + UTI', iu: '', resaltar: true },
    { variable: 'IGV', descripcion: 'IGV 18%', formula: 'ST * 0.18', iu: '', resaltar: false },
    { variable: 'TOTAL', descripcion: 'TOTAL PRESUPUESTO', formula: 'ST + IGV', iu: '', resaltar: true }
  ]);

  const [isFormulaPolinomicaOpen, setIsFormulaPolinomicaOpen] = useState(false);
  const [formulaPolinomicaRows, setFormulaPolinomicaRows] = useState<{ iu: string; coeficiente: number; monomio: number; factor: string; simbolo: string }[]>([
    { iu: '37 : HERRAMIENTA MANUAL', coeficiente: 0.025, monomio: 1, factor: '', simbolo: 'HM' },
    { iu: '39 : INDICE DE PRECIOS AL CONSUMIDOR (INEI)', coeficiente: 0.439, monomio: 1, factor: '', simbolo: 'IPC' },
    { iu: '47 : MANO DE OBRA (INCLUYE LEYES SOCIALES)', coeficiente: 0.536, monomio: 1, factor: '', simbolo: 'MO' }
  ]);

  const [showGridlines, setShowGridlines] = useState<boolean>(() => {
    const saved = localStorage.getItem('infrasuite_show_gridlines');
    return saved !== null ? saved === 'true' : true;
  });
  const [isConfiguracionOpen, setIsConfiguracionOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem('infrasuite_show_gridlines', showGridlines.toString());
  }, [showGridlines]);

  // Context menu & Clipboard
  const [contextMenu, setContextMenu] = useState<{ visible: boolean; x: number; y: number; targetPartida: Partida | null }>({
    visible: false,
    x: 0,
    y: 0,
    targetPartida: null
  });

  const [clipboard, setClipboard] = useState<{ action: 'copy' | 'cut' | null; partida: Partida | null }>({
    action: null,
    partida: null
  });

  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleCloseMenu = () => {
      if (contextMenu.visible) {
        setContextMenu(prev => ({ ...prev, visible: false }));
      }
    };
    window.addEventListener('click', handleCloseMenu);
    window.addEventListener('scroll', handleCloseMenu, true);
    return () => {
      window.removeEventListener('click', handleCloseMenu);
      window.removeEventListener('scroll', handleCloseMenu, true);
    };
  }, [contextMenu.visible]);

  // Form states
  const [nombre, setNombre] = useState('');
  const [cliente, setCliente] = useState('');
  const [fechaBase, setFechaBase] = useState(new Date().toISOString().split('T')[0]);
  const [grupo, setGrupo] = useState('EDIFICACIONES');

  // Datos generales modal local states
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

  // Insumo form states
  const [insumoNombre, setInsumoNombre] = useState('');
  const [insumoUnidad, setInsumoUnidad] = useState('HH');
  const [insumoCuadrilla, setInsumoCuadrilla] = useState('1');
  const [insumoPU, setInsumoPU] = useState('10');
  const [insumoTipo, setInsumoTipo] = useState<'MO' | 'MT' | 'EQ' | 'SC' | 'SP'>('MO');

  // Partida form states
  const [partidaNombre, setPartidaNombre] = useState('');
  const [partidaUnidad, setPartidaUnidad] = useState('M2');
  const [partidaMetrado, setPartidaMetrado] = useState('1');
  const [partidaEsTitulo, setPartidaEsTitulo] = useState(false);
  const [partidaRendimiento, setPartidaRendimiento] = useState('1');

  // Draggable edits windows
  const [isEditPartidaOpen, setIsEditPartidaOpen] = useState(false);
  const [editPartidaPos, setEditPartidaPos] = useState({ x: 100, y: 100 });
  const [isEditTitleOpen, setIsEditTitleOpen] = useState(false);
  const [editTitlePos, setEditTitlePos] = useState({ x: 100, y: 100 });

  // Calculation helpers
  const getInsumoCantidad = (ins: Insumo, rend: number) => {
    if (ins.tipo === 'MO' || ins.tipo === 'EQ') {
      return rend > 0 ? (ins.cuadrilla * 8) / rend : 0;
    }
    return ins.cuadrilla; // For materials/subcontracts cuadrilla acts as total quantity per unit of work
  };

  const getInsumoParcial = (ins: Insumo, rend: number) => {
    return getInsumoCantidad(ins, rend) * ins.pu;
  };

  const getAPUBreakdown = (partida: Partida) => {
    const breakdown = { MO: 0, MT: 0, EQ: 0, SC: 0, SP: 0 };
    if (!partida || partida.esTitulo) return breakdown;
    partida.insumos.forEach(ins => {
      const val = getInsumoParcial(ins, partida.rendimiento);
      if (ins.tipo === 'MO') breakdown.MO += val;
      else if (ins.tipo === 'MT') breakdown.MT += val;
      else if (ins.tipo === 'EQ') breakdown.EQ += val;
      else if (ins.tipo === 'SC') breakdown.SC += val;
      else breakdown.SP += val;
    });
    return breakdown;
  };

  const getPartidaCU = (partida: Partida) => {
    if (partida.esTitulo) return 0;
    const br = getAPUBreakdown(partida);
    return br.MO + br.MT + br.EQ + br.SC + br.SP;
  };

  const getPartidaParcial = (partida: Partida) => {
    if (partida.esTitulo) {
      // Title price is sum of sub-items until next title
      let sum = 0;
      if (!activeBudget) return 0;
      const idx = activeBudget.partidas.findIndex(p => p.id === partida.id);
      if (idx === -1) return 0;
      for (let i = idx + 1; i < activeBudget.partidas.length; i += 1) {
        if (activeBudget.partidas[i].esTitulo) break;
        sum += getPartidaParcial(activeBudget.partidas[i]);
      }
      return sum;
    }
    return partida.metrado * getPartidaCU(partida);
  };

  const getBudgetCD = (budget: Budget | null) => {
    if (!budget) return 0;
    return budget.partidas
      .filter(p => !p.esTitulo)
      .reduce((sum, p) => sum + getPartidaParcial(p), 0);
  };

  // Actions
  const handleOpenBudgetEditor = (b: Budget) => {
    setOpenBudgetIds(prev => prev.includes(b.id) ? prev : [...prev, b.id]);
    setActiveBudget(b);
    setViewState('editor');
  };

  const handleSelectBudgetTab = (id: string) => {
    const b = budgets.find(x => x.id === id);
    if (b) setActiveBudget(b);
  };

  const handleCloseBudgetTab = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const nextOpenIds = openBudgetIds.filter(x => x !== id);
    setOpenBudgetIds(nextOpenIds);
    if (activeBudget?.id === id) {
      if (nextOpenIds.length > 0) {
        const nextActive = budgets.find(x => x.id === nextOpenIds[0]);
        if (nextActive) setActiveBudget(nextActive);
      } else {
        setViewState('list');
        setActiveBudget(null);
      }
    }
  };

  const handleOpenMenu = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!id) {
      setMenuOpenId(null);
      return;
    }
    setMenuOpenId(id);
    setMenuPosition({ x: e.clientX, y: e.clientY });
  };

  const resetBudgetForm = () => {
    setNombre('');
    setCliente('');
    setFechaBase(new Date().toISOString().split('T')[0]);
    setGrupo('EDIFICACIONES');
  };

  const handleCreateBudget = (e: React.FormEvent) => {
    e.preventDefault();
    const newB: Budget = {
      id: 'b_' + Math.random().toString(36).substring(2, 9),
      nombre: nombre.toUpperCase(),
      cliente: cliente || 'Sin cliente asignado',
      fechaBase,
      grupo,
      categoria: 'Recientes',
      direccion: 'NN',
      distrito: 'NN',
      provincia: 'NN',
      departamento: 'NN',
      jornada: 8,
      moneda: 'SOLES',
      subPresupuestos: ['SUB PRESUPUESTO 1'],
      partidas: []
    };
    setBudgets([newB, ...budgets]);
    setIsCreateOpen(false);
    handleOpenBudgetEditor(newB);
  };

  const startEditBudget = (b: Budget) => {
    setActiveBudget(b);
    setDgGrupo(b.grupo);
    setDgPresupuesto(b.nombre);
    setDgCliente(b.cliente);
    setDgFechaBase(b.fechaBase);
    setDgJornada(b.jornada || 8);
    setDgMoneda(b.moneda || 'SOLES');
    setDgSubPresupuestos(b.subPresupuestos || ['SUB PRESUPUESTO 1']);
    setDgDireccion(b.direccion || 'NN');
    setDgDistrito(b.distrito || 'NN');
    setDgProvincia(b.provincia || 'NN');
    setDgDepartamento(b.departamento || 'NN');
    setIsDatosGeneralesOpen(true);
    setMenuOpenId(null);
  };

  const handleEditBudget = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeBudget) return;
    const updated = budgets.map(b => b.id === activeBudget.id ? { ...b, nombre, cliente, fechaBase, grupo } : b);
    setBudgets(updated);
    setIsEditOpen(false);
  };

  const handleDuplicateBudget = (id: string) => {
    const target = budgets.find(b => b.id === id);
    if (!target) return;
    const copy: Budget = {
      ...target,
      id: 'b_' + Math.random().toString(36).substring(2, 9),
      nombre: `${target.nombre} (Copia)`,
      categoria: 'Recientes'
    };
    setBudgets([copy, ...budgets]);
    setMenuOpenId(null);
    alert('Presupuesto duplicado con éxito.');
  };

  const handleDeleteBudget = (id: string) => {
    if (!confirm('¿Está seguro de que desea eliminar este presupuesto?')) return;
    setBudgets(budgets.filter(b => b.id !== id));
    setMenuOpenId(null);
  };

  const handlePartidaCellClick = (p: Partida) => {
    setSelectedPartidaId(p.id);
  };

  const handlePartidaContextMenu = (e: React.MouseEvent, p: Partida) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedPartidaId(p.id);
    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      targetPartida: p
    });
  };

  const handlePartidaCellChange = (pId: string, field: keyof Partida, val: any) => {
    if (!activeBudget) return;
    const updatedPartidas = activeBudget.partidas.map(p => p.id === pId ? { ...p, [field]: val } : p);
    const updatedBudget = { ...activeBudget, partidas: updatedPartidas };
    setActiveBudget(updatedBudget);
    setBudgets(budgets.map(b => b.id === activeBudget.id ? updatedBudget : b));
  };

  const handleUpdateInsumoField = (insId: string, field: keyof Insumo, val: any) => {
    if (!activeBudget || !selectedPartidaId) return;
    const p = activeBudget.partidas.find(x => x.id === selectedPartidaId);
    if (!p) return;
    const updatedInsumos = p.insumos.map(ins => ins.id === insId ? { ...ins, [field]: val } : ins);
    handlePartidaCellChange(selectedPartidaId, 'insumos', updatedInsumos);
  };

  const handleDeleteInsumo = (insId: string) => {
    if (!activeBudget || !selectedPartidaId) return;
    const p = activeBudget.partidas.find(x => x.id === selectedPartidaId);
    if (!p) return;
    const updatedInsumos = p.insumos.filter(ins => ins.id !== insId);
    handlePartidaCellChange(selectedPartidaId, 'insumos', updatedInsumos);
  };

  const handleAddInsumo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeBudget || !selectedPartidaId) return;
    const p = activeBudget.partidas.find(x => x.id === selectedPartidaId);
    if (!p) return;

    const newIns: Insumo = {
      id: 'i_' + Math.random().toString(36).substring(2, 9),
      nombre: insumoNombre.toUpperCase(),
      unidad: insumoUnidad.toUpperCase(),
      cuadrilla: parseFloat(insumoCuadrilla) || 1,
      pu: parseFloat(insumoPU) || 10,
      tipo: insumoTipo
    };

    const updatedInsumos = [...p.insumos, newIns];
    handlePartidaCellChange(selectedPartidaId, 'insumos', updatedInsumos);
    setIsAddInsumoOpen(false);
    
    // add to catalog if not there
    if (!catalogoInsumos.some(x => x.nombre.toLowerCase() === insumoNombre.toLowerCase())) {
      setCatalogoInsumos([...catalogoInsumos, { nombre: insumoNombre.toUpperCase(), unidad: insumoUnidad, precio: parseFloat(insumoPU), tipo: insumoTipo }]);
    }
  };

  const handleAddPartida = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeBudget) return;
    const newP: Partida = {
      id: 'p_' + Math.random().toString(36).substring(2, 9),
      item: String(activeBudget.partidas.length + 1),
      nombre: partidaNombre.toUpperCase(),
      unidad: partidaEsTitulo ? '' : partidaUnidad.toUpperCase(),
      metrado: partidaEsTitulo ? 0 : parseFloat(partidaMetrado) || 1,
      esTitulo: partidaEsTitulo,
      rendimiento: partidaEsTitulo ? 1 : parseFloat(partidaRendimiento) || 1,
      insumos: []
    };
    const updatedBudget = { ...activeBudget, partidas: [...activeBudget.partidas, newP] };
    setActiveBudget(updatedBudget);
    setBudgets(budgets.map(b => b.id === activeBudget.id ? updatedBudget : b));
    setIsAddPartidaOpen(false);
  };

  const handleSaveDatosGenerales = () => {
    if (!activeBudget) return;
    const updated: Budget = {
      ...activeBudget,
      grupo: dgGrupo,
      nombre: dgPresupuesto.toUpperCase(),
      cliente: dgCliente,
      fechaBase: dgFechaBase,
      jornada: dgJornada,
      moneda: dgMoneda,
      subPresupuestos: dgSubPresupuestos,
      direccion: dgDireccion,
      distrito: dgDistrito,
      provincia: dgProvincia,
      departamento: dgDepartamento
    };
    setActiveBudget(updated);
    setBudgets(budgets.map(b => b.id === activeBudget.id ? updated : b));
    setIsDatosGeneralesOpen(false);
  };

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

  const matchingSuggestions = insumoNombre.trim()
    ? catalogoInsumos.filter(item => item.nombre.toLowerCase().includes(insumoNombre.toLowerCase()))
    : [];

  const handleSelectSuggestion = (item: any) => {
    setInsumoNombre(item.nombre);
    setInsumoUnidad(item.unidad);
    setInsumoPU(item.precio.toString());
    const mappedTipo = (item.tipo || '').toUpperCase().includes('MATERIAL') ? 'MT' : (item.tipo || '').toUpperCase().includes('MANO') ? 'MO' : 'EQ';
    setInsumoTipo(mappedTipo as any);
    setShowSuggestions(false);
  };

  const handleCreateNewInsumoOption = () => {
    setShowSuggestions(false);
  };

  // Filtered budgets for Lite
  const filteredBudgets = budgets.filter((b) => {
    if (!b) return false;
    const matchesSearch = (b.nombre || '').toLowerCase().includes((searchTerm || '').toLowerCase()) || 
                          (b.cliente || '').toLowerCase().includes((searchTerm || '').toLowerCase());
    const matchesGroup = selectedGroup === 'TODOS LOS PRESUPUESTOS' || b.grupo === selectedGroup;
    return matchesSearch && matchesGroup;
  });

  const recientes = filteredBudgets.filter(b => b.categoria === 'Recientes');
  const antiguos = filteredBudgets.filter(b => b.categoria === 'Antiguos');
  const groups = ['TODOS LOS PRESUPUESTOS', 'EDIFICACIONES', 'CARRETERAS', 'SANEAMIENTO', 'MINERÍA'];

  const openBudgets = openBudgetIds
    .map(id => budgets.find(b => b.id === id))
    .filter((budget): budget is Budget => Boolean(budget));

  const partidaTableWidth = Object.values(partidaColumnWidths).reduce((sum, width) => sum + width, 0);
  const apuTableWidth = Object.values(apuColumnWidths).reduce((sum, width) => sum + width, 0);

  const renderPartidaHeader = (key: PartidaColumnKey, label: string) => (
    <th key={key} style={{ ...Modals.thStyle, width: `${partidaColumnWidths[key]}px`, position: 'relative' }}>
      <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</span>
      <span
        onMouseDown={(e) => startPartidaColumnResize(key, e)}
        style={{ position: 'absolute', top: 0, right: 0, width: '8px', height: '100%', cursor: 'col-resize', userSelect: 'none', zIndex: 1 }}
      />
    </th>
  );

  const renderApuHeader = (key: ApuColumnKey, label: string) => (
    <th key={key} style={{ ...Modals.thStyle, width: `${apuColumnWidths[key]}px`, position: 'relative' }}>
      <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</span>
      <span
        onMouseDown={(e) => startApuColumnResize(key, e)}
        style={{ position: 'absolute', top: 0, right: 0, width: '8px', height: '100%', cursor: 'col-resize', userSelect: 'none', zIndex: 1 }}
      />
    </th>
  );

  // Render entry views
  if (viewState === 'list') {
    if (mode === 'lite') {
      return (
        <>
          <BudgetsListLite
            budgets={budgets}
            recientes={recientes}
            antiguos={antiguos}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            selectedGroup={selectedGroup}
            setSelectedGroup={setSelectedGroup}
            groups={groups}
            isLoading={isLoading}
            setIsLoading={setIsLoading}
            resetBudgetForm={resetBudgetForm}
            setIsCreateOpen={setIsCreateOpen}
            handleOpenBudgetEditor={handleOpenBudgetEditor}
            handleOpenMenu={handleOpenMenu}
            getBudgetCD={getBudgetCD}
            openBudgets={openBudgets}
            handleSelectBudgetTab={handleSelectBudgetTab}
            handleCloseBudgetTab={handleCloseBudgetTab}
            toggleTheme={toggleTheme}
            theme={theme}
            companies={companies}
            user={user}
            menuOpenId={menuOpenId}
            menuPosition={menuPosition}
            menuRef={menuRef}
            startEditBudget={startEditBudget}
            handleDuplicateBudget={handleDuplicateBudget}
            handleDeleteBudget={handleDeleteBudget}
            menuItemStyle={Modals.menuItemStyle}
            onNavigate={onNavigate}
          />
          <Modals.CreateBudgetModal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} onSubmit={handleCreateBudget} nombre={nombre} setNombre={setNombre} cliente={cliente} setCliente={setCliente} fechaBase={fechaBase} setFechaBase={setFechaBase} grupo={grupo} setGrupo={setGrupo} groups={groups} />
          <Modals.EditBudgetModal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} onSubmit={handleEditBudget} nombre={nombre} setNombre={setNombre} cliente={cliente} setCliente={setCliente} fechaBase={fechaBase} setFechaBase={setFechaBase} grupo={grupo} setGrupo={setGrupo} groups={groups} />
        </>
      );
    }

    return (
      <>
        <BudgetsListPro
          theme={theme}
          budgets={budgets}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          portfolioSearchTerm={portfolioSearchTerm}
          setPortfolioSearchTerm={setPortfolioSearchTerm}
          selectedPortfolio={selectedPortfolio}
          setSelectedPortfolio={setSelectedPortfolio}
          isLoading={isLoading}
          setIsLoading={setIsLoading}
          resetBudgetForm={resetBudgetForm}
          setIsCreateOpen={setIsCreateOpen}
          handleOpenBudgetEditor={handleOpenBudgetEditor}
          handleOpenMenu={handleOpenMenu}
          getBudgetCD={getBudgetCD}
          setViewState={setViewState}
          menuOpenId={menuOpenId}
          menuPosition={menuPosition}
          menuRef={menuRef}
          startEditBudget={startEditBudget}
          handleDuplicateBudget={handleDuplicateBudget}
          handleDeleteBudget={handleDeleteBudget}
          menuItemStyle={Modals.menuItemStyle}
          onNavigate={onNavigate}
        />
        <Modals.CreateBudgetModal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} onSubmit={handleCreateBudget} nombre={nombre} setNombre={setNombre} cliente={cliente} setCliente={setCliente} fechaBase={fechaBase} setFechaBase={setFechaBase} grupo={grupo} setGrupo={setGrupo} groups={groups} />
        <Modals.EditBudgetModal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} onSubmit={handleEditBudget} nombre={nombre} setNombre={setNombre} cliente={cliente} setCliente={setCliente} fechaBase={fechaBase} setFechaBase={setFechaBase} grupo={grupo} setGrupo={setGrupo} groups={groups} />
      </>
    );
  }

  // Render editor views
  if (activeBudget) {
    if (mode === 'lite') {
      return (
        <>
          <BudgetEditorLite
            activeBudget={activeBudget}
            openBudgets={openBudgets}
            handleSelectBudgetTab={handleSelectBudgetTab}
            handleCloseBudgetTab={handleCloseBudgetTab}
            setViewState={setViewState}
            toggleTheme={toggleTheme}
            theme={theme}
            companies={companies}
            user={user}
            getBudgetCD={getBudgetCD}
            setIsDatosGeneralesOpen={setIsDatosGeneralesOpen}
            setIsGastosGeneralesOpen={setIsGastosGeneralesOpen}
            setIsPiePresupuestoOpen={setIsPiePresupuestoOpen}
            setIsFormulaPolinomicaOpen={setIsFormulaPolinomicaOpen}
            setIsCatalogoInsumosOpen={setIsCatalogoInsumosOpen}
            setIsCatalogoPartidasOpen={setIsCatalogoPartidasOpen}
            setIsListaInsumosOpen={setIsListaInsumosOpen}
            setIsConfiguracionOpen={setIsConfiguracionOpen}
            downloadActiveBudgetDatabase={downloadActiveBudgetDatabase}
            selectedPartidaId={selectedPartidaId}
            setSelectedPartidaId={setSelectedPartidaId}
            sidebarTab={sidebarTab}
            setSidebarTab={setSidebarTab}
            isInfraCostSidebarCollapsed={isInfraCostSidebarCollapsed}
            setIsInfraCostSidebarCollapsed={setIsInfraCostSidebarCollapsed}
            showGridlines={showGridlines}
            partidaColumnWidths={partidaColumnWidths}
            partidaTableWidth={partidaTableWidth}
            renderPartidaHeader={renderPartidaHeader}
            apuPanelHeight={apuPanelHeight}
            setApuPanelHeight={setApuPanelHeight}
            apuZoom={apuZoom}
            setApuZoom={setApuZoom}
            apuColumnWidths={apuColumnWidths}
            apuTableWidth={apuTableWidth}
            renderApuHeader={renderApuHeader}
            getAPUBreakdown={getAPUBreakdown}
            getPartidaCU={getPartidaCU}
            getPartidaParcial={getPartidaParcial}
            handlePartidaCellClick={handlePartidaCellClick}
            handlePartidaContextMenu={handlePartidaContextMenu}
            handlePartidaCellChange={handlePartidaCellChange}
            handleUpdateInsumoField={handleUpdateInsumoField}
            handleDeleteInsumo={handleDeleteInsumo}
            setSelectedSpecPartidaId={setSelectedPartidaId}
            setIsAddInsumoOpen={setIsAddInsumoOpen}
            getInsumoCantidad={getInsumoCantidad}
            getInsumoParcial={getInsumoParcial}
          />

          <Modals.AddInsumoModal isOpen={isAddInsumoOpen} onClose={() => setIsAddInsumoOpen(false)} onSubmit={handleAddInsumo} insumoNombre={insumoNombre} setInsumoNombre={setInsumoNombre} insumoUnidad={insumoUnidad} setInsumoUnidad={setInsumoUnidad} insumoCuadrilla={insumoCuadrilla} setInsumoCuadrilla={setInsumoCuadrilla} insumoPU={insumoPU} setInsumoPU={setInsumoPU} insumoTipo={insumoTipo} setInsumoTipo={setInsumoTipo} showSuggestions={showSuggestions} setShowSuggestions={setShowSuggestions} matchingSuggestions={matchingSuggestions} handleSelectSuggestion={handleSelectSuggestion} handleCreateNewInsumoOption={handleCreateNewInsumoOption} />
          <Modals.AddPartidaModal isOpen={isAddPartidaOpen} onClose={() => setIsAddPartidaOpen(false)} onSubmit={handleAddPartida} partidaNombre={partidaNombre} setPartidaNombre={setPartidaNombre} partidaUnidad={partidaUnidad} setPartidaUnidad={setPartidaUnidad} partidaMetrado={partidaMetrado} setPartidaMetrado={setPartidaMetrado} partidaRendimiento={partidaRendimiento} setPartidaRendimiento={setPartidaRendimiento} partidaEsTitulo={partidaEsTitulo} />
          <Modals.DatosGeneralesModal isOpen={isDatosGeneralesOpen} onClose={() => setIsDatosGeneralesOpen(false)} activeBudget={activeBudget} dgActiveTab={dgActiveTab} setDgActiveTab={setDgActiveTab} dgGrupo={dgGrupo} setDgGrupo={setDgGrupo} dgPresupuesto={dgPresupuesto} setDgPresupuesto={setDgPresupuesto} dgCliente={dgCliente} setDgCliente={setDgCliente} dgDireccion={dgDireccion} setDgDireccion={setDgDireccion} dgDistrito={dgDistrito} setDgDistrito={setDgDistrito} dgProvincia={dgProvincia} setDgProvincia={setDgProvincia} dgDepartamento={dgDepartamento} setDgDepartamento={setDgDepartamento} dgFechaBase={dgFechaBase} setDgFechaBase={setDgFechaBase} dgJornada={dgJornada} setDgJornada={setDgJornada} dgMoneda={dgMoneda} setDgMoneda={setDgMoneda} dgSubPresupuestos={dgSubPresupuestos} setDgSubPresupuestos={setDgSubPresupuestos} newSubPresupuesto={newSubPresupuesto} setNewSubPresupuesto={setNewSubPresupuesto} groups={groups} onSave={handleSaveDatosGenerales} />
          <Modals.GastosGeneralesModal isOpen={isGastosGeneralesOpen} onClose={() => setIsGastosGeneralesOpen(false)} ggTipo={ggTipo} setGgTipo={setGgTipo} ggFijosItems={ggFijosItems} setGgFijosItems={setGgFijosItems} ggVariablesItems={ggVariablesItems} setGgVariablesItems={setGgVariablesItems} getBudgetCD={getBudgetCD} activeBudget={activeBudget} />
          <Modals.PiePresupuestoModal isOpen={isPiePresupuestoOpen} onClose={() => setIsPiePresupuestoOpen(false)} activeBudget={activeBudget} pieRows={pieRows} setPieRows={setPieRows} getBudgetCD={getBudgetCD} />
          <Modals.FormulaPolinomicaModal isOpen={isFormulaPolinomicaOpen} onClose={() => setIsFormulaPolinomicaOpen(false)} activeBudget={activeBudget} formulaPolinomicaRows={formulaPolinomicaRows} setFormulaPolinomicaRows={setFormulaPolinomicaRows} />
          <Modals.CatalogoInsumosModal isOpen={isCatalogoInsumosOpen} onClose={() => setIsCatalogoInsumosOpen(false)} catalogoInsumos={catalogoInsumos} ciSearchTerm={ciSearchTerm} setCiSearchTerm={setCiSearchTerm} ciSelectedTipo={ciSelectedTipo} setCiSelectedTipo={setCiSelectedTipo} onAddFromCatalog={(item) => {
            const newIns: Insumo = { id: 'i_' + Math.random().toString(36).substring(2, 9), nombre: item.nombre, unidad: item.unidad, cuadrilla: 1, pu: item.precio, tipo: item.tipo === 'MATERIAL' ? 'MT' : item.tipo === 'MANO DE OBRA' ? 'MO' : 'EQ' };
            if (selectedPartidaId) {
              const p = activeBudget.partidas.find(x => x.id === selectedPartidaId);
              if (p) handlePartidaCellChange(selectedPartidaId, 'insumos', [...p.insumos, newIns]);
            }
            setIsCatalogoInsumosOpen(false);
          }} />
          <Modals.CatalogoPartidasModal isOpen={isCatalogoPartidasOpen} onClose={() => setIsCatalogoPartidasOpen(false)} catalogoPartidas={MOCK_CATALOGO_PARTIDAS} cpSearchTerm={cpSearchTerm} setCpSearchTerm={setCpSearchTerm} cpSelectedPartidaIndex={cpSelectedPartidaIndex} setCpSelectedPartidaIndex={setCpSelectedPartidaIndex} onAddPartidaFromCatalog={(item) => {
            const newP: Partida = { id: 'p_' + Math.random().toString(36).substring(2, 9), item: String(activeBudget.partidas.length + 1), nombre: item.nombre, unidad: item.unidad, metrado: 1, esTitulo: false, rendimiento: item.rendimiento, insumos: item.insumos.map((x: any) => ({ id: 'i_' + Math.random().toString(36).substring(2, 9), nombre: x.nombre, unidad: x.unidad, cuadrilla: x.cuadrilla, pu: x.pu, tipo: x.tipo })) };
            const updatedBudget = { ...activeBudget, partidas: [...activeBudget.partidas, newP] };
            setActiveBudget(updatedBudget);
            setBudgets(budgets.map(b => b.id === activeBudget.id ? updatedBudget : b));
            setIsCatalogoPartidasOpen(false);
          }} />
          <Modals.ListaInsumosModal isOpen={isListaInsumosOpen} onClose={() => setIsListaInsumosOpen(false)} activeBudget={activeBudget} />
          <Modals.ConfiguracionModal isOpen={isConfiguracionOpen} onClose={() => setIsConfiguracionOpen(false)} showGridlines={showGridlines} setShowGridlines={setShowGridlines} />
        </>
      );
    }

    return (
      <>
        <BudgetEditorPro
          activeBudget={activeBudget}
          openBudgets={openBudgets}
          handleSelectBudgetTab={handleSelectBudgetTab}
          handleCloseBudgetTab={handleCloseBudgetTab}
          setViewState={setViewState}
          toggleTheme={toggleTheme}
          theme={theme}
          companies={companies}
          user={user}
          getBudgetCD={getBudgetCD}
          setIsDatosGeneralesOpen={setIsDatosGeneralesOpen}
          setIsGastosGeneralesOpen={setIsGastosGeneralesOpen}
          setIsPiePresupuestoOpen={setIsPiePresupuestoOpen}
          setIsFormulaPolinomicaOpen={setIsFormulaPolinomicaOpen}
          setIsCatalogoInsumosOpen={setIsCatalogoInsumosOpen}
          setIsCatalogoPartidasOpen={setIsCatalogoPartidasOpen}
          setIsListaInsumosOpen={setIsListaInsumosOpen}
          setIsConfiguracionOpen={setIsConfiguracionOpen}
          downloadActiveBudgetDatabase={downloadActiveBudgetDatabase}
          selectedPartidaId={selectedPartidaId}
          setSelectedPartidaId={setSelectedPartidaId}
          specifications={specifications}
          setSpecifications={setSpecifications}
          geminiPrompt={geminiPrompt}
          setGeminiPrompt={setGeminiPrompt}
          geminiResponse={geminiResponse}
          setGeminiResponse={setGeminiResponse}
          geminiIsLoading={geminiIsLoading}
          handleAskGemini={handleAskGemini}
          handlePartidaCellClick={handlePartidaCellClick}
          handlePartidaContextMenu={handlePartidaContextMenu}
          getPartidaCU={getPartidaCU}
          getPartidaParcial={getPartidaParcial}
          getAPUBreakdown={getAPUBreakdown}
          partidaColumnWidths={partidaColumnWidths}
          partidaTableWidth={partidaTableWidth}
          handlePartidaCellChange={handlePartidaCellChange}
          handleUpdateInsumoField={handleUpdateInsumoField}
          handleDeleteInsumo={handleDeleteInsumo}
          setSelectedSpecPartidaId={setSelectedPartidaId}
          setIsAddInsumoOpen={setIsAddInsumoOpen}
          getInsumoCantidad={getInsumoCantidad}
          getInsumoParcial={getInsumoParcial}
        />

        <Modals.AddInsumoModal isOpen={isAddInsumoOpen} onClose={() => setIsAddInsumoOpen(false)} onSubmit={handleAddInsumo} insumoNombre={insumoNombre} setInsumoNombre={setInsumoNombre} insumoUnidad={insumoUnidad} setInsumoUnidad={setInsumoUnidad} insumoCuadrilla={insumoCuadrilla} setInsumoCuadrilla={setInsumoCuadrilla} insumoPU={insumoPU} setInsumoPU={setInsumoPU} insumoTipo={insumoTipo} setInsumoTipo={setInsumoTipo} showSuggestions={showSuggestions} setShowSuggestions={setShowSuggestions} matchingSuggestions={matchingSuggestions} handleSelectSuggestion={handleSelectSuggestion} handleCreateNewInsumoOption={handleCreateNewInsumoOption} />
        <Modals.AddPartidaModal isOpen={isAddPartidaOpen} onClose={() => setIsAddPartidaOpen(false)} onSubmit={handleAddPartida} partidaNombre={partidaNombre} setPartidaNombre={setPartidaNombre} partidaUnidad={partidaUnidad} setPartidaUnidad={setPartidaUnidad} partidaMetrado={partidaMetrado} setPartidaMetrado={setPartidaMetrado} partidaRendimiento={partidaRendimiento} setPartidaRendimiento={setPartidaRendimiento} partidaEsTitulo={partidaEsTitulo} />
        <Modals.DatosGeneralesModal isOpen={isDatosGeneralesOpen} onClose={() => setIsDatosGeneralesOpen(false)} activeBudget={activeBudget} dgActiveTab={dgActiveTab} setDgActiveTab={setDgActiveTab} dgGrupo={dgGrupo} setDgGrupo={setDgGrupo} dgPresupuesto={dgPresupuesto} setDgPresupuesto={setDgPresupuesto} dgCliente={dgCliente} setDgCliente={setDgCliente} dgDireccion={dgDireccion} setDgDireccion={setDgDireccion} dgDistrito={dgDistrito} setDgDistrito={setDgDistrito} dgProvincia={dgProvincia} setDgProvincia={setDgProvincia} dgDepartamento={dgDepartamento} setDgDepartamento={setDgDepartamento} dgFechaBase={dgFechaBase} setDgFechaBase={setDgFechaBase} dgJornada={dgJornada} setDgJornada={setDgJornada} dgMoneda={dgMoneda} setDgMoneda={setDgMoneda} dgSubPresupuestos={dgSubPresupuestos} setDgSubPresupuestos={setDgSubPresupuestos} newSubPresupuesto={newSubPresupuesto} setNewSubPresupuesto={setNewSubPresupuesto} groups={groups} onSave={handleSaveDatosGenerales} />
        <Modals.GastosGeneralesModal isOpen={isGastosGeneralesOpen} onClose={() => setIsGastosGeneralesOpen(false)} ggTipo={ggTipo} setGgTipo={setGgTipo} ggFijosItems={ggFijosItems} setGgFijosItems={setGgFijosItems} ggVariablesItems={ggVariablesItems} setGgVariablesItems={setGgVariablesItems} getBudgetCD={getBudgetCD} activeBudget={activeBudget} />
        <Modals.PiePresupuestoModal isOpen={isPiePresupuestoOpen} onClose={() => setIsPiePresupuestoOpen(false)} activeBudget={activeBudget} pieRows={pieRows} setPieRows={setPieRows} getBudgetCD={getBudgetCD} />
        <Modals.FormulaPolinomicaModal isOpen={isFormulaPolinomicaOpen} onClose={() => setIsFormulaPolinomicaOpen(false)} activeBudget={activeBudget} formulaPolinomicaRows={formulaPolinomicaRows} setFormulaPolinomicaRows={setFormulaPolinomicaRows} />
        <Modals.CatalogoInsumosModal isOpen={isCatalogoInsumosOpen} onClose={() => setIsCatalogoInsumosOpen(false)} catalogoInsumos={catalogoInsumos} ciSearchTerm={ciSearchTerm} setCiSearchTerm={setCiSearchTerm} ciSelectedTipo={ciSelectedTipo} setCiSelectedTipo={setCiSelectedTipo} onAddFromCatalog={(item) => {
          const newIns: Insumo = { id: 'i_' + Math.random().toString(36).substring(2, 9), nombre: item.nombre, unidad: item.unidad, cuadrilla: 1, pu: item.precio, tipo: item.tipo === 'MATERIAL' ? 'MT' : item.tipo === 'MANO DE OBRA' ? 'MO' : 'EQ' };
          if (selectedPartidaId) {
            const p = activeBudget.partidas.find(x => x.id === selectedPartidaId);
            if (p) handlePartidaCellChange(selectedPartidaId, 'insumos', [...p.insumos, newIns]);
          }
          setIsCatalogoInsumosOpen(false);
        }} />
        <Modals.CatalogoPartidasModal isOpen={isCatalogoPartidasOpen} onClose={() => setIsCatalogoPartidasOpen(false)} catalogoPartidas={MOCK_CATALOGO_PARTIDAS} cpSearchTerm={cpSearchTerm} setCpSearchTerm={setCpSearchTerm} cpSelectedPartidaIndex={cpSelectedPartidaIndex} setCpSelectedPartidaIndex={setCpSelectedPartidaIndex} onAddPartidaFromCatalog={(item) => {
          const newP: Partida = { id: 'p_' + Math.random().toString(36).substring(2, 9), item: String(activeBudget.partidas.length + 1), nombre: item.nombre, unidad: item.unidad, metrado: 1, esTitulo: false, rendimiento: item.rendimiento, insumos: item.insumos.map((x: any) => ({ id: 'i_' + Math.random().toString(36).substring(2, 9), nombre: x.nombre, unidad: x.unidad, cuadrilla: x.cuadrilla, pu: x.pu, tipo: x.tipo })) };
          const updatedBudget = { ...activeBudget, partidas: [...activeBudget.partidas, newP] };
          setActiveBudget(updatedBudget);
          setBudgets(budgets.map(b => b.id === activeBudget.id ? updatedBudget : b));
          setIsCatalogoPartidasOpen(false);
        }} />
        <Modals.ListaInsumosModal isOpen={isListaInsumosOpen} onClose={() => setIsListaInsumosOpen(false)} activeBudget={activeBudget} />
        <Modals.ConfiguracionModal isOpen={isConfiguracionOpen} onClose={() => setIsConfiguracionOpen(false)} showGridlines={showGridlines} setShowGridlines={setShowGridlines} />
      </>
    );
  }

  return null;
};
