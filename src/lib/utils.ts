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
