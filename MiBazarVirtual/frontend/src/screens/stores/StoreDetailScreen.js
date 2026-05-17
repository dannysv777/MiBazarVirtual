import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import EmptyState from '../../components/common/EmptyState';
import FocusAwareStatusBar from '../../components/common/FocusAwareStatusBar';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import SkeletonLoader from '../../components/common/SkeletonLoader';
import ProductCard from '../../components/home/ProductCard';
import StoreStatusBadge from '../../components/stores/StoreStatusBadge';
import { getStore, getStoreProducts, getStoreReviews } from '../../api/storesApi';
import { colors, shadows, spacing, typography } from '../../theme';
import { formatDate } from '../../utils/formatters';
import { getErrorMessage, getList, getPayload } from '../../utils/apiResponse';

export default function StoreDetailScreen({ navigation, route }) {
  const { storeId, sellerPreview = false } = route.params;
  const [store, setStore] = useState(null);
  const [products, setProducts] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [activeTab, setActiveTab] = useState('products');
  const [loading, setLoading] = useState(true);
  const [tabLoading, setTabLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadStore = async () => {
      setLoading(true);
      setError('');

      try {
        const [storeResponse, productsResponse, reviewsResponse] = await Promise.all([
          getStore(storeId),
          getStoreProducts(storeId, { page: 0, size: 20 }),
          getStoreReviews(storeId, { page: 0, size: 10 }),
        ]);

        setStore(getPayload(storeResponse));
        setProducts(getList(productsResponse));
        setReviews(getList(reviewsResponse));
      } catch (storeError) {
        setError(getErrorMessage(storeError, 'No pudimos cargar la tienda.'));
      } finally {
        setLoading(false);
      }
    };

    loadStore();
  }, [storeId]);

  const handleTabChange = async (nextTab) => {
    setActiveTab(nextTab);
    setTabLoading(true);

    try {
      if (nextTab === 'products') {
        const response = await getStoreProducts(storeId, { page: 0, size: 20 });
        setProducts(getList(response));
      } else {
        const response = await getStoreReviews(storeId, { page: 0, size: 10 });
        setReviews(getList(response));
      }
    } catch (tabError) {
      setError(getErrorMessage(tabError, 'No pudimos cargar esta sección.'));
    } finally {
      setTabLoading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <FocusAwareStatusBar style="dark" backgroundColor="transparent" translucent />
        <View style={styles.header}>
          <SkeletonLoader width="70%" height={28} borderRadius={12} />
          <SkeletonLoader width="45%" height={18} borderRadius={12} />
        </View>
        <View style={styles.infoCard}>
          <SkeletonLoader width="30%" height={44} borderRadius={12} />
          <SkeletonLoader width="30%" height={44} borderRadius={12} />
          <SkeletonLoader width="30%" height={44} borderRadius={12} />
        </View>
        <LoadingSpinner size="small" />
      </SafeAreaView>
    );
  }

  if (error && !store) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <FocusAwareStatusBar style="dark" backgroundColor="transparent" translucent />
        <View style={styles.centerState}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity activeOpacity={0.8} onPress={() => navigation.goBack()} style={styles.backPill}>
            <Text style={styles.backPillText}>Volver</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const rating = Number(store.rating ?? store.averageRating ?? 0).toFixed(1);
  const reviewsCount = store.reviewsCount ?? store.reviewCount ?? reviews.length;

  return (
    <SafeAreaView style={styles.safeArea}>
      <FocusAwareStatusBar style="light" backgroundColor="transparent" translucent />
      <View style={styles.header}>
        <View style={styles.headerActions}>
          <TouchableOpacity activeOpacity={0.85} onPress={() => navigation.goBack()} style={styles.headerBackButton}>
            <Ionicons name="arrow-back" size={22} color={colors.surface} />
          </TouchableOpacity>
          {sellerPreview ? (
            <TouchableOpacity activeOpacity={0.85} onPress={() => navigation.navigate('SellerStore')} style={styles.headerEditButton}>
              <Ionicons name="pencil" size={18} color={colors.secondary} />
              <Text style={styles.headerEditText}>Editar</Text>
            </TouchableOpacity>
          ) : null}
        </View>
        <Text style={styles.headerName}>{store.name}</Text>
        <Text style={styles.headerCity}>{store.city ?? 'Guatemala'}</Text>
        <Text style={styles.headerRating}>⭐ {rating}</Text>
      </View>

      <View style={styles.infoCard}>
        <InfoStat label="Rating" value={`⭐ ${rating}`} />
        <InfoStat label="Reseñas" value={`📦 ${reviewsCount}`} />
        <View style={styles.scheduleInfo}>
          <StoreStatusBadge schedule={store.schedule ?? store.openingHours} />
          <Text style={styles.scheduleText} numberOfLines={2}>
            {store.schedule ?? store.openingHours ?? 'Horario no disponible'}
          </Text>
        </View>
      </View>

      <View style={styles.tabSelector}>
        <TabButton label="Productos" active={activeTab === 'products'} onPress={() => handleTabChange('products')} />
        <TabButton label="Reseñas" active={activeTab === 'reviews'} onPress={() => handleTabChange('reviews')} />
      </View>

      {error ? (
        <View style={styles.errorCard}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      {tabLoading ? (
        <LoadingSpinner size="small" />
      ) : activeTab === 'products' ? (
        <FlatList
          data={products}
          keyExtractor={(item) => item.id.toString()}
          numColumns={2}
          columnWrapperStyle={styles.columnWrapper}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <ProductCard product={item} onPress={() => navigation.navigate('ProductDetail', { productId: item.id })} />
          )}
          ListEmptyComponent={<EmptyState emoji="🍽️" title="Sin productos" subtitle="Esta tienda aún no tiene productos publicados." />}
        />
      ) : (
        <FlatList
          data={reviews}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.reviewsContent}
          renderItem={({ item }) => <ReviewItem review={item} />}
          ListEmptyComponent={<EmptyState emoji="⭐" title="Sin reseñas" subtitle="Aún no hay reseñas para esta tienda." />}
        />
      )}
    </SafeAreaView>
  );
}

