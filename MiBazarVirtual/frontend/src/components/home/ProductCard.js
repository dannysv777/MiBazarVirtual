import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import AppImage from '../common/AppImage';
import { colors, shadows, spacing, typography } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { formatPrice } from '../../utils/formatters';
import { scale, wp } from '../../utils/responsive';

const cardWidth = (wp(100) - scale(48)) / 2;

const getProductImage = (product) => (
  product.imageUrl ?? product.mainImageUrl ?? product.images?.find((image) => image?.url)?.url ?? null
);

const getStoreName = (product) => (
  product.store?.name ?? product.storeName ?? 'MiBazarVirtual'
);

export default function ProductCard({ product, onPress }) {
  const imageUrl = getProductImage(product);
  const { user } = useAuth();
  const { addItem } = useCart();
  const canBuy = user?.role === 'BUYER';

  const handleAddPress = () => {
    addItem(product, 1);
  };

  return (
    <TouchableOpacity activeOpacity={0.88} onPress={onPress} style={styles.card}>
      <AppImage uri={imageUrl} style={styles.image} fallbackEmoji="🛒" />
      <View style={styles.content}>
        <Text style={styles.storeName} numberOfLines={1}>{getStoreName(product)}</Text>
        <Text style={styles.productName} numberOfLines={2}>{product.name}</Text>
        <View style={styles.footer}>
          <View style={styles.priceRow}>
            <Text style={styles.price}>{formatPrice(product.price)}</Text>
            <Text style={styles.unit}>/{product.unit ?? 'u'}</Text>
          </View>
          {canBuy ? (
            <TouchableOpacity activeOpacity={0.8} onPress={handleAddPress} style={styles.addButton}>
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
  image: {
    width: '100%',
    height: scale(140),
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
});
