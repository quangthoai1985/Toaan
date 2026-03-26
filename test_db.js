import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.log('Missing env variables. Try loading .env.local')
  const fs = require('fs')
  const env = fs.readFileSync('.env.local', 'utf8')
  const lines = env.split('\n')
  for (const line of lines) {
    if (line.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) process.env.NEXT_PUBLIC_SUPABASE_URL = line.split('=')[1]
    if (line.startsWith('NEXT_PUBLIC_SUPABASE_ANON_KEY=')) process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = line.split('=')[1]
  }
}

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

async function test() {
  const { data, error } = await supabase.from('an_hanh_chinh').select('*').limit(1)
  console.log('Data:', data)
  console.log('Error:', error)
}
test()
