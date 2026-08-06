const fs = require('fs');
const path = require('path');

const PRESUPUESTOS_DIR = path.resolve(__dirname, '../../Presupuestos');
const TARGET_BUDGET_ID = 'b_11_de_agosto_metrados';

const PDF_FILES = {
  presupuesto: 'PRESUPUESTO_PLAN_DE_MANTENIMIENTO_CORRECTIVO__REPARACION__OPERACION__INSTALACION__DEL_SISTEMA_DE_AGUA_EN_EL_CENTRO_POBLADO_CASERIO_11_DE_AGOSTO__DISTRITO_DE_YARINACOCHA___CORONEL_PORTILLO___UCAYALI.pdf',
  apu: 'APU_PLAN_DE_MANTENIMIENTO_CORRECTIVO__REPARACION__OPERACION__INSTALACION__DEL_SISTEMA_DE_AGUA_EN_EL_CENTRO_POBLADO_CASERIO_11_DE_AGOSTO__DISTRITO_DE_YARINACOCHA___CORONEL_PORTILLO___UCAYALI.pdf',
  insumos: 'INSUMOS_PLAN_DE_MANTENIMIENTO_CORRECTIVO__REPARACION__OPERACION__INSTALACION__DEL_SISTEMA_DE_AGUA_EN_EL_CENTRO_POBLADO_CASERIO_11_DE_AGOSTO__DISTRITO_DE_YARINACOCHA___CORONEL_PORTILLO___UCAYALI.pdf'
};

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

const CATEGORY_TO_TYPE = new Map([
  ['MANO DE OBRA', 'MO'],
  ['MATERIALES', 'MT'],
  ['EQUIPOS', 'EQ'],
  ['EQUIPO', 'EQ'],
  ['SUBCONTRATOS', 'SC'],
  ['SUBPARTIDAS', 'SP']
]);

const KNOWN_UNITS = new Set([
  '%MO', 'BOL', 'DIA', 'GLB', 'GLN', 'HE', 'HH', 'HM', 'KG', 'M', 'M2', 'M3',
  'ML', 'PAR', 'PZA', 'UND'
]);

const HEADER_WORDS = new Set([
  'INFRACOST', 'PAGINA :', 'ANALISIS DE PRECIOS UNITARIOS', 'PRESUPUESTO',
  'SUBPRESUPUESTO', 'CLIENTE', 'LUGAR', 'COSTO AL', 'CODIGO',
  'DESCRIPCION RECURSO', 'UNIDAD', 'CUADRILLA', 'CANTIDAD', 'PRECIO S/',
  'PARCIAL S/'
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
  const raw = text(value).replace(/,/g, '');
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : 0;
}

function round2(value) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function unescapePdfText(value) {
  return value.replace(/\\([nrtbf()\\])/g, (_match, char) => ({
    n: '\n',
    r: '\r',
    t: '\t',
    b: '\b',
    f: '\f',
    '(': '(',
    ')': ')',
    '\\': '\\'
  }[char] || char));
}

function extractPdfTextItems(filePath) {
  const raw = fs.readFileSync(filePath, 'latin1');
  const items = [];
  const matcher = /\((?:\\.|[^\\)])*\)\s*Tj/g;
  let match;

  while ((match = matcher.exec(raw))) {
    const wrapped = match[0].match(/^\((.*)\)\s*Tj$/s);
    if (wrapped) items.push(unescapePdfText(wrapped[1]));
  }

  return items;
}

function isItemCode(value) {
  return /^\d+(?:\.\d+)*$/.test(text(value));
}

function isNumberText(value) {
  return /^-?\d{1,3}(?:,\d{3})*(?:\.\d+)?$|^-?\d+(?:\.\d+)?$/.test(text(value));
}

function isUnit(value) {
  return KNOWN_UNITS.has(text(value).toUpperCase());
}

function stablePartidaId(item) {
  return `p_11_de_agosto_${slug(item)}`;
}

