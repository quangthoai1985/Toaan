const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDb() {
  const { data, error } = await supabase
    .from('an_hanh_chinh')
    .select('nguoi_phai_thi_hanh');
    
  if (error) {
    console.error("Error fetching data:", error);
    return;
  }
  
  const unique = new Set();
  data.forEach(row => {
    if (row.nguoi_phai_thi_hanh) unique.add(row.nguoi_phai_thi_hanh);
  });
  
  console.log("Unique nguoi_phai_thi_hanh:");
  console.log(Array.from(unique));
  
  const { data: dmData } = await supabase.from('dm_co_quan').select('*');
  console.log("dm_co_quan count:", dmData?.length);
  const dmNames = dmData ? dmData.map(d => d.ten_co_quan) : [];
  fs.writeFileSync('dm_co_quan_names.json', JSON.stringify(dmNames, null, 2));
}

checkDb();
