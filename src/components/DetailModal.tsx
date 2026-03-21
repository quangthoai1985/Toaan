'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { AnHanhChinh, TienDoEntry } from '@/lib/types'
import {
    X, FileText, Calendar, User, Building2, Scale, Clock,
    Pencil, Loader2, Save, Plus, Trash2, ChevronDown, ChevronUp,
    CheckCircle2, AlertCircle, Eye, EyeOff
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useToast } from './Toast'

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
    label: string
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
    const [timeline, setTimeline] = useState<TienDoEntry[]>([])
    const [originalTimeline, setOriginalTimeline] = useState<TienDoEntry[]>([])
    const [editingEntryId, setEditingEntryId] = useState<string | null>(null)
    const [editingEntry, setEditingEntry] = useState<{ date: string; content: string }>({ date: '', content: '' })
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (open && record) {
            setForm({
                so_ban_an: record.so_ban_an ?? '',
                nguoi_khoi_kien: record.nguoi_khoi_kien ?? '',
                nguoi_phai_thi_hanh: record.nguoi_phai_thi_hanh ?? '',
                nghia_vu_thi_hanh: record.nghia_vu_thi_hanh ?? '',
                quyet_dinh_buoc_thi_hanh: record.quyet_dinh_buoc_thi_hanh ?? '',
                ket_qua_cuoi_cung: record.ket_qua_cuoi_cung ?? '',
            })
            const tl = Array.isArray(record.tien_do_cap_nhat) ? record.tien_do_cap_nhat : []
            setTimeline(sortByDateDesc(tl))
            setOriginalTimeline(sortByDateDesc(tl))
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

    const hasChanges = () => {
        if (!record) return false
        const formChanged =
            (form.so_ban_an ?? '') !== (record.so_ban_an ?? '') ||
            (form.nguoi_khoi_kien ?? '') !== (record.nguoi_khoi_kien ?? '') ||
            (form.nguoi_phai_thi_hanh ?? '') !== (record.nguoi_phai_thi_hanh ?? '') ||
            (form.nghia_vu_thi_hanh ?? '') !== (record.nghia_vu_thi_hanh ?? '') ||
            (form.quyet_dinh_buoc_thi_hanh ?? '') !== (record.quyet_dinh_buoc_thi_hanh ?? '') ||
            (form.ket_qua_cuoi_cung ?? '') !== (record.ket_qua_cuoi_cung ?? '')
        const tlChanged = JSON.stringify(timeline) !== JSON.stringify(originalTimeline)
        return formChanged || tlChanged
    }

    const handleSave = async () => {
        if (!record) return
        setLoading(true)

        const payload = {
            so_ban_an: form.so_ban_an,
            nguoi_khoi_kien: form.nguoi_khoi_kien,
            nguoi_phai_thi_hanh: form.nguoi_phai_thi_hanh,
            nghia_vu_thi_hanh: form.nghia_vu_thi_hanh || null,
            quyet_dinh_buoc_thi_hanh: form.quyet_dinh_buoc_thi_hanh || null,
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
        Object.assign(record, payload)
        if (onSuccess) onSuccess()
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
                                {record.so_ban_an || 'Chưa có số bản án'}
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
                            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
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

                            {/* 3-column info grid */}
                            <div className="grid grid-cols-3 gap-4">
                                {/* Người khởi kiện */}
                                <div className="bg-white rounded-xl border border-amber-100 p-4 space-y-1.5 shadow-sm">
                                    <div className="flex items-center gap-1.5 mb-2">
                                        <div className="w-6 h-6 rounded-md bg-amber-50 flex items-center justify-center">
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

                                {/* Người phải thi hành */}
                                <div className="bg-white rounded-xl border border-red-100 p-4 space-y-1.5 shadow-sm">
                                    <div className="flex items-center gap-1.5 mb-2">
                                        <div className="w-6 h-6 rounded-md bg-red-50 flex items-center justify-center">
                                            <Building2 className="w-3.5 h-3.5 text-red-600" />
                                        </div>
                                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Người phải thi hành</span>
                                    </div>
                                    <EditableField
                                        label=""
                                        value={form.nguoi_phai_thi_hanh ?? ''}
                                        onChange={v => updateField('nguoi_phai_thi_hanh', v)}
                                        colorClass="bg-red-50/50 border-red-100"
                                        emptyColor="text-red-300"
                                    />
                                </div>

                                {/* Số Bản án */}
                                <div className="bg-white rounded-xl border border-blue-100 p-4 space-y-1.5 shadow-sm">
                                    <div className="flex items-center gap-1.5 mb-2">
                                        <div className="w-6 h-6 rounded-md bg-blue-50 flex items-center justify-center">
                                            <FileText className="w-3.5 h-3.5 text-blue-600" />
                                        </div>
                                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Số Bản án (Quyết Định phải Thi hành án)</span>
                                    </div>
                                    <EditableField
                                        label=""
                                        value={form.so_ban_an ?? ''}
                                        onChange={v => updateField('so_ban_an', v)}
                                        multiline
                                        colorClass="bg-blue-50/50 border-blue-100"
                                        emptyColor="text-blue-300"
                                    />
                                </div>
                            </div>

                            {/* Nghĩa vụ phải thi hành án */}
                            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                                <EditableField
                                    label="Nghĩa vụ phải Thi hành án"
                                    value={form.nghia_vu_thi_hanh ?? ''}
                                    onChange={v => updateField('nghia_vu_thi_hanh', v)}
                                    multiline
                                    colorClass="bg-slate-50 border-slate-200"
                                    emptyLabel="Chưa có dữ liệu"
                                />
                            </div>

                            {/* QĐ buộc thi hành án */}
                            <div className="bg-white rounded-xl border border-orange-100 p-5 shadow-sm">
                                <EditableField
                                    label="QĐ buộc Thi hành án"
                                    value={form.quyet_dinh_buoc_thi_hanh ?? ''}
                                    onChange={v => updateField('quyet_dinh_buoc_thi_hanh', v)}
                                    multiline
                                    colorClass="bg-orange-50/50 border-orange-100"
                                    emptyColor="text-orange-300"
                                    emptyLabel="Chưa có dữ liệu"
                                />
                            </div>

                            {/* Kết quả cuối cùng — always visible */}
                            <div className={cn(
                                'rounded-xl border p-5 shadow-sm',
                                record.status === 'COMPLETED' ? 'bg-white border-emerald-200' : 'bg-white border-slate-200'
                            )}>
                                <EditableField
                                    label={record.status === 'COMPLETED' ? '✅ Kết quả thi hành' : 'Kết quả thi hành (chưa kết thúc)'}
                                    value={form.ket_qua_cuoi_cung ?? ''}
                                    onChange={v => updateField('ket_qua_cuoi_cung', v)}
                                    multiline
                                    colorClass={record.status === 'COMPLETED' ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200'}
                                    emptyColor={record.status === 'COMPLETED' ? 'text-emerald-400' : 'text-slate-400'}
                                    emptyLabel="Chưa có dữ liệu"
                                />
                            </div>
                        </div>
                    </div>

                    {/* RIGHT COLUMN — Timeline / Progress */}
                    <div className="w-[45%] flex flex-col overflow-y-auto bg-white">
                        <div className="p-8 space-y-5 flex flex-col h-full">
                            {/* Header */}
                            <div className="flex items-center justify-between shrink-0">
                                <div className="flex items-center gap-2">
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
                                                                        className="w-full bg-white border border-blue-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100"
                                                                    />
                                                                </div>
                                                                <div>
                                                                    <label className="text-[11px] font-semibold text-blue-700 uppercase tracking-wider mb-1 block">Nội dung</label>
                                                                    <textarea
                                                                        value={editingEntry.content}
                                                                        onChange={e => setEditingEntry(prev => ({ ...prev, content: e.target.value }))}
                                                                        className="w-full bg-white border border-blue-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 min-h-[70px] resize-none"
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
                            className="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
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
