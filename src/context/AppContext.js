
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabase';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [user, setUser] = useState(null);

  const [cart, setCart] = useState([]);

  const [profileLoading, setProfileLoading] = useState(false);

  const loadUserProfile = useCallback(async () => {
    setProfileLoading(true);
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) {
        setUser(null);
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('name, phone, is_admin')
        .eq('id', authUser.id)
        .single();

      setUser({
        id: authUser.id,
        email: authUser.email,
        name: profile?.name || '',
        phone: profile?.phone || '',
        isAdmin: !!profile?.is_admin,
      });
    } catch (_) {
    } finally {
      setProfileLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUserProfile();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') {
        loadUserProfile();
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setCart([]); 
      }
    });

    return () => subscription.unsubscribe();
  }, [loadUserProfile]);


  const setUserProfile = useCallback((profile) => {
    setUser((prev) => prev ? { ...prev, ...profile } : profile);
  }, []);

  const clearUser = useCallback(() => {
    setUser(null);
  }, []);


  const addToCart = useCallback((product, quantity = 1) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, { product, quantity }];
    });
  }, []);

  const removeFromCart = useCallback((productId) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  }, []);

  const updateCartQuantity = useCallback((productId, quantity) => {
    if (quantity < 1) {
      removeFromCart(productId);
      return;
    }
    setCart((prev) =>
      prev.map((item) =>
        item.product.id === productId ? { ...item, quantity } : item
      )
    );
  }, [removeFromCart]);

  const clearCart = useCallback(() => {
    setCart([]);
  }, []);


  const cartTotal = cart.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const value = {
    user,
    profileLoading,
    setUserProfile,
    clearUser,
    loadUserProfile,

    cart,
    cartTotal,
    cartCount,
    addToCart,
    removeFromCart,
    updateCartQuantity,
    clearCart,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext должен использоваться внутри <AppProvider>');
  }
  return context;
}
