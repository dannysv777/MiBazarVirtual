import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useRef } from 'react';
import { Animated, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import AppButton from '../../components/common/AppButton';
import AppBadge from '../../components/common/AppBadge';
import FocusAwareStatusBar from '../../components/common/FocusAwareStatusBar';
import { colors, shadows, spacing, typography } from '../../theme';
import { formatPrice } from '../../utils/formatters';
import { scale } from '../../utils/responsive';

const typeLabels = {
  DELIVERY: 'Delivery',
  PICKUP: 'Recoger',
};

export default function OrderConfirmationScreen({ navigation, route }) {
  const order = route.params?.order;
  const checkScale = useRef(new Animated.Value(0)).current;

  const summary = useMemo(() => {
    const items = order?.items ?? [];
    const productCount = items.reduce((sum, item) => sum + Number(item.quantity ?? 0), 0);
    const storeIds = new Set(items.map((item) => item.storeId ?? item.storeName).filter(Boolean));

    return {
      productCount,
      storeCount: storeIds.size || (order?.storeId ? 1 : 0),
    };
  }, [order]);

  useEffect(() => {
    Animated.spring(checkScale, {
      toValue: 1,
      friction: 5,
      tension: 90,
      useNativeDriver: true,
    }).start();
  }, [checkScale]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <FocusAwareStatusBar style="dark" backgroundColor="transparent" translucent />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <Animated.View style={[styles.successCircle, { transform: [{ scale: checkScale }] }]}>
            <Ionicons name="checkmark" size={44} color={colors.surface} />
          </Animated.View>
          <Text style={styles.title}>Pedido realizado</Text>
          <Text style={styles.subtitle}>Tu pedido fue enviado a los vendedores.</Text>
        </View>

        <View style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <View>
              <Text style={styles.metaLabel}>Numero de pedido</Text>
              <Text style={styles.orderNumber}>Pedido #{order?.id ?? '---'}</Text>
            </View>
            <AppBadge label={typeLabels[order?.deliveryType] ?? 'Delivery'} variant="accent" />
          </View>

          <View style={styles.divider} />

          <SummaryRow
            icon="basket-outline"
            label="Productos"
            value={`${summary.productCount} productos de ${summary.storeCount} vendedores`}
          />
          <SummaryRow
            icon="cash-outline"
            label="Total"
            value={formatPrice(order?.total ?? 0)}
            strong
          />
          {order?.deliveryAddress ? (
            <SummaryRow icon="location-outline" label="Direccion" value={order.deliveryAddress} />
          ) : null}
        </View>

        <View style={styles.nextCard}>
          <Text style={styles.cardTitle}>Que pasa ahora</Text>
          <StepRow number="1" icon="storefront-outline" text="Los vendedores confirmaran tus productos" />
          <StepRow number="2" icon="bicycle-outline" text="Un repartidor recogera tu pedido" />
          <StepRow number="3" icon="cube-outline" text="Recibiras tu pedido en tu direccion" />
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <AppButton
          title="Ver mi pedido"
          onPress={() => navigation.replace('OrderDetail', { orderId: order?.id })}
          fullWidth
          disabled={!order?.id}
        />
        <TouchableOpacity
          activeOpacity={0.75}
          onPress={() => navigation.navigate('Inicio')}
          style={styles.secondaryAction}
        >
          <Text style={styles.secondaryText}>Seguir comprando</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

function SummaryRow({ icon, label, value, strong = false }) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoIcon}>
        <Ionicons name={icon} size={18} color={colors.primary} />
      </View>
      <View style={styles.infoText}>
        <Text style={styles.metaLabel}>{label}</Text>
        <Text style={[styles.infoValue, strong && styles.strongValue]}>{value}</Text>
      </View>
    </View>
  );
}

function StepRow({ number, icon, text }) {
  return (
    <View style={styles.stepRow}>
      <View style={styles.stepNumber}>
        <Text style={styles.stepNumberText}>{number}</Text>
      </View>
      <View style={styles.stepIcon}>
        <Ionicons name={icon} size={19} color={colors.secondary} />
      </View>
      <Text style={styles.stepText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  content: {
    padding: spacing.md,
    paddingBottom: scale(132),
  },
  hero: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  successCircle: {
    width: scale(80),
    height: scale(80),
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: scale(40),
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
  summaryCard: {
    padding: spacing.md,
    borderRadius: 12,
    backgroundColor: colors.surface,
    ...shadows.card,
  },
  summaryHeader: {
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
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  infoIcon: {
    width: scale(36),
    height: scale(36),
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: scale(18),
    backgroundColor: colors.primaryLight,
    marginRight: spacing.sm,
  },
  infoText: {
    flex: 1,
  },
  infoValue: {
    ...typography.bodyBold,
    marginTop: 2,
  },
  strongValue: {
    color: colors.primary,
  },
  nextCard: {
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: 12,
    backgroundColor: colors.background,
  },
  cardTitle: {
    ...typography.bodyBold,
    marginBottom: spacing.md,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  stepNumber: {
    width: scale(26),
    height: scale(26),
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: scale(13),
    backgroundColor: colors.secondary,
  },
  stepNumberText: {
    ...typography.tiny,
    color: colors.surface,
    fontWeight: '800',
  },
  stepIcon: {
    width: scale(34),
    alignItems: 'center',
    marginLeft: spacing.sm,
  },
  stepText: {
    ...typography.body,
    flex: 1,
    color: colors.textPrimary,
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
