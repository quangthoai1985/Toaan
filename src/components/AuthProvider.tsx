'use client'

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

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

export default function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [profile, setProfile] = useState<UserProfile | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        // Singleton client - luôn cùng 1 instance
        const supabase = createClient()

        // Fallback: Nếu sau 5 giây Auth vẫn chưa xong → buộc mở UI
        const timer = setTimeout(() => {
            setLoading(false)
        }, 5000)

        // CHỈ dùng onAuthStateChange - nó fire INITIAL_SESSION ngay lập tức
        // KHÔNG gọi getUser() để tránh race condition
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event: string, session: any) => {
                try {
                    const currentUser = session?.user ?? null
                    setUser(currentUser)

                    if (currentUser) {
                        // Fetch profile từ DB
                        const { data, error } = await supabase
                            .from('user_profiles')
                            .select('*')
                            .eq('id', currentUser.id)
                            .single()
                        
                        if (error) {
                            console.error("Lỗi tải profile:", error.message)
                            setProfile(null)
                        } else if (data) {
                            setProfile(data as UserProfile)
                        }
                    } else {
                        setProfile(null)
                    }
                } catch (err) {
                    console.error("Ngoại lệ Auth:", err)
                } finally {
                    setLoading(false)
                    clearTimeout(timer)
                }
            }
        )

        return () => {
            subscription.unsubscribe()
            clearTimeout(timer)
        }
    }, []) // Empty deps: chạy DUY NHẤT 1 lần khi mount

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