function stableInsumoId(item, code, index) {
  return `i_11_de_agosto_${slug(item)}_${slug(code)}_${index}`;
}

function normalizeCode(code) {
  const clean = text(code).toUpperCase();
  if (/^\d+$/.test(clean) && clean.length < 10) return clean.padStart(10, '0');
  return clean;
}

function parsePresupuestoPdf() {
  const items = extractPdfTextItems(path.join(PRESUPUESTOS_DIR, PDF_FILES.presupuesto));
  const endIndex = items.findIndex((value) => normalize(value) === 'INFRACOST');
  const rows = items.slice(6, endIndex === -1 ? items.length : endIndex);
  const partidas = [];
  const pricesByItem = new Map();
  const partialsByItem = new Map();
  let i = 0;

  while (i < rows.length) {
    const item = text(rows[i]);
    if (!isItemCode(item)) {
      i += 1;
      continue;
    }

    i += 1;
    const nameParts = [];
    while (i < rows.length && !isUnit(rows[i]) && !isNumberText(rows[i]) && !isItemCode(rows[i])) {
      nameParts.push(text(rows[i]));
      i += 1;
    }

    const nombre = nameParts.join(' ');
    if (!nombre) continue;

    if (i < rows.length && isUnit(rows[i])) {
      const unidad = text(rows[i]).toUpperCase();
      const metrado = parseNumber(rows[i + 1]);
      const precio = parseNumber(rows[i + 2]);
      const parcial = parseNumber(rows[i + 3]);
      partidas.push({
        id: stablePartidaId(item),
        item,
        nombre,
        unidad,
        metrado,
        esTitulo: false,
        rendimiento: 1,
        insumos: []
      });
      pricesByItem.set(item, precio);
      partialsByItem.set(item, parcial);
      i += 4;
    } else {
      partidas.push({
        id: stablePartidaId(item),
        item,
        nombre,
        unidad: '',
        metrado: 0,
        esTitulo: true,
        rendimiento: 1,
        insumos: []
      });
      if (i < rows.length && isNumberText(rows[i])) i += 1;
    }
  }

  const totalIndex = items.findIndex((value) => normalize(value) === 'COSTO DIRECTO');
  const costoDirecto = totalIndex >= 0 ? parseNumber(items[totalIndex + 1]) : 0;

  return { partidas, pricesByItem, partialsByItem, costoDirecto };
}

function getCategoryType(value) {
  const normalized = normalize(value);
  for (const [label, type] of CATEGORY_TO_TYPE) {
    if (normalized === label) return type;
  }
  return null;
}

function isIgnorableApuText(value) {
  const normalized = normalize(value);
  if (!normalized) return true;
  if (HEADER_WORDS.has(normalized)) return true;
  if (/^\d+$/.test(normalized) && Number(normalized) <= 999) return true;
  if (normalized === '11' || normalized === '001') return true;
  if (normalized.startsWith('PLAN DE MANTENIMIENTO CORRECTIVO')) return true;
  if (normalized.startsWith('SISTEMA DE AGUA EN EL CENTRO POBLADO')) return true;
  if (normalized === 'YARINACOCHA - CORONEL PORTILLO - UCAYALI') return true;
  if (normalized === 'SUB PRESUPUESTO 1') return true;
  if (normalized === 'MUNICIPALIDAD DISTRITAL DE YARINACOCHA') return true;
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(normalized)) return true;
  return false;
}

