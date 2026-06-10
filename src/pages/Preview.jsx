import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle, Printer, Download, ArrowLeft } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useCart } from '../context/CartContext'
import { useToast } from '../context/ToastContext'
import Steps from '../components/Steps'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

export default function Preview() {
  const navigate = useNavigate()
  const addToast = useToast()
  const { items, total, clearCart } = useCart()
  const [clientData, setClientData] = useState(null)
  const [loading, setLoading] = useState(false)
  const printRef = useRef(null)

  useEffect(() => {
    const data = sessionStorage.getItem('currentOrderClient')
    if (!data || items.length === 0) {
      navigate('/')
      return
    }
    setClientData(JSON.parse(data))
  }, [])

  if (!clientData) return null

  const seña = parseFloat(clientData.seña) || 0
  const totalFinal = Math.max(0, total - seña)

  const handleCreateOrder = async () => {
    try {
      setLoading(true)

      // 1. Create or update client (by phone ideally, but we'll insert new for simplicity as per standard flow)
      // Actually let's check if client exists by phone
      let clientId = null
      const { data: existingClient } = await supabase
        .from('clientes')
        .select('id')
        .eq('telefono', clientData.telefono)
        .single()

      if (existingClient) {
        clientId = existingClient.id
        // Update other info just in case
        await supabase.from('clientes').update({
          nombre_completo: clientData.nombre_completo,
          email: clientData.email,
          direccion: clientData.direccion
        }).eq('id', clientId)
      } else {
        const { data: newClient, error: clientErr } = await supabase
          .from('clientes')
          .insert([{
            nombre_completo: clientData.nombre_completo,
            telefono: clientData.telefono,
            email: clientData.email,
            direccion: clientData.direccion
          }])
          .select()
          .single()
        
        if (clientErr) throw clientErr
        clientId = newClient.id
      }

      // 2. Create Order
      const { data: newOrder, error: orderErr } = await supabase
        .from('pedidos')
        .insert([{
          cliente_id: clientId,
          empleado_id: clientData.empleado_id,
          total: total,
          seña: seña,
          total_final: totalFinal,
          completado: false
        }])
        .select()
        .single()

      if (orderErr) throw orderErr

      // 3. Create Order Items
      const orderItems = items.map(item => ({
        pedido_id: newOrder.id,
        producto_id: item.producto.id,
        cantidad: item.cantidad,
        subtotal: item.producto.precio * item.cantidad
      }))

      const { error: itemsErr } = await supabase
        .from('items_pedido')
        .insert(orderItems)

      if (itemsErr) throw itemsErr

      // Clean up and go to success
      clearCart()
      sessionStorage.removeItem('currentOrderClient')
      navigate('/success')

    } catch (error) {
      console.error(error)
      addToast('Error al guardar el pedido. Intente nuevamente.', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  const handleDownloadPDF = async () => {
    if (!printRef.current) return
    try {
      const canvas = await html2canvas(printRef.current, { scale: 2 })
      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF('p', 'mm', 'a4')
      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight)
      pdf.save(`Pedido_${clientData.nombre_completo.replace(/\s+/g,'_')}.pdf`)
    } catch(err) {
      addToast('Error generando PDF', 'error')
    }
  }

  return (
    <div className="page container" style={{ maxWidth: '800px' }}>
      <div className="no-print">
        <Steps current={3} />
      </div>

      <div className="grid-2" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        {/* Preview Card */}
        <div className="card fade-in" ref={printRef}>
          <div className="order-preview">
            <div className="order-preview-header">
              <div className="order-preview-logo" style={{ display: 'flex', justifyContent: 'center' }}>
                <img src="/logo-white.png" alt="Lucy Logo" style={{ height: '40px' }} />
              </div>
              <p className="text-muted" style={{ fontSize: '0.85rem', marginTop: '0.5rem' }}>Comprobante de Pedido (Pre-visualización)</p>
            </div>

            <div className="order-preview-section">
              <h4 className="text-primary-color mb-1">Datos del Cliente</h4>
              <div className="order-preview-row"><span>Nombre:</span> <strong>{clientData.nombre_completo}</strong></div>
              <div className="order-preview-row"><span>Teléfono:</span> <strong>{clientData.telefono}</strong></div>
              {clientData.email && <div className="order-preview-row"><span>Email:</span> <strong>{clientData.email}</strong></div>}
              {clientData.direccion && <div className="order-preview-row"><span>Dirección:</span> <strong>{clientData.direccion}</strong></div>}
            </div>

            <div className="order-preview-section mt-2">
              <h4 className="text-primary-color mb-1">Detalle del Pedido</h4>
              <table className="table" style={{ fontSize: '0.8rem' }}>
                <thead>
                  <tr>
                    <th>Cant</th>
                    <th>Producto</th>
                    <th style={{ textAlign: 'right' }}>Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map(item => (
                    <tr key={item.producto.id}>
                      <td style={{ padding: '0.4rem 1rem' }}>{item.cantidad}</td>
                      <td style={{ padding: '0.4rem 1rem' }}>{item.producto.nombre}</td>
                      <td style={{ textAlign: 'right', padding: '0.4rem 1rem' }}>${(item.producto.precio * item.cantidad).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="order-preview-section mt-2">
              <div className="order-total-row"><span>Subtotal:</span> <span>${total.toFixed(2)}</span></div>
              <div className="order-senia-row"><span>Seña / Adelanto:</span> <span>-${seña.toFixed(2)}</span></div>
              <div className="order-final-row"><span>A Pagar al Retirar:</span> <span>${totalFinal.toFixed(2)}</span></div>
            </div>

            <div className="order-preview-header mt-3" style={{ borderTop: 'none', borderBottom: 'none', paddingTop: 0 }}>
              <p className="text-muted" style={{ fontSize: '0.85rem' }}>
                Atendido por: <strong>{clientData.empleado_nombre}</strong><br/>
                Fecha: {new Date().toLocaleDateString('es-AR')}
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="card fade-in no-print" style={{ background: 'var(--surface-2)' }}>
          <h3 className="section-title text-center mb-2">¿Todo listo?</h3>
          
          <div className="flex-center gap-2 mb-3">
            <button className="btn btn-secondary" onClick={handlePrint}>
              <Printer size={18} /> Imprimir Comprobante
            </button>
            <button className="btn btn-secondary" onClick={handleDownloadPDF}>
              <Download size={18} /> Guardar PDF
            </button>
          </div>

          <div className="flex-between" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
            <button className="btn btn-ghost" onClick={() => navigate('/checkout')} disabled={loading}>
              <ArrowLeft size={18} /> Editar Datos
            </button>
            <button className="btn btn-primary btn-lg" onClick={handleCreateOrder} disabled={loading}>
              {loading ? (
                <span>Guardando...</span>
              ) : (
                <>
                  <CheckCircle size={20} /> Guardar Pedido Definitivo
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
