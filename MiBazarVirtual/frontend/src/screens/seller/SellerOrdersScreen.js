import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useCallback, useMemo, useState } from 'react';
import {
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import * as ordersApi from '../../api/ordersApi';
import EmptyState from '../../components/common/EmptyState';
import FocusAwareStatusBar from '../../components/common/FocusAwareStatusBar';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import OrderCard from '../../components/orders/OrderCard';
import { colors, spacing, typography } from '../../theme';
import { getErrorMessage, getList } from '../../utils/apiResponse';
import { scale } from '../../utils/responsive';

const statusFilters = [
  { key: 'ALL', label: 'Todos', emptyTitle: 'Aun no tienes pedidos recibidos' },
  { key: 'PENDING', label: 'Pendientes', emptyTitle: 'No tienes pedidos pendientes' },
  { key: 'CONFIRMED', label: 'Confirmados', emptyTitle: 'No tienes pedidos confirmados' },
  { key: 'DELIVERED', label: 'Entregados', emptyTitle: 'No tienes pedidos entregados al delivery' },
];

const statCards = [
  {
    key: 'PENDING',
    statKey: 'pending',
    label: 'Pendientes',
    hint: 'Por aceptar',
    icon: 'time-outline',
    style: 'pending',
  },
  {
    key: 'CONFIRMED',
    statKey: 'confirmed',
    label: 'Confirmados',
    hint: 'Listos para retirar',
    icon: 'checkmark-done-outline',
    style: 'confirmed',
  },
  {
    key: 'DELIVERED',
    statKey: 'delivered',
    label: 'Entregados',
    hint: 'Ya retirados',
    icon: 'bicycle-outline',
    style: 'delivered',
  },
];

const initialStats = {
  pending: 0,
  confirmed: 0,
  delivered: 0,
};

const emptyByStatus = statusFilters.reduce((acc, item) => ({ ...acc, [item.key]: item.emptyTitle }), {});

export default function SellerOrdersScreen({ navigation }) {
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState(initialStats);
  const [activeStatus, setActiveStatus] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const getSellerStage = (order) => {
    if (order.status === 'IN_PROGRESS' || order.status === 'DELIVERED') {
      return 'DELIVERED';
    }

    const items = order.items ?? [];
    const hasPendingItems = items.some((item) => (item.itemStatus ?? 'PENDING') === 'PENDING');
    return hasPendingItems ? 'PENDING' : 'CONFIRMED';
  };

  const computeStats = (nextOrders) => nextOrders.reduce((acc, order) => {
    const stage = getSellerStage(order);
    if (stage === 'PENDING') acc.pending += 1;
    if (stage === 'CONFIRMED') acc.confirmed += 1;
    if (stage === 'DELIVERED') acc.delivered += 1;
    return acc;
  }, { ...initialStats });

  const loadOrders = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError('');

    try {
      const response = await ordersApi.getSellerOrders({ page: 0, size: 50 });
      const nextOrders = getList(response);
      setOrders(nextOrders);
      setStats(computeStats(nextOrders));
    } catch (ordersError) {
      setError(getErrorMessage(ordersError, 'No pudimos cargar tus pedidos recibidos.'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadOrders();
    }, [loadOrders])
  );

  const filteredOrders = useMemo(() => (
    activeStatus === 'ALL' ? orders : orders.filter((order) => getSellerStage(order) === activeStatus)
  ), [activeStatus, orders]);

  const activeEmptyTitle = emptyByStatus[activeStatus] ?? 'Sin pedidos';

  return (
    <SafeAreaView style={styles.safeArea}>
      <FocusAwareStatusBar style="dark" backgroundColor="transparent" translucent />
      <View style={styles.header}>
        <Text style={styles.title}>Pedidos recibidos</Text>
        <Text style={styles.subtitle}>Acepta productos y prepara pedidos para el repartidor</Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.statsScroll}
        contentContainerStyle={styles.statsRow}
      >
        {statCards.map((card) => (
          <TouchableOpacity
            key={card.key}
            activeOpacity={0.82}
            onPress={() => setActiveStatus(card.key)}
            style={[
              styles.statCard,
              styles[`${card.style}Stat`],
              activeStatus === card.key && styles.statCardActive,
            ]}
          >
            <View style={styles.statTopRow}>
              <View style={styles.statIcon}>
                <Ionicons name={card.icon} size={18} color={colors.primary} />
              </View>
              <Text style={styles.statCount}>{stats[card.statKey]}</Text>
            </View>
            <Text style={styles.statLabel}>{card.label}</Text>
            <Text style={styles.statHint}>{card.hint}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersScroll} contentContainerStyle={styles.filters}>
        {statusFilters.map((filter) => (
          <TouchableOpacity
            key={filter.key}
            activeOpacity={0.85}
            onPress={() => setActiveStatus(filter.key)}
            style={[styles.chip, activeStatus === filter.key ? styles.activeChip : styles.idleChip]}
          >
            <Text style={[styles.chipText, activeStatus === filter.key ? styles.activeChipText : styles.idleChipText]}>
              {filter.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {error ? (
        <View style={styles.errorCard}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity activeOpacity={0.75} onPress={() => loadOrders()}>
            <Text style={styles.retryText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {loading ? (
        <LoadingSpinner />
      ) : (
        <FlatList
          data={filteredOrders}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={filteredOrders.length ? styles.listContent : styles.emptyContent}
          refreshControl={(
            <RefreshControl
              tintColor={colors.primary}
              colors={[colors.primary]}
              refreshing={refreshing}
              onRefresh={() => loadOrders(true)}
            />
          )}
          renderItem={({ item }) => (
            <OrderCard
              order={item}
              onPress={() => navigation.navigate('OrderDetail', {
                orderId: item.id,
                isSeller: true,
                order: item,
              })}
            />
          )}
          ListEmptyComponent={(
            <EmptyState
              emoji="🧾"
              title={activeEmptyTitle}
              subtitle="Cuando haya actividad para este estado aparecera aqui."
            />
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    padding: spacing.md,
  },
  title: {
    ...typography.h2,
  },
  subtitle: {
    ...typography.small,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  statsRow: {
    alignItems: 'center',
    height: scale(124),
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  statsScroll: {
    flexGrow: 0,
    height: scale(124),
  },
  statCard: {
    width: scale(148),
    height: scale(112),
    padding: spacing.sm,
    borderRadius: scale(14),
    marginRight: spacing.sm,
    borderWidth: 1,
    borderColor: 'transparent',
    overflow: 'hidden',
  },
  statCardActive: {
    borderColor: colors.primary,
  },
  pendingStat: {
    backgroundColor: '#FFF6E8',
  },
  confirmedStat: {
    backgroundColor: '#EAF8EF',
  },
  deliveredStat: {
    backgroundColor: '#EAF3FF',
  },
  statTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statIcon: {
    width: scale(32),
    height: scale(32),
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: scale(17),
    backgroundColor: colors.surface,
  },
  statCount: {
    ...typography.h3,
    color: colors.primary,
    maxWidth: scale(72),
  },
  statLabel: {
    ...typography.bodyBold,
    color: colors.textPrimary,
    marginTop: spacing.sm,
  },
  statHint: {
    ...typography.tiny,
    color: colors.textSecondary,
    marginTop: 2,
  },
  filtersScroll: {
    flexGrow: 0,
    height: 52,
    minHeight: 52,
  },
  filters: {
    alignItems: 'center',
    height: 52,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    gap: spacing.sm,
  },
  chip: {
    height: 38,
    minWidth: 104,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    borderRadius: 18,
  },
  activeChip: {
    backgroundColor: colors.primary,
  },
  idleChip: {
    backgroundColor: colors.surface,
  },
  chipText: {
    ...typography.small,
    fontWeight: '700',
  },
  activeChipText: {
    color: colors.surface,
  },
  idleChipText: {
    color: colors.textSecondary,
  },
  listContent: {
    paddingTop: 0,
    paddingBottom: 86,
  },
  emptyContent: {
    flexGrow: 1,
    justifyContent: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
  },
  errorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    padding: spacing.md,
    borderRadius: 12,
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
});
