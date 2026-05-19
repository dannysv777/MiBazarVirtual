import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { View, StyleSheet } from 'react-native';

import Toast from '../components/common/Toast';

export const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const hideToast = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback(({ message, variant = 'info', duration = 3000, actionLabel, onAction }) => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((current) => [...current, { id, message, variant, duration, actionLabel, onAction }]);
    return id;
  }, []);

  const value = useMemo(() => ({
    showToast,
    hideToast,
    showSuccess: (message, duration, options = {}) => showToast({ message, variant: 'success', duration, ...options }),
    showError: (message, duration) => showToast({ message, variant: 'error', duration }),
    showWarning: (message, duration) => showToast({ message, variant: 'warning', duration }),
    showInfo: (message, duration) => showToast({ message, variant: 'info', duration }),
  }), [hideToast, showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <View pointerEvents="box-none" style={styles.overlay}>
        {toasts.map((toast, index) => (
          <Toast key={toast.id} toast={toast} index={index} onDismiss={hideToast} />
        ))}
      </View>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }

  return context;
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
  },
});
