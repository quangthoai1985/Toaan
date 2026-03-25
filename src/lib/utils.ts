import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

/** Chuyển yyyy-mm-dd (ISO) → dd/mm/yyyy để hiển thị */
export function formatDate(dateStr: string | null | undefined): string {
    if (!dateStr) return '—'
    const m = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/)
    if (m) return `${m[3]}/${m[2]}/${m[1]}`
    return dateStr
}

/** Chuyển dd/mm/yyyy → yyyy-mm-dd để lưu DB */
export function displayToIso(display: string): string {
    const m = display.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
    if (m) return `${m[3]}-${m[2]}-${m[1]}`
    return display
}

export function truncate(str: string, maxLen = 80): string {
    if (str.length <= maxLen) return str
    return str.slice(0, maxLen) + '...'
}

export function formatQuyetDinh(qd: any): string {
    const parts = []
    if (qd.so_quyet_dinh) parts.push(qd.so_quyet_dinh)
    if (qd.ngay_ban_hanh) parts.push(`Ngày ${qd.ngay_ban_hanh.split('-').reverse().join('/')}`)
    if (qd.co_quan_ban_hanh) parts.push(`của ${qd.co_quan_ban_hanh}`)
    return parts.join(' ')
}

export function getSoBanAnText(so_ban_an_str: string | null | undefined): string {
    if (!so_ban_an_str) return 'Chưa có số bản án'
    try {
        const parsed = JSON.parse(so_ban_an_str)
        if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed.map(formatQuyetDinh).filter(Boolean).join('; ') || 'Chưa có số bản án'
        }
    } catch {
        return so_ban_an_str
    }
    return 'Chưa có số bản án'
}

export function standardizeDateWithYear(d: string) {
    const parts = d.split(/[\/\-\.]/)
    if (parts.length < 3) return ''
    const [day, mo, y] = parts
    const year = y.length === 2 ? `20${y}` : y
    return `${year}-${mo.padStart(2, '0')}-${day.padStart(2, '0')}`
}

export function parseQuyetDinhList(text: string): { id: string, so_quyet_dinh: string, ngay_ban_hanh: string, co_quan_ban_hanh: string }[] {
    if (!text) return []
    const parts = text.split(/;|\n/).map(s => s.trim()).filter(Boolean)
    const results = []

    for (const part of parts) {
        let so_quyet_dinh = part
        let ngay_ban_hanh = ''
        let co_quan_ban_hanh = ''

        const match = part.match(/(.*?)(?:ngày|ngaỳ|ngay)\s+(\d{1,2}[\/\-\.]\d{1,2}(?:[\/\-\.]\d{2,4})?)\s*(?:của\s+)?(.*)/i)
        
        if (match) {
            so_quyet_dinh = match[1].trim()
            so_quyet_dinh = so_quyet_dinh.replace(/^(Số|Bản án số|Quyết định số|Bản án|Quyết định|BA|QĐ)[\s\:\-]*/i, '')
            
            let dString = match[2].trim()
            let dParts = dString.split(/[\/\-\.]/)
            if (dParts.length === 2) dParts.push(new Date().getFullYear().toString())
            if (dParts.length === 3) {
                const year = dParts[2].length === 2 ? `20${dParts[2]}` : dParts[2]
                ngay_ban_hanh = `${year}-${dParts[1].padStart(2, '0')}-${dParts[0].padStart(2, '0')}`
            }
            
            co_quan_ban_hanh = match[3].trim().replace(/^[,.]\s*/, '')
        } else {
            so_quyet_dinh = so_quyet_dinh.replace(/^(Số|Bản án số|Quyết định số|Bản án|Quyết định|BA|QĐ)[\s\:\-]*/i, '')
        }

        results.push({
            id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(7),
            so_quyet_dinh,
            ngay_ban_hanh,
            co_quan_ban_hanh
        })
    }
    return results
}

