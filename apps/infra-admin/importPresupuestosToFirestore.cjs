const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

const PRESUPUESTOS_DIR = path.resolve(__dirname, '../../Presupuestos');

const firebaseConfig = {
  apiKey: 'AIzaSyCas8jIgsWV_hRnWcZiPMjBdvcRVtoh6EU',
  authDomain: 'infrasuitee.firebaseapp.com',
  projectId: 'infrasuitee',
  storageBucket: 'infrasuitee.firebasestorage.app',
  messagingSenderId: '126902185835',
  appId: '1:126902185835:web:fca0a2a231b8a531efa62e',
  measurementId: 'G-TVELJV85F1'
};

const RESOURCE_TYPE_BY_LABEL = [
  ['MANO DE OBRA', 'MO'],
  ['MATERIALES', 'MT'],
  ['EQUIPOS', 'EQ'],
  ['EQUIPO', 'EQ'],
  ['SUBCONTRATOS', 'SC'],
  ['SUBPARTIDAS', 'SP']
];

function normalize(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toUpperCase();
}

function text(value) {
  return String(value ?? '').trim();
}

function slug(value) {
  return normalize(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 120);
}

function parseNumber(value) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  let raw = text(value);
  if (!raw) return 0;

  const isNegative = /^\(.*\)$/.test(raw);
  raw = raw
    .replace(/^\(|\)$/g, '')
    .replace(/S\/\.?/gi, '')
    .replace(/\s+/g, '');

  const comma = raw.lastIndexOf(',');
  const dot = raw.lastIndexOf('.');
  if (comma !== -1 && dot !== -1) {
    raw = comma > dot
      ? raw.replace(/\./g, '').replace(',', '.')
      : raw.replace(/,/g, '');
  } else if (comma !== -1) {
    raw = /^-?\d{1,3}(,\d{3})+$/.test(raw)
      ? raw.replace(/,/g, '')
      : raw.replace(',', '.');
  }

  const parsed = Number(raw);
  return Number.isFinite(parsed) ? (isNegative ? -parsed : parsed) : 0;
}

function parseExcelDate(rawValue, displayValue) {
  if (typeof rawValue === 'number') {
    const parsed = XLSX.SSF.parse_date_code(rawValue);
    if (parsed) {
      return `${parsed.y}-${String(parsed.m).padStart(2, '0')}-${String(parsed.d).padStart(2, '0')}`;
    }
  }

  const raw = text(displayValue || rawValue);
  const match = raw.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{2,4})$/);
  if (!match) return raw || new Date().toISOString().slice(0, 10);

  let first = Number(match[1]);
  let second = Number(match[2]);
  let year = Number(match[3]);
  if (year < 100) year += 2000;

  const day = first > 12 ? first : first;
  const month = first > 12 ? second : second;
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function getRows(workbook, sheetName, raw) {
  const sheet = workbook.Sheets[sheetName];
  return XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '', raw });
}

function findSheetName(workbook, wanted) {
  const wantedNorm = normalize(wanted);
  return workbook.SheetNames.find((name) => normalize(name).includes(wantedNorm));
}

function stablePartidaId(budgetSlug, item) {
  return `p_${budgetSlug}_${slug(item) || Math.random().toString(36).slice(2, 8)}`;
}

function stableInsumoId(budgetSlug, item, codigo, index) {
  const codeSlug = slug(codigo) || `idx_${index}`;
  return `i_${budgetSlug}_${slug(item)}_${codeSlug}_${index}`;
}

