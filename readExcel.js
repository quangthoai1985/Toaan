const XLSX = require("xlsx");
const fs = require("fs");

try {
  const workbook = XLSX.readFile("e:/WEB/TOA_AN/DVHC_2.xlsx");
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  // header: 1 means we get array of arrays
  const data = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: "" });
  
  fs.writeFileSync("e:/WEB/TOA_AN/dvhc_parsed.json", JSON.stringify(data, null, 2));
  console.log("Wrote dvhc_parsed.json");
} catch (e) {
  console.error("Error reading file:", e);
}
