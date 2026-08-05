/**
 * exportUtils.ts
 * Exportación profesional de presupuestos a PDF (jsPDF + autotable) y Excel (SheetJS/xlsx)
 */

import type { Budget, Partida, Insumo, PiePresupuestoRow } from './types';

// ─── Calculation helpers (standalone, sin depender de React state) ─────────

function getInsumoBaseCantidad(ins: Insumo, rend: number): number {
  const explicitCantidad = typeof ins.cantidad === 'number' && Number.isFinite(ins.cantidad) ? ins.cantidad : null;
  if (ins.unidad === '%MO') return explicitCantidad ?? ins.cuadrilla;
  if (ins.tipo === 'MO') {
    return rend > 0 ? (ins.cuadrilla * 8) / rend : 0;
  }
  if (ins.tipo === 'EQ') {
    return explicitCantidad ?? (rend > 0 ? (ins.cuadrilla * 8) / rend : 0);
  }
  return explicitCantidad ?? ins.cuadrilla;
}

function getInsumoDesperdicio(ins: Insumo): number {
  const raw = typeof ins.desperdicio === 'number' && Number.isFinite(ins.desperdicio) ? ins.desperdicio : 0;
  return ins.tipo === 'MT' ? Math.max(0, raw) : 0;
}

function getInsumoCantidad(ins: Insumo, rend: number): number {
  const baseCantidad = getInsumoBaseCantidad(ins, rend);
  return baseCantidad * (1 + getInsumoDesperdicio(ins) / 100);
}

function isManualToolsInsumo(ins: Pick<Insumo, 'nombre' | 'unidad'>): boolean {
  const unidad = (ins.unidad || '').trim().toUpperCase();
  const nombre = (ins.nombre || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();
  return unidad === '%MO' || nombre.includes('HERRAMIENTAS MANUALES');
}

function getManoObraSubtotal(partida: Partida): number {
  return partida.insumos.reduce((sum, ins) => {
    if (ins.tipo !== 'MO' || isManualToolsInsumo(ins)) return sum;
    return sum + getInsumoCantidad(ins, partida.rendimiento) * ins.pu;
  }, 0);
}

function getInsumoUnitPrice(ins: Insumo, partida?: Partida): number {
  if (partida && isManualToolsInsumo(ins)) {
    return getManoObraSubtotal(partida);
  }
  return ins.pu;
}

function getInsumoParcial(ins: Insumo, rend: number, partida?: Partida): number {
  const unitPrice = getInsumoUnitPrice(ins, partida);
  if (isManualToolsInsumo(ins)) {
    return (unitPrice * getInsumoCantidad(ins, rend)) / 100;
  }
  return getInsumoCantidad(ins, rend) * unitPrice;
}

function getAPUBreakdown(partida: Partida) {
  const br = { MO: 0, MT: 0, EQ: 0, SC: 0, SP: 0 };
  if (!partida || partida.esTitulo) return br;
  for (const ins of partida.insumos) {
    const val = getInsumoParcial(ins, partida.rendimiento, partida);
    if (ins.tipo === 'MO') br.MO += val;
    else if (ins.tipo === 'MT') br.MT += val;
    else if (ins.tipo === 'EQ') br.EQ += val;
    else if (ins.tipo === 'SC') br.SC += val;
    else br.SP += val;
  }
  return br;
}

function getPartidaCU(partida: Partida): number {
  if (partida.esTitulo) return 0;
  const br = getAPUBreakdown(partida);
  return br.MO + br.MT + br.EQ + br.SC + br.SP;
}

function getPartidaParcial(partida: Partida, allPartidas: Partida[]): number {
  if (!partida.esTitulo) return partida.metrado * getPartidaCU(partida);
  const currentLevel = (partida.item.match(/\./g) || []).length;
  const idx = allPartidas.findIndex(p => p.id === partida.id);
  if (idx === -1) return 0;
  let sum = 0;
  for (let i = idx + 1; i < allPartidas.length; i++) {
    const p = allPartidas[i];
    if (p.esTitulo) {
      const pLevel = (p.item.match(/\./g) || []).length;
      if (pLevel <= currentLevel) break;
      continue;
    }
    sum += getPartidaParcial(p, allPartidas);
  }
  return sum;
}

function getBudgetCD(budget: Budget): number {
  return budget.partidas
    .filter(p => !p.esTitulo)
    .reduce((s, p) => s + getPartidaParcial(p, budget.partidas), 0);
}

function fmt(n: number) {
  return `S/ ${n.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmtNum(n: number, decimals = 2) {
  return (Number.isFinite(n) ? n : 0).toLocaleString('es-PE', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
}

function safeFileName(value: string) {
  return value.replace(/[^a-zA-Z0-9]/g, '_');
}

function getBudgetCode(budget: Budget) {
  const rawCode = (budget as any).codigo || (budget as any).codigoPresupuesto || budget.id || '';
  return String(rawCode).replace(/\D/g, '').slice(0, 7) || '001';
}

function getSubPresupuestoCode(budget: Budget) {
  const rawCode = (budget as any).subPresupuestoCodigo || (budget as any).subCodigo || '001';
  return String(rawCode).replace(/\D/g, '').padStart(3, '0').slice(-3) || '001';
}

function getLugar(budget: Budget) {
  return [budget.distrito, budget.provincia, budget.departamento].filter(Boolean).join(' - ');
}

function formatDateForExcel(value?: string) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('es-PE');
}

function getTotals(budget: Budget) {
  const cd = getBudgetCD(budget);
  const gg = cd * 0.10;
  const ut = cd * 0.10;
  const st = cd + gg + ut;
  const igv = st * 0.18;
  return { cd, gg, ut, st, igv, total: st + igv };
}

type CalculatedPieRow = PiePresupuestoRow & { valor: number };

const DEFAULT_PIE_ROWS: PiePresupuestoRow[] = [
  { variable: 'CD', descripcion: 'COSTO DIRECTO', formula: '', iu: '', resaltar: true, ocultarEnPdf: false },
  { variable: 'GG', descripcion: 'GASTOS GENERALES 10%', formula: 'CD * 0.10', iu: '39', resaltar: false, ocultarEnPdf: false },
  { variable: 'UTI', descripcion: 'UTILIDAD 10%', formula: 'CD * 0.10', iu: '39', resaltar: false, ocultarEnPdf: false },
  { variable: 'ST', descripcion: 'SUB TOTAL', formula: 'CD + GG + UTI', iu: '', resaltar: true, ocultarEnPdf: false },
  { variable: 'IGV', descripcion: 'IGV 18%', formula: 'ST * 0.18', iu: '', resaltar: false, ocultarEnPdf: false },
  { variable: 'TOTAL', descripcion: 'TOTAL PRESUPUESTO', formula: 'ST + IGV', iu: '', resaltar: true, ocultarEnPdf: false }
];

function getBudgetPieRows(budget: Budget): PiePresupuestoRow[] {
  const rows = Array.isArray(budget.pieRows) && budget.pieRows.length ? budget.pieRows : DEFAULT_PIE_ROWS;
  return rows.map(row => ({ ...row, ocultarEnPdf: Boolean(row.ocultarEnPdf) }));
}

function calculateBudgetPieRows(budget: Budget): CalculatedPieRow[] {
  const cd = getBudgetCD(budget);
  const values: Record<string, number> = { CD: cd };

  return getBudgetPieRows(budget).map(row => {
    const variable = String(row.variable || '').trim().toUpperCase();
    let valor = variable === 'CD' ? cd : 0;

    if (variable !== 'CD') {
      try {
        let expr = String(row.formula || '');
        Object.keys(values)
          .sort((a, b) => b.length - a.length)
          .forEach(key => {
            expr = expr.replace(new RegExp(`\\b${key}\\b`, 'g'), String(values[key]));
          });
        const cleanExpr = expr.replace(/[^0-9.+\-*/() ]/g, '');
        valor = cleanExpr.trim() ? Function(`"use strict"; return (${cleanExpr})`)() : 0;
        if (!Number.isFinite(valor)) valor = 0;
      } catch {
        valor = 0;
      }
    }

    if (variable) values[variable] = valor;
    return { ...row, variable, valor };
  });
}

function getPieTotal(rows: CalculatedPieRow[]): number {
  const totalRow = rows.find(row => row.variable === 'TOTAL');
  return totalRow?.valor ?? rows[rows.length - 1]?.valor ?? 0;
}

function getVisiblePdfPieRows(rows: CalculatedPieRow[]): CalculatedPieRow[] {
  return rows.filter(row => !row.ocultarEnPdf);
}

const RESOURCE_TYPE_ORDER: Array<'MO' | 'MT' | 'EQ' | 'SC' | 'SP'> = ['MO', 'MT', 'EQ', 'SC', 'SP'];
const RESOURCE_TYPE_LABEL: Record<string, string> = {
  MO: 'Mano de Obra',
  MT: 'Materiales',
  EQ: 'Equipos',
  SC: 'Subcontratos',
  SP: 'Subpartidas'
};

function drawPageMark(doc: any, pageNo?: number) {
  const page = pageNo ?? doc.internal.getCurrentPageInfo().pageNumber;
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6);
  doc.text('INFRACOST', 13, 9);
  doc.text(`Pagina :`, 173, 9);
  doc.setFont('helvetica', 'bold');
  doc.text(String(page), 194, 9, { align: 'right' });
}

function drawBudgetHeader(doc: any, title: string, budget: Budget, y = 20) {
  drawPageMark(doc);
  const budgetCode = getBudgetCode(budget);
  const subPresupuesto = budget.subPresupuestos?.[0] || budget.grupo || '';
  const subPresupuestoCode = String((budget as any).subPresupuestoCodigo || '001');
  const lugar = getLugar(budget);

  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text(title, 105, y, { align: 'center' });

  doc.setFontSize(5.8);
  doc.setFont('helvetica', 'normal');
  doc.text('Presupuesto', 12, y + 8);
  doc.text('Subpresupuesto', 12, y + 14);
  doc.text('Cliente', 12, y + 20);
  doc.text('Lugar', 12, y + 26);
  doc.text('Costo al', 165, y + 20);

  doc.setFont('helvetica', 'bold');
  doc.text(budgetCode, 42, y + 8);
  doc.text(subPresupuestoCode, 42, y + 14);
  doc.text(doc.splitTextToSize(String(budget.nombre || '').toUpperCase(), 96), 58, y + 8);
  doc.text(doc.splitTextToSize(String(subPresupuesto || '').toUpperCase(), 96), 58, y + 14);
  doc.text(doc.splitTextToSize(String(budget.cliente || '').toUpperCase(), 98), 42, y + 20);
  doc.text(doc.splitTextToSize(String(lugar || '').toUpperCase(), 98), 42, y + 26);
  doc.text(new Date(budget.fechaBase || Date.now()).toLocaleDateString('es-PE'), 190, y + 20, { align: 'right' });
}

function drawThinLine(doc: any, y: number) {
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.2);
  doc.line(12, y, 198, y);
}

// ─── Colores corporativos para PDF ────────────────────────────────────────

const COLOR_PRIMARY: [number, number, number] = [0, 102, 204];    // azul
const COLOR_TITLE: [number, number, number]   = [44, 44, 60];     // oscuro
const COLOR_HEADER_BG: [number, number, number] = [30, 30, 50];
const COLOR_WHITE: [number, number, number]   = [255, 255, 255];
const COLOR_ALT: [number, number, number]     = [245, 246, 250];

// ─── PDF Hoja Resumen ─────────────────────────────────────────────────────

async function pdfResumen(budget: Budget) {
  const { default: jsPDF } = await import('jspdf');
  const { default: autoTable } = await import('jspdf-autotable');
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

  const pieRows = calculateBudgetPieRows(budget);
  const visiblePieRows = getVisiblePdfPieRows(pieRows);

  // Título
  doc.setFillColor(...COLOR_HEADER_BG);
  doc.rect(0, 0, 297, 22, 'F');
  doc.setTextColor(...COLOR_WHITE);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text('HOJA RESUMEN DE PRESUPUESTO', 14, 14);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Fecha: ${new Date().toLocaleDateString('es-PE')}`, 240, 14);

  // Info general
  doc.setTextColor(30, 30, 30);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('Presupuesto:', 14, 32);
  doc.text('Cliente:', 14, 38);
  doc.text('Lugar:', 14, 44);
  doc.text('Fecha Base:', 14, 50);
  doc.setFont('helvetica', 'normal');
  doc.text(budget.nombre, 55, 32);
  doc.text(budget.cliente, 55, 38);
  doc.text(`${budget.distrito || ''} - ${budget.provincia || ''} - ${budget.departamento || ''}`, 55, 44);
  doc.text(budget.fechaBase, 55, 50);

  // Tabla resumen
  autoTable(doc, {
    startY: 58,
    head: [['DESCRIPCIÓN', 'MONTO (S/)']],
    body: visiblePieRows.map(row => [String(row.descripcion || row.variable || '').toUpperCase(), fmt(row.valor)]),
    headStyles: { fillColor: COLOR_HEADER_BG, textColor: COLOR_WHITE, fontSize: 9, fontStyle: 'bold' },
    bodyStyles: { fontSize: 10 },
    columnStyles: { 1: { halign: 'right', fontStyle: 'bold' } },
    alternateRowStyles: { fillColor: COLOR_ALT },
    didParseCell: (data) => {
      if (visiblePieRows[data.row.index]?.resaltar) {
        data.cell.styles.fillColor = COLOR_PRIMARY;
        data.cell.styles.textColor = COLOR_WHITE;
        data.cell.styles.fontStyle = 'bold';
      }
    },
  });

  doc.save(`RESUMEN_${budget.nombre.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`);
}

