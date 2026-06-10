import React, { useState, useEffect } from 'react'
import { Plus, Download, Upload, Edit, Trash2, X, Check } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useToast } from '../../context/ToastContext'
import * as XLSX from 'xlsx'

export default function Employees() {
  const [empleados, setEmpleados] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState({})
  const addToast = useToast()

  useEffect(() => {
    fetchEmpleados()
  }, [])

  const fetchEmpleados = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase.from('empleados').select('*').order('id', { ascending: false })
      if (error) throw error
      setEmpleados(data || [])
    } catch (err) {
      addToast('Error al cargar empleados', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (e) => {
    setEditingId(e.id)
    setEditForm(e)
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditForm({})
  }

  const handleSaveEdit = async () => {
    if (!editForm.nombre) {
      addToast('El nombre es requerido', 'error')
      return
    }
    try {
      if (editingId === 'new') {
        const { error } = await supabase.from('empleados').insert([{
          nombre: editForm.nombre,
          activo: editForm.activo !== undefined ? editForm.activo : true
        }])
        if (error) throw error
        addToast('Empleado creado', 'success')
      } else {
        const { error } = await supabase.from('empleados').update({
          nombre: editForm.nombre,
          activo: editForm.activo
        }).eq('id', editingId)
        if (error) throw error
        addToast('Empleado actualizado', 'success')
      }
      setEditingId(null)
      fetchEmpleados()
    } catch (err) {
      addToast('Error al guardar', 'error')
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('¿Seguro que querés eliminar? Es mejor desactivarlo si tiene pedidos previos.')) return
    try {
      const { error } = await supabase.from('empleados').delete().eq('id', id)
      if (error) throw error
      addToast('Empleado eliminado', 'success')
      fetchEmpleados()
    } catch (err) {
      addToast('Error al eliminar (puede tener pedidos vinculados)', 'error')
    }
  }

  const handleExport = () => {
    const ws = XLSX.utils.json_to_sheet(empleados.map(e => ({
      ID: e.id,
      Nombre: e.nombre,
      Activo: e.activo ? 'SI' : 'NO'
    })))
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Empleados")
    XLSX.writeFile(wb, `LucyApp_Empleados_${new Date().toISOString().split('T')[0]}.xlsx`)
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
          nombre: row.Nombre || row.nombre || '',
          activo: row.Activo ? (row.Activo.toString().toUpperCase() === 'SI' || row.Activo === true) : true
        })).filter(r => r.nombre)

        if (inserts.length === 0) {
          addToast('No se encontraron empleados válidos', 'warning')
          return
        }

        const { error } = await supabase.from('empleados').insert(inserts)
        if (error) throw error
        
        addToast(`${inserts.length} empleados importados`, 'success')
        fetchEmpleados()
      } catch (err) {
        addToast('Error al importar', 'error')
      }
    }
    reader.readAsBinaryString(file)
  }

  return (
    <div className="fade-in">
      <div className="section-header">
        <h1 className="section-title">Gestión de Empleados</h1>
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
              setEditForm({ nombre: '', activo: true })
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
                  <th>Nombre</th>
                  <th>Estado</th>
                  <th style={{ textAlign: 'center' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {editingId === 'new' && (
                  <tr>
                    <td>Auto</td>
                    <td><input className="editable-input" style={{ border: '1px solid var(--border-color)' }} value={editForm.nombre} onChange={e => setEditForm({...editForm, nombre: e.target.value})} placeholder="Ej. Ana L."/></td>
                    <td>
                      <select className="editable-input" style={{ border: '1px solid var(--border-color)', background: 'var(--brand-dark)' }} value={editForm.activo} onChange={e => setEditForm({...editForm, activo: e.target.value === 'true'})}>
                        <option value="true">Activo</option>
                        <option value="false">Inactivo</option>
                      </select>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button className="btn-icon text-success" onClick={handleSaveEdit}><Check size={18}/></button>
                      <button className="btn-icon text-danger" onClick={handleCancelEdit}><X size={18}/></button>
                    </td>
                  </tr>
                )}
                {empleados.map(e => (
                  <tr key={e.id}>
                    <td>{e.id}</td>
                    <td>
                      {editingId === e.id 
                        ? <input className="editable-input" value={editForm.nombre} onChange={ev => setEditForm({...editForm, nombre: ev.target.value})} />
                        : e.nombre}
                    </td>
                    <td>
                      {editingId === e.id 
                        ? (
                          <select className="editable-input" style={{ background: 'var(--brand-dark)' }} value={editForm.activo} onChange={ev => setEditForm({...editForm, activo: ev.target.value === 'true'})}>
                            <option value="true">Activo</option>
                            <option value="false">Inactivo</option>
                          </select>
                        )
                        : (e.activo ? <span className="badge badge-green">Activo</span> : <span className="badge badge-red">Inactivo</span>)}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {editingId === e.id ? (
                        <>
                          <button className="btn-icon text-success" onClick={handleSaveEdit}><Check size={18}/></button>
                          <button className="btn-icon text-danger" onClick={handleCancelEdit}><X size={18}/></button>
                        </>
                      ) : (
                        <>
                          <button className="btn-icon btn-ghost" onClick={() => handleEdit(e)}><Edit size={16}/></button>
                          <button className="btn-icon text-danger" onClick={() => handleDelete(e.id)}><Trash2 size={16}/></button>
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
