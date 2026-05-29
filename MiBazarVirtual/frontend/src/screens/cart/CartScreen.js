import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';

import * as ordersApi from '../../api/ordersApi';
import * as walletApi from '../../api/walletApi';
import AppButton from '../../components/common/AppButton';
import AppImage from '../../components/common/AppImage';
import AppInput from '../../components/common/AppInput';
import EmptyState from '../../components/common/EmptyState';
import FocusAwareStatusBar from '../../components/common/FocusAwareStatusBar';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useToast } from '../../context/ToastContext';
import { colors, shadows, spacing, typography } from '../../theme';
import { getErrorMessage, getList, getPayload } from '../../utils/apiResponse';
import { formatPrice } from '../../utils/formatters';
import { scale } from '../../utils/responsive';

const DELIVERY_FEE = 15;

export default function CartScreen({ navigation }) {
  const { user } = useAuth();
  const { showError, showInfo, showSuccess } = useToast();
  const {
    items,
    itemsByStore,
    itemCount,
    subtotal,
    total,
    removeItem,
    updateQuantity,
    clearCart,
  } = useCart();
  const [deliveryType, setDeliveryType] = useState('DELIVERY');
  const [address, setAddress] = useState('');
  const [note, setNote] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [savedCards, setSavedCards] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const hasMultipleStores = itemsByStore.length > 1;
  const orderTotal = useMemo(() => total(deliveryType), [deliveryType, total]);
  const isDisabled = deliveryType === 'DELIVERY' && address.trim() === '';
  const defaultCard = useMemo(() => savedCards.find((card) => card.isDefault) ?? savedCards[0], [savedCards]);

  useFocusEffect(
    useCallback(() => {
      const loadCards = async () => {
        try {
          const response = await walletApi.getCards();
          setSavedCards(getList(response));
        } catch (cardsError) {
          setSavedCards([]);
        }
      };

      loadCards();
    }, [])
  );

  useEffect(() => {
    if (hasMultipleStores && deliveryType !== 'DELIVERY') {
      setDeliveryType('DELIVERY');
    }
  }, [deliveryType, hasMultipleStores]);

  const handleDeliveryChange = (nextType) => {
    if (hasMultipleStores && nextType === 'PICKUP') {
      showInfo('Al pedir de varios vendedores solo esta disponible el delivery');
      setDeliveryType('DELIVERY');
      return;
    }

    setDeliveryType(nextType);
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await ordersApi.createOrder({
        deliveryType,
        deliveryAddress: deliveryType === 'DELIVERY' ? address.trim() : null,
        notes: note.trim(),
        items: items.map((item) => ({ productId: item.id, quantity: item.quantity })),
      });
      const order = getPayload(response);
      await clearCart();
      showSuccess('Pedido realizado');
      navigation.navigate('OrderConfirmation', { order });
    } catch (submitError) {
      const message = getErrorMessage(submitError, 'No pudimos crear el pedido.');
      setError(message);
      showError(message);
    } finally {
      setLoading(false);
    }
  };

  if (itemCount === 0) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <FocusAwareStatusBar style="dark" backgroundColor="transparent" translucent />
        <EmptyState
          emoji="🛒"
          title="Tu carrito esta vacio"
          subtitle="Agrega productos para comenzar"
          actionLabel="Ver productos"
          onAction={() => navigation.navigate('Inicio')}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <FocusAwareStatusBar style="dark" backgroundColor="transparent" translucent />
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <FlatList
          data={itemsByStore}
          keyExtractor={(group) => String(group.storeId ?? group.storeName)}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={(
            <View style={styles.header}>
              <Text style={styles.title}>Mi carrito</Text>
              <Text style={styles.subtitle}>
                {itemCount} productos de {itemsByStore.length} vendedores
              </Text>
              {user ? <Text style={styles.userText}>Pedido para {user.fullName ?? user.username}</Text> : null}
            </View>
          )}
          renderItem={({ item: group }) => (
            <StoreGroup
              group={group}
              onDelete={(productId) => {
                Alert.alert('Eliminar producto', 'Deseas quitar este producto del carrito?', [
                  { text: 'Cancelar', style: 'cancel' },
                  { text: 'Eliminar', style: 'destructive', onPress: () => removeItem(productId) },
                ]);
              }}
              onQuantityChange={(productId, qty) => updateQuantity(productId, qty)}
            />
          )}
          ListFooterComponent={(
            <View>
              <DeliverySelector
                value={deliveryType}
                onChange={handleDeliveryChange}
                multipleStores={hasMultipleStores}
              />

              {deliveryType === 'DELIVERY' ? (
                <View style={styles.inputWrap}>
                  <AppInput
                    multiline
                    label="Direccion"
                    placeholder="Direccion de entrega completa"
                    value={address}
                    onChangeText={setAddress}
                  />
                </View>
              ) : null}

              <View style={styles.inputWrap}>
                <AppInput
                  multiline
                  label="Nota"
                  placeholder="Nota para los vendedores (opcional)"
                  value={note}
                  onChangeText={setNote}
                />
              </View>

              <OrderSummary
                groups={itemsByStore}
                subtotal={subtotal}
                deliveryType={deliveryType}
                total={orderTotal}
              />

              <PaymentSection
                value={paymentMethod}
                onChange={setPaymentMethod}
                defaultCard={defaultCard}
                onAddCard={() => navigation.getParent()?.navigate('Perfil', { screen: 'Wallet' })}
              />

              {error ? <Text style={styles.errorText}>{error}</Text> : null}

              <View style={styles.submitWrap}>
                <AppButton
                  title={`Confirmar pedido ${formatPrice(orderTotal)}`}
                  onPress={handleSubmit}
                  loading={loading}
                  disabled={isDisabled}
                  fullWidth
                />
              </View>
            </View>
          )}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function StoreGroup({ group, onDelete, onQuantityChange }) {
  return (
    <View style={styles.storeGroup}>
      <View style={styles.storeHeader}>
        <View style={styles.storeInitial}>
          <Text style={styles.storeInitialText}>{group.storeName?.charAt(0)?.toUpperCase() ?? 'T'}</Text>
        </View>
        <Text style={styles.storeName} numberOfLines={1}>{group.storeName}</Text>
        <Text style={styles.storeSubtotal}>{formatPrice(group.storeSubtotal)}</Text>
      </View>

      {group.items.map((item) => (
        <CartItemRow
          key={String(item.id)}
          item={item}
          onDelete={() => onDelete(item.id)}
          onQuantityChange={(qty) => onQuantityChange(item.id, qty)}
        />
      ))}

      <View style={styles.groupDivider} />
    </View>
  );
}