export function parseQTTienDo(text: string): { id: string, date: string, content: string }[] {
    if (!text) return []
    const lines = text.split(/\r?\n/).map(line => line.trim()).filter(line => line !== '')
    const entries = []
    let currentEntry = null
    
    // Match dates: "12/03/2023", "ngày 12/03", "tháng 4/2023", "12.03.2023"
    const dateRegex = /(?:Ngày|Tháng|Năm)?\s*(\d{1,2}[\/\-\.]\d{1,2}(?:[\/\-\.]\d{2,4})?)/i
    
    // Match bullets: -, +, *, •, 1., a), Bước 1: 
    const bulletRegex = /^([-+*•]|\d+[\.\)]|[a-zA-Z][\.\)]|Bước \d+:?)\s*/i

    for (const line of lines) {
        const dateMatch = line.match(dateRegex)
        const bulletMatch = line.match(bulletRegex)
        
        const isNewEntry = bulletMatch || dateMatch

        if (isNewEntry || !currentEntry) {
            if (currentEntry) entries.push(currentEntry)
            
            let dateStr = ''
            if (dateMatch) {
                const dString = dateMatch[1]
                const parts = dString.split(/[\/\-\.]/)
                if (parts.length === 2) parts.push(new Date().getFullYear().toString())
                if (parts.length === 3) {
                    const y = parts[2].length === 2 ? `20${parts[2]}` : parts[2]
                    dateStr = `${y}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`
                }
            } else {
                dateStr = new Date().toISOString().split('T')[0]
            }
            
            const content = line.replace(bulletRegex, '').trim()
            
            currentEntry = {
                id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(7),
                date: dateStr,
                content: content || 'Chưa cập nhật nội dung'
            }
        } else {
            currentEntry.content += '\n' + line
        }
    }
    if (currentEntry) entries.push(currentEntry)
    return entries
}

import { dvhcMapping } from './dvhc_mapping';

/** Chuyển đổi tên Cơ quan/ĐVHC cũ sang mới dựa theo map */
export function mapDVHC(nguoiPhaiThiHanh: string): string {
    if (!nguoiPhaiThiHanh) return nguoiPhaiThiHanh;
    
    let result = nguoiPhaiThiHanh.trim();
    const lowerInput = result.toLowerCase();
    
    // 1. Quét theo cấp Xã/Phường (trong chuỗi 'from')
    for (const mapping of dvhcMapping) {
        if (!mapping.from) continue;
        // Xóa nội dung trong ngoặc để tránh parse sai (vd: "Xã Thổ Châu (giữ nguyên)")
        const cleanFrom = mapping.from.replace(/\(.*?\)/g, '');
        const fromItems = cleanFrom.split(/[,;]/).map((s: string) => s.trim().toLowerCase()).filter(Boolean);
        
        for (const item of fromItems) {
            // Loại bỏ các tiền tố không phải tên đơn vị để tránh list tạp
            const cleanItem = item.replace(/^(gồm các xã đảo:|thị trấn|xã|phường)\s+/i, '').trim();
            if (cleanItem.length < 3) continue; // Tránh match bậy các chữ quá ngắn
            
            // Tìm chuỗi item nguyên bản (vd "xã ba chúc") hoặc cleanItem ("ba chúc")
            if (lowerInput.includes(item) || lowerInput.includes(cleanItem)) {
                // Ưu tiên replace item nguyên bản nếu có, không thì replace cleanItem
                const matchStr = lowerInput.includes(item) ? item : cleanItem;
                const regex = new RegExp(matchStr, 'i');
                // Nếu kết quả đã chứa 'cũ' thì thôi, tránh lặp
                if (result.includes('(cũ)')) return result;
                
                // Trả về định dạng: UBND Xã ABC (Huyện XYZ cũ)
                return result.replace(regex, mapping.newFullName) + ` (${mapping.oldHuyen})`;
            }
        }
    }
    
    // 2. Quét theo cấp Huyện (trong chuỗi 'oldHuyen')
    for (const mapping of dvhcMapping) {
        if (!mapping.oldHuyen) continue;
        const coreHuyenMatch = mapping.oldHuyen.match(/^(.*?),\s*tỉnh/i);
        if (coreHuyenMatch) {
            const coreHuyen = coreHuyenMatch[1].trim(); // vd "Thành phố Phú Quốc"
            if (lowerInput.includes(coreHuyen.toLowerCase())) {
                const siblings = dvhcMapping.filter((m: any) => m.oldHuyen === mapping.oldHuyen);
                let bestMapping = mapping;
                if (siblings.length > 1) {
                    const districtNameOnly = coreHuyen.replace(/^(Thành phố|Huyện|Thị xã|Quận)\s+/i, '').trim().toLowerCase();
                    const betterMatch = siblings.find((s: any) => s.newFullName.toLowerCase().includes(districtNameOnly));
                    if (betterMatch) bestMapping = betterMatch;
                }
                
                const regex = new RegExp(coreHuyen, 'i');
                if (result.includes('(cũ)')) return result;
                return result.replace(regex, bestMapping.newFullName) + ` (${bestMapping.oldHuyen})`;
            }
        }
    }
    
    return result;
}
