// ExcelJS is loaded dynamically at runtime to avoid server-side bundling
// (Cloudflare Workers doesn't support Node.js APIs used by ExcelJS)

// ═══════════════════════════════════════════════════════════════════
// Color Palette
// ═══════════════════════════════════════════════════════════════════
const COLORS = {
    // Header
    headerBg: '7F1D1D',       // dark red-950
    headerText: 'FFFFFF',
    // Number row
    numBg: 'FEE2E2',          // red-100
    numText: '991B1B',         // red-800
    // Guide row
    guideBg: 'DBEAFE',        // blue-100
    guideText: '1E40AF',       // blue-800
    // Sample data odd
    sampleOddBg: 'FFFFFF',
    // Sample data even
    sampleEvenBg: 'F8FAFC',   // slate-50
    // Borders
    border: 'CBD5E1',          // slate-300
    borderHeader: '991B1B',    // red-800
    // Column colors for Hướng dẫn sheet
    colA: 'F1F5F9',   // slate-100 (STT)
    colB: 'FEF3C7',   // amber-100 (Người khởi kiện)
    colC: 'DBEAFE',   // blue-100 (Số Bản án)
    colD: 'FCE7F3',   // pink-100 (Người phải THA)
    colE: 'F3E8FF',   // purple-100 (Nghĩa vụ)
    colF: 'FEE2E2',   // red-100 (QĐ buộc THA)
    colG: 'D1FAE5',   // emerald-100 (Quá trình THA)
    colH: 'E0E7FF',   // indigo-100 (Chờ theo dõi)
    colI: 'CCFBF1',   // teal-100 (Kết quả THA)
    // Darker versions for guide headers
    colADark: '64748B',
    colBDark: 'B45309',
    colCDark: '1D4ED8',
    colDDark: 'BE185D',
    colEDark: '7E22CE',
    colFDark: 'B91C1C',
    colGDark: '047857',
    colHDark: '4338CA',
    colIDark: '0F766E',
}

const FONT_MAIN = 'Arial'

// ═══════════════════════════════════════════════════════════════════
// Helper: Standard thin border
// ═══════════════════════════════════════════════════════════════════
function thinBorder(): any {
    return {
        top: { style: 'thin', color: { argb: COLORS.border } },
        bottom: { style: 'thin', color: { argb: COLORS.border } },
        left: { style: 'thin', color: { argb: COLORS.border } },
        right: { style: 'thin', color: { argb: COLORS.border } },
    }
}

// ═══════════════════════════════════════════════════════════════════
// Helper: Apply header style to a row
// ═══════════════════════════════════════════════════════════════════
function applyHeaderStyle(row: any, colCount: number) {
    row.height = 40
    row.eachCell({ includeEmpty: true }, (cell: any, colNumber: any) => {
        if (colNumber > colCount) return
        cell.font = { name: FONT_MAIN, bold: true, size: 11, color: { argb: COLORS.headerText } }
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.headerBg } }
        cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true }
        cell.border = {
            top: { style: 'medium', color: { argb: COLORS.borderHeader } },
            bottom: { style: 'medium', color: { argb: COLORS.borderHeader } },
            left: { style: 'thin', color: { argb: COLORS.borderHeader } },
            right: { style: 'thin', color: { argb: COLORS.borderHeader } },
        }
    })
}

// ═══════════════════════════════════════════════════════════════════
// Helper: Apply number row style
// ═══════════════════════════════════════════════════════════════════
function applyNumRowStyle(row: any, colCount: number) {
    row.height = 22
    row.eachCell({ includeEmpty: true }, (cell: any, colNumber: any) => {
        if (colNumber > colCount) return
        cell.font = { name: FONT_MAIN, bold: true, size: 10, color: { argb: COLORS.numText } }
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.numBg } }
        cell.alignment = { vertical: 'middle', horizontal: 'center' }
        cell.border = thinBorder()
    })
}

