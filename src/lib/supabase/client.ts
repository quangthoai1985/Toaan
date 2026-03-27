import { createBrowserClient } from '@supabase/ssr'

// Singleton thủ công để kiểm soát lock option
let client: ReturnType<typeof createBrowserClient> | null = null

export function createClient() {
    if (typeof window === 'undefined') {
        // Server-side: không cần lock bypass, tạo mới mỗi lần
        return createBrowserClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        )
    }

    if (client) return client

    // Client-side: tắt SSR internal singleton, tự quản lý ở đây
    client = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            isSingleton: false,
            auth: {
                // CRITICAL FIX: Bypass Web Locks API hoàn toàn
                // Nguyên nhân deadlock: React StrictMode unmount/remount
                // → orphaned Web Lock → mọi auth call kẹt 5s → AbortError
                // Custom lock = chỉ thực thi function, không acquire lock
                lock: async <R>(_name: string, _timeout: number, fn: () => Promise<R>): Promise<R> => {
                    return await fn()
                },
            },
        }
    )

    return client
}
