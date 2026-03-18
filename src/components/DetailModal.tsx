'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { AnHanhChinh, TienDoEntry } from '@/lib/types'
import { X, FileText, Calendar, User, Building2, Scale, Clock, Pencil, Loader2, Save } from 'lucide-react'
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

function parseQTTienDo(text: string): TienDoEntry[] {
    if (!text) return []
    const lines = text.split(/\r?\n/).map(line => line.trim()).filter(line => line !== '')
    const entries: TienDoEntry[] = []
    let currentEntry: TienDoEntry | null = null
    const dateRegex = /(?:Ngày\s+)?(\d{1,2}\/\d{1,2}\/\d{4})/i

    for (let line of lines) {
        const isNewEntryMatch = line.match(dateRegex)
        const hasBulletPoint = /^[-+*]/i.test(line)
        const isNewEntry = isNewEntryMatch || (hasBulletPoint && currentEntry)

        if (isNewEntry || !currentEntry) {
            if (currentEntry) entries.push(currentEntry)
            
            let dateStr = isNewEntryMatch ? isNewEntryMatch[1] : ''
            if (dateStr) {
                const [d, m, y] = dateStr.split('/')
                dateStr = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`
            } else {
                dateStr = new Date().toISOString().split('T')[0]
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

export default function DetailModal({ open, record, onClose, onSuccess }: Props) {
    const supabase = createClient()
    const toast = useToast()

    const [form, setForm] = useState<Partial<AnHanhChinh> & { tien_do_text?: string }>({})
    const [editingFields, setEditingFields] = useState<Set<string>>(new Set())
    const [loading, setLoading] = useState(false)

    const initialTimelineText = (() => {
        if (!record) return ''
        const arr = Array.isArray(record.tien_do_cap_nhat) ? record.tien_do_cap_nhat : []
        return arr.map(t => `- Ngày ${formatDateVN(t.date)}, ${t.content}`).join('\n')
    })()

    useEffect(() => {
        if (open && record) {
            setForm({
                so_ban_an: record.so_ban_an,
                nguoi_khoi_kien: record.nguoi_khoi_kien,
                nguoi_phai_thi_hanh: record.nguoi_phai_thi_hanh,
                nghia_vu_thi_hanh: record.nghia_vu_thi_hanh || '',
                quyet_dinh_buoc_thi_hanh: record.quyet_dinh_buoc_thi_hanh || '',
                ket_qua_cuoi_cung: record.ket_qua_cuoi_cung || '',
                tien_do_text: initialTimelineText,
            })
            setEditingFields(new Set())
        }
    }, [open, record])

    if (!open || !record) return null

    const timeline: TienDoEntry[] = Array.isArray(record.tien_do_cap_nhat) ? record.tien_do_cap_nhat : []

    const hasChanges = () => {
        if (!record) return false
        return (
            form.so_ban_an !== record.so_ban_an ||
            form.nguoi_khoi_kien !== record.nguoi_khoi_kien ||
            form.nguoi_phai_thi_hanh !== record.nguoi_phai_thi_hanh ||
            (form.nghia_vu_thi_hanh || '') !== (record.nghia_vu_thi_hanh || '') ||
            (form.quyet_dinh_buoc_thi_hanh || '') !== (record.quyet_dinh_buoc_thi_hanh || '') ||
            (form.ket_qua_cuoi_cung || '') !== (record.ket_qua_cuoi_cung || '') ||
            form.tien_do_text !== initialTimelineText
        )
    }

    const toggleEdit = (field: string) => {
        setEditingFields(prev => {
            const newSet = new Set(prev)
            if (newSet.has(field)) newSet.delete(field)
            else newSet.add(field)
            return newSet
        })
    }

    const updateField = (field: keyof AnHanhChinh, value: string) => {
        setForm(prev => ({ ...prev, [field]: value }))
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
            ket_qua_cuoi_cung: record.status === 'COMPLETED' ? (form.ket_qua_cuoi_cung || null) : record.ket_qua_cuoi_cung,
            tien_do_cap_nhat: parseQTTienDo(form.tien_do_text || ''),
        }

        const { error } = await supabase.from('an_hanh_chinh').update(payload).eq('id', record.id)

        setLoading(false)
        if (error) {
            toast.error(`Lỗi cập nhật: ${error.message}`)
            return
        }

        toast.success('Đã cập nhật thay đổi thành công!')
        setEditingFields(new Set())
        
        // Mute record object directly to avoid UI flicker before refetching
        Object.assign(record, payload)
        
        if (onSuccess) onSuccess()
    }

    const infoItems = [
        { key: 'so_ban_an', icon: FileText, label: 'Số Bản án', color: 'text-blue-600 bg-blue-50' },
        {
            key: 'nguoi_khoi_kien',
            icon: User,
            label: record.status === 'COMPLETED' ? 'Người được thi hành án' : 'Người khởi kiện',
            color: 'text-amber-600 bg-amber-50'
        },
        {
            key: 'nguoi_phai_thi_hanh',
            icon: Building2,
            label: record.status === 'COMPLETED' ? 'Người phải thi hành án' : 'Người phải thi hành',
            color: 'text-red-600 bg-red-50'
        },
    ]

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl mx-4 max-h-[85vh] flex flex-col animate-in zoom-in-95 fade-in duration-200">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
                            <Scale className="w-4 h-4 text-slate-700" />
                        </div>
                        <h2 className="text-lg font-semibold text-slate-800">Chi tiết Án</h2>
                        <span className={cn(
                            'text-[11px] font-bold px-2 py-0.5 rounded-full',
                            record.status === 'PENDING'
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-emerald-100 text-emerald-700'
                        )}>
                            {record.status === 'PENDING' ? 'Đang thi hành' : 'Án xong'}
                        </span>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-6 space-y-5">
                    {/* Info cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {infoItems.map(item => {
                            const Icon = item.icon
                            const isEditing = editingFields.has(item.key)

                            return (
                                <div key={item.key} className="bg-slate-50/80 rounded-lg p-3 border border-slate-100 group relative transition-colors hover:bg-slate-50">
                                    <div className="flex items-center justify-between mb-1">
                                        <div className="flex items-center gap-1.5">
                                            <div className={cn('w-6 h-6 rounded flex items-center justify-center', item.color)}>
                                                <Icon className="w-3.5 h-3.5" />
                                            </div>
                                            <span className="text-xs text-slate-500 font-medium">{item.label}</span>
                                        </div>
                                        <button 
                                            onClick={() => toggleEdit(item.key)}
                                            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-slate-400 hover:text-blue-600 rounded bg-white shadow-sm border border-slate-200"
                                            title="Sửa nội dung"
                                        >
                                            <Pencil className="w-3 h-3" />
                                        </button>
                                    </div>
                                    
                                    <div className="pl-[30px]">
                                        {isEditing ? (
                                            <input
                                                value={(form as any)[item.key] || ''}
                                                onChange={e => updateField(item.key as keyof AnHanhChinh, e.target.value)}
                                                className="w-full text-sm font-medium text-slate-800 bg-white border border-blue-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-100"
                                                autoFocus
                                            />
                                        ) : (
                                            <p className="text-sm font-semibold text-slate-800">{(form as any)[item.key]}</p>
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                    </div>

                    {/* Nghĩa vụ thi hành / Nội dung */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <h4 className="text-sm font-semibold text-slate-700">
                                {record.status === 'COMPLETED' ? 'Nội dung' : 'Nghĩa vụ thi hành'}
                            </h4>
                            <button 
                                onClick={() => toggleEdit('nghia_vu_thi_hanh')}
                                className="flex items-center gap-1 text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded hover:bg-blue-100 transition-colors"
                            >
                                <Pencil className="w-3 h-3" /> Chỉnh sửa
                            </button>
                        </div>
                        {editingFields.has('nghia_vu_thi_hanh') ? (
                            <textarea
                                value={form.nghia_vu_thi_hanh || ''}
                                onChange={e => updateField('nghia_vu_thi_hanh', e.target.value)}
                                className="w-full bg-white border border-blue-300 rounded-lg p-3 text-sm text-slate-800 leading-relaxed focus:outline-none focus:ring-2 focus:ring-blue-100 min-h-[80px]"
                                placeholder="Nhập nội dung/nghĩa vụ..."
                                autoFocus
                            />
                        ) : (
                            <div className="bg-red-50/50 border border-red-100 rounded-lg p-3 text-sm text-slate-700 leading-relaxed min-h-[44px]">
                                {form.nghia_vu_thi_hanh || <span className="italic text-red-300">Chưa có dữ liệu</span>}
                            </div>
                        )}
                    </div>

                    {/* Quyết định buộc thi hành án */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <h4 className="text-sm font-semibold text-slate-700">Quyết định buộc thi hành án</h4>
                            <button 
                                onClick={() => toggleEdit('quyet_dinh_buoc_thi_hanh')}
                                className="flex items-center gap-1 text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded hover:bg-blue-100 transition-colors"
                            >
                                <Pencil className="w-3 h-3" /> Chỉnh sửa
                            </button>
                        </div>
                        {editingFields.has('quyet_dinh_buoc_thi_hanh') ? (
                            <textarea
                                value={form.quyet_dinh_buoc_thi_hanh || ''}
                                onChange={e => updateField('quyet_dinh_buoc_thi_hanh', e.target.value)}
                                className="w-full bg-white border border-blue-300 rounded-lg p-3 text-sm text-slate-800 leading-relaxed focus:outline-none focus:ring-2 focus:ring-blue-100 min-h-[80px]"
                                placeholder="Nhập số, ngày hoặc nội dung quyết định..."
                                autoFocus
                            />
                        ) : (
                            <div className="bg-orange-50/50 border border-orange-100 rounded-lg p-3 text-sm text-slate-700 leading-relaxed min-h-[44px]">
                                {form.quyet_dinh_buoc_thi_hanh || <span className="italic text-orange-300">Chưa có dữ liệu</span>}
                            </div>
                        )}
                    </div>

                    {/* Kết quả cuối cùng (Chỉ khi status = COMPLETED) */}
                    {record.status === 'COMPLETED' && (
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <h4 className="text-sm font-semibold text-emerald-700 flex items-center gap-1.5 border-emerald-200">
                                    ✅ Kết quả thi hành
                                </h4>
                                <button 
                                    onClick={() => toggleEdit('ket_qua_cuoi_cung')}
                                    className="flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-1 rounded hover:bg-emerald-100 transition-colors"
                                >
                                    <Pencil className="w-3 h-3" /> Chỉnh sửa
                                </button>
                            </div>
                            {editingFields.has('ket_qua_cuoi_cung') ? (
                                <textarea
                                    value={form.ket_qua_cuoi_cung || ''}
                                    onChange={e => updateField('ket_qua_cuoi_cung', e.target.value)}
                                    className="w-full bg-white border border-emerald-400 rounded-lg p-3 text-sm text-slate-800 leading-relaxed focus:outline-none focus:ring-2 focus:ring-emerald-100 min-h-[80px]"
                                    placeholder="Nhập kết quả thi hành..."
                                    autoFocus
                                />
                            ) : (
                                <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-3 text-sm text-slate-700 leading-relaxed min-h-[44px]">
                                    {form.ket_qua_cuoi_cung || <span className="italic text-emerald-400">Chưa có dữ liệu</span>}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Timeline */}
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <h4 className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
                                <Clock className="w-4 h-4 text-slate-500" />
                                Lịch sử cập nhật ({timeline.length})
                            </h4>
                            <button 
                                onClick={() => toggleEdit('tien_do_text')}
                                className="flex items-center gap-1 text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded hover:bg-blue-100 transition-colors"
                            >
                                <Pencil className="w-3 h-3" /> Chỉnh sửa
                            </button>
                        </div>
                        
                        {editingFields.has('tien_do_text') ? (
                            <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                                <div className="text-[13px] text-blue-700 bg-blue-50/50 p-2.5 rounded border border-blue-100 leading-relaxed font-medium">
                                    💡 Ghi chú: Mỗi dòng lịch sử sự kiện phải nằm trên một dòng riêng biệt, nên bắt đầu bằng dấu gạch ngang và ghi rõ ngày tháng (<span className="font-semibold">- Ngày 12/03/2024, UBND ra quyết định...</span>). Lịch sử sẽ được tự động bóc tách thành các điểm Thời gian dưới đây.
                                </div>
                                <textarea
                                    value={form.tien_do_text || ''}
                                    onChange={e => updateField('tien_do_text' as any, e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-3 text-sm text-slate-800 leading-relaxed font-mono focus:outline-none focus:ring-2 focus:ring-blue-400 min-h-[160px] shadow-inner"
                                    placeholder="- Ngày DD/MM/YYYY, Nội dung công việc..."
                                    autoFocus
                                />
                            </div>
                        ) : (
                            timeline.length === 0 ? (
                                <p className="text-sm text-slate-400 italic">Chưa có cập nhật nào</p>
                            ) : (
                                <div className="relative pl-6 space-y-0 animate-in fade-in duration-300">
                                    {/* Vertical line */}
                                    <div className="absolute left-[9px] top-2 bottom-2 w-0.5 bg-slate-200" />
                                    {[...timeline].reverse().map((entry, idx) => (
                                        <div key={entry.id || idx} className="relative pb-4 last:pb-0 group">
                                            {/* Dot */}
                                            <div className={cn(
                                                'absolute -left-6 top-1 w-[18px] h-[18px] rounded-full border-2 flex items-center justify-center transition-colors',
                                                idx === 0
                                                    ? 'border-red-500 bg-red-50 group-hover:border-red-600'
                                                    : 'border-slate-300 bg-white group-hover:border-slate-400'
                                            )}>
                                                <div className={cn(
                                                    'w-2 h-2 rounded-full transition-colors',
                                                    idx === 0 ? 'bg-red-500 group-hover:bg-red-600' : 'bg-slate-300 group-hover:bg-slate-400'
                                                )} />
                                            </div>
                                            {/* Content */}
                                            <div className="ml-2 bg-slate-50/50 p-2.5 rounded-lg border border-transparent group-hover:bg-white group-hover:border-slate-100 transition-all shadow-sm">
                                                <div className="flex items-center gap-2 mb-0.5">
                                                    <Calendar className="w-3 h-3 text-slate-400" />
                                                    <span className="text-xs font-semibold text-slate-600">
                                                        {formatDateVN(entry.date)}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{entry.content}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-2 px-6 py-4 border-t border-slate-100 shrink-0 bg-slate-50/50">
                    <button
                        onClick={onClose}
                        disabled={loading}
                        className="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50 shadow-sm"
                    >
                        Đóng
                    </button>
                    {hasChanges() && (
                        <button
                            onClick={handleSave}
                            disabled={loading}
                            className="flex items-center gap-1.5 px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_2px_10px_rgba(37,99,235,0.3)] animate-in fade-in zoom-in-95 duration-200"
                        >
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    )
}
