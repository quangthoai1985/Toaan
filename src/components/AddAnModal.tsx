'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { X, Plus, Loader2 } from 'lucide-react'
import { useToast } from './Toast'

interface Props {
    open: boolean
    onClose: () => void
    onSuccess: () => void
}

export default function AddAnModal({ open, onClose, onSuccess }: Props) {
    const supabase = createClient()
    const toast = useToast()
    const [loading, setLoading] = useState(false)
    const [form, setForm] = useState({
        so_ban_an: '',
        nguoi_khoi_kien: '',
        nguoi_phai_thi_hanh: '',
        nghia_vu_thi_hanh: '',
    })

    function updateField(field: string, value: string) {
        setForm(prev => ({ ...prev, [field]: value }))
    }

    function resetForm() {
        setForm({ so_ban_an: '', nguoi_khoi_kien: '', nguoi_phai_thi_hanh: '', nghia_vu_thi_hanh: '' })
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (!form.so_ban_an.trim() || !form.nguoi_khoi_kien.trim() || !form.nguoi_phai_thi_hanh.trim()) {
            toast.error('Vui lòng điền đầy đủ thông tin bắt buộc')
            return
        }

        setLoading(true)
        const { error } = await supabase.from('an_hanh_chinh').insert({
            so_ban_an: form.so_ban_an.trim(),
            nguoi_khoi_kien: form.nguoi_khoi_kien.trim(),
            nguoi_phai_thi_hanh: form.nguoi_phai_thi_hanh.trim(),
            nghia_vu_thi_hanh: form.nghia_vu_thi_hanh.trim() || null,
            status: 'PENDING',
            tien_do_cap_nhat: [],
        })

        setLoading(false)
        if (error) {
            toast.error(`Lỗi: ${error.message}`)
            return
        }

        toast.success('Đã thêm mới án thành công')
        resetForm()
        onSuccess()
        onClose()
    }

    if (!open) return null

    const fields = [
        { key: 'so_ban_an', label: 'Số Bản án / Quyết định', placeholder: 'VD: Bản án số 01/2025/HC-ST', required: true },
        { key: 'nguoi_khoi_kien', label: 'Người khởi kiện', placeholder: 'Tên người khởi kiện', required: true },
        { key: 'nguoi_phai_thi_hanh', label: 'Người phải thi hành', placeholder: 'Cơ quan / Cá nhân phải thi hành', required: true },
    ]

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 animate-in zoom-in-95 fade-in duration-200">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center">
                            <Plus className="w-4 h-4 text-red-700" />
                        </div>
                        <h2 className="text-lg font-semibold text-slate-800">Thêm mới Án</h2>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {fields.map(f => (
                        <div key={f.key}>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                {f.label} {f.required && <span className="text-red-500">*</span>}
                            </label>
                            <input
                                type="text"
                                value={(form as any)[f.key]}
                                onChange={e => updateField(f.key, e.target.value)}
                                placeholder={f.placeholder}
                                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-300 focus:border-red-300"
                            />
                        </div>
                    ))}

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Nghĩa vụ thi hành
                        </label>
                        <textarea
                            value={form.nghia_vu_thi_hanh}
                            onChange={e => updateField('nghia_vu_thi_hanh', e.target.value)}
                            placeholder="Nội dung quyết định buộc thi hành..."
                            rows={3}
                            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-300 focus:border-red-300 resize-none"
                        />
                    </div>

                    {/* Actions */}
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
                            className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-red-700 rounded-lg hover:bg-red-800 transition-colors disabled:opacity-50"
                        >
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                            {loading ? 'Đang lưu...' : 'Thêm mới'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