// ═══════════════════════════════════════════════════════════════════
// Helper: Apply guide row style
// ═══════════════════════════════════════════════════════════════════
function applyGuideRowStyle(row: any, colCount: number) {
    row.height = 55
    row.eachCell({ includeEmpty: true }, (cell: any, colNumber: any) => {
        if (colNumber > colCount) return
        cell.font = { name: FONT_MAIN, italic: true, size: 10, color: { argb: COLORS.guideText } }
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.guideBg } }
        cell.alignment = { vertical: 'top', horizontal: 'left', wrapText: true }
        cell.border = thinBorder()
    })
}

// ═══════════════════════════════════════════════════════════════════
// Helper: Apply data row style
// ═══════════════════════════════════════════════════════════════════
function applyDataRowStyle(row: any, colCount: number, isEven: boolean) {
    row.height = 80
    row.eachCell({ includeEmpty: true }, (cell: any, colNumber: any) => {
        if (colNumber > colCount) return
        cell.font = { name: FONT_MAIN, size: 10, color: { argb: '334155' } }
        if (isEven) {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.sampleEvenBg } }
        }
        cell.alignment = { vertical: 'top', horizontal: 'left', wrapText: true }
        cell.border = thinBorder()
        // Center align STT column
        if (colNumber === 1) {
            cell.alignment = { vertical: 'middle', horizontal: 'center' }
            cell.font = { name: FONT_MAIN, size: 10, bold: true, color: { argb: '64748B' } }
        }
    })
}

// ═══════════════════════════════════════════════════════════════════
// Main: Build and Download
// ═══════════════════════════════════════════════════════════════════
export async function downloadExcelTemplate() {
    const ExcelJS = await import('exceljs')
    const wb = new ExcelJS.default.Workbook()
    wb.creator = 'Hệ thống Quản Lý Án Hành Chính'
    wb.created = new Date()

    // ─── SHEET 1: Mẫu - Đang thi hành ─────────────────────────────
    buildPendingSheet(wb)

    // ─── SHEET 2: Mẫu - Đã thi hành ──────────────────────────────
    buildCompletedSheet(wb)

    // ─── SHEET 3: Hướng dẫn ────────────────────────────────────────
    buildGuideSheet(wb)

    // ─── Export & Download ─────────────────────────────────────────
    const buffer = await wb.xlsx.writeBuffer()
    const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'Mau_Import_An_Hanh_Chinh.xlsx'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
}

