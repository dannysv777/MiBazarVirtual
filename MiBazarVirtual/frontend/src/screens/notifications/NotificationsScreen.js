import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useMemo, useState } from 'react';
import {
  FlatList,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import * as chatApi from '../../api/chatApi';
import * as ordersApi from '../../api/ordersApi';
import EmptyState from '../../components/common/EmptyState';
import SkeletonLoader from '../../components/common/SkeletonLoader';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';
import { colors, spacing, typography } from '../../theme';
import { formatRelativeTime } from '../../utils/formatters';
import { getChatPreviewText } from '../../utils/chatMessage';
import { getErrorMessage, getList } from '../../utils/apiResponse';

const tabs = [
  { key: 'chats', label: 'Chats', icon: 'chatbubble-outline' },
  { key: 'orders', label: 'Pedidos', icon: 'receipt-outline' },
  { key: 'news', label: 'Novedades', icon: 'sparkles-outline' },
  { key: 'promos', label: 'Promos', icon: 'pricetag-outline' },
];

const orderLabels = {
  PENDING: 'Pedido pendiente',
  CONFIRMED: 'Pedido confirmado',
  IN_PROGRESS: 'Pedido en camino',
  DELIVERED: 'Pedido entregado',
  CANCELLED: 'Pedido cancelado',
};

export default function NotificationsScreen({ navigation }) {
  const { user } = useAuth();
  const { unreadCount, refreshUnreadCount } = useChat();
  const [activeTab, setActiveTab] = useState('chats');
  const [conversations, setConversations] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const isSeller = user?.role === 'SELLER';

  const loadNotifications = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError('');

    try {
      const [conversationsResult, ordersResult] = await Promise.allSettled([
        chatApi.getConversations(),
        isSeller
          ? ordersApi.getSellerOrders({ page: 0, size: 20 })
          : ordersApi.getOrders({ page: 0, size: 20 }),
      ]);

      if (conversationsResult.status === 'fulfilled') {
        setConversations(getList(conversationsResult.value));
      }

      if (ordersResult.status === 'fulfilled') {
        setOrders(getList(ordersResult.value));
      }

      if (conversationsResult.status === 'rejected' && ordersResult.status === 'rejected') {
        throw conversationsResult.reason;
      }

      refreshUnreadCount();
    } catch (notificationError) {
      setError(getErrorMessage(notificationError, 'No pudimos cargar tus notificaciones.'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isSeller, refreshUnreadCount]);

  useFocusEffect(
    useCallback(() => {
      loadNotifications();
    }, [loadNotifications])
  );

  const notifications = useMemo(() => {
    if (activeTab === 'chats') {
      const totalUnread = conversations.reduce((sum, conversation) => (
        sum + Number(conversation.unreadCount ?? 0)
      ), 0);
      const lastConversation = conversations
        .filter((conversation) => conversation.lastMessage)
        .sort((a, b) => (
          new Date(b.lastMessageTime ?? b.updatedAt ?? 0) - new Date(a.lastMessageTime ?? a.updatedAt ?? 0)
        ))[0];

      return [
        {
          id: 'chat-summary',
          icon: 'chatbubble-ellipses-outline',
          title: totalUnread > 0 ? `${totalUnread} mensajes sin leer` : 'Mensajes',
          subtitle: lastConversation
            ? `Ultimo mensaje: ${getChatPreviewText(lastConversation.lastMessage)}`
            : 'Revisa tus conversaciones con compradores y vendedores.',
          time: lastConversation?.lastMessageTime ?? lastConversation?.updatedAt,
          unreadCount: totalUnread,
          onPress: () => navigation.navigate('Mensajes', { screen: 'Conversations' }),
        },
      ];
    }

    if (activeTab === 'orders') {
      return orders
        .filter((order) => ['PENDING', 'CONFIRMED', 'IN_PROGRESS', 'DELIVERED'].includes(order.status))
        .map((order) => ({
          id: `order-${order.id}`,
          icon: 'receipt-outline',
          title: orderLabels[order.status] ?? 'Actualizacion de pedido',
          subtitle: `${order.storeName ?? 'Tienda'} - Q ${Number(order.total ?? 0).toFixed(2)}`,
          time: order.updatedAt ?? order.createdAt,
          onPress: () => navigation.navigate('Pedidos', {
            screen: 'OrderDetail',
            params: { orderId: order.id, isSeller, order },
          }),
        }));
    }

    if (activeTab === 'news') {
      if (isSeller) {
        return [
          {
            id: 'seller-products',
            icon: 'cube-outline',
            title: 'Gestiona tus productos',
            subtitle: 'Actualiza stock, pausa publicaciones o agrega nuevos productos.',
            onPress: () => navigation.navigate('Productos', { screen: 'SellerProducts' }),
          },
          {
            id: 'seller-orders',
            icon: 'receipt-outline',
            title: 'Revisa pedidos recibidos',
            subtitle: 'Confirma pedidos pendientes y manten tus ventas al dia.',
            onPress: () => navigation.navigate('Pedidos', { screen: 'Orders' }),
          },
        ];
      }

      return [
        {
          id: 'news-weekly',
          icon: 'calendar-outline',
          title: 'Compra semanal disponible',
          subtitle: 'Revisa productos frecuentes y recomendaciones para repetir tu mercado.',
          onPress: () => navigation.navigate('WeeklyPurchase'),
        },
        {
          id: 'news-products',
          icon: 'leaf-outline',
          title: 'Productos frescos cerca de ti',
          subtitle: 'Explora nuevas tiendas y productos agregados recientemente.',
          onPress: () => navigation.navigate('ProductList', { title: 'Novedades' }),
        },
      ];
    }

    return [
      {
        id: 'promo-delivery',
        icon: 'bicycle-outline',
        title: 'Delivery destacado',
        subtitle: 'Busca tiendas activas y consulta costos de envio antes de pedir.',
        onPress: () => navigation.navigate('ProductList', { title: 'Promociones' }),
      },
      {
        id: 'promo-stores',
        icon: 'storefront-outline',
        title: 'Promociones de temporada',
        subtitle: 'Pronto veras ofertas especiales de vendedores locales aqui.',
        onPress: () => navigation.navigate('ProductList', { title: 'Ofertas' }),
      },
    ];
  }, [activeTab, conversations, isSeller, navigation, orders]);

  const renderNotification = ({ item }) => (
    <TouchableOpacity activeOpacity={0.82} onPress={item.onPress} style={styles.card}>
      <View style={styles.iconCircle}>
        <Ionicons name={item.icon} size={22} color={colors.primary} />
      </View>
      <View style={styles.cardBody}>
        <View style={styles.cardTop}>
          <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
          {item.time ? <Text style={styles.time}>{formatRelativeTime(item.time)}</Text> : null}
        </View>
        <Text style={styles.cardSubtitle} numberOfLines={2}>{item.subtitle}</Text>
      </View>
      {item.unreadCount > 0 ? (
        <View style={styles.unreadBadge}>
          <Text style={styles.unreadText}>{item.unreadCount > 9 ? '9+' : item.unreadCount}</Text>
        </View>
      ) : null}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" backgroundColor="transparent" translucent />
      <View style={styles.header}>
        <TouchableOpacity activeOpacity={0.8} onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerText}>
          <Text style={styles.title}>Notificaciones</Text>
          <Text style={styles.subtitle}>
            {unreadCount > 0 ? `${unreadCount} mensajes sin leer` : 'Actividad importante de tu cuenta'}
          </Text>
        </View>
      </View>

      <View style={styles.tabs}>
        {tabs.map((tab) => {
          const selected = activeTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              activeOpacity={0.82}
              onPress={() => setActiveTab(tab.key)}
              style={[styles.tabChip, selected ? styles.tabChipActive : styles.tabChipIdle]}
            >
              <Ionicons name={tab.icon} size={16} color={selected ? colors.surface : colors.textSecondary} />
              <Text style={[styles.tabText, selected ? styles.tabTextActive : styles.tabTextIdle]}>{tab.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {error ? (
        <View style={styles.errorCard}>
          <Ionicons name="alert-circle" size={20} color={colors.error} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity activeOpacity={0.75} onPress={() => loadNotifications()}>
            <Text style={styles.retryText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {loading ? (
        <View style={styles.skeletonList}>
          {[0, 1, 2, 3].map((item) => (
            <View key={item} style={styles.skeletonCard}>
              <SkeletonLoader width={44} height={44} borderRadius={22} />
              <View style={styles.skeletonText}>
                <SkeletonLoader width="55%" height={18} borderRadius={9} />
                <SkeletonLoader width="84%" height={14} borderRadius={7} />
              </View>
            </View>
          ))}
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          renderItem={renderNotification}
          contentContainerStyle={notifications.length ? styles.listContent : styles.emptyContent}
          refreshControl={(
            <RefreshControl
              tintColor={colors.primary}
              colors={[colors.primary]}
              refreshing={refreshing}
              onRefresh={() => loadNotifications(true)}
            />
          )}
          ListEmptyComponent={(
            <EmptyState
              emoji="🔔"
              title="Sin notificaciones"
              subtitle="Cuando haya actividad importante aparecera aqui."
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
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
  },
  backButton: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 21,
    backgroundColor: colors.surface,
  },
  headerText: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  title: {
    ...typography.h2,
  },
  subtitle: {
    ...typography.small,
    marginTop: 2,
    color: colors.textSecondary,
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    gap: 6,
  },
  tabChip: {
    height: 38,
    minWidth: 82,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 19,
    gap: 5,
    paddingHorizontal: 10,
  },
  tabChipActive: {
    backgroundColor: colors.primary,
  },
  tabChipIdle: {
    backgroundColor: colors.surface,
  },
  tabText: {
    ...typography.tiny,
    fontWeight: '800',
  },
  tabTextActive: {
    color: colors.surface,
  },
  tabTextIdle: {
    color: colors.textSecondary,
  },
  listContent: {
    padding: spacing.md,
    paddingBottom: 72,
  },
  emptyContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: spacing.md,
  },
  card: {
    minHeight: 76,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
    padding: spacing.md,
    borderRadius: 14,
    backgroundColor: colors.surface,
  },
  iconCircle: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
    backgroundColor: colors.primaryLight,
  },
  cardBody: {
    flex: 1,
    marginLeft: spacing.md,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardTitle: {
    ...typography.bodyBold,
    flex: 1,
    marginRight: spacing.sm,
  },
  time: {
    ...typography.tiny,
    color: colors.textLight,
  },
  cardSubtitle: {
    ...typography.small,
    marginTop: 3,
    color: colors.textSecondary,
  },
  unreadBadge: {
    minWidth: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: colors.error,
    paddingHorizontal: spacing.xs,
    marginLeft: spacing.sm,
  },
  unreadText: {
    ...typography.tiny,
    color: colors.surface,
    fontWeight: '800',
  },
  errorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
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
  skeletonList: {
    padding: spacing.md,
  },
  skeletonCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
    padding: spacing.md,
    borderRadius: 14,
    backgroundColor: colors.surface,
  },
  skeletonText: {
    flex: 1,
    gap: spacing.sm,
    marginLeft: spacing.md,
  },
});
