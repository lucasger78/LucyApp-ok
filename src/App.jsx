import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { CartProvider } from './context/CartContext'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ToastProvider } from './context/ToastContext'

// Public Pages
import Navbar from './components/Navbar'
import Catalog from './pages/Catalog'
import Checkout from './pages/Checkout'
import Preview from './pages/Preview'
import Success from './pages/Success'

// Dashboard Pages
import Login from './pages/dashboard/Login'
import DashboardLayout from './pages/dashboard/Layout'
import DashboardHome from './pages/dashboard/Home'
import Products from './pages/dashboard/Products'
import Clients from './pages/dashboard/Clients'
import Employees from './pages/dashboard/Employees'
import Orders from './pages/dashboard/Orders'

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuth()
  if (!isAuthenticated) return <Navigate to="/dashboard/login" />
  return children
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <CartProvider>
            <Routes>
              {/* Public Flow */}
              <Route path="/" element={<><Navbar /><Catalog /></>} />
              <Route path="/checkout" element={<><Navbar /><Checkout /></>} />
              <Route path="/preview" element={<><Navbar /><Preview /></>} />
              <Route path="/success" element={<><Navbar /><Success /></>} />

              {/* Dashboard Auth */}
              <Route path="/dashboard/login" element={<Login />} />

              {/* Dashboard Authenticated Routes */}
              <Route path="/dashboard" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
                <Route index element={<DashboardHome />} />
                <Route path="productos" element={<Products />} />
                <Route path="clientes" element={<Clients />} />
                <Route path="empleados" element={<Employees />} />
                <Route path="pedidos" element={<Orders />} />
              </Route>
            </Routes>
          </CartProvider>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
