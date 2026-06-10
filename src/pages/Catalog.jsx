import React, { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, ShoppingBag, Plus, Minus, ArrowRight, ChevronUp, ChevronDown, X } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useCart } from '../context/CartContext'
import { useToast } from '../context/ToastContext'
import Steps from '../components/Steps'

export default function Catalog() {
  const [productos, setProductos] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filter, setFilter] = useState('todas')
  const [mobileCartOpen, setMobileCartOpen] = useState(false)
  const { items, addItem, removeItem, total, itemCount } = useCart()
  const navigate = useNavigate()
  const addToast = useToast()

  useEffect(() => {
    fetchProductos()
  }, [])

  const fetchProductos = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('productos')
        .select('*')
        .order('nombre', { ascending: true })

      if (error) throw error
      setProductos(data || [])
    } catch (error) {
      console.error('Error fetching products:', error)
      addToast('Error al cargar catálogo', 'error')
    } finally {
      setLoading(false)
    }
  }

  const categories = useMemo(() => {
    const cats = new Set(productos.map(p => p.categoria.toLowerCase()))
    return ['todas', ...Array.from(cats).filter(Boolean)]
  }, [productos])

  const filteredProducts = useMemo(() => {
    return productos.filter(p => {
      const matchSearch = p.nombre.toLowerCase().includes(searchTerm.toLowerCase())
      const matchCat = filter === 'todas' || p.categoria?.toLowerCase() === filter
      return matchSearch && matchCat
    })
  }, [productos, searchTerm, filter])

  return (
    <div className="page container">
      <Steps current={1} />
      
      <div className="catalog-layout">
        {/* Main Product Grid */}
        <div className="catalog-products">
          <div className="section-header">
            <h1 className="section-title">Armá tu Pedido</h1>
            <div className="search-bar" style={{ minWidth: 250 }}>
              <Search size={18} />
              <input 
                type="text" 
                placeholder="Buscar delicias..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="category-filters">
            {categories.map(cat => (
              <button 
                key={cat}
                className={`cat-btn ${filter === cat ? 'active' : ''}`}
                onClick={() => setFilter(cat)}
              >
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="loading-center">
              <div className="spinner"></div>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">🍩</div>
              <h3 className="empty-state-title">Mmm, nada por acá</h3>
              <p className="empty-state-desc">No encontramos productos con esa búsqueda.</p>
            </div>
          ) : (
            <div className="grid-auto" style={{ paddingBottom: itemCount > 0 ? '90px' : '0' }}>
              {filteredProducts.map(producto => {
                const qty = items.find(i => i.producto.id === producto.id)?.cantidad || 0
                return (
                  <div key={producto.id} className={`product-card ${qty > 0 ? 'in-cart' : ''}`}>
                    {producto.imagen ? (
                      <img src={producto.imagen} alt={producto.nombre} className="product-card-img" />
                    ) : (
                      <div className="product-card-img-placeholder">🧁</div>
                    )}
                    <div className="product-card-body">
                      <div className="product-card-name">{producto.nombre}</div>
                      <div className="product-card-category">{producto.categoria}</div>
                      <div className="product-card-price">${parseFloat(producto.precio).toFixed(2)}</div>
                    </div>
                    <div className="product-card-controls">
                      <button className="qty-btn" onClick={() => removeItem(producto.id)} disabled={qty === 0}>
                        <Minus size={16} />
                      </button>
                      <span className="qty-display">{qty}</span>
                      <button className="qty-btn" onClick={() => addItem(producto)}>
                        <Plus size={16} />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Desktop Sidebar Resumen */}
        <div className="cart-panel slide-up cart-desktop">
          <div className="cart-panel-title">
            <ShoppingBag size={20} />
            Resumen ({itemCount})
          </div>
          
          {items.length === 0 ? (
            <div className="text-center text-muted" style={{ padding: '2rem 0', fontSize: '0.9rem' }}>
              El resumen está vacío. ¡Agregá cosas ricas!
            </div>
          ) : (
            <>
              <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                {items.map(item => (
                  <div key={item.producto.id} className="cart-item">
                    <span className="cart-item-qty">{item.cantidad}x</span>
                    <span className="cart-item-name">{item.producto.nombre}</span>
                    <span className="cart-item-price">${(item.producto.precio * item.cantidad).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <div className="cart-total-row">
                <span>Total Estimado</span>
                <span className="text-primary-color">${total.toFixed(2)}</span>
              </div>
              <button 
                className="btn btn-primary w-full flex-center gap-1 mt-2"
                onClick={() => navigate('/checkout')}
              >
                Siguiente Paso <ArrowRight size={18} />
              </button>
            </>
          )}
        </div>
      </div>

      {/* ─── Mobile Sticky Cart Bar ─── */}
      {itemCount > 0 && (
        <div className="mobile-cart-bar">
          {/* Expanded panel */}
          {mobileCartOpen && (
            <div className="mobile-cart-expanded">
              <div className="mobile-cart-exp-header">
                <div className="cart-panel-title" style={{ margin: 0 }}>
                  <ShoppingBag size={18} /> Resumen ({itemCount})
                </div>
                <button onClick={() => setMobileCartOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                  <X size={20} />
                </button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', overflowY: 'auto', maxHeight: '45vh', padding: '0.5rem 0' }}>
                {items.map(item => (
                  <div key={item.producto.id} className="cart-item">
                    <span className="cart-item-qty">{item.cantidad}x</span>
                    <span className="cart-item-name">{item.producto.nombre}</span>
                    <span className="cart-item-price">${(item.producto.precio * item.cantidad).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <div className="cart-total-row" style={{ marginTop: '0.5rem' }}>
                <span>Total Estimado</span>
                <span className="text-primary-color">${total.toFixed(2)}</span>
              </div>
            </div>
          )}

          {/* Bottom sticky bar */}
          <div className="mobile-cart-bar-inner">
            <button 
              className="mobile-cart-toggle"
              onClick={() => setMobileCartOpen(!mobileCartOpen)}
            >
              <ShoppingBag size={18} />
              <span><strong>{itemCount}</strong> {itemCount === 1 ? 'item' : 'items'}</span>
              {mobileCartOpen ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
            </button>
            <button 
              className="btn btn-primary"
              style={{ padding: '0.6rem 1.2rem', fontSize: '0.9rem' }}
              onClick={() => navigate('/checkout')}
            >
              ${total.toFixed(0)} · Siguiente <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
