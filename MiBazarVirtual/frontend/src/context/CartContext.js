import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';
import { navigateToCart } from '../navigation/navigationService';

export const CartContext = createContext(null);

const CART_STORAGE_KEY = 'cart_items';
const DELIVERY_FEE = 15;

const getCartStorageKey = (userId) => `${CART_STORAGE_KEY}_${userId}`;

const getProductImage = (product) => (
  product?.imageUrl
  ?? product?.coverImage
  ?? product?.mainImageUrl
  ?? product?.productImageUrl
  ?? product?.images?.[0]?.url
  ?? null
);

const getProductStore = (product) => ({
  id: product?.store?.id ?? product?.storeId ?? null,
  name: product?.store?.name ?? product?.storeName ?? 'Tienda',
});

const normalizeProduct = (product, quantity) => {
  const store = getProductStore(product);

  return {
    id: product.id,
    name: product.name,
    price: Number(product.price ?? 0),
    unit: product.unit ?? 'UNIDAD',
    imageUrl: getProductImage(product),
    quantity,
    storeId: store.id,
    storeName: store.name,
  };
};

const normalizeStoredItem = (item) => ({
  ...item,
  storeId: item.storeId ?? item.store?.id ?? null,
  storeName: item.storeName ?? item.store?.name ?? 'Tienda',
  price: Number(item.price ?? 0),
  quantity: Number(item.quantity ?? 1),
});

export function CartProvider({ children }) {
  const { user, isAuthenticated } = useAuth();
  const { showSuccess } = useToast();
  const [items, setItems] = useState([]);
  const [cartPulseKey, setCartPulseKey] = useState(0);
  const storageKey = isAuthenticated && user?.id ? getCartStorageKey(user.id) : null;

  useEffect(() => {
    const loadCart = async () => {
      if (!storageKey) {
        setItems([]);
        return;
      }

      await AsyncStorage.removeItem(CART_STORAGE_KEY);
      const storedItems = await AsyncStorage.getItem(storageKey);

      if (!storedItems) {
        setItems([]);
        return;
      }

      try {
        const parsedItems = JSON.parse(storedItems);
        setItems(Array.isArray(parsedItems) ? parsedItems.map(normalizeStoredItem) : []);
      } catch (error) {
        await AsyncStorage.removeItem(storageKey);
        setItems([]);
      }
    };

    loadCart();
  }, [storageKey]);

  const persist = useCallback(async (nextItems) => {
    setItems(nextItems);

    if (!storageKey) {
      return;
    }

    if (nextItems.length === 0) {
      await AsyncStorage.removeItem(storageKey);
      return;
    }

    await AsyncStorage.setItem(storageKey, JSON.stringify(nextItems));
  }, [storageKey]);

  const addItem = useCallback(async (product, quantity = 1, options = {}) => {
    const normalized = normalizeProduct(product, quantity);
    const nextItems = items.some((item) => item.id === normalized.id)
      ? items.map((item) => (
        item.id === normalized.id
          ? { ...item, quantity: item.quantity + quantity }
          : item
      ))
      : [...items, normalized];

    await persist(nextItems);
    setCartPulseKey((current) => current + 1);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (!options.silent) {
      showSuccess('Agregado al carrito', 4500, {
        actionLabel: 'Ver carrito',
        onAction: navigateToCart,
      });
    }
  }, [items, persist, showSuccess]);

  const addItems = useCallback(async (products, options = {}) => {
    const nextItems = [...items];

    products.forEach(({ product, quantity = 1 }) => {
      const normalized = normalizeProduct(product, quantity);
      const existingIndex = nextItems.findIndex((item) => item.id === normalized.id);

      if (existingIndex >= 0) {
        nextItems[existingIndex] = {
          ...nextItems[existingIndex],
          quantity: nextItems[existingIndex].quantity + quantity,
        };
      } else {
        nextItems.push(normalized);
      }
    });

    await persist(nextItems);
    setCartPulseKey((current) => current + 1);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (!options.silent) {
      showSuccess('Productos agregados al carrito', 4500, {
        actionLabel: 'Ver carrito',
        onAction: navigateToCart,
      });
    }
  }, [items, persist, showSuccess]);

  const removeItem = useCallback(async (productId) => {
    await persist(items.filter((item) => item.id !== productId));
  }, [items, persist]);

  const updateQuantity = useCallback(async (productId, qty) => {
    if (qty <= 0) {
      await removeItem(productId);
      return;
    }

    await persist(items.map((item) => (
      item.id === productId ? { ...item, quantity: qty } : item
    )));
  }, [items, persist, removeItem]);

  const clearCart = useCallback(async () => {
    await persist([]);
  }, [persist]);

  const value = useMemo(() => {
    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const grouped = items.reduce((groups, item) => {
      const key = String(item.storeId ?? 'unknown');
      const currentGroup = groups.get(key) ?? {
        storeId: item.storeId,
        storeName: item.storeName ?? 'Tienda',
        items: [],
        storeSubtotal: 0,
      };

      currentGroup.items.push(item);
      currentGroup.storeSubtotal += item.price * item.quantity;
      groups.set(key, currentGroup);
      return groups;
    }, new Map());
    const itemsByStore = Array.from(grouped.values());
    const total = (deliveryType) => subtotal + (deliveryType === 'DELIVERY' ? DELIVERY_FEE : 0);

    return {
      items,
      itemsByStore,
      addItem,
      addItems,
      removeItem,
      updateQuantity,
      clearCart,
      itemCount,
      subtotal,
      total,
      cartPulseKey,
    };
  }, [addItem, addItems, cartPulseKey, clearCart, items, removeItem, updateQuantity]);

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
