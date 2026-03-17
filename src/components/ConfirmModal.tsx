'use client'

import { cn } from '@/lib/utils'
import { X, AlertTriangle } from 'lucide-react'

interface Props {
    open: boolean
    title: string
    message: string
    confirmLabel?: string
    cancelLabel?: string
    variant?: 'danger' | 'warning' | 'default'
    loading?: boolean
    onConfirm: () => void
    onCancel: () => void
}

export default function ConfirmModal({
    open, title, message, confirmLabel = 'Xác nhận', cancelLabel = 'Hủy',
    variant = 'default', loading = false, onConfirm, onCancel,
}: Props) {
    if (!open) return null

    const btnColor = {
        danger: 'bg-red-600 hover:bg-red-700 text-white',
        warning: 'bg-amber-500 hover:bg-amber-600 text-white',
        default: 'bg-blue-600 hover:bg-blue-700 text-white',
    }

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onCancel} />
            <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 animate-in zoom-in-95 fade-in duration-200">
                <div className="p-6">
                    <div className="flex items-start gap-3">
                        {variant !== 'default' && (
                            <div className={cn(
                                'w-10 h-10 rounded-full flex items-center justify-center shrink-0',
                                variant === 'danger' ? 'bg-red-100' : 'bg-amber-100'
                            )}>
                                <AlertTriangle className={cn(
                                    'w-5 h-5',
                                    variant === 'danger' ? 'text-red-600' : 'text-amber-600'
                                )} />
                            </div>
                        )}
                        <div className="flex-1">
                            <h3 className="text-lg font-semibold text-slate-800">{title}</h3>
                            <p className="text-sm text-slate-500 mt-1">{message}</p>
                        </div>
                        <button onClick={onCancel} className="text-slate-400 hover:text-slate-600 transition-colors">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>
                <div className="flex justify-end gap-2 px-6 pb-6">
                    <button
                        onClick={onCancel}
                        disabled={loading}
                        className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors disabled:opacity-50"
                    >
                        {cancelLabel}
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={loading}
                        className={cn('px-4 py-2 text-sm font-medium rounded-lg transition-colors disabled:opacity-50', btnColor[variant])}
                    >
                        {loading ? 'Đang xử lý...' : confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    )
}