function InfoStat({ label, value }) {
  return (
    <View style={styles.infoStat}>
      <Text style={styles.infoValue} numberOfLines={1}>{value}</Text>
      <Text style={styles.infoLabel}>{label}</Text>
    </View>
  );
}

function TabButton({ label, active, onPress }) {
  return (
    <TouchableOpacity activeOpacity={0.8} onPress={onPress} style={[styles.tabButton, active && styles.tabButtonActive]}>
      <Text style={[styles.tabText, active ? styles.tabTextActive : styles.tabTextIdle]}>{label}</Text>
    </TouchableOpacity>
  );
}

function ReviewItem({ review }) {
  const rating = Number(review.rating ?? 0);
  const username = review.buyerUsername ?? review.user?.username ?? 'Cliente';
  const initial = username.charAt(0).toUpperCase();

  return (
    <View style={styles.reviewCard}>
      <View style={styles.reviewHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initial}</Text>
        </View>
        <View style={styles.reviewInfo}>
          <Text style={styles.reviewUser}>{username}</Text>
          <Text style={styles.stars}>{renderStars(rating)}</Text>
        </View>
        <Text style={styles.reviewDate}>{formatDate(review.createdAt ?? review.date ?? new Date())}</Text>
      </View>
      {review.comment ? <Text style={styles.reviewComment}>{review.comment}</Text> : null}
    </View>
  );
}

function renderStars(rating) {
  return Array.from({ length: 5 }, (_, index) => (index < rating ? '★' : '☆')).join('');
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  header: {
    backgroundColor: colors.secondary,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  headerBackButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
  },
  headerEditButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    minHeight: 36,
    paddingHorizontal: spacing.md,
    borderRadius: 18,
    backgroundColor: colors.surface,
  },
  headerEditText: {
    ...typography.small,
    color: colors.secondary,
    fontWeight: '800',
  },
  headerName: {
    ...typography.h2,
    color: colors.surface,
  },
  headerCity: {
    ...typography.small,
    color: colors.surface,
    marginTop: spacing.xs,
  },
  headerRating: {
    ...typography.small,
    color: colors.surface,
    marginTop: spacing.xs,
  },
  infoCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    margin: spacing.md,
    marginTop: -spacing.lg,
    padding: spacing.md,
    borderRadius: 16,
    backgroundColor: colors.surface,
    ...shadows.card,
  },
  infoStat: {
    flex: 1,
    alignItems: 'center',
  },
  scheduleInfo: {
    flex: 1.35,
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: spacing.sm,
  },
  scheduleText: {
    ...typography.tiny,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  infoValue: {
    ...typography.bodyBold,
  },
  infoLabel: {
    ...typography.small,
    marginTop: spacing.xs,
  },
  tabSelector: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 2,
    borderBottomColor: colors.surface,
  },
  tabButtonActive: {
    borderBottomColor: colors.primary,
  },
  tabText: {
    ...typography.bodyBold,
  },
  tabTextActive: {
    color: colors.primary,
  },
  tabTextIdle: {
    color: colors.textSecondary,
  },
  errorCard: {
    margin: spacing.md,
    padding: spacing.md,
    borderRadius: 12,
    backgroundColor: '#FFE9E8',
  },
  errorText: {
    ...typography.small,
    color: colors.error,
    textAlign: 'center',
  },
  listContent: {
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
  },
  columnWrapper: {
    gap: 12,
    paddingHorizontal: spacing.md,
  },
  reviewsContent: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
  reviewCard: {
    padding: spacing.md,
    borderRadius: 16,
    backgroundColor: colors.surface,
    marginBottom: spacing.md,
    ...shadows.card,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 21,
    backgroundColor: colors.accent,
  },
  avatarText: {
    ...typography.bodyBold,
    color: colors.surface,
  },
  reviewInfo: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  reviewUser: {
    ...typography.bodyBold,
  },
  stars: {
    ...typography.small,
    color: colors.warning,
    marginTop: 2,
  },
  reviewDate: {
    ...typography.tiny,
  },
  reviewComment: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
  centerState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    padding: spacing.md,
  },
  backPill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  backPillText: {
    ...typography.small,
    color: colors.primary,
    fontWeight: '700',
  },
});
