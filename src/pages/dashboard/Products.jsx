import React, { useState, useEffect } from 'react'
import { Plus, Download, Upload, Edit, Trash2, X, Check } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useToast } from '../../context/ToastContext'
import * as XLSX from 'xlsx'

export default function Products() {
  const [productos, setProductos] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState({})
  const addToast = useToast()

  useEffect(() => {
    fetchProductos()
  }, [])

  const fetchProductos = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase.from('productos').select('*').order('id', { ascending: false })
      if (error) throw error
      setProductos(data || [])
    } catch (err) {
      addToast('Error al cargar productos', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (prod) => {
    setEditingId(prod.id)
    setEditForm(prod)
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditForm({})
  }

  const handleSaveEdit = async () => {
    if (!editForm.nombre || !editForm.precio) {
      addToast('Nombre y Precio son requeridos', 'error')
      return
    }
    try {
      if (editingId === 'new') {
        const { error } = await supabase.from('productos').insert([{
          nombre: editForm.nombre,
          categoria: editForm.categoria || 'Sin Categoría',
          precio: parseFloat(editForm.precio),
          imagen: editForm.imagen || ''
        }])
        if (error) throw error
        addToast('Producto creado', 'success')
      } else {
        const { error } = await supabase.from('productos').update({
          nombre: editForm.nombre,
          categoria: editForm.categoria,
          precio: parseFloat(editForm.precio),
          imagen: editForm.imagen
        }).eq('id', editingId)
        if (error) throw error
        addToast('Producto actualizado', 'success')
      }
      setEditingId(null)
      fetchProductos()
    } catch (err) {
      addToast('Error al guardar', 'error')
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('¿Seguro que querés eliminar este producto?')) return
    try {
      const { error } = await supabase.from('productos').delete().eq('id', id)
      if (error) throw error
      addToast('Producto eliminado', 'success')
      fetchProductos()
    } catch (err) {
      addToast('Error al eliminar', 'error')
    }
  }

  const handleExport = () => {
    const ws = XLSX.utils.json_to_sheet(productos.map(p => ({
      ID: p.id,
      Nombre: p.nombre,
      Categoria: p.categoria,
      Precio: p.precio,
      ImagenURL: p.imagen || ''
    })))
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Productos")
    XLSX.writeFile(wb, `LucyApp_Productos_${new Date().toISOString().split('T')[0]}.xlsx`)
  }

  const handleImport = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);
        
        // Transform and filter
        const inserts = data.map(row => ({
          nombre: row.Nombre || row.nombre,
          categoria: row.Categoria || row.categoria || 'Sin Categoría',
          precio: parseFloat(row.Precio || row.precio || 0),
          imagen: row.ImagenURL || row.imagen || ''
        })).filter(r => r.nombre) // Only valid names

        if (inserts.length === 0) {
          addToast('No se encontraron productos válidos en el archivo', 'warning')
          return
        }

        const { error } = await supabase.from('productos').insert(inserts)
        if (error) throw error
        
        addToast(`${inserts.length} productos importados con éxito`, 'success')
        fetchProductos()
      } catch (err) {
        addToast('Error procesando archivo', 'error')
        console.error(err)
      }
    }
    reader.readAsBinaryString(file)
  }

  return (
    <div className="fade-in">
      <div className="section-header">
        <h1 className="section-title">Gestión de Productos</h1>
        <div className="section-actions">
          <label className="btn btn-secondary" style={{ cursor: 'pointer' }}>
            <Upload size={16} /> Importar Excel
            <input type="file" accept=".xlsx, .xls, .csv" hidden onChange={handleImport} />
          </label>
          <button className="btn btn-secondary" onClick={handleExport}>
            <Download size={16} /> Exportar
          </button>
          <button 
            className="btn btn-primary" 
            onClick={() => {
              setEditForm({ nombre: '', categoria: '', precio: '', imagen: '' })
              setEditingId('new')
            }}
          >
            <Plus size={16} /> Nuevo
          </button>
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div className="loading-center"><div className="spinner"></div></div>
        ) : (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Image</th>
                  <th>Nombre</th>
                  <th>Categoría</th>
                  <th>Precio</th>
                  <th style={{ textAlign: 'center' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {editingId === 'new' && (
                  <tr>
                    <td>Auto</td>
                    <td>-</td>
                    <td><input className="editable-input" style={{ border: '1px solid var(--border-color)' }} value={editForm.nombre} onChange={e => setEditForm({...editForm, nombre: e.target.value})} placeholder="Nombre" /></td>
                    <td><input className="editable-input" style={{ border: '1px solid var(--border-color)' }} value={editForm.categoria} onChange={e => setEditForm({...editForm, categoria: e.target.value})} placeholder="Categoría" /></td>
                    <td><input className="editable-input" type="number" style={{ border: '1px solid var(--border-color)' }} value={editForm.precio} onChange={e => setEditForm({...editForm, precio: e.target.value})} placeholder="Precio" /></td>
                    <td style={{ textAlign: 'center' }}>
                      <button className="btn-icon text-success" onClick={handleSaveEdit}><Check size={18}/></button>
                      <button className="btn-icon text-danger" onClick={handleCancelEdit}><X size={18}/></button>
                    </td>
                  </tr>
                )}
                {productos.map(p => (
                  <tr key={p.id}>
                    <td>{p.id}</td>
                    <td>
                      {p.imagen ? <img src={p.imagen} alt="img" style={{ width: 30, height: 30, objectFit: 'cover', borderRadius: 4 }}/> : 'N/A'}
                    </td>
                    <td>
                      {editingId === p.id 
                        ? <input className="editable-input" value={editForm.nombre} onChange={e => setEditForm({...editForm, nombre: e.target.value})} />
                        : p.nombre}
                    </td>
                    <td>
                      {editingId === p.id 
                        ? <input className="editable-input" value={editForm.categoria} onChange={e => setEditForm({...editForm, categoria: e.target.value})} />
                        : p.categoria}
                    </td>
                    <td>
                      {editingId === p.id 
                        ? <input className="editable-input" type="number" value={editForm.precio} onChange={e => setEditForm({...editForm, precio: e.target.value})} />
                        : `$${p.precio}`}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {editingId === p.id ? (
                        <>
                          <button className="btn-icon text-success" onClick={handleSaveEdit}><Check size={18}/></button>
                          <button className="btn-icon text-danger" onClick={handleCancelEdit}><X size={18}/></button>
                        </>
                      ) : (
                        <>
                          <button className="btn-icon btn-ghost" onClick={() => handleEdit(p)}><Edit size={16}/></button>
                          <button className="btn-icon text-danger" onClick={() => handleDelete(p.id)}><Trash2 size={16}/></button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
                {productos.length === 0 && editingId !== 'new' && (
                  <tr><td colSpan="6" className="text-center text-muted py-4">No hay productos. Creá uno o importá un Excel.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
