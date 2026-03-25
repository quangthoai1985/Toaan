import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { mapDVHC } from '../src/lib/utils'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

async function main() {
    const isDryRun = process.argv.includes('--dry-run')
    
    console.log(`Starting DVHC update script${isDryRun ? " (DRY RUN)" : ""}...`)

    // FETCH 1: all an_hanh_chinh records
    const { data: records, error } = await supabase.from('an_hanh_chinh').select('id, nguoi_phai_thi_hanh')
    if (error) {
        console.error("Error fetching records:", error)
        return
    }
    
    console.log(`Found ${records.length} records in an_hanh_chinh.`)
    
    let updatedCount = 0
    let newDmCoQuan = new Set<string>()

    for (const record of records) {
        if (!record.nguoi_phai_thi_hanh) continue;
        const mapped = mapDVHC(record.nguoi_phai_thi_hanh)
        if (mapped !== record.nguoi_phai_thi_hanh) {
            console.log(`[ID: ${record.id}] CHANGE: "${record.nguoi_phai_thi_hanh}" -> "${mapped}"`)
            updatedCount++
            newDmCoQuan.add(mapped)
            
            if (!isDryRun) {
                await supabase.from('an_hanh_chinh').update({ nguoi_phai_thi_hanh: mapped }).eq('id', record.id)
            }
        }
    }
    
    console.log(`\nTotal updates needed / made: ${updatedCount}`)
    
    if (!isDryRun && newDmCoQuan.size > 0) {
        console.log(`\nChecking dm_co_quan for ${newDmCoQuan.size} new names...`)
        
        const { data: currentDm } = await supabase.from('dm_co_quan').select('ten')
        const existingNames = new Set(currentDm?.map(d => d.ten) || [])
        
        let insertedDmCount = 0
        for (const name of newDmCoQuan) {
            if (!existingNames.has(name)) {
                await supabase.from('dm_co_quan').insert({ ten: name })
                console.log(`+ INSERTED into dm_co_quan: "${name}"`)
                insertedDmCount++
            }
        }
        console.log(`Inserted ${insertedDmCount} new names to dm_co_quan.`)
    }
    
    if (isDryRun) {
        console.log("\n(DRY RUN COMPLETED - NO CHANGES MADE TO DB)")
    } else {
        console.log("\n(UPDATE COMPLETED)")
    }
}

main()
