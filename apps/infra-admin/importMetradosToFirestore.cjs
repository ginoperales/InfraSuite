const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

const PRESUPUESTOS_DIR = path.resolve(__dirname, '../../Presupuestos');
const TARGET_FILES = [
  'METRADO C. LAS AMERICAS.xlsm',
  'METRADOS 11  DE AGOSTO.xls'
];

const firebaseConfig = {
  apiKey: 'AIzaSyCas8jIgsWV_hRnWcZiPMjBdvcRVtoh6EU',
  authDomain: 'infrasuitee.firebaseapp.com',
  projectId: 'infrasuitee',
  storageBucket: 'infrasuitee.firebasestorage.app',
  messagingSenderId: '126902185835',
  appId: '1:126902185835:web:fca0a2a231b8a531efa62e',
  measurementId: 'G-TVELJV85F1'
};

const DEFAULT_PIE_ROWS = [
  { variable: 'CD', descripcion: 'COSTO DIRECTO', formula: '', iu: '', resaltar: true, ocultarEnPdf: false },
  { variable: 'GG', descripcion: 'GASTOS GENERALES 10%', formula: 'CD * 0.10', iu: '39', resaltar: false, ocultarEnPdf: false },
  { variable: 'UTI', descripcion: 'UTILIDAD 10%', formula: 'CD * 0.10', iu: '39', resaltar: false, ocultarEnPdf: false },
  { variable: 'ST', descripcion: 'SUB TOTAL', formula: 'CD + GG + UTI', iu: '', resaltar: true, ocultarEnPdf: false },
  { variable: 'IGV', descripcion: 'IGV 18%', formula: 'ST * 0.18', iu: '', resaltar: false, ocultarEnPdf: false },
  { variable: 'TOTAL', descripcion: 'TOTAL PRESUPUESTO', formula: 'ST + IGV', iu: '', resaltar: true, ocultarEnPdf: false }
];

const BUDGET_ID_BY_FILE = {
  'METRADO C. LAS AMERICAS.xlsm': 'b_las_americas_metrados',
  'METRADOS 11  DE AGOSTO.xls': 'b_11_de_agosto_metrados'
};

const MONTHS = new Map([
  ['ENERO', '01'],
  ['FEBRERO', '02'],
  ['MARZO', '03'],
  ['ABRIL', '04'],
  ['MAYO', '05'],
  ['JUNIO', '06'],
  ['JULIO', '07'],
  ['AGOSTO', '08'],
  ['SETIEMBRE', '09'],
  ['SEPTIEMBRE', '09'],
  ['OCTUBRE', '10'],
  ['NOVIEMBRE', '11'],
  ['DICIEMBRE', '12']
]);

function normalize(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toUpperCase();
}

function text(value) {
  return String(value ?? '').replace(/\s+/g, ' ').trim();
}

function slug(value) {
  return normalize(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 110);
}

function parseNumber(value) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  let raw = text(value);
  if (!raw) return 0;

  const isNegative = /^\(.*\)$/.test(raw);
  raw = raw
    .replace(/^\(|\)$/g, '')
    .replace(/S\/\.?/gi, '')
    .replace(/[^\d,.-]/g, '');

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

function parseSpanishDate(rawValue) {
  if (typeof rawValue === 'number') {
    const parsed = XLSX.SSF.parse_date_code(rawValue);
    if (parsed) {
      return `${parsed.y}-${String(parsed.m).padStart(2, '0')}-${String(parsed.d).padStart(2, '0')}`;
    }
  }

  const raw = text(rawValue);
  const normalized = normalize(raw);
  const numericMatch = normalized.match(/(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})/);
  if (numericMatch) {
    const day = numericMatch[1].padStart(2, '0');
    const month = numericMatch[2].padStart(2, '0');
    const year = numericMatch[3].length === 2 ? `20${numericMatch[3]}` : numericMatch[3];
    return `${year}-${month}-${day}`;
  }

  for (const [monthName, month] of MONTHS) {
    if (normalized.includes(monthName)) {
      const yearMatch = normalized.match(/\b(20\d{2}|19\d{2})\b/);
      const year = yearMatch ? yearMatch[1] : String(new Date().getFullYear());
      return `${year}-${month}-01`;
    }
  }

  return new Date().toISOString().slice(0, 10);
}

function findSheetName(workbook) {
  const preferred = workbook.SheetNames.find((name) => normalize(name) === 'RESUMEN');
  if (preferred) return preferred;

  return workbook.SheetNames.find((name) => {
    const normalized = normalize(name);
    return normalized.includes('METRADO') || normalized.includes('METRADOS');
  });
}