function parseBudgetFromWorkbook(fileName) {
  const filePath = path.join(PRESUPUESTOS_DIR, fileName);
  const workbook = XLSX.readFile(filePath);
  const presupuestoSheet = findSheetName(workbook, 'Presupuesto');
  const apuSheet = findSheetName(workbook, 'Analisis Precios Unitarios');

  if (!presupuestoSheet) {
    throw new Error(`No se encontro hoja Presupuesto en ${fileName}`);
  }

  const rawPresupuestoRows = getRows(workbook, presupuestoSheet, true);
  const presupuestoRows = getRows(workbook, presupuestoSheet, false);
  const nombre = text(presupuestoRows[2]?.[2]) || path.basename(fileName, path.extname(fileName));
  const codigo = text(presupuestoRows[2]?.[1]) || '';
  const subPresupuestoCodigo = text(presupuestoRows[3]?.[1]) || '001';
  const subPresupuestoNombre = text(presupuestoRows[3]?.[2]) || 'SUB PRESUPUESTO 1';
  const cliente = text(presupuestoRows[4]?.[2]) || 'Sin Cliente';
  const fechaBase = parseExcelDate(rawPresupuestoRows[4]?.[5], presupuestoRows[4]?.[5]);
  const lugar = text(presupuestoRows[5]?.[2]);
  const lugarParts = lugar.split('-').map((part) => text(part)).filter(Boolean);
  const budgetSlug = slug(nombre);

  const partidas = [];
  const partidasByItem = new Map();
  let readingPartidas = false;

  for (const row of presupuestoRows) {
    const item = text(row[0]);
    const descripcion = text(row[1]);
    const unidad = text(row[2]);

    if (normalize(item) === 'ITEM' && normalize(descripcion).startsWith('DESCRIPCION')) {
      readingPartidas = true;
      continue;
    }

    if (!readingPartidas || !item || !descripcion) continue;
    if (!/^\d+(\.\d+)*$/.test(item)) continue;
    if (normalize(descripcion).startsWith('COSTO DIRECTO')) break;

    const esTitulo = !unidad;
    const partida = {
      id: stablePartidaId(budgetSlug, item),
      item,
      nombre: descripcion,
      unidad,
      metrado: esTitulo ? 0 : parseNumber(row[3]),
      esTitulo,
      rendimiento: 1,
      insumos: []
    };

    partidas.push(partida);
    partidasByItem.set(item, partida);
  }

  if (apuSheet) {
    const apuRows = getRows(workbook, apuSheet, false);
    let currentPartida = null;
    let currentType = 'MT';
    let insumoIndex = 0;

    for (const row of apuRows) {
      const col0 = text(row[0]);
      const col1 = text(row[1]);

      if (normalize(col0) === 'PARTIDA') {
        const item = (col1.match(/^\d+(?:\.\d+)*/) || [''])[0];
        currentPartida = partidasByItem.get(item) || null;
        currentType = 'MT';
        continue;
      }

      if (!currentPartida) continue;

      const rendimientoText = [col0, col1].join(' ');
      const rendimientoMatch = rendimientoText.match(/\/DIA\s+([\d.,]+)/i);
      if (rendimientoMatch) {
        currentPartida.rendimiento = parseNumber(rendimientoMatch[1]) || currentPartida.rendimiento || 1;
      }

      if (!col0 && col1) {
        const category = RESOURCE_TYPE_BY_LABEL.find(([label]) => normalize(col1).includes(label));
        if (category) {
          currentType = category[1];
          continue;
        }
      }

      if (!/^\d+$/.test(col0) || normalize(col1).startsWith('DESCRIPCION RECURSO')) continue;

      const codigoInsumo = col0;
      const nombreInsumo = col1;
      const unidad = text(row[2]).toUpperCase();
      const cuadrilla = parseNumber(row[3]);
      const cantidad = parseNumber(row[4]);
      const pu = parseNumber(row[5]);
      const parcial = parseNumber(row[6]);

      currentPartida.insumos.push({
        id: stableInsumoId(budgetSlug, currentPartida.item, codigoInsumo, insumoIndex),
        codigo: codigoInsumo,
        nombre: nombreInsumo,
        unidad,
        cuadrilla,
        cantidad,
        pu,
        parcial,
        tipo: currentType
      });
      insumoIndex += 1;
    }
  }

  return {
    id: `b_${budgetSlug}`,
    codigo,
    subPresupuestoCodigo,
    nombre,
    cliente,
    fechaBase,
    grupo: 'TODOS LOS PRESUPUESTOS',
    categoria: 'Recientes',
    direccion: lugar,
    distrito: lugarParts[2] || lugarParts[0] || '',
    provincia: lugarParts[1] || '',
    departamento: lugarParts[0] || '',
    jornada: 8,
    moneda: 'SOLES',
    subPresupuestos: [subPresupuestoNombre],
    partidas,
    importedFrom: fileName
  };
}

function findExistingDoc(existingDocs, budget) {
  const targetName = normalize(budget.nombre);
  const exact = existingDocs.find((entry) => normalize(entry.data.nombre) === targetName);
  if (exact) return exact;

  const imported = existingDocs.find((entry) => normalize(entry.data.importedFrom) === normalize(budget.importedFrom));
  if (imported) return imported;

  return null;
}

async function main() {
  const [{ initializeApp }, firestoreLite] = await Promise.all([
    import('firebase/app'),
    import('firebase/firestore/lite')
  ]);
  const { getFirestore, collection, getDocs, doc, setDoc } = firestoreLite;

  const files = fs
    .readdirSync(PRESUPUESTOS_DIR)
    .filter((file) => file.toLowerCase().endsWith('.xlsx'))
    .sort();

  if (files.length === 0) {
    throw new Error(`No se encontraron archivos Excel en ${PRESUPUESTOS_DIR}`);
  }

  const budgets = files.map(parseBudgetFromWorkbook);
  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);
  const snapshot = await getDocs(collection(db, 'budgets'));
  const existingDocs = snapshot.docs.map((snap) => ({
    id: snap.id,
    data: snap.data()
  }));

  const now = Date.now();
  for (const budget of budgets) {
    const match = findExistingDoc(existingDocs, budget);
    const id = match?.id || budget.id;
    const oldData = match?.data || {};
    const nextBudget = {
      ...oldData,
      ...budget,
      id,
      ownerId: oldData.ownerId || 'system_excel_import',
      permissions: oldData.permissions || {},
      linkAccess: oldData.linkAccess || 'RESTRICTED',
      linkRole: oldData.linkRole || 'VIEWER',
      createdAt: oldData.createdAt || now,
      updatedAt: now
    };

    await setDoc(doc(db, 'budgets', id), nextBudget);
    const insumos = budget.partidas.reduce((total, partida) => total + partida.insumos.length, 0);
    console.log(`${id}: ${budget.nombre} -> ${budget.partidas.length} partidas, ${insumos} insumos, fecha ${budget.fechaBase}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
