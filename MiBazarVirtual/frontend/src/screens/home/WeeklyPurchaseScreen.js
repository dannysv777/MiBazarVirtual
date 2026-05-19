import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import * as ordersApi from '../../api/ordersApi';
import { getProducts } from '../../api/productsApi';
import * as recommendationsApi from '../../api/recommendationsApi';
import AppButton from '../../components/common/AppButton';
import AppImage from '../../components/common/AppImage';
import EmptyState from '../../components/common/EmptyState';
import FocusAwareStatusBar from '../../components/common/FocusAwareStatusBar';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { useCart } from '../../context/CartContext';
import { useToast } from '../../context/ToastContext';
import { colors, shadows, spacing, typography } from '../../theme';
import { getList } from '../../utils/apiResponse';
import { formatPrice } from '../../utils/formatters';
import { analyzeOrderHistory } from '../../utils/recommendations';
import { scale } from '../../utils/responsive';

const STORAGE_KEY = 'weekly_purchase';
const DELIVERY_DAY_KEY = 'weekly_delivery_day';
const SUBSCRIPTION_KEY = 'weekly_subscription_active';
const DEFAULT_DAY = 'JUEVES';
const SUBSCRIBER_DELIVERY_FEE = 10;

const DAYS = [
  { key: 'LUNES', label: 'Lun', previous: 'domingo' },
  { key: 'MARTES', label: 'Mar', previous: 'lunes' },
  { key: 'MIERCOLES', label: 'Mie', previous: 'martes' },
  { key: 'JUEVES', label: 'Jue', previous: 'miercoles' },
  { key: 'VIERNES', label: 'Vie', previous: 'jueves' },
  { key: 'SABADO', label: 'Sab', previous: 'viernes' },
];