function parseApuResource(block, startIndex, currentType, item, resourceIndex) {
  const code = normalizeCode(block[startIndex]);
  let cursor = startIndex + 1;
  const nameParts = [];

  while (cursor < block.length && !isUnit(block[cursor])) {
    if (!isIgnorableApuText(block[cursor]) && !getCategoryType(block[cursor]) && !isItemCode(block[cursor])) {
      nameParts.push(text(block[cursor]));
    }
    cursor += 1;
  }

  if (cursor >= block.length || nameParts.length === 0) return null;

  const unidad = text(block[cursor]).toUpperCase();
  cursor += 1;
  const nums = [];
  const expectedNumberCount = currentType === 'MO' && unidad !== '%MO' ? 4 : 3;

  while (cursor < block.length && nums.length < expectedNumberCount) {
    const value = block[cursor];
    if (isNumberText(value)) {
      nums.push(parseNumber(value));
      cursor += 1;
      continue;
    }

    if (!text(value)) {
      cursor += 1;
      continue;
    }

    break;
  }

  if (nums.length < 3) return null;

  const hasCuadrillaColumn = expectedNumberCount === 4 && nums.length >= 4;
  const cantidad = hasCuadrillaColumn ? nums[1] : nums[0];
  const cuadrilla = hasCuadrillaColumn ? nums[0] : cantidad;
  const pu = hasCuadrillaColumn ? nums[2] : nums[1];
  const parcial = hasCuadrillaColumn ? nums[3] : nums[2];

  return {
    nextIndex: cursor,
    insumo: {
      id: stableInsumoId(item, code, resourceIndex),
      codigo: code,
      nombre: nameParts.join(' '),
      unidad,
      cuadrilla,
      cantidad,
      desperdicio: currentType === 'MT' ? 0 : undefined,
      pu,
      parcial,
      tipo: currentType
    }
  };
}

function parseApuPdf(partidasByItem) {
  const items = extractPdfTextItems(path.join(PRESUPUESTOS_DIR, PDF_FILES.apu));
  const starts = [];
  items.forEach((value, index) => {
    if (normalize(value) === 'PARTIDA') starts.push(index);
  });

  const apuByItem = new Map();

  starts.forEach((start, blockIndex) => {
    const block = items.slice(start, starts[blockIndex + 1] || items.length);
    const item = text(block[1]);
    const rendimientoIndex = block.findIndex((value) => normalize(value) === 'RENDIMIENTO');
    const costIndex = block.findIndex((value) => normalize(value).startsWith('COSTO UNITARIO DIRECTO'));
    const codigoIndex = block.findIndex((value) => normalize(value) === 'CODIGO');

    if (!isItemCode(item) || rendimientoIndex < 0 || costIndex < 0 || codigoIndex < 0) return;

    const nombre = block.slice(2, rendimientoIndex).map(text).join(' ');
    const unidad = text(block[rendimientoIndex + 1]).replace(/\/DIA$/i, '').toUpperCase();
    const moRendimientoMatch = text(block[rendimientoIndex + 2]).match(/MO\.\s*([\d.,]+)/i);
    const rendimiento = moRendimientoMatch ? parseNumber(moRendimientoMatch[1]) : 1;
    const costoUnitario = parseNumber(block[costIndex + 1]);
    const insumos = [];
    let currentType = 'MT';
    let cursor = codigoIndex + 1;

    while (cursor < block.length) {
      const categoryType = getCategoryType(block[cursor]);
      if (categoryType) {
        currentType = categoryType;
        cursor += 1;
        continue;
      }

      if (/^(?:\d{6,}|I-[A-Z0-9]+)$/i.test(text(block[cursor]))) {
        const parsed = parseApuResource(block, cursor, currentType, item, insumos.length);
        if (parsed) {
          insumos.push(parsed.insumo);
          cursor = parsed.nextIndex;
          continue;
        }
      }

      cursor += 1;
    }

    apuByItem.set(item, {
      item,
      nombre,
      unidad,
      rendimiento,
      costoUnitario,
      insumos,
      existsInPresupuesto: partidasByItem.has(item)
    });
  });

  return apuByItem;
}

