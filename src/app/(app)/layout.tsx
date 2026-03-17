'use client'

import Header from '@/components/Header'
import { ToastProvider } from '@/components/Toast'

export default function AppLayout({ children }: { children: React.ReactNode }) {
    return (
        <ToastProvider>
            <div className="h-screen bg-slate-50 flex flex-col overflow-hidden">
                <Header />
                <main className="flex-1 overflow-hidden flex flex-col min-h-0">
                    {children}
                </main>
                <footer className="bg-red-950 border-t border-red-800/50 py-2 text-center shrink-0">
                    <p className="text-red-300/60 text-xs">
                        Sở Tư pháp tỉnh An Giang · Quản Lý Thi Hành Án Hành Chính · 2026
                    </p>
                </footer>
            </div>
        </ToastProvider>
    )
}