function rowsFromSheet(workbook, sheetName, raw = false) {
  return XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], {
    header: 1,
    defval: '',
    raw
  });
}

function findHeader(rows) {
  for (let rowIndex = 0; rowIndex < rows.length; rowIndex += 1) {
    const row = rows[rowIndex];
    const normalized = row.map(normalize);
    const itemCol = normalized.findIndex((value) => value === 'ITEM');
    const descCol = normalized.findIndex((value) => value.includes('DESCRIPCION') || value.includes('PARTIDAS'));
    const unidadCol = normalized.findIndex((value) => value === 'UND' || value === 'UNIDAD');
    const totalCol = normalized.findIndex((value, index) => index > unidadCol && value === 'TOTAL');

    if (itemCol !== -1 && descCol !== -1 && unidadCol !== -1 && totalCol !== -1) {
      return { rowIndex, itemCol, descCol, unidadCol, totalCol };
    }
  }

  throw new Error('No se encontro encabezado ITEM/DESCRIPCION/UND/TOTAL.');
}

function findValueAfterLabel(rows, labels) {
  for (const row of rows) {
    for (let col = 0; col < row.length; col += 1) {
      const value = normalize(row[col]);
      if (!labels.some((label) => value.includes(label))) continue;

      for (let nextCol = col + 1; nextCol < row.length; nextCol += 1) {
        const candidate = text(row[nextCol]);
        if (candidate) return candidate;
      }
    }
  }

  return '';
}

function parseLocation(projectName) {
  const locationMatch = projectName.match(/DISTRITO\s+DE\s+(.+?)\s*-\s*([^-]+?)\s*-\s*([^-]+)/i);
  const addressMatch = projectName.match(/CENTRO\s+POBLADO\s+(.+?),\s*DISTRITO/i);

  return {
    direccion: addressMatch ? text(addressMatch[1]) : 'NN',
    distrito: locationMatch ? text(locationMatch[1]) : 'YARINACOCHA',
    provincia: locationMatch ? text(locationMatch[2]) : 'CORONEL PORTILLO',
    departamento: locationMatch ? text(locationMatch[3]) : 'UCAYALI'
  };
}

function isItemCode(value) {
  return /^\d+(?:\.\d+)*$/.test(text(value));
}

function makePartidaId(budgetSlug, item, rowNumber) {
  return `p_${budgetSlug}_${slug(item)}_${rowNumber}`;
}

function getNextGeneratedItem(parentItem, counters) {
  const parent = parentItem || '';
  const next = (counters.get(parent) || 0) + 1;
  counters.set(parent, next);
  const suffix = String(next).padStart(2, '0');
  return parent ? `${parent}.${suffix}` : suffix;
}

function parsePartidas(rows, header, budgetSlug) {
  const partidas = [];
  const generatedCounters = new Map();
  let currentTitleItem = null;

  for (let index = header.rowIndex + 1; index < rows.length; index += 1) {
    const row = rows[index];
    const rawItem = text(row[header.itemCol]);
    const description = text(row[header.descCol]);
    const unidad = text(row[header.unidadCol]).toUpperCase();
    const rowNumber = index + 1;

    if (!description) continue;

    let item = '';
    let esTitulo = false;

    if (isItemCode(rawItem)) {
      item = rawItem;
      esTitulo = !unidad;
    } else if (!rawItem) {
      if (!unidad) {
        const nextRow = rows[index + 1] || [];
        const nextHasPartidaWithoutItem = !text(nextRow[header.itemCol]) &&
          text(nextRow[header.descCol]) &&
          text(nextRow[header.unidadCol]);

        if (!nextHasPartidaWithoutItem) continue;

        item = getNextGeneratedItem(currentTitleItem, generatedCounters);
        esTitulo = true;
      } else {
        item = getNextGeneratedItem(currentTitleItem, generatedCounters);
        esTitulo = false;
      }
    } else {
      continue;
    }

    const partida = {
      id: makePartidaId(budgetSlug, item, rowNumber),
      item,
      nombre: description,
      unidad: esTitulo ? '' : unidad,
      metrado: esTitulo ? 0 : parseNumber(row[header.totalCol]),
      esTitulo,
      rendimiento: 1,
      isImported: true,
      importedFrom: 'Excel de metrados',
      insumos: []
    };

    partidas.push(partida);
    if (esTitulo) currentTitleItem = item;
  }

  return partidas;
}

