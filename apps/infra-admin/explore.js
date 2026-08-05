import * as XLSX from 'xlsx';
import * as fs from 'fs';

const filePath = '../../Presupuestos/PRESUPUESTO_APU_INSUMOS_CC.NN._NUEVO_SAN_JUAN.xlsx';
const buf = fs.readFileSync(filePath);
const workbook = XLSX.read(buf, { type: 'buffer' });

console.log('Sheet Names:', workbook.SheetNames);

for (const sheetName of workbook.SheetNames) {
  console.log(`\n--- Sheet: ${sheetName} ---`);
  const sheet = workbook.Sheets[sheetName];
  const json = XLSX.utils.sheet_to_json(sheet, { header: 1 });
  console.log('First 15 rows:');
  console.log(JSON.stringify(json.slice(0, 15), null, 2));
}