function CartItemRow({ item, onDelete, onQuantityChange }) {
  const renderRightActions = () => (
    <TouchableOpacity activeOpacity={0.85} onPress={onDelete} style={styles.deleteAction}>
      <Ionicons name="trash-outline" size={24} color={colors.surface} />
    </TouchableOpacity>
  );

  return (
    <Swipeable renderRightActions={renderRightActions}>
      <View style={styles.itemCard}>
        <AppImage uri={item.imageUrl} style={styles.itemImage} fallbackEmoji="🛒" />
        <View style={styles.itemInfo}>
          <Text style={styles.itemName} numberOfLines={2}>{item.name}</Text>
          <Text style={styles.itemUnit}>{item.unit}</Text>
        </View>
        <View style={styles.itemSide}>
          <View style={styles.qtyRow}>
            <TouchableOpacity style={styles.qtyButton} onPress={() => onQuantityChange(item.quantity - 1)}>
              <Ionicons name="remove" size={16} color={colors.primary} />
            </TouchableOpacity>
            <Text style={styles.qtyText}>{item.quantity}</Text>
            <TouchableOpacity style={styles.qtyButton} onPress={() => onQuantityChange(item.quantity + 1)}>
              <Ionicons name="add" size={16} color={colors.primary} />
            </TouchableOpacity>
          </View>
          <Text style={styles.itemSubtotal}>{formatPrice(item.price * item.quantity)}</Text>
        </View>
      </View>
    </Swipeable>
  );
}

function DeliverySelector({ value, onChange, multipleStores }) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Metodo de entrega</Text>
      <DeliveryOption
        icon="bicycle-outline"
        title="Delivery"
        subtitle={formatPrice(DELIVERY_FEE)}
        selected={value === 'DELIVERY'}
        onPress={() => onChange('DELIVERY')}
      />
      <DeliveryOption
        icon="storefront-outline"
        title="Recoger en tienda"
        subtitle={multipleStores ? 'No disponible con varios vendedores' : 'Gratis'}
        selected={value === 'PICKUP'}
        disabled={multipleStores}
        onPress={() => onChange('PICKUP')}
      />
    </View>
  );
}

function DeliveryOption({ icon, title, subtitle, selected, disabled = false, onPress }) {
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      style={[styles.deliveryOption, disabled && styles.disabledOption]}
    >
      <View style={styles.paymentIcon}>
        <Ionicons name={icon} size={22} color={selected ? colors.primary : colors.textSecondary} />
      </View>
      <View style={styles.optionText}>
        <Text style={[styles.optionTitle, selected && styles.selectedText]}>{title}</Text>
        <Text style={styles.optionSubtitle}>{subtitle}</Text>
      </View>
      {selected ? <Ionicons name="checkmark-circle" size={22} color={colors.accent} /> : null}
    </TouchableOpacity>
  );
}

function OrderSummary({ groups, subtotal, deliveryType, total }) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Resumen del pedido</Text>
      {groups.map((group) => (
        <SummaryRow
          key={String(group.storeId ?? group.storeName)}
          label={group.storeName}
          value={formatPrice(group.storeSubtotal)}
        />
      ))}
      <View style={styles.divider} />
      <SummaryRow label="Subtotal" value={formatPrice(subtotal)} />
      <SummaryRow label="Envio" value={deliveryType === 'DELIVERY' ? formatPrice(DELIVERY_FEE) : 'Gratis'} />
      <View style={styles.divider} />
      <SummaryRow label="TOTAL" value={formatPrice(total)} strong />
    </View>
  );
}

