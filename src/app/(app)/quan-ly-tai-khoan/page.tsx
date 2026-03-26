'use client'

import { useState, useEffect } from 'react'
import { Plus, Search, Trash2, Edit2, Shield, User as UserIcon, Loader2, AlertCircle } from 'lucide-react'
import { useToast } from '@/components/Toast'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'
import { createClient } from '@/lib/supabase/client'
import AddEditUserModal from './AddEditUserModal'

export default function QuanLyTaiKhoanPage() {
    const toast = useToast()
    const { profile, loading: authLoading } = useAuth()
    const router = useRouter()
    
    const [users, setUsers] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [search, setSearch] = useState('')
    
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingUser, setEditingUser] = useState<any>(null)
    
    const [deleteId, setDeleteId] = useState<string | null>(null)
    const [deleting, setDeleting] = useState(false)

    useEffect(() => {
        if (!authLoading) {
            if (!profile || profile.role !== 'admin') {
                router.push('/dashboard')
            } else {
                fetchUsers()
            }
        }
    }, [authLoading, profile, router])

    const fetchUsers = async () => {
        setLoading(true)
        setError('')
        try {
            const res = await fetch('/api/admin/users')
            if (!res.ok) throw new Error('Không thể tải danh sách tài khoản')
            const data = await res.json()
            if (data.error) throw new Error(data.error)
            setUsers(data.users || [])
        } catch (err: any) {
            setError(err.message)
            toast.error(err.message)
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async () => {
        if (!deleteId) return
        setDeleting(true)
        try {
            const res = await fetch(`/api/admin/users?id=${deleteId}`, {
                method: 'DELETE'
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'Lỗi khi xóa tài khoản')
            
            toast.success('Đã xóa tài khoản thành công')
            setUsers(users.filter(u => u.id !== deleteId))
        } catch (err: any) {
            toast.error(err.message)
        } finally {
            setDeleting(false)
            setDeleteId(null)
        }
    }

    const filteredUsers = users.filter(u => 
        u.display_name.toLowerCase().includes(search.toLowerCase()) || 
        u.email.toLowerCase().includes(search.toLowerCase())
    )

    if (authLoading || (profile && profile.role !== 'admin' && loading)) {
        return <div className="flex h-40 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-red-600" /></div>
    }

    return (
        <div className="max-w-7xl mx-auto p-6 space-y-6">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">Quản lý Tài khoản</h1>
                    <p className="text-slate-500 mt-2">Quản lý truy cập và phân quyền hệ thống</p>
                </div>
                <button 
                    onClick={() => { setEditingUser(null); setIsModalOpen(true); }}
                    className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-red-800 text-white shadow hover:bg-red-800/90 h-9 px-4 py-2"
                >
                    <Plus className="w-4 h-4 mr-2" /> Thêm Tài Khoản
                </button>
            </div>

            <div className="rounded-xl border bg-white text-slate-950 shadow">
                <div className="flex flex-col space-y-1.5 p-6 pb-3 border-b">
                    <div className="flex justify-between items-center">
                        <h3 className="font-semibold leading-none tracking-tight text-lg">Danh sách Thành viên</h3>
                        <div className="relative w-72">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                            <input
                                placeholder="Tìm theo tên hoặc email..."
                                className="flex h-9 w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-1 pl-9 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-red-800 disabled:cursor-not-allowed disabled:opacity-50"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                    </div>
                </div>
                <div className="p-0">
                    {loading ? (
                        <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-slate-400" /></div>
                    ) : error ? (
                        <div className="text-center py-10 text-red-500 flex flex-col items-center">
                            <AlertCircle className="h-10 w-10 mb-2 opacity-50" />
                            <p>{error}</p>
                            <button className="mt-4 px-4 py-2 border rounded-md hover:bg-slate-50" onClick={fetchUsers}>Thử lại</button>
                        </div>
                    ) : (
                        <div className="relative w-full overflow-auto">
                            <table className="w-full caption-bottom text-sm">
                                <thead className="border-b bg-slate-50/50">
                                    <tr>
                                        <th className="h-10 px-4 text-left align-middle font-medium text-slate-500">Email</th>
                                        <th className="h-10 px-4 text-left align-middle font-medium text-slate-500">Cơ quan / Tên hiển thị</th>
                                        <th className="h-10 px-4 text-left align-middle font-medium text-slate-500">Phân quyền</th>
                                        <th className="h-10 px-4 text-left align-middle font-medium text-slate-500">Phạm vi tra cứu (Scope)</th>
                                        <th className="h-10 px-4 align-middle font-medium text-slate-500 text-right">Thao tác</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredUsers.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="p-4 align-middle text-center h-24 text-slate-500">
                                                Không tìm thấy tài khoản nào.
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredUsers.map((user) => (
                                            <tr key={user.id} className="border-b transition-colors hover:bg-slate-50/50">
                                                <td className="p-4 align-middle font-medium">{user.email}</td>
                                                <td className="p-4 align-middle">{user.display_name}</td>
                                                <td className="p-4 align-middle">
                                                    {user.role === 'admin' ? 
                                                        <span className="inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold bg-indigo-500 text-white shadow border-transparent"><Shield className="w-3 h-3 mr-1"/> Admin</span> : 
                                                        <span className="inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold bg-slate-100 text-slate-900"><UserIcon className="w-3 h-3 mr-1"/> Local User</span>
                                                    }
                                                </td>
                                                <td className="p-4 align-middle text-xs text-slate-500">
                                                    {user.scope?.length > 0 ? user.scope.join(', ') : 'Toàn hệ thống'}
                                                </td>
                                                <td className="p-4 align-middle text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <button className="h-8 w-8 inline-flex items-center justify-center rounded-md text-sm font-medium hover:bg-slate-100 text-slate-500 transition-colors" onClick={() => { setEditingUser(user); setIsModalOpen(true); }}>
                                                            <Edit2 className="h-4 w-4" />
                                                        </button>
                                                        <button 
                                                            className={`h-8 w-8 inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors ${user.id === profile?.id ? 'text-slate-300 cursor-not-allowed' : 'hover:bg-red-50 text-red-500'}`}
                                                            onClick={() => setDeleteId(user.id)}
                                                            disabled={user.id === profile?.id} // Không tự xóa
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            <AddEditUserModal 
                open={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
                onSuccess={fetchUsers}
                editingUser={editingUser}
            />

            {!!deleteId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl border">
                        <div className="mb-4">
                            <h2 className="text-lg font-bold text-slate-900">Bạn có chắc chắn muốn xóa tài khoản này?</h2>
                            <p className="text-sm text-slate-500 mt-2">
                                Hành động này không thể hoàn tác. Người dùng sẽ không thể đăng nhập vào hệ thống nữa.
                                <br/><br/>
                                <strong className="text-red-600">Lưu ý:</strong> Nếu tài khoản này đã từng tạo án, việc xóa tài khoản có thể gây lỗi dữ liệu những án đó (nếu CSDL không cấu hình SET NULL).
                            </p>
                        </div>
                        <div className="flex justify-end gap-3 mt-6">
                            <button 
                                className="px-4 py-2 border rounded-md hover:bg-slate-50 text-sm font-medium"
                                onClick={() => setDeleteId(null)} 
                                disabled={deleting}
                            >
                                Hủy
                            </button>
                            <button 
                                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm font-medium inline-flex items-center"
                                onClick={(e) => { e.preventDefault(); handleDelete(); }} 
                                disabled={deleting}
                            >
                                {deleting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Trash2 className="w-4 h-4 mr-2" />}
                                Xóa tài khoản
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
