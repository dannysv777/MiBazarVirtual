import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useCallback, useMemo, useState } from 'react';
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import * as chatApi from '../../api/chatApi';
import * as ordersApi from '../../api/ordersApi';
import AppButton from '../../components/common/AppButton';
import EmptyState from '../../components/common/EmptyState';
import FocusAwareStatusBar from '../../components/common/FocusAwareStatusBar';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { useToast } from '../../context/ToastContext';
import { colors, shadows, spacing, typography } from '../../theme';
import { getErrorMessage, getList } from '../../utils/apiResponse';
import { formatPrice } from '../../utils/formatters';
import { scale } from '../../utils/responsive';

const tabs = [
  { key: 'AVAILABLE', label: 'Disponibles' },
  { key: 'MINE', label: 'Mis entregas' },
];

export default function DeliveryOrdersScreen({ navigation }) {
  const { showError, showSuccess } = useToast();
  const [activeTab, setActiveTab] = useState('AVAILABLE');
  const [availableOrders, setAvailableOrders] = useState([]);
  const [myOrders, setMyOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [error, setError] = useState('');

  const loadOrders = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError('');

    try {
      const [availableResponse, mineResponse] = await Promise.all([
        ordersApi.getAvailableDeliveryOrders({ page: 0, size: 50 }),
        ordersApi.getMyDeliveryOrders({ page: 0, size: 50 }),
      ]);
      setAvailableOrders(getList(availableResponse));
      setMyOrders(getList(mineResponse));
    } catch (loadError) {
      const message = getErrorMessage(loadError, 'No pudimos cargar pedidos de delivery.');
      setError(message);
      showError(message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [showError]);

  useFocusEffect(
    useCallback(() => {
      loadOrders();
    }, [loadOrders])
  );

  const orders = useMemo(() => (
    activeTab === 'AVAILABLE' ? availableOrders : myOrders
  ), [activeTab, availableOrders, myOrders]);

  const runAction = async (order, action) => {
    setActionLoadingId(`${order.orderId}-${action}`);
    try {
      if (action === 'accept') {
        await ordersApi.acceptDeliveryOrder(order.orderId);
        showSuccess('Pedido aceptado');
      }
      if (action === 'pickup') {
        await ordersApi.pickupDeliveryOrder(order.orderId);
        showSuccess('Pedido en camino');
      }
      if (action === 'deliver') {
        await ordersApi.deliverDeliveryOrder(order.orderId);
        showSuccess('Pedido entregado');
      }
      await loadOrders(true);
    } catch (actionError) {
      showError(getErrorMessage(actionError, 'No pudimos actualizar el pedido.'));
    } finally {
      setActionLoadingId(null);
    }
  };

  const startDirectChat = async (recipientId, otherUsername, orderId) => {
    if (!recipientId) {
      showError('No encontramos el usuario para iniciar el chat.');
      return;
    }

    try {
      const response = await chatApi.startDirectConversation({ recipientId, orderId });
      const conversation = response.data?.data ?? response.data;
      navigation.navigate('Chat', {
        conversationId: conversation.id,
        otherUsername,
        buyerId: conversation.buyerId,
        sellerId: conversation.sellerId,
        conversationType: conversation.conversationType,
        orderId: conversation.orderId,
        returnToConversations: false,
      });
    } catch (chatError) {
      showError(getErrorMessage(chatError, 'No pudimos abrir el chat.'));
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <FocusAwareStatusBar style="dark" backgroundColor="transparent" translucent />
      <View style={styles.header}>
        <Text style={styles.title}>Delivery</Text>
        <Text style={styles.subtitle}>Recoge pedidos confirmados y marca entregas.</Text>
      </View>

      <View style={styles.tabs}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            activeOpacity={0.85}
            onPress={() => setActiveTab(tab.key)}
            style={[styles.tab, activeTab === tab.key && styles.activeTab]}
          >
            <Text style={[styles.tabText, activeTab === tab.key && styles.activeTabText]}>{tab.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      {loading ? (
        <LoadingSpinner />
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => String(item.orderId)}
          contentContainerStyle={orders.length ? styles.listContent : styles.emptyContent}
          refreshControl={(
            <RefreshControl
              tintColor={colors.primary}
              colors={[colors.primary]}
              refreshing={refreshing}
              onRefresh={() => loadOrders(true)}
            />
          )}
          renderItem={({ item }) => (
            <DeliveryOrderCard
              order={item}
              mode={activeTab}
              loadingId={actionLoadingId}
              onAccept={() => runAction(item, 'accept')}
              onPickup={() => runAction(item, 'pickup')}
              onDeliver={() => runAction(item, 'deliver')}
              onChatBuyer={() => startDirectChat(item.buyerId, item.buyerName ?? 'Cliente', item.orderId)}
              onChatSeller={(group) => startDirectChat(group.sellerId, group.sellerUsername ?? group.storeName, item.orderId)}
            />
          )}
          ListEmptyComponent={(
            <EmptyState
              emoji="🛵"
              title={activeTab === 'AVAILABLE' ? 'Sin pedidos disponibles' : 'Sin entregas activas'}
              subtitle="Cuando los vendedores confirmen pedidos, apareceran aqui."
            />
          )}
        />
      )}
    </SafeAreaView>
  );
}

function DeliveryOrderCard({ order, mode, loadingId, onAccept, onPickup, onDeliver, onChatBuyer, onChatSeller }) {
  const isReady = order.status === 'READY_FOR_PICKUP';
  const isProgress = order.status === 'IN_PROGRESS';

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View>
          <Text style={styles.orderTitle}>Pedido #{order.orderId}</Text>
          <Text style={styles.meta}>{order.buyerName}</Text>
        </View>
        <Text style={styles.total}>{formatPrice(order.totalAmount ?? 0)}</Text>
      </View>

      <View style={styles.addressRow}>
        <Ionicons name="location-outline" size={18} color={colors.primary} />
        <Text style={styles.address} numberOfLines={2}>{order.deliveryAddress ?? 'Direccion no disponible'}</Text>
      </View>

      <TouchableOpacity activeOpacity={0.85} onPress={onChatBuyer} style={styles.chatRowButton}>
        <Ionicons name="chatbubble-outline" size={17} color={colors.primary} />
        <Text style={styles.chatRowText}>Mensaje al cliente</Text>
      </TouchableOpacity>

      {order.vendorGroups?.map((group) => (
        <View key={`${order.orderId}-${group.storeName}`} style={styles.vendorGroup}>
          <View>
            <Text style={styles.vendorName}>{group.storeName}</Text>
            <Text style={styles.vendorMeta}>{group.items?.length ?? 0} producto(s)</Text>
          </View>
          <TouchableOpacity activeOpacity={0.82} onPress={() => onChatSeller(group)} style={styles.vendorChatButton}>
            <Ionicons name="chatbubble-ellipses-outline" size={16} color={colors.secondary} />
            <Text style={styles.vendorChatText}>Chat</Text>
          </TouchableOpacity>
        </View>
      ))}

      {mode === 'AVAILABLE' ? (
        <AppButton
          title="Aceptar pedido"
          onPress={onAccept}
          loading={loadingId === `${order.orderId}-accept`}
          fullWidth
        />
      ) : null}

      {mode === 'MINE' && isReady ? (
        <AppButton
          title="Marcar en camino"
          onPress={onPickup}
          loading={loadingId === `${order.orderId}-pickup`}
          fullWidth
        />
      ) : null}

      {mode === 'MINE' && isProgress ? (
        <AppButton
          title="Marcar entregado"
          onPress={onDeliver}
          loading={loadingId === `${order.orderId}-deliver`}
          fullWidth
        />
      ) : null}
    </View>
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
  tabs: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: scale(40),
    borderRadius: scale(20),
    backgroundColor: colors.surface,
  },
  activeTab: {
    backgroundColor: colors.primary,
  },
  tabText: {
    ...typography.small,
    color: colors.textSecondary,
    fontWeight: '800',
  },
  activeTabText: {
    color: colors.surface,
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
  listContent: {
    paddingBottom: 86,
  },
  emptyContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
  },
  card: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    padding: spacing.md,
    borderRadius: scale(14),
    backgroundColor: colors.surface,
    ...shadows.card,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  orderTitle: {
    ...typography.bodyBold,
  },
  meta: {
    ...typography.small,
    color: colors.textSecondary,
    marginTop: 2,
  },
  total: {
    ...typography.price,
    color: colors.primary,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.xs,
    marginVertical: spacing.md,
  },
  address: {
    ...typography.small,
    flex: 1,
    color: colors.textPrimary,
  },
  vendorGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  vendorName: {
    ...typography.small,
    fontWeight: '800',
  },
  vendorMeta: {
    ...typography.tiny,
    color: colors.textSecondary,
  },
  chatRowButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: spacing.xs,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 16,
    backgroundColor: colors.primaryLight,
  },
  chatRowText: {
    ...typography.small,
    color: colors.primary,
    fontWeight: '800',
  },
  vendorChatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: '#EAF8EF',
  },
  vendorChatText: {
    ...typography.tiny,
    color: colors.secondary,
    fontWeight: '800',
  },
});
