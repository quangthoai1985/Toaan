import * as xlsx from 'xlsx'

/**
 * Tạo và tải xuống file Excel mẫu để import dữ liệu Án Hành Chính
 * File gồm 3 sheet: Mẫu Đang thi hành, Mẫu Đã thi hành, Hướng dẫn
 */
export function downloadExcelTemplate() {
    const wb = xlsx.utils.book_new()

    // ═══════════════════════════════════════════════════════════════════
    // SHEET 1: "Mẫu - Đang thi hành" (PENDING)
    // ═══════════════════════════════════════════════════════════════════
    const pendingHeaders = [
        'STT',
        'Người khởi kiện',
        'Số Bản án (Quyết định phải Thi hành án)',
        'Người phải thi hành',
        'Nghĩa vụ phải Thi hành án',
        'QĐ buộc Thi hành án',
        'Quá trình Thi hành án',
    ]

    const pendingGuide = [
        '(Số TT)',
        '(Họ tên người khởi kiện)',
        '(VD: 01/2024/HC-ST ngày 15/03/2024 của TAND tỉnh AG)',
        '(VD: UBND huyện Châu Thành)',
        '(Nội dung nghĩa vụ phải thi hành)',
        '(VD: QĐ số 01/QĐ-THA ngày 10/04/2024 của Chi cục THADS)',
        '(Mỗi mốc tiến độ 1 dòng, bắt đầu bằng ngày. VD: 15/04/2024 Đã tống đạt QĐ)',
    ]

    const pendingSample1 = [
        1,
        'Nguyễn Văn An',
        '01/2024/HC-ST ngày 15/03/2024 của TAND tỉnh An Giang',
        'UBND huyện Châu Thành',
        'Hủy Quyết định số 123/QĐ-UBND ngày 05/01/2024 của UBND huyện Châu Thành về việc thu hồi đất',
        'QĐ số 05/QĐ-CCTHA ngày 20/04/2024 của Chi cục THADS huyện Châu Thành',
        '20/04/2024 Đã tống đạt QĐ buộc THA cho UBND huyện\n15/05/2024 Đã làm việc với UBND huyện, cam kết thực hiện trong 30 ngày\n20/06/2024 UBND huyện đã ban hành QĐ hủy bỏ QĐ thu hồi đất',
    ]

    const pendingSample2 = [
        2,
        'Trần Thị Bình\nNguyễn Văn Cường',
        '15/2023/HC-PT ngày 20/11/2023 của TAND cấp cao tại TP.HCM; 08/2023/HC-ST ngày 10/08/2023 của TAND tỉnh An Giang',
        'UBND thành phố Long Xuyên',
        'Buộc UBND TP Long Xuyên cấp lại Giấy chứng nhận QSDĐ cho bà Trần Thị Bình',
        '',
        '10/01/2024 Gửi công văn yêu cầu UBND TP thực hiện bản án\n25/02/2024 UBND TP có văn bản trả lời đang xem xét',
    ]

    const pendingData = [pendingHeaders, pendingGuide, pendingSample1, pendingSample2]

    const wsPending = xlsx.utils.aoa_to_sheet(pendingData)

    // Column widths
    wsPending['!cols'] = [
        { wch: 6 },   // STT
        { wch: 28 },  // Người khởi kiện
        { wch: 45 },  // Số Bản án
        { wch: 30 },  // Người phải thi hành
        { wch: 45 },  // Nghĩa vụ
        { wch: 45 },  // QĐ buộc THA
        { wch: 55 },  // Quá trình THA
    ]

    // Row heights
    wsPending['!rows'] = [
        { hpt: 36 },  // Header
        { hpt: 50 },  // Guide
        { hpt: 70 },  // Sample 1
        { hpt: 50 },  // Sample 2
    ]

    // Freeze header + guide rows
    wsPending['!freeze'] = { xSplit: 0, ySplit: 2, topLeftCell: 'A3' }

    xlsx.utils.book_append_sheet(wb, wsPending, 'Mẫu - Đang thi hành')

    // ═══════════════════════════════════════════════════════════════════
    // SHEET 2: "Mẫu - Đã thi hành" (COMPLETED)
    // ═══════════════════════════════════════════════════════════════════
    const completedHeaders = [
        'STT',
        'Người khởi kiện',
        'Số Bản án (Quyết định phải Thi hành án)',
        'Người phải thi hành',
        'Nghĩa vụ phải Thi hành án',
        'QĐ buộc Thi hành án',
        'Quá trình Thi hành án',
        'Chờ theo dõi',
        'Kết quả thi hành án',
    ]

    const completedGuide = [
        '(Số TT)',
        '(Họ tên người khởi kiện)',
        '(VD: 01/2024/HC-ST ngày 15/03/2024 của TAND tỉnh AG)',
        '(VD: UBND huyện Châu Thành)',
        '(Nội dung nghĩa vụ phải thi hành)',
        '(VD: QĐ số 01/QĐ-THA ngày 10/04/2024 của Chi cục THADS)',
        '(Mỗi mốc tiến độ 1 dòng, bắt đầu bằng ngày)',
        '(Lý do chờ theo dõi, nếu có)',
        '(Kết quả cuối cùng của việc thi hành án)',
    ]

    const completedSample1 = [
        1,
        'Lê Văn Dũng',
        '03/2023/HC-ST ngày 20/06/2023 của TAND tỉnh An Giang',
        'UBND huyện Thoại Sơn',
        'Hủy QĐ xử phạt vi phạm hành chính số 456/QĐ-XPVPHC ngày 01/05/2023',
        'QĐ số 12/QĐ-CCTHA ngày 01/08/2023 của Chi cục THADS huyện Thoại Sơn',
        '01/08/2023 Tống đạt QĐ buộc THA\n15/09/2023 UBND huyện đã hủy bỏ QĐ xử phạt\n20/09/2023 Lập biên bản xác nhận hoàn thành',
        'Đã hoàn thành nghĩa vụ THA',
        'UBND huyện Thoại Sơn đã ban hành QĐ hủy bỏ QĐ xử phạt VPHC. Đã thi hành xong.',
    ]

    const completedSample2 = [
        2,
        'Phạm Thị E',
        '07/2023/HC-PT ngày 30/09/2023 của TAND cấp cao tại TP.HCM',
        'UBND xã Vĩnh Trạch',
        'Buộc UBND xã cấp lại giấy phép xây dựng cho bà Phạm Thị E',
        '',
        '15/10/2023 Yêu cầu UBND xã thực hiện\n01/12/2023 UBND xã đã cấp lại GPXD',
        '',
        'Đã thi hành xong. UBND xã đã cấp lại GPXD số 45/GPXD ngày 01/12/2023.',
    ]

    const completedData = [completedHeaders, completedGuide, completedSample1, completedSample2]

    const wsCompleted = xlsx.utils.aoa_to_sheet(completedData)

    wsCompleted['!cols'] = [
        { wch: 6 },   // STT
        { wch: 28 },  // Người khởi kiện
        { wch: 45 },  // Số Bản án
        { wch: 30 },  // Người phải thi hành
        { wch: 45 },  // Nghĩa vụ
        { wch: 45 },  // QĐ buộc THA
        { wch: 55 },  // Quá trình THA
        { wch: 35 },  // Chờ theo dõi
        { wch: 45 },  // Kết quả THA
    ]

    wsCompleted['!rows'] = [
        { hpt: 36 },
        { hpt: 50 },
        { hpt: 70 },
        { hpt: 50 },
    ]

    wsCompleted['!freeze'] = { xSplit: 0, ySplit: 2, topLeftCell: 'A3' }

    xlsx.utils.book_append_sheet(wb, wsCompleted, 'Mẫu - Đã thi hành')

    // ═══════════════════════════════════════════════════════════════════
    // SHEET 3: "Hướng dẫn" — Hướng dẫn chi tiết cách điền
    // ═══════════════════════════════════════════════════════════════════
    const guideData = [
        ['HƯỚNG DẪN ĐIỀN FILE EXCEL MẪU - IMPORT ÁN HÀNH CHÍNH'],
        [''],
        ['📌 NGUYÊN TẮC CHUNG'],
        ['• Hệ thống tự động nhận diện dòng bắt đầu dữ liệu (bỏ qua tiêu đề).'],
        ['• Mỗi dòng là 1 vụ án. Cột A (STT) chỉ mang tính thứ tự, hệ thống tự sinh ID.'],
        ['• Bắt buộc phải có ít nhất 1 trong 2 cột: "Người khởi kiện" hoặc "Số Bản án".'],
        ['• Khi import, chọn đúng Trạng thái (Đang thi hành / Đã thi hành) trong modal Import.'],
        ['• Sheet "Mẫu - Đang thi hành" dùng cho các án chưa xong (PENDING).'],
        ['• Sheet "Mẫu - Đã thi hành" dùng cho các án đã giải quyết xong (COMPLETED).'],
        [''],
        ['═══════════════════════════════════════════════════════════════'],
        ['📋 CỘT A — STT (Số thứ tự)'],
        ['• Nhập số thứ tự: 1, 2, 3,...'],
        ['• Cột này chỉ để dễ theo dõi, hệ thống không sử dụng giá trị này.'],
        [''],
        ['📋 CỘT B — Người khởi kiện'],
        ['• Nhập họ tên đầy đủ của người khởi kiện.'],
        ['• Nếu có nhiều người, mỗi người 1 dòng (xuống dòng trong ô bằng Alt+Enter).'],
        ['• VD: Nguyễn Văn An'],
        ['• VD nhiều người: Trần Thị Bình (dòng 1) + Nguyễn Văn Cường (dòng 2)'],
        [''],
        ['📋 CỘT C — Số Bản án (Quyết định phải Thi hành án)'],
        ['• Nhập số bản án / quyết định kèm ngày và cơ quan ban hành.'],
        ['• Format chuẩn: [Số QĐ] ngày [dd/mm/yyyy] của [Cơ quan]'],
        ['• VD: 01/2024/HC-ST ngày 15/03/2024 của TAND tỉnh An Giang'],
        ['• Nếu có nhiều QĐ, ngăn cách bằng dấu chấm phẩy (;)'],
        ['• VD: 15/2023/HC-PT ngày 20/11/2023 của TAND cấp cao tại TP.HCM; 08/2023/HC-ST ngày 10/08/2023 của TAND tỉnh AG'],
        ['• Hệ thống sẽ tự động tách: số QĐ, ngày ban hành, cơ quan ban hành.'],
        [''],
        ['📋 CỘT D — Người phải thi hành'],
        ['• Nhập tên cơ quan / cá nhân phải thi hành bản án.'],
        ['• VD: UBND huyện Châu Thành'],
        ['• VD: UBND thành phố Long Xuyên'],
        ['• Hệ thống sẽ tự động chuyển đổi tên ĐVHC cũ sang mới (nếu có mapping).'],
        [''],
        ['📋 CỘT E — Nghĩa vụ phải Thi hành án'],
        ['• Mô tả chi tiết nội dung nghĩa vụ phải thi hành.'],
        ['• VD: Hủy Quyết định số 123/QĐ-UBND ngày 05/01/2024 của UBND huyện Châu Thành về việc thu hồi đất'],
        ['• VD: Buộc UBND TP Long Xuyên cấp lại Giấy chứng nhận QSDĐ cho bà Trần Thị Bình'],
        ['• Có thể để trống nếu chưa có thông tin.'],
        [''],
        ['📋 CỘT F — QĐ buộc Thi hành án'],
        ['• Nhập quyết định buộc thi hành án (nếu có).'],
        ['• Format giống cột C: [Số QĐ] ngày [dd/mm/yyyy] của [Cơ quan]'],
        ['• VD: QĐ số 05/QĐ-CCTHA ngày 20/04/2024 của Chi cục THADS huyện Châu Thành'],
        ['• Nếu có nhiều QĐ, ngăn cách bằng dấu chấm phẩy (;)'],
        ['• Có thể để trống nếu chưa có QĐ buộc THA.'],
        [''],
        ['📋 CỘT G — Quá trình Thi hành án'],
        ['• Nhập lịch sử / quá trình thi hành án.'],
        ['• Mỗi mốc tiến độ ghi trên 1 dòng (xuống dòng bằng Alt+Enter).'],
        ['• Mỗi dòng NÊN bắt đầu bằng ngày (dd/mm/yyyy) để hệ thống tự nhận diện.'],
        ['• VD:'],
        ['  20/04/2024 Đã tống đạt QĐ buộc THA cho UBND huyện'],
        ['  15/05/2024 Đã làm việc với UBND huyện, cam kết thực hiện trong 30 ngày'],
        ['  20/06/2024 UBND huyện đã ban hành QĐ hủy bỏ QĐ thu hồi đất'],
        ['• Nếu không có ngày cụ thể, hệ thống sẽ tự gán ngày hiện tại.'],
        ['• Hệ thống hỗ trợ các ký hiệu đầu dòng: -, +, *, •, 1., a)'],
        [''],
        ['═══════════════════════════════════════════════════════════════'],
        ['📋 CỘT H — Chờ theo dõi (Chỉ dùng cho Sheet "Đã thi hành")'],
        ['• Nhập lý do chờ theo dõi (nếu có).'],
        ['• VD: Đã hoàn thành nghĩa vụ THA, đang chờ xác nhận.'],
        ['• Có thể để trống.'],
        [''],
        ['📋 CỘT I — Kết quả thi hành án (Chỉ dùng cho Sheet "Đã thi hành")'],
        ['• Nhập kết quả cuối cùng của việc thi hành án.'],
        ['• VD: UBND huyện đã ban hành QĐ hủy bỏ. Đã thi hành xong.'],
        ['• VD: Đã cấp lại GPXD số 45/GPXD ngày 01/12/2023. Hoàn thành.'],
        ['• Cột này sẽ hiển thị ở tab "Đã thi hành" trên hệ thống.'],
        [''],
        ['═══════════════════════════════════════════════════════════════'],
        ['📅 QUY TẮC FORMAT NGÀY THÁNG'],
        ['• Sử dụng format: dd/mm/yyyy (VD: 15/03/2024)'],
        ['• Có thể dùng dấu ngăn: / hoặc - hoặc . (VD: 15-03-2024, 15.03.2024)'],
        ['• Nếu thiếu năm, hệ thống tự bổ sung năm hiện tại (VD: 15/03 → 15/03/2026)'],
        ['• Năm viết tắt 2 chữ số sẽ được chuyển thành 4 chữ số (VD: 15/03/24 → 15/03/2024)'],
        [''],
        ['⚠️ LƯU Ý QUAN TRỌNG'],
        ['• Không xóa hoặc thay đổi thứ tự các cột trong file mẫu.'],
        ['• Có thể xóa dữ liệu mẫu và thay bằng dữ liệu thật.'],
        ['• Có thể xóa dòng hướng dẫn (dòng 2) trước khi import — hệ thống sẽ tự bỏ qua nếu còn.'],
        ['• Dòng tiêu đề (dòng 1) sẽ tự động bị bỏ qua khi import.'],
        ['• File hỗ trợ định dạng .xlsx và .xls'],
    ]

    const wsGuide = xlsx.utils.aoa_to_sheet(guideData)

    // Merge column A for full width
    wsGuide['!cols'] = [{ wch: 120 }]

    // Set row heights for the title
    wsGuide['!rows'] = [{ hpt: 36 }]

    xlsx.utils.book_append_sheet(wb, wsGuide, 'Hướng dẫn')

    // ═══════════════════════════════════════════════════════════════════
    // EXPORT & DOWNLOAD
    // ═══════════════════════════════════════════════════════════════════
    const wbout = xlsx.write(wb, { bookType: 'xlsx', type: 'array' })
    const blob = new Blob([wbout], {
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
