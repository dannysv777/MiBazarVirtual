import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useEffect, useState } from 'react';
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import AppBadge from '../../components/common/AppBadge';
import AppButton from '../../components/common/AppButton';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import SkeletonLoader from '../../components/common/SkeletonLoader';
import * as chatApi from '../../api/chatApi';
import { getProduct } from '../../api/productsApi';
import { useCart } from '../../context/CartContext';
import { colors, shadows, spacing, typography } from '../../theme';
import { formatPrice, getErrorMessage, getPayload } from '../../utils/apiResponse';

const getProductImage = (product) => (
  product?.imageUrl ?? product?.mainImageUrl ?? product?.images?.[0]?.url ?? null
);

const getStore = (product) => product?.store ?? {
  id: product?.storeId,
  name: product?.storeName,
  rating: product?.storeRating,
  sellerId: product?.sellerId,
};

export default function ProductDetailScreen({ navigation, route }) {
  const { productId } = route.params;
  const { addItem } = useCart();
  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [startingChat, setStartingChat] = useState(false);
  const [error, setError] = useState('');
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const loadProduct = async () => {
      setLoading(true);
      setError('');

      try {
        const response = await getProduct(productId);
        setProduct(getPayload(response));
      } catch (productError) {
        setError(getErrorMessage(productError, 'No pudimos cargar el producto.'));
      } finally {
        setLoading(false);
      }
    };

    loadProduct();
  }, [productId]);

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <SkeletonLoader width="100%" height={280} borderRadius={0} />
        <View style={styles.loadingContent}>
          <SkeletonLoader width="40%" height={24} borderRadius={12} />
          <SkeletonLoader width="86%" height={32} borderRadius={12} />
          <SkeletonLoader width="55%" height={28} borderRadius={12} />
          <LoadingSpinner size="small" />
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centerState}>
          <Text style={styles.errorText}>{error}</Text>
          <AppButton title="Volver" variant="outline" onPress={() => navigation.goBack()} />
        </View>
      </SafeAreaView>
    );
  }

  const imageUrl = getProductImage(product);
  const store = getStore(product);
  const stock = Number(product.stock ?? 0);
  const description = product.description ?? 'Sin descripción disponible.';
  const canToggleDescription = description.length > 100;

  const handleAddToCart = () => {
    addItem(product, quantity);
  };

  const handleChat = async () => {
    const sellerId = store?.sellerId ?? product?.sellerId;

    if (!sellerId) {
      Alert.alert('Error', 'No encontramos el vendedor de este producto.');
      return;
    }

    setStartingChat(true);

    try {
      const response = await chatApi.startConversation({
        productId: product.id,
        sellerId,
      });
      const conversation = getPayload(response);

      navigation.navigate('Chat', {
        conversationId: conversation.id,
        otherUsername: store?.name ?? conversation.otherParticipantUsername ?? 'Tienda',
        productId: product.id,
      });
    } catch (chatError) {
      Alert.alert('Error', getErrorMessage(chatError, 'No se pudo iniciar la conversación.'));
    } finally {
      setStartingChat(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.imageWrap}>
          {imageUrl ? (
            <Image source={{ uri: imageUrl }} style={styles.image} contentFit="cover" />
          ) : (
            <View style={styles.fallbackImage}>
              <Text style={styles.fallbackEmoji}>🍽️</Text>
            </View>
          )}
          <TouchableOpacity activeOpacity={0.85} onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>

        <View style={styles.contentCard}>
          <AppBadge label={product.category?.name ?? product.categoryName ?? 'Producto'} variant="accent" />
          <Text style={styles.name}>{product.name}</Text>
          <View style={styles.priceRow}>
            <Text style={styles.price}>{formatPrice(product.price)}</Text>
            <Text style={styles.unit}>/{product.unit ?? 'u'}</Text>
          </View>

          <StockIndicator stock={stock} />

          <View style={styles.divider} />

          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => store?.id && navigation.navigate('StoreDetail', { storeId: store.id })}
            style={styles.storeRow}
          >
            <View style={styles.storeIcon}>
              <Ionicons name="storefront-outline" size={22} color={colors.secondary} />
            </View>
            <View style={styles.storeInfo}>
              <Text style={styles.storeName}>{store?.name ?? 'Tienda'}</Text>
              <Text style={styles.storeRating}>⭐ {Number(store?.rating ?? store?.averageRating ?? 0).toFixed(1)}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </TouchableOpacity>

          <Text style={styles.descriptionTitle}>Descripción</Text>
          <Text style={styles.description} numberOfLines={expanded ? undefined : 3}>
            {description}
          </Text>
          {canToggleDescription ? (
            <TouchableOpacity activeOpacity={0.7} onPress={() => setExpanded((current) => !current)}>
              <Text style={styles.moreText}>{expanded ? 'Ver menos' : 'Ver más'}</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </ScrollView>

      <View style={styles.bottomBar}>
        <View style={styles.quantitySelector}>
          <TouchableOpacity
            activeOpacity={0.8}
            disabled={quantity === 1}
            onPress={() => setQuantity((current) => Math.max(1, current - 1))}
            style={[styles.quantityButton, styles.quantityOutline, quantity === 1 && styles.disabledButton]}
          >
            <Ionicons name="remove" size={18} color={colors.primary} />
          </TouchableOpacity>
          <Text style={styles.quantityText}>{quantity}</Text>
          <TouchableOpacity
            activeOpacity={0.8}
            disabled={quantity >= stock}
            onPress={() => setQuantity((current) => Math.min(stock, current + 1))}
            style={[styles.quantityButton, styles.quantityFilled, quantity >= stock && styles.disabledButton]}
          >
            <Ionicons name="add" size={18} color={colors.surface} />
          </TouchableOpacity>
        </View>
        <View style={styles.cartButtonWrap}>
          <AppButton title="Agregar al carrito" onPress={handleAddToCart} disabled={stock === 0} fullWidth />
        </View>
        <TouchableOpacity activeOpacity={0.85} disabled={startingChat} onPress={handleChat} style={styles.chatButton}>
          <Ionicons name={startingChat ? 'ellipsis-horizontal' : 'chatbubble-outline'} size={20} color={colors.secondary} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

function StockIndicator({ stock }) {
  if (stock > 10) {
    return <Indicator color={colors.success} text="Disponible" />;
  }

  if (stock > 0) {
    return <Indicator color={colors.warning} text={`Pocas unidades (${stock})`} />;
  }

  return <Indicator color={colors.error} text="Agotado" />;
}

function Indicator({ color, text }) {
  return (
    <View style={styles.stockRow}>
      <View style={[styles.stockDot, { backgroundColor: color }]} />
      <Text style={[styles.stockText, { color }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  scrollContent: {
    paddingBottom: 112,
  },
  imageWrap: {
    height: 280,
  },
  image: {
    width: '100%',
    height: 280,
  },
  fallbackImage: {
    height: 280,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  fallbackEmoji: {
    fontSize: 48,
  },
  backButton: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.md,
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    backgroundColor: colors.surface,
  },
  contentCard: {
    marginTop: -24,
    padding: spacing.md,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: colors.surface,
  },
  loadingContent: {
    gap: spacing.md,
    padding: spacing.md,
  },
  centerState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    padding: spacing.md,
  },
  errorText: {
    ...typography.small,
    color: colors.error,
    textAlign: 'center',
  },
  name: {
    ...typography.h2,
    marginTop: spacing.sm,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginTop: spacing.sm,
  },
  price: {
    ...typography.price,
  },
  unit: {
    ...typography.small,
    marginLeft: spacing.xs,
  },
  stockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
  },
  stockDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: spacing.sm,
  },
  stockText: {
    ...typography.small,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.md,
  },
  storeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: spacing.sm,
  },
  storeIcon: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 21,
    backgroundColor: colors.surface,
  },
  storeInfo: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  storeName: {
    ...typography.bodyBold,
  },
  storeRating: {
    ...typography.small,
    marginTop: 2,
  },
  descriptionTitle: {
    ...typography.bodyBold,
    marginTop: spacing.lg,
  },
  description: {
    ...typography.body,
    color: colors.textSecondary,
    lineHeight: 22,
    marginTop: spacing.sm,
  },
  moreText: {
    ...typography.small,
    color: colors.primary,
    fontWeight: '700',
    marginTop: spacing.sm,
  },
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    ...shadows.strong,
  },
  quantitySelector: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
  },
  quantityOutline: {
    borderWidth: 1,
    borderColor: colors.primary,
  },
  quantityFilled: {
    backgroundColor: colors.primary,
  },
  disabledButton: {
    opacity: 0.45,
  },
  quantityText: {
    ...typography.bodyBold,
    minWidth: 30,
    textAlign: 'center',
  },
  cartButtonWrap: {
    flex: 1,
    marginLeft: spacing.md,
  },
  chatButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.secondary,
    marginLeft: spacing.sm,
  },
});
