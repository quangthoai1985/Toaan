import fs from 'fs';
const url = 'https://lxpbhxfcvcdazvkwmwki.supabase.co/rest/v1/an_hanh_chinh?select=*&limit=1';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx4cGJoeGZjdmNkYXp2a3dtd2tpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM3NTkwMzMsImV4cCI6MjA4OTMzNTAzM30.Au6QXu5LQW95vY65m4BC9Rdqn3VOIjm6m8yXUDFAIu8';

async function run() {
  try {
    const res = await fetch(url, { headers: { 'apikey': key, 'Authorization': `Bearer ${key}` } });
    const data = await res.json();
    if (data && data.length > 0) {
       fs.writeFileSync('cols.txt', Object.keys(data[0]).join('\n'));
       console.log("Success writing to cols.txt");
    } else {
       console.log("No data");
    }
  } catch (err) {
    console.error(err);
  }
}
run();