function PaymentSection({ value, onChange, defaultCard, onAddCard }) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Metodo de pago</Text>
      <PaymentOption
        icon="cash-outline"
        title="Contra entrega"
        subtitle="Pagas al recibir tu pedido"
        selected={value === 'CASH'}
        onPress={() => onChange('CASH')}
      />
      <PaymentOption
        icon="card-outline"
        title="Tarjeta guardada"
        subtitle={defaultCard ? `Principal **** ${defaultCard.lastFour}` : 'Agregar tarjeta'}
        selected={value === 'SAVED_CARD'}
        onPress={() => (defaultCard ? onChange('SAVED_CARD') : onAddCard())}
      />
      <Text style={styles.paymentHint}>Visual por ahora. La orden se registra como contra entrega.</Text>
    </View>
  );
}

function PaymentOption({ icon, title, subtitle, selected, onPress }) {
  return (
    <TouchableOpacity activeOpacity={0.85} onPress={onPress} style={styles.deliveryOption}>
      <View style={styles.paymentIcon}>
        <Ionicons name={icon} size={22} color={selected ? colors.primary : colors.textSecondary} />
      </View>
      <View style={styles.optionText}>
        <Text style={[styles.optionTitle, selected && styles.selectedText]}>{title}</Text>
        <Text style={styles.optionSubtitle}>{subtitle}</Text>
      </View>
      {selected ? <Ionicons name="checkmark-circle" size={22} color={colors.accent} /> : null}
    </TouchableOpacity>
  );
}

function SummaryRow({ label, value, strong = false }) {
  return (
    <View style={styles.summaryRow}>
      <Text style={[styles.summaryLabel, strong && styles.summaryStrong]} numberOfLines={1}>{label}</Text>
      <Text style={[styles.summaryValue, strong && styles.summaryTotal]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  listContent: {
    paddingBottom: scale(120),
  },
  header: {
    padding: spacing.md,
  },
  title: {
    ...typography.h2,
  },
  subtitle: {
    ...typography.small,
    marginTop: spacing.xs,
  },
  userText: {
    ...typography.tiny,
    color: colors.textLight,
    marginTop: spacing.xs,
  },
  storeGroup: {
    marginBottom: spacing.md,
  },
  storeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  storeInitial: {
    width: scale(34),
    height: scale(34),
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: scale(17),
    backgroundColor: colors.primaryLight,
  },
  storeInitialText: {
    ...typography.bodyBold,
    color: colors.primary,
  },
  storeName: {
    ...typography.bodyBold,
    flex: 1,
    marginLeft: spacing.sm,
  },
  storeSubtotal: {
    ...typography.small,
    color: colors.textSecondary,
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    padding: spacing.sm,
    borderRadius: 12,
    ...shadows.card,
  },
  itemImage: {
    width: scale(60),
    height: scale(60),
    borderRadius: scale(8),
  },
  itemInfo: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  itemName: {
    ...typography.bodyBold,
  },
  itemUnit: {
    ...typography.small,
    marginTop: 2,
  },
  itemSide: {
    alignItems: 'flex-end',
    marginLeft: spacing.sm,
  },
  qtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  qtyButton: {
    width: 26,
    height: 26,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 13,
    backgroundColor: colors.primaryLight,
  },
  qtyText: {
    ...typography.bodyBold,
    minWidth: 28,
    textAlign: 'center',
  },
  itemSubtotal: {
    ...typography.bodyBold,
    color: colors.primary,
    marginTop: spacing.sm,
  },
  deleteAction: {
    width: 70,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.error,
    marginBottom: spacing.sm,
  },
  groupDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginHorizontal: spacing.md,
    marginTop: spacing.xs,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    padding: spacing.md,
    ...shadows.card,
  },
  cardTitle: {
    ...typography.bodyBold,
    marginBottom: spacing.sm,
  },
  deliveryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  disabledOption: {
    opacity: 0.65,
  },
  optionText: {
    flex: 1,
  },
  optionTitle: {
    ...typography.bodyBold,
  },
  selectedText: {
    color: colors.primary,
  },
  optionSubtitle: {
    ...typography.small,
  },
  paymentIcon: {
    width: 36,
    alignItems: 'center',
  },
  paymentFields: {
    marginTop: spacing.sm,
  },
  paymentRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  paymentHalf: {
    flex: 1,
  },
  paymentHint: {
    ...typography.tiny,
    color: colors.textSecondary,
    marginTop: -spacing.xs,
  },
  inputWrap: {
    marginHorizontal: spacing.md,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  summaryLabel: {
    ...typography.body,
    color: colors.textSecondary,
    flex: 1,
  },
  summaryValue: {
    ...typography.bodyBold,
  },
  summaryStrong: {
    ...typography.bodyBold,
    color: colors.textPrimary,
  },
  summaryTotal: {
    ...typography.price,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.sm,
  },
  errorText: {
    ...typography.small,
    color: colors.error,
    backgroundColor: '#FFE9E8',
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    padding: spacing.sm,
    borderRadius: 10,
  },
  submitWrap: {
    paddingHorizontal: spacing.md,
  },
});
