import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Card, Button, Input, Select, Modal } from '@infrasuite/shared';
import { useAuth } from '@infrasuite/auth';
import { db } from '@infrasuite/firebase';

import type { Budget, Partida, Insumo, PartidaColumnKey, ApuColumnKey, BudgetsProps, PiePresupuestoRow, SharedPartidaBudgetRef } from './types';
import { BudgetsListLite } from './BudgetsListLite';
import { BudgetsListPro } from './BudgetsListPro';
import { BudgetEditorLite, LiteIcon, type LiteIconName } from './BudgetEditorLite';
import { BudgetEditorPro } from './BudgetEditorPro';
import { ShareModal } from './ShareModal';
import * as Modals from './Modals';
import { firestore } from '@infrasuite/firebase';
import { collection, onSnapshot, doc, setDoc, getDocs, deleteDoc, query, where, or } from 'firebase/firestore';

// Initial Data representing the screenshot data
const INITIAL_BUDGETS: Budget[] = [
  // ============================================================
  // PRESUPUESTO PANAILLO — Importado desde Excel 02/08/2026
  // ============================================================
  {
    id: 'panaillo_001',
    nombre: 'PLAN DE MANTENIMIENTO - PANAILLO',
    cliente: 'MUNICIPALIDAD DISTRITAL DE YARINACOCHA',
    fechaBase: '2026-08-02',
    grupo: 'SANEAMIENTO',
    categoria: 'Recientes',
    direccion: 'PANAILLO',
    distrito: 'YARINACOCHA',
    provincia: 'CORONEL PORTILLO',
    departamento: 'UCAYALI',
    jornada: 8,
    moneda: 'SOLES',
    subPresupuestos: ['PLAN DE MANTENIMIENTO CORRECTIVO Y PREVENTIVO'],
    partidas: [
      // ── TÍTULO 01 ─────────────────────────────────────────────
      {
        id: 'pan_t1', item: '01', nombre: 'MANTENIMIENTO DE CASTILLO DE CONCRETO',
        unidad: '', metrado: 0, esTitulo: true, rendimiento: 1, insumos: []
      },
      // ── 01.01 TRABAJOS PRELIMINARES ───────────────────────────
      {
        id: 'pan_t1_1', item: '01.01', nombre: 'TRABAJOS PRELIMINARES',
        unidad: '', metrado: 0, esTitulo: true, rendimiento: 1, insumos: []
      },
      {
        id: 'pan_p1', item: '01.01.01', nombre: 'LIJADO DE COLUMNAS DE CONCRETO',
        unidad: 'M2', metrado: 79.63, esTitulo: false, rendimiento: 20,
        insumos: [
          { id: 'pan_i_p1_1', codigo: '0147010004', nombre: 'PEON', unidad: 'HH', cuadrilla: 2.0, pu: 21.29, tipo: 'MO' },
          { id: 'pan_i_p1_2', codigo: '0239020037', nombre: 'LIJA #40 (PLIEGO)', unidad: 'UND', cuadrilla: 0.15, pu: 3.5, tipo: 'MT' },
          { id: 'pan_i_p1_3', codigo: '0337010001', nombre: 'HERRAMIENTAS MANUALES', unidad: '%MO', cuadrilla: 3.0, pu: 17.03, tipo: 'EQ' }
        ]
      },
      {
        id: 'pan_p2', item: '01.01.02', nombre: 'LIJADO DE VIGAS DE CONCRETO',
        unidad: 'M2', metrado: 59.98, esTitulo: false, rendimiento: 20,
        insumos: [
          { id: 'pan_i_p2_1', codigo: '0147010004', nombre: 'PEON', unidad: 'HH', cuadrilla: 2.0, pu: 21.29, tipo: 'MO' },
          { id: 'pan_i_p2_2', codigo: '0239020037', nombre: 'LIJA #40 (PLIEGO)', unidad: 'UND', cuadrilla: 0.15, pu: 3.5, tipo: 'MT' },
          { id: 'pan_i_p2_3', codigo: '0337010001', nombre: 'HERRAMIENTAS MANUALES', unidad: '%MO', cuadrilla: 3.0, pu: 17.03, tipo: 'EQ' }
        ]
      },
      {
        id: 'pan_p3', item: '01.01.03', nombre: 'LIJADO DE PAREDES DE CONCRETO EN RESERVORIO',
        unidad: 'M2', metrado: 165.12, esTitulo: false, rendimiento: 35,
        insumos: [
          { id: 'pan_i_p3_1', codigo: '0147010004', nombre: 'PEON', unidad: 'HH', cuadrilla: 2.0, pu: 21.29, tipo: 'MO' },
          { id: 'pan_i_p3_2', codigo: '0239020037', nombre: 'LIJA #40 (PLIEGO)', unidad: 'UND', cuadrilla: 0.15, pu: 3.5, tipo: 'MT' },
          { id: 'pan_i_p3_3', codigo: '0337010001', nombre: 'HERRAMIENTAS MANUALES', unidad: '%MO', cuadrilla: 3.0, pu: 9.73, tipo: 'EQ' }
        ]
      },
      // ── 01.02 PINTURA ─────────────────────────────────────────
      {
        id: 'pan_t1_2', item: '01.02', nombre: 'PINTURA',
        unidad: '', metrado: 0, esTitulo: true, rendimiento: 1, insumos: []
      },
      {
        id: 'pan_p4', item: '01.02.01', nombre: 'PINTURA ESMALTE EN COLUMNAS DE CONCRETO (2 MANOS)',
        unidad: 'M2', metrado: 79.63, esTitulo: false, rendimiento: 35,
        insumos: [
          { id: 'pan_i_p4_1', codigo: '0147010002', nombre: 'OPERARIO', unidad: 'HH', cuadrilla: 1.0, pu: 29.9, tipo: 'MO' },
          { id: 'pan_i_p4_2', codigo: '0147010004', nombre: 'PEON', unidad: 'HH', cuadrilla: 1.0, pu: 21.29, tipo: 'MO' },
          { id: 'pan_i_p4_3', codigo: '0254020000', nombre: 'PINTURA ESMALTE', unidad: 'GLN', cuadrilla: 0.12, pu: 57.0, tipo: 'MT' },
          { id: 'pan_i_p4_4', codigo: '0253030027', nombre: 'THINER', unidad: 'GLN', cuadrilla: 0.03, pu: 35.0, tipo: 'MT' },
          { id: 'pan_i_p4_5', codigo: '0337010001', nombre: 'HERRAMIENTAS MANUALES', unidad: '%MO', cuadrilla: 3.0, pu: 11.7, tipo: 'EQ' },
          { id: 'pan_i_p4_6', codigo: '0348800000', nombre: 'ANDAMIO', unidad: 'HE', cuadrilla: 2.0, pu: 20.0, tipo: 'EQ' }
        ]
      },
      {
        id: 'pan_p5', item: '01.02.02', nombre: 'PINTURA ESMALTE EN VIGAS DE CONCRETO (2 MANOS)',
        unidad: 'M2', metrado: 59.98, esTitulo: false, rendimiento: 35,
        insumos: [
          { id: 'pan_i_p5_1', codigo: '0147010002', nombre: 'OPERARIO', unidad: 'HH', cuadrilla: 1.0, pu: 29.9, tipo: 'MO' },
          { id: 'pan_i_p5_2', codigo: '0147010004', nombre: 'PEON', unidad: 'HH', cuadrilla: 1.0, pu: 21.29, tipo: 'MO' },
          { id: 'pan_i_p5_3', codigo: '0253030027', nombre: 'THINER', unidad: 'GLN', cuadrilla: 0.03, pu: 35.0, tipo: 'MT' },
          { id: 'pan_i_p5_4', codigo: '0254020000', nombre: 'PINTURA ESMALTE', unidad: 'GLN', cuadrilla: 0.12, pu: 57.0, tipo: 'MT' },
          { id: 'pan_i_p5_5', codigo: '0337010001', nombre: 'HERRAMIENTAS MANUALES', unidad: '%MO', cuadrilla: 3.0, pu: 11.7, tipo: 'EQ' },
          { id: 'pan_i_p5_6', codigo: '0348800000', nombre: 'ANDAMIO', unidad: 'HE', cuadrilla: 1.0, pu: 20.0, tipo: 'EQ' }
        ]
      },
      {
        id: 'pan_p6', item: '01.02.03', nombre: 'PINTURA ESMALTE EN PAREDES DE CONCRETO (2 MANOS)',
        unidad: 'M2', metrado: 165.12, esTitulo: false, rendimiento: 30,
        insumos: [
          { id: 'pan_i_p6_1', codigo: '0147010002', nombre: 'OPERARIO', unidad: 'HH', cuadrilla: 1.0, pu: 29.9, tipo: 'MO' },
          { id: 'pan_i_p6_2', codigo: '0147010004', nombre: 'PEON', unidad: 'HH', cuadrilla: 1.0, pu: 21.29, tipo: 'MO' },
          { id: 'pan_i_p6_3', codigo: '0253030027', nombre: 'THINER', unidad: 'GLN', cuadrilla: 0.03, pu: 35.0, tipo: 'MT' },
          { id: 'pan_i_p6_4', codigo: '0254110096', nombre: 'PINTURA ESMALTE', unidad: 'GLN', cuadrilla: 0.12, pu: 57.0, tipo: 'MT' },
          { id: 'pan_i_p6_5', codigo: '0337010001', nombre: 'HERRAMIENTAS MANUALES', unidad: '%MO', cuadrilla: 3.0, pu: 13.65, tipo: 'EQ' },
          { id: 'pan_i_p6_6', codigo: '0348800000', nombre: 'ANDAMIO', unidad: 'HE', cuadrilla: 1.0, pu: 20.0, tipo: 'EQ' }
        ]
      },
      // ── TÍTULO 03 ─────────────────────────────────────────────
      {
        id: 'pan_t3', item: '03', nombre: 'MANTENIMIENTO DE CERCO METALICO',
        unidad: '', metrado: 0, esTitulo: true, rendimiento: 1, insumos: []
      },
      // ── 03.01 TRABAJOS PRELIMINARES ───────────────────────────
      {
        id: 'pan_t3_1', item: '03.01', nombre: 'TRABAJOS PRELIMINARES',
        unidad: '', metrado: 0, esTitulo: true, rendimiento: 1, insumos: []
      },
      {
        id: 'pan_p7', item: '03.01.01', nombre: 'LIJADO DE SUPERFICIE METALICA',
        unidad: 'M2', metrado: 144.4, esTitulo: false, rendimiento: 20,
        insumos: [
          { id: 'pan_i_p7_1', codigo: '0147010002', nombre: 'OPERARIO', unidad: 'HH', cuadrilla: 0.5, pu: 29.9, tipo: 'MO' },
          { id: 'pan_i_p7_2', codigo: '0147010004', nombre: 'PEON', unidad: 'HH', cuadrilla: 0.1, pu: 21.29, tipo: 'MO' },
          { id: 'pan_i_p7_3', codigo: '0239020027', nombre: 'LIJA DE FIERRO # 80', unidad: 'PZA', cuadrilla: 0.10, pu: 2.8, tipo: 'MT' },
          { id: 'pan_i_p7_4', codigo: '0337010001', nombre: 'HERRAMIENTAS MANUALES', unidad: '%MO', cuadrilla: 3.0, pu: 6.83, tipo: 'EQ' }
        ]
      },
      // ── 03.02 PINTURA ─────────────────────────────────────────
      {
        id: 'pan_t3_2', item: '03.02', nombre: 'PINTURA',
        unidad: '', metrado: 0, esTitulo: true, rendimiento: 1, insumos: []
      },
      {
        id: 'pan_p8', item: '03.02.01', nombre: 'PINTURA ANTICORROSIVA EN SUPERFICIE METALICA',
        unidad: 'M2', metrado: 144.4, esTitulo: false, rendimiento: 15,
        insumos: [
          { id: 'pan_i_p8_1', codigo: '0147010004', nombre: 'PEON', unidad: 'HH', cuadrilla: 1.0, pu: 21.2826, tipo: 'MO' },
          { id: 'pan_i_p8_2', codigo: '0239060024', nombre: 'WAYPE INDUSTRIAL', unidad: 'KG', cuadrilla: 0.05, pu: 8.0, tipo: 'MT' },
          { id: 'pan_i_p8_3', codigo: '0253030033', nombre: 'THINER ACRILICO', unidad: 'GLN', cuadrilla: 0.025, pu: 18.0, tipo: 'MT' },
          { id: 'pan_i_p8_4', codigo: '0253030035', nombre: 'BROCHA 2 1/2"', unidad: 'UND', cuadrilla: 0.1, pu: 12.0, tipo: 'MT' },
          { id: 'pan_i_p8_5', codigo: '0254060000', nombre: 'PINTURA ANTICORROSIVA', unidad: 'GLN', cuadrilla: 0.12, pu: 70.0, tipo: 'MT' },
          { id: 'pan_i_p8_6', codigo: '0337010001', nombre: 'HERRAMIENTAS MANUALES', unidad: '%MO', cuadrilla: 3.0, pu: 11.35, tipo: 'EQ' }
        ]
      },
      // ── TÍTULO 04 ─────────────────────────────────────────────
      {
        id: 'pan_t4', item: '04', nombre: 'VARIOS',
        unidad: '', metrado: 0, esTitulo: true, rendimiento: 1, insumos: []
      },
      // ── 04.01 KIT DE HERRAMIENTAS ─────────────────────────────
      {
        id: 'pan_t4_1', item: '04.01', nombre: 'KIT DE HERRAMIENTAS',
        unidad: '', metrado: 0, esTitulo: true, rendimiento: 1, insumos: []
      },
      {
        id: 'pan_p9', item: '04.01.01', nombre: 'SUMINISTRO Y ENTREGA DE KIT DE HERRAMIENTAS (FORMATO SEGÚN ACTA DEL MVCS)',
        unidad: 'GLB', metrado: 1.0, esTitulo: false, rendimiento: 1,
        insumos: [
          { id: 'pan_i_p9_1',  codigo: '0239070004', nombre: 'BOTAS DE JEBE', unidad: 'PAR', cuadrilla: 2.0, pu: 34.9, tipo: 'MT' },
          { id: 'pan_i_p9_2',  codigo: '0239070005', nombre: 'DESTORNILLADOR PLANO', unidad: 'UND', cuadrilla: 1.0, pu: 27.9, tipo: 'MT' },
          { id: 'pan_i_p9_3',  codigo: '0239160010', nombre: 'BROCHA', unidad: 'UND', cuadrilla: 1.0, pu: 20.0, tipo: 'MT' },
          { id: 'pan_i_p9_4',  codigo: '0239990058', nombre: 'ARCO DE SIERRA', unidad: 'UND', cuadrilla: 1.0, pu: 54.0, tipo: 'MT' },
          { id: 'pan_i_p9_5',  codigo: '0239990059', nombre: 'CARRETILLA', unidad: 'UND', cuadrilla: 1.0, pu: 210.0, tipo: 'MT' },
          { id: 'pan_i_p9_6',  codigo: '0239990060', nombre: 'LENTES DE SEGURIDAD', unidad: 'UND', cuadrilla: 2.0, pu: 4.9, tipo: 'MT' },
          { id: 'pan_i_p9_7',  codigo: '0256990022', nombre: 'CAJA PLASTICA METALICA MADERA', unidad: 'UND', cuadrilla: 1.0, pu: 50.0, tipo: 'MT' },
          { id: 'pan_i_p9_8',  codigo: '0201020068', nombre: 'ACEITE DE MAQUINA 3 EN 1.60 ML', unidad: 'UND', cuadrilla: 1.0, pu: 10.0, tipo: 'MT' },
          { id: 'pan_i_p9_9',  codigo: '0205010034', nombre: 'CASCO DE SEGURIDAD', unidad: 'UND', cuadrilla: 2.0, pu: 15.0, tipo: 'MT' },
          { id: 'pan_i_p9_10', codigo: '0207020017', nombre: 'ALICATE', unidad: 'UND', cuadrilla: 1.0, pu: 12.5, tipo: 'MT' },
          { id: 'pan_i_p9_11', codigo: '0207020018', nombre: 'COMBA DE 6 LBS', unidad: 'UND', cuadrilla: 1.0, pu: 45.0, tipo: 'MT' },
          { id: 'pan_i_p9_12', codigo: '0207020019', nombre: 'LLAVE STILSON DE 18"', unidad: 'UND', cuadrilla: 1.0, pu: 184.9, tipo: 'MT' },
          { id: 'pan_i_p9_13', codigo: '0207020020', nombre: 'ESCOFINA TIPO LUNA DE 1/2"', unidad: 'UND', cuadrilla: 1.0, pu: 20.0, tipo: 'MT' },
          { id: 'pan_i_p9_14', codigo: '0207020021', nombre: 'MASCARILLA PROTECTORA CON FILTRO ANTIGAS', unidad: 'UND', cuadrilla: 2.0, pu: 83.7, tipo: 'MT' },
          { id: 'pan_i_p9_15', codigo: '0207020022', nombre: 'MARTILLO CARPINTERIA', unidad: 'UND', cuadrilla: 1.0, pu: 31.5, tipo: 'MT' },
          { id: 'pan_i_p9_16', codigo: '0207020023', nombre: 'PALA RECTA', unidad: 'UND', cuadrilla: 1.0, pu: 44.9, tipo: 'MT' },
          { id: 'pan_i_p9_17', codigo: '0207020024', nombre: 'MACHETE O CHAFLAN', unidad: 'UND', cuadrilla: 1.0, pu: 19.9, tipo: 'MT' },
          { id: 'pan_i_p9_18', codigo: '0207020025', nombre: 'HOJAS DE SIERRA', unidad: 'UND', cuadrilla: 3.0, pu: 8.9, tipo: 'MT' },
          { id: 'pan_i_p9_19', codigo: '0207020026', nombre: 'WINCHA DE 5M', unidad: 'UND', cuadrilla: 1.0, pu: 29.4, tipo: 'MT' },
          { id: 'pan_i_p9_20', codigo: '0207020027', nombre: 'CINCEL DE PUNTA Y PLANA', unidad: 'PAR', cuadrilla: 1.0, pu: 12.9, tipo: 'MT' },
          { id: 'pan_i_p9_21', codigo: '0210130059', nombre: 'PICO CON MANGO', unidad: 'UND', cuadrilla: 1.0, pu: 94.2, tipo: 'MT' },
          { id: 'pan_i_p9_22', codigo: '0226570002', nombre: 'LLAVE FRANCESA DE 15"', unidad: 'UND', cuadrilla: 1.0, pu: 115.0, tipo: 'MT' },
          { id: 'pan_i_p9_23', codigo: '0229130010', nombre: 'CINTA TEFLON', unidad: 'UND', cuadrilla: 3.0, pu: 3.5, tipo: 'MT' },
          { id: 'pan_i_p9_24', codigo: '0230010085', nombre: 'PEGAMENTO PVC 1/4 GALON', unidad: 'UND', cuadrilla: 1.0, pu: 85.0, tipo: 'MT' },
          { id: 'pan_i_p9_25', codigo: '0230350007', nombre: 'MEDIDOR DE PLASTICO GRADUADO DE UN KILO PARA MEDIR CLORO', unidad: 'UND', cuadrilla: 1.0, pu: 10.0, tipo: 'MT' },
          { id: 'pan_i_p9_26', codigo: '0230530013', nombre: 'ESCOBILLA DE PLASTICO CON ASA', unidad: 'UND', cuadrilla: 2.0, pu: 10.0, tipo: 'MT' },
          { id: 'pan_i_p9_27', codigo: '0230530014', nombre: 'ESCOBA DE PLASTICO', unidad: 'UND', cuadrilla: 1.0, pu: 21.5, tipo: 'MT' },
          { id: 'pan_i_p9_28', codigo: '0230700084', nombre: 'BALDE DE PLASTICO GRADUADO DE 20 LT.', unidad: 'UND', cuadrilla: 1.0, pu: 25.0, tipo: 'MT' },
          { id: 'pan_i_p9_29', codigo: '0230750100', nombre: 'BLISTER DE PASTILLAS DPD', unidad: 'UND', cuadrilla: 35.0, pu: 6.0, tipo: 'MT' },
          { id: 'pan_i_p9_30', codigo: '0230760075', nombre: 'COMPARADOR DE CLORO DIGITAL', unidad: 'UND', cuadrilla: 1.0, pu: 450.0, tipo: 'MT' },
          { id: 'pan_i_p9_31', codigo: '0230920061', nombre: 'MANGUERA', unidad: 'M', cuadrilla: 30.0, pu: 4.0, tipo: 'MT' },
          { id: 'pan_i_p9_32', codigo: '0230990101', nombre: 'OVEROL', unidad: 'UND', cuadrilla: 2.0, pu: 77.0, tipo: 'MT' },
          { id: 'pan_i_p9_33', codigo: '0239070002', nombre: 'GUANTES DE HILO ROJO C/ PALMA DE LATEX', unidad: 'PAR', cuadrilla: 3.0, pu: 4.0, tipo: 'MT' },
          { id: 'pan_i_p9_34', codigo: '0239070003', nombre: 'GUANTES DE JEBE', unidad: 'PAR', cuadrilla: 2.0, pu: 6.0, tipo: 'MT' }
        ]
      },
      // ── 04.02 SEGURIDAD Y SALUD ───────────────────────────────
      {
        id: 'pan_t4_2', item: '04.02', nombre: 'SEGURIDAD Y SALUD',
        unidad: '', metrado: 0, esTitulo: true, rendimiento: 1, insumos: []
      },
      {
        id: 'pan_p10', item: '04.02.01', nombre: 'EQUIPOS DE PROTECCION PERSONAL',
        unidad: 'UND', metrado: 3.0, esTitulo: false, rendimiento: 1,
        insumos: [
          { id: 'pan_i_p10_1', codigo: '0205010034', nombre: 'CASCO DE SEGURIDAD', unidad: 'UND', cuadrilla: 1.0, pu: 15.0, tipo: 'MT' },
          { id: 'pan_i_p10_2', codigo: '0210210043', nombre: 'BOTAS DE JEBE', unidad: 'PAR', cuadrilla: 1.0, pu: 35.0, tipo: 'MT' },
          { id: 'pan_i_p10_3', codigo: '0226310057', nombre: 'CHALECO REFLECTIVO', unidad: 'UND', cuadrilla: 1.0, pu: 29.0, tipo: 'MT' },
          { id: 'pan_i_p10_4', codigo: '0239070002', nombre: 'GUANTES DE HILO ROJO C/ PALMA DE LATEX', unidad: 'PAR', cuadrilla: 1.0, pu: 4.0, tipo: 'MT' }
        ]
      },
      // ── 04.03 TRANSPORTE ──────────────────────────────────────
      {
        id: 'pan_t4_3', item: '04.03', nombre: 'TRANSPORTE',
        unidad: '', metrado: 0, esTitulo: true, rendimiento: 1, insumos: []
      },
      {
        id: 'pan_p11', item: '04.03.01', nombre: 'MOVILIZACIÓN Y TRANSPORTE DE MATERIALES, EQUIPOS Y HERRAMIENTAS',
        unidad: 'GLB', metrado: 1.0, esTitulo: false, rendimiento: 1,
        insumos: [
          { id: 'pan_i_p11_1', codigo: '0232010095', nombre: 'TRANSPORTE DE EQUIPOS Y MATERIALES', unidad: 'GLB', cuadrilla: 1.0, pu: 500.0, tipo: 'SC' }
        ]
      },
      // ── 04.04 CAPACITACION ────────────────────────────────────
      {
        id: 'pan_t4_4', item: '04.04', nombre: 'CAPACITACION',
        unidad: '', metrado: 0, esTitulo: true, rendimiento: 1, insumos: []
      },
      {
        id: 'pan_p12', item: '04.04.01', nombre: 'CAPACITACION DE OPERADORES Y JASS DE LA LOCALIDAD',
        unidad: 'GLB', metrado: 1.0, esTitulo: false, rendimiento: 1,
        insumos: [
          { id: 'pan_i_p12_1', codigo: '0337010005', nombre: 'SERVICIOS DE CAPACITACION Y ASISTENCIA TECNICA', unidad: 'GLB', cuadrilla: 1.0, pu: 200.0, tipo: 'SC' }
        ]
      }
    ]
  },
  // ============================================================
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
  codigo: 120,
  nombre: 380,
  unidad: 90,
  cuadrilla: 110,
  cantidad: 110,
  desperdicio: 115,
  pu: 130,
  parcial: 130,
  tipo: 110
};

