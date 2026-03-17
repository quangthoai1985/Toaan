'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { AnHanhChinh, TienDoEntry } from '@/lib/types'
import { X, Plus, Calendar, Clock, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useToast } from './Toast'
import DateInput from './DateInput'

interface Props {
    open: boolean
    record: AnHanhChinh | null
    onClose: () => void
    onSuccess: () => void
}

function formatDateVN(dateStr: string): string {
    if (!dateStr) return '—'
    const m = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/)
    if (m) return `${m[3]}/${m[2]}/${m[1]}`
    return dateStr
}

export default function TimelineModal({ open, record, onClose, onSuccess }: Props) {
    const supabase = createClient()
    const toast = useToast()
    const [loading, setLoading] = useState(false)
    const [newDate, setNewDate] = useState(() => new Date().toISOString().split('T')[0])
    const [newContent, setNewContent] = useState('')

    if (!open || !record) return null

    const timeline: TienDoEntry[] = Array.isArray(record.tien_do_cap_nhat) ? record.tien_do_cap_nhat : []

    async function handleAddEntry(e: React.FormEvent) {
        e.preventDefault()
        if (!record) return
        if (!newContent.trim()) {
            toast.error('Vui lòng nhập nội dung cập nhật')
            return
        }

        const newEntry = {
            id: crypto.randomUUID(),
            date: newDate,
            content: newContent.trim(),
        }

        setLoading(true)
        const { error } = await supabase.rpc('append_tien_do', {
            p_id: record.id,
            p_entry: newEntry,
        })

        setLoading(false)
        if (error) {
            toast.error(`Lỗi: ${error.message}`)
            return
        }

        toast.success('Đã thêm cập nhật tiến độ')
        setNewContent('')
        setNewDate(new Date().toISOString().split('T')[0])
        onSuccess()
    }

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl mx-4 max-h-[85vh] flex flex-col animate-in zoom-in-95 fade-in duration-200">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                            <Clock className="w-4 h-4 text-blue-700" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-slate-800">Cập nhật Tiến độ</h2>
                            <p className="text-xs text-slate-500">{record.so_ban_an} — {record.nguoi_khoi_kien}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto">
                    {/* Add new entry form */}
                    <div className="px-6 pt-5 pb-4 bg-blue-50/50 border-b border-blue-100">
                        <h4 className="text-sm font-semibold text-blue-800 mb-3 flex items-center gap-1.5">
                            <Plus className="w-4 h-4" />
                            Thêm tiến độ mới
                        </h4>
                        <form onSubmit={handleAddEntry} className="space-y-3">
                            <div className="flex gap-3">
                                <div className="w-[160px] shrink-0">
                                    <label className="block text-xs font-medium text-slate-600 mb-1">Ngày</label>
                                    <DateInput
                                        value={newDate}
                                        onChange={setNewDate}
                                        className="rounded-lg focus:ring-blue-300"
                                    />
                                </div>
                                <div className="flex-1">
                                    <label className="block text-xs font-medium text-slate-600 mb-1">Nội dung cập nhật</label>
                                    <input
                                        type="text"
                                        value={newContent}
                                        onChange={e => setNewContent(e.target.value)}
                                        placeholder="Nhập nội dung tiến độ..."
                                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300"
                                        autoFocus
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                                >
                                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                                    {loading ? 'Đang lưu...' : 'Thêm'}
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Existing timeline */}
                    <div className="px-6 py-5">
                        <h4 className="text-sm font-semibold text-slate-700 mb-4">
                            Lịch sử cập nhật ({timeline.length})
                        </h4>
                        {timeline.length === 0 ? (
                            <p className="text-sm text-slate-400 italic text-center py-6">Chưa có cập nhật nào</p>
                        ) : (
                            <div className="relative pl-6 space-y-0">
                                <div className="absolute left-[9px] top-2 bottom-2 w-0.5 bg-slate-200" />
                                {[...timeline].reverse().map((entry, idx) => (
                                    <div key={entry.id || idx} className="relative pb-5 last:pb-0">
                                        <div className={cn(
                                            'absolute -left-6 top-1 w-[18px] h-[18px] rounded-full border-2 flex items-center justify-center',
                                            idx === 0
                                                ? 'border-blue-500 bg-blue-50'
                                                : 'border-slate-300 bg-white'
                                        )}>
                                            <div className={cn(
                                                'w-2 h-2 rounded-full',
                                                idx === 0 ? 'bg-blue-500' : 'bg-slate-300'
                                            )} />
                                        </div>
                                        <div className="ml-2">
                                            <div className="flex items-center gap-2 mb-1">
                                                <Calendar className="w-3 h-3 text-slate-400" />
                                                <span className={cn(
                                                    'text-xs font-medium',
                                                    idx === 0 ? 'text-blue-600' : 'text-slate-500'
                                                )}>
                                                    {formatDateVN(entry.date)}
                                                </span>
                                                {idx === 0 && (
                                                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 font-semibold">Mới nhất</span>
                                                )}
                                            </div>
                                            <p className="text-sm text-slate-700 leading-relaxed">{entry.content}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="flex justify-end px-6 py-4 border-t border-slate-100 shrink-0">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
                    >
                        Đóng
                    </button>
                </div>
            </div>
        </div>
    )
}
