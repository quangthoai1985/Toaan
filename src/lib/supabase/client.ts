import { createBrowserClient } from '@supabase/ssr'

// Singleton: chỉ tạo 1 instance duy nhất cho toàn bộ ứng dụng
let client: ReturnType<typeof createBrowserClient> | null = null

export function createClient() {
    if (client) return client
    client = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            auth: {
                // TẮT Web Locks API - fix lỗi "Lock was not released within 5000ms"
                // trên Cloudflare Workers SSR Hydration
                lock: 'no-op' as any,
                persistSession: true,
                autoRefreshToken: true,
                detectSessionInUrl: true,
            },
        }
    )
    return client
}