// ─── PDF Presupuesto ───────────────────────────────────────────────────────

async function pdfPresupuesto(budget: Budget) {
  const { default: jsPDF } = await import('jspdf');
  const { default: autoTable } = await import('jspdf-autotable');
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

  // Header
  doc.setFillColor(...COLOR_HEADER_BG);
  doc.rect(0, 0, 297, 22, 'F');
  doc.setTextColor(...COLOR_WHITE);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text('PRESUPUESTO', 14, 14);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(`${budget.nombre}`, 60, 10);
  doc.text(`Cliente: ${budget.cliente}`, 60, 16);
  doc.text(`Fecha: ${new Date().toLocaleDateString('es-PE')}`, 240, 14);

  const body = budget.partidas.map(p => {
    const cu = getPartidaCU(p);
    const parcial = getPartidaParcial(p, budget.partidas);
    const br = getAPUBreakdown(p);
    return [
      p.item,
      p.nombre,
      p.unidad || '',
      p.esTitulo ? '' : p.metrado.toFixed(2),
      p.esTitulo ? '' : `S/ ${cu.toFixed(2)}`,
      `S/ ${parcial.toFixed(2)}`,
      p.esTitulo ? '' : `S/ ${br.MO.toFixed(2)}`,
      p.esTitulo ? '' : `S/ ${br.MT.toFixed(2)}`,
      p.esTitulo ? '' : `S/ ${br.EQ.toFixed(2)}`,
      p.esTitulo ? '' : `S/ ${br.SC.toFixed(2)}`,
    ];
  });

  autoTable(doc, {
    startY: 28,
    head: [['Item', 'Descripción', 'Und.', 'Metrado', 'Unitario', 'Parcial (S/)', 'M. Obra', 'Material', 'Equipo', 'SC']],
    body,
    headStyles: { fillColor: COLOR_HEADER_BG, textColor: COLOR_WHITE, fontSize: 7, fontStyle: 'bold' },
    bodyStyles: { fontSize: 7 },
    columnStyles: {
      0: { cellWidth: 16 },
      1: { cellWidth: 70 },
      2: { cellWidth: 12, halign: 'center' },
      3: { halign: 'right' },
      4: { halign: 'right' },
      5: { halign: 'right', fontStyle: 'bold' },
      6: { halign: 'right' },
      7: { halign: 'right' },
      8: { halign: 'right' },
      9: { halign: 'right' },
    },
    didParseCell: (data) => {
      if (data.section === 'body') {
        const p = budget.partidas[data.row.index];
        if (p?.esTitulo) {
          const level = (p.item.match(/\./g) || []).length;
          if (level === 0) {
            data.cell.styles.fillColor = COLOR_PRIMARY;
            data.cell.styles.textColor = COLOR_WHITE;
            data.cell.styles.fontStyle = 'bold';
          } else if (level === 1) {
            data.cell.styles.fillColor = [220, 230, 245];
            data.cell.styles.textColor = COLOR_TITLE;
            data.cell.styles.fontStyle = 'bold';
          }
        }
      }
    },
  });

  // Footer con totales
  const cd = getBudgetCD(budget);
  const lastY = (doc as any).lastAutoTable.finalY + 6;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 30, 30);
  doc.text(`COSTO DIRECTO: ${fmt(cd)}`, 180, lastY);

  doc.save(`PRESUPUESTO_${budget.nombre.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`);
}

