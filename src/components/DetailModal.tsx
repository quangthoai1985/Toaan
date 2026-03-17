'use client'

import { AnHanhChinh, TienDoEntry } from '@/lib/types'
import { X, FileText, Calendar, User, Building2, Scale, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
    open: boolean
    record: AnHanhChinh | null
    onClose: () => void
}

function formatDateVN(dateStr: string): string {
    if (!dateStr) return '—'
    const m = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/)
    if (m) return `${m[3]}/${m[2]}/${m[1]}`
    return dateStr
}

export default function DetailModal({ open, record, onClose }: Props) {
    if (!open || !record) return null

    const timeline: TienDoEntry[] = Array.isArray(record.tien_do_cap_nhat) ? record.tien_do_cap_nhat : []

    const infoItems = [
        { icon: FileText, label: 'Số Bản án', value: record.so_ban_an, color: 'text-blue-600 bg-blue-50' },
        { icon: User, label: 'Người khởi kiện', value: record.nguoi_khoi_kien, color: 'text-amber-600 bg-amber-50' },
        { icon: Building2, label: 'Người phải thi hành', value: record.nguoi_phai_thi_hanh, color: 'text-red-600 bg-red-50' },
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
                            return (
                                <div key={item.label} className="bg-slate-50 rounded-lg p-3">
                                    <div className="flex items-center gap-1.5 mb-1">
                                        <div className={cn('w-6 h-6 rounded flex items-center justify-center', item.color)}>
                                            <Icon className="w-3.5 h-3.5" />
                                        </div>
                                        <span className="text-xs text-slate-500">{item.label}</span>
                                    </div>
                                    <p className="text-sm font-medium text-slate-800 pl-[30px]">{item.value}</p>
                                </div>
                            )
                        })}
                    </div>

                    {/* Nghĩa vụ thi hành */}
                    {record.nghia_vu_thi_hanh && (
                        <div>
                            <h4 className="text-sm font-semibold text-slate-700 mb-2">Nghĩa vụ thi hành</h4>
                            <div className="bg-red-50/50 border border-red-100 rounded-lg p-3 text-sm text-slate-700 leading-relaxed">
                                {record.nghia_vu_thi_hanh}
                            </div>
                        </div>
                    )}

                    {/* Kết quả cuối cùng */}
                    {record.status === 'COMPLETED' && record.ket_qua_cuoi_cung && (
                        <div>
                            <h4 className="text-sm font-semibold text-emerald-700 mb-2">✅ Kết quả cuối cùng</h4>
                            <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-3 text-sm text-slate-700 leading-relaxed">
                                {record.ket_qua_cuoi_cung}
                            </div>
                        </div>
                    )}

                    {/* Timeline */}
                    <div>
                        <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-1.5">
                            <Clock className="w-4 h-4 text-slate-500" />
                            Lịch sử cập nhật ({timeline.length})
                        </h4>
                        {timeline.length === 0 ? (
                            <p className="text-sm text-slate-400 italic">Chưa có cập nhật nào</p>
                        ) : (
                            <div className="relative pl-6 space-y-0">
                                {/* Vertical line */}
                                <div className="absolute left-[9px] top-2 bottom-2 w-0.5 bg-slate-200" />
                                {timeline.map((entry, idx) => (
                                    <div key={entry.id || idx} className="relative pb-4 last:pb-0">
                                        {/* Dot */}
                                        <div className={cn(
                                            'absolute -left-6 top-1 w-[18px] h-[18px] rounded-full border-2 flex items-center justify-center',
                                            idx === timeline.length - 1
                                                ? 'border-red-500 bg-red-50'
                                                : 'border-slate-300 bg-white'
                                        )}>
                                            <div className={cn(
                                                'w-2 h-2 rounded-full',
                                                idx === timeline.length - 1 ? 'bg-red-500' : 'bg-slate-300'
                                            )} />
                                        </div>
                                        {/* Content */}
                                        <div className="ml-2">
                                            <div className="flex items-center gap-2 mb-0.5">
                                                <Calendar className="w-3 h-3 text-slate-400" />
                                                <span className="text-xs font-medium text-slate-500">
                                                    {formatDateVN(entry.date)}
                                                </span>
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
