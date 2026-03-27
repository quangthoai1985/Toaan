'use client'

import { useCallback, useEffect, useState } from 'react'
import { Scale, CheckCircle2, Clock, TrendingUp, Loader2, BarChart3, Building2 } from 'lucide-react'
import { useAuth } from './AuthProvider'
import {
    Chart as ChartJS,
    ArcElement,
    Tooltip,
    Legend,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
} from 'chart.js'
import { Doughnut, Bar } from 'react-chartjs-2'

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title)

interface StatsData {
    total: number
    pending: number
    watching: number
    completed: number
    localCreated: number
    localCreators: { name: string; count: number }[]
    byOrgan: { name: string; count: number }[]
    byStatus: { status: string; count: number }[]
}

export default function TongQuanPage() {
    const { user, loading: authLoading } = useAuth()
    const [stats, setStats] = useState<StatsData>({
        total: 0,
        pending: 0,
        watching: 0,
        completed: 0,
        localCreated: 0,
        localCreators: [],
        byOrgan: [],
        byStatus: [],
    })
    const [loading, setLoading] = useState(true)
    const [slowLoad, setSlowLoad] = useState(false)

    const fetchStats = useCallback(async () => {
        if (authLoading) return

        if (!user) {
            setLoading(false)
            return
        }

        setLoading(true)
        setSlowLoad(false)

        try {
            const controller = new AbortController()
            const timeout = setTimeout(() => controller.abort(), 15000)

            const response = await fetch('/api/dashboard/stats', {
                method: 'GET',
                credentials: 'same-origin',
                cache: 'no-store',
                signal: controller.signal,
                headers: {
                    'Cache-Control': 'no-store',
                },
            })

            clearTimeout(timeout)

            const payload = await response.json() as StatsData & { error?: string }

            if (!response.ok) {
                throw new Error(payload.error || `Không thể tải thống kê (${response.status})`)
            }

            if (payload.error) {
                throw new Error(payload.error)
            }

            setStats(payload)
        } catch (error) {
            console.error('Lỗi khi fetch thống kê:', error)
        } finally {
            setLoading(false)
        }
    }, [authLoading, user])

    useEffect(() => {
        void fetchStats()
    }, [fetchStats])

    // Nếu loading quá 5s, hiện nút thử lại
    useEffect(() => {
        if (!loading) {
            setSlowLoad(false)
            return
        }
        const timer = setTimeout(() => setSlowLoad(true), 5000)
        return () => clearTimeout(timer)
    }, [loading])

    const completionRate = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0

    const kpiCards = [
        {
            label: 'TỔNG SỐ ÁN',
            value: stats.total,
            icon: Scale,
            headerBg: 'bg-blue-600',
            iconColor: 'text-blue-600',
            valueColor: 'text-blue-600',
            sub2: null,
        },
        {
            label: 'ĐÃ THI HÀNH XONG',
            value: stats.completed,
            icon: CheckCircle2,
            headerBg: 'bg-emerald-600',
            iconColor: 'text-emerald-600',
            valueColor: 'text-emerald-600',
            sub: `${stats.completed}/${stats.total} hồ sơ`,
            sub2: null,
        },
        {
            label: 'ĐANG THI HÀNH',
            value: stats.pending,
            icon: Clock,
            headerBg: 'bg-orange-600',
            iconColor: 'text-orange-600',
            valueColor: 'text-orange-600',
            sub: `Chiếm ${stats.total > 0 ? Math.round((stats.pending / stats.total) * 100) : 0}% tổng số`,
            sub2: null,
        },
        {
            label: 'TIẾN ĐỘ HOÀN THÀNH',
            value: `${completionRate}%`,
            icon: TrendingUp,
            headerBg: 'bg-purple-600',
            iconColor: 'text-purple-600',
            valueColor: 'text-purple-600',
            sub: `${stats.completed}/${stats.total} hồ sơ đã hoàn thành`,
            sub2: null,
        },
    ]

    const doughnutData = {
        labels: ['Đang thi hành', 'Đã thi hành', 'Chờ theo dõi'],
        datasets: [
            {
                data: [stats.pending, stats.completed, stats.watching],
                backgroundColor: [
                    'rgba(249, 115, 22, 0.85)',
                    'rgba(16, 185, 129, 0.85)',
                    'rgba(139, 92, 246, 0.85)',
                ],
                borderColor: [
                    'rgba(249, 115, 22, 1)',
                    'rgba(16, 185, 129, 1)',
                    'rgba(139, 92, 246, 1)',
                ],
                borderWidth: 2,
                hoverOffset: 8,
            },
        ],
    }

    const doughnutOptions = {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '65%',
        plugins: {
            legend: {
                position: 'bottom' as const,
                labels: {
                    padding: 20,
                    usePointStyle: true,
                    pointStyleWidth: 12,
                    font: { size: 13, family: "'Be Vietnam Pro', sans-serif", weight: 600 as const },
                },
            },
            tooltip: {
                backgroundColor: 'rgba(15, 23, 42, 0.9)',
                titleFont: { size: 13, family: "'Be Vietnam Pro', sans-serif" },
                bodyFont: { size: 12, family: "'Be Vietnam Pro', sans-serif" },
                padding: 12,
                cornerRadius: 10,
                callbacks: {
                    label: function (ctx: any) {
                        const total = ctx.dataset.data.reduce((a: number, b: number) => a + b, 0)
                        const pct = total > 0 ? Math.round((ctx.raw / total) * 100) : 0
                        return ` ${ctx.label}: ${ctx.raw} (${pct}%)`
                    },
                },
            },
        },
    }

    const barData = {
        labels: stats.byOrgan.map((o) => o.name),
        datasets: [
            {
                label: 'Số án',
                data: stats.byOrgan.map((o) => o.count),
                backgroundColor: [
                    'rgba(59, 130, 246, 0.8)',
                    'rgba(249, 115, 22, 0.8)',
                    'rgba(16, 185, 129, 0.8)',
                    'rgba(139, 92, 246, 0.8)',
                    'rgba(236, 72, 153, 0.8)',
                    'rgba(245, 158, 11, 0.8)',
                    'rgba(6, 182, 212, 0.8)',
                    'rgba(244, 63, 94, 0.8)',
                ],
                borderRadius: 8,
                borderSkipped: false,
                barThickness: 36,
            },
        ],
    }

    const barOptions = {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: 'y' as const,
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: 'rgba(15, 23, 42, 0.9)',
                titleFont: { size: 13, family: "'Be Vietnam Pro', sans-serif" },
                bodyFont: { size: 12, family: "'Be Vietnam Pro', sans-serif" },
                padding: 12,
                cornerRadius: 10,
            },
        },
        scales: {
            x: {
                beginAtZero: true,
                grid: { color: 'rgba(148, 163, 184, 0.1)' },
                ticks: {
                    font: { size: 12, family: "'Be Vietnam Pro', sans-serif" },
                    color: '#64748b',
                },
            },
            y: {
                grid: { display: false },
                ticks: {
                    font: { size: 12, family: "'Be Vietnam Pro', sans-serif", weight: 600 as const },
                    color: '#334155',
                },
            },
        },
    }

    const statusBarData = {
        labels: ['Đang thi hành', 'Đã thi hành', 'Chờ theo dõi'],
        datasets: [
            {
                label: 'Số lượng án',
                data: [stats.pending, stats.completed, stats.watching],
                backgroundColor: [
                    'rgba(249, 115, 22, 0.85)',
                    'rgba(16, 185, 129, 0.85)',
                    'rgba(139, 92, 246, 0.85)',
                ],
                borderColor: [
                    'rgba(249, 115, 22, 1)',
                    'rgba(16, 185, 129, 1)',
                    'rgba(139, 92, 246, 1)',
                ],
                borderWidth: 2,
                borderRadius: 12,
                borderSkipped: false,
                barThickness: 56,
            },
        ],
    }

    const statusBarOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: 'rgba(15, 23, 42, 0.9)',
                titleFont: { size: 13, family: "'Be Vietnam Pro', sans-serif" },
                bodyFont: { size: 12, family: "'Be Vietnam Pro', sans-serif" },
                padding: 12,
                cornerRadius: 10,
                callbacks: {
                    label: function (ctx: any) {
                        const total = stats.total
                        const pct = total > 0 ? Math.round((ctx.raw / total) * 100) : 0
                        return ` ${ctx.raw} án (${pct}%)`
                    },
                },
            },
        },
        scales: {
            y: {
                beginAtZero: true,
                grid: { color: 'rgba(148, 163, 184, 0.1)' },
                ticks: {
                    font: { size: 12, family: "'Be Vietnam Pro', sans-serif" },
                    color: '#64748b',
                    stepSize: Math.ceil(stats.total / 5) || 1,
                },
            },
            x: {
                grid: { display: false },
                ticks: {
                    font: { size: 13, family: "'Be Vietnam Pro', sans-serif", weight: 600 as const },
                    color: '#334155',
                },
            },
        },
    }

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center flex-1 h-full min-h-[400px]">
                <Loader2 className="w-10 h-10 animate-spin text-red-600 mb-4" />
                <span className="text-slate-500 text-sm font-medium">Đang tải dữ liệu thống kê...</span>
                {slowLoad && (
                    <button
                        onClick={() => { window.location.reload() }}
                        className="mt-4 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"
                    >
                        Tải lại trang
                    </button>
                )}
            </div>
        )
    }

    return (
        <div className="p-4 sm:p-6 lg:p-8 flex flex-col flex-1 min-h-0 w-full h-full gap-6 overflow-auto">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center shadow-lg shadow-red-500/25">
                            <BarChart3 className="w-5 h-5 text-white" />
                        </div>
                        Tổng Quan Thống Kê
                    </h1>
                    <p className="text-slate-500 text-sm mt-1.5 ml-[46px]">
                        Báo cáo tổng hợp tình hình thi hành Án Hành Chính
                    </p>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl border border-slate-200/60 shadow-sm">
                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-xs font-medium text-slate-500">Cập nhật lần cuối: {new Date().toLocaleString('vi-VN')}</span>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {kpiCards.map((card) => {
                    const Icon = card.icon
                    return (
                        <div
                            key={card.label}
                            className="relative bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100 flex flex-col hover:shadow-lg transition-all duration-300 group min-h-[220px]"
                        >
                            <div className={`h-12 flex items-center px-5 ${card.headerBg}`}>
                                <span className="text-white text-[13px] font-bold uppercase tracking-wider">{card.label}</span>
                            </div>

                            <div className="absolute right-4 top-12 -translate-y-1/2 z-10">
                                <div className="w-11 h-11 rounded-full bg-white flex items-center justify-center shadow-md ring-4 ring-white transition-transform group-hover:scale-110">
                                    <Icon className={`w-5 h-5 ${card.iconColor}`} />
                                </div>
                            </div>

                            <div className="p-6 pt-8 flex-1 flex flex-col">
                                <div className={`text-[52px] font-black ${card.valueColor} tracking-tight leading-none mb-3`}>
                                    {card.value}
                                </div>

                                <div className="mt-auto pt-4 border-t border-slate-50 flex flex-col gap-0.5">
                                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">
                                        {card.sub}
                                    </span>
                                    {card.sub2 && (
                                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">
                                            {card.sub2}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>

            <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-5">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-emerald-500" />
                        Tiến Độ Hoàn Thành
                    </h3>
                    <span className="text-2xl font-extrabold text-emerald-600">{completionRate}%</span>
                </div>
                <div className="w-full h-4 bg-slate-100 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-emerald-400 via-emerald-500 to-teal-500 rounded-full transition-all duration-1000 ease-out relative"
                        style={{ width: `${completionRate}%` }}
                    >
                        <div className="absolute inset-0 bg-white/20 animate-pulse rounded-full" />
                    </div>
                </div>
                <div className="flex justify-between mt-2.5 text-xs text-slate-400 font-medium">
                    <span>{stats.completed}/{stats.total} án đã thi hành</span>
                    <span>Còn {stats.pending + stats.watching} án</span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                <div className="col-span-1 lg:col-span-4 bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden flex flex-col">
                    <div className="px-5 py-4 border-b border-slate-100 shrink-0">
                        <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-gradient-to-r from-orange-500 to-purple-500" />
                            Phân Bố Trạng Thái
                        </h3>
                    </div>
                    <div className="p-5 flex-1 min-h-[320px] max-h-[350px] flex items-center justify-center">
                        <Doughnut data={doughnutData} options={doughnutOptions} />
                    </div>
                </div>

                <div className="col-span-1 lg:col-span-4 bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden flex flex-col">
                    <div className="px-5 py-4 border-b border-slate-100 shrink-0">
                        <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500" />
                            So Sánh Trạng Thái Án
                        </h3>
                    </div>
                    <div className="p-5 flex-1 min-h-[320px] max-h-[350px]">
                        <Bar data={statusBarData} options={statusBarOptions} />
                    </div>
                </div>

                <div className="col-span-1 lg:col-span-4 bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden flex flex-col">
                    <div className="px-5 py-4 border-b border-slate-100 shrink-0 flex items-center justify-between">
                        <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-amber-500" />
                            Nguồn Án Mới
                        </h3>
                        <div className="px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200/60 rounded text-[10px] font-bold">
                            TỔNG: {stats.localCreated}
                        </div>
                    </div>
                    <div className="flex-1 overflow-auto bg-slate-50/30 max-h-[350px]">
                        {stats.localCreators.length > 0 ? (
                            <table className="w-full text-sm text-left border-collapse">
                                <thead className="bg-slate-100/80 sticky top-0 z-10 backdrop-blur-sm shadow-sm">
                                    <tr>
                                        <th className="px-4 py-3 font-semibold text-slate-500 text-xs">CƠ QUAN / ĐỊA PHƯƠNG</th>
                                        <th className="px-4 py-3 text-center font-semibold text-slate-500 text-xs">SỐ ÁN</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {stats.localCreators.map((c, i) => (
                                        <tr key={i} className="hover:bg-slate-50/80 transition-colors group">
                                            <td className="px-4 py-3 font-medium text-slate-700">{c.name}</td>
                                            <td className="px-4 py-3 text-center">
                                                <span className="inline-flex items-center justify-center min-w-[2rem] px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600 font-bold text-xs group-hover:bg-amber-100 group-hover:text-amber-700 transition-colors">
                                                    {c.count}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center py-8 px-4 text-center">
                                <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-3">
                                    <Building2 className="w-5 h-5 text-slate-300" />
                                </div>
                                <span className="text-slate-500 text-sm font-medium">Chưa có bản án nào được khởi tạo<br />bởi các tài khoản tuyến dưới.</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-100">
                    <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-blue-500" />
                        Thống Kê Theo Cơ Quan Phải Thi Hành
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">Top {stats.byOrgan.length} cơ quan có nhiều án nhất</p>
                </div>
                <div className="p-5" style={{ height: Math.max(300, stats.byOrgan.length * 50 + 40) }}>
                    <Bar data={barData} options={barOptions} />
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pb-2">
                <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-5 text-white shadow-lg">
                    <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">Chi Tiết Trạng Thái</h4>
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="flex items-center gap-2 text-sm">
                                <div className="w-3 h-3 rounded-full bg-orange-500" />
                                Đang thi hành
                            </span>
                            <span className="font-bold text-lg tabular-nums">{stats.pending}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="flex items-center gap-2 text-sm">
                                <div className="w-3 h-3 rounded-full bg-emerald-500" />
                                Đã thi hành
                            </span>
                            <span className="font-bold text-lg tabular-nums">{stats.completed}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="flex items-center gap-2 text-sm">
                                <div className="w-3 h-3 rounded-full bg-purple-500" />
                                Chờ theo dõi
                            </span>
                            <span className="font-bold text-lg tabular-nums">{stats.watching}</span>
                        </div>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-5 text-white shadow-lg shadow-emerald-500/20">
                    <h4 className="text-xs font-bold uppercase tracking-widest text-emerald-100/70 mb-3">Tỷ Lệ Hoàn Thành</h4>
                    <div className="text-5xl font-extrabold tabular-nums">{completionRate}%</div>
                    <p className="text-sm text-emerald-100/80 mt-2">
                        {stats.completed} / {stats.total} án đã hoàn thành
                    </p>
                    <div className="w-full h-2 bg-white/20 rounded-full mt-4 overflow-hidden">
                        <div
                            className="h-full bg-white rounded-full transition-all duration-1000"
                            style={{ width: `${completionRate}%` }}
                        />
                    </div>
                </div>

                <div className="bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl p-5 text-white shadow-lg shadow-orange-500/20">
                    <h4 className="text-xs font-bold uppercase tracking-widest text-orange-100/70 mb-3">Cần Xử Lý</h4>
                    <div className="text-5xl font-extrabold tabular-nums">{stats.pending + stats.watching}</div>
                    <p className="text-sm text-orange-100/80 mt-2">
                        {stats.pending} đang thi hành · {stats.watching} chờ theo dõi
                    </p>
                    <div className="flex items-center gap-1.5 mt-4 px-3 py-1.5 bg-white/15 rounded-lg w-fit text-xs font-semibold">
                        <Clock className="w-3.5 h-3.5" />
                        Cần theo dõi sát
                    </div>
                </div>
            </div>
        </div>
    )
}
