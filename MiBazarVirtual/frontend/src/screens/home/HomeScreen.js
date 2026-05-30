import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import * as ordersApi from '../../api/ordersApi';
import AppImage from '../../components/common/AppImage';
import EmptyState from '../../components/common/EmptyState';
import FocusAwareStatusBar from '../../components/common/FocusAwareStatusBar';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import SkeletonLoader from '../../components/common/SkeletonLoader';
import CategoryChip from '../../components/home/CategoryChip';
import ProductCard from '../../components/home/ProductCard';
import SearchBar from '../../components/home/SearchBar';
import StoreCard from '../../components/home/StoreCard';
import { getCategories } from '../../api/categoriesApi';
import { getProducts } from '../../api/productsApi';
import * as recommendationsApi from '../../api/recommendationsApi';
import { getStores } from '../../api/storesApi';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useNotifications } from '../../context/NotificationContext';
import { useToast } from '../../context/ToastContext';
import { colors, spacing, typography } from '../../theme';
import { formatPrice } from '../../utils/formatters';
import { getFirstName, getGreeting } from '../../utils/greeting';
import { analyzeOrderHistory } from '../../utils/recommendations';
import { getErrorMessage, getList, getPageMeta } from '../../utils/apiResponse';
import { scale } from '../../utils/responsive';
import { isStoreOpen } from '../../utils/storeSchedule';

const allCategory = { id: 0, name: 'Todos', icon: '✨' };
const LAST_SEEN_STORES_KEY = 'mibazarvirtual:last_seen_stores';
const HOME_REFRESH_INTERVAL = 5 * 60 * 1000;
const DISCOVERY_PAGE_SIZE = 10;

