import React, { createContext, useContext, useState } from 'react'

const CartContext = createContext(null)

export function CartProvider({ children }) {
  const [items, setItems] = useState([]) // [{producto, cantidad}]

  const addItem = (producto) => {
    setItems(prev => {
      const existing = prev.find(i => i.producto.id === producto.id)
      if (existing) {
        return prev.map(i =>
          i.producto.id === producto.id
            ? { ...i, cantidad: i.cantidad + 1 }
            : i
        )
      }
      return [...prev, { producto, cantidad: 1 }]
    })
  }

  const removeItem = (productoId) => {
    setItems(prev => {
      const existing = prev.find(i => i.producto.id === productoId)
      if (!existing) return prev
      if (existing.cantidad <= 1) return prev.filter(i => i.producto.id !== productoId)
      return prev.map(i =>
        i.producto.id === productoId ? { ...i, cantidad: i.cantidad - 1 } : i
      )
    })
  }

  const clearCart = () => setItems([])

  const getQty = (productoId) => {
    const item = items.find(i => i.producto.id === productoId)
    return item ? item.cantidad : 0
  }

  const total = items.reduce((sum, i) => sum + parseFloat(i.producto.precio) * i.cantidad, 0)
  const itemCount = items.reduce((sum, i) => sum + i.cantidad, 0)

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, clearCart, getQty, total, itemCount }}>
      {children}
    </CartContext.Provider>
  )
}

export const useCart = () => useContext(CartContext)
