'use client'

import { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { X, CheckCircle2, AlertTriangle, Info } from 'lucide-react'

type ToastType = 'success' | 'error' | 'info'

interface Toast {
    id: number
    type: ToastType
    message: string
}

interface ToastContextType {
    success: (message: string) => void
    error: (message: string) => void
    info: (message: string) => void
}

const ToastContext = createContext<ToastContextType | null>(null)

export function useToast() {
    const ctx = useContext(ToastContext)
    if (!ctx) throw new Error('useToast must be used within ToastProvider')
    return ctx
}

let toastId = 0

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([])

    const addToast = useCallback((type: ToastType, message: string) => {
        const id = ++toastId
        setToasts(prev => [...prev, { id, type, message }])
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id))
        }, 4000)
    }, [])

    const remove = useCallback((id: number) => {
        setToasts(prev => prev.filter(t => t.id !== id))
    }, [])

    const value: ToastContextType = {
        success: (msg) => addToast('success', msg),
        error: (msg) => addToast('error', msg),
        info: (msg) => addToast('info', msg),
    }

    return (
        <ToastContext.Provider value={value}>
            {children}
            {/* Toast container */}
            <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
                {toasts.map(t => (
                    <div
                        key={t.id}
                        className={cn(
                            'pointer-events-auto flex items-center gap-2.5 px-4 py-3 rounded-lg shadow-lg border text-sm font-medium min-w-[280px] max-w-[420px] animate-in slide-in-from-right-5 fade-in duration-300',
                            t.type === 'success' && 'bg-green-50 border-green-200 text-green-800',
                            t.type === 'error' && 'bg-red-50 border-red-200 text-red-800',
                            t.type === 'info' && 'bg-blue-50 border-blue-200 text-blue-800',
                        )}
                    >
                        {t.type === 'success' && <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />}
                        {t.type === 'error' && <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />}
                        {t.type === 'info' && <Info className="w-4 h-4 text-blue-600 shrink-0" />}
                        <span className="flex-1">{t.message}</span>
                        <button
                            onClick={() => remove(t.id)}
                            className="shrink-0 hover:opacity-70 transition-opacity"
                        >
                            <X className="w-3.5 h-3.5" />
                        </button>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    )
}
