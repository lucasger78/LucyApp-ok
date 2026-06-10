const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function checkDuplicates() {
  const { data, error } = await supabase.from('productos').select('*').order('nombre');
  if (error) {
    console.error(error);
    return;
  }
  
  console.log(`Total rows in supabase: ${data.length}`);
  
  const counts = {};
  data.forEach(p => {
    const key = p.nombre.toLowerCase().trim();
    if (!counts[key]) counts[key] = [];
    counts[key].push(p);
  });
  
  const duplicated = Object.keys(counts).filter(k => counts[k].length > 1);
  console.log(`Unique product names: ${Object.keys(counts).length}`);
  console.log(`Names that appear more than once: ${duplicated.length}`);
}

checkDuplicates();
