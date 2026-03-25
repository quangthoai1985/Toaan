'use client'

import { useState, useRef, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { X, UploadCloud, Loader2, AlertCircle, FileSpreadsheet, CheckCircle2, FileDown, Eye, ChevronDown } from 'lucide-react'
import { useToast } from './Toast'
import * as xlsx from 'xlsx'
import { cn, parseQuyetDinhList, parseQTTienDo, mapDVHC } from '@/lib/utils'
import { AnHanhChinh, TienDoEntry } from '@/lib/types'

interface Props {
    open: boolean
    onClose: () => void
    onSuccess: () => void
}

export default function ImportExcelModal({ open, onClose, onSuccess }: Props) {
    const supabase = createClient()
    const toast = useToast()
    const fileInputRef = useRef<HTMLInputElement>(null)
    const workbookRef = useRef<xlsx.WorkBook | null>(null)
    
    const [file, setFile] = useState<File | null>(null)
    const [loading, setLoading] = useState(false)
    const [previewCount, setPreviewCount] = useState(0)
    const [parsedData, setParsedData] = useState<Partial<AnHanhChinh>[]>([])

    // New states for Sheet and Status selection
    const [sheetNames, setSheetNames] = useState<string[]>([])
    const [selectedSheet, setSelectedSheet] = useState<string>('')
    const [importStatus, setImportStatus] = useState<'PENDING' | 'COMPLETED'>('PENDING')


    // Tái xử lý dữ liệu khi Đổi Sheet hoặc Đổi Status
    useEffect(() => {
        if (!workbookRef.current || !selectedSheet) return

        try {
            const sheet = workbookRef.current.Sheets[selectedSheet]
            if (!sheet) return

            const rawData = xlsx.utils.sheet_to_json<any[]>(sheet, { header: 1 })
            const records: Partial<AnHanhChinh>[] = []
            
            for (let i = 0; i < rawData.length; i++) {
                const row = rawData[i]
                if (!row || row.length === 0) continue

                // Check if this is a header row by looking at content
                const sttString = String(row[0] || '').trim().toLowerCase();
                const col1String = String(row[1] || '').trim().toLowerCase();
                const col2String = String(row[2] || '').trim().toLowerCase();

                // Skip if it looks like a title or header row (use exact match to avoid skipping real data that contains the word "bản án")
                if (
                    sttString === 'stt' || 
                    sttString.includes('danh sách') ||
                    col1String === 'người khởi kiện' || 
                    col1String === 'bản án' ||
                    col1String === 'số bản án' ||
                    col2String === 'bản án' ||
                    col2String === 'số bản án' ||
                    col2String === 'bị đơn' ||
                    col2String === 'người bị kiện' ||
                    col2String === 'người phải thi hành' ||
                    col2String === 'người phải thi hành án' ||
                    col2String === 'người phải tha' ||
                    sttString === '2' || sttString === 'họ tên người khởi kiện. nhiều người: mỗi dòng 1 tên (alt+enter)' ||
                    col1String.includes('format:') || col1String.includes('nhiều qđ') || col1String.includes('họ tên') ||
                    col2String.includes('tên cơ quan') || col2String.includes('format') ||
                    String(row[6] || '').trim().toLowerCase().includes('mỗi mốc tiến độ')
                ) {
                    continue;
                }
                
                let nguoiKhoiKien = '';
                let soBanAn = '';
                let nguoiPhaiThiHanh = '';
                let nghiaVu = null;
                let quyetDinh = null;
                let ketQua = null;
                let tienDoList: TienDoEntry[] = [];

                if (importStatus === 'PENDING') {
                    nguoiKhoiKien = row[1]?.toString().trim() || '';
                    soBanAn = row[2]?.toString().trim() || '';
                    
                    if (!soBanAn && !nguoiKhoiKien) continue;

                    nguoiPhaiThiHanh = mapDVHC(row[3]?.toString().trim() || 'Chưa cập nhật');
                    nghiaVu = row[4]?.toString().trim() || null;
                    quyetDinh = row[5]?.toString().trim() || null;

                    const thihanhHistoryText = row[6]?.toString() || '';
                    tienDoList = parseQTTienDo(thihanhHistoryText);
                } else {
                    // COMPLETED Tab Logic
                    nguoiKhoiKien = row[1]?.toString().trim() || '';
                    soBanAn = row[2]?.toString().trim() || '';
                    
                    if (!soBanAn && !nguoiKhoiKien) continue;

                    nguoiPhaiThiHanh = mapDVHC(row[3]?.toString().trim() || 'Chưa cập nhật');
                    nghiaVu = row[4]?.toString().trim() || null;
                    quyetDinh = row[5]?.toString().trim() || null;
                    
                    const thihanhHistoryText = row[6]?.toString() || '';
                    tienDoList = parseQTTienDo(thihanhHistoryText);
                    
                    // Cột I (index 8) chứa thông tin Kết quả thi hành án
                    // Nếu nhập vào cột H (index 7) thì check ưu tiên cột I trước
                    ketQua = row[8]?.toString().trim() || row[7]?.toString().trim() || null;
                }

                const parsedQuyetDinh = soBanAn ? parseQuyetDinhList(soBanAn) : [{
                    id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(7),
                    so_quyet_dinh: 'Chưa cập nhật',
                    ngay_ban_hanh: '',
                    co_quan_ban_hanh: ''
                }]
                
                const parsedQuyetDinhBuoc = quyetDinh ? parseQuyetDinhList(quyetDinh) : []

                records.push({
                    so_ban_an: JSON.stringify(parsedQuyetDinh),
                    nguoi_khoi_kien: nguoiKhoiKien || 'Chưa cập nhật',
                    nguoi_phai_thi_hanh: nguoiPhaiThiHanh || 'Chưa cập nhật',
                    nghia_vu_thi_hanh: nghiaVu,
                    quyet_dinh_buoc_thi_hanh: parsedQuyetDinhBuoc.length > 0 ? JSON.stringify(parsedQuyetDinhBuoc) : null,
                    status: importStatus,
                    ket_qua_cuoi_cung: ketQua,
                    tien_do_cap_nhat: tienDoList,
                })
            }

            setParsedData(records)
            setPreviewCount(records.length)
        } catch(e) {
            console.error(e)
        }
    }, [selectedSheet, importStatus])

    async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0]
        if (!file) return

        setFile(file)
        setLoading(true)

        try {
            const buffer = await file.arrayBuffer()
            const workbook = xlsx.read(buffer, { type: 'buffer' })
            workbookRef.current = workbook

            const names = workbook.SheetNames
            setSheetNames(names)
            setSelectedSheet(names[0]) // Kích hoạt useEffect bên trên để xử lý logic parsing

            toast.success(`Đã đọc cấu trúc file Excel thành công!`)
        } catch (error: any) {
            toast.error(`Lỗi đọc file Excel: ${error.message}`)
            console.error(error)
        } finally {
            setLoading(false)
            if (fileInputRef.current) fileInputRef.current.value = ''
        }
    }

    async function handleImport() {
        if (parsedData.length === 0) {
            toast.error('Không có dữ liệu để import')
            return
        }

        setLoading(true)
        toast.success(`Bắt đầu import ${parsedData.length} dòng...`)

        const { error } = await supabase.from('an_hanh_chinh').insert(parsedData as any)

        setLoading(false)
        if (error) {
            toast.error(`Lỗi import: ${error.message}`)
            return
        }

        toast.success(`Đã import thành công ${parsedData.length} dòng dữ liệu vào thẻ ${importStatus === 'PENDING' ? 'Đang thi hành' : 'Đã thi hành'}!`)
        handleClose()
        onSuccess()
    }

    function handleClose() {
        setFile(null)
        setParsedData([])
        setPreviewCount(0)
        setSheetNames([])
        setSelectedSheet('')
        workbookRef.current = null
        onClose()
    }

    if (!open) return null

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={handleClose} />
            <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 fade-in duration-200 flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 sticky top-0 bg-white/80 backdrop-blur-md z-10 shrink-0">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                            <UploadCloud className="w-4 h-4 text-green-700" />
                        </div>
                        <h2 className="text-lg font-semibold text-slate-800">Import Dữ liệu từ Excel</h2>
                    </div>
                    <button onClick={handleClose} className="text-slate-400 hover:text-slate-600 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 space-y-5 overflow-y-auto min-h-0">
                    {/* Hướng dẫn */}
                    <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4 text-sm text-blue-900 leading-relaxed shadow-sm">
                        <div className="flex items-start gap-2 mb-2 font-semibold text-blue-800">
                            <AlertCircle className="w-5 h-5 shrink-0" />
                            <h3>Cấu trúc file Excel hỗ trợ:</h3>
                        </div>
                        <ul className="list-disc list-inside space-y-1.5 ml-1 opacity-90">
                            <li>Dữ liệu sẽ được <strong>tự động nhận diện dòng bắt đầu</strong> (bỏ qua các dòng tiêu đề).</li>
                            <li><strong>Cấu trúc chung:</strong> Cột B (Người khởi kiện) | Cột C (Số án) | Cột D (Bị kiện/Phải THA) | Cột E (Nội dung) | Cột F (QĐ buộc) | Cột G (Quá trình THA).</li>
                            <li><strong>Phần Đã thi hành:</strong> Có thể nhập Kết quả thi hành án ở Cột I hoặc Cột H.</li>
                            <li>Hệ thống <strong>tự động nhận diện mapping</strong> cột dựa vào cấu hình Trạng thái Import mà bạn chọn ở bên dưới.</li>
                        </ul>
                    </div>

                    {/* Setting Config Import */}
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="flex-1 space-y-1">
                            <label className="text-sm font-semibold text-slate-700">Trạng thái Import vào</label>
                            <div className="relative">
                                <select 
                                    value={importStatus}
                                    onChange={(e) => setImportStatus(e.target.value as any)}
                                    className="w-full appearance-none px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 font-medium focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none transition-all"
                                >
                                    <option value="PENDING">Đang thi hành (Chưa xong)</option>
                                    <option value="COMPLETED">Đã thi hành (Đã giải quyết)</option>
                                </select>
                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                            </div>
                        </div>
                        
                        {sheetNames.length > 0 && (
                            <div className="flex-1 space-y-1 animate-in fade-in zoom-in-95 duration-200">
                                <label className="text-sm font-semibold text-slate-700">Chọn Sheet dữ liệu</label>
                                <div className="relative">
                                    <select 
                                        value={selectedSheet}
                                        onChange={(e) => setSelectedSheet(e.target.value)}
                                        className="w-full appearance-none px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 font-medium focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none transition-all"
                                    >
                                        {sheetNames.map((name) => (
                                            <option key={name} value={name}>{name}</option>
                                        ))}
                                    </select>
                                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Khung tải file */}
                    {!file && (
                        <div 
                            className="border-2 border-dashed border-slate-200 rounded-xl p-8 hover:bg-slate-50 hover:border-green-400 transition-colors flex flex-col items-center justify-center gap-3 cursor-pointer group"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <input 
                                type="file" 
                                ref={fileInputRef} 
                                className="hidden" 
                                accept=".xlsx, .xls"
                                onChange={handleFileChange}
                            />
                            <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                                <FileSpreadsheet className="w-6 h-6 text-green-600" />
                            </div>
                            <div className="text-center">
                                <p className="text-sm font-medium text-slate-700">Nhấn để chọn file Excel (.xlsx, .xls)</p>
                                <p className="text-xs text-slate-400 mt-1">Kích thước tối đa 10MB</p>
                            </div>
                        </div>
                    )}

                    {/* Trạng thái file */}
                    {file && (
                        <div className="border border-green-200 bg-green-50/30 rounded-xl p-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-green-100 rounded-lg">
                                    <FileSpreadsheet className="w-5 h-5 text-green-700" />
                                </div>
                                <div className="overflow-hidden">
                                    <p className="text-sm font-semibold text-slate-800 truncate max-w-[200px] sm:max-w-[300px]">{file.name}</p>
                                    <p className="text-xs text-slate-500">{(file.size / 1024).toFixed(1)} KB</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => { setFile(null); setParsedData([]); setPreviewCount(0); setSheetNames([]); setSelectedSheet(''); workbookRef.current=null; }}
                                className="text-sm text-red-600 hover:text-red-800 font-medium px-2 py-1 shrink-0"
                            >
                                Đổi file khác
                            </button>
                        </div>
                    )}

                    {/* Preview kết quả */}
                    {parsedData.length > 0 && (
                        <div className="bg-white border text-sm border-slate-200 rounded-xl overflow-hidden shadow-sm animate-in fade-in duration-300">
                            <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-200 flex justify-between items-center">
                                <span className="font-semibold text-slate-700">Preview dữ liệu truy xuất</span>
                                <span className="bg-blue-100 text-blue-800 px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide">
                                    {previewCount} DÒNG HỢP LỆ
                                </span>
                            </div>
                            <div className="max-h-52 overflow-y-auto p-4 space-y-4 bg-slate-50/30">
                                {parsedData.slice(0, 3).map((row, idx) => (
                                    <div key={idx} className="pb-4 border-b border-slate-100 last:border-0 last:pb-0">
                                        <div className="grid grid-cols-[80px_1fr] gap-x-2 gap-y-1.5">
                                            <span className="font-semibold text-slate-600">Trạng thái:</span>
                                            <span className="font-medium text-emerald-700">{row.status === 'PENDING' ? 'Đang thi hành' : 'Đã thi hành'}</span>
                                            
                                            <span className="font-semibold text-slate-600">Số án:</span>
                                            <span className="text-slate-800 font-medium">{row.so_ban_an}</span>
                                            
                                            <span className="font-semibold text-slate-600">Bị đơn:</span>
                                            <span className="text-slate-800">{row.nguoi_phai_thi_hanh}</span>
                                            
                                            <span className="font-semibold text-slate-600">Lịch sử:</span>
                                            <span className="text-emerald-600 font-medium bg-emerald-50 px-2 py-0.5 rounded inline-flex w-fit">
                                                Bóc tách được {row.tien_do_cap_nhat?.length || 0} mốc tiến độ
                                            </span>
                                        </div>
                                    </div>
                                ))}
                                {parsedData.length > 3 && (
                                    <div className="text-center pt-2">
                                        <span className="text-slate-400 italic text-xs font-medium bg-white px-3 py-1 rounded-full border border-slate-100">
                                            ... và {parsedData.length - 3} dòng khác
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-2 px-6 py-4 border-t border-slate-100 bg-slate-50/80 backdrop-blur-md rounded-b-xl sticky bottom-0 z-10 shrink-0">
                    <button
                        type="button"
                        onClick={handleClose}
                        disabled={loading}
                        className="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-sm"
                    >
                        Đóng
                    </button>
                    <button
                        onClick={handleImport}
                        disabled={loading || parsedData.length === 0}
                        className="flex items-center gap-1.5 px-5 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_2px_10px_rgba(22,163,74,0.3)] hover:shadow-[0_4px_14px_rgba(22,163,74,0.4)]"
                    >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                        {loading ? 'Đang xử lý...' : `Xác nhận Import ${previewCount > 0 ? `(${previewCount})` : ''}`}
                    </button>
                </div>
            </div>
        </div>
    )
}
