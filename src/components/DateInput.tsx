'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { cn } from '@/lib/utils'

// Tên thứ và tháng tiếng Việt
const VI_DAYS = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']
const VI_MONTHS = [
    'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
    'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12',
]

function parseIso(iso: string | null | undefined): Date | null {
    if (!iso) return null
    const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})/)
    if (!m) return null
    return new Date(+m[1], +m[2] - 1, +m[3])
}

function toIso(d: Date): string {
    const y = d.getFullYear()
    const mo = String(d.getMonth() + 1).padStart(2, '0')
    const da = String(d.getDate()).padStart(2, '0')
    return `${y}-${mo}-${da}`
}

function toDisplay(d: Date | null): string {
    if (!d) return ''
    const y = d.getFullYear()
    const mo = String(d.getMonth() + 1).padStart(2, '0')
    const da = String(d.getDate()).padStart(2, '0')
    return `${da}/${mo}/${y}`
}

// Sắp xếp các ngày trong tháng
function buildCalendarDays(year: number, month: number): (Date | null)[] {
    const first = new Date(year, month, 1)
    const last = new Date(year, month + 1, 0)
    const startDay = first.getDay() // 0=Sun
    const days: (Date | null)[] = []
    for (let i = 0; i < startDay; i++) days.push(null)
    for (let d = 1; d <= last.getDate(); d++) days.push(new Date(year, month, d))
    // Pad cuối để đủ hàng
    while (days.length % 7 !== 0) days.push(null)
    return days
}

interface DateInputProps {
    value: string // yyyy-mm-dd hoặc ''
    onChange: (iso: string) => void
    className?: string
    placeholder?: string
    id?: string
}

export default function DateInput({ value, onChange, className, placeholder = 'dd/mm/yyyy', id }: DateInputProps) {
    const [text, setText] = useState(() => toDisplay(parseIso(value)))
    const [open, setOpen] = useState(false)
    const [viewYear, setViewYear] = useState(() => {
        const d = parseIso(value)
        return d ? d.getFullYear() : new Date().getFullYear()
    })
    const [viewMonth, setViewMonth] = useState(() => {
        const d = parseIso(value)
        return d ? d.getMonth() : new Date().getMonth()
    })
    const containerRef = useRef<HTMLDivElement>(null)

    // Sync khi value (ISO) thay đổi từ bên ngoài
    useEffect(() => {
        const d = parseIso(value)
        setText(toDisplay(d))
        if (d) { setViewYear(d.getFullYear()); setViewMonth(d.getMonth()) }
    }, [value])

    // Đóng khi click ngoài
    useEffect(() => {
        if (!open) return
        const handler = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false)
        }
        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [open])

    const selectedDate = parseIso(value)

    // Xử lý gõ tay dd/mm/yyyy
    const handleTextChange = useCallback((raw: string) => {
        // Tự động thêm dấu /
        let v = raw.replace(/[^0-9/]/g, '')
        if (v.length === 2 && !v.includes('/')) v += '/'
        if (v.length === 5 && v.split('/').length === 2) v += '/'
        if (v.length > 10) v = v.slice(0, 10)
        setText(v)
        // Khi đủ dd/mm/yyyy → parse và emit iso
        const m = v.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
        if (m) {
            const day = +m[1], mon = +m[2], yr = +m[3]
            if (mon >= 1 && mon <= 12 && day >= 1 && day <= 31) {
                const d = new Date(yr, mon - 1, day)
                onChange(toIso(d))
                setViewYear(yr); setViewMonth(mon - 1)
            }
        } else if (v === '') {
            onChange('')
        }
    }, [onChange])

    const selectDay = useCallback((d: Date) => {
        onChange(toIso(d))
        setText(toDisplay(d))
        setOpen(false)
    }, [onChange])

    const prevMonth = () => {
        if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1) }
        else setViewMonth(m => m - 1)
    }
    const nextMonth = () => {
        if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1) }
        else setViewMonth(m => m + 1)
    }

    const calDays = buildCalendarDays(viewYear, viewMonth)
    const today = new Date(); today.setHours(0, 0, 0, 0)

    return (
        <div ref={containerRef} className="relative">
            <div className="flex items-center">
                <input
                    id={id}
                    type="text"
                    inputMode="numeric"
                    value={text}
                    onChange={e => handleTextChange(e.target.value)}
                    onFocus={() => setOpen(true)}
                    placeholder={placeholder}
                    className={cn(
                        'w-full pr-9 px-3 py-2 text-sm border border-slate-200 rounded-xl',
                        'focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent',
                        'bg-white hover:bg-white transition-colors',
                        className
                    )}
                />
                <button
                    type="button"
                    onClick={() => setOpen(o => !o)}
                    className="absolute right-2 text-slate-400 hover:text-blue-500 transition-colors"
                    tabIndex={-1}
                >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                        <line x1="16" y1="2" x2="16" y2="6" />
                        <line x1="8" y1="2" x2="8" y2="6" />
                        <line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                </button>
            </div>

            {open && (
                <div className="absolute z-50 mt-1 bg-white border border-slate-200 rounded-2xl shadow-xl p-3 min-w-[260px]"
                    onMouseDown={e => e.preventDefault()}>
                    {/* Header tháng/năm */}
                    <div className="flex items-center justify-between mb-2">
                        <button type="button" onClick={prevMonth}
                            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-500 transition-colors">
                            ‹
                        </button>
                        <span className="text-sm font-semibold text-slate-700">
                            {VI_MONTHS[viewMonth]} {viewYear}
                        </span>
                        <button type="button" onClick={nextMonth}
                            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-500 transition-colors">
                            ›
                        </button>
                    </div>

                    {/* Header ngày trong tuần */}
                    <div className="grid grid-cols-7 mb-1">
                        {VI_DAYS.map(d => (
                            <div key={d} className={cn(
                                'text-center text-[10px] font-semibold pb-1',
                                d === 'CN' ? 'text-red-500' : 'text-slate-400'
                            )}>{d}</div>
                        ))}
                    </div>

                    {/* Các ô ngày */}
                    <div className="grid grid-cols-7 gap-y-0.5">
                        {calDays.map((d, i) => {
                            if (!d) return <div key={i} />
                            const isToday = d.getTime() === today.getTime()
                            const isSelected = selectedDate && d.getTime() === selectedDate.getTime()
                            const isSun = d.getDay() === 0
                            return (
                                <button
                                    key={i}
                                    type="button"
                                    onClick={() => selectDay(d)}
                                    className={cn(
                                        'w-full aspect-square flex items-center justify-center text-xs rounded-lg transition-colors',
                                        isSelected && 'bg-blue-500 text-white font-bold',
                                        !isSelected && isToday && 'bg-blue-50 text-blue-600 font-semibold border border-blue-300',
                                        !isSelected && !isToday && isSun && 'text-red-500 hover:bg-red-50',
                                        !isSelected && !isToday && !isSun && 'text-slate-700 hover:bg-slate-100',
                                    )}
                                >
                                    {d.getDate()}
                                </button>
                            )
                        })}
                    </div>

                    {/* Footer: Hôm nay / Xóa */}
                    <div className="flex justify-between mt-2 pt-2 border-t border-slate-100">
                        <button type="button" onClick={() => { onChange(''); setText(''); setOpen(false) }}
                            className="text-xs text-slate-500 hover:text-red-500 transition-colors">Xóa</button>
                        <button type="button" onClick={() => selectDay(today)}
                            className="text-xs text-blue-500 hover:text-blue-700 font-medium transition-colors">Hôm nay</button>
                    </div>
                </div>
            )}
        </div>
    )
}
