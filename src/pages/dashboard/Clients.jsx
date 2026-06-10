import React, { useState, useEffect } from 'react'
import { Plus, Download, Upload, Edit, Trash2, X, Check } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useToast } from '../../context/ToastContext'
import * as XLSX from 'xlsx'

export default function Clients() {
  const [clientes, setClientes] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState({})
  const addToast = useToast()

  useEffect(() => {
    fetchClientes()
  }, [])

  const fetchClientes = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase.from('clientes').select('*').order('id', { ascending: false })
      if (error) throw error
      setClientes(data || [])
    } catch (err) {
      addToast('Error al cargar clientes', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (c) => {
    setEditingId(c.id)
    setEditForm(c)
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditForm({})
  }

  const handleSaveEdit = async () => {
    if (!editForm.nombre_completo || !editForm.telefono) {
      addToast('Nombre y Teléfono son requeridos', 'error')
      return
    }
    try {
      if (editingId === 'new') {
        const { error } = await supabase.from('clientes').insert([{
          nombre_completo: editForm.nombre_completo,
          telefono: editForm.telefono,
          email: editForm.email || '',
          direccion: editForm.direccion || ''
        }])
        if (error) throw error
        addToast('Cliente creado', 'success')
      } else {
        const { error } = await supabase.from('clientes').update({
          nombre_completo: editForm.nombre_completo,
          telefono: editForm.telefono,
          email: editForm.email,
          direccion: editForm.direccion
        }).eq('id', editingId)
        if (error) throw error
        addToast('Cliente actualizado', 'success')
      }
      setEditingId(null)
      fetchClientes()
    } catch (err) {
      addToast('Error al guardar', 'error')
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('¿Seguro que querés eliminar este cliente? Se podrían afectar pedidos asociados.')) return
    try {
      const { error } = await supabase.from('clientes').delete().eq('id', id)
      if (error) throw error
      addToast('Cliente eliminado', 'success')
      fetchClientes()
    } catch (err) {
      addToast('Error al eliminar (puede tener pedidos vinculados)', 'error')
    }
  }

  const handleExport = () => {
    const ws = XLSX.utils.json_to_sheet(clientes.map(c => ({
      ID: c.id,
      Nombre: c.nombre_completo,
      Telefono: c.telefono,
      Email: c.email,
      Direccion: c.direccion,
      FechaRegistro: c.created_at
    })))
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Clientes")
    XLSX.writeFile(wb, `LucyApp_Clientes_${new Date().toISOString().split('T')[0]}.xlsx`)
  }

  const handleImport = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const data = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
        
        const inserts = data.map(row => ({
          nombre_completo: row.Nombre || row.nombre_completo || row.nombre,
          telefono: row.Telefono || row.telefono || '',
          email: row.Email || row.email || '',
          direccion: row.Direccion || row.direccion || ''
        })).filter(r => r.nombre_completo && r.telefono)

        if (inserts.length === 0) {
          addToast('No se encontraron clientes válidos (requieren Nombre y Telefono)', 'warning')
          return
        }

        const { error } = await supabase.from('clientes').insert(inserts)
        if (error) throw error
        
        addToast(`${inserts.length} clientes importados`, 'success')
        fetchClientes()
      } catch (err) {
        addToast('Error al importar', 'error')
      }
    }
    reader.readAsBinaryString(file)
  }

  return (
    <div className="fade-in">
      <div className="section-header">
        <h1 className="section-title">Gestión de Clientes</h1>
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
              setEditForm({ nombre_completo: '', telefono: '', email: '', direccion: '' })
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
                  <th>Nombre Completo</th>
                  <th>Teléfono</th>
                  <th>Email</th>
                  <th>Dirección</th>
                  <th style={{ textAlign: 'center' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {editingId === 'new' && (
                  <tr>
                    <td>Auto</td>
                    <td><input className="editable-input" style={{ border: '1px solid var(--border-color)' }} value={editForm.nombre_completo} onChange={e => setEditForm({...editForm, nombre_completo: e.target.value})} placeholder="Ej. Juan Pérez"/></td>
                    <td><input className="editable-input" style={{ border: '1px solid var(--border-color)' }} value={editForm.telefono} onChange={e => setEditForm({...editForm, telefono: e.target.value})} placeholder="Teléfono" /></td>
                    <td><input className="editable-input" style={{ border: '1px solid var(--border-color)' }} value={editForm.email} onChange={e => setEditForm({...editForm, email: e.target.value})} placeholder="Email" /></td>
                    <td><input className="editable-input" style={{ border: '1px solid var(--border-color)' }} value={editForm.direccion} onChange={e => setEditForm({...editForm, direccion: e.target.value})} placeholder="Dirección" /></td>
                    <td style={{ textAlign: 'center' }}>
                      <button className="btn-icon text-success" onClick={handleSaveEdit}><Check size={18}/></button>
                      <button className="btn-icon text-danger" onClick={handleCancelEdit}><X size={18}/></button>
                    </td>
                  </tr>
                )}
                {clientes.map(c => (
                  <tr key={c.id}>
                    <td>{c.id}</td>
                    <td>
                      {editingId === c.id 
                        ? <input className="editable-input" value={editForm.nombre_completo} onChange={e => setEditForm({...editForm, nombre_completo: e.target.value})} />
                        : c.nombre_completo}
                    </td>
                    <td>
                      {editingId === c.id 
                        ? <input className="editable-input" value={editForm.telefono} onChange={e => setEditForm({...editForm, telefono: e.target.value})} />
                        : c.telefono}
                    </td>
                    <td>
                      {editingId === c.id 
                        ? <input className="editable-input" value={editForm.email} onChange={e => setEditForm({...editForm, email: e.target.value})} />
                        : c.email}
                    </td>
                    <td>
                      {editingId === c.id 
                        ? <input className="editable-input" value={editForm.direccion} onChange={e => setEditForm({...editForm, direccion: e.target.value})} />
                        : c.direccion}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {editingId === c.id ? (
                        <>
                          <button className="btn-icon text-success" onClick={handleSaveEdit}><Check size={18}/></button>
                          <button className="btn-icon text-danger" onClick={handleCancelEdit}><X size={18}/></button>
                        </>
                      ) : (
                        <>
                          <button className="btn-icon btn-ghost" onClick={() => handleEdit(c)}><Edit size={16}/></button>
                          <button className="btn-icon text-danger" onClick={() => handleDelete(c.id)}><Trash2 size={16}/></button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
