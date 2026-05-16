import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import * as productsApi from '../../api/productsApi';
import AppBadge from '../../components/common/AppBadge';
import AppButton from '../../components/common/AppButton';
import AppImage from '../../components/common/AppImage';
import EmptyState from '../../components/common/EmptyState';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { useToast } from '../../context/ToastContext';
import { colors, shadows, spacing, typography } from '../../theme';
import { formatPrice } from '../../utils/formatters';
import { getErrorMessage, getList } from '../../utils/apiResponse';
import { scale } from '../../utils/responsive';

const filters = [
  { key: 'ALL', label: 'Todos' },
  { key: 'ACTIVE', label: 'Activos' },
  { key: 'OUT', label: 'Agotados' },
  { key: 'PAUSED', label: 'Pausados' },
];

export default function SellerProductsScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { showError, showSuccess } = useToast();
  const [products, setProducts] = useState([]);
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [menuProduct, setMenuProduct] = useState(null);
  const [stockProduct, setStockProduct] = useState(null);
  const [stockValue, setStockValue] = useState('');
  const [savingStock, setSavingStock] = useState(false);

  const loadProducts = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError('');

    try {
      const response = await productsApi.getMyProducts({ page: 0, size: 50 });
      setProducts(getList(response));
    } catch (productError) {
      const message = getErrorMessage(productError, 'No pudimos cargar tus productos.');
      setError(message);
      showError(message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [showError]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => loadProducts(true));
    return unsubscribe;
  }, [loadProducts, navigation]);

  const filteredProducts = useMemo(() => products.filter((product) => {
    if (activeFilter === 'ACTIVE') return product.status === 'ACTIVE' && Number(product.stock ?? 0) > 0;
    if (activeFilter === 'OUT') return Number(product.stock ?? 0) === 0;
    if (activeFilter === 'PAUSED') return product.status === 'PAUSED';
    return true;
  }), [activeFilter, products]);

  const openStockModal = (product) => {
    setMenuProduct(null);
    setStockProduct(product);
    setStockValue(String(product.stock ?? 0));
  };

  const saveStock = async () => {
    const quantity = Number(stockValue);
    if (Number.isNaN(quantity) || quantity < 0) {
      showError('Ingresa una cantidad válida');
      return;
    }

    setSavingStock(true);
    try {
      await productsApi.updateStock(stockProduct.id, quantity);
      showSuccess('Stock actualizado');
      setStockProduct(null);
      await loadProducts(true);
    } catch (stockError) {
      showError(getErrorMessage(stockError, 'No pudimos actualizar el stock.'));
    } finally {
      setSavingStock(false);
    }
  };

  const confirmDelete = (product) => {
    setMenuProduct(null);
    Alert.alert('Eliminar producto', `¿Deseas eliminar "${product.name}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          try {
            await productsApi.deleteProduct(product.id);
            showSuccess('Producto eliminado');
            await loadProducts(true);
          } catch (deleteError) {
            showError(getErrorMessage(deleteError, 'No pudimos eliminar el producto.'));
          }
        },
      },
    ]);
  };

  const toggleActive = async (product) => {
    if (!product) return;
    setMenuProduct(null);

    try {
      const nextActive = product.status === 'PAUSED';
      await productsApi.updateProduct(product.id, { status: nextActive ? 'ACTIVE' : 'PAUSED' });
      showSuccess(nextActive ? 'Producto activado' : 'Producto pausado');
      await loadProducts(true);
    } catch (toggleError) {
      showError(getErrorMessage(toggleError, 'No pudimos actualizar el estado del producto.'));
    }
  };

  const renderProduct = ({ item }) => (
    <View style={styles.productCard}>
      <AppImage uri={item.imageUrl} style={styles.productImage} fallbackEmoji="🛒" />
      <View style={styles.productInfo}>
        <Text style={styles.productName} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.productPrice}>{formatPrice(item.price)} / {item.unit ?? 'u'}</Text>
        <StockBadge stock={item.stock} />
      </View>
      <TouchableOpacity activeOpacity={0.75} onPress={() => setMenuProduct(item)} style={styles.kebabButton}>
        <Ionicons name="ellipsis-vertical" size={20} color={colors.textSecondary} />
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" backgroundColor="transparent" translucent />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Mis productos</Text>
      </View>

      <FlatList
        data={filters}
        horizontal
        style={styles.filterList}
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.key}
        contentContainerStyle={styles.filterRow}
        renderItem={({ item }) => (
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setActiveFilter(item.key)}
            style={[styles.filterChip, activeFilter === item.key ? styles.filterActive : styles.filterIdle]}
          >
            <Text style={[styles.filterText, activeFilter === item.key ? styles.filterTextActive : styles.filterTextIdle]}>{item.label}</Text>
          </TouchableOpacity>
        )}
      />

      {error ? (
        <View style={styles.errorCard}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={() => loadProducts()}>
            <Text style={styles.retryText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {loading ? (
        <LoadingSpinner />
      ) : (
        <FlatList
          data={filteredProducts}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderProduct}
          contentContainerStyle={styles.listContent}
          refreshControl={(
            <RefreshControl
              tintColor={colors.primary}
              colors={[colors.primary]}
              refreshing={refreshing}
              onRefresh={() => loadProducts(true)}
            />
          )}
          ListEmptyComponent={(
            <EmptyState
              emoji="📦"
              title="Aún no tienes productos"
              subtitle="Toca el botón + para publicar tu primer producto."
            />
          )}
        />
      )}

      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => navigation.navigate('CreateProduct')}
        style={[styles.fab, { bottom: Math.max(insets.bottom, 12) + 70 }]}
      >
        <Ionicons name="add" size={30} color={colors.surface} />
      </TouchableOpacity>

      <ActionMenu
        product={menuProduct}
        onClose={() => setMenuProduct(null)}
        onEdit={() => {
          const product = menuProduct;
          setMenuProduct(null);
          navigation.navigate('EditProduct', { product });
        }}
        onStock={() => openStockModal(menuProduct)}
        onToggle={() => toggleActive(menuProduct)}
        onDelete={() => confirmDelete(menuProduct)}
      />

      <StockModal
        product={stockProduct}
        value={stockValue}
        saving={savingStock}
        onChange={setStockValue}
        onClose={() => setStockProduct(null)}
        onSave={saveStock}
      />
    </SafeAreaView>
  );
}

function StockBadge({ stock }) {
  const quantity = Number(stock ?? 0);
  if (quantity > 10) return <AppBadge variant="success" label={`En stock (${quantity})`} />;
  if (quantity > 0) return <AppBadge variant="warning" label={`Pocas (${quantity})`} />;
  return <AppBadge variant="error" label="Agotado" />;
}

function ActionMenu({ product, onClose, onEdit, onStock, onToggle, onDelete }) {
  const isPaused = product?.status === 'PAUSED';

  return (
    <Modal visible={Boolean(product)} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity activeOpacity={1} onPress={onClose} style={styles.modalOverlay}>
        <View style={styles.actionSheet}>
          <Text style={styles.sheetTitle}>{product?.name}</Text>
          <ActionRow icon="create-outline" label="Editar producto" onPress={onEdit} />
          <ActionRow icon="cube-outline" label="Actualizar stock" onPress={onStock} />
          <ActionRow
            icon={isPaused ? 'play-circle-outline' : 'pause-circle-outline'}
            label={isPaused ? 'Activar producto' : 'Pausar producto'}
            onPress={onToggle}
          />
          <ActionRow icon="trash-outline" label="Eliminar" danger onPress={onDelete} />
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

function ActionRow({ icon, label, onPress, danger = false }) {
  return (
    <TouchableOpacity activeOpacity={0.75} onPress={onPress} style={styles.actionRow}>
      <Ionicons name={icon} size={20} color={danger ? colors.error : colors.textSecondary} />
      <Text style={[styles.actionLabel, danger && styles.dangerText]}>{label}</Text>
    </TouchableOpacity>
  );
}

function StockModal({ product, value, saving, onChange, onClose, onSave }) {
  return (
    <Modal visible={Boolean(product)} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.sheetOverlay}>
        <View style={styles.stockSheet}>
          <Text style={styles.sheetTitle}>Actualizar stock — {product?.name}</Text>
          <Text style={styles.currentStock}>Stock actual: {product?.stock ?? 0}</Text>
          <TextInput
            value={value}
            onChangeText={onChange}
            keyboardType="numeric"
            placeholder="Cantidad"
            placeholderTextColor={colors.textLight}
            style={styles.stockInput}
          />
          <View style={styles.modalActions}>
            <View style={styles.modalButton}>
              <AppButton title="Cancelar" variant="outline" onPress={onClose} fullWidth />
            </View>
            <View style={styles.modalButton}>
              <AppButton title="Guardar" onPress={onSave} loading={saving} fullWidth />
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
  },
  backButton: {
    width: scale(40),
    height: scale(40),
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: scale(20),
    backgroundColor: colors.surface,
    marginRight: spacing.sm,
  },
  title: {
    ...typography.h2,
  },
  filterRow: {
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
    paddingBottom: spacing.md,
  },
  filterList: {
    flexGrow: 0,
    maxHeight: scale(56),
  },
  filterChip: {
    height: scale(42),
    minWidth: scale(102),
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    borderRadius: scale(18),
  },
  filterActive: {
    backgroundColor: colors.primary,
  },
  filterIdle: {
    backgroundColor: colors.surface,
  },
  filterText: {
    ...typography.small,
    fontWeight: '700',
  },
  filterTextActive: {
    color: colors.surface,
  },
  filterTextIdle: {
    color: colors.textSecondary,
  },
  listContent: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  productCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
    padding: spacing.sm,
    borderRadius: scale(12),
    backgroundColor: colors.surface,
    ...shadows.card,
  },
  productImage: {
    width: scale(72),
    height: scale(72),
    borderRadius: scale(10),
  },
  productInfo: {
    flex: 1,
    marginLeft: spacing.md,
    gap: spacing.xs,
  },
  productName: {
    ...typography.bodyBold,
  },
  productPrice: {
    ...typography.small,
    color: colors.primary,
    fontWeight: '700',
  },
  kebabButton: {
    padding: spacing.sm,
  },
  fab: {
    position: 'absolute',
    right: spacing.lg,
    bottom: spacing.lg,
    width: scale(58),
    height: scale(58),
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: scale(29),
    backgroundColor: colors.primary,
    ...shadows.strong,
  },
  errorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    padding: spacing.md,
    borderRadius: scale(12),
    backgroundColor: '#FFE9E8',
  },
  errorText: {
    ...typography.small,
    flex: 1,
    color: colors.error,
  },
  retryText: {
    ...typography.small,
    color: colors.error,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: colors.overlay,
  },
  actionSheet: {
    padding: spacing.md,
    borderTopLeftRadius: scale(18),
    borderTopRightRadius: scale(18),
    backgroundColor: colors.surface,
  },
  sheetTitle: {
    ...typography.h3,
    marginBottom: spacing.md,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: scale(48),
  },
  actionLabel: {
    ...typography.body,
    marginLeft: spacing.sm,
  },
  dangerText: {
    color: colors.error,
  },
  sheetOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: colors.overlay,
  },
  stockSheet: {
    padding: spacing.md,
    borderTopLeftRadius: scale(18),
    borderTopRightRadius: scale(18),
    backgroundColor: colors.surface,
  },
  currentStock: {
    ...typography.small,
    marginBottom: spacing.md,
  },
  stockInput: {
    ...typography.h3,
    minHeight: scale(52),
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: scale(12),
    backgroundColor: colors.background,
  },
  modalActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  modalButton: {
    flex: 1,
  },
});