// ─── PDF APU ───────────────────────────────────────────────────────────────

async function pdfAPU(budget: Budget) {
  const { default: jsPDF } = await import('jspdf');
  const { default: autoTable } = await import('jspdf-autotable');
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

  const workPartidas = budget.partidas.filter(p => !p.esTitulo);

  for (let pi = 0; pi < workPartidas.length; pi++) {
    const p = workPartidas[pi];
    if (pi > 0) doc.addPage();

    const cu = getPartidaCU(p);
    const br = getAPUBreakdown(p);

    // Partida header
    doc.setFillColor(...COLOR_HEADER_BG);
    doc.rect(0, 0, 297, 22, 'F');
    doc.setTextColor(...COLOR_WHITE);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text(`ANÁLISIS DE PRECIOS UNITARIOS`, 14, 10);
    doc.setFont('helvetica', 'normal');
    doc.text(`${budget.nombre} — Fecha: ${budget.fechaBase}`, 14, 16);

    doc.setTextColor(20, 20, 20);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text(`Partida: ${p.item}  ${p.nombre}`, 14, 30);
    doc.setFont('helvetica', 'normal');
    doc.text(`Unidad: ${p.unidad}   Rendimiento: ${p.rendimiento}   Costo Unitario: S/ ${cu.toFixed(2)}`, 14, 36);

    // Breakdown badges
    let bx = 14;
    const badges = [
      { label: 'MO', val: br.MO }, { label: 'MT', val: br.MT },
      { label: 'EQ', val: br.EQ }, { label: 'SC', val: br.SC }
    ];
    for (const b of badges) {
      doc.setFillColor(240, 244, 255);
      doc.roundedRect(bx, 39, 50, 8, 2, 2, 'F');
      doc.setTextColor(...COLOR_PRIMARY);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.text(`${b.label}: S/ ${b.val.toFixed(2)}`, bx + 2, 44.5);
      bx += 54;
    }

    // Tabla insumos
    const rows = p.insumos.map(ins => [
      ins.codigo || '—',
      ins.nombre,
      ins.unidad,
      ins.cuadrilla.toFixed(4),
      getInsumoCantidad(ins, p.rendimiento).toFixed(4),
      `S/ ${getInsumoUnitPrice(ins, p).toFixed(2)}`,
      `S/ ${getInsumoParcial(ins, p.rendimiento, p).toFixed(2)}`,
      ins.tipo,
    ]);

    autoTable(doc, {
      startY: 50,
      head: [['Código', 'Insumo', 'Unidad', 'Cuadrilla', 'Cantidad', 'Precio Unit.', 'Parcial', 'Tipo']],
      body: rows,
      headStyles: { fillColor: COLOR_HEADER_BG, textColor: COLOR_WHITE, fontSize: 8, fontStyle: 'bold' },
      bodyStyles: { fontSize: 8 },
      columnStyles: {
        0: { cellWidth: 24, fontStyle: 'bold', textColor: [100, 100, 120] as [number, number, number] },
        1: { cellWidth: 90 },
        2: { cellWidth: 18, halign: 'center' },
        3: { halign: 'right' },
        4: { halign: 'right' },
        5: { halign: 'right' },
        6: { halign: 'right', fontStyle: 'bold' },
        7: { cellWidth: 14, halign: 'center' },
      },
      alternateRowStyles: { fillColor: COLOR_ALT },
    });
  }

  doc.save(`APU_${budget.nombre.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`);
}

// ─── PDF Listado de Insumos ────────────────────────────────────────────────

async function pdfListaInsumos(budget: Budget) {
  const { default: jsPDF } = await import('jspdf');
  const { default: autoTable } = await import('jspdf-autotable');
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

  doc.setFillColor(...COLOR_HEADER_BG);
  doc.rect(0, 0, 297, 22, 'F');
  doc.setTextColor(...COLOR_WHITE);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('RELACIÓN DE INSUMOS', 14, 14);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(budget.nombre, 90, 10);
  doc.text(`Cliente: ${budget.cliente}`, 90, 16);

  // Aggregate insumos
  const map = new Map<string, { codigo: string; nombre: string; unidad: string; tipo: string; cantidad: number; precioTotal: number }>();
  for (const p of budget.partidas) {
    if (p.esTitulo) continue;
    for (const ins of p.insumos) {
      const key = ins.codigo || ins.nombre;
      if (map.has(key)) {
        const e = map.get(key)!;
        e.cantidad += getInsumoCantidad(ins, p.rendimiento) * p.metrado;
        e.precioTotal += getInsumoParcial(ins, p.rendimiento, p) * p.metrado;
      } else {
        map.set(key, {
          codigo: ins.codigo || '—',
          nombre: ins.nombre,
          unidad: ins.unidad,
          tipo: ins.tipo,
          cantidad: getInsumoCantidad(ins, p.rendimiento) * p.metrado,
          precioTotal: getInsumoParcial(ins, p.rendimiento, p) * p.metrado,
        });
      }
    }
  }

  // Group by tipo
  const tipos: Array<'MO' | 'MT' | 'EQ' | 'SC' | 'SP'> = ['MO', 'MT', 'EQ', 'SC', 'SP'];
  const typeLabel: Record<string, string> = { MO: 'MANO DE OBRA', MT: 'MATERIALES', EQ: 'EQUIPOS', SC: 'SUBCONTRATOS', SP: 'SUBPARTIDAS' };
  const rows: any[] = [];

  for (const tipo of tipos) {
    const items = [...map.values()].filter(x => x.tipo === tipo);
    if (!items.length) continue;
    rows.push([{ content: typeLabel[tipo], colSpan: 6, styles: { fillColor: COLOR_PRIMARY, textColor: COLOR_WHITE, fontStyle: 'bold' as const } }]);
    for (const item of items) {
      rows.push([item.codigo, item.nombre, item.unidad, item.tipo, item.cantidad.toFixed(4), `S/ ${item.precioTotal.toFixed(2)}`]);
    }
    const subtotal = items.reduce((s, x) => s + x.precioTotal, 0);
    rows.push([{ content: `Subtotal ${typeLabel[tipo]}`, colSpan: 5, styles: { fontStyle: 'bold' as const, halign: 'right' as const } }, { content: `S/ ${subtotal.toFixed(2)}`, styles: { fontStyle: 'bold' as const, halign: 'right' as const } }]);
  }

  autoTable(doc, {
    startY: 28,
    head: [['Código', 'Descripción', 'Und.', 'Tipo', 'Cantidad', 'Parcial (S/)']],
    body: rows,
    headStyles: { fillColor: COLOR_HEADER_BG, textColor: COLOR_WHITE, fontSize: 8, fontStyle: 'bold' },
    bodyStyles: { fontSize: 8 },
    columnStyles: {
      0: { cellWidth: 28, fontStyle: 'bold', textColor: [100, 100, 120] as [number, number, number] },
      1: { cellWidth: 110 },
      2: { cellWidth: 16, halign: 'center' },
      3: { cellWidth: 22, halign: 'center' },
      4: { halign: 'right' },
      5: { halign: 'right', fontStyle: 'bold' },
    },
    alternateRowStyles: { fillColor: COLOR_ALT },
  });

  doc.save(`INSUMOS_${budget.nombre.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`);
}