function parseBudgetFromWorkbook(fileName) {
  const filePath = path.join(PRESUPUESTOS_DIR, fileName);
  const workbook = XLSX.readFile(filePath);
  const sheetName = findSheetName(workbook);

  if (!sheetName) {
    throw new Error(`No se encontro hoja de metrados en ${fileName}`);
  }

  const rows = rowsFromSheet(workbook, sheetName, false);
  const rawRows = rowsFromSheet(workbook, sheetName, true);
  const header = findHeader(rows);
  const projectName = findValueAfterLabel(rows, ['PROYECTO', 'ACTIVIDAD']) ||
    path.basename(fileName, path.extname(fileName));
  const cliente = findValueAfterLabel(rows, ['PROPIETARIO', 'CLIENTE']) || 'Sin cliente asignado';
  const fechaLabel = findValueAfterLabel(rawRows, ['FECHA']) || findValueAfterLabel(rows, ['FECHA']);
  const location = parseLocation(projectName);
  const budgetSlug = slug(BUDGET_ID_BY_FILE[fileName] || projectName);
  const partidas = parsePartidas(rows, header, budgetSlug).map((partida) => ({
    ...partida,
    importedFrom: fileName
  }));

  return {
    id: BUDGET_ID_BY_FILE[fileName] || `b_${budgetSlug}`,
    nombre: projectName,
    cliente,
    fechaBase: parseSpanishDate(fechaLabel),
    grupo: 'SANEAMIENTO',
    categoria: 'Recientes',
    direccion: location.direccion,
    distrito: location.distrito,
    provincia: location.provincia,
    departamento: location.departamento,
    jornada: 8,
    moneda: 'SOLES',
    subPresupuestos: [text(findValueAfterLabel(rows, ['MODULO'])) || 'SUB PRESUPUESTO 1'],
    pieRows: DEFAULT_PIE_ROWS,
    partidas,
    importedFrom: fileName,
    importedSheet: sheetName,
    importStage: 'METRADOS'
  };
}

function findExistingDoc(existingDocs, budget) {
  const targetName = normalize(budget.nombre);
  const exactById = existingDocs.find((entry) => entry.id === budget.id);
  if (exactById) return exactById;

  const exactByName = existingDocs.find((entry) => normalize(entry.data.nombre) === targetName);
  if (exactByName) return exactByName;

  return existingDocs.find((entry) => normalize(entry.data.importedFrom) === normalize(budget.importedFrom)) || null;
}

function printSummary(budget) {
  const titles = budget.partidas.filter((partida) => partida.esTitulo).length;
  const metrados = budget.partidas.filter((partida) => !partida.esTitulo).length;
  console.log(`${budget.id}`);
  console.log(`  ${budget.nombre}`);
  console.log(`  Hoja: ${budget.importedSheet}`);
  console.log(`  Fecha base: ${budget.fechaBase}`);
  console.log(`  Items: ${budget.partidas.length} (${titles} titulos, ${metrados} metrados)`);
  console.log('  Primeros items:');
  budget.partidas.slice(0, 8).forEach((partida) => {
    const metrado = partida.esTitulo ? '' : ` | ${partida.unidad} | ${partida.metrado}`;
    console.log(`    ${partida.item} ${partida.nombre}${metrado}`);
  });
}

async function uploadBudgets(budgets) {
  const [{ initializeApp }, firestoreLite] = await Promise.all([
    import('firebase/app'),
    import('firebase/firestore/lite')
  ]);
  const { getFirestore, collection, getDocs, doc, setDoc } = firestoreLite;
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
      ownerId: oldData.ownerId || 'system_metrado_import',
      permissions: oldData.permissions || {},
      linkAccess: oldData.linkAccess || 'RESTRICTED',
      linkRole: oldData.linkRole || 'VIEWER',
      createdAt: oldData.createdAt || now,
      updatedAt: now
    };

    await setDoc(doc(db, 'budgets', id), nextBudget);
    console.log(`Subido ${id}: ${budget.partidas.length} items desde ${budget.importedFrom}`);
  }
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const missingFiles = TARGET_FILES.filter((file) => !fs.existsSync(path.join(PRESUPUESTOS_DIR, file)));
  if (missingFiles.length > 0) {
    throw new Error(`No se encontraron estos archivos: ${missingFiles.join(', ')}`);
  }

  const budgets = TARGET_FILES.map(parseBudgetFromWorkbook);
  budgets.forEach(printSummary);

  if (dryRun) {
    console.log('Vista previa completada. No se escribio en Firestore.');
    return;
  }

  await uploadBudgets(budgets);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
