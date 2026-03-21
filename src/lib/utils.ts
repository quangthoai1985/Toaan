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

        const match = part.match(/(.*?)(?:ngày|ngaỳ|ngay)\s+(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})\s*(?:của\s+)?(.*)/i)
        
        if (match) {
            so_quyet_dinh = match[1].trim()
            so_quyet_dinh = so_quyet_dinh.replace(/^(Số|Bản án số|Quyết định số|Bản án|Quyết định)[\s\:\-]*/i, '')
            ngay_ban_hanh = standardizeDateWithYear(match[2].trim()) 
            co_quan_ban_hanh = match[3].trim()
        } else {
            so_quyet_dinh = so_quyet_dinh.replace(/^(Số|Bản án số|Quyết định số|Bản án|Quyết định)[\s\:\-]*/i, '')
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
