'use client'

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User, AuthChangeEvent } from '@supabase/supabase-js'

export interface UserProfile {
    id: string
    email: string
    display_name: string
    role: 'admin' | 'user'
    scope: string[] | null
}

interface AuthContextType {
    user: User | null
    profile: UserProfile | null
    loading: boolean
    isAdmin: boolean
    scope: string[] | null
    signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    profile: null,
    loading: true,
    isAdmin: false,
    scope: null,
    signOut: async () => {},
})

export function useAuth() {
    return useContext(AuthContext)
}

/**
 * Phương Án 3: AuthProvider dùng server-side API để lấy session
 *
 * Lý do: Tránh hoàn toàn Web Locks API của Supabase ở client-side.
 * - Khởi tạo: fetch('/api/auth/session') → server đọc cookie → trả về {user, profile}
 * - Sau đó: onAuthStateChange listen SIGNED_IN / SIGNED_OUT để cập nhật trạng thái
 * - signOut: supabase.auth.signOut() để xóa cookie, rồi redirect
 */
export default function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [profile, setProfile] = useState<UserProfile | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        let mounted = true

        // Bước 1: Lấy session từ API server-side (không dính Web Locks)
        async function initialize() {
            try {
                const res = await fetch('/api/auth/session', { cache: 'no-store' })
                if (!mounted) return

                if (!res.ok) {
                    setUser(null)
                    setProfile(null)
                    return
                }

                const data = await res.json()
                if (!mounted) return

                if (data.user) {
                    setUser(data.user as User)
                    setProfile(data.profile as UserProfile | null)
                } else {
                    setUser(null)
                    setProfile(null)
                }
            } catch (err) {
                console.error('[Auth] Lỗi khi lấy session:', err)
                if (mounted) {
                    setUser(null)
                    setProfile(null)
                }
            } finally {
                if (mounted) setLoading(false)
            }
        }

        initialize()

        // Bước 2: Lắng nghe sự kiện SIGNED_IN / SIGNED_OUT để cập nhật trạng thái
        // Không dùng cho initial load, chỉ để đồng bộ sau khi login/logout
        const supabase = createClient()
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event: AuthChangeEvent) => {
                if (!mounted) return
                // Chỉ xử lý SIGNED_IN và SIGNED_OUT - bỏ TOKEN_REFRESHED để tránh fetch loop
                if (event !== 'SIGNED_IN' && event !== 'SIGNED_OUT') return
                try {
                    const res = await fetch('/api/auth/session', { cache: 'no-store' })
                    if (!mounted) return
                    // Kiểm tra content-type để tránh parse HTML thành JSON
                    const ct = res.headers.get('content-type') ?? ''
                    if (!res.ok || !ct.includes('application/json')) return
                    const data = await res.json()
                    if (!mounted) return
                    setUser(data.user as User | null)
                    setProfile(data.profile as UserProfile | null)
                } catch (err) {
                    console.error('[Auth] Lỗi cập nhật session:', err)
                }
            }
        )

        return () => {
            mounted = false
            subscription.unsubscribe()
        }
    }, [])

    const signOut = async () => {
        const supabase = createClient()
        await supabase.auth.signOut()
        setUser(null)
        setProfile(null)
        window.location.href = '/login'
    }

    return (
        <AuthContext.Provider
            value={{
                user,
                profile,
                loading,
                isAdmin: profile?.role === 'admin',
                scope: profile?.scope ?? null,
                signOut,
            }}
        >
            {children}
        </AuthContext.Provider>
    )
}
