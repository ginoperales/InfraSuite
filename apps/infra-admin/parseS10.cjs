const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const dir = '../../Presupuestos';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.xlsx'));

const budgets = [];

for (const file of files) {
  const filePath = path.join(dir, file);
  const workbook = XLSX.readFile(filePath);

  // 1. Parse Presupuesto sheet (Datos Generales + Partidas structure)
  const sheetPresup = workbook.Sheets['Presupuesto'];
  const dataPresup = XLSX.utils.sheet_to_json(sheetPresup, { header: 1 });

  let nombre = dataPresup[2] && dataPresup[2][2] ? dataPresup[2][2].trim() : 'PRESUPUESTO';
  let cliente = dataPresup[4] && dataPresup[4][2] ? dataPresup[4][2].trim() : 'Sin Cliente';
  let fechaBase = dataPresup[4] && dataPresup[4][5] ? String(dataPresup[4][5]) : new Date().toISOString().split('T')[0];
  
  if (fechaBase.includes('/')) {
    const parts = fechaBase.split('/');
    if (parts.length === 3) fechaBase = `${parts[2]}-${parts[1]}-${parts[0]}`; // DD/MM/YYYY to YYYY-MM-DD
  }

  const partidas = [];
  let readingPartidas = false;

  for (let i = 0; i < dataPresup.length; i++) {
    const row = dataPresup[i];
    if (row.length === 0) continue;
    if (row[0] === 'Item' && row[1] === 'Descripción') {
      readingPartidas = true;
      continue;
    }
    if (readingPartidas) {
      if (!row[0] || !row[1]) continue;
      const item = String(row[0]).trim();
      const descripcion = String(row[1]).trim();
      const und = row[2] ? String(row[2]).trim() : '';
      const metrado = row[3] ? parseFloat(row[3]) : 0;
      
      const esTitulo = !row[2] || row[2] === '';
      
      partidas.push({
        id: 'p_' + Math.random().toString(36).substring(2, 9),
        item: item,
        nombre: descripcion,
        unidad: und,
        metrado: esTitulo ? 0 : metrado,
        esTitulo: esTitulo,
        rendimiento: 1, // Will be updated from APU
        insumos: []
      });
    }
  }

  // 2. Parse APU sheet
  const sheetApu = workbook.Sheets['Análisis Precios Unitarios'];
  if (sheetApu) {
    const dataApu = XLSX.utils.sheet_to_json(sheetApu, { header: 1 });
    let currentPartida = null;
    let currentCategory = 'MO'; // MO, MT, EQ, SC, SP
    
    for (let i = 0; i < dataApu.length; i++) {
      const row = dataApu[i];
      if (row.length === 0) continue;

      if (row[0] === 'Partida') {
        const itemDesc = String(row[1]);
        const item = itemDesc.split(' ')[0].trim();
        currentPartida = partidas.find(p => p.item === item);
        continue;
      }
      
      if (currentPartida && row[1] && String(row[1]).includes('/DIA')) {
        // extract rendimiento
        const match = String(row[1]).match(/DIA\s+([\d.]+)/);
        if (match) {
          currentPartida.rendimiento = parseFloat(match[1]);
        }
      }

      if (currentPartida && !row[0] && row[1] && typeof row[1] === 'string') {
        const cat = row[1].toUpperCase();
        if (cat.includes('MANO DE OBRA')) currentCategory = 'MO';
        else if (cat.includes('MATERIALES')) currentCategory = 'MT';
        else if (cat.includes('EQUIPOS') || cat.includes('EQUIPO')) currentCategory = 'EQ';
        else if (cat.includes('SUBCONTRATOS')) currentCategory = 'SC';
        else if (cat.includes('SUBPARTIDAS')) currentCategory = 'SP';
      }

      // Check if it's an insumo row (starts with Code like "0147...")
      if (currentPartida && row[0] && typeof row[0] === 'string' && row[0].match(/^\d+$/)) {
        if (row[1] && row[1] !== 'Descripción Recurso') { // valid insumo
          const desc = String(row[1]).trim();
          const und = String(row[2] || '').trim().toUpperCase();
          const cuadrilla = row[3] ? parseFloat(row[3]) : 0;
          const cantidad = row[4] ? parseFloat(row[4]) : 0;
          const pu = row[5] ? parseFloat(row[5]) : 0;
          
          currentPartida.insumos.push({
            id: 'i_' + Math.random().toString(36).substring(2, 9),
            nombre: desc,
            unidad: und,
            cuadrilla: cuadrilla,
            cantidad: cantidad,
            pu: pu,
            tipo: currentCategory
          });
        }
      }
    }
  }

  budgets.push({
    id: 'b_' + Math.random().toString(36).substring(2, 9),
    nombre: nombre,
    cliente: cliente,
    fechaBase: fechaBase,
    grupo: 'TODOS LOS PRESUPUESTOS', // Default
    categoria: 'Recientes',
    direccion: 'NN',
    distrito: 'NN',
    provincia: 'NN',
    departamento: 'NN',
    jornada: 8,
    moneda: 'SOLES',
    subPresupuestos: ['SUB PRESUPUESTO 1'],
    partidas: partidas,
    updatedAt: Date.now()
  });
}

fs.writeFileSync('seedBudgets.json', JSON.stringify(budgets, null, 2));
console.log('Successfully generated seedBudgets.json with', budgets.length, 'budgets');
