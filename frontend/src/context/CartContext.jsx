import { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../services/api';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);

/** Giỏ hàng + yêu thích của khách đăng nhập. */
export function CartProvider({ children }) {
  const { user } = useAuth();
  const [cart, setCart] = useState([]);
  const [wishlist, setWishlist] = useState([]);

  const isCustomer = user?.role === 'CUSTOMER';

  useEffect(() => {
    if (isCustomer) {
      refreshCart();
      refreshWishlist();
    } else {
      setCart([]);
      setWishlist([]);
    }
  }, [user?.id]);

  async function refreshCart() {
    try {
      const { data } = await api.get('/cart-items');
      setCart(data);
    } catch {}
  }

  async function refreshWishlist() {
    try {
      const { data } = await api.get('/wishlist-items');
      setWishlist(data);
    } catch {}
  }

  async function addToCart(productId, size, color, quantity = 1) {
    const data = await api.post('/cart-items', { productId, size, color, quantity });
    setCart(data.data);
  }

  async function updateQuantity(itemId, quantity) {
    const { data } = await api.put(`/cart-items/${itemId}`, { quantity });
    setCart(data);
  }

  async function removeItem(itemId) {
    await api.delete(`/cart-items/${itemId}`);
    refreshCart();
  }

  async function toggleWishlist(productId) {
    if (wishlist.some((w) => w.productId === productId)) {
      await api.delete(`/wishlist-items/${productId}`);
    } else {
      await api.post('/wishlist-items', { productId });
    }
    refreshWishlist();
  }

  function inWishlist(productId) {
    return wishlist.some((w) => w.productId === productId);
  }

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{ cart, wishlist, cartCount, isCustomer, addToCart, updateQuantity,
               removeItem, toggleWishlist, inWishlist, refreshCart, refreshWishlist }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
