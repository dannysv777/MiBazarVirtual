import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { RectButton, Swipeable } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';

import * as notificationsApi from '../../api/notificationsApi';
import EmptyState from '../../components/common/EmptyState';
import FocusAwareStatusBar from '../../components/common/FocusAwareStatusBar';
import SkeletonLoader from '../../components/common/SkeletonLoader';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { useToast } from '../../context/ToastContext';
import { colors, spacing, typography } from '../../theme';
import { getErrorMessage, getList } from '../../utils/apiResponse';

const typeConfig = {
  ORDER_CONFIRMED: { emoji: '✅', bg: colors.accent },
  ORDER_IN_PROGRESS: { emoji: '🛵', bg: colors.warning },
  ORDER_DELIVERED: { emoji: '🎉', bg: colors.success },
  ORDER_CANCELLED: { emoji: '❌', bg: colors.error },
  NEW_MESSAGE: { emoji: '💬', bg: colors.primary },
  NEW_ORDER_RECEIVED: { emoji: '📦', bg: colors.secondary },
  REVIEW_RECEIVED: { emoji: '⭐', bg: colors.warning },
  PRODUCT_BACK_IN_STOCK: { emoji: '🔄', bg: colors.accent },
};

export default function NotificationsScreen({ navigation }) {
  const { user } = useAuth();
  const { unreadCount, markAllRead, refreshUnreadCount } = useNotifications();
  const { showError, showSuccess } = useToast();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const loadNotifications = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError('');

    try {
      const response = await notificationsApi.getNotifications({ page: 0, size: 30 });
      setNotifications(getList(response));
      await markAllRead();
    } catch (notificationError) {
      setError(getErrorMessage(notificationError, 'No pudimos cargar tus notificaciones.'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [markAllRead]);

  useFocusEffect(
    useCallback(() => {
      loadNotifications();
    }, [loadNotifications])
  );

  const handleMarkAllRead = async () => {
    try {
      await markAllRead();
      setNotifications((current) => current.map((item) => ({ ...item, isRead: true })));
      showSuccess('Notificaciones marcadas como leidas');
    } catch (markError) {
      showError(getErrorMessage(markError, 'No pudimos marcar tus notificaciones.'));
    }
  };

  const deleteNotification = async (id) => {
    const previous = notifications;
    setNotifications((current) => current.filter((item) => item.id !== id));

    try {
      await notificationsApi.deleteNotification(id);
      refreshUnreadCount();
    } catch (deleteError) {
      setNotifications(previous);
      showError(getErrorMessage(deleteError, 'No pudimos eliminar la notificacion.'));
    }
  };

  const navigateToTab = (tabName, screenName, params) => {
    const parentNavigation = navigation.getParent?.();
    const target = screenName ? { screen: screenName, params } : undefined;

    if (parentNavigation) {
      parentNavigation.navigate(tabName, target);
      return;
    }

    navigation.navigate(tabName, target);
  };

  const navigateFromNotification = async (notification) => {
    try {
      if (!notification.isRead) {
        await notificationsApi.markOneAsRead(notification.id);
        setNotifications((current) => current.map((item) => (
          item.id === notification.id ? { ...item, isRead: true } : item
        )));
        refreshUnreadCount();
      }
    } catch (readError) {
      showError(getErrorMessage(readError, 'No pudimos actualizar la notificacion.'));
    }

    const data = notification.data ?? {};
    if (notification.type?.startsWith('ORDER') || notification.type === 'NEW_ORDER_RECEIVED') {
      navigateToTab('Pedidos', 'OrderDetail', {
        orderId: data.orderId,
        isSeller: user?.role === 'SELLER' || notification.type === 'NEW_ORDER_RECEIVED',
      });
      return;
    }

    if (notification.type === 'NEW_MESSAGE') {
      navigateToTab('Mensajes', 'Chat', { conversationId: data.conversationId });
      return;
    }

    if (notification.type === 'PRODUCT_BACK_IN_STOCK') {
      navigation.navigate('ProductDetail', { productId: data.productId });
    }
  };

  const renderRightActions = (item) => (
    <RectButton style={styles.deleteAction} onPress={() => deleteNotification(item.id)}>
      <Ionicons name="trash-outline" size={22} color={colors.surface} />
    </RectButton>
  );

  const renderNotification = ({ item }) => {
    const config = typeConfig[item.type] ?? { emoji: '🔔', bg: colors.primary };

    return (
      <Swipeable renderRightActions={() => renderRightActions(item)}>
        <TouchableOpacity
          activeOpacity={0.84}
          onPress={() => navigateFromNotification(item)}
          style={[styles.card, !item.isRead && styles.cardUnread]}
        >
          {!item.isRead ? <View style={styles.unreadDot} /> : null}
          <View style={[styles.iconCircle, { backgroundColor: config.bg }]}>
            <Text style={styles.iconEmoji}>{config.emoji}</Text>
          </View>
          <View style={styles.cardBody}>
            <View style={styles.cardTop}>
              <Text style={[styles.cardTitle, !item.isRead && styles.cardTitleUnread]} numberOfLines={1}>
                {item.title}
              </Text>
              <Text style={styles.time}>{item.timeAgo}</Text>
            </View>
            <Text style={styles.cardSubtitle} numberOfLines={2}>{item.body}</Text>
          </View>
        </TouchableOpacity>
      </Swipeable>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <FocusAwareStatusBar style="dark" backgroundColor="transparent" translucent />
      <View style={styles.header}>
        <TouchableOpacity activeOpacity={0.8} onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerText}>
          <Text style={styles.title}>Notificaciones</Text>
          <Text style={styles.subtitle}>Novedades de pedidos, mensajes y tienda</Text>
        </View>
        {unreadCount > 0 ? (
          <TouchableOpacity activeOpacity={0.78} onPress={handleMarkAllRead} style={styles.readAllButton}>
            <Text style={styles.readAllText}>Leer todo</Text>
          </TouchableOpacity>
        ) : null}
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
          keyExtractor={(item) => item.id.toString()}
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
              subtitle="Te avisaremos cuando haya novedades en tus pedidos y mensajes"
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
    color: colors.textSecondary,
    marginTop: 2,
  },
  readAllButton: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 999,
    backgroundColor: colors.primaryLight,
  },
  readAllText: {
    ...typography.tiny,
    color: colors.primary,
    fontWeight: '800',
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
    minHeight: 78,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
    padding: spacing.md,
    borderRadius: 14,
    backgroundColor: colors.surface,
  },
  cardUnread: {
    backgroundColor: colors.primaryLight,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
    marginRight: spacing.sm,
  },
  iconCircle: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
  },
  iconEmoji: {
    fontSize: 22,
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
    ...typography.body,
    flex: 1,
    color: colors.textPrimary,
    marginRight: spacing.sm,
  },
  cardTitleUnread: {
    ...typography.bodyBold,
  },
  cardSubtitle: {
    ...typography.small,
    marginTop: 3,
    color: colors.textSecondary,
  },
  time: {
    ...typography.tiny,
    color: colors.textLight,
    textAlign: 'right',
  },
  deleteAction: {
    width: 76,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
    borderRadius: 14,
    backgroundColor: colors.error,
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