// ═══════════════════════════════════════════════════════════════════
// SHEET 1: Đang thi hành (PENDING)
// ═══════════════════════════════════════════════════════════════════
function buildPendingSheet(wb: any) {
    const ws = wb.addWorksheet('Mẫu - Đang thi hành', {
        properties: { tabColor: { argb: 'F59E0B' } },
        views: [{ state: 'frozen', ySplit: 3, activeCell: 'A4' }],
    })

    const COL_COUNT = 7
    ws.columns = [
        { width: 7 },   // A: STT
        { width: 28 },  // B: Người khởi kiện
        { width: 48 },  // C: Số Bản án
        { width: 30 },  // D: Người phải thi hành
        { width: 45 },  // E: Nghĩa vụ
        { width: 45 },  // F: QĐ buộc THA
        { width: 55 },  // G: Quá trình THA
    ]

    // Row 1: Headers
    const headerRow = ws.addRow([
        'STT',
        'Người khởi kiện',
        'Số Bản án\n(Quyết định phải Thi hành án)',
        'Người phải thi hành',
        'Nghĩa vụ phải\nThi hành án',
        'QĐ buộc\nThi hành án',
        'Quá trình\nThi hành án',
    ])
    applyHeaderStyle(headerRow, COL_COUNT)

    // Row 2: Number row
    const numRow = ws.addRow([1, 2, 3, 4, 5, 6, 7])
    applyNumRowStyle(numRow, COL_COUNT)

    // Row 3: Guide row
    const guideRow = ws.addRow([
        '(Số TT)',
        'Họ tên người khởi kiện.\nNhiều người: mỗi dòng 1 tên (Alt+Enter)',
        'Format: [Số QĐ] ngày [dd/mm/yyyy] của [Cơ quan]\nNhiều QĐ ngăn cách bằng dấu ;',
        'Tên cơ quan/cá nhân phải thi hành.\nVD: UBND huyện Châu Thành',
        'Mô tả chi tiết nội dung nghĩa vụ phải thi hành',
        'Format giống cột C.\nNhiều QĐ ngăn cách bằng dấu ;',
        'Mỗi mốc tiến độ 1 dòng (Alt+Enter).\nBắt đầu bằng ngày dd/mm/yyyy',
    ])
    applyGuideRowStyle(guideRow, COL_COUNT)

    // Row 4-5: Sample data
    const sample1 = ws.addRow([
        1,
        'Nguyễn Văn An',
        '01/2024/HC-ST ngày 15/03/2024 của TAND tỉnh An Giang',
        'UBND huyện Châu Thành',
        'Hủy Quyết định số 123/QĐ-UBND ngày 05/01/2024 của UBND huyện Châu Thành về việc thu hồi đất',
        'QĐ số 05/QĐ-CCTHA ngày 20/04/2024 của Chi cục THADS huyện Châu Thành',
        '20/04/2024 Đã tống đạt QĐ buộc THA cho UBND huyện\n15/05/2024 Đã làm việc với UBND huyện, cam kết thực hiện trong 30 ngày\n20/06/2024 UBND huyện đã ban hành QĐ hủy bỏ QĐ thu hồi đất',
    ])
    applyDataRowStyle(sample1, COL_COUNT, false)

    const sample2 = ws.addRow([
        2,
        'Trần Thị Bình\nNguyễn Văn Cường',
        '15/2023/HC-PT ngày 20/11/2023 của TAND cấp cao tại TP.HCM; 08/2023/HC-ST ngày 10/08/2023 của TAND tỉnh An Giang',
        'UBND thành phố Long Xuyên',
        'Buộc UBND TP Long Xuyên cấp lại Giấy chứng nhận QSDĐ cho bà Trần Thị Bình',
        '',
        '10/01/2024 Gửi công văn yêu cầu UBND TP thực hiện bản án\n25/02/2024 UBND TP có văn bản trả lời đang xem xét',
    ])
    applyDataRowStyle(sample2, COL_COUNT, true)

    // Auto filter
    ws.autoFilter = { from: 'A1', to: 'G1' }
}

