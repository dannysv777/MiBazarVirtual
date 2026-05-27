import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import * as chatApi from '../../api/chatApi';
import * as ordersApi from '../../api/ordersApi';
import AppImage from '../../components/common/AppImage';
import AppButton from '../../components/common/AppButton';
import FocusAwareStatusBar from '../../components/common/FocusAwareStatusBar';
import AppInput from '../../components/common/AppInput';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import OrderStatusBadge from '../../components/orders/OrderStatusBadge';
import { useToast } from '../../context/ToastContext';
import { colors, shadows, spacing, typography } from '../../theme';
import { formatDateTime, formatPrice } from '../../utils/formatters';
import { getErrorMessage, getPayload } from '../../utils/apiResponse';

const steps = [
  { status: 'PENDING', label: 'Pendiente' },
  { status: 'CONFIRMED', label: 'Confirmado' },
  { status: 'READY_FOR_PICKUP', label: 'Listo' },
  { status: 'IN_PROGRESS', label: 'En camino' },
  { status: 'DELIVERED', label: 'Entregado' },
];

const nextStatusMap = {
  PENDING: { status: 'CONFIRMED', label: 'Confirmar productos disponibles' },
  PARTIALLY_CONFIRMED: { status: 'CONFIRMED', label: 'Confirmar productos disponibles' },
};

export default function OrderDetailScreen({ navigation, route }) {
  const { orderId, isSeller, order: initialOrder } = route.params;
  const { showError, showSuccess } = useToast();
  const [order, setOrder] = useState(initialOrder ?? null);
  const [loading, setLoading] = useState(!initialOrder);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [reviewVisible, setReviewVisible] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const loadOrder = useCallback(async () => {
    if (isSeller && initialOrder) {
      setOrder(initialOrder);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = isSeller
        ? await ordersApi.getSellerOrder(orderId)
        : await ordersApi.getOrder(orderId);
      setOrder(getPayload(response));
    } catch (detailError) {
      setError(getErrorMessage(detailError, 'No pudimos cargar el pedido.'));
    } finally {
      setLoading(false);
    }
  }, [initialOrder, isSeller, orderId]);

  useEffect(() => {
    loadOrder();
  }, [loadOrder]);

  const handleBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
      return;
    }

    navigation.getParent()?.navigate('Pedidos', { screen: isSeller ? 'SellerOrders' : 'Orders' });
  };

  const refreshAfterAction = async () => {
    if (isSeller) {
      handleBack();
      return;
    }
    await loadOrder();
  };

  const handleCancel = () => {
    Alert.alert('Cancelar pedido', '¿Deseas cancelar este pedido?', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Cancelar pedido',
        style: 'destructive',
        onPress: async () => {
          setActionLoading(true);
          try {
            const response = await ordersApi.cancelOrder(orderId);
            setOrder(getPayload(response));
            showSuccess('Pedido cancelado');
            handleBack();
          } catch (cancelError) {
            showError(getErrorMessage(cancelError));
          } finally {
            setActionLoading(false);
          }
        },
      },
    ]);
  };

  const handleSellerAction = async () => {
    const next = nextStatusMap[order.status];
    if (!next) return;

    setActionLoading(true);
    try {
      const pendingItems = (order.items ?? []).filter((item) => (item.itemStatus ?? 'PENDING') === 'PENDING');
      const response = pendingItems.length && pendingItems.every((item) => item.id)
        ? await confirmSellerItems(pendingItems)
        : await ordersApi.updateOrderStatus(orderId, next.status);
      setOrder(getPayload(response));
      showSuccess('Productos confirmados correctamente');
      await refreshAfterAction();
    } catch (statusError) {
      showError(getErrorMessage(statusError));
    } finally {
      setActionLoading(false);
    }
  };

  const handleContactDelivery = async () => {
    if (!order?.deliveryWorkerId) {
      showError('Aun no hay repartidor asignado a este pedido.');
      return;
    }

    setActionLoading(true);
    try {
      const response = await chatApi.startDirectConversation({
        recipientId: order.deliveryWorkerId,
        orderId: order.id,
      });
      const conversation = getPayload(response);
      navigation.navigate('Chat', {
        conversationId: conversation.id,
        otherUsername: order.deliveryWorkerName ?? conversation.otherParticipantUsername ?? 'Delivery',
        buyerId: conversation.buyerId,
        sellerId: conversation.sellerId,
        conversationType: conversation.conversationType,
        orderId: conversation.orderId,
        returnToConversations: false,
      });
    } catch (chatError) {
      showError(getErrorMessage(chatError, 'No pudimos abrir el chat con delivery.'));
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <FocusAwareStatusBar style="dark" backgroundColor="transparent" translucent />
        <LoadingSpinner />
      </SafeAreaView>
    );
  }

  if (error || !order) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <FocusAwareStatusBar style="dark" backgroundColor="transparent" translucent />
        <View style={styles.centerState}>
          <Text style={styles.errorText}>{error}</Text>
          <AppButton title="Volver" variant="outline" onPress={handleBack} />
        </View>
      </SafeAreaView>
    );
  }

  const hasPendingSellerItems = (order.items ?? []).some((item) => (item.itemStatus ?? 'PENDING') === 'PENDING');
  const sellerAction = hasPendingSellerItems ? nextStatusMap[order.status] : null;

  return (
    <SafeAreaView style={styles.safeArea}>
      <FocusAwareStatusBar style="dark" backgroundColor="transparent" translucent />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
          </TouchableOpacity>
          <View style={styles.headerText}>
            <Text style={styles.title}>Pedido #{order.id}</Text>
            <Text style={styles.date}>{formatDateTime(order.createdAt)}</Text>
          </View>
          <OrderStatusBadge status={order.status} />
        </View>

        <StatusTimeline status={order.status} />
        <OrderItemsCard order={order} />
        <StoreInfoCard order={order} navigation={navigation} />

        {successMessage ? <Text style={styles.successText}>{successMessage}</Text> : null}

        {order.deliveryWorkerId ? (
          <AppButton
            title="Mensaje al repartidor"
            variant="outline"
            onPress={handleContactDelivery}
            loading={actionLoading}
            fullWidth
          />
        ) : null}

        {!isSeller && order.status === 'PENDING' ? (
          <AppButton
            title="Cancelar pedido"
            variant="danger"
            onPress={handleCancel}
            loading={actionLoading}
            fullWidth
          />
        ) : null}

        {!isSeller && order.status === 'DELIVERED' ? (
          <AppButton
            title="Calificar pedido"
            variant="outline"
            onPress={() => setReviewVisible(true)}
            fullWidth
          />
        ) : null}

        {isSeller && sellerAction ? (
          <AppButton
            title={sellerAction.label}
            onPress={handleSellerAction}
            loading={actionLoading}
            fullWidth
          />
        ) : null}

        {isSeller && !sellerAction ? (
          <View style={styles.sellerInfoCard}>
            <Ionicons name="bicycle-outline" size={22} color={colors.secondary} />
            <View style={styles.sellerInfoText}>
              <Text style={styles.sellerInfoTitle}>Pedido confirmado</Text>
              <Text style={styles.sellerInfoBody}>
                Prepara estos productos y entregalos al repartidor cuando llegue.
              </Text>
            </View>
          </View>
        ) : null}
      </ScrollView>

      <ReviewBottomSheet
        visible={reviewVisible}
        onClose={() => setReviewVisible(false)}
        orderId={order.id}
        onSuccess={async () => {
          setReviewVisible(false);
          setSuccessMessage('Gracias por tu calificación.');
          showSuccess('Gracias por tu calificacion');
          await loadOrder();
        }}
      />
    </SafeAreaView>
  );

  async function confirmSellerItems(pendingItems) {
    let response = null;
    for (const item of pendingItems) {
      response = await ordersApi.confirmOrderItem(orderId, item.id, {
        available: true,
        note: 'Confirmado por vendedor',
      });
    }
    return response;
  }
}

