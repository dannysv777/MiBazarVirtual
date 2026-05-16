import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import * as ordersApi from '../../api/ordersApi';
import { getProducts } from '../../api/productsApi';
import AppButton from '../../components/common/AppButton';
import AppImage from '../../components/common/AppImage';
import EmptyState from '../../components/common/EmptyState';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { useCart } from '../../context/CartContext';
import { useToast } from '../../context/ToastContext';
import { colors, shadows, spacing, typography } from '../../theme';
import { formatPrice } from '../../utils/formatters';
import { analyzeOrderHistory } from '../../utils/recommendations';
import { getList } from '../../utils/apiResponse';
import { scale } from '../../utils/responsive';

const STORAGE_KEY = 'weekly_purchase';

export default function WeeklyPurchaseScreen({ navigation }) {
  const { addItem } = useCart();
  const { showSuccess, showError } = useToast();
  const [weeklyItems, setWeeklyItems] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(true);

  const saveWeeklyItems = async (items) => {
    setWeeklyItems(items);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  };

  const loadWeeklyItems = useCallback(async () => {
    setLoading(true);

    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        setWeeklyItems(JSON.parse(stored));
        return;
      }

      const ordersResponse = await ordersApi.getOrderHistory();
      const frequent = analyzeOrderHistory(getList(ordersResponse));
      if (frequent.length) {
        await saveWeeklyItems(frequent);
        showSuccess('Creamos tu lista basada en tus compras frecuentes');
      }
    } catch (error) {
      showError('No pudimos cargar tu compra semanal');
    } finally {
      setLoading(false);
    }
  }, [showError, showSuccess]);

  useEffect(() => {
    loadWeeklyItems();
  }, [loadWeeklyItems]);

  const estimatedTotal = useMemo(() => (
    weeklyItems.reduce((sum, item) => sum + Number(item.price ?? 0) * Number(item.defaultQuantity ?? 1), 0)
  ), [weeklyItems]);

  const updateQuantity = async (productId, delta) => {
    const next = weeklyItems.map((item) => (
      item.productId === productId
        ? { ...item, defaultQuantity: Math.max(1, Number(item.defaultQuantity ?? 1) + delta) }
        : item
    ));
    await saveWeeklyItems(next);
  };

  const removeItem = async (productId) => {
    await saveWeeklyItems(weeklyItems.filter((item) => item.productId !== productId));
  };

  const searchProducts = async (value) => {
    setSearchQuery(value);
    if (value.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    const response = await getProducts({ q: value.trim(), page: 0, size: 8 });
    setSearchResults(getList(response));
  };

  const addSearchResult = async (product) => {
    if (weeklyItems.some((item) => item.productId === product.id)) {
      showError('Este producto ya está en tu lista');
      return;
    }

    await saveWeeklyItems([
      ...weeklyItems,
      {
        productId: product.id,
        id: product.id,
        name: product.name,
        imageUrl: product.imageUrl,
        price: product.price,
        unit: product.unit,
        storeId: product.store?.id ?? product.storeId,
        storeName: product.store?.name ?? product.storeName,
        defaultQuantity: 1,
      },
    ]);
    setSearchQuery('');
    setSearchResults([]);
  };

  const addAllToCart = () => {
    weeklyItems.forEach((item) => addItem({
      id: item.productId,
      name: item.name,
      imageUrl: item.imageUrl,
      price: item.price,
      unit: item.unit,
      store: { id: item.storeId, name: item.storeName },
    }, Number(item.defaultQuantity ?? 1), { silent: true }));
    showSuccess(`¡${weeklyItems.length} productos agregados al carrito!`);
    navigation.navigate('Carrito');
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <LoadingSpinner />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Tu compra semanal</Text>
        <TouchableOpacity onPress={() => setIsEditing((current) => !current)} style={styles.editButton}>
          <Ionicons name={isEditing ? 'checkmark' : 'pencil'} size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {isEditing ? (
        <View style={styles.searchWrap}>
          <Ionicons name="search" size={18} color={colors.textSecondary} />
          <TextInput
            value={searchQuery}
            onChangeText={searchProducts}
            placeholder="Agregar producto"
            placeholderTextColor={colors.textLight}
            style={styles.searchInput}
          />
        </View>
      ) : null}

      {searchResults.length ? (
        <FlatList
          data={searchResults}
          keyExtractor={(item) => item.id.toString()}
          horizontal
          contentContainerStyle={styles.searchResults}
          renderItem={({ item }) => (
            <TouchableOpacity activeOpacity={0.85} onPress={() => addSearchResult(item)} style={styles.resultCard}>
              <AppImage uri={item.imageUrl} style={styles.resultImage} fallbackEmoji="🛒" />
              <Text style={styles.resultName} numberOfLines={2}>{item.name}</Text>
            </TouchableOpacity>
          )}
        />
      ) : null}

      <FlatList
        data={weeklyItems}
        keyExtractor={(item) => item.productId.toString()}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={(
          <EmptyState
            emoji="🛒"
            title="Sin lista semanal"
            subtitle="Cuando tengas pedidos entregados podremos sugerirte productos frecuentes."
          />
        )}
        renderItem={({ item }) => (
          <View style={styles.itemCard}>
            <AppImage uri={item.imageUrl} style={styles.itemImage} fallbackEmoji="🛒" />
            <View style={styles.itemInfo}>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.itemPrice}>{formatPrice(item.price)} / {item.unit ?? 'u'}</Text>
            </View>
            <View style={styles.qtyRow}>
              <TouchableOpacity style={styles.qtyButton} onPress={() => updateQuantity(item.productId, -1)}>
                <Ionicons name="remove" size={16} color={colors.primary} />
              </TouchableOpacity>
              <Text style={styles.qtyText}>{item.defaultQuantity ?? 1}</Text>
              <TouchableOpacity style={styles.qtyButton} onPress={() => updateQuantity(item.productId, 1)}>
                <Ionicons name="add" size={16} color={colors.primary} />
              </TouchableOpacity>
            </View>
            {isEditing ? (
              <TouchableOpacity onPress={() => removeItem(item.productId)} style={styles.trashButton}>
                <Ionicons name="trash-outline" size={20} color={colors.error} />
              </TouchableOpacity>
            ) : null}
          </View>
        )}
        ListFooterComponent={weeklyItems.length ? (
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Total estimado</Text>
              <Text style={styles.summaryTotal}>{formatPrice(estimatedTotal)}</Text>
            </View>
            <AppButton
              title={isEditing ? 'Guardar lista' : 'Agregar todo al carrito'}
              onPress={() => (isEditing ? setIsEditing(false) : addAllToCart())}
              fullWidth
            />
          </View>
        ) : null}
      />
    </SafeAreaView>
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
  },
  title: {
    ...typography.h2,
    flex: 1,
    marginLeft: spacing.sm,
  },
  editButton: {
    width: scale(40),
    height: scale(40),
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: scale(20),
    backgroundColor: colors.surface,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.md,
    minHeight: scale(46),
    borderRadius: scale(23),
    backgroundColor: colors.surface,
  },
  searchInput: {
    ...typography.body,
    flex: 1,
    marginLeft: spacing.sm,
  },
  searchResults: {
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  resultCard: {
    width: scale(110),
    padding: spacing.sm,
    borderRadius: scale(12),
    backgroundColor: colors.surface,
    ...shadows.card,
  },
  resultImage: {
    height: scale(72),
    borderRadius: scale(8),
  },
  resultName: {
    ...typography.tiny,
    marginTop: spacing.xs,
  },
  listContent: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
    padding: spacing.sm,
    borderRadius: scale(12),
    backgroundColor: colors.surface,
    ...shadows.card,
  },
  itemImage: {
    width: scale(56),
    height: scale(56),
    borderRadius: scale(8),
  },
  itemInfo: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  itemName: {
    ...typography.bodyBold,
  },
  itemPrice: {
    ...typography.small,
    marginTop: 2,
  },
  qtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  qtyButton: {
    width: scale(26),
    height: scale(26),
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: scale(13),
    backgroundColor: colors.primaryLight,
  },
  qtyText: {
    ...typography.bodyBold,
    minWidth: scale(28),
    textAlign: 'center',
  },
  trashButton: {
    padding: spacing.sm,
  },
  summaryCard: {
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: scale(12),
    backgroundColor: colors.surface,
    ...shadows.card,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  summaryLabel: {
    ...typography.bodyBold,
  },
  summaryTotal: {
    ...typography.price,
  },
});
