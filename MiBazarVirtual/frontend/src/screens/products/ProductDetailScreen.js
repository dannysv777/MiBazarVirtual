import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import AppBadge from '../../components/common/AppBadge';
import AppImage from '../../components/common/AppImage';
import AppButton from '../../components/common/AppButton';
import FavoriteButton from '../../components/common/FavoriteButton';
import FocusAwareStatusBar from '../../components/common/FocusAwareStatusBar';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import SkeletonLoader from '../../components/common/SkeletonLoader';
import ProductCard from '../../components/home/ProductCard';
import StoreStatusBadge from '../../components/stores/StoreStatusBadge';
import * as chatApi from '../../api/chatApi';
import * as favoritesApi from '../../api/favoritesApi';
import * as recommendationsApi from '../../api/recommendationsApi';
import { getProduct } from '../../api/productsApi';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { colors, shadows, spacing, typography } from '../../theme';
import { formatPrice } from '../../utils/formatters';
import { getErrorMessage, getList, getPayload } from '../../utils/apiResponse';
import { hp, scale } from '../../utils/responsive';
import { isStoreOpen } from '../../utils/storeSchedule';

const getProductImage = (product) => (
  product?.imageUrl
  ?? product?.mainImageUrl
  ?? product?.coverImage
  ?? product?.productImageUrl
  ?? product?.image
  ?? product?.images?.[0]?.url
  ?? null
);

const getStore = (product) => product?.store ?? {
  id: product?.storeId,
  name: product?.storeName,
  schedule: product?.storeSchedule,
  rating: product?.storeRating,
  sellerId: product?.sellerId,
};