function StatusTimeline({ status }) {
  const normalizedStatus = status === 'PARTIALLY_CONFIRMED' ? 'PENDING' : status;
  const currentIndex = steps.findIndex((step) => step.status === normalizedStatus);
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.1, duration: 700, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: true }),
      ])
    ).start();
  }, [pulse]);

  return (
    <View style={styles.timelineCard}>
      <View style={styles.timelineRow}>
        {steps.map((step, index) => {
          const completed = currentIndex > index || status === 'DELIVERED';
          const current = currentIndex === index && status !== 'DELIVERED';
          const Circle = current ? Animated.View : View;

          return (
            <View key={step.status} style={styles.stepWrap}>
              {index > 0 ? <View style={[styles.line, index <= currentIndex && styles.activeLine]} /> : null}
              <Circle style={[
                styles.stepCircle,
                completed && styles.completedCircle,
                current && styles.currentCircle,
                current && { transform: [{ scale: pulse }] },
              ]}>
                {completed ? <Ionicons name="checkmark" size={18} color={colors.surface} /> : null}
              </Circle>
              <Text style={[styles.stepLabel, (completed || current) && styles.activeStepLabel]}>{step.label}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

function OrderItemsCard({ order }) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Productos</Text>
      {order.items?.map((item) => (
        <View key={`${item.productId}-${item.productName}`} style={styles.orderItemRow}>
          <AppImage uri={item.productImageUrl} style={styles.productImage} fallbackEmoji="🛒" />
          <View style={styles.productInfo}>
            <Text style={styles.productName}>{item.productName}</Text>
            <Text style={styles.productMeta}>{item.quantity} × {formatPrice(item.unitPrice)}</Text>
          </View>
          <Text style={styles.productSubtotal}>{formatPrice(item.subtotal)}</Text>
        </View>
      ))}
      <View style={styles.divider} />
      <SummaryRow label="Subtotal" value={formatPrice(order.subtotal)} />
      <SummaryRow label="Envío" value={formatPrice(order.deliveryFee)} />
      <SummaryRow label="Total" value={formatPrice(order.total)} strong />
    </View>
  );
}

function StoreInfoCard({ order, navigation }) {
  const canOpenStore = Boolean(order.storeId);

  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Tienda</Text>
      <Text style={styles.storeName}>{order.storeName}</Text>
      <Text style={styles.storeCity}>{order.deliveryType === 'PICKUP' ? 'Recoger en tienda' : order.deliveryAddress}</Text>
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => navigation.navigate('StoreDetail', { storeId: order.storeId })}
        disabled={!canOpenStore}
        style={[styles.storeLink, !canOpenStore && styles.disabledStoreLink]}
      >
        <Text style={[styles.storeLinkText, !canOpenStore && styles.disabledStoreLinkText]}>
          {canOpenStore ? 'Ver tienda' : 'Pedido de varias tiendas'}
        </Text>
        {canOpenStore ? <Ionicons name="chevron-forward" size={16} color={colors.primary} /> : null}
      </TouchableOpacity>
    </View>
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

function ReviewBottomSheet({ visible, onClose, orderId, onSuccess }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  const submitReview = async () => {
    setLoading(true);
    try {
      await ordersApi.createReview(orderId, { rating, comment });
      setComment('');
      setRating(5);
      await onSuccess();
    } catch (reviewError) {
      Alert.alert('No se pudo calificar', getErrorMessage(reviewError));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.sheetOverlay}>
        <View style={styles.sheet}>
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>Calificar pedido</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={22} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
          <View style={styles.stars}>
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity key={star} onPress={() => setRating(star)}>
                <Ionicons
                  name={star <= rating ? 'star' : 'star-outline'}
                  size={34}
                  color={colors.warning}
                />
              </TouchableOpacity>
            ))}
          </View>
          <AppInput
            multiline
            label="Comentario"
            placeholder="Cuéntanos tu experiencia..."
            value={comment}
            onChangeText={setComment}
          />
          <AppButton title="Enviar calificación" onPress={submitReview} loading={loading} fullWidth />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 19,
    backgroundColor: colors.surface,
    marginRight: spacing.sm,
  },
  headerText: {
    flex: 1,
  },
  title: {
    ...typography.h2,
  },
  date: {
    ...typography.small,
    marginTop: 2,
  },
  centerState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
    gap: spacing.md,
  },
  errorText: {
    ...typography.small,
    color: colors.error,
    textAlign: 'center',
  },
  timelineCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    ...shadows.card,
  },
  timelineRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  stepWrap: {
    flex: 1,
    alignItems: 'center',
  },
  line: {
    position: 'absolute',
    top: 18,
    left: '-50%',
    right: '50%',
    height: 2,
    backgroundColor: colors.border,
  },
  activeLine: {
    backgroundColor: colors.primary,
  },
  stepCircle: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  completedCircle: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  currentCircle: {
    borderColor: colors.primary,
  },
  stepLabel: {
    ...typography.tiny,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  activeStepLabel: {
    color: colors.primary,
    fontWeight: '700',
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    ...shadows.card,
  },
  cardTitle: {
    ...typography.bodyBold,
    marginBottom: spacing.sm,
  },
  orderItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  productImage: {
    width: 48,
    height: 48,
    borderRadius: 8,
  },
  productFallback: {
    width: 48,
    height: 48,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  productInfo: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  productName: {
    ...typography.bodyBold,
  },
  productMeta: {
    ...typography.small,
    marginTop: 2,
  },
  productSubtotal: {
    ...typography.bodyBold,
    color: colors.primary,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.sm,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
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
  storeName: {
    ...typography.bodyBold,
  },
  storeCity: {
    ...typography.small,
    marginTop: spacing.xs,
  },
  storeLink: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
  },
  disabledStoreLink: {
    opacity: 0.7,
  },
  storeLinkText: {
    ...typography.small,
    color: colors.primary,
    fontWeight: '700',
  },
  disabledStoreLinkText: {
    color: colors.textSecondary,
  },
  sellerInfoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: 12,
    backgroundColor: '#EAF8EF',
  },
  sellerInfoText: {
    flex: 1,
  },
  sellerInfoTitle: {
    ...typography.bodyBold,
    color: colors.secondary,
  },
  sellerInfoBody: {
    ...typography.small,
    color: colors.textSecondary,
    marginTop: 2,
  },
  successText: {
    ...typography.small,
    color: colors.success,
    backgroundColor: '#E8F8ED',
    padding: spacing.sm,
    borderRadius: 10,
    textAlign: 'center',
  },
  sheetOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: colors.overlay,
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    padding: spacing.md,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sheetTitle: {
    ...typography.h3,
  },
  stars: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
    marginVertical: spacing.lg,
  },
});
