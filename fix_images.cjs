const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

function normalize(str) {
  return str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '-').replace(/[^a-z0-9\-]/g, '');
}

async function fix() {
  const files = fs.readdirSync('public/productos');
  
  const { data: productos, error } = await supabase.from('productos').select('*');
  if (error) {
    console.error(error);
    return;
  }
  
  let updatedCount = 0;
  for (let prod of productos) {
    let bestMatch = '';
    const normName = normalize(prod.nombre);
    
    // Exact match normalized string
    let found = files.find(f => f.toLowerCase().replace('.jpg', '').replace('.jpeg', '').replace('.png', '') === normName);
    
    if (found) {
        bestMatch = `/productos/${found}`;
    } else {
        // Contains match
        found = files.find(f => f.toLowerCase().includes(normName) || normName.includes(f.toLowerCase().split('.')[0]));
        if (found) bestMatch = `/productos/${found}`;
    }
    
    if (bestMatch && prod.imagen !== bestMatch) {
      await supabase.from('productos').update({ imagen: bestMatch }).eq('id', prod.id);
      updatedCount++;
      console.log(`Matched ${prod.nombre} -> ${bestMatch}`);
    }
  }
  console.log(`Finished updating ${updatedCount} product images.`);
}

fix();
