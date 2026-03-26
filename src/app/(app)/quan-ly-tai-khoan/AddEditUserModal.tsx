'use client'

import { useState, useEffect } from 'react'
import { Loader2, X } from 'lucide-react'
import { useToast } from '@/components/Toast'
import dvhcListRaw from '@/lib/dvhc.json'

const dvhcList = dvhcListRaw.filter(v => v !== 'Tên đầy đủ')


export default function AddEditUserModal({ open, onClose, onSuccess, editingUser, dmCoQuan }: any) {
    const toast = useToast()
    const [loading, setLoading] = useState(false)
    const [form, setForm] = useState({
        email: '',
        password: '',
        display_name: '',
        role: 'user',
        scope: [] as string[]
    })

    useEffect(() => {
        if (open) {
            if (editingUser) {
                setForm({
                    email: editingUser.email || '',
                    password: '', // Không nạp mật khẩu cũ lên client
                    display_name: editingUser.display_name || '',
                    role: editingUser.role || 'user',
                    scope: editingUser.scope || []
                })
            } else {
                setForm({
                    email: '',
                    password: '',
                    display_name: '',
                    role: 'user',
                    scope: []
                })
            }
        }
    }, [open, editingUser])

    const toggleScope = (ten_cq: string) => {
        setForm(prev => {
            const isSelected = prev.scope.includes(ten_cq)
            if (isSelected) {
                return { ...prev, scope: prev.scope.filter(s => s !== ten_cq) }
            } else {
                return { ...prev, scope: [...prev.scope, ten_cq] }
            }
        })
    }

    const handleSubmit = async () => {
        if (!form.email || !form.display_name) {
            toast.error('Vui lòng điền đủ Email và Tên cơ quan')
            return
        }
        
        if (!editingUser && !form.password) {
            toast.error('Vui lòng nhập mật khẩu cho tài khoản mới')
            return
        }

        setLoading(true)
        try {
            const method = editingUser ? 'PUT' : 'POST'
            const body = { ...form }
            
            // Tự động set cứng scope cho tài khoản địa phương
            if (form.role === 'user') {
                body.scope = [`UBND ${form.display_name}`, `Chủ tịch UBND ${form.display_name}`]
            } else {
                body.scope = []
            }
            
            if (editingUser) {
                (body as any).id = editingUser.id
                if (!body.password) {
                    delete (body as any).password // Không gởi password nếu rỗng
                }
            }

            const res = await fetch('/api/admin/users', {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            })
            
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'Có lỗi xảy ra')

            toast.success(editingUser ? 'Cập nhật thành công' : 'Đã tạo tài khoản')
            onSuccess()
            onClose()
        } catch (err: any) {
            toast.error(err.message)
        } finally {
            setLoading(false)
        }
    }

    if (!open) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-white text-slate-900 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden relative border border-slate-200">
                <div className="flex items-center justify-between p-6 border-b">
                    <div>
                        <h2 className="text-lg font-semibold leading-none tracking-tight">
                            {editingUser ? 'Cập nhật Tài khoản' : 'Thêm mới Tài khoản'}
                        </h2>
                        <p className="text-sm text-slate-500 mt-1.5">
                            {editingUser ? 'Chỉnh sửa thông tin thành viên (để trống mật khẩu nếu không muốn đổi).' : 'Tạo mới một tài khoản truy cập vào hệ thống.'}
                        </p>
                    </div>
                    <button onClick={onClose} className="rounded-sm opacity-70 hover:opacity-100 transition-opacity">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                Email đăng nhập <span className="text-red-500">*</span>
                            </label>
                            <input 
                                type="email" 
                                className="flex h-9 w-full rounded-md border border-slate-200 bg-white text-slate-900 px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-red-800"
                                placeholder="canbo@angiang.gov.vn" 
                                value={form.email} 
                                onChange={e => setForm({...form, email: e.target.value})}
                            />
                        </div>
                        
                        <div className="space-y-2">
                            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                Mật khẩu {editingUser ? '(Tùy chọn)' : <span className="text-red-500">*</span>}
                            </label>
                            <input 
                                type="password" 
                                className="flex h-9 w-full rounded-md border border-slate-200 bg-white text-slate-900 px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-red-800"
                                placeholder={editingUser ? "Để trống nếu giữ nguyên" : "Nhập mật khẩu (ít nhất 6 ký tự)"} 
                                value={form.password} 
                                onChange={e => setForm({...form, password: e.target.value})}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                Đơn vị Địa phương (Tên hiển thị) <span className="text-red-500">*</span>
                            </label>
                            <select 
                                className="flex h-9 w-full items-center justify-between rounded-md border border-slate-200 bg-white text-slate-900 px-3 py-2 text-sm shadow-sm ring-offset-background focus:outline-none focus:ring-1 focus:ring-red-800 disabled:cursor-not-allowed disabled:opacity-50"
                                value={form.display_name} 
                                onChange={e => setForm({...form, display_name: e.target.value})}
                            >
                                <option value="" disabled>-- Chọn Đơn vị Hành chính --</option>
                                {dvhcList.map((item, idx) => (
                                    <option key={idx} value={item}>{item}</option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                Vai trò (Role)
                            </label>
                            <select 
                                className="flex h-9 w-full items-center justify-between rounded-md border border-slate-200 bg-white text-slate-900 px-3 py-2 text-sm shadow-sm ring-offset-background focus:outline-none focus:ring-1 focus:ring-red-800 disabled:cursor-not-allowed disabled:opacity-50"
                                value={form.role} 
                                onChange={(e) => setForm({...form, role: e.target.value})}
                            >
                                <option value="user">Tài khoản Địa phương (Local User)</option>
                                <option value="admin">Quản trị viên (Admin)</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-2 p-6 pt-4 border-t bg-slate-50/50">
                    <button 
                        className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-slate-200 bg-white hover:bg-slate-100 hover:text-slate-900 h-9 px-4 py-2"
                        onClick={onClose} 
                        disabled={loading}
                    >
                        Hủy
                    </button>
                    <button 
                        className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-red-800 text-white shadow hover:bg-red-800/90 h-9 px-4 py-2"
                        onClick={handleSubmit} 
                        disabled={loading}
                    >
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {editingUser ? 'Cập nhật' : 'Tạo Tài Khoản'}
                    </button>
                </div>
            </div>
        </div>
    )
}