// ═══════════════════════════════════════════════════════════════════
// SHEET 2: Đã thi hành (COMPLETED)
// ═══════════════════════════════════════════════════════════════════
function buildCompletedSheet(wb: any) {
    const ws = wb.addWorksheet('Mẫu - Đã thi hành', {
        properties: { tabColor: { argb: '10B981' } },
        views: [{ state: 'frozen', ySplit: 3, activeCell: 'A4' }],
    })

    const COL_COUNT = 9
    ws.columns = [
        { width: 7 },   // A
        { width: 28 },  // B
        { width: 48 },  // C
        { width: 30 },  // D
        { width: 45 },  // E
        { width: 45 },  // F
        { width: 55 },  // G
        { width: 35 },  // H
        { width: 45 },  // I
    ]

    const headerRow = ws.addRow([
        'STT',
        'Người khởi kiện',
        'Số Bản án\n(Quyết định phải Thi hành án)',
        'Người phải thi hành',
        'Nghĩa vụ phải\nThi hành án',
        'QĐ buộc\nThi hành án',
        'Quá trình\nThi hành án',
        'Chờ theo dõi',
        'Kết quả\nthi hành án',
    ])
    applyHeaderStyle(headerRow, COL_COUNT)

    const numRow = ws.addRow([1, 2, 3, 4, 5, 6, 7, 8, 9])
    applyNumRowStyle(numRow, COL_COUNT)

    const guideRow = ws.addRow([
        '(Số TT)',
        'Họ tên người khởi kiện.\nNhiều người: mỗi dòng 1 tên (Alt+Enter)',
        'Format: [Số QĐ] ngày [dd/mm/yyyy] của [Cơ quan]\nNhiều QĐ ngăn cách bằng dấu ;',
        'Tên cơ quan/cá nhân phải thi hành.\nVD: UBND huyện Thoại Sơn',
        'Mô tả chi tiết nội dung nghĩa vụ phải thi hành',
        'Format giống cột C.\nNhiều QĐ ngăn cách bằng dấu ;',
        'Mỗi mốc tiến độ 1 dòng (Alt+Enter).\nBắt đầu bằng ngày dd/mm/yyyy',
        'Lý do chờ theo dõi (nếu có).\nCó thể để trống.',
        'Kết quả cuối cùng của việc thi hành án.',
    ])
    applyGuideRowStyle(guideRow, COL_COUNT)

    const sample1 = ws.addRow([
        1,
        'Lê Văn Dũng',
        '03/2023/HC-ST ngày 20/06/2023 của TAND tỉnh An Giang',
        'UBND huyện Thoại Sơn',
        'Hủy QĐ xử phạt vi phạm hành chính số 456/QĐ-XPVPHC ngày 01/05/2023',
        'QĐ số 12/QĐ-CCTHA ngày 01/08/2023 của Chi cục THADS huyện Thoại Sơn',
        '01/08/2023 Tống đạt QĐ buộc THA\n15/09/2023 UBND huyện đã hủy bỏ QĐ xử phạt\n20/09/2023 Lập biên bản xác nhận hoàn thành',
        'Đã hoàn thành nghĩa vụ THA',
        'UBND huyện Thoại Sơn đã ban hành QĐ hủy bỏ QĐ xử phạt VPHC. Đã thi hành xong.',
    ])
    applyDataRowStyle(sample1, COL_COUNT, false)

    const sample2 = ws.addRow([
        2,
        'Phạm Thị E',
        '07/2023/HC-PT ngày 30/09/2023 của TAND cấp cao tại TP.HCM',
        'UBND xã Vĩnh Trạch',
        'Buộc UBND xã cấp lại giấy phép xây dựng cho bà Phạm Thị E',
        '',
        '15/10/2023 Yêu cầu UBND xã thực hiện\n01/12/2023 UBND xã đã cấp lại GPXD',
        '',
        'Đã thi hành xong. UBND xã đã cấp lại GPXD số 45/GPXD ngày 01/12/2023.',
    ])
    applyDataRowStyle(sample2, COL_COUNT, true)

    ws.autoFilter = { from: 'A1', to: 'I1' }
}

