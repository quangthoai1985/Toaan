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
    const supabase = createClient()
    const [user, setUser] = useState<User | null>(null)
    const [profile, setProfile] = useState<UserProfile | null>(null)
    const [loading, setLoading] = useState(true)

    const fetchProfile = useCallback(async (userId: string) => {
        const { data } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', userId)
            .single()
        if (data) setProfile(data as UserProfile)
    }, [supabase])

    useEffect(() => {
        // Get initial session
        supabase.auth.getUser().then(({ data: { user } }) => {
            setUser(user ?? null)
            if (user) fetchProfile(user.id)
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

        return () => subscription.unsubscribe()
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
