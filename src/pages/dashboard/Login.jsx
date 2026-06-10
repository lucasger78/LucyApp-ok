import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Lock, User } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const { login } = useAuth()
  const navigate = useNavigate()
  const addToast = useToast()

  const handleSubmit = (e) => {
    e.preventDefault()
    if (login(username, password)) {
      addToast('Bienvenido al Dashboard', 'success')
      navigate('/dashboard')
    } else {
      addToast('Credenciales incorrectas', 'error')
    }
  }

  return (
    <div className="login-page">
      <div className="login-card fade-in">
        <div className="login-logo" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <img src="/logo-white.png" alt="Lucy Logo" style={{ height: '60px', marginBottom: '10px' }} />
          <div className="logo-sub">Panel de Administración</div>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group mb-3">
            <label className="form-label">Usuario</label>
            <div className="search-bar">
              <User size={18} />
              <input 
                type="text" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Ingresar usuario" 
                required 
              />
            </div>
          </div>
          <div className="form-group mb-4">
            <label className="form-label">Contraseña</label>
            <div className="search-bar">
              <Lock size={18} />
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••" 
                required 
              />
            </div>
          </div>
          <button type="submit" className="btn btn-primary w-full flex-center">
            Ingresar al Panel
          </button>
        </form>
        <div className="text-center mt-3">
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/')}>
            Volver a la tienda
          </button>
        </div>
      </div>
    </div>
  )
}
