import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

const envFile = fs.readFileSync('.env.local', 'utf8')
const anonKey = envFile.split('\n').find(line => line.startsWith('NEXT_PUBLIC_SUPABASE_ANON_KEY=')).split('=')[1].trim()
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://lxpbhxfcvcdazvkwmwki.supabase.co'

const supabase = createClient(supabaseUrl, anonKey)

async function testInsert() {
    console.log('Testing JS Insert...')

    const payload = {
        so_ban_an: '[]',
        nguoi_khoi_kien: 'Test JS Insert',
        nguoi_phai_thi_hanh: 'UBND Đặc khu Phú Quốc',
        nghia_vu_thi_hanh: null,
        quyet_dinh_buoc_thi_hanh: null,
        status: 'PENDING',
        tien_do_cap_nhat: [{
            id: 'random-123',
            date: '2023-01-01',
            content: 'Test content'
        }],
        ket_qua_cuoi_cung: null,
        // using the valid user ID from the user_profiles table
        created_by: '4f77d362-9247-4dd4-b5d4-741a714dbe4b'
    }

    const { data, error } = await supabase.from('an_hanh_chinh').insert(payload).select()

    if (error) {
        console.error('INSERT Error:', error)
    } else {
        console.log('INSERT Success:', data)
        // Clean up
        if (data && data.length > 0) {
            await supabase.from('an_hanh_chinh').delete().eq('id', data[0].id)
        }
    }
}

testInsert()
