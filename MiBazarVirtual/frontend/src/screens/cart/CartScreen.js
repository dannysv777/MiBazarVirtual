import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Swipeable } from 'react-native-gesture-handler';

import * as ordersApi from '../../api/ordersApi';
import AppImage from '../../components/common/AppImage';
import AppButton from '../../components/common/AppButton';
import FocusAwareStatusBar from '../../components/common/FocusAwareStatusBar';
import AppInput from '../../components/common/AppInput';
import EmptyState from '../../components/common/EmptyState';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useToast } from '../../context/ToastContext';
import { colors, shadows, spacing, typography } from '../../theme';
import { formatPrice } from '../../utils/formatters';
import { getErrorMessage, getPayload } from '../../utils/apiResponse';
import { scale } from '../../utils/responsive';

export default function CartScreen({ navigation }) {
  const { user } = useAuth();
  const { showError, showSuccess } = useToast();
  const {
    items,
    cartStoreId,
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
  const [cardName, setCardName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const orderTotal = useMemo(() => total(deliveryType), [deliveryType, total]);
  const isDisabled = deliveryType === 'DELIVERY' && address.trim() === '';

  const handleSubmit = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await ordersApi.createOrder({
        storeId: cartStoreId,
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
          title="Tu carrito está vacío"
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
      <FlatList
        data={items}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={(
          <View style={styles.header}>
            <Text style={styles.title}>Mi carrito</Text>
            <Text style={styles.subtitle}>{itemCount} productos</Text>
            {user ? <Text style={styles.userText}>Pedido para {user.fullName ?? user.username}</Text> : null}
          </View>
        )}
        renderItem={({ item }) => (
          <CartItemRow
            item={item}
            onDelete={() => {
              Alert.alert('Eliminar producto', '¿Deseas quitar este producto del carrito?', [
                { text: 'Cancelar', style: 'cancel' },
                { text: 'Eliminar', style: 'destructive', onPress: () => removeItem(item.id) },
              ]);
            }}
            onQuantityChange={(qty) => updateQuantity(item.id, qty)}
          />
        )}
        ListFooterComponent={(
          <View>
            <DeliverySelector value={deliveryType} onChange={setDeliveryType} />

            {deliveryType === 'DELIVERY' ? (
              <View style={styles.inputWrap}>
                <AppInput
                  multiline
                  label="Dirección"
                  placeholder="Dirección de entrega completa"
                  value={address}
                  onChangeText={setAddress}
                />
              </View>
            ) : null}

            <View style={styles.inputWrap}>
              <AppInput
                multiline
                label="Nota"
                placeholder="Nota para el vendedor (opcional)"
                value={note}
                onChangeText={setNote}
              />
            </View>

            <OrderSummary subtotal={subtotal} deliveryType={deliveryType} total={orderTotal} />
            <PaymentSection
              value={paymentMethod}
              onChange={setPaymentMethod}
              cardName={cardName}
              cardNumber={cardNumber}
              cardExpiry={cardExpiry}
              cardCvv={cardCvv}
              onCardNameChange={setCardName}
              onCardNumberChange={setCardNumber}
              onCardExpiryChange={setCardExpiry}
              onCardCvvChange={setCardCvv}
            />

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <View style={styles.submitWrap}>
              <AppButton
                title={`Confirmar pedido (contra entrega) ${formatPrice(orderTotal)}`}
                onPress={handleSubmit}
                loading={loading}
                disabled={isDisabled}
                fullWidth
              />
            </View>
          </View>
        )}
      />

    </SafeAreaView>
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
          <Text style={styles.itemStore}>{item.store?.name}</Text>
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

function DeliverySelector({ value, onChange }) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Método de entrega</Text>
      <DeliveryOption
        icon="🛵"
        title="Delivery"
        subtitle="Q 15.00"
        selected={value === 'DELIVERY'}
        onPress={() => onChange('DELIVERY')}
      />
      <DeliveryOption
        icon="🏪"
        title="Recoger en tienda"
        subtitle="Gratis"
        selected={value === 'PICKUP'}
        onPress={() => onChange('PICKUP')}
      />
    </View>
  );
}

function DeliveryOption({ icon, title, subtitle, selected, onPress }) {
  return (
    <TouchableOpacity activeOpacity={0.85} onPress={onPress} style={styles.deliveryOption}>
      <Text style={styles.optionIcon}>{icon}</Text>
      <View style={styles.optionText}>
        <Text style={[styles.optionTitle, selected && styles.selectedText]}>{title}</Text>
        <Text style={styles.optionSubtitle}>{subtitle}</Text>
      </View>
      {selected ? <Ionicons name="checkmark-circle" size={22} color={colors.accent} /> : null}
    </TouchableOpacity>
  );
}

function OrderSummary({ subtotal, deliveryType, total }) {
  return (
    <View style={styles.card}>
      <SummaryRow label="Subtotal" value={formatPrice(subtotal)} />
      <SummaryRow label="Envío" value={deliveryType === 'DELIVERY' ? 'Q 15.00' : 'Gratis'} />
      <View style={styles.divider} />
      <SummaryRow label="TOTAL" value={formatPrice(total)} strong />
    </View>
  );
}

function PaymentSection({
  value,
  onChange,
  cardName,
  cardNumber,
  cardExpiry,
  cardCvv,
  onCardNameChange,
  onCardNumberChange,
  onCardExpiryChange,
  onCardCvvChange,
}) {
  const isCard = value === 'CARD_VISUAL';

  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Pago</Text>
      <PaymentOption
        icon="cash-outline"
        title="Contra entrega"
        subtitle="Pagas al recibir tu pedido"
        selected={value === 'CASH'}
        onPress={() => onChange('CASH')}
      />
      <PaymentOption
        icon="card-outline"
        title="Tarjeta (visual)"
        subtitle="Solo muestra el flujo para la demo"
        selected={isCard}
        onPress={() => onChange('CARD_VISUAL')}
      />

      {isCard ? (
        <View style={styles.paymentFields}>
          <AppInput
            label="Nombre en la tarjeta"
            value={cardName}
            onChangeText={onCardNameChange}
            autoCapitalize="words"
            leftIcon="person-outline"
          />
          <AppInput
            label="Numero de tarjeta"
            value={cardNumber}
            onChangeText={onCardNumberChange}
            keyboardType="number-pad"
            leftIcon="card-outline"
          />
          <View style={styles.paymentRow}>
            <View style={styles.paymentHalf}>
              <AppInput
                label="Vence"
                placeholder="MM/AA"
                value={cardExpiry}
                onChangeText={onCardExpiryChange}
                keyboardType="number-pad"
              />
            </View>
            <View style={styles.paymentHalf}>
              <AppInput
                label="CVV"
                value={cardCvv}
                onChangeText={onCardCvvChange}
                keyboardType="number-pad"
                secureTextEntry
              />
            </View>
          </View>
          <Text style={styles.paymentHint}>Estos campos son visuales. La orden se confirma contra entrega.</Text>
        </View>
      ) : null}
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

function SummaryRow({ label, value, strong }) {
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
  listContent: {
    paddingBottom: spacing.xl,
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
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    padding: spacing.sm,
    ...shadows.card,
  },
  itemImage: {
    width: scale(60),
    height: scale(60),
    borderRadius: scale(8),
  },
  itemFallback: {
    width: 60,
    height: 60,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
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
  itemStore: {
    ...typography.tiny,
    color: colors.accent,
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
    marginBottom: spacing.md,
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
  optionIcon: {
    fontSize: 24,
    width: 36,
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
