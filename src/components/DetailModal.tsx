'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { AnHanhChinh, TienDoEntry, QuyetDinhEntry } from '@/lib/types'
import {
    X, FileText, Calendar, User, Building2, Scale, Clock,
    Pencil, Loader2, Save, Plus, Trash2, ChevronDown, ChevronUp,
    CheckCircle2, AlertCircle, Eye, EyeOff, ArrowRightCircle
} from 'lucide-react'
import { cn, formatQuyetDinh } from '@/lib/utils'
import { useToast } from './Toast'
import DateInput from './DateInput' // Added DateInput import

interface Props {
    open: boolean
    record: AnHanhChinh | null
    onClose: () => void
    onSuccess?: () => void
}

function formatDateVN(dateStr: string): string {
    if (!dateStr) return '—'
    const m = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/)
    if (m) return `${m[3]}/${m[2]}/${m[1]}`
    return dateStr
}

function todayISO(): string {
    return new Date().toISOString().split('T')[0]
}

function parseQTTienDo(text: string): TienDoEntry[] {
    if (!text) return []
    const lines = text.split(/\r?\n/).map(line => line.trim()).filter(line => line !== '')
    const entries: TienDoEntry[] = []
    let currentEntry: TienDoEntry | null = null
    const dateRegex = /(?:Ngày\s+)?(\d{1,2}\/\d{1,2}\/\d{4})/i

    for (const line of lines) {
        const isNewEntryMatch = line.match(dateRegex)
        const hasBulletPoint = /^[-+*]/i.test(line)
        const isNewEntry = isNewEntryMatch || (hasBulletPoint && currentEntry)

        if (isNewEntry || !currentEntry) {
            if (currentEntry) entries.push(currentEntry)
            let dateStr = isNewEntryMatch ? isNewEntryMatch[1] : ''
            if (dateStr) {
                const [d, mo, y] = dateStr.split('/')
                dateStr = `${y}-${mo.padStart(2, '0')}-${d.padStart(2, '0')}`
            } else {
                dateStr = todayISO()
            }
            currentEntry = {
                id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(7),
                date: dateStr,
                content: line.replace(/^[-+*]\s*/, '').trim(),
            }
        } else {
            currentEntry.content += '\n' + line
        }
    }
    if (currentEntry) entries.push(currentEntry)
    return entries
}

function sortByDateDesc(entries: TienDoEntry[]): TienDoEntry[] {
    return [...entries].sort((a, b) => {
        if (!a.date) return 1
        if (!b.date) return -1
        return b.date.localeCompare(a.date) // ISO yyyy-mm-dd so string compare works
    })
}

// ——— EditableField —————————————————————————————
function EditableField({
    label, value, onChange, multiline = false, colorClass = 'bg-slate-50 border-slate-200',
    emptyLabel = 'Chưa có dữ liệu', emptyColor = 'text-slate-400'
}: {
    label: React.ReactNode
    value: string
    onChange: (v: string) => void
    multiline?: boolean
    colorClass?: string
    emptyLabel?: string
    emptyColor?: string
}) {
    const [editing, setEditing] = useState(false)

    return (
        <div className="space-y-1.5">
            <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}</label>
                <button
                    onClick={() => setEditing(e => !e)}
                    className="flex items-center gap-1 text-[11px] font-medium text-blue-600 hover:text-blue-700 transition-colors"
                >
                    {editing ? <><EyeOff className="w-3 h-3" />Xem</> : <><Pencil className="w-3 h-3" />Sửa</>}
                </button>
            </div>
            {editing ? (
                multiline ? (
                    <textarea
                        value={value}
                        onChange={e => onChange(e.target.value)}
                        className="w-full bg-white border border-blue-300 rounded-lg px-3 py-2 text-sm text-slate-800 leading-relaxed focus:outline-none focus:ring-2 focus:ring-blue-100 min-h-[90px] resize-none"
                        autoFocus
                    />
                ) : (
                    <input
                        value={value}
                        onChange={e => onChange(e.target.value)}
                        className="w-full bg-white border border-blue-300 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-100"
                        autoFocus
                    />
                )
            ) : (
                <div className={cn('rounded-lg px-3 py-2.5 text-sm leading-relaxed border min-h-[40px]', colorClass)}>
                    {value ? (
                        <span className="text-slate-800 whitespace-pre-wrap">{value}</span>
                    ) : (
                        <span className={cn('italic', emptyColor)}>{emptyLabel}</span>
                    )}
                </div>
            )}
        </div>
    )
}