// ═══════════════════════════════════════════════════════════════════
// SHEET 3: Hướng dẫn — Thiết kế màu theo cột
// ═══════════════════════════════════════════════════════════════════
function buildGuideSheet(wb: any) {
    const ws = wb.addWorksheet('Hướng dẫn', {
        properties: { tabColor: { argb: '3B82F6' } },
    })

    ws.columns = [
        { width: 18 },  // A: Label
        { width: 90 },  // B: Content
    ]

    let rowIdx = 0

    // ─── Title ──────────────────────────────────────────────────
    const titleRow = ws.addRow(['', 'HƯỚNG DẪN ĐIỀN FILE EXCEL MẪU — IMPORT ÁN HÀNH CHÍNH'])
    rowIdx++
    titleRow.height = 45
    const titleCell = titleRow.getCell(2)
    titleCell.font = { name: FONT_MAIN, bold: true, size: 16, color: { argb: COLORS.headerBg } }
    titleCell.alignment = { vertical: 'middle' }

    // ─── Subtitle ────────────────────────────────────────────────
    const subRow = ws.addRow(['', 'File mẫu gồm 2 Sheet dữ liệu: "Mẫu - Đang thi hành" (7 cột) và "Mẫu - Đã thi hành" (9 cột). Dưới đây là hướng dẫn chi tiết từng cột.'])
    rowIdx++
    subRow.height = 28
    subRow.getCell(2).font = { name: FONT_MAIN, size: 10, italic: true, color: { argb: '64748B' } }
    subRow.getCell(2).alignment = { vertical: 'middle', wrapText: true }

    // ─── Blank row ───────────────────────────────────────────────
    ws.addRow([]); rowIdx++

    // ─── General Rules ──────────────────────────────────────────
    const rulesHeaderRow = ws.addRow(['', '📌  NGUYÊN TẮC CHUNG'])
    rowIdx++
    rulesHeaderRow.height = 32
    rulesHeaderRow.getCell(2).font = { name: FONT_MAIN, bold: true, size: 13, color: { argb: COLORS.headerBg } }
    rulesHeaderRow.getCell(2).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FEF2F2' } }
    rulesHeaderRow.getCell(2).alignment = { vertical: 'middle' }
    rulesHeaderRow.getCell(2).border = { bottom: { style: 'medium', color: { argb: COLORS.headerBg } } }

    const rules = [
        '• Hệ thống tự động nhận diện dòng bắt đầu dữ liệu (bỏ qua các dòng tiêu đề).',
        '• Mỗi dòng là 1 vụ án. Cột A (STT) chỉ mang tính thứ tự, hệ thống tự sinh ID.',
        '• Bắt buộc phải có ít nhất 1 trong 2 cột: "Người khởi kiện" (B) hoặc "Số Bản án" (C).',
        '• Khi import, chọn đúng Trạng thái import (Đang thi hành / Đã thi hành) trong modal Import.',
        '• Có thể XÓA dữ liệu mẫu và dòng hướng dẫn trước khi import — hệ thống sẽ tự bỏ qua.',
        '• Không xóa hoặc thay đổi thứ tự các cột trong file mẫu.',
    ]
    for (const rule of rules) {
        const r = ws.addRow(['', rule]); rowIdx++
        r.height = 22
        r.getCell(2).font = { name: FONT_MAIN, size: 10, color: { argb: '334155' } }
        r.getCell(2).alignment = { vertical: 'middle' }
    }

    ws.addRow([]); rowIdx++

    // ─── Date format section ────────────────────────────────────
    const dateHeaderRow = ws.addRow(['', '📅  QUY TẮC FORMAT NGÀY THÁNG'])
    rowIdx++
    dateHeaderRow.height = 32
    dateHeaderRow.getCell(2).font = { name: FONT_MAIN, bold: true, size: 13, color: { argb: '1D4ED8' } }
    dateHeaderRow.getCell(2).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'EFF6FF' } }
    dateHeaderRow.getCell(2).alignment = { vertical: 'middle' }
    dateHeaderRow.getCell(2).border = { bottom: { style: 'medium', color: { argb: '1D4ED8' } } }

    const dateRules = [
        '• Sử dụng format: dd/mm/yyyy  →  VD: 15/03/2024',
        '• Có thể dùng dấu ngăn: / hoặc - hoặc .  →  VD: 15-03-2024, 15.03.2024',
        '• Nếu thiếu năm, hệ thống tự bổ sung năm hiện tại  →  VD: 15/03 → 15/03/2026',
        '• Năm viết tắt 2 số sẽ tự chuyển thành 4 số  →  VD: 15/03/24 → 15/03/2024',
    ]
    for (const rule of dateRules) {
        const r = ws.addRow(['', rule]); rowIdx++
        r.height = 22
        r.getCell(2).font = { name: FONT_MAIN, size: 10, color: { argb: '334155' } }
        r.getCell(2).alignment = { vertical: 'middle' }
    }

    ws.addRow([]); rowIdx++

    // ─── Column-by-column guide with colors ─────────────────────
    const colSectionRow = ws.addRow(['', '📋  HƯỚNG DẪN CHI TIẾT TỪNG CỘT'])
    rowIdx++
    colSectionRow.height = 32
    colSectionRow.getCell(2).font = { name: FONT_MAIN, bold: true, size: 13, color: { argb: '047857' } }
    colSectionRow.getCell(2).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'ECFDF5' } }
    colSectionRow.getCell(2).alignment = { vertical: 'middle' }
    colSectionRow.getCell(2).border = { bottom: { style: 'medium', color: { argb: '047857' } } }

    ws.addRow([]); rowIdx++

    // Define column guide entries
    const columns: { label: string, title: string, bg: string, textColor: string, details: string[] }[] = [
        {
            label: 'CỘT A',
            title: 'STT — Số thứ tự',
            bg: COLORS.colA,
            textColor: COLORS.colADark,
            details: [
                'Nhập số thứ tự: 1, 2, 3,...',
                'Cột này chỉ để dễ theo dõi, hệ thống không sử dụng giá trị này.',
            ],
        },
        {
            label: 'CỘT B',
            title: 'Người khởi kiện',
            bg: COLORS.colB,
            textColor: COLORS.colBDark,
            details: [
                'Nhập họ tên đầy đủ của người khởi kiện.',
                'Nếu có nhiều người, mỗi người 1 dòng (xuống dòng bằng Alt+Enter trong Excel).',
                'VD: Nguyễn Văn An',
                'VD nhiều người: Trần Thị Bình ↵ Nguyễn Văn Cường  (dùng Alt+Enter ngăn cách)',
            ],
        },
        {
            label: 'CỘT C',
            title: 'Số Bản án (Quyết định phải Thi hành án)',
            bg: COLORS.colC,
            textColor: COLORS.colCDark,
            details: [
                'Nhập số bản án / quyết định kèm ngày và cơ quan ban hành.',
                'Format chuẩn:  [Số QĐ]  ngày  [dd/mm/yyyy]  của  [Cơ quan]',
                'VD: 01/2024/HC-ST ngày 15/03/2024 của TAND tỉnh An Giang',
                'Nếu có nhiều QĐ, ngăn cách bằng dấu chấm phẩy (;)',
                'Hệ thống sẽ tự động tách: số QĐ, ngày ban hành, cơ quan ban hành.',
            ],
        },
        {
            label: 'CỘT D',
            title: 'Người phải thi hành',
            bg: COLORS.colD,
            textColor: COLORS.colDDark,
            details: [
                'Nhập tên cơ quan / cá nhân phải thi hành bản án ĐúNG NHƯ GỐC (kể cả tên cũ).',
                'VD: UBND huyện Châu Thành   hoặc   UBND huyện Phú Quốc',
                'Hệ thống sẽ GIỮ NGUYÊN tên bạn nhập, đồng thời tự động thêm chú thích tên mới:',
                '→  UBND huyện Phú Quốc  (Hiện nay là Thành phố Phú Quốc)',
                'Không cần sửa tên — nhập nguyên bản theo hồ sơ gốc là đúng nhất.',
            ],
        },
        {
            label: 'CỘT E',
            title: 'Nghĩa vụ phải Thi hành án',
            bg: COLORS.colE,
            textColor: COLORS.colEDark,
            details: [
                'Mô tả chi tiết nội dung nghĩa vụ phải thi hành.',
                'VD: Hủy QĐ số 123/QĐ-UBND ngày 05/01/2024 của UBND huyện Châu Thành về việc thu hồi đất',
                'Có thể để trống nếu chưa có thông tin.',
            ],
        },
        {
            label: 'CỘT F',
            title: 'QĐ buộc Thi hành án',
            bg: COLORS.colF,
            textColor: COLORS.colFDark,
            details: [
                'Nhập quyết định buộc thi hành án (nếu có).',
                'Format giống cột C:  [Số QĐ]  ngày  [dd/mm/yyyy]  của  [Cơ quan]',
                'Nếu có nhiều QĐ, ngăn cách bằng dấu chấm phẩy (;)',
                'Có thể để trống nếu chưa có QĐ buộc THA.',
            ],
        },
        {
            label: 'CỘT G',
            title: 'Quá trình Thi hành án',
            bg: COLORS.colG,
            textColor: COLORS.colGDark,
            details: [
                'Nhập lịch sử / quá trình thi hành án.',
                'Mỗi mốc tiến độ ghi trên 1 dòng (xuống dòng bằng Alt+Enter).',
                'Mỗi dòng NÊN bắt đầu bằng ngày (dd/mm/yyyy) để hệ thống nhận diện mốc thời gian.',
                'VD:  20/04/2024 Đã tống đạt QĐ buộc THA cho UBND huyện',
                '         15/05/2024 Đã làm việc với UBND huyện, cam kết thực hiện',
                'Nếu dòng KHÔNG có ngày → hệ thống sẽ ĐỂ TRỐNG ngày, KHÔNG tự gán ngày nào.',
                'Thứ tự hiển thị đúng theo thứ tự bạn nhập trong ô.',
                'Hỗ trợ ký hiệu đầu dòng: -, +, *, •, 1., a)',
            ],
        },
        {
            label: 'CỘT H',
            title: 'Chờ theo dõi  ⚠️  (Chỉ dùng cho Sheet "Đã thi hành")',
            bg: COLORS.colH,
            textColor: COLORS.colHDark,
            details: [
                'Nhập lý do chờ theo dõi (nếu có).',
                'VD: Đã hoàn thành nghĩa vụ THA, đang chờ xác nhận.',
                'Có thể để trống.',
            ],
        },
        {
            label: 'CỘT I',
            title: 'Kết quả thi hành án  ⚠️  (Chỉ dùng cho Sheet "Đã thi hành")',
            bg: COLORS.colI,
            textColor: COLORS.colIDark,
            details: [
                'Nhập kết quả cuối cùng của việc thi hành án.',
                'VD: UBND huyện đã ban hành QĐ hủy bỏ. Đã thi hành xong.',
                'VD: Đã cấp lại GPXD số 45/GPXD ngày 01/12/2023. Hoàn thành.',
                'Cột này sẽ hiển thị ở tab "Đã thi hành" trên hệ thống.',
            ],
        },
    ]

    for (const col of columns) {
        // Column header row — colored
        const hRow = ws.addRow([col.label, col.title]); rowIdx++
        hRow.height = 30
        hRow.getCell(1).font = { name: FONT_MAIN, bold: true, size: 11, color: { argb: 'FFFFFF' } }
        hRow.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: col.textColor } }
        hRow.getCell(1).alignment = { vertical: 'middle', horizontal: 'center' }
        hRow.getCell(1).border = thinBorder()

        hRow.getCell(2).font = { name: FONT_MAIN, bold: true, size: 11, color: { argb: col.textColor } }
        hRow.getCell(2).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: col.bg } }
        hRow.getCell(2).alignment = { vertical: 'middle' }
        hRow.getCell(2).border = thinBorder()

        // Detail rows
        for (const detail of col.details) {
            const dRow = ws.addRow(['', `    ${detail}`]); rowIdx++
            dRow.height = 20
            dRow.getCell(2).font = { name: FONT_MAIN, size: 10, color: { argb: '475569' } }
            dRow.getCell(2).alignment = { vertical: 'middle', wrapText: true }
        }

        // Blank separator
        ws.addRow([]); rowIdx++
    }

    // ─── Warning section ────────────────────────────────────────
    ws.addRow([]); rowIdx++
    const warnHeaderRow = ws.addRow(['', '⚠️  LƯU Ý QUAN TRỌNG'])
    rowIdx++
    warnHeaderRow.height = 32
    warnHeaderRow.getCell(2).font = { name: FONT_MAIN, bold: true, size: 13, color: { argb: 'B91C1C' } }
    warnHeaderRow.getCell(2).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FEF2F2' } }
    warnHeaderRow.getCell(2).alignment = { vertical: 'middle' }
    warnHeaderRow.getCell(2).border = { bottom: { style: 'medium', color: { argb: 'B91C1C' } } }

    const warnings = [
        '• Không xóa hoặc thay đổi thứ tự các cột trong file mẫu.',
        '• Có thể xóa dữ liệu mẫu và thay bằng dữ liệu thật.',
        '• Có thể xóa dòng hướng dẫn (dòng 3) — hệ thống sẽ tự bỏ qua nếu còn.',
        '• Dòng tiêu đề (dòng 1) và dòng số thứ tự (dòng 2) sẽ tự động bị bỏ qua khi import.',
        '• File hỗ trợ định dạng .xlsx và .xls',
    ]
    for (const w of warnings) {
        const r = ws.addRow(['', w]); rowIdx++
        r.height = 22
        r.getCell(2).font = { name: FONT_MAIN, size: 10, color: { argb: '991B1B' } }
        r.getCell(2).alignment = { vertical: 'middle' }
    }
}
