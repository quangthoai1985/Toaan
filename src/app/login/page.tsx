'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Scale, Loader2, LogIn, Eye, EyeOff } from 'lucide-react'

export default function LoginPage() {
    const supabase = createClient()
    const router = useRouter()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setLoading(true)

        const { error: authError } = await supabase.auth.signInWithPassword({
            email: email.trim(),
            password,
        })

        if (authError) {
            setError(authError.message === 'Invalid login credentials' 
                ? 'Email hoặc mật khẩu không chính xác' 
                : authError.message)
            setLoading(false)
            return
        }

        router.push('/tong-quan')
        router.refresh()
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-red-950 to-slate-900 px-4 relative overflow-hidden">
            {/* Decorative Background */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-96 h-96 bg-red-500/10 rounded-full blur-3xl" />
                <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-red-600/10 rounded-full blur-3xl" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-red-500/5 rounded-full blur-3xl" />
                {/* Grid pattern */}
                <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22%20fill%3D%22rgba(255%2C255%2C255%2C0.02)%22%2F%3E%3C%2Fg%3E%3C%2Fsvg%3E')] opacity-60" />
                
                {/* Dong Son Drum Background */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none opacity-[0.08] mix-blend-plus-lighter w-full h-full flex items-center justify-center">
                    <img 
                        src="/images/trong-dong.png" 
                        alt="Trống đồng Đông Sơn" 
                        className="w-[200%] h-[200%] max-w-none md:w-[120%] md:h-[120%] object-contain"
                    />
                </div>
            </div>

            <div className="relative w-full max-w-md">
                {/* Logo & Title */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-red-500 to-red-700 shadow-2xl shadow-red-500/30 mb-6 ring-1 ring-white/10">
                        <Scale className="w-10 h-10 text-white" />
                    </div>
                    <h1 className="text-2xl font-bold text-white tracking-tight">
                        Quản Lý Án Hành Chính
                    </h1>
                    <p className="text-red-200/50 text-sm mt-2 font-medium">
                        Sở Tư pháp · Tỉnh An Giang
                    </p>
                </div>

                {/* Login Card */}
                <div className="bg-white/[0.06] backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl p-8">
                    <div className="mb-6">
                        <h2 className="text-lg font-bold text-white">Đăng nhập hệ thống</h2>
                        <p className="text-red-200/40 text-sm mt-1 font-medium">
                            Vui lòng nhập thông tin tài khoản
                        </p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-5">
                        {/* Email */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-red-200/60 uppercase tracking-wider">
                                Email
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="email@toaan.gov.vn"
                                required
                                className="w-full bg-white/[0.07] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-red-500/40 focus:border-red-500/40 transition-all font-medium"
                                autoComplete="email"
                            />
                        </div>

                        {/* Password */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-red-200/60 uppercase tracking-wider">
                                Mật khẩu
                            </label>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    required
                                    className="w-full bg-white/[0.07] border border-white/10 rounded-xl px-4 py-3 pr-12 text-sm text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-red-500/40 focus:border-red-500/40 transition-all font-medium"
                                    autoComplete="current-password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-white/30 hover:text-white/60 transition-colors rounded-lg"
                                >
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        {/* Error */}
                        {error && (
                            <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-sm text-red-300 font-medium animate-in fade-in slide-in-from-top-2 duration-200">
                                ⚠️ {error}
                            </div>
                        )}

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={loading || !email.trim() || !password}
                            className="w-full flex items-center justify-center gap-2.5 py-3.5 text-sm font-bold text-white bg-gradient-to-r from-red-600 to-red-700 rounded-xl hover:from-red-700 hover:to-red-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-lg shadow-red-600/25 hover:shadow-xl hover:shadow-red-600/30 active:scale-[0.98]"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Đang đăng nhập...
                                </>
                            ) : (
                                <>
                                    <LogIn className="w-4 h-4" />
                                    Đăng nhập
                                </>
                            )}
                        </button>
                    </form>
                </div>

                {/* Footer */}
                <p className="text-center text-red-200/25 text-xs mt-6 font-medium">
                    © 2026 Sở Tư pháp tỉnh An Giang · Quản Lý Thi Hành Án Hành Chính
                </p>
            </div>
        </div>
    )
}