function parseInsumosPdf() {
  const items = extractPdfTextItems(path.join(PRESUPUESTOS_DIR, PDF_FILES.insumos));
  const resources = [];
  let currentType = null;
  let cursor = 0;

  while (cursor < items.length) {
    const categoryType = getCategoryType(items[cursor]);
    if (categoryType) {
      currentType = categoryType;
      cursor += 1;
      continue;
    }

    if (currentType && /^(?:\d{6,}|I-[A-Z0-9]+)$/i.test(text(items[cursor]))) {
      const code = normalizeCode(items[cursor]);
      const nombre = text(items[cursor + 1]);
      const unidad = text(items[cursor + 2]).toUpperCase();
      const cantidad = parseNumber(items[cursor + 3]);
      const precio = parseNumber(items[cursor + 4]);
      const parcial = parseNumber(items[cursor + 5]);
      if (nombre && isUnit(unidad) && cantidad >= 0) {
        resources.push({ codigo: code, nombre, unidad, cantidad, precio, parcial, tipo: currentType });
        cursor += 7;
        continue;
      }
    }

    cursor += 1;
  }

  return resources;
}

function isManualToolsInsumo(insumo) {
  return insumo.unidad === '%MO' || normalize(insumo.nombre).includes('HERRAMIENTAS MANUALES');
}

function getInsumoCantidad(insumo, rendimiento) {
  if (insumo.unidad === '%MO') return insumo.cantidad ?? insumo.cuadrilla;
  if (insumo.tipo === 'MO') return rendimiento > 0 ? (insumo.cuadrilla * 8) / rendimiento : 0;
  if (insumo.tipo === 'EQ') return insumo.cantidad ?? (rendimiento > 0 ? (insumo.cuadrilla * 8) / rendimiento : 0);
  return insumo.cantidad ?? insumo.cuadrilla;
}

function getPartidaUnitPrice(partida) {
  const manoObraSubtotal = partida.insumos.reduce((sum, insumo) => {
    if (insumo.tipo !== 'MO' || isManualToolsInsumo(insumo)) return sum;
    return sum + getInsumoCantidad(insumo, partida.rendimiento) * insumo.pu;
  }, 0);

  return partida.insumos.reduce((sum, insumo) => {
    const unitPrice = isManualToolsInsumo(insumo) ? manoObraSubtotal : insumo.pu;
    const parcial = isManualToolsInsumo(insumo)
      ? (unitPrice * getInsumoCantidad(insumo, partida.rendimiento)) / 100
      : getInsumoCantidad(insumo, partida.rendimiento) * unitPrice;
    return sum + parcial;
  }, 0);
}

function buildBudgetFromPdfs() {
  const presupuesto = parsePresupuestoPdf();
  const partidasByItem = new Map(presupuesto.partidas.map((partida) => [partida.item, partida]));
  const apuByItem = parseApuPdf(partidasByItem);
  const consolidatedInsumos = parseInsumosPdf();

  const partidas = presupuesto.partidas.map((partida) => {
    if (partida.esTitulo) return partida;
    const apu = apuByItem.get(partida.item);
    if (!apu) return partida;
    return {
      ...partida,
      nombre: partida.nombre || apu.nombre,
      unidad: partida.unidad || apu.unidad,
      rendimiento: apu.rendimiento || 1,
      insumos: apu.insumos
    };
  });

  const nombre = [
    'PLAN DE MANTENIMIENTO CORRECTIVO (REPARACION, OPERACION, INSTALACION) DEL',
    'SISTEMA DE AGUA EN EL CENTRO POBLADO CASERIO 11 DE AGOSTO, DISTRITO DE',
    'YARINACOCHA - CORONEL PORTILLO - UCAYALI'
  ].join(' ');

  return {
    id: TARGET_BUDGET_ID,
    codigo: '11',
    subPresupuestoCodigo: '001',
    nombre,
    cliente: 'MUNICIPALIDAD DISTRITAL DE YARINACOCHA',
    fechaBase: '2026-07-31',
    grupo: 'SANEAMIENTO',
    categoria: 'Recientes',
    direccion: 'YARINACOCHA - CORONEL PORTILLO - UCAYALI',
    distrito: 'YARINACOCHA',
    provincia: 'CORONEL PORTILLO',
    departamento: 'UCAYALI',
    jornada: 8,
    moneda: 'SOLES',
    subPresupuestos: ['SUB PRESUPUESTO 1'],
    pieRows: DEFAULT_PIE_ROWS,
    partidas,
    pdfImport: {
      sourceFiles: PDF_FILES,
      importedAt: Date.now(),
      source: 'PDF S10 InfraCost',
      stage: 'PRESUPUESTO_APU_INSUMOS'
    },
    validation: validateParsedBudget(partidas, presupuesto, apuByItem, consolidatedInsumos)
  };
}

