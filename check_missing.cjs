const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function checkMissing() {
  const files = fs.readdirSync('public/productos').map(f => f.toLowerCase());
  const { data: productos, error } = await supabase.from('productos').select('*');
  
  const mapped = productos.filter(p => p.imagen);
  const unmapped = productos.filter(p => !p.imagen);
  
  const usedFiles = mapped.map(p => p.imagen.replace('/productos/', '').toLowerCase());
  const unusedFiles = files.filter(f => !usedFiles.includes(f));
  
  console.log(`Unmapped products (${unmapped.length}):`);
  unmapped.forEach(p => console.log('  - ' + p.nombre));
  
  console.log(`\nUnused images (${unusedFiles.length}):`);
  unusedFiles.forEach(f => console.log('  - ' + f));
}

checkMissing();
