'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Scale, LayoutDashboard, Building2, BarChart3 } from 'lucide-react'

export default function Header() {
    const pathname = usePathname()
    
    return (
        <header className="bg-red-950 border-b border-red-900/40 sticky top-0 z-50 h-[4.5rem] shadow-sm">
            <div className="flex items-stretch h-full w-full">
                {/* Logo & Title */}
                <div className="flex items-center gap-3.5 px-6 shrink-0 h-full">
                    <div className="w-10 h-10 flex items-center justify-center shrink-0 rounded-xl bg-gradient-to-br from-red-400/20 to-red-600/20 backdrop-blur-md ring-1 ring-white/10 shadow-inner">
                        <Scale className="w-5 h-5 text-red-200" />
                    </div>
                    <div className="leading-tight flex flex-col justify-center">
                        <h1 className="font-bold text-white text-[15px] tracking-wide">QUẢN LÝ ÁN HÀNH CHÍNH</h1>
                        <p className="text-red-200/60 text-[11px] mt-0.5 uppercase tracking-wider font-medium">Sở Tư pháp · An Giang</p>
                    </div>
                </div>

                {/* Navigation Links */}
                <div className="flex items-center gap-1.5 ml-6 h-full">
                    <Link 
                        href="/tong-quan"
                        className={cn(
                            "flex items-center gap-2 px-4 h-full border-b-2 text-sm font-semibold transition-colors",
                            pathname.startsWith('/tong-quan')
                                ? "border-red-400 text-white bg-white/5" 
                                : "border-transparent text-red-100/60 hover:text-red-100 hover:bg-white/5"
                        )}
                    >
                        <BarChart3 className="w-4 h-4" />
                        Tổng Quan
                    </Link>
                    <Link 
                        href="/dashboard"
                        className={cn(
                            "flex items-center gap-2 px-4 h-full border-b-2 text-sm font-semibold transition-colors",
                            pathname.startsWith('/dashboard')
                                ? "border-red-400 text-white bg-white/5" 
                                : "border-transparent text-red-100/60 hover:text-red-100 hover:bg-white/5"
                        )}
                    >
                        <LayoutDashboard className="w-4 h-4" />
                        Quản lý Án
                    </Link>
                    <Link 
                        href="/co-quan"
                        className={cn(
                            "flex items-center gap-2 px-4 h-full border-b-2 text-sm font-semibold transition-colors",
                            pathname.startsWith('/co-quan')
                                ? "border-red-400 text-white bg-white/5" 
                                : "border-transparent text-red-100/60 hover:text-red-100 hover:bg-white/5"
                        )}
                    >
                        <Building2 className="w-4 h-4" />
                        Danh mục Cơ quan
                    </Link>
                </div>

                {/* Spacer */}
                <div className="flex-1" />

                {/* Right side info */}
                <div className="flex items-center px-6 shrink-0 h-full">
                    <div className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-black/20 ring-1 ring-white/5 shadow-inner backdrop-blur-sm">
                        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
                        <span className="text-red-100/80 text-xs font-medium tracking-wide">Hệ thống đang hoạt động</span>
                    </div>
                </div>
            </div>
        </header>
    )
}
