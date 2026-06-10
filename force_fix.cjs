const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

const mapping = {
  "Helado vegano de frutilla": "helado-vegano-frutilla.jpg",
  "Cheesecake": "cheescake.jpg",
  "Tarta de zanahoria": "tarta-zanahoria.jpg",
  "Medialuna de manteca": "medialuna_de_manteca.jpg",
  "Helado de limón": "helado-limon.jpg",
  "Alfajor de maicena": "alfajor-maicena.jpg",
  "Helado de dulce de leche": "helado-dulce-de-leche.jpg",
  "Muffin de arándano": "muffin-arándano.jpg",
  "Cookies de chocolate": "cokie-chocolate.jpg",
  "Helado de crema americana": "helado-crema-americana.jpg",
  "Torta de chocolate": "torta-chocolate.jpg",
  "Helado de menta granizada": "helado-menta-granizada.jpg",
  "Cupcake de vainilla": "cupcake-vainilla.jpg",
  "Pan saborizado con ajo": "pan-de-ajo.jpg",
  "Pan de salvado": "pan-salvado.jpg",
  "Helado de chocolate amargo": "helado-chocolate-amargo.jpg",
  "Helado de banana split": "helado-banana-ddl.jpg",
  "Medialuna de grasa": "criollos.jpg",
  "Helado de manzana verde": "helado-manzanas-verdes.jpg",
  "Helado de frutilla": "helado-frutilla.jpg",
  "Helado de maracuyá": "helado-maracuya.jpg",
  "Tarta de frutilla": "tarta-frutilla.jpg",
  "Helado de crema oreo": "helado-crema-oreo.jpg",
  "Helado de vainilla": "helado-vainilla.jpg",
  "Pan relleno de jamón y queso": "pan-relleno-jyq.jpg",
  "Helado de coco": "helado-coco.jpg",
  "Torta de manzana": "bizcocho-de-manzana-y-crema_62414859_1200x1200.jpg",
  "Pan con semillas": "pan-semillas.jpg",
  "Helado de frutos rojos": "helado-frutos-rojos.jpg"
};

async function forceFix() {
  const { data: productos, error } = await supabase.from('productos').select('*');
  if (error) {
    console.error(error);
    return;
  }
  
  let updatedCount = 0;
  for (let prod of productos) {
    const fileName = mapping[prod.nombre];
    if (fileName && prod.imagen !== `/productos/${fileName}`) {
      const { error: updErr } = await supabase.from('productos').update({ imagen: `/productos/${fileName}` }).eq('id', prod.id);
      if (!updErr) {
        console.log(`Forced ${prod.nombre} -> /productos/${fileName}`);
        updatedCount++;
      }
    }
  }
  console.log(`Force updated ${updatedCount} products manually.`);
}

forceFix();
