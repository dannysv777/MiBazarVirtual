import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { colors, shadows, spacing, typography } from '../../theme';
import { formatDate, formatPrice } from '../../utils/formatters';
import OrderStatusBadge from './OrderStatusBadge';

const getItemCount = (order) => (
  order.items?.reduce((sum, item) => sum + Number(item.quantity ?? 0), 0) ?? 0
);

export default function OrderCard({ order, onPress }) {
  const count = getItemCount(order);

  return (
    <TouchableOpacity activeOpacity={0.88} onPress={onPress} style={styles.card}>
      <View style={styles.topRow}>
        <Text style={styles.storeName} numberOfLines={1}>{order.storeName ?? 'Tienda'}</Text>
        <OrderStatusBadge status={order.status} />
      </View>
      <View style={styles.midRow}>
        <Text style={styles.meta}>{formatDate(order.createdAt)}</Text>
        <Text style={styles.meta}>{count} productos</Text>
      </View>
      <Text style={styles.total}>{formatPrice(order.total)}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    ...shadows.card,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  storeName: {
    ...typography.bodyBold,
    flex: 1,
  },
  midRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  meta: {
    ...typography.tiny,
    color: colors.textSecondary,
  },
  total: {
    ...typography.price,
    marginTop: spacing.md,
  },
});