export default function HomeScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { user, isAuthenticated } = useAuth();
  const { addItem } = useCart();
  const { unreadCount } = useNotifications();
  const { showSuccess } = useToast();
  const [greeting, setGreeting] = useState(getGreeting());
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [trendingProducts, setTrendingProducts] = useState([]);
  const [randomProducts, setRandomProducts] = useState([]);
  const [randomPage, setRandomPage] = useState(0);
  const [randomHasMore, setRandomHasMore] = useState(true);
  const [randomLoadingMore, setRandomLoadingMore] = useState(false);
  const [stores, setStores] = useState([]);
  const [frequentItems, setFrequentItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [compactStatusBar, setCompactStatusBar] = useState(false);
  const [sessionSeed] = useState(() => Math.random());
  const scrollY = useRef(new Animated.Value(0)).current;
  const lastFetchTimeRef = useRef(0);
  const randomLoadingMoreRef = useRef(false);

  const isBuyer = user?.role === 'BUYER';
  const firstName = getFirstName(user?.fullName) || user?.username || 'Invitado';

  const loadHomeData = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError('');

    try {
      const storedLastSeen = await AsyncStorage.getItem(LAST_SEEN_STORES_KEY);
      const excludeStoreIds = storedLastSeen ? JSON.parse(storedLastSeen) : [];
      const userId = isAuthenticated ? user?.id : null;

      const featuredRequest = isBuyer && isAuthenticated
        ? recommendationsApi.getForYou(10)
        : recommendationsApi.getFeed(userId, 10, { seed: sessionSeed, excludeStoreIds });

      const [categoriesResponse, productsResponse, storesResponse, trendingResponse, randomResponse, ordersResult] = await Promise.allSettled([
        getCategories(),
        featuredRequest,
        recommendationsApi.getRecommendedStores(userId, 6, { seed: sessionSeed }),
        recommendationsApi.getTrending(null, 8),
        getProducts({ page: 0, size: DISCOVERY_PAGE_SIZE, sortBy: 'newest' }),
        isBuyer && isAuthenticated ? ordersApi.getOrderHistory() : Promise.resolve(null),
      ]);

      if (categoriesResponse.status === 'fulfilled') {
        setCategories([allCategory, ...getList(categoriesResponse.value)]);
      }

      let nextProducts = productsResponse.status === 'fulfilled' ? getList(productsResponse.value) : [];
      if (!nextProducts.length) {
        try {
          const fallbackProductsResponse = await getProducts({ page: 0, size: 10, sortBy: 'newest' });
          nextProducts = getList(fallbackProductsResponse);
        } catch (fallbackError) {
          nextProducts = [];
        }
      }

      if (nextProducts.length) {
        setProducts(nextProducts);
        await AsyncStorage.setItem(
          LAST_SEEN_STORES_KEY,
          JSON.stringify([...new Set(nextProducts.map((product) => product.storeId).filter(Boolean))])
        );
      } else {
        setProducts([]);
      }

      let nextStores = storesResponse.status === 'fulfilled' ? getList(storesResponse.value) : [];
      if (!nextStores.length) {
        try {
          const fallbackStoresResponse = await getStores({ page: 0, size: 6 });
          nextStores = getList(fallbackStoresResponse);
        } catch (fallbackError) {
          nextStores = [];
        }
      }
      setStores([...nextStores].sort((a, b) => {
        const aOpen = isStoreOpen(a.schedule ?? a.openingHours).isOpen ? 1 : 0;
        const bOpen = isStoreOpen(b.schedule ?? b.openingHours).isOpen ? 1 : 0;
        return bOpen - aOpen;
      }));

      let nextTrendingProducts = trendingResponse.status === 'fulfilled' ? getList(trendingResponse.value) : [];
      if (!nextTrendingProducts.length) {
        nextTrendingProducts = nextProducts.slice(0, 8);
      }
      setTrendingProducts(nextTrendingProducts);

      let nextRandomProducts = randomResponse.status === 'fulfilled' ? getList(randomResponse.value) : [];
      let nextRandomMeta = randomResponse.status === 'fulfilled' ? getPageMeta(randomResponse.value) : { last: true };
      if (!nextRandomProducts.length) {
        try {
          const fallbackRandomResponse = await getProducts({ page: 0, size: DISCOVERY_PAGE_SIZE, sortBy: 'newest' });
          nextRandomProducts = getList(fallbackRandomResponse);
          nextRandomMeta = getPageMeta(fallbackRandomResponse);
        } catch (fallbackError) {
          nextRandomProducts = [];
          nextRandomMeta = { last: true };
        }
      }
      setRandomProducts(nextRandomProducts);
      setRandomPage(0);
      setRandomHasMore(!nextRandomMeta.last && nextRandomProducts.length > 0);

      if (ordersResult.status === 'fulfilled' && ordersResult.value) {
        const orders = getList(ordersResult.value);
        const frequent = analyzeOrderHistory(orders);
        setFrequentItems(frequent);
      } else {
        setFrequentItems([]);
      }

      if (
        categoriesResponse.status === 'rejected'
        && productsResponse.status === 'rejected'
        && storesResponse.status === 'rejected'
        && trendingResponse.status === 'rejected'
        && randomResponse.status === 'rejected'
      ) {
        throw productsResponse.reason;
      }

      lastFetchTimeRef.current = Date.now();
    } catch (homeError) {
      setError(getErrorMessage(homeError, 'No pudimos cargar el inicio.'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isAuthenticated, isBuyer, sessionSeed, user?.id]);

  const loadMoreRandomProducts = useCallback(async () => {
    if (loading || refreshing || randomLoadingMoreRef.current || randomLoadingMore || !randomHasMore) {
      return;
    }

    randomLoadingMoreRef.current = true;
    setRandomLoadingMore(true);
    try {
      const nextPage = randomPage + 1;
      const response = await getProducts({
        page: nextPage,
        size: DISCOVERY_PAGE_SIZE,
        sortBy: 'newest',
      });
      const nextProducts = getList(response);
      const meta = getPageMeta(response);

      setRandomProducts((current) => {
        const seen = new Set(current.map((product) => product.id));
        return [
          ...current,
          ...nextProducts.filter((product) => !seen.has(product.id)),
        ];
      });
      setRandomPage(nextPage);
      setRandomHasMore(!meta.last && nextProducts.length > 0);
    } catch (moreError) {
      setRandomHasMore(false);
    } finally {
      randomLoadingMoreRef.current = false;
      setRandomLoadingMore(false);
    }
  }, [loading, randomHasMore, randomLoadingMore, randomPage, refreshing]);

  useFocusEffect(useCallback(() => {
    setGreeting(getGreeting());
    if (lastFetchTimeRef.current && Date.now() - lastFetchTimeRef.current > HOME_REFRESH_INTERVAL) {
      loadHomeData(true);
    }
  }, [loadHomeData]));

  useEffect(() => {
    loadHomeData();
  }, [loadHomeData]);

  const goToProducts = (params = {}) => {
    navigation.navigate('ProductList', params);
  };

  const addFrequentItems = () => {
    frequentItems.forEach((item) => addItem({
      id: item.productId,
      name: item.name,
      imageUrl: item.imageUrl,
      price: item.price,
      unit: item.unit,
      store: { id: item.storeId, name: item.storeName },
    }, Number(item.defaultQuantity ?? 1), { silent: true }));
    showSuccess(`${frequentItems.length} productos agregados al carrito`);
  };

  const refreshControl = useMemo(() => (
    <RefreshControl
      tintColor={colors.primary}
      colors={[colors.primary]}
      refreshing={refreshing}
      onRefresh={() => loadHomeData(true)}
    />
  ), [loadHomeData, refreshing]);

  const compactHeaderOpacity = scrollY.interpolate({
    inputRange: [30, 95],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const headerContentOpacity = scrollY.interpolate({
    inputRange: [0, 52, 96],
    outputRange: [1, 0.25, 0],
    extrapolate: 'clamp',
  });

  const handleHomeScroll = useCallback((event) => {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    const nextCompact = contentOffset.y > 72;
    setCompactStatusBar((current) => (current === nextCompact ? current : nextCompact));

    if (!contentSize.height) {
      return;
    }

    const scrollProgress = (contentOffset.y + layoutMeasurement.height) / contentSize.height;
    if (scrollProgress >= 0.7) {
      loadMoreRandomProducts();
    }
  }, [loadMoreRandomProducts]);

  return (
    <SafeAreaView edges={['left', 'right']} style={styles.safeArea}>
      <FocusAwareStatusBar style={compactStatusBar ? 'light' : 'dark'} backgroundColor="transparent" translucent />
      <Animated.ScrollView
        refreshControl={refreshControl}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          {
            useNativeDriver: true,
            listener: handleHomeScroll,
          }
        )}
      >
        <Animated.View style={[styles.header, { paddingTop: insets.top + spacing.md, opacity: headerContentOpacity }]}>
          <View>
            <Text style={styles.greeting}>{greeting.text} {greeting.emoji}</Text>
            <Text style={styles.userName}>{firstName}</Text>
          </View>
          <TouchableOpacity activeOpacity={0.8} style={styles.bellButton} onPress={() => navigation.navigate('Notifications')}>
            <Ionicons name="notifications-outline" size={26} color={colors.textPrimary} />
            {unreadCount > 0 ? (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadBadgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
              </View>
            ) : null}
          </TouchableOpacity>
        </Animated.View>

        <View style={styles.searchWrap}>
          <SearchBar editable={false} onPress={() => goToProducts()} />
        </View>

        <LinearGradient colors={[colors.secondary, colors.primary]} style={styles.banner}>
          <Text style={styles.bannerTitle}>🥦 Productos frescos</Text>
          <Text style={styles.bannerSubtitle}>Directo del mercado a tu puerta</Text>
        </LinearGradient>

        {error ? (
          <View style={styles.errorCard}>
            <Ionicons name="alert-circle" size={20} color={colors.error} />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity activeOpacity={0.75} onPress={() => loadHomeData()}>
              <Text style={styles.retryText}>Reintentar</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        <SectionHeader title="Categorías" actionLabel="Ver todas" onAction={() => goToProducts({ title: 'Categorías' })} />
        {loading ? (
          <SkeletonRow height={38} />
        ) : (
          <FlatList
            data={categories}
            horizontal
            keyExtractor={(item) => item.id.toString()}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalList}
            renderItem={({ item }) => (
              <CategoryChip
                category={item}
                onPress={() => goToProducts(item.id === 0 ? {} : { categoryId: item.id, title: item.name })}
              />
            )}
          />
        )}

        {trendingProducts.length >= 3 ? (
          <>
            <SectionHeader title="Tendencias esta semana" />
            <FlatList
              data={trendingProducts}
              horizontal
              keyExtractor={(item) => item.id.toString()}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalList}
              renderItem={({ item }) => (
                <ProductCard product={item} onPress={() => navigation.navigate('ProductDetail', { productId: item.id })} />
              )}
            />
          </>
        ) : null}

        {isBuyer ? (
          <WeeklySection
            loading={loading}
            frequentItems={frequentItems}
            onAddAll={addFrequentItems}
            onOpen={() => navigation.navigate('WeeklyPurchase')}
            onBrowse={() => goToProducts()}
          />
        ) : null}

        <SectionHeader title={isBuyer && isAuthenticated ? 'Recomendado para ti' : 'Destacados hoy'} subtitle="Rotacion justa entre tiendas y categorias" />
        {loading ? (
          <CardSkeletonRow />
        ) : products.length ? (
          <FlatList
            data={products}
            horizontal
            keyExtractor={(item) => item.id.toString()}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalList}
            renderItem={({ item }) => (
              <ProductCard product={item} onPress={() => navigation.navigate('ProductDetail', { productId: item.id })} />
            )}
          />
        ) : (
          <EmptyState emoji="🍽️" title="Sin productos" subtitle="Aún no hay productos destacados." />
        )}

        <SectionHeader title="Tiendas para ti" />
        {loading ? (
          <StoreSkeletonRow />
        ) : stores.length ? (
          <FlatList
            data={stores}
            horizontal
            keyExtractor={(item) => item.id.toString()}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalList}
            renderItem={({ item }) => (
              <StoreCard store={item} onPress={() => navigation.navigate('StoreDetail', { storeId: item.id })} />
            )}
          />
        ) : (
          <EmptyState emoji="🏪" title="Sin tiendas" subtitle="Pronto verás tiendas disponibles." />
        )}

        <SectionHeader title="Mas productos para descubrir" subtitle="Una mezcla fresca para seguir explorando" />
        {loading ? (
          <CardSkeletonRow />
        ) : randomProducts.length ? (
          <>
            <View style={styles.discoveryGrid}>
              {randomProducts.map((item) => (
                <ProductCard
                  key={item.id.toString()}
                  product={item}
                  onPress={() => navigation.navigate('ProductDetail', { productId: item.id })}
                />
              ))}
            </View>
            {randomLoadingMore ? (
              <View style={styles.discoveryLoadingMore}>
                <LoadingSpinner size="small" />
              </View>
            ) : null}
          </>
        ) : null}
      </Animated.ScrollView>

      <Animated.View
        pointerEvents="box-none"
        style={[
          styles.compactHeader,
          {
            height: insets.top + 38,
            opacity: compactHeaderOpacity,
          },
        ]}
      >
        <LinearGradient
          pointerEvents="none"
          colors={['rgba(27,67,50,0.92)', 'rgba(27,67,50,0.5)', 'rgba(27,67,50,0)']}
          locations={[0, 0.5, 1]}
          style={styles.compactHeaderGradient}
        />
      </Animated.View>
    </SafeAreaView>
  );
}

