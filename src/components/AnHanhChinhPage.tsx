'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { AnHanhChinh, TienDoEntry, QuyetDinhEntry } from '@/lib/types'
import { cn, truncate, getSoBanAnText, formatQuyetDinh } from '@/lib/utils'
import { Search, Plus, Pencil, Eye, CheckCircle2, Undo2, Download, Loader2, Trash2, UploadCloud, ArrowRightCircle, Clock, PauseCircle, Calendar, Building2 } from 'lucide-react'
import { downloadExcelTemplate } from '@/lib/excelTemplate'
import { useToast } from './Toast'
import AddAnModal from './AddAnModal'
import CompleteAnModal from './CompleteAnModal'
import DetailModal from './DetailModal'
import ConfirmModal from './ConfirmModal'
import ImportExcelModal from './ImportExcelModal'

type TabKey = 'PENDING' | 'WATCHING' | 'COMPLETED'

interface StatusAction {
    targetStatus: TabKey
    label: string
    icon: React.ReactNode
    className: string
    confirmTitle: string
    confirmMessage: (soBanAn: string) => string
    successMessage: string
}

export default function AnHanhChinhPage() {
    const supabase = createClient()
    const toast = useToast()
    const [activeTab, setActiveTab] = useState<TabKey>('PENDING')
    const [data, setData] = useState<AnHanhChinh[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [pendingCount, setPendingCount] = useState(0)
    const [watchingCount, setWatchingCount] = useState(0)
    const [completedCount, setCompletedCount] = useState(0)

    const [selectedIds, setSelectedIds] = useState<string[]>([])
    const [showBulkDelete, setShowBulkDelete] = useState(false)
    const [bulkDeleteLoading, setBulkDeleteLoading] = useState(false)

    // Modal states
    const [showAddModal, setShowAddModal] = useState(false)
    const [showImportModal, setShowImportModal] = useState(false)
    const [completeRecord, setCompleteRecord] = useState<AnHanhChinh | null>(null)
    const [detailRecord, setDetailRecord] = useState<AnHanhChinh | null>(null)

    // Status change confirmation
    const [statusChangeRecord, setStatusChangeRecord] = useState<AnHanhChinh | null>(null)
    const [statusChangeTarget, setStatusChangeTarget] = useState<StatusAction | null>(null)
    const [statusChangeLoading, setStatusChangeLoading] = useState(false)

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
            setSelectedIds([])
        }

        // Fetch counts for all tabs
        const [pendingRes, watchingRes, completedRes] = await Promise.all([
            supabase.from('an_hanh_chinh').select('*', { count: 'exact', head: true }).eq('status', 'PENDING'),
            supabase.from('an_hanh_chinh').select('*', { count: 'exact', head: true }).eq('status', 'WATCHING'),
            supabase.from('an_hanh_chinh').select('*', { count: 'exact', head: true }).eq('status', 'COMPLETED'),
        ])
        setPendingCount(pendingRes.count ?? 0)
        setWatchingCount(watchingRes.count ?? 0)
        setCompletedCount(completedRes.count ?? 0)

        setLoading(false)
    }, [activeTab, search])

    useEffect(() => { fetchData() }, [fetchData])

    // Generic status change handler
    async function handleStatusChange() {
        if (!statusChangeRecord || !statusChangeTarget) return
        setStatusChangeLoading(true)

        const payload: Record<string, unknown> = {
            status: statusChangeTarget.targetStatus,
        }

        const { error } = await supabase
            .from('an_hanh_chinh')
            .update(payload)
            .eq('id', statusChangeRecord.id)

        setStatusChangeLoading(false)
        if (error) {
            toast.error(`Lỗi: ${error.message}`)
            return
        }
        toast.success(statusChangeTarget.successMessage)
        setStatusChangeRecord(null)
        setStatusChangeTarget(null)
        fetchData()
    }

    function openStatusChange(record: AnHanhChinh, action: StatusAction) {
        setStatusChangeRecord(record)
        setStatusChangeTarget(action)
    }

    async function handleBulkDelete() {
        if (selectedIds.length === 0) return
        setBulkDeleteLoading(true)
        const { error } = await supabase
            .from('an_hanh_chinh')
            .delete()
            .in('id', selectedIds)

        setBulkDeleteLoading(false)
        if (error) {
            toast.error(`Lỗi khi xóa: ${error.message}`)
            return
        }
        toast.success(`Đã xóa ${selectedIds.length} án thành công.`)
        setSelectedIds([])
        setShowBulkDelete(false)
        fetchData()
    }

    function getLatestUpdate(entries: TienDoEntry[]): string {
        if (!entries || entries.length === 0) return '—'
        const last = entries[0]
        return last.content || '—'
    }

    function getLatestDate(entries: TienDoEntry[]): string {
        if (!entries || entries.length === 0) return ''
        const last = entries[0]
        if (!last.date) return ''
        const m = last.date.match(/^(\d{4})-(\d{2})-(\d{2})/)
        if (m) return `${m[3]}/${m[2]}/${m[1]}`
        return last.date
    }

    function renderQuyetDinh(so_ban_an_str: string | null | undefined) {
        if (!so_ban_an_str) return <span className="text-slate-400 italic text-[13px]">Chưa cập nhật</span>
        
        let parsed: QuyetDinhEntry[] = []
        try {
            const p = JSON.parse(so_ban_an_str)
            if (Array.isArray(p)) parsed = p
            else parsed = [{ so_quyet_dinh: so_ban_an_str, ngay_ban_hanh: '', co_quan_ban_hanh: '' }]
        } catch {
            parsed = [{ so_quyet_dinh: so_ban_an_str, ngay_ban_hanh: '', co_quan_ban_hanh: '' }]
        }

        return (
            <div className="flex flex-col gap-1">
                {parsed.map((qd, idx) => {
                    const text = formatQuyetDinh(qd)
                    return (
                        <div key={qd.id || idx} className="text-[13px] font-semibold text-blue-700 bg-blue-50/50 px-2.5 py-1.5 rounded-lg border border-blue-100/50 leading-snug break-words">
                            • {text || '—'}
                        </div>
                    )
                })}
            </div>
        )
    }

    function renderKetQuaKetThuc(str: string | null | undefined) {
        if (!str) return <span className="text-slate-400 italic text-[13px]">—</span>
        let text = ''
        let qdList: QuyetDinhEntry[] = []
        try {
            const parsed = JSON.parse(str)
            if (Array.isArray(parsed)) {
                qdList = parsed
            } else if (typeof parsed === 'object' && parsed !== null) {
                text = parsed.text || ''
                qdList = parsed.quyet_dinh || []
            } else {
                text = str
            }
        } catch {
            text = str
        }
        
        const validQdList = qdList.filter(q => q.so_quyet_dinh?.trim() || q.ngay_ban_hanh?.trim())
        
        if (!text.trim() && validQdList.length === 0) {
            return <span className="text-slate-400 italic text-[13px]">—</span>
        }
        
        return (
            <div className="flex flex-col gap-1.5">
                {validQdList.map((qd, i) => (
                    <div key={i} className="flex flex-col items-start bg-emerald-50/50 px-2 py-1.5 rounded-md border border-emerald-100">
                        <span className="text-emerald-700 font-bold text-[12px]">{qd.so_quyet_dinh || '—'}</span>
                        {(qd.ngay_ban_hanh || qd.co_quan_ban_hanh) && (
                            <span className="text-[10px] text-emerald-600/70 font-medium">
                                {qd.ngay_ban_hanh && <>{new Date(qd.ngay_ban_hanh).toLocaleDateString('vi-VN')} • </>}
                                {qd.co_quan_ban_hanh || '—'}
                            </span>
                        )}
                    </div>
                ))}
                {text.trim() && (
                    <span className="text-[13px] text-slate-600 leading-snug">{text}</span>
                )}
            </div>
        )
    }



    const tabs: { key: TabKey; label: string; count: number; badgeActive: string; badgeInactive: string; indicator: string }[] = [
        {
            key: 'PENDING',
            label: 'ĐANG THI HÀNH',
            count: pendingCount,
            badgeActive: 'bg-amber-100/80 text-amber-700 ring-1 ring-amber-500/30',
            badgeInactive: 'bg-slate-100 text-slate-500 ring-1 ring-slate-200',
            indicator: 'bg-amber-500'
        },
        {
            key: 'COMPLETED',
            label: 'ĐÃ THI HÀNH',
            count: completedCount,
            badgeActive: 'bg-emerald-100/80 text-emerald-700 ring-1 ring-emerald-500/30',
            badgeInactive: 'bg-slate-100 text-slate-500 ring-1 ring-slate-200',
            indicator: 'bg-emerald-500'
        },
    ]

    return (
        <div className="p-4 sm:p-6 lg:p-8 flex flex-col flex-1 min-h-0 w-full h-full gap-5 mx-auto w-full">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Theo dõi Thi hành Án Hành Chính</h1>
                    <p className="text-slate-500 text-sm mt-1">Quản lý và cập nhật tiến độ thi hành các bản án hành chính</p>
                </div>
                <div className="flex gap-2.5 shrink-0">
                    {selectedIds.length > 0 && (
                        <button
                            onClick={() => setShowBulkDelete(true)}
                            className="flex items-center gap-1.5 px-4 py-2 text-sm bg-red-100 text-red-700 rounded-xl hover:bg-red-200 transition-all font-semibold shadow-sm active:scale-95"
                        >
                            <Trash2 className="w-4 h-4" /> Xóa đã chọn ({selectedIds.length})
                        </button>
                    )}
                    <button
                        onClick={downloadExcelTemplate}
                        className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-blue-50 text-blue-700 border border-blue-200/60 rounded-xl hover:bg-blue-100 hover:text-blue-800 transition-all shadow-sm active:scale-95"
                    >
                        <Download className="w-4 h-4" /> Tải file Excel mẫu
                    </button>
                    <button
                        onClick={() => setShowImportModal(true)}
                        className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/60 rounded-xl hover:bg-emerald-100 transition-all shadow-sm active:scale-95"
                    >
                        <UploadCloud className="w-4 h-4" /> Import Excel
                    </button>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="flex items-center gap-1.5 px-4 py-2 text-sm bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl hover:from-red-700 hover:to-red-800 transition-all font-semibold shadow-[0_2px_10px_rgba(220,38,38,0.3)] hover:shadow-[0_4px_14px_rgba(220,38,38,0.4)] active:scale-95"
                    >
                        <Plus className="w-4 h-4" /> Thêm mới Án
                    </button>
                </div>
            </div>

            {/* Smart Toolbar */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-end border-b border-slate-200/80 pb-0">
                {/* Tabs */}
                <div className="flex gap-4 px-1">
                    {tabs.map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className={cn(
                                'relative pb-3.5 px-1 text-sm font-semibold transition-all flex items-center gap-2.5 group',
                                activeTab === tab.key ? 'text-slate-900' : 'text-slate-500 hover:text-slate-700'
                            )}
                        >
                            {tab.label}
                            <span className={cn(
                                'text-[11px] font-bold px-2 py-0.5 rounded-full min-w-[1.5rem] text-center tabular-nums transition-all shadow-sm',
                                activeTab === tab.key ? tab.badgeActive : tab.badgeInactive
                            )}>
                                {tab.count}
                            </span>
                            {/* Active Indicator Line */}
                            {activeTab === tab.key && (
                                <div className={cn('absolute -bottom-px left-0 right-0 h-[3px] rounded-t-full', tab.indicator)} />
                            )}
                        </button>
                    ))}
                </div>

                {/* Search Bar */}
                <div className="w-full sm:w-80 pb-3">
                    <div className="relative flex items-center bg-white rounded-xl shadow-sm border border-slate-200 focus-within:border-slate-300 focus-within:ring-4 focus-within:ring-slate-100 transition-all">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Tìm Số bản án, Tên..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 text-sm bg-transparent border-0 focus:ring-0 placeholder:text-slate-400 font-medium text-slate-700 outline-none rounded-xl"
                        />
                    </div>
                </div>
            </div>

            {/* Data Table */}
            <div className="flex-1 overflow-auto bg-white rounded-2xl shadow-sm border border-slate-200/60 flex flex-col min-h-0 relative">
                {loading ? (
                    <div className="flex flex-col items-center justify-center flex-1 h-full min-h-[300px]">
                        <Loader2 className="w-8 h-8 animate-spin text-red-600 mb-3" />
                        <span className="text-slate-500 text-sm font-medium">Đang tải dữ liệu...</span>
                    </div>
                ) : data.length === 0 ? (
                    <div className="flex flex-col items-center justify-center flex-1 h-full min-h-[300px] text-slate-400">
                        <div className="w-16 h-16 mb-4 rounded-full bg-slate-50 flex items-center justify-center">
                            <Search className="w-6 h-6 text-slate-300" />
                        </div>
                        <p className="text-sm font-medium text-slate-500">Không tìm thấy dữ liệu nào</p>
                        <p className="text-xs text-slate-400 mt-1">Thử thay đổi bộ lọc tìm kiếm hoặc thêm mới án</p>
                    </div>
                ) : (
                    <table className="w-full text-sm border-separate border-spacing-0">
                        <thead className="bg-red-950 sticky top-0 z-20 shadow-md">
                            <tr>
                                <th className="px-4 py-4 w-12 text-center border-b border-red-900/50">
                                    <input
                                        type="checkbox"
                                        className="w-4 h-4 rounded border-red-800 bg-red-900/20 text-red-500 focus:ring-red-500 cursor-pointer"
                                        checked={data.length > 0 && selectedIds.length === data.length}
                                        onChange={(e) => {
                                            if (e.target.checked) setSelectedIds(data.map(d => d.id))
                                            else setSelectedIds([])
                                        }}
                                        title="Chọn tất cả"
                                    />
                                </th>
                                <th className="px-5 py-4 text-[11px] font-bold text-red-100/80 uppercase tracking-widest w-[60px] whitespace-nowrap text-center border-b border-red-900/50">STT</th>
                                <th className="px-5 py-4 text-[11px] font-bold text-red-100/80 uppercase tracking-widest min-w-[180px] text-center border-b border-red-900/50">Người khởi kiện</th>
                                <th className="px-5 py-4 text-[11px] font-bold text-red-100/80 uppercase tracking-widest min-w-[200px] text-center border-b border-red-900/50">Số Bản án (Quyết Định phải Thi hành án)</th>
                                <th className="px-5 py-4 text-[11px] font-bold text-red-100/80 uppercase tracking-widest min-w-[180px] text-center border-b border-red-900/50">Người phải thi hành</th>
                                <th className="px-5 py-4 text-[11px] font-bold text-red-100/80 uppercase tracking-widest min-w-[200px] text-center border-b border-red-900/50">Nghĩa vụ phải Thi hành án</th>
                                <th className="px-5 py-4 text-[11px] font-bold text-red-100/80 uppercase tracking-widest min-w-[200px] text-center border-b border-red-900/50">QĐ buộc Thi hành án</th>
                                <th className="px-5 py-4 text-[11px] font-bold text-red-100/80 uppercase tracking-widest min-w-[240px] text-center border-b border-red-900/50">Quá trình Thi hành án</th>
                                {activeTab === 'PENDING' && (
                                    <th className="px-5 py-4 text-[11px] font-bold text-red-100/80 uppercase tracking-widest min-w-[200px] text-center border-b border-red-900/50">Chờ theo dõi</th>
                                )}
                                {activeTab === 'COMPLETED' && (
                                    <>
                                        <th className="px-5 py-4 text-[11px] font-bold text-red-100/80 uppercase tracking-widest min-w-[200px] text-center border-b border-red-900/50">Chờ theo dõi</th>
                                        <th className="px-5 py-4 text-[11px] font-bold text-red-100/80 uppercase tracking-widest min-w-[200px] text-center border-b border-red-900/50">Kết quả thi hành án</th>
                                    </>
                                )}
                            </tr>
                            {/* Horizontal Numbers Row */}
                            <tr className="bg-red-50/90 border-b border-red-100">
                                <th className="p-0 border-none h-8"></th>
                                {[1, 2, 3, 4, 5, 6, 7, ...(activeTab === 'PENDING' ? [8] : []), ...(activeTab === 'COMPLETED' ? [8, 9] : [])].map(num => (
                                    <th key={num} className="p-0 h-8 relative border-none border-l border-red-200/30 first:border-l-0">
                                        <div className="flex items-center justify-center w-5 h-5 mx-auto rounded-full bg-red-100 text-red-700 text-[10px] font-black shadow-sm ring-1 ring-red-200">
                                            {num}
                                        </div>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {data.map((row, idx) => (
                                <tr
                                    key={row.id}
                                    onClick={() => setDetailRecord(row)}
                                    className="hover:bg-sky-50/80 cursor-pointer transition-colors duration-200 group"
                                >
                                    <td className="px-4 py-3.5 text-center" onClick={e => e.stopPropagation()}>
                                        <input
                                            type="checkbox"
                                            className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                            checked={selectedIds.includes(row.id)}
                                            onChange={(e) => {
                                                if (e.target.checked) setSelectedIds(prev => [...prev, row.id])
                                                else setSelectedIds(prev => prev.filter(id => id !== row.id))
                                            }}
                                        />
                                    </td>
                                    <td className="px-5 py-3.5 text-slate-400 text-center font-mono text-xs font-medium">{idx + 1}</td>
                                    <td className="px-5 py-3.5 text-slate-800 font-semibold">
                                        {row.nguoi_khoi_kien
                                            ? row.nguoi_khoi_kien
                                                .split(/\r?\n/)
                                                .map(s => s.trim())
                                                .filter(Boolean)
                                                .map((name, i) => (
                                                    <div key={i} className={i > 0 ? 'mt-1 pt-1 border-t border-slate-100' : ''}>
                                                        {name}
                                                    </div>
                                                ))
                                            : '—'
                                        }
                                    </td>
                                    <td className="px-5 py-3.5 text-slate-600 font-medium">
                                        {renderQuyetDinh(row.so_ban_an)}
                                    </td>
                                    <td className="px-5 py-3.5 text-slate-600">{row.nguoi_phai_thi_hanh}</td>
                                    <td className="px-5 py-3.5 text-slate-600 text-[13px] leading-snug">
                                        {row.nghia_vu_thi_hanh ? truncate(row.nghia_vu_thi_hanh, 60) : '—'}
                                    </td>
                                    <td className="px-5 py-3.5 text-slate-600 text-[13px] leading-snug">
                                        {renderQuyetDinh(row.quyet_dinh_buoc_thi_hanh)}
                                    </td>
                                    <td className="px-5 py-3.5">
                                        <div className="flex flex-col gap-1">
                                            <p className="text-slate-700 text-[13px] leading-snug">{truncate(getLatestUpdate(row.tien_do_cap_nhat), 65)}</p>
                                            {getLatestDate(row.tien_do_cap_nhat) && (
                                                <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1.5">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-slate-200" />
                                                    {getLatestDate(row.tien_do_cap_nhat)}
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    {activeTab === 'PENDING' && (
                                        <td className="px-5 py-3.5 text-slate-600 text-[13px] leading-snug">
                                            {row.ly_do_cho_theo_doi ? truncate(row.ly_do_cho_theo_doi, 100) : <span className="text-slate-400 italic">—</span>}
                                        </td>
                                    )}
                                    {activeTab === 'COMPLETED' && (
                                        <>
                                            <td className="px-5 py-3.5 text-slate-600 text-[13px] leading-snug">
                                                {row.ly_do_cho_theo_doi ? truncate(row.ly_do_cho_theo_doi, 100) : <span className="text-slate-400 italic">—</span>}
                                            </td>
                                            <td className="px-5 py-3.5 text-slate-600 text-[13px] leading-snug">
                                                {renderKetQuaKetThuc(row.ket_qua_cuoi_cung)}
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

            <AddAnModal
                open={showAddModal}
                onClose={() => setShowAddModal(false)}
                onSuccess={fetchData}
            />

            {/* Import from Excel */}
            <ImportExcelModal
                open={showImportModal}
                onClose={() => setShowImportModal(false)}
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
                onSuccess={fetchData}
            />

            {/* Status change confirm */}
            <ConfirmModal
                open={!!statusChangeRecord && !!statusChangeTarget}
                title={statusChangeTarget?.confirmTitle || ''}
                message={statusChangeTarget?.confirmMessage(getSoBanAnText(statusChangeRecord?.so_ban_an)) || ''}
                confirmLabel="Xác nhận"
                variant="warning"
                loading={statusChangeLoading}
                onConfirm={handleStatusChange}
                onCancel={() => { setStatusChangeRecord(null); setStatusChangeTarget(null) }}
            />

            {/* Bulk Delete confirm */}
            <ConfirmModal
                open={showBulkDelete}
                title="Xóa Án hàng loạt"
                message={`Bạn có chắc chắn muốn xóa ${selectedIds.length} án đã chọn? Hành động này không thể hoàn tác và mọi dữ liệu liên quan sẽ bị xóa vĩnh viễn.`}
                confirmLabel="Xóa dữ liệu"
                variant="danger"
                loading={bulkDeleteLoading}
                onConfirm={handleBulkDelete}
                onCancel={() => setShowBulkDelete(false)}
            />
        </div>
    )
}
