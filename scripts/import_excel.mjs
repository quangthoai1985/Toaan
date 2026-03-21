import xlsx from 'xlsx';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing SUPABASE env vars.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const main = async () => {
    const wb = xlsx.readFile('DVHC.xlsx');
    const sheet = wb.Sheets[wb.SheetNames[0]];
    const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });
    
    const capXa = [];
    for (const row of data) {
        if (!row || row.length < 4) continue;
        const fullName = row[3];
        if (typeof fullName === 'string' && /^(Xã|Phường|Thị trấn|Đặc khu)/i.test(fullName.trim())) {
            const name = fullName.trim();
            capXa.push({ ten_co_quan: `UBND ${name}`, cap_co_quan: 'Cấp xã' });
            capXa.push({ ten_co_quan: `Chủ tịch UBND ${name}`, cap_co_quan: 'Cấp xã' });
        }
    }
    
    console.log(`Found ${capXa.length / 2} units. Total ${capXa.length} records to insert.`);
    
    if (capXa.length > 0) {
        console.log("Deleting old Cấp xã data...");
        const { error: delErr } = await supabase.from('dm_co_quan').delete().eq('cap_co_quan', 'Cấp xã');
        if (delErr) {
            console.error("Delete error:", delErr);
            return;
        }
        
        console.log("Inserting new Cấp xã data...");
        for (let i = 0; i < capXa.length; i += 50) {
            const chunk = capXa.slice(i, i + 50);
            const { error: insErr } = await supabase.from('dm_co_quan').insert(chunk);
            if (insErr) {
                console.error('Insert error in chunk', i, insErr);
            }
        }
        console.log("Import success!");
    } else {
        console.log("No valid rows found to import.");
    }
};

main();
