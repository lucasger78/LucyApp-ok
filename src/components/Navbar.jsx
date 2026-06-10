import { useNavigate } from 'react-router-dom'
import { ShoppingCart, LayoutDashboard } from 'lucide-react'
import { useCart } from '../context/CartContext'

export default function Navbar() {
  const navigate = useNavigate()
  const { itemCount } = useCart()

  return (
    <nav className="navbar">
      <div className="navbar-logo" onClick={() => navigate('/')} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <img src="/logo-white.png" alt="Lucy Logo" style={{ height: '32px' }} />
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span>Cosas Ricas</span>
          <span style={{ fontSize: '0.6rem', marginTop: '-2px' }}>Sistema de Pedidos</span>
        </div>
      </div>
      <div className="navbar-actions">
        <button className="btn btn-ghost btn-sm" onClick={() => navigate('/dashboard/login')}>
          <LayoutDashboard size={16} />
          Dashboard
        </button>
        {itemCount > 0 && (
          <span className="badge badge-pink">
            🛒 {itemCount} {itemCount === 1 ? 'producto' : 'productos'}
          </span>
        )}
      </div>
    </nav>
  )
}
