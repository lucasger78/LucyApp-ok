import React from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { LayoutDashboard, Package, Users, BadgeCheck, FileText, LogOut, Store } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

export default function DashboardLayout() {
  const { logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = () => {
    logout()
    navigate('/dashboard/login')
  }

  const navItems = [
    { path: '/dashboard', label: 'Resumen', icon: LayoutDashboard },
    { path: '/dashboard/productos', label: 'Productos', icon: Package },
    { path: '/dashboard/pedidos', label: 'Pedidos', icon: FileText },
    { path: '/dashboard/clientes', label: 'Clientes', icon: Users },
    { path: '/dashboard/empleados', label: 'Empleados', icon: BadgeCheck },
  ]

  return (
    <div className="dashboard-layout">
      {/* Sidebar */}
      <div className="sidebar">
        <div className="sidebar-logo" style={{ display: 'flex', flexDirection: 'column', padding: '1.5rem 0.75rem', gap: '0.5rem' }}>
          <img src="/logo-white.png" alt="Lucy Logo" style={{ height: '40px', objectFit: 'contain', objectPosition: 'left' }} />
          <p>Panel de Administración</p>
        </div>
        
        <div className="sidebar-section-title">Menú Principal</div>
        {navItems.map(item => {
          const Icon = item.icon
          const isActive = location.pathname === item.path
          return (
            <div 
              key={item.path}
              className={`sidebar-item ${isActive ? 'active' : ''}`}
              onClick={() => navigate(item.path)}
            >
              <Icon size={18} />
              {item.label}
            </div>
          )
        })}

        <div style={{ marginTop: 'auto', paddingTop: '1rem' }}>
          <div className="sidebar-item" onClick={() => navigate('/')} style={{ marginBottom: '0.25rem', color: 'var(--brand-primary)' }}>
            <Store size={18} />
            Ir a la Tienda
          </div>
          <div className="sidebar-item text-danger" onClick={handleLogout}>
            <LogOut size={18} />
            Cerrar Sesión
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="dashboard-content">
        <div className="dashboard-main">
          <Outlet />
        </div>
      </div>
    </div>
  )
}