// ─── PDF Fórmula Polinómica ───────────────────────────────────────────────

async function pdfPresupuestoS10(budget: Budget) {
  const { default: jsPDF } = await import('jspdf');
  const { default: autoTable } = await import('jspdf-autotable');
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  const body = budget.partidas.map(p => {
    const cu = getPartidaCU(p);
    const parcial = getPartidaParcial(p, budget.partidas);
    return [
      p.item,
      String(p.nombre || '').toUpperCase(),
      p.unidad || '',
      p.esTitulo ? '' : fmtNum(p.metrado),
      p.esTitulo ? '' : fmtNum(cu),
      fmtNum(parcial),
    ];
  });

  autoTable(doc, {
    startY: 55,
    margin: { top: 55, left: 12, right: 12, bottom: 18 },
    theme: 'plain',
    head: [['Item', 'Descripcion', 'Und.', 'Metrado', 'Precio S/.', 'Parcial S/.']],
    body,
    headStyles: {
      fillColor: [255, 255, 255],
      textColor: [0, 0, 0],
      fontSize: 6.2,
      fontStyle: 'bold',
      lineColor: [0, 0, 0],
      lineWidth: { top: 0.35, bottom: 0.35 }
    },
    bodyStyles: {
      fontSize: 5.6,
      textColor: [0, 0, 0],
      cellPadding: { top: 0.8, right: 1.2, bottom: 0.8, left: 1.2 }
    },
    columnStyles: {
      0: { cellWidth: 25 },
      1: { cellWidth: 82 },
      2: { cellWidth: 13, halign: 'center' },
      3: { cellWidth: 22, halign: 'right' },
      4: { cellWidth: 22, halign: 'right' },
      5: { cellWidth: 22, halign: 'right' },
    },
    didParseCell: (data) => {
      if (data.section !== 'body') return;
      const p = budget.partidas[data.row.index];
      if (p?.esTitulo) {
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.fontSize = 5.8;
      }
    },
    didDrawPage: () => {
      drawBudgetHeader(doc, 'Presupuesto', budget, 20);
    }
  });

  const pieRows = calculateBudgetPieRows(budget);
  const visiblePieRows = getVisiblePdfPieRows(pieRows);
  const pieTotal = getPieTotal(pieRows);
  const showPieTotalText = !pieRows.find(row => row.variable === 'TOTAL')?.ocultarEnPdf;
  let y = ((doc as any).lastAutoTable?.finalY || 55) + 4;
  if (y > 238) {
    doc.addPage();
    drawBudgetHeader(doc, 'Presupuesto', budget, 20);
    y = 55;
  }

  autoTable(doc, {
    startY: y,
    margin: { left: 40, right: 12 },
    theme: 'plain',
    body: visiblePieRows.map(row => [String(row.descripcion || row.variable || '').toUpperCase(), fmtNum(row.valor)]),
    bodyStyles: { fontSize: 5.8, textColor: [0, 0, 0], cellPadding: 1 },
    columnStyles: {
      0: { cellWidth: 95, fontStyle: 'bold' },
      1: { cellWidth: 50, halign: 'right', fontStyle: 'bold' }
    },
    didParseCell: (data) => {
      if (visiblePieRows[data.row.index]?.resaltar) {
        data.cell.styles.fontStyle = 'bold';
      }
    }
  });

  y = ((doc as any).lastAutoTable?.finalY || y) + 6;
  if (showPieTotalText && y < 285) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(5.8);
    doc.text('SON :', 40, y);
    doc.text(`${fmtNum(pieTotal)} SOLES`, 58, y);
  }

  doc.save(`PRESUPUESTO_${safeFileName(budget.nombre)}.pdf`);
}

