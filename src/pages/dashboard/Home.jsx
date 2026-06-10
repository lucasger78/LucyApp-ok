import React, { useState, useEffect } from 'react'
import { TrendingUp, Users, Package, FileText } from 'lucide-react'
import { supabase } from '../../lib/supabase'

export default function Home() {
  const [stats, setStats] = useState({
    pedidosHoy: 0,
    ingresosHoy: 0,
    totalClientes: 0,
    totalProductos: 0
  })

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const today = new Date().toISOString().split('T')[0]
      
      const { data: pedidos } = await supabase
        .from('pedidos')
        .select('*')
        .gte('fecha', `${today}T00:00:00Z`)

      const ingresos = (pedidos || []).reduce((acc, curr) => acc + curr.total, 0)

      const { count: countClientes } = await supabase.from('clientes').select('*', { count: 'exact', head: true })
      const { count: countProductos } = await supabase.from('productos').select('*', { count: 'exact', head: true })

      setStats({
        pedidosHoy: pedidos?.length || 0,
        ingresosHoy: ingresos,
        totalClientes: countClientes || 0,
        totalProductos: countProductos || 0
      })
    } catch (err) {
      console.error('Error fetching stats:', err)
    }
  }

  return (
    <div className="fade-in">
      <div className="section-header">
        <h1 className="section-title">Resumen de Hoy</h1>
      </div>

      <div className="stat-cards">
        <div className="stat-card">
          <FileText className="stat-card-icon" style={{ color: 'var(--brand-primary)' }} />
          <div className="stat-card-label">Pedidos Hoy</div>
          <div className="stat-card-value">{stats.pedidosHoy}</div>
          <div className="stat-card-sub text-success">Pedidos nuevos</div>
        </div>
        
        <div className="stat-card">
          <TrendingUp className="stat-card-icon" style={{ color: 'var(--success)' }} />
          <div className="stat-card-label">Ingresos Hoy</div>
          <div className="stat-card-value">${stats.ingresosHoy.toFixed(2)}</div>
          <div className="stat-card-sub text-success">Proyectado s/Pedidos</div>
        </div>

        <div className="stat-card">
          <Users className="stat-card-icon" style={{ color: 'var(--warning)' }} />
          <div className="stat-card-label">Total Clientes</div>
          <div className="stat-card-value">{stats.totalClientes}</div>
          <div className="stat-card-sub text-muted">En base de datos</div>
        </div>

        <div className="stat-card">
          <Package className="stat-card-icon" style={{ color: '#a855f7' }} />
          <div className="stat-card-label">Total Productos</div>
          <div className="stat-card-value">{stats.totalProductos}</div>
          <div className="stat-card-sub text-muted">Disponibles en Catálogo</div>
        </div>
      </div>

      <div className="card fade-in">
        <h3 className="mb-2">¡Hola, Lucy! Bienvenida al Sistema.</h3>
        <p className="text-secondary" style={{ lineHeight: 1.6 }}>
          Desde el menú de la izquierda podés gestionar todas las tablas del sistema en tiempo real. 
          Además, tenés la opción de importar y exportar planillas de Excel para cada sección, lo cual
          te facilita cargar muchos productos de golpe.
        </p>
      </div>
    </div>
  )
}
