'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { AnHanhChinh, TienDoEntry } from '@/lib/types'
import { cn, truncate } from '@/lib/utils'
import { Search, Plus, Pencil, Eye, CheckCircle2, Undo2, RefreshCw, Loader2 } from 'lucide-react'
import { useToast } from './Toast'
import AddAnModal from './AddAnModal'
import CompleteAnModal from './CompleteAnModal'
import DetailModal from './DetailModal'
import TimelineModal from './TimelineModal'
import ConfirmModal from './ConfirmModal'

type TabKey = 'PENDING' | 'COMPLETED'

export default function AnHanhChinhPage() {
    const supabase = createClient()
    const toast = useToast()
    const [activeTab, setActiveTab] = useState<TabKey>('PENDING')
    const [data, setData] = useState<AnHanhChinh[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [pendingCount, setPendingCount] = useState(0)
    const [completedCount, setCompletedCount] = useState(0)

    // Modal states
    const [showAddModal, setShowAddModal] = useState(false)
    const [completeRecord, setCompleteRecord] = useState<AnHanhChinh | null>(null)
    const [detailRecord, setDetailRecord] = useState<AnHanhChinh | null>(null)
    const [timelineRecord, setTimelineRecord] = useState<AnHanhChinh | null>(null)
    const [undoRecord, setUndoRecord] = useState<AnHanhChinh | null>(null)
    const [undoLoading, setUndoLoading] = useState(false)

    // Fetch data
    const fetchData = useCallback(async () => {
        setLoading(true)
        let query = supabase
            .from('an_hanh_chinh')
            .select('*', { count: 'exact' })
            .eq('status', activeTab)
            .order('updated_at', { ascending: false })

        if (search.trim()) {
            const s = `%${search.trim()}%`
            query = query.or(`so_ban_an.ilike.${s},nguoi_khoi_kien.ilike.${s}`)
        }

        const { data: rows, error } = await query

        if (!error && rows) {
            setData(rows as AnHanhChinh[])
        }

        // Fetch counts for tabs
        const [pendingRes, completedRes] = await Promise.all([
            supabase.from('an_hanh_chinh').select('*', { count: 'exact', head: true }).eq('status', 'PENDING'),
            supabase.from('an_hanh_chinh').select('*', { count: 'exact', head: true }).eq('status', 'COMPLETED'),
        ])
        setPendingCount(pendingRes.count ?? 0)
        setCompletedCount(completedRes.count ?? 0)

        setLoading(false)
    }, [activeTab, search])

    useEffect(() => { fetchData() }, [fetchData])

    // Helper: refresh record in timeline modal after adding entry
    const refreshTimelineRecord = useCallback(async () => {
        if (!timelineRecord) return
        const { data: fresh } = await supabase
            .from('an_hanh_chinh')
            .select('*')
            .eq('id', timelineRecord.id)
            .single()
        if (fresh) {
            setTimelineRecord(fresh as AnHanhChinh)
        }
        fetchData()
    }, [timelineRecord, fetchData])

    // Undo: set status back to PENDING
    async function handleUndo() {
        if (!undoRecord) return
        setUndoLoading(true)
        const { error } = await supabase
            .from('an_hanh_chinh')
            .update({
                status: 'PENDING',
                ket_qua_cuoi_cung: null,
            })
            .eq('id', undoRecord.id)

        setUndoLoading(false)
        if (error) {
            toast.error(`Lỗi: ${error.message}`)
            return
        }
        toast.success('Đã hoàn tác — Án chuyển về "Đang thi hành"')
        setUndoRecord(null)
        fetchData()
    }

    // Get latest update from timeline
    function getLatestUpdate(entries: TienDoEntry[]): string {
        if (!entries || entries.length === 0) return '—'
        const last = entries[entries.length - 1]
        return last.content || '—'
    }

    function getLatestDate(entries: TienDoEntry[]): string {
        if (!entries || entries.length === 0) return ''
        const last = entries[entries.length - 1]
        if (!last.date) return ''
        const m = last.date.match(/^(\d{4})-(\d{2})-(\d{2})/)
        if (m) return `${m[3]}/${m[2]}/${m[1]}`
        return last.date
    }

    const tabs: { key: TabKey; label: string; count: number; activeColor: string; badgeColor: string }[] = [
        {
            key: 'PENDING',
            label: 'ĐANG THI HÀNH',
            count: pendingCount,
            activeColor: 'bg-amber-50 border-amber-500 text-amber-800',
            badgeColor: 'bg-amber-500/15 text-amber-700',
        },
        {
            key: 'COMPLETED',
            label: 'ÁN XONG',
            count: completedCount,
            activeColor: 'bg-emerald-50 border-emerald-500 text-emerald-800',
            badgeColor: 'bg-emerald-500/15 text-emerald-700',
        },
    ]

    return (
        <div className="p-4 sm:p-6 flex flex-col flex-1 min-h-0 w-full h-full gap-4">
            {/* Page header + actions */}
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h1 className="text-xl font-bold text-slate-800">Theo dõi Thi hành Án Hành Chính</h1>
                    <p className="text-slate-500 text-sm mt-0.5">Quản lý và cập nhật tiến độ thi hành các bản án hành chính</p>
                </div>
                <div className="flex gap-2 shrink-0">
                    <button
                        onClick={fetchData}
                        className="flex items-center gap-1.5 px-3 py-2 text-sm bg-white border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors"
                    >
                        <RefreshCw className="w-4 h-4" /> Tải lại
                    </button>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="flex items-center gap-1.5 px-4 py-2 text-sm bg-red-700 text-white rounded-lg hover:bg-red-800 transition-colors font-medium shadow-sm"
                    >
                        <Plus className="w-4 h-4" /> Thêm mới Án
                    </button>
                </div>
            </div>

            {/* Search & Filter bar */}
            <div className="bg-white rounded-xl border border-slate-100 p-4">
                <div className="flex flex-wrap gap-3">
                    <div className="relative flex-1 min-w-[200px]">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Tìm theo Số bản án hoặc Người khởi kiện..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-300 focus:border-red-300"
                        />
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 border-b border-slate-200">
                {tabs.map(tab => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={cn(
                            'relative flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-t-lg border-b-2 transition-all',
                            activeTab === tab.key
                                ? tab.activeColor
                                : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                        )}
                    >
                        {tab.label}
                        <span className={cn(
                            'text-[11px] font-bold px-2 py-0.5 rounded-full min-w-[1.5rem] text-center tabular-nums',
                            activeTab === tab.key ? tab.badgeColor : 'bg-slate-100 text-slate-500'
                        )}>
                            {tab.count}
                        </span>
                    </button>
                ))}
            </div>

            {/* Data Table */}
            <div className="flex-1 overflow-auto bg-white rounded-xl border border-slate-100">
                {loading ? (
                    <div className="flex items-center justify-center h-48">
                        <Loader2 className="w-6 h-6 animate-spin text-red-600" />
                        <span className="ml-2 text-slate-500 text-sm">Đang tải dữ liệu...</span>
                    </div>
                ) : data.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-48 text-slate-400">
                        <p className="text-sm">Không có dữ liệu</p>
                    </div>
                ) : (
                    <table className="w-full text-sm">
                        <thead className="bg-slate-50 sticky top-0 z-10">
                            <tr>
                                <th className="px-3 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider w-[50px]">STT</th>
                                {activeTab === 'PENDING' ? (
                                    <>
                                        <th className="px-3 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Người khởi kiện</th>
                                        <th className="px-3 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Số Bản án</th>
                                        <th className="px-3 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Người phải thi hành</th>
                                        <th className="px-3 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider min-w-[250px]">Cập nhật mới nhất</th>
                                        <th className="px-3 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider w-[160px]">Hành động</th>
                                    </>
                                ) : (
                                    <>
                                        <th className="px-3 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Số Bản án</th>
                                        <th className="px-3 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Người khởi kiện</th>
                                        <th className="px-3 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Người phải thi hành</th>
                                        <th className="px-3 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider min-w-[250px]">Kết quả cuối cùng</th>
                                        <th className="px-3 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider w-[120px]">Hành động</th>
                                    </>
                                )}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {data.map((row, idx) => (
                                <tr key={row.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-3 py-2.5 text-slate-400 text-center font-mono text-xs">{idx + 1}</td>
                                    {activeTab === 'PENDING' ? (
                                        <>
                                            <td className="px-3 py-2.5 text-slate-700 font-medium">{row.nguoi_khoi_kien}</td>
                                            <td className="px-3 py-2.5 text-slate-600">{row.so_ban_an}</td>
                                            <td className="px-3 py-2.5 text-slate-600">{row.nguoi_phai_thi_hanh}</td>
                                            <td className="px-3 py-2.5">
                                                <div>
                                                    <p className="text-slate-600 text-[13px]">{truncate(getLatestUpdate(row.tien_do_cap_nhat), 55)}</p>
                                                    {getLatestDate(row.tien_do_cap_nhat) && (
                                                        <p className="text-[11px] text-slate-400 mt-0.5">{getLatestDate(row.tien_do_cap_nhat)}</p>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-3 py-2.5">
                                                <div className="flex items-center justify-center gap-1">
                                                    <button
                                                        onClick={() => setTimelineRecord(row)}
                                                        title="Cập nhật tiến độ"
                                                        className="p-1.5 rounded-md text-blue-600 hover:bg-blue-50 transition-colors"
                                                    >
                                                        <Pencil className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => setDetailRecord(row)}
                                                        title="Xem chi tiết"
                                                        className="p-1.5 rounded-md text-slate-500 hover:bg-slate-100 transition-colors"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => setCompleteRecord(row)}
                                                        title="Chốt án"
                                                        className="p-1.5 rounded-md text-emerald-600 hover:bg-emerald-50 transition-colors"
                                                    >
                                                        <CheckCircle2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </>
                                    ) : (
                                        <>
                                            <td className="px-3 py-2.5 text-slate-600">{row.so_ban_an}</td>
                                            <td className="px-3 py-2.5 text-slate-700 font-medium">{row.nguoi_khoi_kien}</td>
                                            <td className="px-3 py-2.5 text-slate-600">{row.nguoi_phai_thi_hanh}</td>
                                            <td className="px-3 py-2.5 text-slate-500 text-[13px]">
                                                {row.ket_qua_cuoi_cung ? truncate(row.ket_qua_cuoi_cung, 60) : '—'}
                                            </td>
                                            <td className="px-3 py-2.5">
                                                <div className="flex items-center justify-center gap-1">
                                                    <button
                                                        onClick={() => setDetailRecord(row)}
                                                        title="Xem chi tiết"
                                                        className="p-1.5 rounded-md text-slate-500 hover:bg-slate-100 transition-colors"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => setUndoRecord(row)}
                                                        title="Hoàn tác"
                                                        className="p-1.5 rounded-md text-amber-600 hover:bg-amber-50 transition-colors"
                                                    >
                                                        <Undo2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* ─── Modals ─────────────────────────────────────────────────── */}

            {/* Add new case */}
            <AddAnModal
                open={showAddModal}
                onClose={() => setShowAddModal(false)}
                onSuccess={fetchData}
            />

            {/* Complete case */}
            <CompleteAnModal
                open={!!completeRecord}
                record={completeRecord}
                onClose={() => setCompleteRecord(null)}
                onSuccess={fetchData}
            />

            {/* Detail view */}
            <DetailModal
                open={!!detailRecord}
                record={detailRecord}
                onClose={() => setDetailRecord(null)}
            />

            {/* Timeline update */}
            <TimelineModal
                open={!!timelineRecord}
                record={timelineRecord}
                onClose={() => { setTimelineRecord(null); fetchData() }}
                onSuccess={refreshTimelineRecord}
            />

            {/* Undo confirm */}
            <ConfirmModal
                open={!!undoRecord}
                title="Hoàn tác Án"
                message={`Bạn có chắc muốn chuyển "${undoRecord?.so_ban_an}" về trạng thái "Đang thi hành"? Kết quả cuối cùng sẽ bị xóa.`}
                confirmLabel="Hoàn tác"
                variant="warning"
                loading={undoLoading}
                onConfirm={handleUndo}
                onCancel={() => setUndoRecord(null)}
            />
        </div>
    )
}
