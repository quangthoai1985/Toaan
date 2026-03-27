import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

/**
 * GET /api/auth/session
 *
 * Phương Án 3: AuthProvider gọi API này thay vì dùng supabase.auth.getUser() trực tiếp.
 * Lý do: API route chạy server-side, đọc session từ cookies an toàn (không dính Web Locks).
 * Trả về { user, profile } hoặc { user: null, profile: null } nếu chưa đăng nhập.
 */
export async function GET() {
    try {
        const supabase = await createClient()
        const { data: { user }, error } = await supabase.auth.getUser()

        if (error || !user) {
            return NextResponse.json({ user: null, profile: null })
        }

        // Lấy profile
        const { data: profile } = await supabase
            .from('user_profiles')
            .select('id, email, display_name, role, scope')
            .eq('id', user.id)
            .single()

        return NextResponse.json({
            user: {
                id: user.id,
                email: user.email,
            },
            profile: profile ?? null,
        })
    } catch {
        return NextResponse.json({ user: null, profile: null })
    }
}
