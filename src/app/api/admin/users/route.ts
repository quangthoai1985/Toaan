import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { getCloudflareContext } from '@opennextjs/cloudflare'

export const dynamic = 'force-dynamic'

// Lấy biến môi trường theo cách tương thích cả Cloudflare Workers và LocalDev
function getEnv(key: string): string | undefined {
    // Thử lấy từ Cloudflare context trước (production)
    try {
        const ctx = getCloudflareContext()
        const val = (ctx.env as Record<string, string | undefined>)[key]
        if (val) return val
    } catch {
        // Không phải môi trường Cloudflare (local dev) - bỏ qua
    }
    // Fallback về process.env (local dev với .env.local)
    return process.env[key]
}

// Hàm trợ giúp để tạo Supabase Admin Client
function getAdminClient() {
    const url = getEnv('NEXT_PUBLIC_SUPABASE_URL')
    const serviceKey = getEnv('SUPABASE_SERVICE_ROLE_KEY')
    if (!url || !serviceKey) {
        throw new Error(`Missing env vars: URL=${!!url}, KEY=${!!serviceKey}`)
    }
    return createSupabaseClient(
        url,
        serviceKey,
        {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        }
    )
}

// Xác thực quyền Admin
async function requireAdmin() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) throw new Error('Cần đăng nhập để thực hiện')

    const { data: profile } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    if (!profile || profile.role !== 'admin') throw new Error('Không có quyền quản trị (Not an admin)')

    return user
}

// Lấy danh sách tài khoản
export async function GET() {
    try {
        const adminUser = await requireAdmin()
        if (!adminUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        
        const adminClient = getAdminClient()

        // Lấy từ auth.users
        const { data: authData, error: authError } = await adminClient.auth.admin.listUsers()
        if (authError) throw authError

        // Lấy thông tin bổ sung từ user_profiles
        const { data: profilesData, error: profilesError } = await adminClient
            .from('user_profiles')
            .select('*')
        if (profilesError) throw profilesError

        // Hợp nhất
        const users = authData.users.map(u => {
            const profile = profilesData.find(p => p.id === u.id)
            return {
                id: u.id,
                email: u.email,
                created_at: u.created_at,
                last_sign_in_at: u.last_sign_in_at,
                display_name: profile?.display_name || 'Chưa cập nhật',
                role: profile?.role || 'user',
                scope: profile?.scope || []
            }
        })

        return NextResponse.json({ users })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

// Tạo tài khoản mới
export async function POST(request: Request) {
    try {
        const adminUser = await requireAdmin()
        if (!adminUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const adminClient = getAdminClient()

        const body = await request.json()
        const { email, password, display_name, role, scope } = body

        if (!email || !password || !display_name) {
            return NextResponse.json({ error: 'Thiếu thông tin bắt buộc' }, { status: 400 })
        }

        // Tạo trong auth.users
        const { data: userData, error: userError } = await adminClient.auth.admin.createUser({
            email,
            password,
            email_confirm: true // tự động xác nhận
        })

        if (userError) throw userError

        const newId = userData.user.id

        // Tạo bản ghi trong user_profiles
        const { error: profileError } = await adminClient
            .from('user_profiles')
            .insert({
                id: newId,
                email,
                display_name,
                role: role || 'user',
                scope: scope || []
            })
            
        // Nếu chèn profile lỗi, cảnh báo nhưng không xoá user (để an toàn hoặc có thể rollback)
        if (profileError) {
            console.error('Lỗi khi chèn user_profiles:', profileError)
            return NextResponse.json({ 
                error: 'Tạo Auth thành công nhưng lỗi chèn Profile: ' + profileError.message 
            }, { status: 500 })
        }

        return NextResponse.json({ message: 'Tạo tài khoản thành công', id: newId })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

// Cập nhật thông tin tài khoản
export async function PUT(request: Request) {
    try {
        const adminUser = await requireAdmin()
        if (!adminUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const adminClient = getAdminClient()

        const body = await request.json()
        const { id, email, password, display_name, role, scope } = body

        if (!id) return NextResponse.json({ error: 'Thiếu ID người dùng' }, { status: 400 })

        // 1. Cập nhật Auth (Email hoặc Password nếu có)
        const updateAuthPayload: any = {}
        if (email) updateAuthPayload.email = email
        if (password) updateAuthPayload.password = password

        if (Object.keys(updateAuthPayload).length > 0) {
            const { error: authError } = await adminClient.auth.admin.updateUserById(id, updateAuthPayload)
            if (authError) throw authError
        }

        // 2. Cập nhật Profile
        const updateProfilePayload: any = {}
        if (display_name !== undefined) updateProfilePayload.display_name = display_name
        if (role !== undefined) updateProfilePayload.role = role
        if (scope !== undefined) updateProfilePayload.scope = scope

        if (Object.keys(updateProfilePayload).length > 0) {
            const { error: profileError } = await adminClient
                .from('user_profiles')
                .update(updateProfilePayload)
                .eq('id', id)
            if (profileError) throw profileError
        }

        return NextResponse.json({ message: 'Cập nhật thành công' })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

// Xóa tài khoản
export async function DELETE(request: Request) {
    try {
        const adminUser = await requireAdmin()
        if (!adminUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const adminClient = getAdminClient()

        const { searchParams } = new URL(request.url)
        const id = searchParams.get('id')

        if (!id) return NextResponse.json({ error: 'Thiếu ID người dùng' }, { status: 400 })

        // Không cho phép tự xóa chính mình
        if (id === adminUser.id) {
            return NextResponse.json({ error: 'Không thể tự xóa tài khoản của chính mình' }, { status: 403 })
        }

        // Bản ghi user_profiles có on delete cascade với auth.users không?
        // Kể cả không có, khi xóa user trong auth, Supabase có thể bị cản bởi user_profiles fk
        // Nên xóa user_profiles trước
        const { error: profileError } = await adminClient.from('user_profiles').delete().eq('id', id)
        if (profileError) {
             console.error('Delete profile error:', profileError)
             // Có thể vẫn tiếp tục xóa auth if ignore
        }

        // Cẩn thận: Bảng an_hanh_chinh có created_by REF user_profiles. Xóa user_profile sẽ LỖI 
        // nếu an_hanh_chinh không SET NULL hoặc CASCADE!
        // Vậy nên ta phải xử lý Ràng buộc khóa ngoại ở Frontend thông qua SQL hoặc bắt lỗi.
        // Ở đây cứ thử xóa:
        const { error: authError } = await adminClient.auth.admin.deleteUser(id)
        
        if (authError) throw authError

        return NextResponse.json({ message: 'Đã xóa tài khoản' })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
