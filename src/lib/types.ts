export interface AnHanhChinh {
    id: string
    so_ban_an: string
    nguoi_khoi_kien: string
    nguoi_phai_thi_hanh: string
    nghia_vu_thi_hanh: string | null
    status: 'PENDING' | 'COMPLETED'
    ket_qua_cuoi_cung: string | null
    tien_do_cap_nhat: TienDoEntry[]
    created_at: string
    updated_at: string
}

export interface TienDoEntry {
    id: string
    date: string
    content: string
    attachments?: string[]
}