function validateParsedBudget(partidas, presupuesto, apuByItem, consolidatedInsumos) {
  const nonTitles = partidas.filter((partida) => !partida.esTitulo);
  const titles = partidas.filter((partida) => partida.esTitulo);
  const missingApu = nonTitles.filter((partida) => !apuByItem.has(partida.item)).map((partida) => partida.item);
  const extraApu = Array.from(apuByItem.values()).filter((apu) => !apu.existsInPresupuesto).map((apu) => apu.item);
  const noInsumos = nonTitles.filter((partida) => partida.insumos.length === 0).map((partida) => partida.item);
  const totalFromPresupuestoPartials = Array.from(presupuesto.partialsByItem.values()).reduce((sum, value) => sum + value, 0);
  const totalFromCalculatedApu = nonTitles.reduce((sum, partida) => sum + getPartidaUnitPrice(partida) * partida.metrado, 0);
  const itemChecks = nonTitles.map((partida) => {
    const pdfUnitPrice = presupuesto.pricesByItem.get(partida.item) || 0;
    const apuUnitPrice = apuByItem.get(partida.item)?.costoUnitario || 0;
    const calculatedUnitPrice = getPartidaUnitPrice(partida);
    const pdfPartial = presupuesto.partialsByItem.get(partida.item) || 0;
    const calculatedPartial = calculatedUnitPrice * partida.metrado;

    return {
      item: partida.item,
      pdfUnitPrice,
      apuUnitPrice,
      calculatedUnitPrice: round2(calculatedUnitPrice),
      pdfPartial,
      calculatedPartial: round2(calculatedPartial),
      unitPriceDelta: round2(calculatedUnitPrice - pdfUnitPrice),
      partialDelta: round2(calculatedPartial - pdfPartial),
      insumos: partida.insumos.length
    };
  });

  return {
    titles: titles.length,
    partidas: nonTitles.length,
    totalItems: partidas.length,
    insumosInApu: nonTitles.reduce((sum, partida) => sum + partida.insumos.length, 0),
    consolidatedInsumos: consolidatedInsumos.length,
    costoDirectoPdf: presupuesto.costoDirecto,
    totalFromPresupuestoPartials: round2(totalFromPresupuestoPartials),
    totalFromCalculatedApu: round2(totalFromCalculatedApu),
    totalDelta: round2(totalFromCalculatedApu - presupuesto.costoDirecto),
    missingApu,
    extraApu,
    noInsumos,
    itemChecks
  };
}

function assertValidBudget(budget) {
  const validation = budget.validation;
  const largeDeltas = validation.itemChecks.filter((item) =>
    Math.abs(item.unitPriceDelta) > 0.05 || Math.abs(item.partialDelta) > 0.75
  );

  if (validation.totalItems !== 32) throw new Error(`Se esperaban 32 items y se obtuvieron ${validation.totalItems}.`);
  if (validation.titles !== 13) throw new Error(`Se esperaban 13 titulos y se obtuvieron ${validation.titles}.`);
  if (validation.partidas !== 19) throw new Error(`Se esperaban 19 partidas y se obtuvieron ${validation.partidas}.`);
  if (validation.missingApu.length) throw new Error(`Partidas sin APU: ${validation.missingApu.join(', ')}`);
  if (validation.extraApu.length) throw new Error(`APU sin partida en presupuesto: ${validation.extraApu.join(', ')}`);
  if (validation.noInsumos.length) throw new Error(`Partidas sin insumos: ${validation.noInsumos.join(', ')}`);
  if (Math.abs(validation.totalFromPresupuestoPartials - validation.costoDirectoPdf) > 0.05) {
    throw new Error(`El total del PDF no cuadra: ${validation.totalFromPresupuestoPartials} vs ${validation.costoDirectoPdf}.`);
  }
  if (Math.abs(validation.totalDelta) > 0.75) {
    throw new Error(`El total calculado desde APU difiere demasiado del PDF: delta ${validation.totalDelta}.`);
  }
  if (largeDeltas.length) {
    throw new Error(`Hay diferencias de APU fuera de tolerancia: ${largeDeltas.map((item) => `${item.item} (${item.unitPriceDelta}/${item.partialDelta})`).join(', ')}`);
  }
}