function SectionHeader({ title, subtitle, actionLabel, onAction }) {
  return (
    <View style={styles.sectionHeader}>
      <View>
        <Text style={styles.sectionTitle}>{title}</Text>
        {subtitle ? <Text style={styles.sectionSubtitle}>{subtitle}</Text> : null}
      </View>
      {actionLabel ? (
        <TouchableOpacity onPress={onAction} activeOpacity={0.7}>
          <Text style={styles.sectionAction}>{actionLabel}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

function WeeklySection({ loading, frequentItems, onAddAll, onOpen, onBrowse }) {
  if (loading) {
    return (
      <>
        <SectionHeader title="Tu compra semanal" />
        <SkeletonRow height={80} />
      </>
    );
  }

  if (!frequentItems.length) {
    return (
      <>
        <SectionHeader title="Tu compra semanal" />
        <View style={styles.weeklyEmptyCard}>
          <Text style={styles.weeklyEmoji}>🛒</Text>
          <View style={styles.weeklyEmptyText}>
            <Text style={styles.weeklyEmptyTitle}>Aún no tienes compras frecuentes</Text>
            <Text style={styles.weeklyEmptySubtitle}>Haz tu primer pedido y te recomendaremos automáticamente.</Text>
          </View>
          <TouchableOpacity activeOpacity={0.8} onPress={onBrowse} style={styles.weeklySmallButton}>
            <Text style={styles.weeklySmallButtonText}>Ver productos</Text>
          </TouchableOpacity>
        </View>
      </>
    );
  }

  return (
    <>
      <SectionHeader title="Tu compra semanal" />
      <FlatList
        data={frequentItems}
        horizontal
        keyExtractor={(item) => item.productId.toString()}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.horizontalList}
        renderItem={({ item }) => (
          <View style={styles.frequentCard}>
            <AppImage uri={item.imageUrl} style={styles.frequentImage} fallbackEmoji="🛒" />
            <Text style={styles.frequentName} numberOfLines={2}>{item.name}</Text>
            <Text style={styles.frequentPrice}>{formatPrice(item.price)}</Text>
          </View>
        )}
      />
      <View style={styles.weeklyFooter}>
        <TouchableOpacity activeOpacity={0.75} onPress={onOpen}>
          <Text style={styles.weeklyLink}>Ver lista completa →</Text>
        </TouchableOpacity>
        <TouchableOpacity activeOpacity={0.8} onPress={onAddAll} style={styles.weeklySmallButton}>
          <Text style={styles.weeklySmallButtonText}>Agregar todo</Text>
        </TouchableOpacity>
      </View>
    </>
  );
}

function SkeletonRow({ height }) {
  return (
    <View style={styles.skeletonRow}>
      <SkeletonLoader width={94} height={height} borderRadius={20} />
      <SkeletonLoader width={110} height={height} borderRadius={20} />
      <SkeletonLoader width={82} height={height} borderRadius={20} />
    </View>
  );
}

function CardSkeletonRow() {
  return (
    <View style={styles.skeletonRow}>
      <SkeletonLoader width={scale(160)} height={scale(200)} borderRadius={16} />
      <SkeletonLoader width={scale(160)} height={scale(200)} borderRadius={16} />
      <SkeletonLoader width={scale(160)} height={scale(200)} borderRadius={16} />
    </View>
  );
}

function StoreSkeletonRow() {
  return (
    <View style={styles.skeletonRow}>
      <SkeletonLoader width={scale(160)} height={scale(180)} borderRadius={16} />
      <SkeletonLoader width={scale(160)} height={scale(180)} borderRadius={16} />
      <SkeletonLoader width={scale(160)} height={scale(180)} borderRadius={16} />
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  content: {
    paddingBottom: 72,
  },
  compactHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 86,
  },
  compactHeaderGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
  },
  greeting: {
    ...typography.small,
  },
  userName: {
    ...typography.h3,
    marginTop: 2,
  },
  bellButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
    backgroundColor: colors.background,
  },
  unreadBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 9,
    backgroundColor: colors.error,
    paddingHorizontal: 3,
  },
  unreadBadgeText: {
    ...typography.tiny,
    color: colors.surface,
    fontWeight: '700',
  },
  searchWrap: {
    paddingHorizontal: spacing.md,
    marginTop: spacing.md,
  },
  banner: {
    height: scale(130),
    justifyContent: 'center',
    borderRadius: scale(16),
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    padding: spacing.md,
  },
  bannerTitle: {
    ...typography.h3,
    color: colors.surface,
  },
  bannerSubtitle: {
    ...typography.small,
    color: colors.surface,
    marginTop: spacing.xs,
  },
  errorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
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
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    ...typography.bodyBold,
  },
  sectionSubtitle: {
    ...typography.small,
    marginTop: 2,
  },
  sectionAction: {
    ...typography.small,
    color: colors.primary,
    fontWeight: '700',
  },
  horizontalList: {
    paddingHorizontal: spacing.md,
  },
  discoveryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
  },
  discoveryLoadingMore: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  skeletonRow: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
  },
  weeklyEmptyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.md,
    padding: spacing.md,
    borderRadius: scale(12),
    backgroundColor: colors.background,
  },
  weeklyEmoji: {
    fontSize: 30,
  },
  weeklyEmptyText: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  weeklyEmptyTitle: {
    ...typography.bodyBold,
  },
  weeklyEmptySubtitle: {
    ...typography.tiny,
    marginTop: 2,
  },
  weeklySmallButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: scale(18),
    backgroundColor: colors.primary,
  },
  weeklySmallButtonText: {
    ...typography.tiny,
    color: colors.surface,
    fontWeight: '700',
  },
  frequentCard: {
    width: scale(110),
    marginRight: spacing.sm,
    padding: spacing.sm,
    borderRadius: scale(12),
    backgroundColor: colors.background,
  },
  frequentImage: {
    width: '100%',
    height: scale(70),
    borderRadius: scale(12),
    marginBottom: spacing.xs,
  },
  frequentName: {
    ...typography.tiny,
    color: colors.textPrimary,
    fontWeight: '700',
  },
  frequentPrice: {
    ...typography.tiny,
    color: colors.primary,
    marginTop: spacing.xs,
  },
  weeklyFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    marginTop: spacing.sm,
  },
  weeklyLink: {
    ...typography.small,
    color: colors.primary,
    fontWeight: '700',
  },
});
