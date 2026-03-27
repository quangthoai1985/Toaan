import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

interface StatsResponse {
    total: number
    pending: number
    watching: number
    completed: number
    localCreated: number
    localCreators: { name: string; count: number }[]
    byOrgan: { name: string; count: number }[]
    byStatus: { status: string; count: number }[]
}

function normalizeOrganName(name: string): string {
    const lower = name.toLowerCase()
    if (lower.includes('ubnd') && lower.includes('tỉnh kiên giang')) return 'UBND Tỉnh Kiên Giang'
    if (lower.includes('phú quốc') && (lower.includes('chủ tịch') || lower.includes('ct'))) return 'Chủ tịch UBND Phú Quốc'
    if (lower.includes('phú quốc')) return 'UBND Phú Quốc'
    if (lower.includes('rạch giá')) return 'UBND TP. Rạch Giá'
    if (lower.includes('châu thành')) return 'UBND H. Châu Thành'
    if (lower.includes('an giang')) return 'UBND Tỉnh An Giang'
    if (lower.includes('long xuyên')) return 'UBND TP. Long Xuyên'
    return name.length > 35 ? `${name.substring(0, 35)}...` : name
}

function jsonNoStore(body: unknown, init?: ResponseInit) {
    const response = NextResponse.json(body, init)
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0')
    response.headers.set('CDN-Cache-Control', 'no-store')
    response.headers.set('Cloudflare-CDN-Cache-Control', 'no-store')
    return response
}

export async function GET() {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return jsonNoStore({ error: 'Unauthorized' }, { status: 401 })
        }

        const { data: profile, error: profileError } = await supabase
            .from('user_profiles')
            .select('scope')
            .eq('id', user.id)
            .single()

        if (profileError) {
            throw profileError
        }

        const scope = profile?.scope ?? null
        const applyScope = (query: any) => {
            if (scope && scope.length > 0) {
                return query.in('nguoi_phai_thi_hanh', scope)
            }
            return query
        }

        const totalRes = await applyScope(
            supabase.from('an_hanh_chinh').select('*', { count: 'exact', head: true })
        )
        const completedRes = await applyScope(
            supabase.from('an_hanh_chinh').select('*', { count: 'exact', head: true }).eq('status', 'COMPLETED')
        )
        const watchingRes = await applyScope(
            supabase.from('an_hanh_chinh').select('*', { count: 'exact', head: true })
                .eq('status', 'PENDING')
                .not('ly_do_cho_theo_doi', 'is', null)
                .neq('ly_do_cho_theo_doi', '')
        )
        const pendingRes = await applyScope(
            supabase.from('an_hanh_chinh').select('*', { count: 'exact', head: true })
                .eq('status', 'PENDING')
                .or('ly_do_cho_theo_doi.is.null,ly_do_cho_theo_doi.eq.')
        )

        let allQuery = supabase
            .from('an_hanh_chinh')
            .select('nguoi_phai_thi_hanh, creator:user_profiles(role, display_name)')

        if (scope && scope.length > 0) {
            allQuery = allQuery.in('nguoi_phai_thi_hanh', scope)
        }

        const { data: allRecords, error: allRecordsError } = await allQuery

        if (totalRes.error) throw totalRes.error
        if (completedRes.error) throw completedRes.error
        if (watchingRes.error) throw watchingRes.error
        if (pendingRes.error) throw pendingRes.error
        if (allRecordsError) throw allRecordsError

        const organMap: Record<string, number> = {}
        const localCreatorMap: Record<string, number> = {}
        let localCreatedCount = 0

        if (allRecords) {
            for (const record of allRecords as Array<{
                nguoi_phai_thi_hanh: string | null
                creator?: { role?: string | null; display_name?: string | null } | null
            }>) {
                const rawName = (record.nguoi_phai_thi_hanh || 'Không xác định').replace(/\r?\n/g, ' ').trim()
                const normalized = normalizeOrganName(rawName)
                organMap[normalized] = (organMap[normalized] || 0) + 1

                if (record.creator?.role === 'user') {
                    localCreatedCount += 1
                    const creatorName = record.creator.display_name || 'Tài khoản chưa định danh'
                    localCreatorMap[creatorName] = (localCreatorMap[creatorName] || 0) + 1
                }
            }
        }

        const pendingCount = pendingRes.count ?? 0
        const watchingCount = watchingRes.count ?? 0
        const completedCount = completedRes.count ?? 0

        const payload: StatsResponse = {
            total: totalRes.count ?? 0,
            pending: pendingCount,
            watching: watchingCount,
            completed: completedCount,
            localCreated: localCreatedCount,
            localCreators: Object.entries(localCreatorMap)
                .map(([name, count]) => ({ name, count }))
                .sort((a, b) => b.count - a.count),
            byOrgan: Object.entries(organMap)
                .map(([name, count]) => ({ name, count }))
                .sort((a, b) => b.count - a.count)
                .slice(0, 8),
            byStatus: [
                { status: 'Đang thi hành', count: pendingCount },
                { status: 'Chờ theo dõi', count: watchingCount },
                { status: 'Đã thi hành', count: completedCount },
            ],
        }

        return jsonNoStore(payload)
    } catch (error: any) {
        return jsonNoStore({ error: error?.message || 'Internal Server Error' }, { status: 500 })
    }
}