function printSummary(budget) {
  const validation = budget.validation;
  console.log(`${budget.id}: ${budget.nombre}`);
  console.log(`Items: ${validation.totalItems} (${validation.titles} titulos, ${validation.partidas} partidas)`);
  console.log(`Insumos APU: ${validation.insumosInApu}`);
  console.log(`Insumos consolidados PDF: ${validation.consolidatedInsumos}`);
  console.log(`Costo directo PDF: ${validation.costoDirectoPdf.toFixed(2)}`);
  console.log(`Total calculado desde APU: ${validation.totalFromCalculatedApu.toFixed(2)} (delta ${validation.totalDelta.toFixed(2)})`);
  console.log('Partidas:');
  budget.partidas
    .filter((partida) => !partida.esTitulo)
    .forEach((partida) => {
      const check = validation.itemChecks.find((item) => item.item === partida.item);
      console.log(`  ${partida.item} ${partida.nombre} | ${partida.unidad} | metrado ${partida.metrado} | CU ${check.calculatedUnitPrice} | insumos ${partida.insumos.length}`);
    });
}

function stripUndefined(value) {
  if (Array.isArray(value)) return value.map(stripUndefined);
  if (!value || typeof value !== 'object') return value;

  return Object.fromEntries(
    Object.entries(value)
      .filter(([, entryValue]) => entryValue !== undefined)
      .map(([key, entryValue]) => [key, stripUndefined(entryValue)])
  );
}

async function uploadBudget(budget) {
  const [{ initializeApp }, firestoreLite] = await Promise.all([
    import('firebase/app'),
    import('firebase/firestore/lite')
  ]);
  const { getFirestore, doc, getDoc, setDoc } = firestoreLite;
  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);
  const budgetRef = doc(db, 'budgets', TARGET_BUDGET_ID);
  const snapshot = await getDoc(budgetRef);
  const oldData = snapshot.exists() ? snapshot.data() : {};
  const now = Date.now();
  const nextBudget = {
    ...oldData,
    ...budget,
    id: TARGET_BUDGET_ID,
    ownerId: oldData.ownerId || 'system_pdf_import',
    permissions: oldData.permissions || {},
    linkAccess: oldData.linkAccess || 'RESTRICTED',
    linkRole: oldData.linkRole || 'VIEWER',
    createdAt: oldData.createdAt || now,
    updatedAt: now,
    pdfImport: {
      ...budget.pdfImport,
      importedAt: now
    }
  };

  const cleanBudget = stripUndefined(nextBudget);
  await setDoc(budgetRef, cleanBudget);
  return cleanBudget;
}

async function main() {
  for (const fileName of Object.values(PDF_FILES)) {
    const fullPath = path.join(PRESUPUESTOS_DIR, fileName);
    if (!fs.existsSync(fullPath)) throw new Error(`No se encontro ${fullPath}`);
  }

  const upload = process.argv.includes('--upload');
  const budget = buildBudgetFromPdfs();
  assertValidBudget(budget);
  printSummary(budget);

  if (!upload) {
    console.log('Vista previa completada. Usa --upload para escribir en Firestore.');
    return;
  }

  const uploaded = await uploadBudget(budget);
  console.log(`Subido a Firestore: ${uploaded.id}`);
  console.log(`updatedAt: ${uploaded.updatedAt} (${new Date(uploaded.updatedAt).toISOString()})`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
