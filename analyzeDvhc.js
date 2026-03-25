const data = require('./dvhc_parsed.json');

const results = [];
data.forEach(row => {
    if (row && row[0] && typeof row[0] === 'string' && row[0].includes('ĐẶC KHU')) {
        results.push(row);
    }
    if (row && row[1] === 'Đặc khu') {
        results.push(row);
    }
});

console.log("Đặc khu rows:", JSON.stringify(results, null, 2));

const allCaphuyen = new Set();
data.forEach(row => {
    if (row && row[5] && typeof row[5] === 'string' && row[5].includes('(cũ)')) {
        allCaphuyen.add(row[5]);
    }
});
console.log("All old districs (cấp huyện cũ):", Array.from(allCaphuyen));