const DEFAULT_PIE_ROWS: PiePresupuestoRow[] = [
  { variable: 'CD', descripcion: 'COSTO DIRECTO', formula: '', iu: '', resaltar: true, ocultarEnPdf: false },
  { variable: 'GG', descripcion: 'GASTOS GENERALES 10%', formula: 'CD * 0.10', iu: '39', resaltar: false, ocultarEnPdf: false },
  { variable: 'UTI', descripcion: 'UTILIDAD 10%', formula: 'CD * 0.10', iu: '39', resaltar: false, ocultarEnPdf: false },
  { variable: 'ST', descripcion: 'SUB TOTAL', formula: 'CD + GG + UTI', iu: '', resaltar: true, ocultarEnPdf: false },
  { variable: 'IGV', descripcion: 'IGV 18%', formula: 'ST * 0.18', iu: '', resaltar: false, ocultarEnPdf: false },
  { variable: 'TOTAL', descripcion: 'TOTAL PRESUPUESTO', formula: 'ST + IGV', iu: '', resaltar: true, ocultarEnPdf: false }
];

const clonePieRows = (rows: PiePresupuestoRow[] = DEFAULT_PIE_ROWS): PiePresupuestoRow[] =>
  rows.map(row => ({ ...row, ocultarEnPdf: Boolean(row.ocultarEnPdf) }));

const BUDGETS_LOCAL_STORAGE_KEY = 'infrasuite_budgets_v3';

const getBudgetFreshness = (budget: Budget) =>
  Number(budget.updatedAt ?? budget.createdAt ?? 0);

const readBudgetsFromLocalStorage = (): Budget[] => {
  if (typeof window === 'undefined') return [];
  try {
    const saved = window.localStorage.getItem(BUDGETS_LOCAL_STORAGE_KEY);
    if (!saved) return [];
    const parsed = JSON.parse(saved);
    return Array.isArray(parsed) ? parsed.filter((budget): budget is Budget => Boolean(budget?.id)) : [];
  } catch {
    return [];
  }
};

const mergeBudgetsByFreshness = (...budgetLists: Budget[][]): Budget[] => {
  const merged: Budget[] = [];
  const indexById = new Map<string, number>();

  budgetLists.flat().forEach((budget) => {
    if (!budget?.id) return;

    const existingIndex = indexById.get(budget.id);
    if (existingIndex === undefined) {
      indexById.set(budget.id, merged.length);
      merged.push(budget);
      return;
    }

    const existingBudget = merged[existingIndex];
    if (getBudgetFreshness(budget) >= getBudgetFreshness(existingBudget)) {
      merged[existingIndex] = budget;
    }
  });

  return merged;
};

const persistBudgetsLocally = (nextBudgets: Budget[]) => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(BUDGETS_LOCAL_STORAGE_KEY, JSON.stringify(nextBudgets));
  } catch {}
};

const persistBudgetLocally = (budget: Budget) => {
  persistBudgetsLocally(mergeBudgetsByFreshness(readBudgetsFromLocalStorage(), [budget]));
};

