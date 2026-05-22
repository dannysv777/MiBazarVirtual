import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useEffect, useState } from 'react';
import {
  FlatList,
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
import { useAuth } from '../../context/AuthContext';
import { colors, spacing, typography } from '../../theme';
import { getErrorMessage, getList } from '../../utils/apiResponse';

const statusFilters = [
  { label: 'Todos', value: undefined },
  { label: 'Pendientes', value: 'PENDING' },
  { label: 'Confirmados', value: 'CONFIRMED' },
  { label: 'En camino', value: 'IN_PROGRESS' },
  { label: 'Entregados', value: 'DELIVERED' },
];

export default function OrdersScreen({ navigation }) {
  const { user } = useAuth();
  const isSeller = user?.role === 'SELLER';
  const [activeTab, setActiveTab] = useState(isSeller ? 'SELLER' : 'BUYER');
  const [status, setStatus] = useState(undefined);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtering, setFiltering] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const loadOrders = useCallback(async ({ silent = false } = {}) => {
    if (!silent && orders.length === 0) {
      setLoading(true);
    } else if (!silent) {
      setFiltering(true);
    }
    setError('');

    try {
      const response = activeTab === 'SELLER'
        ? await ordersApi.getSellerOrders({ status, page: 0, size: 20 })
        : await ordersApi.getOrders({ page: 0, size: 20 });
      setOrders(getList(response));
    } catch (ordersError) {
      setError(getErrorMessage(ordersError, 'No pudimos cargar tus pedidos.'));
    } finally {
      setLoading(false);
      setFiltering(false);
      setRefreshing(false);
    }
  }, [activeTab, orders.length, status]);

  useEffect(() => {
    setActiveTab(isSeller ? 'SELLER' : 'BUYER');
    setStatus(undefined);
  }, [isSeller]);

  useFocusEffect(
    useCallback(() => {
      loadOrders();
    }, [loadOrders])
  );

  const handleRefresh = () => {
    setRefreshing(true);
    loadOrders({ silent: true });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <FocusAwareStatusBar style="dark" backgroundColor="transparent" translucent />
      <View style={styles.header}>
        <Text style={styles.title}>Pedidos</Text>
        <Text style={styles.subtitle}>{activeTab === 'SELLER' ? 'Pedidos recibidos' : 'Tus compras recientes'}</Text>
      </View>

      {activeTab === 'SELLER' ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersScroll} contentContainerStyle={styles.filters}>
          {statusFilters.map((filter) => (
            <TouchableOpacity
              key={filter.label}
              activeOpacity={0.85}
              onPress={() => {
                if (status !== filter.value) {
                  setStatus(filter.value);
                }
              }}
              style={[styles.chip, status === filter.value && styles.activeChip]}
            >
              <Text style={[styles.chipText, status === filter.value && styles.activeChipText]}>{filter.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      ) : null}

      {filtering ? (
        <View style={styles.filteringBar}>
          <Text style={styles.filteringText}>Actualizando pedidos...</Text>
        </View>
      ) : null}

      {loading ? (
        <LoadingSpinner />
      ) : error ? (
        <View style={styles.centerState}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => String(item.id)}
          refreshing={refreshing}
          onRefresh={handleRefresh}
          contentContainerStyle={orders.length === 0 ? styles.emptyContent : styles.listContent}
          ListEmptyComponent={(
            <EmptyState
              emoji="🧾"
              title="Sin pedidos todavía"
              subtitle={activeTab === 'SELLER' ? 'Cuando recibas pedidos aparecerán aquí' : 'Tus compras aparecerán aquí'}
            />
          )}
          renderItem={({ item }) => (
            <OrderCard
              order={item}
              onPress={() => navigation.navigate('OrderDetail', {
                orderId: item.id,
                isSeller: activeTab === 'SELLER',
                order: item,
              })}
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
    marginTop: spacing.xs,
  },
  filters: {
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    gap: spacing.sm,
  },
  filtersScroll: {
    flexGrow: 0,
    height: 52,
  },
  chip: {
    height: 38,
    minWidth: 104,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    borderRadius: 18,
    backgroundColor: colors.surface,
  },
  activeChip: {
    backgroundColor: colors.secondary,
  },
  chipText: {
    ...typography.small,
    fontWeight: '700',
  },
  activeChipText: {
    color: colors.surface,
  },
  listContent: {
    paddingTop: spacing.sm,
    paddingBottom: spacing.xl,
  },
  filteringBar: {
    minHeight: 28,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
  },
  filteringText: {
    ...typography.tiny,
    color: colors.textSecondary,
    fontWeight: '700',
  },
  emptyContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  centerState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
  },
  errorText: {
    ...typography.small,
    color: colors.error,
    textAlign: 'center',
  },
});
