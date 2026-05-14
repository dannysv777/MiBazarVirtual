import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { colors, shadows, spacing, typography } from '../../theme';

const cardWidth = (Dimensions.get('window').width - 48) / 2;

const getProductImage = (product) => (
  product.imageUrl ?? product.mainImageUrl ?? product.images?.[0]?.url ?? null
);

const getStoreName = (product) => (
  product.store?.name ?? product.storeName ?? 'MiBazarVirtual'
);

const formatPrice = (price) => `Q ${Number(price ?? 0).toFixed(2)}`;

export default function ProductCard({ product, onPress }) {
  const imageUrl = getProductImage(product);

  const handleAddPress = () => {
    // TODO Part 2: const { addItem } = useCart(); addItem(product, 1);
  };

  return (
    <TouchableOpacity activeOpacity={0.88} onPress={onPress} style={styles.card}>
      {imageUrl ? (
        <Image source={{ uri: imageUrl }} style={styles.image} contentFit="cover" />
      ) : (
        <View style={styles.fallbackImage}>
          <Text style={styles.fallbackEmoji}>🍽️</Text>
        </View>
      )}
      <View style={styles.content}>
        <Text style={styles.storeName} numberOfLines={1}>{getStoreName(product)}</Text>
        <Text style={styles.productName} numberOfLines={2}>{product.name}</Text>
        <View style={styles.footer}>
          <View style={styles.priceRow}>
            <Text style={styles.price}>{formatPrice(product.price)}</Text>
            <Text style={styles.unit}>/{product.unit ?? 'u'}</Text>
          </View>
          <TouchableOpacity activeOpacity={0.8} onPress={handleAddPress} style={styles.addButton}>
            <Ionicons name="add" size={20} color={colors.surface} />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: cardWidth,
    backgroundColor: colors.surface,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: spacing.md,
    ...shadows.card,
  },
  image: {
    width: '100%',
    height: 140,
  },
  fallbackImage: {
    height: 140,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  fallbackEmoji: {
    fontSize: 38,
  },
  content: {
    padding: 10,
  },
  storeName: {
    ...typography.tiny,
  },
  productName: {
    ...typography.bodyBold,
    marginTop: 2,
    minHeight: 40,
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
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
  },
});
