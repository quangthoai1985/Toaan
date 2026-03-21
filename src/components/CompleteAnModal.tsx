'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { AnHanhChinh } from '@/lib/types'
import { X, CheckCircle2, Loader2 } from 'lucide-react'
import { getSoBanAnText } from '@/lib/utils'
import { useToast } from './Toast'

interface Props {
    open: boolean
    record: AnHanhChinh | null
    onClose: () => void
    onSuccess: () => void
}

export default function CompleteAnModal({ open, record, onClose, onSuccess }: Props) {
    const supabase = createClient()
    const toast = useToast()
    const [loading, setLoading] = useState(false)
    const [ketQua, setKetQua] = useState('')

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (!record) return
        if (!ketQua.trim()) {
            toast.error('Vui lòng nhập kết quả cuối cùng')
            return
        }

        setLoading(true)
        const { error } = await supabase
            .from('an_hanh_chinh')
            .update({
                status: 'COMPLETED',
                ket_qua_cuoi_cung: ketQua.trim(),
            })
            .eq('id', record.id)

        setLoading(false)
        if (error) {
            toast.error(`Lỗi: ${error.message}`)
            return
        }

        toast.success('Đã chốt án thành công')
        setKetQua('')
        onSuccess()
        onClose()
    }

    if (!open || !record) return null

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 animate-in zoom-in-95 fade-in duration-200">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                            <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                        </div>
                        <h2 className="text-lg font-semibold text-slate-800">Chốt Án</h2>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Info */}
                <div className="px-6 pt-4">
                    <div className="bg-slate-50 rounded-lg p-3 text-sm space-y-1">
                        <p><span className="text-slate-500">Số bản án:</span> <span className="font-medium text-slate-700">{getSoBanAnText(record.so_ban_an)}</span></p>
                        <p><span className="text-slate-500">Người khởi kiện:</span> <span className="font-medium text-slate-700">{record.nguoi_khoi_kien}</span></p>
                        <p><span className="text-slate-500">Người phải TH:</span> <span className="font-medium text-slate-700">{record.nguoi_phai_thi_hanh}</span></p>
                    </div>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Kết quả cuối cùng <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            value={ketQua}
                            onChange={e => setKetQua(e.target.value)}
                            placeholder="Nhập kết quả thi hành án..."
                            rows={4}
                            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-300 focus:border-emerald-300 resize-none"
                            autoFocus
                        />
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={loading}
                            className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
                        >
                            Hủy
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
                        >
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                            {loading ? 'Đang xử lý...' : 'Xác nhận Chốt án'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
