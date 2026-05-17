import { useFocusEffect } from '@react-navigation/native';
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
import { colors, shadows, spacing, typography } from '../../theme';
import { getErrorMessage, getList } from '../../utils/apiResponse';
import { scale } from '../../utils/responsive';

const statusFilters = [
  { key: 'ALL', label: 'Todos', emptyTitle: 'Aun no tienes pedidos recibidos' },
  { key: 'PENDING', label: 'Pendientes', emptyTitle: 'No tienes pedidos pendientes' },
  { key: 'CONFIRMED', label: 'Confirmados', emptyTitle: 'No tienes pedidos confirmados' },
  { key: 'IN_PROGRESS', label: 'En camino', emptyTitle: 'No tienes pedidos en camino' },
  { key: 'DELIVERED', label: 'Entregados', emptyTitle: 'No tienes pedidos entregados' },
];

const statCards = [
  { key: 'PENDING', statKey: 'pending', label: 'Pendientes', style: 'pending' },
  { key: 'CONFIRMED', statKey: 'confirmed', label: 'Confirmados', style: 'confirmed' },
  { key: 'IN_PROGRESS', statKey: 'inProgress', label: 'En camino', style: 'inProgress' },
  { key: 'DELIVERED', statKey: 'delivered', label: 'Entregados', style: 'delivered' },
];

const initialStats = {
  pending: 0,
  confirmed: 0,
  inProgress: 0,
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

  const computeStats = (nextOrders) => nextOrders.reduce((acc, order) => {
    if (order.status === 'PENDING') acc.pending += 1;
    if (order.status === 'CONFIRMED') acc.confirmed += 1;
    if (order.status === 'IN_PROGRESS') acc.inProgress += 1;
    if (order.status === 'DELIVERED') acc.delivered += 1;
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
    activeStatus === 'ALL' ? orders : orders.filter((order) => order.status === activeStatus)
  ), [activeStatus, orders]);

  const activeEmptyTitle = emptyByStatus[activeStatus] ?? 'Sin pedidos';

  return (
    <SafeAreaView style={styles.safeArea}>
      <FocusAwareStatusBar style="dark" backgroundColor="transparent" translucent />
      <View style={styles.header}>
        <Text style={styles.title}>Pedidos recibidos</Text>
        <Text style={styles.subtitle}>Gestiona el flujo de ventas de tu tienda</Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.statsRow}>
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
            <Text style={styles.statCount}>{stats[card.statKey]}</Text>
            <Text style={styles.statLabel}>{card.label}</Text>
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
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
  },
  statCard: {
    width: scale(118),
    minHeight: scale(78),
    justifyContent: 'center',
    padding: spacing.md,
    borderRadius: scale(12),
    marginRight: spacing.sm,
    borderWidth: 1,
    borderColor: 'transparent',
    ...shadows.card,
  },
  statCardActive: {
    borderColor: colors.primary,
  },
  pendingStat: {
    backgroundColor: '#FFF4E5',
  },
  confirmedStat: {
    backgroundColor: '#EAF3FF',
  },
  inProgressStat: {
    backgroundColor: '#FFF8E1',
  },
  deliveredStat: {
    backgroundColor: '#EAF8EF',
  },
  statCount: {
    ...typography.h3,
    color: colors.primary,
  },
  statLabel: {
    ...typography.tiny,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  filtersScroll: {
    flexGrow: 0,
    maxHeight: 52,
  },
  filters: {
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
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
    paddingTop: spacing.sm,
    paddingBottom: 86,
  },
  emptyContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
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
