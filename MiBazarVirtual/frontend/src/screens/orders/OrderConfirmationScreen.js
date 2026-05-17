import { Ionicons } from '@expo/vector-icons';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import AppButton from '../../components/common/AppButton';
import FocusAwareStatusBar from '../../components/common/FocusAwareStatusBar';
import { colors, shadows, spacing, typography } from '../../theme';
import { formatPrice } from '../../utils/formatters';
import { scale } from '../../utils/responsive';

const statusLabels = {
  PENDING: 'Pendiente de confirmacion',
  CONFIRMED: 'Confirmado',
  IN_PROGRESS: 'En camino',
  DELIVERED: 'Entregado',
  CANCELLED: 'Cancelado',
};

export default function OrderConfirmationScreen({ navigation, route }) {
  const order = route.params?.order;
  const deliveryType = order?.deliveryType === 'PICKUP' ? 'Recoger en tienda' : 'Entrega a domicilio';
  const status = statusLabels[order?.status] ?? 'Pedido recibido';

  return (
    <SafeAreaView style={styles.safeArea}>
      <FocusAwareStatusBar style="dark" backgroundColor="transparent" translucent />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <View style={styles.successCircle}>
            <Ionicons name="checkmark" size={38} color={colors.surface} />
          </View>
          <Text style={styles.title}>Pedido confirmado</Text>
          <Text style={styles.subtitle}>La tienda recibio tu pedido y podras seguir su estado desde Pedidos.</Text>
        </View>

        <View style={styles.ticket}>
          <View style={styles.ticketHeader}>
            <View>
              <Text style={styles.metaLabel}>Numero de pedido</Text>
              <Text style={styles.orderNumber}>#{order?.id ?? '---'}</Text>
            </View>
            <View style={styles.statusPill}>
              <Text style={styles.statusText}>{status}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <InfoRow icon="storefront-outline" label="Tienda" value={order?.storeName ?? 'Tienda'} />
          <InfoRow icon="bicycle-outline" label="Entrega" value={deliveryType} />
          {order?.deliveryAddress ? (
            <InfoRow icon="location-outline" label="Direccion" value={order.deliveryAddress} />
          ) : null}
          {order?.notes ? <InfoRow icon="reader-outline" label="Nota" value={order.notes} /> : null}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Resumen</Text>
          {(order?.items ?? []).map((item) => (
            <View key={`${item.productId}-${item.productName}`} style={styles.itemRow}>
              <View style={styles.itemQty}>
                <Text style={styles.itemQtyText}>{item.quantity}</Text>
              </View>
              <View style={styles.itemInfo}>
                <Text style={styles.itemName} numberOfLines={1}>{item.productName}</Text>
                <Text style={styles.itemUnit}>{formatPrice(item.unitPrice)} c/u</Text>
              </View>
              <Text style={styles.itemTotal}>{formatPrice(item.subtotal)}</Text>
            </View>
          ))}

          <View style={styles.divider} />
          <SummaryRow label="Subtotal" value={formatPrice(order?.subtotal ?? 0)} />
          <SummaryRow label="Envio" value={formatPrice(order?.deliveryFee ?? 0)} />
          <SummaryRow label="Total" value={formatPrice(order?.total ?? 0)} strong />
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <AppButton
          title="Ver detalle del pedido"
          onPress={() => navigation.replace('OrderDetail', { orderId: order?.id })}
          fullWidth
          disabled={!order?.id}
        />
        <TouchableOpacity
          activeOpacity={0.75}
          onPress={() => navigation.navigate('Inicio', { screen: 'Home' })}
          style={styles.secondaryAction}
        >
          <Text style={styles.secondaryText}>Volver al inicio</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

function InfoRow({ icon, label, value }) {
  return (
    <View style={styles.infoRow}>
      <Ionicons name={icon} size={20} color={colors.primary} />
      <View style={styles.infoText}>
        <Text style={styles.metaLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
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
  content: {
    padding: spacing.md,
    paddingBottom: scale(132),
  },
  hero: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  successCircle: {
    width: scale(72),
    height: scale(72),
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: scale(36),
    backgroundColor: colors.success,
    marginBottom: spacing.md,
  },
  title: {
    ...typography.h1,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  ticket: {
    padding: spacing.md,
    borderRadius: 12,
    backgroundColor: colors.surface,
    ...shadows.card,
  },
  ticketHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  metaLabel: {
    ...typography.tiny,
    color: colors.textSecondary,
  },
  orderNumber: {
    ...typography.h2,
    color: colors.primary,
    marginTop: 2,
  },
  statusPill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 14,
    backgroundColor: colors.primaryLight,
  },
  statusText: {
    ...typography.tiny,
    color: colors.primary,
    fontWeight: '800',
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  infoText: {
    flex: 1,
  },
  infoValue: {
    ...typography.bodyBold,
    marginTop: 2,
  },
  card: {
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: 12,
    backgroundColor: colors.surface,
    ...shadows.card,
  },
  cardTitle: {
    ...typography.bodyBold,
    marginBottom: spacing.sm,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  itemQty: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 15,
    backgroundColor: colors.background,
    marginRight: spacing.sm,
  },
  itemQtyText: {
    ...typography.tiny,
    fontWeight: '800',
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    ...typography.bodyBold,
  },
  itemUnit: {
    ...typography.tiny,
    color: colors.textSecondary,
    marginTop: 2,
  },
  itemTotal: {
    ...typography.bodyBold,
    color: colors.primary,
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
    color: colors.textPrimary,
    fontWeight: '800',
  },
  summaryTotal: {
    ...typography.price,
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: spacing.md,
    backgroundColor: colors.surface,
    ...shadows.strong,
  },
  secondaryAction: {
    alignItems: 'center',
    paddingTop: spacing.sm,
  },
  secondaryText: {
    ...typography.small,
    color: colors.primary,
    fontWeight: '800',
  },
});