export default function ProductDetailScreen({ navigation, route }) {
  const { productId } = route.params;
  const { user } = useAuth();
  const { addItem } = useCart();
  const insets = useSafeAreaInsets();
  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [startingChat, setStartingChat] = useState(false);
  const [error, setError] = useState('');
  const [expanded, setExpanded] = useState(false);
  const [similarProducts, setSimilarProducts] = useState([]);
  const [initialIsFavorite, setInitialIsFavorite] = useState(false);

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

  useEffect(() => {
    const loadSimilarProducts = async () => {
      try {
        const response = await recommendationsApi.getSimilarProducts(productId, 6);
        setSimilarProducts(getList(response));
      } catch (similarError) {
        setSimilarProducts([]);
      }
    };

    loadSimilarProducts();
  }, [productId]);

  useEffect(() => {
    const loadFavoriteState = async () => {
      if (user?.role !== 'BUYER') {
        setInitialIsFavorite(false);
        return;
      }

      try {
        const response = await favoritesApi.checkIsFavorite(productId);
        setInitialIsFavorite(Boolean(getPayload(response)?.isFavorite));
      } catch (favoriteError) {
        setInitialIsFavorite(false);
      }
    };

    loadFavoriteState();
  }, [productId, user?.role]);

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <FocusAwareStatusBar style="dark" backgroundColor="transparent" translucent />
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
        <FocusAwareStatusBar style="dark" backgroundColor="transparent" translucent />
        <View style={styles.centerState}>
          <Text style={styles.errorText}>{error}</Text>
          <AppButton title="Volver" variant="outline" onPress={() => navigation.goBack()} />
        </View>
      </SafeAreaView>
    );
  }

  const imageUrl = getProductImage(product);
  const store = getStore(product);
  const storeOpenState = isStoreOpen(store?.schedule ?? store?.openingHours);
  const stock = Number(product.stock ?? 0);
  const description = product.description ?? 'Sin descripción disponible.';
  const canToggleDescription = description.length > 100;
  const canBuy = user?.role === 'BUYER';
  const canChat = user?.role === 'BUYER' && stock > 0;

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
      const conversationsResponse = await chatApi.getConversations();
      const existingConversation = getList(conversationsResponse).find((conversation) => (
        Number(conversation.sellerId) === Number(sellerId)
      ));

      if (existingConversation) {
        navigation.navigate('Chat', {
          conversationId: existingConversation.id,
          otherUsername: store?.name ?? existingConversation.otherParticipantUsername ?? 'Tienda',
          productId: existingConversation.productId ?? product.id,
          storeId: store?.id,
          conversationType: existingConversation.conversationType,
          otherProfileImage: existingConversation.otherParticipantProfileImage,
          orderId: existingConversation.orderId,
          productContext: {
            id: product.id,
            name: product.name,
            imageUrl,
            price: product.price,
            unit: product.unit,
            storeId: store?.id,
            storeName: store?.name,
          },
        });
        return;
      }

      const response = await chatApi.startConversation({
        productId: product.id,
        sellerId,
      });
      const conversation = getPayload(response);

      navigation.navigate('Chat', {
        conversationId: conversation.id,
        otherUsername: store?.name ?? conversation.otherParticipantUsername ?? 'Tienda',
        productId: product.id,
        storeId: store?.id,
        conversationType: conversation.conversationType,
        otherProfileImage: conversation.otherParticipantProfileImage,
        orderId: conversation.orderId,
        productContext: {
          id: product.id,
          name: product.name,
          imageUrl,
          price: product.price,
          unit: product.unit,
          storeId: store?.id,
          storeName: store?.name,
        },
      });
    } catch (chatError) {
      Alert.alert('Error', getErrorMessage(chatError, 'No se pudo iniciar la conversación.'));
    } finally {
      setStartingChat(false);
    }
  };

  return (
    <SafeAreaView edges={['left', 'right', 'bottom']} style={styles.safeArea}>
      <FocusAwareStatusBar style="light" backgroundColor="transparent" translucent />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.imageWrap}>
          <AppImage uri={imageUrl} style={styles.image} fallbackEmoji="🍽️" />
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => navigation.goBack()}
            style={[styles.backButton, { top: insets.top + spacing.sm }]}
          >
            <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
          </TouchableOpacity>
          {user?.role === 'BUYER' ? (
            <FavoriteButton
              productId={product.id}
              initialIsFavorite={initialIsFavorite}
              size={24}
              style={[styles.favoriteButton, { top: insets.top + spacing.sm }]}
              onChange={setInitialIsFavorite}
            />
          ) : null}
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
              <View style={styles.storeNameRow}>
                <Text style={styles.storeName} numberOfLines={1}>{store?.name ?? 'Tienda'}</Text>
                <StoreStatusBadge schedule={store?.schedule ?? store?.openingHours} compact />
              </View>
              <Text style={styles.storeRating}>⭐ {Number(store?.rating ?? store?.averageRating ?? 0).toFixed(1)}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
          {storeOpenState.isOpen === false ? (
            <Text style={styles.closedWarning}>
              Esta tienda esta cerrada ahora. Puedes hacer tu pedido y sera atendido cuando abra.
            </Text>
          ) : null}

          <Text style={styles.descriptionTitle}>Descripción</Text>
          <Text style={styles.description} numberOfLines={expanded ? undefined : 3}>
            {description}
          </Text>
          {canToggleDescription ? (
            <TouchableOpacity activeOpacity={0.7} onPress={() => setExpanded((current) => !current)}>
              <Text style={styles.moreText}>{expanded ? 'Ver menos' : 'Ver más'}</Text>
            </TouchableOpacity>
          ) : null}

          {similarProducts.length >= 2 ? (
            <View style={styles.similarSection}>
              <Text style={styles.similarTitle}>Tambien te puede gustar</Text>
              <FlatList
                data={similarProducts}
                horizontal
                keyExtractor={(item) => item.id.toString()}
                showsHorizontalScrollIndicator={false}
                renderItem={({ item }) => (
                  <ProductCard
                    product={item}
                    onPress={() => navigation.replace('ProductDetail', { productId: item.id })}
                  />
                )}
              />
            </View>
          ) : null}
        </View>
      </ScrollView>

      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
        {canBuy ? (
          <>
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
          </>
        ) : (
          <View style={styles.roleHintWrap}>
            <Text style={styles.roleHint}>
              Vista de {user?.role === 'ADMIN' ? 'administrador' : 'vendedor'}
            </Text>
          </View>
        )}
        {canChat ? (
          <TouchableOpacity activeOpacity={0.85} disabled={startingChat} onPress={handleChat} style={styles.chatButton}>
            <Ionicons name={startingChat ? 'ellipsis-horizontal' : 'chatbubble-outline'} size={20} color={colors.secondary} />
          </TouchableOpacity>
        ) : null}
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
    height: Math.max(hp(36), 280),
    position: 'relative',
    backgroundColor: colors.background,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  fallbackImage: {
    height: hp(35),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  fallbackEmoji: {
    fontSize: 48,
  },
  backButton: {
    position: 'absolute',
    left: spacing.md,
    width: scale(36),
    height: scale(36),
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: scale(18),
    backgroundColor: colors.surface,
    zIndex: 4,
    elevation: 4,
  },
  favoriteButton: {
    position: 'absolute',
    right: spacing.md,
    zIndex: 4,
    elevation: 4,
  },
  contentCard: {
    marginTop: -18,
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
  storeNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  storeName: {
    ...typography.bodyBold,
    flex: 1,
  },
  storeRating: {
    ...typography.small,
    marginTop: 2,
  },
  closedWarning: {
    ...typography.small,
    color: colors.warning,
    marginTop: spacing.sm,
    marginLeft: spacing.xs,
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
  similarSection: {
    marginTop: spacing.lg,
  },
  similarTitle: {
    ...typography.bodyBold,
    marginBottom: spacing.sm,
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
    width: scale(36),
    height: scale(36),
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: scale(18),
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
  roleHintWrap: {
    flex: 1,
  },
  roleHint: {
    ...typography.small,
    color: colors.textSecondary,
    fontWeight: '700',
  },
  chatButton: {
    width: scale(36),
    height: scale(36),
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: scale(18),
    borderWidth: 1,
    borderColor: colors.secondary,
    marginLeft: spacing.sm,
  },
});
