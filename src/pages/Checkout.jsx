import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { User, Mail, Phone, MapPin, DollarSign, Users, ArrowLeft, ArrowRight } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useCart } from '../context/CartContext'
import { useToast } from '../context/ToastContext'
import Steps from '../components/Steps'

export default function Checkout() {
  const navigate = useNavigate()
  const addToast = useToast()
  const { items, total } = useCart()
  
  const [empleados, setEmpleados] = useState([])
  const [loading, setLoading] = useState(false)
  
  const [formData, setFormData] = useState({
    nombre_completo: '',
    email: '',
    telefono: '',
    direccion: '',
    empleado_id: '',
    empleado_nombre: '',
    seña: '0'
  })

  useEffect(() => {
    if (items.length === 0) {
      addToast('El resumen está vacío', 'warning')
      navigate('/')
    }
    fetchEmpleados()
  }, [])

  const fetchEmpleados = async () => {
    try {
      const { data, error } = await supabase
        .from('empleados')
        .select('*')
        .eq('activo', true)
        .order('nombre')
      
      if (error) throw error
      setEmpleados(data || [])
      // Do NOT auto-select — user must pick explicitly
    } catch (error) {
      console.error(error)
      addToast('Error al cargar empleados', 'error')
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    if (name === 'empleado_id') {
      const emp = empleados.find(e => e.id.toString() === value)
      setFormData(prev => ({ ...prev, empleado_id: value, empleado_nombre: emp ? emp.nombre : '' }))
    } else {
      setFormData(prev => ({ ...prev, [name]: value }))
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    
    if (!formData.nombre_completo || !formData.telefono || !formData.empleado_id) {
      addToast('Por favor completá los campos obligatorios', 'error')
      return
    }

    const señaVal = parseFloat(formData.seña) || 0
    if (señaVal > total) {
      addToast('La seña no puede ser mayor al total', 'error')
      return
    }

    // Save to session/local storage for the next step so we don't hit the DB yet
    sessionStorage.setItem('currentOrderClient', JSON.stringify(formData))
    
    navigate('/preview')
  }

  const totalFinal = Math.max(0, total - (parseFloat(formData.seña) || 0))

  return (
    <div className="page container" style={{ maxWidth: '800px' }}>
      <Steps current={2} />
      
      <div className="card fade-in">
        <h2 className="section-title mb-3 text-center">Datos del Cliente</h2>
        
        <form onSubmit={handleSubmit}>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Nombre Completo *</label>
              <div className="search-bar" style={{ padding: '0.4rem 0.8rem' }}>
                <User size={18} />
                <input 
                  required
                  type="text" 
                  name="nombre_completo"
                  value={formData.nombre_completo}
                  onChange={handleChange}
                  placeholder="Ej. María Gómez"
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Teléfono *</label>
              <div className="search-bar" style={{ padding: '0.4rem 0.8rem' }}>
                <Phone size={18} />
                <input 
                  required
                  type="tel" 
                  name="telefono"
                  value={formData.telefono}
                  onChange={handleChange}
                  placeholder="Ej. 11 1234-5678"
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Email (opcional)</label>
              <div className="search-bar" style={{ padding: '0.4rem 0.8rem' }}>
                <Mail size={18} />
                <input 
                  type="email" 
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="maria@ejemplo.com"
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Dirección (opcional)</label>
              <div className="search-bar" style={{ padding: '0.4rem 0.8rem' }}>
                <MapPin size={18} />
                <input 
                  type="text" 
                  name="direccion"
                  value={formData.direccion}
                  onChange={handleChange}
                  placeholder="Calle Falsa 123"
                />
              </div>
            </div>
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)', margin: '2rem 0' }} />

          <h3 className="mb-2">Detalles Internos</h3>
          
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                Atendido por
                <span style={{ color: 'var(--brand-primary)', fontWeight: 800 }}>*</span>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem', fontWeight: 400, textTransform: 'none' }}>(obligatorio)</span>
              </label>
              <select 
                className="form-select" 
                name="empleado_id" 
                value={formData.empleado_id} 
                onChange={handleChange}
                required
              >
                <option value="" disabled>— Elegí quién atendió —</option>
                {empleados.map(emp => (
                  <option key={emp.id} value={emp.id}>{emp.nombre}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Seña / Adelanto ($)</label>
              <div className="search-bar" style={{ padding: '0.4rem 0.8rem' }}>
                <DollarSign size={18} />
                <input 
                  type="number" 
                  min="0"
                  step="0.01"
                  name="seña"
                  value={formData.seña}
                  onChange={handleChange}
                  placeholder="0.00"
                />
              </div>
            </div>
          </div>

          <div className="mt-3 p-3" style={{ background: 'var(--surface-2)', borderRadius: 'var(--radius-md)' }}>
            <div className="flex-between mb-1">
              <span className="text-muted">Subtotal del Pedido:</span>
              <span className="font-bold">${total.toFixed(2)}</span>
            </div>
            <div className="flex-between mb-1">
              <span className="text-danger">Seña:</span>
              <span className="font-bold text-danger">-${(parseFloat(formData.seña) || 0).toFixed(2)}</span>
            </div>
            <div className="flex-between mt-2 pt-2" style={{ borderTop: '1px solid var(--border-color)' }}>
              <span className="font-heavy text-primary-color" style={{ fontSize: '1.2rem' }}>A Pagar al Retirar:</span>
              <span className="font-heavy text-primary-color" style={{ fontSize: '1.4rem' }}>${totalFinal.toFixed(2)}</span>
            </div>
          </div>

          <div className="flex-between mt-4">
            <button type="button" className="btn btn-ghost" onClick={() => navigate('/')}>
              <ArrowLeft size={18} /> Volver
            </button>
            <button type="submit" className="btn btn-primary">
              Previsualizar Pedido <ArrowRight size={18} />
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
