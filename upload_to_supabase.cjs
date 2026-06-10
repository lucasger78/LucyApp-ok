const { createClient } = require('@supabase/supabase-js');
const sqlite3 = require('sqlite3');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in .env file");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const dbPath = '../LucyApp/LucyApp/db.sqlite3';

const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
  if (err) {
    console.error("Error opening SQLite DB:", err.message);
    process.exit(1);
  }
});

db.all("SELECT nombre, categoria, precio, imagen FROM pedidos_producto", async (err, rows) => {
  if (err) {
    console.error("Error querying SQLite:", err.message);
    process.exit(1);
  }

  const productsToInsert = rows.map(row => {
    let imagen = row.imagen ? row.imagen : '';
    if (imagen && !imagen.startsWith('/')) {
      imagen = '/' + imagen;
    }
    return {
      nombre: row.nombre,
      categoria: row.categoria || 'Sin Categoría',
      precio: parseFloat(row.precio || 0),
      imagen: imagen
    };
  });

  console.log(`Found ${productsToInsert.length} products to import.`);

  try {
    const { data, error } = await supabase.from('productos').insert(productsToInsert);
    if (error) {
      console.error("Supabase insert error:", error);
    } else {
      console.log("SUCCESS! Imported all products directly to Supabase.");
    }
  } catch(e) {
    console.error("Exception:", e);
  }
});
