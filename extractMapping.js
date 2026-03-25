const fs = require("fs");
const data = require('./dvhc_parsed.json');

const mapping = [];

data.forEach((row, index) => {
    // Check if it's a data row (has STT as number)
    const stt = parseInt(row[0]);
    if (!isNaN(stt) && stt > 0) {
        const type = row[1]; // Phường, Xã, Đặc khu
        const name = row[2]; // Tên đơn vị
        const fullName = row[3]; // Tên đầy đủ
        const from = row[4]; // Sáp nhập / Hình thành từ
        const oldHuyen = row[5]; // Đơn vị hành chính cấp huyện (cũ)

        if (fullName && oldHuyen) {
            mapping.push({
                newFullName: fullName,
                from: from,
                oldHuyen: oldHuyen.trim()
            });
        }
    }
});

fs.writeFileSync('e:/WEB/TOA_AN/mapping_full.json', JSON.stringify(mapping, null, 2));
console.log("Wrote mapping to mapping_full.json");
