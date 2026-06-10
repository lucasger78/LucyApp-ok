const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function fixDuplicates() {
  const { data, error } = await supabase.from('productos').select('*').order('id', { ascending: false });
  if (error) {
    console.error(error);
    return;
  }
  
  const grouped = {};
  data.forEach(p => {
    const key = p.nombre.toLowerCase().trim();
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(p);
  });
  
  let toDelete = [];
  
  for (const key in grouped) {
    const group = grouped[key];
    if (group.length > 1) {
      // Sort so that the one WITH an image is at the top (index 0)
      group.sort((a, b) => {
        if (a.imagen && !b.imagen) return -1;
        if (!a.imagen && b.imagen) return 1;
        return 0; // both have or both don't have
      });
      
      // keep the first one
      const keepId = group[0].id;
      
      // add the rest to delete array
      for (let i = 1; i < group.length; i++) {
        toDelete.push(group[i].id);
      }
    }
  }
  
  console.log(`Found ${toDelete.length} duplicates to delete.`);
  
  for (let id of toDelete) {
    const { error: delErr } = await supabase.from('productos').delete().eq('id', id);
    if (!delErr) {
        process.stdout.write('.');
    }
  }
  
  console.log('\nFinished deleting duplicates.');
}

fixDuplicates();