async function pdfAPUS10(budget: Budget) {
  const { default: jsPDF } = await import('jspdf');
  const { default: autoTable } = await import('jspdf-autotable');
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const partidas = budget.partidas.filter(p => !p.esTitulo);

  let y = 48;
  drawBudgetHeader(doc, 'Analisis de precios unitarios', budget, 18);

  const newPage = () => {
    doc.addPage();
    drawBudgetHeader(doc, 'Analisis de precios unitarios', budget, 18);
    y = 48;
  };

  for (const p of partidas) {
    if (y > 230) newPage();

    const cu = getPartidaCU(p);
    const br = getAPUBreakdown(p);

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(5.8);
    doc.setFont('helvetica', 'normal');
    doc.text('Partida', 12, y);
    doc.setFont('helvetica', 'bold');
    doc.text(p.item, 42, y);
    doc.text(doc.splitTextToSize(String(p.nombre || '').toUpperCase(), 108), 58, y);
    drawThinLine(doc, y + 2);

    doc.setFont('helvetica', 'normal');
    doc.text('Rendimiento', 12, y + 9);
    doc.setFont('helvetica', 'bold');
    doc.text(`${p.unidad || ''}/DIA`, 42, y + 9);
    doc.text(`MO. ${fmtNum(p.rendimiento, 4)}`, 58, y + 9);
    doc.text(`EQ. ${fmtNum(p.rendimiento, 4)}`, 88, y + 9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Costo unitario directo por : ${p.unidad || ''}`, 134, y + 9);
    doc.setFont('helvetica', 'bold');
    doc.text(fmtNum(cu), 194, y + 9, { align: 'right' });

    const rows: any[] = [];
    for (const tipo of RESOURCE_TYPE_ORDER) {
      const items = p.insumos.filter(ins => ins.tipo === tipo);
      if (!items.length) continue;

      rows.push([{ content: RESOURCE_TYPE_LABEL[tipo], colSpan: 7, styles: { fontStyle: 'bold', halign: 'center', fontSize: 5.7 } }]);
      for (const ins of items) {
        const cantidad = getInsumoCantidad(ins, p.rendimiento);
        const parcial = getInsumoParcial(ins, p.rendimiento, p);
        const showCuadrilla = ins.tipo === 'MO' || (ins.tipo === 'EQ' && ins.unidad !== '%MO');
        rows.push([
          ins.codigo || '',
          String(ins.nombre || '').toUpperCase(),
          ins.unidad || '',
          showCuadrilla ? fmtNum(ins.cuadrilla, 4) : '',
          fmtNum(cantidad, 4),
          fmtNum(getInsumoUnitPrice(ins, p)),
          fmtNum(parcial),
        ]);
      }

      const subtotal = tipo === 'MO' ? br.MO : tipo === 'MT' ? br.MT : tipo === 'EQ' ? br.EQ : tipo === 'SC' ? br.SC : br.SP;
      rows.push(['', '', '', '', '', '', fmtNum(subtotal)]);
    }

    autoTable(doc, {
      startY: y + 13,
      margin: { top: 44, left: 12, right: 12, bottom: 14 },
      theme: 'plain',
      head: [['Codigo', 'Descripcion Recurso', 'Unidad', 'Cuadrilla', 'Cantidad', 'Precio S/', 'Parcial S/']],
      body: rows,
      headStyles: {
        fillColor: [255, 255, 255],
        textColor: [0, 0, 0],
        fontSize: 5.8,
        fontStyle: 'bold',
        lineColor: [0, 0, 0],
        lineWidth: { top: 0.25, bottom: 0.25 }
      },
      bodyStyles: { fontSize: 5.6, textColor: [0, 0, 0], cellPadding: { top: 0.6, right: 1, bottom: 0.6, left: 1 } },
      columnStyles: {
        0: { cellWidth: 22 },
        1: { cellWidth: 72 },
        2: { cellWidth: 15, halign: 'center' },
        3: { cellWidth: 20, halign: 'right' },
        4: { cellWidth: 20, halign: 'right' },
        5: { cellWidth: 22, halign: 'right' },
        6: { cellWidth: 23, halign: 'right', fontStyle: 'bold' },
      },
      didDrawPage: () => {
        drawBudgetHeader(doc, 'Analisis de precios unitarios', budget, 18);
      }
    });

    y = ((doc as any).lastAutoTable?.finalY || y) + 6;
  }

  doc.save(`APU_${safeFileName(budget.nombre)}.pdf`);
}

async function pdfListaInsumosS10(budget: Budget) {
  const { default: jsPDF } = await import('jspdf');
  const { default: autoTable } = await import('jspdf-autotable');
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  type Aggregated = { codigo: string; nombre: string; unidad: string; tipo: string; cantidad: number; parcial: number; precio: number };
  const map = new Map<string, Aggregated>();

  for (const p of budget.partidas) {
    if (p.esTitulo) continue;
    for (const ins of p.insumos) {
      const key = `${ins.tipo}|${ins.codigo || ''}|${ins.nombre}|${ins.unidad}`;
      const cantidad = getInsumoCantidad(ins, p.rendimiento) * p.metrado;
      const unitPrice = getInsumoUnitPrice(ins, p);
      const parcial = getInsumoParcial(ins, p.rendimiento, p) * p.metrado;
      const current = map.get(key);
      if (current) {
        current.cantidad += cantidad;
        current.parcial += parcial;
        current.precio = current.cantidad ? current.parcial / current.cantidad : unitPrice;
      } else {
        map.set(key, {
          codigo: ins.codigo || '',
          nombre: String(ins.nombre || '').toUpperCase(),
          unidad: ins.unidad || '',
          tipo: ins.tipo,
          cantidad,
          parcial,
          precio: unitPrice
        });
      }
    }
  }

  const rows: any[] = [];
  for (const tipo of RESOURCE_TYPE_ORDER) {
    const items = [...map.values()]
      .filter(item => item.tipo === tipo)
      .sort((a, b) => a.nombre.localeCompare(b.nombre));
    if (!items.length) continue;

    rows.push([{ content: RESOURCE_TYPE_LABEL[tipo].toUpperCase(), colSpan: 7, styles: { fontStyle: 'bold', halign: 'center', fontSize: 5.9 } }]);
    for (const item of items) {
      const precio = item.cantidad ? item.parcial / item.cantidad : item.precio;
      rows.push([
        item.codigo,
        item.nombre,
        item.unidad,
        fmtNum(item.cantidad, 4),
        fmtNum(precio),
        fmtNum(item.parcial),
        fmtNum(item.parcial),
      ]);
    }
    const subtotal = items.reduce((sum, item) => sum + item.parcial, 0);
    rows.push(['', '', '', '', '', fmtNum(subtotal), fmtNum(subtotal)]);
  }

  autoTable(doc, {
    startY: 55,
    margin: { top: 55, left: 12, right: 12, bottom: 18 },
    theme: 'plain',
    head: [['Codigo', 'Recurso', 'Unidad', 'Cantidad', 'Precio S/', 'Parcial S/', 'Presupuestado S/']],
    body: rows,
    headStyles: {
      fillColor: [255, 255, 255],
      textColor: [0, 0, 0],
      fontSize: 5.8,
      fontStyle: 'bold',
      lineColor: [0, 0, 0],
      lineWidth: { top: 0.25, bottom: 0.25 }
    },
    bodyStyles: { fontSize: 5.5, textColor: [0, 0, 0], cellPadding: { top: 0.7, right: 1, bottom: 0.7, left: 1 } },
    columnStyles: {
      0: { cellWidth: 23 },
      1: { cellWidth: 67 },
      2: { cellWidth: 15, halign: 'center' },
      3: { cellWidth: 22, halign: 'right' },
      4: { cellWidth: 20, halign: 'right' },
      5: { cellWidth: 24, halign: 'right' },
      6: { cellWidth: 24, halign: 'right' },
    },
    didDrawPage: () => {
      drawBudgetHeader(doc, 'Precios y cantidades de recursos requeridos por tipo', budget, 18);
    }
  });

  const total = [...map.values()].reduce((sum, item) => sum + item.parcial, 0);
  let y = ((doc as any).lastAutoTable?.finalY || 55) + 8;
  if (y > 265) {
    doc.addPage();
    drawBudgetHeader(doc, 'Precios y cantidades de recursos requeridos por tipo', budget, 18);
    y = 55;
  }

  doc.setFontSize(5.8);
  doc.setFont('helvetica', 'bold');
  doc.text('Total', 126, y);
  doc.text('S/', 144, y);
  doc.text(fmtNum(total), 174, y, { align: 'right' });
  doc.text(fmtNum(total), 198, y, { align: 'right' });
  drawThinLine(doc, y - 3);

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(5.2);
  doc.text('La columna parcial es el producto del precio por la cantidad requerida; en la ultima columna se muestra el monto presupuestado.', 12, y + 13);

  doc.save(`INSUMOS_${safeFileName(budget.nombre)}.pdf`);
}

async function pdfFormulaPolinomica(budget: Budget) {
  const { default: jsPDF } = await import('jspdf');
  const { default: autoTable } = await import('jspdf-autotable');
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  doc.setFillColor(...COLOR_HEADER_BG);
  doc.rect(0, 0, 210, 22, 'F');
  doc.setTextColor(...COLOR_WHITE);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('FÓRMULA POLINÓMICA', 14, 14);

  doc.setTextColor(30, 30, 30);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Presupuesto: ${budget.nombre}`, 14, 30);
  doc.text(`Cliente: ${budget.cliente}`, 14, 36);

  autoTable(doc, {
    startY: 44,
    head: [['Monomio', 'Índice Unificado', 'Coeficiente', 'Símbolo', 'Factor']],
    body: [
      ['1', '37 : HERRAMIENTA MANUAL', '0.025', 'HM', ''],
      ['1', '39 : ÍNDICE DE PRECIOS AL CONSUMIDOR (INEI)', '0.439', 'IPC', ''],
      ['1', '47 : MANO DE OBRA (INC. LEYES SOCIALES)', '0.536', 'MO', ''],
    ],
    headStyles: { fillColor: COLOR_HEADER_BG, textColor: COLOR_WHITE, fontSize: 9, fontStyle: 'bold' },
    bodyStyles: { fontSize: 9 },
    alternateRowStyles: { fillColor: COLOR_ALT },
  });

  doc.save(`POLINOMICA_${budget.nombre.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`);
}

// ─── EXCEL Presupuesto (todos las hojas) ──────────────────────────────────

async function excelPresupuestoLegacy(budget: Budget) {
  const XLSX = await import('xlsx');
  const wb = XLSX.utils.book_new();

  // ── Hoja 1: Presupuesto ────────────────────────────────────────────────
  {
    const rows: any[][] = [
      ['Presupuesto', '', budget.nombre],
      ['Cliente', '', budget.cliente],
      ['Lugar', '', `${budget.distrito} - ${budget.provincia} - ${budget.departamento}`],
      ['Fecha Base', '', budget.fechaBase],
      [],
      ['Item', 'Descripción', 'Und.', 'Metrado', 'Precio S/.', 'Parcial S/.', 'M. Obra', 'Material', 'Equipo', 'Subcontrato'],
    ];

    for (const p of budget.partidas) {
      const cu = getPartidaCU(p);
      const parcial = getPartidaParcial(p, budget.partidas);
      const br = getAPUBreakdown(p);
      if (p.esTitulo) {
        rows.push([p.item, p.nombre, '', '', '', parcial, '', '', '', '']);
      } else {
        rows.push([p.item, p.nombre, p.unidad, p.metrado, cu, parcial, br.MO, br.MT, br.EQ, br.SC]);
      }
    }

    const cd = getBudgetCD(budget);
    const gg = cd * 0.10;
    const ut = cd * 0.10;
    const st = cd + gg + ut;
    const igv = st * 0.18;
    const total = st + igv;

    rows.push([]);
    rows.push(['', 'COSTO DIRECTO', '', '', '', cd]);
    rows.push(['', 'Gastos Generales (10%)', '', '', '', gg]);
    rows.push(['', 'Utilidad (10%)', '', '', '', ut]);
    rows.push(['', 'SUB TOTAL', '', '', '', st]);
    rows.push(['', 'IGV (18%)', '', '', '', igv]);
    rows.push(['', 'TOTAL PRESUPUESTO', '', '', '', total]);

    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws['!cols'] = [{ wch: 12 }, { wch: 60 }, { wch: 8 }, { wch: 10 }, { wch: 12 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 14 }];
    XLSX.utils.book_append_sheet(wb, ws, 'Presupuesto');
  }

  // ── Hoja 2: Análisis de Precios Unitarios ─────────────────────────────
  {
    const rows: any[][] = [
      ['Análisis de Precios Unitarios'],
      [],
      ['Presupuesto', '', budget.nombre],
      [],
    ];
    for (const p of budget.partidas) {
      if (p.esTitulo) continue;
      const cu = getPartidaCU(p);
      const br = getAPUBreakdown(p);
      rows.push([]);
      rows.push(['Partida', `${p.item}  ${p.nombre}`, '', '', '', 'Und.', p.unidad]);
      rows.push(['Rendimiento', `${p.unidad}/DIA ${p.rendimiento}`, '', 'EQ.', p.rendimiento, 'Costo unitario directo por:', cu]);
      rows.push(['Código', 'Descripción Recurso', 'Unidad', 'Cuadrilla', 'Cantidad', 'Precio S/.', 'Parcial S/.']);
      for (const ins of p.insumos) {
        rows.push([
          ins.codigo || '',
          ins.nombre,
          ins.unidad,
          ins.cuadrilla,
          getInsumoCantidad(ins, p.rendimiento),
          getInsumoUnitPrice(ins, p),
          getInsumoParcial(ins, p.rendimiento, p),
        ]);
      }
      rows.push(['', 'MO:', '', '', '', '', br.MO]);
      rows.push(['', 'MT:', '', '', '', '', br.MT]);
      rows.push(['', 'EQ:', '', '', '', '', br.EQ]);
      rows.push(['', 'SC:', '', '', '', '', br.SC]);
    }
    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws['!cols'] = [{ wch: 14 }, { wch: 60 }, { wch: 10 }, { wch: 12 }, { wch: 12 }, { wch: 14 }, { wch: 14 }];
    XLSX.utils.book_append_sheet(wb, ws, 'Análisis Precios Unitarios');
  }

  // ── Hoja 3: Relación de Insumos ────────────────────────────────────────
  {
    const rows: any[][] = [
      ['Relación de Insumos'],
      [],
      ['Presupuesto', '', budget.nombre],
      ['Cliente', '', budget.cliente],
      [],
      ['Código', 'Descripción Insumo', 'Unidad', 'Cantidad', 'Precio S/.', 'Parcial S/.'],
    ];

    const map = new Map<string, { codigo: string; nombre: string; unidad: string; tipo: string; cantidad: number; precio: number; precioTotal: number }>();
    for (const p of budget.partidas) {
      if (p.esTitulo) continue;
      for (const ins of p.insumos) {
        const key = ins.codigo || ins.nombre;
        const qty = getInsumoCantidad(ins, p.rendimiento) * p.metrado;
        const unitPrice = getInsumoUnitPrice(ins, p);
        const total = getInsumoParcial(ins, p.rendimiento, p) * p.metrado;
        if (map.has(key)) {
          const e = map.get(key)!;
          e.cantidad += qty;
          e.precioTotal += total;
        } else {
          map.set(key, { codigo: ins.codigo || '', nombre: ins.nombre, unidad: ins.unidad, tipo: ins.tipo, cantidad: qty, precio: unitPrice, precioTotal: total });
        }
      }
    }

    const tipos: Array<'MO' | 'MT' | 'EQ' | 'SC' | 'SP'> = ['MO', 'MT', 'EQ', 'SC', 'SP'];
    const typeLabel: Record<string, string> = { MO: 'MANO DE OBRA', MT: 'MATERIALES', EQ: 'EQUIPOS', SC: 'SUBCONTRATOS', SP: 'SUBPARTIDAS' };
    for (const tipo of tipos) {
      const items = [...map.values()].filter(x => x.tipo === tipo);
      if (!items.length) continue;
      rows.push([]);
      rows.push([typeLabel[tipo]]);
      for (const item of items) {
        rows.push([item.codigo, item.nombre, item.unidad, item.cantidad, item.precio, item.precioTotal]);
      }
      rows.push(['', 'Subtotal', '', '', '', items.reduce((s, x) => s + x.precioTotal, 0)]);
    }
    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws['!cols'] = [{ wch: 14 }, { wch: 70 }, { wch: 10 }, { wch: 14 }, { wch: 14 }, { wch: 14 }];
    XLSX.utils.book_append_sheet(wb, ws, 'Relación de Insumos');
  }

  XLSX.writeFile(wb, `PRESUPUESTO_${budget.nombre.replace(/[^a-zA-Z0-9]/g, '_')}.xlsx`);
}

void excelPresupuestoLegacy;

function numberToSpanishWords(value: number): string {
  const units = ['', 'UNO', 'DOS', 'TRES', 'CUATRO', 'CINCO', 'SEIS', 'SIETE', 'OCHO', 'NUEVE'];
  const teens = ['DIEZ', 'ONCE', 'DOCE', 'TRECE', 'CATORCE', 'QUINCE', 'DIECISEIS', 'DIECISIETE', 'DIECIOCHO', 'DIECINUEVE'];
  const tens = ['', '', 'VEINTE', 'TREINTA', 'CUARENTA', 'CINCUENTA', 'SESENTA', 'SETENTA', 'OCHENTA', 'NOVENTA'];
  const hundreds = ['', 'CIENTO', 'DOSCIENTOS', 'TRESCIENTOS', 'CUATROCIENTOS', 'QUINIENTOS', 'SEISCIENTOS', 'SETECIENTOS', 'OCHOCIENTOS', 'NOVECIENTOS'];

  const convertBelowThousand = (num: number): string => {
    if (num === 0) return '';
    if (num === 100) return 'CIEN';
    if (num < 10) return units[num];
    if (num < 20) return teens[num - 10];
    if (num < 30) return num === 20 ? 'VEINTE' : `VEINTI${units[num - 20]}`;
    if (num < 100) {
      const unit = num % 10;
      return unit ? `${tens[Math.floor(num / 10)]} Y ${units[unit]}` : tens[Math.floor(num / 10)];
    }
    const rest = num % 100;
    return `${hundreds[Math.floor(num / 100)]}${rest ? ` ${convertBelowThousand(rest)}` : ''}`;
  };

  const convert = (num: number): string => {
    if (num === 0) return 'CERO';
    if (num < 1000) return convertBelowThousand(num);
    if (num < 1000000) {
      const thousands = Math.floor(num / 1000);
      const rest = num % 1000;
      return `${thousands === 1 ? 'MIL' : `${convertBelowThousand(thousands)} MIL`}${rest ? ` ${convert(rest)}` : ''}`;
    }
    const millions = Math.floor(num / 1000000);
    const rest = num % 1000000;
    return `${millions === 1 ? 'UN MILLON' : `${convert(millions)} MILLONES`}${rest ? ` ${convert(rest)}` : ''}`;
  };

  const integerValue = Math.floor(Math.abs(value));
  return `${value < 0 ? 'MENOS ' : ''}${convert(integerValue)}`;
}

function amountToSpanishCurrency(value: number, currency: Budget['moneda'] = 'SOLES') {
  const centsTotal = Math.round(Math.abs(value) * 100);
  const integerPart = Math.floor(centsTotal / 100);
  const cents = centsTotal % 100;
  return `SON: ${numberToSpanishWords(value < 0 ? -integerPart : integerPart)} Y ${String(cents).padStart(2, '0')}/100 ${currency}`;
}

async function excelPresupuesto(budget: Budget, option: ExportOption = 'presupuesto') {
  const XLSX = await import('xlsx');
  const wb = XLSX.utils.book_new();
  const budgetCode = getBudgetCode(budget);
  const subPresupuestoCode = getSubPresupuestoCode(budget);
  const subPresupuesto = budget.subPresupuestos?.[0] || budget.grupo || '';
  const fecha = formatDateForExcel(budget.fechaBase);
  const lugar = getLugar(budget);

  const upper = (value: unknown) => String(value || '').toUpperCase();
  const isTitle = (p: Partida) => p.esTitulo;

  const applySheetLayout = (ws: any, _rows: any[][], cols: number[]) => {
    ws['!cols'] = cols.map(wch => ({ wch }));
    ws['!margins'] = { left: 0.75, right: 0.75, top: 1, bottom: 1, header: 0, footer: 0 };
    ws['!ref'] = `A1:${XLSX.utils.encode_col(cols.length - 1)}1000`;
  };

  const setNumberFormats = (ws: any, rows: any[][], formats: Record<number, string>) => {
    for (let r = 0; r < rows.length; r++) {
      for (const [col, format] of Object.entries(formats)) {
        const c = Number(col);
        const cellRef = XLSX.utils.encode_cell({ r, c });
        const cell = ws[cellRef];
        if (cell && typeof cell.v === 'number') cell.z = format;
      }
    }
  };

  const styleRows = (ws: any, rows: any[][], colCount: number, tableHeaderRows: number[]) => {
    for (let r = 0; r < rows.length; r++) {
      const first = String(rows[r][0] || '');
      const second = String(rows[r][1] || '');
      const isMeta = r < 7;
      const isTableHeader = tableHeaderRows.includes(r);
      const isGroup = first === '' && second && second === second.toUpperCase();
      const hasTotal = rows[r].some(cell => String(cell).toUpperCase().includes('TOTAL'));
      for (let c = 0; c < colCount; c++) {
        const cellRef = XLSX.utils.encode_cell({ r, c });
        const cell = ws[cellRef];
        if (!cell) continue;
        cell.s = {
          font: { name: 'Arial', sz: r < 8 ? 8 : 7, bold: isMeta || isTableHeader || isGroup || hasTotal },
          alignment: {
            horizontal: r === 0 ? 'center' : c >= 3 ? 'right' : 'left',
            vertical: 'center',
            wrapText: c === 1 || c === 2
          },
          border: isTableHeader ? {
            top: { style: 'thin', color: { rgb: '000000' } },
            bottom: { style: 'thin', color: { rgb: '000000' } }
          } : undefined
        };
      }
    }
  };

  const appendPresupuestoSheet = () => {
    const rows: any[][] = [
      ['Presupuesto', '', '', '', '', ''],
      [],
      ['Presupuesto', budgetCode, upper(budget.nombre), '', '', ''],
      ['Subpresupuesto', subPresupuestoCode, upper(subPresupuesto), '', '', ''],
      ['Cliente', '', upper(budget.cliente), '', 'Costo al', fecha],
      ['Lugar', '', upper(lugar), '', '', ''],
      [],
      ['Item', 'Descripción', 'Und.', 'Metrado', 'Precio S/.', 'Parcial S/.'],
    ];

    for (const p of budget.partidas) {
      const cu = getPartidaCU(p);
      const parcial = getPartidaParcial(p, budget.partidas);
      if (isTitle(p)) {
        rows.push([p.item, upper(p.nombre), '', '', '', parcial]);
      } else {
        rows.push([p.item, upper(p.nombre), p.unidad || '', p.metrado, cu, parcial]);
      }
    }

    const totals = getTotals(budget);
    rows.push([]);
    rows.push(['', 'COSTO DIRECTO', '', '', '', totals.cd]);
    rows.push(['', 'Gastos Generales 10%CD', '', '', '', totals.gg]);
    rows.push(['', 'Utilidad 10% CD', '', '', '', totals.ut]);
    rows.push(['', 'SUBTOTAL', '', '', '', totals.st]);
    rows.push(['', 'IGV (18%)', '', '', '', totals.igv]);
    rows.push([]);
    rows.push(['', 'TOTAL DEL PRESUPUESTO', '', '', '', totals.total]);
    rows.push([]);
    rows.push(['', amountToSpanishCurrency(totals.total, budget.moneda), '', '', '', '']);

    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 5 } }];
    applySheetLayout(ws, rows, [16.17, 75.17, 48.17, 11.17, 36.17, 23.17]);
    setNumberFormats(ws, rows, { 3: '#,##0.00', 4: '#,##0.00', 5: '#,##0.00' });
    styleRows(ws, rows, 6, [7]);
    XLSX.utils.book_append_sheet(wb, ws, 'Presupuesto');
  };

  const appendApuSheet = () => {
    const rows: any[][] = [
      ['Análisis de precios unitarios', '', '', '', '', '', ''],
      [],
      ['Presupuesto', budgetCode, upper(budget.nombre), '', '', '', ''],
      ['Subpresupuesto', subPresupuestoCode, upper(subPresupuesto), '', '', 'Fecha presupuesto', fecha],
      [],
    ];
    const tableHeaderRows: number[] = [];

    for (const p of budget.partidas) {
      if (isTitle(p)) continue;
      const cu = getPartidaCU(p);
      const br = getAPUBreakdown(p);
      rows.push(['Partida', `${p.item}  ${upper(p.nombre)}`, '', '', '', 'Und.', p.unidad || '']);
      rows.push(['Rendimiento', `${p.unidad || ''}/DIA ${fmtNum(p.rendimiento, 4)}`, '', 'EQ.', p.rendimiento, 'Costo unitario directo por :', cu]);
      tableHeaderRows.push(rows.length);
      rows.push(['Código', 'Descripción Recurso', 'Unidad', 'Cuadrilla', 'Cantidad', 'Precio S/.', 'Parcial S/.']);

      for (const tipo of RESOURCE_TYPE_ORDER) {
        const items = p.insumos.filter(ins => ins.tipo === tipo);
        if (!items.length) continue;
        rows.push(['', RESOURCE_TYPE_LABEL[tipo].toUpperCase(), '', '', '', '', '']);
        for (const ins of items) {
          const showCuadrilla = ins.tipo === 'MO' || (ins.tipo === 'EQ' && ins.unidad !== '%MO');
          rows.push([
            ins.codigo || '',
            upper(ins.nombre),
            ins.unidad || '',
            showCuadrilla ? ins.cuadrilla : '',
            getInsumoCantidad(ins, p.rendimiento),
            getInsumoUnitPrice(ins, p),
            getInsumoParcial(ins, p.rendimiento, p),
          ]);
        }
        const subtotal = tipo === 'MO' ? br.MO : tipo === 'MT' ? br.MT : tipo === 'EQ' ? br.EQ : tipo === 'SC' ? br.SC : br.SP;
        rows.push(['', '', '', '', '', '', subtotal]);
      }
      rows.push([]);
      rows.push([]);
    }

    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 6 } }];
    applySheetLayout(ws, rows, [34.17, 85.17, 11.17, 11.17, 7.5, 30.17, 22.17]);
    setNumberFormats(ws, rows, { 3: '0.0000', 4: '0.0000', 5: '#,##0.00', 6: '#,##0.00' });
    styleRows(ws, rows, 7, tableHeaderRows);
    XLSX.utils.book_append_sheet(wb, ws, 'Análisis Precios Unitarios');
  };

  const appendInsumosSheet = () => {
    const rows: any[][] = [
      ['Relación de Insumos', '', '', '', '', ''],
      [],
      ['Presupuesto', budgetCode, upper(budget.nombre), '', '', ''],
      ['Subpresupuesto', subPresupuestoCode, upper(subPresupuesto), '', '', ''],
      ['Cliente', '', upper(budget.cliente), '', 'Costo al', fecha],
      ['Lugar', '', upper(lugar), '', '', ''],
      [],
      ['Código', 'Descripción Insumo', 'Unidad', 'Cantidad', 'Precio S/.', 'Parcial S/.'],
    ];

    const map = new Map<string, { codigo: string; nombre: string; unidad: string; tipo: string; cantidad: number; precio: number; parcial: number }>();
    for (const p of budget.partidas) {
      if (isTitle(p)) continue;
      for (const ins of p.insumos) {
        const key = `${ins.tipo}|${ins.codigo || ''}|${ins.nombre}|${ins.unidad}`;
        const cantidad = getInsumoCantidad(ins, p.rendimiento) * p.metrado;
        const unitPrice = getInsumoUnitPrice(ins, p);
        const parcial = getInsumoParcial(ins, p.rendimiento, p) * p.metrado;
        const current = map.get(key);
        if (current) {
          current.cantidad += cantidad;
          current.parcial += parcial;
          current.precio = current.cantidad ? current.parcial / current.cantidad : unitPrice;
        } else {
          map.set(key, {
            codigo: ins.codigo || '',
            nombre: upper(ins.nombre),
            unidad: ins.unidad || '',
            tipo: ins.tipo,
            cantidad,
            precio: unitPrice,
            parcial
          });
        }
      }
    }

    for (const tipo of RESOURCE_TYPE_ORDER) {
      const items = [...map.values()]
        .filter(item => item.tipo === tipo)
        .sort((a, b) => (a.codigo || a.nombre).localeCompare(b.codigo || b.nombre));
      if (!items.length) continue;
      rows.push([]);
      rows.push(['', RESOURCE_TYPE_LABEL[tipo].toUpperCase(), '', '', '', '']);
      for (const item of items) {
        const precio = item.cantidad ? item.parcial / item.cantidad : item.precio;
        rows.push([item.codigo, item.nombre, item.unidad, item.cantidad, precio, item.parcial]);
      }
      rows.push(['', '', '', '', '', items.reduce((sum, item) => sum + item.parcial, 0)]);
    }

    rows.push([]);
    rows.push(['', '', '', 'Total', '', [...map.values()].reduce((sum, item) => sum + item.parcial, 0)]);

    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 5 } }];
    applySheetLayout(ws, rows, [21.17, 58.17, 48.17, 10, 12.17, 10]);
    setNumberFormats(ws, rows, { 3: '0.0000', 4: '#,##0.00', 5: '#,##0.00' });
    styleRows(ws, rows, 6, [7]);
    XLSX.utils.book_append_sheet(wb, ws, 'Relación de Insumos');
  };

  const appendResumenSheet = () => {
    const pieRows = calculateBudgetPieRows(budget);
    const rows: any[][] = [
      ['Hoja Resumen', '', '', '', '', ''],
      [],
      ['Presupuesto', budgetCode, upper(budget.nombre), '', '', ''],
      ['Subpresupuesto', subPresupuestoCode, upper(subPresupuesto), '', '', ''],
      ['Cliente', '', upper(budget.cliente), '', 'Costo al', fecha],
      ['Lugar', '', upper(lugar), '', '', ''],
      [],
      ['Variable', 'Descripción', 'Fórmula', 'I.U.', 'Importe S/.', ''],
    ];

    for (const row of pieRows) {
      rows.push([
        row.variable,
        upper(row.descripcion),
        row.formula || '',
        row.iu || '',
        row.valor,
        row.resaltar ? 'TOTAL' : ''
      ]);
    }

    rows.push([]);
    rows.push(['', amountToSpanishCurrency(getPieTotal(pieRows), budget.moneda), '', '', '', '']);

    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 5 } }];
    applySheetLayout(ws, rows, [16.17, 58.17, 28, 10, 16, 12]);
    setNumberFormats(ws, rows, { 4: '#,##0.00' });
    styleRows(ws, rows, 6, [7]);
    XLSX.utils.book_append_sheet(wb, ws, 'Hoja Resumen');
  };

  const appendFormulaPolinomicaSheet = () => {
    const rows: any[][] = [
      ['Fórmula Polinómica', '', '', '', ''],
      [],
      ['Presupuesto', budgetCode, upper(budget.nombre), '', ''],
      ['Subpresupuesto', subPresupuestoCode, upper(subPresupuesto), '', ''],
      ['Cliente', '', upper(budget.cliente), '', ''],
      ['Lugar', '', upper(lugar), '', ''],
      [],
      ['Monomio', 'Índice Unificado', 'Coeficiente', 'Símbolo', 'Factor'],
      ['1', '37 : HERRAMIENTA MANUAL', 0.025, 'HM', ''],
      ['1', '39 : ÍNDICE DE PRECIOS AL CONSUMIDOR (INEI)', 0.439, 'IPC', ''],
      ['1', '47 : MANO DE OBRA (INC. LEYES SOCIALES)', 0.536, 'MO', ''],
    ];

    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 4 } }];
    applySheetLayout(ws, rows, [16.17, 58.17, 14, 14, 18]);
    setNumberFormats(ws, rows, { 2: '0.000' });
    styleRows(ws, rows, 5, [7]);
    XLSX.utils.book_append_sheet(wb, ws, 'Fórmula Polinómica');
  };

  let filePrefix = 'PRESUPUESTO';
  switch (option) {
    case 'resumen':
      filePrefix = 'RESUMEN';
      appendResumenSheet();
      break;
    case 'presupuesto':
      filePrefix = 'PRESUPUESTO';
      appendPresupuestoSheet();
      break;
    case 'apu':
      filePrefix = 'APU';
      appendApuSheet();
      break;
    case 'insumos':
      filePrefix = 'INSUMOS';
      appendInsumosSheet();
      break;
    case 'polinomica':
      filePrefix = 'FORMULA_POLINOMICA';
      appendFormulaPolinomicaSheet();
      break;
  }

  XLSX.writeFile(wb, `${filePrefix}_${safeFileName(budget.nombre)}.xlsx`, { cellStyles: true });
}

// ─── Dispatcher público ───────────────────────────────────────────────────

export type ExportOption = 'resumen' | 'presupuesto' | 'apu' | 'insumos' | 'polinomica';

export async function exportPDF(option: ExportOption, budget: Budget) {
  switch (option) {
    case 'resumen':     await pdfResumen(budget); break;
    case 'presupuesto': await pdfPresupuestoS10(budget); break;
    case 'apu':         await pdfAPUS10(budget); break;
    case 'insumos':     await pdfListaInsumosS10(budget); break;
    case 'polinomica':  await pdfFormulaPolinomica(budget); break;
  }
}

export async function exportExcel(option: ExportOption, budget: Budget) {
  await excelPresupuesto(budget, option);
}
