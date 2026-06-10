import React from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle, Home } from 'lucide-react'

export default function Success() {
  const navigate = useNavigate()

  return (
    <div className="success-page">
      <CheckCircle className="success-icon text-success" />
      <h1 className="success-title">¡Pedido Cargado!</h1>
      <p className="success-desc">
        El pedido ha sido guardado exitosamente en el sistema y ya de despachó para su preparación.
      </p>
      
      <button 
        className="btn btn-primary btn-lg mt-3"
        onClick={() => navigate('/')}
      >
        <Home size={20} /> Volver al Catálogo
      </button>
    </div>
  )
}