// ——— EditableCombobox —————————————————————————————
function EditableCombobox({
    label, value, onChange, options, colorClass = 'bg-slate-50 border-slate-200',
    emptyLabel = 'Chưa có dữ liệu', emptyColor = 'text-slate-400'
}: {
    label: React.ReactNode
    value: string
    onChange: (v: string) => void
    options: { id: string, ten_co_quan: string, cap_co_quan?: string }[]
    colorClass?: string
    emptyLabel?: string
    emptyColor?: string
}) {
    const [editing, setEditing] = useState(false)
    const [search, setSearch] = useState('')
    const [isOpen, setIsOpen] = useState(false)
    const wrapperRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (editing) {
            setSearch(value)
            setIsOpen(true)
        } else {
            setIsOpen(false)
        }
    }, [editing, value])

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const filteredOptions = options.filter(o => o.ten_co_quan.toLowerCase().includes(search.toLowerCase()))

    return (
        <div className="space-y-1.5" ref={wrapperRef}>
            <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}</label>
                <button
                    onClick={() => setEditing(e => !e)}
                    className="flex items-center gap-1 text-[11px] font-medium text-blue-600 hover:text-blue-700 transition-colors"
                >
                    {editing ? <><EyeOff className="w-3 h-3" />Đóng</> : <><Pencil className="w-3 h-3" />Sửa</>}
                </button>
            </div>
            {editing ? (
                <div className="relative">
                    <input
                        value={search}
                        onChange={e => {
                            setSearch(e.target.value)
                            setIsOpen(true)
                        }}
                        onFocus={() => setIsOpen(true)}
                        placeholder="Tìm kiếm cơ quan..."
                        className={cn(
                            "w-full border rounded-lg px-3 py-2 text-sm transition-all outline-none",
                            search.trim().length > 0 && !options.some(o => o.ten_co_quan.toLowerCase() === search.trim().toLowerCase())
                                ? "bg-red-50/20 border-red-400 text-red-700 focus:ring-2 focus:ring-red-200"
                                : "bg-white border-blue-300 text-slate-800 focus:ring-2 focus:ring-blue-100"
                        )}
                        autoFocus
                    />
                    {search.trim().length > 0 && !options.some(o => o.ten_co_quan.toLowerCase() === search.trim().toLowerCase()) && !isOpen && (
                        <p className="text-[10px] text-red-500 font-medium absolute -bottom-4 left-1">⚠️ Bắt buộc chọn từ danh sách</p>
                    )}
                    {isOpen && (
                        <div className="absolute z-[150] w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                            {filteredOptions.length === 0 ? (
                                <div className="p-3 text-sm text-slate-500 italic text-center">Không tìm thấy kết quả</div>
                            ) : (
                                <ul className="py-1">
                                    {filteredOptions.map(opt => (
                                        <li
                                            key={opt.id}
                                            onClick={() => {
                                                onChange(opt.ten_co_quan)
                                                setSearch(opt.ten_co_quan)
                                                setIsOpen(false)
                                                setEditing(false)
                                            }}
                                            className="px-3 py-2 text-sm text-slate-700 hover:bg-blue-50 cursor-pointer"
                                        >
                                            {opt.ten_co_quan} {opt.cap_co_quan && <span className="text-[10px] text-slate-400 ml-1">({opt.cap_co_quan})</span>}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    )}
                </div>
            ) : (
                <div className={cn('rounded-lg px-3 py-2.5 text-sm leading-relaxed border min-h-[40px]', colorClass)}>
                    {value ? (
                        <span className="text-slate-800 whitespace-pre-wrap">{value}</span>
                    ) : (
                        <span className={cn('italic', emptyColor)}>{emptyLabel}</span>
                    )}
                </div>
            )}
        </div>
    )
}

// ——— AddProgressForm ——————————————————————————————
function AddProgressForm({ onAdd }: { onAdd: (entry: TienDoEntry) => void }) {
    const [open, setOpen] = useState(false)
    const [date, setDate] = useState(todayISO())
    const [content, setContent] = useState('')
    const textRef = useRef<HTMLTextAreaElement>(null)

    const handleSubmit = () => {
        if (!content.trim()) return
        onAdd({
            id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(7),
            date,
            content: content.trim(),
        })
        setContent('')
        setDate(todayISO())
        setOpen(false)
    }

    useEffect(() => {
        if (open) setTimeout(() => textRef.current?.focus(), 100)
    }, [open])

    if (!open) {
        return (
            <button
                onClick={() => setOpen(true)}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg border-2 border-dashed border-blue-200 text-blue-600 text-sm font-medium hover:border-blue-400 hover:bg-blue-50/50 transition-all"
            >
                <Plus className="w-4 h-4" />
                Thêm cập nhật mới
            </button>
        )
    }

    return (
        <div className="bg-blue-50/60 border border-blue-200 rounded-xl p-4 space-y-3 animate-in slide-in-from-top-2 fade-in duration-200">
            <p className="text-xs font-semibold text-blue-700 uppercase tracking-wider">Thêm cập nhật tiến độ</p>
            <div>
                <label className="text-xs font-medium text-slate-500 mb-1 block">Ngày</label>
                <input
                    type="date"
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    className="w-full bg-white border border-blue-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
            </div>
            <div>
                <label className="text-xs font-medium text-slate-500 mb-1 block">Nội dung</label>
                <textarea
                    ref={textRef}
                    value={content}
                    onChange={e => setContent(e.target.value)}
                    placeholder="Mô tả nội dung cập nhật..."
                    className="w-full bg-white border border-blue-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 min-h-[80px] resize-none"
                />
            </div>
            <div className="flex gap-2">
                <button
                    onClick={handleSubmit}
                    disabled={!content.trim()}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                    <Plus className="w-3.5 h-3.5" /> Thêm
                </button>
                <button
                    onClick={() => setOpen(false)}
                    className="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                >
                    Hủy
                </button>
            </div>
        </div>
    )
}

// ——— Main component ————————————————————————————————
export default function DetailModal({ open, record, onClose, onSuccess }: Props) {
    const supabase = createClient()
    const toast = useToast()

    const [form, setForm] = useState<Partial<AnHanhChinh>>({})
    const [danhSachQuyetDinh, setDanhSachQuyetDinh] = useState<QuyetDinhEntry[]>([])
    const [originalDanhSachQuyetDinh, setOriginalDanhSachQuyetDinh] = useState<QuyetDinhEntry[]>([])
    const [danhSachQuyetDinhBuoc, setDanhSachQuyetDinhBuoc] = useState<QuyetDinhEntry[]>([])
    const [originalDanhSachQuyetDinhBuoc, setOriginalDanhSachQuyetDinhBuoc] = useState<QuyetDinhEntry[]>([])
    const [timeline, setTimeline] = useState<TienDoEntry[]>([])
    const [originalTimeline, setOriginalTimeline] = useState<TienDoEntry[]>([])
    const [editingEntryId, setEditingEntryId] = useState<string | null>(null)
    const [editingEntry, setEditingEntry] = useState<{ date: string; content: string }>({ date: '', content: '' })
    const [loading, setLoading] = useState(false)
    const [dmCoQuan, setDmCoQuan] = useState<{id: string, ten_co_quan: string, cap_co_quan: string}[]>([])

    useEffect(() => {
        async function fetchDm() {
            const { data } = await supabase.from('dm_co_quan').select('*').order('cap_co_quan', { ascending: true })
            if (data) setDmCoQuan(data)
        }
        fetchDm()
    }, [supabase])

    useEffect(() => {
        if (open && record) {
            setForm({
                so_ban_an: record.so_ban_an ?? '',
                nguoi_khoi_kien: record.nguoi_khoi_kien ?? '',
                nguoi_phai_thi_hanh: record.nguoi_phai_thi_hanh ?? '',
                nghia_vu_thi_hanh: record.nghia_vu_thi_hanh ?? '',
                quyet_dinh_buoc_thi_hanh: record.quyet_dinh_buoc_thi_hanh ?? '',
                ly_do_cho_theo_doi: record.ly_do_cho_theo_doi ?? '',
                ket_qua_cuoi_cung: record.ket_qua_cuoi_cung ?? '',
            })
            const tl = Array.isArray(record.tien_do_cap_nhat) ? record.tien_do_cap_nhat : []
            setTimeline(sortByDateDesc(tl))
            setOriginalTimeline(sortByDateDesc(tl))
            
            let parsedQD: QuyetDinhEntry[] = []
            try {
                if (record.so_ban_an) {
                    const parsed = JSON.parse(record.so_ban_an)
                    if (Array.isArray(parsed)) {
                        parsedQD = parsed
                    } else {
                        parsedQD = [{
                            id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(7),
                            so_quyet_dinh: record.so_ban_an,
                            ngay_ban_hanh: '',
                            co_quan_ban_hanh: ''
                        }]
                    }
                }
            } catch (e) {
                if (record.so_ban_an) {
                    parsedQD = [{
                        id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(7),
                        so_quyet_dinh: record.so_ban_an,
                        ngay_ban_hanh: '',
                        co_quan_ban_hanh: ''
                    }]
                }
            }
            if (parsedQD.length === 0) {
                 parsedQD = [{
                     id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(7),
                     so_quyet_dinh: '',
                     ngay_ban_hanh: '',
                     co_quan_ban_hanh: ''
                 }]
            }
            setDanhSachQuyetDinh(parsedQD)
            setOriginalDanhSachQuyetDinh(JSON.parse(JSON.stringify(parsedQD)))

            let parsedQDBuoc: QuyetDinhEntry[] = []
            try {
                if (record.quyet_dinh_buoc_thi_hanh) {
                    const parsed = JSON.parse(record.quyet_dinh_buoc_thi_hanh)
                    if (Array.isArray(parsed)) {
                        parsedQDBuoc = parsed
                    } else {
                        parsedQDBuoc = [{
                            id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(7),
                            so_quyet_dinh: record.quyet_dinh_buoc_thi_hanh,
                            ngay_ban_hanh: '',
                            co_quan_ban_hanh: ''
                        }]
                    }
                }
            } catch (e) {
                if (record.quyet_dinh_buoc_thi_hanh) {
                    parsedQDBuoc = [{
                        id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(7),
                        so_quyet_dinh: record.quyet_dinh_buoc_thi_hanh,
                        ngay_ban_hanh: '',
                        co_quan_ban_hanh: ''
                    }]
                }
            }
            if (parsedQDBuoc.length === 0) {
                 parsedQDBuoc = [{
                     id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(7),
                     so_quyet_dinh: '',
                     ngay_ban_hanh: '',
                     co_quan_ban_hanh: ''
                 }]
            }
            setDanhSachQuyetDinhBuoc(parsedQDBuoc)
            setOriginalDanhSachQuyetDinhBuoc(JSON.parse(JSON.stringify(parsedQDBuoc)))
        }
    }, [open, record])

    if (!open || !record) return null

    const updateField = (field: keyof AnHanhChinh, value: string) => {
        setForm(prev => ({ ...prev, [field]: value }))
    }

    const addEntry = (entry: TienDoEntry) => {
        setTimeline(prev => sortByDateDesc([entry, ...prev]))
    }

    const removeEntry = (id: string) => {
        setTimeline(prev => prev.filter(e => (e.id || '') !== id))
    }

    const startEditEntry = (entry: TienDoEntry) => {
        setEditingEntryId(entry.id || '')
        setEditingEntry({ date: entry.date, content: entry.content })
    }

    const saveEditEntry = (id: string) => {
        setTimeline(prev => sortByDateDesc(prev.map(e =>
            (e.id || '') === id
                ? { ...e, date: editingEntry.date, content: editingEntry.content }
                : e
        )))
        setEditingEntryId(null)
    }

    const cancelEditEntry = () => {
        setEditingEntryId(null)
    }

    const updateQuyetDinh = (id: string, field: keyof QuyetDinhEntry, value: string) => {
        setDanhSachQuyetDinh(prev => prev.map(qd => qd.id === id ? { ...qd, [field]: value } : qd))
    }
    const addQuyetDinh = () => {
        setDanhSachQuyetDinh(prev => [...prev, {
            id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(7),
            so_quyet_dinh: '',
            ngay_ban_hanh: '',
            co_quan_ban_hanh: ''
        }])
    }
    const removeQuyetDinh = (id: string) => {
        setDanhSachQuyetDinh(prev => prev.filter(qd => qd.id !== id))
    }

    const updateQuyetDinhBuoc = (id: string, field: keyof QuyetDinhEntry, value: string) => {
        setDanhSachQuyetDinhBuoc(prev => prev.map(qd => qd.id === id ? { ...qd, [field]: value } : qd))
    }
    const addQuyetDinhBuoc = () => {
        setDanhSachQuyetDinhBuoc(prev => [...prev, {
            id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(7),
            so_quyet_dinh: '',
            ngay_ban_hanh: '',
            co_quan_ban_hanh: ''
        }])
    }
    const removeQuyetDinhBuoc = (id: string) => {
        setDanhSachQuyetDinhBuoc(prev => prev.filter(qd => qd.id !== id))
    }

    const hasChanges = () => {
        if (!record) return false
        const formChanged =
            (form.nguoi_khoi_kien ?? '') !== (record.nguoi_khoi_kien ?? '') ||
            (form.nguoi_phai_thi_hanh ?? '') !== (record.nguoi_phai_thi_hanh ?? '') ||
            (form.nghia_vu_thi_hanh ?? '') !== (record.nghia_vu_thi_hanh ?? '') ||
            (form.ly_do_cho_theo_doi ?? '') !== (record.ly_do_cho_theo_doi ?? '') ||
            (form.ket_qua_cuoi_cung ?? '') !== (record.ket_qua_cuoi_cung ?? '')
        const tlChanged = JSON.stringify(timeline) !== JSON.stringify(originalTimeline)
        const qdChanged = JSON.stringify(danhSachQuyetDinh) !== JSON.stringify(originalDanhSachQuyetDinh)
        const qdBuocChanged = JSON.stringify(danhSachQuyetDinhBuoc) !== JSON.stringify(originalDanhSachQuyetDinhBuoc)
        return formChanged || tlChanged || qdChanged || qdBuocChanged
    }

    const handleSave = async () => {
        if (!record) return
        setLoading(true)

        const payload = {
            so_ban_an: JSON.stringify(danhSachQuyetDinh),
            nguoi_khoi_kien: form.nguoi_khoi_kien,
            nguoi_phai_thi_hanh: form.nguoi_phai_thi_hanh,
            nghia_vu_thi_hanh: form.nghia_vu_thi_hanh || null,
            quyet_dinh_buoc_thi_hanh: JSON.stringify(danhSachQuyetDinhBuoc),
            ly_do_cho_theo_doi: form.ly_do_cho_theo_doi || null,
            ket_qua_cuoi_cung: form.ket_qua_cuoi_cung || null,
            tien_do_cap_nhat: timeline,
        }

        const { error } = await supabase.from('an_hanh_chinh').update(payload).eq('id', record.id)
        setLoading(false)

        if (error) {
            toast.error(`Lỗi cập nhật: ${error.message}`)
            return
        }

        toast.success('Đã lưu thay đổi thành công!')
        setOriginalTimeline(timeline)
        setOriginalDanhSachQuyetDinh(JSON.parse(JSON.stringify(danhSachQuyetDinh)))
        setOriginalDanhSachQuyetDinhBuoc(JSON.parse(JSON.stringify(danhSachQuyetDinhBuoc)))
        Object.assign(record, payload)
        if (onSuccess) onSuccess()
    }

    const handleMoveToStatus = async (status: 'WATCHING' | 'COMPLETED') => {
        if (!record) return
        setLoading(true)

        const payload = {
            so_ban_an: JSON.stringify(danhSachQuyetDinh),
            nguoi_khoi_kien: form.nguoi_khoi_kien,
            nguoi_phai_thi_hanh: form.nguoi_phai_thi_hanh,
            nghia_vu_thi_hanh: form.nghia_vu_thi_hanh || null,
            quyet_dinh_buoc_thi_hanh: JSON.stringify(danhSachQuyetDinhBuoc),
            ly_do_cho_theo_doi: form.ly_do_cho_theo_doi || null,
            ket_qua_cuoi_cung: form.ket_qua_cuoi_cung || null,
            tien_do_cap_nhat: timeline,
            status,
        }

        const { error } = await supabase.from('an_hanh_chinh').update(payload).eq('id', record.id)
        setLoading(false)

        if (error) {
            toast.error(`Lỗi cập nhật: ${error.message}`)
            return
        }

        toast.success(`Đã chuyển sang trạng thái "${status === 'WATCHING' ? 'Chờ theo dõi' : 'Án xong'}"`)
        if (onSuccess) onSuccess()
        onClose()
    }

    const statusBadge = {
        PENDING: { label: 'Đang thi hành', cls: 'bg-amber-100 text-amber-700 border-amber-200' },
        WATCHING: { label: 'Chờ theo dõi', cls: 'bg-blue-100 text-blue-700 border-blue-200' },
        COMPLETED: { label: 'Án xong', cls: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
    }[record.status] ?? { label: record.status, cls: 'bg-slate-100 text-slate-600 border-slate-200' }

    return (
        <div className="fixed inset-0 z-[100] flex items-stretch">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

            {/* Full-screen panel */}
            <div className="relative w-full h-full bg-white flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-300 overflow-hidden">

                {/* ── Top Header Bar ─────────────────────────── */}
                <div className="shrink-0 flex items-center justify-between px-8 py-4 bg-white border-b border-slate-200 shadow-sm z-10">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-red-900 to-red-700 flex items-center justify-center shadow">
                            <Scale className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <p className="text-xs text-slate-400 font-medium">Chi tiết án hành chính</p>
                            <h2 className="text-base font-bold text-slate-800 leading-tight line-clamp-1 max-w-[500px]">
                                {danhSachQuyetDinh.map(formatQuyetDinh).filter(Boolean).join('; ') || 'Chưa có số bản án'}
                            </h2>
                        </div>
                        <span className={cn(
                            'text-xs font-bold px-3 py-1 rounded-full border',
                            statusBadge.cls
                        )}>
                            {statusBadge.label}
                        </span>
                    </div>

                    <div className="flex items-center gap-3">
                        {hasChanges() && (
                            <button
                                onClick={handleSave}
                                disabled={loading}
                                className="flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-all disabled:opacity-50 shadow-md shadow-blue-200 animate-in fade-in zoom-in-95 duration-200"
                            >
                                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
                            </button>
                        )}
                        <button
                            onClick={onClose}
                            className="p-2 text-red-500 hover:text-white hover:bg-red-600 hover:rotate-90 rounded-xl transition-all duration-300 bg-red-50/50 border border-red-100/50 shadow-sm px-2.5"
                            title="Đóng"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* ── Two-column body ─────────────────────────── */}
                <div className="flex-1 flex overflow-hidden">

                    {/* LEFT COLUMN — Information Fields */}
                    <div className="w-[55%] flex flex-col border-r border-slate-100 overflow-y-auto bg-slate-50/30">
                        <div className="p-8 space-y-6">
                            <div className="flex items-center gap-2 mb-2">
                                <FileText className="w-4 h-4 text-slate-400" />
                                <h3 className="text-sm font-bold text-slate-600 uppercase tracking-widest">Thông tin án</h3>
                            </div>

                            {/* 2-column info grid */}
                            {/* Người khởi kiện (2) */}
                            <div className="bg-white rounded-xl border border-amber-100 p-4 space-y-1.5 shadow-sm">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-red-600 text-white text-[11px] font-bold shadow-sm shrink-0">2</span>
                                    <div className="w-6 h-6 rounded-md bg-amber-50 flex items-center justify-center shrink-0">
                                        <User className="w-3.5 h-3.5 text-amber-600" />
                                    </div>
                                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Người khởi kiện</span>
                                </div>
                                <EditableField
                                    label=""
                                    value={form.nguoi_khoi_kien ?? ''}
                                    onChange={v => updateField('nguoi_khoi_kien', v)}
                                    colorClass="bg-amber-50/50 border-amber-100"
                                    emptyColor="text-amber-300"
                                />
                            </div>

                            {/* Các Quyết Định / Bản Án (3) */}
                            <div className="bg-white rounded-xl border border-blue-100 p-5 space-y-3 shadow-sm">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-red-600 text-white text-[11px] font-bold shadow-sm shrink-0">3</span>
                                    <div className="w-6 h-6 rounded-md bg-blue-50 flex items-center justify-center shrink-0">
                                        <FileText className="w-3.5 h-3.5 text-blue-600" />
                                    </div>
                                    <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Các BẢN ÁN / QUYẾT ĐỊNH (<span className="text-blue-600">{danhSachQuyetDinh.length}</span>)</span>
                                </div>
                                
                                <div className="space-y-3">
                                    {danhSachQuyetDinh.map((qd, index) => (
                                        <div key={qd.id || index} className="p-3 bg-blue-50/30 border border-blue-100/60 rounded-xl relative group transition-colors hover:bg-blue-50/60 hover:border-blue-200">
                                            {danhSachQuyetDinh.length > 1 && (
                                                <button 
                                                    onClick={() => removeQuyetDinh(qd.id!)}
                                                    className="absolute -top-2 -right-2 w-[22px] h-[22px] bg-white border border-red-200 rounded-full flex items-center justify-center text-red-400 hover:bg-red-500 hover:text-white hover:border-red-500 opacity-0 group-hover:opacity-100 transition-all shadow-sm z-10"
                                                    title="Xóa mục này"
                                                >
                                                    <X className="w-3.5 h-3.5" />
                                                </button>
                                            )}
                                            <div className="grid grid-cols-1 sm:grid-cols-[1fr_120px_1.5fr] gap-3">
                                                <div>
                                                    <label className="text-[10px] uppercase font-bold text-blue-600/70 tracking-wide mb-1 block">Số Bản án/QĐ</label>
                                                    <input 
                                                        value={qd.so_quyet_dinh}
                                                        onChange={e => updateQuyetDinh(qd.id!, 'so_quyet_dinh', e.target.value)}
                                                        className="w-full bg-white border border-slate-200 rounded-lg text-sm px-2.5 py-1.5 font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 transition-all shadow-sm"
                                                        placeholder="VD: 01/2025/HC-ST"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-[10px] uppercase font-bold text-blue-600/70 tracking-wide mb-1 block">Ngày ban hành</label>
                                                    <DateInput 
                                                        value={qd.ngay_ban_hanh}
                                                        onChange={val => updateQuyetDinh(qd.id!, 'ngay_ban_hanh', val)}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-[10px] uppercase font-bold text-blue-600/70 tracking-wide mb-1 block">Cơ quan ban hành</label>
                                                    <input 
                                                        value={qd.co_quan_ban_hanh}
                                                        onChange={e => updateQuyetDinh(qd.id!, 'co_quan_ban_hanh', e.target.value)}
                                                        className="w-full bg-white border border-slate-200 rounded-lg text-sm px-2.5 py-1.5 font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 transition-all shadow-sm"
                                                        placeholder="VD: TAND Tỉnh..."
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <button
                                    onClick={addQuyetDinh}
                                    className="w-full mt-2 py-2 flex items-center justify-center gap-1.5 text-xs font-bold text-blue-600 bg-blue-50/50 hover:bg-blue-100/80 border-2 border-blue-200 border-dashed rounded-xl transition-all active:scale-[0.99]"
                                >
                                    <Plus className="w-4 h-4" /> THÊM QUYẾT ĐỊNH
                                </button>
                            </div>

                            {/* Người phải thi hành (4) */}
                            <div className="bg-white rounded-xl border border-red-100 p-4 space-y-1.5 shadow-sm">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-red-600 text-white text-[11px] font-bold shadow-sm shrink-0">4</span>
                                    <div className="w-6 h-6 rounded-md bg-red-50 flex items-center justify-center shrink-0">
                                        <Building2 className="w-3.5 h-3.5 text-red-600" />
                                    </div>
                                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Người phải thi hành</span>
                                </div>
                                <EditableCombobox
                                    label=""
                                    value={form.nguoi_phai_thi_hanh ?? ''}
                                    onChange={v => updateField('nguoi_phai_thi_hanh', v)}
                                    options={dmCoQuan}
                                    colorClass="bg-red-50/50 border-red-100"
                                    emptyColor="text-red-300"
                                />
                            </div>

                            {/* Nghĩa vụ phải thi hành án */}
                            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                                <EditableField
                                    label={<span className="flex items-center gap-2"><span className="flex items-center justify-center w-5 h-5 rounded-full bg-red-600 text-white text-[11px] font-bold shadow-sm shrink-0">5</span> <div className="w-6 h-6 rounded-md bg-slate-100 flex items-center justify-center shrink-0"><Scale className="w-3.5 h-3.5 text-slate-600" /></div> <span>Nghĩa vụ phải Thi hành án</span></span>}
                                    value={form.nghia_vu_thi_hanh ?? ''}
                                    onChange={v => updateField('nghia_vu_thi_hanh', v)}
                                    multiline
                                    colorClass="bg-slate-50 border-slate-200"
                                    emptyLabel="Chưa có dữ liệu"
                                />
                            </div>
                            {/* QĐ buộc thi hành án Array Editor */}
                            <div className="bg-white rounded-xl border border-orange-200 p-5 space-y-3 shadow-sm">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-red-600 text-white text-[11px] font-bold shadow-sm shrink-0">6</span>
                                    <div className="w-6 h-6 rounded-md bg-orange-50 flex items-center justify-center shrink-0">
                                        <AlertCircle className="w-3.5 h-3.5 text-orange-600" />
                                    </div>
                                    <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">CÁC QĐ BUỘC THI HÀNH ÁN (<span className="text-orange-600">{danhSachQuyetDinhBuoc.length}</span>)</span>
                                </div>
                                
                                <div className="space-y-3">
                                    {danhSachQuyetDinhBuoc.map((qd, index) => (
                                        <div key={qd.id || index} className="p-3 bg-orange-50/50 border border-orange-100 rounded-xl relative group transition-colors hover:bg-orange-50 hover:border-orange-200">
                                            {danhSachQuyetDinhBuoc.length > 1 && (
                                                <button 
                                                    onClick={() => removeQuyetDinhBuoc(qd.id!)}
                                                    className="absolute -top-2 -right-2 w-[22px] h-[22px] bg-white border border-red-200 rounded-full flex items-center justify-center text-red-400 hover:bg-red-500 hover:text-white hover:border-red-500 opacity-0 group-hover:opacity-100 transition-all shadow-sm z-10"
                                                    title="Xóa mục này"
                                                >
                                                    <X className="w-3.5 h-3.5" />
                                                </button>
                                            )}
                                            <div className="grid grid-cols-1 sm:grid-cols-[1fr_120px_1.5fr] gap-3">
                                                <div>
                                                    <label className="text-[10px] uppercase font-bold text-orange-600/80 tracking-wide mb-1 block">Số Quyết định</label>
                                                    <input 
                                                        value={qd.so_quyet_dinh}
                                                        onChange={e => updateQuyetDinhBuoc(qd.id!, 'so_quyet_dinh', e.target.value)}
                                                        className="w-full bg-white border border-slate-200 rounded-lg text-sm px-2.5 py-1.5 font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-300 transition-all shadow-sm"
                                                        placeholder="VD: 02/2026/QĐ-BTHA"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-[10px] uppercase font-bold text-orange-600/80 tracking-wide mb-1 block">Ngày ban hành</label>
                                                    <DateInput 
                                                        value={qd.ngay_ban_hanh}
                                                        onChange={val => updateQuyetDinhBuoc(qd.id!, 'ngay_ban_hanh', val)}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-[10px] uppercase font-bold text-orange-600/80 tracking-wide mb-1 block">Cơ quan ban hành</label>
                                                    <input 
                                                        value={qd.co_quan_ban_hanh}
                                                        onChange={e => updateQuyetDinhBuoc(qd.id!, 'co_quan_ban_hanh', e.target.value)}
                                                        className="w-full bg-white border border-slate-200 rounded-lg text-sm px-2.5 py-1.5 font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-300 transition-all shadow-sm"
                                                        placeholder="VD: TAND Tỉnh..."
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <button
                                    onClick={addQuyetDinhBuoc}
                                    className="w-full mt-2 py-2 flex items-center justify-center gap-1.5 text-xs font-bold text-orange-600 bg-orange-50/50 hover:bg-orange-100 border-2 border-orange-200 border-dashed rounded-xl transition-all active:scale-[0.99]"
                                >
                                    <Plus className="w-4 h-4" /> THÊM QĐ BUỘC
                                </button>
                            </div>

                            {/* 8. Chờ theo dõi */}
                            <div className={cn(
                                'rounded-xl border p-5 shadow-sm space-y-4',
                                record.status === 'WATCHING' ? 'bg-white border-blue-200' : 'bg-white border-slate-200'
                            )}>
                                <div className="flex items-center gap-2">
                                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-red-600 text-white text-[11px] font-bold shadow-sm shrink-0">8</span>
                                    <h3 className="text-sm font-bold text-slate-700 uppercase tracking-widest">
                                        Chờ theo dõi
                                    </h3>
                                </div>
                                <EditableField
                                    label="Lý do chờ theo dõi"
                                    value={form.ly_do_cho_theo_doi ?? ''}
                                    onChange={v => updateField('ly_do_cho_theo_doi', v)}
                                    multiline
                                    colorClass={record.status === 'WATCHING' ? 'bg-blue-50 border-blue-200' : 'bg-slate-50 border-slate-200'}
                                    emptyColor={record.status === 'WATCHING' ? 'text-blue-400' : 'text-slate-400'}
                                    emptyLabel="Chưa có dữ liệu"
                                />
                                {form.ly_do_cho_theo_doi?.trim() && record.status !== 'WATCHING' && (
                                    <div className="flex justify-end mt-4">
                                        <button
                                            onClick={() => handleMoveToStatus('WATCHING')}
                                            disabled={loading}
                                            className="px-6 py-2 text-sm font-bold text-white bg-red-600 border border-red-600 rounded-xl hover:bg-red-700 hover:border-red-700 hover:shadow-[0_8px_20px_-6px_rgba(220,38,38,0.4)] transition-all duration-300 active:scale-95 disabled:opacity-50 flex items-center gap-2"
                                        >
                                            <ArrowRightCircle className="w-4 h-4" /> Chuyển sang Chờ theo dõi
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* 9. Kết quả cuối cùng */}
                            <div className={cn(
                                'rounded-xl border p-5 shadow-sm space-y-4',
                                record.status === 'COMPLETED' ? 'bg-white border-emerald-200' : 'bg-white border-slate-200'
                            )}>
                                <div className="flex items-center gap-2">
                                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-red-600 text-white text-[11px] font-bold shadow-sm shrink-0">9</span>
                                    <h3 className="text-sm font-bold text-slate-700 uppercase tracking-widest">
                                        Kết quả thi hành án
                                    </h3>
                                </div>
                                <EditableField
                                    label="Chi tiết kết quả"
                                    value={form.ket_qua_cuoi_cung ?? ''}
                                    onChange={v => updateField('ket_qua_cuoi_cung', v)}
                                    multiline
                                    colorClass={record.status === 'COMPLETED' ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200'}
                                    emptyColor={record.status === 'COMPLETED' ? 'text-emerald-400' : 'text-slate-400'}
                                    emptyLabel="Chưa kết thúc"
                                />
                                {form.ket_qua_cuoi_cung?.trim() && record.status !== 'COMPLETED' && (
                                    <div className="flex justify-end mt-4">
                                        <button
                                            onClick={() => handleMoveToStatus('COMPLETED')}
                                            disabled={loading}
                                            className="px-6 py-2 text-sm font-bold text-white bg-emerald-600 border border-emerald-600 rounded-xl hover:bg-emerald-700 hover:border-emerald-700 hover:shadow-[0_8px_20px_-6px_rgba(16,185,129,0.4)] transition-all duration-300 active:scale-95 disabled:opacity-50 flex items-center gap-2"
                                        >
                                            <CheckCircle2 className="w-4 h-4" /> Chuyển sang Án xong
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* RIGHT COLUMN — Timeline / Progress */}
                    <div className="w-[45%] flex flex-col overflow-y-auto bg-white">
                        <div className="p-8 space-y-5 flex flex-col h-full">
                            {/* Header */}
                            <div className="flex items-center justify-between shrink-0">
                                <div className="flex items-center gap-2">
                                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-red-600 text-white text-[11px] font-bold shadow-sm shrink-0">7</span>
                                    <Clock className="w-4 h-4 text-slate-400" />
                                    <h3 className="text-sm font-bold text-slate-600 uppercase tracking-widest">
                                        Quá trình Thi Hành Án
                                    </h3>
                                    <span className="text-xs bg-slate-100 text-slate-500 font-semibold px-2 py-0.5 rounded-full">
                                        {timeline.length}
                                    </span>
                                </div>
                            </div>

                            {/* Add form */}
                            <AddProgressForm onAdd={addEntry} />

                            {/* Timeline list */}
                            <div className="flex-1">
                                {timeline.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-40 text-slate-400 gap-2">
                                        <Clock className="w-8 h-8 opacity-30" />
                                        <p className="text-sm">Chưa có cập nhật nào</p>
                                    </div>
                                ) : (
                                    <div className="relative pl-6 space-y-0">
                                        {/* Vertical line */}
                                        <div className="absolute left-[9px] top-2 bottom-2 w-0.5 bg-gradient-to-b from-blue-300 via-slate-200 to-slate-100" />
                                        {timeline.map((entry, idx) => {
                                            const eid = entry.id || String(idx)
                                            const isEditing = editingEntryId === eid
                                            return (
                                                <div key={eid} className="relative pb-4 last:pb-0 group">
                                                    {/* Dot */}
                                                    <div className={cn(
                                                        'absolute -left-6 top-1.5 w-[18px] h-[18px] rounded-full border-2 flex items-center justify-center transition-colors',
                                                        idx === 0
                                                            ? 'border-blue-500 bg-blue-50 group-hover:border-blue-600'
                                                            : 'border-slate-300 bg-white group-hover:border-slate-400'
                                                    )}>
                                                        <div className={cn(
                                                            'w-2 h-2 rounded-full transition-colors',
                                                            idx === 0 ? 'bg-blue-500 group-hover:bg-blue-600' : 'bg-slate-300 group-hover:bg-slate-400'
                                                        )} />
                                                    </div>

                                                    {/* Card */}
                                                    <div className={cn(
                                                        'ml-2 rounded-xl p-3.5 transition-all shadow-sm border',
                                                        isEditing
                                                            ? 'bg-blue-50/60 border-blue-200 shadow-md'
                                                            : 'bg-slate-50/70 hover:bg-white border-transparent hover:border-slate-200 group-hover:shadow-md'
                                                    )}>
                                                        {isEditing ? (
                                                            /* ── Edit mode ── */
                                                            <div className="space-y-2.5 animate-in fade-in slide-in-from-top-1 duration-150">
                                                                <div>
                                                                    <label className="text-[11px] font-semibold text-blue-700 uppercase tracking-wider mb-1 block">Ngày</label>
                                                                    <input
                                                                        type="date"
                                                                        value={editingEntry.date}
                                                                        onChange={e => setEditingEntry(prev => ({ ...prev, date: e.target.value }))}
                                                                        className="w-full bg-white text-slate-800 font-medium border border-blue-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100"
                                                                    />
                                                                </div>
                                                                <div>
                                                                    <label className="text-[11px] font-semibold text-blue-700 uppercase tracking-wider mb-1 block">Nội dung</label>
                                                                    <textarea
                                                                        value={editingEntry.content}
                                                                        onChange={e => setEditingEntry(prev => ({ ...prev, content: e.target.value }))}
                                                                        className="w-full bg-white text-slate-800 font-medium border border-blue-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 min-h-[70px] resize-none"
                                                                        autoFocus
                                                                    />
                                                                </div>
                                                                <div className="flex gap-2">
                                                                    <button
                                                                        onClick={() => saveEditEntry(eid)}
                                                                        disabled={!editingEntry.content.trim()}
                                                                        className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-40 transition-colors"
                                                                    >
                                                                        <Save className="w-3 h-3" /> Lưu
                                                                    </button>
                                                                    <button
                                                                        onClick={cancelEditEntry}
                                                                        className="px-3 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                                                                    >
                                                                        Hủy
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            /* ── View mode ── */
                                                            <>
                                                                <div className="flex items-start justify-between gap-2">
                                                                    <div className="flex items-center gap-1.5 mb-1.5">
                                                                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                                                        <span className={cn(
                                                                            'text-xs font-bold',
                                                                            idx === 0 ? 'text-blue-600' : 'text-slate-500'
                                                                        )}>
                                                                            {formatDateVN(entry.date)}
                                                                        </span>
                                                                        {idx === 0 && (
                                                                            <span className="text-[10px] font-semibold bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full">
                                                                                Mới nhất
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                        <button
                                                                            onClick={() => startEditEntry(entry)}
                                                                            className="p-1 text-blue-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                                                                            title="Chỉnh sửa"
                                                                        >
                                                                            <Pencil className="w-3.5 h-3.5" />
                                                                        </button>
                                                                        <button
                                                                            onClick={() => removeEntry(eid)}
                                                                            className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                                                                            title="Xóa cập nhật này"
                                                                        >
                                                                            <Trash2 className="w-3.5 h-3.5" />
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                                <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                                                                    {entry.content}
                                                                </p>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Bottom footer bar ──────────────────────── */}
                <div className="shrink-0 flex items-center justify-between px-8 py-3 bg-slate-50 border-t border-slate-200">
                    <p className="text-xs text-slate-400">
                        {hasChanges()
                            ? <span className="text-amber-600 font-medium">⚠ Có thay đổi chưa lưu</span>
                            : 'Tất cả thay đổi đã được lưu'}
                    </p>
                    <div className="flex gap-2">
                        <button
                            onClick={onClose}
                            disabled={loading}
                            className="px-6 py-2 text-sm font-bold text-red-600 bg-white border-2 border-red-100 rounded-xl hover:bg-red-600 hover:text-white hover:border-red-600 hover:shadow-[0_8px_20px_-6px_rgba(220,38,38,0.4)] transition-all duration-300 active:scale-95 disabled:opacity-50"
                        >
                            Đóng
                        </button>
                        {hasChanges() && (
                            <button
                                onClick={handleSave}
                                disabled={loading}
                                className="flex items-center gap-1.5 px-5 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-all disabled:opacity-50 shadow-sm"
                            >
                                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
