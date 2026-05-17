import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import AppImage from '../common/AppImage';
import FavoriteButton from '../common/FavoriteButton';
import { colors, shadows, spacing, typography } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { formatPrice } from '../../utils/formatters';
import { scale, wp } from '../../utils/responsive';

const cardWidth = (wp(100) - scale(48)) / 2;

const getProductImage = (product) => (
  product.imageUrl ?? product.mainImageUrl ?? product.coverImage ?? product.images?.find((image) => image?.url)?.url ?? null
);

const getStoreName = (product) => (
  product.store?.name ?? product.storeName ?? 'MiBazarVirtual'
);

export default function ProductCard({
  product,
  onPress,
  showFavorite = false,
  isFavorite = false,
  onFavoriteChange,
}) {
  const imageUrl = getProductImage(product);
  const { user } = useAuth();
  const { addItem } = useCart();
  const outOfStock = product?.isOutOfStock || Number(product?.stock ?? 0) <= 0 || product?.status === 'OUT_OF_STOCK';
  const canBuy = user?.role === 'BUYER' && !outOfStock;

  const handleAddPress = () => {
    addItem(product, 1);
  };

  return (
    <TouchableOpacity activeOpacity={0.88} onPress={onPress} style={[styles.card, outOfStock && styles.cardOutOfStock]}>
      <View style={styles.imageWrap}>
        <AppImage uri={imageUrl} style={styles.image} fallbackEmoji="🛒" />
        {showFavorite ? (
          <FavoriteButton
            productId={product.id}
            initialIsFavorite={isFavorite}
            size={18}
            style={styles.favoriteButton}
            onChange={onFavoriteChange}
          />
        ) : null}
        {outOfStock ? (
          <>
            <View style={styles.outOfStockBadge}>
              <Text style={styles.outOfStockBadgeText}>Agotado</Text>
            </View>
            <View style={styles.outOfStockOverlay} />
          </>
        ) : null}
      </View>
      <View style={styles.content}>
        <Text style={styles.storeName} numberOfLines={1}>{getStoreName(product)}</Text>
        <Text style={styles.productName} numberOfLines={2}>{product.name}</Text>
        <View style={styles.footer}>
          <View style={styles.priceRow}>
            <Text style={styles.price}>{formatPrice(product.price)}</Text>
            <Text style={styles.unit}>/{product.unit ?? 'u'}</Text>
          </View>
          {user?.role === 'BUYER' ? (
            <TouchableOpacity
              activeOpacity={0.8}
              disabled={!canBuy}
              onPress={handleAddPress}
              style={[styles.addButton, !canBuy && styles.addButtonDisabled]}
            >
              <Ionicons name="add" size={scale(20)} color={colors.surface} />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: cardWidth,
    backgroundColor: colors.surface,
    borderRadius: scale(16),
    overflow: 'hidden',
    marginBottom: spacing.md,
    ...shadows.card,
  },
  cardOutOfStock: {
    opacity: 0.78,
  },
  imageWrap: {
    position: 'relative',
  },
  image: {
    width: '100%',
    height: scale(140),
  },
  favoriteButton: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    zIndex: 3,
  },
  outOfStockBadge: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.sm,
    zIndex: 3,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: colors.error,
  },
  outOfStockBadgeText: {
    ...typography.tiny,
    color: colors.surface,
    fontWeight: '800',
  },
  outOfStockOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.48)',
  },
  content: {
    padding: scale(10),
  },
  storeName: {
    ...typography.tiny,
  },
  productName: {
    ...typography.bodyBold,
    marginTop: 2,
    minHeight: scale(40),
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  priceRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  price: {
    ...typography.price,
  },
  unit: {
    ...typography.small,
    marginLeft: 2,
  },
  addButton: {
    width: scale(28),
    height: scale(28),
    borderRadius: scale(14),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
  },
  addButtonDisabled: {
    backgroundColor: colors.textLight,
  },
});
