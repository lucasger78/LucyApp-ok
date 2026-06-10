import React, { useState, useEffect } from 'react'
import { Download, Trash2, CheckCircle, Clock } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useToast } from '../../context/ToastContext'
import * as XLSX from 'xlsx'

export default function Orders() {
  const [pedidos, setPedidos] = useState([])
  const [loading, setLoading] = useState(true)
  const addToast = useToast()

  useEffect(() => {
    fetchPedidos()
  }, [])

  const fetchPedidos = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('pedidos')
        .select(`
          *,
          clientes (nombre_completo),
          empleados (nombre),
          items_pedido (
            cantidad,
            subtotal,
            productos (nombre)
          )
        `)
        .order('fecha', { ascending: false })

      if (error) throw error
      setPedidos(data || [])
    } catch (err) {
      addToast('Error al cargar pedidos', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleToggleEstado = async (id, currentState) => {
    try {
      const { error } = await supabase
        .from('pedidos')
        .update({ completado: !currentState })
        .eq('id', id)
        
      if (error) throw error
      addToast(`Pedido marcado como ${!currentState ? 'Completado' : 'Pendiente'}`, 'success')
      fetchPedidos()
    } catch (err) {
      addToast('Error al actualizar estado', 'error')
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('¿Eliminar este pedido permanentemente?')) return
    try {
      const { error } = await supabase.from('pedidos').delete().eq('id', id)
      if (error) throw error
      addToast('Pedido eliminado', 'success')
      fetchPedidos()
    } catch (err) {
      addToast('Error al eliminar pedido', 'error')
    }
  }

  const handleExport = () => {
    const ws = XLSX.utils.json_to_sheet(pedidos.map(p => ({
      ID: p.id,
      Fecha: new Date(p.fecha).toLocaleString(),
      Cliente: p.clientes?.nombre_completo || 'N/A',
      Empleado: p.empleados?.nombre || 'N/A',
      Total: p.total,
      Seña: p.seña,
      A_Pagar: p.total_final,
      Estado: p.completado ? 'COMPRETADO' : 'PENDIENTE',
      Productos: p.items_pedido.map(i => `${i.cantidad}x ${i.productos?.nombre}`).join(' | ')
    })))
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Pedidos")
    XLSX.writeFile(wb, `LucyApp_Pedidos_${new Date().toISOString().split('T')[0]}.xlsx`)
  }

  return (
    <div className="fade-in">
      <div className="section-header">
        <h1 className="section-title">Gestión de Pedidos</h1>
        <div className="section-actions">
          <button className="btn btn-secondary" onClick={handleExport}>
            <Download size={16} /> Exportar Excel
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
                  <th>ID / Fecha</th>
                  <th>Cliente</th>
                  <th>Total</th>
                  <th>Seña</th>
                  <th>Saldo</th>
                  <th>Estado</th>
                  <th style={{ textAlign: 'center' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {pedidos.map(p => (
                  <tr key={p.id}>
                    <td>
                      <div>#{p.id}</div>
                      <div className="text-muted" style={{ fontSize: '0.75rem' }}>{new Date(p.fecha).toLocaleDateString()}</div>
                    </td>
                    <td>
                      <div className="font-bold">{p.clientes?.nombre_completo || 'Sin Cliente'}</div>
                      <div className="text-muted" style={{ fontSize: '0.75rem' }}>Atendido por: {p.empleados?.nombre}</div>
                    </td>
                    <td className="text-primary-color font-bold">${p.total.toFixed(2)}</td>
                    <td className="text-warning">-${p.seña.toFixed(2)}</td>
                    <td className="font-bold">${p.total_final.toFixed(2)}</td>
                    <td>
                      {p.completado ? (
                        <span className="badge badge-green flex-center gap-1" style={{ width: 'fit-content' }}>
                          <CheckCircle size={12} /> Completado
                        </span>
                      ) : (
                        <span className="badge badge-yellow flex-center gap-1" style={{ width: 'fit-content' }}>
                          <Clock size={12} /> Pendiente
                        </span>
                      )}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button 
                        className="btn-icon btn-ghost" 
                        title="Cambiar estado"
                        onClick={() => handleToggleEstado(p.id, p.completado)}
                      >
                        {p.completado ? <Clock size={16} className="text-warning" /> : <CheckCircle size={16} className="text-success" />}
                      </button>
                      <button className="btn-icon text-danger" onClick={() => handleDelete(p.id)}>
                        <Trash2 size={16}/>
                      </button>
                    </td>
                  </tr>
                ))}
                {pedidos.length === 0 && (
                  <tr><td colSpan="7" className="text-center text-muted py-4">Aún no hay pedidos registrados.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
