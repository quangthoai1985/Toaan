'use client'

import React, { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { QuyetDinhEntry, TienDoEntry } from '@/lib/types'
import {
    X, FileText, User, Building2, Scale, AlertCircle, 
    Plus, Trash2, Loader2, Save, Clock
} from 'lucide-react'
import { parseQTTienDo } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { useToast } from './Toast'
import { useAuth } from './AuthProvider'
import DateInput from './DateInput'

interface Props {
    open: boolean
    onClose: () => void
    onSuccess: () => void
}

function todayISO(): string {
    return new Date().toISOString().split('T')[0]
}

export default function AddAnModal({ open, onClose, onSuccess }: Props) {
    const supabase = createClient()
    const toast = useToast()
    const { scope, profile } = useAuth()

    const [form, setForm] = useState({
        nguoi_khoi_kien: '',
        nguoi_phai_thi_hanh: '',
        nghia_vu_thi_hanh: '',
    })

    const [danhSachQuyetDinh, setDanhSachQuyetDinh] = useState<QuyetDinhEntry[]>([{
        id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(7),
        so_quyet_dinh: '',
        ngay_ban_hanh: '',
        co_quan_ban_hanh: ''
    }])
    
    const [danhSachQuyetDinhBuoc, setDanhSachQuyetDinhBuoc] = useState<QuyetDinhEntry[]>([])
    
    const [loading, setLoading] = useState(false)
    const [rawProgressText, setRawProgressText] = useState('')
    const [dmCoQuan, setDmCoQuan] = useState<{id: string, ten_co_quan: string, cap_co_quan: string}[]>([])

    const [searchCq, setSearchCq] = useState('')
    const [showCqDropdown, setShowCqDropdown] = useState(false)
    const cqDropdownRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        async function fetchDm() {
            const { data } = await supabase.from('dm_co_quan').select('*').order('cap_co_quan', { ascending: true })
            if (data) setDmCoQuan(data)
        }
        if (open) fetchDm()
    }, [supabase, open])

    useEffect(() => {
        if (!open) {
            // Reset form when closed
            setForm({ nguoi_khoi_kien: '', nguoi_phai_thi_hanh: '', nghia_vu_thi_hanh: '' })
            setDanhSachQuyetDinh([{
                id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(7),
                so_quyet_dinh: '', ngay_ban_hanh: '', co_quan_ban_hanh: ''
            }])
            setDanhSachQuyetDinhBuoc([])
            setRawProgressText('')
            setSearchCq('')
        }
    }, [open])

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (cqDropdownRef.current && !cqDropdownRef.current.contains(event.target as Node)) {
                setShowCqDropdown(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    if (!open) return null

    const updateField = (field: string, value: string) => {
        setForm(prev => ({ ...prev, [field]: value }))
    }

    const updateQuyetDinh = (id: string, field: keyof QuyetDinhEntry, value: string) => {
        setDanhSachQuyetDinh(prev => prev.map(qd => qd.id === id ? { ...qd, [field]: value } : qd))
    }
    const addQuyetDinh = () => {
        setDanhSachQuyetDinh(prev => [...prev, {
            id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(7),
            so_quyet_dinh: '', ngay_ban_hanh: '', co_quan_ban_hanh: ''
        }])
    }
    const removeQuyetDinh = (id: string) => {
        if (danhSachQuyetDinh.length > 1) {
            setDanhSachQuyetDinh(prev => prev.filter(qd => qd.id !== id))
        }
    }

    const updateQuyetDinhBuoc = (id: string, field: keyof QuyetDinhEntry, value: string) => {
        setDanhSachQuyetDinhBuoc(prev => prev.map(qd => qd.id === id ? { ...qd, [field]: value } : qd))
    }
    const addQuyetDinhBuoc = () => {
        setDanhSachQuyetDinhBuoc(prev => [...prev, {
            id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(7),
            so_quyet_dinh: '', ngay_ban_hanh: '', co_quan_ban_hanh: ''
        }])
    }
    const removeQuyetDinhBuoc = (id: string) => {
        setDanhSachQuyetDinhBuoc(prev => prev.filter(qd => qd.id !== id))
    }

    const handleSubmit = async () => {
        // Validation
        const validQd = danhSachQuyetDinh.filter(q => q.so_quyet_dinh.trim())
        if (validQd.length === 0 || !form.nguoi_khoi_kien.trim() || !form.nguoi_phai_thi_hanh.trim()) {
            toast.error('Vui lòng điền đủ Bản án, Người khởi kiện và Người phải thi hành')
            return
        }

        const exactMatch = coQuanList.find(c => c.ten_co_quan.toLowerCase() === form.nguoi_phai_thi_hanh.trim().toLowerCase())
        if (!exactMatch) {
            toast.error('Vui lòng chọn Người phải thi hành từ danh sách xổ xuống!')
            return
        }

        setLoading(true)
        
        // Convert to stringified JSON arrays like DetailModal expects
        const soBanAnJson = JSON.stringify(validQd)
        const qdBuocJson = danhSachQuyetDinhBuoc.length > 0 
            ? JSON.stringify(danhSachQuyetDinhBuoc.filter(q => q.so_quyet_dinh.trim())) 
            : null

        const payload = {
            so_ban_an: soBanAnJson,
            nguoi_khoi_kien: form.nguoi_khoi_kien.trim(),
            nguoi_phai_thi_hanh: exactMatch.ten_co_quan,
            nghia_vu_thi_hanh: form.nghia_vu_thi_hanh.trim() || null,
            quyet_dinh_buoc_thi_hanh: qdBuocJson,
            status: 'PENDING',
            tien_do_cap_nhat: rawProgressText.trim() ? parseQTTienDo(rawProgressText) : [{
                id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(7),
                date: todayISO(),
                content: 'Tiếp nhận bản án/quyết định mới'
            }] as TienDoEntry[],
            ket_qua_cuoi_cung: null,
            created_by: profile?.id || undefined
        }

        const { error } = await supabase.from('an_hanh_chinh').insert(payload)
        setLoading(false)

        if (error) {
            toast.error(`Lỗi thêm mới: ${error.message}`)
            return
        }

        toast.success('Đã tạo án mới thành công!')
        onSuccess()
        onClose()
    }

    // Filter by scope if user has restricted access
    const coQuanList = scope && scope.length > 0
        ? dmCoQuan.filter(c => scope.some(s => c.ten_co_quan.toLowerCase().includes(s.toLowerCase())))
        : dmCoQuan
    const filteredCq = coQuanList.filter(o => o.ten_co_quan.toLowerCase().includes(searchCq.toLowerCase()))
    
    // Check if current input exactly matches any option
    const isInvalidCq = form.nguoi_phai_thi_hanh.trim().length > 0 
        && !coQuanList.some(c => c.ten_co_quan.toLowerCase() === form.nguoi_phai_thi_hanh.trim().toLowerCase())

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
            
            <div className="relative w-full max-w-[1200px] bg-slate-50 rounded-2xl shadow-2xl flex flex-col h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="shrink-0 flex items-center justify-between px-6 py-4 bg-white border-b border-slate-200 z-10">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center shadow-sm">
                            <Plus className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-800 leading-tight">Thêm Mới Án Hành Chính</h2>
                            <p className="text-xs text-slate-500 font-medium">Nhập thông tin chi tiết các bản án và quyết định</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Body - Split layout */}
                <div className="flex-1 flex overflow-hidden">
                    {/* LEFT COLUMN — Details Form */}
                    <div className="w-[55%] flex flex-col border-r border-slate-200 overflow-y-auto bg-slate-50/50">
                        <div className="p-6 md:p-8 space-y-6">
                            
                            {/* Mục 2: Người khởi kiện */}
                    <div className="bg-white rounded-xl border border-amber-100 p-5 space-y-3 shadow-sm">
                        <div className="flex items-center gap-2">
                            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-red-600 text-white text-[11px] font-bold shadow-sm shrink-0">2</span>
                            <div className="w-6 h-6 rounded-md bg-amber-50 flex items-center justify-center shrink-0">
                                <User className="w-3.5 h-3.5 text-amber-600" />
                            </div>
                            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Người khởi kiện <span className="text-red-500">*</span></label>
                        </div>
                        <input
                            value={form.nguoi_khoi_kien}
                            onChange={e => updateField('nguoi_khoi_kien', e.target.value)}
                            placeholder="VD: Nguyễn Văn A..."
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-200 focus:border-amber-400 transition-all font-medium"
                        />
                    </div>

                    {/* Mục 3: Bản án / Quyết định */}
                    <div className="bg-white rounded-xl border border-blue-100 p-5 space-y-4 shadow-sm">
                        <div className="flex items-center gap-2">
                            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-red-600 text-white text-[11px] font-bold shadow-sm shrink-0">3</span>
                            <div className="w-6 h-6 rounded-md bg-blue-50 flex items-center justify-center shrink-0">
                                <FileText className="w-3.5 h-3.5 text-blue-600" />
                            </div>
                            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Các Bản Án / Quyết Định đã có <span className="text-red-500">*</span></span>
                        </div>
                        
                        <div className="space-y-3">
                            {danhSachQuyetDinh.map((qd, index) => (
                                <div key={qd.id || index} className="p-3 bg-blue-50/40 border border-blue-100 rounded-xl relative group">
                                    {danhSachQuyetDinh.length > 1 && (
                                        <button 
                                            onClick={() => removeQuyetDinh(qd.id!)}
                                            className="absolute -top-2.5 -right-2.5 w-6 h-6 bg-white border border-red-200 rounded-full flex items-center justify-center text-red-500 hover:bg-red-500 hover:text-white hover:border-red-500 transition-all shadow-sm z-10"
                                            title="Xóa bản án này"
                                        >
                                            <X className="w-3.5 h-3.5" />
                                        </button>
                                    )}
                                    <div className="grid grid-cols-1 sm:grid-cols-[1.5fr_140px_1fr] gap-4">
                                        <div>
                                            <label className="text-[10px] uppercase font-bold text-blue-600/70 tracking-wide mb-1.5 block">Số Bản án/QĐ</label>
                                            <input 
                                                value={qd.so_quyet_dinh}
                                                onChange={e => updateQuyetDinh(qd.id!, 'so_quyet_dinh', e.target.value)}
                                                className="w-full bg-white border border-slate-200 rounded-lg text-sm px-3 py-2 font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all shadow-sm placeholder:font-normal placeholder:text-slate-400"
                                                placeholder="VD: Bản án số 01/2025/HC-ST"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[10px] uppercase font-bold text-blue-600/70 tracking-wide mb-1.5 block">Ngày ban hành</label>
                                            <DateInput 
                                                value={qd.ngay_ban_hanh}
                                                onChange={val => updateQuyetDinh(qd.id!, 'ngay_ban_hanh', val)}
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[10px] uppercase font-bold text-blue-600/70 tracking-wide mb-1.5 block">Cơ quan ban hành</label>
                                            <input 
                                                value={qd.co_quan_ban_hanh}
                                                onChange={e => updateQuyetDinh(qd.id!, 'co_quan_ban_hanh', e.target.value)}
                                                className="w-full bg-white border border-slate-200 rounded-lg text-sm px-3 py-2 font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all shadow-sm placeholder:font-normal placeholder:text-slate-400"
                                                placeholder="VD: TAND Tỉnh..."
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <button
                            onClick={addQuyetDinh}
                            className="w-full py-2.5 flex items-center justify-center gap-1.5 text-xs font-bold text-blue-600 bg-blue-50/50 hover:bg-blue-100/80 border-2 border-blue-200 border-dashed rounded-xl transition-all active:scale-[0.99]"
                        >
                            <Plus className="w-4 h-4" /> THÊM BẢN ÁN / QUYẾT ĐỊNH KHÁC
                        </button>
                    </div>

                    {/* Mục 4: Người phải thi hành */}
                    <div className={cn("bg-white rounded-xl border p-5 space-y-3 shadow-sm relative transition-colors", isInvalidCq ? "border-red-400 bg-red-50/10" : "border-red-100")} ref={cqDropdownRef}>
                        <div className="flex items-center gap-2">
                            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-red-600 text-white text-[11px] font-bold shadow-sm shrink-0">4</span>
                            <div className="w-6 h-6 rounded-md bg-red-50 flex items-center justify-center shrink-0">
                                <Building2 className="w-3.5 h-3.5 text-red-600" />
                            </div>
                            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Người phải thi hành <span className="text-red-500">*</span></label>
                        </div>
                        
                        <input
                            value={searchCq}
                            onChange={e => {
                                setSearchCq(e.target.value)
                                updateField('nguoi_phai_thi_hanh', e.target.value)
                                setShowCqDropdown(true)
                            }}
                            onFocus={() => setShowCqDropdown(true)}
                            placeholder="Tìm kiếm hoặc nhập tên cơ quan..."
                            className={cn(
                                "w-full bg-slate-50 border rounded-lg px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 transition-all font-medium",
                                isInvalidCq 
                                    ? "border-red-400 focus:ring-red-200 focus:border-red-500 text-red-700" 
                                    : "border-slate-200 focus:ring-red-200 focus:border-red-400"
                            )}
                        />

                        {isInvalidCq && !showCqDropdown && (
                            <p className="text-xs text-red-500 font-medium absolute -bottom-5 left-5">⚠️ Bắt buộc chọn từ danh sách</p>
                        )}

                        {showCqDropdown && (
                            <div className="absolute left-5 right-5 top-[85px] z-50 bg-white border border-slate-200 rounded-lg shadow-xl max-h-60 overflow-y-auto w-[calc(100%-40px)]">
                                {filteredCq.length === 0 ? (
                                    <div className="p-4 text-sm text-slate-500 italic text-center">Không có sẵn trong danh mục. Giữ nguyên text để nhập tự do.</div>
                                ) : (
                                    <ul className="py-1">
                                        {filteredCq.map(opt => (
                                            <li
                                                key={opt.id}
                                                onClick={() => {
                                                    setSearchCq(opt.ten_co_quan)
                                                    updateField('nguoi_phai_thi_hanh', opt.ten_co_quan)
                                                    setShowCqDropdown(false)
                                                }}
                                                className="px-4 py-2.5 text-sm text-slate-700 hover:bg-red-50 cursor-pointer border-b border-slate-50 last:border-0"
                                            >
                                                <span className="font-medium">{opt.ten_co_quan}</span>
                                                {opt.cap_co_quan && <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded ml-2">{opt.cap_co_quan}</span>}
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Mục 5: Nghĩa vụ thi hành án */}
                    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3">
                        <div className="flex items-center gap-2">
                            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-red-600 text-white text-[11px] font-bold shadow-sm shrink-0">5</span>
                            <div className="w-6 h-6 rounded-md bg-slate-100 flex items-center justify-center shrink-0">
                                <Scale className="w-3.5 h-3.5 text-slate-600" />
                            </div>
                            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Nghĩa vụ phải Thi hành án</span>
                        </div>
                        <textarea
                            value={form.nghia_vu_thi_hanh}
                            onChange={e => updateField('nghia_vu_thi_hanh', e.target.value)}
                            placeholder="Mô tả nội dung cụ thể cần thi hành án..."
                            rows={3}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-200 focus:border-slate-400 transition-all resize-none shadow-sm"
                        />
                    </div>

                    {/* Mục 6: Quyết định buộc thi hành án */}
                    <div className="bg-white rounded-xl border border-orange-200 p-5 space-y-4 shadow-sm">
                        <div className="flex items-center gap-2">
                            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-red-600 text-white text-[11px] font-bold shadow-sm shrink-0">6</span>
                            <div className="w-6 h-6 rounded-md bg-orange-50 flex items-center justify-center shrink-0">
                                <AlertCircle className="w-3.5 h-3.5 text-orange-600" />
                            </div>
                            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Các Quyết Định Buộc Thi Hành Án (Nếu có)</span>
                        </div>
                        
                        <div className="space-y-3">
                            {danhSachQuyetDinhBuoc.map((qd, index) => (
                                <div key={qd.id || index} className="p-3 bg-orange-50/30 border border-orange-100 rounded-xl relative group">
                                    <button 
                                        onClick={() => removeQuyetDinhBuoc(qd.id!)}
                                        className="absolute -top-2.5 -right-2.5 w-6 h-6 bg-white border border-red-200 rounded-full flex items-center justify-center text-red-500 hover:bg-red-500 hover:text-white hover:border-red-500 transition-all shadow-sm z-10"
                                        title="Xóa QĐ này"
                                    >
                                        <X className="w-3.5 h-3.5" />
                                    </button>
                                    <div className="grid grid-cols-1 sm:grid-cols-[1.5fr_140px_1fr] gap-4">
                                        <div>
                                            <label className="text-[10px] uppercase font-bold text-orange-600/80 tracking-wide mb-1.5 block">Số Quyết định</label>
                                            <input 
                                                value={qd.so_quyet_dinh}
                                                onChange={e => updateQuyetDinhBuoc(qd.id!, 'so_quyet_dinh', e.target.value)}
                                                className="w-full bg-white border border-slate-200 rounded-lg text-sm px-3 py-2 font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-300 transition-all shadow-sm placeholder:font-normal placeholder:text-slate-400"
                                                placeholder="VD: 02/2026/QĐ-BTHA"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[10px] uppercase font-bold text-orange-600/80 tracking-wide mb-1.5 block">Ngày ban hành</label>
                                            <DateInput 
                                                value={qd.ngay_ban_hanh}
                                                onChange={val => updateQuyetDinhBuoc(qd.id!, 'ngay_ban_hanh', val)}
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[10px] uppercase font-bold text-orange-600/80 tracking-wide mb-1.5 block">Cơ quan ban hành</label>
                                            <input 
                                                value={qd.co_quan_ban_hanh}
                                                onChange={e => updateQuyetDinhBuoc(qd.id!, 'co_quan_ban_hanh', e.target.value)}
                                                className="w-full bg-white border border-slate-200 rounded-lg text-sm px-3 py-2 font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-300 transition-all shadow-sm placeholder:font-normal placeholder:text-slate-400"
                                                placeholder="VD: TAND Tỉnh..."
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <button
                            onClick={addQuyetDinhBuoc}
                            className="w-full py-2.5 flex items-center justify-center gap-1.5 text-xs font-bold text-orange-600 bg-orange-50/40 hover:bg-orange-100/80 border-2 border-orange-200 border-dashed rounded-xl transition-all active:scale-[0.99]"
                        >
                            <Plus className="w-4 h-4" /> THÊM QĐ BUỘC THI HÀNH ÁN
                        </button>
                    </div>
                        </div>
                    </div>

                    {/* RIGHT COLUMN — Smart Text Input */}
                    <div className="w-[45%] flex flex-col overflow-y-auto bg-white">
                        <div className="p-6 md:p-8 space-y-5 flex flex-col h-full bg-slate-50/30">
                            <div className="flex items-center justify-between shrink-0 mb-2">
                                <div className="flex items-center gap-2">
                                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-red-600 text-white text-[11px] font-bold shadow-sm shrink-0">7</span>
                                    <Clock className="w-5 h-5 text-slate-500" />
                                    <h3 className="text-sm font-bold text-slate-700 uppercase tracking-widest">
                                        Quá trình Thi Hành Án
                                    </h3>
                                </div>
                            </div>
                            
                            <div className="flex-1 flex flex-col">
                                <label className="text-[11px] font-bold text-blue-700 uppercase tracking-wider mb-2 block">Dán nội dung từ Excel/Văn bản hệ thống tự động nhận diện</label>
                                <textarea
                                    value={rawProgressText}
                                    onChange={e => setRawProgressText(e.target.value)}
                                    placeholder={`HD dán nhanh:
- 01/01/2024: Ra quyết định thi hành án
- 05/01/2024 Nội dung không có dấu hai chấm
Ngày 10/01/2024: Tống đạt hợp lệ`}
                                    className="w-full flex-1 bg-white text-slate-800 font-medium border border-blue-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-300 min-h-[250px] resize-none shadow-sm transition-all"
                                />
                                
                                <div className="mt-4 bg-blue-50/50 border border-blue-100 rounded-xl p-4 text-xs text-slate-600 leading-relaxed space-y-2">
                                    <p className="font-semibold text-blue-800">💡 Hướng dẫn định dạng (Hệ thống sẽ tự nhận diện thời gian):</p>
                                    <ul className="list-disc pl-4 space-y-1.5 text-slate-600">
                                        <li>Cú pháp: <span className="font-mono text-purple-700 bg-white px-1 py-0.5 rounded border border-purple-100">{'<Ngày tháng> <Dấu phân cách> <Nội dung>'}</span></li>
                                        <li>Ngày có thể viết: <span className="font-medium">15/05/2023</span>, <span className="font-medium">15/5/2023</span>, hoặc có chữ: <span className="font-medium">Ngày 15/05/2023</span>.</li>
                                        <li>Dấu phân cách hỗ trợ: dấu hai chấm <span className="font-bold">(:)</span>, dấu gạch ngang <span className="font-bold">(-)</span> hoặc <span className="font-bold underline">khoảng trắng</span>.</li>
                                        <li>Nếu <span className="font-bold">có gạch đầu dòng</span> nhưng <span className="font-bold">không có ngày</span>: Hệ thống tạo mốc mới nhưng để trống ngày.</li>
                                        <li>Nếu <span className="font-bold">không có cả gạch và ngày</span>: Hệ thống cộng dồn nội dung vào mốc sự kiện ngay phía trên.</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer / Summary Action */}
                <div className="shrink-0 bg-slate-50 border-t border-slate-200 p-4 px-6 md:px-8 flex justify-end gap-3 z-10 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
                    <button
                        onClick={onClose}
                        disabled={loading}
                        className="px-6 py-2.5 text-sm font-semibold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:text-slate-800 transition-all shadow-sm"
                    >
                        Trở lại
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="flex items-center gap-2 px-8 py-2.5 text-sm font-bold text-white bg-red-700 rounded-xl hover:bg-red-800 transition-all shadow-sm hover:shadow-md disabled:opacity-50"
                    >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        {loading ? 'Đang tạo...' : 'Tạo Hồ Sơ Án Mới'}
                    </button>
                </div>
            </div>
        </div>
    )
}
