'use client'

import React, { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Building2, Plus, Search, MapPin, Briefcase, Landmark, Trash2, Pencil, Loader2, Save, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useToast } from './Toast'

type CoQuan = {
    id: string
    ten_co_quan: string
    cap_co_quan: string
}

const TABS = [
    { id: 'Cấp tỉnh', label: 'Cấp tỉnh', icon: Landmark, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { id: 'Sở Ngành', label: 'Sở Ngành', icon: Briefcase, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { id: 'Cấp xã', label: 'Cấp xã', icon: MapPin, color: 'text-amber-600', bg: 'bg-amber-50' },
]

export default function CoQuanManager() {
    const supabase = createClient()
    const toast = useToast()
    
    const [data, setData] = useState<CoQuan[]>([])
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState('Cấp tỉnh')
    const [search, setSearch] = useState('')
    
    const [isEditing, setIsEditing] = useState<CoQuan | null>(null)
    const [isAdding, setIsAdding] = useState(false)
    const [formName, setFormName] = useState('')
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        setLoading(true)
        const { data: d, error } = await supabase.from('dm_co_quan').select('*').order('cap_co_quan').order('ten_co_quan')
        if (error) {
            toast.error('Lỗi tải danh sách: ' + error.message)
        } else if (d) {
            setData(d)
        }
        setLoading(false)
    }

    const filteredData = data.filter(d => 
        d.cap_co_quan === activeTab && 
        d.ten_co_quan.toLowerCase().includes(search.toLowerCase())
    )

    const handleSave = async () => {
        if (!formName.trim()) {
            toast.error('Vui lòng nhập tên cơ quan')
            return
        }

        setSaving(true)
        if (isEditing) {
            const { error } = await supabase.from('dm_co_quan')
                .update({ ten_co_quan: formName.trim() })
                .eq('id', isEditing.id)
                
            if (error) toast.error('Lỗi khi lưu: ' + error.message)
            else {
                toast.success('Đã cập nhật cơ quan')
                setData(prev => prev.map(item => item.id === isEditing.id ? { ...item, ten_co_quan: formName.trim() } : item))
                setIsEditing(null)
            }
        } else {
            const { data: newData, error } = await supabase.from('dm_co_quan')
                .insert([{ ten_co_quan: formName.trim(), cap_co_quan: activeTab }])
                .select()
                
            if (error) toast.error('Lỗi thêm mới: ' + error.message)
            else if (newData) {
                toast.success('Đã thêm cơ quan mới')
                setData(prev => [...prev, newData[0]])
                setIsAdding(false)
            }
        }
        setSaving(false)
    }

    const handleDelete = async (id: string, ten: string) => {
        if (!confirm(`Bạn có chắc muốn xóa cơ quan "${ten}" không?`)) return
        
        const { error } = await supabase.from('dm_co_quan').delete().eq('id', id)
        if (error) {
            toast.error('Lỗi khi xóa: ' + error.message)
        } else {
            toast.success('Đã xóa cơ quan')
            setData(prev => prev.filter(item => item.id !== id))
        }
    }

    return (
        <div className="h-full flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500 overflow-hidden">
            {/* Header section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
                <div>
                    <h2 className="text-2xl font-bold flex items-center gap-2.5 text-slate-800 tracking-tight">
                        <div className="p-2.5 bg-blue-100 text-blue-600 rounded-xl">
                            <Building2 className="w-5 h-5" />
                        </div>
                        Danh mục Cơ quan
                    </h2>
                    <p className="text-slate-500 text-sm mt-1 ml-12">
                        Quản lý các cơ quan Người phải thi hành án phục vụ cho hệ thống.
                    </p>
                </div>
                
                <button
                    onClick={() => {
                        setIsAdding(true)
                        setFormName('')
                        setIsEditing(null)
                    }}
                    className="flex items-center gap-2 bg-blue-600/90 hover:bg-blue-600 text-white px-5 py-2.5 rounded-xl font-semibold shadow-sm hover:shadow-md transition-all active:scale-95 text-sm"
                >
                    <Plus className="w-4 h-4" />
                    Thêm cơ quan
                </button>
            </div>

            {/* Main Card */}
            <div className="bg-white border text-slate-800 rounded-2xl shadow-sm overflow-hidden flex flex-col flex-1 min-h-0">
                
                {/* Tabs */}
                <div className="flex items-center gap-1 p-3 bg-slate-50 border-b overflow-x-auto">
                    {TABS.map(tab => {
                        const active = activeTab === tab.id
                        const count = data.filter(d => d.cap_co_quan === tab.id).length
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={cn(
                                    "px-5 py-2.5 flex items-center gap-2 rounded-xl text-sm font-semibold transition-all whitespace-nowrap",
                                    active 
                                        ? "bg-white shadow-sm ring-1 ring-slate-200/60 text-blue-700" 
                                        : "text-slate-500 hover:text-slate-700 hover:bg-slate-100"
                                )}
                            >
                                <div className={cn("p-1.5 rounded-lg", active ? tab.bg : "bg-slate-100")}>
                                    <tab.icon className={cn("w-4 h-4", active ? tab.color : "text-slate-400")} />
                                </div>
                                {tab.label}
                                <span className={cn(
                                    "ml-1.5 px-2 py-0.5 rounded-full text-xs font-bold",
                                    active ? "bg-blue-100 text-blue-700" : "bg-slate-200 text-slate-500"
                                )}>
                                    {count}
                                </span>
                            </button>
                        )
                    })}
                </div>

                {/* Toolbar */}
                <div className="p-4 border-b flex flex-col sm:flex-row gap-4 justify-between items-center bg-white">
                    <div className="relative w-full sm:w-80">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input 
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder={`Tìm trong ${activeTab.toLowerCase()}...`}
                            className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all outline-none"
                        />
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 p-0 overflow-y-auto bg-slate-50/30">
                    {loading ? (
                        <div className="h-64 flex flex-col items-center justify-center gap-3 text-slate-400">
                            <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                            <p className="text-sm font-medium">Đang tải danh sách...</p>
                        </div>
                    ) : filteredData.length === 0 ? (
                        <div className="h-64 flex flex-col items-center justify-center gap-3 text-slate-400">
                            <Building2 className="w-10 h-10 opacity-20" />
                            <p className="text-sm">Không tìm thấy cơ quan nào.</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-100/80">
                            {filteredData.map((item, idx) => (
                                <div key={item.id} className="flex items-center justify-between p-4 px-6 hover:bg-blue-50/50 transition-colors group bg-white">
                                    <div className="flex items-center gap-4">
                                        <div className="text-slate-400 text-xs font-mono w-6 text-right select-none">{idx + 1}</div>
                                        <div className="font-medium text-slate-700 text-sm">{item.ten_co_quan}</div>
                                    </div>
                                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button 
                                            onClick={() => {
                                                setIsEditing(item)
                                                setFormName(item.ten_co_quan)
                                            }}
                                            className="p-1.5 text-blue-500 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                                            title="Sửa"
                                        >
                                            <Pencil className="w-4 h-4" />
                                        </button>
                                        <button 
                                            onClick={() => handleDelete(item.id, item.ten_co_quan)}
                                            className="p-1.5 text-red-500 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                                            title="Xóa"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Modal Edit/Add */}
            {(isEditing || isAdding) && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => { setIsAdding(false); setIsEditing(null) }} />
                    <div className="relative bg-white w-full max-w-md rounded-2xl shadow-xl border overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 border-b flex justify-between items-center bg-slate-50/50">
                            <h3 className="font-bold text-slate-800">
                                {isEditing ? 'Biên tập tên cơ quan' : `Thêm mới - ${activeTab}`}
                            </h3>
                            <button onClick={() => { setIsAdding(false); setIsEditing(null) }} className="text-slate-400 hover:text-red-500 transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block">Tên cơ quan</label>
                                <input
                                    value={formName}
                                    onChange={e => setFormName(e.target.value)}
                                    placeholder="Ví dụ: Sở Tư pháp, UBND..."
                                    className="w-full border-blue-200 border bg-white text-slate-900 placeholder:text-slate-400 px-4 py-2.5 rounded-xl text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all outline-none"
                                    autoFocus
                                    onKeyDown={e => {
                                        if (e.key === 'Enter') handleSave()
                                    }}
                                />
                            </div>
                        </div>

                        <div className="px-6 py-4 bg-slate-50 border-t flex gap-3 justify-end">
                            <button
                                onClick={() => { setIsAdding(false); setIsEditing(null) }}
                                className="px-4 py-2 text-sm font-semibold text-slate-600 bg-white border rounded-xl hover:bg-slate-50 transition-colors shadow-sm"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="px-5 py-2 text-sm font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-sm shadow-blue-200 disabled:opacity-50"
                            >
                                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                Lưu lại
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