export const Budgets: React.FC<BudgetsProps> = ({
  theme,
  toggleTheme,
  companies,
  mode = 'lite',
  onNavigate,
  initialOpenBudgetId,
  publicReadOnly = false,
  onRequireLogin
}) => {
  const { user } = useAuth();
  
  const [budgets, setBudgets] = useState<Budget[]>(() => publicReadOnly ? [] : readBudgetsFromLocalStorage());
  const budgetsRef = useRef<Budget[]>(budgets);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [budgetToShare, setBudgetToShare] = useState<Budget | null>(null);
  const [activeBudget, setActiveBudget] = useState<Budget | null>(null);
  const [publicLinkState, setPublicLinkState] = useState<'checking' | 'allowed' | 'denied' | 'not_found'>(
    publicReadOnly ? 'checking' : 'allowed'
  );

  // Undo/Redo History
  const [historyPast, setHistoryPast] = useState<Budget[]>([]);
  const [historyFuture, setHistoryFuture] = useState<Budget[]>([]);
  const activeBudgetRef = useRef<Budget | null>(null);
  const recoveredBudgetUploadsRef = useRef<Record<string, number>>({});

  // Custom setter for activeBudget that records history
  const setHistoricalActiveBudget = (newBudget: Budget, skipHistory = false): Budget => {
    const stampedBudget = {
      ...newBudget,
      updatedAt: Date.now()
    };
    Object.assign(newBudget, stampedBudget);

    const previousBudget = activeBudgetRef.current?.id === stampedBudget.id ? activeBudgetRef.current : activeBudget;

    if (!skipHistory && previousBudget && JSON.stringify(previousBudget.partidas) !== JSON.stringify(stampedBudget.partidas)) {
      setHistoryPast(past => [...past, previousBudget].slice(-20)); // Keep last 20 states
      setHistoryFuture([]);
    }

    activeBudgetRef.current = stampedBudget;
    persistBudgetLocally(stampedBudget);
    setActiveBudget(stampedBudget);
    setBudgets(prev => prev.map(b => b.id === stampedBudget.id ? stampedBudget : b));
    return stampedBudget;
  };

  const handleUndo = () => {
    if (historyPast.length === 0 || !activeBudget) return;
    const previous = historyPast[historyPast.length - 1];
    setHistoryPast(past => past.slice(0, -1));
    setHistoryFuture(future => [activeBudget, ...future]);
    activeBudgetRef.current = previous;
    persistBudgetLocally(previous);
    setActiveBudget(previous);
    setBudgets(prev => prev.map(b => b.id === previous.id ? previous : b));
  };

  const handleRedo = () => {
    if (historyFuture.length === 0 || !activeBudget) return;
    const next = historyFuture[0];
    setHistoryFuture(future => future.slice(1));
    setHistoryPast(past => [...past, activeBudget]);
    activeBudgetRef.current = next;
    persistBudgetLocally(next);
    setActiveBudget(next);
    setBudgets(prev => prev.map(b => b.id === next.id ? next : b));
  };

  // UI State
  const [viewState, setViewState] = useState<'list' | 'editor'>('list');
  const [openBudgetIds, setOpenBudgetIds] = useState<string[]>([]);
  const [selectedPartidaId, setSelectedPartidaId] = useState<string | null>(null);
  const [selectedPartidaIds, setSelectedPartidaIds] = useState<string[]>([]);
  const [partidaSelectionAnchorId, setPartidaSelectionAnchorId] = useState<string | null>(null);
  const [isPartidaDragSelecting, setIsPartidaDragSelecting] = useState(false);
  const [partidaClipboardRows, setPartidaClipboardRows] = useState<Partida[]>([]);
  const [clipboard, setClipboard] = useState<{ action: 'copy' | 'cut' | null; partida: Partida | null }>({
    action: null,
    partida: null
  });
  const [sidebarTab, setSidebarTab] = useState('Presupuesto APU');
  const [isInfraCostSidebarCollapsed, setIsInfraCostSidebarCollapsed] = useState(false);
  const [partidaColumnWidths, setPartidaColumnWidths] = useState<Record<PartidaColumnKey, number>>(DEFAULT_PARTIDA_COLUMN_WIDTHS);
  const [apuColumnWidths, setApuColumnWidths] = useState<Record<ApuColumnKey, number>>(DEFAULT_APU_COLUMN_WIDTHS);

  useEffect(() => {
    activeBudgetRef.current = activeBudget;
  }, [activeBudget]);

  useEffect(() => {
    budgetsRef.current = budgets;
  }, [budgets]);

  useEffect(() => {
    if (publicReadOnly) return;

    const persistActiveDraft = () => {
      const currentBudget = activeBudgetRef.current;
      if (currentBudget) persistBudgetLocally(currentBudget);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') persistActiveDraft();
    };

    window.addEventListener('beforeunload', persistActiveDraft);
    window.addEventListener('pagehide', persistActiveDraft);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', persistActiveDraft);
      window.removeEventListener('pagehide', persistActiveDraft);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [publicReadOnly]);

  const isKeyboardInputTarget = (target: EventTarget | null) => {
    if (!(target instanceof HTMLElement)) return false;
    return Boolean(target.closest('input, textarea, select, button, [contenteditable="true"], .modal-overlay'));
  };

  const getPartidaRangeIds = (fromId: string | null, toId: string | null, sourceBudget = activeBudgetRef.current ?? activeBudget) => {
    if (!sourceBudget || !fromId || !toId) return [];
    const fromIndex = sourceBudget.partidas.findIndex(p => p.id === fromId);
    const toIndex = sourceBudget.partidas.findIndex(p => p.id === toId);
    if (fromIndex < 0 || toIndex < 0) return [];
    const start = Math.min(fromIndex, toIndex);
    const end = Math.max(fromIndex, toIndex);
    return sourceBudget.partidas.slice(start, end + 1).map(p => p.id);
  };

  const getOrderedSelectedPartidas = (sourceBudget = activeBudgetRef.current ?? activeBudget) => {
    if (!sourceBudget) return [];
    const ids = selectedPartidaIds.length > 0
      ? new Set(selectedPartidaIds)
      : new Set(selectedPartidaId ? [selectedPartidaId] : []);
    return sourceBudget.partidas.filter(p => ids.has(p.id));
  };

  const clonePartidaForPaste = (partida: Partida): Partida => ({
    ...partida,
    id: 'p_' + Math.random().toString(36).substring(2, 9),
    insumos: partida.insumos.map(ins => ({
      ...ins,
      id: 'i_' + Math.random().toString(36).substring(2, 9)
    }))
  });

  const copySelectedPartidas = () => {
    if (publicReadOnly) return;
    const selectedRows = getOrderedSelectedPartidas();
    if (selectedRows.length === 0) return;
    setClipboard({ action: null, partida: null });
    setPartidaClipboardRows(selectedRows.map(p => ({
      ...p,
      insumos: p.insumos.map(ins => ({ ...ins }))
    })));
  };

  const pastePartidasAfterCurrentSelection = () => {
    if (publicReadOnly) return;
    const sourceBudget = activeBudgetRef.current ?? activeBudget;
    if (!sourceBudget || partidaClipboardRows.length === 0) return;

    const nextPartidas = [...sourceBudget.partidas];
    const anchorId = selectedPartidaId ?? selectedPartidaIds[selectedPartidaIds.length - 1] ?? null;
    const anchorIndex = anchorId ? nextPartidas.findIndex(p => p.id === anchorId) : -1;
    const pastedPartidas = partidaClipboardRows.map(clonePartidaForPaste);

    if (anchorIndex >= 0) {
      nextPartidas.splice(anchorIndex + 1, 0, ...pastedPartidas);
    } else {
      nextPartidas.push(...pastedPartidas);
    }

    const updatedBudget = {
      ...sourceBudget,
      partidas: normalizeLitePartidas(nextPartidas)
    };

    setHistoricalActiveBudget(updatedBudget);
    const pastedIds = pastedPartidas.map(p => p.id);
    setSelectedPartidaIds(pastedIds);
    setSelectedPartidaId(pastedIds[0] ?? null);
    setPartidaSelectionAnchorId(pastedIds[0] ?? null);
  };

  const selectPartidaRow = (partida: Partida, event?: React.MouseEvent) => {
    if (event && isKeyboardInputTarget(event.target)) return;
    const sourceBudget = activeBudgetRef.current ?? activeBudget;
    if (!sourceBudget) return;

    const isRangeSelection = Boolean(event?.shiftKey && partidaSelectionAnchorId);
    const nextIds = isRangeSelection
      ? getPartidaRangeIds(partidaSelectionAnchorId, partida.id, sourceBudget)
      : [partida.id];

    setSelectedPartidaIds(nextIds);
    setSelectedPartidaId(partida.id);
    if (!isRangeSelection) setPartidaSelectionAnchorId(partida.id);
    if (event?.button === 0) setIsPartidaDragSelecting(true);
  };

  const extendPartidaDragSelection = (partida: Partida) => {
    if (!isPartidaDragSelecting) return;
    const anchorId = partidaSelectionAnchorId ?? selectedPartidaId ?? partida.id;
    const nextIds = getPartidaRangeIds(anchorId, partida.id);
    setSelectedPartidaIds(nextIds);
    setSelectedPartidaId(partida.id);
  };

  const movePartidaSelection = (direction: -1 | 1, extend: boolean) => {
    const sourceBudget = activeBudgetRef.current ?? activeBudget;
    if (!sourceBudget || sourceBudget.partidas.length === 0) return;

    const currentIndex = selectedPartidaId
      ? sourceBudget.partidas.findIndex(p => p.id === selectedPartidaId)
      : -1;
    const nextIndex = Math.max(0, Math.min(sourceBudget.partidas.length - 1, (currentIndex < 0 ? 0 : currentIndex) + direction));
    const nextPartida = sourceBudget.partidas[nextIndex];
    if (!nextPartida) return;

    if (extend) {
      const anchorId = partidaSelectionAnchorId ?? selectedPartidaId ?? nextPartida.id;
      setPartidaSelectionAnchorId(anchorId);
      setSelectedPartidaIds(getPartidaRangeIds(anchorId, nextPartida.id, sourceBudget));
    } else {
      setPartidaSelectionAnchorId(nextPartida.id);
      setSelectedPartidaIds([nextPartida.id]);
    }
    setSelectedPartidaId(nextPartida.id);
  };

  useEffect(() => {
    if (!selectedPartidaId) {
      if (selectedPartidaIds.length > 0) setSelectedPartidaIds([]);
      setPartidaSelectionAnchorId(null);
      return;
    }

    if (!selectedPartidaIds.includes(selectedPartidaId)) {
      setSelectedPartidaIds([selectedPartidaId]);
      setPartidaSelectionAnchorId(selectedPartidaId);
    }
  }, [selectedPartidaId, activeBudget?.id]);

  useEffect(() => {
    if (!isPartidaDragSelecting) return;
    const stopDragSelection = () => setIsPartidaDragSelecting(false);
    window.addEventListener('mouseup', stopDragSelection);
    return () => window.removeEventListener('mouseup', stopDragSelection);
  }, [isPartidaDragSelecting]);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (viewState !== 'editor') return;
      if (isKeyboardInputTarget(e.target)) return;

      if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        e.preventDefault();
        movePartidaSelection(e.key === 'ArrowUp' ? -1 : 1, e.shiftKey);
        return;
      }

      if (e.ctrlKey || e.metaKey) {
        const key = e.key.toLowerCase();
        if (key === 'c') {
          e.preventDefault();
          copySelectedPartidas();
        } else if (key === 'v') {
          e.preventDefault();
          if (clipboard.partida) {
            pasteClipboardPartida();
          } else {
            pastePartidasAfterCurrentSelection();
          }
        } else if (key === 'z') {
          e.preventDefault();
          handleUndo();
        } else if (key === 'y') {
          e.preventDefault();
          handleRedo();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [historyPast, historyFuture, activeBudget, viewState, selectedPartidaId, selectedPartidaIds, partidaSelectionAnchorId, partidaClipboardRows, handleUndo, handleRedo]);

  // Firestore Sync - Load Budgets
  useEffect(() => {
    if (publicReadOnly && initialOpenBudgetId) {
      const budgetRef = doc(firestore, 'budgets', initialOpenBudgetId);

      const unsubscribe = onSnapshot(budgetRef, (snapshot) => {
        if (!snapshot.exists()) {
          setBudgets([]);
          setPublicLinkState('not_found');
          return;
        }

        const loadedBudget = { id: snapshot.id, ...snapshot.data() } as Budget;
        setBudgets([loadedBudget]);
        setPublicLinkState(loadedBudget.linkAccess === 'ANYONE_WITH_LINK' ? 'allowed' : 'denied');
      }, (error) => {
        console.error("Error fetching public budget from Firestore:", error);
        setBudgets([]);
        setPublicLinkState('denied');
      });

      return () => unsubscribe();
    }

    const budgetsCollectionRef = collection(firestore, 'budgets');
    
    let budgetsQuery = budgetsCollectionRef as any;
    if (user && !publicReadOnly) {
      budgetsQuery = query(
        budgetsCollectionRef,
        or(
          where('ownerId', '==', user.uid),
          where('linkAccess', '==', 'COMMUNITY_TEMPLATE')
        )
      );
    }
    
    // Subscribe to real-time changes
    const unsubscribe = onSnapshot(budgetsQuery, (snapshot: any) => {
      const loaded: Budget[] = snapshot.docs.map((snapshotDoc: any) => ({ id: snapshotDoc.id, ...snapshotDoc.data() } as Budget));
      const localStoredBudgets = readBudgetsFromLocalStorage();
      
      if (loaded.length === 0) {
        const localBudgets = mergeBudgetsByFreshness(localStoredBudgets, budgetsRef.current);
        if (localBudgets.length > 0 && user && !publicReadOnly) {
          setBudgets(localBudgets);
          localBudgets.forEach((localBudget) => {
            const freshness = getBudgetFreshness(localBudget);
            if (recoveredBudgetUploadsRef.current[localBudget.id] === freshness) return;
            recoveredBudgetUploadsRef.current[localBudget.id] = freshness;
            void saveBudgetToCloud(localBudget);
          });
        } else if (user && !publicReadOnly) {
          // Seed initial budgets if empty
          const now = Date.now();
          INITIAL_BUDGETS.forEach(b => {
            setDoc(doc(firestore, 'budgets', b.id), {
              ...b,
              ownerId: user.uid,
              permissions: {},
              createdAt: now,
              updatedAt: now
            });
          });
        } else {
          setBudgets([]);
        }
      } else {
        const mergedBudgets = mergeBudgetsByFreshness(loaded, localStoredBudgets, budgetsRef.current);
        const remoteById = new Map(loaded.map(remoteBudget => [remoteBudget.id, remoteBudget]));

        setBudgets(mergedBudgets);

        mergedBudgets.forEach((mergedBudget) => {
          const remoteBudget = remoteById.get(mergedBudget.id);
          const mergedFreshness = getBudgetFreshness(mergedBudget);
          const remoteFreshness = remoteBudget ? getBudgetFreshness(remoteBudget) : 0;
          if (mergedFreshness <= remoteFreshness) return;

          if (recoveredBudgetUploadsRef.current[mergedBudget.id] === mergedFreshness) return;
          recoveredBudgetUploadsRef.current[mergedBudget.id] = mergedFreshness;
          void saveBudgetToCloud(mergedBudget);
        });
        
        // Update activeBudget safely
        setActiveBudget(prev => {
          if (!prev) return prev;
          const updatedActive = mergedBudgets.find(b => b.id === prev.id);
          if (updatedActive) {
            const remoteTime = getBudgetFreshness(updatedActive);
            const localTime = getBudgetFreshness(prev);
            
            if (remoteTime >= localTime) {
              if (JSON.stringify(updatedActive) !== JSON.stringify(prev)) {
                activeBudgetRef.current = updatedActive;
                return updatedActive;
              }
              return prev;
            } else {
              return prev;
            }
          }
          return prev;
        });
      }
    }, (error) => {
      console.error("Error fetching budgets from Firestore:", error);
      // Fallback to localStorage logic if Firestore fails completely (e.g. no IndexedDB)
      const localBudgets = readBudgetsFromLocalStorage();
      if (localBudgets.length > 0) {
        setBudgets(localBudgets);
      } else {
        setBudgets(INITIAL_BUDGETS);
      }
    });

    return () => unsubscribe();
  }, [user, publicReadOnly, initialOpenBudgetId]);

  // Handle saving specific budget to Firestore
  const saveBudgetToCloud = async (updatedBudget: Budget) => {
    if (publicReadOnly) return;
    try {
      const timestamp = Date.now();
      const budgetData = {
        ...updatedBudget,
        updatedAt: timestamp
      };
      persistBudgetLocally(budgetData);
      // Optimistic update of local budgets array to have exact same timestamp
      setBudgets(prev => {
        const exists = prev.some(b => b.id === budgetData.id);
        return exists
          ? prev.map(b => b.id === budgetData.id ? budgetData : b)
          : [budgetData, ...prev];
      });
      setActiveBudget(prev => {
        if (prev?.id !== budgetData.id) return prev;
        activeBudgetRef.current = budgetData;
        return budgetData;
      });
      
      await setDoc(doc(firestore, 'budgets', updatedBudget.id), budgetData);
    } catch (err) {
      console.error("Error saving budget to cloud:", err);
    }
  };

  // Autosave to Firebase (Debounced)
  useEffect(() => {
    if (activeBudget && user && !publicReadOnly) {
      // Avoid saving if the change came from the cloud (updatedAt >= Date.now() - 500)
      // Or just debounce it and let the sync logic handle it.
      const timer = setTimeout(() => {
        saveBudgetToCloud(activeBudget);
      }, 1500); // 1.5 seconds debounce
      return () => clearTimeout(timer);
    }
  }, [activeBudget, user, publicReadOnly]);

  // Keep a local copy in localStorage as extreme fallback
  useEffect(() => {
    if (budgets.length > 0) {
      persistBudgetsLocally(budgets);
    }
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
        if (publicReadOnly && target.linkAccess !== 'ANYONE_WITH_LINK') {
          setPublicLinkState('denied');
          setViewState('list');
          setActiveBudget(null);
          return;
        }
        setPublicLinkState('allowed');
        setActiveBudget(target);
        setOpenBudgetIds(prev => prev.includes(target.id) ? prev : [...prev, target.id]);
        setViewState('editor');
      } else if (publicReadOnly) {
        setPublicLinkState('not_found');
      }
    }
  }, [initialOpenBudgetId, budgets, publicReadOnly]);

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
  const [addInsumoTargetPartidaId, setAddInsumoTargetPartidaId] = useState<string | null>(null);
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
  const [isImportPartidaOpen, setIsImportPartidaOpen] = useState(false);
  const [isAgregarConIAOpen, setIsAgregarConIAOpen] = useState(false);
  const [importPartidaSearchTerm, setImportPartidaSearchTerm] = useState('');
  const [importPartidaScope, setImportPartidaScope] = useState<'global' | 'local'>('global');
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
  const [pieRows, setPieRows] = useState<PiePresupuestoRow[]>(() => clonePieRows());

  useEffect(() => {
    const rows = activeBudget?.pieRows?.length ? activeBudget.pieRows : DEFAULT_PIE_ROWS;
    setPieRows(clonePieRows(rows));
  }, [activeBudget?.id]);

  const handleSetPieRows = (nextRows: PiePresupuestoRow[]) => {
    const normalizedRows = clonePieRows(nextRows);
    setPieRows(normalizedRows);
    if (publicReadOnly) return;
    const sourceBudget = activeBudgetRef.current ?? activeBudget;
    if (!sourceBudget) return;
    setHistoricalActiveBudget({
      ...sourceBudget,
      pieRows: normalizedRows
    }, true);
  };

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

  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const menuRef = useRef<HTMLDivElement>(null);
  const contextMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleCloseMenu = (event?: Event) => {
      const target = event?.target as Node | null;
      if (target && (menuRef.current?.contains(target) || contextMenuRef.current?.contains(target))) return;
      if (menuOpenId) setMenuOpenId(null);
      if (contextMenu.visible) {
        setContextMenu(prev => ({ ...prev, visible: false }));
      }
    };
    window.addEventListener('pointerdown', handleCloseMenu);
    window.addEventListener('scroll', handleCloseMenu, true);
    return () => {
      window.removeEventListener('pointerdown', handleCloseMenu);
      window.removeEventListener('scroll', handleCloseMenu, true);
    };
  }, [contextMenu.visible, menuOpenId]);

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

  type InsumoSuggestion = {
    codigo?: string;
    nombre: string;
    unidad: string;
    precio: number;
    tipo: Insumo['tipo'];
    sourceRank: number;
    sourceLabel: string;
  };

  const normalizeInsumoSearchText = (value: unknown) =>
    String(value ?? '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toUpperCase()
      .trim();

  const normalizeSuggestionTipo = (value: unknown): Insumo['tipo'] => {
    const raw = normalizeInsumoSearchText(value);
    if (raw === 'MO' || raw.includes('MANO')) return 'MO';
    if (raw === 'MT' || raw.includes('MATERIAL')) return 'MT';
    if (raw === 'EQ' || raw.includes('EQUIPO')) return 'EQ';
    if (raw === 'SC' || raw.includes('SUBCONTRATO')) return 'SC';
    if (raw === 'SP' || raw.includes('SUBPARTIDA')) return 'SP';
    return 'MT';
  };

  const insumoSuggestionsLibrary = useMemo<InsumoSuggestion[]>(() => {
    const byKey = new Map<string, InsumoSuggestion>();

    const register = (raw: any, sourceRank: number, sourceLabel: string) => {
      const nombre = String(raw?.nombre ?? '').trim();
      if (!nombre) return;

      const codigo = String(raw?.codigo ?? '').trim() || undefined;
      const unidad = String(raw?.unidad ?? '').trim().toUpperCase();
      const tipo = normalizeSuggestionTipo(raw?.tipo);
      const rawPrice = Number(raw?.precio ?? raw?.pu ?? raw?.price ?? 0);
      const precio = Number.isFinite(rawPrice) ? rawPrice : 0;
      const key = codigo
        ? `code:${normalizeInsumoSearchText(codigo)}`
        : `name:${normalizeInsumoSearchText(nombre)}|unit:${normalizeInsumoSearchText(unidad)}|type:${tipo}`;

      const next: InsumoSuggestion = {
        codigo,
        nombre: normalizeInsumoSearchText(nombre),
        unidad,
        precio,
        tipo,
        sourceRank,
        sourceLabel
      };

      const current = byKey.get(key);
      if (!current || next.sourceRank < current.sourceRank || (next.sourceRank === current.sourceRank && current.precio <= 0 && next.precio > 0)) {
        byKey.set(key, next);
      }
    };

    activeBudget?.partidas.forEach(partida => {
      partida.insumos.forEach(insumo => register(insumo, 0, 'Este presupuesto'));
    });

    budgets.forEach(budget => {
      if (budget.id === activeBudget?.id) return;
      budget.partidas.forEach(partida => {
        partida.insumos.forEach(insumo => register(insumo, 1, 'Otros presupuestos'));
      });
    });

    catalogoInsumos.forEach((item: any) => register(item, 2, 'Catalogo'));

    return Array.from(byKey.values()).sort((a, b) => {
      if (a.sourceRank !== b.sourceRank) return a.sourceRank - b.sourceRank;
      return a.nombre.localeCompare(b.nombre);
    });
  }, [activeBudget, budgets, catalogoInsumos]);

  const findKnownInsumo = (name: string, unit?: string) => {
    const normalizedName = normalizeInsumoSearchText(name);
    const normalizedUnit = normalizeInsumoSearchText(unit);
    if (!normalizedName) return undefined;

    return insumoSuggestionsLibrary.find(item =>
      normalizeInsumoSearchText(item.nombre) === normalizedName &&
      normalizedUnit &&
      normalizeInsumoSearchText(item.unidad) === normalizedUnit
    ) || insumoSuggestionsLibrary.find(item =>
      normalizeInsumoSearchText(item.nombre) === normalizedName
    );
  };

  const normalizePartidaRelationName = (value: unknown) =>
    normalizeInsumoSearchText(value);

  const getBudgetsForPartidaRelation = () => {
    const active = activeBudgetRef.current ?? activeBudget;
    const byId = new Map<string, Budget>();
    budgets.forEach(budget => byId.set(budget.id, budget));
    if (active) byId.set(active.id, active);
    return Array.from(byId.values());
  };

  const getPartidaSharedBudgets = (partida: Partida): SharedPartidaBudgetRef[] => {
    if (!partida || partida.esTitulo) return [];
    const targetName = normalizePartidaRelationName(partida.nombre);
    if (!targetName) return [];

    return getBudgetsForPartidaRelation()
      .reduce<SharedPartidaBudgetRef[]>((sharedBudgets, budget) => {
        const matches = budget.partidas.filter(item =>
          !item.esTitulo && normalizePartidaRelationName(item.nombre) === targetName
        );
        const firstMatch = matches[0];
        if (!firstMatch) return sharedBudgets;

        sharedBudgets.push({
          budgetId: budget.id,
          budgetName: budget.nombre,
          partidaId: firstMatch.id,
          item: firstMatch.item,
          cliente: budget.cliente,
          matchesInBudget: matches.length
        });
        return sharedBudgets;
      }, []);
  };

  const getPartidaWithDetachedRelation = (partida: Partida): Partida => ({
    ...partida,
    isImported: undefined,
    importedFrom: undefined,
    importedFromBudgetId: undefined,
    importedSourcePartidaId: undefined,
    importedAt: undefined
  });

  const confirmPartidaNameRelationBreak = (partida: Partida, nextName: string) => {
    if (partida.esTitulo) return true;
    const nameChanged = normalizePartidaRelationName(partida.nombre) !== normalizePartidaRelationName(nextName);
    if (!nameChanged) return true;

    const sharedBudgets = getPartidaSharedBudgets(partida);
    if (!partida.isImported && sharedBudgets.length < 2) return true;

    const relatedNames = sharedBudgets.map(budget => budget.budgetName).join('\n- ');
    const detail = relatedNames ? `\n\nPresupuestos relacionados:\n- ${relatedNames}` : '';
    return window.confirm(
      `Esta partida esta relacionada con otros presupuestos por su nombre actual.${detail}\n\n` +
      'Si cambias el nombre, se quitara el indicador de relacion con esa partida en los demas presupuestos, pero se conservara su analisis de insumos en este presupuesto.\n\n' +
      'Deseas continuar?'
    );
  };

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
  const [editingPartidaId, setEditingPartidaId] = useState<string | null>(null);
  const [insertAfterPartidaId, setInsertAfterPartidaId] = useState<string | null>(null);
  const insumoSubmitLockRef = useRef(false);
  const partidaSubmitLockRef = useRef(false);

  const closeAddInsumoModal = () => {
    setIsAddInsumoOpen(false);
    setShowSuggestions(false);
    setAddInsumoTargetPartidaId(null);
  };

  const closeAddPartidaModal = () => {
    setIsAddPartidaOpen(false);
    setEditingPartidaId(null);
    setInsertAfterPartidaId(null);
  };

  // Calculation helpers
  const getInsumoBaseCantidad = (ins: Insumo, rend: number) => {
    const explicitCantidad = typeof ins.cantidad === 'number' && Number.isFinite(ins.cantidad) ? ins.cantidad : null;
    if (ins.unidad === '%MO') return explicitCantidad ?? ins.cuadrilla;
    if (ins.tipo === 'MO') {
      return rend > 0 ? (ins.cuadrilla * 8) / rend : 0;
    }
    if (ins.tipo === 'EQ') {
      return explicitCantidad ?? (rend > 0 ? (ins.cuadrilla * 8) / rend : 0);
    }
    return explicitCantidad ?? ins.cuadrilla;
  };

  const getInsumoDesperdicio = (ins: Insumo) => {
    const raw = typeof ins.desperdicio === 'number' && Number.isFinite(ins.desperdicio) ? ins.desperdicio : 0;
    return ins.tipo === 'MT' ? Math.max(0, raw) : 0;
  };

  const getInsumoCantidad = (ins: Insumo, rend: number) => {
    const baseCantidad = getInsumoBaseCantidad(ins, rend);
    return baseCantidad * (1 + getInsumoDesperdicio(ins) / 100);
  };

  const isManualToolsInsumo = (ins: Pick<Insumo, 'nombre' | 'unidad'>) => {
    const unidad = (ins.unidad || '').trim().toUpperCase();
    const nombre = (ins.nombre || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();
    return unidad === '%MO' || nombre.includes('HERRAMIENTAS MANUALES');
  };

  const getManoObraSubtotal = (partida: Partida) => {
    return partida.insumos.reduce((sum, ins) => {
      if (ins.tipo !== 'MO' || isManualToolsInsumo(ins)) return sum;
      return sum + getInsumoCantidad(ins, partida.rendimiento) * ins.pu;
    }, 0);
  };

  const getInsumoUnitPrice = (ins: Insumo, partida?: Partida) => {
    if (partida && isManualToolsInsumo(ins)) {
      return getManoObraSubtotal(partida);
    }
    return ins.pu;
  };

  const getInsumoParcial = (ins: Insumo, rend: number, partida?: Partida) => {
    const unitPrice = getInsumoUnitPrice(ins, partida);
    if (isManualToolsInsumo(ins)) {
      return (unitPrice * getInsumoCantidad(ins, rend)) / 100;
    }
    return getInsumoCantidad(ins, rend) * unitPrice;
  };

  const getAPUBreakdown = (partida: Partida) => {
    const breakdown = { MO: 0, MT: 0, EQ: 0, SC: 0, SP: 0 };
    if (!partida || partida.esTitulo) return breakdown;
    partida.insumos.forEach(ins => {
      const val = getInsumoParcial(ins, partida.rendimiento, partida);
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

  const regenerateItemCodes = (itemsWithLevels: { partida: Partida; level: number }[]): Partida[] => {
    const counters: number[] = [];
    return itemsWithLevels.map(item => {
      const level = item.level;
      if (counters[level] === undefined) {
        counters[level] = 1;
      } else {
        counters[level] += 1;
      }

      counters.length = level + 1;
      for (let i = 0; i <= level; i++) {
        if (counters[i] === undefined || Number.isNaN(counters[i])) {
          counters[i] = 1;
        }
      }

      return {
        ...item.partida,
        item: counters.join('.')
      };
    });
  };

  const normalizeLitePartidas = (partidas: Partida[]) => {
    return regenerateItemCodes(partidas.map(p => ({
      partida: { ...p },
      level: Math.max(0, String(p.item || '').split('.').length - 1)
    })));
  };

  const getPartidaHierarchyLevel = (partida: Pick<Partida, 'item'>) =>
    Math.max(0, String(partida.item || '').split('.').length - 1);

  const buildPlaceholderItemForLevel = (level: number) =>
    Array.from({ length: Math.max(0, level) + 1 }, () => '1').join('.');

  const getPartidaBlockEndIndex = (partidas: Partida[], startIndex: number) => {
    if (startIndex < 0 || startIndex >= partidas.length) return startIndex;
    const startLevel = getPartidaHierarchyLevel(partidas[startIndex]);
    let endIndex = startIndex;

    for (let i = startIndex + 1; i < partidas.length; i++) {
      if (getPartidaHierarchyLevel(partidas[i]) <= startLevel) break;
      endIndex = i;
    }

    return endIndex;
  };

  const getNewPartidaPlacement = (partidas: Partida[], anchorId: string | null, creatingTitle: boolean) => {
    const anchorIndex = anchorId ? partidas.findIndex(p => p.id === anchorId) : -1;
    if (anchorIndex === -1) {
      return {
        insertIndex: partidas.length,
        level: 0
      };
    }

    const anchor = partidas[anchorIndex];
    const anchorLevel = getPartidaHierarchyLevel(anchor);
    const insertIndex = getPartidaBlockEndIndex(partidas, anchorIndex) + 1;
    const level = creatingTitle
      ? anchorLevel
      : anchor.esTitulo
        ? anchorLevel + 1
        : anchorLevel;

    return { insertIndex, level };
  };

  const adjustLiteHierarchy = (
    partidas: Partida[],
    targetId: string,
    action: 'indent' | 'outdent' | 'moveUp' | 'moveDown' | 'delete' | 'duplicate'
  ): Partida[] => {
    const itemsWithLevels = partidas.map(p => ({
      partida: { ...p },
      level: Math.max(0, String(p.item || '').split('.').length - 1)
    }));

    const targetIdx = itemsWithLevels.findIndex(item => item.partida.id === targetId);
    if (targetIdx === -1) return partidas;

    const targetItem = itemsWithLevels[targetIdx];
    const getDescendantsRange = (startIndex: number, level: number) => {
      let count = 0;
      for (let i = startIndex + 1; i < itemsWithLevels.length; i++) {
        if (itemsWithLevels[i].level > level) {
          count++;
        } else {
          break;
        }
      }
      return count;
    };

    if (action === 'indent') {
      if (targetIdx > 0) {
        const prevItem = itemsWithLevels[targetIdx - 1];
        if (targetItem.level <= prevItem.level) {
          const descCount = getDescendantsRange(targetIdx, targetItem.level);
          for (let i = targetIdx; i <= targetIdx + descCount; i++) {
            itemsWithLevels[i].level += 1;
          }
        }
      }
    } else if (action === 'outdent') {
      if (targetItem.level > 0) {
        const descCount = getDescendantsRange(targetIdx, targetItem.level);
        for (let i = targetIdx; i <= targetIdx + descCount; i++) {
          itemsWithLevels[i].level = Math.max(0, itemsWithLevels[i].level - 1);
        }
      }
    } else if (action === 'delete') {
      const descCount = getDescendantsRange(targetIdx, targetItem.level);
      itemsWithLevels.splice(targetIdx, 1 + descCount);
    } else if (action === 'duplicate') {
      const descCount = getDescendantsRange(targetIdx, targetItem.level);
      const toDuplicate = itemsWithLevels.slice(targetIdx, targetIdx + 1 + descCount).map(item => ({
        partida: {
          ...item.partida,
          id: 'p_' + Math.random().toString(36).substring(2, 9),
          nombre: `${item.partida.nombre} (Copia)`,
          insumos: item.partida.insumos.map(ins => ({ ...ins, id: 'i_' + Math.random().toString(36).substring(2, 9) }))
        },
        level: item.level
      }));
      itemsWithLevels.splice(targetIdx + 1 + descCount, 0, ...toDuplicate);
    } else if (action === 'moveUp') {
      let siblingIdx = -1;
      for (let i = targetIdx - 1; i >= 0; i--) {
        if (itemsWithLevels[i].level < targetItem.level) break;
        if (itemsWithLevels[i].level === targetItem.level) {
          siblingIdx = i;
          break;
        }
      }

      if (siblingIdx !== -1) {
        const targetDescCount = getDescendantsRange(targetIdx, targetItem.level);
        const targetBlock = itemsWithLevels.splice(targetIdx, 1 + targetDescCount);
        itemsWithLevels.splice(siblingIdx, 0, ...targetBlock);
      } else if (targetIdx > 0) {
        const prevItem = itemsWithLevels[targetIdx - 1];
        if (prevItem.level >= targetItem.level) {
          const targetDescCount = getDescendantsRange(targetIdx, targetItem.level);
          const targetBlock = itemsWithLevels.splice(targetIdx, 1 + targetDescCount);
          itemsWithLevels.splice(targetIdx - 1, 0, ...targetBlock);
        }
      }
    } else if (action === 'moveDown') {
      let siblingIdx = -1;
      const targetDescCount = getDescendantsRange(targetIdx, targetItem.level);
      const targetBlockEnd = targetIdx + targetDescCount;

      for (let i = targetBlockEnd + 1; i < itemsWithLevels.length; i++) {
        if (itemsWithLevels[i].level < targetItem.level) break;
        if (itemsWithLevels[i].level === targetItem.level) {
          siblingIdx = i;
          break;
        }
      }

      if (siblingIdx !== -1) {
        const siblingDescCount = getDescendantsRange(siblingIdx, itemsWithLevels[siblingIdx].level);
        const insertAt = siblingIdx + siblingDescCount;
        const targetBlock = itemsWithLevels.splice(targetIdx, 1 + targetDescCount);
        const adjustedInsertAt = insertAt - targetBlock.length;
        itemsWithLevels.splice(adjustedInsertAt + 1, 0, ...targetBlock);
      } else if (targetBlockEnd + 1 < itemsWithLevels.length) {
        const nextItem = itemsWithLevels[targetBlockEnd + 1];
        if (nextItem.level >= targetItem.level) {
          const nextDescCount = getDescendantsRange(targetBlockEnd + 1, nextItem.level);
          const targetBlock = itemsWithLevels.splice(targetIdx, 1 + targetDescCount);
          itemsWithLevels.splice(targetIdx + nextDescCount + 1, 0, ...targetBlock);
        }
      }
    }

    return regenerateItemCodes(itemsWithLevels);
  };

  const getNextPartidaItemCodeFromAnchor = (anchor: Partida) => {
    const parts = String(anchor.item || '0').split('.').map(v => Number.parseInt(v, 10)).filter(v => !Number.isNaN(v));
    if (parts.length <= 1) {
      return String((parts[0] || 0) + 1);
    }

    const parentParts = parts.slice(0, -1);
    const last = parts[parts.length - 1] || 0;
    return `${parentParts.join('.')}.${last + 1}`;
  };

  const getPartidaParcial = (partida: Partida, allPartidas?: Partida[]): number => {
    const partidas = allPartidas ?? (activeBudget?.partidas ?? []);
    if (!partida.esTitulo) {
      return partida.metrado * getPartidaCU(partida);
    }
    // Determine hierarchy level by counting dots in the item number
    // e.g. "01" → 0 dots (level 0), "01.01" → 1 dot (level 1), "01.01.01" → 2 dots (level 2)
    const currentLevel = (partida.item.match(/\./g) || []).length;
    const idx = partidas.findIndex(p => p.id === partida.id);
    if (idx === -1) return 0;
    let sum = 0;
    for (let i = idx + 1; i < partidas.length; i++) {
      const p = partidas[i];
      if (p.esTitulo) {
        const pLevel = (p.item.match(/\./g) || []).length;
        // Stop if we hit a title at the same or higher (less dots) level
        if (pLevel <= currentLevel) break;
        // Skip sub-titles — their children will be summed when we process non-titles
        continue;
      }
      sum += getPartidaParcial(p, partidas);
    }
    return sum;
  };


  const getBudgetCD = (budget: Budget | null) => {
    if (!budget) return 0;
    return budget.partidas
      .filter(p => !p.esTitulo)
      .reduce((sum, p) => sum + getPartidaParcial(p), 0);
  };

  const syncGlobalInsumoPrice = (source: Insumo, nextPu: number) => {
    const matchCode = source.codigo?.trim();
    const matchName = source.nombre?.trim().toLowerCase();
    if (!matchCode && !matchName) return;
    const currentActiveBudget = activeBudgetRef.current ?? activeBudget;

    const updatedBudgets = budgets.map(b => ({
      ...(currentActiveBudget?.id === b.id ? currentActiveBudget : b),
      partidas: (currentActiveBudget?.id === b.id ? currentActiveBudget : b).partidas.map(p => ({
        ...p,
        insumos: p.insumos.map(ins => {
          const sameCode = !!matchCode && !!ins.codigo && ins.codigo.trim() === matchCode;
          const sameName = !matchCode && !!matchName && ins.nombre.trim().toLowerCase() === matchName;
          const isGlobal = (ins.scope ?? 'global') === 'global';
          if (!isGlobal || (!sameCode && !sameName)) return ins;
          return { ...ins, pu: nextPu };
        })
      }))
    }));

    setBudgets(updatedBudgets);
    if (currentActiveBudget) {
      const refreshedActive = updatedBudgets.find(b => b.id === currentActiveBudget.id);
      if (refreshedActive) {
        activeBudgetRef.current = refreshedActive;
        setActiveBudget(refreshedActive);
      }
    }
  };

  /** Retorna los totales MO/MT/EQ/SC para una partida (multiplicado por metrado).
   *  Para títulos, suma recursivamente todos los hijos no-título. */
  const getPartidaBreakdownTotal = (partida: Partida, allPartidas?: Partida[]): { MO: number; MT: number; EQ: number; SC: number } => {
    const partidas = allPartidas ?? (activeBudget?.partidas ?? []);
    if (!partida.esTitulo) {
      const br = getAPUBreakdown(partida);
      return {
        MO: br.MO * partida.metrado,
        MT: br.MT * partida.metrado,
        EQ: br.EQ * partida.metrado,
        SC: br.SC * partida.metrado,
      };
    }
    // Title: aggregate children recursively
    const currentLevel = (partida.item.match(/\./g) || []).length;
    const idx = partidas.findIndex(p => p.id === partida.id);
    if (idx === -1) return { MO: 0, MT: 0, EQ: 0, SC: 0 };
    const totals = { MO: 0, MT: 0, EQ: 0, SC: 0 };
    for (let i = idx + 1; i < partidas.length; i++) {
      const p = partidas[i];
      if (p.esTitulo) {
        const pLevel = (p.item.match(/\./g) || []).length;
        if (pLevel <= currentLevel) break;
        continue;
      }
      const childBr = getPartidaBreakdownTotal(p, partidas);
      totals.MO += childBr.MO;
      totals.MT += childBr.MT;
      totals.EQ += childBr.EQ;
      totals.SC += childBr.SC;
    }
    return totals;
  };

  // Actions
  const handleOpenBudgetEditor = (b: Budget) => {
    if (publicReadOnly && b.linkAccess !== 'ANYONE_WITH_LINK') return;
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
    setMenuOpenId(prev => prev === id ? null : id);
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
    if (publicReadOnly) return;
    const now = Date.now();
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
      pieRows: clonePieRows(),
      partidas: [],
      ownerId: user?.uid,
      permissions: {},
      createdAt: now,
      updatedAt: now
    };
    persistBudgetLocally(newB);
    setBudgets(prev => [newB, ...prev]);
    setIsCreateOpen(false);
    handleOpenBudgetEditor(newB);
    void saveBudgetToCloud(newB);
  };

  const handleUploadBudget = (file: File) => {
    if (publicReadOnly) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const uploadedBudget: Budget = JSON.parse(text);
        
        const now = Date.now();
        const newB: Budget = {
          ...uploadedBudget,
          id: 'b_' + Math.random().toString(36).substring(2, 9),
          ownerId: user?.uid,
          permissions: {},
          createdAt: now,
          updatedAt: now
        };
        
        persistBudgetLocally(newB);
        setBudgets(prev => [newB, ...prev]);
        alert('Presupuesto subido exitosamente.');
      } catch (err) {
        console.error('Error parsing uploaded budget', err);
        alert('El archivo no es un presupuesto válido.');
      }
    };
    reader.readAsText(file);
  };

  const startEditBudget = (b: Budget) => {
    if (publicReadOnly) return;
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
    if (publicReadOnly) return;
    if (!activeBudget) return;
    const updatedBudget = { ...activeBudget, nombre, cliente, fechaBase, grupo, updatedAt: Date.now() };
    const updated = budgets.map(b => b.id === activeBudget.id ? updatedBudget : b);
    persistBudgetLocally(updatedBudget);
    setBudgets(updated);
    setActiveBudget(updatedBudget);
    setIsEditOpen(false);
    void saveBudgetToCloud(updatedBudget);
  };

  const handleDuplicateBudget = (id: string) => {
    if (publicReadOnly) return;
    const target = budgets.find(b => b.id === id);
    if (!target) return;
    const now = Date.now();
    const copy: Budget = {
      ...target,
      id: 'b_' + Math.random().toString(36).substring(2, 9),
      nombre: `${target.nombre} (Copia)`,
      categoria: 'Recientes',
      ownerId: user?.uid ?? target.ownerId,
      permissions: {},
      createdAt: now,
      updatedAt: now
    };
    persistBudgetLocally(copy);
    setBudgets(prev => [copy, ...prev]);
    setMenuOpenId(null);
    void saveBudgetToCloud(copy);
    alert('Presupuesto duplicado con éxito.');
  };

  const handleDeleteBudget = (id: string) => {
    if (publicReadOnly) return;
    if (!confirm('¿Está seguro de que desea eliminar este presupuesto?')) return;
    const nextBudgets = budgets.filter(b => b.id !== id);
    persistBudgetsLocally(nextBudgets);
    setBudgets(nextBudgets);
    if (activeBudget?.id === id) {
      activeBudgetRef.current = null;
      setActiveBudget(null);
      setViewState('list');
    }
    setMenuOpenId(null);
    void deleteDoc(doc(firestore, 'budgets', id));
  };

  const handlePartidaCellClick = (p: Partida, e?: React.MouseEvent) => {
    selectPartidaRow(p, e);
  };

  const handlePartidaContextMenu = (e: React.MouseEvent, p: Partida) => {
    e.preventDefault();
    e.stopPropagation();
    if (!selectedPartidaIds.includes(p.id)) {
      setSelectedPartidaIds([p.id]);
      setPartidaSelectionAnchorId(p.id);
    }
    setSelectedPartidaId(p.id);
    if (publicReadOnly) return;
    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      targetPartida: p
    });
  };

  const handleEmptyPartidasContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (publicReadOnly) return;

    setSelectedPartidaId(null);
    setSelectedPartidaIds([]);
    setPartidaSelectionAnchorId(null);
    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      targetPartida: null
    });
  };

  const pasteClipboardPartida = () => {
    if (publicReadOnly) return;
    const sourceBudget = activeBudgetRef.current ?? activeBudget;
    if (!sourceBudget || !clipboard.partida) return;

    const source = clipboard.partida;
    const basePartidas = clipboard.action === 'cut'
      ? sourceBudget.partidas.filter(p => p.id !== source.id)
      : [...sourceBudget.partidas];

    const anchorId = contextMenu.targetPartida?.id ?? selectedPartidaId;
    const anchorIndex = anchorId ? basePartidas.findIndex(p => p.id === anchorId) : -1;
    const anchor = anchorIndex >= 0 ? basePartidas[anchorIndex] : basePartidas[basePartidas.length - 1];

    const pasted: Partida = {
      ...source,
      id: 'p_' + Math.random().toString(36).substring(2, 9),
      item: anchor ? getNextPartidaItemCodeFromAnchor(anchor) : String(basePartidas.length + 1),
      insumos: source.insumos.map(ins => ({ ...ins, id: 'i_' + Math.random().toString(36).substring(2, 9) }))
    };

    const nextPartidas = [...basePartidas];
    if (anchorIndex >= 0) {
      nextPartidas.splice(anchorIndex + 1, 0, pasted);
    } else {
      nextPartidas.push(pasted);
    }

    const updatedBudget = {
      ...sourceBudget,
      partidas: normalizeLitePartidas(nextPartidas)
    };

    setHistoricalActiveBudget(updatedBudget);
    setSelectedPartidaId(pasted.id);
    if (clipboard.action === 'cut') {
      setClipboard({ action: null, partida: null });
    }
    setContextMenu(prev => ({ ...prev, visible: false }));
  };

  /** Moves a partida up or down in the list */
  const handleMovePartida = (direction: 'up' | 'down') => {
    if (publicReadOnly) return;
    if (!activeBudget || !contextMenu.targetPartida) return;
    const targetId = contextMenu.targetPartida.id;
    const updatedPartidas = adjustLiteHierarchy(activeBudget.partidas, targetId, direction === 'up' ? 'moveUp' : 'moveDown');
    const updatedBudget = { ...activeBudget, partidas: updatedPartidas };
    setHistoricalActiveBudget(updatedBudget);
    setBudgets(prev => prev.map(b => b.id === activeBudget.id ? updatedBudget : b));
    setContextMenu(prev => ({ ...prev, visible: false }));
  };

  /** Indents or de-indents a partida's item number by adding/removing a level */
  const handleIndentPartida = (direction: 'right' | 'left') => {
    if (publicReadOnly) return;
    if (!activeBudget || !contextMenu.targetPartida) return;

    const updatedPartidas = adjustLiteHierarchy(
      activeBudget.partidas,
      contextMenu.targetPartida.id,
      direction === 'right' ? 'indent' : 'outdent'
    );

    const updatedBudget = {
      ...activeBudget,
      partidas: updatedPartidas
    };

    setHistoricalActiveBudget(updatedBudget);
    setBudgets(prev => prev.map(b => b.id === activeBudget.id ? updatedBudget : b));
    setContextMenu(prev => ({ ...prev, visible: false }));
  };

  const handlePartidaCellChange = (pId: string, field: keyof Partida, val: any): boolean | void => {
    if (publicReadOnly) return false;
    const sourceBudget = activeBudgetRef.current ?? activeBudget;
    if (!sourceBudget) return false;

    let shouldDetachRelation = false;
    let nextValue = val;

    if (field === 'nombre') {
      const targetPartida = sourceBudget.partidas.find(p => p.id === pId);
      if (targetPartida) {
        const nextName = String(val ?? '').toUpperCase();
        shouldDetachRelation = normalizePartidaRelationName(targetPartida.nombre) !== normalizePartidaRelationName(nextName);
        if (shouldDetachRelation && !confirmPartidaNameRelationBreak(targetPartida, nextName)) return false;
        nextValue = nextName;
      }
    }

    const updatedPartidas = sourceBudget.partidas.map(p => {
      if (p.id !== pId) return p;
      const basePartida = shouldDetachRelation ? getPartidaWithDetachedRelation(p) : p;
      return { ...basePartida, [field]: nextValue };
    });
    const updatedBudget = { ...sourceBudget, partidas: updatedPartidas };
    setHistoricalActiveBudget(updatedBudget);
    return true;
  };

  const handleUpdateInsumoField = (pId: string, insId: string, field: keyof Insumo, val: any) => {
    if (publicReadOnly) return;
    const sourceBudget = activeBudgetRef.current ?? activeBudget;
    if (!sourceBudget) return;
    const p = sourceBudget.partidas.find(x => x.id === pId);
    if (!p) return;
    const existingInsumo = p.insumos.find(ins => ins.id === insId);
    if (field === 'pu' && existingInsumo && isManualToolsInsumo(existingInsumo)) return;

    const updatedInsumos = p.insumos.map(ins => {
      if (ins.id !== insId) return ins;

      if (field === 'cantidad') {
        const cantidad = Number(val) || 0;
        const updated: Insumo = { ...ins, cantidad };
        if (ins.unidad === '%MO') {
          updated.cuadrilla = cantidad;
        } else if (ins.tipo === 'EQ') {
          updated.cuadrilla = p.rendimiento > 0 ? (cantidad * p.rendimiento) / 8 : 0;
        } else if (ins.tipo !== 'MO') {
          updated.cuadrilla = cantidad;
        }
        return updated;
      }

      if (field === 'cuadrilla') {
        const cuadrilla = Number(val) || 0;
        const updated: Insumo = { ...ins, cuadrilla };
        if (ins.unidad === '%MO') {
          updated.cantidad = cuadrilla;
        } else if (ins.tipo === 'EQ') {
          updated.cantidad = p.rendimiento > 0 ? (cuadrilla * 8) / p.rendimiento : 0;
        }
        return updated;
      }

      if (field === 'desperdicio') {
        return { ...ins, desperdicio: ins.tipo === 'MT' ? Math.max(0, Number(val) || 0) : 0 };
      }

      if (field === 'tipo') {
        const tipo = val as Insumo['tipo'];
        return { ...ins, tipo, desperdicio: tipo === 'MT' ? (ins.desperdicio ?? 0) : 0 };
      }

      return { ...ins, [field]: val };
    });
    handlePartidaCellChange(pId, 'insumos', updatedInsumos);

    if (field === 'pu' && existingInsumo) {
      const catalogMatch = catalogoInsumos.find((item: any) => {
        if (existingInsumo.codigo && item.codigo) return item.codigo === existingInsumo.codigo;
        return item.nombre?.toLowerCase() === existingInsumo.nombre.toLowerCase();
      });
      if (catalogMatch) {
        const nextCatalog = catalogoInsumos.map((item: any) => {
          if (item.codigo && existingInsumo.codigo && item.codigo === existingInsumo.codigo) {
            return { ...item, precio: Number(val) || 0 };
          }
          if (!item.codigo && item.nombre?.toLowerCase() === existingInsumo.nombre.toLowerCase()) {
            return { ...item, precio: Number(val) || 0 };
          }
          return item;
        });
        setCatalogoInsumos(nextCatalog);
      }
      if ((existingInsumo.scope ?? 'global') !== 'local') {
        syncGlobalInsumoPrice(existingInsumo, Number(val) || 0);
      }
    }
  };

  const handleDeleteInsumo = (insId: string) => {
    if (publicReadOnly) return;
    const sourceBudget = activeBudgetRef.current ?? activeBudget;
    const targetPartidaId = addInsumoTargetPartidaId ?? selectedPartidaId;
    if (!sourceBudget || !targetPartidaId) return;
    const p = sourceBudget.partidas.find(x => x.id === targetPartidaId);
    if (!p) return;
    const updatedInsumos = p.insumos.filter(ins => ins.id !== insId);
    handlePartidaCellChange(targetPartidaId, 'insumos', updatedInsumos);
  };

  const handleAddInsumo = (e: React.FormEvent) => {
    e.preventDefault();
    if (publicReadOnly) return;
    if (insumoSubmitLockRef.current) return;
    insumoSubmitLockRef.current = true;

    try {
      const sourceBudget = activeBudgetRef.current ?? activeBudget;
      const targetPartidaId = addInsumoTargetPartidaId ?? selectedPartidaId;
      if (!sourceBudget || !targetPartidaId) return;

      const p = sourceBudget.partidas.find(x => x.id === targetPartidaId);
      if (!p || p.esTitulo) return;

      const normalizedName = normalizeInsumoSearchText(insumoNombre);
      const knownInsumo = findKnownInsumo(normalizedName, insumoUnidad);
      const normalizedUnit = normalizeInsumoSearchText(insumoUnidad || knownInsumo?.unidad);
      if (!normalizedName || !normalizedUnit) return;

      const existingInsumo = knownInsumo;
      const assignedCode = existingInsumo?.codigo || ('I-' + Math.random().toString(36).substring(2, 8).toUpperCase());
      const initialCantidad = parseFloat(insumoCuadrilla) || 1;
      const isManualTools = isManualToolsInsumo({ nombre: normalizedName, unidad: normalizedUnit });
      const parsedPU = Number.parseFloat(insumoPU);
      const initialPU = isManualTools
        ? getManoObraSubtotal(p)
        : (Number.isFinite(parsedPU) ? parsedPU : existingInsumo?.precio ?? 0);
      const resolvedTipo = existingInsumo?.tipo ?? insumoTipo;

      const newIns: Insumo = {
        id: 'i_' + Math.random().toString(36).substring(2, 9),
        codigo: assignedCode,
        nombre: normalizedName,
        unidad: normalizedUnit,
        cuadrilla: initialCantidad,
        cantidad: initialCantidad,
        desperdicio: resolvedTipo === 'MT' ? 0 : undefined,
        pu: initialPU,
        tipo: resolvedTipo
      };

      const updatedBudget = {
        ...sourceBudget,
        partidas: sourceBudget.partidas.map(partida => {
          if (partida.id !== targetPartidaId) return partida;
          return { ...partida, insumos: [...partida.insumos, newIns] };
        })
      };

      setHistoricalActiveBudget(updatedBudget);
      setSelectedPartidaId(targetPartidaId);
      closeAddInsumoModal();

      // add to catalog if not there
      if (!catalogoInsumos.some((item: any) => normalizeInsumoSearchText(item.nombre) === normalizedName) && !isManualTools) {
        setCatalogoInsumos(prev => [...prev, { codigo: assignedCode, nombre: normalizedName, unidad: normalizedUnit, precio: initialPU, tipo: resolvedTipo }]);
      }
    } finally {
      window.setTimeout(() => {
        insumoSubmitLockRef.current = false;
      }, 0);
    }
  };

  const openAddInsumoModal = (open: boolean) => {
    if (open) {
      setAddInsumoTargetPartidaId(selectedPartidaId);
      setInsumoNombre('');
      setInsumoUnidad('');
      setInsumoCuadrilla('');
      setInsumoPU('');
      setInsumoTipo('MT');
      setShowSuggestions(false);
    } else {
      setAddInsumoTargetPartidaId(null);
    }
    setIsAddInsumoOpen(open);
  };

  const handleAddPartida = (e: React.FormEvent) => {
    e.preventDefault();
    if (publicReadOnly) return;
    if (partidaSubmitLockRef.current) return;
    partidaSubmitLockRef.current = true;

    try {
      const sourceBudget = activeBudgetRef.current ?? activeBudget;
      if (!sourceBudget) return;

      if (editingPartidaId) {
        const originalPartida = sourceBudget.partidas.find(p => p.id === editingPartidaId);
        const nextNombre = partidaNombre.toUpperCase();
        const nameChanged = originalPartida
          ? normalizePartidaRelationName(originalPartida.nombre) !== normalizePartidaRelationName(nextNombre)
          : false;

        if (originalPartida && !confirmPartidaNameRelationBreak(originalPartida, nextNombre)) return;

        const updatedBudget = {
          ...sourceBudget,
          partidas: sourceBudget.partidas.map(p => {
            if (p.id !== editingPartidaId) return p;
            const basePartida = nameChanged ? getPartidaWithDetachedRelation(p) : p;
            return {
              ...basePartida,
              nombre: nextNombre,
              unidad: partidaEsTitulo ? '' : partidaUnidad.toUpperCase(),
              metrado: partidaEsTitulo ? 0 : parseFloat(partidaMetrado) || 1,
              esTitulo: partidaEsTitulo,
              rendimiento: partidaEsTitulo ? 1 : parseFloat(partidaRendimiento) || 1,
            };
          })
        };
        setHistoricalActiveBudget(updatedBudget);
        setSelectedPartidaId(editingPartidaId);
        setEditingPartidaId(null);
        setInsertAfterPartidaId(null);
        setIsAddPartidaOpen(false);
        return;
      }

      const nextPartidas = [...sourceBudget.partidas];
      const anchorId = insertAfterPartidaId ?? selectedPartidaId;
      const placement = getNewPartidaPlacement(nextPartidas, anchorId, partidaEsTitulo);

      const newP: Partida = {
        id: 'p_' + Math.random().toString(36).substring(2, 9),
        item: buildPlaceholderItemForLevel(placement.level),
        nombre: partidaNombre.toUpperCase(),
        unidad: partidaEsTitulo ? '' : partidaUnidad.toUpperCase(),
        metrado: partidaEsTitulo ? 0 : parseFloat(partidaMetrado) || 1,
        esTitulo: partidaEsTitulo,
        rendimiento: partidaEsTitulo ? 1 : parseFloat(partidaRendimiento) || 1,
        insumos: []
      };

      nextPartidas.splice(placement.insertIndex, 0, newP);

      const updatedBudget = {
        ...sourceBudget,
        partidas: normalizeLitePartidas(nextPartidas)
      };
      setHistoricalActiveBudget(updatedBudget);
      setSelectedPartidaId(newP.id);
      setInsertAfterPartidaId(null);
      setIsAddPartidaOpen(false);
    } finally {
      window.setTimeout(() => {
        partidaSubmitLockRef.current = false;
      }, 0);
    }
  };

  const openEditPartidaModal = (partida: Partida) => {
    setEditingPartidaId(partida.id);
    setPartidaEsTitulo(partida.esTitulo);
    setPartidaNombre(partida.nombre);
    setPartidaUnidad(partida.unidad || 'M2');
    setPartidaMetrado(String(partida.metrado || 1));
    setPartidaRendimiento(String(partida.rendimiento || 1));
    setIsAddPartidaOpen(true);
  };

  const handleDeletePartida = (partidaId: string) => {
    if (publicReadOnly) return;
    const sourceBudget = activeBudgetRef.current ?? activeBudget;
    if (!sourceBudget) return;
    const target = sourceBudget.partidas.find(p => p.id === partidaId);
    if (!target) return;

    const confirmed = window.confirm(`¿Deseas eliminar la partida "${target.nombre}"?`);
    if (!confirmed) return;

    const updatedPartidas = adjustLiteHierarchy(sourceBudget.partidas, partidaId, 'delete');
    const updatedBudget = {
      ...sourceBudget,
      partidas: updatedPartidas
    };
    setHistoricalActiveBudget(updatedBudget);
    setSelectedPartidaId(null);
    setSelectedPartidaIds([]);
    setPartidaSelectionAnchorId(null);
    if (editingPartidaId === partidaId) setEditingPartidaId(null);
    if (insertAfterPartidaId === partidaId) setInsertAfterPartidaId(null);
    setContextMenu(prev => ({ ...prev, visible: false }));
  };

  const duplicatePartida = (sourcePartida: Partida) => {
    if (publicReadOnly) return;
    const sourceBudget = activeBudgetRef.current ?? activeBudget;
    if (!sourceBudget) return;
    const updatedBudget = {
      ...sourceBudget,
      partidas: adjustLiteHierarchy(sourceBudget.partidas, sourcePartida.id, 'duplicate')
    };
    setHistoricalActiveBudget(updatedBudget);
  };

  const insertPartidaAfterCurrent = (sourceBudget: Budget, partida: Partida) => {
    const nextPartidas = [...sourceBudget.partidas];
    const anchorId = insertAfterPartidaId ?? selectedPartidaId;
    const placement = getNewPartidaPlacement(nextPartidas, anchorId, partida.esTitulo);
    const newPartida: Partida = {
      ...partida,
      item: buildPlaceholderItemForLevel(placement.level)
    };

    nextPartidas.splice(placement.insertIndex, 0, newPartida);

    const updatedBudget = {
      ...sourceBudget,
      partidas: normalizeLitePartidas(nextPartidas)
    };

    setHistoricalActiveBudget(updatedBudget);
    setSelectedPartidaId(newPartida.id);
    setInsertAfterPartidaId(null);
    return updatedBudget;
  };

  const handleImportPartidaFromSearch = (sourceBudgetId: string, sourcePartidaId: string, scope: 'global' | 'local') => {
    const targetBudget = activeBudgetRef.current ?? activeBudget;
    if (!targetBudget) return;
    const sourceBudget = budgets.find(b => b.id === sourceBudgetId);
    if (!sourceBudget) return;
    const sourcePartida = sourceBudget.partidas.find(p => p.id === sourcePartidaId);
    if (!sourcePartida) return;

    const clonedInsumos = sourcePartida.insumos.map((ins: Insumo) => ({
      ...ins,
      id: 'i_' + Math.random().toString(36).substring(2, 9),
      scope,
      codigo: ins.codigo || undefined
    }));

    const newP: Partida = {
      ...sourcePartida,
      id: 'p_' + Math.random().toString(36).substring(2, 9),
      item: sourcePartida.item,
      isImported: true,
      importedFrom: sourceBudget.nombre,
      importedFromBudgetId: sourceBudget.id,
      importedSourcePartidaId: sourcePartida.id,
      importedAt: Date.now(),
      insumos: clonedInsumos
    };

    insertPartidaAfterCurrent(targetBudget, newP);
    setIsImportPartidaOpen(false);
    setImportPartidaSearchTerm('');
    setImportPartidaScope('global');

    const warningMessage = scope === 'global'
      ? 'Importaste la partida con alcance global. Si luego cambias el APU de cualquiera de sus insumos en este proyecto, ese precio se sincronizará con los demás proyectos que usen el mismo insumo.'
      : 'Importaste la partida con alcance local. El precio del APU quedará solo en este proyecto y no será propagado al resto.';
    window.alert(warningMessage);
  };

  const handleAddPartidaFromCatalog = (item: any) => {
    const targetBudget = activeBudgetRef.current ?? activeBudget;
    if (!targetBudget) return;

    const nextPartidas = [...targetBudget.partidas];
    const anchorId = insertAfterPartidaId ?? selectedPartidaId;
    const placement = getNewPartidaPlacement(nextPartidas, anchorId, false);
    const newP: Partida = {
      id: 'p_' + Math.random().toString(36).substring(2, 9),
      item: buildPlaceholderItemForLevel(placement.level),
      nombre: String(item.nombre || '').toUpperCase(),
      unidad: String(item.unidad || '').toUpperCase(),
      metrado: 1,
      esTitulo: false,
      rendimiento: Number(item.rendimiento) || 1,
      insumos: (item.insumos || []).map((x: any) => {
        const tipo = normalizeSuggestionTipo(x.tipo);
        return {
          id: 'i_' + Math.random().toString(36).substring(2, 9),
          codigo: x.codigo || undefined,
          nombre: String(x.nombre || '').toUpperCase(),
          unidad: String(x.unidad || '').toUpperCase(),
          cuadrilla: Number(x.cuadrilla) || 0,
          cantidad: typeof x.cantidad === 'number' ? x.cantidad : undefined,
          desperdicio: tipo === 'MT' ? Number(x.desperdicio) || 0 : undefined,
          pu: Number(x.pu ?? x.precio) || 0,
          tipo
        };
      })
    };

    nextPartidas.splice(placement.insertIndex, 0, newP);
    const updatedBudget = {
      ...targetBudget,
      partidas: normalizeLitePartidas(nextPartidas)
    };

    setHistoricalActiveBudget(updatedBudget);
    setSelectedPartidaId(newP.id);
    setInsertAfterPartidaId(null);
    setIsCatalogoPartidasOpen(false);
  };

  const handleAddPartidaConIA = (partida: Partida) => {
    const targetBudget = activeBudgetRef.current ?? activeBudget;
    if (!targetBudget) return;
    insertPartidaAfterCurrent(targetBudget, partida);
    setIsAgregarConIAOpen(false);
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
    setHistoricalActiveBudget(updated);
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

  const insumoSearchTerm = normalizeInsumoSearchText(insumoNombre);
  const matchingSuggestions = insumoSearchTerm
    ? insumoSuggestionsLibrary
        .filter(item =>
          normalizeInsumoSearchText(item.nombre).includes(insumoSearchTerm) ||
          normalizeInsumoSearchText(item.codigo).includes(insumoSearchTerm) ||
          normalizeInsumoSearchText(item.unidad).includes(insumoSearchTerm)
        )
        .sort((a, b) => {
          const aName = normalizeInsumoSearchText(a.nombre);
          const bName = normalizeInsumoSearchText(b.nombre);
          const aStarts = aName.startsWith(insumoSearchTerm) || normalizeInsumoSearchText(a.codigo).startsWith(insumoSearchTerm);
          const bStarts = bName.startsWith(insumoSearchTerm) || normalizeInsumoSearchText(b.codigo).startsWith(insumoSearchTerm);
          if (aStarts !== bStarts) return aStarts ? -1 : 1;
          if (a.sourceRank !== b.sourceRank) return a.sourceRank - b.sourceRank;
          return aName.localeCompare(bName);
        })
        .slice(0, 30)
    : [];

  const handleSelectSuggestion = (item: any) => {
    setInsumoNombre(item.nombre);
    setInsumoUnidad(item.unidad);
    setInsumoPU(String(Number(item.precio ?? item.pu ?? 0) || 0));
    setInsumoTipo(normalizeSuggestionTipo(item.tipo));
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

  if (publicReadOnly && initialOpenBudgetId && publicLinkState !== 'allowed') {
    const isChecking = publicLinkState === 'checking';
    const title = isChecking
      ? 'Abriendo presupuesto compartido'
      : publicLinkState === 'denied'
        ? 'Este enlace es restringido'
        : 'No encontramos este presupuesto';
    const message = isChecking
      ? 'Estamos validando el acceso de lectura para este enlace.'
      : publicLinkState === 'denied'
        ? 'El propietario debe cambiar el acceso general a "Cualquier persona con el enlace" para verlo sin cuenta.'
        : 'El presupuesto ya no existe o el enlace no corresponde a un presupuesto disponible.';

    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-main)', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px' }}>
        <div style={{ width: 'min(620px, 100%)', background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '32px', boxShadow: 'var(--shadow-lg)', textAlign: 'center' }}>
          <div style={{ width: 52, height: 52, margin: '0 auto 18px', borderRadius: 14, border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: isChecking ? 'var(--color-primary)' : 'var(--color-danger)' }}>
            <LiteIcon name={isChecking ? 'clock' : 'lock'} size={24} />
          </div>
          <h1 style={{ margin: '0 0 10px', fontFamily: 'var(--font-display)', fontSize: '1.45rem' }}>{title}</h1>
          <p style={{ margin: '0 auto 24px', color: 'var(--text-secondary)', lineHeight: 1.55, maxWidth: 460 }}>{message}</p>
          {!isChecking && (
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Button onClick={onRequireLogin}>Iniciar sesión</Button>
              <Button variant="secondary" onClick={() => { window.location.href = '/'; }}>Ir al inicio</Button>
            </div>
          )}
        </div>
      </div>
    );
  }

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
            closeMenu={() => setMenuOpenId(null)}
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
            onShareBudget={(budget) => {
              setBudgetToShare(budget);
              setIsShareModalOpen(true);
            }}
          />
          <Modals.CreateBudgetModal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} onSubmit={handleCreateBudget} nombre={nombre} setNombre={setNombre} cliente={cliente} setCliente={setCliente} fechaBase={fechaBase} setFechaBase={setFechaBase} grupo={grupo} setGrupo={setGrupo} groups={groups} />
          <Modals.EditBudgetModal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} onSubmit={handleEditBudget} nombre={nombre} setNombre={setNombre} cliente={cliente} setCliente={setCliente} fechaBase={fechaBase} setFechaBase={setFechaBase} grupo={grupo} setGrupo={setGrupo} groups={groups} />
          <ShareModal 
            isOpen={isShareModalOpen} 
            onClose={() => {
              setIsShareModalOpen(false);
              setBudgetToShare(null);
            }} 
            budget={budgetToShare} 
            currentUserUid={user?.uid || 'anonymous'}
            onUpdatePermissions={async (budgetId, permissions) => {
              const target = budgets.find(b => b.id === budgetId);
              if (target) {
                const updated = { ...target, permissions };
                setBudgets(budgets.map(b => b.id === budgetId ? updated : b));
                setBudgetToShare(updated);
                if (activeBudget?.id === budgetId) setActiveBudget(updated);
                await saveBudgetToCloud(updated);
              }
            }}
            onUpdateLinkAccess={async (budgetId, linkAccess, linkRole) => {
              const target = budgets.find(b => b.id === budgetId);
              if (target) {
                const updated = { ...target, linkAccess, linkRole };
                setBudgets(budgets.map(b => b.id === budgetId ? updated : b));
                setBudgetToShare(updated);
                if (activeBudget?.id === budgetId) setActiveBudget(updated);
                await saveBudgetToCloud(updated);
              }
            }}
          />
        </>
      );
    }

    return (
      <>
        <BudgetsListPro
          theme={theme}
          budgets={budgets}
          setViewState={setViewState}
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
            selectedPartidaIds={selectedPartidaIds}
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
            getPartidaBreakdownTotal={getPartidaBreakdownTotal}
            handlePartidaCellClick={handlePartidaCellClick}
            handlePartidaDragEnter={extendPartidaDragSelection}
            handlePartidaDragEnd={() => setIsPartidaDragSelecting(false)}
            handlePartidaContextMenu={handlePartidaContextMenu}
            openEditPartidaModal={openEditPartidaModal}
            handleEmptyPartidasContextMenu={handleEmptyPartidasContextMenu}
            getPartidaSharedBudgets={getPartidaSharedBudgets}
            handlePartidaCellChange={handlePartidaCellChange}
            handleUpdateInsumoField={handleUpdateInsumoField}
            handleDeleteInsumo={handleDeleteInsumo}
            setSelectedSpecPartidaId={setSelectedPartidaId}
            setIsAddInsumoOpen={openAddInsumoModal}
            getInsumoBaseCantidad={getInsumoBaseCantidad}
            getInsumoCantidad={getInsumoCantidad}
            getInsumoParcial={getInsumoParcial}
            handleUndo={handleUndo}
            handleRedo={handleRedo}
            canUndo={historyPast.length > 0}
            canRedo={historyFuture.length > 0}
            readOnly={publicReadOnly}
          />

          {/* Context Menu for Lite Editor */}
          {contextMenu.visible && (
            <div
              ref={contextMenuRef}
              style={{
                position: 'fixed',
                top: contextMenu.y,
                left: contextMenu.x,
                zIndex: 9999,
                background: 'var(--bg-surface-elevated)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                minWidth: '200px',
                overflow: 'hidden',
                fontSize: '0.82rem',
              }}
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div style={{ padding: '8px 14px', borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 700 }}>
                <span style={{ display: 'inline-flex', verticalAlign: 'middle', marginRight: 8 }}>
                  <LiteIcon name={contextMenu.targetPartida ? (contextMenu.targetPartida.esTitulo ? 'folder' : 'file-text') : 'plus'} size={14} />
                </span>
                {contextMenu.targetPartida
                  ? `${contextMenu.targetPartida.esTitulo ? 'TITULO' : 'PARTIDA'}: ${contextMenu.targetPartida.item}`
                  : 'PRESUPUESTO'}
              </div>

              {/* Add items */}
              {[{ label: '+ Agregar Título',   icon: 'folder' as LiteIconName, action: () => { setEditingPartidaId(null); setInsertAfterPartidaId(contextMenu.targetPartida?.id ?? null); setPartidaEsTitulo(true); setPartidaNombre(''); setPartidaUnidad(''); setPartidaMetrado('1'); setPartidaRendimiento('1'); setIsAddPartidaOpen(true); setContextMenu(p => ({ ...p, visible: false })); } },
                { label: '+ Agregar Partida',  icon: 'file-text' as LiteIconName, action: () => { setEditingPartidaId(null); setInsertAfterPartidaId(contextMenu.targetPartida?.id ?? null); setPartidaEsTitulo(false); setPartidaNombre(''); setPartidaUnidad('M2'); setPartidaMetrado('1'); setPartidaRendimiento('1'); setIsAddPartidaOpen(true); setContextMenu(p => ({ ...p, visible: false })); } },
                { label: 'Agregar Partida por búsqueda', icon: 'calculator' as LiteIconName, action: () => { setInsertAfterPartidaId(contextMenu.targetPartida?.id ?? null); setContextMenu(p => ({ ...p, visible: false })); setIsImportPartidaOpen(true); } },
                { label: 'Agregar Partida/Título con IA', icon: 'sparkles' as LiteIconName, action: () => { setInsertAfterPartidaId(contextMenu.targetPartida?.id ?? null); setContextMenu(p => ({ ...p, visible: false })); setIsAgregarConIAOpen(true); } },
                ...(contextMenu.targetPartida ? [
                  { label: 'Editar',             icon: 'settings' as LiteIconName, action: () => { if (contextMenu.targetPartida) { openEditPartidaModal(contextMenu.targetPartida); setContextMenu(p => ({ ...p, visible: false })); } } },
                  { label: 'Eliminar',           icon: 'trash' as LiteIconName, isRed: true, action: () => {
                      if (contextMenu.targetPartida) handleDeletePartida(contextMenu.targetPartida.id);
                    }
                  },
                ] : []),
              ].map(item => (
                <button key={item.label} type="button" onClick={(event) => { event.preventDefault(); event.stopPropagation(); item.action(); }} style={{
                  display: 'flex', alignItems: 'center', gap: '10px', width: '100%',
                  padding: '8px 14px', background: 'transparent', border: 'none',
                  color: item.isRed ? '#ef4444' : 'var(--text-primary)', cursor: 'pointer',
                  borderBottom: '1px solid var(--border-color)', textAlign: 'left',
                }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
                   onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <LiteIcon name={item.icon} size={16} />
                  {item.label}
                </button>
              ))}

              {(contextMenu.targetPartida || clipboard.partida || partidaClipboardRows.length > 0) && (
                <>
                  {/* Divider */}
                  <div style={{ height: '1px', background: 'var(--border-color)', margin: '4px 0' }} />

                  {/* Clipboard */}
                  {[
                    ...(contextMenu.targetPartida ? [
                      { label: 'Copiar',          icon: 'clipboard-list' as LiteIconName, action: () => {
                          if (contextMenu.targetPartida && selectedPartidaIds.includes(contextMenu.targetPartida.id) && selectedPartidaIds.length > 1) {
                            copySelectedPartidas();
                          } else {
                            setClipboard({ action: 'copy', partida: contextMenu.targetPartida });
                            if (contextMenu.targetPartida) {
                              setPartidaClipboardRows([contextMenu.targetPartida]);
                            }
                          }
                          setContextMenu(p => ({ ...p, visible: false }));
                        } },
                      { label: 'Cortar',          icon: 'arrow-left' as LiteIconName, action: () => { setPartidaClipboardRows([]); setClipboard({ action: 'cut',  partida: contextMenu.targetPartida }); setContextMenu(p => ({ ...p, visible: false })); } },
                    ] : []),
                    ...((clipboard.partida || partidaClipboardRows.length > 0) ? [
                      { label: 'Pegar',           icon: 'file-text' as LiteIconName, action: () => {
                          if (partidaClipboardRows.length > 0 && !clipboard.action) {
                            pastePartidasAfterCurrentSelection();
                          } else {
                            pasteClipboardPartida();
                          }
                        }
                      },
                    ] : []),
                    ...(clipboard.partida ? [
                      { label: 'Pegar y replicar', icon: 'database' as LiteIconName, action: () => {
                          if (!clipboard.partida || !activeBudget) return;
                          duplicatePartida(clipboard.partida);
                          setContextMenu(p => ({ ...p, visible: false }));
                        } },
                    ] : []),
                  ].map(item => (
                    <button key={item.label} type="button" onClick={(event) => { event.preventDefault(); event.stopPropagation(); item.action(); }} style={{
                      display: 'flex', alignItems: 'center', gap: '10px', width: '100%',
                      padding: '8px 14px', background: 'transparent', border: 'none',
                      color: 'var(--text-primary)', cursor: 'pointer',
                      borderBottom: '1px solid var(--border-color)', textAlign: 'left',
                    }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
                       onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <LiteIcon name={item.icon} size={16} />
                      {item.label}
                    </button>
                  ))}
                </>
              )}

              {contextMenu.targetPartida && (
                <>
                  {/* Divider */}
                  <div style={{ height: '1px', background: 'var(--border-color)', margin: '4px 0' }} />

                  {/* Move arrows */}
                  {[{ label: 'Mover Arriba', icon: 'arrow-up' as LiteIconName, action: () => handleMovePartida('up') },
                    { label: 'Mover Abajo', icon: 'arrow-down' as LiteIconName, action: () => handleMovePartida('down') },
                    { label: 'Indentar (subir nivel)', icon: 'indent' as LiteIconName, action: () => handleIndentPartida('right') },
                    { label: 'Desindentar (bajar nivel)', icon: 'outdent' as LiteIconName, action: () => handleIndentPartida('left') },
                  ].map(item => (
                    <button key={item.label} type="button" onClick={(event) => { event.preventDefault(); event.stopPropagation(); item.action(); }} style={{
                      display: 'flex', alignItems: 'center', gap: '10px', width: '100%',
                      padding: '8px 14px', background: 'transparent', border: 'none',
                      color: 'var(--color-primary)', cursor: 'pointer',
                      borderBottom: '1px solid var(--border-color)', textAlign: 'left',
                      fontWeight: 600,
                    }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,240,255,0.04)'}
                       onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <LiteIcon name={item.icon} size={16} />
                      {item.label}
                    </button>
                  ))}
                </>
              )}
            </div>
          )}

          <Modals.AddInsumoModal isOpen={isAddInsumoOpen} onClose={closeAddInsumoModal} onSubmit={handleAddInsumo} insumoNombre={insumoNombre} setInsumoNombre={setInsumoNombre} insumoUnidad={insumoUnidad} setInsumoUnidad={setInsumoUnidad} insumoCuadrilla={insumoCuadrilla} setInsumoCuadrilla={setInsumoCuadrilla} insumoPU={insumoPU} setInsumoPU={setInsumoPU} insumoTipo={insumoTipo} setInsumoTipo={setInsumoTipo} showSuggestions={showSuggestions} setShowSuggestions={setShowSuggestions} matchingSuggestions={matchingSuggestions} handleSelectSuggestion={handleSelectSuggestion} handleCreateNewInsumoOption={handleCreateNewInsumoOption} />
          <Modals.AddPartidaModal isOpen={isAddPartidaOpen} onClose={closeAddPartidaModal} onSubmit={handleAddPartida} partidaNombre={partidaNombre} setPartidaNombre={setPartidaNombre} partidaUnidad={partidaUnidad} setPartidaUnidad={setPartidaUnidad} partidaMetrado={partidaMetrado} setPartidaMetrado={setPartidaMetrado} partidaRendimiento={partidaRendimiento} setPartidaRendimiento={setPartidaRendimiento} partidaEsTitulo={partidaEsTitulo} />
          <Modals.DatosGeneralesModal isOpen={isDatosGeneralesOpen} onClose={() => setIsDatosGeneralesOpen(false)} activeBudget={activeBudget} dgActiveTab={dgActiveTab} setDgActiveTab={setDgActiveTab} dgGrupo={dgGrupo} setDgGrupo={setDgGrupo} dgPresupuesto={dgPresupuesto} setDgPresupuesto={setDgPresupuesto} dgCliente={dgCliente} setDgCliente={setDgCliente} dgDireccion={dgDireccion} setDgDireccion={setDgDireccion} dgDistrito={dgDistrito} setDgDistrito={setDgDistrito} dgProvincia={dgProvincia} setDgProvincia={setDgProvincia} dgDepartamento={dgDepartamento} setDgDepartamento={setDgDepartamento} dgFechaBase={dgFechaBase} setDgFechaBase={setDgFechaBase} dgJornada={dgJornada} setDgJornada={setDgJornada} dgMoneda={dgMoneda} setDgMoneda={setDgMoneda} dgSubPresupuestos={dgSubPresupuestos} setDgSubPresupuestos={setDgSubPresupuestos} newSubPresupuesto={newSubPresupuesto} setNewSubPresupuesto={setNewSubPresupuesto} groups={groups} onSave={handleSaveDatosGenerales} />
          <Modals.GastosGeneralesModal isOpen={isGastosGeneralesOpen} onClose={() => setIsGastosGeneralesOpen(false)} ggTipo={ggTipo} setGgTipo={setGgTipo} ggFijosItems={ggFijosItems} setGgFijosItems={setGgFijosItems} ggVariablesItems={ggVariablesItems} setGgVariablesItems={setGgVariablesItems} getBudgetCD={getBudgetCD} activeBudget={activeBudget} />
          <Modals.PiePresupuestoModal isOpen={isPiePresupuestoOpen} onClose={() => setIsPiePresupuestoOpen(false)} activeBudget={activeBudget} pieRows={pieRows} setPieRows={handleSetPieRows} getBudgetCD={getBudgetCD} />
          <Modals.FormulaPolinomicaModal isOpen={isFormulaPolinomicaOpen} onClose={() => setIsFormulaPolinomicaOpen(false)} activeBudget={activeBudget} formulaPolinomicaRows={formulaPolinomicaRows} setFormulaPolinomicaRows={setFormulaPolinomicaRows} />
          <Modals.CatalogoInsumosModal isOpen={isCatalogoInsumosOpen} onClose={() => setIsCatalogoInsumosOpen(false)} catalogoInsumos={catalogoInsumos} ciSearchTerm={ciSearchTerm} setCiSearchTerm={setCiSearchTerm} ciSelectedTipo={ciSelectedTipo} setCiSelectedTipo={setCiSelectedTipo} onAddFromCatalog={(item) => {
            const tipo = item.tipo === 'MATERIAL' ? 'MT' : item.tipo === 'MANO DE OBRA' ? 'MO' : 'EQ';
            const newIns: Insumo = { id: 'i_' + Math.random().toString(36).substring(2, 9), nombre: item.nombre, unidad: item.unidad, cuadrilla: 1, desperdicio: tipo === 'MT' ? 0 : undefined, pu: item.precio, tipo };
            if (selectedPartidaId) {
              const p = activeBudget.partidas.find(x => x.id === selectedPartidaId);
              if (p) handlePartidaCellChange(selectedPartidaId, 'insumos', [...p.insumos, newIns]);
            }
            setIsCatalogoInsumosOpen(false);
          }} />
          <Modals.CatalogoPartidasModal isOpen={isCatalogoPartidasOpen} onClose={() => setIsCatalogoPartidasOpen(false)} catalogoPartidas={MOCK_CATALOGO_PARTIDAS} cpSearchTerm={cpSearchTerm} setCpSearchTerm={setCpSearchTerm} cpSelectedPartidaIndex={cpSelectedPartidaIndex} setCpSelectedPartidaIndex={setCpSelectedPartidaIndex} onAddPartidaFromCatalog={handleAddPartidaFromCatalog} />
          <Modals.ImportarPartidaModal
            isOpen={isImportPartidaOpen}
            onClose={() => { setIsImportPartidaOpen(false); setInsertAfterPartidaId(null); }}
            budgets={budgets}
            activeBudgetId={activeBudget?.id ?? ''}
            searchTerm={importPartidaSearchTerm}
            setSearchTerm={setImportPartidaSearchTerm}
            selectedScope={importPartidaScope}
            setSelectedScope={setImportPartidaScope}
            onImportPartida={handleImportPartidaFromSearch}
          />
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
          getPartidaSharedBudgets={getPartidaSharedBudgets}
          handlePartidaCellChange={handlePartidaCellChange}
          updatePartidasList={(updatedPartidas) => {
            const updatedBudget = { ...activeBudget, partidas: updatedPartidas };
            setActiveBudget(updatedBudget);
            setBudgets(budgets.map(b => b.id === activeBudget.id ? updatedBudget : b));
            saveBudgetToCloud(updatedBudget);
          }}
          handleUpdateInsumoField={handleUpdateInsumoField}
          handleDeleteInsumo={handleDeleteInsumo}
          setSelectedSpecPartidaId={setSelectedPartidaId}
          setIsAddInsumoOpen={openAddInsumoModal}
          getInsumoBaseCantidad={getInsumoBaseCantidad}
          getInsumoCantidad={getInsumoCantidad}
          getInsumoParcial={getInsumoParcial}
        />

        <Modals.AddInsumoModal isOpen={isAddInsumoOpen} onClose={closeAddInsumoModal} onSubmit={handleAddInsumo} insumoNombre={insumoNombre} setInsumoNombre={setInsumoNombre} insumoUnidad={insumoUnidad} setInsumoUnidad={setInsumoUnidad} insumoCuadrilla={insumoCuadrilla} setInsumoCuadrilla={setInsumoCuadrilla} insumoPU={insumoPU} setInsumoPU={setInsumoPU} insumoTipo={insumoTipo} setInsumoTipo={setInsumoTipo} showSuggestions={showSuggestions} setShowSuggestions={setShowSuggestions} matchingSuggestions={matchingSuggestions} handleSelectSuggestion={handleSelectSuggestion} handleCreateNewInsumoOption={handleCreateNewInsumoOption} />
        <Modals.AddPartidaModal isOpen={isAddPartidaOpen} onClose={closeAddPartidaModal} onSubmit={handleAddPartida} partidaNombre={partidaNombre} setPartidaNombre={setPartidaNombre} partidaUnidad={partidaUnidad} setPartidaUnidad={setPartidaUnidad} partidaMetrado={partidaMetrado} setPartidaMetrado={setPartidaMetrado} partidaRendimiento={partidaRendimiento} setPartidaRendimiento={setPartidaRendimiento} partidaEsTitulo={partidaEsTitulo} />
        <Modals.DatosGeneralesModal isOpen={isDatosGeneralesOpen} onClose={() => setIsDatosGeneralesOpen(false)} activeBudget={activeBudget} dgActiveTab={dgActiveTab} setDgActiveTab={setDgActiveTab} dgGrupo={dgGrupo} setDgGrupo={setDgGrupo} dgPresupuesto={dgPresupuesto} setDgPresupuesto={setDgPresupuesto} dgCliente={dgCliente} setDgCliente={setDgCliente} dgDireccion={dgDireccion} setDgDireccion={setDgDireccion} dgDistrito={dgDistrito} setDgDistrito={setDgDistrito} dgProvincia={dgProvincia} setDgProvincia={setDgProvincia} dgDepartamento={dgDepartamento} setDgDepartamento={setDgDepartamento} dgFechaBase={dgFechaBase} setDgFechaBase={setDgFechaBase} dgJornada={dgJornada} setDgJornada={setDgJornada} dgMoneda={dgMoneda} setDgMoneda={setDgMoneda} dgSubPresupuestos={dgSubPresupuestos} setDgSubPresupuestos={setDgSubPresupuestos} newSubPresupuesto={newSubPresupuesto} setNewSubPresupuesto={setNewSubPresupuesto} groups={groups} onSave={handleSaveDatosGenerales} />
        <Modals.GastosGeneralesModal isOpen={isGastosGeneralesOpen} onClose={() => setIsGastosGeneralesOpen(false)} ggTipo={ggTipo} setGgTipo={setGgTipo} ggFijosItems={ggFijosItems} setGgFijosItems={setGgFijosItems} ggVariablesItems={ggVariablesItems} setGgVariablesItems={setGgVariablesItems} getBudgetCD={getBudgetCD} activeBudget={activeBudget} />
        <Modals.PiePresupuestoModal isOpen={isPiePresupuestoOpen} onClose={() => setIsPiePresupuestoOpen(false)} activeBudget={activeBudget} pieRows={pieRows} setPieRows={handleSetPieRows} getBudgetCD={getBudgetCD} />
        <Modals.FormulaPolinomicaModal isOpen={isFormulaPolinomicaOpen} onClose={() => setIsFormulaPolinomicaOpen(false)} activeBudget={activeBudget} formulaPolinomicaRows={formulaPolinomicaRows} setFormulaPolinomicaRows={setFormulaPolinomicaRows} />
        <Modals.CatalogoInsumosModal isOpen={isCatalogoInsumosOpen} onClose={() => setIsCatalogoInsumosOpen(false)} catalogoInsumos={catalogoInsumos} ciSearchTerm={ciSearchTerm} setCiSearchTerm={setCiSearchTerm} ciSelectedTipo={ciSelectedTipo} setCiSelectedTipo={setCiSelectedTipo} onAddFromCatalog={(item) => {
          const tipo = item.tipo === 'MATERIAL' ? 'MT' : item.tipo === 'MANO DE OBRA' ? 'MO' : 'EQ';
          const newIns: Insumo = { id: 'i_' + Math.random().toString(36).substring(2, 9), nombre: item.nombre, unidad: item.unidad, cuadrilla: 1, desperdicio: tipo === 'MT' ? 0 : undefined, pu: item.precio, tipo };
          if (selectedPartidaId) {
            const p = activeBudget.partidas.find(x => x.id === selectedPartidaId);
            if (p) handlePartidaCellChange(selectedPartidaId, 'insumos', [...p.insumos, newIns]);
          }
          setIsCatalogoInsumosOpen(false);
        }} />
        <Modals.CatalogoPartidasModal isOpen={isCatalogoPartidasOpen} onClose={() => setIsCatalogoPartidasOpen(false)} catalogoPartidas={MOCK_CATALOGO_PARTIDAS} cpSearchTerm={cpSearchTerm} setCpSearchTerm={setCpSearchTerm} cpSelectedPartidaIndex={cpSelectedPartidaIndex} setCpSelectedPartidaIndex={setCpSelectedPartidaIndex} onAddPartidaFromCatalog={handleAddPartidaFromCatalog} />
        <Modals.ImportarPartidaModal
          isOpen={isImportPartidaOpen}
          onClose={() => { setIsImportPartidaOpen(false); setInsertAfterPartidaId(null); }}
          budgets={budgets}
          activeBudgetId={activeBudget?.id ?? ''}
          searchTerm={importPartidaSearchTerm}
          setSearchTerm={setImportPartidaSearchTerm}
          selectedScope={importPartidaScope}
          setSelectedScope={setImportPartidaScope}
          onImportPartida={handleImportPartidaFromSearch}
        />
        <Modals.ListaInsumosModal isOpen={isListaInsumosOpen} onClose={() => setIsListaInsumosOpen(false)} activeBudget={activeBudget} />
        <Modals.ConfiguracionModal isOpen={isConfiguracionOpen} onClose={() => setIsConfiguracionOpen(false)} showGridlines={showGridlines} setShowGridlines={setShowGridlines} />
        <Modals.AgregarConIAModal
          isOpen={isAgregarConIAOpen}
          onClose={() => { setIsAgregarConIAOpen(false); setInsertAfterPartidaId(null); }}
          budgets={budgets}
          activeBudgetId={activeBudget?.id ?? ''}
          onAddPartida={handleAddPartidaConIA}
        />
      </>
    );
  }

  return null;
};
