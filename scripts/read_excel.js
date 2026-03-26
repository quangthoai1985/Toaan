const xlsx = require('xlsx');
const wb = xlsx.readFile('DVHC.xlsx');
const sheet = wb.Sheets[wb.SheetNames[0]];
const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });
if (data.length > 0) {
    console.log("First 15 rows:");
    data.slice(0, 15).forEach((row, i) => console.log(`${i}:`, row));
}
