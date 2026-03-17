'use client'

import { cn } from '@/lib/utils'
import { Scale } from 'lucide-react'

export default function Header() {
    return (
        <header className="bg-red-950 border-b border-red-800/50 sticky top-0 z-50 h-[4.5rem]">
            <div className="flex items-stretch h-full max-w-[100vw]">
                {/* Logo & Title */}
                <div className="flex items-center gap-3 px-5 shrink-0 h-full">
                    <div className="w-10 h-10 flex items-center justify-center shrink-0 rounded-lg bg-white/10 backdrop-blur-sm">
                        <Scale className="w-5 h-5 text-red-200" />
                    </div>
                    <div className="leading-tight">
                        <p className="font-bold text-white text-base tracking-wide">QUẢN LÝ ÁN HÀNH CHÍNH</p>
                        <p className="text-red-300/60 text-xs mt-0.5">Sở Tư pháp · An Giang</p>
                    </div>
                </div>

                {/* Spacer */}
                <div className="flex-1" />

                {/* Right side info */}
                <div className="flex items-center px-4 shrink-0 h-full">
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5">
                        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="text-red-200/70 text-xs font-medium">Hệ thống đang hoạt động</span>
                    </div>
                </div>
            </div>
        </header>
    )
}