export default function WeeklyPurchaseScreen({ navigation }) {
  const { addItems } = useCart();
  const { showSuccess, showError } = useToast();
  const [weeklyItems, setWeeklyItems] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [scheduledDay, setScheduledDay] = useState(DEFAULT_DAY);
  const [isSubscriptionActive, setIsSubscriptionActive] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const saveWeeklyItems = async (items) => {
    setWeeklyItems(items);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  };

  const loadWeeklyItems = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const [stored, storedDay, storedSubscription] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEY),
        AsyncStorage.getItem(DELIVERY_DAY_KEY),
        AsyncStorage.getItem(SUBSCRIPTION_KEY),
      ]);

      setScheduledDay(storedDay ?? DEFAULT_DAY);
      setIsSubscriptionActive(storedSubscription === 'true');

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
    } catch (loadError) {
      setError('No pudimos cargar tu compra semanal');
      showError('No pudimos cargar tu compra semanal');
    } finally {
      setLoading(false);
    }
  }, [showError, showSuccess]);

  useEffect(() => {
    loadWeeklyItems();
  }, [loadWeeklyItems]);

  const selectedDay = DAYS.find((day) => day.key === scheduledDay) ?? DAYS[3];
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

    try {
      const response = await getProducts({ q: value.trim(), page: 0, size: 8 });
      setSearchResults(getList(response));
    } catch (searchError) {
      setSearchResults([]);
      showError('No pudimos buscar productos');
    }
  };

  const addSearchResult = async (product) => {
    if (weeklyItems.some((item) => item.productId === product.id)) {
      showError('Este producto ya esta en tu lista');
      return;
    }

    await saveWeeklyItems([
      ...weeklyItems,
      {
        productId: product.id,
        id: product.id,
        name: product.name,
        imageUrl: product.imageUrl ?? product.coverImage,
        price: product.price,
        unit: product.unit,
        storeId: product.store?.id ?? product.storeId,
        storeName: product.store?.name ?? product.storeName,
        defaultQuantity: 1,
      },
    ]);
    setSearchQuery('');
    setSearchResults([]);

    try {
      const response = await recommendationsApi.getSimilarProducts(product.id, 8);
      const existingIds = new Set([...weeklyItems.map((item) => item.productId), product.id]);
      setSuggestions(getList(response).filter((item) => !existingIds.has(item.id)));
    } catch (suggestionError) {
      setSuggestions([]);
    }
  };

  const activateSubscription = async () => {
    setIsSubscriptionActive(true);
    await AsyncStorage.setItem(SUBSCRIPTION_KEY, 'true');
    showSuccess('Recordatorio activado');
  };

  const deactivateSubscription = async () => {
    setIsSubscriptionActive(false);
    await AsyncStorage.setItem(SUBSCRIPTION_KEY, 'false');
    showSuccess('Recordatorio desactivado');
  };

  const selectDay = async (day) => {
    setScheduledDay(day);
    await AsyncStorage.setItem(DELIVERY_DAY_KEY, day);
  };

  const addAllToCart = async () => {
    await addItems(weeklyItems.map((item) => ({
      product: {
        id: item.productId,
        name: item.name,
        imageUrl: item.imageUrl,
        price: item.price,
        unit: item.unit,
        store: { id: item.storeId, name: item.storeName },
      },
      quantity: Number(item.defaultQuantity ?? 1),
    })), { silent: true });
    showSuccess(`${weeklyItems.length} productos agregados al carrito`);
    navigation.navigate('Carrito');
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <FocusAwareStatusBar style="dark" backgroundColor="transparent" translucent />
        <LoadingSpinner />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <FocusAwareStatusBar style="dark" backgroundColor="transparent" translucent />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Mi compra semanal</Text>
        <TouchableOpacity onPress={() => setIsEditing((current) => !current)} style={styles.editButton}>
          <Ionicons name={isEditing ? 'checkmark' : 'pencil'} size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <SubscriptionCard
          active={isSubscriptionActive}
          selectedDay={selectedDay}
          scheduledDay={scheduledDay}
          onActivate={activateSubscription}
          onDeactivate={deactivateSubscription}
          onSelectDay={selectDay}
        />

        {isSubscriptionActive ? (
          <View style={styles.savingsBadge}>
            <Ionicons name="leaf-outline" size={16} color={colors.success} />
            <Text style={styles.savingsText}>Suscriptores ahorran Q5 en cada envio</Text>
          </View>
        ) : null}

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
          <ProductSuggestionRow title="Resultados" products={searchResults} onAdd={addSearchResult} />
        ) : null}

        {isEditing && !searchQuery && suggestions.length ? (
          <ProductSuggestionRow title="Sugeridos para tu lista" products={suggestions} onAdd={addSearchResult} />
        ) : null}

        {weeklyItems.length === 0 ? (
          <EmptyState
            emoji="🛒"
            title="Sin lista semanal"
            subtitle="Agrega productos frecuentes para confirmar tu compra mas rapido cada semana."
          />
        ) : (
          <>
            {weeklyItems.map((item) => (
              <WeeklyItem
                key={String(item.productId)}
                item={item}
                isEditing={isEditing}
                onIncrease={() => updateQuantity(item.productId, 1)}
                onDecrease={() => updateQuantity(item.productId, -1)}
                onRemove={() => removeItem(item.productId)}
              />
            ))}

            <View style={styles.summaryCard}>
              <SummaryRow label="Total estimado" value={formatPrice(estimatedTotal)} strong />
              <SummaryRow label="Delivery semanal" value={formatPrice(SUBSCRIBER_DELIVERY_FEE)} />
              <View style={styles.divider} />
              <SummaryRow label="Total con envio" value={formatPrice(estimatedTotal + SUBSCRIBER_DELIVERY_FEE)} strong />
              <AppButton
                title={isEditing ? 'Guardar lista' : 'Agregar todo al carrito'}
                onPress={() => (isEditing ? setIsEditing(false) : addAllToCart())}
                fullWidth
              />
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function SubscriptionCard({ active, selectedDay, scheduledDay, onActivate, onDeactivate, onSelectDay }) {
  if (!active) {
    return (
      <View style={styles.subscriptionCard}>
        <View style={styles.subscriptionIcon}>
          <Ionicons name="notifications-outline" size={22} color={colors.primary} />
        </View>
        <View style={styles.subscriptionText}>
          <Text style={styles.subscriptionTitle}>Activar recordatorio semanal</Text>
          <Text style={styles.subscriptionBody}>Te notificaremos un dia antes para que confirmes tu pedido.</Text>
        </View>
        <AppButton title="Activar" variant="outline" size="sm" onPress={onActivate} />
      </View>
    );
  }

  return (
    <View style={styles.activeSubscriptionCard}>
      <View style={styles.activeHeader}>
        <Ionicons name="checkmark-circle" size={22} color={colors.success} />
        <View style={styles.subscriptionText}>
          <Text style={styles.subscriptionTitle}>Recordatorio activo</Text>
          <Text style={styles.subscriptionBody}>Te avisaremos cada {selectedDay.previous} para confirmar.</Text>
        </View>
      </View>

      <View style={styles.dayRow}>
        {DAYS.map((day) => (
          <TouchableOpacity
            key={day.key}
            activeOpacity={0.8}
            onPress={() => onSelectDay(day.key)}
            style={[styles.dayChip, scheduledDay === day.key && styles.dayChipActive]}
          >
            <Text style={[styles.dayText, scheduledDay === day.key && styles.dayTextActive]}>{day.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.subscriptionHint}>Recibiras la notificacion el dia anterior.</Text>
      <TouchableOpacity activeOpacity={0.8} onPress={onDeactivate} style={styles.disableButton}>
        <Text style={styles.disableText}>Desactivar recordatorio</Text>
      </TouchableOpacity>
    </View>
  );
}

function WeeklyItem({ item, isEditing, onIncrease, onDecrease, onRemove }) {
  return (
    <View style={styles.itemCard}>
      <AppImage uri={item.imageUrl} style={styles.itemImage} fallbackEmoji="🛒" />
      <View style={styles.itemInfo}>
        <Text style={styles.itemName} numberOfLines={2}>{item.name}</Text>
        <Text style={styles.itemPrice}>{formatPrice(item.price)} / {item.unit ?? 'u'}</Text>
        <Text style={styles.itemStore} numberOfLines={1}>{item.storeName ?? 'Tienda'}</Text>
      </View>
      <View style={styles.qtyRow}>
        <TouchableOpacity style={styles.qtyButton} onPress={onDecrease}>
          <Ionicons name="remove" size={16} color={colors.primary} />
        </TouchableOpacity>
        <Text style={styles.qtyText}>{item.defaultQuantity ?? 1}</Text>
        <TouchableOpacity style={styles.qtyButton} onPress={onIncrease}>
          <Ionicons name="add" size={16} color={colors.primary} />
        </TouchableOpacity>
      </View>
      {isEditing ? (
        <TouchableOpacity onPress={onRemove} style={styles.trashButton}>
          <Ionicons name="trash-outline" size={20} color={colors.error} />
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

function ProductSuggestionRow({ title, products, onAdd }) {
  return (
    <View style={styles.suggestionSection}>
      <Text style={styles.suggestionTitle}>{title}</Text>
      <FlatList
        data={products}
        keyExtractor={(item) => item.id.toString()}
        horizontal
        contentContainerStyle={styles.searchResults}
        showsHorizontalScrollIndicator={false}
        renderItem={({ item }) => (
          <TouchableOpacity activeOpacity={0.85} onPress={() => onAdd(item)} style={styles.resultCard}>
            <AppImage uri={item.imageUrl ?? item.coverImage} style={styles.resultImage} fallbackEmoji="🛒" />
            <Text style={styles.resultName} numberOfLines={2}>{item.name}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

function SummaryRow({ label, value, strong = false }) {
  return (
    <View style={styles.summaryRow}>
      <Text style={[styles.summaryLabel, strong && styles.summaryStrong]}>{label}</Text>
      <Text style={[styles.summaryValue, strong && styles.summaryTotal]}>{value}</Text>
    </View>
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
  content: {
    padding: spacing.md,
    paddingTop: 0,
    paddingBottom: spacing.xl,
  },
  errorText: {
    ...typography.small,
    color: colors.error,
    backgroundColor: '#FFE9E8',
    marginBottom: spacing.md,
    padding: spacing.sm,
    borderRadius: 10,
  },
  subscriptionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: scale(12),
    backgroundColor: colors.surface,
    marginBottom: spacing.md,
    ...shadows.card,
  },
  activeSubscriptionCard: {
    padding: spacing.md,
    borderRadius: scale(12),
    backgroundColor: '#EAF8EF',
    marginBottom: spacing.md,
    ...shadows.card,
  },
  subscriptionIcon: {
    width: scale(38),
    height: scale(38),
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: scale(19),
    backgroundColor: colors.primaryLight,
  },
  activeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  subscriptionText: {
    flex: 1,
  },
  subscriptionTitle: {
    ...typography.bodyBold,
  },
  subscriptionBody: {
    ...typography.small,
    color: colors.textSecondary,
    marginTop: 2,
  },
  dayRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginTop: spacing.md,
  },
  dayChip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.xs,
    borderRadius: scale(14),
    backgroundColor: colors.surface,
  },
  dayChipActive: {
    backgroundColor: colors.primary,
  },
  dayText: {
    ...typography.tiny,
    color: colors.textSecondary,
    fontWeight: '800',
  },
  dayTextActive: {
    color: colors.surface,
  },
  subscriptionHint: {
    ...typography.tiny,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
  disableButton: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: scale(34),
    borderWidth: 1,
    borderColor: colors.error,
    borderRadius: scale(10),
    marginTop: spacing.sm,
  },
  disableText: {
    ...typography.small,
    color: colors.error,
    fontWeight: '800',
  },
  savingsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: scale(14),
    backgroundColor: '#EAF8EF',
    marginBottom: spacing.md,
  },
  savingsText: {
    ...typography.tiny,
    color: colors.success,
    fontWeight: '800',
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
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
  suggestionSection: {
    marginBottom: spacing.md,
  },
  searchResults: {
    gap: spacing.sm,
  },
  suggestionTitle: {
    ...typography.small,
    color: colors.textSecondary,
    fontWeight: '800',
    marginBottom: spacing.xs,
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
  itemStore: {
    ...typography.tiny,
    color: colors.accent,
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
    marginBottom: spacing.sm,
  },
  summaryLabel: {
    ...typography.body,
    color: colors.textSecondary,
  },
  summaryValue: {
    ...typography.bodyBold,
  },
  summaryStrong: {
    ...typography.bodyBold,
    color: colors.textPrimary,
  },
  summaryTotal: {
    color: colors.primary,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.sm,
  },
});
