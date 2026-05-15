import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Alert } from 'react-native';

import { useAuth } from './AuthContext';

export const CartContext = createContext(null);

const CART_STORAGE_KEY = 'cart_items';

const getCartStorageKey = (userId) => `${CART_STORAGE_KEY}_${userId}`;

const getProductImage = (product) => (
  product.imageUrl ?? product.coverImage ?? product.mainImageUrl ?? product.images?.[0]?.url ?? null
);

const getProductStore = (product) => ({
  id: product.store?.id ?? product.storeId,
  name: product.store?.name ?? product.storeName ?? 'Tienda',
});

const normalizeProduct = (product, quantity) => {
  const store = getProductStore(product);

  return {
    id: product.id,
    name: product.name,
    price: Number(product.price ?? 0),
    unit: product.unit ?? 'UNIDAD',
    imageUrl: getProductImage(product),
    store,
    quantity,
  };
};

export function CartProvider({ children }) {
  const { user, isAuthenticated } = useAuth();
  const [items, setItems] = useState([]);
  const [cartStoreId, setCartStoreId] = useState(null);
  const [cartStoreName, setCartStoreName] = useState(null);
  const storageKey = isAuthenticated && user?.id ? getCartStorageKey(user.id) : null;

  useEffect(() => {
    const loadCart = async () => {
      if (!storageKey) {
        setItems([]);
        setCartStoreId(null);
        setCartStoreName(null);
        return;
      }

      await AsyncStorage.removeItem(CART_STORAGE_KEY);
      const storedItems = await AsyncStorage.getItem(storageKey);

      if (!storedItems) {
        setItems([]);
        setCartStoreId(null);
        setCartStoreName(null);
        return;
      }

      try {
        const parsedItems = JSON.parse(storedItems);
        setItems(parsedItems);
        setCartStoreId(parsedItems[0]?.store?.id ?? null);
        setCartStoreName(parsedItems[0]?.store?.name ?? null);
      } catch (error) {
        await AsyncStorage.removeItem(storageKey);
        setItems([]);
        setCartStoreId(null);
        setCartStoreName(null);
      }
    };

    loadCart();
  }, [storageKey]);

  const persist = useCallback(async (nextItems) => {
    setItems(nextItems);
    setCartStoreId(nextItems[0]?.store?.id ?? null);
    setCartStoreName(nextItems[0]?.store?.name ?? null);

    if (!storageKey) {
      return;
    }

    if (nextItems.length === 0) {
      await AsyncStorage.removeItem(storageKey);
      return;
    }

    await AsyncStorage.setItem(storageKey, JSON.stringify(nextItems));
  }, [storageKey]);

  const addToExistingCart = async (product, quantity) => {
    const normalized = normalizeProduct(product, quantity);
    const nextItems = items.some((item) => item.id === normalized.id)
      ? items.map((item) => (
        item.id === normalized.id
          ? { ...item, quantity: item.quantity + quantity }
          : item
      ))
      : [...items, normalized];

    await persist(nextItems);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const clearAndAdd = async (product, quantity) => {
    const normalized = normalizeProduct(product, quantity);
    await persist([normalized]);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const addItem = (product, quantity = 1) => {
    const store = getProductStore(product);

    if (items.length === 0 || store.id === cartStoreId) {
      addToExistingCart(product, quantity);
      return;
    }

    Alert.alert(
      '¿Cambiar tienda?',
      `Tienes productos de ${cartStoreName} en tu carrito. ¿Deseas vaciarlo y agregar este producto?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Vaciar y agregar',
          style: 'destructive',
          onPress: () => clearAndAdd(product, quantity),
        },
      ]
    );
  };

  const removeItem = async (productId) => {
    await persist(items.filter((item) => item.id !== productId));
  };

  const updateQuantity = async (productId, qty) => {
    if (qty <= 0) {
      await removeItem(productId);
      return;
    }

    await persist(items.map((item) => (
      item.id === productId ? { ...item, quantity: qty } : item
    )));
  };

  const clearCart = async () => {
    await persist([]);
  };

  const value = useMemo(() => {
    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const total = (deliveryType) => subtotal + (deliveryType === 'DELIVERY' ? 15 : 0);

    return {
      items,
      cartStoreId,
      cartStoreName,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
      itemCount,
      subtotal,
      total,
    };
  }, [cartStoreId, cartStoreName, items, storageKey]);

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }

  return context;
}
