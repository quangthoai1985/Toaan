import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://lxpbhxfcvcdazvkwmwki.supabase.co'
// Using anon key from env or a known dummy token if we had one.
// Wait, we need the anon key to initialize client. Let's get it from .env.local
import fs from 'fs'
const envFile = fs.readFileSync('.env.local', 'utf8')
const anonKey = envFile.split('\n').find(line => line.startsWith('NEXT_PUBLIC_SUPABASE_ANON_KEY=')).split('=')[1].trim()

const supabase = createClient(supabaseUrl, anonKey)

async function testQuery() {
    console.log('Testing AddAnModal query equivalents...')

    // 1. Test Select to see if the JOIN works
    const { data, error } = await supabase.from('an_hanh_chinh')
        .select('id, so_ban_an, created_by, creator:user_profiles(id, display_name, role)')
        .limit(1)

    if (error) {
        console.error('SELECT Error:', error)
    } else {
        console.log('SELECT Success:', data)
    }
}

testQuery()
