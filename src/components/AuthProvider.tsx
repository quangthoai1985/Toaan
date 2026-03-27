'use client'

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react'
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
    // Tránh việc Client bị khởi tạo lại liên tục khi React Re-render (lỗi kẹt Auth)
    const [supabase] = useState(() => createClient())
    const [user, setUser] = useState<User | null>(null)
    const [profile, setProfile] = useState<UserProfile | null>(null)
    const [loading, setLoading] = useState(true)

    const fetchProfile = useCallback(async (userId: string) => {
        try {
            const { data, error } = await supabase
                .from('user_profiles')
                .select('*')
                .eq('id', userId)
                .single()
            if (error) {
                console.error("Lỗi khi tải profile:", error.message)
            } else if (data) {
                setProfile(data as UserProfile)
            }
        } catch (err: any) {
            console.error("Ngoại lệ tải profile:", err)
        }
    }, [supabase])

    useEffect(() => {
        // Fallback chống treo vĩnh viễn (Force Unlock UI sau 5 giây)
        const timer = setTimeout(() => {
            setLoading(false)
        }, 5000)

        // Get initial session
        supabase.auth.getUser().then(async ({ data: { user }, error }) => {
            if (error) console.error("Lỗi auth get user:", error.message)
            setUser(user ?? null)
            if (user) {
                await fetchProfile(user.id)
            }
            setLoading(false)
        }).catch((err) => {
            console.error("Ngoại lệ khi get user:", err)
            setLoading(false)
        })

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (_event, session) => {
                const currentUser = session?.user ?? null
                setUser(currentUser)
                if (currentUser) {
                    await fetchProfile(currentUser.id)
                } else {
                    setProfile(null)
                }
                setLoading(false)
            }
        )

        return () => {
            subscription.unsubscribe()
            clearTimeout(timer)
        }
    }, [supabase, fetchProfile])

    const signOut = async () => {
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
